import { createFileRoute } from "@tanstack/react-router";
import heroVideo from "@/assets/hero-nebula.mp4.asset.json";
import { Particles } from "@/components/Particles";
import { SeamlessVideo } from "@/components/SeamlessVideo";

export const Route = createFileRoute("/")({
  component: Index,
});

const points = [
  {
    title: "Razão e Lógica",
    body: "Uma filosofia que convida ao questionamento e caminha lado a lado com a ciência.",
    icon: "✦",
  },
  {
    title: "Evolução Contínua",
    body: "Entendemos a vida como uma jornada de aprendizado e progresso constante do espírito.",
    icon: "◈",
  },
  {
    title: "Essência e Simplicidade",
    body: "Sem rituais complexos, dogmas ou cobranças. Foco total no estudo e no acolhimento.",
    icon: "❋",
  },
  {
    title: "Amor em Ação",
    body: "Acreditamos que o bem ao próximo é o caminho mais rápido para a nossa própria transformação.",
    icon: "♥",
  },
];

function Index() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      {/* HERO */}
      <section className="relative h-screen w-full flex items-center justify-center overflow-hidden">
        <SeamlessVideo
          src={heroVideo.url}
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Cosmic veil */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/20 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,oklch(0.13_0.06_270/0.6)_80%)]" />

        <Particles count={40} />

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <p className="mb-6 text-xs uppercase tracking-[0.4em] text-cyan-glow animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            Uma perspectiva sobre a vida e a evolução.
          </p>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-light leading-[1.05] text-foreground animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            Sem caridade
            <br />
            <span className="text-gradient-aurora font-medium">não há salvação</span>
          </h1>
          <p className="mt-8 max-w-xl mx-auto text-base md:text-lg text-muted-foreground font-light animate-fade-in-up" style={{ animationDelay: "0.6s" }}>
            Ame o Senhor seu Deus de todo o seu coração, de toda a sua alma e de todo o seu entendimento. Ame o seu próximo como a si mesmo.
          </p>
          <p className="mt-3 max-w-xl mx-auto text-right text-sm uppercase tracking-[0.3em] text-cyan-glow animate-fade-in-up" style={{ animationDelay: "0.75s" }}>
            — Jesus
          </p>

          <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: "0.9s" }}>
            <button className="px-8 py-4 rounded-full text-sm uppercase tracking-widest text-cyan-glow border border-cyan-glow/40 animate-pulse-glow bg-transparent hover:bg-cyan-glow/5 transition-colors duration-500">
              Preciso de Ajuda
            </button>
            <button className="glass px-8 py-4 rounded-full text-sm uppercase tracking-widest text-foreground hover:bg-white/10 transition-colors duration-500">
              Já sou Espírita
            </button>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-muted-foreground text-xs uppercase tracking-[0.3em] animate-fade-in-up" style={{ animationDelay: "1.4s" }}>
          ↓ Desça
        </div>
      </section>

      {/* FOUR POINTS */}
      <section className="relative py-32 px-6">
        <Particles count={15} />
        <div className="mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-20">
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-glow mb-4">Quatro Pontos</p>
            <h2 className="text-4xl md:text-5xl font-light text-foreground">
              Uma prática de <span className="text-gradient-aurora font-medium">luz</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {points.map((p, i) => (
              <article
                key={p.title}
                className="glass rounded-3xl p-10 animate-fade-in-up hover:border-cyan-glow/40 transition-all duration-700 hover:-translate-y-2"
                style={{ animationDelay: `${0.2 + i * 0.15}s` }}
              >
                <div className="text-4xl text-cyan-glow mb-6" style={{ textShadow: "0 0 20px currentColor" }}>
                  {p.icon}
                </div>
                <h3 className="text-2xl font-medium text-foreground mb-4">{p.title}</h3>
                <p className="text-muted-foreground font-light leading-relaxed">{p.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* QUOTE */}
      <section className="relative py-32 px-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,oklch(0.75_0.18_295/0.15),transparent_70%)]" />
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <p className="text-2xl md:text-4xl font-light text-foreground leading-relaxed italic">
            "Fora da caridade não há salvação —
            <br />
            <span className="text-gradient-aurora not-italic font-medium">não há paz verdadeira, nem progresso real.</span>"
          </p>
          <p className="mt-8 text-sm uppercase tracking-[0.3em] text-muted-foreground">— Allan Kardec</p>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-32 px-6 border-t border-border">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-6xl font-light text-foreground mb-6">
            A porta está <span className="text-gradient-aurora font-medium">aberta</span>
          </h2>
          <p className="text-muted-foreground font-light max-w-xl mx-auto mb-10">
            Junte-se a nós às terças e quintas, às 19h30, para as sessões públicas. Não é preciso conhecimento prévio — apenas um coração aberto.
          </p>
          <button className="glass px-10 py-5 rounded-full text-sm uppercase tracking-widest text-foreground hover:bg-white/10 transition-colors duration-500">
            Visite o Centro
          </button>
        </div>

        <footer className="mt-32 text-center text-xs uppercase tracking-[0.3em] text-muted-foreground">
          © Centro Espírita Luminara · Luz · Estudo · Serviço
        </footer>
      </section>
    </main>
  );
}
