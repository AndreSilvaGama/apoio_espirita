import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  CalendarDays,
  Plus,
  Clock,
  MapPin,
  Globe,
  Lock,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  FileText,
  UserCheck,
  Trash2,
  Pencil,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { CasaHero } from "@/components/CasaHero";
import { WisdomBlock } from "@/components/WisdomBlock";

export const Route = createFileRoute("/agenda")({
  component: AgendaPage,
});

// Cargos que podem criar e gerenciar eventos
const CARGOS_DECISORES = [
  "Presidente",
  "Vice-presidente",
  "Coordenador",
  "Diretoria",
  "Dirigente",
  "Dirigente de reunião mediúnica",
  "DEV",
];

// ── Types ──────────────────────────────────────────────────────────────────

interface Participante {
  id: string;
  evento_id: string;
  user_id: string;
  confirmado: boolean | null;
  presente: boolean;
  profiles: { nome: string; cargo_principal: string } | null;
}

interface Evento {
  id: string;
  sigla_casa: string;
  titulo: string;
  descricao: string | null;
  local: string | null;
  data_inicio: string;
  data_fim: string | null;
  tipo: "aberto" | "fechado";
  aceita_confirmacao: boolean;
  criador_id: string;
  criador_nome: string;
  ata: string | null;
  created_at: string;
  agenda_participantes: Participante[];
}

interface Membro {
  id: string;
  nome: string;
  cargo_principal: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function fmtHora(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function isPassado(iso: string) {
  return new Date(iso) < new Date();
}

// ── Page ───────────────────────────────────────────────────────────────────

function AgendaPage() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  const [eventos, setEventos] = useState<Evento[]>([]);
  const [membros, setMembros] = useState<Membro[]>([]);
  const [loadingEventos, setLoadingEventos] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [aba, setAba] = useState<"proximos" | "passados" | "presencas">("proximos");

  // Form
  const [fTitulo, setFTitulo] = useState("");
  const [fDescricao, setFDescricao] = useState("");
  const [fLocal, setFLocal] = useState("");
  const [fDataInicio, setFDataInicio] = useState("");
  const [fHoraInicio, setFHoraInicio] = useState("");
  const [fDataFim, setFDataFim] = useState("");
  const [fHoraFim, setFHoraFim] = useState("");
  const [fTipo, setFTipo] = useState<"aberto" | "fechado">("aberto");
  const [fAceita, setFAceita] = useState(true);
  const [fConvidados, setFConvidados] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const podeGerenciar = CARGOS_DECISORES.includes(profile?.cargo_principal ?? "");

  // ── Auth ──
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

  // ── Fetch ──
  const fetchEventos = async () => {
    setLoadingEventos(true);
    const { data } = await supabase
      .from("agenda_eventos")
      .select(
        "*, agenda_participantes(id, evento_id, user_id, confirmado, presente, profiles(nome, cargo_principal))",
      )
      .order("data_inicio", { ascending: true });
    setEventos((data as Evento[]) ?? []);
    setLoadingEventos(false);
  };

  const fetchMembros = async () => {
    if (!profile?.sigla_casa || !user) return;
    const { data } = await supabase
      .from("profiles")
      .select("id, nome, cargo_principal")
      .eq("sigla_casa", profile.sigla_casa)
      .neq("id", user.id)
      .order("nome");
    setMembros((data as Membro[]) ?? []);
  };

  useEffect(() => {
    if (user && profile?.sigla_casa) {
      fetchEventos();
      fetchMembros();
    }
  }, [user, profile?.sigla_casa]);

  if (loading || !user) return null;

  // ── Lists ──
  const proximos = eventos.filter((e) => !isPassado(e.data_fim ?? e.data_inicio));
  const passados = eventos
    .filter((e) => isPassado(e.data_fim ?? e.data_inicio))
    .sort((a, b) => new Date(b.data_inicio).getTime() - new Date(a.data_inicio).getTime());
  const lista = aba === "proximos" ? proximos : passados;

  // ── Relatório de presenças ──
  const eventosComPresenca = eventos.filter((e) => e.agenda_participantes.some((p) => p.presente));
  const mapMembro: Record<string, { nome: string; presencas: number; total: number }> = {};
  eventosComPresenca.forEach((ev) => {
    ev.agenda_participantes.forEach((p) => {
      const nome = p.profiles?.nome ?? "Membro";
      if (!mapMembro[nome]) mapMembro[nome] = { nome, presencas: 0, total: 0 };
      mapMembro[nome].total += 1;
      if (p.presente) mapMembro[nome].presencas += 1;
    });
  });
  const relatorioMembros = Object.values(mapMembro).sort((a, b) => b.presencas - a.presencas);

  // ── Criar evento ──
  const handleCreate = async () => {
    if (!fTitulo.trim()) {
      setFormError("Informe o título do evento.");
      return;
    }
    if (!fDataInicio || !fHoraInicio) {
      setFormError("Informe a data e hora de início.");
      return;
    }
    if (!fDataFim || !fHoraFim) {
      setFormError("Informe a data e hora de encerramento.");
      return;
    }
    const dataInicioISO = new Date(`${fDataInicio}T${fHoraInicio}`).toISOString();
    const dataFimISO = new Date(`${fDataFim}T${fHoraFim}`).toISOString();
    if (dataFimISO <= dataInicioISO) {
      setFormError("A data/hora de encerramento deve ser posterior ao início.");
      return;
    }
    if (!profile?.sigla_casa || !user) return;
    setSaving(true);
    setFormError("");

    try {
      const { data: novo, error } = await supabase
        .from("agenda_eventos")
        .insert({
          sigla_casa: profile.sigla_casa,
          titulo: fTitulo.trim(),
          descricao: fDescricao.trim() || null,
          local: fLocal.trim() || null,
          data_inicio: dataInicioISO,
          data_fim: dataFimISO,
          tipo: fTipo,
          aceita_confirmacao: fAceita,
          criador_id: user.id,
          criador_nome: profile.nome ?? "Organizador",
        })
        .select()
        .single();

      if (error) throw error;

      // Adicionar criador como participante confirmado
      await supabase.from("agenda_participantes").insert({
        evento_id: novo.id,
        user_id: user.id,
        confirmado: true,
      });

      // Convidar participantes (evento fechado)
      if (fTipo === "fechado" && fConvidados.length > 0) {
        await supabase
          .from("agenda_participantes")
          .insert(
            fConvidados.map((uid) => ({ evento_id: novo.id, user_id: uid, confirmado: null })),
          );
        supabase.functions.invoke("send-notification", {
          body: {
            type: "convite_agenda",
            data: { titulo: fTitulo.trim(), data: dataInicioISO, user_ids: fConvidados },
          },
        });
      }

      // Reset
      setFTitulo("");
      setFDescricao("");
      setFLocal("");
      setFDataInicio("");
      setFHoraInicio("");
      setFDataFim("");
      setFHoraFim("");
      setFTipo("aberto");
      setFAceita(true);
      setFConvidados([]);
      setShowForm(false);
      fetchEventos();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Erro ao criar evento.");
    } finally {
      setSaving(false);
    }
  };

  // ── Confirmar presença (evento aberto) ──
  const handleConfirmar = async (eventoId: string) => {
    if (!user) return;
    await supabase
      .from("agenda_participantes")
      .upsert(
        { evento_id: eventoId, user_id: user.id, confirmado: true },
        { onConflict: "evento_id,user_id" },
      );
    fetchEventos();
  };

  // ── Responder convite (evento fechado) ──
  const handleResponder = async (participanteId: string, confirmado: boolean) => {
    await supabase.from("agenda_participantes").update({ confirmado }).eq("id", participanteId);
    fetchEventos();
  };

  // ── Marcar presença ──
  const handlePresenca = async (participanteId: string, presente: boolean) => {
    await supabase.from("agenda_participantes").update({ presente }).eq("id", participanteId);
    fetchEventos();
  };

  // ── Gerar ata ──
  const handleGerarAta = async (evento: Evento) => {
    const presentes = evento.agenda_participantes
      .filter((p) => p.presente)
      .map((p) => p.profiles?.nome ?? "Membro")
      .join(", ");
    const total = evento.agenda_participantes.filter((p) => p.presente).length;

    const linhas = [
      "ATA DE REUNIÃO",
      "",
      `Evento: ${evento.titulo}`,
      `Data: ${fmtData(evento.data_inicio)}`,
      `Início: ${fmtHora(evento.data_inicio)}`,
      evento.data_fim ? `Encerramento: ${fmtHora(evento.data_fim)}` : null,
      evento.local ? `Local: ${evento.local}` : null,
      `Casa espírita: ${evento.sigla_casa}`,
      `Organizador: ${evento.criador_nome}`,
      "",
      `Total de presentes: ${total}`,
      total > 0 ? `Presentes: ${presentes}` : "Nenhuma presença registrada.",
      "",
      "Ata gerada pela plataforma Apoio Espírita.",
    ]
      .filter((l): l is string => l !== null)
      .join("\n");

    await supabase.from("agenda_eventos").update({ ata: linhas }).eq("id", evento.id);
    fetchEventos();
  };

  // ── Excluir evento ──
  const handleExcluir = async (eventoId: string) => {
    if (!confirm("Excluir este evento? Esta ação não pode ser desfeita.")) return;
    await supabase.from("agenda_eventos").delete().eq("id", eventoId);
    if (expandedId === eventoId) setExpandedId(null);
    fetchEventos();
  };

  // ── Abrir edição ──
  const handleEditar = (evento: Evento) => {
    const toDate = (iso: string) => {
      const d = new Date(iso);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };
    const toTime = (iso: string) => {
      const d = new Date(iso);
      return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    };
    setFTitulo(evento.titulo);
    setFDescricao(evento.descricao ?? "");
    setFLocal(evento.local ?? "");
    setFDataInicio(toDate(evento.data_inicio));
    setFHoraInicio(toTime(evento.data_inicio));
    setFDataFim(evento.data_fim ? toDate(evento.data_fim) : "");
    setFHoraFim(evento.data_fim ? toTime(evento.data_fim) : "");
    setFTipo(evento.tipo);
    setFAceita(evento.aceita_confirmacao);
    setFConvidados([]);
    setEditingId(evento.id);
    setShowForm(true);
    setFormError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Salvar edição ──
  const handleUpdate = async () => {
    if (!fTitulo.trim()) {
      setFormError("Informe o título do evento.");
      return;
    }
    if (!fDataInicio || !fHoraInicio) {
      setFormError("Informe a data e hora de início.");
      return;
    }
    if (!fDataFim || !fHoraFim) {
      setFormError("Informe a data e hora de encerramento.");
      return;
    }
    const dataInicioISO = new Date(`${fDataInicio}T${fHoraInicio}`).toISOString();
    const dataFimISO = new Date(`${fDataFim}T${fHoraFim}`).toISOString();
    if (dataFimISO <= dataInicioISO) {
      setFormError("A data/hora de encerramento deve ser posterior ao início.");
      return;
    }
    if (!editingId) return;
    setSaving(true);
    setFormError("");
    try {
      const { error } = await supabase
        .from("agenda_eventos")
        .update({
          titulo: fTitulo.trim(),
          descricao: fDescricao.trim() || null,
          local: fLocal.trim() || null,
          data_inicio: dataInicioISO,
          data_fim: dataFimISO,
          tipo: fTipo,
          aceita_confirmacao: fAceita,
        })
        .eq("id", editingId);
      if (error) throw error;
      setFTitulo("");
      setFDescricao("");
      setFLocal("");
      setFDataInicio("");
      setFHoraInicio("");
      setFDataFim("");
      setFHoraFim("");
      setFTipo("aberto");
      setFAceita(true);
      setFConvidados([]);
      setEditingId(null);
      setShowForm(false);
      fetchEventos();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <main className="page-light min-h-screen pt-20 pb-28">
      <CasaHero eventos={proximos.length} />
      <div style={{ maxWidth: 860, margin: "0 auto" }} className="px-4 md:px-[44px] pt-12 pb-0">
        {/* Ações de seção */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <h2
            style={{
              fontFamily: '"Libre Caslon Text", Georgia, serif',
              fontSize: "1.5rem",
              fontWeight: 400,
              color: "#111418",
              margin: 0,
            }}
          >
            Eventos
          </h2>
          {podeGerenciar && (
            <button
              onClick={() => {
                setShowForm((v) => !v);
                setEditingId(null);
                setFormError("");
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 22px",
                borderRadius: 12,
                background: "#004a8c",
                color: "#fff",
                fontFamily: "Inter",
                fontSize: "0.88rem",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                boxShadow: "0 2px 10px rgba(0,74,140,.22)",
              }}
            >
              <Plus size={14} />
              {showForm ? "Cancelar" : "Novo Evento"}
            </button>
          )}
        </div>

        {/* ── Create form ── */}
        {showForm && (
          <div className="glass-premium rounded-3xl p-6 mb-8 space-y-4 border border-violet-200/40">
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground/60 font-bold">
              {editingId ? "Editar Evento" : "Novo Evento"}
            </h2>

            <input
              type="text"
              placeholder="Título do evento *"
              value={fTitulo}
              onChange={(e) => {
                setFTitulo(e.target.value);
                setFormError("");
              }}
              className="w-full rounded-xl bg-white border border-gray-200 px-4 py-3 text-sm text-foreground focus:outline-none focus:border-cyan-glow/40 transition-colors"
            />

            <textarea
              placeholder="Descrição (opcional)"
              value={fDescricao}
              onChange={(e) => setFDescricao(e.target.value)}
              rows={3}
              className="w-full rounded-xl bg-white border border-gray-200 px-4 py-3 text-sm text-foreground focus:outline-none focus:border-cyan-glow/40 transition-colors resize-none"
            />

            <input
              type="text"
              placeholder="Local (opcional)"
              value={fLocal}
              onChange={(e) => setFLocal(e.target.value)}
              className="w-full rounded-xl bg-white border border-gray-200 px-4 py-3 text-sm text-foreground focus:outline-none focus:border-cyan-glow/40 transition-colors"
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground/65 mb-1 font-semibold">
                  Data de início *
                </label>
                <input
                  type="date"
                  value={fDataInicio}
                  onChange={(e) => setFDataInicio(e.target.value)}
                  className="w-full rounded-xl bg-white border border-gray-200 px-4 py-3 text-sm text-foreground focus:outline-none focus:border-cyan-glow/40 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground/65 mb-1 font-semibold">
                  Hora de início *
                </label>
                <input
                  type="time"
                  value={fHoraInicio}
                  onChange={(e) => setFHoraInicio(e.target.value)}
                  className="w-full rounded-xl bg-white border border-gray-200 px-4 py-3 text-sm text-foreground focus:outline-none focus:border-cyan-glow/40 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground/65 mb-1 font-semibold">
                  Data de encerramento *
                </label>
                <input
                  type="date"
                  value={fDataFim}
                  onChange={(e) => setFDataFim(e.target.value)}
                  className="w-full rounded-xl bg-white border border-gray-200 px-4 py-3 text-sm text-foreground focus:outline-none focus:border-cyan-glow/40 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground/65 mb-1 font-semibold">
                  Hora de encerramento *
                </label>
                <input
                  type="time"
                  value={fHoraFim}
                  onChange={(e) => setFHoraFim(e.target.value)}
                  className="w-full rounded-xl bg-white border border-gray-200 px-4 py-3 text-sm text-foreground focus:outline-none focus:border-cyan-glow/40 transition-colors"
                />
              </div>
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground/65 mb-2 font-semibold">
                Quem pode participar
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setFTipo("aberto")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm transition-all duration-200 ${fTipo === "aberto" ? "border-emerald-400/60 text-emerald-600 bg-emerald-400/5 shadow-sm" : "border-gray-200 text-gray-400 hover:border-gray-300"}`}
                >
                  <Globe size={14} /> Todos os membros
                </button>
                <button
                  onClick={() => setFTipo("fechado")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm transition-all duration-200 ${fTipo === "fechado" ? "border-amber-400/60 text-amber-600 bg-amber-400/5 shadow-sm" : "border-gray-200 text-gray-400 hover:border-gray-300"}`}
                >
                  <Lock size={14} /> Somente convidados
                </button>
              </div>
            </div>

            {/* Confirmação */}
            <label className="flex items-center gap-3 cursor-pointer select-none py-1">
              <input
                type="checkbox"
                checked={fAceita}
                onChange={(e) => setFAceita(e.target.checked)}
                className="w-4 h-4 rounded accent-violet-600"
              />
              <span className="text-sm text-gray-700">
                Permitir que os membros confirmem presença
              </span>
            </label>

            {/* Convidados — evento fechado */}
            {fTipo === "fechado" && (
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground/65 mb-2 font-semibold font-semibold">
                  Selecionar convidados
                </label>
                <div className="max-h-52 overflow-y-auto rounded-xl border border-gray-200 bg-white p-3 space-y-1">
                  {membros.length === 0 ? (
                    <p className="text-xs text-muted-foreground/50 text-center py-3">
                      Nenhum outro membro cadastrado na sua casa.
                    </p>
                  ) : (
                    membros.map((m) => (
                      <label
                        key={m.id}
                        className="flex items-center gap-3 cursor-pointer py-1 hover:bg-gray-50 rounded-lg px-2 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={fConvidados.includes(m.id)}
                          onChange={(e) =>
                            setFConvidados((prev) =>
                              e.target.checked ? [...prev, m.id] : prev.filter((id) => id !== m.id),
                            )
                          }
                          className="w-4 h-4 rounded accent-violet-600"
                        />
                        <span className="text-sm text-gray-700">{m.nome}</span>
                        <span className="text-xs text-muted-foreground/50 ml-auto">
                          {m.cargo_principal}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}

            {formError && <p className="text-xs text-red-400 text-center">{formError}</p>}

            <button
              onClick={editingId ? handleUpdate : handleCreate}
              disabled={saving}
              className="w-full py-3 rounded-xl text-sm uppercase tracking-widest text-violet-700 border border-violet-glow/40 hover:bg-violet-glow/10 disabled:opacity-40 transition-colors font-bold mt-2"
            >
              {saving ? "Salvando…" : editingId ? "Salvar Alterações" : "Criar Evento"}
            </button>
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="flex gap-1 mb-8 bg-slate-100 border border-gray-250 rounded-2xl p-1 shadow-inner max-w-md mx-auto">
          {(["proximos", "passados", "presencas"] as const).map((val) => (
            <button
              key={val}
              onClick={() => setAba(val)}
              className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-300 cursor-pointer ${aba === val ? "bg-[#004a8c] text-white shadow-md border border-[#004a8c]/10" : "text-gray-500 hover:text-gray-900"}`}
            >
              {val === "proximos" ? "Próximos" : val === "passados" ? "Passados" : "Presenças"}
            </button>
          ))}
        </div>

        {/* ── Relatório de Presenças ── */}
        {aba === "presencas" &&
          (loadingEventos ? (
            <p className="text-sm text-muted-foreground/50 text-center py-16">Carregando…</p>
          ) : eventosComPresenca.length === 0 ? (
            <div className="text-center py-16">
              <CalendarDays size={40} className="mx-auto text-muted-foreground/20 mb-3" />
              <p className="text-sm text-muted-foreground/50">
                Nenhuma presença registrada ainda. Marque as presenças nos eventos passados.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground/50">
                Histórico de presenças — {eventosComPresenca.length} evento
                {eventosComPresenca.length !== 1 ? "s" : ""} com presença registrada
              </p>

              {/* Resumo por membro */}
              <div className="glass rounded-2xl overflow-hidden">
                <div className="px-5 py-3 border-b border-white/5">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground/50">
                    Por membro
                  </p>
                </div>
                <div className="divide-y divide-white/5">
                  {relatorioMembros.map((m) => (
                    <div key={m.nome} className="px-5 py-3 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{m.nome}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="w-24 bg-white/10 rounded-full h-1.5">
                          <div
                            className="bg-emerald-400 h-1.5 rounded-full transition-all"
                            style={{
                              width: `${Math.round((m.presencas / eventosComPresenca.length) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground/60 w-16 text-right">
                          {m.presencas}/{eventosComPresenca.length} evento
                          {eventosComPresenca.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Histórico por evento */}
              <div className="glass rounded-2xl overflow-hidden">
                <div className="px-5 py-3 border-b border-white/5">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground/50">
                    Por evento
                  </p>
                </div>
                <div className="divide-y divide-white/5">
                  {eventosComPresenca.map((ev) => {
                    const presentes = ev.agenda_participantes.filter((p) => p.presente);
                    return (
                      <div key={ev.id} className="px-5 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm text-foreground truncate">{ev.titulo}</p>
                            <p className="text-xs text-muted-foreground/50 mt-0.5">
                              {fmtData(ev.data_inicio)}
                            </p>
                          </div>
                          <span className="shrink-0 text-xs font-medium text-emerald-600 bg-emerald-400/10 px-2.5 py-1 rounded-full">
                            {presentes.length} presente{presentes.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                        {presentes.length > 0 && (
                          <p className="text-xs text-muted-foreground/40 mt-1.5 leading-relaxed">
                            {presentes.map((p) => p.profiles?.nome ?? "Membro").join(" · ")}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}

        {aba !== "presencas" && (
          <WisdomBlock
            texto='"Fora da caridade não há salvação."'
            autor="Allan Kardec — O Evangelho Segundo o Espiritismo"
          />
        )}

        {/* ── Event list ── */}
        {aba !== "presencas" && loadingEventos ? (
          <p className="text-sm text-muted-foreground/50 text-center py-16">Carregando eventos…</p>
        ) : aba !== "presencas" && lista.length === 0 ? (
          <div className="text-center py-16">
            <CalendarDays size={40} className="mx-auto text-muted-foreground/20 mb-3" />
            <p className="text-sm text-muted-foreground/50">
              {aba === "proximos" ? "Nenhum evento agendado." : "Nenhum evento encerrado."}
            </p>
            {podeGerenciar && aba === "proximos" && (
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 text-xs text-cyan-glow/70 hover:text-cyan-glow transition-colors"
              >
                + Criar o primeiro evento
              </button>
            )}
          </div>
        ) : aba !== "presencas" ? (
          <div className="space-y-3">
            {lista.map((evento) => (
              <EventoCard
                key={evento.id}
                evento={evento}
                userId={user.id}
                podeGerenciar={podeGerenciar}
                expanded={expandedId === evento.id}
                onToggle={() => setExpandedId((id) => (id === evento.id ? null : evento.id))}
                onConfirmar={() => handleConfirmar(evento.id)}
                onResponder={handleResponder}
                onPresenca={handlePresenca}
                onGerarAta={() => handleGerarAta(evento)}
                onEditar={() => handleEditar(evento)}
                onExcluir={() => handleExcluir(evento.id)}
              />
            ))}
          </div>
        ) : null}
      </div>
    </main>
  );
}

// ── EventoCard ─────────────────────────────────────────────────────────────

interface EventoCardProps {
  evento: Evento;
  userId: string;
  podeGerenciar: boolean;
  expanded: boolean;
  onToggle: () => void;
  onConfirmar: () => void;
  onResponder: (id: string, confirmado: boolean) => void;
  onPresenca: (id: string, presente: boolean) => void;
  onGerarAta: () => void;
  onEditar: () => void;
  onExcluir: () => void;
}

function EventoCard({
  evento,
  userId,
  podeGerenciar,
  expanded,
  onToggle,
  onConfirmar,
  onResponder,
  onPresenca,
  onGerarAta,
  onEditar,
  onExcluir,
}: EventoCardProps) {
  const past = isPassado(evento.data_fim ?? evento.data_inicio);
  const isCriador = evento.criador_id === userId;
  const minha = evento.agenda_participantes.find((p) => p.user_id === userId);
  const totalConfirmados = evento.agenda_participantes.filter((p) => p.confirmado === true).length;

  const chipClass =
    minha?.confirmado === true
      ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
      : minha?.confirmado === false
        ? "bg-red-50 text-red-500 border border-red-200"
        : "bg-amber-50 text-amber-600 border border-amber-200";
  const chipLabel =
    minha?.confirmado === true
      ? "Confirmado"
      : minha?.confirmado === false
        ? "Recusou"
        : "Aguardando resposta";

  return (
    <div
      style={{
        background: "#ffffff",
        border: expanded ? "1px solid rgba(0, 40, 100, 0.25)" : "1px solid rgba(0, 40, 100, 0.15)",
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: expanded
          ? "0 6px 20px rgba(0, 20, 70, 0.08), 0 2px 6px rgba(0, 20, 70, 0.04)"
          : "0 2px 8px rgba(0, 20, 70, 0.04)",
        transition: "box-shadow .3s, border-color .3s",
        marginBottom: 12,
      }}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-start gap-4 text-left hover:bg-gray-50/50 transition-colors"
      >
        {/* Date badge */}
        <div
          style={{
            flexShrink: 0,
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "rgba(0,74,140,.07)",
            border: "1px solid rgba(0,74,140,.12)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            paddingTop: 2,
          }}
        >
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "1.2rem",
              fontWeight: 700,
              color: "#004a8c",
              lineHeight: 1,
              fontVariantNumeric: "lining-nums",
            }}
          >
            {new Date(evento.data_inicio).getDate().toString().padStart(2, "0")}
          </p>
          <p
            style={{
              fontFamily: "Inter",
              fontSize: "0.55rem",
              fontWeight: 700,
              color: "#1863a8",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginTop: 2,
            }}
          >
            {new Date(evento.data_inicio).toLocaleDateString("pt-BR", { month: "short" })}
          </p>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-gray-800 leading-snug">{evento.titulo}</p>
            {evento.tipo === "fechado" ? (
              <Lock size={11} className="text-amber-500 shrink-0" />
            ) : (
              <Globe size={11} className="text-emerald-500 shrink-0" />
            )}
          </div>

          <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-muted-foreground/60">
            <span className="flex items-center gap-1">
              <Clock size={10} />
              {fmtHora(evento.data_inicio)}
            </span>
            {evento.local && (
              <span className="flex items-center gap-1">
                <MapPin size={10} />
                {evento.local}
              </span>
            )}
            {totalConfirmados > 0 && (
              <span className="flex items-center gap-1">
                <UserCheck size={10} />
                {totalConfirmados} confirmados
              </span>
            )}
          </div>

          {minha && (
            <span
              className={`inline-block mt-2 text-[10px] font-semibold uppercase tracking-widest px-2.5 py-0.5 rounded-full ${chipClass}`}
            >
              {chipLabel}
            </span>
          )}
        </div>

        {expanded ? (
          <ChevronUp size={15} className="text-gray-400 shrink-0 mt-1" />
        ) : (
          <ChevronDown size={15} className="text-gray-400 shrink-0 mt-1" />
        )}
      </button>

      {/* Detail */}
      {expanded && (
        <div className="border-t border-gray-100 px-5 pb-5 pt-4 space-y-5 bg-white/30">
          {/* Info */}
          <div className="text-sm space-y-1">
            <p className="text-muted-foreground/75 font-medium capitalize">
              {fmtData(evento.data_inicio)}
            </p>
            {evento.data_fim && (
              <p className="text-muted-foreground/75 font-medium">
                Encerramento: {fmtHora(evento.data_fim)}
              </p>
            )}
            {evento.descricao && (
              <p className="text-gray-700 mt-2.5 leading-relaxed font-light">{evento.descricao}</p>
            )}
            <p className="text-xs text-gray-400 pt-1 font-light">
              Organizado por {evento.criador_nome}
            </p>
          </div>

          {/* ── Actions: confirm / respond ── */}
          {!past && evento.aceita_confirmacao && !isCriador && (
            <div>
              {/* Open event — self-register */}
              {evento.tipo === "aberto" && !minha && (
                <button
                  onClick={onConfirmar}
                  className="w-full py-2.5 rounded-xl border border-emerald-400/40 text-emerald-600 text-xs font-bold uppercase tracking-widest hover:bg-emerald-400/10 transition-colors flex items-center justify-center gap-2 bg-white shadow-sm"
                >
                  <Check size={13} strokeWidth={2.5} /> Confirmar Presença
                </button>
              )}
              {evento.tipo === "aberto" && minha?.confirmado === true && (
                <p className="text-center text-xs font-medium text-emerald-600 py-1">
                  Você confirmou presença neste evento.
                </p>
              )}

              {/* Closed event — respond to invite */}
              {evento.tipo === "fechado" && minha && minha.confirmado === null && (
                <div className="flex gap-3">
                  <button
                    onClick={() => onResponder(minha.id, true)}
                    className="flex-1 py-2.5 rounded-xl border border-emerald-400/40 text-emerald-600 text-xs font-bold uppercase tracking-widest hover:bg-emerald-400/10 transition-colors flex items-center justify-center gap-2 bg-white shadow-sm"
                  >
                    <Check size={13} strokeWidth={2.5} /> Confirmar
                  </button>
                  <button
                    onClick={() => onResponder(minha.id, false)}
                    className="flex-1 py-2.5 rounded-xl border border-red-400/40 text-red-500 text-xs font-bold uppercase tracking-widest hover:bg-red-400/10 transition-colors flex items-center justify-center gap-2 bg-white shadow-sm"
                  >
                    <X size={13} strokeWidth={2.5} /> Recusar
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Participant list ── */}
          {evento.agenda_participantes.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground/60 font-bold mb-3">
                Participantes ({evento.agenda_participantes.length})
              </p>
              <div className="space-y-2.5">
                {evento.agenda_participantes.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          p.presente
                            ? "bg-emerald-500 shadow-sm shadow-emerald-200"
                            : p.confirmado === true
                              ? "bg-cyan-500 shadow-sm shadow-cyan-200"
                              : p.confirmado === false
                                ? "bg-red-500 shadow-sm shadow-red-200"
                                : "bg-gray-300"
                        }`}
                      />
                      <span className="text-sm font-medium text-gray-700 truncate">
                        {p.profiles?.nome ?? "—"}
                      </span>
                      <span className="text-xs text-muted-foreground/50 hidden sm:inline truncate">
                        {p.profiles?.cargo_principal}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-gray-500">
                        {p.presente
                          ? "Presente"
                          : p.confirmado === true
                            ? "Confirmado"
                            : p.confirmado === false
                              ? "Recusou"
                              : "Pendente"}
                      </span>
                      {/* Marcar/desmarcar presença — só o criador */}
                      {isCriador && (
                        <button
                          onClick={() => onPresenca(p.id, !p.presente)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors bg-white ${
                            p.presente
                              ? "border-emerald-400/50 text-emerald-600 hover:bg-emerald-50"
                              : "border-gray-200 text-gray-400 hover:border-emerald-400/40 hover:text-emerald-600"
                          }`}
                        >
                          {p.presente ? "Desmarcar" : "Marcar"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Creator actions ── */}
          {isCriador && (
            <div className="flex gap-3 pt-3.5 border-t border-gray-100">
              {past && (
                <button
                  onClick={onGerarAta}
                  className="flex-1 py-2.5 rounded-xl border border-[#004a8c]/30 text-[#004a8c] text-xs font-bold uppercase tracking-widest hover:bg-[#ebf0f9] transition-colors flex items-center justify-center gap-2 bg-white shadow-sm"
                >
                  <FileText size={13} />
                  {evento.ata ? "Atualizar Ata" : "Gerar Ata"}
                </button>
              )}
              <button
                onClick={onEditar}
                className="py-2.5 px-4 rounded-xl border border-gray-200 text-gray-500 text-xs hover:bg-gray-50 hover:text-gray-800 transition-colors flex items-center gap-1.5 bg-white shadow-sm"
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={onExcluir}
                className="py-2.5 px-4 rounded-xl border border-red-100 text-red-500 text-xs hover:bg-red-50 hover:border-red-200 transition-colors flex items-center gap-1.5 bg-white shadow-sm"
              >
                <Trash2 size={13} />
              </button>
            </div>
          )}

          {/* ── Ata ── */}
          {evento.ata && (
            <div className="bg-white/70 border border-gray-100 rounded-xl p-4 shadow-inner">
              <p className="text-xs uppercase tracking-widest text-muted-foreground/60 font-bold mb-3 flex items-center gap-1.5">
                <FileText size={11} className="text-violet-600" /> Ata da Reunião
              </p>
              <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                {evento.ata}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
