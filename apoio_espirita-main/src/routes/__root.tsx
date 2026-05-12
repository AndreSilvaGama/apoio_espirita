import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { RadioProvider, useRadio } from "@/contexts/RadioContext";
import { Radio, Play, Pause, Volume2, VolumeX } from "lucide-react";

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
          "logo": "https://apoioespirita.com.br/favicon.png", "sameAs": [],
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

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RadioProvider>
          <NavBar />
          <Outlet />
          <Footer />
        </RadioProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

/* ── Navbar ── */
function NavBar() {
  const { user, profile, signOut } = useAuth();
  if (!user) return null;

  const isPresident =
    profile?.cargo_principal === "Presidente" ||
    profile?.cargo_principal === "Vice-presidente";

  return (
    <header className="fixed top-0 left-0 right-0 h-14 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="h-full max-w-7xl mx-auto px-4 flex items-center justify-between gap-4">

        {/* Brand */}
        <Link to="/inicio" className="flex items-center gap-2 shrink-0">
          <img src="/favicon.png" alt="Apoio Espírita" className="w-7 h-7 rounded-lg" />
          <span className="hidden sm:inline text-sm font-semibold text-gray-800 tracking-tight">Apoio Espírita</span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          <Link to="/inicio" className="px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-cyan-700 hover:bg-cyan-50 rounded-lg transition-colors">
            Início
          </Link>
          <Link to="/painel" className="px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
            Projeto
          </Link>
          {isPresident && (
            <Link to="/tesouraria" className="px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
              Tesouraria
            </Link>
          )}
          <Link to="/perfil" className="px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
            Perfil
          </Link>
          <button
            onClick={() => signOut()}
            className="px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Sair
          </button>
        </nav>

      </div>
    </header>
  );
}

/* ── Footer ── */
function Footer() {
  const { user } = useAuth();
  const { active, playing, buffering, volume, muted, activate, togglePlay, setVolume, toggleMute } = useRadio();
  if (!user) return null;

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
        </div>

      </div>
    </footer>
  );
}
