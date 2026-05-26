import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { BookOpen, Brain, FileText, Clock, Users, Printer, ArrowRight, Leaf, Settings, HelpCircle } from "lucide-react";
import { CasaHero } from "@/components/CasaHero";

export const Route = createFileRoute("/evangelizacao")({
  component: Evangelizacao,
});

// ── Dados dos planos de aula ──────────────────────────────────────────────────

interface Atividade {
  duracao: string;
  descricao: string;
}

interface PlanoAula {
  id: string;
  tema: string;
  duracao: string;
  objetivo: string;
  atividades: Atividade[];
  materiais: string[];
}

interface FaixaEtaria {
  id: string;
  label: string;
  cor: string;
  corBadge: string;
  planos: PlanoAula[];
}

const FAIXAS: FaixaEtaria[] = [
  {
    id: "3-5",
    label: "3–5 anos",
    cor: "border-rose-200",
    corBadge: "bg-rose-100 text-rose-700",
    planos: [
      {
        id: "amizade",
        tema: "O Dom da Amizade",
        duracao: "45 min",
        objetivo: "A criança reconhece que a amizade é um dom de Deus e pratica gestos de carinho com os colegas.",
        atividades: [
          { duracao: "5 min",  descricao: "Acolhida: canção ou oração curta em roda" },
          { duracao: "10 min", descricao: "História contada com fantoches: dois amigos que se ajudam" },
          { duracao: "15 min", descricao: "Desenho livre: 'meu amigo favorito' — cada criança apresenta o desenho" },
          { duracao: "10 min", descricao: "Dinâmica: roda de abraços — cada criança abraça o colega ao lado e diz algo gentil" },
          { duracao: "5 min",  descricao: "Encerramento com oração de agradecimento pela amizade" },
        ],
        materiais: ["Fantoches", "Papel A4", "Giz de cera", "Música instrumental suave"],
      },
      {
        id: "natureza",
        tema: "Cuido da Natureza",
        duracao: "45 min",
        objetivo: "A criança compreende que cuidar da natureza é um gesto de amor a Deus e a todos.",
        atividades: [
          { duracao: "5 min",  descricao: "Oração de abertura em roda, de mãos dadas" },
          { duracao: "10 min", descricao: "Conversa ilustrada: mostrar imagens de natureza saudável e descuidada" },
          { duracao: "15 min", descricao: "Atividade: cada criança planta uma semente em copinho de papel" },
          { duracao: "10 min", descricao: "Colagem coletiva: 'nossa floresta de amor' — folhas de árvore carimbadas" },
          { duracao: "5 min",  descricao: "Encerramento: compromisso simbólico de cuidar de uma plantinha em casa" },
        ],
        materiais: ["Copinhos de papel", "Terra", "Sementes", "Tinta não-tóxica", "Cartolina"],
      },
      {
        id: "gratidao",
        tema: "Sou Grato",
        duracao: "45 min",
        objetivo: "A criança identifica motivos de gratidão em sua vida e aprende a expressar o obrigado.",
        atividades: [
          { duracao: "5 min",  descricao: "Acolhida: canção sobre gratidão" },
          { duracao: "10 min", descricao: "Roda de conversa: 'o que você mais gosta na sua vida?'" },
          { duracao: "15 min", descricao: "Confecção do 'Caderno da Gratidão': cada criança desenha 3 coisas pelas quais é grata" },
          { duracao: "10 min", descricao: "Partilha: cada criança mostra um desenho e conta por que é grata" },
          { duracao: "5 min",  descricao: "Oração de gratidão espontânea em roda" },
        ],
        materiais: ["Papel dobrado (mini caderno)", "Giz de cera", "Carimbo de estrela"],
      },
    ],
  },
  {
    id: "6-8",
    label: "6–8 anos",
    cor: "border-violet-200",
    corBadge: "bg-violet-100 text-violet-700",
    planos: [
      {
        id: "filho-prodigo",
        tema: "A Parábola do Filho Pródigo",
        duracao: "60 min",
        objetivo: "A criança compreende o significado do perdão e da misericórdia por meio da parábola.",
        atividades: [
          { duracao: "5 min",  descricao: "Oração de abertura e chamada presencial" },
          { duracao: "15 min", descricao: "Leitura dramatizada da parábola — crianças interpretam os personagens" },
          { duracao: "15 min", descricao: "Roda de diálogo: 'Você já precisou pedir perdão? E perdoar alguém?'" },
          { duracao: "15 min", descricao: "Atividade escrita: carta do filho ao pai — criança escreve em voz do personagem" },
          { duracao: "10 min", descricao: "Partilha das cartas para quem desejar" },
        ],
        materiais: ["Bíblia ou texto impresso (Lucas 15:11-32)", "Papel sulfite", "Lápis"],
      },
      {
        id: "virtudes-dia-a-dia",
        tema: "Virtudes no Dia a Dia",
        duracao: "60 min",
        objetivo: "A criança identifica virtudes evangélicas e exemplos concretos de como praticá-las.",
        atividades: [
          { duracao: "5 min",  descricao: "Acolhida com música e oração" },
          { duracao: "15 min", descricao: "Apresentação das virtudes com cartões ilustrados (amor, paciência, perdão, honestidade)" },
          { duracao: "15 min", descricao: "Jogo da memória das virtudes — usar o jogo digital ou versão impressa" },
          { duracao: "15 min", descricao: "Dinâmica: cada criança sorteiauma virtude e conta como a praticou na semana" },
          { duracao: "10 min", descricao: "Encerramento: compromisso da semana — cada um escolhe uma virtude para exercer" },
        ],
        materiais: ["Cartões de virtudes impressos", "Computador/tablet com o Jogo da Memória"],
      },
      {
        id: "oracao",
        tema: "O que é Oração?",
        duracao: "60 min",
        objetivo: "A criança entende a oração como diálogo com Deus e experimenta diferentes formas de orar.",
        atividades: [
          { duracao: "5 min",  descricao: "Oração espontânea de abertura" },
          { duracao: "10 min", descricao: "Conversa: 'Como você conversa com Deus? O que você pede? O que você agradece?'" },
          { duracao: "15 min", descricao: "Leitura comentada do Pai Nosso em linguagem acessível" },
          { duracao: "20 min", descricao: "Escrita da oração pessoal: cada criança escreve/desenha sua própria oração" },
          { duracao: "10 min", descricao: "Momento de silêncio e oração interior com música suave" },
        ],
        materiais: ["Texto do Pai Nosso simplificado", "Papel especial ou cartão", "Lápis de cor"],
      },
    ],
  },
  {
    id: "9-11",
    label: "9–11 anos",
    cor: "border-cyan-200",
    corBadge: "bg-cyan-100 text-cyan-700",
    planos: [
      {
        id: "evangelho-exemplos",
        tema: "O Evangelho e os Bons Exemplos",
        duracao: "75 min",
        objetivo: "A criança relaciona ensinamentos do Evangelho com exemplos históricos e cotidianos de virtude.",
        atividades: [
          { duracao: "5 min",  descricao: "Oração de abertura e acolhida" },
          { duracao: "20 min", descricao: "Estudo de texto: passagem do Sermão da Montanha — beatitudes em linguagem atual" },
          { duracao: "20 min", descricao: "Pesquisa em grupo: exemplos históricos de pessoas que viveram as beatitudes" },
          { duracao: "20 min", descricao: "Apresentação dos grupos: cada equipe expõe o personagem escolhido" },
          { duracao: "10 min", descricao: "Síntese coletiva e oração de encerramento" },
        ],
        materiais: ["Bíblia (Mateus 5:1-12)", "Textos de apoio sobre exemplos históricos", "Cartolina", "Caneta"],
      },
      {
        id: "caridade-acao",
        tema: "Caridade em Ação",
        duracao: "75 min",
        objetivo: "A criança compreende a caridade como princípio espiritual e planeja uma ação concreta.",
        atividades: [
          { duracao: "5 min",  descricao: "Acolhida e oração de abertura" },
          { duracao: "15 min", descricao: "Leitura e debate: 'Fora da caridade não há salvação' — contexto e significado" },
          { duracao: "20 min", descricao: "Roda de diálogo: exemplos de caridade dentro de casa, na escola e na comunidade" },
          { duracao: "25 min", descricao: "Planejamento em grupo: cada equipe elabora uma ação caritativa para realizar" },
          { duracao: "10 min", descricao: "Apresentação dos planos e compromisso coletivo" },
        ],
        materiais: ["Texto de Allan Kardec sobre caridade", "Papel para plano de ação", "Caneta"],
      },
      {
        id: "causa-efeito",
        tema: "A Lei de Causa e Efeito",
        duracao: "75 min",
        objetivo: "A criança compreende a lei moral de causa e efeito como incentivo para escolhas éticas.",
        atividades: [
          { duracao: "5 min",  descricao: "Oração de abertura" },
          { duracao: "15 min", descricao: "Dinâmica inicial: lançar uma bola e observar que ela sempre volta — analogia com nossas ações" },
          { duracao: "20 min", descricao: "Estudo: a lei de causa e efeito na natureza, na vida social e na vida espiritual" },
          { duracao: "25 min", descricao: "Cenas e escolhas: cada grupo recebe uma situação e analisa causas e consequências" },
          { duracao: "10 min", descricao: "Reflexão escrita: 'Que semeadura quero fazer hoje?'" },
        ],
        materiais: ["Bola de borracha", "Fichas com situações", "Papel sulfite", "Caneta"],
      },
    ],
  },
];

// ── Componente de plano ───────────────────────────────────────────────────────

function CardPlano({ plano, corBadge }: { plano: PlanoAula; corBadge: string }) {
  const [aberto, setAberto] = useState(false);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setAberto((a) => !a)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <FileText size={16} strokeWidth={1.5} className="text-gray-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-gray-800">{plano.tema}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <Clock size={11} strokeWidth={1.5} className="text-gray-400" />
              <span className="text-xs text-gray-400">{plano.duracao}</span>
            </div>
          </div>
        </div>
        <ArrowRight
          size={14}
          strokeWidth={2}
          className={`text-gray-400 transition-transform shrink-0 ${aberto ? "rotate-90" : ""}`}
        />
      </button>

      {aberto && (
        <div className="px-5 pb-5 space-y-4 border-t border-gray-100 pt-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Objetivo</p>
            <p className="text-sm text-gray-700 leading-relaxed">{plano.objetivo}</p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Atividades</p>
            <ol className="space-y-2">
              {plano.atividades.map((a, i) => (
                <li key={i} className="flex gap-3">
                  <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full h-fit mt-0.5 ${corBadge}`}>
                    {a.duracao}
                  </span>
                  <span className="text-sm text-gray-600">{a.descricao}</span>
                </li>
              ))}
            </ol>
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Materiais</p>
            <ul className="flex flex-wrap gap-2">
              {plano.materiais.map((m, i) => (
                <li key={i} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                  {m}
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors print:hidden"
          >
            <Printer size={12} strokeWidth={1.5} />
            Imprimir este plano
          </button>
        </div>
      )}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

function Evangelizacao() {
  const { user, isEvangelizador } = useAuth();
  const [faixaAtiva, setFaixaAtiva] = useState("3-5");

  if (!user) {
    return (
      <main className="page-light min-h-screen px-4 pt-20 pb-20 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">
          <Link to="/login" className="text-cyan-600 hover:underline">Faça login</Link> para acessar os recursos.
        </p>
      </main>
    );
  }

  const faixaAtual = FAIXAS.find((f) => f.id === faixaAtiva)!;

  return (
    <main className="page-light min-h-screen pt-20 pb-28">
      <CasaHero />
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "48px 44px 0" }} className="space-y-8">

        {/* Título da seção */}
        <div style={{ paddingBottom: 24, borderBottom: "1px solid rgba(0,20,70,.08)" }}>
          <h2 style={{ fontFamily: '"Libre Caslon Text", Georgia, serif', fontSize: "1.5rem", fontWeight: 400, color: "#111418", margin: 0, marginBottom: 6 }}>
            Evangelização Infantil
          </h2>
          <p style={{ fontFamily: "Inter", fontSize: "0.9rem", color: "#637080", margin: 0 }}>
            Recursos para o setor de evangelização infantil — 3 a 11 anos
          </p>
        </div>

        {/* Links rápidos */}
        <section>
          <p className="text-xs uppercase tracking-widest text-muted-foreground/60 font-bold mb-3">Ferramentas</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              to="/jogos/memoria-evangelizacao"
              className="flex items-center gap-4 p-4 border border-cyan-200 group"
              style={{ background: "#ffffff", borderRadius: 20, boxShadow: "0 1px 4px rgba(0,20,70,.04), 0 3px 14px rgba(0,20,70,.05)" }}
            >
              <div className="w-11 h-11 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center shrink-0 shadow-sm">
                <Brain size={20} strokeWidth={1.5} className="text-cyan-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 group-hover:text-cyan-700 transition-colors">
                  Jogo da Memória
                </p>
                <p className="text-xs text-gray-500 font-light mt-0.5">Virtudes · Evangelho</p>
              </div>
            </Link>

            <Link
              to="/jogos/plante-a-semente"
              className="flex items-center gap-4 p-4 border border-emerald-200 group"
              style={{ background: "#ffffff", borderRadius: 20, boxShadow: "0 1px 4px rgba(0,20,70,.04), 0 3px 14px rgba(0,20,70,.05)" }}
            >
              <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 shadow-sm">
                <Leaf size={20} strokeWidth={1.5} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 group-hover:text-emerald-700 transition-colors">
                  Plante a Semente
                </p>
                <p className="text-xs text-gray-500 font-light mt-0.5">Jogo de palavras</p>
              </div>
            </Link>

            <Link
              to="/feb"
              className="flex items-center gap-4 p-4 border border-violet-200 group"
              style={{ background: "#ffffff", borderRadius: 20, boxShadow: "0 1px 4px rgba(0,20,70,.04), 0 3px 14px rgba(0,20,70,.05)" }}
            >
              <div className="w-11 h-11 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0 shadow-sm">
                <BookOpen size={20} strokeWidth={1.5} className="text-violet-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 group-hover:text-violet-700 transition-colors">
                  Documentos FEB
                </p>
                <p className="text-xs text-gray-500 font-light mt-0.5">AEE Infância · Juventude</p>
              </div>
            </Link>

            <Link
              to="/jogos/quiz-espirita"
              className="flex items-center gap-4 p-4 border border-amber-200 group"
              style={{ background: "#ffffff", borderRadius: 20, boxShadow: "0 1px 4px rgba(0,20,70,.04), 0 3px 14px rgba(0,20,70,.05)" }}
            >
              <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0 shadow-sm">
                <HelpCircle size={20} strokeWidth={1.5} className="text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 group-hover:text-amber-700 transition-colors">
                  Quiz Espírita
                </p>
                <p className="text-xs text-gray-500 font-light mt-0.5">Virtudes · Doutrina · 3–11 anos</p>
              </div>
            </Link>
          </div>

          {isEvangelizador && (
            <div className="mt-4">
              <Link
                to="/configurar-memoria"
                className="flex items-center gap-4 p-4 border border-amber-200 group"
                style={{ background: "#ffffff", borderRadius: 20, boxShadow: "0 1px 4px rgba(0,20,70,.04), 0 3px 14px rgba(0,20,70,.05)" }}
              >
                <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0 shadow-sm">
                  <Settings size={20} strokeWidth={1.5} className="text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-amber-700 transition-colors">
                    Configurar Jogo da Memória
                  </p>
                  <p className="text-xs text-gray-500 font-light mt-0.5">Alterar imagens e nomes das virtudes da sua casa</p>
                </div>
                <ArrowRight size={16} strokeWidth={1.5} className="text-amber-400 group-hover:translate-x-1.5 transition-transform" />
              </Link>
            </div>
          )}
        </section>

        {/* Planos de aula */}
        <section>
          <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
            <Users size={16} strokeWidth={1.5} className="text-violet-600" />
            <p className="text-xs uppercase tracking-widest text-muted-foreground/60 font-bold">Planos de Aula</p>
          </div>

          {/* Abas de faixa etária */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {FAIXAS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFaixaAtiva(f.id)}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border duration-300 ${
                  faixaAtiva === f.id
                    ? f.corBadge + " border-transparent shadow-sm"
                    : "bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-800"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Lista de planos */}
          <div style={{ background: "#ffffff", border: "1px solid rgba(0,20,70,.08)", borderRadius: 20, padding: "24px 28px", boxShadow: "0 1px 4px rgba(0,20,70,.04), 0 3px 14px rgba(0,20,70,.05)" }} className="space-y-3">
            {faixaAtual.planos.map((plano) => (
              <CardPlano key={plano.id} plano={plano} corBadge={faixaAtual.corBadge} />
            ))}
          </div>

          <p className="text-xs text-gray-400 mt-4 text-center font-light">
            Planos baseados nas diretrizes da FEB — AEE Infância
          </p>
        </section>

      </div>
    </main>
  );
}
