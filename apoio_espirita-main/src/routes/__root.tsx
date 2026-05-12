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
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="mx-3 mt-3 rounded-2xl border border-white/10 bg-background/80 backdrop-blur-md shadow-lg px-3 py-2 flex items-center justify-between gap-1">

        {/* Brand — oculto no mobile para não cortar */}
        <Link to="/inicio" className="hidden sm:inline text-xs font-semibold uppercase tracking-[0.2em] text-cyan-glow/90 hover:text-cyan-glow transition-colors shrink-0">
          Apoio Espírita
        </Link>
        <div className="hidden sm:block flex-1" />

        {/* Nav links */}
        <div className="flex items-center flex-wrap justify-center gap-x-0.5 gap-y-0">
          <Link to="/inicio" className="px-2 py-1 text-[11px] uppercase tracking-widest text-cyan-glow/80 hover:text-cyan-glow transition-colors whitespace-nowrap">
            Início
          </Link>
          <span className="text-white/15 select-none">·</span>
          <Link to="/painel" className="px-2 py-1 text-[11px] uppercase tracking-widest text-muted-foreground/70 hover:text-foreground transition-colors whitespace-nowrap">
            Projeto
          </Link>
          {isPresident && (
            <>
              <span className="text-white/15 select-none">·</span>
              <Link to="/tesouraria" className="px-2 py-1 text-[11px] uppercase tracking-widest text-muted-foreground/70 hover:text-foreground transition-colors whitespace-nowrap">
                Tesouraria
              </Link>
            </>
          )}
          <span className="text-white/15 select-none">·</span>
          <Link to="/perfil" className="px-2 py-1 text-[11px] uppercase tracking-widest text-muted-foreground/70 hover:text-foreground transition-colors whitespace-nowrap">
            Perfil
          </Link>
          <span className="text-white/15 select-none">·</span>
          <button onClick={() => signOut()} className="px-2 py-1 text-[11px] uppercase tracking-widest text-muted-foreground/40 hover:text-muted-foreground transition-colors whitespace-nowrap">
            Sair
          </button>
        </div>

      </div>
    </nav>
  );
}

/* ── Footer ── */
function Footer() {
  const { user } = useAuth();
  const { active, playing, buffering, volume, muted, activate, togglePlay, setVolume, toggleMute } = useRadio();
  if (!user) return null;

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40">
      <div className="mx-3 mb-3 rounded-2xl border border-white/10 bg-background/80 backdrop-blur-md shadow-lg px-4 py-2.5 flex items-center gap-3">

        {/* Rádio */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center border ${playing ? "bg-emerald-50 border-emerald-200" : "bg-white/5 border-white/10"}`}>
            <Radio size={13} strokeWidth={1.5} className={playing ? "text-emerald-600" : "text-muted-foreground/30"} />
          </div>

          <Link to="/radio" className="min-w-0 hover:opacity-80 transition-opacity">
            <p className="text-[11px] font-medium text-foreground/80 truncate leading-none">Rádio Rio de Janeiro</p>
            <div className="flex items-center gap-1 mt-0.5">
              {buffering && <span className="text-[10px] text-muted-foreground/40 animate-pulse">Conectando...</span>}
              {!buffering && playing && (
                <>
                  <span className="flex gap-0.5 items-end h-2.5">
                    {[1, 2, 3].map((i) => (
                      <span key={i} className="w-0.5 rounded-full bg-emerald-500 animate-bounce"
                        style={{ height: `${3 + i * 2}px`, animationDelay: `${i * 0.12}s` }} />
                    ))}
                  </span>
                  <span className="text-[10px] text-emerald-600 uppercase tracking-widest">Ao vivo</span>
                </>
              )}
              {!buffering && !playing && (
                <span className="text-[10px] text-muted-foreground/35 uppercase tracking-widest">
                  {active ? "Pausado" : "1400 AM"}
                </span>
              )}
            </div>
          </Link>

          <button
            onClick={active ? togglePlay : activate}
            disabled={buffering}
            className={`shrink-0 w-7 h-7 rounded-full border flex items-center justify-center transition-all ${
              playing
                ? "bg-emerald-500 border-emerald-500 text-white hover:bg-emerald-600"
                : "border-emerald-300 text-emerald-600 hover:bg-emerald-50 bg-white/5"
            } disabled:opacity-40`}
          >
            {playing
              ? <Pause size={11} strokeWidth={2.5} />
              : <Play size={11} strokeWidth={2.5} className="ml-px" />
            }
          </button>

          {/* Volume — só desktop */}
          <div className="hidden md:flex items-center gap-1.5 shrink-0">
            <button onClick={toggleMute} className="text-muted-foreground/30 hover:text-muted-foreground/70 transition-colors">
              {muted || volume === 0 ? <VolumeX size={13} strokeWidth={1.5} /> : <Volume2 size={13} strokeWidth={1.5} />}
            </button>
            <input
              type="range" min={0} max={1} step={0.01}
              value={muted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-16 accent-emerald-500 h-1 rounded-full cursor-pointer"
            />
          </div>
        </div>

        {/* Separador */}
        <span className="text-white/10 select-none shrink-0">|</span>

        {/* Links institucionais */}
        <div className="flex items-center gap-0.5 shrink-0">
          <Link to="/transparencia" className="px-1.5 py-1 text-[11px] uppercase tracking-widest text-muted-foreground/40 hover:text-muted-foreground transition-colors whitespace-nowrap">
            Transparência
          </Link>
          <span className="text-white/15 select-none">·</span>
          <Link to="/sugestoes" className="px-1.5 py-1 text-[11px] uppercase tracking-widest text-muted-foreground/40 hover:text-muted-foreground transition-colors whitespace-nowrap">
            Sugestões
          </Link>
        </div>

      </div>
    </footer>
  );
}
