import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Search, X, ThumbsUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { usePainelVotes, toItemKey } from "@/hooks/usePainelVotes";
import { validarLinguagem } from "@/lib/linguagem";
import { CasaHero } from "@/components/CasaHero";

export const Route = createFileRoute("/painel")({
  component: Painel,
});

type Status = "feito" | "andamento" | "planejado" | "recusada";

interface Item {
  status: Status;
  titulo: string;
  descricao?: string;
  solicitante?: string;
  sigla_casa?: string;
  tipo?: "solicitacao" | "sugestao";
  // Título do card em /inicio que gera a chave de voto compartilhada
  cardTitle?: string;
  /** Devolutiva do desenvolvedor sobre uma solicitação de membro. */
  resposta?: string;
}

/** Status gravado em `solicitacoes_dev` → status exibido nesta tela. */
const STATUS_DA_SOLICITACAO: Record<string, Status> = {
  pendente: "planejado",
  andamento: "andamento",
  concluida: "feito",
  recusada: "recusada",
};

const roadmap: Item[] = [
  {
    status: "feito",
    titulo: "Redesign Serene Wisdom — páginas autenticadas",
    descricao:
      "Novo design system premium com foco em acessibilidade para idosos: CasaHero com nome do centro em destaque, Libre Caslon Text + Inter, BottomNav mobile, tokens de cor Serene Wisdom em todas as páginas autenticadas",
  },
  {
    status: "feito",
    titulo: "Página pública da casa — visitante agora consegue abrir e usar",
    descricao:
      "A página só carregava para quem estava logado: quem chegava de fora ficava preso em “Carregando...” e nunca via a casa. Corrigido. O visitante passa a cair direto em Atividades, com o bloco “Como chegar e falar” — endereço com rota no mapa e telefone, e-mail e site tocáveis. As estatísticas de membros, que a RLS zerava para visitante, deixaram de aparecer, e a aba Doações parou de mandar procurar contato no lugar errado. Antes de publicar, a direção passa a ver a conferência do que o visitante vai encontrar — nome, descrição, endereço, um contato e horários — com o que falta e onde preencher, repetida no aviso de confirmação. Informa, não bloqueia.",
  },
  {
    status: "feito",
    titulo: "Limites visíveis entre campos, cartões e seções — páginas autenticadas",
    descricao:
      "Cada superfície passou a ter altura própria: fundo azulado, cartão branco elevado por borda e sombra, e campo rebaixado com contorno definido. Ao receber o foco, o campo fica branco e sobe, tornando-se o único elemento claro do cartão. Inclui altura mínima de 44px nos campos, seta própria no seletor, separação entre linhas de tabela, asterisco de obrigatório em dourado e contorno de foco para navegação por teclado.",
  },

  // ── PENDENTE — Base e qualidade do site ──────────────────────────────────

  {
    status: "feito",
    titulo: "Revisão geral do site — melhorar organização e remover repetições",
    descricao:
      "Página da casa espírita integrada como inicial pós-login. Menu principal simplificado em links intuitivos e dropdown de jogos. Cards de funcionalidades copiados para a página da Casa espírita.",
  },
  {
    status: "feito",
    titulo: "Filtro automático de palavras inapropriadas em conteúdo público",
    descricao:
      "Todo texto que outras pessoas vão ler passa pelo filtro antes de ser gravado: artigos, Mensagem do Dia, mural da casa, sugestões e solicitações. O filtro reconhece as fugas comuns — acento, letra repetida, número no lugar de letra e ponto entre as letras — e avisa o autor qual palavra precisa reescrever, em vez de recusar sem explicar. A comparação é por palavra inteira, para nunca barrar um texto correto que apenas contenha o trecho.",
  },
  {
    status: "planejado",
    titulo: "Verificação de tom fraternal em todos os textos enviados",
    descricao:
      "Sistema que analisa o tom das mensagens e alerta o usuário quando o texto parecer agressivo ou desrespeitoso, incentivando uma comunicação sempre amorosa",
  },
  {
    status: "planejado",
    titulo: "Site mais acessível para idosos e pessoas com dificuldades tecnológicas",
    descricao:
      "Letras maiores · Contraste adequado para quem tem dificuldade de visão · Botões e áreas de toque maiores para facilitar o uso no celular · Navegação simplificada",
  },
  {
    status: "feito",
    titulo: "Mensagem do Dia com visual mais compacto",
    descricao:
      "O bloco passou a ter altura previsível: mostra as duas primeiras linhas com o botão “Ler tudo” para abrir o restante, e os atalhos de enviar mensagem e ver a fila subiram para a mesma linha do título. Uma mensagem longa deixou de empurrar o resto do painel para fora da tela.",
  },
  {
    status: "feito",
    titulo: "Campo de busca geral — encontrar conteúdo, membros e casas",
    descricao:
      "Lupa no menu superior, também no celular, buscando quatro coisas de uma vez: as telas do próprio site (para quem não lembra onde fica cada recurso), artigos publicados, casas espíritas cadastradas e membros. Ignora acento e maiúscula, encontra casa por nome, sigla ou cidade, e coloca na frente a casa que tem página publicada — a que dá para abrir. A busca de membros respeita a regra de privacidade que já existia: mostra apenas quem é da sua própria casa.",
  },

  // ── PENDENTE — Perfil e cadastro ─────────────────────────────────────────

  {
    status: "feito",
    titulo: "Controle de acesso por cargo — quem pode ver e fazer o quê",
    descricao:
      "Cada cargo define o que o usuário pode acessar. O Presidente tem controle total e pode mudar o cargo de qualquer membro. O Vice-presidente tem quase o mesmo acesso. Coordenadores, Dirigentes e Diretoria gerenciam os cargos abaixo deles. O Tesoureiro tem acesso completo à Tesouraria. O Presidente é avisado sempre que alguém muda de cargo.",
  },
  {
    status: "planejado",
    titulo: "Perfil com habilidades, situação de emprego e disponibilidade para voluntariado",
    descricao:
      "Cada membro pode informar suas habilidades profissionais, se está empregado ou em busca de emprego, e se está disponível para ser voluntário dentro ou fora da casa espírita",
  },
  {
    status: "planejado",
    titulo: "Espaço pessoal para contar a própria história de vida",
    descricao:
      "Cada membro pode escrever sua história pessoal no perfil e escolher se quer que ela fique visível para outros membros ou apenas para si mesmo",
  },
  {
    status: "planejado",
    titulo: "Perfil infantil 'Pequena Vinha' — acesso especial para crianças",
    descricao:
      "Um tipo de login especial com um nome carinhoso para as crianças acessarem o site. Ao entrar como 'Pequena Vinha', a tela inicial mostra apenas conteúdos adequados para crianças — jogos, histórias e evangelização — ocultando o restante",
  },
  {
    status: "feito",
    titulo: "Cadastro completo da casa espírita pelo Presidente",
    descricao:
      "O Presidente cadastra os dados da casa: nome, endereço, telefone, foto e informações de contato · Os membros se vinculam à casa pela sigla",
  },
  {
    status: "andamento",
    titulo: "Mapa e diretório público das casas espíritas, por cidade e estado",
    descricao:
      "O diretório está no ar em /casas: 714 casas espíritas de 124 cidades, com endereço, CEP, telefone que liga com um toque e rota no mapa, sem exigir conta de ninguém. Cada estado e cada cidade tem página própria, e a casa que já publicou página no site aparece com o botão de abrir. Falta a visualização em mapa, com os alfinetes das casas próximas — o cadastro já guarda a posição de cada uma.",
  },
  {
    status: "feito",
    titulo: "Chave PIX da casa espírita para receber doações e pagamentos do bazar",
    descricao:
      "O Presidente cadastra a chave PIX da casa · O sistema gera um QR Code para impressão e uso nas reuniões e no bazar on-line",
  },

  // ── PENDENTE — Conteúdo e espiritualidade ────────────────────────────────

  {
    status: "planejado",
    titulo: "Mensagem da doutrina ao fazer login",
    descricao:
      "Ao entrar no site, uma passagem dos livros de Kardec é exibida automaticamente, com indicação do livro, capítulo e página · O Presidente pode tornar isso obrigatório ou deixar que cada membro escolha ativar ou desativar",
  },
  {
    status: "feito",
    titulo: "Artigos escritos pelos membros da comunidade",
    cardTitle: "Artigos e Colunistas",
    descricao:
      "Qualquer membro com e-mail confirmado publica artigos espíritas identificados com nome e casa, sem espera por aprovação · São públicos, indexados em buscadores e avaliados pelos próprios leitores · Um artigo com erro grave reconhecido por gente suficiente sai do ar sozinho; suspender ou banir um autor continua sendo sempre decisão humana",
  },
  {
    status: "feito",
    titulo: "O autor decide como assina o artigo e se ele entra nos buscadores",
    descricao:
      "Com os artigos passando a ser encontrados no Google, o nome de quem escreve fica pesquisável para sempre — e quem escreve sobre luto, doença ou obsessão precisa poder decidir. Na tela de publicar, e depois na de editar, o autor escolhe assinar com o nome completo ou só com o primeiro nome, e se o texto pode ou não aparecer no resultado das buscas. As duas escolhas nascem como sempre foi: assinado e encontrável. O nome abreviado passa a valer em toda tela de uma vez, porque a regra mora na consulta do banco, e o artigo que pediu para ficar de fora sai do mapa do site e leva o aviso de não indexar.",
  },
  {
    status: "planejado",
    titulo: "Fórum de perguntas e respostas sobre a doutrina espírita",
    descricao:
      "Espaço onde qualquer membro pode fazer perguntas sobre o Espiritismo e outros membros podem responder, aprofundando o estudo em conjunto",
  },
  {
    status: "planejado",
    titulo: "Área para palestrantes disponibilizarem suas palestras gravadas",
    cardTitle: "Integração de Vídeos",
    descricao:
      "Palestrantes podem enviar vídeos, áudios ou apresentações de suas palestras para ficarem disponíveis a todos os membros",
  },
  {
    status: "feito",
    titulo:
      "Músicas e Cifras — playlists, cifras espíritas com transposição de tom e compartilhamento de áudios em nuvem com controle de exclusividade",
    cardTitle: "Músicas e Cifras",
    descricao:
      "Visualizador de cifras espíritas com alteração de tom dinâmica, player de áudio com playlists e compartilhamento de áudios na nuvem com controle de exclusividade por Casa Espírita.",
  },
  {
    status: "planejado",
    titulo: "Área dos músicos espíritas — encontros, trabalhos e ensaio virtual",
    descricao:
      "Espaço para músicos espíritas se conhecerem, divulgarem seus trabalhos musicais e realizarem ensaios virtuais. Inclui a possibilidade de organizar um show virtual para apresentação dos músicos da comunidade",
  },
  {
    status: "planejado",
    titulo: "Informações úteis na área de ajuda — empregos e outras religiões",
    descricao:
      "Ampliar a seção de ajuda da página inicial com uma lista de agências de emprego e endereços de outras religiões, para que qualquer pessoa que precise de apoio possa ser encaminhada com fraternidade, independente de crença",
  },
  {
    status: "feito",
    titulo: "Área de Jovens Espíritas",
    descricao:
      "No ar em /jovens. Quem quer participar entra na área por conta própria — a plataforma não pergunta a idade de ninguém — e passa a publicar conteúdo, eventos e convites, com data e link. Quem não entrou lê tudo, mas não publica. A lista da juventude mostra quem está na frente de trabalho, com uma linha de apresentação.",
  },

  // ── PENDENTE — Vida espiritual e comunidade ──────────────────────────────

  {
    status: "andamento",
    titulo: "Calendário de aniversariantes do mês",
    cardTitle: "Aniversariantes do Mês",
    descricao:
      "No ar em /aniversariantes: calendário mês a mês da casa, e quem faz aniversário hoje aparece no painel da página da casa. Guardamos apenas dia e mês, nunca o ano — o que não é guardado não vaza —, e preencher é o próprio consentimento de aparecer. Falta o aviso automático ao coordenador para organizar a homenagem: depende do canal de notificação por e-mail, ainda não ligado a este recurso.",
  },
  {
    status: "andamento",
    titulo: "Plantão de Orações — oração coletiva à distância",
    cardTitle: "Plantão de Orações",
    descricao:
      "No ar em /oracoes: grade semanal fixa, inscrição em um toque, controle de vagas conferido no banco (duas pessoas não ocupam o mesmo último lugar) e a lista de quem vai orar visível a todos. Falta a confirmação de presença depois de cada plantão e o histórico do que já foi cumprido.",
  },
  {
    status: "feito",
    titulo: "Mural de Avisos da casa espírita",
    cardTitle: "Mural de Avisos",
    descricao:
      "Quem administra a página da casa publica comunicados com foto e vídeo, fixa no topo o que não pode passar despercebido, edita e apaga. Todos os membros da casa leem na aba Mural; o visitante de fora não vê. O cartão da tela inicial leva direto para lá. Falta ainda a data de validade que faz o aviso sair sozinho quando vencer.",
  },
  {
    status: "planejado",
    titulo: "Atendimento fraterno virtual — urgente e agendado",
    descricao:
      "Para atendimento urgente: o site identifica os voluntários logados naquele momento e envia um alerta automático para eles e para o Presidente. Se não houver ninguém disponível, indica o CVV ou a opção de agendar. Para atendimento agendado: o Presidente ou autorizados recebem a solicitação, escolhem a data e o horário, e o compromisso é criado automaticamente na agenda de todos os envolvidos. O atendimento pode ser identificado ou anônimo. A sala virtual é controlada pelo Presidente, que define quem pode participar.",
  },
  {
    status: "feito",
    titulo: "Ficha de Atendimento Fraterno — registro confidencial",
    cardTitle: "Ficha de Atendimento Fraterno",
    descricao:
      "No ar em /atendimento-fraterno, com o sigilo mais estrito da plataforma: leem apenas o Atendente fraterno, o Coordenador da casa e quem a direção autorizar nominalmente. A presidência não entra pelo cargo, e o desenvolvedor foi excluído de propósito — suporte técnico não é motivo para ler o relato de ninguém. Registra relato, encaminhamento e data de retorno, e cada abertura de ficha fica gravada em um histórico que ninguém apaga.",
  },
  {
    status: "andamento",
    titulo: "Fórum de apoio fraterno — espaço para quem está passando por dificuldades",
    cardTitle: "Fórum de Apoio",
    descricao:
      "No ar em /forum: tópicos por assunto (dúvida, acolhimento, estudo, testemunho), respostas, marcação de resolvido, fixação pela direção e moderação de quem administra a casa. O tópico nasce restrito à casa e o autor decide abri-lo às demais. Falta o aviso aos voluntários quando alguém publica um pedido de acolhimento.",
  },

  // ── PENDENTE — Solidariedade e mobilidade ────────────────────────────────

  {
    status: "feito",
    titulo: "Carona Solidária — ajuda para chegar à casa espírita",
    cardTitle: "Carona Solidária",
    descricao:
      "No ar em /caronas: o motorista publica origem, destino, dia, hora, vagas e se traz de volta; quem precisa pede lugar informando o ponto de encontro. O telefone do motorista só aparece depois do aceite, e o limite de vagas é conferido no banco — não há como aceitar cinco pessoas para quatro lugares. As caronas passadas ficam consultáveis.",
  },
  {
    status: "feito",
    titulo: "Entrega Solidária — levar itens do bazar até quem comprou",
    cardTitle: "Entrega Solidária",
    descricao:
      "No ar em /entregas: o pedido nasce de uma reserva aceita no bazar (ou avulso, para levar qualquer doação), um voluntário assume, combina dia e hora e confirma a entrega. Os dois contatos se liberam mutuamente só depois que a entrega é assumida, e o endereço completo é combinado entre as duas pessoas — nunca fica publicado na lista.",
  },

  // ── PENDENTE — Organização do centro ─────────────────────────────────────

  {
    status: "andamento",
    titulo: "Escala de Trabalho — quem faz o quê e quando",
    cardTitle: "Escala de Trabalho",
    descricao:
      "O quadro de palestras e escalas já existe no painel da casa: dia, tema, facilitador, coordenador, passe e recepção, com a escala vencida se arquivando sozinha. Falta a parte que avisa cada tarefeiro da própria escala e a consulta pessoal “o que eu faço nesta semana”.",
  },
  {
    status: "planejado",
    titulo: "Controle de manutenções da casa espírita",
    descricao:
      "Registro de todas as manutenções realizadas ou necessárias na casa: reparos, limpezas, compras e serviços. Com datas, responsáveis e status de cada tarefa, para que nada seja esquecido",
  },
  {
    status: "andamento",
    titulo: "Cruzamento de habilidades dos membros com as necessidades do centro",
    cardTitle: "Localização de Voluntariado",
    descricao:
      "No ar em /voluntariado: a casa publica o que precisa, o membro marca o que sabe fazer a partir de um vocabulário comum (sem ele, pedreiro e alvenaria nunca se encontrariam), e cada pedido mostra os voluntários com afinidade, dizendo quais habilidades combinaram. Quem se oferece é aceito ou recusado por quem pediu. Falta o alerta automático ao voluntário quando aparece um pedido com o perfil dele.",
  },
  {
    status: "planejado",
    titulo: "Sistema interno de sugestões com curtidas, comentários e acompanhamento",
    descricao:
      "Membros registram sugestões para a casa · Outros podem curtir e comentar · O status de cada sugestão é acompanhado com datas e motivação registrada",
  },
  {
    status: "feito",
    titulo: "Grupos de comunicação interna por tipo de atividade",
    cardTitle: "Comunicação em Grupos",
    descricao:
      "No ar em /grupos: grupos por frente de trabalho, com conversa que chega na hora, sem recarregar a página. O grupo pode ser da casa, e aí qualquer membro entra, ou fechado — e o fechado nem aparece para quem não é membro. Quem cria modera: adiciona pessoas da casa e remove mensagem imprópria. Ninguém precisa dar o telefone para participar.",
  },
  {
    status: "planejado",
    titulo: "Avisos por WhatsApp para coordenadores e presidentes",
    descricao:
      "Alertas automáticos via WhatsApp sobre eventos, ausências, aprovações e solicitações importantes · Integração com a API oficial do WhatsApp",
  },
  {
    status: "feito",
    titulo: "Instalar o site como aplicativo no celular — sem loja de aplicativos",
    descricao:
      "O site passou a se instalar como aplicativo direto do navegador, com ícone próprio e abertura em tela cheia. No Android, a opção “Instalar aplicativo” aparece no menu Ajuda quando o navegador a permite; no iPhone, o caminho manual do Safari está explicado na Ajuda. Os arquivos de funcionamento ficam guardados no aparelho, o que acelera a abertura e sustenta melhor uma internet fraca, e a queda de conexão passou a mostrar um aviso com botão de tentar de novo no lugar da tela de erro do navegador. As páginas continuam sendo buscadas atualizadas a cada acesso, de propósito: guardar telas mostraria conteúdo vencido ou de outra pessoa que usou o mesmo aparelho.",
  },

  // ── PENDENTE — Tesouraria e financeiro ───────────────────────────────────

  {
    status: "feito",
    titulo: "Bazar on-line com pagamento por PIX",
    cardTitle: "Bazar On-line",
    descricao:
      "No ar em /bazar: item com foto, preço ou contribuição livre, reserva de quem se interessa, aceite de quem anuncia e código PIX copia e cola gerado na hora, no padrão do Banco Central. O pagamento vai direto para a chave de quem anuncia — a plataforma não recebe, não retém e não cobra nada. Falta a imagem do QR Code para leitura pela câmera: hoje o pagamento é feito colando o código no aplicativo do banco.",
  },

  // ── PENDENTE — Painéis de acompanhamento por cargo ───────────────────────

  {
    status: "planejado",
    titulo: "Painel do Presidente — visão geral da casa",
    descricao:
      "Resumo financeiro, lista de tarefeiros, situação das atividades e funcionamento geral da casa espírita, tudo em um só lugar",
  },
  {
    status: "planejado",
    titulo: "Painel do Coordenador — acompanhamento da coordenação",
    descricao:
      "Visão das atividades sob sua responsabilidade: presenças, escalas, atendimentos e comunicados da coordenação",
  },
  {
    status: "planejado",
    titulo: "Painel de configurações do Presidente — ligar e desligar recursos",
    descricao:
      "O Presidente pode ativar ou desativar cada funcionalidade do site para a sua casa. Cada recurso tem três opções: desligado, opcional (o membro escolhe) ou obrigatório para todos · Inclui sistema de votação para decisões coletivas da casa",
  },
  {
    status: "feito",
    titulo: "Gerenciamento de solicitações de desenvolvimento — somente DEV",
    descricao:
      "Cada solicitação enviada por um membro passa a ter situação — pendente, em andamento, concluída ou não será feito — e uma resposta escrita pelo desenvolvedor. Quem pediu acompanha o andamento e lê a resposta nesta mesma tela, sem precisar perguntar a ninguém; recusa exige motivo escrito. As sugestões enviadas pelo formulário público, que trazem o e-mail de quem escreveu, deixaram de ser listadas aqui e ficam apenas com o desenvolvedor.",
  },

  // ── PENDENTE — Alcance público e divulgação da doutrina ──────────────────

  {
    status: "feito",
    titulo: "Fazer o conteúdo público do site ser encontrado nos buscadores",
    descricao:
      "Eram três travas ao mesmo tempo. O site pedia aos buscadores que não visitassem as páginas das casas; o mapa do site listava doze endereços fixos, nenhum deles um artigo ou uma casa; e as páginas públicas entregavam apenas a palavra “Carregando” a quem não estava logado, porque esperavam a autenticação antes de mostrar qualquer coisa. As três foram removidas: o caminho está aberto para o diretório de casas, para as páginas que cada casa publicou e para os artigos; o mapa do site passou a ser montado a partir do banco a cada publicação, com 166 endereços no lugar de doze; e a vitrine pública passou a aparecer sem esperar login. Casa privada continua fora, fechada também pela permissão do banco.",
  },

  {
    status: "feito",
    titulo: "Ligar a casa do diretório público ao cadastro dela no site",
    descricao:
      "Na página da cidade, abaixo do nome de cada casa sem página, quem é da direção clica em “É a minha casa”, escolhe a sigla de cinco letras e pronto: a página é criada na hora, já preenchida com o nome, o endereço, o CEP e o telefone que estavam no cadastro público, e a pessoa cai na aba Configurações para revisar. A página nasce privada, como toda página de casa — nada aparece ao público antes de alguém publicar. Assumir exige e-mail confirmado, a mesma trava usada para publicar artigo. Cada casa assumida fica registrada com quem assumiu e quando, e o administrador do site desfaz num clique se não proceder.",
  },
  {
    status: "planejado",
    titulo: "Compartilhar a mensagem do dia e os artigos em imagem",
    descricao:
      "Um botão que transforma a mensagem do dia ou o trecho de um artigo em uma imagem bonita, com a fonte e o endereço do site, pronta para enviar no WhatsApp. É o conteúdo que as pessoas já compartilham todos os dias, hoje sem levar ninguém de volta ao portal.",
  },
  {
    status: "feito",
    titulo: "Perguntas e respostas públicas sobre a doutrina espírita",
    descricao:
      "Dez perguntas respondidas em /perguntas, públicas e sem cadastro: o que é o Espiritismo, se é preciso deixar a própria religião, o que acontece depois da morte, reencarnação, por que uma criança morre, o suicídio, mediunidade, obsessão, se a casa espírita cobra alguma coisa e se orar adianta. Cada resposta termina com a citação literal de Kardec e o número da questão ou do item — só a codificação, que é o terreno comum do movimento e está em domínio público. A pergunta sobre suicídio abre com o telefone do CVV, antes de qualquer doutrina. Todas as citações foram conferidas no texto integral das obras antes de publicar.",
  },
  {
    status: "planejado",
    titulo: "Estudo guiado de O Livro dos Espíritos, capítulo a capítulo",
    descricao:
      "Trilha de estudo com um capítulo por vez, resumo, as questões originais, comentário e um quiz ao fim, guardando onde cada pessoa parou. Serve tanto para quem estuda sozinho quanto para o grupo de estudo da casa acompanhar a turma.",
  },
  {
    status: "planejado",
    titulo: "Artigos em áudio e boletim semanal por e-mail",
    descricao:
      "Cada artigo ganha uma versão em áudio, para quem não lê — no trânsito, no trabalho, ou por dificuldade de visão. E um boletim semanal reúne a mensagem do dia e os artigos novos para quem pedir para receber, trazendo a pessoa de volta sem depender de rede social.",
  },
  {
    status: "planejado",
    titulo: "Convite pessoal e cartaz com QR Code da casa",
    descricao:
      "Cada membro tem um link de convite para trazer alguém, e cada casa imprime um cartaz com o QR Code da sua página para deixar na recepção e nas atividades públicas. É o caminho mais curto entre o visitante que chegou uma vez e o site que o mantém por perto.",
  },
  {
    status: "planejado",
    titulo: "Portal em espanhol",
    descricao:
      "A doutrina espírita tem grande presença na América Latina e quase nada em português alcança quem fala espanhol. Traduzir as telas públicas e permitir que o autor marque o idioma do artigo multiplica o alcance sem precisar de conteúdo novo.",
  },

  // ── PENDENTE — Comunicação e transmissão ─────────────────────────────────

  {
    status: "planejado",
    titulo: "Transmissão ao vivo de palestras pelo celular",
    cardTitle: "Live Streaming",
    descricao:
      "Um membro transmite a palestra pelo celular e todos os outros logados na casa podem assistir ao vivo, sem precisar de equipamentos especiais",
  },
  {
    status: "planejado",
    titulo: "Videochamada em grupo — Google Meet ou solução própria",
    cardTitle: "Google Meet",
    descricao:
      "Iniciar uma videochamada direto pela plataforma, sem sair do site · Link compartilhável com os membros convidados",
  },
  {
    status: "planejado",
    titulo: "Transmissão profissional de palestras — integração com StreamYard",
    descricao:
      "Para casas que queiram transmitir com mais qualidade, integração com o StreamYard ou desenvolvimento de solução própria de streaming",
  },

  // ── PENDENTE — Educação e jogos ──────────────────────────────────────────

  {
    status: "feito",
    titulo: "Módulo escolar de evangelização infantil",
    cardTitle: "Evangelização Infantil",
    descricao:
      "Planos de aula prontos por faixa etária (3–5, 6–8 e 9–11 anos) baseados nas diretrizes FEB AEE Infância · Acessível em /evangelizacao",
  },
  {
    status: "feito",
    titulo: "Quiz Espírita — perguntas sobre virtudes e doutrina",
    cardTitle: "Quiz Espírita",
    descricao:
      "30 perguntas de múltipla escolha por faixa etária (3–5, 6–8 e 9–11 anos) · Feedback imediato · Placar ao final · Disponível em /jogos/quiz-espirita",
  },
  {
    status: "feito",
    titulo: "Jogo da memória — termos e significados da doutrina",
    descricao:
      "Jogo da memória com dois modos: Virtudes (nome + ícone) e Palavras do Evangelho (palavra + significado) · Três dificuldades · Disponível em /jogos/memoria-evangelizacao",
  },
  {
    status: "feito",
    titulo: "Semeador de Mensagens — ordene as palavras e cultive mensagens de luz",
    cardTitle: "Semeador de Mensagens",
    descricao:
      "Adivinhe e ordene as palavras de lindas mensagens psicografadas e doutrinárias para fazer um jardim florescer · Disponível em /jogos/semeador-mensagens",
  },
  {
    status: "feito",
    titulo: "Caça-Palavras das Virtudes — encontre termos morais e espíritas",
    cardTitle: "Caça-Palavras das Virtudes",
    descricao:
      "Encontre virtudes e termos da codificação espírita na grade de letras de forma totalmente dinâmica, e descubra belas explicações morais de cada termo localizado · Disponível em /jogos/caca-palavras",
  },
  {
    status: "feito",
    titulo: "Caminho da Luz — avance casas respondendo perguntas doutrinárias",
    cardTitle: "Caminho da Luz",
    descricao:
      "Jogo de tabuleiro das virtudes para 1 ou 2 jogadores, com som e animações dinâmicas de avanço · Disponível em /jogos/caminho-da-luz",
  },
  {
    status: "planejado",
    titulo: "Palavras cruzadas com termos espíritas",
    descricao:
      "Grade de palavras cruzadas com termos e definições retirados dos 5 livros da codificação · Gerada automaticamente para nunca repetir o mesmo jogo",
  },
  {
    status: "planejado",
    titulo: "Quiz de trechos — adivinhe o livro e o capítulo",
    descricao:
      "Um trecho dos livros de Kardec aparece na tela e o jogador deve identificar de qual livro e capítulo aquela passagem foi extraída",
  },
  {
    status: "planejado",
    titulo: "Batalha Naval Espírita — jogo em dupla ou contra o computador",
    descricao:
      "Versão do jogo Batalha Naval onde, no lugar dos barcos, há palavras da doutrina espírita de tamanhos variados. Pode ser jogado convidando outro membro ou contra o computador. À medida que o jogador acerta todas as letras de uma palavra, o seu significado na doutrina é revelado",
  },
  {
    status: "feito",
    titulo: "Jogos educativos adaptados para crianças da evangelização",
    descricao:
      "Jogo da memória com virtudes e palavras do Evangelho · Três dificuldades · Hub de evangelização com planos de aula · Disponível em /evangelizacao e /jogos/memoria-evangelizacao",
  },

  // ── PENDENTE — Ferramentas de apoio ──────────────────────────────────────

  {
    status: "planejado",
    titulo: "Player de PowerPoint — apresentações direto na plataforma",
    cardTitle: "Player de PowerPoint",
    descricao:
      "Apresente arquivos de PowerPoint diretamente no site, sem precisar de instalações ou aplicativos externos · Ideal para palestrantes e coordenadores",
  },

  // ── FEITO — Módulos já disponíveis ───────────────────────────────────────

  {
    status: "feito",
    titulo: "Agenda de eventos e reuniões com caderno de presença digital",
    cardTitle: "Agenda de Eventos e Reuniões",
    descricao:
      "Calendário da casa com eventos abertos e fechados, convite a participantes, confirmação de presença pelo celular e relatório por reunião e por membro · Disponível em /agenda",
  },
  {
    status: "feito",
    titulo: "Tesouraria da casa espírita",
    descricao:
      "Registro de receitas e despesas, saldo do mês, exportação em Excel e impressão formatada · O Presidente autoriza quem pode entrar · Disponível em /tesouraria",
  },
  {
    status: "feito",
    titulo: "Biblioteca de orientações públicas da FEB",
    descricao:
      "Documentos e orientações públicas reunidos para consulta e download pelos trabalhadores da casa · Disponível em /feb",
  },
  {
    status: "feito",
    titulo: "Rádio espírita",
    descricao:
      "Programação espírita para ouvir durante o trabalho ou o estudo · Disponível em /radio",
  },
  {
    status: "feito",
    titulo: "Mensagem do Dia enviada pelos membros",
    descricao:
      "Cada membro envia uma mensagem para a fila da sua casa · A mensagem do dia aparece na tela inicial e a fila fica visível a todos · Disponível em /mensagem-do-dia",
  },
  {
    status: "feito",
    titulo: "Transparência do projeto",
    descricao:
      "Prestação de contas aberta: o que é mantido, como é mantido e por quem · Disponível em /transparencia",
  },
  {
    status: "feito",
    titulo: "Plante a Semente — jogo de palavras da doutrina",
    descricao: "Jogo de adivinhação de palavras espíritas · Disponível em /jogos/plante-a-semente",
  },

  // ── FEITO — Organização e gestão de eventos ──────────────────────────────

  {
    status: "feito",
    titulo: "Board Kanban de projetos da casa espírita",
    cardTitle: "Kanban de Projetos",
    descricao:
      "Quadro Kanban completo estilo Trello: múltiplos projetos nomeados por casa, frentes de trabalho (equipes responsáveis) organizadas em abas dentro de cada projeto, arrastar cards entre listas e reordenar listas com animação suave (DragOverlay), capas coloridas e avatares dos membros nos cards, além de comentários, checklists, tags, prazos, anexos, fundos personalizáveis e link para convidados · Disponível em /kanban",
  },
  {
    status: "feito",
    titulo: "Grupos de tarefas dentro dos cartões do Kanban",
    cardTitle: "Kanban de Grupos",
    descricao:
      "Cada cartão do quadro aceita grupos de tarefas com marcação de concluído e acompanhamento do progresso · Fica dentro do próprio cartão, em /kanban",
  },
];

const badge: Record<Status, { label: string; color: string }> = {
  feito: { label: "Feito", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  andamento: {
    label: "Em andamento",
    color: "text-amber-400  bg-amber-400/10  border-amber-400/20",
  },
  planejado: { label: "Pendente", color: "text-cyan-glow  bg-cyan-glow/10  border-cyan-glow/20" },
  recusada: {
    label: "Não será feito",
    color: "text-rose-400 bg-rose-400/10 border-rose-400/20",
  },
};

const icon: Record<Status, string> = {
  feito: "✓",
  andamento: "◎",
  planejado: "○",
  recusada: "—",
};

// Usa cardTitle quando disponível para compartilhar o voto com o cartão de /inicio
function itemVoteKey(item: Item): string {
  return toItemKey(item.cardTitle ?? item.titulo);
}

function Painel() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [busca, setBusca] = useState("");
  const [solicitacoes, setSolicitacoes] = useState<Item[]>([]);
  const [solTitulo, setSolTitulo] = useState("");
  const [solDesc, setSolDesc] = useState("");
  const [sendingSol, setSendingSol] = useState(false);
  const [solOk, setSolOk] = useState(false);
  const [solError, setSolError] = useState("");
  const { votes, votingKey, toggleVote } = usePainelVotes(user);

  // As sugestões enviadas pelo formulário público trazem nome e e-mail de quem
  // escreveu — inclusive de quem não é membro. Não são listadas aqui: ficam
  // apenas com o desenvolvedor, que responde a quem enviou.
  const fetchSolicitacoes = async () => {
    const { data } = await supabase
      .from("solicitacoes_dev")
      .select("titulo, descricao, status, resposta_dev, profiles!user_id(nome, sigla_casa)")
      .order("created_at", { ascending: false });
    if (data) {
      setSolicitacoes(
        data.map((s) => {
          const p = s.profiles as { nome?: string; sigla_casa?: string } | null;
          return {
            status: STATUS_DA_SOLICITACAO[s.status] ?? ("planejado" as Status),
            titulo: s.titulo,
            descricao: s.descricao ?? undefined,
            resposta: s.resposta_dev ?? undefined,
            solicitante: p?.nome ?? "Membro",
            sigla_casa: p?.sigla_casa ?? "",
            tipo: "solicitacao" as const,
          };
        }),
      );
    }
  };

  const handleSolicitacao = async () => {
    if (!solTitulo.trim()) {
      setSolError("Informe o título da solicitação.");
      return;
    }
    // A solicitação aparece no Status do Projeto para todos os membros.
    const linguagem = validarLinguagem(solTitulo, solDesc);
    if (linguagem) {
      setSolError(linguagem);
      return;
    }
    if (!user) return;
    setSendingSol(true);
    setSolError("");
    setSolOk(false);
    try {
      const { error } = await supabase
        .from("solicitacoes_dev")
        .insert({ user_id: user.id, titulo: solTitulo.trim(), descricao: solDesc.trim() || null });
      if (error) throw error;
      supabase.functions.invoke("send-notification", {
        body: {
          type: "solicitacao",
          data: {
            titulo: solTitulo.trim(),
            descricao: solDesc.trim() || null,
            user_email: user.email,
          },
        },
      });
      setSolTitulo("");
      setSolDesc("");
      setSolOk(true);
      fetchSolicitacoes();
    } catch (e: unknown) {
      setSolError(e instanceof Error ? e.message : "Erro ao enviar solicitação.");
    } finally {
      setSendingSol(false);
    }
  };

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
    if (
      !loading &&
      user &&
      (!profile?.sigla_casa ||
        !profile?.nome ||
        !profile?.cargo_principal ||
        !profile?.uf ||
        !profile?.cidade)
    )
      navigate({ to: "/completar-perfil" });
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    if (user) fetchSolicitacoes();
  }, [user]);

  if (loading || !user) return null;

  // O roadmap concluído não entra na lista — ela é de pendências. As
  // solicitações entram sempre, inclusive as já atendidas: quem pediu precisa
  // ver o que aconteceu com o pedido.
  const allItems = [...roadmap.filter((i) => i.status !== "feito"), ...solicitacoes];

  const termo = busca.trim().toLowerCase();
  const filtered = termo
    ? allItems.filter(
        (i) =>
          i.titulo.toLowerCase().includes(termo) ||
          (i.descricao ?? "").toLowerCase().includes(termo) ||
          (i.solicitante ?? "").toLowerCase().includes(termo) ||
          (i.sigla_casa ?? "").toLowerCase().includes(termo),
      )
    : allItems;
  const totalResultados = filtered.length;

  // Ordena pendentes por votos (mais votados primeiro)
  const sortedFiltered = filtered.map((item) => ({
    item,
    voteCount: item.status === "planejado" ? (votes[toItemKey(item.titulo)]?.count ?? 0) : 0,
  }));

  const getItemsByStatus = (status: Status) =>
    sortedFiltered
      .filter(({ item }) => item.status === status)
      .sort((a, b) => (status === "planejado" ? b.voteCount - a.voteCount : 0))
      .map(({ item }) => item);

  return (
    <main className="page-light min-h-screen pt-20 pb-20">
      <CasaHero />
      <div style={{ maxWidth: 860, margin: "0 auto" }} className="px-4 md:px-[44px] pt-12 pb-0">
        {/* Título da seção */}
        <div style={{ marginBottom: 32 }}>
          <h2
            style={{
              fontFamily: '"Libre Caslon Text", Georgia, serif',
              fontSize: "1.5rem",
              fontWeight: 400,
              color: "#111418",
              margin: 0,
              marginBottom: 6,
            }}
          >
            Acompanhamento do Projeto
          </h2>
          <p style={{ fontFamily: "Inter", fontSize: "0.9rem", color: "#637080", margin: 0 }}>
            O que está pendente, o que já foi respondido e como solicitar novos recursos.
          </p>
        </div>

        {/* Aviso de votação */}
        <div
          style={{
            background: "#ebf0f9",
            border: "1px solid rgba(0,74,140,.15)",
            borderRadius: 16,
            padding: "16px 20px",
            marginBottom: 32,
          }}
        >
          <div className="flex items-start gap-3">
            <ThumbsUp size={16} style={{ color: "#004a8c" }} className="mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-foreground font-light">
                <span style={{ fontWeight: 600, color: "#004a8c" }}>Vote nos itens pendentes</span>{" "}
                que considera mais importantes.
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Os itens com mais curtidas serão desenvolvidos primeiro. Cada membro pode curtir
                qualquer item pendente — e descurtir quando quiser.
              </p>
            </div>
          </div>
        </div>

        {/* Busca */}
        <div className="relative mb-8">
          <Search
            size={15}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Buscar no projeto…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full rounded-xl bg-white border border-[rgba(0,20,70,.15)] pl-10 pr-10 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[rgba(0,74,140,.6)] transition-colors"
          />
          {busca && (
            <button
              onClick={() => setBusca("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Contador de resultados */}
        {termo && (
          <p className="text-xs text-muted-foreground/50 mb-6 -mt-4">
            {totalResultados === 0
              ? "Nenhum resultado encontrado."
              : `${totalResultados} resultado${totalResultados > 1 ? "s" : ""} encontrado${totalResultados > 1 ? "s" : ""}.`}
          </p>
        )}

        {/* ── Itens do Projeto ── */}
        {(!termo || filtered.length > 0) && (
          <h2 className="text-xs uppercase tracking-[0.3em] text-muted-foreground/40 mb-4 mt-2">
            Acompanhamento do projeto
          </h2>
        )}

        {/* Items by group */}
        {(["andamento", "planejado", "feito", "recusada"] as Status[]).map((status) => {
          const items = getItemsByStatus(status);
          if (items.length === 0) return null;
          return (
            <div key={status} className="mb-8">
              <h2 className="text-xs uppercase tracking-[0.3em] text-muted-foreground/60 mb-3 flex items-center gap-2">
                <span className={`text-base ${badge[status].color.split(" ")[0]}`}>
                  {icon[status]}
                </span>
                {badge[status].label}
                {status === "planejado" && (
                  <span className="text-muted-foreground/40 normal-case tracking-normal font-normal ml-1">
                    — ordenados por votos
                  </span>
                )}
                {(status === "feito" || status === "recusada") && (
                  <span className="text-muted-foreground/40 normal-case tracking-normal font-normal ml-1">
                    — pedidos de membros já respondidos
                  </span>
                )}
              </h2>
              <div className="space-y-2">
                {items.map((item) => {
                  const key = itemVoteKey(item);
                  const voteData = votes[key];
                  const count = voteData?.count ?? 0;
                  const voted = voteData?.votedByMe ?? false;
                  const isPending = item.status === "planejado";
                  const isVoting = votingKey === key;

                  const cardStyle =
                    item.status === "feito"
                      ? {
                          background: "#eaf8f1",
                          border: "1px solid rgba(10,92,53,.15)",
                          borderRadius: 12,
                          padding: "14px 18px",
                          marginBottom: 8,
                        }
                      : item.status === "andamento"
                        ? {
                            background: "#ebf0f9",
                            border: "1px solid rgba(0,74,140,.15)",
                            borderRadius: 12,
                            padding: "14px 18px",
                            marginBottom: 8,
                          }
                        : item.status === "recusada"
                          ? {
                              background: "#fbf1f2",
                              border: "1px solid rgba(140,20,40,.15)",
                              borderRadius: 12,
                              padding: "14px 18px",
                              marginBottom: 8,
                            }
                          : {
                              background: "#ffffff",
                              border: "1px solid rgba(0,20,70,.08)",
                              borderRadius: 12,
                              padding: "14px 18px",
                              marginBottom: 8,
                            };

                  return (
                    <div key={item.titulo} style={cardStyle} className="flex items-start gap-4">
                      <span
                        className={`text-sm mt-0.5 shrink-0 ${badge[status].color.split(" ")[0]}`}
                      >
                        {icon[status]}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground font-light">{item.titulo}</p>
                        {item.descricao && (
                          <p className="text-xs text-muted-foreground/60 mt-0.5">
                            {item.descricao}
                          </p>
                        )}
                        {item.resposta && (
                          <p className="text-xs text-foreground/70 mt-1.5">
                            <span style={{ fontWeight: 600 }}>Resposta:</span> {item.resposta}
                          </p>
                        )}
                        {item.solicitante && (
                          <p className="text-xs text-cyan-glow/60 mt-1">
                            {item.tipo === "sugestao" ? "Sugestão" : "Solicitado"} por{" "}
                            {item.solicitante}
                            {item.sigla_casa ? ` · ${item.sigla_casa}` : ""}
                          </p>
                        )}
                      </div>
                      {isPending && (
                        <button
                          onClick={() => toggleVote(itemVoteKey(item))}
                          disabled={isVoting}
                          title={voted ? "Retirar minha curtida" : "Curtir este item"}
                          className={`shrink-0 flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl border transition-colors disabled:opacity-50 disabled:cursor-default ${
                            voted
                              ? "text-cyan-glow border-cyan-glow/40 bg-cyan-glow/10"
                              : "text-muted-foreground/40 border-white/10 hover:text-cyan-glow hover:border-cyan-glow/30 hover:bg-cyan-glow/5"
                          }`}
                        >
                          <ThumbsUp size={13} />
                          <span className="text-[10px] leading-none font-medium">
                            {count > 0 ? count : ""}
                          </span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className="mt-12 text-center space-y-3">
          <Link to="/" className="text-xs text-cyan-glow/60 hover:text-cyan-glow transition-colors">
            ← Voltar ao início
          </Link>
        </div>

        {/* Solicitar desenvolvimento */}
        <div className="mt-16 pt-8 border-t border-white/5">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground/60 mb-1">
              Colabore com o projeto
            </p>
            <h2 className="text-xl font-light text-foreground">Solicitar um desenvolvimento</h2>
            <p className="mt-1 text-sm text-muted-foreground/60 font-light">
              Tem uma ideia ou necessidade? Compartilhe conosco com fraternidade.
            </p>
          </div>
          <div className="glass rounded-3xl p-6 space-y-4">
            <input
              type="text"
              placeholder="Título da solicitação"
              value={solTitulo}
              onChange={(e) => {
                setSolTitulo(e.target.value);
                setSolError("");
                setSolOk(false);
              }}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-cyan-glow/40 transition-colors"
            />
            <textarea
              placeholder="Descreva sua solicitação com detalhes (opcional)"
              value={solDesc}
              onChange={(e) => {
                setSolDesc(e.target.value);
                setSolError("");
                setSolOk(false);
              }}
              rows={4}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-cyan-glow/40 transition-colors resize-none"
            />
            {solError && <p className="text-xs text-red-400 text-center">{solError}</p>}
            {solOk && (
              <p className="text-xs text-emerald-400 text-center">
                Solicitação enviada com gratidão. Ela aparece na lista acima e o status muda
                conforme for analisada.
              </p>
            )}
            <button
              onClick={handleSolicitacao}
              disabled={sendingSol}
              className="w-full py-3 rounded-xl text-sm uppercase tracking-widest text-cyan-glow border border-cyan-glow/40 hover:bg-cyan-glow/10 disabled:opacity-40 transition-colors"
            >
              {sendingSol ? "Enviando…" : "Enviar solicitação"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
