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
      "Não é necessário instalar das lojas oficiais de aplicativos. O site é desenvolvido como um PWA (Progressive Web App). Você pode adicioná-lo como um ícone na tela inicial de seu celular: no navegador do celular (Chrome ou Safari), acesse as opções de compartilhamento ou o menu de três pontos e clique em 'Adicionar à tela inicial'. Ele funcionará de forma idêntica a um aplicativo nativo.",
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
    pergunta: "Como funciona o processo de exclusão da minha conta?",
    resposta:
      "Sua privacidade é nossa prioridade. Se decidir não utilizar mais a plataforma, vá em 'Perfil', desça até o rodapé da página e clique no botão de exclusão permanente. O sistema removerá imediatamente todas as suas informações pessoais, vínculos com a casa espírita e preferências do banco de dados principal. Essa ação é irreversível.",
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
