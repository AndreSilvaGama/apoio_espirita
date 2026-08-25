# Kanban de Eventos — Design Spec

**Data:** 2026-05-24
**Status:** Aprovado

---

## Visão Geral

Nova página `/kanban` com controle de eventos no modelo Kanban. Independente da agenda existente (`/agenda`). Permite que membros da casa espírita criem e movam eventos entre quatro estágios de progresso.

---

## Banco de Dados

### Nova tabela: `kanban_eventos`

```sql
CREATE TABLE kanban_eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sigla_casa text NOT NULL,
  titulo text NOT NULL,
  descricao text,
  data date,
  responsavel text,
  status text NOT NULL DEFAULT 'ideia'
    CHECK (status IN ('ideia','planejando','confirmado','realizado')),
  criador_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  criador_nome text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE kanban_eventos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "membros leem eventos da casa"
  ON kanban_eventos FOR SELECT
  USING (sigla_casa = (SELECT sigla_casa FROM profiles WHERE id = auth.uid()));

CREATE POLICY "membros criam eventos"
  ON kanban_eventos FOR INSERT
  WITH CHECK (sigla_casa = (SELECT sigla_casa FROM profiles WHERE id = auth.uid()));

CREATE POLICY "qualquer membro atualiza"
  ON kanban_eventos FOR UPDATE
  USING (sigla_casa = (SELECT sigla_casa FROM profiles WHERE id = auth.uid()));

CREATE POLICY "somente criador exclui"
  ON kanban_eventos FOR DELETE
  USING (criador_id = auth.uid());
```

**Nenhuma relação com `agenda_eventos`.** Tabela própria e independente.

---

## Arquitetura

### Rota

- **Arquivo:** `src/routes/kanban.tsx`
- **Path:** `/kanban`
- **Auth:** requer usuário autenticado com perfil completo (mesmo guard da agenda)

### Estrutura de componentes

```
KanbanPage
├── Header
│   ├── Título "Eventos — Casa {sigla}"
│   └── Botão "Novo Card" (abre FormSlide)
├── FormSlide (painel lateral direito)
│   ├── Input: Título *
│   ├── Input: Data (date)
│   ├── Input: Responsável (texto livre)
│   ├── Textarea: Descrição
│   └── Botão Criar / Salvar
└── Board (DndContext)
    └── KanbanColumn × 4  (useDroppable por status)
        └── KanbanCard × N  (useDraggable por id)
```

### Dependência nova

```
@dnd-kit/core
@dnd-kit/utilities
```

---

## Lógica de Drag-and-Drop

- `DndContext` com `onDragEnd` envolve o Board inteiro
- Cada `KanbanCard` usa `useDraggable({ id: evento.id })`
- Cada `KanbanColumn` usa `useDroppable({ id: status })`
- `onDragEnd`:
  1. Identifica `overId` (status da coluna de destino)
  2. Se `overId` diferente do status atual: atualiza state local imediatamente (otimista)
  3. Faz `UPDATE` no Supabase
  4. Se erro: reverte o state local

---

## UI

### Colunas e cores

| Status       | Label      | Cor de destaque                 |
| ------------ | ---------- | ------------------------------- |
| `ideia`      | Ideia      | cinza (`text-muted-foreground`) |
| `planejando` | Planejando | âmbar (`text-amber-600`)        |
| `confirmado` | Confirmado | ciano (`text-cyan-glow`)        |
| `realizado`  | Realizado  | esmeralda (`text-emerald-600`)  |

### Card

- Título em destaque
- Data formatada (dd/mm/aaaa) + ícone Calendar
- Responsável + ícone User
- Descrição truncada em 2 linhas (`line-clamp-2`)
- Ações editar/excluir visíveis somente para o criador

### Layout

- Tema claro: `page-light min-h-screen px-4 pt-20 pb-20`
- Board: `flex gap-4 overflow-x-auto pb-4`
- Coluna: `min-w-[260px] flex-shrink-0`
- Mobile: scroll horizontal no board

### FormSlide

- Painel deslizante da direita (`fixed inset-y-0 right-0 w-full max-w-sm`)
- Overlay escuro atrás
- Abre ao clicar "Novo Card" ou ícone de edição no card
- Fecha ao salvar ou clicar fora

---

## Permissões

| Ação                  | Quem pode                   |
| --------------------- | --------------------------- |
| Ver cards da casa     | Qualquer membro autenticado |
| Criar card            | Qualquer membro             |
| Mover card (status)   | Qualquer membro             |
| Editar campos do card | Somente o criador           |
| Excluir card          | Somente o criador           |

> Nota: permissões temporárias — todos os membros podem criar e mover. Revisar quando o sistema de permissões evoluir.

---

## Navegação

- Adicionar item "Eventos" (`/kanban`) ao menu desktop e mobile
- Ícone: `KanbanSquare` (Lucide)

---

## Fora do Escopo

- Comentários em cards
- Histórico de movimentações
- Filtros por responsável ou data
- Notificações ao mover card
- Conexão com `agenda_eventos`
