import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ChevronLeft, LifeBuoy, Quote } from "lucide-react";
import { PERGUNTAS_DA_DOUTRINA, perguntaPorSlug } from "@/data/perguntas-doutrina";
import { ConviteParaCompartilhar } from "@/components/Compartilhar";
import { SITE, migalhas } from "@/lib/seo";

/** Uma pergunta sobre a doutrina, com a resposta e a fonte de cada afirmação. */

export const Route = createFileRoute("/perguntas/$slug")({
  loader: ({ params }) => {
    const pergunta = perguntaPorSlug(params.slug);
    if (!pergunta) throw notFound();
    return pergunta;
  },
  head: ({ params, loaderData }) => {
    const url = `https://apoioespirita.com.br/perguntas/${params.slug}`;
    const titulo = loaderData?.pergunta ?? "Perguntas sobre o Espiritismo";
    const descricao = loaderData?.resumo ?? "Respostas sobre a doutrina espírita, com a fonte.";
    return {
      meta: [
        { title: `${titulo} — Apoio Espírita` },
        { name: "description", content: descricao },
        { name: "robots", content: "index, follow" },
        { property: "og:title", content: `${titulo} — Apoio Espírita` },
        { property: "og:description", content: descricao },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: loaderData
        ? [
            {
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "QAPage",
                mainEntity: {
                  "@type": "Question",
                  name: loaderData.pergunta,
                  text: loaderData.pergunta,
                  answerCount: 1,
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: loaderData.resposta.join(" "),
                    url,
                  },
                },
              }),
            },
            migalhas([
              { nome: "Perguntas sobre o Espiritismo", caminho: "/perguntas" },
              { nome: loaderData.pergunta, caminho: `/perguntas/${params.slug}` },
            ]),
          ]
        : [],
    };
  },
  component: PerguntaPage,
});

function PerguntaPage() {
  const pergunta = Route.useLoaderData();
  const outras = PERGUNTAS_DA_DOUTRINA.filter((p) => p.slug !== pergunta.slug).slice(0, 4);

  return (
    <main className="page-light min-h-screen px-4 pt-20 pb-20">
      <article className="mx-auto max-w-2xl">
        <Link
          to="/perguntas"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-cyan-glow transition-colors mb-6"
        >
          <ChevronLeft size={14} strokeWidth={1.8} />
          Todas as perguntas
        </Link>

        <h1 className="text-2xl sm:text-3xl font-light text-foreground leading-snug">
          {pergunta.pergunta}
        </h1>

        {pergunta.amparoUrgente && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 flex items-start gap-3">
            <LifeBuoy size={18} strokeWidth={1.6} className="text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-900">
                Se você está em sofrimento agora, ligue 188.
              </p>
              <p className="mt-1 text-xs text-amber-900/80 leading-relaxed">
                O CVV atende de graça, 24 horas por dia, em todo o Brasil, e você não precisa se
                identificar. Falar com alguém não custa nada e não compromete você a nada.
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 space-y-4">
          {pergunta.resposta.map((paragrafo, i) => (
            <p key={i} className="text-[15px] leading-relaxed text-foreground/85 font-light">
              {paragrafo}
            </p>
          ))}
        </div>

        <section className="mt-10">
          <h2 className="text-xs uppercase tracking-[0.3em] text-muted-foreground/60 mb-3">
            De onde veio esta resposta
          </h2>
          <div className="space-y-3">
            {pergunta.fontes.map((fonte, i) => (
              <div key={i} className="glass rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <Quote size={15} strokeWidth={1.6} className="text-violet-500 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm text-foreground/80 leading-relaxed italic">
                      {fonte.citacao}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground/70">
                      {fonte.obra} — {fonte.referencia}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground/60 leading-relaxed">
            As obras de Allan Kardec estão em domínio público: qualquer pessoa pode conferir as
            passagens acima na edição que preferir.
          </p>
        </section>

        <section className="mt-10 glass rounded-2xl p-6">
          <h2 className="text-sm font-medium text-foreground mb-2">Quer conversar com alguém?</h2>
          <p className="text-xs text-muted-foreground/80 leading-relaxed">
            Nenhum texto substitui uma conversa. As atividades públicas das casas espíritas são
            abertas e gratuitas, e você não precisa ser espírita nem avisar antes.
          </p>
          <Link
            to="/casas"
            className="mt-3 inline-block px-4 py-2 rounded-xl text-xs uppercase tracking-widest text-cyan-glow border border-cyan-glow/40 hover:bg-cyan-glow/10 transition-colors"
          >
            Encontrar uma casa perto de mim
          </Link>
        </section>

        <ConviteParaCompartilhar
          titulo={pergunta.pergunta}
          contexto="Resposta com a fonte citada, no Apoio Espírita."
          url={`${SITE}/perguntas/${pergunta.slug}`}
          chamada="Alguém já lhe fez esta pergunta?"
          explicacao="Envie a resposta por WhatsApp. A página abre sem cadastro e cita a obra e o item de onde cada afirmação saiu."
        />

        {outras.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xs uppercase tracking-[0.3em] text-muted-foreground/60 mb-3">
              Outras perguntas
            </h2>
            <div className="space-y-2">
              {outras.map((p) => (
                <Link
                  key={p.slug}
                  to="/perguntas/$slug"
                  params={{ slug: p.slug }}
                  className="block glass rounded-xl px-4 py-3 hover:shadow-md transition-all duration-300"
                >
                  <p className="text-sm text-foreground/85 font-light">{p.pergunta}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </main>
  );
}
