/**
 * O manual do usuário — fonte única do passo a passo de cada recurso.
 *
 * Por que ele existe separado das perguntas frequentes: as duas coisas
 * respondem a necessidades diferentes. Quem tem uma DÚVIDA ("o site é
 * gratuito?", "meu nome aparece no Google?") quer uma frase. Quem tem uma
 * TAREFA ("preciso anunciar um item no bazar") quer passos numerados, na
 * ordem, com o nome exato do botão.
 *
 * Antes disto o passo a passo morava dentro das respostas do FAQ, em
 * parágrafo corrido: a explicação do bazar tinha dois procedimentos completos
 * enfiados num único bloco de dois mil caracteres. Ninguém lê isso no celular,
 * de pé, no meio de uma reunião.
 *
 * Regra que este arquivo sustenta: o passo a passo mora AQUI e em nenhum outro
 * lugar. Se a resposta de uma pergunta frequente voltar a explicar um
 * procedimento, passam a existir duas versões da mesma instrução — e um dia
 * uma delas fica velha sem que ninguém perceba. `manual.test.ts` verifica que
 * toda tela anunciada no site tem entrada aqui.
 */

import { semAcento } from "@/lib/busca";

export interface Tarefa {
  /** O que a pessoa quer fazer, escrito como ela pensaria. */
  titulo: string;
  /** Quem consegue executar, quando não é qualquer membro. */
  quem?: string;
  passos: string[];
}

export interface ModuloDoManual {
  id: string;
  titulo: string;
  grupo: string;
  /** O caminho no menu, em palavras. */
  ondeFica: string;
  href?: string;
  /** Outros endereços que este módulo explica. */
  tambemCobre?: string[];
  resumo: string;
  tarefas: Tarefa[];
  /** Limites e regras que evitam surpresa. */
  observacoes?: string[];
}

export const GRUPOS_DO_MANUAL = [
  "Primeiros passos",
  "Apresentações",
  "A sua casa espírita",
  "Comunidade",
  "Estudo e conteúdo",
  "Encontrar uma casa espírita",
  "Avisos, ajuda e suporte",
] as const;

export const MANUAL: ModuloDoManual[] = [
  /* ══ PRIMEIROS PASSOS ══════════════════════════════════════════════════ */
  {
    id: "conta-e-perfil",
    titulo: "Conta e perfil",
    grupo: "Primeiros passos",
    ondeFica: "Menu superior › Perfil",
    href: "/perfil",
    resumo:
      "A conta é gratuita. O perfil guarda o seu nome de exibição, a casa espírita a que você pertence, a cidade e o cargo — é ele que libera o acesso ao que é da sua casa.",
    tarefas: [
      {
        titulo: "Completar ou alterar o meu perfil",
        passos: [
          "No menu superior, clique em 'Perfil'.",
          "Atualize o nome de exibição, a sigla da casa espírita, o estado, a cidade e o bairro.",
          "Escolha o seu cargo principal na lista.",
          "Marque as áreas em que você trabalha na casa.",
          "Clique em 'Confirmar e entrar'.",
        ],
      },
      {
        titulo: "Trocar a minha senha",
        passos: [
          "Saia da sua conta.",
          "Na tela de entrada, clique em 'Esqueci minha senha'.",
          "Informe o seu e-mail e envie.",
          "Abra a mensagem que chegou e clique no link para definir a nova senha.",
        ],
      },
      {
        titulo: "Encerrar a minha conta definitivamente",
        passos: [
          "No menu superior, clique em 'Perfil'.",
          "Desça até o rodapé da tela e clique em 'Encerrar a minha conta'.",
          "Leia o aviso do que será apagado.",
          "Digite a palavra ENCERRAR no campo de confirmação.",
          "Clique em 'Encerrar para sempre'.",
        ],
      },
    ],
    observacoes: [
      "Se o Presidente da sua casa já fixou o seu cargo, a troca de cargo passa a ser pedida a ele.",
      "Encerrar a conta apaga o perfil e os eventos que você criou na agenda. O que você escreveu em espaços coletivos — fórum, grupos, bazar — permanece no site, sem o seu nome. Não há como desfazer.",
    ],
  },
  {
    id: "instalar-no-celular",
    titulo: "Instalar o site no celular",
    grupo: "Primeiros passos",
    ondeFica: "Menu superior › Ajuda › Instalar aplicativo",
    resumo:
      "O site se instala como aplicativo direto do navegador, sem passar por loja nenhuma. Depois de instalado, ganha ícone na tela do celular e abre em tela cheia, sem a barra de endereço.",
    tarefas: [
      {
        titulo: "Instalar no Android",
        passos: [
          "Abra o site no Chrome e faça login.",
          "No menu superior, clique em 'Ajuda'.",
          "Clique em 'Instalar aplicativo'.",
          "Confirme na janela do navegador.",
        ],
      },
      {
        titulo: "Instalar no iPhone ou iPad",
        passos: [
          "Abra o site no Safari.",
          "Toque no botão Compartilhar — o quadrado com a seta para cima, na barra de baixo.",
          "Role a lista e toque em 'Adicionar à Tela de Início'.",
          "Confirme em 'Adicionar'.",
        ],
      },
    ],
    observacoes: [
      "A opção 'Instalar aplicativo' só aparece quando o navegador permite a instalação, e some depois que o site já está instalado.",
      "No iPhone a Apple não permite que o site se instale sozinho — por isso o caminho é manual.",
      "As telas precisam de conexão para carregar, porque o conteúdo é sempre buscado atualizado. O que fica guardado no aparelho são os arquivos de funcionamento, e por isso o site abre mais rápido a partir da segunda visita.",
    ],
  },
  {
    id: "busca",
    titulo: "Busca do site",
    grupo: "Primeiros passos",
    ondeFica: "Lupa no menu superior",
    resumo:
      "Encontra quatro coisas de uma vez: as telas da plataforma, artigos publicados, casas espíritas e membros da sua casa.",
    tarefas: [
      {
        titulo: "Procurar qualquer coisa no site",
        passos: [
          "Clique na lupa, no canto direito do menu superior — no celular ela fica ao lado do botão de menu.",
          "Escreva pelo menos duas letras do que procura.",
          "Os resultados aparecem enquanto você digita, separados em 'No site', 'Artigos', 'Casas espíritas' e 'Membros da sua casa'.",
          "Clique no resultado para abrir.",
        ],
      },
    ],
    observacoes: [
      "A busca não diferencia acento nem maiúscula: 'espirita', 'Espírita' e 'ESPÍRITA' encontram o mesmo.",
      "Casas que ainda não publicaram página aparecem marcadas como 'sem página no site' e não abrem.",
      "A busca de membros mostra apenas quem pertence à sua própria casa.",
    ],
  },

  /* ══ APRESENTAÇÕES ═════════════════════════════════════════════════════ */
  {
    id: "apresentacoes",
    titulo: "Apresentações ao vivo",
    grupo: "Apresentações",
    ondeFica: "Menu superior › Recursos › Apresentações",
    href: "/apresentacoes",
    resumo:
      "A casa projeta a apresentação de qualquer aparelho — inclusive de um celular ligado ao projetor por cabo, sem computador — e a plateia acompanha pelo próprio celular, sem precisar de conta.",
    tarefas: [
      {
        titulo: "Preparar o arquivo antes de enviar",
        passos: [
          "No PowerPoint, abra a apresentação e use Arquivo › Exportar › Criar PDF/XPS.",
          "No Google Apresentações, use Arquivo › Fazer download › Documento PDF.",
          "Guarde o PDF gerado — é ele que você vai enviar.",
        ],
      },
      {
        titulo: "Enviar uma apresentação",
        passos: [
          "No menu superior, abra 'Recursos' e clique em 'Apresentações'.",
          "Clique em 'Enviar uma apresentação'.",
          "Escreva o título e, se quiser, uma descrição.",
          "Marque 'Deixar a plateia baixar o arquivo inteiro' apenas se quiser que as pessoas levem o documento.",
          "Clique em 'Escolher o arquivo PDF' e selecione o arquivo.",
          "Aguarde a barra de preparação terminar — o site desenha cada slide uma vez só, para a plateia não precisar baixar o documento todo depois.",
        ],
      },
      {
        titulo: "Abrir a sessão e chamar a plateia",
        passos: [
          "Abra a apresentação na lista.",
          "Clique em 'Abrir a sessão ao vivo'.",
          "O site mostra um código de seis letras e um QR Code.",
          "Deixe o código visível no telão, ou peça que as pessoas apontem a câmera para o QR.",
        ],
      },
      {
        titulo: "Projetar usando só o celular, sem computador",
        quem: "Quem está apresentando",
        passos: [
          "Ligue o celular ao projetor pelo cabo (USB-C ou HDMI) ou por transmissão sem fio.",
          "Com a sessão aberta, clique em 'Abrir a tela de projeção'.",
          "Toque no botão de tela cheia — o slide passa a ocupar a tela inteira, com fundo preto.",
          "Para avançar, toque no lado direito da tela; para voltar, no lado esquerdo.",
          "Toque no meio da tela para os controles aparecerem; eles somem sozinhos em três segundos.",
        ],
      },
      {
        titulo: "Usar um segundo aparelho como controle remoto",
        quem: "Quem está apresentando",
        passos: [
          "Deixe o aparelho ligado ao projetor na tela de projeção.",
          "Em outro aparelho, entre na sua conta e abra a mesma apresentação.",
          "Use os botões 'Anterior' e 'Próximo' — o que estiver projetado acompanha na hora.",
        ],
      },
      {
        titulo: "Acompanhar pelo celular, na plateia",
        quem: "Qualquer pessoa, sem conta",
        passos: [
          "Aponte a câmera do celular para o QR Code na tela, ou acesse apoioespirita.com.br/ao-vivo.",
          "Digite o código de seis letras e toque em 'Entrar'.",
          "O slide do palestrante aparece e muda sozinho conforme ele avança.",
          "Toque no slide para ampliar, e toque de novo para reduzir.",
        ],
      },
      {
        titulo: "Ver um slide anterior sem atrapalhar ninguém",
        quem: "Quem está assistindo",
        passos: [
          "Toque em 'Anterior' quantas vezes precisar — o palestrante não é afetado.",
          "Aparece uma faixa avisando que você está vendo sozinho.",
          "Quando quiser voltar a acompanhar, toque em 'Voltar ao slide do palestrante'.",
        ],
      },
      {
        titulo: "Enviar uma pergunta ao palestrante",
        quem: "Quem está assistindo",
        passos: [
          "Na tela da apresentação, toque em 'Enviar uma pergunta ao palestrante'.",
          "Escreva a pergunta.",
          "Informe o seu nome, ou deixe em branco para perguntar sem se identificar.",
          "Toque em 'Enviar'.",
        ],
      },
      {
        titulo: "Encerrar a sessão",
        quem: "Quem está apresentando",
        passos: ["Volte à tela da apresentação.", "Clique em 'Encerrar a sessão'."],
      },
    ],
    observacoes: [
      "O envio aceita PDF. Animações e transições se perdem na exportação — isso vale para qualquer forma de conversão, não é limitação do site.",
      "Vídeo embutido no slide não toca.",
      "Limites: até 40 MB por arquivo e até 150 slides.",
      "Na tela de projeção, o site impede o aparelho de apagar a tela durante a palestra.",
      "Só quem apresenta muda o slide. Ninguém da plateia consegue avançar a apresentação dos outros.",
      "As perguntas da plateia só aparecem para quem está apresentando.",
      "Encerrada a sessão, o código deixa de funcionar na mesma hora e a apresentação volta a ser visível apenas para a sua casa.",
      "No computador, as setas do teclado e a barra de espaço avançam os slides.",
    ],
  },

  /* ══ A SUA CASA ESPÍRITA ═══════════════════════════════════════════════ */
  {
    id: "pagina-da-casa",
    titulo: "Página da casa espírita",
    grupo: "A sua casa espírita",
    ondeFica: "apoioespirita.com.br/casa/SIGLA",
    resumo:
      "Cada casa tem uma página própria. Ela nasce privada: só quem tem conta e pertence à casa a vê. A direção pode publicá-la, e aí qualquer pessoa a encontra, inclusive pelos buscadores.",
    tarefas: [
      {
        titulo: "Publicar ou despublicar a página",
        quem: "Presidente, Vice-presidente ou administrador nomeado",
        passos: [
          "Abra a página da casa.",
          "Clique em 'Administrar', no alto da página.",
          "Abra a aba 'Configurações'.",
          "Desça até o bloco 'Visibilidade da página'.",
          "Confira a lista 'O que o visitante vai encontrar': item com sinal verde já aparece; item com ponto laranja diz o que falta e onde preencher.",
          "Clique em 'Publicar página' e confirme no aviso.",
        ],
      },
    ],
    observacoes: [
      "Publicada, a página mostra apenas: nome, descrição, missão, ano de fundação, endereço, telefone, e-mail, site e a grade de horários.",
      "Continuam invisíveis mesmo com a página publicada: o mural, a lista de tarefeiros e cargos, a agenda interna, o Kanban, a tesouraria e qualquer informação sobre membros.",
      "A chave PIX e o QR Code só aparecem para quem está logado. Chave exposta publicamente é alvo comum de golpe.",
      "Publicar e despublicar são reversíveis a qualquer momento.",
    ],
  },
  {
    id: "mural",
    titulo: "Mural de avisos",
    grupo: "A sua casa espírita",
    ondeFica: "Página da casa › aba Mural",
    resumo: "O quadro de recados da casa. Todos os membros leem; quem chega de fora não vê.",
    tarefas: [
      {
        titulo: "Publicar um aviso no mural",
        quem: "Presidente, Vice-presidente ou administrador nomeado",
        passos: [
          "Abra a página da casa.",
          "Clique em 'Administrar'.",
          "Vá à aba 'Mural'.",
          "Clique em 'Nova publicação no mural'.",
          "Escreva o comunicado e, se quiser, informe o endereço de uma imagem ou de um vídeo.",
          "Clique em 'Publicar'.",
        ],
      },
    ],
    observacoes: [
      "Depois de publicado, o aviso pode ser fixado no topo, editado ou apagado pelos botões do próprio cartão.",
      "O aviso não tem data de validade: fica no mural até alguém apagá-lo.",
    ],
  },
  {
    id: "agenda",
    titulo: "Agenda e caderno de presença",
    grupo: "A sua casa espírita",
    ondeFica: "Menu superior › Recursos › Agenda",
    href: "/agenda",
    resumo:
      "Calendário das reuniões e atividades da casa, com confirmação de presença pelo celular e relatório de frequência.",
    tarefas: [
      {
        titulo: "Criar um evento",
        quem: "Coordenação da casa",
        passos: [
          "No menu superior, abra 'Recursos' e clique em 'Agenda'.",
          "Crie o evento informando título, data, horário e descrição.",
          "Convide os participantes.",
          "Salve.",
        ],
      },
      {
        titulo: "Registrar a minha presença",
        passos: [
          "Abra a Agenda pelo celular.",
          "Localize a reunião do dia.",
          "Registre a sua frequência com um clique.",
        ],
      },
    ],
    observacoes: [
      "A coordenação vê o percentual de frequência consolidado por reunião e por membro.",
    ],
  },
  {
    id: "escala",
    titulo: "Escala de trabalho e palestras",
    grupo: "A sua casa espírita",
    ondeFica: "Página da casa › Administrar › aba Painel",
    resumo: "A escala de quem trabalha em cada reunião pública da casa.",
    tarefas: [
      {
        titulo: "Montar uma escala",
        quem: "Presidente, Vice-presidente ou administrador nomeado",
        passos: [
          "Abra a página da sua casa.",
          "Clique em 'Administrar', no alto da página.",
          "Na aba 'Painel', desça até 'Palestras Públicas e Escalas de Trabalho'.",
          "Clique em 'Nova escala'.",
          "Preencha o dia, o mês, o tema e quem fica responsável por cada função — facilitador, coordenador, passe e recepção.",
          "Salve.",
        ],
      },
    ],
    observacoes: [
      "A escala fica visível a todos os membros da casa e se arquiva sozinha quando a data passa.",
      "O site ainda não avisa cada tarefeiro da própria escala, e não há tela pessoal do tipo 'o que eu faço nesta semana'. O pedido aceita voto em Ajuda › Status do Projeto.",
    ],
  },
  {
    id: "tesouraria",
    titulo: "Tesouraria",
    grupo: "A sua casa espírita",
    ondeFica: "Menu superior › Tesouraria",
    href: "/tesouraria",
    resumo:
      "Registro de receitas e despesas da casa, saldo do mês, gráficos e relatórios prontos para impressão ou planilha.",
    tarefas: [
      {
        titulo: "Lançar uma receita ou despesa",
        quem: "Presidente e Tesoureiro",
        passos: [
          "No menu superior, clique em 'Tesouraria'.",
          "Escolha se é receita ou despesa.",
          "Informe o valor, a data e a descrição do lançamento.",
          "Salve.",
        ],
      },
      {
        titulo: "Exportar o relatório do mês",
        quem: "Presidente e Tesoureiro",
        passos: [
          "Abra a Tesouraria.",
          "Escolha o mês desejado.",
          "Use a exportação em planilha (.xlsx) ou a versão formatada para impressão.",
        ],
      },
    ],
    observacoes: [
      "O acesso é exclusivo do Presidente e de quem tem o cargo de Tesoureiro.",
      "O site não processa nem retém dinheiro nenhum.",
    ],
  },
  {
    id: "kanban",
    titulo: "Projetos (Kanban)",
    grupo: "A sua casa espírita",
    ondeFica: "Menu superior › Recursos › Projetos",
    href: "/kanban",
    resumo:
      "Quadro de projetos da casa, em colunas, com cartões que se arrastam de uma etapa para a outra e grupos de tarefas dentro de cada cartão.",
    tarefas: [
      {
        titulo: "Criar um cartão de projeto",
        passos: [
          "No menu superior, abra 'Recursos' e clique em 'Projetos'.",
          "Crie o cartão na coluna correspondente à etapa atual.",
          "Descreva o projeto e, se quiser, abra grupos de tarefas dentro dele.",
          "Arraste o cartão para outra coluna conforme o projeto avança.",
        ],
      },
    ],
  },
  {
    id: "permissoes",
    titulo: "Permissões e cargos",
    grupo: "A sua casa espírita",
    ondeFica: "Menu superior › Permissões",
    resumo:
      "Quem enxerga e faz o quê dentro da casa depende do cargo. A direção pode fixar o cargo de um membro e nomear administradores da página.",
    tarefas: [
      {
        titulo: "Nomear alguém para administrar a página da casa",
        quem: "Presidente ou Vice-presidente",
        passos: [
          "Abra a página da casa.",
          "Clique em 'Administrar'.",
          "Localize a área de administradores da página.",
          "Adicione o membro pelo nome.",
        ],
      },
    ],
  },

  /* ══ COMUNIDADE ════════════════════════════════════════════════════════ */
  {
    id: "atendimento-fraterno",
    titulo: "Atendimento fraterno",
    grupo: "Comunidade",
    ondeFica: "Menu superior › Comunidade › Atendimento Fraterno",
    href: "/atendimento-fraterno",
    resumo:
      "A área mais fechada do site. Registro confidencial dos atendimentos, lido apenas por quem a casa autorizou.",
    tarefas: [
      {
        titulo: "Registrar um atendimento",
        quem: "Atendente fraterno, Coordenador ou quem a direção autorizar",
        passos: [
          "No menu superior, abra 'Comunidade' e clique em 'Atendimento Fraterno'.",
          "Clique em 'Nova ficha'.",
          "Informe o nome de quem foi atendido, a data e, se houver, um contato.",
          "Escolha se é a primeira vez ou um retorno.",
          "Escreva o relato — o necessário para o acompanhamento, e nada além.",
          "Em 'Encaminhamento', anote a orientação dada ou a providência combinada.",
          "Em 'Retornar em', marque a data do próximo encontro, se houver.",
          "Clique em 'Salvar ficha'.",
        ],
      },
      {
        titulo: "Consultar uma ficha antiga",
        quem: "Quem tem acesso à área",
        passos: [
          "Abra 'Atendimento Fraterno'.",
          "Use o campo de busca pelo nome.",
          "Clique em 'Abrir' na ficha desejada.",
          "Ao concluir o acompanhamento, use 'Marcar concluído'.",
        ],
      },
      {
        titulo: "Autorizar mais alguém a ler as fichas",
        quem: "Quem administra a página da casa",
        passos: [
          "Abra 'Atendimento Fraterno'.",
          "Vá à aba 'Quem tem acesso'.",
          "Clique no nome da pessoa que deve ser autorizada.",
        ],
      },
    ],
    observacoes: [
      "A presidência não entra pelo cargo, e o desenvolvedor da plataforma foi excluído de propósito: suporte técnico não é motivo para ler o relato de ninguém.",
      "Cada abertura de ficha fica registrada com o nome de quem abriu e a data, e esse registro não pode ser apagado por ninguém.",
    ],
  },
  {
    id: "forum",
    titulo: "Fórum de apoio",
    grupo: "Comunidade",
    ondeFica: "Menu superior › Comunidade › Fórum de Apoio",
    href: "/forum",
    resumo: "Espaço de conversa entre membros: dúvidas, acolhimento, estudo e testemunhos.",
    tarefas: [
      {
        titulo: "Abrir um tópico",
        passos: [
          "No menu superior, abra 'Comunidade' e clique em 'Fórum de Apoio'.",
          "Clique em 'Novo tópico'.",
          "Escreva um título curto que diga o assunto e, abaixo, a mensagem com calma.",
          "Escolha o assunto: Dúvida, Acolhimento, Estudo ou Testemunho.",
          "Em 'Quem enxerga', escolha entre somente a sua casa ou todas as casas.",
          "Clique em 'Publicar tópico'.",
        ],
      },
      {
        titulo: "Responder a um tópico",
        passos: [
          "Clique no tópico na lista.",
          "Desça até o campo 'Responder'.",
          "Escreva e clique em 'Enviar resposta'.",
        ],
      },
    ],
    observacoes: [
      "Quem abriu o tópico pode marcá-lo como resolvido.",
      "Quem administra a página da casa pode fixar um tópico no topo e remover mensagem imprópria.",
    ],
  },
  {
    id: "grupos",
    titulo: "Grupos de comunicação",
    grupo: "Comunidade",
    ondeFica: "Menu superior › Comunidade › Grupos",
    href: "/grupos",
    resumo:
      "Conversa por frente de trabalho dentro da plataforma — ninguém precisa dar o telefone para participar.",
    tarefas: [
      {
        titulo: "Criar um grupo",
        passos: [
          "No menu superior, abra 'Comunidade' e clique em 'Grupos'.",
          "Clique em 'Criar grupo'.",
          "Dê um nome ao grupo e explique em uma linha para que ele serve.",
          "Escolha a frente de trabalho (evangelização, mediunidade, tesouraria e assim por diante).",
          "Marque 'Grupo fechado' se quiser que só entre quem for adicionado.",
          "Clique em 'Criar grupo' — quem cria já entra como moderador.",
        ],
      },
      {
        titulo: "Participar e conversar",
        passos: [
          "Clique no grupo na lista.",
          "Clique em 'Entrar no grupo'.",
          "Escreva no campo de baixo e tecle Enter. Shift+Enter quebra a linha.",
        ],
      },
    ],
    observacoes: [
      "Grupo fechado nem aparece na lista para quem não é membro.",
      "As mensagens chegam na hora, sem recarregar a página.",
      "Quem modera pode adicionar alguém da casa e apagar mensagem imprópria. Qualquer membro pode sair pelo botão 'Sair do grupo'.",
    ],
  },
  {
    id: "bazar",
    titulo: "Bazar on-line",
    grupo: "Comunidade",
    ondeFica: "Menu superior › Comunidade › Bazar On-line",
    href: "/bazar",
    resumo:
      "Vitrine de itens da casa com pagamento por PIX. O dinheiro nunca passa pela plataforma: vai direto para a chave de quem anuncia.",
    tarefas: [
      {
        titulo: "Anunciar um item",
        passos: [
          "No menu superior, abra 'Comunidade' e clique em 'Bazar On-line'.",
          "Clique em 'Anunciar item'.",
          "Escreva o nome do item e a descrição, escolha a categoria e diga se é novo ou usado.",
          "Informe o valor, ou marque 'Contribuição livre' quando não houver preço fixo.",
          "Se quiser, envie uma foto (até 5 MB).",
          "Preencha a chave PIX, o nome de quem recebe e a cidade — com esses três dados o site monta o código copia e cola na hora.",
          "Informe o seu contato, que só aparece para quem você aceitar.",
          "Escolha quem enxerga — somente a sua casa ou todas as casas — e clique em 'Publicar item'.",
        ],
      },
      {
        titulo: "Reservar um item de outra pessoa",
        passos: [
          "Encontre o item na vitrine.",
          "Clique em 'Tenho interesse'.",
          "Informe o seu contato e envie.",
          "Aguarde: quem anunciou aceita ou recusa, e o aceite libera o contato dos dois lados.",
        ],
      },
    ],
    observacoes: [
      "O nome de quem recebe aceita 25 caracteres e a cidade 15 — é exigência do padrão do Banco Central, e passar disso geraria um código que o banco recusa.",
      "O alcance pode ser trocado depois pelo botão 'Mostrar a todas as casas' (ou 'Mostrar só na minha casa'), sem apagar e anunciar de novo.",
      "O site não recebe, não retém e não cobra nada.",
    ],
  },
  {
    id: "entregas",
    titulo: "Entrega solidária",
    grupo: "Comunidade",
    ondeFica: "Menu superior › Comunidade › Entrega Solidária",
    href: "/entregas",
    resumo: "Voluntários levam até a casa de quem não pode buscar.",
    tarefas: [
      {
        titulo: "Pedir uma entrega",
        passos: [
          "No menu 'Comunidade', clique em 'Entrega Solidária'.",
          "Clique em 'Pedir uma entrega'.",
          "Se for de um item que você reservou no bazar, escolha-o na lista; senão, deixe em 'Não é do bazar'.",
          "Descreva o que precisa ser levado, informe o bairro, um ponto de referência e o seu contato.",
          "Publique.",
        ],
      },
      {
        titulo: "Assumir uma entrega como voluntário",
        passos: [
          "Abra 'Entrega Solidária'.",
          "Clique em 'Assumir a entrega' no pedido escolhido.",
          "Informe o seu contato.",
          "Combine o dia pelo campo de agendamento.",
          "Ao terminar, clique em 'Confirmar entrega'.",
        ],
      },
    ],
    observacoes: [
      "O endereço completo é combinado entre as duas pessoas pelo contato liberado — ele nunca fica publicado na lista.",
    ],
  },
  {
    id: "caronas",
    titulo: "Carona solidária",
    grupo: "Comunidade",
    ondeFica: "Menu superior › Comunidade › Carona Solidária",
    href: "/caronas",
    resumo: "Ajuda para chegar à casa espírita e voltar.",
    tarefas: [
      {
        titulo: "Oferecer carona",
        passos: [
          "No menu superior, abra 'Comunidade' e clique em 'Carona Solidária'.",
          "Clique em 'Oferecer carona'.",
          "Informe de onde você sai, para onde vai, o dia, a hora e quantas vagas tem no carro.",
          "Marque 'Também trago de volta' se puder trazer as pessoas depois da reunião.",
          "Informe o seu contato — ele fica guardado e só aparece para quem você aceitar.",
          "Escolha quem enxerga e clique em 'Oferecer carona'.",
        ],
      },
      {
        titulo: "Pedir uma vaga",
        passos: [
          "Encontre a carona na lista e clique em 'Pedir vaga'.",
          "Informe o seu contato e, se quiser, onde pode esperar e uma mensagem.",
          "Clique em 'Enviar pedido'.",
        ],
      },
    ],
    observacoes: [
      "O motorista responde com o sinal de confirmar ou recusar; quando aceita, os dois passam a ver o contato um do outro.",
      "Quando a última vaga é ocupada, a carona deixa de aceitar novos aceites.",
      "Caronas de dias passados continuam consultáveis pelo botão 'Ver caronas passadas'.",
    ],
  },
  {
    id: "voluntariado",
    titulo: "Voluntariado",
    grupo: "Comunidade",
    ondeFica: "Menu superior › Comunidade › Voluntariado",
    href: "/voluntariado",
    resumo: "Cruza o que a casa precisa com o que cada membro sabe fazer.",
    tarefas: [
      {
        titulo: "Cadastrar as minhas habilidades",
        passos: [
          "No menu superior, abra 'Comunidade' e clique em 'Voluntariado'.",
          "Vá à aba 'Posso ajudar'.",
          "Marque as habilidades na lista.",
          "Diga a sua disponibilidade (por exemplo, 'fins de semana e à noite').",
          "Escolha quem enxerga e clique em 'Publicar minhas habilidades'.",
        ],
      },
      {
        titulo: "Pedir ajuda em nome da casa",
        passos: [
          "Na aba 'Precisa-se', clique em 'Pedir ajuda'.",
          "Escreva do que a casa precisa: o que fazer, onde e em que horários.",
          "Escolha a urgência e, se houver, o prazo.",
          "Marque as habilidades necessárias.",
          "Publique.",
        ],
      },
    ],
    observacoes: [
      "A lista de habilidades é fechada de propósito: se cada um escrevesse com as próprias palavras, 'pedreiro' e 'alvenaria' nunca se encontrariam e o cruzamento não acharia ninguém.",
      "Cada pedido mostra quantos voluntários têm afinidade e quais habilidades combinaram.",
    ],
  },
  {
    id: "oracoes",
    titulo: "Plantão de orações",
    grupo: "Comunidade",
    ondeFica: "Menu superior › Comunidade › Plantão de Orações",
    href: "/oracoes",
    resumo: "Grade semanal fixa: o horário se repete toda semana e cada pessoa se inscreve.",
    tarefas: [
      {
        titulo: "Abrir um horário",
        passos: [
          "No menu superior, abra 'Comunidade' e clique em 'Plantão de Orações'.",
          "Clique em 'Abrir um horário'.",
          "Escolha o dia da semana, a hora e se é em ponto ou e meia.",
          "Se quiser, escreva a intenção que reúne as pessoas naquele horário.",
          "Em 'Vagas', deixe zero para não limitar, ou informe quantas pessoas cabem.",
          "Escolha quem enxerga e clique em 'Abrir horário'.",
        ],
      },
      {
        titulo: "Participar de um horário",
        passos: [
          "Encontre o horário na grade.",
          "Clique em 'Vou orar'.",
          "Se precisar desistir, clique em 'Sair'.",
        ],
      },
    ],
    observacoes: [
      "Quando um horário com limite de vagas se esgota, o botão passa a mostrar 'Sem vagas'.",
      "Quem abriu o horário e quem administra a página da casa podem apagá-lo.",
    ],
  },
  {
    id: "aniversariantes",
    titulo: "Aniversariantes do mês",
    grupo: "Comunidade",
    ondeFica: "Menu superior › Comunidade › Aniversariantes",
    href: "/aniversariantes",
    resumo: "Calendário de aniversários da casa. Guardamos apenas o dia e o mês, nunca o ano.",
    tarefas: [
      {
        titulo: "Entrar no calendário",
        passos: [
          "No menu superior, abra 'Comunidade' e clique em 'Aniversariantes'.",
          "No cartão 'O meu aniversário', clique em 'Informar'.",
          "Escolha o dia e o mês.",
          "Clique em 'Salvar'.",
        ],
      },
    ],
    observacoes: [
      "Preencher é o próprio consentimento de aparecer. Quem não quiser constar deixa em branco, e quem mudar de ideia retira a data pelo botão da lixeira.",
      "A idade de ninguém é necessária para uma lembrança, e o que não é guardado não vaza.",
    ],
  },
  {
    id: "jovens",
    titulo: "Área de jovens",
    grupo: "Comunidade",
    ondeFica: "Menu superior › Comunidade › Área de Jovens",
    href: "/jovens",
    resumo: "O espaço da juventude da casa. A plataforma não pergunta a idade de ninguém.",
    tarefas: [
      {
        titulo: "Fazer parte da área",
        passos: [
          "No menu superior, abra 'Comunidade' e clique em 'Área de Jovens'.",
          "Clique em 'Quero fazer parte'.",
          "Se quiser, escreva uma linha sobre você.",
          "Confirme.",
        ],
      },
      {
        titulo: "Publicar na área",
        quem: "Quem faz parte da área",
        passos: [
          "Clique em 'Publicar'.",
          "Escreva o título e o texto.",
          "Escolha se é conteúdo, evento ou convite.",
          "Informe a data quando for um evento e, se houver, um endereço na internet.",
          "Escolha quem enxerga e publique.",
        ],
      },
    ],
    observacoes: [
      "Quem não entrou na área lê tudo o que a juventude publica, mas não publica — é o que faz a área ser da juventude, e não mais um mural.",
    ],
  },

  /* ══ ESTUDO E CONTEÚDO ═════════════════════════════════════════════════ */
  {
    id: "artigos",
    titulo: "Artigos da comunidade",
    grupo: "Estudo e conteúdo",
    ondeFica: "Menu superior › Artigos",
    href: "/artigos",
    tambemCobre: ["/artigos/novo", "/artigos/meus"],
    resumo:
      "Qualquer membro com e-mail confirmado escreve e assina um artigo espírita. Os artigos são públicos e aparecem nos buscadores.",
    tarefas: [
      {
        titulo: "Publicar um artigo",
        passos: [
          "Faça login.",
          "No menu superior, clique em 'Artigos'.",
          "Clique em 'Escrever artigo'.",
          "Preencha o título, o resumo (opcional) e o conteúdo.",
          "Escolha como assinar e se o texto pode aparecer nos buscadores.",
          "Clique em 'Publicar artigo'.",
        ],
      },
      {
        titulo: "Mudar a assinatura ou a indexação depois",
        passos: [
          "Abra 'Artigos' no menu.",
          "Clique em 'Meus artigos'.",
          "Escolha o texto e clique em editar.",
          "Ajuste as duas escolhas e salve.",
        ],
      },
      {
        titulo: "Corrigir um artigo que saiu do ar",
        passos: [
          "Acesse 'Artigos' e depois 'Meus artigos'.",
          "Leia o motivo da retirada e a lista dos erros apontados.",
          "Clique em 'Corrigir este artigo'.",
          "Ajuste o texto de acordo com o que foi apontado e reenvie.",
        ],
      },
    ],
    observacoes: [
      "Publicar exige e-mail confirmado.",
      "O artigo entra no ar imediatamente, sem espera por aprovação.",
      "'Não gostei' nunca retira um artigo do ar: discordar de uma leitura não é apontar um erro de fato.",
      "Para 'Tem erro' e 'Tem erro grave' é obrigatório escrever qual é o erro, e o seu nome fica visível para o autor.",
      "O artigo reenviado não volta ao ar sozinho: entra numa fila e só um revisor humano o restaura.",
      "Você não recebe aviso quando um artigo seu é retirado — a informação fica em 'Meus artigos'.",
    ],
  },
  {
    id: "biblioteca",
    titulo: "Biblioteca e orientações da FEB",
    grupo: "Estudo e conteúdo",
    ondeFica: "Menu superior › Estudo › Biblioteca",
    href: "/feb",
    resumo:
      "Obras e documentos de orientação pública, com leitor de PDF integrado e busca dentro do texto.",
    tarefas: [
      {
        titulo: "Ler um livro e pesquisar dentro dele",
        passos: [
          "Abra a Biblioteca.",
          "Escolha a aba 'Obras & Livros' ou 'Orientações FEB'.",
          "Selecione o livro e clique em 'Ler aqui'.",
          "Ajuste o zoom conforme a sua leitura.",
          "Digite a palavra procurada no campo de busca e tecle Enter para destacar as linhas no texto.",
        ],
      },
    ],
  },
  {
    id: "musicas",
    titulo: "Músicas e cifras",
    grupo: "Estudo e conteúdo",
    ondeFica: "Menu superior › Estudo › Músicas e Cifras",
    href: "/musicas-cifras",
    resumo:
      "Duas abas: 'Playlists & Músicas', para áudios e faixas ambientes, e 'Letras & Cifras', com transposição de tom.",
    tarefas: [
      {
        titulo: "Transpor o tom de uma cifra",
        passos: [
          "Abra a aba 'Letras & Cifras'.",
          "Selecione a música.",
          "Clique em '+1 tom' ou '-1 tom' — a cifra inteira é recalculada na hora.",
        ],
      },
      {
        titulo: "Criar uma playlist",
        passos: [
          "Abra a aba 'Playlists & Músicas'.",
          "Clique em 'Nova Playlist' e dê um título.",
          "Nas músicas listadas, clique no ícone '+' e escolha a lista.",
        ],
      },
    ],
    observacoes: [
      "As playlists e os áudios enviados ficam guardados no seu próprio aparelho, não no servidor. Limpar os dados do navegador apaga essas faixas.",
      "Ao enviar um áudio, o músico aceita o Termo de Autorização Fraterno, declarando que possui os direitos e autorizando a reprodução gratuita dentro do portal.",
      "As faixas ambientes são geradas pelo próprio navegador, sem download — úteis para o passe, preces e momentos de harmonização.",
    ],
  },
  {
    id: "mensagem-do-dia",
    titulo: "Mensagem do dia",
    grupo: "Estudo e conteúdo",
    ondeFica: "Menu superior › Estudo › Mensagem do Dia",
    href: "/mensagem-do-dia",
    resumo:
      "Fila de mensagens edificantes agendadas por dia. A do dia aparece no topo da tela de todos os membros.",
    tarefas: [
      {
        titulo: "Enviar uma mensagem para a fila",
        passos: [
          "No bloco da Mensagem do Dia, clique em 'Enviar'.",
          "Escreva a mensagem com a devida citação e autoria.",
          "Envie — ela entra na fila cronológica da sua casa.",
        ],
      },
      {
        titulo: "Ler a mensagem inteira quando ela aparece cortada",
        passos: [
          "Clique em 'Ler tudo', logo abaixo do texto.",
          "Clique em 'Recolher' para fechar de novo.",
        ],
      },
    ],
  },
  {
    id: "radio",
    titulo: "Rádio espírita",
    grupo: "Estudo e conteúdo",
    ondeFica: "Menu superior › Estudo › Rádio",
    href: "/radio",
    resumo: "Transmissões espíritas para ouvir durante o trabalho ou o estudo.",
    tarefas: [
      {
        titulo: "Ouvir",
        passos: [
          "No menu superior, abra 'Estudo' e clique em 'Rádio'.",
          "Escolha a transmissão e dê play.",
        ],
      },
    ],
  },
  {
    id: "perguntas-doutrina",
    titulo: "Perguntas sobre a doutrina",
    grupo: "Estudo e conteúdo",
    ondeFica: "Menu superior › Estudo › Perguntas sobre a doutrina",
    href: "/perguntas",
    resumo:
      "Respostas às dúvidas mais comuns de quem está começando ou atravessando uma perda, com a citação literal da obra de Kardec de onde cada uma saiu.",
    tarefas: [
      {
        titulo: "Consultar e compartilhar",
        passos: [
          "No rodapé de qualquer página, clique em 'Dúvidas sobre a doutrina'.",
          "Escolha a pergunta.",
          "Confira a fonte citada ao final da resposta — obra e número da questão.",
          "Copie o endereço da página e envie a quem estiver precisando.",
        ],
      },
    ],
    observacoes: [
      "As páginas são públicas: qualquer pessoa lê, sem conta e sem cadastro.",
      "Nenhuma afirmação é apresentada como doutrina sem a fonte na codificação de Allan Kardec.",
    ],
  },
  {
    id: "evangelizacao",
    titulo: "Evangelização infantil",
    grupo: "Estudo e conteúdo",
    ondeFica: "Menu superior › Estudo › Evangelização",
    href: "/evangelizacao",
    tambemCobre: ["/evangelizacao/cadastro"],
    resumo:
      "Planos de aula, jogos e o cadastro das crianças — fichas, telefones de emergência, chamada e acompanhamento.",
    tarefas: [
      {
        titulo: "Usar um plano de aula",
        passos: [
          "No menu superior, abra 'Estudo' e clique em 'Evangelização'.",
          "Escolha o plano pela faixa etária e pelo tema.",
          "Use os jogos indicados para fixar o conteúdo com a turma.",
        ],
      },
      {
        titulo: "Criar as turmas da evangelização",
        quem: "Evangelizador, Coordenador ou quem a direção autorizar",
        passos: [
          "Abra 'Evangelização' e clique em 'Cadastro das crianças'.",
          "Escolha a aba 'Turmas' e clique em 'Nova turma'.",
          "Dê um nome à turma e escolha a faixa etária.",
          "Informe o dia da semana, o horário e a sala em que a turma se reúne.",
          "Escreva no campo 'Evangelizadores' quem conduz os encontros.",
          "Clique em 'Criar turma'. Comece pelas turmas: a ficha da criança pergunta a qual delas ela pertence.",
        ],
      },
      {
        titulo: "Cadastrar uma criança com o telefone de emergência",
        quem: "Evangelizador, Coordenador ou quem a direção autorizar",
        passos: [
          "Em 'Cadastro das crianças', na aba 'Crianças', clique em 'Nova criança'.",
          "Preencha o nome completo e a data de nascimento; a idade é calculada sozinha.",
          "Escolha a turma da criança, ou deixe 'Sem turma por enquanto'.",
          "Preencha 'Alergias', 'Medicamentos' e 'Condições de saúde' — a alergia aparece na lista e na chamada, para ser vista antes de alguém oferecer um lanche.",
          "Escreva em 'Outras observações' o que ajuda quem for cuidar da criança.",
          "Marque as autorizações que o responsável deu por escrito: uso de imagem, passeios e saída sozinha.",
          "Preencha o responsável: nome, parentesco, telefone com DDD e, se houver, um segundo telefone.",
          "Clique em 'Cadastrar'. Outros responsáveis podem ser acrescentados depois, abrindo a ficha.",
        ],
      },
      {
        titulo: "Acrescentar outro responsável a uma criança",
        quem: "Evangelizador, Coordenador ou quem a direção autorizar",
        passos: [
          "Na aba 'Crianças', clique em 'Abrir ficha' na criança desejada.",
          "Clique em 'Acrescentar responsável'.",
          "Preencha nome, parentesco e telefone com DDD.",
          "Marque 'Pode retirar a criança' apenas se essa pessoa estiver autorizada a levá-la embora.",
          "Clique em 'Salvar responsável'.",
        ],
      },
      {
        titulo: "Fazer a chamada de um encontro",
        quem: "Evangelizador, Coordenador ou quem a direção autorizar",
        passos: [
          "Em 'Cadastro das crianças', abra a aba 'Chamada'.",
          "Escolha a turma e confira a data do encontro, que já vem no dia de hoje.",
          "Toque em 'Presente' ou 'Faltou' ao lado de cada criança; cada toque é salvo na hora.",
          "Se quase todos vieram, use 'Marcar os que faltam como presentes' e ajuste as exceções.",
          "Para corrigir uma chamada antiga, volte a esta aba e escolha a data daquele encontro.",
        ],
      },
      {
        titulo: "Acompanhar o desenvolvimento de uma criança",
        quem: "Evangelizador, Coordenador ou quem a direção autorizar",
        passos: [
          "Na aba 'Crianças', clique em 'Abrir ficha' na criança desejada.",
          "Veja em 'Acompanhamento' quantas presenças ela tem e a frequência em porcentagem.",
          "Em 'Registrar acompanhamento', confira a data e dê a nota de 1 a 5 em participação, convivência e assimilação.",
          "Escreva no comentário o que a próxima pessoa que assumir a turma precisa saber.",
          "Clique em 'Registrar'. O registro entra no histórico com o seu nome e a data.",
        ],
      },
      {
        titulo: "Imprimir a lista de emergência da sala",
        quem: "Evangelizador, Coordenador ou quem a direção autorizar",
        passos: [
          "Na aba 'Crianças', clique em 'Imprimir emergência'.",
          "Confira a folha: ela traz criança, turma, alergias e os telefones de cada responsável.",
          "Imprima e deixe a folha na sala — numa emergência ninguém abre ficha por ficha no celular.",
        ],
      },
      {
        titulo: "Autorizar alguém a ver as fichas das crianças",
        quem: "Presidente ou Vice-presidente",
        passos: [
          "Abra 'Cadastro das crianças' e escolha a aba 'Quem tem acesso'.",
          "Em 'Autorizar alguém da casa', clique no nome do membro.",
          "Para retirar o acesso, clique em 'Retirar acesso' ao lado do nome.",
        ],
      },
    ],
    observacoes: [
      "A ficha das crianças fica restrita à sua casa espírita: nenhuma outra casa a enxerga.",
      "Leem as fichas quem tem o cargo de Evangelizador ou de Coordenador na casa e quem a direção autorizar nominalmente. O desenvolvedor da plataforma não lê.",
      "Guarde apenas o necessário para cuidar bem da criança. Dado de saúde de menor de idade exige esse cuidado.",
      "'Arquivar' tira a criança das listas e da chamada, preservando o histórico. Apagar remove também responsáveis, presenças e avaliações, e não tem volta.",
    ],
  },
  {
    id: "jogos",
    titulo: "Jogos educativos",
    grupo: "Estudo e conteúdo",
    ondeFica: "Menu superior › Jogos",
    href: "/jogos",
    resumo:
      "Caminho da Luz, Plante a Semente, Caça-Palavras, Semeador de Mensagens, Jogo da Memória e Quiz Espírita.",
    tarefas: [
      {
        titulo: "Jogar o Caminho da Luz",
        passos: [
          "No menu superior, clique em 'Jogos' e escolha 'Caminho da Luz'.",
          "Escolha se joga sozinho ou em dois jogadores.",
          "Cada jogador escolhe nome, cor e avatar.",
          "Responda às perguntas para avançar no tabuleiro — acertos deslocam o peão, erros mantêm na mesma casa.",
        ],
      },
    ],
    observacoes: [
      "Plante a Semente: ao acertar letras de palavras doutrinárias, a semente cresce até revelar o significado do termo.",
      "Caça-Palavras: conceitos e nomes da literatura espírita ocultos no tabuleiro.",
      "Semeador de Mensagens: cartões com trechos do Evangelho para compartilhar.",
      "Jogo da Memória: associa conceitos e ilustrações doutrinárias.",
      "Quiz Espírita: perguntas diretas com contagem de pontos.",
    ],
  },

  /* ══ ENCONTRAR UMA CASA ════════════════════════════════════════════════ */
  {
    id: "diretorio",
    titulo: "Encontrar uma casa espírita",
    grupo: "Encontrar uma casa espírita",
    ondeFica: "Rodapé › Casas espíritas",
    href: "/casas",
    resumo:
      "Diretório aberto das casas espíritas do Brasil, por estado e cidade. Não exige conta nem cadastro.",
    tarefas: [
      {
        titulo: "Procurar uma casa perto de mim",
        quem: "Qualquer pessoa, sem conta",
        passos: [
          "No rodapé de qualquer página, clique em 'Casas espíritas'.",
          "Escolha o seu estado na lista.",
          "Escolha a sua cidade.",
          "Veja as casas com nome, endereço e CEP.",
          "Use 'Como chegar' para abrir a rota no mapa.",
        ],
      },
      {
        titulo: "Assumir a página da minha casa",
        quem: "Quem faz parte da direção",
        passos: [
          "Chegue até a página da sua cidade no diretório.",
          "Localize a sua casa na lista.",
          "Clique em 'É a minha casa — quero cuidar desta página'.",
          "Se ainda não tiver conta, crie uma — é gratuita — e volte a este ponto.",
          "Escolha a sigla da casa: cinco letras que a identificam no site.",
          "Clique em 'Assumir esta casa'.",
        ],
      },
      {
        titulo: "Retirar a minha casa do diretório",
        quem: "Quem faz parte da direção",
        passos: [
          "Chegue até a página da sua cidade no diretório.",
          "Abaixo do nome da casa, clique em 'É da direção desta casa e quer retirá-la desta lista?'.",
          "Informe o seu nome e um contato.",
          "Envie — a casa sai da lista na hora.",
        ],
      },
    ],
    observacoes: [
      "A página assumida nasce PRIVADA: nada aparece ao público antes de a direção conferir e publicar.",
      "Assumir exige e-mail confirmado.",
      "Não perguntamos o motivo da saída. Guardamos apenas quem fez o pedido, para desfazer caso alguém tenha retirado a casa por engano.",
      "As casas vieram de cadastros públicos e estão listadas sem que a direção tenha pedido — por isso os dois caminhos acima ficam sempre abertos.",
      "Recomendação prática: confirme o horário por telefone antes de ir, porque a lista traz o endereço e nem sempre a programação.",
    ],
  },

  /* ══ AVISOS, AJUDA E SUPORTE ═══════════════════════════════════════════ */
  {
    id: "avisos",
    titulo: "Avisos por e-mail",
    grupo: "Avisos, ajuda e suporte",
    ondeFica: "Menu superior › Ajuda › Avisos por e-mail",
    href: "/avisos",
    resumo:
      "O site avisa por e-mail o que acontece com o que é seu. Não há propaganda, e o seu endereço não é passado a ninguém.",
    tarefas: [
      {
        titulo: "Escolher quais avisos quero receber",
        passos: [
          "No menu superior, abra 'Ajuda' e clique em 'Avisos por e-mail'.",
          "Marque ou desmarque cada linha.",
          "Clique em 'Salvar preferências'.",
        ],
      },
    ],
    observacoes: [
      "Chegam por padrão: interesse num item que você anunciou, pedido de vaga na sua carona, oferta de ajuda num pedido seu, voluntário que assumiu a sua entrega e a resposta de quem você procurou.",
      "Nascem desligados os avisos que falam da casa e não de você: pedidos de acolhimento no fórum e pedidos de ajuda que combinam com as suas habilidades.",
      "Um aviso nunca é enviado duas vezes, e só chega a quem confirmou o próprio e-mail.",
      "O mesmo endereço aparece no rodapé de todo e-mail, para desligar direto de lá.",
    ],
  },
  {
    id: "sugestoes-e-problemas",
    titulo: "Reportar problema e enviar sugestões",
    grupo: "Avisos, ajuda e suporte",
    ondeFica: "Rodapé de qualquer página",
    href: "/sugestoes",
    resumo:
      "Dois caminhos diferentes: o relato privado ao desenvolvedor e o pedido público que a comunidade pode votar.",
    tarefas: [
      {
        titulo: "Reportar um problema no site",
        passos: [
          "Role qualquer página até o rodapé.",
          "Clique em 'Reportar problema'.",
          "Descreva o erro: o que você fez e o que aconteceu.",
          "Envie.",
        ],
      },
      {
        titulo: "Enviar uma sugestão privada",
        passos: [
          "No rodapé de qualquer página, clique em 'Sugestões'.",
          "Escreva a sua mensagem — não exige login.",
          "Envie. A resposta vem por e-mail e a mensagem não fica exposta no site.",
        ],
      },
      {
        titulo: "Pedir um desenvolvimento que a comunidade possa votar",
        quem: "Quem tem conta",
        passos: [
          "No menu superior, abra 'Ajuda' e clique em 'Status do Projeto'.",
          "Use o campo 'Solicitar um desenvolvimento'.",
          "Escreva o pedido e envie — ele passa a aparecer para todos os membros, com o seu nome e a sua casa.",
        ],
      },
    ],
  },
  {
    id: "status-do-projeto",
    titulo: "Status do projeto e votação",
    grupo: "Avisos, ajuda e suporte",
    ondeFica: "Menu superior › Ajuda › Status do Projeto",
    href: "/painel",
    resumo:
      "A lista do que já existe, do que está em andamento e do que está por fazer. Os itens mais votados são desenvolvidos primeiro.",
    tarefas: [
      {
        titulo: "Votar num item pendente",
        passos: [
          "No menu superior, abra 'Ajuda' e clique em 'Status do Projeto'.",
          "Percorra a lista de itens pendentes — ela já vem ordenada pelos mais votados.",
          "Clique no botão com o polegar, à direita do item.",
          "Para retirar o voto, clique de novo no mesmo botão.",
        ],
      },
    ],
    observacoes: [
      "Cada membro tem um voto por item, e pode votar em quantos itens quiser.",
      "Os cartões marcados como 'Em breve' na tela inicial também registram voto quando clicados.",
      "Os pedidos enviados pelos membros mostram em que pé estão — Pendente, Em andamento, Feito ou Não será feito — com a resposta do desenvolvedor.",
    ],
  },
  {
    id: "central-de-ajuda",
    titulo: "Central de Ajuda",
    grupo: "Avisos, ajuda e suporte",
    ondeFica: "Menu superior › Ajuda",
    href: "/ajuda",
    resumo:
      "Duas abas com propósitos diferentes: o Manual, com o passo a passo de cada recurso, e as Perguntas frequentes, com respostas curtas a dúvidas.",
    tarefas: [
      {
        titulo: "Achar como se faz alguma coisa",
        passos: [
          "No menu superior, clique em 'Ajuda'.",
          "Fique na aba 'Manual'.",
          "Escreva no campo de busca o que você quer fazer — por exemplo 'projetor', 'PIX' ou 'senha'.",
          "Abra o módulo e siga os passos numerados.",
        ],
      },
      {
        titulo: "Tirar uma dúvida sobre o site",
        passos: [
          "No menu superior, clique em 'Ajuda'.",
          "Abra a aba 'Perguntas frequentes'.",
          "Clique na pergunta para ver a resposta.",
        ],
      },
    ],
    observacoes: [
      "Dúvidas sobre a doutrina espírita não ficam aqui: elas estão em 'Estudo' › 'Perguntas sobre a doutrina'.",
    ],
  },
  {
    id: "transparencia",
    titulo: "Transparência do projeto",
    grupo: "Avisos, ajuda e suporte",
    ondeFica: "Menu superior › Ajuda › Transparência",
    href: "/transparencia",
    resumo: "O que o projeto é, como se mantém e o que faz com os dados de quem o usa.",
    tarefas: [
      {
        titulo: "Consultar",
        passos: ["No menu superior, abra 'Ajuda' e clique em 'Transparência'."],
      },
    ],
  },
];

/**
 * Busca dentro do manual, ignorando acento e maiúscula.
 *
 * Reaproveita `semAcento` da busca do site em vez de repetir a normalização:
 * duas versões da mesma regra acabariam divergindo, e o manual passaria a
 * encontrar coisas que a busca não encontra.
 */
export function filtrarManual(termo: string): ModuloDoManual[] {
  const limpo = semAcento(termo).trim();
  if (limpo.length < 2) return MANUAL;

  const contem = (texto: string) => semAcento(texto).includes(limpo);

  return MANUAL.filter(
    (m) =>
      contem(m.titulo) ||
      contem(m.resumo) ||
      contem(m.ondeFica) ||
      contem(m.grupo) ||
      m.tarefas.some((t) => contem(t.titulo) || t.passos.some(contem)) ||
      (m.observacoes ?? []).some(contem),
  );
}
