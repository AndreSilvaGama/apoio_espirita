import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/login")({
  component: Login,
});

type Mode = "entrar" | "cadastrar";

function Login() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [mode, setMode] = useState<Mode>("entrar");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      if (!profile?.sigla_casa || !profile?.nome || !profile?.cargo_principal || !profile?.uf || !profile?.cidade) {
        navigate({ to: "/completar-perfil" });
      } else {
        navigate({ to: "/inicio" });
      }
    }
  }, [user, profile, loading, navigate]);

  const handleGoogle = async () => {
    setError("");
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/inicio` },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setSubmitting(true);
    try {
      if (mode === "entrar") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
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
      setError(e instanceof Error ? translateError(e.message) : "Erro inesperado.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  return (
    <main className="page-light min-h-screen flex items-center justify-center px-6">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,oklch(0.88_0.03_290/0.5)_0%,transparent_70%)]" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo / title */}
        <div className="text-center mb-10">
          <p className="text-xs uppercase tracking-[0.4em] text-cyan-glow mb-3">
            Apoio Espírita
          </p>
          <h1 className="text-3xl font-light text-foreground">
            {mode === "entrar" ? "Bem-vindo(a) de volta" : "Criar conta"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground font-light">
            {mode === "entrar"
              ? "Entre para acessar o painel e acompanhar o projeto."
              : "Cadastre-se para fazer parte desta comunidade."}
          </p>
        </div>

        <div className="glass rounded-3xl p-8 space-y-6">
          {/* Google */}
          <button
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-sm text-foreground"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar com Google
          </button>

          <div className="flex items-center gap-3 text-xs text-muted-foreground/50">
            <div className="flex-1 h-px bg-white/10" />
            ou
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Tabs */}
          <div className="flex rounded-xl overflow-hidden border border-white/10">
            {(["entrar", "cadastrar"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); setInfo(""); }}
                className={`flex-1 py-2 text-xs uppercase tracking-widest transition-colors ${
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
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-cyan-glow/40 transition-colors"
            />
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-cyan-glow/40 transition-colors"
            />

            {error && (
              <p className="text-xs text-red-400 text-center">{error}</p>
            )}
            {info && (
              <p className="text-xs text-cyan-glow text-center">{info}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl text-sm uppercase tracking-widest text-cyan-glow border border-cyan-glow/40 hover:bg-cyan-glow/10 disabled:opacity-40 transition-colors duration-300"
            >
              {submitting ? "Aguarde…" : mode === "entrar" ? "Entrar" : "Criar conta"}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center space-y-2">
          <p className="text-xs text-muted-foreground/50">Um espaço de serviço e fraternidade.</p>
          <Link
            to="/"
            className="inline-block text-xs text-cyan-glow/60 hover:text-cyan-glow transition-colors"
          >
            ← Voltar ao início
          </Link>
        </div>
      </div>
    </main>
  );
}

function translateError(msg: string) {
  if (msg.includes("Invalid login credentials")) return "E-mail ou senha incorretos.";
  if (msg.includes("Email not confirmed")) return "Confirme seu e-mail antes de entrar.";
  if (msg.includes("User already registered")) return "Este e-mail já está cadastrado.";
  if (msg.includes("Password should be")) return "A senha deve ter pelo menos 6 caracteres.";
  return msg;
}
