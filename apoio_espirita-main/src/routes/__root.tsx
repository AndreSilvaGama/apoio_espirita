import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useNavigate,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

const PUBLIC_ROUTES = ["/", "/login", "/transparencia", "/sugestoes", "/feb", "/musicas-cifras"];
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { RadioProvider, useRadio } from "@/contexts/RadioContext";
import { supabase } from "@/integrations/supabase/client";
import { registrarServiceWorker, useInstalarApp } from "@/hooks/useInstalarApp";
import { useState, useEffect, useRef } from "react";
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
  AlertTriangle,
  MessageCircle,
  GraduationCap,
  Brain,
  ShieldAlert,
  HelpCircle,
  BookOpen,
  LogOut,
  BarChart2,
  LayoutDashboard,
  Sprout,
  Sparkles,
  Search,
  Download,
  MapPin,
  Users,
  ShoppingBag,
  Car,
  Truck,
  HeartHandshake,
  Cake,
  Clock,
  FileHeart,
  BellRing,
} from "lucide-react";

import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Apoio Espírita — Acolhimento, Estudo e Serviço" },
      {
        name: "description",
        content:
          "Plataforma espírita gratuita de acolhimento, estudo e serviço. Encontre sua casa espírita, envie mensagens do dia e conecte-se com a comunidade.",
      },
      {
        name: "keywords",
        content:
          "espiritismo, casa espírita, kardec, centro espírita, apoio espírita, doutrina espírita, caridade, evangelho",
      },
      { name: "author", content: "Apoio Espírita" },
      { name: "robots", content: "index, follow" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Apoio Espírita" },
      { property: "og:locale", content: "pt_BR" },
      { property: "og:url", content: "https://apoioespirita.com.br/" },
      { property: "og:title", content: "Apoio Espírita — Acolhimento, Estudo e Serviço" },
      {
        property: "og:description",
        content:
          "Plataforma espírita gratuita de acolhimento, estudo e serviço. Encontre sua casa espírita, envie mensagens do dia e conecte-se com a comunidade.",
      },
      { property: "og:image", content: "https://apoioespirita.com.br/og-image.png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Apoio Espírita — Acolhimento, Estudo e Serviço" },
      {
        name: "twitter:description",
        content:
          "Plataforma espírita gratuita de acolhimento, estudo e serviço para membros de casas espíritas.",
      },
      { name: "twitter:image", content: "https://apoioespirita.com.br/og-image.png" },
      // Instalação como aplicativo, sem loja
      { name: "theme-color", content: "#004a8c" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "Apoio Espírita" },
    ],
    links: [
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/favicon.png" },
      { rel: "canonical", href: "https://apoioespirita.com.br/" },
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@300;400;500;600;700&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Apoio Espírita",
          url: "https://apoioespirita.com.br/",
          description:
            "Plataforma espírita gratuita de acolhimento, estudo e serviço para membros de casas espíritas.",
          inLanguage: "pt-BR",
          potentialAction: {
            "@type": "SearchAction",
            target: "https://apoioespirita.com.br/?q={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Apoio Espírita",
          url: "https://apoioespirita.com.br/",
          logo: "https://apoioespirita.com.br/logomarca.png",
          sameAs: [],
          description:
            "Plataforma independente, sem vínculo com a FEB ou qualquer federação. Propósito: acolhimento, estudo e serviço.",
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Voltar ao topo"
      className="fixed bottom-32 sm:bottom-20 right-4 z-50 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-400 hover:text-gray-700 hover:shadow-lg transition-all duration-200"
    >
      <ArrowUp size={16} strokeWidth={2} />
    </button>
  );
}

const WHATSAPP_NUMBER = "5521984320107";

function ReportarProblema({ onClose }: { onClose: () => void }) {
  const { profile } = useAuth();
  const [descricao, setDescricao] = useState("");
  const [etapa, setEtapa] = useState<"form" | "whatsapp">("form");

  const handleEnviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim()) return;
    // Salva no banco para o digest diário
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase.from("problem_reports").insert({
          user_id: data.user.id,
          nome: profile?.nome ?? null,
          sigla_casa: profile?.sigla_casa ?? null,
          descricao: descricao.trim(),
        });
      }
    });
    const assunto = encodeURIComponent("Problema no site Apoio Espírita");
    const corpo = encodeURIComponent(
      `Olá,\n\nEncontrei um problema no site:\n\n${descricao.trim()}\n\n— ${profile?.nome ?? "Usuário"} (${profile?.sigla_casa ?? ""})`,
    );
    window.open(`mailto:gama.andre@gmail.com?subject=${assunto}&body=${corpo}`);
    setEtapa("whatsapp");
  };

  const handleWhatsApp = () => {
    const texto = encodeURIComponent(
      `Olá! Encontrei um problema no site Apoio Espírita:\n\n${descricao.trim()}\n\n— ${profile?.nome ?? "Usuário"} (${profile?.sigla_casa ?? ""})`,
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${texto}`, "_blank");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={18} strokeWidth={2} />
        </button>

        {etapa === "form" && (
          <>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={18} strokeWidth={1.5} className="text-amber-500" />
              <h2 className="text-base font-semibold text-gray-800">Reportar problema</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Descreva o que está acontecendo. Vou receber por e-mail e analisar assim que possível.
            </p>
            <form onSubmit={handleEnviar} className="space-y-4">
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Ex: ao clicar em Agenda, a página fica em branco..."
                rows={5}
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-cyan-500 resize-none transition-colors"
              />
              <button
                type="submit"
                disabled={!descricao.trim()}
                className="w-full py-2.5 rounded-xl text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-40 transition-colors"
              >
                Enviar por e-mail
              </button>
            </form>
          </>
        )}

        {etapa === "whatsapp" && (
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto">
              <MessageCircle size={22} strokeWidth={1.5} className="text-green-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-800">E-mail enviado!</h2>
              <p className="mt-1 text-sm text-gray-500">
                Deseja também me enviar uma mensagem pelo WhatsApp?
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleWhatsApp}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-green-500 text-white hover:bg-green-600 transition-colors"
              >
                Sim, abrir WhatsApp
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Não, obrigado
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AppLayout() {
  const { user, loading } = useAuth();
  const { location } = useRouterState();
  const [reportarAberto, setReportarAberto] = useState(false);

  const isPublic =
    PUBLIC_ROUTES.includes(location.pathname) ||
    location.pathname === "/jogos" ||
    location.pathname.startsWith("/jogos/");
  const isLightMode =
    !isPublic ||
    location.pathname === "/feb" ||
    location.pathname === "/jogos" ||
    location.pathname.startsWith("/jogos/");
  // Paginas publicas que usam o acabamento da area logada. Sao vitrine para quem
  // chega de fora — a pagina da casa, o diretorio de casas e a lista de artigos —
  // e nao faz sentido terem aparencia diferente da que o membro ve.
  const isVitrinePublica =
    location.pathname.startsWith("/casa/") ||
    location.pathname === "/casas" ||
    location.pathname.startsWith("/casas/") ||
    location.pathname === "/perguntas" ||
    location.pathname.startsWith("/perguntas/") ||
    location.pathname.startsWith("/artigos");

  useEffect(() => {
    if (isLightMode) {
      // Combina com o chão da camada "Definição" para o overscroll não
      // revelar um tom diferente por trás da página.
      document.body.style.backgroundColor = user || isVitrinePublica ? "#e6ebf4" : "#f7f8fc";
      document.body.style.backgroundImage = "none";
      document.body.style.color = "#111418";
    } else {
      document.body.style.backgroundColor = "";
      document.body.style.backgroundImage = "";
      document.body.style.color = "";
    }
  }, [isLightMode, user, isVitrinePublica]);

  // A vitrine publica nao espera a autenticacao para aparecer. No servidor nao
  // existe sessao, entao `loading` nasce verdadeiro: com esta tela de espera no
  // caminho, o HTML entregue ao buscador continha apenas "Carregando..." — e o
  // conteudo que existe para ser encontrado nunca chegava a ser lido.
  if (loading && !isPublic && !isVitrinePublica) {
    return (
      <div className="page-light min-h-screen flex flex-col items-center justify-center bg-[#f7f8fc] text-[#111418] px-4">
        <div
          className="text-center space-y-4 max-w-sm animate-pulse-glow"
          style={{ animationDuration: "3s" }}
        >
          <div className="w-10 h-10 border-3 border-[#004a8c] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs uppercase tracking-[0.2em] text-[#004a8c] font-semibold">
            Apoio Espírita
          </p>
          <p className="text-sm text-gray-500 font-light">Carregando painel de acolhimento...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={
        isLightMode
          ? // sw-app: camada "Definição" (ver src/styles.css). Entra para quem
            // está autenticado e também na página pública da casa, que é a
            // vitrine da casa espírita para quem chega de fora. As demais
            // telas anteriores ao login seguem intocadas.
            `page-light min-h-screen flex flex-col ${
              user || isVitrinePublica ? "sw-app" : "bg-[#f7f8fc]"
            }`
          : "min-h-screen flex flex-col"
      }
    >
      <NavBar />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer onReportar={() => setReportarAberto(true)} />
      <BackToTop />
      {reportarAberto && <ReportarProblema onClose={() => setReportarAberto(false)} />}
    </div>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  // Registro único: guarda os arquivos com código no nome e o aviso de falta
  // de conexão. É também o que torna o site instalável no Android.
  useEffect(() => {
    registrarServiceWorker();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RadioProvider>
          <AppLayout />
          <Toaster />
        </RadioProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

/* ── Navbar ── */

/**
 * Os dez destinos do menu não cabiam lado a lado: em 1366px eles espremiam o
 * campo de busca até ele virar um círculo. Agora os de conteúdo ficam
 * agrupados em dois menus com nome escrito, e no topo permanecem apenas os
 * destinos de uso diário.
 *
 * Nenhum grupo é identificado só por ícone, de propósito: boa parte de quem
 * usa o site tem dificuldade com tecnologia, e um desenho sem palavra obriga
 * a adivinhar o que há atrás dele.
 */
type MenuSuspenso = "comunidade" | "estudo" | "jogos" | "ajuda";

function NavBar() {
  const { user, profile, isDev, isDecisao, signOut } = useAuth();
  const { location } = useRouterState();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [aberto, setAberto] = useState<MenuSuspenso | null>(null);
  const [abertoMobile, setAbertoMobile] = useState<MenuSuspenso | null>(null);
  const [buscaTopo, setBuscaTopo] = useState("");
  const { instalavel, instalar } = useInstalarApp();
  const navRef = useRef<HTMLElement>(null);

  // Enter no campo do cabeçalho leva à tela de busca com o termo já aplicado.
  // O campo é limpo em seguida: quem chega lá encontra o termo no campo da
  // própria tela, e dois campos com textos diferentes confundiriam.
  const enviarBusca = (e: React.FormEvent) => {
    e.preventDefault();
    const termo = buscaTopo.trim();
    setBuscaTopo("");
    navigate({ to: "/busca", search: termo ? { q: termo } : {} });
  };

  useEffect(() => {
    setMenuOpen(false);
    setAberto(null);
    setAbertoMobile(null);
  }, [location.pathname]);

  useEffect(() => {
    function aoClicarFora(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setAberto(null);
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, []);

  const isPublicRoute =
    PUBLIC_ROUTES.includes(location.pathname) ||
    location.pathname === "/jogos" ||
    location.pathname.startsWith("/jogos/");
  const hideNavBar =
    isPublicRoute &&
    location.pathname !== "/feb" &&
    location.pathname !== "/jogos" &&
    !location.pathname.startsWith("/jogos/");
  if (!user || hideNavBar) return null;

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");
  const isAnyActive = (paths: string[]) => paths.some((p) => isActive(p));

  const linkCls = (path: string) =>
    `px-3.5 py-2 text-sm font-medium rounded-xl transition-all duration-300 ${
      isActive(path)
        ? "bg-[#ebf0f9] text-[#004a8c] shadow-sm border border-[#004a8c]/10"
        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
    }`;

  const dropItemCls =
    "flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#ebf0f9] hover:text-[#004a8c] rounded-lg mx-1 my-0.5 transition-all duration-200";

  const itemMobileCls =
    "py-3 px-2 text-sm font-medium text-gray-700 hover:text-[#004a8c] border-b border-gray-100 transition-colors";
  const subItemMobileCls =
    "py-3 pl-5 pr-2 text-sm text-gray-600 hover:text-[#004a8c] border-b border-gray-100 transition-colors";
  const grupoMobileCls =
    "flex items-center justify-between py-3 px-2 text-sm font-semibold text-gray-600 border-b border-gray-100 hover:text-[#004a8c] transition-colors";

  const alternar = (menu: MenuSuspenso) => setAberto((atual) => (atual === menu ? null : menu));
  const alternarMobile = (menu: MenuSuspenso) =>
    setAbertoMobile((atual) => (atual === menu ? null : menu));

  const homePath = profile?.sigla_casa ? `/casa/${profile.sigla_casa}` : "/inicio";

  const ROTAS_COMUNIDADE = [
    "/forum",
    "/grupos",
    "/voluntariado",
    "/bazar",
    "/caronas",
    "/entregas",
    "/aniversariantes",
    "/oracoes",
    "/jovens",
    "/atendimento-fraterno",
  ];
  const ROTAS_ESTUDO = ["/feb", "/artigos", "/perguntas", "/evangelizacao", "/musicas-cifras"];
  const ROTAS_JOGOS = ["/jogos", "/configurar-memoria"];
  const ROTAS_AJUDA = ["/painel", "/ajuda", "/admin", "/permissoes", "/casas", "/avisos"];

  return (
    <header
      className={`fixed z-50 bg-white shadow-sm transition-all duration-200 h-14 top-0 left-0 right-0 w-full !border-t-0 !border-x-0 !border-b border-gray-200 !rounded-none lg:top-3 lg:left-4 lg:right-4 lg:w-auto lg:max-w-7xl lg:mx-auto lg:!border lg:shadow-md ${
        menuOpen
          ? "lg:!rounded-t-2xl lg:!rounded-b-none lg:border-b-transparent"
          : "lg:!rounded-2xl"
      }`}
    >
      <div className="h-full px-5 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link
          to={profile?.sigla_casa ? "/casa/$sigla" : "/inicio"}
          params={profile?.sigla_casa ? { sigla: profile.sigla_casa } : undefined}
          className="flex items-center gap-2 shrink-0"
          onClick={() => setMenuOpen(false)}
        >
          <img src="/logomarca.png" alt="Apoio Espírita" className="h-8 w-auto" />
          <span className="text-sm font-semibold text-gray-800 tracking-tight">Apoio Espírita</span>
        </Link>

        {/* Campo de busca. Largura fixa e shrink-0: com largura elástica ele
            era esmagado pelo menu até virar um círculo sem utilidade. */}
        <form role="search" onSubmit={enviarBusca} className="hidden xl:block w-[230px] shrink-0">
          <div className="relative w-full">
            <Search
              size={15}
              strokeWidth={2}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="search"
              value={buscaTopo}
              onChange={(e) => setBuscaTopo(e.target.value)}
              placeholder="Buscar..."
              aria-label="Buscar no site"
              className="w-full h-9 rounded-xl bg-gray-50 border border-gray-200 pl-9 pr-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#004a8c]/40 transition-colors"
            />
          </div>
        </form>

        {/* Desktop nav */}
        <nav ref={navRef} className="hidden lg:flex items-center gap-1">
          {/* Onde o campo não cabe, a busca vira um item escrito do menu */}
          <Link
            to="/busca"
            search={{}}
            className={`${linkCls("/busca")} xl:hidden flex items-center gap-1.5`}
          >
            <Search size={14} strokeWidth={2} />
            Buscar
          </Link>

          <Link
            to={profile?.sigla_casa ? "/casa/$sigla" : "/inicio"}
            params={profile?.sigla_casa ? { sigla: profile.sigla_casa } : undefined}
            className={linkCls(homePath)}
          >
            Minha Casa
          </Link>
          <Link to="/agenda" className={linkCls("/agenda")}>
            Agenda
          </Link>
          <Link to="/kanban" className={linkCls("/kanban")}>
            Projetos
          </Link>

          <GrupoSuspenso
            rotulo="Comunidade"
            aberto={aberto === "comunidade"}
            ativo={isAnyActive(ROTAS_COMUNIDADE)}
            aoAlternar={() => alternar("comunidade")}
            largura="w-60"
          >
            <Link to="/forum" className={dropItemCls} onClick={() => setAberto(null)}>
              <MessageCircle size={14} strokeWidth={1.5} className="text-violet-500" />
              Fórum de Apoio
            </Link>
            <Link to="/grupos" className={dropItemCls} onClick={() => setAberto(null)}>
              <Users size={14} strokeWidth={1.5} className="text-cyan-500" />
              Grupos
            </Link>
            <Link to="/voluntariado" className={dropItemCls} onClick={() => setAberto(null)}>
              <HeartHandshake size={14} strokeWidth={1.5} className="text-rose-500" />
              Voluntariado
            </Link>
            <Link to="/bazar" className={dropItemCls} onClick={() => setAberto(null)}>
              <ShoppingBag size={14} strokeWidth={1.5} className="text-amber-500" />
              Bazar On-line
            </Link>
            <Link to="/caronas" className={dropItemCls} onClick={() => setAberto(null)}>
              <Car size={14} strokeWidth={1.5} className="text-emerald-500" />
              Carona Solidária
            </Link>
            <Link to="/entregas" className={dropItemCls} onClick={() => setAberto(null)}>
              <Truck size={14} strokeWidth={1.5} className="text-[#004a8c]" />
              Entrega Solidária
            </Link>
            <Link to="/aniversariantes" className={dropItemCls} onClick={() => setAberto(null)}>
              <Cake size={14} strokeWidth={1.5} className="text-violet-500" />
              Aniversariantes
            </Link>
            <Link to="/oracoes" className={dropItemCls} onClick={() => setAberto(null)}>
              <Clock size={14} strokeWidth={1.5} className="text-cyan-500" />
              Plantão de Orações
            </Link>
            <Link to="/jovens" className={dropItemCls} onClick={() => setAberto(null)}>
              <Sparkles size={14} strokeWidth={1.5} className="text-amber-500" />
              Área de Jovens
            </Link>
            <Link
              to="/atendimento-fraterno"
              className={dropItemCls}
              onClick={() => setAberto(null)}
            >
              <FileHeart size={14} strokeWidth={1.5} className="text-rose-500" />
              Atendimento Fraterno
            </Link>
          </GrupoSuspenso>

          <GrupoSuspenso
            rotulo="Estudo"
            aberto={aberto === "estudo"}
            ativo={isAnyActive(ROTAS_ESTUDO)}
            aoAlternar={() => alternar("estudo")}
          >
            <Link to="/feb" className={dropItemCls} onClick={() => setAberto(null)}>
              <BookOpen size={14} strokeWidth={1.5} className="text-[#004a8c]" />
              Biblioteca
            </Link>
            <Link to="/artigos" className={dropItemCls} onClick={() => setAberto(null)}>
              <MessageCircle size={14} strokeWidth={1.5} className="text-violet-500" />
              Artigos
            </Link>
            <Link to="/perguntas" className={dropItemCls} onClick={() => setAberto(null)}>
              <HelpCircle size={14} strokeWidth={1.5} className="text-amber-500" />
              Perguntas sobre a doutrina
            </Link>
            <Link to="/evangelizacao" className={dropItemCls} onClick={() => setAberto(null)}>
              <GraduationCap size={14} strokeWidth={1.5} className="text-emerald-500" />
              Evangelização
            </Link>
            <Link to="/musicas-cifras" className={dropItemCls} onClick={() => setAberto(null)}>
              <Sparkles size={14} strokeWidth={1.5} className="text-rose-500" />
              Músicas e Cifras
            </Link>
          </GrupoSuspenso>

          <GrupoSuspenso
            rotulo="Jogos"
            aberto={aberto === "jogos"}
            ativo={isAnyActive(ROTAS_JOGOS)}
            aoAlternar={() => alternar("jogos")}
          >
            <Link
              to="/jogos/semeador-mensagens"
              className={dropItemCls}
              onClick={() => setAberto(null)}
            >
              <Sparkles size={14} strokeWidth={1.5} className="text-rose-500" />
              Semeador de Mensagens
            </Link>
            <Link to="/jogos/caca-palavras" className={dropItemCls} onClick={() => setAberto(null)}>
              <Search size={14} strokeWidth={1.5} className="text-violet-500" />
              Caça-Palavras
            </Link>
            <Link
              to="/jogos/plante-a-semente"
              className={dropItemCls}
              onClick={() => setAberto(null)}
            >
              <Sprout size={14} strokeWidth={1.5} className="text-emerald-500" />
              Plante a Semente
            </Link>
            <Link
              to="/jogos/memoria-evangelizacao"
              className={dropItemCls}
              onClick={() => setAberto(null)}
            >
              <Brain size={14} strokeWidth={1.5} className="text-cyan-500" />
              Jogo da Memória
            </Link>
            <Link to="/jogos/quiz-espirita" className={dropItemCls} onClick={() => setAberto(null)}>
              <HelpCircle size={14} strokeWidth={1.5} className="text-[#004a8c]" />
              Quiz Espírita
            </Link>
          </GrupoSuspenso>

          <GrupoSuspenso
            rotulo="Ajuda"
            aberto={aberto === "ajuda"}
            ativo={isAnyActive(ROTAS_AJUDA)}
            aoAlternar={() => alternar("ajuda")}
            alinhamento="right"
            largura="w-52"
          >
            {isDev && (
              <Link to="/admin" className={dropItemCls} onClick={() => setAberto(null)}>
                <LayoutDashboard size={14} strokeWidth={1.5} className="text-violet-500" />
                Painel do Administrador
              </Link>
            )}
            <Link to="/painel" className={dropItemCls} onClick={() => setAberto(null)}>
              <BarChart2 size={14} strokeWidth={1.5} className="text-cyan-500" />
              Status do Projeto
            </Link>
            <Link to="/casas" className={dropItemCls} onClick={() => setAberto(null)}>
              <MapPin size={14} strokeWidth={1.5} className="text-emerald-500" />
              Casas espíritas
            </Link>
            <Link to="/ajuda" className={dropItemCls} onClick={() => setAberto(null)}>
              <MessageCircle size={14} strokeWidth={1.5} className="text-gray-400" />
              FAQ / Dúvidas
            </Link>
            <Link to="/avisos" className={dropItemCls} onClick={() => setAberto(null)}>
              <BellRing size={14} strokeWidth={1.5} className="text-amber-500" />
              Avisos por e-mail
            </Link>
            {instalavel && (
              <button
                type="button"
                className={dropItemCls}
                onClick={() => {
                  setAberto(null);
                  void instalar();
                }}
              >
                <Download size={14} strokeWidth={1.5} className="text-emerald-500" />
                Instalar aplicativo
              </button>
            )}
            {isDecisao && (
              <Link to="/permissoes" className={dropItemCls} onClick={() => setAberto(null)}>
                <ShieldAlert size={14} strokeWidth={1.5} className="text-amber-500" />
                Permissões
              </Link>
            )}
          </GrupoSuspenso>

          <button
            onClick={() => signOut()}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-gray-400 hover:bg-gray-50 rounded-xl transition-all duration-300"
          >
            <LogOut size={14} strokeWidth={1.5} />
            Sair
          </button>
        </nav>

        {/* Busca e menu, no celular */}
        <div className="lg:hidden flex items-center gap-1">
          <Link
            to="/busca"
            search={{}}
            aria-label="Buscar no site"
            onClick={() => setMenuOpen(false)}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <Search size={22} strokeWidth={2} />
          </Link>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menuOpen}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            {menuOpen ? <X size={20} strokeWidth={2} /> : <Menu size={20} strokeWidth={2} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div
          className="lg:hidden absolute top-14 left-0 right-0 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-lg z-40 py-2 rounded-none animate-fade-in-up"
          style={{ animationDuration: "200ms" }}
        >
          <div className="max-w-7xl mx-auto px-4 flex flex-col">
            <Link to="/busca" search={{}} className={`${itemMobileCls} flex items-center gap-2`}>
              <Search size={15} strokeWidth={2} className="text-gray-400" />
              Buscar no site
            </Link>
            <Link
              to={profile?.sigla_casa ? "/casa/$sigla" : "/inicio"}
              params={profile?.sigla_casa ? { sigla: profile.sigla_casa } : undefined}
              className={itemMobileCls}
            >
              Minha Casa
            </Link>
            <Link to="/agenda" className={itemMobileCls}>
              Agenda
            </Link>
            <Link to="/kanban" className={itemMobileCls}>
              Projetos
            </Link>

            <button onClick={() => alternarMobile("comunidade")} className={grupoMobileCls}>
              Comunidade
              <ChevronDown
                size={14}
                strokeWidth={2}
                className={`transition-transform ${abertoMobile === "comunidade" ? "rotate-180" : ""}`}
              />
            </button>
            {abertoMobile === "comunidade" && (
              <>
                <Link to="/forum" className={subItemMobileCls}>
                  Fórum de Apoio
                </Link>
                <Link to="/grupos" className={subItemMobileCls}>
                  Grupos
                </Link>
                <Link to="/voluntariado" className={subItemMobileCls}>
                  Voluntariado
                </Link>
                <Link to="/bazar" className={subItemMobileCls}>
                  Bazar On-line
                </Link>
                <Link to="/caronas" className={subItemMobileCls}>
                  Carona Solidária
                </Link>
                <Link to="/entregas" className={subItemMobileCls}>
                  Entrega Solidária
                </Link>
                <Link to="/aniversariantes" className={subItemMobileCls}>
                  Aniversariantes
                </Link>
                <Link to="/oracoes" className={subItemMobileCls}>
                  Plantão de Orações
                </Link>
                <Link to="/jovens" className={subItemMobileCls}>
                  Área de Jovens
                </Link>
                <Link to="/atendimento-fraterno" className={subItemMobileCls}>
                  Atendimento Fraterno
                </Link>
              </>
            )}

            <button onClick={() => alternarMobile("estudo")} className={grupoMobileCls}>
              Estudo
              <ChevronDown
                size={14}
                strokeWidth={2}
                className={`transition-transform ${abertoMobile === "estudo" ? "rotate-180" : ""}`}
              />
            </button>
            {abertoMobile === "estudo" && (
              <>
                <Link to="/feb" className={subItemMobileCls}>
                  Biblioteca
                </Link>
                <Link to="/artigos" className={subItemMobileCls}>
                  Artigos
                </Link>
                <Link to="/evangelizacao" className={subItemMobileCls}>
                  Evangelização
                </Link>
                <Link to="/musicas-cifras" className={subItemMobileCls}>
                  Músicas e Cifras
                </Link>
              </>
            )}

            <button onClick={() => alternarMobile("jogos")} className={grupoMobileCls}>
              Jogos
              <ChevronDown
                size={14}
                strokeWidth={2}
                className={`transition-transform ${abertoMobile === "jogos" ? "rotate-180" : ""}`}
              />
            </button>
            {abertoMobile === "jogos" && (
              <>
                <Link to="/jogos/semeador-mensagens" className={subItemMobileCls}>
                  Semeador de Mensagens
                </Link>
                <Link to="/jogos/caca-palavras" className={subItemMobileCls}>
                  Caça-Palavras
                </Link>
                <Link to="/jogos/plante-a-semente" className={subItemMobileCls}>
                  Plante a Semente
                </Link>
                <Link to="/jogos/memoria-evangelizacao" className={subItemMobileCls}>
                  Jogo da Memória
                </Link>
                <Link to="/jogos/quiz-espirita" className={subItemMobileCls}>
                  Quiz Espírita
                </Link>
              </>
            )}

            <button onClick={() => alternarMobile("ajuda")} className={grupoMobileCls}>
              Ajuda
              <ChevronDown
                size={14}
                strokeWidth={2}
                className={`transition-transform ${abertoMobile === "ajuda" ? "rotate-180" : ""}`}
              />
            </button>
            {abertoMobile === "ajuda" && (
              <>
                {isDev && (
                  <Link to="/admin" className={subItemMobileCls}>
                    Painel do Administrador
                  </Link>
                )}
                <Link to="/painel" className={subItemMobileCls}>
                  Status do Projeto
                </Link>
                <Link to="/ajuda" className={subItemMobileCls}>
                  FAQ / Dúvidas
                </Link>
                <Link to="/avisos" className={subItemMobileCls}>
                  Avisos por e-mail
                </Link>
                {instalavel && (
                  <button
                    type="button"
                    onClick={() => void instalar()}
                    className={`${subItemMobileCls} text-left`}
                  >
                    Instalar aplicativo
                  </button>
                )}
                {isDecisao && (
                  <Link to="/permissoes" className={subItemMobileCls}>
                    Permissões
                  </Link>
                )}
              </>
            )}

            <button
              onClick={() => signOut()}
              className="py-3 px-2 text-sm font-medium text-left text-red-400 hover:text-red-600 transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

/** Botão de menu com a lista que se abre abaixo dele. */
function GrupoSuspenso({
  rotulo,
  aberto,
  ativo,
  aoAlternar,
  alinhamento = "left",
  largura = "w-56",
  children,
}: {
  rotulo: string;
  aberto: boolean;
  ativo: boolean;
  aoAlternar: () => void;
  alinhamento?: "left" | "right";
  largura?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <button
        onClick={aoAlternar}
        aria-expanded={aberto}
        aria-haspopup="menu"
        className={`flex items-center gap-1 px-3.5 py-2 text-sm font-medium rounded-xl transition-all duration-300 ${
          ativo
            ? "bg-[#ebf0f9] text-[#004a8c] shadow-sm border border-[#004a8c]/10"
            : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
        }`}
      >
        {rotulo}
        <ChevronDown
          size={12}
          strokeWidth={2.5}
          className={`transition-transform ${aberto ? "rotate-180" : ""}`}
        />
      </button>
      {aberto && (
        <div
          className={`absolute top-full ${alinhamento === "right" ? "right-0" : "left-0"} mt-2 ${largura} bg-white/95 backdrop-blur-md border border-gray-100 rounded-2xl shadow-xl py-1.5 z-50 animate-fade-in-up`}
          style={{ animationDuration: "200ms" }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

/* ── Footer ── */
function Footer({ onReportar }: { onReportar: () => void }) {
  const { active, playing, buffering, volume, muted, activate, togglePlay, setVolume, toggleMute } =
    useRadio();
  const { location } = useRouterState();
  if (location.pathname === "/login") return null;

  return (
    <div className="page-light bg-transparent">
      <footer className="relative mt-12 mb-6 mx-4 rounded-2xl bg-white border border-gray-200 shadow-md max-w-7xl lg:mx-auto">
        <div className="px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Rádio */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Ícone */}
            <div
              className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-500 order-3 sm:order-none ${
                playing
                  ? "bg-emerald-50/70 border-emerald-300/60 shadow-[0_0_15px_rgba(16,185,129,0.15)] animate-pulse"
                  : "bg-gray-50/60 border-gray-200/50"
              }`}
            >
              <Radio
                size={18}
                strokeWidth={1.5}
                className={playing ? "text-emerald-600" : "text-gray-400"}
              />
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1 order-2 sm:order-none">
              <Link to="/radio" className="hover:underline underline-offset-2">
                <p className="text-sm font-semibold text-gray-800 leading-tight">
                  Rádio Rio de Janeiro
                </p>
              </Link>
              <div className="flex items-center gap-2 mt-0.5">
                {buffering && (
                  <span className="text-xs text-gray-400 animate-pulse">Conectando...</span>
                )}
                {!buffering && playing && (
                  <div className="flex items-center gap-1.5">
                    <span className="flex gap-0.5 items-end h-3">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <span
                          key={i}
                          className="w-0.5 rounded-full bg-emerald-500 radio-bar"
                          style={{
                            animationDelay: `${i * 0.15}s`,
                            animationDuration: `${0.6 + i * 0.1}s`,
                          }}
                        />
                      ))}
                    </span>
                    <span className="text-xs font-semibold text-emerald-600 tracking-wider uppercase">
                      Ao vivo
                    </span>
                  </div>
                )}
                {!buffering && !playing && (
                  <span className="text-xs text-gray-400">
                    {active ? "Pausado · clique para retomar" : "1400 AM · Espiritismo 24h"}
                  </span>
                )}
              </div>
            </div>

            {/* Botão play/pause — tamanho grande para facilitar toque */}
            <button
              onClick={active ? togglePlay : activate}
              disabled={buffering}
              className={`shrink-0 w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-300 text-base font-bold shadow-sm order-1 sm:order-none ${
                playing
                  ? "bg-emerald-500 border-emerald-400 text-white hover:bg-emerald-600 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] active:scale-95"
                  : "bg-white border-emerald-300 text-emerald-600 hover:bg-emerald-50 active:scale-95"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {playing ? (
                <Pause size={16} strokeWidth={2.5} />
              ) : (
                <Play size={16} strokeWidth={2.5} className="ml-0.5" />
              )}
            </button>

            {/* Volume — só em telas médias+ */}
            <div className="hidden md:flex items-center gap-2 shrink-0">
              <button
                onClick={toggleMute}
                className="text-gray-400 hover:text-gray-700 transition-colors p-1"
              >
                {muted || volume === 0 ? (
                  <VolumeX size={16} strokeWidth={1.5} />
                ) : (
                  <Volume2 size={16} strokeWidth={1.5} />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={muted ? 0 : volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-24 accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Separador vertical — só desktop */}
          <div className="hidden sm:block h-8 w-px bg-gray-200 shrink-0" />

          {/* Links institucionais */}
          <div className="flex items-center gap-4 shrink-0">
            <Link
              to="/perguntas"
              className="text-xs text-gray-400 hover:text-gray-700 transition-colors whitespace-nowrap"
            >
              Dúvidas sobre a doutrina
            </Link>
            <Link
              to="/casas"
              className="text-xs text-gray-400 hover:text-gray-700 transition-colors whitespace-nowrap"
            >
              Casas espíritas
            </Link>
            <Link
              to="/transparencia"
              className="text-xs text-gray-400 hover:text-gray-700 transition-colors whitespace-nowrap"
            >
              Transparência
            </Link>
            <Link
              to="/sugestoes"
              className="text-xs text-gray-400 hover:text-gray-700 transition-colors whitespace-nowrap"
            >
              Sugestões
            </Link>
            <button
              onClick={onReportar}
              className="text-xs text-gray-400 hover:text-amber-600 transition-colors whitespace-nowrap"
            >
              Reportar problema
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
