import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

const PUBLIC_ROUTES = ["/", "/login", "/transparencia", "/sugestoes", "/feb", "/musicas-cifras"];
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { RadioProvider, useRadio } from "@/contexts/RadioContext";
import { supabase } from "@/integrations/supabase/client";
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
  CalendarDays,
  KanbanSquare,
  Building2,
  LayoutDashboard,
  Sprout,
  Sparkles,
  Search,
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
    ],
    links: [
      { rel: "icon", type: "image/png", href: "/favicon.png" },
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

  useEffect(() => {
    if (isLightMode) {
      document.body.style.backgroundColor = "#f7f8fc";
      document.body.style.backgroundImage = "none";
      document.body.style.color = "#111418";
    } else {
      document.body.style.backgroundColor = "";
      document.body.style.backgroundImage = "";
      document.body.style.color = "";
    }
  }, [isLightMode]);

  if (loading && !isPublic) {
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
          ? "page-light min-h-screen flex flex-col bg-[#f7f8fc]"
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
function NavBar() {
  const { user, profile, isDev, isTesoureiro, isDecisao, isEvangelizador, signOut } = useAuth();
  const { location } = useRouterState();
  const [menuOpen, setMenuOpen] = useState(false);
  const [recursosOpen, setRecursosOpen] = useState(false);
  const [ajudaOpen, setAjudaOpen] = useState(false);
  const [recursosMobileOpen, setRecursosMobileOpen] = useState(false);
  const [ajudaMobileOpen, setAjudaMobileOpen] = useState(false);
  const recursosRef = useRef<HTMLDivElement>(null);
  const ajudaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMenuOpen(false);
    setRecursosOpen(false);
    setAjudaOpen(false);
    setRecursosMobileOpen(false);
    setAjudaMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (recursosRef.current && !recursosRef.current.contains(e.target as Node)) {
        setRecursosOpen(false);
      }
      if (ajudaRef.current && !ajudaRef.current.contains(e.target as Node)) {
        setAjudaOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

  const dropBtnCls = (paths: string[]) =>
    `flex items-center gap-1 px-3.5 py-2 text-sm font-medium rounded-xl transition-all duration-300 ${
      isAnyActive(paths)
        ? "bg-[#ebf0f9] text-[#004a8c] shadow-sm border border-[#004a8c]/10"
        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
    }`;

  const dropItemCls =
    "flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#ebf0f9] hover:text-[#004a8c] rounded-lg mx-1 my-0.5 transition-all duration-200";

  const homePath = profile?.sigla_casa ? `/casa/${profile.sigla_casa}` : "/inicio";

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

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1">
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
          <Link to="/evangelizacao" className={linkCls("/evangelizacao")}>
            Evangelização
          </Link>
          <Link to="/feb" className={linkCls("/feb")}>
            Biblioteca
          </Link>
          <Link to="/musicas-cifras" className={linkCls("/musicas-cifras")}>
            Músicas
          </Link>
          <Link to="/kanban" className={linkCls("/kanban")}>
            Projetos
          </Link>

          {/* Recursos dropdown */}
          <div ref={recursosRef} className="relative">
            <button
              onClick={() => {
                setRecursosOpen((o) => !o);
                setAjudaOpen(false);
              }}
              className={dropBtnCls(["/jogos", "/configurar-memoria"])}
            >
              Jogos
              <ChevronDown
                size={12}
                strokeWidth={2.5}
                className={`transition-transform ${recursosOpen ? "rotate-180" : ""}`}
              />
            </button>
            {recursosOpen && (
              <div
                className="absolute top-full left-0 mt-2 w-56 bg-white/95 backdrop-blur-md border border-gray-100 rounded-2xl shadow-xl py-1.5 z-50 animate-fade-in-up"
                style={{ animationDuration: "200ms" }}
              >
                <Link
                  to="/jogos/semeador-mensagens"
                  className={dropItemCls}
                  onClick={() => setRecursosOpen(false)}
                >
                  <Sparkles size={14} strokeWidth={1.5} className="text-rose-500" />
                  Semeador de Mensagens
                </Link>
                <Link
                  to="/jogos/caca-palavras"
                  className={dropItemCls}
                  onClick={() => setRecursosOpen(false)}
                >
                  <Search size={14} strokeWidth={1.5} className="text-violet-500" />
                  Caça-Palavras
                </Link>
                <Link
                  to="/jogos/plante-a-semente"
                  className={dropItemCls}
                  onClick={() => setRecursosOpen(false)}
                >
                  <Sprout size={14} strokeWidth={1.5} className="text-emerald-500" />
                  Plante a Semente
                </Link>
                <Link
                  to="/jogos/memoria-evangelizacao"
                  className={dropItemCls}
                  onClick={() => setRecursosOpen(false)}
                >
                  <Brain size={14} strokeWidth={1.5} className="text-cyan-500" />
                  Jogo da Memória
                </Link>
                <Link
                  to="/jogos/quiz-espirita"
                  className={dropItemCls}
                  onClick={() => setRecursosOpen(false)}
                >
                  <HelpCircle size={14} strokeWidth={1.5} className="text-[#004a8c]" />
                  Quiz Espírita
                </Link>
              </div>
            )}
          </div>

          {/* Ajuda dropdown */}
          <div ref={ajudaRef} className="relative">
            <button
              onClick={() => {
                setAjudaOpen((o) => !o);
                setRecursosOpen(false);
              }}
              className={dropBtnCls(["/painel", "/ajuda", "/admin", "/permissoes"])}
            >
              Ajuda
              <ChevronDown
                size={12}
                strokeWidth={2.5}
                className={`transition-transform ${ajudaOpen ? "rotate-180" : ""}`}
              />
            </button>
            {ajudaOpen && (
              <div
                className="absolute top-full right-0 mt-2 w-52 bg-white/95 backdrop-blur-md border border-gray-100 rounded-2xl shadow-xl py-1.5 z-50 animate-fade-in-up"
                style={{ animationDuration: "200ms" }}
              >
                {isDev && (
                  <Link to="/admin" className={dropItemCls} onClick={() => setAjudaOpen(false)}>
                    <LayoutDashboard size={14} strokeWidth={1.5} className="text-violet-500" />
                    Painel do Administrador
                  </Link>
                )}
                <Link to="/painel" className={dropItemCls} onClick={() => setAjudaOpen(false)}>
                  <BarChart2 size={14} strokeWidth={1.5} className="text-cyan-500" />
                  Status do Projeto
                </Link>
                <Link to="/ajuda" className={dropItemCls} onClick={() => setAjudaOpen(false)}>
                  <MessageCircle size={14} strokeWidth={1.5} className="text-gray-400" />
                  FAQ / Dúvidas
                </Link>
                {isDecisao && (
                  <Link
                    to="/permissoes"
                    className={dropItemCls}
                    onClick={() => setAjudaOpen(false)}
                  >
                    <ShieldAlert size={14} strokeWidth={1.5} className="text-amber-500" />
                    Permissões
                  </Link>
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => signOut()}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-gray-400 hover:bg-gray-50 rounded-xl transition-all duration-300"
          >
            <LogOut size={14} strokeWidth={1.5} />
            Sair
          </button>
        </nav>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
          className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        >
          {menuOpen ? <X size={20} strokeWidth={2} /> : <Menu size={20} strokeWidth={2} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div
          className="lg:hidden absolute top-14 left-0 right-0 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-lg z-40 py-2 rounded-none animate-fade-in-up"
          style={{ animationDuration: "200ms" }}
        >
          <div className="max-w-7xl mx-auto px-4 flex flex-col">
            <Link
              to={profile?.sigla_casa ? "/casa/$sigla" : "/inicio"}
              params={profile?.sigla_casa ? { sigla: profile.sigla_casa } : undefined}
              className="py-3 px-2 text-sm font-medium text-gray-700 hover:text-[#004a8c] border-b border-gray-100 transition-colors"
            >
              Minha Casa
            </Link>
            <Link
              to="/agenda"
              className="py-3 px-2 text-sm font-medium text-gray-700 hover:text-[#004a8c] border-b border-gray-100 transition-colors"
            >
              Agenda
            </Link>
            <Link
              to="/evangelizacao"
              className="py-3 px-2 text-sm font-medium text-gray-700 hover:text-[#004a8c] border-b border-gray-100 transition-colors"
            >
              Evangelização
            </Link>
            <Link
              to="/feb"
              className="py-3 px-2 text-sm font-medium text-gray-700 hover:text-[#004a8c] border-b border-gray-100 transition-colors"
            >
              Biblioteca
            </Link>
            <Link
              to="/musicas-cifras"
              className="py-3 px-2 text-sm font-medium text-gray-700 hover:text-[#004a8c] border-b border-gray-100 transition-colors"
            >
              Músicas
            </Link>
            <Link
              to="/kanban"
              className="py-3 px-2 text-sm font-medium text-gray-700 hover:text-[#004a8c] border-b border-gray-100 transition-colors"
            >
              Projetos
            </Link>

            {/* Seção Recursos */}
            <button
              onClick={() => setRecursosMobileOpen((o) => !o)}
              className="flex items-center justify-between py-3 px-2 text-sm font-semibold text-gray-600 border-b border-gray-100 hover:text-[#004a8c] transition-colors"
            >
              Jogos
              <ChevronDown
                size={14}
                strokeWidth={2}
                className={`transition-transform ${recursosMobileOpen ? "rotate-180" : ""}`}
              />
            </button>
            {recursosMobileOpen && (
              <>
                <Link
                  to="/jogos/semeador-mensagens"
                  className="py-3 pl-5 pr-2 text-sm text-gray-600 hover:text-[#004a8c] border-b border-gray-100 transition-colors"
                >
                  Semeador de Mensagens
                </Link>
                <Link
                  to="/jogos/caca-palavras"
                  className="py-3 pl-5 pr-2 text-sm text-gray-600 hover:text-[#004a8c] border-b border-gray-100 transition-colors"
                >
                  Caça-Palavras
                </Link>
                <Link
                  to="/jogos/plante-a-semente"
                  className="py-3 pl-5 pr-2 text-sm text-gray-600 hover:text-[#004a8c] border-b border-gray-100 transition-colors"
                >
                  Plante a Semente
                </Link>
                <Link
                  to="/jogos/memoria-evangelizacao"
                  className="py-3 pl-5 pr-2 text-sm text-gray-600 hover:text-[#004a8c] border-b border-gray-100 transition-colors"
                >
                  Jogo da Memória
                </Link>
                <Link
                  to="/jogos/quiz-espirita"
                  className="py-3 pl-5 pr-2 text-sm text-gray-600 hover:text-[#004a8c] border-b border-gray-100 transition-colors"
                >
                  Quiz Espírita
                </Link>
              </>
            )}

            {/* Seção Ajuda */}
            <button
              onClick={() => setAjudaMobileOpen((o) => !o)}
              className="flex items-center justify-between py-3 px-2 text-sm font-semibold text-gray-600 border-b border-gray-100 hover:text-[#004a8c] transition-colors"
            >
              Ajuda
              <ChevronDown
                size={14}
                strokeWidth={2}
                className={`transition-transform ${ajudaMobileOpen ? "rotate-180" : ""}`}
              />
            </button>
            {ajudaMobileOpen && (
              <>
                {isDev && (
                  <Link
                    to="/admin"
                    className="py-3 pl-5 pr-2 text-sm text-gray-600 hover:text-[#004a8c] border-b border-gray-100 transition-colors"
                  >
                    Painel do Administrador
                  </Link>
                )}
                <Link
                  to="/painel"
                  className="py-3 pl-5 pr-2 text-sm text-gray-600 hover:text-[#004a8c] border-b border-gray-100 transition-colors"
                >
                  Status do Projeto
                </Link>
                <Link
                  to="/ajuda"
                  className="py-3 pl-5 pr-2 text-sm text-gray-600 hover:text-[#004a8c] border-b border-gray-100 transition-colors"
                >
                  FAQ / Dúvidas
                </Link>
                {isDecisao && (
                  <Link
                    to="/permissoes"
                    className="py-3 pl-5 pr-2 text-sm text-gray-600 hover:text-[#004a8c] border-b border-gray-100 transition-colors"
                  >
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
