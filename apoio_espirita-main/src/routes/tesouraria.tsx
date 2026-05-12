import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/tesouraria")({
  component: Tesouraria,
});

function Tesouraria() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  const isPresident =
    profile?.cargo_principal === "Presidente" ||
    profile?.cargo_principal === "Vice-presidente";

  if (loading || !user) return null;

  if (!isPresident) {
    return (
      <main className="page-light min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-muted-foreground font-light">Acesso restrito.</p>
          <Link to="/inicio" className="mt-4 inline-block text-sm text-cyan-glow hover:text-foreground transition-colors">
            ← Voltar ao início
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page-light min-h-screen px-6 py-24">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/inicio"
          className="text-xs uppercase tracking-[0.3em] text-cyan-glow hover:text-foreground transition-colors"
        >
          ← Início
        </Link>

        <div className="mt-10 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-cyan-glow mb-4">
            Gestão financeira
          </p>
          <h1 className="text-4xl md:text-5xl font-light text-foreground mb-6">
            Tesouraria
          </h1>
          <p className="text-muted-foreground font-light max-w-xl mx-auto">
            Em breve — controle de receitas, despesas e relatórios financeiros da sua casa espírita.
          </p>
        </div>

        <div className="mt-16 glass rounded-3xl p-10 text-center">
          <div className="text-5xl mb-6">◈</div>
          <p className="text-muted-foreground font-light leading-relaxed">
            Esta área está sendo desenvolvida com cuidado. Em breve estará disponível para presidentes e tesoureiros autorizados.
          </p>
        </div>
      </div>
    </main>
  );
}
