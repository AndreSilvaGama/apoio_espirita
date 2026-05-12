import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  PenLine, Music, Guitar, Sprout, Sparkles, Gamepad2,
  MessageCircle, Users, HeartHandshake, ShoppingBag, Car, Truck,
  CalendarDays, Cast, Video, Film, Radio, MonitorPlay, CircleHelp,
  BarChart3, ClipboardList, Wallet,
  BookOpen, BookMarked, Shirt, Footprints,
  Star, LayoutDashboard, Flame, UsersRound, CalendarCheck, Wrench,
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

const DAILY_MESSAGES = [
  { text: "Fora da caridade não há salvação.", author: "Allan Kardec" },
  { text: "Não façais aos outros o que não quiserdes que vos façam; fazei-lhes todo o bem que quiserdes que vos façam.", author: "O Evangelho segundo o Espiritismo" },
  { text: "A caridade bem compreendida consiste em fazer o bem a todos os homens sem distinção.", author: "O Livro dos Espíritos" },
  { text: "Amai-vos uns aos outros: eis toda a lei; lei divina, pela qual Deus governa os mundos.", author: "O Evangelho segundo o Espiritismo" },
  { text: "A humildade é o adorno da alma, assim como a modéstia é o adorno do mérito.", author: "O Livro dos Espíritos" },
  { text: "Quem semeia o bem colhe bons frutos; quem semeia o mal colhe maus frutos.", author: "A Gênese · Cap. VII" },
  { text: "O verdadeiro espiritismo é aquele que tem por divisa: fora da caridade não há salvação.", author: "Allan Kardec · A Gênese" },
];

const BAZAR: { Icon: LucideIcon; name: string; category: string; price: string; desc: string }[] = [
  { Icon: BookOpen,  name: "O Livro dos Espíritos",              category: "Livro",     price: "R$ 35,00", desc: "Allan Kardec · Edição FEB" },
  { Icon: BookMarked, name: "O Evangelho segundo o Espiritismo", category: "Livro",     price: "R$ 30,00", desc: "Allan Kardec · Edição FEB" },
  { Icon: Shirt,     name: "Calça",                              category: "Vestuário", price: "R$ 45,00", desc: "Tamanho M · boa conservação" },
  { Icon: Shirt,     name: "Camisa",                             category: "Vestuário", price: "R$ 20,00", desc: "Tamanho G · algodão" },
  { Icon: Shirt,     name: "Blusa",                              category: "Vestuário", price: "R$ 25,00", desc: "Tamanho P · malha" },
  { Icon: Footprints, name: "Sapato",                            category: "Calçado",   price: "R$ 30,00", desc: "Nº 38 · couro sintético" },
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
      { Icon: PenLine,   title: "Artigos e Colunistas",    desc: "Textos escritos por membros da sua comunidade, com identificação do autor e da casa.", status: "breve", casa: true },
      { Icon: Music,     title: "Área de Músicas",         desc: "Playlists espíritas para recepção, hora do passe e estudo. Inclui Rádio Rio de Janeiro.", status: "breve" },
      { Icon: Guitar,    title: "Área de Cifras",          desc: "Cifras, partituras e letras de músicas espíritas enviadas pela comunidade.", status: "breve", casa: true },
      { Icon: Sprout,    title: "Evangelização Infantil",  desc: "Módulo escolar com recursos lúdicos, jogos e atividades para a formação das crianças.", status: "breve", casa: true },
      { Icon: Sparkles,  title: "Área de Jovens Espíritas", desc: "Conteúdo, eventos e comunidade exclusivos para jovens trabalhadores da vinha.", status: "breve", casa: true },
      { Icon: Gamepad2,  title: "Jogos Educativos",        desc: "Jogos sobre os livros da codificação espírita e atividades para todas as idades.", status: "breve" },
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
      { Icon: MessageCircle,  title: "Fórum de Apoio",                desc: "Espaço fraterno de perguntas, respostas e acolhimento espiritual entre membros.", status: "breve" },
      { Icon: Users,          title: "Comunicação em Grupos",         desc: "Grupos internos por tipo de atividade, semelhante a grupos de WhatsApp — dentro da plataforma.", status: "breve", casa: true },
      { Icon: HeartHandshake, title: "Localização de Voluntariado",   desc: "Matchmaking entre as habilidades dos membros e as necessidades da comunidade.", status: "breve", casa: true },
      { Icon: ShoppingBag,    title: "Bazar On-line",                 desc: "Livros, artesanatos e itens da comunidade com integração PIX para doações.", status: "disponivel", casa: true, href: "#bazar" },
      { Icon: Car,            title: "Carona Solidária",              desc: "Membros com carro se disponibilizam para dar carona a quem precisa — da mesma casa ou de outra.", status: "breve" },
      { Icon: Truck,          title: "Entrega Solidária",             desc: "Voluntários se oferecem para entregar itens comprados no bazar — com agendamento e confirmação.", status: "breve", casa: true },
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
      { Icon: CalendarDays, title: "Agenda de Eventos e Reuniões", desc: "Calendário completo com confirmação de presença, voluntariado e geração de atas.", status: "breve", casa: true },
      { Icon: Cast,         title: "Live Streaming",               desc: "Transmissão ao vivo das palestras pelo celular — um transmite, todos acompanham.", status: "breve", casa: true },
      { Icon: Video,        title: "Google Meet",                  desc: "Videoconferências integradas à plataforma para reuniões remotas.", status: "breve" },
      { Icon: Film,         title: "Integração de Vídeos",         desc: "Palestras gravadas, arquivos em vídeo e integração com StreamYard.", status: "breve", casa: true },
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
      { Icon: Radio,      title: "Rádio Rio de Janeiro",   desc: "Ouça ao vivo a Rádio Rio de Janeiro diretamente pela plataforma.", status: "breve" },
      { Icon: MonitorPlay, title: "Player de PowerPoint",  desc: "Apresente arquivos de PowerPoint diretamente na plataforma, sem instalações.", status: "breve" },
      { Icon: CircleHelp, title: "FAQ",                    desc: "Perguntas e respostas detalhadas sobre o uso do site e a doutrina espírita.", status: "breve" },
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

function Inicio() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [todayMsg, setTodayMsg] = useState<TodayMsg | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
    if (!loading && user && (!profile?.sigla_casa || !profile?.nome || !profile?.cargo_principal)) {
      navigate({ to: "/completar-perfil" });
    }
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().slice(0, 10);
    supabase
      .from("mensagens_do_dia")
      .select("texto, referencia, autor_nome, sigla_casa")
      .eq("data_exibicao", today)
      .eq("aprovada", true)
      .single()
      .then(({ data }) => { if (data) setTodayMsg(data); });
  }, [user]);

  if (loading || !user) return null;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const fallbackMsg = DAILY_MESSAGES[dayOfYear % DAILY_MESSAGES.length];
  const isPresident = profile?.cargo_principal === "Presidente" || profile?.cargo_principal === "Vice-presidente";

  return (
    <main className="page-light min-h-screen pt-20 pb-20 px-4 md:px-8">
      <div className="mx-auto max-w-7xl">

        {/* ── Boas-vindas ── */}
        <div className="mb-10 mt-4">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-glow mb-1">{greeting}</p>
          <h1 className="text-3xl md:text-4xl font-light text-foreground">
            {profile?.nome?.split(" ")[0]}
            <span className="font-medium"> ·</span>
            <span className="text-sm font-normal text-muted-foreground ml-2 tracking-widest uppercase">
              {profile?.sigla_casa}
            </span>
          </h1>
          {profile?.cargo_principal && (
            <p className="mt-1 text-sm text-muted-foreground/70">
              {profile.cargo_principal}
              {profile.atividades?.length > 0 && (
                <span className="ml-2 text-muted-foreground/40">
                  · {profile.atividades.slice(0, 3).join(" · ")}
                  {profile.atividades.length > 3 && ` +${profile.atividades.length - 3}`}
                </span>
              )}
            </p>
          )}
        </div>

        {/* ── Mensagem do Dia ── */}
        <div
          className="mb-12 rounded-3xl overflow-hidden shadow-sm border border-violet-100"
          style={{ background: "linear-gradient(135deg, oklch(0.97 0.02 295) 0%, oklch(0.97 0.015 260) 100%)" }}
        >
          <div className="px-8 py-7 md:px-12 md:py-10 flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="shrink-0 w-14 h-14 rounded-2xl bg-violet-100 border border-violet-200 flex items-center justify-center">
              <Star size={26} strokeWidth={1.5} className="text-violet-500" />
            </div>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-[0.35em] text-violet-500 mb-3">Mensagem do Dia</p>
              {todayMsg ? (
                <>
                  <blockquote className="text-lg md:text-xl font-light text-foreground leading-relaxed italic">
                    "{todayMsg.texto}"
                  </blockquote>
                  {todayMsg.referencia && (
                    <p className="mt-3 text-sm text-muted-foreground/60 italic">— {todayMsg.referencia}</p>
                  )}
                  <div className="mt-4 flex items-center gap-3 flex-wrap">
                    <span className="text-xs text-violet-600">{todayMsg.autor_nome}</span>
                    {todayMsg.sigla_casa && (
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50 bg-white/70 border border-border/60 px-2 py-0.5 rounded-full">
                        {todayMsg.sigla_casa}
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <blockquote className="text-lg md:text-xl font-light text-foreground leading-relaxed italic">
                    "{fallbackMsg.text}"
                  </blockquote>
                  <p className="mt-3 text-sm text-muted-foreground/60">— {fallbackMsg.author}</p>
                </>
              )}
            </div>
          </div>
          <div className="px-8 pb-5 md:px-12 flex items-center gap-5 border-t border-violet-100/60 pt-4">
            <Link
              to="/mensagem-do-dia"
              className="text-xs text-violet-500 hover:text-violet-700 transition-colors uppercase tracking-widest"
            >
              Enviar mensagem
            </Link>
            <Link
              to="/mensagem-do-dia"
              search={{ tab: "fila" }}
              className="text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors uppercase tracking-widest"
            >
              Ver fila
            </Link>
          </div>
        </div>

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <DashCard
              Icon={BarChart3}
              title="Meu Dashboard"
              desc="Dados e métricas relevantes ao seu papel na casa espírita."
              status="breve"
              accent="slate"
            />
            <DashCard
              Icon={ClipboardList}
              title="Acompanhamento do Projeto"
              desc="Veja o roadmap da plataforma e solicite novos desenvolvimentos."
              status="disponivel"
              accent="slate"
              href="/painel"
            />
            {isPresident && (
              <DashCard
                Icon={Wallet}
                title="Tesouraria"
                desc="Contas a pagar e receber, bazar e gestão financeira simplificada da casa."
                status="breve"
                accent="amber"
                casa
              />
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
                <FeatureCard key={item.title} item={item} cat={cat} />
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
            <span className="text-xs text-muted-foreground/50 bg-white/60 border border-border px-2 py-0.5 rounded-full">
              Por casa espírita
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

function SectionHeader({ Icon, label, color, iconColor, bg, border, borderB, children }: {
  Icon: LucideIcon; label: string; color: string; iconColor: string;
  bg: string; border: string; borderB: string; children?: ReactNode;
}) {
  return (
    <div className={`flex items-center gap-4 mb-6 pb-4 border-b-2 ${borderB}`}>
      <div className={`w-10 h-10 rounded-xl ${bg} border ${border} flex items-center justify-center shrink-0`}>
        <Icon size={20} strokeWidth={1.5} className={iconColor} />
      </div>
      <h2 className={`text-base font-semibold ${color} tracking-wide`}>{label}</h2>
      {children && <div className="ml-auto flex items-center gap-2">{children}</div>}
    </div>
  );
}

function DashCard({ Icon, title, desc, status, accent, href, casa }: {
  Icon: LucideIcon; title: string; desc: string; status: Status;
  accent: string; href?: string; casa?: boolean;
}) {
  const borderMap: Record<string, string> = {
    slate: "border-t-slate-300",
    amber: "border-t-amber-300",
  };
  const iconMap: Record<string, string> = {
    slate: "bg-slate-50 border-slate-200 text-slate-500",
    amber: "bg-amber-50 border-amber-200 text-amber-600",
  };
  const content = (
    <div className={`glass rounded-2xl p-6 border-t-2 ${borderMap[accent] ?? "border-t-slate-300"} hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 h-full flex flex-col gap-4`}>
      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${iconMap[accent] ?? iconMap.slate}`}>
        <Icon size={20} strokeWidth={1.5} />
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-medium text-foreground leading-snug mb-1">{title}</h3>
        <p className="text-xs text-muted-foreground/70 leading-relaxed">{desc}</p>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border ${STATUS_STYLE[status]}`}>
          {STATUS_LABEL[status]}
        </span>
        {casa && (
          <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border border-border text-muted-foreground/50">
            Por casa
          </span>
        )}
      </div>
    </div>
  );
  if (href) return <Link to={href} className="block h-full">{content}</Link>;
  return content;
}

function FeatureCard({ item, cat }: { item: FeatureItem; cat: FeatureCategory }) {
  const isAvailable = item.status === "disponivel";
  const inner = (
    <div className={`group glass rounded-2xl p-5 flex flex-col gap-4 h-full transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${!isAvailable ? "opacity-80" : ""}`}>
      <div className={`w-10 h-10 rounded-xl ${cat.bg} border ${cat.border} flex items-center justify-center shrink-0`}>
        <item.Icon size={20} strokeWidth={1.5} className={cat.iconColor} />
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-medium text-foreground leading-snug mb-1">{item.title}</h3>
        <p className="text-xs text-muted-foreground/65 leading-relaxed">{item.desc}</p>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border ${STATUS_STYLE[item.status]}`}>
          {STATUS_LABEL[item.status]}
        </span>
        {item.casa && (
          <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border border-border text-muted-foreground/40">
            Por casa
          </span>
        )}
      </div>
    </div>
  );
  if (item.href) return <a href={item.href} className="block h-full">{inner}</a>;
  return inner;
}

function BazarCard({ item }: { item: typeof BAZAR[0] }) {
  return (
    <div className="glass rounded-2xl p-4 flex flex-col gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
      <div className="w-12 h-12 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center mx-auto">
        <item.Icon size={22} strokeWidth={1.5} className="text-cyan-700" />
      </div>
      <div className="text-center flex-1">
        <p className="text-xs text-muted-foreground/50 mb-0.5">{item.category}</p>
        <h3 className="text-xs font-medium text-foreground leading-snug mb-1">{item.name}</h3>
        <p className="text-[10px] text-muted-foreground/50">{item.desc}</p>
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-cyan-700 mb-2">{item.price}</p>
        <button className="w-full text-[10px] uppercase tracking-widest py-1.5 rounded-lg border border-cyan-200 text-cyan-700 hover:bg-cyan-50 transition-colors">
          Consultar
        </button>
      </div>
    </div>
  );
}
