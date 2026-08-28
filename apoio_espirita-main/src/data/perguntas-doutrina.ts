/**
 * Perguntas que quem chega de fora realmente faz sobre o Espiritismo.
 *
 * Este é o conteúdo público do portal: as respostas existem para alcançar
 * quem procura no momento em que está procurando — muitas vezes sofrendo, e
 * sem conhecer ninguém no movimento espírita.
 *
 * REGRA DE FONTE, decidida em 28/08/2026 e sem exceção: toda afirmação
 * doutrinária vem da codificação de Allan Kardec, com a obra e o número da
 * questão ou do item, e a citação literal. Nada de autores posteriores — é o
 * terreno que nenhuma corrente do movimento contesta, está em domínio público
 * e deixa cada frase verificável por quem duvidar.
 *
 * Cada citação abaixo foi conferida no texto integral das obras (edição FEB,
 * tradução de Evandro Noleto Bezerra, para O Livro dos Espíritos; edições
 * correntes de O Livro dos Médiuns e de O Evangelho segundo o Espiritismo).
 * Ao acrescentar uma pergunta nova, conferir a citação na obra antes de
 * publicar. Uma citação errada aqui vira erro doutrinário assinado pelo site.
 */

export type Obra =
  | "O Livro dos Espíritos"
  | "O Livro dos Médiuns"
  | "O Evangelho segundo o Espiritismo";

export interface Fonte {
  obra: Obra;
  /** Onde exatamente: "questão 944", "item 159", "capítulo XV, item 10". */
  referencia: string;
  /** O texto como está na obra. Sem paráfrase. */
  citacao: string;
}

export interface PerguntaDaDoutrina {
  slug: string;
  pergunta: string;
  /** Resumo de uma linha — vira a descrição da página nos buscadores. */
  resumo: string;
  /** A resposta, em parágrafos. Linguagem simples, sem jargão. */
  resposta: string[];
  fontes: Fonte[];
  /** Palavras que levam até esta pergunta na busca do site. */
  termos: string[];
  /** Mostra o bloco de amparo imediato (CVV) no topo da resposta. */
  amparoUrgente?: boolean;
}

export const PERGUNTAS_DA_DOUTRINA: PerguntaDaDoutrina[] = [
  {
    slug: "o-que-e-o-espiritismo",
    pergunta: "O que é o Espiritismo?",
    resumo:
      "A doutrina codificada por Allan Kardec a partir de 1857, que se apresenta ao mesmo tempo como ciência, filosofia e moral.",
    resposta: [
      "O Espiritismo é a doutrina organizada por Allan Kardec a partir de 1857, quando publicou O Livro dos Espíritos. A palavra é nova de propósito: Kardec explica, logo na introdução da obra, que precisava de um termo que não se confundisse com “espiritualismo”, palavra que já existia e que designa apenas quem acredita haver algo além da matéria — sem necessariamente admitir a existência dos Espíritos nem a comunicação deles com o mundo visível.",
      "O próprio Kardec descreve a doutrina sob três aspectos que caminham juntos: os fatos observados, os princípios de filosofia e moral que decorrem deles, e a aplicação desses princípios na vida de cada um. Daí ele distinguir três graus entre os que a seguem — quem apenas constata os fatos, quem compreende as consequências morais e quem procura viver essas consequências.",
      "Na prática, isso significa que o Espiritismo não se sustenta em revelação imposta nem em autoridade de pessoa alguma. Ele pede exame. Kardec escreveu que a doutrina “mostra o que existe, coordena, mas não cria nada”.",
    ],
    fontes: [
      {
        obra: "O Livro dos Espíritos",
        referencia: "Introdução, item I",
        citacao:
          "Em lugar das palavras espiritual, espiritualismo, empregaremos, para designar esta última crença, as palavras espírita e espiritismo, cuja forma lembra a origem e o sentido radical.",
      },
      {
        obra: "O Livro dos Espíritos",
        referencia: "Conclusão, item VII",
        citacao:
          "O Espiritismo se apresenta sob três aspectos diferentes: o fato das manifestações, os princípios de filosofia e de moral que delas decorrem e a aplicação desses princípios.",
      },
    ],
    termos: ["espiritismo", "doutrina espirita", "kardec", "o que e", "allan kardec"],
  },
  {
    slug: "espiritismo-e-religiao",
    pergunta: "Espiritismo é religião? Preciso deixar a minha para frequentar um centro?",
    resumo:
      "Ninguém precisa deixar a própria religião para entrar numa casa espírita: as atividades públicas são abertas e gratuitas.",
    resposta: [
      "Você não precisa deixar religião nenhuma, nem se declarar espírita, para entrar numa casa espírita, assistir a uma palestra, participar de um estudo ou receber atendimento. As atividades públicas são abertas a qualquer pessoa e ninguém é questionado sobre a sua fé na porta.",
      "Isso não é cortesia do movimento: vem do centro da própria doutrina. O capítulo de O Evangelho segundo o Espiritismo que trata do assunto se chama, em título, “Fora da caridade não há salvação” — e é nesse mesmo capítulo que Kardec discute, para recusá-la, a fórmula “fora da Igreja não há salvação”. O que a doutrina afirma valer não é a filiação a uma instituição, mas o que a pessoa faz do próprio coração.",
      "Sobre a natureza do Espiritismo, Kardec o apresenta como ciência, filosofia e moral ao mesmo tempo, e é comum encontrar no movimento quem enfatize um desses aspectos mais do que os outros. Frequentar não obriga a assumir rótulo algum.",
    ],
    fontes: [
      {
        obra: "O Evangelho segundo o Espiritismo",
        referencia: "capítulo XV",
        citacao:
          "Fora da caridade não há salvação. [...] Fora da Igreja não há salvação. Fora da verdade não há salvação.",
      },
      {
        obra: "O Livro dos Espíritos",
        referencia: "Conclusão, item VII",
        citacao:
          "Daí, três classes, ou melhor, três graus de adeptos: 1o) os que creem nas manifestações e se limitam a constatá-las; para esses, o Espiritismo é uma ciência experimental; 2o) os que compreendem as suas consequências morais; 3o) os que praticam ou se esforçam por praticar essa moral.",
      },
    ],
    termos: ["religiao", "catolico", "evangelico", "posso frequentar", "mudar de religiao"],
  },
  {
    slug: "o-que-acontece-depois-da-morte",
    pergunta: "O que acontece depois da morte?",
    resumo:
      "Para a doutrina espírita, a morte encerra o corpo, não a pessoa: o Espírito continua com a mesma individualidade.",
    resposta: [
      "Segundo o ensino recolhido por Kardec, a morte não interrompe a existência nem apaga quem a pessoa era. A alma volta ao mundo dos Espíritos, de onde havia saído, e conserva a sua individualidade — continua sendo ela mesma, com a sua história, os seus afetos e a sua consciência.",
      "A passagem, porém, não é imediata nem igual para todos. Kardec registra um período de perturbação logo após a separação: o Espírito leva algum tempo até se reconhecer. Quanto esse tempo dura depende de cada um — quem viveu mais desprendido da matéria se reconhece quase de imediato; quem viveu preso a ela demora mais.",
      "É por isso que, nas casas espíritas, se ora pelos que partiram há pouco. Não como despedida obrigatória, mas como amparo a alguém que, segundo a doutrina, está atravessando uma passagem e pode estar confuso.",
    ],
    fontes: [
      {
        obra: "O Livro dos Espíritos",
        referencia: "questão 149",
        citacao:
          "Em que se torna a alma no instante da morte? “Volta a ser Espírito, isto é, retorna ao mundo dos Espíritos, que havia deixado momentaneamente.”",
      },
      {
        obra: "O Livro dos Espíritos",
        referencia: "questão 150",
        citacao: "Após a morte, a alma conserva a sua individualidade? “Sim; jamais a perde.”",
      },
      {
        obra: "O Livro dos Espíritos",
        referencia: "questão 163",
        citacao:
          "Deixando o corpo, a alma tem imediatamente consciência de si mesma? “Consciência imediata não é bem o termo; ela fica algum tempo em estado de perturbação.”",
      },
    ],
    termos: ["morte", "depois da morte", "morrer", "alma", "falecimento", "luto"],
  },
  {
    slug: "por-que-reencarnamos",
    pergunta: "O que é reencarnação e por que reencarnamos?",
    resumo:
      "A doutrina ensina que voltamos a viver muitas vezes, e que o motivo é aprender o que não se aprende de outro jeito.",
    resposta: [
      "Reencarnar é voltar a viver numa nova existência corpórea. Kardec pergunta como a alma que não alcançou a perfeição pode acabar de se aperfeiçoar, e a resposta é direta: “sofrendo a prova de uma nova existência”. Logo adiante, os Espíritos afirmam que todos temos muitas existências corpóreas, não apenas uma.",
      "O motivo, na doutrina, não é castigo. É que ninguém nasce pronto: “todos são criados simples e ignorantes e se instruem nas lutas e tribulações da vida corpórea”. A vida é apresentada como escola, e não como sentença — para uns a encarnação é expiação, para outros é missão.",
      "Daí decorre uma consequência que costuma pesar mais do que a teoria: o que está por resolver não se perde. A doutrina sustenta que ninguém é privado da chance de recomeçar, porque haverá outra existência para o que ficou pelo caminho.",
    ],
    fontes: [
      {
        obra: "O Livro dos Espíritos",
        referencia: "questão 166",
        citacao:
          "Como pode a alma, que não alcançou a perfeição durante a vida corpórea, acabar de depurar-se? “Sofrendo a prova de uma nova existência.”",
      },
      {
        obra: "O Livro dos Espíritos",
        referencia: "questão 166-b",
        citacao:
          "A alma passa, portanto, por muitas existências corpóreas? “Sim, todos nós temos muitas existências corpóreas.”",
      },
      {
        obra: "O Livro dos Espíritos",
        referencia: "questão 133",
        citacao:
          "Todos são criados simples e ignorantes e se instruem nas lutas e tribulações da vida corpórea.",
      },
    ],
    termos: ["reencarnacao", "renascer", "vidas passadas", "carma", "outra vida"],
  },
  {
    slug: "por-que-uma-crianca-morre",
    pergunta: "Por que uma criança morre?",
    resumo:
      "A resposta que a doutrina dá é sóbria e não consola com facilidade — mas também não trata a criança como alma inacabada.",
    resposta: [
      "Esta é, talvez, a pergunta mais difícil que chega a uma casa espírita. A doutrina não responde com uma frase que faça a dor passar, e seria desonesto apresentá-la assim. O que Kardec registra é que a vida curta pode completar uma existência interrompida antes do tempo devido, e que essa morte, quase sempre, constitui prova ou expiação para os pais.",
      "Há um segundo ponto, que costuma surpreender: para o Espiritismo, o Espírito de uma criança não é um Espírito pequeno. Ele pode ser tão adiantado quanto o de um adulto, e muitas vezes mais — inclusive mais do que o dos próprios pais. O corpo era novo; a individualidade, não.",
      "E Kardec recusa a ideia de que a criança seja pura só por ter morrido cedo: se não fez o mal, também não fez o bem, e se for pura não é por ter sido criança, e sim por já ser mais evoluída. Nada disso pretende explicar a falta que ela faz. A doutrina afirma o reencontro, não o consolo fácil.",
    ],
    fontes: [
      {
        obra: "O Livro dos Espíritos",
        referencia: "questão 199",
        citacao:
          "Por que a vida se interrompe com tanta frequência na infância? “A duração da vida da criança pode representar, para o Espírito que nela está encarnado, o complemento de uma existência interrompida antes do término devido, e sua morte, quase sempre, constitui provação ou expiação para os pais.”",
      },
      {
        obra: "O Livro dos Espíritos",
        referencia: "questão 197",
        citacao:
          "O Espírito de uma criança, morta em tenra idade, poderá ser tão adiantado quanto o de um adulto? “Algumas vezes muito mais, porque pode ter vivido mais e adquirido maior soma de experiência.”",
      },
      {
        obra: "O Livro dos Espíritos",
        referencia: "questão 198",
        citacao:
          "Se for puro, não o será pelo fato de ter sido criança, mas porque era mais evoluído.",
      },
    ],
    termos: ["crianca", "filho", "morte de crianca", "perdi meu filho", "bebe", "luto"],
  },
  {
    slug: "o-que-a-doutrina-diz-sobre-o-suicidio",
    pergunta: "O que a doutrina espírita diz sobre o suicídio?",
    resumo:
      "Kardec é firme ao tratá-lo como transgressão, e igualmente firme ao afastar o julgamento de quem sofre.",
    amparoUrgente: true,
    resposta: [
      "Se você chegou aqui procurando isto por estar em sofrimento, procure ajuda agora: o CVV atende de graça, 24 horas, pelo telefone 188, e ninguém precisa se identificar. Nada do que está escrito abaixo substitui essa conversa.",
      "A doutrina espírita trata o suicídio como transgressão da Lei divina: perguntado se o homem tem o direito de dispor da própria vida, o ensino recolhido por Kardec responde que não, que somente Deus tem esse direito.",
      "No mesmo lugar, porém, Kardec faz a pergunta que evita transformar isso em condenação: nem sempre o suicídio é voluntário — e a resposta é que “o louco que se mata não sabe o que faz”. A doutrina distingue o ato de quem decide do ato de quem já não tem domínio de si. Adoecimento não é escolha, e a casa espírita que trata alguém em sofrimento como culpado está errando contra a própria doutrina que diz seguir.",
      "Sobre o desgosto pela vida que aparece sem motivo aparente, Kardec registra que ele costuma vir da ociosidade, da falta de fé e da saciedade — e a orientação dos Espíritos aponta para o trabalho útil e para o sentido, não para a resignação passiva. Quem convive com alguém assim encontra acolhimento em qualquer casa espírita, sem custo.",
    ],
    fontes: [
      {
        obra: "O Livro dos Espíritos",
        referencia: "questão 944",
        citacao:
          "O homem tem o direito de dispor da sua própria vida? “Não; somente Deus tem esse direito. O suicídio voluntário é uma transgressão da Lei divina.”",
      },
      {
        obra: "O Livro dos Espíritos",
        referencia: "questão 944-a",
        citacao: "Nem sempre o suicídio é voluntário? “O louco que se mata não sabe o que faz.”",
      },
      {
        obra: "O Livro dos Espíritos",
        referencia: "questão 943",
        citacao:
          "De onde vem o desgosto pela vida que se apodera de certos indivíduos sem motivos que o justifiquem? “Efeito da ociosidade, da falta de fé e, muitas vezes, da saciedade.”",
      },
    ],
    termos: ["suicidio", "tirar a vida", "desgosto pela vida", "quero morrer", "cvv"],
  },
  {
    slug: "o-que-e-mediunidade",
    pergunta: "O que é mediunidade? Todo mundo é médium?",
    resumo:
      "Para Kardec, a faculdade é comum a todos em algum grau — o que varia é o quanto ela se manifesta.",
    resposta: [
      "Médium, na definição de Kardec, é quem sente em algum grau a influência dos Espíritos. Ele afirma que essa faculdade é inerente ao ser humano e não constitui privilégio de ninguém: raras são as pessoas que não tenham dela alguns rudimentos.",
      "Por isso ele escreve, com todas as letras, que “todos são, mais ou menos, médiuns”. O que separa uma pessoa da outra não é ter ou não ter a faculdade, e sim o quanto ela se mostra — habitualmente só se chamam médiuns aqueles em quem ela aparece de forma bem caracterizada.",
      "Uma consequência prática: sentir algo não faz de ninguém alguém especial, nem obriga a nada. Nas casas espíritas, o caminho usual para quem percebe essas impressões é o estudo, em grupo, antes de qualquer exercício — e nunca em troca de dinheiro.",
    ],
    fontes: [
      {
        obra: "O Livro dos Médiuns",
        referencia: "item 159",
        citacao:
          "Todo aquele que sente, num grau qualquer, a influência dos Espíritos é, por esse fato, médium. Essa faculdade é inerente ao homem; não constitui, portanto, um privilégio exclusivo. [...] Pode, pois, dizer-se que todos são, mais ou menos, médiuns.",
      },
    ],
    termos: ["mediunidade", "medium", "sou medium", "ver espiritos", "sentir espiritos"],
  },
  {
    slug: "o-que-e-obsessao-espiritual",
    pergunta: "O que é obsessão espiritual?",
    resumo:
      "Kardec define obsessão pela persistência de um Espírito de quem a pessoa não consegue se livrar — e a saída que ele indica exige ação de quem sofre.",
    resposta: [
      "Kardec é preciso ao definir: a obsessão consiste na tenacidade de um Espírito do qual a pessoa sobre quem ele atua não consegue se desembaraçar. E é cuidadoso ao delimitar: ninguém está obsidiado pelo simples fato de ter sido enganado uma vez — “pode-se, pois, ser enganado, sem estar obsidiado”.",
      "Ele descreve três graus, do mais leve ao mais grave: a obsessão simples, a fascinação e a subjugação. Nem tudo o que angustia é obsessão, e a doutrina não autoriza ninguém a atribuir a Espíritos aquilo que é doença — procurar médico continua sendo parte do cuidado.",
      "Sobre a saída, a resposta registrada em O Livro dos Espíritos é incômoda para quem espera solução mágica: a prece é um poderoso socorro, mas “não basta murmurar algumas palavras para obter o que se deseja. Deus assiste os que agem, e não os que se limitam a pedir”. Cabe à própria pessoa destruir em si a causa que atrai os Espíritos maus. Não há, na codificação, ritual pago, objeto ou pessoa que faça isso por ela.",
    ],
    fontes: [
      {
        obra: "O Livro dos Médiuns",
        referencia: "itens 237 e 238",
        citacao:
          "A palavra obsessão é, de certo modo, um termo genérico [...] cujas principais variedades são: a obsessão simples, a fascinação e a subjugação. [...] A obsessão consiste na tenacidade de um Espírito, do qual não consegue desembaraçar-se a pessoa sobre quem ele atua.",
      },
      {
        obra: "O Livro dos Espíritos",
        referencia: "questão 479",
        citacao:
          "A prece é um meio eficiente para curar a obsessão? “A prece é um poderoso socorro em tudo, mas crede que não basta murmurar algumas palavras para obter o que se deseja. Deus assiste os que agem, e não os que se limitam a pedir.”",
      },
    ],
    termos: ["obsessao", "espirito obsessor", "encosto", "perseguicao espiritual", "subjugacao"],
  },
  {
    slug: "cobra-se-por-atendimento-em-centro-espirita",
    pergunta: "Cobra-se alguma coisa numa casa espírita?",
    resumo:
      "Não se cobra por passe, atendimento, palestra ou trabalho mediúnico — e isso é norma da doutrina, não costume local.",
    resposta: [
      "Nas casas espíritas não se cobra por passe, atendimento fraterno, palestra, estudo ou qualquer trabalho mediúnico. Se alguém lhe cobrar por isso, ou condicionar ajuda espiritual a pagamento, está contrariando frontalmente a doutrina que diz representar.",
      "Isso está no capítulo de O Evangelho segundo o Espiritismo cujo próprio título é a orientação: “Dai gratuitamente o que gratuitamente recebestes”. O capítulo trata, um a um, do dom de curar, das preces pagas, dos mercadores expulsos do templo e da mediunidade gratuita.",
      "Casas espíritas se mantêm de doações voluntárias, de contribuição de associados e do trabalho de voluntários. Contribuir é livre, e não contribuir não tira o direito de ninguém a ser atendido.",
    ],
    fontes: [
      {
        obra: "O Evangelho segundo o Espiritismo",
        referencia: "capítulo XXVI",
        citacao:
          "Dai gratuitamente o que gratuitamente recebestes. — Dom de curar. Preces pagas. Mercadores expulsos do templo. Mediunidade gratuita.",
      },
    ],
    termos: ["cobra", "preco", "pagar", "gratuito", "quanto custa", "passe pago"],
  },
  {
    slug: "a-prece-adianta-alguma-coisa",
    pergunta: "Orar adianta alguma coisa?",
    resumo:
      "A doutrina responde que sim, mas com uma condição que ela repete em mais de um lugar: a prece acompanha a ação, não a substitui.",
    resposta: [
      "O Evangelho segundo o Espiritismo dedica um capítulo inteiro ao assunto — “Pedi e obtereis” —, tratando das qualidades da prece, da sua eficácia, da ação dela sobre o pensamento e da prece pelos que já partiram.",
      "A doutrina, porém, recusa a ideia de oração como fórmula. Em O Livro dos Espíritos, a resposta é clara ao dizer que não basta murmurar algumas palavras para obter o que se deseja, porque “Deus assiste os que agem, e não os que se limitam a pedir”.",
      "Na prática, é o que se ouve numa casa espírita: ore, e faça a sua parte. A prece é apresentada como amparo real — inclusive para quem já morreu —, nunca como troca com Deus.",
    ],
    fontes: [
      {
        obra: "O Evangelho segundo o Espiritismo",
        referencia: "capítulo XXVII",
        citacao:
          "Pedi e obtereis. — Qualidades da prece. Eficácia da prece. Ação da prece. Transmissão do pensamento. Da prece pelos mortos e pelos Espíritos sofredores.",
      },
      {
        obra: "O Livro dos Espíritos",
        referencia: "questão 479",
        citacao:
          "Não basta murmurar algumas palavras para obter o que se deseja. Deus assiste os que agem, e não os que se limitam a pedir.",
      },
    ],
    termos: ["prece", "oracao", "orar", "rezar", "vibracao"],
  },
];

export function perguntaPorSlug(slug: string): PerguntaDaDoutrina | undefined {
  return PERGUNTAS_DA_DOUTRINA.find((p) => p.slug === slug);
}
