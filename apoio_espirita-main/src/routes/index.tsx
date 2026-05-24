import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Particles } from "@/components/Particles";
import { SeamlessVideo } from "@/components/SeamlessVideo";
import { AmbientAudio } from "@/components/AmbientAudio";
import { HelpDialog } from "@/components/HelpDialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Apoio Espírita — Fora da caridade não há salvação" },
      { name: "description", content: "Plataforma espírita gratuita para membros de casas espíritas. Bazar solidário, mensagem do dia, agenda de eventos e muito mais. Fora da caridade não há salvação." },
      { property: "og:title", content: "Apoio Espírita — Fora da caridade não há salvação" },
      { property: "og:description", content: "Plataforma espírita gratuita para membros de casas espíritas. Bazar solidário, mensagem do dia, agenda de eventos e muito mais." },
      { property: "og:url", content: "https://apoioespirita.com.br/" },
      { name: "twitter:title", content: "Apoio Espírita — Fora da caridade não há salvação" },
      { name: "twitter:description", content: "Plataforma espírita gratuita para membros de casas espíritas." },
    ],
    links: [
      { rel: "canonical", href: "https://apoioespirita.com.br/" },
    ],
  }),
  component: Index,
});

const points = [
  {
    num: "01",
    title: "Razão e fé",
    body: "O Espiritismo não pede que você acredite — pede que você observe, questione e comprove. Ciência, filosofia e religião caminham juntas.",
  },
  {
    num: "02",
    title: "Evolução do espírito",
    body: "Cada existência é uma oportunidade de aprender. O progresso moral não tem atalhos, mas também não tem fim.",
  },
  {
    num: "03",
    title: "Sem intermediários",
    body: "Nenhum ritual, nenhuma cobrança, nenhuma hierarquia entre você e a sua busca. Só o estudo sério e o serviço ao próximo.",
  },
  {
    num: "04",
    title: "Caridade como prática",
    body: "\"Fora da caridade não há salvação\" — não como dogma, mas como convite concreto à ação no mundo.",
  },
];

function Index() {
  const { user } = useAuth();
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <AmbientAudio src="/audio/ambient-piano.mp3" />

      {/* ── HERO ── */}
      <section className="relative h-screen w-full flex items-center justify-center overflow-hidden">
        <SeamlessVideo
          src="/hero-nebula.mp4"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/20 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,oklch(0.13_0.06_270/0.6)_80%)]" />

        <Particles count={40} />

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <Link
            to="/transparencia"
            className="mb-8 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.45em] text-cyan-glow/70 animate-fade-in-up hover:text-cyan-glow transition-colors"
            style={{ animationDelay: "0.1s" }}
          >
            <span className="w-6 h-px bg-cyan-glow/50 inline-block" />
            Independente · Sem federações
            <span className="w-6 h-px bg-cyan-glow/50 inline-block" />
          </Link>

          <h1
            className="text-5xl md:text-7xl lg:text-8xl font-light leading-[1.05] text-foreground animate-fade-in-up"
            style={{ animationDelay: "0.3s" }}
          >
            Fora da caridade
            <br />
            <span className="text-gradient-aurora font-medium italic">não há salvação</span>
          </h1>

          <p
            className="mt-10 max-w-lg mx-auto text-base md:text-lg text-muted-foreground font-light leading-loose animate-fade-in-up"
            style={{ animationDelay: "0.6s" }}
          >
            Amarás o Senhor teu Deus de todo o teu coração, de toda a tua alma
            e de todo o teu entendimento. E amarás o teu próximo como a ti mesmo.
          </p>
          <p
            className="mt-3 max-w-lg mx-auto text-right text-[11px] uppercase tracking-[0.4em] text-cyan-glow/60 animate-fade-in-up"
            style={{ animationDelay: "0.75s" }}
          >
            Mateus 22 · 37–39
          </p>

          <div
            className="mt-14 flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up"
            style={{ animationDelay: "0.9s" }}
          >
            <HelpDialog>
              <button className="px-8 py-4 rounded-full text-sm uppercase tracking-widest text-cyan-glow border border-cyan-glow/30 animate-pulse-glow bg-transparent hover:bg-cyan-glow/5 transition-colors duration-500">
                Preciso de apoio
              </button>
            </HelpDialog>
            <Link
              to={user ? "/inicio" : "/login"}
              className="glass px-8 py-4 rounded-full text-sm uppercase tracking-widest text-foreground hover:bg-white/10 transition-colors duration-500"
            >
              Área dos trabalhadores
            </Link>
          </div>
        </div>
      </section>

      {/* ── GRADIENT BRIDGE ── */}
      <div
        aria-hidden
        className="h-28 md:h-40 w-full"
        style={{
          background:
            "linear-gradient(180deg, oklch(0.13 0.06 270) 0%, oklch(0.985 0.008 290) 100%)",
        }}
      />

      <div className="light-section">

        {/* ── LOGIN INLINE ── */}
        <InlineLogin user={user} />

        {/* ── QUATRO PONTOS ── */}
        <section className="relative py-28 px-6">
          <Particles count={10} />
          <div className="mx-auto max-w-6xl relative z-10">
            <div className="mb-16 max-w-xl">
              <p className="text-sm uppercase tracking-[0.35em] text-cyan-glow mb-4">
                A base da doutrina
              </p>
              <h2 className="text-4xl md:text-5xl font-light text-foreground leading-snug">
                Quatro ideias que mudam{" "}
                <span className="text-gradient-aurora font-medium italic">tudo</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {points.map((p, i) => (
                <article
                  key={p.num}
                  className="glass rounded-2xl p-8 animate-fade-in-up hover:border-cyan-glow/30 transition-all duration-700 hover:-translate-y-1 flex flex-col gap-5"
                  style={{ animationDelay: `${0.1 + i * 0.12}s` }}
                >
                  <span className="text-xs tracking-[0.3em] text-cyan-glow/50 font-mono">
                    {p.num}
                  </span>
                  <h3 className="text-xl font-medium text-foreground leading-snug">
                    {p.title}
                  </h3>
                  <p className="text-base text-muted-foreground font-light leading-relaxed flex-1">
                    {p.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── CITAÇÃO ── */}
        <section className="relative py-24 px-6">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,oklch(0.75_0.18_295/0.07),transparent_65%)]" />
          <div className="relative z-10 mx-auto max-w-2xl">
            <p className="text-[80px] leading-none text-cyan-glow/15 font-serif select-none -mb-6">"</p>
            <blockquote className="text-2xl md:text-3xl font-light text-foreground leading-relaxed italic">
              Fora da caridade não há salvação.
            </blockquote>
            <footer className="mt-8 flex items-center gap-4">
              <div className="w-8 h-px bg-cyan-glow/40" />
              <cite className="not-italic text-sm uppercase tracking-[0.3em] text-muted-foreground">
                Allan Kardec
              </cite>
            </footer>
          </div>
        </section>

        {/* ── CTA FINAL ── */}
        <section className="relative py-28 px-6 border-t border-border">
          <div className="mx-auto max-w-3xl">
            <div className="glass rounded-3xl p-12 md:p-16 text-center">
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-glow mb-5">
                Encontre sua casa espírita
              </p>
              <h2 className="text-3xl md:text-5xl font-light text-foreground mb-5 leading-snug">
                A porta está{" "}
                <span className="text-gradient-aurora font-medium italic">aberta</span>
              </h2>
              <p className="text-muted-foreground font-light max-w-md mx-auto mb-10 leading-relaxed text-base">
                Não é preciso saber nada de antemão. Qualquer pessoa que busque
                com sinceridade é bem-vinda.
              </p>
              <HelpDialog initialStep="find-center">
                <button className="inline-flex items-center gap-3 px-10 py-5 rounded-full text-base uppercase tracking-widest text-foreground border border-border hover:border-cyan-glow/40 hover:bg-white/5 transition-all duration-300">
                  Onde encontrar um centro
                </button>
              </HelpDialog>
            </div>
          </div>

          <footer className="mt-20 text-center">
            <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground/50 mb-5">
              Luz · Estudo · Serviço
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-muted-foreground/50">
              <Link to="/sugestoes" className="hover:text-cyan-glow transition-colors">
                Sugerir uma melhoria
              </Link>
              <span className="hidden sm:inline opacity-30">·</span>
              <Link to="/transparencia" className="hover:text-cyan-glow transition-colors">
                Transparência &amp; propósito
              </Link>
            </div>
          </footer>
        </section>

      </div>
    </main>
  );
}

type Mode = "entrar" | "cadastrar";

function InlineLogin({ user }: { user: ReturnType<typeof useAuth>["user"] }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("entrar");
  const [forgot, setForgot] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const resetState = () => { setError(""); setInfo(""); };

  if (user) {
    return (
      <section className="relative py-16 px-6 border-b border-border">
        <div className="mx-auto max-w-md text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-cyan-glow mb-4">
            Plataforma para trabalhadores e casas espíritas
          </p>
          <p className="text-muted-foreground font-light mb-6">
            Você já está conectado.
          </p>
          <Link
            to="/inicio"
            className="inline-flex items-center justify-center px-10 py-4 rounded-full text-sm uppercase tracking-widest bg-cyan-glow text-background font-medium hover:opacity-90 transition-opacity duration-300"
          >
            Ir para o painel
          </Link>
        </div>
      </section>
    );
  }

  const handleGoogle = async () => {
    resetState();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/inicio` },
    });
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    resetState();
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/perfil`,
      });
      if (error) throw error;
      setInfo("Enviamos um link para redefinir sua senha. Verifique seu e-mail.");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro inesperado.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetState();
    setSubmitting(true);
    try {
      if (mode === "entrar") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/inicio" });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/completar-perfil` },
        });
        if (error) throw error;
        setInfo("Verifique seu e-mail para confirmar o cadastro.");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? translateAuthError(e.message) : "Erro inesperado.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="relative py-20 px-6 border-b border-border">
      <div className="mx-auto max-w-md">
        <div className="text-center mb-8">
          {forgot && (
            <p className="text-[11px] uppercase tracking-[0.45em] text-cyan-glow mb-4">
              Recuperação de acesso
            </p>
          )}
          <h2 className="text-3xl md:text-4xl font-light text-foreground mb-3 leading-snug">
            {forgot ? (
              <>Redefinir <span className="text-gradient-aurora font-medium italic">senha</span></>
            ) : (
              <>Acesse sua <span className="text-gradient-aurora font-medium italic">conta</span></>
            )}
          </h2>
          <p className="text-muted-foreground font-light text-base leading-relaxed">
            {forgot
              ? "Informe o e-mail cadastrado e enviaremos o link de redefinição."
              : "Mensagem do dia, agenda, bazar solidário, rádio e muito mais — para trabalhadores e casas espíritas."}
          </p>
        </div>

        <div className="glass rounded-3xl p-8 space-y-5">

          {/* ── ESQUECI A SENHA ── */}
          {forgot ? (
            <form onSubmit={handleForgot} className="space-y-5">
              <input
                type="email"
                placeholder="Seu e-mail cadastrado"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-4 text-base text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-cyan-glow/40 transition-colors"
              />

              {error && <p className="text-sm text-red-400 text-center">{error}</p>}
              {info  && <p className="text-sm text-cyan-glow text-center">{info}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 rounded-xl text-base uppercase tracking-widest text-cyan-glow border border-cyan-glow/40 hover:bg-cyan-glow/10 disabled:opacity-40 transition-colors duration-300"
              >
                {submitting ? "Enviando…" : "Enviar link de redefinição"}
              </button>

              <button
                type="button"
                onClick={() => { setForgot(false); resetState(); }}
                className="w-full text-sm text-muted-foreground/60 hover:text-muted-foreground transition-colors text-center pt-1"
              >
                ← Voltar ao login
              </button>
            </form>
          ) : (
            <>
              {/* Google */}
              <button
                onClick={handleGoogle}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-base text-foreground"
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continuar com Google
              </button>

              <div className="flex items-center gap-3 text-sm text-muted-foreground/50">
                <div className="flex-1 h-px bg-white/10" />
                ou
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Tabs */}
              <div className="flex rounded-xl overflow-hidden border border-white/10">
                {(["entrar", "cadastrar"] as Mode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => { setMode(m); resetState(); }}
                    className={`flex-1 py-3 text-sm uppercase tracking-widest transition-colors ${
                      mode === m
                        ? "bg-cyan-glow/10 text-cyan-glow"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {m === "entrar" ? "Entrar" : "Cadastrar"}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="email"
                  placeholder="E-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-4 text-base text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-cyan-glow/40 transition-colors"
                />
                <div className="space-y-2">
                  <input
                    type="password"
                    placeholder="Senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-4 text-base text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-cyan-glow/40 transition-colors"
                  />
                  {mode === "entrar" && (
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => { setForgot(true); resetState(); }}
                        className="text-sm text-muted-foreground/60 hover:text-cyan-glow transition-colors py-1"
                      >
                        Esqueci minha senha
                      </button>
                    </div>
                  )}
                </div>

                {error && <p className="text-sm text-red-400 text-center">{error}</p>}
                {info  && <p className="text-sm text-cyan-glow text-center">{info}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 rounded-xl text-base uppercase tracking-widest text-cyan-glow border border-cyan-glow/40 hover:bg-cyan-glow/10 disabled:opacity-40 transition-colors duration-300"
                >
                  {submitting ? "Aguarde…" : mode === "entrar" ? "Entrar" : "Criar conta"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
}


function translateAuthError(msg: string) {
  if (msg.includes("Invalid login credentials")) return "E-mail ou senha incorretos.";
  if (msg.includes("Email not confirmed")) return "Confirme seu e-mail antes de entrar.";
  if (msg.includes("User already registered")) return "Este e-mail já está cadastrado.";
  if (msg.includes("Password should be")) return "A senha deve ter pelo menos 6 caracteres.";
  return msg;
}
