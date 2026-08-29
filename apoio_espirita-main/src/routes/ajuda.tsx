import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronDown, Search, X, MessageSquare, Flag, BookOpen, MapPin } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { MANUAL, GRUPOS_DO_MANUAL, filtrarManual } from "@/data/manual";

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
      "É a área mais fechada do site. Quem lê: o membro com cargo de Atendente fraterno ou de Coordenador da casa, mais quem a direção autorizar pelo nome. A presidência não entra pelo cargo, e o desenvolvedor da plataforma foi excluído de propósito — suporte técnico não é motivo para ler o relato de ninguém. Cada abertura de ficha fica registrada com o nome de quem abriu e a data, e esse registro não pode ser apagado por ninguém. O passo a passo para registrar, consultar e autorizar está no Manual.",
  },
  {
    pergunta: "Como funciona a Carona Solidária?",
    resposta:
      "Membros oferecem vagas no carro para quem precisa chegar à casa espírita, e quem precisa pede vaga. O contato de cada um fica guardado e só é liberado depois do aceite do motorista — antes disso, a conversa acontece dentro da plataforma. As vagas são controladas pelo próprio sistema: quando a última é ocupada, a carona deixa de aceitar novos aceites. O passo a passo está no Manual.",
  },
  {
    pergunta: "Como funciona o Bazar On-line e a Entrega Solidária?",
    resposta:
      "O bazar é a vitrine de itens da casa, com pagamento por PIX; a entrega solidária é o voluntário que leva o item até quem não pode buscar. O dinheiro nunca passa pela plataforma: o pagamento vai direto para a chave de quem anuncia, e o site não recebe, não retém e não cobra nada. O contato só é liberado depois do aceite, e o endereço completo da entrega é combinado entre as duas pessoas — nunca fica publicado. O passo a passo está no Manual.",
  },
  {
    pergunta: "Como funciona o Fórum de Apoio?",
    resposta:
      "É o espaço de conversa entre membros, separado em quatro assuntos: Dúvida, Acolhimento, Estudo e Testemunho. Quem abriu o tópico pode marcá-lo como resolvido, e quem administra a página da casa pode fixar um tópico no topo e remover mensagem imprópria. O passo a passo está no Manual.",
  },
  {
    pergunta: "Como funciona a Comunicação em Grupos?",
    resposta:
      "São grupos de conversa por frente de trabalho, dentro da própria plataforma — ninguém precisa dar o telefone para participar. Um grupo fechado nem aparece na lista para quem não é membro. As mensagens chegam na hora, sem recarregar a página. O passo a passo está no Manual.",
  },
  {
    pergunta: "Como funciona a Localização de Voluntariado?",
    resposta:
      "Ela cruza o que a casa precisa com o que cada membro sabe fazer. A lista de habilidades é fechada de propósito: se cada um escrevesse com as próprias palavras, 'pedreiro' e 'alvenaria' nunca se encontrariam e o cruzamento não acharia ninguém. Cada pedido mostra quantos voluntários têm afinidade e quais habilidades combinaram. O passo a passo está no Manual.",
  },
  {
    pergunta: "Como funcionam os Aniversariantes do Mês?",
    resposta:
      "É o calendário de aniversários da sua casa. Guardamos apenas o dia e o mês, nunca o ano — a idade de ninguém é necessária para uma lembrança, e o que não é guardado não vaza. Preencher é o próprio consentimento de aparecer: quem não quiser constar simplesmente deixa em branco. O passo a passo está no Manual.",
  },
  {
    pergunta: "O que é a Área de Jovens Espíritas?",
    resposta:
      "É o espaço da juventude da casa. Entrar é decisão de cada um: a plataforma não pergunta a idade de ninguém. Quem não entrou na área lê tudo o que a juventude publica, mas não publica — é o que faz a área ser da juventude, e não mais um mural. O passo a passo está no Manual.",
  },
  {
    pergunta: "Quem enxerga o que eu publico na área de Comunidade?",
    resposta:
      "Tudo o que se publica no Fórum, nos Grupos, no Bazar, nas Caronas, nas Entregas, no Voluntariado, no Plantão de Orações e na Área de Jovens nasce restrito aos membros da sua casa espírita. Em cada formulário existe a escolha 'Quem enxerga', com duas opções: 'Somente a minha casa', que é a padrão, e 'Todas as casas', que permite a membros de qualquer casa espírita ler e participar — útil para caronas entre cidades vizinhas, bazares e pedidos de ajuda que uma casa sozinha não consegue atender. Essa regra é aplicada pelo próprio banco de dados, não apenas pela tela: quem não deveria ver, não recebe o dado nem alterando o navegador. Três informações têm proteção ainda maior: o telefone de quem oferece carona, de quem anuncia no bazar e de quem pede ou assume uma entrega. Eles ficam guardados separadamente e só são liberados depois do aceite — antes disso, a conversa acontece dentro da plataforma. As fichas de atendimento fraterno seguem regra própria e mais estrita, descrita na pergunta específica.",
  },
  {
    pergunta: "Que e-mails o site me manda, e como paro de receber?",
    resposta:
      "O site avisa por e-mail o que acontece com o que é seu, e só isso — não há propaganda, e o seu endereço não é passado a ninguém. Chegam por padrão os avisos sobre o que é seu (interesse no seu item, pedido de vaga na sua carona, oferta de ajuda, entrega assumida e as respostas de quem você procurou). Nascem desligados os que falam da casa e não de você. Um aviso nunca é enviado duas vezes, e só chega a quem confirmou o próprio e-mail. Para escolher o que recebe, o passo a passo está no Manual — e o mesmo endereço aparece no rodapé de todo e-mail enviado pelo site.",
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
      "É o quadro de recados da sua casa espírita, na aba 'Mural' da página da casa. Todos os membros leem; quem chega de fora, sem login, não vê o mural. Publicam Presidente, Vice-presidente ou administrador nomeado. O aviso não tem data de validade: fica no mural até alguém apagá-lo. O passo a passo está no Manual.",
  },
  {
    pergunta: "Como funciona o Plantão de Orações?",
    resposta:
      "É uma grade semanal fixa: o horário se repete toda semana, e cada pessoa se inscreve naquele em que pode orar. Quando um horário com limite de vagas se esgota, o botão passa a mostrar 'Sem vagas' — a conferência é feita pelo próprio banco de dados, de modo que duas pessoas não ocupam o mesmo último lugar ao clicar ao mesmo tempo. O passo a passo está no Manual.",
  },
  {
    pergunta: "O site realiza gravação ou repasse de transações financeiras?",
    resposta:
      "Não. O site não coleta, não processa e não retém nenhuma transação monetária. Para aquisições no Bazar Solidário ou doações, o sistema simplesmente exibe as chaves PIX ou QR Codes informados pela própria administração de cada Casa Espírita. O acerto e transferência financeira ocorrem fora da plataforma, diretamente no aplicativo bancário de escolha do doador.",
  },
  {
    pergunta: "Como posso enviar sugestões de melhoria?",
    resposta:
      "Há dois caminhos, e eles servem a coisas diferentes. O link 'Sugestões', no rodapé, é privado: não exige login e a mensagem vai direto para o desenvolvedor, que responde por e-mail — ela não fica exposta no site, justamente porque traz o seu nome e o seu e-mail. Já 'Ajuda' › 'Status do Projeto' é público: o que você pedir aparece para todos os membros, com o seu nome e a sua casa, e pode receber votos de quem concordar. O passo a passo dos dois está no Manual.",
  },
  {
    pergunta: "Onde encontro respostas sobre a própria doutrina espírita?",
    resposta:
      "Esta seção de ajuda trata do uso do site. As dúvidas sobre a doutrina ficam em outro lugar: no rodapé de qualquer página, clique em 'Dúvidas sobre a doutrina' — quem tem conta também chega por 'Estudo' › 'Perguntas sobre a doutrina'. Lá estão respondidas as perguntas mais comuns de quem está começando ou atravessando uma perda: o que é o Espiritismo, se é preciso deixar a própria religião, o que acontece depois da morte, reencarnação, por que uma criança morre, o que a doutrina diz sobre o suicídio, o que é mediunidade, o que é obsessão, se as casas espíritas cobram alguma coisa e se orar adianta. Cada resposta traz, ao final, a citação literal da obra de Allan Kardec de onde ela saiu, com a obra e o número da questão ou do item, para você conferir por si mesmo — nenhuma afirmação é apresentada como doutrina sem essa fonte. As páginas são públicas: qualquer pessoa lê, sem conta e sem cadastro, e você pode enviar o endereço a quem estiver precisando.",
  },
  {
    pergunta: "De onde vieram as casas que aparecem nessa lista?",
    resposta:
      "De cadastros públicos de casas espíritas, com nome, endereço, cidade e telefone. Elas estão listadas sem que a direção tenha pedido, e por isso cada casa tem, na própria página da cidade, dois caminhos abertos. O primeiro é assumir a página: quem faz parte da direção cria a conta, informa a sigla da casa e publica a página dela, ganhando descrição, horários, contato e chave PIX. O segundo é sair: logo abaixo do nome da casa há o link 'É da direção desta casa e quer retirá-la desta lista?'. Basta informar o seu nome e um contato, e a casa some da lista na hora — não perguntamos o motivo. Guardamos apenas quem fez o pedido, para poder desfazer caso outra pessoa tenha retirado a casa por engano.",
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
    pergunta: "Publicar a página da casa é seguro? Que cuidados devo ter?",
    resposta:
      "É seguro no que diz respeito aos dados dos membros: nenhuma informação pessoal de quem frequenta a casa fica visível, em nenhuma hipótese. O que se torna público é a informação institucional que uma casa espírita normalmente já divulga: onde fica, quando abre e como falar com ela. Ainda assim, dois cuidados valem: primeiro, a decisão deve partir da direção da casa, não de um membro isolado; segundo, publique com a página preenchida. O próprio sistema ajuda nisso: no bloco 'Visibilidade da página' há uma conferência do que o visitante vai encontrar — nome, descrição, endereço, um contato e os horários — apontando o que falta e onde preencher, e o aviso de confirmação repete a lista antes de publicar. Nada disso impede publicar com a página incompleta; a decisão continua sendo da direção. Mas uma página vazia indexada no Google passa má impressão a quem chega. Casas sem nome preenchido, aliás, não entram no índice de buscas justamente por isso.",
  },
  {
    pergunta: "O que são os artigos da comunidade?",
    resposta:
      "É um espaço de publicação aberto a toda a comunidade: qualquer usuário com e-mail confirmado pode escrever e assinar um artigo espírita com o próprio nome e a casa a que pertence. Os artigos são públicos — qualquer pessoa os lê, mesmo sem conta no site — e aparecem em buscadores como o Google, o que ajuda quem procura conteúdo espírita a encontrar o Apoio Espírita. Depois de publicado, o próprio artigo é avaliado pelos leitores, que podem elogiá-lo ou apontar erros nele.",
  },
  {
    pergunta: "Quem vai ver o meu artigo? Meu nome aparece no Google?",
    resposta:
      "Artigo publicado é público: qualquer pessoa lê, com ou sem conta, e ele pode ser encontrado nos buscadores. Por isso a tela de publicar traz duas escolhas suas, logo acima do botão. A primeira é a assinatura: marcada, o artigo é assinado com o seu nome completo e a sigla da sua casa; desmarcada, ele passa a ser assinado só com o seu primeiro nome. A segunda é a indexação: marcada, o texto pode aparecer no resultado de buscas; desmarcada, ele continua público no site e acessível a quem tem o endereço, mas o site pede aos buscadores que não o listem. As duas nascem marcadas, que é como os artigos sempre funcionaram. Para mudar depois: abra 'Artigos' no menu, clique em 'Meus artigos', escolha o texto e clique em editar — as mesmas duas escolhas estão lá. Uma observação honesta sobre desmarcar a indexação de um artigo que já estava no ar: o pedido é respeitado, mas a saída do resultado das buscas não é instantânea, porque depende de o buscador visitar o endereço de novo, e cópias guardadas em cache podem aparecer por alguns dias.",
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
  const [aba, setAba] = useState<"manual" | "faq">("manual");
  const [faqAberto, setFaqAberto] = useState<Set<number>>(new Set());
  const [moduloAberto, setModuloAberto] = useState<string | null>(null);

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
  const modulos = filtrarManual(busca);

  const toggleFaq = (i: number) => {
    setFaqAberto((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const abaCls = (ativa: boolean) =>
    `flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs uppercase tracking-widest transition-colors ${
      ativa
        ? "bg-cyan-glow/10 text-cyan-glow border border-cyan-glow/40"
        : "text-muted-foreground/60 border border-white/10 hover:text-muted-foreground"
    }`;

  return (
    <main className="page-light min-h-screen px-6 pt-20 pb-20">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-glow mb-2">Suporte</p>
            <h1 className="text-3xl font-light text-foreground">Central de Ajuda</h1>
            <p className="mt-2 text-sm text-muted-foreground font-light">
              O <strong className="font-medium text-foreground">Manual</strong> ensina a fazer,
              passo a passo. As{" "}
              <strong className="font-medium text-foreground">Perguntas frequentes</strong> tiram
              dúvidas rápidas.
            </p>
          </div>
          <button
            onClick={() => navigate({ to: "/inicio" })}
            className="text-xs uppercase tracking-widest text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            ← Voltar
          </button>
        </div>

        {/* Abas */}
        <div className="flex gap-2 mb-5">
          <button onClick={() => setAba("manual")} className={abaCls(aba === "manual")}>
            <BookOpen size={14} strokeWidth={1.8} />
            Manual
          </button>
          <button onClick={() => setAba("faq")} className={abaCls(aba === "faq")}>
            <MessageSquare size={14} strokeWidth={1.8} />
            Perguntas frequentes
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
            placeholder={
              aba === "manual"
                ? "O que você quer fazer? Ex.: projetor, PIX, senha…"
                : "Buscar nas perguntas frequentes…"
            }
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full rounded-xl bg-white/5 border border-white/10 pl-10 pr-10 py-3 text-sm text-foreground placeholder-muted-foreground/40 focus:outline-none focus:border-cyan-glow/40 transition-colors"
          />
          {busca && (
            <button
              onClick={() => setBusca("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
              aria-label="Limpar busca"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* ── MANUAL ───────────────────────────────────────────────────── */}
        {aba === "manual" && (
          <div className="mb-10 space-y-8">
            {modulos.length === 0 && (
              <p className="text-sm text-muted-foreground/60 font-light">
                Nada encontrado no manual. Tente outra palavra, ou veja as perguntas frequentes.
              </p>
            )}
            {GRUPOS_DO_MANUAL.map((grupo) => {
              const doGrupo = modulos.filter((m) => m.grupo === grupo);
              if (doGrupo.length === 0) return null;
              return (
                <section key={grupo}>
                  <h2 className="text-xs uppercase tracking-[0.3em] text-muted-foreground/60 mb-3">
                    {grupo}
                  </h2>
                  <div className="space-y-2">
                    {doGrupo.map((m) => {
                      // Buscou e sobrou pouca coisa: já abre, para a pessoa não
                      // ter de clicar de novo no que ela claramente procurava.
                      const aberto =
                        moduloAberto === m.id || (termo.length >= 2 && modulos.length <= 3);
                      return (
                        <div key={m.id} className="glass rounded-2xl overflow-hidden">
                          <button
                            onClick={() => setModuloAberto(moduloAberto === m.id ? null : m.id)}
                            className="w-full flex items-start justify-between px-5 py-4 text-left gap-4"
                          >
                            <span>
                              <span className="block text-sm text-foreground font-medium">
                                {m.titulo}
                              </span>
                              <span className="block text-xs text-muted-foreground/60 font-light mt-0.5">
                                {m.resumo}
                              </span>
                            </span>
                            <ChevronDown
                              size={15}
                              strokeWidth={2}
                              className={`shrink-0 mt-1 text-muted-foreground/40 transition-transform duration-200 ${aberto ? "rotate-180" : ""}`}
                            />
                          </button>

                          {aberto && (
                            <div className="px-5 pb-5 border-t border-white/5 pt-4 space-y-5">
                              <p className="flex items-start gap-2 text-xs text-muted-foreground/70 font-light">
                                <MapPin
                                  size={13}
                                  strokeWidth={1.8}
                                  className="text-cyan-glow shrink-0 mt-px"
                                />
                                {m.ondeFica}
                              </p>

                              {m.tarefas.map((t) => (
                                <div key={t.titulo}>
                                  <h3 className="text-sm text-foreground font-medium">
                                    {t.titulo}
                                  </h3>
                                  {t.quem && (
                                    <p className="text-[11px] uppercase tracking-widest text-amber-500/80 mt-0.5">
                                      {t.quem}
                                    </p>
                                  )}
                                  <ol className="mt-2 space-y-1.5">
                                    {t.passos.map((passo, i) => (
                                      <li
                                        key={i}
                                        className="flex gap-2.5 text-sm text-muted-foreground/80 font-light leading-relaxed"
                                      >
                                        <span className="shrink-0 w-5 h-5 rounded-full bg-cyan-glow/10 text-cyan-glow text-[11px] font-semibold flex items-center justify-center mt-px">
                                          {i + 1}
                                        </span>
                                        <span>{passo}</span>
                                      </li>
                                    ))}
                                  </ol>
                                </div>
                              ))}

                              {m.observacoes && m.observacoes.length > 0 && (
                                <div className="rounded-xl bg-white/5 border border-white/10 p-3.5">
                                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 mb-1.5">
                                    Bom saber
                                  </p>
                                  <ul className="space-y-1.5">
                                    {m.observacoes.map((o, i) => (
                                      <li
                                        key={i}
                                        className="text-xs text-muted-foreground/70 font-light leading-relaxed"
                                      >
                                        · {o}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {/* ── PERGUNTAS FREQUENTES ─────────────────────────────────────── */}
        {aba === "faq" && (
          <div className="mb-10">
            {termo && (
              <p className="text-xs text-muted-foreground/50 mb-4">
                {filteredFaq.length === 0
                  ? "Nenhum resultado encontrado."
                  : `${filteredFaq.length} resultado${filteredFaq.length > 1 ? "s" : ""}.`}
              </p>
            )}
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
                        <p className="text-sm text-muted-foreground/70 font-light leading-relaxed border-t border-white/5 pt-3 whitespace-pre-line">
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
