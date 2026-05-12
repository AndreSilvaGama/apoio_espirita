import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/mensagem-do-dia")({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: (search.tab === "fila" ? "fila" : "enviar") as Tab,
  }),
  component: MensagemDoDia,
});

type Tab = "enviar" | "fila";

interface MensagemDB {
  id: string;
  texto: string;
  referencia: string | null;
  autor_nome: string;
  sigla_casa: string | null;
  data_exibicao: string | null;
  created_at: string;
}

const schema = z.object({
  texto: z.string().trim().min(10, "A mensagem deve ter pelo menos 10 caracteres").max(1000),
  referencia: z.string().trim().max(500).optional(),
});

async function scheduleQueue() {
  const today = new Date().toISOString().slice(0, 10);

  const { data: all } = await supabase
    .from("mensagens_do_dia")
    .select("id, sigla_casa, data_exibicao")
    .eq("aprovada", true)
    .order("data_exibicao", { ascending: true, nullsFirst: false });

  if (!all) return;

  const scheduled = all.filter((m) => m.data_exibicao);
  const unscheduled = all.filter((m) => !m.data_exibicao);

  if (unscheduled.length === 0) return;

  const occupied = new Set(scheduled.map((m) => m.data_exibicao!));
  const dateToCasa: Record<string, string | null> = {};
  for (const m of scheduled) dateToCasa[m.data_exibicao!] = m.sigla_casa;

  // Começa a partir do dia seguinte ao último agendado no futuro, ou hoje
  let cursor = new Date(today + "T12:00:00Z");
  const futureScheduled = scheduled.filter((m) => m.data_exibicao! >= today);
  if (futureScheduled.length > 0) {
    cursor = new Date(futureScheduled[futureScheduled.length - 1].data_exibicao! + "T12:00:00Z");
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  const remaining = [...unscheduled];
  const updates: { id: string; data_exibicao: string }[] = [];
  const newDateToCasa: Record<string, string | null> = { ...dateToCasa };

  while (remaining.length > 0) {
    const dateStr = cursor.toISOString().slice(0, 10);

    if (!occupied.has(dateStr)) {
      const prev = new Date(cursor);
      prev.setUTCDate(prev.getUTCDate() - 1);
      const prevStr = prev.toISOString().slice(0, 10);
      const prevCasa = newDateToCasa[prevStr] ?? null;

      // Prefere mensagem de casa diferente da véspera
      let idx = prevCasa ? remaining.findIndex((m) => m.sigla_casa !== prevCasa) : 0;
      if (idx < 0) idx = 0;

      const candidate = remaining.splice(idx, 1)[0];
      updates.push({ id: candidate.id, data_exibicao: dateStr });
      newDateToCasa[dateStr] = candidate.sigla_casa;
      occupied.add(dateStr);
    }

    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  await Promise.all(
    updates.map(({ id, data_exibicao }) =>
      supabase.from("mensagens_do_dia").update({ data_exibicao }).eq("id", id)
    )
  );
}

function MensagemDoDia() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const { tab: initialTab } = Route.useSearch();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [form, setForm] = useState({ texto: "", referencia: "" });
  const [submitStatus, setSubmitStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [mensagens, setMensagens] = useState<MensagemDB[]>([]);
  const [filaLoading, setFilaLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (tab === "fila" && user) loadFila();
  }, [tab, user]);

  async function loadFila() {
    setFilaLoading(true);
    await scheduleQueue();
    const { data } = await supabase
      .from("mensagens_do_dia")
      .select("id, texto, referencia, autor_nome, sigla_casa, data_exibicao, created_at")
      .eq("aprovada", true)
      .order("data_exibicao", { ascending: true, nullsFirst: false });
    setMensagens(data ?? []);
    setFilaLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }
    if (!user || !profile) return;
    setSubmitStatus("loading");
    const { error: dbError } = await supabase.from("mensagens_do_dia").insert({
      texto: parsed.data.texto,
      referencia: parsed.data.referencia || null,
      autor_id: user.id,
      autor_nome: profile.nome ?? user.email ?? "Anônimo",
      sigla_casa: profile.sigla_casa,
    });
    if (dbError) {
      setSubmitStatus("error");
      setError("Não foi possível enviar. Tente novamente.");
      return;
    }
    await scheduleQueue();
    setSubmitStatus("success");
    setForm({ texto: "", referencia: "" });
  }

  if (loading || !user) return null;

  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="page-light min-h-screen px-6 py-24">
      <div className="mx-auto max-w-2xl">
        <Link
          to="/inicio"
          className="text-xs uppercase tracking-[0.3em] text-cyan-glow hover:text-foreground transition-colors"
        >
          ← Início
        </Link>

        <div className="mt-8 text-center mb-10">
          <p className="text-xs uppercase tracking-[0.4em] text-cyan-glow mb-4">Comunidade</p>
          <h1 className="text-4xl font-light text-foreground">
            Mensagem do{" "}
            <span className="text-gradient-aurora font-medium">Dia</span>
          </h1>
          <p className="mt-4 text-muted-foreground font-light max-w-lg mx-auto">
            Compartilhe uma mensagem edificante. Ela entrará na fila e será exibida para toda a
            comunidade no dia agendado — somente uma mensagem por dia.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-2xl overflow-hidden border border-border mb-8">
          {(["enviar", "fila"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-xs uppercase tracking-widest transition-colors ${
                tab === t
                  ? "bg-cyan-glow/10 text-cyan-glow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "enviar" ? "Enviar mensagem" : "Ver fila"}
            </button>
          ))}
        </div>

        {/* ── Aba: Enviar ── */}
        {tab === "enviar" && (
          submitStatus === "success" ? (
            <div className="glass rounded-3xl p-10 text-center">
              <div
                className="text-4xl text-cyan-glow mb-4"
                style={{ textShadow: "0 0 20px currentColor" }}
              >
                ✦
              </div>
              <h2 className="text-2xl font-medium text-foreground mb-3">Mensagem recebida</h2>
              <p className="text-muted-foreground font-light">
                Sua mensagem foi agendada na fila e será exibida à comunidade no dia marcado.
              </p>
              <div className="mt-8 flex justify-center gap-6">
                <button
                  onClick={() => setSubmitStatus("idle")}
                  className="text-sm uppercase tracking-widest text-cyan-glow hover:text-foreground transition-colors"
                >
                  Enviar outra
                </button>
                <button
                  onClick={() => setTab("fila")}
                  className="text-sm uppercase tracking-widest text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                >
                  Ver fila
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="glass rounded-3xl p-8 md:p-10 space-y-6">
              {/* Remetente */}
              <div className="flex items-center gap-3 pb-5 border-b border-border/40">
                <div className="w-9 h-9 rounded-full bg-violet-100 border border-violet-200 flex items-center justify-center text-sm font-medium text-violet-600">
                  {profile?.nome?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{profile?.nome}</p>
                  <p className="text-xs text-muted-foreground/60 uppercase tracking-widest">
                    {profile?.sigla_casa}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-[0.3em] text-cyan-glow mb-3">
                  Mensagem{" "}
                  <span className="text-muted-foreground/40 normal-case tracking-normal text-[10px]">
                    (10 a 1000 caracteres)
                  </span>
                </label>
                <textarea
                  value={form.texto}
                  onChange={(e) => setForm({ ...form, texto: e.target.value })}
                  rows={6}
                  maxLength={1000}
                  required
                  placeholder="Digite a mensagem que deseja compartilhar com a comunidade…"
                  className="w-full bg-transparent border-b border-border/60 text-foreground py-3 focus:outline-none focus:border-cyan-glow transition-colors font-light resize-none placeholder-muted-foreground/40"
                />
                <p className="mt-1 text-right text-[10px] text-muted-foreground/40">
                  {form.texto.length}/1000
                </p>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-[0.3em] text-cyan-glow mb-3">
                  Referência{" "}
                  <span className="text-muted-foreground/40 normal-case tracking-normal text-[10px]">
                    (opcional — livro, capítulo, autor…)
                  </span>
                </label>
                <input
                  type="text"
                  value={form.referencia}
                  onChange={(e) => setForm({ ...form, referencia: e.target.value })}
                  maxLength={500}
                  placeholder="Ex.: O Livro dos Espíritos · Q. 886 · Allan Kardec"
                  className="w-full bg-transparent border-b border-border/60 text-foreground py-3 focus:outline-none focus:border-cyan-glow transition-colors font-light placeholder-muted-foreground/40"
                />
              </div>

              {error && <p className="text-sm text-red-400 font-light">{error}</p>}

              <button
                type="submit"
                disabled={submitStatus === "loading"}
                className="w-full mt-4 px-8 py-4 rounded-full text-sm uppercase tracking-widest text-cyan-glow border border-cyan-glow/40 bg-transparent hover:bg-cyan-glow/5 transition-colors duration-500 disabled:opacity-50"
              >
                {submitStatus === "loading" ? "Enviando…" : "Enviar para a fila"}
              </button>
            </form>
          )
        )}

        {/* ── Aba: Fila ── */}
        {tab === "fila" && (
          <div className="space-y-3">
            {filaLoading ? (
              <p className="text-center text-muted-foreground/50 py-16 font-light">
                Carregando fila…
              </p>
            ) : mensagens.length === 0 ? (
              <div className="glass rounded-3xl p-10 text-center">
                <p className="text-muted-foreground font-light">Nenhuma mensagem na fila ainda.</p>
                <button
                  onClick={() => setTab("enviar")}
                  className="mt-4 text-sm text-cyan-glow hover:text-foreground transition-colors"
                >
                  Seja o primeiro →
                </button>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground/40 text-right mb-3">
                  {mensagens.length} mensagem{mensagens.length !== 1 ? "s" : ""} cadastrada
                  {mensagens.length !== 1 ? "s" : ""}
                </p>
                {mensagens.map((m) => {
                  const isToday = m.data_exibicao === today;
                  const isPast = !!m.data_exibicao && m.data_exibicao < today;
                  return (
                    <div
                      key={m.id}
                      className={`glass rounded-2xl p-5 transition-all ${
                        isToday ? "ring-1 ring-violet-300" : ""
                      } ${isPast ? "opacity-60" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          {isToday && (
                            <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-violet-100 text-violet-600 border border-violet-200">
                              Hoje
                            </span>
                          )}
                          {isPast && (
                            <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-100 text-slate-400 border border-slate-200">
                              Exibida
                            </span>
                          )}
                          {!m.data_exibicao && (
                            <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                              A agendar
                            </span>
                          )}
                          {m.data_exibicao && (
                            <span className="text-xs text-muted-foreground/60">
                              {new Date(m.data_exibicao + "T12:00:00Z").toLocaleDateString(
                                "pt-BR",
                                { weekday: "short", day: "2-digit", month: "long", year: "numeric" }
                              )}
                            </span>
                          )}
                        </div>
                        {m.sigla_casa && (
                          <span className="text-[10px] uppercase tracking-widest text-muted-foreground/40 bg-white/60 border border-border px-2 py-0.5 rounded-full shrink-0">
                            {m.sigla_casa}
                          </span>
                        )}
                      </div>

                      <p className="text-sm font-light text-foreground leading-relaxed italic mb-3">
                        "{m.texto.length > 200 ? m.texto.slice(0, 200) + "…" : m.texto}"
                      </p>

                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="text-xs text-muted-foreground/60">{m.autor_nome}</p>
                        {m.referencia && (
                          <p className="text-xs text-muted-foreground/40 italic truncate max-w-xs">
                            {m.referencia}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
