import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Gamepad2, Sprout, Brain, HelpCircle, Sparkles, Search, Compass } from "lucide-react";

export const Route = createFileRoute("/jogos/")({
  component: PortalJogos,
});

function PortalJogos() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <main className="page-light min-h-screen px-4 pt-20 pb-20 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  const jogos = [
    {
      title: "Caminho da Luz",
      desc: "Avance por uma trilha brilhante de virtudes morais e doutrinárias respondendo perguntas. Pode ser jogado sozinho ou em dupla com efeitos visuais e sonoros!",
      icon: Compass,
      color: "bg-indigo-50 text-indigo-600 border-indigo-100",
      border: "border-indigo-200/60",
      accent: "text-indigo-700 hover:bg-indigo-50",
      buttonColor: "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/10",
      href: "/jogos/caminho-da-luz",
      novo: true,
    },
    {
      title: "Plante a Semente",
      desc: "Descubra termos e palavras importantes da codificação espírita e saiba o significado de cada um deles.",
      icon: Sprout,
      color: "bg-emerald-50 text-emerald-600 border-emerald-100",
      border: "border-emerald-200/60",
      accent: "text-emerald-700 hover:bg-emerald-50",
      buttonColor: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/10",
      href: "/jogos/plante-a-semente",
    },
    {
      title: "Semeador de Mensagens",
      desc: "Cultive lindas mensagens psicografadas e passagens doutrinárias ordenando as palavras em bolhas de luz.",
      icon: Sparkles,
      color: "bg-rose-50 text-rose-600 border-rose-100",
      border: "border-rose-200/60",
      accent: "text-rose-700 hover:bg-rose-50",
      buttonColor: "bg-rose-600 hover:bg-rose-700 shadow-rose-600/10",
      href: "/jogos/semeador-mensagens",
    },
    {
      title: "Caça-Palavras das Virtudes",
      desc: "Encontre termos morais e espíritas na grade de letras de forma totalmente dinâmica, e descubra belas explicações de cada virtude localizada.",
      icon: Search,
      color: "bg-violet-50 text-violet-600 border-violet-100",
      border: "border-violet-200/60",
      accent: "text-violet-700 hover:bg-violet-50",
      buttonColor: "bg-violet-600 hover:bg-violet-700 shadow-violet-600/10",
      href: "/jogos/caca-palavras",
      novo: true,
    },
    {
      title: "Jogo da Memória",
      desc: "Associe virtudes com seus símbolos e conheça palavras fundamentais do Evangelho e suas explicações.",
      icon: Brain,
      color: "bg-cyan-50 text-cyan-600 border-cyan-100",
      border: "border-cyan-200/60",
      accent: "text-cyan-700 hover:bg-cyan-50",
      buttonColor: "bg-cyan-600 hover:bg-cyan-700 shadow-cyan-600/10",
      href: "/jogos/memoria-evangelizacao",
    },
    {
      title: "Quiz Espírita",
      desc: "Teste seus conhecimentos morais e doutrinários com perguntas de múltipla escolha divididas por faixa etária.",
      icon: HelpCircle,
      color: "bg-amber-50 text-amber-600 border-amber-100",
      border: "border-amber-200/60",
      accent: "text-amber-700 hover:bg-amber-50",
      buttonColor: "bg-amber-600 hover:bg-amber-700 shadow-amber-600/10",
      href: "/jogos/quiz-espirita",
    },
  ];

  return (
    <main className="page-light min-h-screen pt-20 pb-20 px-4 md:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            to={user ? "/inicio" : "/"}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Início
          </Link>
          <span className="text-muted-foreground/40">|</span>
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-violet-600" />
            <h1 className="text-lg font-semibold tracking-wide text-foreground animate-pulse">
              Portal de Jogos Educativos
            </h1>
          </div>
        </div>

        {/* Título de Destaque */}
        <div className="border-b border-gray-100 pb-6">
          <h2 className="text-3xl font-light tracking-tight text-foreground font-serif">
            Aprender e <span className="font-semibold text-gradient-aurora">Crescer</span>
          </h2>
          <p className="mt-1.5 text-sm text-gray-500 font-light">
            Divirta-se com atividades lúdicas e interativas criadas para a formação moral e doutrinária de todas as idades.
          </p>
        </div>

        {/* Grade de Jogos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {jogos.map((jogo) => (
            <div
              key={jogo.title}
              className={`glass-premium hover-premium rounded-3xl p-6 border ${jogo.border} flex flex-col justify-between h-full relative overflow-hidden`}
            >
              {/* Badge de NOVO */}
              {jogo.novo && (
                <span className="absolute top-4 right-4 bg-rose-500 text-white text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-sm animate-pulse">
                  Novo
                </span>
              )}
              
              <div className="space-y-4">
                <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 shadow-sm ${jogo.color}`}>
                  <jogo.icon size={22} strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-800 leading-snug">
                    {jogo.title}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed font-light mt-1">
                    {jogo.desc}
                  </p>
                </div>
              </div>

              <div className="pt-6">
                <Link
                  to={jogo.href}
                  className={`w-full py-3 rounded-xl text-xs font-semibold uppercase tracking-wider text-white ${jogo.buttonColor} transition-all duration-300 flex items-center justify-center gap-1.5 shadow-md`}
                >
                  Jogar Agora
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Rodapé informativo */}
        <p className="text-xs text-center text-muted-foreground/50 font-light pt-4">
          Todos os jogos operam de forma 100% local e segura, respeitando o ritmo e aprendizado de cada irmão.
        </p>

      </div>
    </main>
  );
}
