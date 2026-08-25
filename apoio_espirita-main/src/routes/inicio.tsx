import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback, type ReactNode } from "react";
import {
  PenLine,
  Music,
  Guitar,
  Sprout,
  Sparkles,
  Gamepad2,
  MessageCircle,
  Users,
  HeartHandshake,
  ShoppingBag,
  Car,
  Truck,
  CalendarDays,
  Cast,
  Video,
  Film,
  MonitorPlay,
  CircleHelp,
  BarChart3,
  ClipboardList,
  Wallet,
  BookOpen,
  BookMarked,
  Shirt,
  Footprints,
  Star,
  LayoutDashboard,
  Flame,
  UsersRound,
  CalendarCheck,
  Wrench,
  Megaphone,
  ClipboardCheck,
  CalendarRange,
  FileHeart,
  Cake,
  Clock,
  Building2,
  ThumbsUp,
  Check,
  X,
  type LucideIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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

type Status = "disponivel" | "breve" | "beta";

interface FeatureItem {
  Icon: LucideIcon;
  title: string;
  desc: string;
  status: Status;
  casa?: boolean;
  href?: string;
}

interface FeatureCategory {
  label: string;
  SectionIcon: LucideIcon;
  color: string;
  iconColor: string;
  bg: string;
  border: string;
  borderB: string;
  items: FeatureItem[];
}

const FEATURES: FeatureCategory[] = [
  {
    label: "Vida Espiritual",
    SectionIcon: Flame,
    color: "text-violet-700",
    iconColor: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-200",
    borderB: "border-violet-200",
    items: [
      {
        Icon: PenLine,
        title: "Artigos e Colunistas",
        desc: "Textos escritos por membros da sua comunidade, com identificação do autor e da casa.",
        status: "breve",
      },
      {
        Icon: Music,
        title: "Músicas e Cifras",
        desc: "Playlists espíritas para passes, estudos, envio de áudios e cifras/partituras com transposição de tom.",
        status: "disponivel",
        href: "/musicas-cifras",
      },
      {
        Icon: Sprout,
        title: "Evangelização Infantil",
        desc: "Módulo escolar com recursos lúdicos, jogos e atividades para a formação das crianças.",
        status: "breve",
      },
      {
        Icon: Sparkles,
        title: "Área de Jovens Espíritas",
        desc: "Conteúdo, eventos e comunidade exclusivos para jovens trabalhadores da vinha.",
        status: "breve",
      },
      {
        Icon: Gamepad2,
        title: "Jogos Educativos",
        desc: "Jogos sobre os livros da codificação espírita e atividades para todas as idades.",
        status: "disponivel",
        href: "/jogos",
      },
      {
        Icon: Cake,
        title: "Aniversariantes do Mês",
        desc: "Calendário de aniversários dos membros. Aparece em destaque no topo da home no mês do aniversário.",
        status: "breve",
      },
      {
        Icon: Clock,
        title: "Plantão de Orações",
        desc: "Membros se inscrevem em horários de oração coletiva à distância. Agenda semanal visível para todos.",
        status: "breve",
      },
    ],
  },
  {
    label: "Nossa Comunidade",
    SectionIcon: UsersRound,
    color: "text-cyan-700",
    iconColor: "text-cyan-700",
    bg: "bg-cyan-50",
    border: "border-cyan-200",
    borderB: "border-cyan-200",
    items: [
      {
        Icon: MessageCircle,
        title: "Fórum de Apoio",
        desc: "Espaço fraterno de perguntas, respostas e acolhimento espiritual entre membros.",
        status: "breve",
      },
      {
        Icon: Users,
        title: "Comunicação em Grupos",
        desc: "Grupos internos por tipo de atividade, semelhante a grupos de WhatsApp — dentro da plataforma.",
        status: "breve",
      },
      {
        Icon: HeartHandshake,
        title: "Localização de Voluntariado",
        desc: "Matchmaking entre as habilidades dos membros e as necessidades da comunidade.",
        status: "breve",
      },
      {
        Icon: ShoppingBag,
        title: "Bazar On-line",
        desc: "Livros, artesanatos e itens da comunidade com integração PIX para doações.",
        status: "breve",
      },
      {
        Icon: Car,
        title: "Carona Solidária",
        desc: "Membros com carro se disponibilizam para dar carona a quem precisa — da mesma casa ou de outra.",
        status: "breve",
      },
      {
        Icon: Truck,
        title: "Entrega Solidária",
        desc: "Voluntários se oferecem para entregar itens comprados no bazar — com agendamento e confirmação.",
        status: "breve",
      },
      {
        Icon: Megaphone,
        title: "Mural de Avisos",
        desc: "Quadro digital da casa. Presidentes e coordenadores publicam comunicados. Membros visualizam ao entrar.",
        status: "breve",
      },
      {
        Icon: FileHeart,
        title: "Ficha de Atendimento Fraterno",
        desc: "Formulário confidencial para registro de pessoas atendidas. Acessível apenas pelo coordenador de assistência.",
        status: "breve",
      },
    ],
  },
  {
    label: "Agenda & Eventos",
    SectionIcon: CalendarCheck,
    color: "text-amber-700",
    iconColor: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    borderB: "border-amber-200",
    items: [
      {
        Icon: CalendarDays,
        title: "Agenda de Eventos e Reuniões",
        desc: "Calendário completo com confirmação de presença e relatório de presenças por membro.",
        status: "disponivel",
        href: "/agenda",
      },
      {
        Icon: Cast,
        title: "Live Streaming",
        desc: "Transmissão ao vivo das palestras pelo celular — um transmite, todos acompanham.",
        status: "breve",
      },
      {
        Icon: Video,
        title: "Google Meet",
        desc: "Videoconferências integradas à plataforma para reuniões remotas.",
        status: "breve",
      },
      {
        Icon: Film,
        title: "Integração de Vídeos",
        desc: "Palestras gravadas, arquivos em vídeo e integração com StreamYard.",
        status: "breve",
      },
      {
        Icon: ClipboardCheck,
        title: "Caderno de Presença Digital",
        desc: "Membros marcam presença nas reuniões pelo celular com um toque. Coordenador vê relatório por reunião e por membro.",
        status: "disponivel",
        href: "/agenda",
      },
      {
        Icon: CalendarRange,
        title: "Escala de Trabalho",
        desc: "Presidente ou coordenador monta a escala semanal e mensal de tarefeiros. Cada membro vê sua escala pelo celular.",
        status: "breve",
      },
    ],
  },
  {
    label: "Recursos & Ferramentas",
    SectionIcon: Wrench,
    color: "text-emerald-700",
    iconColor: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    borderB: "border-emerald-200",
    items: [
      {
        Icon: MonitorPlay,
        title: "Player de PowerPoint",
        desc: "Apresente arquivos de PowerPoint diretamente na plataforma, sem instalações.",
        status: "breve",
      },
      {
        Icon: CircleHelp,
        title: "FAQ",
        desc: "Perguntas e respostas detalhadas sobre o uso do site e a doutrina espírita.",
        status: "disponivel",
        href: "/ajuda",
      },
    ],
  },
];

const STATUS_LABEL: Record<Status, string> = {
  disponivel: "Disponível",
  breve: "Em breve",
  beta: "Beta",
};
const STATUS_STYLE: Record<Status, string> = {
  disponivel: "bg-emerald-100 text-emerald-700 border-emerald-200",
  breve: "bg-amber-50 text-amber-600 border-amber-200",
  beta: "bg-blue-50 text-blue-600 border-blue-200",
};

interface VoteMap {
  [key: string]: { count: number; votedByMe: boolean };
}

function toItemKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .slice(0, 80);
}

function Inicio() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [todayMsg, setTodayMsg] = useState<TodayMsg | null>(null);
  const [votes, setVotes] = useState<VoteMap>({});
  const [votingKey, setVotingKey] = useState<string | null>(null);
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

  const fetchVotes = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("painel_votes").select("item_key, user_id");
    if (!data) return;
    const map: VoteMap = {};
    for (const row of data) {
      if (!map[row.item_key]) map[row.item_key] = { count: 0, votedByMe: false };
      map[row.item_key].count++;
      if (row.user_id === user.id) map[row.item_key].votedByMe = true;
    }
    setVotes(map);
  }, [user]);

  useEffect(() => {
    if (user) fetchVotes();
  }, [user, fetchVotes]);

  const handleCardVote = useCallback(
    async (title: string) => {
      if (!user) return;
      const key = toItemKey(title);
      if (votingKey === key || votes[key]?.votedByMe) return;
      setVotingKey(key);
      try {
        await supabase.from("painel_votes").insert({ item_key: key, user_id: user.id });
        setVotes((v) => ({ ...v, [key]: { count: (v[key]?.count ?? 0) + 1, votedByMe: true } }));
      } finally {
        setVotingKey(null);
      }
    },
    [user, votes, votingKey],
  );

  if (loading || !user) return null;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000,
  );
  const fallbackMsg = DAILY_MESSAGES[dayOfYear % DAILY_MESSAGES.length];
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

        {/* ── Mensagem do Dia ── */}
        <div
          className="relative mb-12 rounded-3xl overflow-hidden border border-violet-200/60 shadow-lg"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.985 0.01 295) 0%, oklch(0.965 0.01 260) 100%)",
          }}
        >
          {/* Decorative glowing gradient dots in background */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-violet-300/10 to-cyan-300/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-gradient-to-tr from-cyan-300/10 to-violet-300/10 blur-3xl pointer-events-none" />

          <div className="relative px-8 py-8 md:px-12 md:py-10 flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="shrink-0 w-12 h-12 rounded-2xl bg-violet-100 border border-violet-200/50 flex items-center justify-center shadow-inner">
              <Star size={22} strokeWidth={1.5} className="text-violet-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-[0.35em] text-violet-600 font-semibold mb-3">
                Mensagem do Dia
              </p>
              {todayMsg ? (
                <>
                  <blockquote className="text-xl md:text-2xl font-serif font-light text-gray-800 leading-relaxed italic pr-4">
                    "{todayMsg.texto}"
                  </blockquote>
                  {todayMsg.referencia && (
                    <p className="mt-3 text-sm text-gray-500 font-light italic">
                      — {todayMsg.referencia}
                    </p>
                  )}
                  <div className="mt-4 flex items-center gap-3 flex-wrap">
                    <span className="text-xs font-medium text-violet-700">
                      {todayMsg.autor_nome}
                    </span>
                    {todayMsg.sigla_casa && (
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 bg-white/80 border border-violet-100/50 px-2.5 py-0.5 rounded-full">
                        {todayMsg.sigla_casa}
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <blockquote className="text-xl md:text-2xl font-serif font-light text-gray-800 leading-relaxed italic pr-4">
                    "{fallbackMsg.text}"
                  </blockquote>
                  <p className="mt-3 text-sm text-gray-500 font-light italic">
                    — {fallbackMsg.author}
                  </p>
                </>
              )}
            </div>
          </div>
          <div className="px-8 pb-5 md:px-12 flex items-center gap-5 border-t border-violet-100/40 pt-4 bg-white/20">
            <Link
              to="/mensagem-do-dia"
              search={{ tab: "enviar" }}
              className="text-xs font-semibold text-violet-700 hover:text-violet-900 transition-colors uppercase tracking-widest"
            >
              Enviar mensagem
            </Link>
            <Link
              to="/mensagem-do-dia"
              search={{ tab: "fila" }}
              className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-widest"
            >
              Ver fila
            </Link>
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
              onVote={handleCardVote}
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
              onVote={handleCardVote}
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
              onVote={handleCardVote}
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
                  votes={votes}
                  votingKey={votingKey}
                  onVote={handleCardVote}
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
            <span className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              Disponível
            </span>
          </SectionHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {BAZAR.map((item) => (
              <BazarCard key={item.name} item={item} />
            ))}
          </div>
          <p className="mt-4 text-xs text-center text-muted-foreground/50">
            Itens de exemplo · Cada casa espírita gerenciará seu próprio bazar
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
      title={voted ? "Você já votou neste recurso" : "Clique no card para votar neste recurso"}
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
  votes,
  votingKey,
  onVote,
}: {
  item: FeatureItem;
  cat: FeatureCategory;
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
