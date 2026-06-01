import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, ChevronRight, RotateCcw, Trophy, CheckCircle, XCircle, HelpCircle } from "lucide-react";
import {
  type FaixaQuiz,
  type Pergunta,
  type QtdePerguntas,
  FAIXAS_QUIZ,
  QTDES_PERGUNTAS,
  sortearPerguntas,
} from "@/data/quiz-espirita";

export const Route = createFileRoute("/jogos/quiz-espirita")({
  component: QuizEspirita,
});

type Fase = "selecao" | "jogo" | "resultado";

function fraseResultado(acertos: number, total: number): string {
  const pct = acertos / total;
  if (pct === 1)   return "Perfeito! Você acertou tudo!";
  if (pct >= 0.8)  return "Muito bem! Você se saiu excelente!";
  if (pct >= 0.6)  return "Bom resultado! Continue estudando!";
  if (pct >= 0.4)  return "Continue praticando, você vai melhorar!";
  return "Não desanime! Tente novamente e aprenda mais!";
}

// ── Tela de seleção ──────────────────────────────────────────────────────────

function TelaSelecao({
  onIniciar,
}: {
  onIniciar: (faixa: FaixaQuiz | "todas", qtde: QtdePerguntas) => void;
}) {
  const [faixa, setFaixa] = useState<FaixaQuiz | "todas">("6-8");
  const [qtde, setQtde] = useState<QtdePerguntas>(10);

  return (
    <div className="space-y-8">

      {/* Faixa etária */}
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Faixa etária</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {FAIXAS_QUIZ.map((f) => (
            <button
              key={f.id}
              onClick={() => setFaixa(f.id)}
              className={`py-3 px-4 rounded-xl text-sm font-medium border transition-all ${
                faixa === f.id
                  ? "bg-cyan-600 text-white border-cyan-600 shadow-sm"
                  : "bg-white border-gray-200 text-gray-600 hover:border-cyan-300"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Número de perguntas */}
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Número de perguntas</p>
        <div className="flex gap-2">
          {QTDES_PERGUNTAS.map((q) => (
            <button
              key={q}
              onClick={() => setQtde(q)}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-all ${
                qtde === q
                  ? "bg-cyan-600 text-white border-cyan-600 shadow-sm"
                  : "bg-white border-gray-200 text-gray-600 hover:border-cyan-300"
              }`}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => onIniciar(faixa, qtde)}
        className="w-full py-4 rounded-xl text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-700 transition-colors flex items-center justify-center gap-2"
      >
        Começar Quiz
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

// ── Tela de jogo ─────────────────────────────────────────────────────────────

function TelaJogo({
  perguntas,
  onConcluir,
}: {
  perguntas: Pergunta[];
  onConcluir: (acertos: number) => void;
}) {
  const [atual, setAtual] = useState(0);
  const [acertos, setAcertos] = useState(0);
  const [selecionada, setSelecionada] = useState<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pergunta = perguntas[atual];
  const revelada = selecionada !== null;

  useEffect(() => {
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  function selecionar(idx: number) {
    if (revelada) return;
    const correto = idx === pergunta.correta;
    setSelecionada(idx);
    if (correto) setAcertos((a) => a + 1);

    timeoutRef.current = setTimeout(() => {
      setSelecionada(null);
      if (atual + 1 >= perguntas.length) {
        onConcluir(correto ? acertos + 1 : acertos);
      } else {
        setAtual((a) => a + 1);
      }
    }, 1400);
  }

  const progresso = ((atual) / perguntas.length) * 100;

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">
          Pergunta {atual + 1} de {perguntas.length}
        </span>
        <span className="text-xs font-medium text-cyan-600">
          {acertos} acerto{acertos !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Barra de progresso */}
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-cyan-500 rounded-full transition-all duration-500"
          style={{ width: `${progresso}%` }}
        />
      </div>

      {/* Pergunta */}
      <div className="bg-cyan-50 border border-cyan-100 rounded-2xl px-6 py-5">
        <div className="flex items-start gap-3">
          <HelpCircle size={18} strokeWidth={1.5} className="text-cyan-500 mt-0.5 shrink-0" />
          <p className="text-gray-800 font-medium leading-snug">{pergunta.pergunta}</p>
        </div>
      </div>

      {/* Opções */}
      <div className="space-y-2.5">
        {pergunta.opcoes.map((opcao, idx) => {
          let estilo = "bg-white border-gray-200 text-gray-700 hover:border-cyan-300";
          if (revelada) {
            if (idx === pergunta.correta) {
              estilo = "bg-emerald-50 border-emerald-400 text-emerald-800";
            } else if (idx === selecionada) {
              estilo = "bg-red-50 border-red-400 text-red-800";
            } else {
              estilo = "bg-white border-gray-100 text-gray-400";
            }
          }

          return (
            <button
              key={idx}
              onClick={() => selecionar(idx)}
              disabled={revelada}
              className={`w-full text-left px-4 py-3.5 rounded-xl border text-sm transition-all flex items-center gap-3 ${estilo} ${revelada ? "cursor-default" : "cursor-pointer"}`}
            >
              <span className="shrink-0 w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs font-bold">
                {String.fromCharCode(65 + idx)}
              </span>
              <span className="flex-1">{opcao}</span>
              {revelada && idx === pergunta.correta && (
                <CheckCircle size={16} className="text-emerald-500 shrink-0" />
              )}
              {revelada && idx === selecionada && idx !== pergunta.correta && (
                <XCircle size={16} className="text-red-400 shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Tela de resultado ────────────────────────────────────────────────────────

function TelaResultado({
  acertos,
  total,
  onReiniciar,
  onNovaSelecao,
}: {
  acertos: number;
  total: number;
  onReiniciar: () => void;
  onNovaSelecao: () => void;
}) {
  const pct = Math.round((acertos / total) * 100);
  const cor = pct === 100 ? "text-amber-500" : pct >= 60 ? "text-emerald-500" : "text-cyan-500";

  return (
    <div className="text-center space-y-7">
      <div>
        <Trophy size={48} strokeWidth={1} className={`${cor} mx-auto mb-4`} />
        <h2 className="text-2xl font-bold text-gray-800">{fraseResultado(acertos, total)}</h2>
        <p className="text-sm text-gray-500 mt-1">{fraseResultado(acertos, total)}</p>
      </div>

      {/* Placar */}
      <div className="bg-gray-50 border border-gray-100 rounded-2xl py-6 px-8 inline-block">
        <p className={`text-5xl font-black ${cor}`}>{pct}%</p>
        <p className="text-sm text-gray-500 mt-1">
          {acertos} de {total} corretas
        </p>
      </div>

      {/* Barras por faixa visual */}
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            pct === 100 ? "bg-amber-400" : pct >= 60 ? "bg-emerald-400" : "bg-cyan-400"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onReiniciar}
          className="flex-1 py-3.5 rounded-xl text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-700 transition-colors flex items-center justify-center gap-2"
        >
          <RotateCcw size={15} />
          Jogar novamente
        </button>
        <button
          onClick={onNovaSelecao}
          className="flex-1 py-3.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:border-gray-300 transition-colors"
        >
          Mudar faixa etária
        </button>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

function QuizEspirita() {
  const { user, loading } = useAuth();
  const [fase, setFase] = useState<Fase>("selecao");
  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
  const [acertos, setAcertos] = useState(0);
  const [faixaAtual, setFaixaAtual] = useState<FaixaQuiz | "todas">("6-8");
  const [qtdeAtual, setQtdeAtual] = useState<QtdePerguntas>(10);

  if (loading) {
    return (
      <main className="page-light min-h-screen px-4 pt-20 pb-20 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }


  function iniciar(faixa: FaixaQuiz | "todas", qtde: QtdePerguntas) {
    setFaixaAtual(faixa);
    setQtdeAtual(qtde);
    setPerguntas(sortearPerguntas(faixa, qtde));
    setAcertos(0);
    setFase("jogo");
  }

  function concluir(total: number) {
    setAcertos(total);
    setFase("resultado");
  }

  function reiniciar() {
    setPerguntas(sortearPerguntas(faixaAtual, qtdeAtual));
    setAcertos(0);
    setFase("jogo");
  }

  return (
    <main className="page-light min-h-screen px-4 pt-20 pb-20">
      <div className="mx-auto max-w-xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            to="/jogos"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Jogos
          </Link>
          <span className="text-muted-foreground/40">|</span>
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-cyan-600" />
            <h1 className="text-lg font-semibold tracking-wide text-foreground">
              Quiz Espírita
            </h1>
          </div>
        </div>

        {fase === "selecao" && <TelaSelecao onIniciar={iniciar} />}
        {fase === "jogo"    && <TelaJogo perguntas={perguntas} onConcluir={concluir} />}
        {fase === "resultado" && (
          <TelaResultado
            acertos={acertos}
            total={perguntas.length}
            onReiniciar={reiniciar}
            onNovaSelecao={() => setFase("selecao")}
          />
        )}
      </div>
    </main>
  );
}
