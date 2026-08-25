import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { mensagemDeErro } from "@/lib/erros";
import { validarSenha } from "@/lib/senha";

export const Route = createFileRoute("/nova-senha")({
  head: () => ({
    meta: [
      { title: "Definir nova senha — Apoio Espírita" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NovaSenha,
});

function NovaSenha() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [pronto, setPronto] = useState(false);

  // O link do e-mail cria a sessão de recuperação. Sem sessão, não há o que redefinir.
  useEffect(() => {
    if (!loading && !user && !pronto) {
      setErro(
        "Este link de redefinição expirou ou já foi usado. Peça um novo em “Esqueci minha senha”.",
      );
    }
  }, [loading, user, pronto]);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");

    const problema = validarSenha(senha, user?.email);
    if (problema) {
      setErro(problema);
      return;
    }
    if (senha !== confirmacao) {
      setErro("As duas senhas não são iguais. Digite a mesma senha nos dois campos.");
      return;
    }

    setSalvando(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: senha });
      if (error) throw error;
      setPronto(true);
      toast.success("Senha alterada com sucesso.");
      setTimeout(() => navigate({ to: "/inicio" }), 1800);
    } catch (e: unknown) {
      console.error("Erro ao definir nova senha:", e);
      setErro(mensagemDeErro(e, "Não foi possível alterar a senha. Tente novamente."));
    } finally {
      setSalvando(false);
    }
  };

  if (loading) return null;

  return (
    <main className="page-light min-h-screen flex items-center justify-center px-6 py-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,oklch(0.88_0.03_290/0.5)_0%,transparent_70%)]" />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-[0.4em] text-cyan-glow mb-3">Apoio Espírita</p>
          <h1 className="text-2xl font-light text-foreground">Definir nova senha</h1>
          {user?.email && (
            <p className="mt-2 text-sm text-muted-foreground font-light">
              Para a conta <span className="text-foreground">{user.email}</span>
            </p>
          )}
        </div>

        <div className="glass rounded-3xl p-8 space-y-5">
          {pronto ? (
            <div className="text-center space-y-3">
              <p className="text-sm text-foreground">Senha alterada com sucesso.</p>
              <p className="text-xs text-muted-foreground">
                Você já está conectado. Levando ao início…
              </p>
            </div>
          ) : (
            <form onSubmit={salvar} className="space-y-5">
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
                  Nova senha <span className="text-cyan-glow">*</span>
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={senha}
                  onChange={(e) => {
                    setSenha(e.target.value);
                    setErro("");
                  }}
                  disabled={!user}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-cyan-glow/40 transition-colors disabled:opacity-40"
                  placeholder="Pelo menos 8 caracteres"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
                  Repita a nova senha <span className="text-cyan-glow">*</span>
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirmacao}
                  onChange={(e) => {
                    setConfirmacao(e.target.value);
                    setErro("");
                  }}
                  disabled={!user}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-cyan-glow/40 transition-colors disabled:opacity-40"
                  placeholder="A mesma senha novamente"
                />
              </div>

              {erro && <p className="text-xs text-red-400 text-center leading-relaxed">{erro}</p>}

              <button
                type="submit"
                disabled={salvando || !user}
                className="w-full py-3 rounded-xl text-sm uppercase tracking-widest text-cyan-glow border border-cyan-glow/40 hover:bg-cyan-glow/10 disabled:opacity-40 transition-colors duration-300"
              >
                {salvando ? "Salvando…" : "Salvar nova senha"}
              </button>
            </form>
          )}
        </div>

        <div className="mt-4 text-center">
          <Link
            to="/login"
            className="inline-block text-xs text-cyan-glow/60 hover:text-cyan-glow transition-colors"
          >
            ← Voltar ao login
          </Link>
        </div>
      </div>
    </main>
  );
}
