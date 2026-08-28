import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback, type ReactNode } from "react";
import {
  ShoppingBag,
  CalendarDays,
  CircleHelp,
  ClipboardList,
  Wallet,
  BookOpen,
  BookMarked,
  Shirt,
  Footprints,
  Star,
  LayoutDashboard,
  Clock,
  Building2,
  ThumbsUp,
  Check,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  FUNCIONALIDADES,
  FUNCIONALIDADE_STATUS_LABEL,
  FUNCIONALIDADE_STATUS_STYLE,
  type FuncionalidadeCategoria,
  type FuncionalidadeItem,
  type FuncionalidadeStatus,
} from "@/data/funcionalidades";
import { supabase } from "@/integrations/supabase/client";
import { usePainelVotes, toItemKey, type VoteMap } from "@/hooks/usePainelVotes";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/inicio")({
  component: Inicio,
});

interface TodayMsg {
  texto: string;
  referencia: string | null;
  autor_nome: string;
  sigla_casa: string | null;
}

interface AgendaEvento {
  id: string;
  titulo: string;
  data_inicio: string;
  data_fim: string | null;
  tipo: "aberto" | "fechado";
  aceita_confirmacao: boolean;
  agenda_participantes: { id: string; user_id: string; confirmado: boolean | null }[];
}

const DAILY_MESSAGES = [
  { text: "Fora da caridade não há salvação.", author: "Allan Kardec" },
  {
    text: "Não façais aos outros o que não quiserdes que vos façam; fazei-lhes todo o bem que quiserdes que vos façam.",
    author: "O Evangelho segundo o Espiritismo",
  },
  {
    text: "A caridade bem compreendida consiste em fazer o bem a todos os homens sem distinção.",
    author: "O Livro dos Espíritos",
  },
  {
    text: "Amai-vos uns aos outros: eis toda a lei; lei divina, pela qual Deus governa os mundos.",
    author: "O Evangelho segundo o Espiritismo",
  },
  {
    text: "A humildade é o adorno da alma, assim como a modéstia é o adorno do mérito.",
    author: "O Livro dos Espíritos",
  },
  {
    text: "Quem semeia o bem colhe bons frutos; quem semeia o mal colhe maus frutos.",
    author: "A Gênese · Cap. VII",
  },
  {
    text: "O verdadeiro espiritismo é aquele que tem por divisa: fora da caridade não há salvação.",
    author: "Allan Kardec · A Gênese",
  },
];

const BAZAR: { Icon: LucideIcon; name: string; category: string; price: string; desc: string }[] = [
  {
    Icon: BookOpen,
    name: "O Livro dos Espíritos",
    category: "Livro",
    price: "R$ 35,00",
    desc: "Allan Kardec · Edição FEB",
  },
  {
    Icon: BookMarked,
    name: "O Evangelho segundo o Espiritismo",
    category: "Livro",
    price: "R$ 30,00",
    desc: "Allan Kardec · Edição FEB",
  },
  {
    Icon: Shirt,
    name: "Calça",
    category: "Vestuário",
    price: "R$ 45,00",
    desc: "Tamanho M · boa conservação",
  },
  {
    Icon: Shirt,
    name: "Camisa",
    category: "Vestuário",
    price: "R$ 20,00",
    desc: "Tamanho G · algodão",
  },
  {
    Icon: Shirt,
    name: "Blusa",
    category: "Vestuário",
    price: "R$ 25,00",
    desc: "Tamanho P · malha",
  },
  {
    Icon: Footprints,
    name: "Sapato",
    category: "Calçado",
    price: "R$ 30,00",
    desc: "Nº 38 · couro sintético",
  },
];

// A lista de funcionalidades e os rotulos de status vivem em
// src/data/funcionalidades.ts, compartilhados com a pagina da casa espirita.
type Status = FuncionalidadeStatus;
type FeatureItem = FuncionalidadeItem;
type FeatureCategory = FuncionalidadeCategoria;
const FEATURES = FUNCIONALIDADES;
const STATUS_LABEL = FUNCIONALIDADE_STATUS_LABEL;
const STATUS_STYLE = FUNCIONALIDADE_STATUS_STYLE;

function Inicio() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [todayMsg, setTodayMsg] = useState<TodayMsg | null>(null);
  const [msgExpandida, setMsgExpandida] = useState(false);
  const { votes, votingKey, toggleVoteByTitle } = usePainelVotes(user);
  const [agendaEventos, setAgendaEventos] = useState<AgendaEvento[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
    if (!loading && user) {
      if (
        !profile?.sigla_casa ||
        !profile?.nome ||
        !profile?.cargo_principal ||
        !profile?.uf ||
        !profile?.cidade
      ) {
        navigate({ to: "/completar-perfil" });
      } else {
        navigate({ to: "/casa/$sigla", params: { sigla: profile.sigla_casa } });
      }
    }
  }, [user, profile, loading, navigate]);

  const fetchAgenda = useCallback(async () => {
    if (!user || !profile?.sigla_casa) return;
    const hoje = new Date().toISOString().slice(0, 10);
    const { data } = await supabase
      .from("agenda_eventos")
      .select(
        "id, titulo, data_inicio, data_fim, tipo, aceita_confirmacao, agenda_participantes(id, user_id, confirmado)",
      )
      .eq("sigla_casa", profile.sigla_casa)
      .gte("data_inicio", hoje)
      .order("data_inicio", { ascending: true })
      .limit(10);
    setAgendaEventos((data as AgendaEvento[]) ?? []);
  }, [user, profile?.sigla_casa]);

  useEffect(() => {
    if (user && profile?.sigla_casa) fetchAgenda();
  }, [user, profile?.sigla_casa, fetchAgenda]);

  const handleConfirmarEvento = useCallback(
    async (eventoId: string) => {
      if (!user) return;
      await supabase
        .from("agenda_participantes")
        .upsert(
          { evento_id: eventoId, user_id: user.id, confirmado: true },
          { onConflict: "evento_id,user_id" },
        );
      fetchAgenda();
    },
    [user, fetchAgenda],
  );

  const handleResponderConvite = useCallback(
    async (participanteId: string, confirmado: boolean) => {
      await supabase.from("agenda_participantes").update({ confirmado }).eq("id", participanteId);
      fetchAgenda();
    },
    [fetchAgenda],
  );

  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().slice(0, 10);
    supabase
      .from("mensagens_do_dia")
      .select("texto, referencia, autor_nome, sigla_casa")
      .eq("data_exibicao", today)
      .eq("aprovada", true)
      .single()
      .then(({ data }) => {
        if (data) setTodayMsg(data);
      });
  }, [user]);

  if (loading || !user) return null;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000,
  );
  const fallbackMsg = DAILY_MESSAGES[dayOfYear % DAILY_MESSAGES.length];
  // Mensagem enviada pela casa para hoje ou, na falta dela, uma do acervo.
  const mensagemDoDia = todayMsg
    ? { texto: todayMsg.texto, autor: todayMsg.autor_nome, referencia: todayMsg.referencia }
    : { texto: fallbackMsg.text, autor: fallbackMsg.author, referencia: null as string | null };
  const mensagemLonga = mensagemDoDia.texto.length > 150;
  return (
    <main className="page-light min-h-screen pt-20 pb-28 px-4 md:px-8">
      <div className="mx-auto max-w-7xl">
        {/* ── Boas-vindas ── */}
        <div className="mb-10 mt-6 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-100 pb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-violet-glow mb-1.5 font-semibold">
              {greeting}, irmão
            </p>
            <h1 className="text-4xl md:text-5xl font-light tracking-tight text-foreground">
              Olá,{" "}
              <span className="font-medium text-gradient-aurora">
                {profile?.nome?.split(" ")[0]}
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest bg-violet-50 text-violet-700 border border-violet-100/50">
              Casa Espírita {profile?.sigla_casa}
            </span>
            {profile?.cargo_principal && (
              <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest bg-gray-100 text-gray-600 border border-gray-200/50">
                {profile?.cargo_principal}
              </span>
            )}
          </div>
        </div>

        {/* Mensagem do Dia — bloco compacto, altura previsível */}
        <div
          className="relative mb-8 rounded-3xl overflow-hidden border border-violet-200/60 shadow-sm"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.985 0.01 295) 0%, oklch(0.965 0.01 260) 100%)",
          }}
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-violet-300/10 to-cyan-300/10 blur-3xl pointer-events-none" />

          <div className="relative px-6 py-5 md:px-8 md:py-6 flex items-start gap-4">
            <div className="shrink-0 w-10 h-10 rounded-2xl bg-violet-100 border border-violet-200/50 flex items-center justify-center shadow-inner">
              <Star size={18} strokeWidth={1.5} className="text-violet-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <p className="text-[10px] uppercase tracking-[0.35em] text-violet-600 font-semibold">
                  Mensagem do Dia
                </p>
                {todayMsg?.sigla_casa && (
                  <span className="text-[9px] font-bold uppercase tracking-widest text-violet-500/80 bg-white/80 border border-violet-100/50 px-2 py-0.5 rounded-full">
                    {todayMsg.sigla_casa}
                  </span>
                )}
                <span className="ml-auto flex items-center gap-3">
                  <Link
                    to="/mensagem-do-dia"
                    search={{ tab: "enviar" }}
                    className="text-[10px] font-bold text-violet-700 hover:text-violet-900 transition-colors uppercase tracking-widest"
                  >
                    Enviar
                  </Link>
                  <Link
                    to="/mensagem-do-dia"
                    search={{ tab: "fila" }}
                    className="text-[10px] font-semibold text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-widest"
                  >
                    Ver fila
                  </Link>
                </span>
              </div>
              <blockquote
                className={`font-serif font-light text-gray-800 leading-relaxed italic text-base md:text-lg pr-2 ${
                  msgExpandida ? "" : "line-clamp-2"
                }`}
              >
                &ldquo;{mensagemDoDia.texto}&rdquo;
              </blockquote>
              <div className="flex items-center gap-2 flex-wrap mt-1.5">
                <span className="text-xs font-semibold text-violet-700">{mensagemDoDia.autor}</span>
                {mensagemDoDia.referencia && (
                  <span className="text-xs text-gray-400 font-light italic">
                    — {mensagemDoDia.referencia}
                  </span>
                )}
                {mensagemLonga && (
                  <button
                    type="button"
                    onClick={() => setMsgExpandida((v) => !v)}
                    className="ml-auto text-[10px] font-bold uppercase tracking-widest text-violet-700 hover:text-violet-900 transition-colors"
                  >
                    {msgExpandida ? "Recolher" : "Ler tudo"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Próximos Eventos ── */}
        {agendaEventos.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-4 pb-4 border-b-2 border-amber-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                  <CalendarDays size={20} strokeWidth={1.5} className="text-amber-600" />
                </div>
                <h2 className="text-base font-semibold text-amber-700 tracking-wide">
                  Próximos Eventos
                </h2>
              </div>
              <Link
                to="/agenda"
                className="text-xs text-cyan-glow uppercase tracking-widest hover:text-foreground transition-colors"
              >
                Ver agenda
              </Link>
            </div>
            <div className="space-y-2">
              {[
                ...agendaEventos.filter((e) => {
                  const p = e.agenda_participantes.find((p) => p.user_id === user.id);
                  return (
                    p?.confirmado === null || (!p && e.tipo === "aberto" && e.aceita_confirmacao)
                  );
                }),
                ...agendaEventos.filter((e) => {
                  const p = e.agenda_participantes.find((p) => p.user_id === user.id);
                  return p?.confirmado === true;
                }),
              ].map((evento) => {
                const minha = evento.agenda_participantes.find((p) => p.user_id === user.id);
                const pendente = minha?.confirmado === null;
                const confirmado = minha?.confirmado === true;
                const abertoPendente =
                  evento.tipo === "aberto" && !minha && evento.aceita_confirmacao;
                return (
                  <div
                    key={evento.id}
                    className={`glass-premium hover-premium rounded-2xl border px-5 py-4 flex items-center gap-4 ${pendente ? "border-amber-300 bg-amber-50/20" : "border-gray-100"}`}
                  >
                    <div className="shrink-0 w-11 h-11 rounded-xl bg-violet-50 border border-violet-100/70 flex flex-col items-center justify-center">
                      <p className="text-lg font-bold text-violet-700 leading-none">
                        {String(new Date(evento.data_inicio).getDate()).padStart(2, "0")}
                      </p>
                      <p className="text-[9px] font-bold text-violet-400 uppercase tracking-widest">
                        {new Date(evento.data_inicio).toLocaleDateString("pt-BR", {
                          month: "short",
                        })}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {evento.titulo}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
                        <Clock size={10} className="text-gray-400" />
                        <span className="font-light">
                          {new Date(evento.data_inicio).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {pendente && (
                          <span className="text-amber-600 font-semibold animate-pulse">
                            · Aguardando resposta
                          </span>
                        )}
                        {confirmado && (
                          <span className="text-emerald-600 font-medium">· Confirmado</span>
                        )}
                        {abertoPendente && (
                          <span className="text-cyan-600 font-medium">· Confirmar presença</span>
                        )}
                      </p>
                    </div>
                    {(pendente || abertoPendente) && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() =>
                            pendente
                              ? handleResponderConvite(minha!.id, true)
                              : handleConfirmarEvento(evento.id)
                          }
                          className="flex items-center gap-1 px-3.5 py-2 rounded-xl border border-emerald-300 text-emerald-600 text-xs font-bold hover:bg-emerald-50 transition-colors shadow-sm bg-white"
                        >
                          <Check size={12} strokeWidth={2.5} /> Confirmar
                        </button>
                        {pendente && (
                          <button
                            onClick={() => handleResponderConvite(minha!.id, false)}
                            className="flex items-center justify-center w-8 h-8 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors shadow-sm bg-white"
                          >
                            <X size={14} strokeWidth={2.5} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Gestão ── */}
        <section className="mb-16">
          <SectionHeader
            Icon={LayoutDashboard}
            label="Gestão"
            color="text-slate-700"
            iconColor="text-slate-500"
            bg="bg-slate-50"
            border="border-slate-200"
            borderB="border-slate-200"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <DashCard
              Icon={ClipboardList}
              title="Acompanhamento do Projeto"
              desc="Veja o progresso da plataforma, as novidades recentes e solicite novos recursos ao desenvolvedor."
              status="disponivel"
              accent="slate"
              href="/painel"
              votes={votes}
              votingKey={votingKey}
              onVote={toggleVoteByTitle}
            />
            <DashCard
              Icon={Wallet}
              title="Tesouraria"
              desc="Registro de receitas e despesas, saldo mensal, exportação em Excel (.xlsx) e impressão formatada."
              status="disponivel"
              accent="amber"
              href="/tesouraria"
              votes={votes}
              votingKey={votingKey}
              onVote={toggleVoteByTitle}
            />
            <DashCard
              Icon={CircleHelp}
              title="Ajuda com o Site"
              desc="Tire dúvidas sobre como usar o site, busque uma casa espírita ou encontre apoio pessoal."
              status="disponivel"
              accent="cyan"
              href="/ajuda"
              votes={votes}
              votingKey={votingKey}
              onVote={toggleVoteByTitle}
            />
            {profile?.sigla_casa && (
              <Link
                to="/casa/$sigla"
                params={{ sigla: profile.sigla_casa }}
                className="block h-full"
              >
                <div className="glass rounded-2xl p-6 border-t-2 border-t-indigo-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 h-full flex flex-col gap-4">
                  <div className="w-10 h-10 rounded-xl border flex items-center justify-center bg-indigo-50 border-indigo-200 text-indigo-600">
                    <Building2 size={20} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-foreground leading-snug mb-1">
                      Página da Casa
                    </h3>
                    <p className="text-xs text-muted-foreground/70 leading-relaxed">
                      Mural de avisos, sobre, programação semanal e doações — a página pública do
                      seu centro espírita.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border bg-emerald-100 text-emerald-700 border-emerald-200">
                      Disponível
                    </span>
                    <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border border-border text-muted-foreground/50">
                      {profile.sigla_casa}
                    </span>
                  </div>
                </div>
              </Link>
            )}
          </div>
        </section>

        {/* ── Grade de funcionalidades ── */}
        {FEATURES.map((cat) => (
          <section key={cat.label} className="mb-16">
            <SectionHeader
              Icon={cat.SectionIcon}
              label={cat.label}
              color={cat.color}
              iconColor={cat.iconColor}
              bg={cat.bg}
              border={cat.border}
              borderB={cat.borderB}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {cat.items.map((item) => (
                <FeatureCard
                  key={item.title}
                  item={item}
                  cat={cat}
                  siglaCasa={profile?.sigla_casa ?? null}
                  votes={votes}
                  votingKey={votingKey}
                  onVote={toggleVoteByTitle}
                />
              ))}
            </div>
          </section>
        ))}

        {/* ── Bazar ── */}
        <section id="bazar" className="mb-16">
          <SectionHeader
            Icon={ShoppingBag}
            label="Bazar On-line"
            color="text-cyan-700"
            iconColor="text-cyan-700"
            bg="bg-cyan-50"
            border="border-cyan-200"
            borderB="border-cyan-200"
          >
            <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              Em breve
            </span>
          </SectionHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {BAZAR.map((item) => (
              <BazarCard key={item.name} item={item} />
            ))}
          </div>
          <p className="mt-4 text-xs text-center text-muted-foreground/50">
            Demonstração de como o bazar vai funcionar · Os itens e os preços são fictícios e
            nenhuma compra é feita por aqui
          </p>
        </section>
      </div>
    </main>
  );
}

/* ── Sub-components ── */

function SectionHeader({
  Icon,
  label,
  color,
  iconColor,
  bg,
  border,
  borderB,
  children,
}: {
  Icon: LucideIcon;
  label: string;
  color: string;
  iconColor: string;
  bg: string;
  border: string;
  borderB: string;
  children?: ReactNode;
}) {
  return (
    <div className={`flex items-center gap-4 mb-6 pb-4 border-b-2 ${borderB}`}>
      <div
        className={`w-10 h-10 rounded-xl ${bg} border ${border} flex items-center justify-center shrink-0`}
      >
        <Icon size={20} strokeWidth={1.5} className={iconColor} />
      </div>
      <h2 className={`text-base font-semibold ${color} tracking-wide`}>{label}</h2>
      {children && <div className="ml-auto flex items-center gap-2">{children}</div>}
    </div>
  );
}

function VoteBadge({
  title,
  votes,
  votingKey,
}: {
  title: string;
  votes: VoteMap;
  votingKey: string | null;
}) {
  const key = toItemKey(title);
  const voteData = votes[key];
  const count = voteData?.count ?? 0;
  const voted = voteData?.votedByMe ?? false;
  const isVoting = votingKey === key;
  return (
    <span
      className={`ml-auto flex items-center gap-1 text-[10px] rounded-full px-2 py-0.5 border transition-colors ${
        voted
          ? "text-cyan-600 border-cyan-300 bg-cyan-50"
          : "text-muted-foreground/40 border-border bg-transparent"
      } ${isVoting ? "opacity-50" : ""}`}
      title={
        voted
          ? "Você curtiu este recurso — clique no cartão para retirar a curtida"
          : "Clique no cartão para curtir este recurso"
      }
    >
      <ThumbsUp size={10} />
      {count > 0 && <span className="font-medium">{count}</span>}
    </span>
  );
}

function DashCard({
  Icon,
  title,
  desc,
  status,
  accent,
  href,
  casa,
  votes,
  votingKey,
  onVote,
}: {
  Icon: LucideIcon;
  title: string;
  desc: string;
  status: Status;
  accent: string;
  href?: string;
  casa?: boolean;
  votes: VoteMap;
  votingKey: string | null;
  onVote: (title: string) => void;
}) {
  const borderMap: Record<string, string> = {
    slate: "border-t-slate-300/80 focus-within:border-t-slate-400",
    amber: "border-t-amber-300/80 focus-within:border-t-amber-400",
    cyan: "border-t-cyan-300/80 focus-within:border-t-cyan-400",
  };
  const iconMap: Record<string, string> = {
    slate: "bg-slate-50 border-slate-200 text-slate-600",
    cyan: "bg-cyan-50 border-cyan-200 text-cyan-600",
    amber: "bg-amber-50 border-amber-200 text-amber-600",
  };
  const isPending = status === "breve";
  const content = (
    <div
      className={`glass-premium hover-premium rounded-2xl p-6 border-t-4 ${borderMap[accent] ?? "border-t-slate-300"} h-full flex flex-col gap-4 ${isPending ? "cursor-pointer" : ""}`}
      onClick={isPending ? () => onVote(title) : undefined}
    >
      <div
        className={`w-10 h-10 rounded-xl border flex items-center justify-center ${iconMap[accent] ?? iconMap.slate}`}
      >
        <Icon size={20} strokeWidth={1.5} />
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-gray-800 leading-snug mb-1">{title}</h3>
        <p className="text-xs text-gray-500 leading-relaxed font-light">{desc}</p>
      </div>
      <div className="flex items-center gap-2 flex-wrap mt-2">
        <span
          className={`text-[10px] font-semibold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${STATUS_STYLE[status]}`}
        >
          {STATUS_LABEL[status]}
        </span>
        {isPending && <VoteBadge title={title} votes={votes} votingKey={votingKey} />}
      </div>
    </div>
  );
  if (href)
    return (
      <Link to={href} className="block h-full">
        {content}
      </Link>
    );
  return content;
}

function FeatureCard({
  item,
  cat,
  siglaCasa,
  votes,
  votingKey,
  onVote,
}: {
  item: FeatureItem;
  cat: FeatureCategory;
  siglaCasa: string | null;
  votes: VoteMap;
  votingKey: string | null;
  onVote: (title: string) => void;
}) {
  const isAvailable = item.status === "disponivel";
  const isPending = item.status === "breve";

  const inner = (
    <div
      className={`group glass-premium hover-premium rounded-2xl p-5 flex flex-col gap-4 h-full ${!isAvailable ? "opacity-80" : ""} ${isPending ? "cursor-pointer" : ""}`}
      onClick={isPending ? () => onVote(item.title) : undefined}
    >
      <div
        className={`w-10 h-10 rounded-xl ${cat.bg} border ${cat.border} flex items-center justify-center shrink-0`}
      >
        <item.Icon size={20} strokeWidth={1.5} className={cat.iconColor} />
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-gray-800 leading-snug mb-1">{item.title}</h3>
        <p className="text-xs text-gray-500 leading-relaxed font-light">{item.desc}</p>
      </div>
      <div className="flex items-center gap-2 flex-wrap mt-2">
        <span
          className={`text-[10px] font-semibold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${STATUS_STYLE[item.status]}`}
        >
          {STATUS_LABEL[item.status]}
        </span>
        {isPending && <VoteBadge title={item.title} votes={votes} votingKey={votingKey} />}
      </div>
    </div>
  );
  // Recurso que mora dentro da pagina da casa: o cartao leva para a aba certa,
  // e nao para uma rota propria, que nao existe.
  if (item.casaAba && siglaCasa)
    return (
      <Link
        to="/casa/$sigla"
        params={{ sigla: siglaCasa }}
        search={{ aba: item.casaAba }}
        className="block h-full"
      >
        {inner}
      </Link>
    );
  if (item.href)
    return (
      <Link to={item.href} className="block h-full">
        {inner}
      </Link>
    );
  return inner;
}

function BazarCard({ item }: { item: (typeof BAZAR)[0] }) {
  return (
    <div className="glass-premium hover-premium rounded-2xl p-4 flex flex-col gap-3">
      <div className="w-12 h-12 rounded-xl bg-cyan-50/70 border border-cyan-100 flex items-center justify-center mx-auto shadow-sm">
        <item.Icon size={22} strokeWidth={1.5} className="text-cyan-600" />
      </div>
      <div className="text-center flex-1">
        <p className="text-[10px] font-bold text-cyan-600/70 uppercase tracking-widest mb-0.5">
          {item.category}
        </p>
        <h3 className="text-xs font-semibold text-gray-800 leading-snug mb-1">{item.name}</h3>
        <p className="text-[10px] text-gray-400 font-light">{item.desc}</p>
      </div>
      <div className="text-center mt-2">
        <p className="text-sm font-semibold text-cyan-600 mb-2.5">{item.price}</p>
        <button className="w-full text-[10px] font-bold uppercase tracking-widest py-2 rounded-lg border border-cyan-200 text-cyan-600 hover:bg-cyan-50 transition-colors shadow-sm">
          Consultar
        </button>
      </div>
    </div>
  );
}
