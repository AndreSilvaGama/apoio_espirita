import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
  { status: "feito", titulo: "Página inicial com hero, partículas animadas e vídeo de voo sobre as nuvens" },
  { status: "feito", titulo: "Música ambiente (piano) com botão de controle" },
  { status: "feito", titulo: "Favicon — cepa de videira (ramo de uva)" },
  { status: "feito", titulo: "Assistente 'Preciso de Ajuda'", descricao: "Apoio emocional (CVV) · Busca de alimentação por CEP · Busca de casa espírita por CEP ou cidade/bairro" },
  { status: "feito", titulo: "Página Transparência & Propósito", descricao: "Declaração de independência — sem vínculo com a FEB ou qualquer associação oficial" },
  { status: "feito", titulo: "Página de Sugestões integrada ao banco de dados" },
  { status: "feito", titulo: "Autenticação completa", descricao: "Login com Google · E-mail e senha · Seleção e cadastro de sigla da casa espírita" },
  { status: "feito", titulo: "Painel de acompanhamento do projeto (você está aqui)" },
  { status: "feito", titulo: "Exclusão de conta pelo próprio usuário" },
  { status: "feito", titulo: "Deploy na Cloudflare Workers — apoioespirita.com.br" },
  { status: "feito", titulo: "Autenticação com Google (OAuth)" },
  { status: "feito", titulo: "Cadastro de casas espíritas no banco de dados", descricao: "Tabelas: casas_espirita · siglas_casas · profiles" },
  { status: "feito", titulo: "Página de perfil do usuário", descricao: "Edição de dados pessoais · Alteração de senha · Exclusão de conta" },
  { status: "feito", titulo: "Notificações por e-mail via Brevo", descricao: "E-mail automático ao receber sugestão ou solicitação de desenvolvimento" },

  // PLANEJADO — Fundação (base para tudo)
  { status: "planejado", titulo: "Revisão e correção de redundâncias no site" },
  { status: "planejado", titulo: "Filtro fraternal — verificação de tom em todos os textos por IA", descricao: "Linguagem sempre amorosa e fraterna; alerta automático em caso de desvio" },
  { status: "planejado", titulo: "Acessibilidade — usabilidade para idosos e pessoas com dificuldades tecnológicas" },
  { status: "planejado", titulo: "Aviso de independência institucional na página principal", descricao: "Sem vínculo com a FEB, UFE ou qualquer associação — plataforma livre como uma rede social" },
  { status: "planejado", titulo: "FAQ — Perguntas e respostas detalhadas sobre o uso do site" },
  { status: "planejado", titulo: "Menu de navegação completo + campo de busca global" },

  // PLANEJADO — Perfil e cadastro
  { status: "planejado", titulo: "Cargo do usuário no centro espírita", descricao: "Presidente · Coordenador · Palestrante · Tarefeiro — controla permissões de edição e visualização" },
  { status: "planejado", titulo: "Perfil de habilidades, currículo e disponibilidade do membro", descricao: "LinkedIn · Situação de emprego · Disponibilidade para voluntariado · Pedido de ajuda privado ou público" },
  { status: "planejado", titulo: "Cadastro e gerenciamento de casas espíritas" },
  { status: "planejado", titulo: "Mapa de casas espíritas" },
  { status: "planejado", titulo: "Chave PIX da casa espírita para doações e bazar online", descricao: "Geração de QR Code para impressão e uso no espaço físico" },

  // PLANEJADO — Conteúdo e espiritualidade
  { status: "planejado", titulo: "Mensagem espírita ao logar", descricao: "Trecho da codificação com nome do livro, capítulo e página — desabilitável pelo usuário ou obrigatória pelo presidente" },
  { status: "planejado", titulo: "Colunas autorais com sistema de medalhas virtuais", descricao: "Identificação do autor e do centro espírita · Reações exclusivas (sem imitar outras redes) · Contagem de curtidas" },
  { status: "planejado", titulo: "Área de perguntas e respostas para aprofundamento do conhecimento", descricao: "Usuários podem criar e responder perguntas" },
  { status: "planejado", titulo: "Cifras e partituras de músicas espíritas", descricao: "Usuários logados enviam composições · Qualquer visitante pode ouvir e curtir" },
  { status: "planejado", titulo: "Playlists espíritas — Recepção e Hora do Passe" },
  { status: "planejado", titulo: "Rádio Rio de Janeiro integrada", descricao: "Para automaticamente a música de piano ao ser ativada" },
  { status: "planejado", titulo: "Área de palestras com suporte a arquivos PowerPoint", descricao: "Recurso de apresentação com player integrado" },

  // PLANEJADO — Organização do centro
  { status: "planejado", titulo: "Grade de atividades e eventos do centro espírita", descricao: "Membros podem se candidatar como voluntários para cada tarefa ou evento" },
  { status: "planejado", titulo: "Livro de presença digital para reuniões", descricao: "Controlado pelo coordenador · Integrado à lista de confirmações" },
  { status: "planejado", titulo: "Reuniões com confirmação de presença, ata e livro de presença", descricao: "Reuniões abertas ou fechadas · Geração de ata ao término" },
  { status: "planejado", titulo: "Cruzamento de habilidades de membros com necessidades do centro", descricao: "Alertas para membros voluntários quando alguém precisar de ajuda" },
  { status: "planejado", titulo: "Sistema de sugestões com progresso, curtidas e comentários", descricao: "Acompanhamento por datas · Autor identificado · Motivação registrada" },
  { status: "planejado", titulo: "Grupos de comunicação interna por tipo de atividade", descricao: "Semelhante a grupos do WhatsApp — dentro da plataforma" },
  { status: "planejado", titulo: "Notificações internas e via WhatsApp para coordenadores e presidentes" },
  { status: "planejado", titulo: "PWA — acesso via celular como aplicativo" },

  // PLANEJADO — Tesouraria e financeiro
  { status: "planejado", titulo: "Tesouraria simplificada — contas a pagar e receber", descricao: "Interface acessível mesmo para usuários com pouca familiaridade com tecnologia · Acesso controlado pelo presidente" },
  { status: "planejado", titulo: "Bazar online com integração PIX" },

  // PLANEJADO — Painéis de gestão
  { status: "planejado", titulo: "Dashboard do Presidente", descricao: "Dados financeiros · Tarefeiros · Funcionamento geral da casa" },
  { status: "planejado", titulo: "Dashboard do Coordenador", descricao: "Movimentações da coordenação" },
  { status: "planejado", titulo: "Dashboard do Tesoureiro" },
  { status: "planejado", titulo: "Parametrização pelo Presidente", descricao: "Três estados por recurso: Desabilitado · Opcional · Obrigatório · Inclui sistema de votação para decisões da casa" },

  // PLANEJADO — Comunicação e transmissão
  { status: "planejado", titulo: "Transmissão de palestras ao vivo pelo celular", descricao: "Um celular transmite; todos logados no centro podem assistir" },
  { status: "planejado", titulo: "Integração com Google Meet ou solução própria de videoconferência" },
  { status: "planejado", titulo: "Integração com StreamYard ou solução própria de transmissão ao vivo" },

  // PLANEJADO — Educação
  { status: "planejado", titulo: "Recursos para evangelização infantil — módulo escolar" },
  { status: "planejado", titulo: "Jogos educativos sobre os livros da codificação espírita" },
  { status: "planejado", titulo: "Jogos educativos para a infância" },
];

const badge: Record<Status, { label: string; color: string }> = {
  feito:     { label: "Feito",       color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  andamento: { label: "Em andamento", color: "text-amber-400  bg-amber-400/10  border-amber-400/20"  },
  planejado: { label: "Planejado",   color: "text-cyan-glow  bg-cyan-glow/10  border-cyan-glow/20"  },
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

  return (
    <main className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-12 flex-wrap gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-glow mb-2">Painel</p>
            <h1 className="text-3xl font-light text-foreground">Acompanhamento do Projeto</h1>
            {profile?.sigla_casa && (
              <p className="mt-1 text-sm text-muted-foreground font-light">
                Casa: <span className="text-cyan-glow font-medium tracking-widest">{profile.sigla_casa}</span>
                {profile.cargo_principal && (
                  <span className="ml-2 text-xs uppercase tracking-widest text-muted-foreground/50">
                    · {profile.cargo_principal}
                  </span>
                )}
              </p>
            )}
            {profile?.atividades && profile.atividades.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {profile.atividades.map((a) => (
                  <span key={a} className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border border-cyan-glow/20 text-cyan-glow/60">
                    {a}
                  </span>
                ))}
              </div>
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
              className="h-full rounded-full bg-gradient-to-r from-cyan-glow to-emerald-400 transition-all duration-1000"
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

        {/* Items by group */}
        {(["feito", "andamento", "planejado"] as Status[]).map((status) => (
          <div key={status} className="mb-8">
            <h2 className="text-xs uppercase tracking-[0.3em] text-muted-foreground/60 mb-3 flex items-center gap-2">
              <span className={`text-base ${badge[status].color.split(" ")[0]}`}>{icon[status]}</span>
              {badge[status].label}
            </h2>
            <div className="space-y-2">
              {roadmap.filter((i) => i.status === status).map((item) => (
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
        ))}

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
