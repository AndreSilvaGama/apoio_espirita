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

const PUBLIC_ROUTES = ["/", "/login", "/transparencia", "/sugestoes"];
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { RadioProvider, useRadio } from "@/contexts/RadioContext";
import { useState, useEffect, useRef } from "react";
import { Radio, Play, Pause, Volume2, VolumeX, ArrowUp, Menu, X, ChevronDown, Gamepad2, AlertTriangle, MessageCircle } from "lucide-react";

import appCss from "../styles.css?url";

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
          <Link to="/" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
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
        <h1 className="text-xl font-semibold tracking-tight text-foreground">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Something went wrong on our end. You can try refreshing or head back home.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
            Try again
          </button>
          <a href="/" className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent">
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
      { name: "description", content: "Plataforma espírita gratuita de acolhimento, estudo e serviço. Encontre sua casa espírita, envie mensagens do dia e conecte-se com a comunidade." },
      { name: "keywords", content: "espiritismo, casa espírita, kardec, centro espírita, apoio espírita, doutrina espírita, caridade, evangelho" },
      { name: "author", content: "Apoio Espírita" },
      { name: "robots", content: "index, follow" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Apoio Espírita" },
      { property: "og:locale", content: "pt_BR" },
      { property: "og:url", content: "https://apoioespirita.com.br/" },
      { property: "og:title", content: "Apoio Espírita — Acolhimento, Estudo e Serviço" },
      { property: "og:description", content: "Plataforma espírita gratuita de acolhimento, estudo e serviço. Encontre sua casa espírita, envie mensagens do dia e conecte-se com a comunidade." },
      { property: "og:image", content: "https://apoioespirita.com.br/og-image.png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Apoio Espírita — Acolhimento, Estudo e Serviço" },
      { name: "twitter:description", content: "Plataforma espírita gratuita de acolhimento, estudo e serviço para membros de casas espíritas." },
      { name: "twitter:image", content: "https://apoioespirita.com.br/og-image.png" },
    ],
    links: [
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "canonical", href: "https://apoioespirita.com.br/" },
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@300;400;500;600&display=swap" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org", "@type": "WebSite",
          "name": "Apoio Espírita", "url": "https://apoioespirita.com.br/",
          "description": "Plataforma espírita gratuita de acolhimento, estudo e serviço para membros de casas espíritas.",
          "inLanguage": "pt-BR",
          "potentialAction": { "@type": "SearchAction", "target": "https://apoioespirita.com.br/?q={search_term_string}", "query-input": "required name=search_term_string" },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org", "@type": "Organization",
          "name": "Apoio Espírita", "url": "https://apoioespirita.com.br/",
          "logo": "https://apoioespirita.com.br/logomarca.png", "sameAs": [],
          "description": "Plataforma independente, sem vínculo com a FEB ou qualquer federação. Propósito: acolhimento, estudo e serviço.",
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
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
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
      className="fixed bottom-20 right-4 z-50 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-400 hover:text-gray-700 hover:shadow-lg transition-all duration-200"
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
    const assunto = encodeURIComponent("Problema no site Apoio Espírita");
    const corpo = encodeURIComponent(
      `Olá,\n\nEncontrei um problema no site:\n\n${descricao.trim()}\n\n— ${profile?.nome ?? "Usuário"} (${profile?.sigla_casa ?? ""})`
    );
    window.open(`mailto:gama.andre@gmail.com?subject=${assunto}&body=${corpo}`);
    setEtapa("whatsapp");
  };

  const handleWhatsApp = () => {
    const texto = encodeURIComponent(
      `Olá! Encontrei um problema no site Apoio Espírita:\n\n${descricao.trim()}\n\n— ${profile?.nome ?? "Usuário"} (${profile?.sigla_casa ?? ""})`
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

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [reportarAberto, setReportarAberto] = useState(false);
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RadioProvider>
          <NavBar />
          <Outlet />
          <Footer onReportar={() => setReportarAberto(true)} />
          <BackToTop />
          {reportarAberto && <ReportarProblema onClose={() => setReportarAberto(false)} />}
        </RadioProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

/* ── Navbar ── */
function NavBar() {
  const { user, isPresident, isTesoureiro, signOut } = useAuth();
  const { location } = useRouterState();
  const [menuOpen, setMenuOpen] = useState(false);
  const [jogosOpen, setJogosOpen] = useState(false);
  const jogosRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMenuOpen(false);
    setJogosOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (jogosRef.current && !jogosRef.current.contains(e.target as Node)) {
        setJogosOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user || PUBLIC_ROUTES.includes(location.pathname)) return null;

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + "/");

  const linkCls = (path: string) =>
    `px-3 py-1.5 text-xs font-medium uppercase tracking-wider rounded-lg transition-colors ${
      isActive(path) ? "bg-cyan-50 text-cyan-700" : "text-gray-500 hover:bg-gray-100"
    }`;

  return (
    <header className="fixed top-0 left-0 right-0 h-14 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="h-full max-w-7xl mx-auto px-4 flex items-center justify-between gap-4">

        {/* Brand */}
        <Link to="/inicio" className="flex items-center gap-2 shrink-0" onClick={() => setMenuOpen(false)}>
          <img src="/logomarca.png" alt="Apoio Espírita" className="h-8 w-auto" />
          <span className="text-sm font-semibold text-gray-800 tracking-tight">Apoio Espírita</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1">
          <Link to="/inicio" className={linkCls("/inicio")}>Início</Link>
          <Link to="/agenda" className={linkCls("/agenda")}>Agenda</Link>
          <Link to="/mensagem-do-dia" className={linkCls("/mensagem-do-dia")}>Mensagem</Link>

          {/* Jogos dropdown */}
          <div ref={jogosRef} className="relative">
            <button
              onClick={() => setJogosOpen((o) => !o)}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium uppercase tracking-wider rounded-lg transition-colors ${
                isActive("/jogos") ? "bg-cyan-50 text-cyan-700" : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              Jogos
              <ChevronDown size={12} strokeWidth={2.5} className={`transition-transform ${jogosOpen ? "rotate-180" : ""}`} />
            </button>
            {jogosOpen && (
              <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50">
                <Link
                  to="/jogos/plante-a-semente"
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setJogosOpen(false)}
                >
                  <Gamepad2 size={14} strokeWidth={1.5} className="text-emerald-500" />
                  Plante a Semente
                </Link>
              </div>
            )}
          </div>

          {isTesoureiro && (
            <Link to="/tesouraria" className={linkCls("/tesouraria")}>Tesouraria</Link>
          )}
          <Link to="/feb" className={linkCls("/feb")}>FEB</Link>
          <Link to="/ajuda" className={linkCls("/ajuda")}>Ajuda</Link>
          <Link to="/perfil" className={linkCls("/perfil")}>Perfil</Link>
          <button
            onClick={() => signOut()}
            className="px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
          >
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
        <div className="lg:hidden absolute top-14 left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-40 py-2">
          <div className="max-w-7xl mx-auto px-4 flex flex-col">
            <Link to="/inicio" className="py-3 px-2 text-sm font-medium text-gray-700 hover:text-cyan-700 border-b border-gray-100 transition-colors">
              Início
            </Link>
            <Link to="/agenda" className="py-3 px-2 text-sm font-medium text-gray-700 hover:text-cyan-700 border-b border-gray-100 transition-colors">
              Agenda
            </Link>
            <Link to="/mensagem-do-dia" className="py-3 px-2 text-sm font-medium text-gray-700 hover:text-cyan-700 border-b border-gray-100 transition-colors">
              Mensagem do Dia
            </Link>
            <Link to="/jogos/plante-a-semente" className="py-3 px-2 text-sm font-medium text-gray-700 hover:text-cyan-700 border-b border-gray-100 transition-colors">
              Jogo: Plante a Semente
            </Link>
            {isTesoureiro && (
              <Link to="/tesouraria" className="py-3 px-2 text-sm font-medium text-gray-700 hover:text-cyan-700 border-b border-gray-100 transition-colors">
                Tesouraria
              </Link>
            )}
            <Link to="/feb" className="py-3 px-2 text-sm font-medium text-gray-700 hover:text-cyan-700 border-b border-gray-100 transition-colors">
              Documentos FEB
            </Link>
            <Link to="/ajuda" className="py-3 px-2 text-sm font-medium text-gray-700 hover:text-cyan-700 border-b border-gray-100 transition-colors">
              Ajuda
            </Link>
            <Link to="/perfil" className="py-3 px-2 text-sm font-medium text-gray-700 hover:text-cyan-700 border-b border-gray-100 transition-colors">
              Meu Perfil
            </Link>
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
  const { user } = useAuth();
  const { active, playing, buffering, volume, muted, activate, togglePlay, setVolume, toggleMute } = useRadio();
  const { location } = useRouterState();
  if (!user || PUBLIC_ROUTES.includes(location.pathname)) return null;

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-[0_-1px_4px_rgba(0,0,0,0.06)]">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">

        {/* Rádio */}
        <div className="flex items-center gap-3 flex-1 min-w-0">

          {/* Ícone */}
          <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-colors ${
            playing ? "bg-emerald-50 border-emerald-300" : "bg-gray-50 border-gray-200"
          }`}>
            <Radio size={18} strokeWidth={1.5} className={playing ? "text-emerald-600" : "text-gray-400"} />
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <Link to="/radio" className="hover:underline underline-offset-2">
              <p className="text-sm font-semibold text-gray-800 leading-tight">Rádio Rio de Janeiro</p>
            </Link>
            <div className="flex items-center gap-2 mt-0.5">
              {buffering && (
                <span className="text-xs text-gray-400 animate-pulse">Conectando...</span>
              )}
              {!buffering && playing && (
                <div className="flex items-center gap-1.5">
                  <span className="flex gap-0.5 items-end h-3">
                    {[1, 2, 3, 4].map((i) => (
                      <span key={i} className="w-0.5 rounded-full bg-emerald-500 animate-bounce"
                        style={{ height: `${4 + i * 2}px`, animationDelay: `${i * 0.1}s` }} />
                    ))}
                  </span>
                  <span className="text-xs font-medium text-emerald-600">Ao vivo</span>
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
            className={`shrink-0 w-11 h-11 rounded-full border-2 flex items-center justify-center transition-all text-base font-bold shadow-sm ${
              playing
                ? "bg-emerald-500 border-emerald-500 text-white hover:bg-emerald-600 active:scale-95"
                : "bg-white border-emerald-400 text-emerald-600 hover:bg-emerald-50 active:scale-95"
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {playing
              ? <Pause size={18} strokeWidth={2.5} />
              : <Play size={18} strokeWidth={2.5} className="ml-0.5" />
            }
          </button>

          {/* Volume — só em telas médias+ */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <button
              onClick={toggleMute}
              className="text-gray-400 hover:text-gray-700 transition-colors p-1"
            >
              {muted || volume === 0
                ? <VolumeX size={16} strokeWidth={1.5} />
                : <Volume2 size={16} strokeWidth={1.5} />
              }
            </button>
            <input
              type="range" min={0} max={1} step={0.01}
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
          <Link to="/transparencia" className="text-xs text-gray-400 hover:text-gray-700 transition-colors whitespace-nowrap">
            Transparência
          </Link>
          <Link to="/sugestoes" className="text-xs text-gray-400 hover:text-gray-700 transition-colors whitespace-nowrap">
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
  );
}
