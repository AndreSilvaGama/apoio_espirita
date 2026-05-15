import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, X, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/painel")({
  component: Painel,
});

interface FaqItem {
  pergunta: string;
  resposta: string;
}

const FAQ: FaqItem[] = [
  { pergunta: "O site é gratuito?", resposta: "Sim, completamente gratuito. Sem anúncios, sem planos pagos. O Apoio Espírita é mantido por trabalho voluntário e de caridade." },
  { pergunta: "O site tem algum vínculo com a FEB ou federações?", resposta: "Não. O Apoio Espírita é uma plataforma independente, sem vínculo com a Federação Espírita Brasileira, UFE ou qualquer outra federação. Consulte a página de Transparência para mais detalhes." },
  { pergunta: "Como completo ou altero meu perfil?", resposta: "Acesse 'Perfil' no menu. Lá você pode alterar nome, sigla da casa, cidade, cargo, atividades e senha. Também é possível excluir a conta definitivamente por lá." },
  { pergunta: "Como adiciono ou mudo meu cargo?", resposta: "No primeiro acesso o sistema já pede o cargo. Depois, acesse 'Perfil' para alterar. Se o Presidente da sua casa tiver definido seu cargo, apenas ele poderá alterá-lo novamente." },
  { pergunta: "Como envio a Mensagem do Dia?", resposta: "Acesse 'Mensagem' no menu. Digite o texto, a referência espírita (opcional) e escolha uma data disponível na fila. A mensagem aparecerá para todos os membros na data escolhida." },
  { pergunta: "Como funciona a Agenda?", resposta: "Presidentes e coordenadores criam eventos abertos (todos os membros) ou fechados (convidados). Membros confirmam ou recusam presença. A aba 'Presenças' mostra o histórico de frequência de cada membro por evento." },
  { pergunta: "Como acesso a Tesouraria?", resposta: "A Tesouraria é restrita a Presidente e Tesoureiro. Se você tiver permissão, clique no card 'Tesouraria' na tela inicial ou acesse pelo menu. Quem não tem acesso verá uma mensagem informando a restrição." },
  { pergunta: "Como funciona a Rádio Rio de Janeiro?", resposta: "O player da rádio fica no rodapé de todas as páginas. Clique no botão de play para ligar. A transmissão é ao vivo, 24 horas. Você também pode acessar a página dedicada pelo menu." },
  { pergunta: "Como jogo o 'Plante a Semente'?", resposta: "Acesse 'Jogos' no menu. É um jogo estilo forca com termos da codificação espírita — a cada letra correta a planta cresce. Ao completar, o significado do termo é revelado com a referência exata no livro." },
  { pergunta: "Como reporto um problema no site?", resposta: "Clique em 'Reportar problema' no rodapé de qualquer página. Descreva o que está acontecendo e envie por e-mail. Você também pode optar por avisar pelo WhatsApp, com a mensagem já preenchida." },
  { pergunta: "Como faço sugestões?", resposta: "Clique em 'Sugestões' no rodapé ou acesse /sugestoes. Qualquer pessoa pode enviar sugestões, mesmo sem estar logada. As sugestões aparecem automaticamente nesta Central de Ajuda como pendentes." },
  { pergunta: "O site tem aplicativo para celular?", resposta: "Ainda não está nas lojas de aplicativos, mas você pode salvar o site como atalho na tela inicial do celular. No navegador do celular, use a opção 'Adicionar à tela inicial' (ou 'Compartilhar → Adicionar à tela de início' no iPhone)." },
  { pergunta: "Como excluo minha conta?", resposta: "Acesse 'Perfil' e role até o final da página. Há um botão para excluir a conta permanentemente. Todos os seus dados serão removidos e a ação não pode ser desfeita." },
];

type Status = "feito" | "andamento" | "planejado";

interface Item {
  status: Status;
  titulo: string;
  descricao?: string;
  solicitante?: string;
  sigla_casa?: string;
  tipo?: "solicitacao" | "sugestao";
}

const roadmap: Item[] = [

  // ── FEITO ────────────────────────────────────────────────────────────────

  { status: "feito", titulo: "Página de entrada do site com visual bonito e acolhedor", descricao: "Tela inicial com vídeo de nebulosa ao fundo, partículas animadas e design adaptado para celular, tablet e computador" },
  { status: "feito", titulo: "Música suave de piano ao entrar no site", descricao: "Toca automaticamente em volume baixo ao abrir o site · Botão discreto para pausar ou retomar a qualquer momento" },
  { status: "feito", titulo: "Ícone do site — cepa de videira estilizada", descricao: "Ícone personalizado que aparece na aba do navegador e na tela inicial do celular ao salvar o site como atalho" },
  { status: "feito", titulo: "Logomarca — cepa de videira realista", descricao: "Imagem da logomarca exibida no topo do site e usada em redes sociais e mecanismos de busca" },
  { status: "feito", titulo: "Área de ajuda na página inicial — 'Preciso de Ajuda'", descricao: "Apoio emocional com número do CVV · Busca de locais de alimentação pelo CEP · Busca de casas espíritas por CEP, cidade ou bairro" },
  { status: "feito", titulo: "Página de Transparência e Propósito", descricao: "Explica claramente que a plataforma é independente, sem vínculo com a FEB, UFE ou qualquer federação · Plataforma livre como uma rede social espírita" },
  { status: "feito", titulo: "Formulário de sugestões para o site", descricao: "Qualquer visitante pode enviar sugestões · O desenvolvedor recebe um aviso por e-mail a cada nova mensagem" },
  { status: "feito", titulo: "Cadastro e login no site", descricao: "Criar conta com e-mail e senha, ou entrar com um clique usando a conta do Google · Após o primeiro acesso, o sistema pede para completar o perfil" },
  { status: "feito", titulo: "Painel de acompanhamento do projeto — você está aqui", descricao: "Lista tudo que já foi feito, o que está em desenvolvimento e o que ainda será feito · Barra de progresso · Formulário para sugerir novos recursos" },
  { status: "feito", titulo: "Exclusão de conta pelo próprio usuário", descricao: "O usuário pode apagar permanentemente todos os seus dados diretamente pela página de perfil, sem precisar pedir a ninguém" },
  { status: "feito", titulo: "Site publicado em apoioespirita.com.br", descricao: "Site hospedado com segurança, acesso em alta velocidade de qualquer lugar do Brasil, com endereço próprio e cadeado de segurança (HTTPS)" },
  { status: "feito", titulo: "Entrada com Google — login rápido sem senha", descricao: "O usuário entra com um clique usando sua conta do Google · Na primeira vez, é redirecionado para preencher o perfil" },
  { status: "feito", titulo: "Banco de dados das casas espíritas", descricao: "Base de dados com informações das casas espíritas cadastradas na plataforma" },
  { status: "feito", titulo: "Página de perfil do usuário", descricao: "O usuário pode editar seus dados pessoais, trocar a senha e excluir a conta a qualquer momento" },
  { status: "feito", titulo: "Avisos automáticos por e-mail", descricao: "O desenvolvedor recebe um e-mail automático sempre que alguém enviar uma sugestão ou pedir um novo recurso para o site" },
  { status: "feito", titulo: "Escolha de cargo e atividades no primeiro acesso", descricao: "Na primeira vez que entra, o usuário escolhe o seu cargo na casa espírita e quais atividades realiza · A informação fica salva no perfil" },
  { status: "feito", titulo: "24 cargos disponíveis para escolha no perfil", descricao: "Presidente · Vice-presidente · Coordenador · Diretoria · Dirigente · Dirigente de reunião mediúnica · Tesoureiro · Assistido · Associado · Atendente fraterno · Colaborador · Estudante · Evangelizador · Expositor · Facilitador · Frequentador · Médium · Palestrante · Participante de estudo · Passista · Sócio · Tarefeiro · Trabalhador · Visitante" },
  { status: "feito", titulo: "Tela inicial após o login com todos os recursos disponíveis", descricao: "Painel com todos os recursos do site organizados por categoria, bazar on-line e a Mensagem do Dia" },
  { status: "feito", titulo: "Mensagem do Dia enviada pelos membros da comunidade", descricao: "Qualquer membro pode enviar uma mensagem com referência espírita para a fila · Uma mensagem diferente aparece por dia · O sistema evita repetir a mesma casa em dias seguidos" },
  { status: "feito", titulo: "Ícones visuais profissionais em todas as telas", descricao: "Todos os ícones do site são vetoriais e com traço uniforme, substituindo os emojis por uma aparência mais profissional" },
  { status: "feito", titulo: "Menu de Tesouraria visível apenas para quem tem acesso", descricao: "A opção de Tesouraria só aparece no menu para Presidente, Tesoureiro e DEV — Vice-presidente não tem acesso à Tesouraria" },
  { status: "feito", titulo: "Rádio Rio de Janeiro integrada ao site", descricao: "Player de rádio espírita disponível no rodapé · Ao ligar a rádio, a música de piano pausa automaticamente" },
  { status: "feito", titulo: "Site preparado para aparecer bem nas buscas do Google", descricao: "Configurações completas de SEO: título, descrição, imagem para redes sociais, mapa do site e permissões para robôs de busca" },
  { status: "feito", titulo: "Campo de busca por palavra no acompanhamento do projeto", descricao: "Digite qualquer palavra para filtrar os itens desta lista em tempo real · Grupos sem resultado ficam ocultos automaticamente · Mostra quantos itens foram encontrados" },
  { status: "feito", titulo: "Botão para voltar ao topo da página", descricao: "Um botão com seta aparece no canto inferior direito da tela após rolar a página para baixo · Ao clicar, a tela volta suavemente ao início · Funciona em todas as páginas do site" },
  { status: "feito", titulo: "Solicitações de desenvolvimento aparecem no acompanhamento do projeto", descricao: "Ao preencher o formulário de solicitação no final desta página, o pedido é inserido automaticamente aqui como Pendente · Mostra o nome e a casa espírita de quem fez o pedido" },
  { status: "feito", titulo: "Link para reportar problema no rodapé", descricao: "Botão 'Reportar problema' no rodapé de todas as páginas · Abre formulário para descrever o problema · Após enviar por e-mail, pergunta se quer também avisar pelo WhatsApp com a mensagem já preenchida" },
  { status: "feito", titulo: "Nome do site exibido ao lado do logo no celular", descricao: "'Apoio Espírita' aparece ao lado da logomarca em todos os tamanhos de tela, inclusive no celular" },
  { status: "feito", titulo: "Sugestões do site aparecem no acompanhamento do projeto", descricao: "Todas as sugestões enviadas pelo formulário público de /sugestões entram automaticamente nesta lista como Pendente, identificando o nome e o e-mail de quem sugeriu" },
  { status: "feito", titulo: "Link Voltar de Sugestões redireciona corretamente", descricao: "Se o visitante estiver logado, o botão Voltar leva para /início · Se não estiver logado, leva para a página inicial pública" },

  // ── PENDENTE — Base e qualidade do site ──────────────────────────────────

  { status: "planejado", titulo: "Revisão geral do site — melhorar organização e remover repetições", descricao: "Verificar se há informações duplicadas, telas confusas ou fluxos que possam ser simplificados · Padronizar a aparência dos componentes visuais" },
  { status: "planejado", titulo: "Filtro automático de palavras inapropriadas em conteúdo público", descricao: "Qualquer texto publicado em área visível ao público (mensagens, comentários, artigos) passa por um filtro automático que bloqueia palavrões e linguagem ofensiva antes de ser exibido" },
  { status: "planejado", titulo: "Verificação de tom fraternal em todos os textos enviados", descricao: "Sistema que analisa o tom das mensagens e alerta o usuário quando o texto parecer agressivo ou desrespeitoso, incentivando uma comunicação sempre amorosa" },
  { status: "planejado", titulo: "Site mais acessível para idosos e pessoas com dificuldades tecnológicas", descricao: "Letras maiores · Contraste adequado para quem tem dificuldade de visão · Botões e áreas de toque maiores para facilitar o uso no celular · Navegação simplificada" },
  { status: "planejado", titulo: "Perguntas e Respostas (FAQ) — ajuda para usar o site", descricao: "Página com as dúvidas mais comuns sobre como usar o site, como se cadastrar e sobre a doutrina espírita · Organizada por temas para facilitar a consulta" },
  { status: "planejado", titulo: "Mensagem do Dia com visual mais compacto", descricao: "Reduzir o espaço ocupado pela Mensagem do Dia na tela inicial para que o restante do painel fique mais visível sem precisar rolar a tela" },
  { status: "feito", titulo: "Menu de navegação completo — todas as seções do site", descricao: "Menu com acesso a todos os recursos funcionando: Início, Agenda, Mensagem do Dia, Rádio, Jogos e Tesouraria · No celular abre como menu hambúrguer · Links ficam destacados na página ativa · Jogos agrupados em submenu" },
  { status: "planejado", titulo: "Campo de busca geral — encontrar conteúdo, membros e casas", descricao: "Campo de busca para encontrar conteúdo publicado, membros da plataforma e casas espíritas cadastradas rapidamente, sem precisar navegar pelos menus" },

  // ── PENDENTE — Perfil e cadastro ─────────────────────────────────────────

  { status: "planejado", titulo: "Controle de acesso por cargo — quem pode ver e fazer o quê", descricao: "Cada cargo define o que o usuário pode acessar. O Presidente tem controle total e pode mudar o cargo de qualquer membro. O Vice-presidente tem quase o mesmo acesso. Coordenadores, Dirigentes e Diretoria gerenciam os cargos abaixo deles. O Tesoureiro tem acesso completo à Tesouraria. O Presidente é avisado sempre que alguém muda de cargo." },
  { status: "planejado", titulo: "Perfil com habilidades, situação de emprego e disponibilidade para voluntariado", descricao: "Cada membro pode informar suas habilidades profissionais, se está empregado ou em busca de emprego, e se está disponível para ser voluntário dentro ou fora da casa espírita" },
  { status: "planejado", titulo: "Espaço pessoal para contar a própria história de vida", descricao: "Cada membro pode escrever sua história pessoal no perfil e escolher se quer que ela fique visível para outros membros ou apenas para si mesmo" },
  { status: "planejado", titulo: "Perfil infantil 'Pequena Vinha' — acesso especial para crianças", descricao: "Um tipo de login especial com um nome carinhoso para as crianças acessarem o site. Ao entrar como 'Pequena Vinha', a tela inicial mostra apenas conteúdos adequados para crianças — jogos, histórias e evangelização — ocultando o restante" },
  { status: "planejado", titulo: "Cadastro completo da casa espírita pelo Presidente", descricao: "O Presidente cadastra os dados da casa: nome, endereço, telefone, foto e informações de contato · Os membros se vinculam à casa pela sigla" },
  { status: "planejado", titulo: "Mapa interativo das casas espíritas cadastradas", descricao: "Visualização no mapa de todas as casas cadastradas · Filtros por cidade e estado · Botão para abrir no Google Maps e traçar o caminho" },
  { status: "planejado", titulo: "Chave PIX da casa espírita para receber doações e pagamentos do bazar", descricao: "O Presidente cadastra a chave PIX da casa · O sistema gera um QR Code para impressão e uso nas reuniões e no bazar on-line" },

  // ── PENDENTE — Conteúdo e espiritualidade ────────────────────────────────

  { status: "planejado", titulo: "Mensagem da doutrina ao fazer login", descricao: "Ao entrar no site, uma passagem dos livros de Kardec é exibida automaticamente, com indicação do livro, capítulo e página · O Presidente pode tornar isso obrigatório ou deixar que cada membro escolha ativar ou desativar" },
  { status: "planejado", titulo: "Artigos escritos pelos membros da comunidade", descricao: "Espaço para que os membros publiquem artigos espíritas identificados com nome e casa · O Presidente define se todos podem publicar livremente ou se cada artigo precisa da sua aprovação antes de aparecer · Os artigos aparecem na tela principal" },
  { status: "planejado", titulo: "Fórum de perguntas e respostas sobre a doutrina espírita", descricao: "Espaço onde qualquer membro pode fazer perguntas sobre o Espiritismo e outros membros podem responder, aprofundando o estudo em conjunto" },
  { status: "planejado", titulo: "Área para palestrantes disponibilizarem suas palestras gravadas", descricao: "Palestrantes podem enviar vídeos, áudios ou apresentações de suas palestras para ficarem disponíveis a todos os membros" },
  { status: "planejado", titulo: "Cifras e partituras de músicas espíritas", descricao: "Músicos da comunidade enviam cifras e partituras de músicas espíritas · Qualquer membro pode acessar e baixar o material" },
  { status: "planejado", titulo: "Músicas espíritas para ouvir diretamente no site", descricao: "Playlists organizadas por momento da reunião (recepção, hora do passe, encerramento) · Músicas curadas pela comunidade · Reprodução direto pelo navegador, sem precisar de outro aplicativo" },
  { status: "planejado", titulo: "Área dos músicos espíritas — encontros, trabalhos e ensaio virtual", descricao: "Espaço para músicos espíritas se conhecerem, divulgarem seus trabalhos musicais e realizarem ensaios virtuais. Inclui a possibilidade de organizar um show virtual para apresentação dos músicos da comunidade" },
  { status: "planejado", titulo: "Informações úteis na área de ajuda — empregos e outras religiões", descricao: "Ampliar a seção de ajuda da página inicial com uma lista de agências de emprego e endereços de outras religiões, para que qualquer pessoa que precise de apoio possa ser encaminhada com fraternidade, independente de crença" },

  // ── PENDENTE — Vida espiritual e comunidade ──────────────────────────────

  { status: "planejado", titulo: "Calendário de aniversariantes do mês", descricao: "Lista dos membros da casa que fazem aniversário no mês atual, exibida em destaque na tela inicial · O coordenador recebe um aviso automático para organizar uma homenagem" },
  { status: "planejado", titulo: "Plantão de Orações — oração coletiva à distância", descricao: "Membros se inscrevem para orar em horários definidos, como um escalonamento de oração · A agenda semanal fica visível para todos · Cada participante confirma presença e o histórico é registrado" },
  { status: "planejado", titulo: "Mural de Avisos da casa espírita", descricao: "Quadro de avisos digital da casa · Presidentes e coordenadores publicam comunicados · Cada aviso tem uma data de validade e some automaticamente quando vencer · Os membros veem o mural ao entrar no site" },
  { status: "planejado", titulo: "Atendimento fraterno virtual — urgente e agendado", descricao: "Para atendimento urgente: o site identifica os voluntários logados naquele momento e envia um alerta automático para eles e para o Presidente. Se não houver ninguém disponível, indica o CVV ou a opção de agendar. Para atendimento agendado: o Presidente ou autorizados recebem a solicitação, escolhem a data e o horário, e o compromisso é criado automaticamente na agenda de todos os envolvidos. O atendimento pode ser identificado ou anônimo. A sala virtual é controlada pelo Presidente, que define quem pode participar." },
  { status: "planejado", titulo: "Ficha de Atendimento Fraterno — registro confidencial", descricao: "Formulário sigiloso para registrar os dados de pessoas que receberam atendimento · Histórico de atendimentos · Acessível apenas pelo coordenador de assistência fraterna" },
  { status: "planejado", titulo: "Fórum de apoio fraterno — espaço para quem está passando por dificuldades", descricao: "Um espaço acolhedor onde pessoas que estejam passando por dificuldades podem compartilhar o que estão sentindo. Voluntários cadastrados recebem um aviso e podem interagir com fraternidade, oferecendo apoio emocional e espiritual dentro da plataforma" },

  // ── PENDENTE — Solidariedade e mobilidade ────────────────────────────────

  { status: "planejado", titulo: "Carona Solidária — ajuda para chegar à casa espírita", descricao: "Membros que têm carro se cadastram para oferecer carona · Quem precisa solicita uma carona · O sistema registra confirmações e histórico de caronas realizadas" },
  { status: "planejado", titulo: "Entrega Solidária — levar itens do bazar até quem comprou", descricao: "Voluntários se oferecem para entregar itens comprados no bazar on-line · O comprador e o voluntário combinam o horário pela plataforma · Registro e confirmação da entrega" },

  // ── PENDENTE — Organização do centro ─────────────────────────────────────

  { status: "feito",     titulo: "Agenda completa por casa espírita — compromissos e reuniões", descricao: "Presidentes e decisores criam eventos abertos (todos os membros) ou fechados (convidados específicos). Membros confirmam ou recusam presença. O organizador marca quem compareceu e gera a ata automaticamente ao final da reunião." },
  { status: "feito", titulo: "Caderno de Presença Digital", descricao: "Presença registrada dentro de cada evento da agenda · Aba 'Presenças' com relatório histórico: barra de frequência por membro e lista de presentes por evento" },
  { status: "planejado", titulo: "Escala de Trabalho — quem faz o quê e quando", descricao: "O Presidente ou coordenador monta a escala semanal e mensal dos tarefeiros · Cada membro recebe um aviso com sua escala e pode consultar a qualquer momento pelo celular" },
  { status: "planejado", titulo: "Controle de manutenções da casa espírita", descricao: "Registro de todas as manutenções realizadas ou necessárias na casa: reparos, limpezas, compras e serviços. Com datas, responsáveis e status de cada tarefa, para que nada seja esquecido" },
  { status: "planejado", titulo: "Cruzamento de habilidades dos membros com as necessidades do centro", descricao: "O sistema compara as habilidades cadastradas pelos membros com as necessidades da casa e envia alertas para voluntários quando alguém que tem aquela habilidade for necessário" },
  { status: "planejado", titulo: "Sistema interno de sugestões com curtidas, comentários e acompanhamento", descricao: "Membros registram sugestões para a casa · Outros podem curtir e comentar · O status de cada sugestão é acompanhado com datas e motivação registrada" },
  { status: "planejado", titulo: "Grupos de comunicação interna por tipo de atividade", descricao: "Grupos de mensagens dentro da plataforma, semelhantes aos grupos de WhatsApp, organizados por tipo de trabalho (evangelização, mediunidade, tesouraria etc.)" },
  { status: "planejado", titulo: "Avisos por WhatsApp para coordenadores e presidentes", descricao: "Alertas automáticos via WhatsApp sobre eventos, ausências, aprovações e solicitações importantes · Integração com a API oficial do WhatsApp" },
  { status: "planejado", titulo: "Instalar o site como aplicativo no celular — sem loja de aplicativos", descricao: "O usuário pode salvar o site como um aplicativo na tela inicial do celular, sem precisar baixar nada de uma loja · O site funciona mesmo com internet fraca ou ausente em partes do conteúdo" },

  // ── PENDENTE — Tesouraria e financeiro ───────────────────────────────────

  { status: "feito", titulo: "Tesouraria simplificada — controle de entradas e saídas", descricao: "Controle financeiro simples e acessível, pensado para quem não tem familiaridade com tecnologia · Registro de receitas (doações, bazar, mensalidade, eventos) e despesas (água/luz, aluguel, manutenção etc.) · Navegação por mês com saldo, total de receitas e despesas · Acesso restrito a Presidente, Tesoureiro e DEV" },
  { status: "planejado", titulo: "Bazar on-line com pagamento por PIX", descricao: "Publicação de itens com foto, descrição e preço · Pagamento via PIX com QR Code gerado na hora · O administrador controla o estoque e as vendas" },

  // ── PENDENTE — Painéis de acompanhamento por cargo ───────────────────────

  { status: "planejado", titulo: "Painel pessoal 'Meu Trabalho na Vinha'", descricao: "Cada membro tem um painel personalizado com informações relevantes para o seu cargo e suas atividades: compromissos agendados, escala de trabalho, tempo no site, conquistas e muito mais. O nome 'Dashboard' (palavra em inglês) é substituído por algo que todos entendam de imediato" },
  { status: "planejado", titulo: "Painel do Presidente — visão geral da casa", descricao: "Resumo financeiro, lista de tarefeiros, situação das atividades e funcionamento geral da casa espírita, tudo em um só lugar" },
  { status: "planejado", titulo: "Painel do Coordenador — acompanhamento da coordenação", descricao: "Visão das atividades sob sua responsabilidade: presenças, escalas, atendimentos e comunicados da coordenação" },
  { status: "feito", titulo: "Painel do Tesoureiro — resumo financeiro com exportação e impressão", descricao: "Entradas e saídas do mês com saldo, total de receitas e despesas · Exportação em planilha Excel nativa (.xlsx) com cabeçalho completo (casa, período, responsável pela emissão) e coluna com o nome de quem registrou cada lançamento · Impressão formatada diretamente do site, com cabeçalho, cards de resumo e tabela de lançamentos · Navegação por qualquer mês do histórico" },
  { status: "planejado", titulo: "Painel de configurações do Presidente — ligar e desligar recursos", descricao: "O Presidente pode ativar ou desativar cada funcionalidade do site para a sua casa. Cada recurso tem três opções: desligado, opcional (o membro escolhe) ou obrigatório para todos · Inclui sistema de votação para decisões coletivas da casa" },
  { status: "planejado", titulo: "Gerenciamento de solicitações de desenvolvimento — somente DEV", descricao: "Área exclusiva no perfil do DEV para visualizar, organizar e atualizar o status das solicitações de desenvolvimento feitas pelos membros" },

  // ── PENDENTE — Comunicação e transmissão ─────────────────────────────────

  { status: "planejado", titulo: "Transmissão ao vivo de palestras pelo celular", descricao: "Um membro transmite a palestra pelo celular e todos os outros logados na casa podem assistir ao vivo, sem precisar de equipamentos especiais" },
  { status: "planejado", titulo: "Videochamada em grupo — Google Meet ou solução própria", descricao: "Iniciar uma videochamada direto pela plataforma, sem sair do site · Link compartilhável com os membros convidados" },
  { status: "planejado", titulo: "Transmissão profissional de palestras — integração com StreamYard", descricao: "Para casas que queiram transmitir com mais qualidade, integração com o StreamYard ou desenvolvimento de solução própria de streaming" },

  // ── PENDENTE — Educação e jogos ──────────────────────────────────────────

  { status: "planejado", titulo: "Módulo escolar de evangelização infantil", descricao: "Planos de aula, histórias e atividades prontas para os professores da evangelização · Material organizado por faixa etária · Tudo acessível pelo site" },
  { status: "feito",     titulo: "Plante a Semente — jogo educativo sobre a codificação espírita", descricao: "Jogo no estilo forca onde uma planta cresce à medida que o jogador descobre o termo espírita. Ao completar, a palavra revela seu significado e a referência exata no livro da codificação" },
  { status: "planejado", titulo: "Quiz de perguntas sobre os livros de Kardec", descricao: "Perguntas de múltipla escolha sobre O Livro dos Espíritos, O Evangelho segundo o Espiritismo e os demais livros da codificação · Três níveis: fácil, médio e difícil · Placar por rodada" },
  { status: "planejado", titulo: "Jogo da memória — termos e significados da doutrina", descricao: "Pares de cartas com termos espíritas e seus respectivos significados extraídos dos livros de Kardec · As cartas são embaralhadas a cada rodada" },
  { status: "planejado", titulo: "Palavras cruzadas com termos espíritas", descricao: "Grade de palavras cruzadas com termos e definições retirados dos 5 livros da codificação · Gerada automaticamente para nunca repetir o mesmo jogo" },
  { status: "planejado", titulo: "Quiz de trechos — adivinhe o livro e o capítulo", descricao: "Um trecho dos livros de Kardec aparece na tela e o jogador deve identificar de qual livro e capítulo aquela passagem foi extraída" },
  { status: "planejado", titulo: "Batalha Naval Espírita — jogo em dupla ou contra o computador", descricao: "Versão do jogo Batalha Naval onde, no lugar dos barcos, há palavras da doutrina espírita de tamanhos variados. Pode ser jogado convidando outro membro ou contra o computador. À medida que o jogador acerta todas as letras de uma palavra, o seu significado na doutrina é revelado" },
  { status: "planejado", titulo: "Jogos educativos adaptados para crianças da evangelização", descricao: "Atividades lúdicas criadas especialmente para crianças: jogo da memória, palavras cruzadas ilustradas e histórias animadas com temas espíritas" },
];

const badge: Record<Status, { label: string; color: string }> = {
  feito:     { label: "Feito",       color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  andamento: { label: "Em andamento", color: "text-amber-400  bg-amber-400/10  border-amber-400/20"  },
  planejado: { label: "Pendente",    color: "text-cyan-glow  bg-cyan-glow/10  border-cyan-glow/20"  },
};

const icon: Record<Status, string> = {
  feito:     "✓",
  andamento: "◎",
  planejado: "○",
};

function Painel() {
  const navigate = useNavigate();
  const { user, profile, loading, signOut } = useAuth();
  const [busca, setBusca] = useState("");
  const [faqAberto, setFaqAberto] = useState<Set<number>>(new Set());
  const [solicitacoes, setSolicitacoes] = useState<Item[]>([]);
  const [sugestoes, setSugestoes] = useState<Item[]>([]);
  const [solTitulo, setSolTitulo] = useState("");
  const [solDesc, setSolDesc] = useState("");
  const [sendingSol, setSendingSol] = useState(false);
  const [solOk, setSolOk] = useState(false);
  const [solError, setSolError] = useState("");

  const fetchSugestoes = async () => {
    const { data } = await supabase
      .from("site_suggestions")
      .select("name, email, suggestion")
      .order("created_at", { ascending: false });
    if (data) {
      setSugestoes(
        data.map((s) => {
          const titulo = s.suggestion.length > 120
            ? s.suggestion.slice(0, 120).trimEnd() + "…"
            : s.suggestion;
          return {
            status: "planejado" as Status,
            titulo,
            solicitante: s.name,
            sigla_casa: s.email,
            tipo: "sugestao" as const,
          };
        })
      );
    }
  };

  const fetchSolicitacoes = async () => {
    const { data } = await supabase
      .from("solicitacoes_dev")
      .select("titulo, descricao, profiles!user_id(nome, sigla_casa)")
      .order("created_at", { ascending: false });
    if (data) {
      setSolicitacoes(
        data.map((s) => {
          const p = s.profiles as { nome?: string; sigla_casa?: string } | null;
          return {
            status: "planejado" as Status,
            titulo: s.titulo,
            descricao: s.descricao ?? undefined,
            solicitante: p?.nome ?? "Membro",
            sigla_casa: p?.sigla_casa ?? "",
            tipo: "solicitacao" as const,
          };
        })
      );
    }
  };

  const handleSolicitacao = async () => {
    if (!solTitulo.trim()) { setSolError("Informe o título da solicitação."); return; }
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
        body: { type: "solicitacao", data: { titulo: solTitulo.trim(), descricao: solDesc.trim() || null, user_email: user.email } },
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
    if (!loading && user && (!profile?.sigla_casa || !profile?.nome)) navigate({ to: "/completar-perfil" });
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    if (user) { fetchSolicitacoes(); fetchSugestoes(); }
  }, [user]);

  if (loading || !user) return null;

  const allItems = [...roadmap, ...solicitacoes, ...sugestoes];
  const totals = (status: Status) => allItems.filter((i) => i.status === status).length;
  const done = totals("feito");
  const total = allItems.length;
  const pct = Math.round((done / total) * 100);

  const toggleFaq = (i: number) => {
    setFaqAberto((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const termo = busca.trim().toLowerCase();
  const filtered = termo
    ? allItems.filter(
        (i) =>
          i.titulo.toLowerCase().includes(termo) ||
          (i.descricao ?? "").toLowerCase().includes(termo) ||
          (i.solicitante ?? "").toLowerCase().includes(termo) ||
          (i.sigla_casa ?? "").toLowerCase().includes(termo)
      )
    : allItems;
  const filteredFaq = termo
    ? FAQ.filter(
        (f) =>
          f.pergunta.toLowerCase().includes(termo) ||
          f.resposta.toLowerCase().includes(termo)
      )
    : FAQ;
  const totalResultados = filtered.length + filteredFaq.length;

  return (
    <main className="page-light min-h-screen px-6 pt-20 pb-20">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-12 flex-wrap gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-glow mb-2">Ajuda & Projeto</p>
            <h1 className="text-3xl font-light text-foreground">Central de Ajuda</h1>
          </div>
          <button
            onClick={async () => { await signOut(); navigate({ to: "/" }); }}
            className="text-xs uppercase tracking-widest text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            Sair
          </button>
        </div>

        {/* Progress */}
        <div className="glass rounded-3xl p-6 mb-10">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground font-light">Progresso geral</p>
            <p className="text-sm font-medium text-foreground">{done} / {total} itens</p>
          </div>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full bg-linear-to-r from-cyan-glow to-emerald-400 transition-all duration-1000"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-2 text-right text-xs text-muted-foreground/50">{pct}% concluído</p>

          <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-white/5">
            {(["feito", "andamento", "planejado"] as Status[]).map((s) => (
              <div key={s} className="text-center">
                <p className={`text-2xl font-light ${s === "feito" ? "text-emerald-400" : s === "andamento" ? "text-amber-400" : "text-cyan-glow"}`}>
                  {totals(s)}
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">{badge[s].label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Busca */}
        <div className="relative mb-8">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar em perguntas e no projeto…"
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

        {/* Contador de resultados */}
        {termo && (
          <p className="text-xs text-muted-foreground/50 mb-6 -mt-4">
            {totalResultados === 0
              ? "Nenhum resultado encontrado."
              : `${totalResultados} resultado${totalResultados > 1 ? "s" : ""} encontrado${totalResultados > 1 ? "s" : ""}.`}
          </p>
        )}

        {/* ── FAQ ── */}
        {filteredFaq.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xs uppercase tracking-[0.3em] text-muted-foreground/60 mb-3 flex items-center gap-2">
              <span className="text-base text-violet-400">?</span>
              Perguntas frequentes
            </h2>
            <div className="space-y-2">
              {filteredFaq.map((faq, i) => {
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

        {/* ── Acompanhamento do Projeto ── */}
        {(!termo || filtered.length > 0) && (
          <h2 className="text-xs uppercase tracking-[0.3em] text-muted-foreground/40 mb-4 mt-2">
            Acompanhamento do projeto
          </h2>
        )}

        {/* Items by group */}
        {(["feito", "andamento", "planejado"] as Status[]).map((status) => {
          const items = filtered.filter((i) => i.status === status);
          if (items.length === 0) return null;
          return (
            <div key={status} className="mb-8">
              <h2 className="text-xs uppercase tracking-[0.3em] text-muted-foreground/60 mb-3 flex items-center gap-2">
                <span className={`text-base ${badge[status].color.split(" ")[0]}`}>{icon[status]}</span>
                {badge[status].label}
              </h2>
              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item.titulo}
                    className="glass rounded-2xl px-5 py-4 flex items-start gap-4"
                  >
                    <span className={`text-sm mt-0.5 shrink-0 ${badge[status].color.split(" ")[0]}`}>
                      {icon[status]}
                    </span>
                    <div>
                      <p className="text-sm text-foreground font-light">{item.titulo}</p>
                      {item.descricao && (
                        <p className="text-xs text-muted-foreground/60 mt-0.5">{item.descricao}</p>
                      )}
                      {item.solicitante && (
                        <p className="text-xs text-cyan-glow/60 mt-1">
                          {item.tipo === "sugestao" ? "Sugestão" : "Solicitado"} por {item.solicitante}
                          {item.sigla_casa ? ` · ${item.sigla_casa}` : ""}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
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
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground/60 mb-1">Colabore com o projeto</p>
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
              onChange={(e) => { setSolTitulo(e.target.value); setSolError(""); setSolOk(false); }}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-cyan-glow/40 transition-colors"
            />
            <textarea
              placeholder="Descreva sua solicitação com detalhes (opcional)"
              value={solDesc}
              onChange={(e) => { setSolDesc(e.target.value); setSolError(""); setSolOk(false); }}
              rows={4}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-cyan-glow/40 transition-colors resize-none"
            />
            {solError && <p className="text-xs text-red-400 text-center">{solError}</p>}
            {solOk && <p className="text-xs text-emerald-400 text-center">Solicitação enviada com gratidão. Analisaremos em breve.</p>}
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
