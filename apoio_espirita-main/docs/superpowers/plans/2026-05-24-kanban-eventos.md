# Kanban de Eventos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar a página `/kanban` com board de 4 colunas drag-and-drop para controle de eventos da casa espírita.

**Architecture:** Nova rota `src/routes/kanban.tsx` com `DndContext` do `@dnd-kit/core`. Tabela `kanban_eventos` no Supabase, independente da agenda. Navegação adicionada em `__root.tsx`.

**Tech Stack:** React 19, TanStack Router, @dnd-kit/core + @dnd-kit/utilities, Supabase, Tailwind CSS, Lucide React

---

## Mapa de arquivos

| Arquivo                 | Ação      | Responsabilidade                                  |
| ----------------------- | --------- | ------------------------------------------------- |
| `src/routes/kanban.tsx` | Criar     | Página Kanban completa (board, form, DnD)         |
| `src/routes/__root.tsx` | Modificar | Adicionar link "Eventos" no menu desktop e mobile |
| `package.json`          | Modificar | Instalar @dnd-kit/core e @dnd-kit/utilities       |

---

## Task 1: Instalar dependências @dnd-kit

**Files:**

- Modify: `package.json`

- [ ] **Step 1: Instalar os pacotes**

```bash
cd D:\WEB\APOIO_ESPIRITA\apoio_espirita-main
npm install @dnd-kit/core @dnd-kit/utilities
```

Expected output: `added 2 packages` (sem erros)

- [ ] **Step 2: Verificar que os pacotes aparecem em package.json**

Confirmar que `"@dnd-kit/core"` e `"@dnd-kit/utilities"` estão listados em `dependencies`.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: instala @dnd-kit/core e @dnd-kit/utilities"
```

---

## Task 2: Migration Supabase — tabela kanban_eventos

**Files:**

- Supabase MCP

- [ ] **Step 1: Aplicar migration via Supabase MCP**

Usar `mcp__claude_ai_Supabase__apply_migration` com o seguinte SQL:

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

- [ ] **Step 2: Confirmar tabela criada**

Usar `mcp__claude_ai_Supabase__execute_sql`:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'kanban_eventos'
ORDER BY ordinal_position;
```

Expected: 10 colunas listadas (id, sigla_casa, titulo, descricao, data, responsavel, status, criador_id, criador_nome, created_at)

---

## Task 3: Criar src/routes/kanban.tsx

**Files:**

- Create: `src/routes/kanban.tsx`

- [ ] **Step 1: Criar o arquivo com o conteúdo completo**

```tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DndContext, DragEndEvent, useDroppable, useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Plus, Calendar, User, Pencil, Trash2, X, KanbanSquare } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/kanban")({
  component: KanbanPage,
});

type Status = "ideia" | "planejando" | "confirmado" | "realizado";

interface KanbanEvento {
  id: string;
  sigla_casa: string;
  titulo: string;
  descricao: string | null;
  data: string | null;
  responsavel: string | null;
  status: Status;
  criador_id: string | null;
  criador_nome: string | null;
  created_at: string;
}

const COLUNAS: {
  status: Status;
  label: string;
  borda: string;
  corHeader: string;
  bgOver: string;
}[] = [
  {
    status: "ideia",
    label: "Ideia",
    borda: "border-gray-200",
    corHeader: "text-gray-500",
    bgOver: "bg-gray-50",
  },
  {
    status: "planejando",
    label: "Planejando",
    borda: "border-amber-200",
    corHeader: "text-amber-600",
    bgOver: "bg-amber-50/50",
  },
  {
    status: "confirmado",
    label: "Confirmado",
    borda: "border-cyan-200",
    corHeader: "text-cyan-600",
    bgOver: "bg-cyan-50/50",
  },
  {
    status: "realizado",
    label: "Realizado",
    borda: "border-emerald-200",
    corHeader: "text-emerald-600",
    bgOver: "bg-emerald-50/50",
  },
];

function fmtData(iso: string) {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

// ── Page ───────────────────────────────────────────────────────────────────

function KanbanPage() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  const [eventos, setEventos] = useState<KanbanEvento[]>([]);
  const [loadingEventos, setLoadingEventos] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvento, setEditingEvento] = useState<KanbanEvento | null>(null);

  const [fTitulo, setFTitulo] = useState("");
  const [fDescricao, setFDescricao] = useState("");
  const [fData, setFData] = useState("");
  const [fResponsavel, setFResponsavel] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
    if (
      !loading &&
      user &&
      (!profile?.sigla_casa ||
        !profile?.nome ||
        !profile?.cargo_principal ||
        !profile?.uf ||
        !profile?.cidade)
    )
      navigate({ to: "/completar-perfil" });
  }, [user, profile, loading, navigate]);

  const fetchEventos = async () => {
    setLoadingEventos(true);
    const { data } = await supabase
      .from("kanban_eventos")
      .select("*")
      .order("created_at", { ascending: true });
    setEventos((data as KanbanEvento[]) ?? []);
    setLoadingEventos(false);
  };

  useEffect(() => {
    if (user && profile?.sigla_casa) fetchEventos();
  }, [user, profile?.sigla_casa]);

  if (loading || !user) return null;

  const openCreate = () => {
    setEditingEvento(null);
    setFTitulo("");
    setFDescricao("");
    setFData("");
    setFResponsavel("");
    setFormError("");
    setShowForm(true);
  };

  const openEdit = (evento: KanbanEvento) => {
    setEditingEvento(evento);
    setFTitulo(evento.titulo);
    setFDescricao(evento.descricao ?? "");
    setFData(evento.data ?? "");
    setFResponsavel(evento.responsavel ?? "");
    setFormError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingEvento(null);
    setFormError("");
  };

  const handleSave = async () => {
    if (!fTitulo.trim()) {
      setFormError("Informe o título.");
      return;
    }
    if (!profile?.sigla_casa || !user) return;
    setSaving(true);
    setFormError("");
    try {
      if (editingEvento) {
        const { error } = await supabase
          .from("kanban_eventos")
          .update({
            titulo: fTitulo.trim(),
            descricao: fDescricao.trim() || null,
            data: fData || null,
            responsavel: fResponsavel.trim() || null,
          })
          .eq("id", editingEvento.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("kanban_eventos").insert({
          sigla_casa: profile.sigla_casa,
          titulo: fTitulo.trim(),
          descricao: fDescricao.trim() || null,
          data: fData || null,
          responsavel: fResponsavel.trim() || null,
          status: "ideia",
          criador_id: user.id,
          criador_nome: profile.nome ?? "Membro",
        });
        if (error) throw error;
      }
      closeForm();
      fetchEventos();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este card? Não pode ser desfeito.")) return;
    await supabase.from("kanban_eventos").delete().eq("id", id);
    fetchEventos();
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const eventoId = active.id as string;
    const novoStatus = over.id as Status;
    const evento = eventos.find((e) => e.id === eventoId);
    if (!evento || evento.status === novoStatus) return;

    const statusAnterior = evento.status;
    setEventos((prev) => prev.map((e) => (e.id === eventoId ? { ...e, status: novoStatus } : e)));
    const { error } = await supabase
      .from("kanban_eventos")
      .update({ status: novoStatus })
      .eq("id", eventoId);
    if (error) {
      setEventos((prev) =>
        prev.map((e) => (e.id === eventoId ? { ...e, status: statusAnterior } : e)),
      );
    }
  };

  return (
    <main className="page-light min-h-screen px-4 pt-20 pb-20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-glow mb-1 flex items-center gap-2">
              <KanbanSquare size={12} />
              Eventos
            </p>
            <h1 className="text-3xl font-light text-foreground">Casa {profile?.sigla_casa}</h1>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-cyan-glow/40 text-cyan-glow text-xs uppercase tracking-widest hover:bg-cyan-glow/10 transition-colors"
          >
            <Plus size={14} />
            Novo Card
          </button>
        </div>

        {/* Board */}
        {loadingEventos ? (
          <p className="text-sm text-muted-foreground/50 text-center py-16">Carregando…</p>
        ) : (
          <DndContext onDragEnd={handleDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {COLUNAS.map((col) => (
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
              ))}
            </div>
          </DndContext>
        )}
      </div>

      {/* FormSlide */}
      {showForm && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={closeForm} />
          <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white z-50 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-widest">
                {editingEvento ? "Editar Card" : "Novo Card"}
              </h2>
              <button
                onClick={closeForm}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
                  Título <span className="text-cyan-glow">*</span>
                </label>
                <input
                  type="text"
                  value={fTitulo}
                  onChange={(e) => {
                    setFTitulo(e.target.value);
                    setFormError("");
                  }}
                  placeholder="Nome do evento"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-cyan-glow/40 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
                  Data
                </label>
                <input
                  type="date"
                  value={fData}
                  onChange={(e) => setFData(e.target.value)}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-foreground focus:outline-none focus:border-cyan-glow/40 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
                  Responsável
                </label>
                <input
                  type="text"
                  value={fResponsavel}
                  onChange={(e) => setFResponsavel(e.target.value)}
                  placeholder="Nome do responsável"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-cyan-glow/40 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
                  Descrição
                </label>
                <textarea
                  value={fDescricao}
                  onChange={(e) => setFDescricao(e.target.value)}
                  placeholder="Detalhes do evento…"
                  rows={4}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-cyan-glow/40 transition-colors resize-none"
                />
              </div>
              {formError && <p className="text-xs text-red-400">{formError}</p>}
            </div>
            <div className="px-6 py-4 border-t border-gray-200">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3 rounded-xl text-sm uppercase tracking-widest text-cyan-glow border border-cyan-glow/40 hover:bg-cyan-glow/10 disabled:opacity-40 transition-colors duration-300"
              >
                {saving ? "Salvando…" : editingEvento ? "Salvar Alterações" : "Criar Card"}
              </button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}

// ── KanbanColumn ────────────────────────────────────────────────────────────

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

function KanbanColumn({
  status,
  label,
  borda,
  corHeader,
  bgOver,
  eventos,
  userId,
  onEdit,
  onDelete,
  onNewCard,
}: KanbanColumnProps) {
  const { isOver, setNodeRef } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`min-w-[260px] flex-shrink-0 rounded-2xl border-2 ${borda} ${isOver ? bgOver : "bg-white/50"} p-4 transition-colors`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-xs font-semibold uppercase tracking-widest ${corHeader}`}>{label}</h3>
        <span className="text-xs text-muted-foreground/50 bg-white/80 rounded-full px-2 py-0.5">
          {eventos.length}
        </span>
      </div>
      <div className="space-y-3">
        {eventos.map((evento) => (
          <KanbanCard
            key={evento.id}
            evento={evento}
            userId={userId}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
      <button
        onClick={onNewCard}
        className="mt-3 w-full flex items-center gap-1 py-2 text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors justify-center"
      >
        <Plus size={12} />
        Novo card
      </button>
    </div>
  );
}

// ── KanbanCard ──────────────────────────────────────────────────────────────

interface KanbanCardProps {
  evento: KanbanEvento;
  userId: string;
  onEdit: (evento: KanbanEvento) => void;
  onDelete: (id: string) => void;
}

function KanbanCard({ evento, userId, onEdit, onDelete }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: evento.id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  const isCriador = evento.criador_id === userId;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 cursor-grab active:cursor-grabbing select-none"
    >
      <p className="text-sm font-medium text-gray-800 leading-snug mb-2">{evento.titulo}</p>
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
      {evento.descricao && (
        <p className="text-xs text-muted-foreground/50 mt-2 line-clamp-2 leading-relaxed">
          {evento.descricao}
        </p>
      )}
      {isCriador && (
        <div className="flex gap-2 mt-3 pt-2 border-t border-gray-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(evento);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-xs text-muted-foreground/40 hover:text-gray-600 transition-colors py-1 px-2 rounded-lg hover:bg-gray-50"
          >
            <Pencil size={11} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(evento.id);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-xs text-red-400/50 hover:text-red-500 transition-colors py-1 px-2 rounded-lg hover:bg-red-50"
          >
            <Trash2 size={11} />
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verificar build sem erros**

```bash
cd D:\WEB\APOIO_ESPIRITA\apoio_espirita-main
npm run build
```

Expected: zero erros de TypeScript e zero warnings fatais.

- [ ] **Step 3: Commit**

```bash
git add src/routes/kanban.tsx
git commit -m "feat: kanban de eventos com drag-and-drop"
```

---

## Task 4: Adicionar link "Eventos" na Navbar

**Files:**

- Modify: `src/routes/__root.tsx`

### 4a — Importar KanbanSquare

- [ ] **Step 1: Adicionar `KanbanSquare` aos imports do lucide-react**

Na linha 17 de `src/routes/__root.tsx`, a linha atual é:

```tsx
import {
  Radio,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ArrowUp,
  Menu,
  X,
  ChevronDown,
  Gamepad2,
  AlertTriangle,
  MessageCircle,
  GraduationCap,
  Brain,
  ShieldAlert,
  HelpCircle,
  Wallet,
  BookOpen,
  User,
  LogOut,
  BarChart2,
} from "lucide-react";
```

Substituir por:

```tsx
import {
  Radio,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ArrowUp,
  Menu,
  X,
  ChevronDown,
  Gamepad2,
  AlertTriangle,
  MessageCircle,
  GraduationCap,
  Brain,
  ShieldAlert,
  HelpCircle,
  Wallet,
  BookOpen,
  User,
  LogOut,
  BarChart2,
  KanbanSquare,
} from "lucide-react";
```

### 4b — Desktop nav

- [ ] **Step 2: Inserir link "Eventos" no desktop nav**

Localizar no arquivo (linha ~345):

```tsx
          <Link to="/agenda" className={linkCls("/agenda")}>Agenda</Link>
          <Link to="/mensagem-do-dia" className={linkCls("/mensagem-do-dia")}>Mensagem</Link>
```

Substituir por:

```tsx
          <Link to="/agenda" className={linkCls("/agenda")}>Agenda</Link>
          <Link to="/kanban" className={linkCls("/kanban")}>Eventos</Link>
          <Link to="/mensagem-do-dia" className={linkCls("/mensagem-do-dia")}>Mensagem</Link>
```

### 4c — Mobile nav

- [ ] **Step 3: Inserir link "Eventos" no menu mobile**

Localizar no arquivo (linha ~448):

```tsx
            <Link to="/agenda" className="py-3 px-2 text-sm font-medium text-gray-700 hover:text-cyan-700 border-b border-gray-100 transition-colors">
              Agenda
            </Link>
            <Link to="/mensagem-do-dia" className="py-3 px-2 text-sm font-medium text-gray-700 hover:text-cyan-700 border-b border-gray-100 transition-colors">
              Mensagem do Dia
            </Link>
```

Substituir por:

```tsx
            <Link to="/agenda" className="py-3 px-2 text-sm font-medium text-gray-700 hover:text-cyan-700 border-b border-gray-100 transition-colors">
              Agenda
            </Link>
            <Link to="/kanban" className="py-3 px-2 text-sm font-medium text-gray-700 hover:text-cyan-700 border-b border-gray-100 transition-colors">
              Eventos
            </Link>
            <Link to="/mensagem-do-dia" className="py-3 px-2 text-sm font-medium text-gray-700 hover:text-cyan-700 border-b border-gray-100 transition-colors">
              Mensagem do Dia
            </Link>
```

- [ ] **Step 4: Verificar build sem erros**

```bash
cd D:\WEB\APOIO_ESPIRITA\apoio_espirita-main
npm run build
```

Expected: zero erros.

- [ ] **Step 5: Commit**

```bash
git add src/routes/__root.tsx
git commit -m "feat: adiciona link Eventos no menu desktop e mobile"
```

---

## Task 5: Atualizar roadmap e fazer deploy

**Files:**

- Modify: `src/routes/painel.tsx`

- [ ] **Step 1: Mover "Kanban de Eventos" de planejado para feito no roadmap**

Em `src/routes/painel.tsx`, localizar o item no array `roadmap[]` referente ao Kanban de Eventos e mudar o status de `"planejado"` para `"feito"`. Se não existir ainda, adicionar como `"feito"` com descrição: `"Board Kanban com 4 colunas e drag-and-drop para controle de eventos da casa"`.

- [ ] **Step 2: Commit do roadmap**

```bash
git add src/routes/painel.tsx
git commit -m "chore: marca kanban de eventos como feito no roadmap"
```

- [ ] **Step 3: Deploy**

```bash
cd D:\WEB\APOIO_ESPIRITA\apoio_espirita-main\dist\server
npx wrangler deploy --config wrangler.json
```

Expected: `Deployed ... (X ms)` sem erros.

- [ ] **Step 4: Push**

```bash
cd D:\WEB\APOIO_ESPIRITA\apoio_espirita-main
git push
```
