import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  CalendarDays, Plus, Clock, MapPin, Globe, Lock,
  Check, X, ChevronDown, ChevronUp, FileText, UserCheck, Trash2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/agenda")({
  component: AgendaPage,
});

// Cargos que podem criar e gerenciar eventos
const CARGOS_DECISORES = [
  "Presidente", "Vice-presidente", "Coordenador", "Diretoria",
  "Dirigente", "Dirigente de reunião mediúnica", "DEV",
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
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
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
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const podeGerenciar = CARGOS_DECISORES.includes(profile?.cargo_principal ?? "");

  // ── Auth ──
  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
    if (!loading && user && (!profile?.sigla_casa || !profile?.nome)) navigate({ to: "/completar-perfil" });
  }, [user, profile, loading, navigate]);

  // ── Fetch ──
  const fetchEventos = async () => {
    setLoadingEventos(true);
    const { data } = await supabase
      .from("agenda_eventos")
      .select("*, agenda_participantes(id, evento_id, user_id, confirmado, presente, profiles(nome, cargo_principal))")
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
  const eventosComPresenca = eventos.filter((e) =>
    e.agenda_participantes.some((p) => p.presente)
  );
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
    if (!fTitulo.trim()) { setFormError("Informe o título do evento."); return; }
    if (!fDataInicio || !fHoraInicio) { setFormError("Informe a data e hora de início."); return; }
    if (!profile?.sigla_casa || !user) return;
    setSaving(true);
    setFormError("");

    const dataInicioISO = new Date(`${fDataInicio}T${fHoraInicio}`).toISOString();
    const dataFimISO = fDataFim && fHoraFim ? new Date(`${fDataFim}T${fHoraFim}`).toISOString() : null;

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
        evento_id: novo.id, user_id: user.id, confirmado: true,
      });

      // Convidar participantes (evento fechado)
      if (fTipo === "fechado" && fConvidados.length > 0) {
        await supabase.from("agenda_participantes").insert(
          fConvidados.map((uid) => ({ evento_id: novo.id, user_id: uid, confirmado: null }))
        );
        supabase.functions.invoke("send-notification", {
          body: { type: "convite_agenda", data: { titulo: fTitulo.trim(), data: dataInicioISO, user_ids: fConvidados } },
        });
      }

      // Reset
      setFTitulo(""); setFDescricao(""); setFLocal("");
      setFDataInicio(""); setFHoraInicio(""); setFDataFim(""); setFHoraFim("");
      setFTipo("aberto"); setFAceita(true); setFConvidados([]);
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
    await supabase.from("agenda_participantes").upsert(
      { evento_id: eventoId, user_id: user.id, confirmado: true },
      { onConflict: "evento_id,user_id" }
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
    ].filter((l): l is string => l !== null).join("\n");

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

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <main className="page-light min-h-screen px-4 pt-20 pb-20">
      <div className="mx-auto max-w-3xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-glow mb-1">Agenda</p>
            <h1 className="text-3xl font-light text-foreground">
              Casa {profile?.sigla_casa}
            </h1>
          </div>
          {podeGerenciar && (
            <button
              onClick={() => { setShowForm((v) => !v); setFormError(""); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-cyan-glow/40 text-cyan-glow text-xs uppercase tracking-widest hover:bg-cyan-glow/10 transition-colors"
            >
              <Plus size={14} />
              {showForm ? "Cancelar" : "Novo Evento"}
            </button>
          )}
        </div>

        {/* ── Create form ── */}
        {showForm && (
          <div className="glass rounded-3xl p-6 mb-8 space-y-4">
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground/60">Novo Evento</h2>

            <input
              type="text" placeholder="Título do evento *"
              value={fTitulo} onChange={(e) => { setFTitulo(e.target.value); setFormError(""); }}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-cyan-glow/40 transition-colors"
            />

            <textarea
              placeholder="Descrição (opcional)"
              value={fDescricao} onChange={(e) => setFDescricao(e.target.value)}
              rows={3}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-cyan-glow/40 transition-colors resize-none"
            />

            <input
              type="text" placeholder="Local (opcional)"
              value={fLocal} onChange={(e) => setFLocal(e.target.value)}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-cyan-glow/40 transition-colors"
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground/60 mb-1">Data de início *</label>
                <input type="date" value={fDataInicio} onChange={(e) => setFDataInicio(e.target.value)}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-foreground focus:outline-none focus:border-cyan-glow/40 transition-colors" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground/60 mb-1">Hora de início *</label>
                <input type="time" value={fHoraInicio} onChange={(e) => setFHoraInicio(e.target.value)}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-foreground focus:outline-none focus:border-cyan-glow/40 transition-colors" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground/60 mb-1">Data de encerramento</label>
                <input type="date" value={fDataFim} onChange={(e) => setFDataFim(e.target.value)}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-foreground focus:outline-none focus:border-cyan-glow/40 transition-colors" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground/60 mb-1">Hora de encerramento</label>
                <input type="time" value={fHoraFim} onChange={(e) => setFHoraFim(e.target.value)}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-foreground focus:outline-none focus:border-cyan-glow/40 transition-colors" />
              </div>
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground/60 mb-2">Quem pode participar</label>
              <div className="flex gap-3">
                <button onClick={() => setFTipo("aberto")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm transition-colors ${fTipo === "aberto" ? "border-emerald-400/60 text-emerald-600 bg-emerald-400/5" : "border-white/10 text-muted-foreground hover:border-white/20"}`}>
                  <Globe size={14} /> Todos os membros
                </button>
                <button onClick={() => setFTipo("fechado")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm transition-colors ${fTipo === "fechado" ? "border-amber-400/60 text-amber-600 bg-amber-400/5" : "border-white/10 text-muted-foreground hover:border-white/20"}`}>
                  <Lock size={14} /> Somente convidados
                </button>
              </div>
            </div>

            {/* Confirmação */}
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input type="checkbox" checked={fAceita} onChange={(e) => setFAceita(e.target.checked)}
                className="w-4 h-4 rounded accent-cyan-600" />
              <span className="text-sm text-foreground">Permitir que os membros confirmem presença</span>
            </label>

            {/* Convidados — evento fechado */}
            {fTipo === "fechado" && (
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground/60 mb-2">
                  Selecionar convidados
                </label>
                <div className="max-h-52 overflow-y-auto rounded-xl border border-white/10 p-3 space-y-1">
                  {membros.length === 0
                    ? <p className="text-xs text-muted-foreground/50 text-center py-3">Nenhum outro membro cadastrado na sua casa.</p>
                    : membros.map((m) => (
                        <label key={m.id} className="flex items-center gap-3 cursor-pointer py-1">
                          <input type="checkbox"
                            checked={fConvidados.includes(m.id)}
                            onChange={(e) => setFConvidados((prev) => e.target.checked ? [...prev, m.id] : prev.filter((id) => id !== m.id))}
                            className="w-4 h-4 rounded accent-cyan-600"
                          />
                          <span className="text-sm text-foreground">{m.nome}</span>
                          <span className="text-xs text-muted-foreground/50">{m.cargo_principal}</span>
                        </label>
                      ))
                  }
                </div>
              </div>
            )}

            {formError && <p className="text-xs text-red-400 text-center">{formError}</p>}

            <button onClick={handleCreate} disabled={saving}
              className="w-full py-3 rounded-xl text-sm uppercase tracking-widest text-cyan-glow border border-cyan-glow/40 hover:bg-cyan-glow/10 disabled:opacity-40 transition-colors">
              {saving ? "Criando…" : "Criar Evento"}
            </button>
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="flex gap-1 mb-6 bg-white/5 rounded-xl p-1">
          {(["proximos", "passados", "presencas"] as const).map((val) => (
            <button key={val} onClick={() => setAba(val)}
              className={`flex-1 py-2 text-xs uppercase tracking-widest rounded-lg transition-colors ${aba === val ? "bg-white text-gray-800 shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"}`}>
              {val === "proximos" ? "Próximos" : val === "passados" ? "Passados" : "Presenças"}
            </button>
          ))}
        </div>

        {/* ── Relatório de Presenças ── */}
        {aba === "presencas" && (
          loadingEventos ? (
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
                Histórico de presenças — {eventosComPresenca.length} evento{eventosComPresenca.length !== 1 ? "s" : ""} com presença registrada
              </p>

              {/* Resumo por membro */}
              <div className="glass rounded-2xl overflow-hidden">
                <div className="px-5 py-3 border-b border-white/5">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground/50">Por membro</p>
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
                            style={{ width: `${Math.round((m.presencas / eventosComPresenca.length) * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground/60 w-16 text-right">
                          {m.presencas}/{eventosComPresenca.length} evento{eventosComPresenca.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Histórico por evento */}
              <div className="glass rounded-2xl overflow-hidden">
                <div className="px-5 py-3 border-b border-white/5">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground/50">Por evento</p>
                </div>
                <div className="divide-y divide-white/5">
                  {eventosComPresenca.map((ev) => {
                    const presentes = ev.agenda_participantes.filter((p) => p.presente);
                    return (
                      <div key={ev.id} className="px-5 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm text-foreground truncate">{ev.titulo}</p>
                            <p className="text-xs text-muted-foreground/50 mt-0.5">{fmtData(ev.data_inicio)}</p>
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
          )
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
              <button onClick={() => setShowForm(true)}
                className="mt-4 text-xs text-cyan-glow/70 hover:text-cyan-glow transition-colors">
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
                onToggle={() => setExpandedId((id) => id === evento.id ? null : evento.id)}
                onConfirmar={() => handleConfirmar(evento.id)}
                onResponder={handleResponder}
                onPresenca={handlePresenca}
                onGerarAta={() => handleGerarAta(evento)}
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
  onExcluir: () => void;
}

function EventoCard({ evento, userId, podeGerenciar, expanded, onToggle, onConfirmar, onResponder, onPresenca, onGerarAta, onExcluir }: EventoCardProps) {
  const past = isPassado(evento.data_fim ?? evento.data_inicio);
  const isCriador = evento.criador_id === userId;
  const minha = evento.agenda_participantes.find((p) => p.user_id === userId);
  const totalConfirmados = evento.agenda_participantes.filter((p) => p.confirmado === true).length;

  const chipClass =
    minha?.confirmado === true ? "bg-emerald-400/10 text-emerald-600" :
    minha?.confirmado === false ? "bg-red-400/10 text-red-500" :
    "bg-amber-400/10 text-amber-600";
  const chipLabel =
    minha?.confirmado === true ? "Confirmado" :
    minha?.confirmado === false ? "Recusou" : "Aguardando resposta";

  return (
    <div className="glass rounded-2xl overflow-hidden">

      {/* Header */}
      <button onClick={onToggle}
        className="w-full px-5 py-4 flex items-start gap-4 text-left hover:bg-white/5 transition-colors">

        {/* Date badge */}
        <div className="shrink-0 w-11 text-center pt-0.5">
          <p className="text-2xl font-light text-foreground leading-none">
            {new Date(evento.data_inicio).getDate().toString().padStart(2, "0")}
          </p>
          <p className="text-xs text-muted-foreground/50 uppercase tracking-wide">
            {new Date(evento.data_inicio).toLocaleDateString("pt-BR", { month: "short" })}
          </p>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-foreground leading-snug">{evento.titulo}</p>
            {evento.tipo === "fechado"
              ? <Lock size={11} className="text-amber-500 shrink-0" />
              : <Globe size={11} className="text-emerald-500 shrink-0" />
            }
          </div>

          <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-muted-foreground/60">
            <span className="flex items-center gap-1"><Clock size={10} />{fmtHora(evento.data_inicio)}</span>
            {evento.local && <span className="flex items-center gap-1"><MapPin size={10} />{evento.local}</span>}
            {totalConfirmados > 0 && <span className="flex items-center gap-1"><UserCheck size={10} />{totalConfirmados}</span>}
          </div>

          {minha && (
            <span className={`inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full ${chipClass}`}>
              {chipLabel}
            </span>
          )}
        </div>

        {expanded
          ? <ChevronUp size={15} className="text-muted-foreground/30 shrink-0 mt-1" />
          : <ChevronDown size={15} className="text-muted-foreground/30 shrink-0 mt-1" />
        }
      </button>

      {/* Detail */}
      {expanded && (
        <div className="border-t border-white/5 px-5 pb-5 pt-4 space-y-5">

          {/* Info */}
          <div className="text-sm space-y-1">
            <p className="text-muted-foreground/70 capitalize">{fmtData(evento.data_inicio)}</p>
            {evento.data_fim && (
              <p className="text-muted-foreground/70">
                Encerramento: {fmtHora(evento.data_fim)}
              </p>
            )}
            {evento.descricao && (
              <p className="text-foreground/80 mt-2 leading-relaxed">{evento.descricao}</p>
            )}
            <p className="text-xs text-muted-foreground/40 pt-1">
              Organizado por {evento.criador_nome}
            </p>
          </div>

          {/* ── Actions: confirm / respond ── */}
          {!past && evento.aceita_confirmacao && !isCriador && (
            <div>
              {/* Open event — self-register */}
              {evento.tipo === "aberto" && !minha && (
                <button onClick={onConfirmar}
                  className="w-full py-2.5 rounded-xl border border-emerald-400/40 text-emerald-600 text-xs uppercase tracking-widest hover:bg-emerald-400/10 transition-colors flex items-center justify-center gap-2">
                  <Check size={13} /> Confirmar Presença
                </button>
              )}
              {evento.tipo === "aberto" && minha?.confirmado === true && (
                <p className="text-center text-xs text-emerald-600 py-1">Você confirmou presença neste evento.</p>
              )}

              {/* Closed event — respond to invite */}
              {evento.tipo === "fechado" && minha && minha.confirmado === null && (
                <div className="flex gap-3">
                  <button onClick={() => onResponder(minha.id, true)}
                    className="flex-1 py-2.5 rounded-xl border border-emerald-400/40 text-emerald-600 text-xs uppercase tracking-widest hover:bg-emerald-400/10 transition-colors flex items-center justify-center gap-2">
                    <Check size={13} /> Confirmar
                  </button>
                  <button onClick={() => onResponder(minha.id, false)}
                    className="flex-1 py-2.5 rounded-xl border border-red-400/40 text-red-500 text-xs uppercase tracking-widest hover:bg-red-400/10 transition-colors flex items-center justify-center gap-2">
                    <X size={13} /> Recusar
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Participant list ── */}
          {evento.agenda_participantes.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground/50 mb-3">
                Participantes ({evento.agenda_participantes.length})
              </p>
              <div className="space-y-2.5">
                {evento.agenda_participantes.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        p.presente ? "bg-emerald-400" :
                        p.confirmado === true ? "bg-cyan-400" :
                        p.confirmado === false ? "bg-red-400" : "bg-gray-300"
                      }`} />
                      <span className="text-sm text-foreground truncate">{p.profiles?.nome ?? "—"}</span>
                      <span className="text-xs text-muted-foreground/40 hidden sm:inline truncate">{p.profiles?.cargo_principal}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground/50">
                        {p.presente ? "Presente" :
                         p.confirmado === true ? "Confirmado" :
                         p.confirmado === false ? "Recusou" : "Pendente"}
                      </span>
                      {/* Marcar/desmarcar presença — só o criador */}
                      {isCriador && (
                        <button onClick={() => onPresenca(p.id, !p.presente)}
                          className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                            p.presente
                              ? "border-emerald-400/50 text-emerald-600 bg-emerald-400/5 hover:bg-emerald-400/10"
                              : "border-white/10 text-muted-foreground/40 hover:border-emerald-400/40 hover:text-emerald-600"
                          }`}>
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
            <div className="flex gap-3 pt-3 border-t border-white/5">
              {past && (
                <button onClick={onGerarAta}
                  className="flex-1 py-2.5 rounded-xl border border-cyan-glow/40 text-cyan-glow text-xs uppercase tracking-widest hover:bg-cyan-glow/10 transition-colors flex items-center justify-center gap-2">
                  <FileText size={13} />
                  {evento.ata ? "Atualizar Ata" : "Gerar Ata"}
                </button>
              )}
              <button onClick={onExcluir}
                className="py-2.5 px-4 rounded-xl border border-red-400/20 text-red-400/50 text-xs hover:bg-red-400/10 hover:text-red-400 hover:border-red-400/40 transition-colors flex items-center gap-1.5">
                <Trash2 size={13} />
              </button>
            </div>
          )}

          {/* ── Ata ── */}
          {evento.ata && (
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground/50 mb-3 flex items-center gap-1.5">
                <FileText size={11} /> Ata da Reunião
              </p>
              <pre className="text-xs text-foreground/70 whitespace-pre-wrap font-sans leading-relaxed">{evento.ata}</pre>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
