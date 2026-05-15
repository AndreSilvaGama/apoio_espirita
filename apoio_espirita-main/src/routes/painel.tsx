import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/painel")({
  component: Painel,
});

type Status = "feito" | "andamento" | "planejado";

interface Item {
  status: Status;
  titulo: string;
  descricao?: string;
}

const roadmap: Item[] = [
  // FEITO
  { status: "feito", titulo: "Página inicial com hero, partículas animadas e vídeo de voo sobre as nuvens", descricao: "Animação de fundo com vídeo de nebulosa em loop · Partículas flutuantes · Design responsivo para todos os dispositivos" },
  { status: "feito", titulo: "Música ambiente (piano) com botão de controle", descricao: "Toca automaticamente em volume suave · Botão discreto para pausar e retomar · Não interrompe a navegação" },
  { status: "feito", titulo: "Favicon — cepa de videira (ramo de uva)", descricao: "Ícone personalizado exibido na aba do navegador e ao salvar na tela inicial do celular" },
  { status: "feito", titulo: "Logomarca — cepa de videira realista", descricao: "Imagem da logomarca exibida no cabeçalho de navegação e registrada no JSON-LD da organização para SEO" },
  { status: "feito", titulo: "Assistente 'Preciso de Ajuda'", descricao: "Apoio emocional (CVV) · Busca de alimentação por CEP · Busca de casa espírita por CEP ou cidade/bairro" },
  { status: "feito", titulo: "Página Transparência & Propósito — aviso de independência institucional", descricao: "Declaração de independência — sem vínculo com a FEB, UFE ou qualquer associação · Plataforma livre como uma rede social" },
  { status: "feito", titulo: "Página de Sugestões integrada ao banco de dados", descricao: "Formulário público para envio de sugestões · Notificação automática por e-mail ao receber nova mensagem" },
  { status: "feito", titulo: "Autenticação completa", descricao: "Login com Google · E-mail e senha · Seleção e cadastro de sigla da casa espírita" },
  { status: "feito", titulo: "Painel de acompanhamento do projeto (você está aqui)", descricao: "Lista todos os itens planejados, em andamento e concluídos · Barra de progresso · Formulário de solicitação de novos desenvolvimentos" },
  { status: "feito", titulo: "Exclusão de conta pelo próprio usuário", descricao: "Usuário remove permanentemente todos os seus dados pela página de perfil" },
  { status: "feito", titulo: "Deploy na Cloudflare Workers — apoioespirita.com.br", descricao: "Hospedagem na rede de borda da Cloudflare · HTTPS automático · Domínio próprio apoioespirita.com.br" },
  { status: "feito", titulo: "Autenticação com Google (OAuth)", descricao: "Login com um clique usando conta Google · Redirecionamento automático para preenchimento de perfil no primeiro acesso" },
  { status: "feito", titulo: "Cadastro de casas espíritas no banco de dados", descricao: "Tabelas: casas_espirita · siglas_casas · profiles" },
  { status: "feito", titulo: "Página de perfil do usuário", descricao: "Edição de dados pessoais · Alteração de senha · Exclusão de conta" },
  { status: "feito", titulo: "Notificações por e-mail via Brevo", descricao: "E-mail automático ao receber sugestão ou solicitação de desenvolvimento" },
  { status: "feito", titulo: "Seleção obrigatória de cargo e atividades no primeiro acesso", descricao: "Cargos: Presidente, Vice, Dirigente, Diretoria, Coordenadoria, Tarefeiro, Frequentador, Visitante · 15 atividades selecionáveis" },
  { status: "feito", titulo: "Expansão dos cargos cadastráveis no perfil", descricao: "24 cargos em 5 níveis hierárquicos: Presidente · Vice-presidente · Coordenador · Diretoria · Dirigente · Dirigente de reunião mediúnica · Tesoureiro · Assistido · Associado · Atendente fraterno · Colaborador · Estudante · Evangelizador · Expositor · Facilitador · Frequentador · Médium · Palestrante · Participante de estudo · Passista · Sócio · Tarefeiro · Trabalhador · Visitante" },
  { status: "feito", titulo: "Página inicial pós-login com painel de funcionalidades", descricao: "Dashboard com grade de recursos, bazar on-line e mensagem do dia" },
  { status: "feito", titulo: "Mensagem do Dia enviada pela comunidade com fila de exibição", descricao: "Membros enviam mensagens com referência · Algoritmo evita repetir a mesma casa em dias consecutivos · Somente uma mensagem por dia" },
  { status: "feito", titulo: "Ícones profissionais Lucide em todas as páginas", descricao: "Substituição de emojis por ícones vetoriais com traço consistente" },
  { status: "feito", titulo: "Tesouraria — menu visível apenas para presidentes e vice-presidentes", descricao: "Item no menu de navegação acessível apenas por presidentes e vice-presidentes · Módulo financeiro a ser implementado" },
  { status: "feito", titulo: "Rádio Rio de Janeiro integrada", descricao: "Player de rádio integrado · Para automaticamente a música de piano ao ser ativada" },
  { status: "feito", titulo: "SEO completo", descricao: "Meta tags completas · og:image · twitter:card · JSON-LD WebSite + Organization · robots.txt · sitemap.xml · lang='pt-BR' · canonical URL" },
  { status: "feito", titulo: "Busca por palavra no acompanhamento do projeto", descricao: "Campo de busca filtra itens do roadmap em tempo real por título e descrição · Grupos vazios ocultados automaticamente · Contador de resultados" },
  { status: "feito", titulo: "Botão de retornar ao topo em todas as páginas", descricao: "Aparece ao rolar mais de 300 px · Posicionado no canto inferior direito acima do rodapé · Rola suavemente até o início da página · Presente em todas as rotas públicas e autenticadas" },

  // PLANEJADO — Fundação (base para tudo)
  { status: "planejado", titulo: "Revisão e correção de redundâncias no site", descricao: "Auditoria de duplicidades visuais, textos e fluxos de navegação · Padronização de componentes" },
  { status: "planejado", titulo: "Filtro fraternal — verificação de tom em todos os textos", descricao: "Linguagem sempre amorosa e fraterna; alerta automático em caso de desvio" },
  { status: "planejado", titulo: "Acessibilidade — usabilidade para idosos e pessoas com dificuldades tecnológicas", descricao: "Contraste adequado · Fontes legíveis · Navegação por teclado · Tamanhos de toque acessíveis no celular" },
  { status: "planejado", titulo: "FAQ — Perguntas e respostas detalhadas sobre o uso do site", descricao: "Dúvidas sobre cadastro, uso da plataforma e princípios espíritas · Organizado por categoria" },
  { status: "planejado", titulo: "Menu de navegação completo + campo de busca global", descricao: "Menu responsivo com todas as seções · Campo de busca para localizar conteúdo, membros e casas" },

  // PLANEJADO — Perfil e cadastro
  { status: "planejado", titulo: "Sistema de controle de acesso hierárquico por cargo", descricao: "5 níveis: Presidente (controle total — gerencia todos, bloqueia cargos alterados por ele) → Vice-presidente (gerencia todos exceto Presidente) → Coordenador/Diretoria/Dirigente/Dirigente mediúnico (gerencia os abaixo) → Tesoureiro (acesso total à Tesouraria, igual ao Presidente neste módulo) → demais membros (somente permissões liberadas pelos superiores). Presidente recebe notificação sempre que alguém escolhe ou altera seu cargo." },
  { status: "planejado", titulo: "Perfil de habilidades, currículo e disponibilidade do membro", descricao: "LinkedIn · Situação de emprego · Disponibilidade para voluntariado · Pedido de ajuda privado ou público" },
  { status: "planejado", titulo: "Cadastro e gerenciamento de casas espíritas", descricao: "Presidentes cadastram dados da casa, endereço, contato e foto · Membros se associam à casa por sigla" },
  { status: "planejado", titulo: "Mapa de casas espíritas", descricao: "Visualização geográfica das casas cadastradas · Filtros por cidade e estado · Abertura no Google Maps" },
  { status: "planejado", titulo: "Chave PIX da casa espírita para doações e bazar online", descricao: "Geração de QR Code para impressão e uso no espaço físico" },

  // PLANEJADO — Conteúdo e espiritualidade
  { status: "planejado", titulo: "Mensagem espírita ao logar", descricao: "Trecho da codificação com nome do livro, capítulo e página — desabilitável pelo usuário ou obrigatória pelo presidente" },
  { status: "planejado", titulo: "Colunas autorais com sistema de medalhas virtuais", descricao: "Identificação do autor e do centro espírita · Reações exclusivas (sem imitar outras redes) · Contagem de curtidas" },
  { status: "planejado", titulo: "Área de perguntas e respostas para aprofundamento do conhecimento", descricao: "Usuários podem criar e responder perguntas" },
  { status: "planejado", titulo: "Cifras e partituras de músicas espíritas", descricao: "Usuários logados enviam composições · Qualquer visitante pode ouvir e curtir" },
  { status: "planejado", titulo: "Playlists espíritas — Recepção e Hora do Passe", descricao: "Playlists curadas pela comunidade · Reprodução direto pelo navegador · Categorizadas por momento da reunião" },
  { status: "planejado", titulo: "Área de palestras com suporte a arquivos PowerPoint", descricao: "Recurso de apresentação com player integrado" },

  // PLANEJADO — Vida espiritual e comunidade
  { status: "planejado", titulo: "Aniversariantes do Mês", descricao: "Calendário de aniversários dos membros da casa · Aparece em destaque no topo da home no mês do aniversário · Notificação automática ao coordenador" },
  { status: "planejado", titulo: "Plantão de Orações", descricao: "Membros se inscrevem em horários de oração coletiva à distância · Agenda semanal visível para todos · Confirmação de participação e histórico" },
  { status: "planejado", titulo: "Mural de Avisos", descricao: "Quadro digital da casa · Presidentes e coordenadores publicam comunicados · Membros visualizam ao entrar na plataforma · Avisos com data de expiração" },
  { status: "planejado", titulo: "Ficha de Atendimento Fraterno", descricao: "Formulário confidencial para registro de pessoas atendidas · Histórico de atendimentos · Acessível apenas pelo coordenador de assistência fraterna" },

  // PLANEJADO — Solidariedade e mobilidade
  { status: "planejado", titulo: "Carona Solidária", descricao: "Membros com carro se disponibilizam para dar carona a quem precisa — da mesma casa espírita ou de outra · Solicitação, confirmação e histórico de caronas" },
  { status: "planejado", titulo: "Entrega Solidária", descricao: "Voluntários se oferecem para entregar itens comprados no bazar on-line · Agendamento, confirmação e rastreamento simplificado" },

  // PLANEJADO — Organização do centro
  { status: "planejado", titulo: "Caderno de Presença Digital", descricao: "Membros marcam presença nas reuniões pelo celular com um toque · Coordenador vê relatório por reunião e por membro · Histórico exportável" },
  { status: "planejado", titulo: "Escala de Trabalho", descricao: "Presidente ou coordenador monta a escala semanal e mensal de tarefeiros · Cada membro recebe notificação e vê sua escala pelo celular" },
  { status: "planejado", titulo: "Grade de atividades e eventos do centro espírita", descricao: "Membros podem se candidatar como voluntários para cada tarefa ou evento" },
  { status: "planejado", titulo: "Livro de presença digital para reuniões", descricao: "Controlado pelo coordenador · Integrado à lista de confirmações" },
  { status: "planejado", titulo: "Reuniões com confirmação de presença, ata e livro de presença", descricao: "Reuniões abertas ou fechadas · Geração de ata ao término" },
  { status: "planejado", titulo: "Cruzamento de habilidades de membros com necessidades do centro", descricao: "Alertas para membros voluntários quando alguém precisar de ajuda" },
  { status: "planejado", titulo: "Sistema de sugestões com progresso, curtidas e comentários", descricao: "Acompanhamento por datas · Autor identificado · Motivação registrada" },
  { status: "planejado", titulo: "Grupos de comunicação interna por tipo de atividade", descricao: "Semelhante a grupos do WhatsApp — dentro da plataforma" },
  { status: "planejado", titulo: "Notificações internas e via WhatsApp para coordenadores e presidentes", descricao: "Alertas de eventos, ausências, aprovações e solicitações · Integração com WhatsApp Business API" },
  { status: "planejado", titulo: "PWA — acesso via celular como aplicativo", descricao: "Instalação do site como app no celular sem loja de aplicativos · Ícone na tela inicial · Funcionamento offline parcial" },

  // PLANEJADO — Tesouraria e financeiro
  { status: "planejado", titulo: "Tesouraria simplificada — contas a pagar e receber", descricao: "Interface acessível mesmo para usuários com pouca familiaridade com tecnologia · Acesso controlado pelo presidente" },
  { status: "planejado", titulo: "Bazar online com integração PIX", descricao: "Publicação de itens com foto, descrição e preço · Pagamento via PIX com QR Code gerado automaticamente · Gestão de estoque pelo administrador" },

  // PLANEJADO — Painéis de gestão
  { status: "planejado", titulo: "Dashboard do Presidente", descricao: "Dados financeiros · Tarefeiros · Funcionamento geral da casa" },
  { status: "planejado", titulo: "Dashboard do Coordenador", descricao: "Movimentações da coordenação" },
  { status: "planejado", titulo: "Dashboard do Tesoureiro", descricao: "Resumo de entradas e saídas · Relatório mensal · Exportação para planilha" },
  { status: "planejado", titulo: "Parametrização pelo Presidente", descricao: "Três estados por recurso: Desabilitado · Opcional · Obrigatório · Inclui sistema de votação para decisões da casa" },

  // PLANEJADO — Comunicação e transmissão
  { status: "planejado", titulo: "Transmissão de palestras ao vivo pelo celular", descricao: "Um celular transmite; todos logados no centro podem assistir" },
  { status: "planejado", titulo: "Integração com Google Meet ou solução própria de videoconferência", descricao: "Criação de sala com link compartilhável diretamente pela plataforma" },
  { status: "planejado", titulo: "Integração com StreamYard ou solução própria de transmissão ao vivo", descricao: "Conexão com streaming profissional para transmissão das palestras" },

  // PLANEJADO — Educação
  { status: "planejado", titulo: "Recursos para evangelização infantil — módulo escolar", descricao: "Planos de aula, histórias e atividades para professores da evangelização · Material organizado por faixa etária" },
  { status: "feito", titulo: "Plante a Semente — jogo educativo sobre a codificação espírita", descricao: "Jogo no estilo forca onde uma planta cresce à medida que o jogador descobre o termo. Ao completar, revela o significado e a referência exata no livro da codificação." },
  { status: "planejado", titulo: "Quiz de codificação — perguntas sobre os livros de Kardec", descricao: "Perguntas de múltipla escolha sobre O Livro dos Espíritos, O Evangelho segundo o Espiritismo e demais livros · Placar por rodada · Três níveis de dificuldade: fácil, médio e difícil" },
  { status: "planejado", titulo: "Jogo da memória — conceitos e respostas da doutrina", descricao: "Pares de cartas com termos e seus significados extraídos da codificação espírita · Tabuleiro embaralhado a cada rodada" },
  { status: "planejado", titulo: "Palavras cruzadas — termos espíritas", descricao: "Grade de palavras cruzadas com termos e definições da codificação · Gerada dinamicamente com banco de termos dos 5 livros" },
  { status: "planejado", titulo: "Quiz de versículos — identifique o livro e o capítulo", descricao: "Trecho exibido na tela e o jogador deve identificar de qual livro e capítulo da codificação ele foi extraído" },
  { status: "planejado", titulo: "Jogos educativos para a infância", descricao: "Atividades lúdicas adaptadas para crianças da evangelização — memória, palavras cruzadas e histórias animadas" },
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

const totals = (status: Status) => roadmap.filter((i) => i.status === status).length;

function Painel() {
  const navigate = useNavigate();
  const { user, profile, loading, signOut } = useAuth();
  const [busca, setBusca] = useState("");
  const [solTitulo, setSolTitulo] = useState("");
  const [solDesc, setSolDesc] = useState("");
  const [sendingSol, setSendingSol] = useState(false);
  const [solOk, setSolOk] = useState(false);
  const [solError, setSolError] = useState("");

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

  if (loading || !user) return null;

  const done = totals("feito");
  const total = roadmap.length;
  const pct = Math.round((done / total) * 100);

  const termo = busca.trim().toLowerCase();
  const filtered = termo
    ? roadmap.filter(
        (i) =>
          i.titulo.toLowerCase().includes(termo) ||
          (i.descricao ?? "").toLowerCase().includes(termo)
      )
    : roadmap;

  return (
    <main className="page-light min-h-screen px-6 pt-20 pb-20">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-12 flex-wrap gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-glow mb-2">Painel</p>
            <h1 className="text-3xl font-light text-foreground">Acompanhamento do Projeto</h1>
            {profile?.sigla_casa && (
              <p className="mt-1 text-sm text-muted-foreground font-light">
                Casa: <span className="text-cyan-glow font-medium tracking-widest">{profile.sigla_casa}</span>
              </p>
            )}
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
            placeholder="Buscar por palavra…"
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
            {filtered.length === 0
              ? "Nenhum item encontrado."
              : `${filtered.length} item${filtered.length > 1 ? "s" : ""} encontrado${filtered.length > 1 ? "s" : ""}.`}
          </p>
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
