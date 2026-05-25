import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DndContext, DragEndEvent, useDroppable, useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Plus, Calendar, User, Pencil, Trash2, X, KanbanSquare, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Check, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/kanban")({
  component: KanbanPage,
});

type Status = "ideia" | "planejado" | "em andamento" | "realizado";

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

const COLUNAS: { status: Status; label: string; borda: string; corHeader: string; bgOver: string }[] = [
  { status: "ideia",        label: "Ideia",        borda: "border-gray-200",    corHeader: "text-gray-500",    bgOver: "bg-gray-50" },
  { status: "planejado",   label: "Planejado",   borda: "border-amber-200",   corHeader: "text-amber-600",   bgOver: "bg-amber-50/50" },
  { status: "em andamento", label: "Em andamento", borda: "border-cyan-200",    corHeader: "text-cyan-600",    bgOver: "bg-cyan-50/50" },
  { status: "realizado",   label: "Realizado",   borda: "border-emerald-200", corHeader: "text-emerald-600", bgOver: "bg-emerald-50/50" },
];

function fmtData(iso: string) {
  const [year, month, day] = iso.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

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

// ── Page ───────────────────────────────────────────────────────────────────

function KanbanPage() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  const [eventos, setEventos] = useState<KanbanEvento[]>([]);
  const [loadingEventos, setLoadingEventos] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvento, setEditingEvento] = useState<KanbanEvento | null>(null);

  const [fTitulo, setFTitulo]           = useState("");
  const [fDescricao, setFDescricao]     = useState("");
  const [fData, setFData]               = useState("");
  const [fResponsavel, setFResponsavel] = useState("");
  const [saving, setSaving]             = useState(false);
  const [formError, setFormError]       = useState("");

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [grupos, setGrupos] = useState<Record<string, KanbanGrupo[]>>({});
  const [loadingGrupos, setLoadingGrupos] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
    if (!loading && user && (!profile?.sigla_casa || !profile?.nome || !profile?.cargo_principal || !profile?.uf || !profile?.cidade))
      navigate({ to: "/completar-perfil" });
  }, [user, profile, loading, navigate]);

  const fetchEventos = async (sigla: string) => {
    setLoadingEventos(true);
    const { data } = await supabase
      .from("kanban_eventos")
      .select("*")
      .eq("sigla_casa", sigla)
      .order("created_at", { ascending: true });
    setEventos((data as KanbanEvento[]) ?? []);
    setLoadingEventos(false);
  };

  useEffect(() => {
    if (user && profile?.sigla_casa) fetchEventos(profile.sigla_casa);
  }, [user, profile?.sigla_casa]);

  if (loading || !user) return null;

  const openCreate = () => {
    setEditingEvento(null);
    setFTitulo(""); setFDescricao(""); setFData(""); setFResponsavel("");
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
    if (!fTitulo.trim()) { setFormError("Informe o título."); return; }
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
        const { error } = await supabase
          .from("kanban_eventos")
          .insert({
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
      if (profile?.sigla_casa) fetchEventos(profile.sigla_casa);
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este card? Não pode ser desfeito.")) return;
    const { error } = await supabase.from("kanban_eventos").delete().eq("id", id);
    if (error) { alert("Erro ao excluir: " + error.message); return; }
    if (profile?.sigla_casa) fetchEventos(profile.sigla_casa);
  };

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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const eventoId = active.id as string;
    const novoStatus = over.id as Status;
    const evento = eventos.find((e) => e.id === eventoId);
    if (!evento || evento.status === novoStatus) return;

    const statusAnterior = evento.status;
    setEventos((prev) =>
      prev.map((e) => (e.id === eventoId ? { ...e, status: novoStatus } : e))
    );
    const { error } = await supabase
      .from("kanban_eventos")
      .update({ status: novoStatus })
      .eq("id", eventoId);
    if (error) {
      setEventos((prev) =>
        prev.map((e) => (e.id === eventoId ? { ...e, status: statusAnterior } : e))
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
            <h1 className="text-3xl font-light text-foreground">
              Casa {profile?.sigla_casa}
            </h1>
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
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 transition-colors">
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
                  onChange={(e) => { setFTitulo(e.target.value); setFormError(""); }}
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

function KanbanColumn({ status, label, borda, corHeader, bgOver, eventos, userId, expandedId, grupos, loadingGrupos, sigla, onEdit, onDelete, onNewCard, onToggleExpand, onStatusChange, onRefreshGrupos }: KanbanColumnProps) {
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
              disabled={statusIdx <= 0}
              aria-label="Status anterior"
              className="p-1 rounded text-gray-300 hover:text-gray-500 disabled:opacity-20 transition-colors"
            >
              <ChevronLeft size={13} />
            </button>
            <span className="text-xs text-muted-foreground/50 px-1 select-none whitespace-nowrap">
              {COLUNAS[statusIdx]?.label}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); onStatusChange("next"); }}
              disabled={statusIdx === -1 || statusIdx === COLUNAS.length - 1}
              aria-label="Próximo status"
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
              aria-label="Editar grupo"
              className="p-1 rounded text-muted-foreground/30 hover:text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <Pencil size={10} />
            </button>
            <button
              onClick={handleDeleteGrupo}
              aria-label="Excluir grupo"
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
        aria-label={tarefa.feito ? "Marcar como pendente" : "Marcar como feita"}
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
        aria-label="Excluir tarefa"
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
