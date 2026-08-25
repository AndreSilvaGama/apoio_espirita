export type FaixaQuiz = "3-5" | "6-8" | "9-11";

export interface Pergunta {
  id: string;
  pergunta: string;
  opcoes: string[];
  correta: number;
  faixa: FaixaQuiz;
}

export const PERGUNTAS: Pergunta[] = [
  // ── 3–5 anos ─────────────────────────────────────────────────────────────────
  {
    id: "a01",
    faixa: "3-5",
    pergunta: "Quando um amigo está triste, o que podemos fazer?",
    opcoes: [
      "Consolar e dar um abraço",
      "Ignorar e sair correndo",
      "Rir da tristeza dele",
      "Falar que não é problema nosso",
    ],
    correta: 0,
  },
  {
    id: "a02",
    faixa: "3-5",
    pergunta: "O que é ser bondoso?",
    opcoes: [
      "Ajudar as pessoas com carinho",
      "Gritar com os colegas",
      "Pegar as coisas dos amigos",
      "Não querer dividir",
    ],
    correta: 0,
  },
  {
    id: "a03",
    faixa: "3-5",
    pergunta: "Quando erramos e machucamos alguém, o que devemos fazer?",
    opcoes: ["Pedir desculpas", "Fugir", "Culpar o outro", "Fingir que não aconteceu"],
    correta: 0,
  },
  {
    id: "a04",
    faixa: "3-5",
    pergunta: "Jesus nos ensinou a amar...",
    opcoes: [
      "A todos, até os que nos fazem mal",
      "Só os nossos amigos",
      "Só a nossa família",
      "Só quem é bonzinho conosco",
    ],
    correta: 0,
  },
  {
    id: "a05",
    faixa: "3-5",
    pergunta: "O que é gratidão?",
    opcoes: [
      "Dizer obrigado pelo que temos",
      "Pedir mais brinquedos sempre",
      "Não dividir o lanche",
      "Brigar quando não ganhamos algo",
    ],
    correta: 0,
  },
  {
    id: "a06",
    faixa: "3-5",
    pergunta: "O que fazemos quando um amigo cai e se machuca?",
    opcoes: [
      "Ajudamos e confortamos",
      "Rimos da queda",
      "Saímos correndo",
      "Ficamos olhando sem fazer nada",
    ],
    correta: 0,
  },
  {
    id: "a07",
    faixa: "3-5",
    pergunta: "O que significa perdoar?",
    opcoes: [
      "Deixar a mágoa ir e continuar amigo",
      "Ficar com raiva para sempre",
      "Não falar mais com a pessoa",
      "Guardar rancor no coração",
    ],
    correta: 0,
  },
  {
    id: "a08",
    faixa: "3-5",
    pergunta: "Como podemos cuidar da natureza?",
    opcoes: [
      "Não jogar lixo no chão",
      "Quebrar os galhos das árvores",
      "Pisar nas flores do jardim",
      "Jogar pedras nos pássaros",
    ],
    correta: 0,
  },
  {
    id: "a09",
    faixa: "3-5",
    pergunta: "Quando queremos algo muito importante, podemos...",
    opcoes: [
      "Orar e conversar com Deus",
      "Gritar e fazer birra",
      "Bater no chão com os pés",
      "Ficar emburrado o dia todo",
    ],
    correta: 0,
  },
  {
    id: "a10",
    faixa: "3-5",
    pergunta: "Um gesto de caridade é...",
    opcoes: [
      "Compartilhar o lanche com quem não tem",
      "Comer tudo sozinho",
      "Esconder a comida dos outros",
      "Dizer que o lanche é só nosso",
    ],
    correta: 0,
  },

  // ── 6–8 anos ─────────────────────────────────────────────────────────────────
  {
    id: "b01",
    faixa: "6-8",
    pergunta: "Na Parábola do Filho Pródigo, o pai que recebe o filho de volta representa:",
    opcoes: [
      "O amor de Deus que sempre nos recebe",
      "A riqueza que o filho perdeu",
      "A tristeza da família",
      "O castigo que o filho merecia",
    ],
    correta: 0,
  },
  {
    id: "b02",
    faixa: "6-8",
    pergunta: "Caridade verdadeira significa:",
    opcoes: [
      "Ajudar o próximo com amor, sem esperar recompensa",
      "Dar dinheiro por obrigação",
      "Só rezar bastante",
      "Ser bonzinho apenas com os amigos próximos",
    ],
    correta: 0,
  },
  {
    id: "b03",
    faixa: "6-8",
    pergunta: "A Lei de Causa e Efeito nos ensina que:",
    opcoes: [
      "Colhemos o que plantamos",
      "Podemos fazer o mal sem consequências",
      "Só os ricos são felizes",
      "As consequências nunca chegam",
    ],
    correta: 0,
  },
  {
    id: "b04",
    faixa: "6-8",
    pergunta: "Segundo o Espiritismo, a alma:",
    opcoes: [
      "Continua existindo após a morte do corpo",
      "Desaparece junto com o corpo",
      "Vai para o paraíso e fica parada para sempre",
      "Vira anjo automaticamente",
    ],
    correta: 0,
  },
  {
    id: "b05",
    faixa: "6-8",
    pergunta: "O que é humildade?",
    opcoes: [
      "Reconhecer que ainda temos muito a aprender",
      "Achar que sabemos tudo",
      "Não ajudar os outros para não aparecer",
      "Querer ser sempre o primeiro",
    ],
    correta: 0,
  },
  {
    id: "b06",
    faixa: "6-8",
    pergunta: "Quando Jesus disse 'Amai-vos uns aos outros', quis dizer:",
    opcoes: [
      "Tratar todos com amor e respeito",
      "Só amar quem nos ama de volta",
      "Amar apenas a família",
      "Amar os animais mas não as pessoas",
    ],
    correta: 0,
  },
  {
    id: "b07",
    faixa: "6-8",
    pergunta: "A oração serve para:",
    opcoes: [
      "Conectar-se com Deus e buscar orientação",
      "Conseguir tudo que queremos materialmente",
      "Impressionar as pessoas ao redor",
      "Substituir as boas ações do dia a dia",
    ],
    correta: 0,
  },
  {
    id: "b08",
    faixa: "6-8",
    pergunta: "Quem codificou a Doutrina Espírita?",
    opcoes: ["Allan Kardec", "Chico Xavier", "Emmanuel", "Leon Denis"],
    correta: 0,
  },
  {
    id: "b09",
    faixa: "6-8",
    pergunta: "A virtude da paciência nos ajuda a:",
    opcoes: [
      "Esperar com tranquilidade e sem irritação",
      "Conseguir tudo muito rápido",
      "Não esperar por ninguém",
      "Desistir quando as coisas demoram",
    ],
    correta: 0,
  },
  {
    id: "b10",
    faixa: "6-8",
    pergunta: "Segundo o Espiritismo, os espíritos podem:",
    opcoes: [
      "Evoluir e se tornar cada vez melhores",
      "Ficar parados para sempre",
      "Desaparecer com o tempo",
      "Voltar apenas como animais",
    ],
    correta: 0,
  },

  // ── 9–11 anos ────────────────────────────────────────────────────────────────
  {
    id: "c01",
    faixa: "9-11",
    pergunta: "O Espiritismo é ao mesmo tempo:",
    opcoes: [
      "Ciência, Filosofia e Moral",
      "Fé, Esperança e Caridade",
      "Oração, Meditação e Jejum",
      "Amor, Perdão e Riqueza",
    ],
    correta: 0,
  },
  {
    id: "c02",
    faixa: "9-11",
    pergunta: "A reencarnação é:",
    opcoes: [
      "O retorno do espírito a um novo corpo para continuar evoluindo",
      "A transformação do corpo físico em espírito",
      "A vida eterna no paraíso sem mais mudanças",
      "O fim definitivo da existência do espírito",
    ],
    correta: 0,
  },
  {
    id: "c03",
    faixa: "9-11",
    pergunta: "Qual é o primeiro livro da codificação espírita?",
    opcoes: [
      "O Livro dos Espíritos",
      "O Evangelho Segundo o Espiritismo",
      "O Livro dos Médiuns",
      "O Céu e o Inferno",
    ],
    correta: 0,
  },
  {
    id: "c04",
    faixa: "9-11",
    pergunta: "A Lei do Progresso nos ensina que:",
    opcoes: [
      "Todo espírito caminha inevitavelmente para a perfeição",
      "Os espíritos já nascem perfeitos",
      "Somente alguns espíritos escolhidos evoluem",
      "A evolução termina com a morte do corpo",
    ],
    correta: 0,
  },
  {
    id: "c05",
    faixa: "9-11",
    pergunta: "O perispírito é:",
    opcoes: [
      "O envoltório semi-material que liga o espírito ao corpo",
      "O próprio corpo físico",
      "A parte mais elevada da alma",
      "O conjunto de memórias de vidas passadas",
    ],
    correta: 0,
  },
  {
    id: "c06",
    faixa: "9-11",
    pergunta: "Segundo o Espiritismo, somos responsáveis por:",
    opcoes: [
      "Nossas ações, pensamentos e palavras",
      "Apenas nossas ações visíveis aos outros",
      "Somente os erros cometidos nesta vida",
      "Nada — Deus decide tudo por nós",
    ],
    correta: 0,
  },
  {
    id: "c07",
    faixa: "9-11",
    pergunta: "A Doutrina Espírita tem como base moral o Evangelho de:",
    opcoes: ["Jesus Cristo", "Moisés", "Buda", "Sócrates"],
    correta: 0,
  },
  {
    id: "c08",
    faixa: "9-11",
    pergunta: "O que é mediunidade?",
    opcoes: [
      "A faculdade de perceber e comunicar com os espíritos",
      "Um poder de prever o futuro com certeza",
      "A capacidade de realizar milagres visíveis",
      "Um dom exclusivo de pessoas santas",
    ],
    correta: 0,
  },
  {
    id: "c09",
    faixa: "9-11",
    pergunta: "Segundo o Espiritismo, o sofrimento:",
    opcoes: [
      "É consequência das escolhas do próprio espírito e oportunidade de crescimento",
      "É um castigo divino imposto a quem peca",
      "Não tem nenhum propósito e é apenas azar",
      "Existe apenas para os espíritos atrasados",
    ],
    correta: 0,
  },
  {
    id: "c10",
    faixa: "9-11",
    pergunta: "A pluralidade dos mundos habitados significa que:",
    opcoes: [
      "Existem outros mundos com vida além da Terra",
      "A Terra é o único planeta habitado no universo",
      "Só os espíritos perfeitos habitam outros mundos",
      "Os outros planetas são mundos de punição",
    ],
    correta: 0,
  },
];

export const QTDES_PERGUNTAS = [5, 10, 15] as const;
export type QtdePerguntas = (typeof QTDES_PERGUNTAS)[number];

export const FAIXAS_QUIZ: { id: FaixaQuiz | "todas"; label: string }[] = [
  { id: "3-5", label: "3–5 anos" },
  { id: "6-8", label: "6–8 anos" },
  { id: "9-11", label: "9–11 anos" },
  { id: "todas", label: "Todas as faixas" },
];

export function sortearPerguntas(faixa: FaixaQuiz | "todas", qtde: number): Pergunta[] {
  const pool = faixa === "todas" ? PERGUNTAS : PERGUNTAS.filter((p) => p.faixa === faixa);
  const embaralhado = [...pool].sort(() => Math.random() - 0.5);
  return embaralhado.slice(0, Math.min(qtde, embaralhado.length));
}
