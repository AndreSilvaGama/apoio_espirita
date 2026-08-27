import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronDown, Search, X, MessageSquare, Flag } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/ajuda")({
  component: Ajuda,
});

interface FaqItem {
  pergunta: string;
  resposta: string;
}

const FAQ: FaqItem[] = [
  {
    pergunta: "O site é gratuito?",
    resposta:
      "Sim, completamente gratuito. Sem anúncios, sem planos de assinatura, nem cobrança de taxas. O Apoio Espírita é uma plataforma beneficente e fraterna mantida inteiramente por trabalho voluntário de caridade.",
  },
  {
    pergunta: "O site tem algum vínculo com a FEB ou federações?",
    resposta:
      "Não. O Apoio Espírita é uma plataforma totalmente independente, sem vínculo jurídico, financeiro ou institucional com a Federação Espírita Brasileira (FEB), uniões estaduais ou outras entidades federativas. Nós apenas disponibilizamos os documentos de orientações públicas oficiais da FEB em nossa biblioteca como um serviço fraterno facilitado para os trabalhadores da vinha.",
  },
  {
    pergunta: "Como completo ou altero meu perfil?",
    resposta:
      "Acesse a opção 'Perfil' no menu superior. Lá você poderá atualizar suas informações básicas, como nome de exibição, a sigla da casa espírita em que trabalha, sua cidade, cargo principal e áreas de atuação. Pela mesma tela, é possível alterar sua senha de acesso ou efetuar a exclusão definitiva da conta.",
  },
  {
    pergunta: "Como adiciono ou mudo meu cargo e casa espírita?",
    resposta:
      "Ao preencher o perfil no primeiro acesso, você informa sua Casa Espírita e seu cargo. Se precisar mudar de casa ou redefinir seu papel doutrinário depois, faça-o pela tela de Perfil. Contudo, se o Presidente de sua casa já tiver validado e fixado as permissões de cargo para seu usuário, certas edições administrativas de privilégios precisarão ser solicitadas diretamente a ele.",
  },
  {
    pergunta: "Como funciona a Área de Músicas e Cifras?",
    resposta:
      "Este módulo unificado permite que os músicos e membros acessem cifras de músicas espíritas tradicionais e ouçam faixas. Ele é composto por duas abas interativas: 'Playlists & Músicas' (para uploads de arquivos, playlists e áudio ambiente de harmonização) e 'Letras & Cifras' (com buscador de acordes e transposição dinâmica).",
  },
  {
    pergunta: "Como funciona a transposição de acordes nas cifras?",
    resposta:
      "Na aba 'Letras & Cifras' da Área de Músicas, selecione uma música. Você verá botões '+1 tom' e '-1 tom'. Ao clicar neles, o sistema analisa os acordes demarcados em colchetes (ex: [C], [G7], [Am]) e recalcula as notas seguindo a escala cromática em tempo real, transpondo toda a cifra instantaneamente de acordo com a sua preferência vocal ou de instrumento.",
  },
  {
    pergunta: "Onde os meus arquivos de áudio enviados ficam salvos?",
    resposta:
      "Para evitar limites de upload em servidores e garantir total controle do seu próprio dispositivo, os áudios locais e as playlists criadas são persistidos no navegador do usuário utilizando a tecnologia **IndexedDB**. Trata-se de um banco de dados interno e seguro no seu dispositivo. Caso você limpe os dados do navegador (cookies e dados de sites), essas faixas locais e playlists precisarão ser recarregadas.",
  },
  {
    pergunta: "Por que devo aceitar o Termo de Autorização Fraterno ao enviar músicas?",
    resposta:
      "O Apoio Espírita preza pela integridade legal e moral das obras divulgadas. Ao enviar um áudio pessoal à sua biblioteca, o músico participante declara que possui os direitos da gravação e assina o termo de aceite confirmando que autoriza a reprodução e propagação gratuita da música dentro do portal, renunciando de forma definitiva a cobranças de direitos autorais ou compensações financeiras de qualquer espécie, agora ou no futuro.",
  },
  {
    pergunta: "O que são as faixas ambientes sintetizadas?",
    resposta:
      "Na Área de Músicas, disponibilizamos faixas geradas em tempo real via sintetizador digital interno (Web Audio API), como a 'Harmonia das Virtudes' e a 'Prece de Luz'. Elas não necessitam de downloads de áudio por utilizarem frequências sonoras relaxantes e ondas senoidais geradas matematicamente pelo próprio navegador. São ideais para uso durante o Passe, preces iniciais ou momentos silenciosos de harmonização da reunião.",
  },
  {
    pergunta: "Como crio playlists personalizadas?",
    resposta:
      "Acesse a aba 'Playlists & Músicas' e clique no botão 'Nova Playlist'. Digite um título inspirador e confirme. Depois, nas músicas listadas nas tabelas de áudios (sejam as faixas sintetizadas padrão ou os arquivos locais que você subiu), clique no ícone '+' (adicionar à playlist) e escolha qual das suas listas deseja associá-la. Elas persistirão localmente no seu aparelho.",
  },
  {
    pergunta: "Como jogo o 'Caminho da Luz'?",
    resposta:
      "Este é um jogo de tabuleiro virtual sobre virtudes morais e conhecimento espírita. Você pode jogar individualmente (1 jogador) ou em turnos alternados contra um companheiro (2 jogadores). Cada jogador escolhe seu nome, cor e avatar. O objetivo é avançar no tabuleiro sinuoso respondendo a perguntas baseadas nos livros da codificação espírita e na moral cristã. Acertos fazem o peão se deslocar fisicamente pela trilha; erros mantêm o jogador na mesma casa. Ao final do percurso, há uma tela especial de celebração da vitória.",
  },
  {
    pergunta: "Quais outros jogos educativos estão disponíveis?",
    resposta:
      "Além do Caminho da Luz, temos: \n- **Plante a Semente**: Um jogo estilo forca onde, ao acertar letras de palavras doutrinárias, a semente cresce até revelar o significado e referência do termo.\n- **Caça-Palavras**: Encontre conceitos e nomes chaves da literatura espírita ocultos no tabuleiro de letras.\n- **Semeador de Mensagens**: Crie belos cartões com trechos do Evangelho e doações de amor para compartilhar.\n- **Jogo da Memória**: Associe conceitos e ilustrações doutrinárias correspondentes.\n- **Quiz Espírita**: Desafios de perguntas diretas com contagem de pontos e feedback educativo.",
  },
  {
    pergunta: "Como funciona a Ficha de Atendimento Fraterno?",
    resposta:
      "Trata-se de um formulário de registro confidencial destinado à assistência espiritual. Somente o Presidente da casa e o Coordenador específico do Atendimento Fraterno possuem autoridade de acesso para visualizar e preencher as fichas de acolhidos. As informações de aconselhamento e passes são armazenadas com criptografia para resguardar a intimidade do atendido.",
  },
  {
    pergunta: "Como funciona a Carona Solidária?",
    resposta:
      "Um recurso de auxílio mútuo no qual membros que possuem veículo e vão ao centro espírita disponibilizam vagas para dar carona aos tarefeiros e frequentadores que necessitam de transporte. É uma ferramenta de segurança e fraternidade, permitindo visualizar quem oferece a carona, o itinerário, os horários e o número de assentos disponíveis.",
  },
  {
    pergunta: "Como funciona o Bazar On-line e a Entrega Solidária?",
    resposta:
      "O Bazar permite o cadastro de livros espíritas, vestuários e artesanatos arrecadados pela comunidade para fins de doação. As pessoas interessadas reservam os itens e efetuam a doação diretamente via PIX para a chave do centro. A **Entrega Solidária** é um grupo de voluntários cadastrados que se oferecem para realizar as entregas físicas das mercadorias na residência dos compradores que possuem dificuldades de locomoção.",
  },
  {
    pergunta: "Quem tem acesso à Tesouraria e quais recursos ela oferece?",
    resposta:
      "O módulo de Tesouraria é de acesso exclusivo para o Presidente e para os membros com cargo configurado como Tesoureiro. Ele oferece lançamentos rápidos de fluxo de caixa (receitas de bazar/doações e despesas gerais), balanços de saldo em tempo real, visualização de gráficos e relatórios mensais formatados para impressão ou exportação em planilhas Excel (.xlsx).",
  },
  {
    pergunta: "Como funciona a Agenda e o Caderno de Presença Digital?",
    resposta:
      "A coordenação cria eventos (palestras, grupos de estudo, reuniões de assistência). Os membros podem confirmar presença previamente pelo sistema. Ao chegar na reunião, o tarefeiro registra sua frequência com um clique no celular. A coordenação pode visualizar o percentual de frequência consolidado para avaliação pedagógica e assiduidade dos trabalhadores.",
  },
  {
    pergunta: "Como funciona a escala de trabalho de tarefeiros?",
    resposta:
      "Os coordenadores e a presidência podem criar escalas eletrônicas de serviço (recepção, palestrantes do dia, aplicadores de passe, leitura de mensagens). Cada trabalhador cadastrado recebe um aviso sobre seus dias de plantão e tarefas escaladas diretamente em seu painel pessoal de entrada.",
  },
  {
    pergunta: "Como leio livros pelo site e faço pesquisas no leitor de PDF?",
    resposta:
      "Na seção 'Biblioteca', você encontra a aba 'Obras & Livros' (psicografias consagradas de Chico Xavier) e 'Orientações FEB'. Ao selecionar um livro e clicar em 'Ler aqui', o sistema abrirá o leitor inteligente de PDF integrado. Nele, você pode ajustar o nível de zoom, digitar palavras chaves no campo de busca (pressionando Enter para destacar as linhas no texto) e navegar rapidamente entre as páginas.",
  },
  {
    pergunta: "O site tem aplicativo na App Store ou Google Play?",
    resposta:
      "Não, e não é preciso: o próprio site se instala como aplicativo, direto do navegador, sem passar por loja nenhuma e sem ocupar o espaço de um aplicativo comum. Depois de instalado, ele ganha ícone na tela do celular e abre em tela cheia, sem a barra de endereço. No Android (Chrome): 1) abra o site e faça login; 2) no menu superior, clique em 'Ajuda'; 3) clique em 'Instalar aplicativo' — essa opção só aparece quando o navegador permite a instalação e some depois que o site já está instalado; 4) confirme na janela do navegador. Se preferir, o próprio Chrome também oferece 'Instalar aplicativo' no menu de três pontos. No iPhone e no iPad (Safari): a Apple não permite que o site faça a instalação sozinho, então o caminho é manual: 1) abra o site no Safari; 2) toque no botão Compartilhar, o quadrado com a seta para cima, na barra de baixo; 3) role a lista e toque em 'Adicionar à Tela de Início'; 4) confirme em 'Adicionar'. Em qualquer um dos dois, o ícone aparece junto com os demais aplicativos do aparelho.",
  },
  {
    pergunta: "Como uso a busca do site?",
    resposta:
      "Passo a passo: 1) Clique na lupa, no canto direito do menu superior — no celular ela fica ao lado do botão de menu. 2) Escreva pelo menos duas letras do que procura. 3) Os resultados aparecem sozinhos enquanto você digita, separados em quatro grupos: 'No site' (as telas da plataforma, para quem não lembra onde fica cada coisa), 'Artigos', 'Casas espíritas' e 'Membros da sua casa'. 4) Clique no resultado para abrir. A busca não diferencia acento nem maiúscula: 'espirita', 'Espírita' e 'ESPÍRITA' encontram o mesmo. Você pode buscar pelo nome da casa, pela sigla ou pela cidade. Duas observações sobre o que aparece: as casas que ainda não publicaram página no site são mostradas com a marcação 'sem página no site' e não abrem, porque não há página para abrir; e a busca de membros mostra apenas quem pertence à sua própria casa espírita, que é a mesma regra de privacidade já aplicada no resto da plataforma — ninguém passa a enxergar quem não enxergava antes.",
  },
  {
    pergunta: "O site funciona sem internet?",
    resposta:
      "Em parte. As telas do site precisam de conexão para carregar, porque o conteúdo é sempre buscado atualizado — uma página guardada no aparelho poderia mostrar informação vencida ou de outra pessoa que usou o mesmo celular. O que fica guardado no aparelho são os arquivos de funcionamento do site, e por isso ele abre bem mais rápido a partir da segunda visita e aguenta melhor uma internet fraca. Se a conexão cair no meio do uso, aparece um aviso explicando o que houve, com um botão para tentar de novo, em vez da tela de erro do navegador. Nada do que você já enviou se perde nessa situação.",
  },
  {
    pergunta: "Como funciona a fila da Mensagem do Dia?",
    resposta:
      "Os trabalhadores autorizados podem redigir mensagens edificantes de autores espirituais ou trechos do Evangelho e agendá-las para exibição. O sistema organiza essas mensagens em uma fila cronológica. Ao acessar a página principal, os membros do portal verão a mensagem selecionada para o dia corrente no topo de suas telas, acompanhada da devida citação e autoria.",
  },
  {
    pergunta: "O que é o Mural de Avisos?",
    resposta:
      "É o painel de recados digital de cada casa espírita. Coordenadores e presidentes o utilizam para divulgar comunicados importantes de última hora (ex: recesso de feriados, campanhas do agasalho, reuniões gerais de tarefeiros). Esses avisos aparecem em destaque na tela inicial de todos os membros vinculados àquela respectiva casa assim que eles se conectam.",
  },
  {
    pergunta: "Como funciona o Plantão de Orações?",
    resposta:
      "É uma agenda virtual onde os membros e trabalhadores se voluntariam para realizar vibrações e preces em horários específicos da semana na comodidade de seus lares, criando uma corrente contínua de pensamentos elevados e amparo invisível voltado aos necessitados da casa e do mundo.",
  },
  {
    pergunta: "O site realiza gravação ou repasse de transações financeiras?",
    resposta:
      "Não. O site não coleta, não processa e não retém nenhuma transação monetária. Para aquisições no Bazar Solidário ou doações, o sistema simplesmente exibe as chaves PIX ou QR Codes informados pela própria administração de cada Casa Espírita. O acerto e transferência financeira ocorrem fora da plataforma, diretamente no aplicativo bancário de escolha do doador.",
  },
  {
    pergunta: "Como faço para reportar um problema no site?",
    resposta:
      "Se encontrar alguma lentidão, bug ou página que não carrega, role qualquer página até o rodapé e clique em 'Reportar problema'. Uma tela se abrirá permitindo que você descreva o erro. Esse relatório será enviado diretamente por e-mail para a equipe de desenvolvimento. Opcionalmente, você poderá abrir um link para enviar o relato pelo WhatsApp.",
  },
  {
    pergunta: "Como posso enviar sugestões de melhoria?",
    resposta:
      "Suas sugestões e ideias de novos recursos são muito bem-vindas! Você pode registrá-las de forma rápida clicando no link 'Sugestões' no rodapé de qualquer página (ou acessando diretamente `/sugestoes`). O formulário é simplificado e pode ser preenchido até mesmo sem realizar login no sistema.",
  },
  {
    pergunta: "O que é a página pública da casa espírita?",
    resposta:
      "Cada casa cadastrada tem uma página no endereço apoioespirita.com.br/casa/SIGLA. Por padrão ela é privada: só quem tem conta e pertence à casa consegue vê-la. A direção pode optar por torná-la pública, e então qualquer pessoa passa a encontrá-la, inclusive pelo Google. A finalidade é acolhimento: quem procura um centro espírita na sua cidade encontra o endereço, os horários das atividades e como entrar em contato, sem precisar criar conta nenhuma.",
  },
  {
    pergunta: "O que exatamente aparece quando a página da casa é publicada?",
    resposta:
      "Aparece apenas o que serve para alguém de fora conhecer e visitar a casa: nome, descrição, missão, ano de fundação, endereço completo, telefone, e-mail de contato, site e a grade de horários das atividades. NADA MAIS. Permanecem invisíveis, mesmo com a página publicada: o mural de publicações, a lista de tarefeiros e seus cargos, a agenda interna, o quadro de projetos (Kanban), a tesouraria e qualquer informação sobre os membros. Essas áreas continuam exigindo login e vínculo com a casa, e são protegidas no próprio banco de dados — não apenas escondidas na tela.",
  },
  {
    pergunta: "O que o visitante encontra ao abrir a página publicada da casa?",
    resposta:
      "Ele chega direto ao essencial, sem precisar de conta. No alto, o nome da casa, a cidade e — se preenchidos — a descrição e a missão. Logo abaixo vem o bloco 'Como chegar e falar', que reúne o endereço com um atalho para traçar a rota no mapa e os contatos da casa: tocar no telefone abre a discagem, tocar no e-mail abre a mensagem, tocar no site abre o site. Em seguida há duas abas: 'Atividades', com os dias e horários das reuniões, e 'Doações', com o convite a contribuir. Cada informação só aparece se a casa tiver preenchido o campo correspondente; nada é inventado. Se a casa ainda não divulgou endereço nem contato, o bloco diz isso com franqueza e oferece um caminho para quem faz parte dela entrar e completar a página. As contagens de membros e de eventos não são exibidas ao visitante.",
  },
  {
    pergunta: "A chave PIX da casa fica visível para o público?",
    resposta:
      "Não, e isso é proposital. Quando um visitante sem login abre a aba Doações de uma casa publicada, ele vê apenas o convite a contribuir e a orientação de falar com a casa pelos contatos. A chave PIX e o QR Code só aparecem para quem está logado. O motivo é proteger a casa: chave PIX exposta publicamente é alvo comum de golpe, em que alguém copia a página e troca a chave pela própria, desviando as doações de quem quer ajudar.",
  },
  {
    pergunta: "Como a direção publica ou despublica a página da casa?",
    resposta:
      "Passo a passo: 1) Abra a página da casa, em apoioespirita.com.br/casa/SIGLA. 2) Clique no botão 'Administrar', no alto da página. 3) Abra a aba 'Configurações'. 4) Desça até o bloco 'Visibilidade da página'. 5) Confira a lista 'O que o visitante vai encontrar': cada item com sinal verde de conferido já aparece para quem chega; cada item com ponto laranja diz o que ainda falta e em que lugar preencher. 6) Clique em 'Publicar página'. 7) Leia o aviso que se abre — se algum item estiver faltando, ele nomeia quais — e confirme. Para despublicar, o caminho é o mesmo: o botão passa a dizer 'Tornar privada'. Toda página nova nasce PRIVADA — nenhuma casa é exposta sem que alguém da direção decida por isso. Publicar e despublicar são reversíveis a qualquer momento: ao despublicar, a página volta a exigir login imediatamente e sai do índice do site. Apenas Presidente, Vice-presidente ou um administrador nomeado da casa podem alterar isso; membros comuns não têm acesso a essa configuração, nem à edição do conteúdo da página.",
  },
  {
    pergunta: "Publicar a página da casa é seguro? Que cuidados devo ter?",
    resposta:
      "É seguro no que diz respeito aos dados dos membros: nenhuma informação pessoal de quem frequenta a casa fica visível, em nenhuma hipótese. O que se torna público é a informação institucional que uma casa espírita normalmente já divulga: onde fica, quando abre e como falar com ela. Ainda assim, dois cuidados valem: primeiro, a decisão deve partir da direção da casa, não de um membro isolado; segundo, publique com a página preenchida. O próprio sistema ajuda nisso: no bloco 'Visibilidade da página' há uma conferência do que o visitante vai encontrar — nome, descrição, endereço, um contato e os horários — apontando o que falta e onde preencher, e o aviso de confirmação repete a lista antes de publicar. Nada disso impede publicar com a página incompleta; a decisão continua sendo da direção. Mas uma página vazia indexada no Google passa má impressão a quem chega. Casas sem nome preenchido, aliás, não entram no índice de buscas justamente por isso.",
  },
  {
    pergunta: "Como funciona o processo de exclusão da minha conta?",
    resposta:
      "Sua privacidade é nossa prioridade. Se decidir não utilizar mais a plataforma, vá em 'Perfil', desça até o rodapé da página e clique no botão de exclusão permanente. O sistema removerá imediatamente todas as suas informações pessoais, vínculos com a casa espírita e preferências do banco de dados principal. Essa ação é irreversível.",
  },
  {
    pergunta: "O que são os artigos da comunidade?",
    resposta:
      "É um espaço de publicação aberto a toda a comunidade: qualquer usuário com e-mail confirmado pode escrever e assinar um artigo espírita com o próprio nome e a casa a que pertence. Os artigos são públicos — qualquer pessoa os lê, mesmo sem conta no site — e aparecem em buscadores como o Google, o que ajuda quem procura conteúdo espírita a encontrar o Apoio Espírita. Depois de publicado, o próprio artigo é avaliado pelos leitores, que podem elogiá-lo ou apontar erros nele.",
  },
  {
    pergunta: "Como publico um artigo?",
    resposta:
      "Passo a passo: 1) Faça login. 2) No menu superior, clique em 'Artigos'. 3) Clique no botão 'Escrever artigo'. 4) Preencha o título, o resumo (opcional — aparece na lista de artigos) e o conteúdo do texto. 5) Clique em 'Publicar artigo'. O artigo entra no ar imediatamente, sem espera por aprovação de ninguém. Publicar exige e-mail confirmado: se você ainda não confirmou o seu, a tela avisa e pede que você procure a mensagem de confirmação enviada quando criou a conta e clique no link dela. Sem confirmar o e-mail, não é possível publicar artigos nem avaliar os de outras pessoas.",
  },
  {
    pergunta: "O que significa cada opção de avaliação?",
    resposta:
      "Ao ler um artigo, você registra uma entre seis avaliações, uma por pessoa por artigo (é possível trocar o seu voto depois, se mudar de ideia). 'Ótimo', 'Bom' e 'Gostei' são elogios, em ordem decrescente de entusiasmo, e contam a favor do artigo, ajudando a protegê-lo de uma retirada. 'Não gostei' registra que você não concordou com o texto ou não gostou dele, o que é diferente de apontar um erro: essa opção NÃO retira o artigo do ar e nunca conta para isso, porque o Espiritismo tem divergência legítima de interpretação — discordar de uma leitura não é o mesmo que apontar um erro de fato, e se a discordância derrubasse artigos, o mecanismo estaria punindo a opinião minoritária, não a informação falsa. 'Tem erro' serve para um problema pontual, como uma data errada, um nome trocado ou uma citação imprecisa; avisa o autor para corrigir, mas sozinha não retira o artigo do ar. 'Tem erro grave' é para um problema sério, como uma informação falsa ou distorcida sobre a doutrina; é a única avaliação que pode levar à retirada do artigo (veja 'Quando um artigo sai do ar?'). Para 'Tem erro' e 'Tem erro grave', é obrigatório escrever qual é o erro, e o seu nome fica visível para o autor do artigo junto com essa observação — pense nisso antes de marcar, não depois.",
  },
  {
    pergunta: "Por que preciso escrever qual é o erro?",
    resposta:
      "Porque uma marcação sem explicação não ajuda ninguém: o autor não sabe o que corrigir, e quem for revisar o caso não tem como julgar se o apontamento procede. Escrever ao menos uma frase também funciona como um filtro natural contra marcações por impulso — é fácil clicar em um botão, mais raro escrever uma justificativa infundada. Por isso o sistema não aceita registrar 'Tem erro' ou 'Tem erro grave' sem uma descrição de pelo menos 10 caracteres. Lembre-se de que essa descrição é lida pelo autor do artigo junto com o seu nome: escreva como faria se estivesse falando diretamente com a pessoa.",
  },
  {
    pergunta: "Quando um artigo sai do ar?",
    resposta:
      "Um artigo publicado sai do ar sozinho quando duas condições valem ao mesmo tempo: 1) o número de avaliações 'Tem erro grave' chega a um piso mínimo, e 2) esse número é maior do que a soma de 'Ótimo' mais 'Bom' mais 'Gostei'. O piso é o maior valor entre 3 e 20% dos usuários do site com e-mail confirmado, arredondado para cima. Na prática, isso significa que, numa comunidade pequena — a de hoje, por exemplo —, bastam as três primeiras marcações de 'Tem erro grave' para retirar um artigo recém-publicado, mesmo antes de qualquer elogio ter sido registrado: o piso de 3 é sempre o mínimo, não importa quantas pessoas confirmaram o e-mail. Em comunidades maiores, o piso cresce de forma proporcional: com 9 ou com 15 usuários confirmados, o piso é 3; com 50, é 10; com 100, é 20. A retirada é automática e imediata, no mesmo instante em que o voto que cruza o limite é registrado — e, a partir daí, um revisor humano pode restaurar o artigo se concluir que a retirada não procedia. Além dessas duas condições, o administrador do site ou o Presidente/Vice-presidente da casa do autor também podem retirar um artigo do ar a qualquer momento, por decisão direta. Em nenhum dos dois casos a votação suspende ou bane o autor: ela só tira o texto do ar (veja 'Quem pode suspender ou banir um autor?').",
  },
  {
    pergunta: "Meu artigo foi retirado. E agora?",
    resposta:
      "Você não recebe nenhuma notificação — nem e-mail, nem aviso na tela — quando um artigo seu é retirado. Para saber o que houve, acesse 'Artigos' no menu e depois 'Meus artigos'. Ali, cada artigo retirado ou em correção mostra o motivo da retirada e a lista dos erros apontados, cada um com a descrição escrita por quem avaliou. A partir dessa tela, clique em 'Corrigir este artigo', ajuste o texto de acordo com o que foi apontado e reenvie. O artigo não volta ao ar sozinho: o reenvio entra numa fila de revisão, e só um revisor humano pode restaurá-lo à publicação.",
  },
  {
    pergunta: "Quem pode suspender ou banir um autor?",
    resposta:
      "Ninguém é suspenso ou banido automaticamente pela votação da comunidade — ela apenas retira o artigo do ar, nunca a pessoa. Suspender ou banir um autor é sempre uma decisão humana, tomada a partir da fila de revisão, e só duas autoridades podem tomá-la: o administrador do site ou o Presidente (ou Vice-presidente) da casa espírita a que o autor pertence. Enquanto isso não acontece, o autor continua podendo usar o site normalmente; o que muda é que os artigos com erro grave reconhecido ficam fora do ar até serem corrigidos e revisados.",
  },
  {
    pergunta: "Por que o site recusou o meu texto por causa de uma palavra?",
    resposta:
      "Todo texto que outras pessoas vão ler passa por um filtro automático de linguagem antes de ser gravado: artigos, Mensagem do Dia, publicações no mural da casa, sugestões e solicitações de desenvolvimento. Se o filtro encontrar um palavrão ou um xingamento, o envio é interrompido e a tela mostra exatamente qual palavra precisa ser reescrita — o seu texto não é perdido nem alterado, basta corrigir o trecho e enviar de novo. O filtro reconhece as formas disfarçadas da mesma palavra: com ou sem acento, com letra repetida, com número no lugar de letra e com ponto entre as letras. Ele compara palavras inteiras, e não pedaços, justamente para nunca barrar uma palavra correta que apenas contenha o trecho — 'cuidado' e 'porão', por exemplo, passam normalmente. O filtro cobre os palavrões e xingamentos mais comuns; ele não julga o tom nem a intenção do texto, e por isso não substitui a avaliação dos leitores nem a moderação humana.",
  },
  {
    pergunta: "Como funciona o voto nos itens pendentes do projeto?",
    resposta:
      "Passo a passo: 1) No menu superior, abra 'Ajuda' e clique em 'Status do Projeto'. 2) Percorra a lista de itens pendentes — ela já vem ordenada pelos mais votados. 3) Clique no botão com o polegar, à direita do item que você considera mais importante. O número ao lado do polegar sobe e o botão fica destacado, indicando que o seu voto foi registrado. 4) Se mudar de ideia, clique de novo no mesmo botão: a sua curtida é retirada e o número volta a baixar. Cada membro tem um voto por item, e pode votar em quantos itens quiser. Os itens mais votados são desenvolvidos primeiro. Os cartões de recursos da tela inicial e da página da casa também aceitam voto: os que aparecem como 'Em breve' registram a sua curtida quando você clica no cartão, e o voto é o mesmo item do Status do Projeto.",
  },
  {
    pergunta: "A Mensagem do Dia está cortada. Como leio o texto inteiro?",
    resposta:
      "O bloco da Mensagem do Dia mostra as duas primeiras linhas do texto para não ocupar a tela inteira e deixar o restante do painel visível sem rolagem. Quando a mensagem é mais longa do que isso, aparece o botão 'Ler tudo' logo abaixo dela, ao lado do nome de quem enviou: clique nele para abrir o texto completo e em 'Recolher' para fechar de novo. Na mesma linha do título ficam os atalhos 'Enviar', para mandar uma mensagem para a fila da sua casa, e 'Ver fila', para acompanhar as mensagens já agendadas.",
  },
  {
    pergunta: "Artigo retirado some do Google?",
    resposta:
      "Sim, mas não instantaneamente, e isso está fora do nosso controle. Assim que um artigo é retirado, ele sai do mapa do site (sitemap) e o endereço dele passa a mostrar um aviso de que o texto não está mais disponível, em vez do conteúdo original. A saída de fato do índice de um buscador, porém, depende de o buscador visitar aquele endereço de novo — o que não é instantâneo —, e cópias já guardadas em cache podem continuar aparecendo por alguns dias depois da retirada. Não há como garantir remoção imediata em nenhum buscador.",
  },
];

function Ajuda() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [busca, setBusca] = useState("");
  const [faqAberto, setFaqAberto] = useState<Set<number>>(new Set());

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
    ) {
      navigate({ to: "/completar-perfil" });
    }
  }, [user, profile, loading, navigate]);

  if (loading || !user) return null;

  const termo = busca.trim().toLowerCase();
  const filteredFaq = termo
    ? FAQ.filter(
        (f) => f.pergunta.toLowerCase().includes(termo) || f.resposta.toLowerCase().includes(termo),
      )
    : FAQ;

  const toggleFaq = (i: number) => {
    setFaqAberto((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <main className="page-light min-h-screen px-6 pt-20 pb-20">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-12 flex-wrap gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-glow mb-2">Suporte</p>
            <h1 className="text-3xl font-light text-foreground">Central de Ajuda</h1>
            <p className="mt-2 text-sm text-muted-foreground font-light">
              Dúvidas sobre como usar o site e seus recursos.
            </p>
          </div>
          <button
            onClick={() => navigate({ to: "/inicio" })}
            className="text-xs uppercase tracking-widest text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            ← Voltar
          </button>
        </div>

        {/* Busca */}
        <div className="relative mb-6">
          <Search
            size={15}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Buscar nas perguntas frequentes…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full rounded-xl bg-white/5 border border-white/10 pl-10 pr-10 py-3 text-sm text-foreground placeholder-muted-foreground/40 focus:outline-none focus:border-cyan-glow/40 transition-colors"
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

        {termo && (
          <p className="text-xs text-muted-foreground/50 mb-6 -mt-2">
            {filteredFaq.length === 0
              ? "Nenhum resultado encontrado."
              : `${filteredFaq.length} resultado${filteredFaq.length > 1 ? "s" : ""} encontrado${filteredFaq.length > 1 ? "s" : ""}.`}
          </p>
        )}

        {/* FAQ */}
        {filteredFaq.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xs uppercase tracking-[0.3em] text-muted-foreground/60 mb-3">
              Perguntas frequentes
            </h2>
            <div className="space-y-2">
              {filteredFaq.map((faq) => {
                const idx = FAQ.indexOf(faq);
                const aberto = faqAberto.has(idx);
                return (
                  <div key={idx} className="glass rounded-2xl overflow-hidden">
                    <button
                      onClick={() => toggleFaq(idx)}
                      className="w-full flex items-center justify-between px-5 py-4 text-left gap-4"
                    >
                      <span className="text-sm text-foreground font-light">{faq.pergunta}</span>
                      <ChevronDown
                        size={15}
                        strokeWidth={2}
                        className={`shrink-0 text-muted-foreground/40 transition-transform duration-200 ${aberto ? "rotate-180" : ""}`}
                      />
                    </button>
                    {aberto && (
                      <div className="px-5 pb-4">
                        <p className="text-sm text-muted-foreground/70 font-light leading-relaxed border-t border-white/5 pt-3">
                          {faq.resposta}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Links rápidos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          <Link
            to="/sugestoes"
            className="glass rounded-2xl p-4 flex items-center gap-3 hover:border-cyan-glow/40 transition-all duration-300 hover:-translate-y-0.5"
          >
            <MessageSquare size={18} strokeWidth={1.5} className="text-cyan-glow shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Enviar uma sugestão</p>
              <p className="text-xs text-muted-foreground/60 font-light">Ajude a melhorar o site</p>
            </div>
          </Link>
          <Link
            to="/painel"
            className="glass rounded-2xl p-4 flex items-center gap-3 hover:border-cyan-glow/40 transition-all duration-300 hover:-translate-y-0.5"
          >
            <Flag size={18} strokeWidth={1.5} className="text-amber-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Acompanhar o projeto</p>
              <p className="text-xs text-muted-foreground/60 font-light">
                O que foi feito e o que vem por aí
              </p>
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}
