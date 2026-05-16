import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronDown, Search, X, MapPin, Heart, Utensils, MessageSquare, Flag } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { HelpDialog } from "@/components/HelpDialog";

export const Route = createFileRoute("/ajuda")({
  component: Ajuda,
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
  { pergunta: "Como funciona a Agenda?", resposta: "Presidentes e coordenadores criam eventos abertos (todos os membros) ou fechados (convidados específicos). Membros confirmam ou recusam presença. A aba 'Presenças' mostra o histórico de frequência de cada membro por evento." },
  { pergunta: "Como acesso a Tesouraria?", resposta: "A Tesouraria é restrita a Presidente e Tesoureiro. Se você tiver permissão, clique no card 'Tesouraria' na tela inicial ou acesse pelo menu. Quem não tem acesso verá uma mensagem informando a restrição." },
  { pergunta: "Como funciona a Rádio Rio de Janeiro?", resposta: "O player da rádio fica no rodapé de todas as páginas. Clique no botão de play para ligar. A transmissão é ao vivo, 24 horas. Você também pode acessar a página dedicada pelo menu." },
  { pergunta: "Como jogo o 'Plante a Semente'?", resposta: "Acesse 'Jogos' no menu. É um jogo estilo forca com termos da codificação espírita — a cada letra correta a planta cresce. Ao completar, o significado do termo é revelado com a referência exata no livro." },
  { pergunta: "Como reporto um problema no site?", resposta: "Clique em 'Reportar problema' no rodapé de qualquer página. Descreva o que está acontecendo e envie por e-mail. Você também pode optar por avisar pelo WhatsApp, com a mensagem já preenchida." },
  { pergunta: "Como faço sugestões?", resposta: "Clique em 'Sugestões' no rodapé ou acesse /sugestoes. Qualquer pessoa pode enviar sugestões, mesmo sem estar logada." },
  { pergunta: "O site tem aplicativo para celular?", resposta: "Ainda não está nas lojas de aplicativos, mas você pode salvar o site como atalho na tela inicial do celular. No navegador do celular, use a opção 'Adicionar à tela inicial' (ou 'Compartilhar → Adicionar à tela de início' no iPhone)." },
  { pergunta: "Como excluo minha conta?", resposta: "Acesse 'Perfil' e role até o final da página. Há um botão para excluir a conta permanentemente. Todos os seus dados serão removidos e a ação não pode ser desfeita." },
  { pergunta: "Como cadastro minha casa espírita no mapa de busca?", resposta: "Ao completar o perfil pela primeira vez, ou ao editar a página de Perfil, você pode informar o nome e o endereço da sua casa. Se a sigla ainda não estiver cadastrada, a casa é adicionada automaticamente ao mapa de busca." },
];

function Ajuda() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [busca, setBusca] = useState("");
  const [faqAberto, setFaqAberto] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
    if (!loading && user && (!profile?.sigla_casa || !profile?.nome || !profile?.cargo_principal || !profile?.uf || !profile?.cidade)) {
      navigate({ to: "/completar-perfil" });
    }
  }, [user, profile, loading, navigate]);

  if (loading || !user) return null;

  const termo = busca.trim().toLowerCase();
  const filteredFaq = termo
    ? FAQ.filter((f) => f.pergunta.toLowerCase().includes(termo) || f.resposta.toLowerCase().includes(termo))
    : FAQ;

  const toggleFaq = (i: number) => {
    setFaqAberto((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
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
              Dúvidas sobre o site, busca de casas espíritas e apoio pessoal.
            </p>
          </div>
          <button
            onClick={() => navigate({ to: "/inicio" })}
            className="text-xs uppercase tracking-widest text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            ← Voltar
          </button>
        </div>

        {/* Apoio pessoal */}
        <div className="glass rounded-3xl p-6 mb-10">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground/60 mb-5">Precisa de apoio pessoal?</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <HelpDialog initialStep="find-center">
              <button className="glass rounded-2xl p-4 text-left hover:border-cyan-glow/40 transition-all duration-300 hover:-translate-y-0.5">
                <MapPin size={18} strokeWidth={1.5} className="text-cyan-glow mb-3" />
                <p className="text-sm font-medium text-foreground leading-snug">Encontrar uma casa espírita</p>
                <p className="text-xs text-muted-foreground/60 mt-1 font-light">Busque por estado e cidade</p>
              </button>
            </HelpDialog>
            <HelpDialog initialStep="emotional">
              <button className="glass rounded-2xl p-4 text-left hover:border-cyan-glow/40 transition-all duration-300 hover:-translate-y-0.5">
                <Heart size={18} strokeWidth={1.5} className="text-violet-400 mb-3" />
                <p className="text-sm font-medium text-foreground leading-snug">Apoio emocional</p>
                <p className="text-xs text-muted-foreground/60 mt-1 font-light">CVV — gratuito e sigiloso</p>
              </button>
            </HelpDialog>
            <HelpDialog initialStep="find-center">
              <button className="glass rounded-2xl p-4 text-left hover:border-cyan-glow/40 transition-all duration-300 hover:-translate-y-0.5">
                <Utensils size={18} strokeWidth={1.5} className="text-emerald-400 mb-3" />
                <p className="text-sm font-medium text-foreground leading-snug">Assistência com alimentos</p>
                <p className="text-xs text-muted-foreground/60 mt-1 font-light">Casas espíritas próximas</p>
              </button>
            </HelpDialog>
          </div>
        </div>

        {/* Busca */}
        <div className="relative mb-6">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none" />
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
              <p className="text-xs text-muted-foreground/60 font-light">O que foi feito e o que vem por aí</p>
            </div>
          </Link>
        </div>

      </div>
    </main>
  );
}
