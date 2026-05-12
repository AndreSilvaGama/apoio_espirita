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
      { title: "Apoio Espírita" },
      { name: "description", content: "Um espaço de acolhimento, estudo e serviço para membros e frequentadores de casas espíritas." },
      { name: "author", content: "Apoio Espírita" },
      { property: "og:title", content: "Apoio Espírita" },
      { property: "og:description", content: "Acolhimento, estudo e serviço — um espaço fraterno para a comunidade espírita." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@300;400;500;600&display=swap",
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
    <html lang="en">
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

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NavBar />
        <Outlet />
      </AuthProvider>
    </QueryClientProvider>
  );
}

function NavBar() {
  const { user, profile, signOut } = useAuth();
  if (!user) return null;
  const isPresident =
    profile?.cargo_principal === "Presidente" ||
    profile?.cargo_principal === "Vice-presidente";
  return (
    <nav className="fixed top-0 right-0 z-50 m-4">
      <div className="flex items-center gap-1 rounded-2xl border border-white/10 bg-background/70 backdrop-blur-md px-4 py-2 shadow-lg">
        <Link
          to="/inicio"
          className="px-2 py-1 text-xs uppercase tracking-widest text-cyan-glow/80 hover:text-cyan-glow transition-colors"
        >
          Início
        </Link>
        <span className="text-white/20 select-none">·</span>
        <Link
          to="/painel"
          className="px-2 py-1 text-xs uppercase tracking-widest text-muted-foreground/70 hover:text-foreground transition-colors"
        >
          Projeto
        </Link>
        <span className="text-white/20 select-none">·</span>
        {isPresident && (
          <>
            <Link
              to="/tesouraria"
              className="px-2 py-1 text-xs uppercase tracking-widest text-muted-foreground/70 hover:text-foreground transition-colors"
            >
              Tesouraria
            </Link>
            <span className="text-white/20 select-none">·</span>
          </>
        )}
        <Link
          to="/perfil"
          className="px-2 py-1 text-xs uppercase tracking-widest text-muted-foreground/70 hover:text-foreground transition-colors"
        >
          Perfil
        </Link>
        <span className="text-white/20 select-none">·</span>
        <button
          onClick={() => signOut()}
          className="px-2 py-1 text-xs uppercase tracking-widest text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        >
          Sair
        </button>
      </div>
    </nav>
  );
}
