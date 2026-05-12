import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/transparencia")({
  component: Transparencia,
});

const sections = [
  {
    icon: "♥",
    title: "Um trabalho de caridade",
    body: `Este espaço foi construído com um único propósito: servir. Não a uma pessoa, não a uma instituição — mas a todos que, em algum momento da jornada, precisarem de amparo, orientação ou simplesmente de saber que não estão sozinhos.

Nenhuma cobrança jamais será feita. Nenhum espaço comercial será cedido. Este é um trabalho de caridade — e a caridade, quando verdadeira, não conhece preço nem aguarda reconhecimento.`,
  },
  {
    icon: "✦",
    title: "O bem não tem dono",
    body: `Os códigos-fonte deste projeto estão disponíveis publicamente no GitHub e podem ser baixados, adaptados e continuados por qualquer pessoa ou instituição que deseje servir de forma semelhante.

O desenvolvedor ainda está trabalhando no projeto, mas desde o primeiro momento abriu mão de qualquer exclusividade. As ferramentas utilizadas — GitHub, Supabase, Cloudflare, Resend e outras — precisarão ser adquiridas e configuradas por quem optar por dar continuidade ao trabalho. O que se oferece aqui é o caminho já percorrido, para que outros não precisem começar do zero.`,
  },
  {
    icon: "◈",
    title: "À Federação Espírita Brasileira",
    body: `A Federação Espírita Brasileira está, desde já, autorizada a tomar posse deste domínio. Sua transferência será feita a qualquer momento, mediante simples solicitação — formal ou informal —, como doação voluntária, sem ônus, sem condições e sem arrependimentos.

Que este pequeno tijolo possa ser útil à construção da grande obra.`,
  },
  {
    icon: "❋",
    title: "Para que este site existe",
    body: null,
    list: [
      "Acolher a qualquer pessoa em momento de necessidade, independentemente de crença ou condição",
      "Apoiar os membros, trabalhadores e frequentadores das casas espíritas",
      "Unir diferentes centros e grupos em torno de um propósito fraterno comum",
      "Divulgar, difundir e amparar os trabalhos realizados pelas instituições espíritas",
      "Ser um ponto de encontro entre quem precisa e quem pode ajudar",
    ],
  },
  {
    icon: "◉",
    title: "Autonomia para cada casa",
    body: `Não há regras impostas de fora. Cada presidente de casa espírita pode configurar o site conforme as necessidades e a realidade de sua instituição. Somente o presidente e os coordenadores por ele indicados poderão habilitar ou restringir funcionalidades — respeitando a autonomia, o discernimento e o ritmo de cada grupo.

O site é um instrumento. Quem o conduz com amor e responsabilidade são os trabalhadores da vinha do Senhor.`,
  },
];

function Transparencia() {
  return (
    <main className="page-light min-h-screen px-6 py-20">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="text-center mb-20">
          <p className="text-xs uppercase tracking-[0.4em] text-cyan-glow mb-4">
            Transparência &amp; Propósito
          </p>
          <h1 className="text-4xl md:text-5xl font-light text-foreground leading-snug">
            Um serviço oferecido{" "}
            <span className="text-gradient-aurora font-medium">sem reservas</span>
          </h1>
          <p className="mt-6 text-muted-foreground font-light max-w-xl mx-auto leading-relaxed">
            "Fora da caridade não há salvação."
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.3em] text-muted-foreground/60">
            — Allan Kardec
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-12">
          {sections.map((s) => (
            <article key={s.title} className="glass rounded-3xl p-8 md:p-10">
              <div
                className="text-3xl text-cyan-glow mb-5"
                style={{ textShadow: "0 0 20px currentColor" }}
              >
                {s.icon}
              </div>
              <h2 className="text-xl font-medium text-foreground mb-4">{s.title}</h2>
              {s.body &&
                s.body.split("\n\n").map((paragraph, i) => (
                  <p
                    key={i}
                    className="text-muted-foreground font-light leading-relaxed mb-3 last:mb-0"
                  >
                    {paragraph}
                  </p>
                ))}
              {s.list && (
                <ul className="space-y-3 mt-2">
                  {s.list.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-muted-foreground font-light">
                      <span className="text-cyan-glow mt-1 shrink-0">·</span>
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-20 text-center space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground/50">
            Luz · Estudo · Serviço
          </p>
          <Link
            to="/"
            className="inline-block text-sm text-cyan-glow/70 hover:text-cyan-glow transition-colors"
          >
            ← Voltar ao início
          </Link>
        </div>
      </div>
    </main>
  );
}
