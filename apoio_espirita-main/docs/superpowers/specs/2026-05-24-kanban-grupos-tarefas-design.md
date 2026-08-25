# Kanban — Grupos de Trabalho e Tarefas — Design Spec

**Data:** 2026-05-24
**Status:** Aprovado

---

## Visão Geral

Extensão do Kanban de Eventos existente (`/kanban`). Cada card de evento pode ser expandido inline para revelar seus grupos de trabalho e as tarefas de cada grupo. Nenhuma nova rota — tudo em `src/routes/kanban.tsx`.

---

## Banco de Dados

### Nova tabela: `kanban_grupos`

```sql
CREATE TABLE kanban_grupos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id uuid NOT NULL REFERENCES kanban_eventos(id) ON DELETE CASCADE,
  sigla_casa text NOT NULL,
  nome text NOT NULL,
  responsavel text,
  membros text[] DEFAULT '{}',
  ordem int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE kanban_grupos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "membros leem grupos da casa"
  ON kanban_grupos FOR SELECT
  USING (sigla_casa = (SELECT sigla_casa FROM profiles WHERE id = auth.uid()));

CREATE POLICY "membros criam grupos"
  ON kanban_grupos FOR INSERT
  WITH CHECK (sigla_casa = (SELECT sigla_casa FROM profiles WHERE id = auth.uid()));

CREATE POLICY "qualquer membro atualiza grupos"
  ON kanban_grupos FOR UPDATE
  USING (sigla_casa = (SELECT sigla_casa FROM profiles WHERE id = auth.uid()));

CREATE POLICY "qualquer membro exclui grupos"
  ON kanban_grupos FOR DELETE
  USING (sigla_casa = (SELECT sigla_casa FROM profiles WHERE id = auth.uid()));
```

### Nova tabela: `kanban_tarefas`

```sql
CREATE TABLE kanban_tarefas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo_id uuid NOT NULL REFERENCES kanban_grupos(id) ON DELETE CASCADE,
  sigla_casa text NOT NULL,
  titulo text NOT NULL,
  feito boolean NOT NULL DEFAULT false,
  responsavel text,
  prazo date,
  ordem int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE kanban_tarefas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "membros leem tarefas da casa"
  ON kanban_tarefas FOR SELECT
  USING (sigla_casa = (SELECT sigla_casa FROM profiles WHERE id = auth.uid()));

CREATE POLICY "membros criam tarefas"
  ON kanban_tarefas FOR INSERT
  WITH CHECK (sigla_casa = (SELECT sigla_casa FROM profiles WHERE id = auth.uid()));

CREATE POLICY "qualquer membro atualiza tarefas"
  ON kanban_tarefas FOR UPDATE
  USING (sigla_casa = (SELECT sigla_casa FROM profiles WHERE id = auth.uid()));

CREATE POLICY "qualquer membro exclui tarefas"
  ON kanban_tarefas FOR DELETE
  USING (sigla_casa = (SELECT sigla_casa FROM profiles WHERE id = auth.uid()));
```

---

## Arquitetura

### Arquivo modificado

`src/routes/kanban.tsx` — único arquivo. Sem novas rotas, sem novos arquivos.

### Novos tipos

```ts
interface KanbanGrupo {
  id: string;
  evento_id: string;
  sigla_casa: string;
  nome: string;
  responsavel: string | null;
  membros: string[];
  ordem: number;
  created_at: string;
  kanban_tarefas: KanbanTarefa[];
}

interface KanbanTarefa {
  id: string;
  grupo_id: string;
  sigla_casa: string;
  titulo: string;
  feito: boolean;
  responsavel: string | null;
  prazo: string | null;
  ordem: number;
  created_at: string;
}
```

### Novo estado em KanbanPage

```ts
const [expandedId, setExpandedId] = useState<string | null>(null);
const [grupos, setGrupos] = useState<Record<string, KanbanGrupo[]>>({});
const [loadingGrupos, setLoadingGrupos] = useState<Record<string, boolean>>({});
```

### Fetch de grupos + tarefas

Disparado ao expandir um card (lazy — só carrega quando necessário):

```ts
const fetchGrupos = async (eventoId: string, sigla: string) => {
  setLoadingGrupos((prev) => ({ ...prev, [eventoId]: true }));
  const { data } = await supabase
    .from("kanban_grupos")
    .select("*, kanban_tarefas(*)")
    .eq("evento_id", eventoId)
    .eq("sigla_casa", sigla)
    .order("ordem");
  setGrupos((prev) => ({ ...prev, [eventoId]: (data as KanbanGrupo[]) ?? [] }));
  setLoadingGrupos((prev) => ({ ...prev, [eventoId]: false }));
};
```

### Estrutura de componentes

```
KanbanPage
└── KanbanCard (modificado)
    ├── Header: ícone ⠿ (drag) + título + setas ◀ [status] ▶
    ├── Linha de resumo: "▶ N grupos · M tarefas (X feitas)"
    └── GruposPanel (renderizado quando expandido)
        ├── GrupoItem × N
        │   ├── Header: nome + responsável + membros + botão editar/excluir
        │   ├── TarefaItem × N (checkbox + título + responsável + prazo)
        │   ├── FormNovaTargefa (inline, abre ao clicar "+")
        │   └── Botão "+ Adicionar tarefa"
        ├── FormNovoGrupo (inline, abre ao clicar "+")
        └── Botão "+ Novo Grupo de Trabalho"
```

---

## UI

### Card colapsado

- Linha extra de resumo: `▶ 2 grupos · 5 tarefas (2 feitas)` — visível sempre que há grupos
- Setas de status (`◀ Planejado ▶`) visíveis no hover do card
- Drag handle `⠿` antes do título para arrastar entre colunas

### Card expandido

- Header: `⠿ EJEI — Julho  ◀ Planejado ▶`
- Painel azul claro (`bg-cyan-50/30`) com lista de grupos
- Cada grupo: nome em destaque ciano, `Resp: X · Membros: A, B, C`

### Tarefa

- Checkbox verde quando feita, cinza quando pendente
- Título riscado quando feita (`line-through`)
- Prazo com cor por urgência:
  - Normal: `text-muted-foreground/60`
  - Hoje ou amanhã: `text-amber-500`
  - Vencido: `text-red-500`

### Forms inline

**Novo grupo** (abre abaixo do botão "+"):

- Input: Nome do grupo \*
- Input: Responsável
- Input: Membros (separados por vírgula)
- Botões: Salvar / Cancelar

**Nova tarefa** (abre abaixo do "+" de cada grupo):

- Input: Título \*
- Input: Responsável
- Input type=date: Prazo
- Botões: Salvar / Cancelar

### Mudança de status pelas setas

- `◀` move para o status anterior na ordem (Ideia → desativado, Planejado → Ideia, etc.)
- `▶` move para o próximo status
- Atualização otimista idêntica ao drag-and-drop

---

## Permissões

| Ação                            | Quem pode                           |
| ------------------------------- | ----------------------------------- |
| Ver grupos e tarefas            | Qualquer membro autenticado da casa |
| Criar / editar / excluir grupo  | Qualquer membro                     |
| Criar / editar / excluir tarefa | Qualquer membro                     |
| Marcar tarefa como feita        | Qualquer membro                     |
| Mudar status do evento (setas)  | Qualquer membro                     |

---

## Fora do Escopo

- Drag-and-drop para reordenar grupos ou tarefas
- Notificações de prazo vencido
- Progresso em % no card colapsado (baseado em tarefas feitas/total)
- Comentários em tarefas
- Atribuição múltipla de responsável
