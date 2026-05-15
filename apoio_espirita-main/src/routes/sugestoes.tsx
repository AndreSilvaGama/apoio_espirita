import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Particles } from "@/components/Particles";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/sugestoes")({
  head: () => ({
    meta: [
      { title: "Sugestões — Apoio Espírita" },
      { name: "description", content: "Envie sua sugestão para melhorar o Apoio Espírita. Sua contribuição é bem-vinda e fraterna." },
      { property: "og:title", content: "Sugestões — Apoio Espírita" },
      { property: "og:url", content: "https://apoioespirita.com.br/sugestoes" },
    ],
    links: [
      { rel: "canonical", href: "https://apoioespirita.com.br/sugestoes" },
    ],
  }),
  component: SuggestionsPage,
});

const schema = z.object({
  name: z.string().trim().min(1, "Informe seu nome").max(200),
  email: z.string().trim().email("Email inválido").max(320),
  suggestion: z.string().trim().min(5, "Conte um pouco mais").max(5000),
});

function SuggestionsPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", suggestion: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }
    setStatus("loading");
    const { error: dbError } = await supabase
      .from("site_suggestions")
      .insert(parsed.data);
    if (dbError) {
      setStatus("error");
      setError("Não foi possível enviar. Tente novamente.");
      return;
    }
    supabase.functions.invoke("send-notification", {
      body: { type: "sugestao", data: parsed.data },
    });
    setStatus("success");
    setForm({ name: "", email: "", suggestion: "" });
  }

  return (
    <main className="page-light relative min-h-screen overflow-hidden px-6 py-24">
      <Particles count={20} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,oklch(0.88_0.03_290/0.5),transparent_70%)]" />

      <div className="relative z-10 mx-auto max-w-2xl">
        <Link
          to={user ? "/inicio" : "/"}
          className="text-xs uppercase tracking-[0.3em] text-cyan-glow hover:text-foreground transition-colors"
        >
          ← Voltar
        </Link>

        <div className="mt-8 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-cyan-glow mb-4">
            Sua voz importa
          </p>
          <h1 className="text-4xl md:text-5xl font-light text-foreground mb-6">
            Sugira uma <span className="text-gradient-aurora font-medium">mudança</span>
          </h1>
          <p className="text-muted-foreground font-light max-w-xl mx-auto mb-12">
            Tem uma ideia para melhorar este espaço? Compartilhe conosco — toda sugestão é lida com cuidado.
          </p>
        </div>

        {status === "success" ? (
          <div className="glass rounded-3xl p-10 text-center animate-fade-in-up">
            <div className="flex justify-center mb-4">
              <CheckCircle2 size={40} strokeWidth={1.5} className="text-cyan-glow" />
            </div>
            <h2 className="text-2xl font-medium text-foreground mb-3">Recebido com gratidão</h2>
            <p className="text-muted-foreground font-light">
              Sua sugestão foi enviada. Obrigado por contribuir com este caminho.
            </p>
            <button
              onClick={() => setStatus("idle")}
              className="mt-8 text-sm uppercase tracking-widest text-cyan-glow hover:text-foreground transition-colors"
            >
              Enviar outra
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="glass rounded-3xl p-8 md:p-10 space-y-6">
            <div>
              <label className="block text-xs uppercase tracking-[0.3em] text-cyan-glow mb-3">
                Nome
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                maxLength={200}
                required
                className="w-full bg-transparent border-b border-border/60 text-foreground py-3 focus:outline-none focus:border-cyan-glow transition-colors font-light"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-[0.3em] text-cyan-glow mb-3">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                maxLength={320}
                required
                className="w-full bg-transparent border-b border-border/60 text-foreground py-3 focus:outline-none focus:border-cyan-glow transition-colors font-light"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-[0.3em] text-cyan-glow mb-3">
                Sua sugestão
              </label>
              <textarea
                value={form.suggestion}
                onChange={(e) => setForm({ ...form, suggestion: e.target.value })}
                rows={6}
                maxLength={5000}
                required
                className="w-full bg-transparent border-b border-border/60 text-foreground py-3 focus:outline-none focus:border-cyan-glow transition-colors font-light resize-none"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 font-light">{error}</p>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full mt-4 px-8 py-4 rounded-full text-sm uppercase tracking-widest text-cyan-glow border border-cyan-glow/40 animate-pulse-glow bg-transparent hover:bg-cyan-glow/5 transition-colors duration-500 disabled:opacity-50"
            >
              {status === "loading" ? "Enviando..." : "Enviar sugestão"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}