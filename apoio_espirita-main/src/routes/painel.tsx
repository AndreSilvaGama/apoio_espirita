import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Search, X, ThumbsUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { CasaHero } from "@/components/CasaHero";

export const Route = createFileRoute("/painel")({
  component: Painel,
});


type Status = "feito" | "andamento" | "planejado";

interface Item {
  status: Status;
  titulo: string;
  descricao?: string;
  solicitante?: string;
  sigla_casa?: string;
  tipo?: "solicitacao" | "sugestao";
  // Título do card em /inicio que gera a chave de voto compartilhada
  cardTitle?: string;
}

const roadmap: Item[] = [

  { status: "feito", titulo: "Redesign Serene Wisdom — páginas autenticadas", descricao: "Novo design system premium com foco em acessibilidade para idosos: CasaHero com nome do centro em destaque, Libre Caslon Text + Inter, BottomNav mobile, tokens de cor Serene Wisdom em todas as páginas autenticadas" },

  // ── PENDENTE — Base e qualidade do site ──────────────────────────────────

  { status: "feito", titulo: "Revisão geral do site — melhorar organização e remover repetições", descricao: "Página da casa espírita integrada como inicial pós-login. Menu principal simplificado em links intuitivos e dropdown de jogos. Cards de funcionalidades copiados para a página da Casa espírita." },
  { status: "planejado", titulo: "Filtro automático de palavras inapropriadas em conteúdo público", descricao: "Qualquer texto publicado em área visível ao público (mensagens, comentários, artigos) passa por um filtro automático que bloqueia palavrões e linguagem ofensiva antes de ser exibido" },
  { status: "planejado", titulo: "Verificação de tom fraternal em todos os textos enviados", descricao: "Sistema que analisa o tom das mensagens e alerta o usuário quando o texto parecer agressivo ou desrespeitoso, incentivando uma comunicação sempre amorosa" },
  { status: "planejado", titulo: "Site mais acessível para idosos e pessoas com dificuldades tecnológicas", descricao: "Letras maiores · Contraste adequado para quem tem dificuldade de visão · Botões e áreas de toque maiores para facilitar o uso no celular · Navegação simplificada" },
  { status: "planejado", titulo: "Mensagem do Dia com visual mais compacto", descricao: "Reduzir o espaço ocupado pela Mensagem do Dia na tela inicial para que o restante do painel fique mais visível sem precisar rolar a tela" },
  { status: "planejado", titulo: "Campo de busca geral — encontrar conteúdo, membros e casas", descricao: "Campo de busca para encontrar conteúdo publicado, membros da plataforma e casas espíritas cadastradas rapidamente, sem precisar navegar pelos menus" },

  // ── PENDENTE — Perfil e cadastro ─────────────────────────────────────────

  { status: "feito", titulo: "Controle de acesso por cargo — quem pode ver e fazer o quê", descricao: "Cada cargo define o que o usuário pode acessar. O Presidente tem controle total e pode mudar o cargo de qualquer membro. O Vice-presidente tem quase o mesmo acesso. Coordenadores, Dirigentes e Diretoria gerenciam os cargos abaixo deles. O Tesoureiro tem acesso completo à Tesouraria. O Presidente é avisado sempre que alguém muda de cargo." },
  { status: "planejado", titulo: "Perfil com habilidades, situação de emprego e disponibilidade para voluntariado", descricao: "Cada membro pode informar suas habilidades profissionais, se está empregado ou em busca de emprego, e se está disponível para ser voluntário dentro ou fora da casa espírita" },
  { status: "planejado", titulo: "Espaço pessoal para contar a própria história de vida", descricao: "Cada membro pode escrever sua história pessoal no perfil e escolher se quer que ela fique visível para outros membros ou apenas para si mesmo" },
  { status: "planejado", titulo: "Perfil infantil 'Pequena Vinha' — acesso especial para crianças", descricao: "Um tipo de login especial com um nome carinhoso para as crianças acessarem o site. Ao entrar como 'Pequena Vinha', a tela inicial mostra apenas conteúdos adequados para crianças — jogos, histórias e evangelização — ocultando o restante" },
  { status: "feito", titulo: "Cadastro completo da casa espírita pelo Presidente", descricao: "O Presidente cadastra os dados da casa: nome, endereço, telefone, foto e informações de contato · Os membros se vinculam à casa pela sigla" },
  { status: "planejado", titulo: "Mapa interativo das casas espíritas cadastradas", descricao: "Visualização no mapa de todas as casas cadastradas · Filtros por cidade e estado · Botão para abrir no Google Maps e traçar o caminho" },
  { status: "feito", titulo: "Chave PIX da casa espírita para receber doações e pagamentos do bazar", descricao: "O Presidente cadastra a chave PIX da casa · O sistema gera um QR Code para impressão e uso nas reuniões e no bazar on-line" },

  // ── PENDENTE — Conteúdo e espiritualidade ────────────────────────────────

  { status: "planejado", titulo: "Mensagem da doutrina ao fazer login", descricao: "Ao entrar no site, uma passagem dos livros de Kardec é exibida automaticamente, com indicação do livro, capítulo e página · O Presidente pode tornar isso obrigatório ou deixar que cada membro escolha ativar ou desativar" },
  { status: "planejado", titulo: "Artigos escritos pelos membros da comunidade", cardTitle: "Artigos e Colunistas", descricao: "Espaço para que os membros publiquem artigos espíritas identificados com nome e casa · O Presidente define se todos podem publicar livremente ou se cada artigo precisa da sua aprovação antes de aparecer · Os artigos aparecem na tela principal" },
  { status: "planejado", titulo: "Fórum de perguntas e respostas sobre a doutrina espírita", descricao: "Espaço onde qualquer membro pode fazer perguntas sobre o Espiritismo e outros membros podem responder, aprofundando o estudo em conjunto" },
  { status: "planejado", titulo: "Área para palestrantes disponibilizarem suas palestras gravadas", cardTitle: "Integração de Vídeos", descricao: "Palestrantes podem enviar vídeos, áudios ou apresentações de suas palestras para ficarem disponíveis a todos os membros" },
  { status: "feito", titulo: "Músicas e Cifras — playlists, cifras espíritas com transposição de tom e compartilhamento de áudios locais por músicos", cardTitle: "Músicas e Cifras", descricao: "Visualizador de cifras espíritas com alteração de tom dinâmica, player de áudio com playlists personalizáveis e área para músicos compartilharem seus áudios aceitando o termo de licença fraterna." },
  { status: "planejado", titulo: "Área dos músicos espíritas — encontros, trabalhos e ensaio virtual", descricao: "Espaço para músicos espíritas se conhecerem, divulgarem seus trabalhos musicais e realizarem ensaios virtuais. Inclui a possibilidade de organizar um show virtual para apresentação dos músicos da comunidade" },
  { status: "planejado", titulo: "Informações úteis na área de ajuda — empregos e outras religiões", descricao: "Ampliar a seção de ajuda da página inicial com uma lista de agências de emprego e endereços de outras religiões, para que qualquer pessoa que precise de apoio possa ser encaminhada com fraternidade, independente de crença" },
  { status: "planejado", titulo: "Área de Jovens Espíritas", descricao: "Conteúdo, eventos e espaço de comunidade exclusivos para jovens trabalhadores da vinha · Atividades, discussões e recursos adaptados ao jovem espírita" },

  // ── PENDENTE — Vida espiritual e comunidade ──────────────────────────────

  { status: "planejado", titulo: "Calendário de aniversariantes do mês", cardTitle: "Aniversariantes do Mês", descricao: "Lista dos membros da casa que fazem aniversário no mês atual, exibida em destaque na tela inicial · O coordenador recebe um aviso automático para organizar uma homenagem" },
  { status: "planejado", titulo: "Plantão de Orações — oração coletiva à distância", cardTitle: "Plantão de Orações", descricao: "Membros se inscrevem para orar em horários definidos, como um escalonamento de oração · A agenda semanal fica visível para todos · Cada participante confirma presença e o histórico é registrado" },
  { status: "planejado", titulo: "Mural de Avisos da casa espírita", cardTitle: "Mural de Avisos", descricao: "Quadro de avisos digital da casa · Presidentes e coordenadores publicam comunicados · Cada aviso tem uma data de validade e some automaticamente quando vencer · Os membros veem o mural ao entrar no site" },
  { status: "planejado", titulo: "Atendimento fraterno virtual — urgente e agendado", descricao: "Para atendimento urgente: o site identifica os voluntários logados naquele momento e envia um alerta automático para eles e para o Presidente. Se não houver ninguém disponível, indica o CVV ou a opção de agendar. Para atendimento agendado: o Presidente ou autorizados recebem a solicitação, escolhem a data e o horário, e o compromisso é criado automaticamente na agenda de todos os envolvidos. O atendimento pode ser identificado ou anônimo. A sala virtual é controlada pelo Presidente, que define quem pode participar." },
  { status: "planejado", titulo: "Ficha de Atendimento Fraterno — registro confidencial", cardTitle: "Ficha de Atendimento Fraterno", descricao: "Formulário sigiloso para registrar os dados de pessoas que receberam atendimento · Histórico de atendimentos · Acessível apenas pelo coordenador de assistência fraterna" },
  { status: "planejado", titulo: "Fórum de apoio fraterno — espaço para quem está passando por dificuldades", cardTitle: "Fórum de Apoio", descricao: "Um espaço acolhedor onde pessoas que estejam passando por dificuldades podem compartilhar o que estão sentindo. Voluntários cadastrados recebem um aviso e podem interagir com fraternidade, oferecendo apoio emocional e espiritual dentro da plataforma" },

  // ── PENDENTE — Solidariedade e mobilidade ────────────────────────────────

  { status: "planejado", titulo: "Carona Solidária — ajuda para chegar à casa espírita", cardTitle: "Carona Solidária", descricao: "Membros que têm carro se cadastram para oferecer carona · Quem precisa solicita uma carona · O sistema registra confirmações e histórico de caronas realizadas" },
  { status: "planejado", titulo: "Entrega Solidária — levar itens do bazar até quem comprou", cardTitle: "Entrega Solidária", descricao: "Voluntários se oferecem para entregar itens comprados no bazar on-line · O comprador e o voluntário combinam o horário pela plataforma · Registro e confirmação da entrega" },

  // ── PENDENTE — Organização do centro ─────────────────────────────────────

  { status: "planejado", titulo: "Escala de Trabalho — quem faz o quê e quando", cardTitle: "Escala de Trabalho", descricao: "O Presidente ou coordenador monta a escala semanal e mensal dos tarefeiros · Cada membro recebe um aviso com sua escala e pode consultar a qualquer momento pelo celular" },
  { status: "planejado", titulo: "Controle de manutenções da casa espírita", descricao: "Registro de todas as manutenções realizadas ou necessárias na casa: reparos, limpezas, compras e serviços. Com datas, responsáveis e status de cada tarefa, para que nada seja esquecido" },
  { status: "planejado", titulo: "Cruzamento de habilidades dos membros com as necessidades do centro", cardTitle: "Localização de Voluntariado", descricao: "O sistema compara as habilidades cadastradas pelos membros com as necessidades da casa e envia alertas para voluntários quando alguém que tem aquela habilidade for necessário" },
  { status: "planejado", titulo: "Sistema interno de sugestões com curtidas, comentários e acompanhamento", descricao: "Membros registram sugestões para a casa · Outros podem curtir e comentar · O status de cada sugestão é acompanhado com datas e motivação registrada" },
  { status: "planejado", titulo: "Grupos de comunicação interna por tipo de atividade", cardTitle: "Comunicação em Grupos", descricao: "Grupos de mensagens dentro da plataforma, semelhantes aos grupos de WhatsApp, organizados por tipo de trabalho (evangelização, mediunidade, tesouraria etc.)" },
  { status: "planejado", titulo: "Avisos por WhatsApp para coordenadores e presidentes", descricao: "Alertas automáticos via WhatsApp sobre eventos, ausências, aprovações e solicitações importantes · Integração com a API oficial do WhatsApp" },
  { status: "planejado", titulo: "Instalar o site como aplicativo no celular — sem loja de aplicativos", descricao: "O usuário pode salvar o site como um aplicativo na tela inicial do celular, sem precisar baixar nada de uma loja · O site funciona mesmo com internet fraca ou ausente em partes do conteúdo" },

  // ── PENDENTE — Tesouraria e financeiro ───────────────────────────────────

  { status: "planejado", titulo: "Bazar on-line com pagamento por PIX", cardTitle: "Bazar On-line", descricao: "Publicação de itens com foto, descrição e preço · Pagamento via PIX com QR Code gerado na hora · O administrador controla o estoque e as vendas" },

  // ── PENDENTE — Painéis de acompanhamento por cargo ───────────────────────

  { status: "planejado", titulo: "Painel do Presidente — visão geral da casa", descricao: "Resumo financeiro, lista de tarefeiros, situação das atividades e funcionamento geral da casa espírita, tudo em um só lugar" },
  { status: "planejado", titulo: "Painel do Coordenador — acompanhamento da coordenação", descricao: "Visão das atividades sob sua responsabilidade: presenças, escalas, atendimentos e comunicados da coordenação" },
  { status: "planejado", titulo: "Painel de configurações do Presidente — ligar e desligar recursos", descricao: "O Presidente pode ativar ou desativar cada funcionalidade do site para a sua casa. Cada recurso tem três opções: desligado, opcional (o membro escolhe) ou obrigatório para todos · Inclui sistema de votação para decisões coletivas da casa" },
  { status: "planejado", titulo: "Gerenciamento de solicitações de desenvolvimento — somente DEV", descricao: "Área exclusiva no perfil do DEV para visualizar, organizar e atualizar o status das solicitações de desenvolvimento feitas pelos membros" },

  // ── PENDENTE — Comunicação e transmissão ─────────────────────────────────

  { status: "planejado", titulo: "Transmissão ao vivo de palestras pelo celular", cardTitle: "Live Streaming", descricao: "Um membro transmite a palestra pelo celular e todos os outros logados na casa podem assistir ao vivo, sem precisar de equipamentos especiais" },
  { status: "planejado", titulo: "Videochamada em grupo — Google Meet ou solução própria", cardTitle: "Google Meet", descricao: "Iniciar uma videochamada direto pela plataforma, sem sair do site · Link compartilhável com os membros convidados" },
  { status: "planejado", titulo: "Transmissão profissional de palestras — integração com StreamYard", descricao: "Para casas que queiram transmitir com mais qualidade, integração com o StreamYard ou desenvolvimento de solução própria de streaming" },

  // ── PENDENTE — Educação e jogos ──────────────────────────────────────────

  { status: "feito", titulo: "Módulo escolar de evangelização infantil", cardTitle: "Evangelização Infantil", descricao: "Planos de aula prontos por faixa etária (3–5, 6–8 e 9–11 anos) baseados nas diretrizes FEB AEE Infância · Acessível em /evangelizacao" },
  { status: "feito", titulo: "Quiz Espírita — perguntas sobre virtudes e doutrina", cardTitle: "Quiz Espírita", descricao: "30 perguntas de múltipla escolha por faixa etária (3–5, 6–8 e 9–11 anos) · Feedback imediato · Placar ao final · Disponível em /jogos/quiz-espirita" },
  { status: "feito", titulo: "Jogo da memória — termos e significados da doutrina", descricao: "Jogo da memória com dois modos: Virtudes (nome + ícone) e Palavras do Evangelho (palavra + significado) · Três dificuldades · Disponível em /jogos/memoria-evangelizacao" },
  { status: "feito", titulo: "Semeador de Mensagens — ordene as palavras e cultive mensagens de luz", cardTitle: "Semeador de Mensagens", descricao: "Adivinhe e ordene as palavras de lindas mensagens psicografadas e doutrinárias para fazer um jardim florescer · Disponível em /jogos/semeador-mensagens" },
  { status: "feito", titulo: "Caça-Palavras das Virtudes — encontre termos morais e espíritas", cardTitle: "Caça-Palavras das Virtudes", descricao: "Encontre virtudes e termos da codificação espírita na grade de letras de forma totalmente dinâmica, e descubra belas explicações morais de cada termo localizado · Disponível em /jogos/caca-palavras" },
  { status: "feito", titulo: "Caminho da Luz — avance casas respondendo perguntas doutrinárias", cardTitle: "Caminho da Luz", descricao: "Jogo de tabuleiro das virtudes para 1 ou 2 jogadores, com som e animações dinâmicas de avanço · Disponível em /jogos/caminho-da-luz" },
  { status: "planejado", titulo: "Palavras cruzadas com termos espíritas", descricao: "Grade de palavras cruzadas com termos e definições retirados dos 5 livros da codificação · Gerada automaticamente para nunca repetir o mesmo jogo" },
  { status: "planejado", titulo: "Quiz de trechos — adivinhe o livro e o capítulo", descricao: "Um trecho dos livros de Kardec aparece na tela e o jogador deve identificar de qual livro e capítulo aquela passagem foi extraída" },
  { status: "planejado", titulo: "Batalha Naval Espírita — jogo em dupla ou contra o computador", descricao: "Versão do jogo Batalha Naval onde, no lugar dos barcos, há palavras da doutrina espírita de tamanhos variados. Pode ser jogado convidando outro membro ou contra o computador. À medida que o jogador acerta todas as letras de uma palavra, o seu significado na doutrina é revelado" },
  { status: "feito", titulo: "Jogos educativos adaptados para crianças da evangelização", descricao: "Jogo da memória com virtudes e palavras do Evangelho · Três dificuldades · Hub de evangelização com planos de aula · Disponível em /evangelizacao e /jogos/memoria-evangelizacao" },

  // ── PENDENTE — Ferramentas de apoio ──────────────────────────────────────

  { status: "planejado", titulo: "Player de PowerPoint — apresentações direto na plataforma", cardTitle: "Player de PowerPoint", descricao: "Apresente arquivos de PowerPoint diretamente no site, sem precisar de instalações ou aplicativos externos · Ideal para palestrantes e coordenadores" },

  // ── FEITO — Organização e gestão de eventos ──────────────────────────────

  { status: "feito", titulo: "Board Kanban de eventos da casa espírita", cardTitle: "Kanban de Eventos", descricao: "Board Kanban com 4 colunas (Ideia, Planejando, Em andamento, Concluído) e drag-and-drop para controle visual de eventos da casa · Disponível em /eventos" },
  { status: "feito", titulo: "Grupos de trabalho com Kanban de tarefas", cardTitle: "Kanban de Grupos", descricao: "Criação de grupos de trabalho com Kanban individual para gerenciar tarefas · Cada grupo tem sua própria coluna de atividades (Pendente, Em progresso, Concluído) · Membros podem ser atribuídos a tarefas e acompanhar progresso em tempo real · Disponível em /grupos" },
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

// Gera uma chave estável — usa cardTitle quando disponível para compatibilidade com /inicio
function toItemKey(titulo: string): string {
  return titulo.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 80);
}

function itemVoteKey(item: Item): string {
  return toItemKey(item.cardTitle ?? item.titulo);
}

interface VoteMap {
  [key: string]: { count: number; votedByMe: boolean };
}

function Painel() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [busca, setBusca] = useState("");
  const [solicitacoes, setSolicitacoes] = useState<Item[]>([]);
  const [sugestoes, setSugestoes] = useState<Item[]>([]);
  const [solTitulo, setSolTitulo] = useState("");
  const [solDesc, setSolDesc] = useState("");
  const [sendingSol, setSendingSol] = useState(false);
  const [solOk, setSolOk] = useState(false);
  const [solError, setSolError] = useState("");
  const [votes, setVotes] = useState<VoteMap>({});
  const [votingKey, setVotingKey] = useState<string | null>(null);

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

  const fetchVotes = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("painel_votes")
      .select("item_key, user_id");
    if (!data) return;

    const map: VoteMap = {};
    for (const row of data) {
      if (!map[row.item_key]) map[row.item_key] = { count: 0, votedByMe: false };
      map[row.item_key].count++;
      if (row.user_id === user.id) map[row.item_key].votedByMe = true;
    }
    setVotes(map);
  }, [user]);

  const handleVote = async (key: string) => {
    if (!user || votes[key]?.votedByMe) return;
    setVotingKey(key);
    try {
      await supabase
        .from("painel_votes")
        .insert({ item_key: key, user_id: user.id });
      setVotes((v) => ({
        ...v,
        [key]: { count: (v[key]?.count ?? 0) + 1, votedByMe: true },
      }));
    } finally {
      setVotingKey(null);
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
    if (!loading && user && (!profile?.sigla_casa || !profile?.nome || !profile?.cargo_principal || !profile?.uf || !profile?.cidade)) navigate({ to: "/completar-perfil" });
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    if (user) { fetchSolicitacoes(); fetchSugestoes(); fetchVotes(); }
  }, [user, fetchVotes]);

  if (loading || !user) return null;

  const allItems = [...roadmap.filter(i => i.status !== "feito"), ...solicitacoes, ...sugestoes];

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
  const totalResultados = filtered.length;

  // Ordena pendentes por votos (mais votados primeiro)
  const sortedFiltered = filtered.map((item) => ({
    item,
    voteCount: item.status === "planejado" ? (votes[toItemKey(item.titulo)]?.count ?? 0) : 0,
  }));

  const getItemsByStatus = (status: Status) =>
    sortedFiltered
      .filter(({ item }) => item.status === status)
      .sort((a, b) => status === "planejado" ? b.voteCount - a.voteCount : 0)
      .map(({ item }) => item);

  return (
    <main className="page-light min-h-screen pt-20 pb-20">
      <CasaHero />
      <div style={{ maxWidth: 860, margin: "0 auto" }} className="px-4 md:px-[44px] pt-12 pb-0">
        {/* Título da seção */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontFamily: '"Libre Caslon Text", Georgia, serif', fontSize: "1.5rem", fontWeight: 400, color: "#111418", margin: 0, marginBottom: 6 }}>
            Acompanhamento do Projeto
          </h2>
          <p style={{ fontFamily: "Inter", fontSize: "0.9rem", color: "#637080", margin: 0 }}>
            O que está pendente e como solicitar novos recursos.
          </p>
        </div>

        {/* Aviso de votação */}
        <div style={{ background: "#ebf0f9", border: "1px solid rgba(0,74,140,.15)", borderRadius: 16, padding: "16px 20px", marginBottom: 32 }}>
          <div className="flex items-start gap-3">
            <ThumbsUp size={16} style={{ color: "#004a8c" }} className="mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-foreground font-light">
                <span style={{ fontWeight: 600, color: "#004a8c" }}>Vote nos itens pendentes</span> que considera mais importantes.
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Os itens com mais curtidas serão desenvolvidos primeiro. Cada membro pode curtir qualquer item pendente — e descurtir quando quiser.
              </p>
            </div>
          </div>
        </div>

        {/* Busca */}
        <div className="relative mb-8">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none" />
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
        {(["andamento", "planejado"] as Status[]).map((status) => {
          const items = getItemsByStatus(status);
          if (items.length === 0) return null;
          return (
            <div key={status} className="mb-8">
              <h2 className="text-xs uppercase tracking-[0.3em] text-muted-foreground/60 mb-3 flex items-center gap-2">
                <span className={`text-base ${badge[status].color.split(" ")[0]}`}>{icon[status]}</span>
                {badge[status].label}
                {status === "planejado" && (
                  <span className="text-muted-foreground/40 normal-case tracking-normal font-normal ml-1">
                    — ordenados por votos
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
                      ? { background: "#eaf8f1", border: "1px solid rgba(10,92,53,.15)", borderRadius: 12, padding: "14px 18px", marginBottom: 8 }
                      : item.status === "andamento"
                      ? { background: "#ebf0f9", border: "1px solid rgba(0,74,140,.15)", borderRadius: 12, padding: "14px 18px", marginBottom: 8 }
                      : { background: "#ffffff", border: "1px solid rgba(0,20,70,.08)", borderRadius: 12, padding: "14px 18px", marginBottom: 8 };

                  return (
                    <div
                      key={item.titulo}
                      style={cardStyle}
                      className="flex items-start gap-4"
                    >
                      <span className={`text-sm mt-0.5 shrink-0 ${badge[status].color.split(" ")[0]}`}>
                        {icon[status]}
                      </span>
                      <div className="flex-1 min-w-0">
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
                      {isPending && (
                        <button
                          onClick={() => handleVote(itemVoteKey(item))}
                          disabled={isVoting || voted}
                          title={voted ? "Você já votou neste item" : "Curtir este item"}
                          className={`shrink-0 flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl border transition-colors disabled:opacity-50 disabled:cursor-default ${
                            voted
                              ? "text-cyan-glow border-cyan-glow/40 bg-cyan-glow/10"
                              : "text-muted-foreground/40 border-white/10 hover:text-cyan-glow hover:border-cyan-glow/30 hover:bg-cyan-glow/5"
                          }`}
                        >
                          <ThumbsUp size={13} />
                          <span className="text-[10px] leading-none font-medium">{count > 0 ? count : ""}</span>
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
