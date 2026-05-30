export interface PalavraCaca {
  palavra: string; // Apenas letras maiúsculas, sem acentos nem espaços
  palavraExibicao: string; // Com acentos/espaços para exibir
  dica: string;
  significado: string;
}

export type CategoriaCaca = "Virtudes" | "Livros" | "Personagens";

export const CATEGORIAS_CACA: { id: CategoriaCaca; label: string; desc: string }[] = [
  {
    id: "Virtudes",
    label: "Virtudes Cristãs",
    desc: "Encontre termos morais essenciais para o progresso do espírito."
  },
  {
    id: "Livros",
    label: "Livros e Obras",
    desc: "Encontre os títulos fundamentais da codificação e literatura espírita."
  },
  {
    id: "Personagens",
    label: "Personagens de Luz",
    desc: "Encontre os nomes de grandes trabalhadores da vinha do Senhor."
  }
];

export const PALAVRAS_POR_CATEGORIA: Record<CategoriaCaca, PalavraCaca[]> = {
  Virtudes: [
    {
      palavra: "AMOR",
      palavraExibicao: "Amor",
      dica: "A lei maior ensinada por Jesus que rege todo o universo.",
      significado: "O amor resume toda a doutrina de Jesus e é a chave para a harmonia e felicidade real do espírito."
    },
    {
      palavra: "CARIDADE",
      palavraExibicao: "Caridade",
      dica: "Auxiliar o próximo sem esperar recompensa ou reconhecimento.",
      significado: "Allan Kardec sintetizou o caminho espiritual no famoso lema: 'Fora da caridade não há salvação'."
    },
    {
      palavra: "PERDAO",
      palavraExibicao: "Perdão",
      dica: "Esquecer a ofensa e tirar todo o sentimento de mágoa da alma.",
      significado: "Perdoar nos liberta das amarras do passado e atrai a misericórdia divina para nossas próprias imperfeições."
    },
    {
      palavra: "HUMILDADE",
      palavraExibicao: "Humildade",
      dica: "Reconhecer que somos todos iguais e ainda temos muito a aprender.",
      significado: "A humildade afasta o orgulho, permitindo que a luz espiritual e a sabedoria penetrem em nosso coração."
    },
    {
      palavra: "PACIENCIA",
      palavraExibicao: "Paciência",
      dica: "Saber esperar com fé e manter a serenidade diante das provações.",
      significado: "A paciência é o amor que sabe esperar. Ela evita reações impulsivas e protege nossa paz interior."
    },
    {
      palavra: "BENEVOLENCIA",
      palavraExibicao: "Benevolência",
      dica: "Querer e fazer o bem a todos de maneira constante.",
      significado: "A benevolência para com todos faz parte da definição de verdadeira caridade ensinada pelos espíritos."
    },
    {
      palavra: "INDULGENCIA",
      palavraExibicao: "Indulgência",
      dica: "Ser compreensivo com as imperfeições e erros alheios.",
      significado: "A indulgência nos ensina a não julgar nossos irmãos, lembrando que também carregamos fragilidades."
    },
    {
      palavra: "ESPERANCA",
      palavraExibicao: "Esperança",
      dica: "Confiança firme no futuro sob o amparo da bondade de Deus.",
      significado: "A esperança renova nossas forças nas horas de dor, assegurando-nos que a tempestade sempre passa."
    },
    {
      palavra: "SOLIDARIEDADE",
      palavraExibicao: "Solidariedade",
      dica: "Sentimento de união e responsabilidade mútua entre os seres.",
      significado: "Como irmãos em Cristo, a solidariedade nos convoca a cooperar uns com os outros na construção do bem coletivo."
    }
  ],
  Livros: [
    {
      palavra: "ESPIRITOS",
      palavraExibicao: "O Livro dos Espíritos",
      dica: "A obra de estreia da Codificação Espírita lançada em 1857.",
      significado: "Contém os princípios da Doutrina Espírita sobre a imortalidade da alma, a natureza dos espíritos e as leis morais."
    },
    {
      palavra: "MEDIUNS",
      palavraExibicao: "O Livro dos Médiuns",
      dica: "O guia prático sobre a comunicação com o mundo invisível.",
      significado: "Trata do desenvolvimento da mediunidade, dos tipos de manifestações e da obsessão, orientando a prática fraterna."
    },
    {
      palavra: "EVANGELHO",
      palavraExibicao: "O Evangelho segundo o Espiritismo",
      dica: "O livro focado na explicação moral das passagens de Jesus.",
      significado: "Explica as máximas do Cristo de forma clara e consoladora, servindo de roteiro prático para a reforma íntima."
    },
    {
      palavra: "CEU",
      palavraExibicao: "O Céu e o Inferno",
      dica: "Livro sobre a justiça divina e a situação da alma após a desencarnação.",
      significado: "Demonstra que a felicidade ou sofrimento do espírito no além-túmulo decorre de suas próprias escolhas e atitudes."
    },
    {
      palavra: "GENESE",
      palavraExibicao: "A Gênese",
      dica: "A última obra da codificação de Kardec sobre milagres e predições.",
      significado: "Estuda a criação do mundo, os milagres sob a ótica científica e espiritual, e as transições planetárias."
    },
    {
      palavra: "NOSSO LAR",
      palavraExibicao: "Nosso Lar",
      dica: "A famosa obra de André Luiz sobre a vida no plano espiritual.",
      significado: "Psicografado por Chico Xavier, descreve a organização e o serviço de auxílio em uma colônia espiritual de transição."
    }
  ],
  Personagens: [
    {
      palavra: "KARDEC",
      palavraExibicao: "Allan Kardec",
      dica: "O pedagogo francês responsável por codificar a Doutrina Espírita.",
      significado: "Hippolyte Léon Denizard Rivail, sob o pseudônimo de Allan Kardec, organizou as bases científicas e morais do Espiritismo."
    },
    {
      palavra: "CHICO",
      palavraExibicao: "Chico Xavier",
      dica: "O maior médium do Brasil, sinônimo de amor e dedicação.",
      significado: "Francisco Cândido Xavier psicografou mais de 450 livros e doou todos os direitos autorais para obras de caridade."
    },
    {
      palavra: "EMMANUEL",
      palavraExibicao: "Emmanuel",
      dica: "O mentor espiritual constante das psicografias de Chico Xavier.",
      significado: "Orientou Chico com sabedoria, autor de romances históricos clássicos e de belíssimas mensagens de conduta cristã."
    },
    {
      palavra: "ANDRE",
      palavraExibicao: "André Luiz",
      dica: "Espírito médico autor da coleção 'A Vida no Mundo Espiritual'.",
      significado: "Trouxe revelações fundamentais sobre as atividades, habitações e leis que regem os espíritos no plano espiritual."
    },
    {
      palavra: "BEZERRA",
      palavraExibicao: "Bezerra de Menezes",
      dica: "Conhecido carinhosamente como o 'Médico dos Pobres'.",
      significado: "Político, médico e intelectual brasileiro que dedicou sua existência ao amparo dos necessitados e difusão do Espiritismo."
    }
  ]
};
