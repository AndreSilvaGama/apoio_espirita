import { useEffect, useState } from "react";
import { DndContext, DragEndEvent, useDroppable, useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Plus, Calendar, User, Pencil, Trash2, X, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Check, Users, ClipboardList } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

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

export function ProjetosTab({ sigla }: { sigla: string }) {
  const { user, profile } = useAuth();
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

  const fetchEventos = async (siglaCasa: string) => {
    setLoadingEventos(true);
    const { data } = await supabase
      .from("kanban_eventos")
      .select("*")
      .eq("sigla_casa", siglaCasa)
      .order("created_at", { ascending: true });
    setEventos((data as KanbanEvento[]) ?? []);
    setLoadingEventos(false);
  };

  useEffect(() => {
    if (sigla) fetchEventos(sigla);
  }, [sigla]);

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
    if (!sigla || !user) return;
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
            sigla_casa: sigla,
            titulo: fTitulo.trim(),
            descricao: fDescricao.trim() || null,
            data: fData || null,
            responsavel: fResponsavel.trim() || null,
            status: "ideia",
            criador_id: user.id,
            criador_nome: profile?.nome ?? "Membro",
          });
        if (error) throw error;
      }
      closeForm();
      fetchEventos(sigla);
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
    fetchEventos(sigla);
  };

  const fetchGrupos = async (eventoId: string, siglaCasa: string) => {
    setLoadingGrupos((prev) => ({ ...prev, [eventoId]: true }));
    const { data } = await supabase
      .from("kanban_grupos")
      .select("*, kanban_tarefas(*)")
      .eq("evento_id", eventoId)
      .eq("sigla_casa", siglaCasa)
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
    if (!grupos[eventoId] && sigla) fetchGrupos(eventoId, sigla);
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

  if (!user) return null;

  return (
    <section className="space-y-6 animate-fade-in-up" style={{ animationDuration: '400ms' }}>
      {/* Header da seção */}
      <div className="flex items-center justify-between mb-2 flex-wrap gap-4 border-b border-gray-100 pb-4">
        <div>
          <h3 style={{ fontFamily: '"Libre Caslon Text", Georgia, serif', fontSize: "1.4rem", fontWeight: 400, color: "#111418", margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
            <ClipboardList size={22} style={{ color: "#004a8c", opacity: 0.7 }} />
            Projetos e Tarefas da Casa
          </h3>
          <p className="text-xs text-muted-foreground/60 mt-1 font-light">Planeje ideias, reuniões e organize grupos de trabalho do seu centro espírita.</p>
        </div>
        <button
          onClick={openCreate}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 18px", borderRadius: 12, background: "#004a8c", color: "#fff", fontFamily: "Inter", fontSize: "0.82rem", fontWeight: 600, border: "none", cursor: "pointer", boxShadow: "0 2px 10px rgba(0,74,140,.2)" }}
        >
          <Plus size={14} />
          Novo Projeto
        </button>
      </div>

      {/* Board */}
      {loadingEventos ? (
        <p className="text-sm text-muted-foreground/50 text-center py-12">Carregando projetos…</p>
      ) : eventos.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center border border-dashed border-gray-200">
          <ClipboardList size={36} strokeWidth={1} className="text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground/50 font-light">Nenhum projeto ou ideia cadastrada ainda.</p>
          <button onClick={openCreate} className="mt-3 text-xs text-cyan-600 font-semibold hover:underline">
            + Criar primeiro projeto
          </button>
        </div>
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
                sigla={sigla}
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

      {/* FormSlide */}
      {showForm && (
        <>
          <div className="fixed inset-0 bg-black/30 z-100" onClick={closeForm} />
          <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white z-200 shadow-2xl flex flex-col animate-fade-in-right" style={{ animationDuration: '300ms' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-widest">
                {editingEvento ? "Editar Projeto" : "Novo Projeto"}
              </h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
                  Título <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={fTitulo}
                  onChange={(e) => { setFTitulo(e.target.value); setFormError(""); }}
                  placeholder="Nome do projeto ou ideia"
                  className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-cyan-600 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
                  Prazo Estimado
                </label>
                <input
                  type="date"
                  value={fData}
                  onChange={(e) => setFData(e.target.value)}
                  className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-cyan-600 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
                  Responsável Geral
                </label>
                <input
                  type="text"
                  value={fResponsavel}
                  onChange={(e) => setFResponsavel(e.target.value)}
                  placeholder="Nome do responsável"
                  className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-cyan-600 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
                  Descrição
                </label>
                <textarea
                  value={fDescricao}
                  onChange={(e) => setFDescricao(e.target.value)}
                  placeholder="Detalhes sobre o projeto…"
                  rows={4}
                  className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-cyan-600 transition-colors resize-none"
                />
              </div>
              {formError && <p className="text-xs text-red-500">{formError}</p>}
            </div>
            <div className="px-6 py-4 border-t border-gray-200">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3 rounded-xl text-xs font-semibold uppercase tracking-widest bg-[#004a8c] text-white hover:bg-[#00386b] disabled:opacity-40 transition-colors duration-300"
              >
                {saving ? "Salvando…" : editingEvento ? "Salvar Alterações" : "Criar Projeto"}
              </button>
            </div>
          </div>
        </>
      )}
    </section>
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
      className={`min-w-[250px] max-w-[280px] flex-1 flex-shrink-0 rounded-2xl border ${borda} p-4 transition-all duration-300 ${isOver ? bgOver : ""}`}
      style={{ background: "#f8f9fa" }}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className={`text-xs font-bold uppercase tracking-wider ${corHeader}`}>{label}</h4>
        <span className="text-[10px] font-bold text-gray-500 bg-white border border-gray-100 rounded-full px-2 py-0.5">
          {eventos.length}
        </span>
      </div>
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
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
        className="mt-3 w-full flex items-center gap-1 py-1.5 text-[11px] text-muted-foreground/50 hover:text-[#004a8c] transition-colors justify-center font-medium border border-dashed border-gray-200 rounded-xl"
      >
        <Plus size={12} />
        Adicionar item
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

  const isCriador = evento.criador_id === userId;
  const statusIdx = COLUNAS.findIndex((c) => c.status === evento.status);
  const totalTarefas = gruposData.reduce((acc, g) => acc + g.kanban_tarefas.length, 0);
  const totalFeitas = gruposData.reduce((acc, g) => acc + g.kanban_tarefas.filter((t) => t.feito).length, 0);

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
        background: "#ffffff",
        border: expanded ? "1px solid rgba(0,74,140,.2)" : "1px solid rgba(0,20,70,.06)",
        borderRadius: 14,
        boxShadow: expanded
          ? "0 4px 14px rgba(0,20,70,.05), 0 6px 20px rgba(0,20,70,.04)"
          : "0 1px 3px rgba(0,20,70,.02), 0 2px 6px rgba(0,20,70,.03)",
        transition: "box-shadow .2s, border-color .2s",
      }}
    >
      <div className="p-3">
        <div className="flex items-start gap-2">
          {/* Drag handle */}
          <div
            {...listeners}
            {...attributes}
            className="cursor-grab active:cursor-grabbing select-none pt-0.5 shrink-0 text-gray-300 hover:text-gray-400"
          >
            <svg width="8" height="14" viewBox="0 0 10 16" fill="currentColor">
              <circle cx="2" cy="2" r="1.5"/><circle cx="8" cy="2" r="1.5"/>
              <circle cx="2" cy="8" r="1.5"/><circle cx="8" cy="8" r="1.5"/>
              <circle cx="2" cy="14" r="1.5"/><circle cx="8" cy="14" r="1.5"/>
            </svg>
          </div>

          {/* Título clicável */}
          <button
            onClick={onToggleExpand}
            className="flex-1 text-left"
          >
            <p className="text-xs font-semibold text-gray-800 leading-snug">{evento.titulo}</p>
          </button>
        </div>

        {/* Meta */}
        <div className="mt-1.5 pl-3">
          {evento.data && (
            <p className="text-[10px] text-muted-foreground/60 flex items-center gap-1 mb-0.5">
              <Calendar size={10} />
              {fmtData(evento.data)}
            </p>
          )}
          {evento.responsavel && (
            <p className="text-[10px] text-muted-foreground/60 flex items-center gap-1 mb-0.5">
              <User size={10} />
              {evento.responsavel}
            </p>
          )}
          {evento.descricao && !expanded && (
            <p className="text-[10px] text-muted-foreground/50 mt-1 line-clamp-2 leading-relaxed font-light">
              {evento.descricao}
            </p>
          )}
        </div>

        {/* Footer com setas de troca rápida */}
        <div className="mt-2 pl-3 flex items-center justify-between border-t border-gray-50 pt-2 flex-wrap gap-1.5">
          <button
            onClick={onToggleExpand}
            className="flex items-center gap-0.5 text-[10px] font-medium text-[#004a8c] hover:underline"
          >
            {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            {gruposData.length > 0
              ? `${gruposData.length} grp · ${totalFeitas}/${totalTarefas}`
              : "Grupos"
            }
          </button>

          {/* Status quick controls */}
          <div className="flex items-center shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onStatusChange("prev"); }}
              disabled={statusIdx <= 0}
              aria-label="Status anterior"
              className="p-0.5 rounded text-gray-300 hover:text-gray-600 disabled:opacity-20"
            >
              <ChevronLeft size={12} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onStatusChange("next"); }}
              disabled={statusIdx === -1 || statusIdx === COLUNAS.length - 1}
              aria-label="Próximo status"
              className="p-0.5 rounded text-gray-300 hover:text-gray-600 disabled:opacity-20"
            >
              <ChevronRight size={12} />
            </button>
            {isCriador && (
              <div className="flex gap-0.5 ml-1 border-l border-gray-100 pl-1">
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(evento); }}
                  className="p-0.5 rounded text-gray-300 hover:text-gray-600"
                >
                  <Pencil size={10} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(evento.id); }}
                  className="p-0.5 rounded text-red-300/60 hover:text-red-500"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            )}
          </div>
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
    <div className="border-t border-cyan-100/50 bg-cyan-50/20 px-3 pb-3 pt-2.5 rounded-b-xl">
      {loading ? (
        <p className="text-[10px] text-muted-foreground/40 text-center py-2">Carregando grupos…</p>
      ) : (
        <>
          <div className="space-y-2.5">
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
              className="mt-2.5 w-full flex items-center justify-center gap-1 py-1.5 text-[10px] text-cyan-700/60 hover:text-cyan-700 border border-dashed border-cyan-200/60 rounded-lg hover:border-cyan-300 transition-colors bg-white font-medium"
            >
              <Plus size={10} />
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
    const { error } = await supabase.from("kanban_grupos").update({
      nome: eName.trim(),
      responsavel: eResp.trim() || null,
      membros: eMembros.split(",").map((m) => m.trim()).filter(Boolean),
    }).eq("id", grupo.id);
    setSaving(false);
    if (!error) {
      setEditing(false);
      onRefresh();
    }
  };

  const handleDeleteGrupo = async () => {
    if (!confirm(`Excluir o grupo "${grupo.nome}" e todas as suas tarefas?`)) return;
    await supabase.from("kanban_grupos").delete().eq("id", grupo.id);
    onRefresh();
  };

  const completadas = grupo.kanban_tarefas.filter((t) => t.feito).length;

  return (
    <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
      {/* Header do grupo */}
      {editing ? (
        <div className="p-2 space-y-1.5">
          <input
            value={eName}
            onChange={(e) => setEName(e.target.value)}
            placeholder="Nome do grupo *"
            className="w-full rounded border border-gray-200 px-2 py-1 text-[11px] focus:outline-none focus:border-cyan-400"
          />
          <input
            value={eResp}
            onChange={(e) => setEResp(e.target.value)}
            placeholder="Responsável"
            className="w-full rounded border border-gray-200 px-2 py-1 text-[11px] focus:outline-none focus:border-cyan-400"
          />
          <input
            value={eMembros}
            onChange={(e) => setEMembros(e.target.value)}
            placeholder="Membros (separados por vírgula)"
            className="w-full rounded border border-gray-200 px-2 py-1 text-[11px] focus:outline-none focus:border-cyan-400"
          />
          <div className="flex gap-1.5">
            <button
              onClick={handleSaveGrupo}
              disabled={saving || !eName.trim()}
              className="flex-1 py-1 text-[10px] rounded bg-cyan-600 text-white hover:bg-cyan-700 disabled:opacity-40 transition-colors"
            >
              {saving ? "…" : "Salvar"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="flex-1 py-1 text-[10px] rounded border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="px-2.5 py-1.5 flex items-start justify-between gap-1.5 bg-gray-50/50">
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-gray-700 leading-snug">{grupo.nome}</p>
            {(grupo.responsavel || grupo.membros.length > 0) && (
              <p className="text-[9px] text-muted-foreground/50 mt-0.5 flex items-center gap-1 font-light">
                <Users size={8} />
                {[grupo.responsavel, ...grupo.membros].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
          <div className="flex gap-0.5 shrink-0">
            <button
              onClick={() => setEditing(true)}
              className="p-0.5 rounded text-gray-300 hover:text-gray-500"
            >
              <Pencil size={9} />
            </button>
            <button
              onClick={handleDeleteGrupo}
              className="p-0.5 rounded text-red-300 hover:text-red-500"
            >
              <Trash2 size={9} />
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
      <div className="border-t border-gray-50 px-2 py-1.5 bg-gray-50/10">
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
            className="text-[10px] text-cyan-600/70 hover:text-cyan-700 transition-colors flex items-center gap-0.5 font-semibold"
          >
            <Plus size={10} />
            Tarefa
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
    if (!confirm("Excluir esta tarefa?")) return;
    await supabase.from("kanban_tarefas").delete().eq("id", tarefa.id);
    onRefresh();
  };

  return (
    <div className="px-2.5 py-1.5 flex items-start gap-1.5 group hover:bg-gray-50/30">
      {/* Checkbox */}
      <button
        onClick={handleToggle}
        disabled={toggling}
        className={`shrink-0 mt-0.5 w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
          tarefa.feito
            ? "bg-emerald-500 border-emerald-500"
            : "border-gray-300 hover:border-emerald-500"
        }`}
      >
        {tarefa.feito && <Check size={8} className="text-white" strokeWidth={3} />}
      </button>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        <p className={`text-[11px] leading-snug ${tarefa.feito ? "line-through text-muted-foreground/30 font-light" : "text-gray-600"}`}>
          {tarefa.titulo}
        </p>
        {(tarefa.responsavel || tarefa.prazo) && (
          <p className="text-[9px] mt-0.5 flex items-center gap-1.5 font-light">
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
    await supabase.from("kanban_grupos").insert({
      evento_id: eventoId,
      sigla_casa: sigla,
      nome: nome.trim(),
      responsavel: resp.trim() || null,
      membros: membros.split(",").map((m) => m.trim()).filter(Boolean),
      ordem: nextOrdem,
    });
    setSaving(false);
    onSaved();
  };

  return (
    <div className="mt-2 space-y-1.5 p-2 bg-white border border-cyan-100 rounded-lg">
      <input
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        placeholder="Nome do grupo *"
        autoFocus
        className="w-full rounded border border-gray-200 px-2 py-1 text-[10px] focus:outline-none focus:border-cyan-400"
      />
      <input
        value={resp}
        onChange={(e) => setResp(e.target.value)}
        placeholder="Responsável"
        className="w-full rounded border border-gray-200 px-2 py-1 text-[10px] focus:outline-none focus:border-cyan-400"
      />
      <input
        value={membros}
        onChange={(e) => setMembros(e.target.value)}
        placeholder="Membros (por vírgula)"
        className="w-full rounded border border-gray-200 px-2 py-1 text-[10px] focus:outline-none focus:border-cyan-400"
      />
      <div className="flex gap-1.5">
        <button
          onClick={handleSave}
          disabled={saving || !nome.trim()}
          className="flex-1 py-1 text-[10px] rounded bg-cyan-600 text-white hover:bg-cyan-700 disabled:opacity-40 transition-colors"
        >
          {saving ? "…" : "Criar Grupo"}
        </button>
        <button
          onClick={onCancel}
          className="flex-1 py-1 text-[10px] rounded border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
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
    await supabase.from("kanban_tarefas").insert({
      grupo_id: grupoId,
      sigla_casa: sigla,
      titulo: titulo.trim(),
      responsavel: resp.trim() || null,
      prazo: prazo || null,
      ordem: nextOrdem,
    });
    setSaving(false);
    onSaved();
  };

  return (
    <div className="space-y-1.5 pt-1">
      <input
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder="Título da tarefa *"
        autoFocus
        className="w-full rounded border border-gray-200 px-2.5 py-1 text-[10px] focus:outline-none focus:border-cyan-400"
      />
      <div className="flex gap-1.5">
        <input
          value={resp}
          onChange={(e) => setResp(e.target.value)}
          placeholder="Responsável"
          className="flex-1 rounded border border-gray-200 px-2 py-1 text-[10px] focus:outline-none focus:border-cyan-400"
        />
        <input
          type="date"
          value={prazo}
          onChange={(e) => setPrazo(e.target.value)}
          className="flex-1 rounded border border-gray-200 px-2 py-1 text-[10px] focus:outline-none focus:border-cyan-400"
        />
      </div>
      <div className="flex gap-1.5">
        <button
          onClick={handleSave}
          disabled={saving || !titulo.trim()}
          className="flex-1 py-1 text-[10px] rounded bg-cyan-600 text-white hover:bg-cyan-700 disabled:opacity-40 transition-colors"
        >
          Adicionar
        </button>
        <button
          onClick={onCancel}
          className="py-1 px-2 text-[10px] rounded border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <X size={8} />
        </button>
      </div>
    </div>
  );
}
