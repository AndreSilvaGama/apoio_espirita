# Kanban — Grupos de Trabalho e Tarefas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar expansão inline de grupos de trabalho e tarefas em cada card do Kanban, com setas de mudança de status no header.

**Architecture:** Dois novos tipos (`KanbanGrupo`, `KanbanTarefa`), duas novas tabelas Supabase, e extensão do `src/routes/kanban.tsx` existente com novos componentes `GruposPanel`, `GrupoItem`, `TarefaItem` e forms inline. Nenhuma nova rota.

**Tech Stack:** React 19, TypeScript, Supabase, Tailwind CSS, Lucide React. Arquivo único: `src/routes/kanban.tsx`.

---

## Mapa de arquivos

| Arquivo | Ação | Responsabilidade |
|---|---|---|
| `src/routes/kanban.tsx` | Modificar | Tipos, estado, handlers, KanbanCard, GruposPanel e sub-componentes |
| Supabase | Migration | Tabelas `kanban_grupos` e `kanban_tarefas` com RLS |

---

## Task 1: Migration Supabase

**Files:** Supabase MCP

- [ ] **Step 1: Aplicar migration via `mcp__claude_ai_Supabase__apply_migration`**

Project ID: `kitmwxfwwujygcmdjngm`
Migration name: `create_kanban_grupos_tarefas`

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

- [ ] **Step 2: Verificar tabelas criadas**

Usar `mcp__claude_ai_Supabase__execute_sql`:
```sql
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name IN ('kanban_grupos','kanban_tarefas')
ORDER BY table_name, ordinal_position;
```

Expected: `kanban_grupos` com 9 colunas, `kanban_tarefas` com 10 colunas.

---

## Task 2: Novos tipos, estado e handlers em KanbanPage

**Files:**
- Modify: `src/routes/kanban.tsx`

- [ ] **Step 1: Adicionar imports necessários**

Substituir a linha de import do lucide-react:
```tsx
import { Plus, Calendar, User, Pencil, Trash2, X, KanbanSquare } from "lucide-react";
```
Por:
```tsx
import { Plus, Calendar, User, Pencil, Trash2, X, KanbanSquare, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Check, Users } from "lucide-react";
```

- [ ] **Step 2: Adicionar interfaces KanbanGrupo e KanbanTarefa**

Após a interface `KanbanEvento` (após a linha `}`), adicionar:

```tsx
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
```

- [ ] **Step 3: Adicionar helper corPrazo após fmtData**

Após a função `fmtData`, adicionar:
```tsx
function corPrazo(prazo: string | null): string {
  if (!prazo) return "text-muted-foreground/50";
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);
  const data = new Date(prazo + "T00:00:00");
  if (data < hoje) return "text-red-500";
  if (data <= amanha) return "text-amber-500";
  return "text-muted-foreground/50";
}
```

- [ ] **Step 4: Adicionar novo estado ao KanbanPage**

Após a linha `const [formError, setFormError] = useState("");`, adicionar:
```tsx
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [grupos, setGrupos] = useState<Record<string, KanbanGrupo[]>>({});
  const [loadingGrupos, setLoadingGrupos] = useState<Record<string, boolean>>({});
```

- [ ] **Step 5: Adicionar funções fetchGrupos, handleToggleExpand e handleStatusChange**

Após a função `handleDelete` (após o `};` que a fecha), adicionar:

```tsx
  const fetchGrupos = async (eventoId: string, sigla: string) => {
    setLoadingGrupos((prev) => ({ ...prev, [eventoId]: true }));
    const { data } = await supabase
      .from("kanban_grupos")
      .select("*, kanban_tarefas(*)")
      .eq("evento_id", eventoId)
      .eq("sigla_casa", sigla)
      .order("ordem");
    const sorted = ((data as KanbanGrupo[]) ?? []).map((g) => ({
      ...g,
      kanban_tarefas: [...g.kanban_tarefas].sort((a, b) => a.ordem - b.ordem),
    }));
    setGrupos((prev) => ({ ...prev, [eventoId]: sorted }));
    setLoadingGrupos((prev) => ({ ...prev, [eventoId]: false }));
  };

  const handleToggleExpand = (eventoId: string) => {
    if (expandedId === eventoId) { setExpandedId(null); return; }
    setExpandedId(eventoId);
    if (!grupos[eventoId] && profile?.sigla_casa) fetchGrupos(eventoId, profile.sigla_casa);
  };

  const handleStatusChange = async (evento: KanbanEvento, direction: "prev" | "next") => {
    const idx = COLUNAS.findIndex((c) => c.status === evento.status);
    const newIdx = direction === "next" ? idx + 1 : idx - 1;
    if (newIdx < 0 || newIdx >= COLUNAS.length) return;
    const novoStatus = COLUNAS[newIdx].status;
    const statusAnterior = evento.status;
    setEventos((prev) => prev.map((e) => e.id === evento.id ? { ...e, status: novoStatus } : e));
    const { error } = await supabase
      .from("kanban_eventos")
      .update({ status: novoStatus })
      .eq("id", evento.id);
    if (error) setEventos((prev) => prev.map((e) => e.id === evento.id ? { ...e, status: statusAnterior } : e));
  };
```

- [ ] **Step 6: Atualizar chamada de KanbanColumn no JSX**

Localizar o bloco onde `KanbanColumn` é renderizado (dentro do `DndContext`):
```tsx
                <KanbanColumn
                  key={col.status}
                  status={col.status}
                  label={col.label}
                  borda={col.borda}
                  corHeader={col.corHeader}
                  bgOver={col.bgOver}
                  eventos={eventos.filter((e) => e.status === col.status)}
                  userId={user.id}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onNewCard={openCreate}
                />
```

Substituir por:
```tsx
                <KanbanColumn
                  key={col.status}
                  status={col.status}
                  label={col.label}
                  borda={col.borda}
                  corHeader={col.corHeader}
                  bgOver={col.bgOver}
                  eventos={eventos.filter((e) => e.status === col.status)}
                  userId={user.id}
                  expandedId={expandedId}
                  grupos={grupos}
                  loadingGrupos={loadingGrupos}
                  sigla={profile?.sigla_casa ?? ""}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onNewCard={openCreate}
                  onToggleExpand={handleToggleExpand}
                  onStatusChange={handleStatusChange}
                  onRefreshGrupos={fetchGrupos}
                />
```

- [ ] **Step 7: Atualizar interface e implementação de KanbanColumn**

Substituir a interface `KanbanColumnProps` existente:
```tsx
interface KanbanColumnProps {
  status: Status;
  label: string;
  borda: string;
  corHeader: string;
  bgOver: string;
  eventos: KanbanEvento[];
  userId: string;
  onEdit: (evento: KanbanEvento) => void;
  onDelete: (id: string) => void;
  onNewCard: () => void;
}
```

Por:
```tsx
interface KanbanColumnProps {
  status: Status;
  label: string;
  borda: string;
  corHeader: string;
  bgOver: string;
  eventos: KanbanEvento[];
  userId: string;
  expandedId: string | null;
  grupos: Record<string, KanbanGrupo[]>;
  loadingGrupos: Record<string, boolean>;
  sigla: string;
  onEdit: (evento: KanbanEvento) => void;
  onDelete: (id: string) => void;
  onNewCard: () => void;
  onToggleExpand: (id: string) => void;
  onStatusChange: (evento: KanbanEvento, direction: "prev" | "next") => void;
  onRefreshGrupos: (eventoId: string, sigla: string) => void;
}
```

Substituir a linha da função `KanbanColumn` (a desestruturação dos props) e o `KanbanCard` interno:

Linha da função (de):
```tsx
function KanbanColumn({ status, label, borda, corHeader, bgOver, eventos, userId, onEdit, onDelete, onNewCard }: KanbanColumnProps) {
```

Para:
```tsx
function KanbanColumn({ status, label, borda, corHeader, bgOver, eventos, userId, expandedId, grupos, loadingGrupos, sigla, onEdit, onDelete, onNewCard, onToggleExpand, onStatusChange, onRefreshGrupos }: KanbanColumnProps) {
```

Dentro do `KanbanColumn`, substituir a chamada de `KanbanCard`:
```tsx
          <KanbanCard
            key={evento.id}
            evento={evento}
            userId={userId}
            onEdit={onEdit}
            onDelete={onDelete}
          />
```

Por:
```tsx
          <KanbanCard
            key={evento.id}
            evento={evento}
            userId={userId}
            expanded={expandedId === evento.id}
            gruposData={grupos[evento.id] ?? []}
            loadingGrupos={loadingGrupos[evento.id] ?? false}
            sigla={sigla}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleExpand={() => onToggleExpand(evento.id)}
            onStatusChange={(dir) => onStatusChange(evento, dir)}
            onRefreshGrupos={() => onRefreshGrupos(evento.id, sigla)}
          />
```

- [ ] **Step 8: Build para verificar tipos**

```
cd D:\WEB\APOIO_ESPIRITA\apoio_espirita-main
npm run build
```

Expected: zero erros TypeScript. Se houver erros de tipo, corrigi-los antes de continuar.

- [ ] **Step 9: Commit**

```
git add src/routes/kanban.tsx
git commit -m "feat: adiciona tipos, estado e handlers para grupos e tarefas"
```

---

## Task 3: Atualizar KanbanCard

**Files:**
- Modify: `src/routes/kanban.tsx`

- [ ] **Step 1: Substituir interface e implementação de KanbanCard**

Substituir a interface `KanbanCardProps` existente:
```tsx
interface KanbanCardProps {
  evento: KanbanEvento;
  userId: string;
  onEdit: (evento: KanbanEvento) => void;
  onDelete: (id: string) => void;
}
```

Por:
```tsx
interface KanbanCardProps {
  evento: KanbanEvento;
  userId: string;
  expanded: boolean;
  gruposData: KanbanGrupo[];
  loadingGrupos: boolean;
  sigla: string;
  onEdit: (evento: KanbanEvento) => void;
  onDelete: (id: string) => void;
  onToggleExpand: () => void;
  onStatusChange: (direction: "prev" | "next") => void;
  onRefreshGrupos: () => void;
}
```

- [ ] **Step 2: Substituir a função KanbanCard completa**

Substituir toda a função `KanbanCard` (de `function KanbanCard` até o `}` final) por:

```tsx
function KanbanCard({ evento, userId, expanded, gruposData, loadingGrupos, sigla, onEdit, onDelete, onToggleExpand, onStatusChange, onRefreshGrupos }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: evento.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  const isCriador = evento.criador_id === userId;
  const statusIdx = COLUNAS.findIndex((c) => c.status === evento.status);
  const totalTarefas = gruposData.reduce((acc, g) => acc + g.kanban_tarefas.length, 0);
  const totalFeitas = gruposData.reduce((acc, g) => acc + g.kanban_tarefas.filter((t) => t.feito).length, 0);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-xl shadow-sm border transition-all ${expanded ? "border-cyan-300 shadow-cyan-100" : "border-gray-100"}`}
    >
      {/* Card header com drag handle e setas de status */}
      <div className="p-4">
        <div className="flex items-start gap-2">
          {/* Drag handle */}
          <div
            {...listeners}
            {...attributes}
            className="cursor-grab active:cursor-grabbing select-none pt-0.5 shrink-0 text-gray-300 hover:text-gray-400"
          >
            <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor">
              <circle cx="2" cy="2" r="1.5"/><circle cx="8" cy="2" r="1.5"/>
              <circle cx="2" cy="8" r="1.5"/><circle cx="8" cy="8" r="1.5"/>
              <circle cx="2" cy="14" r="1.5"/><circle cx="8" cy="14" r="1.5"/>
            </svg>
          </div>

          {/* Título clicável para expandir */}
          <button
            onClick={onToggleExpand}
            className="flex-1 text-left"
          >
            <p className="text-sm font-medium text-gray-800 leading-snug">{evento.titulo}</p>
          </button>

          {/* Setas de status */}
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onStatusChange("prev"); }}
              disabled={statusIdx === 0}
              className="p-1 rounded text-gray-300 hover:text-gray-500 disabled:opacity-20 transition-colors"
            >
              <ChevronLeft size={13} />
            </button>
            <span className="text-xs text-muted-foreground/50 px-1 select-none whitespace-nowrap">
              {COLUNAS[statusIdx]?.label}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); onStatusChange("next"); }}
              disabled={statusIdx === COLUNAS.length - 1}
              className="p-1 rounded text-gray-300 hover:text-gray-500 disabled:opacity-20 transition-colors"
            >
              <ChevronRight size={13} />
            </button>
          </div>
        </div>

        {/* Meta: data e responsável */}
        <div className="mt-2 pl-4">
          {evento.data && (
            <p className="text-xs text-muted-foreground/60 flex items-center gap-1 mb-1">
              <Calendar size={10} />
              {fmtData(evento.data)}
            </p>
          )}
          {evento.responsavel && (
            <p className="text-xs text-muted-foreground/60 flex items-center gap-1 mb-1">
              <User size={10} />
              {evento.responsavel}
            </p>
          )}
          {evento.descricao && !expanded && (
            <p className="text-xs text-muted-foreground/50 mt-1 line-clamp-2 leading-relaxed">
              {evento.descricao}
            </p>
          )}
        </div>

        {/* Resumo de grupos + botão expandir */}
        <div className="mt-2 pl-4 flex items-center justify-between">
          <button
            onClick={onToggleExpand}
            className="flex items-center gap-1 text-xs text-cyan-600/70 hover:text-cyan-600 transition-colors"
          >
            {expanded
              ? <ChevronUp size={11} />
              : <ChevronDown size={11} />
            }
            {gruposData.length > 0
              ? `${gruposData.length} grupo${gruposData.length !== 1 ? "s" : ""} · ${totalTarefas} tarefa${totalTarefas !== 1 ? "s" : ""} (${totalFeitas} feita${totalFeitas !== 1 ? "s" : ""})`
              : "Grupos de trabalho"
            }
          </button>

          {/* Editar / excluir (só criador) */}
          {isCriador && (
            <div className="flex gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(evento); }}
                className="p-1 rounded text-muted-foreground/30 hover:text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Pencil size={11} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(evento.id); }}
                className="p-1 rounded text-red-300/50 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={11} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Painel de grupos (expandido) */}
      {expanded && (
        <GruposPanel
          eventoId={evento.id}
          sigla={sigla}
          grupos={gruposData}
          loading={loadingGrupos}
          onRefresh={onRefreshGrupos}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Build para verificar**

```
cd D:\WEB\APOIO_ESPIRITA\apoio_espirita-main
npm run build
```

Expected: zero erros. `GruposPanel` ainda não existe — haverá erro de referência. Isso é esperado neste passo; corrigir na Task 4.

- [ ] **Step 4: Commit parcial**

```
git add src/routes/kanban.tsx
git commit -m "feat: KanbanCard com setas de status e expansão inline"
```

---

## Task 4: Implementar GruposPanel e sub-componentes

**Files:**
- Modify: `src/routes/kanban.tsx` (adicionar ao final do arquivo)

- [ ] **Step 1: Adicionar GruposPanel ao final do arquivo**

Após o último `}` do arquivo (fim de `KanbanCard`), adicionar:

```tsx
// ── GruposPanel ─────────────────────────────────────────────────────────────

interface GruposPanelProps {
  eventoId: string;
  sigla: string;
  grupos: KanbanGrupo[];
  loading: boolean;
  onRefresh: () => void;
}

function GruposPanel({ eventoId, sigla, grupos, loading, onRefresh }: GruposPanelProps) {
  const [showFormGrupo, setShowFormGrupo] = useState(false);

  return (
    <div className="border-t border-cyan-100 bg-cyan-50/30 px-4 pb-4 pt-3 rounded-b-xl">
      {loading ? (
        <p className="text-xs text-muted-foreground/40 text-center py-3">Carregando grupos…</p>
      ) : (
        <>
          <div className="space-y-3">
            {grupos.map((grupo) => (
              <GrupoItem
                key={grupo.id}
                grupo={grupo}
                sigla={sigla}
                onRefresh={onRefresh}
              />
            ))}
          </div>

          {showFormGrupo ? (
            <FormNovoGrupo
              eventoId={eventoId}
              sigla={sigla}
              nextOrdem={grupos.length}
              onSaved={() => { setShowFormGrupo(false); onRefresh(); }}
              onCancel={() => setShowFormGrupo(false)}
            />
          ) : (
            <button
              onClick={() => setShowFormGrupo(true)}
              className="mt-3 w-full flex items-center justify-center gap-1 py-2 text-xs text-cyan-600/60 hover:text-cyan-600 border border-dashed border-cyan-200 rounded-lg hover:border-cyan-300 transition-colors"
            >
              <Plus size={11} />
              Novo Grupo de Trabalho
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ── GrupoItem ────────────────────────────────────────────────────────────────

interface GrupoItemProps {
  grupo: KanbanGrupo;
  sigla: string;
  onRefresh: () => void;
}

function GrupoItem({ grupo, sigla, onRefresh }: GrupoItemProps) {
  const [editing, setEditing] = useState(false);
  const [showFormTarefa, setShowFormTarefa] = useState(false);
  const [eName, setEName] = useState(grupo.nome);
  const [eResp, setEResp] = useState(grupo.responsavel ?? "");
  const [eMembros, setEMembros] = useState(grupo.membros.join(", "));
  const [saving, setSaving] = useState(false);

  const handleSaveGrupo = async () => {
    if (!eName.trim()) return;
    setSaving(true);
    await supabase.from("kanban_grupos").update({
      nome: eName.trim(),
      responsavel: eResp.trim() || null,
      membros: eMembros.split(",").map((m) => m.trim()).filter(Boolean),
    }).eq("id", grupo.id);
    setSaving(false);
    setEditing(false);
    onRefresh();
  };

  const handleDeleteGrupo = async () => {
    if (!confirm(`Excluir o grupo "${grupo.nome}" e todas as suas tarefas?`)) return;
    await supabase.from("kanban_grupos").delete().eq("id", grupo.id);
    onRefresh();
  };

  const completadas = grupo.kanban_tarefas.filter((t) => t.feito).length;

  return (
    <div className="bg-white border border-cyan-100 rounded-xl overflow-hidden">
      {/* Header do grupo */}
      {editing ? (
        <div className="p-3 space-y-2">
          <input
            value={eName}
            onChange={(e) => setEName(e.target.value)}
            placeholder="Nome do grupo *"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:border-cyan-400"
          />
          <input
            value={eResp}
            onChange={(e) => setEResp(e.target.value)}
            placeholder="Responsável"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:border-cyan-400"
          />
          <input
            value={eMembros}
            onChange={(e) => setEMembros(e.target.value)}
            placeholder="Membros (separados por vírgula)"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:border-cyan-400"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSaveGrupo}
              disabled={saving || !eName.trim()}
              className="flex-1 py-1.5 text-xs rounded-lg bg-cyan-500 text-white hover:bg-cyan-600 disabled:opacity-40 transition-colors"
            >
              {saving ? "Salvando…" : "Salvar"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="flex-1 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="px-3 py-2.5 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-cyan-700 leading-snug">{grupo.nome}</p>
            {(grupo.responsavel || grupo.membros.length > 0) && (
              <p className="text-xs text-muted-foreground/50 mt-0.5 flex items-center gap-1">
                <Users size={9} />
                {[grupo.responsavel, ...grupo.membros].filter(Boolean).join(" · ")}
              </p>
            )}
            {grupo.kanban_tarefas.length > 0 && (
              <p className="text-xs text-muted-foreground/40 mt-0.5">
                {completadas}/{grupo.kanban_tarefas.length} tarefa{grupo.kanban_tarefas.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          <div className="flex gap-1 shrink-0">
            <button
              onClick={() => setEditing(true)}
              className="p-1 rounded text-muted-foreground/30 hover:text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <Pencil size={10} />
            </button>
            <button
              onClick={handleDeleteGrupo}
              className="p-1 rounded text-red-300/50 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={10} />
            </button>
          </div>
        </div>
      )}

      {/* Tarefas */}
      {grupo.kanban_tarefas.length > 0 && (
        <div className="border-t border-gray-50 divide-y divide-gray-50">
          {grupo.kanban_tarefas.map((tarefa) => (
            <TarefaItem
              key={tarefa.id}
              tarefa={tarefa}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      )}

      {/* Adicionar tarefa */}
      <div className="border-t border-gray-50 px-3 py-2">
        {showFormTarefa ? (
          <FormNovaTarefa
            grupoId={grupo.id}
            sigla={sigla}
            nextOrdem={grupo.kanban_tarefas.length}
            onSaved={() => { setShowFormTarefa(false); onRefresh(); }}
            onCancel={() => setShowFormTarefa(false)}
          />
        ) : (
          <button
            onClick={() => setShowFormTarefa(true)}
            className="text-xs text-muted-foreground/40 hover:text-cyan-600 transition-colors flex items-center gap-1"
          >
            <Plus size={10} />
            Adicionar tarefa
          </button>
        )}
      </div>
    </div>
  );
}

// ── TarefaItem ───────────────────────────────────────────────────────────────

interface TarefaItemProps {
  tarefa: KanbanTarefa;
  onRefresh: () => void;
}

function TarefaItem({ tarefa, onRefresh }: TarefaItemProps) {
  const [toggling, setToggling] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    await supabase.from("kanban_tarefas").update({ feito: !tarefa.feito }).eq("id", tarefa.id);
    setToggling(false);
    onRefresh();
  };

  const handleDelete = async () => {
    await supabase.from("kanban_tarefas").delete().eq("id", tarefa.id);
    onRefresh();
  };

  return (
    <div className="px-3 py-2 flex items-start gap-2 group">
      {/* Checkbox */}
      <button
        onClick={handleToggle}
        disabled={toggling}
        className={`shrink-0 mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
          tarefa.feito
            ? "bg-emerald-500 border-emerald-500"
            : "border-gray-300 hover:border-emerald-400"
        }`}
      >
        {tarefa.feito && <Check size={9} className="text-white" strokeWidth={3} />}
      </button>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        <p className={`text-xs leading-snug ${tarefa.feito ? "line-through text-muted-foreground/40" : "text-gray-700"}`}>
          {tarefa.titulo}
        </p>
        {(tarefa.responsavel || tarefa.prazo) && (
          <p className="text-xs mt-0.5 flex items-center gap-2">
            {tarefa.responsavel && (
              <span className="text-muted-foreground/50">{tarefa.responsavel}</span>
            )}
            {tarefa.prazo && (
              <span className={corPrazo(tarefa.prazo)}>{fmtData(tarefa.prazo)}</span>
            )}
          </p>
        )}
      </div>

      {/* Excluir */}
      <button
        onClick={handleDelete}
        className="shrink-0 opacity-0 group-hover:opacity-100 p-0.5 rounded text-red-300 hover:text-red-500 transition-all"
      >
        <X size={10} />
      </button>
    </div>
  );
}

// ── FormNovoGrupo ────────────────────────────────────────────────────────────

interface FormNovoGrupoProps {
  eventoId: string;
  sigla: string;
  nextOrdem: number;
  onSaved: () => void;
  onCancel: () => void;
}

function FormNovoGrupo({ eventoId, sigla, nextOrdem, onSaved, onCancel }: FormNovoGrupoProps) {
  const [nome, setNome] = useState("");
  const [resp, setResp] = useState("");
  const [membros, setMembros] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!nome.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("kanban_grupos").insert({
      evento_id: eventoId,
      sigla_casa: sigla,
      nome: nome.trim(),
      responsavel: resp.trim() || null,
      membros: membros.split(",").map((m) => m.trim()).filter(Boolean),
      ordem: nextOrdem,
    });
    setSaving(false);
    if (!error) onSaved();
  };

  return (
    <div className="mt-3 space-y-2 p-3 bg-white border border-cyan-100 rounded-xl">
      <input
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        placeholder="Nome do grupo *"
        autoFocus
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:border-cyan-400"
      />
      <input
        value={resp}
        onChange={(e) => setResp(e.target.value)}
        placeholder="Responsável"
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:border-cyan-400"
      />
      <input
        value={membros}
        onChange={(e) => setMembros(e.target.value)}
        placeholder="Membros (separados por vírgula)"
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:border-cyan-400"
      />
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving || !nome.trim()}
          className="flex-1 py-1.5 text-xs rounded-lg bg-cyan-500 text-white hover:bg-cyan-600 disabled:opacity-40 transition-colors"
        >
          {saving ? "Salvando…" : "Criar Grupo"}
        </button>
        <button
          onClick={onCancel}
          className="flex-1 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

// ── FormNovaTarefa ───────────────────────────────────────────────────────────

interface FormNovaTarefaProps {
  grupoId: string;
  sigla: string;
  nextOrdem: number;
  onSaved: () => void;
  onCancel: () => void;
}

function FormNovaTarefa({ grupoId, sigla, nextOrdem, onSaved, onCancel }: FormNovaTarefaProps) {
  const [titulo, setTitulo] = useState("");
  const [resp, setResp] = useState("");
  const [prazo, setPrazo] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!titulo.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("kanban_tarefas").insert({
      grupo_id: grupoId,
      sigla_casa: sigla,
      titulo: titulo.trim(),
      responsavel: resp.trim() || null,
      prazo: prazo || null,
      ordem: nextOrdem,
    });
    setSaving(false);
    if (!error) onSaved();
  };

  return (
    <div className="space-y-2 pt-1">
      <input
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder="Título da tarefa *"
        autoFocus
        className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs focus:outline-none focus:border-cyan-400"
      />
      <div className="flex gap-2">
        <input
          value={resp}
          onChange={(e) => setResp(e.target.value)}
          placeholder="Responsável"
          className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs focus:outline-none focus:border-cyan-400"
        />
        <input
          type="date"
          value={prazo}
          onChange={(e) => setPrazo(e.target.value)}
          className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs focus:outline-none focus:border-cyan-400"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving || !titulo.trim()}
          className="flex-1 py-1.5 text-xs rounded-lg bg-cyan-500 text-white hover:bg-cyan-600 disabled:opacity-40 transition-colors"
        >
          {saving ? "…" : "Adicionar"}
        </button>
        <button
          onClick={onCancel}
          className="py-1.5 px-3 text-xs rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <X size={10} />
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build final**

```
cd D:\WEB\APOIO_ESPIRITA\apoio_espirita-main
npm run build
```

Expected: zero erros TypeScript.

- [ ] **Step 3: Commit**

```
git add src/routes/kanban.tsx
git commit -m "feat: GruposPanel, GrupoItem, TarefaItem e forms inline"
```

---

## Task 5: Roadmap + deploy + push

**Files:**
- Modify: `src/routes/painel.tsx`

- [ ] **Step 1: Atualizar roadmap**

Em `src/routes/painel.tsx`, localizar o item do array `roadmap[]` sobre grupos/tarefas do Kanban. Se não existir, adicionar com `status: "feito"` e descrição `"Grupos de trabalho com tarefas, checklist, responsável e prazo em cada card do Kanban"`.

- [ ] **Step 2: Build final antes do deploy**

```
cd D:\WEB\APOIO_ESPIRITA\apoio_espirita-main
npm run build
```

- [ ] **Step 3: Deploy**

```
cd D:\WEB\APOIO_ESPIRITA\apoio_espirita-main\dist\server
npx wrangler deploy --config wrangler.json
```

Expected: deployment success em `apoioespirita.com.br`.

- [ ] **Step 4: Commit roadmap e push**

```
cd D:\WEB\APOIO_ESPIRITA\apoio_espirita-main
git add src/routes/painel.tsx
git commit -m "chore: marca grupos e tarefas kanban como feito no roadmap"
git push
```
