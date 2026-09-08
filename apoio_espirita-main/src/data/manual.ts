/**
 * O manual do usuário — fonte única do passo a passo de cada recurso.
 *
 * Por que ele existe separado das perguntas frequentes: as duas coisas
 * respondem a necessidades diferentes. Quem tem uma DÚVIDA ("o site é
 * gratuito?", "meu nome aparece no Google?") quer uma frase. Quem tem uma
 * TAREFA ("preciso anunciar um item no bazar") quer passos numerados, na
 * ordem, com o nome exato do botão.
 *
 * Este arquivo é mantido com riqueza de detalhes passo a passo para que
 * qualquer usuário — mesmo leigo — consiga utilizar 100% das funcionalidades do site.
 * `manual.test.ts` verifica que toda tela anunciada no site tem entrada aqui.
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
          "No menu superior, clique ou toque em 'Perfil'.",
          "Preencha o seu nome completo ou nome de exibição no primeiro campo.",
          "Informe o seu Estado (UF), a sua Cidade e o seu Bairro.",
          "Digite ou selecione a sigla de 5 letras da sua Casa Espírita na caixa de busca.",
          "Escolha a sua função ou cargo na lista 'Função na Casa Espírita' (qualquer usuário pode alterar seu próprio cargo e inclusive se colocar como Presidente).",
          "Clique no botão azul 'Confirmar e entrar' no final da página para salvar.",
        ],
      },
      {
        titulo: "Alterar o meu cargo para Presidente ou outra função",
        passos: [
          "No menu superior, clique em 'Perfil' ou acesse a página da sua casa pelo menu 'Casa'.",
          "Na tela de perfil ou na lista de tarefeiros da casa, abra a caixa de seleção de função.",
          "Selecione 'Presidente' (ou a função desejada na lista de cargos).",
          "Clique em 'Confirmar e entrar' para salvar.",
          "O sistema atualiza as suas permissões e libera os acessos administrativos de forma imediata.",
        ],
      },
      {
        titulo: "Trocar a minha senha",
        passos: [
          "No menu superior, clique em 'Sair' para encerrar a sessão atual.",
          "Na página de login, clique no link 'Esqueci minha senha'.",
          "Informe o seu e-mail cadastrado e clique em 'Enviar link de recuperação'.",
          "Abra o seu leitor de e-mails, localize a mensagem enviada pelo Apoio Espírita e clique no link recebido.",
          "Digite a nova senha desejada nos dois campos indicados e confirme.",
        ],
      },
      {
        titulo: "Encerrar a minha conta definitivamente",
        passos: [
          "No menu superior, clique em 'Perfil'.",
          "Role a página até o rodapé e clique na caixa 'Encerrar a minha conta'.",
          "Leia atentamente o aviso listando os dados que serão removidos.",
          "Digite exatamente o seu nome completo no campo de confirmação.",
          "Clique no botão vermelho 'Excluir esta conta para sempre'.",
        ],
      },
    ],
    observacoes: [
      "Qualquer usuário pode atualizar o próprio cargo sempre que necessário, inclusive se colocar como Presidente da casa.",
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
          "Abra o navegador Google Chrome no seu celular Android e acesse o site apoioespirita.com.br.",
          "Faça login com seu e-mail e senha.",
          "No menu superior, toque no botão 'Ajuda'.",
          "Clique na opção 'Instalar aplicativo'.",
          "Confirme o aviso do navegador tocando em 'Instalar'.",
          "O ícone do Apoio Espírita será adicionado à tela inicial do seu celular.",
        ],
      },
      {
        titulo: "Instalar no iPhone ou iPad",
        passos: [
          "Abra o navegador Safari no seu iPhone ou iPad e acesse apoioespirita.com.br.",
          "Toque no botão 'Compartilhar' (o ícone de um quadrado com uma seta apontando para cima na barra inferior do Safari).",
          "Role as opções para baixo e toque em 'Adicionar à Tela de Início'.",
          "Confirme no canto superior direito tocando em 'Adicionar'.",
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
          "Clique na ícone de lupa localizada no canto direito do menu superior (no celular, ela fica ao lado do botão de menu).",
          "Escreva pelo menos duas letras do termo que procura (exemplo: 'passes', 'bazar', 'Kardec').",
          "Os resultados aparecem enquanto você digita, separados em 'No site', 'Artigos', 'Casas espíritas' e 'Membros da sua casa'.",
          "Clique ou toque sobre o resultado desejado para abrir a página imediatamente.",
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
          "No PowerPoint, abra a apresentação e vá em Arquivo › Exportar › Criar PDF/XPS.",
          "No Google Apresentações, vá em Arquivo › Fazer download › Documento PDF.",
          "Guarde o arquivo PDF gerado no seu dispositivo — é ele que você vai enviar para a plataforma.",
        ],
      },
      {
        titulo: "Enviar uma apresentação",
        passos: [
          "No menu superior, abra 'Recursos' e clique em 'Apresentações'.",
          "Clique no botão 'Enviar uma apresentação'.",
          "Escreva o título da palestra e, se desejar, adicione uma breve descrição.",
          "Marque a opção 'Deixar a plateia baixar o arquivo inteiro' apenas se quiser permitir o download do documento PDF pelos ouvintes.",
          "Clique em 'Escolher o arquivo PDF' e selecione o arquivo do seu computador ou celular.",
          "Aguarde a barra de processamento concluir a preparação de todos os slides.",
        ],
      },
      {
        titulo: "Abrir a sessão e chamar a plateia",
        passos: [
          "Abra a apresentação desejada na sua lista.",
          "Clique no botão 'Abrir a sessão ao vivo'.",
          "O site exibirá na tela um código de 6 letras e um QR Code.",
          "Projete o código no telão da casa espírita ou peça aos frequentadores para apontarem a câmera do celular para o QR Code.",
        ],
      },
      {
        titulo: "Projetar usando só o celular, sem computador",
        quem: "Quem está apresentando",
        passos: [
          "Conecte o seu celular ao projetor usando cabo USB-C/HDMI ou por espelhamento sem fio.",
          "Com a sessão ao vivo aberta, clique em 'Abrir a tela de projeção'.",
          "Toque no botão de tela cheia para expandir o slide com fundo escuro de apresentação.",
          "Para avançar o slide, toque no lado direito da tela; para voltar, toque no lado esquerdo.",
          "Toque no centro da tela para exibir a barra de navegação temporária.",
        ],
      },
      {
        titulo: "Usar um segundo aparelho como controle remoto",
        quem: "Quem está apresentando",
        passos: [
          "Mantenha o aparelho conectado ao projetor exibindo a tela de projeção.",
          "Em um segundo celular ou tablet, acesse a sua conta no Apoio Espírita e abra a mesma apresentação.",
          "Toque nos botões 'Anterior' e 'Próximo' — o slide exibido no projetor mudará instantaneamente.",
        ],
      },
      {
        titulo: "Acompanhar pelo celular, na plateia",
        quem: "Qualquer pessoa, sem conta",
        passos: [
          "Aponte a câmera do seu celular para o QR Code exibido no telão ou acesse apoioespirita.com.br/ao-vivo.",
          "Digite o código de 6 letras exibido na transmissão e toque em 'Entrar'.",
          "O slide atual do palestrante aparecerá na sua tela e avançará sozinho durante a apresentação.",
          "Toque sobre o slide para dar zoom e toque novamente para voltar ao tamanho normal.",
        ],
      },
      {
        titulo: "Ver um slide anterior sem atrapalhar ninguém",
        quem: "Quem está assistindo",
        passos: [
          "Toque no botão 'Anterior' na barra inferior quantas vezes precisar para rever um slide passado.",
          "Uma faixa de aviso indicará que você está navegando individualmente.",
          "Quando quiser retornar ao slide ao vivo do palestrante, toque em 'Voltar ao slide do palestrante'.",
        ],
      },
      {
        titulo: "Enviar uma pergunta ao palestrante",
        quem: "Quem está assistindo",
        passos: [
          "Na tela do slide ao vivo no seu celular, toque em 'Enviar uma pergunta ao palestrante'.",
          "Escreva a sua dúvida no campo de texto.",
          "Informe o seu nome ou marque a caixa para enviar de forma anônima.",
          "Toque no botão 'Enviar'. A pergunta chegará diretamente à tela do apresentador.",
        ],
      },
      {
        titulo: "Encerrar a sessão ao vivo",
        quem: "Quem está apresentando",
        passos: [
          "Retorne à tela de gerenciamento da apresentação.",
          "Clique no botão vermelho 'Encerrar a sessão'.",
        ],
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
      "Cada casa tem uma página própria. Por padrão, ela nasce pública para qualquer pessoa na internet encontrar. O Presidente pode alterá-la para privada a qualquer momento na aba Configurações.",
    tarefas: [
      {
        titulo: "Editar informações e cadastrar a casa",
        quem: "Presidente, Vice-presidente ou administrador nomeado",
        passos: [
          "Acesse a página da sua casa e clique em 'Administrar' no topo da tela.",
          "Na aba 'Configurações', preencha o Nome da Casa, Endereço com Rua e Número, Bairro, Cidade, Estado (UF) e CEP.",
          "Informe os contatos públicos: Telefone, E-mail, Chave PIX e Titular para doações.",
          "Adicione a missão e histórico da instituição.",
          "Clique em 'Salvar alterações'.",
        ],
      },
      {
        titulo: "Escolher a visibilidade da página (Pública na Internet vs Apenas Membros)",
        quem: "Presidente, Vice-presidente ou administrador nomeado",
        passos: [
          "Abra a página da casa espírita no site.",
          "Clique no botão 'Administrar' no topo da página.",
          "Selecione a aba 'Configurações'.",
          "Role até o bloco 'Visibilidade da página'.",
          "Para liberar o acesso geral, selecione o card 'Qualquer pessoa na internet'.",
          "Para restringir o acesso, selecione o card 'Visível apenas para os membros'.",
          "Confirme a alteração para atualizar instantaneamente quem pode visualizar a casa.",
        ],
      },
    ],
    observacoes: [
      "No modo 'Qualquer pessoa na internet', a página exibe publicamente: nome, descrição, missão, ano de fundação, endereço, telefone, e-mail, site, horários das atividades e a vitrine do Bazar On-line da casa.",
      "No modo 'Visível apenas para os membros', nem o público geral nem pessoas cadastradas em outras casas conseguem abrir a página.",
      "Continuam invisíveis para visitantes sem vinculo: o mural de avisos, a lista de tarefeiros e cargos, a agenda interna, a tesouraria e o Kanban.",
      "O presidente pode alterar entre pública e privada a qualquer momento.",
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
          "Abra a página da sua casa e acesse a aba 'Mural'.",
          "Clique em 'Nova publicação no mural'.",
          "Digite o título e a mensagem do comunicado.",
          "Se desejar anexar mídia, cole o link de uma imagem ou vídeo nos campos indicados.",
          "Clique no botão 'Publicar'.",
        ],
      },
      {
        titulo: "Fixar ou excluir uma publicação do mural",
        quem: "Presidente, Vice-presidente ou administrador nomeado",
        passos: [
          "Localize a publicação desejada na aba 'Mural'.",
          "Para destacar no topo, clique no ícone de 'Pino' (Fixar publicação).",
          "Para remover um aviso, clique no ícone de 'Lixeira' e confirme a exclusão.",
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
        titulo: "Criar um evento na agenda",
        quem: "Coordenação, Presidente ou autorizados",
        passos: [
          "No menu superior, abra 'Recursos' e clique em 'Agenda'.",
          "Clique no botão 'Novo evento'.",
          "Informe o título da atividade, a data, o horário de início e de término.",
          "Escolha o local na casa espírita e adicione a descrição do encontro.",
          "Selecione os participantes ou grupos convidados e clique em 'Salvar evento'.",
        ],
      },
      {
        titulo: "Registrar a minha presença em um encontro",
        passos: [
          "Abra a 'Agenda' no seu celular ou computador.",
          "Localize a reunião agendada para o dia de hoje.",
          "Clique no botão 'Confirmar presença'.",
          "Sua frequência será registrada na hora no relatório do evento.",
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
        titulo: "Montar uma escala de trabalho",
        quem: "Presidente, Vice-presidente ou administrador nomeado",
        passos: [
          "Abra a página da sua casa.",
          "Clique em 'Administrar' no topo da página.",
          "Na aba 'Painel', desça até o bloco 'Palestras Públicas e Escalas de Trabalho'.",
          "Clique em 'Nova escala'.",
          "Informe o dia, o mês, o tema da reunião e os nomes dos responsáveis por cada função (facilitador, dirigente, passe e recepção).",
          "Clique em 'Salvar escala'.",
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
    ondeFica: "Menu superior › Ajuda › Tesouraria",
    href: "/tesouraria",
    resumo:
      "Registro de receitas e despesas da casa, saldo do mês, gráficos e relatórios prontos para impressão ou planilha.",
    tarefas: [
      {
        titulo: "Lançar uma receita ou entrada financeira",
        quem: "Presidente e Tesoureiro",
        passos: [
          "No menu superior, abra 'Ajuda' e clique em 'Tesouraria'.",
          "Clique no botão 'Nova Receita'.",
          "Digite o valor em Reais e selecione a data do pagamento.",
          "Escolha a categoria (exemplo: Doações, Bazar, Mensalidades).",
          "Escreva a descrição do lançamento e clique em 'Salvar'.",
        ],
      },
      {
        titulo: "Lançar uma despesa ou saída financeira",
        quem: "Presidente e Tesoureiro",
        passos: [
          "Na tela da Tesouraria, clique no botão 'Nova Despesa'.",
          "Informe o valor em Reais e a data do pagamento.",
          "Escolha a categoria (exemplo: Água/Luz, Manutenção, Alimentos, Material de Limpeza).",
          "Digite a descrição do pagamento e clique em 'Salvar'.",
        ],
      },
      {
        titulo: "Exportar ou imprimir o relatório do mês",
        quem: "Presidente e Tesoureiro",
        passos: [
          "Abra a página da Tesouraria.",
          "Selecione o mês e o ano desejados no filtro de período.",
          "Clique em 'Exportar planilha (.xlsx)' para baixar o arquivo no computador ou celular.",
          "Clique em 'Imprimir relatório' para gerar a versão formatada pronta para assinatura e prestação de contas.",
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
        titulo: "Criar e organizar cartões de projeto",
        passos: [
          "No menu superior, abra 'Recursos' e clique em 'Projetos'.",
          "Na coluna desejada (exemplo: 'A Fazer'), clique em 'Criar cartão'.",
          "Escreva o título do projeto e adicione a descrição dos objetivos.",
          "Adicione itens de verificação (checklist) dentro do cartão se desejar dividir em etapas.",
          "Clique e arraste o cartão entre as colunas conforme o trabalho evoluir.",
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
          "Abra a página da casa espírita.",
          "Clique no botão 'Administrar'.",
          "Acesse a aba 'Permissões' ou 'Equipe'.",
          "Localize o membro cadastrado e clique em 'Conceder acesso de administrador'.",
        ],
      },
      {
        titulo: "Alterar a função de um tarefeiro na lista da casa",
        quem: "Presidente, Vice-presidente ou o próprio usuário",
        passos: [
          "Vá até a página da casa e role até a seção 'Tarefeiros e Membros da Casa'.",
          "Localize a linha com o nome do membro (ou a sua própria linha).",
          "Abra a caixa de seleção na coluna de cargos.",
          "Escolha o novo cargo (como Presidente, Coordenador, Evangelizador ou Tesoureiro).",
          "O sistema atualiza o perfil e as permissões imediatamente.",
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
        titulo: "Registrar um atendimento fraterno",
        quem: "Atendente fraterno, Coordenador ou quem a direção autorizar",
        passos: [
          "No menu superior, abra 'Comunidade' e clique em 'Atendimento Fraterno'.",
          "Clique no botão 'Nova ficha'.",
          "Informe o nome de quem foi atendido, a data do encontro e o telefone de contato.",
          "Escolha se é um primeiro atendimento ou retorno.",
          "Escreva o resumo no campo 'Relato do atendimento' (apenas o necessário para o acompanhamento).",
          "No campo 'Encaminhamento', marque as orientações recomendadas (passes, evangelho no lar, etc.).",
          "Em 'Retornar em', selecione a data do próximo encontro se houver reagendamento.",
          "Clique em 'Salvar ficha'.",
        ],
      },
      {
        titulo: "Consultar ou concluir uma ficha antiga",
        quem: "Quem tem acesso à área",
        passos: [
          "Abra a página 'Atendimento Fraterno'.",
          "Digite o nome da pessoa no campo de busca.",
          "Clique em 'Abrir ficha' para ler o histórico registrado.",
          "Ao encerrar o acompanhamento, clique no botão 'Marcar como concluído'.",
        ],
      },
      {
        titulo: "Autorizar mais alguém a ler as fichas",
        quem: "Quem administra a página da casa",
        passos: [
          "Abra 'Atendimento Fraterno'.",
          "Clique na aba 'Quem tem acesso'.",
          "Clique sobre o nome da pessoa da casa que deve ser autorizada.",
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
        titulo: "Abrir um tópico de conversa",
        passos: [
          "No menu superior, abra 'Comunidade' e clique em 'Fórum de Apoio'.",
          "Clique no botão 'Novo tópico'.",
          "Escreva um título claro e curto e insira o texto da mensagem abaixo.",
          "Selecione o assunto: Dúvida, Acolhimento, Estudo ou Testemunho.",
          "Em 'Quem enxerga', escolha entre 'Somente a minha casa' ou 'Todas as casas'.",
          "Clique em 'Publicar tópico'.",
        ],
      },
      {
        titulo: "Responder a um tópico no fórum",
        passos: [
          "Clique no título do tópico na lista para abrir a conversa.",
          "Role até o campo de resposta ao final da página.",
          "Escreva seu comentário e clique em 'Enviar resposta'.",
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
        titulo: "Criar um grupo de trabalho",
        passos: [
          "No menu superior, abra 'Comunidade' e clique em 'Grupos'.",
          "Clique em 'Criar grupo'.",
          "Digite o nome do grupo e descreva brevemente a finalidade.",
          "Selecione a frente de trabalho correspondente.",
          "Marque 'Grupo fechado' se quiser restringir a entrada apenas a convidados.",
          "Clique em 'Criar grupo' (você se tornará o moderador do grupo).",
        ],
      },
      {
        titulo: "Participar e enviar mensagens",
        passos: [
          "Clique sobre o grupo desejado na lista.",
          "Clique no botão 'Entrar no grupo'.",
          "Digite no campo na parte inferior da tela e pressione Enter para enviar.",
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
        titulo: "Anunciar um item no bazar",
        passos: [
          "No menu superior, abra 'Comunidade' e clique em 'Bazar On-line'.",
          "Clique no botão 'Anunciar item'.",
          "Digite o nome do produto, a descrição, a categoria e se é novo ou usado.",
          "Informe o valor em Reais ou marque 'Contribuição livre'.",
          "Envie uma foto do item (máximo 5 MB) clicando em 'Escolher foto'.",
          "Digite a chave PIX, o nome do favorecido e a cidade para gerar o QR Code automático.",
          "Informe o seu telefone de contato.",
          "Escolha o alcance ('Somente a minha casa' ou 'Todas as casas') e clique em 'Publicar item'.",
        ],
      },
      {
        titulo: "Reservar um item publicado",
        passos: [
          "Localize o produto desejado na vitrine do bazar.",
          "Clique no botão 'Tenho interesse'.",
          "Digite o seu número de contato de WhatsApp.",
          "Clique em 'Enviar pedido de reserva'.",
          "Aguarde o anunciante aceitar: assim que aprovado, os dados de contato serão exibidos para ambos combinarem o pagamento e a entrega.",
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
        titulo: "Pedir uma entrega solidária",
        passos: [
          "No menu 'Comunidade', clique em 'Entrega Solidária'.",
          "Clique no botão 'Pedir uma entrega'.",
          "Se for um item do bazar, selecione-o na lista; caso contrário, marque 'Não é do bazar'.",
          "Descreva o volume a ser transportado, informe o bairro de entrega, um ponto de referência e o seu contato.",
          "Clique em 'Publicar pedido'.",
        ],
      },
      {
        titulo: "Assumir uma entrega como voluntário",
        passos: [
          "Abra a página 'Entrega Solidária'.",
          "Localize um pedido pendente e clique em 'Assumir a entrega'.",
          "Informe o seu telefone para contato.",
          "Combine o dia e horário com o destinatário.",
          "Após realizar o transporte, clique em 'Confirmar entrega'.",
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
          "Informe o bairro de partida, o destino, o dia da semana, o horário e a quantidade de vagas disponíveis.",
          "Marque 'Também trago de volta' se puder oferecer o retorno após as reuniões.",
          "Informe o seu telefone de contato e defina a visibilidade da oferta.",
          "Clique no botão 'Oferecer carona'.",
        ],
      },
      {
        titulo: "Pedir vaga em uma carona",
        passos: [
          "Encontre a oferta de carona adequada na lista e clique em 'Pedir vaga'.",
          "Informe o seu telefone de contato e adicione uma mensagem ao motorista se necessário.",
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
          "Acesse a aba 'Posso ajudar'.",
          "Marque na lista as tarefas e habilidades que você possui.",
          "Informe a sua disponibilidade de dias e horários.",
          "Clique em 'Publicar minhas habilidades'.",
        ],
      },
      {
        titulo: "Pedir ajuda em nome da casa",
        passos: [
          "Na aba 'Precisa-se', clique em 'Pedir ajuda'.",
          "Escreva o que a casa espírita necessita (tarefa, local e horários).",
          "Escolha o nível de urgência e o prazo limite.",
          "Selecione as habilidades exigidas e clique em 'Publicar'.",
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
        titulo: "Abrir um horário na grade de preces",
        passos: [
          "No menu superior, abra 'Comunidade' e clique em 'Plantão de Orações'.",
          "Clique no botão 'Abrir um horário'.",
          "Escolha o dia da semana e o horário de início.",
          "Escreva a intenção ou tema da prece para os participantes.",
          "Defina o limite de vagas (deixe 0 para ilimitado) e escolha a visibilidade.",
          "Clique em 'Abrir horário'.",
        ],
      },
      {
        titulo: "Participar de um horário de oração",
        passos: [
          "Localize o dia e horário desejados na grade.",
          "Clique no botão 'Vou orar' para confirmar a sua inclusão.",
          "Caso não possa participar, clique em 'Sair' para liberar a vaga.",
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
        titulo: "Cadastrar a minha data de aniversário",
        passos: [
          "No menu superior, abra 'Comunidade' e clique em 'Aniversariantes'.",
          "No painel 'O meu aniversário', clique em 'Informar'.",
          "Selecione o dia e o mês do seu nascimento.",
          "Clique no botão 'Salvar'.",
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
        titulo: "Participar da área de jovens",
        passos: [
          "No menu superior, abra 'Comunidade' e clique em 'Área de Jovens'.",
          "Clique em 'Quero fazer parte'.",
          "Se desejar, escreva uma breve frase de apresentação e confirme.",
        ],
      },
      {
        titulo: "Publicar conteúdo para a juventude",
        quem: "Quem faz parte da área de jovens",
        passos: [
          "Clique no botão 'Publicar'.",
          "Digite o título e a mensagem.",
          "Selecione a categoria (Conteúdo, Evento ou Convite).",
          "Se for evento, informe a data e o link de acesso se houver.",
          "Escolha a visibilidade e clique em 'Publicar'.",
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
        titulo: "Publicar um artigo espírita",
        passos: [
          "Faça login na sua conta.",
          "No menu superior, clique em 'Artigos'.",
          "Clique no botão 'Escrever artigo'.",
          "Preencha o título, o resumo e o conteúdo completo do seu texto.",
          "Escolha a sua forma de assinatura e se autoriza a inclusão nos buscadores (Google).",
          "Clique em 'Publicar artigo'.",
        ],
      },
      {
        titulo: "Editar ou alterar a visibilidade de um artigo",
        passos: [
          "Acesse 'Artigos' no menu superior.",
          "Clique na aba 'Meus artigos'.",
          "Localize o texto desejado e clique em 'Editar'.",
          "Modifique o conteúdo ou as opções de visibilidade e salve.",
        ],
      },
      {
        titulo: "Corrigir um artigo retirado para revisão",
        passos: [
          "Acesse 'Artigos' › 'Meus artigos'.",
          "Leia as observações e o motivo indicado para a retirada do ar.",
          "Clique em 'Corrigir este artigo'.",
          "Faça os ajustes solicitados e reenvie para a fila de revisão humana.",
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
        titulo: "Ler um livro e pesquisar termos no texto",
        passos: [
          "Abra a 'Biblioteca' pelo menu 'Estudo'.",
          "Escolha entre as abas 'Obras & Livros' ou 'Orientações FEB'.",
          "Clique sobre o livro ou documento desejado e clique em 'Ler aqui'.",
          "Ajuste o nível de zoom pelos botões no topo do leitor.",
          "Digite o termo desejado no campo de busca interno para grifar as passagens no texto.",
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
        titulo: "Transpor o tom de uma cifra musical",
        passos: [
          "Acesse a aba 'Letras & Cifras'.",
          "Selecione a música desejada na lista.",
          "Clique nos botões '+1 tom' ou '-1 tom' no topo da tela para transpor todos os acordes na hora.",
        ],
      },
      {
        titulo: "Criar uma playlist de músicas",
        passos: [
          "Acesse a aba 'Playlists & Músicas'.",
          "Clique em 'Nova Playlist' e informe um título.",
          "Na lista de faixas de áudio, clique no ícone '+' ao lado da música e escolha a playlist desejada.",
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
    ondeFica: "Página inicial › bloco da Mensagem do Dia",
    href: "/mensagem-do-dia",
    resumo:
      "Fila de mensagens edificantes agendadas por dia. A do dia aparece no topo da tela de todos os membros.",
    tarefas: [
      {
        titulo: "Enviar uma mensagem para a fila diária",
        passos: [
          "No bloco da Mensagem do Dia, clique em 'Enviar'.",
          "Escreva o texto edificante acompanhado da citação e autoria da obra.",
          "Clique em 'Enviar para análise'.",
        ],
      },
      {
        titulo: "Expandir e ler a mensagem completa",
        passos: [
          "No cartão da mensagem na tela inicial, clique no botão 'Ler tudo'.",
          "Clique em 'Recolher' para fechar o texto novamente.",
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
        titulo: "Ouvir transmissões ao vivo",
        passos: [
          "No menu superior, abra 'Estudo' e clique em 'Rádio'.",
          "Selecione uma das emissoras espíritas da lista.",
          "Clique no botão de 'Play' para iniciar a reprodução.",
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
        titulo: "Consultar dúvidas e compartilhar a resposta",
        passos: [
          "No menu 'Estudo' ou no rodapé de qualquer página, clique em 'Perguntas sobre a doutrina'.",
          "Selecione o tema ou clique diretamente na pergunta desejada para expandir.",
          "Leia a explicação e confira ao final a obra e número da questão citada na codificação de Allan Kardec.",
          "Copie o endereço da página do navegador e compartilhe o link.",
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
        titulo: "Acessar e usar um plano de aula",
        passos: [
          "No menu superior, abra 'Estudo' e clique em 'Evangelização'.",
          "Escolha o ciclo ou faixa etária da turma.",
          "Selecione o tema da aula para visualizar a história, o objetivo e a atividade prática.",
        ],
      },
      {
        titulo: "Criar as turmas de evangelização",
        quem: "Evangelizador, Coordenador ou quem a direção autorizar",
        passos: [
          "Abra 'Evangelização' e clique em 'Cadastro das crianças'.",
          "Escolha a aba 'Turmas' e clique no botão 'Nova turma'.",
          "Preencha o nome da turma e a faixa etária dos alunos.",
          "Informe o dia da semana, horário e a sala em que a turma se reúne.",
          "Informe os evangelizadores responsáveis e clique em 'Criar turma'.",
        ],
      },
      {
        titulo: "Cadastrar uma criança e contatos de emergência",
        quem: "Evangelizador, Coordenador ou quem a direção autorizar",
        passos: [
          "Em 'Cadastro das crianças', abra a aba 'Crianças' e clique em 'Nova criança'.",
          "Digite o nome completo e a data de nascimento.",
          "Selecione a turma à qual a criança pertence.",
          "Preencha o campo 'Alergias / Cuidados de Saúde' (essas informações ficarão destacadas em vermelho para segurança antes dos lanches).",
          "Preencha os dados do responsável principal: Nome, Parentesco e Telefone com DDD.",
          "Marque as autorizações dadas pelos pais (uso de imagem, passeios e saída desacompanhada).",
          "Clique no botão 'Cadastrar'.",
        ],
      },
      {
        titulo: "Acrescentar outro responsável a uma criança",
        quem: "Evangelizador, Coordenador ou quem a direção autorizar",
        passos: [
          "Na aba 'Crianças', clique no botão 'Abrir ficha' da criança desejada.",
          "Clique em 'Acrescentar responsável'.",
          "Informe o nome completo, parentesco e telefone com DDD.",
          "Marque 'Pode retirar a criança' apenas se a pessoa tiver autorização para levá-la embora.",
          "Clique em 'Salvar responsável'.",
        ],
      },
      {
        titulo: "Fazer a chamada da turma no dia da aula",
        quem: "Evangelizador, Coordenador ou quem a direção autorizar",
        passos: [
          "No 'Cadastro das crianças', abra a aba 'Chamada'.",
          "Selecione a turma e verifique a data do encontro.",
          "Clique no botão 'Presente' ou 'Faltou' ao lado de cada criança.",
          "As alterações são salvas automaticamente.",
        ],
      },
      {
        titulo: "Acompanhar a frequência e desenvolvimento do aluno",
        quem: "Evangelizador, Coordenador ou quem a direção autorizar",
        passos: [
          "Na aba 'Crianças', clique em 'Abrir ficha' da criança escolhida.",
          "Verifique a frequência percentual em 'Acompanhamento'.",
          "Em 'Registrar acompanhamento', atribua notas de 1 a 5 para participação e convivência.",
          "Escreva observações pedagógicas no campo de texto e clique em 'Registrar'.",
        ],
      },
      {
        titulo: "Imprimir a folha de emergência da sala",
        quem: "Evangelizador, Coordenador ou quem a direção autorizar",
        passos: [
          "Na aba 'Crianças', clique em 'Imprimir emergência'.",
          "Verifique a lista formatada com nomes dos alunos, alergias destacadas e telefones dos responsáveis.",
          "Imprima e mantenha a folha física dentro da sala de aula para pronto uso.",
        ],
      },
      {
        titulo: "Autorizar outros evangelizadores a verem o cadastro",
        quem: "Presidente ou Vice-presidente",
        passos: [
          "Abra 'Cadastro das crianças' e clique na aba 'Quem tem acesso'.",
          "Clique sobre o nome do membro cadastrado na casa para conceder a permissão de leitura.",
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
        titulo: "Jogar os jogos educativos espíritas",
        passos: [
          "No menu superior, clique em 'Jogos' e escolha o jogo desejado.",
          "No 'Caminho da Luz', escolha se joga sozinho ou em dupla, digite seu nome e responda às perguntas doutrinárias para mover o peão no tabuleiro.",
          "No 'Plante a Semente', digite letras para adivinhar os termos doutrinários e fazer a planta florescer.",
          "No 'Caça-Palavras', encontre as palavras escondidas na grade selecionando as letras com o mouse ou toque.",
          "No 'Semeador de Mensagens', escolha um cartão edificante para gerar uma imagem pronta para compartilhar.",
          "No 'Jogo da Memória', desvire os cartões para encontrar os pares de ilustrações e conceitos.",
          "No 'Quiz Espírita', responda aos questionários e teste seus conhecimentos doutrinários.",
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
          "Clique no seu Estado (UF) na lista.",
          "Selecione a sua Cidade.",
          "Confira a lista de casas espíritas com endereço, bairro e CEP.",
          "Clique em 'Como chegar' para abrir o mapa com a rota.",
        ],
      },
      {
        titulo: "Assumir a página da minha casa",
        quem: "Quem faz parte da direção",
        passos: [
          "Localize a sua casa no diretório de cidades.",
          "Clique no link 'É a minha casa — quero cuidar desta página'.",
          "Se não tiver conta, crie uma conta gratuita e retorne a este ponto.",
          "Digite uma sigla de 5 letras maiúsculas para representar a casa (exemplo: GECAL).",
          "Clique no botão 'Assumir esta casa'.",
        ],
      },
      {
        titulo: "Solicitar a remoção da casa do diretório",
        quem: "Quem faz parte da direção",
        passos: [
          "Encontre a casa no diretório público.",
          "Clique em 'É da direção desta casa e quer retirá-la desta lista?'.",
          "Informe o seu nome completo e telefone de contato.",
          "Clique em 'Enviar solicitação' — a casa sairá da exibição pública.",
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
          "Ative ou desative os seletores de cada notificação desejada.",
          "Clique no botão 'Salvar preferências'.",
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
        titulo: "Reportar um problema ou erro no site",
        passos: [
          "Role qualquer página até o rodapé.",
          "Clique no link 'Reportar problema'.",
          "Descreva o erro detalhadamente: o que você tentou fazer e o que aconteceu.",
          "Clique no botão 'Enviar relato'.",
        ],
      },
      {
        titulo: "Enviar uma sugestão privada",
        passos: [
          "No rodapé de qualquer página, clique em 'Sugestões'.",
          "Escreva a sua ideia no campo de texto (não necessita de login).",
          "Clique em 'Enviar sugestão'. A resposta será enviada ao seu e-mail.",
        ],
      },
      {
        titulo: "Pedir um desenvolvimento para a comunidade votar",
        quem: "Quem tem conta",
        passos: [
          "No menu superior, abra 'Ajuda' e clique em 'Status do Projeto'.",
          "Use a caixa 'Solicitar um desenvolvimento'.",
          "Escreva o título e o detalhamento da nova funcionalidade e envie.",
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
        titulo: "Votar em uma funcionalidade sugerida",
        passos: [
          "No menu superior, abra 'Ajuda' e clique em 'Status do Projeto'.",
          "Navegue pela lista de solicitações pendentes.",
          "Clique no botão com o ícone de 'Polegar para cima' ao lado da funcionalidade.",
          "Para retirar o seu voto, basta clicar no mesmo botão novamente.",
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
        titulo: "Achar como se faz alguma coisa no manual",
        passos: [
          "No menu superior, clique em 'Ajuda'.",
          "Mantenha-se na aba 'Manual'.",
          "Digite no campo de pesquisa a tarefa ou palavra desejada (exemplo: 'escala', 'bazar', 'PIX').",
          "Abra o cartão correspondente e siga os passos numerados.",
        ],
      },
      {
        titulo: "Tirar dúvidas frequentes sobre o site",
        passos: [
          "No menu superior, clique em 'Ajuda'.",
          "Selecione a aba 'Perguntas frequentes'.",
          "Clique sobre a pergunta desejada para ler a resposta explicativa.",
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
    ondeFica: "Rodapé › Transparência",
    href: "/transparencia",
    resumo: "O que o projeto é, como se mantém e o que faz com os dados de quem o usa.",
    tarefas: [
      {
        titulo: "Consultar os compromissos e transparência",
        passos: [
          "Role qualquer página até o rodapé.",
          "Clique no link 'Transparência'.",
          "Leia as diretrizes de gratuidade, privacidade de dados e ausência de anúncios.",
        ],
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
