import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, ChevronRight } from "lucide-react";
import { PERGUNTAS_DA_DOUTRINA } from "@/data/perguntas-doutrina";

/**
 * Índice das perguntas sobre a doutrina espírita.
 *
 * O conteúdo é estático, escrito em código, então a página já sai pronta no
 * HTML do servidor — não depende de banco nem de login. O JSON-LD do tipo
 * FAQPage entrega a mesma lista aos buscadores de forma estruturada.
 */

export const Route = createFileRoute("/perguntas/")({
  head: () => ({
    meta: [
      { title: "Perguntas sobre o Espiritismo, respondidas com a fonte — Apoio Espírita" },
      {
        name: "description",
        content:
          "O que é o Espiritismo, o que acontece depois da morte, reencarnação, mediunidade, obsessão e suicídio: respostas com a citação da obra de Allan Kardec.",
      },
      {
        name: "keywords",
        content:
          "o que e espiritismo, doutrina espirita, reencarnacao, mediunidade, obsessao espiritual, kardec",
      },
      { name: "robots", content: "index, follow" },
      { property: "og:title", content: "Perguntas sobre o Espiritismo — Apoio Espírita" },
      {
        property: "og:description",
        content:
          "Respostas às perguntas mais comuns sobre a doutrina espírita, cada uma com a citação da obra de Allan Kardec.",
      },
      { property: "og:url", content: "https://apoioespirita.com.br/perguntas" },
    ],
    links: [{ rel: "canonical", href: "https://apoioespirita.com.br/perguntas" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: PERGUNTAS_DA_DOUTRINA.map((p) => ({
            "@type": "Question",
            name: p.pergunta,
            acceptedAnswer: { "@type": "Answer", text: p.resposta.join(" ") },
          })),
        }),
      },
    ],
  }),
  component: PerguntasIndex,
});

function PerguntasIndex() {
  return (
    <main className="page-light min-h-screen px-4 pt-20 pb-20">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.4em] text-cyan-glow mb-2">Doutrina</p>
          <h1 className="text-3xl font-light text-foreground">Perguntas sobre o Espiritismo</h1>
          <p className="mt-3 text-sm text-muted-foreground font-light max-w-xl leading-relaxed">
            Respostas às perguntas que chegam de quem está começando — ou de quem está atravessando
            uma perda. Cada uma traz a citação da obra de Allan Kardec de onde a resposta veio, para
            você conferir por si mesmo. A leitura é livre, sem cadastro.
          </p>
        </div>

        <div className="space-y-3">
          {PERGUNTAS_DA_DOUTRINA.map((p) => (
            <Link
              key={p.slug}
              to="/perguntas/$slug"
              params={{ slug: p.slug }}
              className="glass rounded-2xl px-5 py-4 flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
                <BookOpen size={18} strokeWidth={1.5} className="text-violet-700" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-medium text-foreground leading-snug">{p.pergunta}</h2>
                <p className="text-xs text-muted-foreground/70 mt-0.5 leading-relaxed">
                  {p.resumo}
                </p>
              </div>
              <ChevronRight
                size={16}
                strokeWidth={1.6}
                className="text-muted-foreground/30 shrink-0"
              />
            </Link>
          ))}
        </div>

        <div className="mt-10 glass rounded-2xl p-6 space-y-2">
          <h2 className="text-sm font-medium text-foreground">De onde vêm estas respostas</h2>
          <p className="text-xs text-muted-foreground/80 leading-relaxed">
            Todas saem da codificação de Allan Kardec — O Livro dos Espíritos, O Livro dos Médiuns e
            O Evangelho segundo o Espiritismo —, com a obra e o número da questão ou do item
            indicados em cada resposta. É o terreno comum do movimento espírita, está em domínio
            público e pode ser conferido por qualquer pessoa. Nada aqui é interpretação particular
            apresentada como doutrina.
          </p>
          <p className="text-xs text-muted-foreground/80 leading-relaxed">
            Quer conversar com alguém?{" "}
            <Link to="/casas" className="text-cyan-glow hover:underline underline-offset-2">
              Encontre uma casa espírita perto de você
            </Link>
            . As atividades públicas são abertas e gratuitas.
          </p>
        </div>
      </div>
    </main>
  );
}
