import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft,
  ChevronRight,
  RotateCcw,
  Trophy,
  CheckCircle,
  XCircle,
  Compass,
  Volume2,
  VolumeX,
  Sparkles,
  Star,
  Heart,
  Sprout,
  Flame,
  Sun,
  Users,
  User,
} from "lucide-react";
import { type FaixaQuiz, type Pergunta, sortearPerguntas, FAIXAS_QUIZ } from "@/data/quiz-espirita";

export const Route = createFileRoute("/jogos/caminho-da-luz")({
  head: () => ({
    meta: [
      { title: "Caminho da Luz — Jogo de Tabuleiro Espírita — Apoio Espírita" },
      {
        name: "description",
        content:
          "Avance por uma trilha brilhante de virtudes morais e doutrinárias respondendo perguntas. Jogue sozinho ou em dupla com efeitos visuais e sonoros.",
      },
      {
        name: "keywords",
        content:
          "caminho da luz jogo, jogo tabuleiro espirita, jogo de perguntas em grupo espiritismo",
      },
      {
        property: "og:title",
        content: "Caminho da Luz — Jogo de Tabuleiro Espírita — Apoio Espírita",
      },
      {
        property: "og:description",
        content:
          "Avance por uma trilha brilhante de virtudes morais e doutrinárias respondendo perguntas. Jogue sozinho ou em dupla.",
      },
      { property: "og:url", content: "https://apoioespirita.com.br/jogos/caminho-da-luz" },
    ],
    links: [{ rel: "canonical", href: "https://apoioespirita.com.br/jogos/caminho-da-luz" }],
  }),
  component: CaminhoDaLuzGame,
});

type Fase = "config" | "tabuleiro" | "vitoria";

interface Player {
  name: string;
  avatar: "star" | "heart" | "sprout" | "flame" | "sun";
  color: "cyan" | "gold" | "rose" | "violet" | "emerald";
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
}

// Lista fixa de virtudes para o caminho
const VIRTUDES = [
  "Início",
  "Paciência",
  "Humildade",
  "Caridade",
  "Gratidão",
  "Perdão",
  "Respeito",
  "Esperança",
  "Fé",
  "União",
  "Fraternidade",
  "Benevolência",
  "Paz",
  "Bondade",
  "Sabedoria",
  "Luz",
];

// Cores HSL premium para os avatares
const COLOR_MAP = {
  cyan: {
    bg: "bg-cyan-500",
    text: "text-cyan-500",
    border: "border-cyan-400",
    ring: "ring-cyan-400/40",
    glow: "shadow-[0_0_15px_rgba(6,182,212,0.5)]",
    hex: "#22d3ee",
  },
  gold: {
    bg: "bg-amber-500",
    text: "text-amber-500",
    border: "border-amber-400",
    ring: "ring-amber-400/40",
    glow: "shadow-[0_0_15px_rgba(245,158,11,0.5)]",
    hex: "#f59e0b",
  },
  rose: {
    bg: "bg-rose-500",
    text: "text-rose-500",
    border: "border-rose-400",
    ring: "ring-rose-400/40",
    glow: "shadow-[0_0_15px_rgba(244,63,94,0.5)]",
    hex: "#f43f5e",
  },
  violet: {
    bg: "bg-violet-500",
    text: "text-violet-500",
    border: "border-violet-400",
    ring: "ring-violet-400/40",
    glow: "shadow-[0_0_15px_rgba(139,92,246,0.5)]",
    hex: "#8b5cf6",
  },
  emerald: {
    bg: "bg-emerald-500",
    text: "text-emerald-500",
    border: "border-emerald-400",
    ring: "ring-emerald-400/40",
    glow: "shadow-[0_0_15px_rgba(16,185,129,0.5)]",
    hex: "#10b981",
  },
};

const AVATAR_ICONS = {
  star: Star,
  heart: Heart,
  sprout: Sprout,
  flame: Flame,
  sun: Sun,
};

// Síntese de áudio leve via Web Audio API
const playSoundEffect = (type: "correct" | "wrong" | "victory", muted: boolean) => {
  if (muted) return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === "correct") {
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0.1, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.4);
      });
    } else if (type === "wrong") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(130, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(90, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else if (type === "victory") {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = idx % 2 === 0 ? "sine" : "triangle";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
        gain.gain.setValueAtTime(0.08, ctx.currentTime + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.65);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.1);
        osc.stop(ctx.currentTime + idx * 0.1 + 0.7);
      });
    }
  } catch (err) {
    console.error("Audio Synthesis error:", err);
  }
};

function CaminhoDaLuzGame() {
  const { user, loading } = useAuth();
  const [fase, setFase] = useState<Fase>("config");
  const [muted, setMuted] = useState(false);

  // Parâmetros de Configuração
  const [players, setPlayers] = useState<Player[]>([
    { name: "Jogador 1", avatar: "star", color: "cyan" },
    { name: "Jogador 2", avatar: "heart", color: "gold" },
  ]);
  const [numPlayers, setNumPlayers] = useState<1 | 2>(1);
  const [boardSize, setBoardSize] = useState<8 | 12 | 16>(12);
  const [faixa, setFaixa] = useState<FaixaQuiz | "todas">("6-8");

  // Estado do Jogo
  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
  const [perguntaIndex, setPerguntaIndex] = useState(0);
  const [positions, setPositions] = useState<number[]>([0, 0]);
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [vencedorIdx, setVencedorIdx] = useState<number | null>(null);

  // Estados da Pergunta em andamento
  const [selecionadaIdx, setSelecionadaIdx] = useState<number | null>(null);
  const [revelada, setRevelada] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [acertouUltima, setAcertouUltima] = useState<boolean | null>(null);

  // Efeitos visuais
  const [particles, setParticles] = useState<Particle[]>([]);
  const nextParticleId = useRef(0);

  // Sons
  const triggerSound = (type: "correct" | "wrong" | "victory") => {
    playSoundEffect(type, muted);
  };

  // Gerar partículas
  const spawnParticles = (count: number, xPercent: number, yPercent: number, colorHex: string) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: nextParticleId.current++,
        x: xPercent + (Math.random() - 0.5) * 8,
        y: yPercent + (Math.random() - 0.5) * 8,
        color: colorHex,
      });
    }
    setParticles((prev) => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newParticles.find((np) => np.id === p.id)));
    }, 2000);
  };

  // Carrega perguntas e inicia o jogo
  const iniciarJogo = () => {
    // Sorteia um número alto de perguntas (ex: 40) para garantir que não acabe no caminho
    const pool = sortearPerguntas(faixa, 40);
    setPerguntas(pool);
    setPerguntaIndex(0);
    setPositions([0, 0]);
    setCurrentPlayerIdx(0);
    setVencedorIdx(null);
    setSelecionadaIdx(null);
    setRevelada(false);
    setFeedbackMsg("");
    setAcertouUltima(null);
    setFase("tabuleiro");
  };

  const responder = (opcaoIdx: number) => {
    if (revelada) return;
    setSelecionadaIdx(opcaoIdx);
    setRevelada(true);

    const pergunta = perguntas[perguntaIndex];
    const isCorreta = opcaoIdx === pergunta.correta;
    setAcertouUltima(isCorreta);

    const activePlayer = players[currentPlayerIdx];
    const colorHex = COLOR_MAP[activePlayer.color].hex;

    // Calcula coordenadas aproximadas do jogador atual para spawnar partículas
    const coords = getPlayerCoords(currentPlayerIdx);

    if (isCorreta) {
      triggerSound("correct");
      setFeedbackMsg("Resposta correta! Você avançou 1 casa.");
      spawnParticles(15, coords.x, coords.y, colorHex);

      // Avança a posição
      setPositions((prev) => {
        const next = [...prev];
        next[currentPlayerIdx] = Math.min(boardSize - 1, next[currentPlayerIdx] + 1);

        // Verifica vitória imediatamente
        if (next[currentPlayerIdx] === boardSize - 1) {
          setTimeout(() => {
            setVencedorIdx(currentPlayerIdx);
            setFase("vitoria");
            triggerSound("victory");
            // Chuva de partículas vitoriosas no centro do tabuleiro
            spawnParticles(50, 50, 50, colorHex);
          }, 1000);
        }
        return next;
      });
    } else {
      triggerSound("wrong");
      setFeedbackMsg("Oops! Resposta incorreta. Você permaneceu na mesma casa.");
      // Partículas escuras ou neutras indicando erro
      spawnParticles(8, coords.x, coords.y, "#94a3b8");
    }
  };

  const proximoTurno = () => {
    setSelecionadaIdx(null);
    setRevelada(false);
    setFeedbackMsg("");
    setAcertouUltima(null);

    // Avança o index da pergunta
    setPerguntaIndex((prev) => (prev + 1) % perguntas.length);

    // Se 2 jogadores, troca o turno
    if (numPlayers === 2) {
      setCurrentPlayerIdx((prev) => (prev === 0 ? 1 : 0));
    }
  };

  // Obter coordenadas de uma casa específica
  const cols = 4;
  const rows = Math.ceil(boardSize / cols);

  const getStepCoords = (stepIdx: number) => {
    const row = Math.floor(stepIdx / cols);
    const colInRow = stepIdx % cols;
    // Padrão sinuoso (ziguezague)
    const col = row % 2 === 0 ? colInRow : cols - 1 - colInRow;
    const x = ((col + 0.5) / cols) * 100;
    const y = ((row + 0.5) / rows) * 100;
    return { x, y };
  };

  // Coordenadas exatas do jogador com offset se estiverem no mesmo espaço
  const getPlayerCoords = (playerIdx: number) => {
    const pos = positions[playerIdx];
    const base = getStepCoords(pos);
    const sameStep = numPlayers === 2 && positions[0] === positions[1];

    if (sameStep) {
      return {
        x: playerIdx === 0 ? base.x - 3.5 : base.x + 3.5,
        y: playerIdx === 0 ? base.y - 2.5 : base.y + 2.5,
      };
    }
    return base;
  };

  // Gera o caminho de conexão SVG
  const generatePathD = () => {
    let d = "";
    for (let i = 0; i < boardSize; i++) {
      const { x, y } = getStepCoords(i);
      d += (i === 0 ? "M" : "L") + ` ${x} ${y}`;
    }
    return d;
  };

  // Virtudes associadas a cada casa
  const getVirtudeName = (idx: number) => {
    if (idx === 0) return "Início";
    if (idx === boardSize - 1) return "Luz";
    return VIRTUDES[idx] || "Virtude";
  };

  if (loading) {
    return (
      <main className="page-light min-h-screen px-4 pt-20 pb-20 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  const activePlayer = players[currentPlayerIdx];
  const perguntaAtual = perguntas[perguntaIndex];

  return (
    <main className="page-light min-h-screen px-4 pt-20 pb-20 select-none overflow-x-hidden">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
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
              <Compass className="w-5 h-5 text-indigo-600 animate-spin-slow" />
              <h1 className="text-lg font-semibold tracking-wide text-foreground">
                Caminho da Luz
              </h1>
            </div>
          </div>

          <button
            onClick={() => setMuted(!muted)}
            className="p-2 rounded-full border border-gray-200 hover:border-indigo-300 text-gray-500 hover:text-indigo-600 transition-colors"
            title={muted ? "Ativar Som" : "Desativar Som"}
          >
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>

        {/* 1. TELA DE CONFIGURAÇÃO */}
        {fase === "config" && (
          <div className="glass-premium rounded-3xl p-6 md:p-8 space-y-8 animate-fade-in-up">
            <div className="text-center space-y-2 border-b border-gray-100 pb-6">
              <h2 className="text-3xl font-light tracking-tight text-foreground font-serif">
                Configurar o{" "}
                <span className="font-semibold text-gradient-aurora">Caminho da Luz</span>
              </h2>
              <p className="text-sm text-gray-500 font-light">
                Escolha o modo de jogo, crie seus personagens e prepare-se para caminhar nas
                virtudes!
              </p>
            </div>

            {/* Configurações básicas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Modo de jogo */}
              <div className="space-y-3">
                <label className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                  Modo de Jogo
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setNumPlayers(1)}
                    className={`py-3 px-4 rounded-xl text-sm font-medium border flex items-center justify-center gap-2 transition-all ${
                      numPlayers === 1
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        : "bg-white border-gray-200 text-gray-600 hover:border-indigo-300"
                    }`}
                  >
                    <User size={16} />1 Jogador
                  </button>
                  <button
                    onClick={() => setNumPlayers(2)}
                    className={`py-3 px-4 rounded-xl text-sm font-medium border flex items-center justify-center gap-2 transition-all ${
                      numPlayers === 2
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        : "bg-white border-gray-200 text-gray-600 hover:border-indigo-300"
                    }`}
                  >
                    <Users size={16} />2 Jogadores
                  </button>
                </div>
              </div>

              {/* Tamanho do tabuleiro */}
              <div className="space-y-3">
                <label className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                  Tamanho da Trilha
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {([8, 12, 16] as const).map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setBoardSize(sz)}
                      className={`py-3 rounded-xl text-sm font-semibold border transition-all ${
                        boardSize === sz
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                          : "bg-white border-gray-200 text-gray-600 hover:border-indigo-300"
                      }`}
                    >
                      {sz} Casas
                    </button>
                  ))}
                </div>
              </div>

              {/* Faixa Etária */}
              <div className="space-y-3">
                <label className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                  Faixa Etária
                </label>
                <select
                  value={faixa}
                  onChange={(e) => setFaixa(e.target.value as FaixaQuiz | "todas")}
                  className="w-full py-3 px-4 rounded-xl text-sm border border-gray-200 text-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
                >
                  {FAIXAS_QUIZ.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Customização de personagens */}
            <div className="space-y-6 border-t border-gray-100 pt-6">
              <h3 className="text-sm uppercase tracking-wider text-muted-foreground font-bold">
                Customizar Jogadores
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {Array.from({ length: numPlayers }).map((_, idx) => {
                  const player = players[idx];
                  return (
                    <div
                      key={idx}
                      className="space-y-4 p-4 rounded-2xl border border-gray-100 bg-gray-50/50"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${COLOR_MAP[player.color].bg}`} />
                        <h4 className="font-semibold text-gray-800">
                          {idx === 0 ? "Jogador 1" : "Jogador 2"}
                        </h4>
                      </div>

                      {/* Nome */}
                      <div className="space-y-1.5">
                        <label className="text-xs text-gray-400 font-light">Nome do Jogador</label>
                        <input
                          type="text"
                          maxLength={12}
                          value={player.name}
                          onChange={(e) =>
                            setPlayers((prev) => {
                              const next = [...prev];
                              next[idx] = {
                                ...next[idx],
                                name: e.target.value || `Jogador ${idx + 1}`,
                              };
                              return next;
                            })
                          }
                          className="w-full px-3.5 py-2 text-sm rounded-lg border border-gray-200"
                        />
                      </div>

                      {/* Avatar */}
                      <div className="space-y-1.5">
                        <label className="text-xs text-gray-400 font-light">Avatar</label>
                        <div className="flex gap-2">
                          {(Object.keys(AVATAR_ICONS) as Array<keyof typeof AVATAR_ICONS>).map(
                            (av) => {
                              const Icon = AVATAR_ICONS[av];
                              return (
                                <button
                                  key={av}
                                  onClick={() =>
                                    setPlayers((prev) => {
                                      const next = [...prev];
                                      next[idx] = { ...next[idx], avatar: av };
                                      return next;
                                    })
                                  }
                                  className={`p-2.5 rounded-lg border transition-all ${
                                    player.avatar === av
                                      ? `bg-white ${COLOR_MAP[player.color].border} ${COLOR_MAP[player.color].text} shadow-sm`
                                      : "bg-white border-gray-200 text-gray-400 hover:border-gray-300"
                                  }`}
                                >
                                  <Icon size={16} />
                                </button>
                              );
                            },
                          )}
                        </div>
                      </div>

                      {/* Cor */}
                      <div className="space-y-1.5">
                        <label className="text-xs text-gray-400 font-light">Cor da Peça</label>
                        <div className="flex gap-2">
                          {(Object.keys(COLOR_MAP) as Array<keyof typeof COLOR_MAP>).map((c) => {
                            const details = COLOR_MAP[c];
                            return (
                              <button
                                key={c}
                                onClick={() =>
                                  setPlayers((prev) => {
                                    const next = [...prev];
                                    next[idx] = { ...next[idx], color: c };
                                    return next;
                                  })
                                }
                                className={`w-8 h-8 rounded-full ${details.bg} transition-all flex items-center justify-center ${
                                  player.color === c
                                    ? "scale-110 ring-4 ring-offset-2 ring-indigo-400"
                                    : "hover:scale-105 opacity-80"
                                }`}
                              >
                                {player.color === c && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Iniciar */}
            <button
              onClick={iniciarJogo}
              className="w-full py-4 rounded-2xl text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/10 transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5"
            >
              Iniciar Jornada
              <Compass size={20} className="animate-spin-slow" />
            </button>
          </div>
        )}

        {/* 2. TELA DO TABULEIRO ATIVO */}
        {fase === "tabuleiro" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Visualização do Tabuleiro (2 colunas no desktop) */}
            <div className="lg:col-span-2 space-y-4">
              {/* O Tabuleiro Premium com Fundo Cósmico */}
              <div className="relative glass-premium border border-slate-200/60 rounded-3xl p-6 md:p-8 bg-gradient-to-br from-indigo-950 to-slate-900 overflow-hidden shadow-2xl min-h-[380px] md:min-h-[440px] flex items-center justify-center">
                {/* Estrelas de fundo */}
                <div className="absolute inset-0 opacity-30 pointer-events-none">
                  <div className="absolute top-10 left-10 w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  <div className="absolute top-1/4 right-20 w-1 h-1 bg-white rounded-full animate-ping" />
                  <div className="absolute bottom-12 left-1/3 w-1.5 h-1.5 bg-indigo-300 rounded-full animate-pulse" />
                  <div className="absolute bottom-1/3 right-12 w-1.5 h-1.5 bg-cyan-200 rounded-full animate-ping" />
                </div>

                {/* Linhas de conexão SVG entre as casas */}
                <svg
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  className="absolute inset-0 w-full h-full pointer-events-none"
                >
                  <path
                    d={generatePathD()}
                    fill="none"
                    stroke="url(#neon-trail)"
                    strokeWidth="1.5"
                    strokeDasharray="2.5 2.5"
                    className="stroke-indigo-400/40 animate-pulse"
                  />
                  <defs>
                    <linearGradient id="neon-trail" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#818cf8" />
                      <stop offset="50%" stopColor="#22d3ee" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Partículas em tempo real */}
                {particles.map((p) => (
                  <span
                    key={p.id}
                    className="absolute w-2 h-2 rounded-full pointer-events-none animate-float opacity-0 mix-blend-screen"
                    style={{
                      left: `${p.x}%`,
                      top: `${p.y}%`,
                      backgroundColor: p.color,
                      boxShadow: `0 0 12px ${p.color}`,
                    }}
                  />
                ))}

                {/* Grade do tabuleiro */}
                <div
                  className="w-full h-full min-h-[300px] md:min-h-[360px] grid relative z-10"
                  style={{
                    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
                    gap: "1.5rem",
                  }}
                >
                  {Array.from({ length: boardSize }).map((_, idx) => {
                    const coords = getStepCoords(idx);
                    const isVencedorCasa = idx === boardSize - 1;
                    const isStart = idx === 0;

                    // Determinar se algum jogador está nesta casa
                    const hasP1 = positions[0] === idx;
                    const hasP2 = numPlayers === 2 && positions[1] === idx;

                    return (
                      <div
                        key={idx}
                        className="flex flex-col items-center justify-center relative"
                        style={{
                          gridRowStart: Math.floor(idx / cols) + 1,
                          gridColumnStart:
                            (Math.floor(idx / cols) % 2 === 0
                              ? idx % cols
                              : cols - 1 - (idx % cols)) + 1,
                        }}
                      >
                        {/* Casa circular brilhante */}
                        <div
                          className={`w-12 h-12 md:w-16 md:h-16 rounded-full flex flex-col items-center justify-center border transition-all duration-500 shadow-md ${
                            isVencedorCasa
                              ? "bg-gradient-to-tr from-amber-500 to-rose-500 border-amber-300 text-white shadow-[0_0_20px_rgba(245,158,11,0.5)] animate-pulse"
                              : isStart
                                ? "bg-slate-800 border-slate-700 text-slate-300"
                                : "bg-slate-900/90 border-indigo-500/30 text-indigo-200 hover:border-indigo-400/50"
                          }`}
                        >
                          <span className="text-xs md:text-sm font-bold">{idx + 1}</span>
                          <span className="text-[7px] md:text-[9px] uppercase tracking-wider text-slate-400 font-light truncate max-w-full px-1">
                            {getVirtudeName(idx)}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Peão do Jogador 1 */}
                  {(() => {
                    const coords = getPlayerCoords(0);
                    const details = COLOR_MAP[players[0].color];
                    const Icon = AVATAR_ICONS[players[0].avatar];
                    return (
                      <div
                        className={`absolute w-7 h-7 md:w-9 md:h-9 rounded-full flex items-center justify-center bg-white border-2 ${details.border} ${details.text} ${details.glow} transition-all duration-700 ease-out z-20`}
                        style={{
                          left: `${coords.x}%`,
                          top: `${coords.y}%`,
                          transform: "translate(-50%, -50%)",
                        }}
                        title={players[0].name}
                      >
                        <Icon size={14} className="stroke-[2.5]" />
                        <span className="absolute -bottom-4 bg-slate-950/80 border border-slate-800 text-[8px] text-white px-1 py-0.5 rounded leading-none whitespace-nowrap shadow-sm">
                          {players[0].name.slice(0, 7)}
                        </span>
                      </div>
                    );
                  })()}

                  {/* Peão do Jogador 2 */}
                  {numPlayers === 2 &&
                    (() => {
                      const coords = getPlayerCoords(1);
                      const details = COLOR_MAP[players[1].color];
                      const Icon = AVATAR_ICONS[players[1].avatar];
                      return (
                        <div
                          className={`absolute w-7 h-7 md:w-9 md:h-9 rounded-full flex items-center justify-center bg-white border-2 ${details.border} ${details.text} ${details.glow} transition-all duration-700 ease-out z-20`}
                          style={{
                            left: `${coords.x}%`,
                            top: `${coords.y}%`,
                            transform: "translate(-50%, -50%)",
                          }}
                          title={players[1].name}
                        >
                          <Icon size={14} className="stroke-[2.5]" />
                          <span className="absolute -bottom-4 bg-slate-950/80 border border-slate-800 text-[8px] text-white px-1 py-0.5 rounded leading-none whitespace-nowrap shadow-sm">
                            {players[1].name.slice(0, 7)}
                          </span>
                        </div>
                      );
                    })()}
                </div>
              </div>

              {/* Status do Jogo */}
              <div className="glass-premium rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border border-gray-100 bg-white shadow-sm">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${
                      COLOR_MAP[activePlayer.color].bg
                    }`}
                  >
                    {(() => {
                      const Icon = AVATAR_ICONS[activePlayer.avatar];
                      return <Icon size={20} />;
                    })()}
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-light">Turno Atual</p>
                    <p className="font-semibold text-gray-800">
                      {activePlayer.name}{" "}
                      {numPlayers === 2 && (
                        <span className="text-xs font-normal text-muted-foreground">
                          (Casa {positions[currentPlayerIdx] + 1})
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 text-xs font-medium text-gray-500">
                  <div>
                    <span>Meta: </span>
                    <span className="text-indigo-600 font-bold">{boardSize} casas</span>
                  </div>
                  {numPlayers === 2 && (
                    <div className="border-l border-gray-200 pl-4 space-y-0.5">
                      <p>
                        {players[0].name}:{" "}
                        <span className="text-indigo-600 font-semibold">{positions[0] + 1}</span>
                      </p>
                      <p>
                        {players[1].name}:{" "}
                        <span className="text-indigo-600 font-semibold">{positions[1] + 1}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Painel da Pergunta (1 coluna no desktop) */}
            <div className="space-y-4">
              {perguntaAtual ? (
                <div className="glass-premium rounded-3xl p-6 border border-indigo-100 flex flex-col justify-between min-h-[380px] bg-white shadow-lg animate-fade-in-up">
                  <div className="space-y-4">
                    {/* Cabeçalho do Card */}
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                      <span className="text-xs uppercase tracking-wider font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                        Pergunta Espírita
                      </span>
                      <span className="text-xs text-gray-400">
                        {getVirtudeName(positions[currentPlayerIdx])}
                      </span>
                    </div>

                    {/* Pergunta */}
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-slate-800 leading-snug">
                        {perguntaAtual.pergunta}
                      </p>
                    </div>

                    {/* Alternativas */}
                    <div className="space-y-2.5 pt-2">
                      {perguntaAtual.opcoes.map((opcao, idx) => {
                        let btnStyle =
                          "bg-white border-gray-200 text-gray-700 hover:border-indigo-300";

                        if (revelada) {
                          if (idx === perguntaAtual.correta) {
                            btnStyle =
                              "bg-emerald-50 border-emerald-400 text-emerald-800 shadow-[0_0_12px_rgba(16,185,129,0.15)]";
                          } else if (idx === selecionadaIdx) {
                            btnStyle = "bg-rose-50 border-rose-400 text-rose-800";
                          } else {
                            btnStyle = "bg-white border-gray-100 text-gray-400 opacity-60";
                          }
                        }

                        return (
                          <button
                            key={idx}
                            disabled={revelada}
                            onClick={() => responder(idx)}
                            className={`w-full text-left px-4 py-3 rounded-xl border text-xs transition-all duration-200 flex items-center gap-3 font-medium ${btnStyle} ${
                              !revelada ? "hover:translate-x-1 cursor-pointer" : "cursor-default"
                            }`}
                          >
                            <span className="shrink-0 w-6 h-6 rounded-full border border-current flex items-center justify-center text-[10px] font-bold">
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <span className="flex-1 leading-snug">{opcao}</span>
                            {revelada && idx === perguntaAtual.correta && (
                              <CheckCircle size={15} className="text-emerald-500 shrink-0" />
                            )}
                            {revelada &&
                              idx === selecionadaIdx &&
                              idx !== perguntaAtual.correta && (
                                <XCircle size={15} className="text-rose-500 shrink-0" />
                              )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Feedback inferior */}
                  {revelada && (
                    <div className="pt-4 border-t border-gray-100 space-y-3">
                      <div
                        className={`text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-2 ${
                          acertouUltima
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-rose-50 text-rose-700 animate-shake"
                        }`}
                      >
                        {acertouUltima ? <Sparkles size={14} /> : <XCircle size={14} />}
                        {feedbackMsg}
                      </div>

                      <button
                        onClick={proximoTurno}
                        className="w-full py-3 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/10 cursor-pointer"
                      >
                        Continuar
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="glass-premium rounded-3xl p-6 border border-indigo-100 flex items-center justify-center min-h-[380px] text-center text-gray-400">
                  Carregando perguntas...
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. TELA DE VITÓRIA / CELEBRAÇÃO */}
        {fase === "vitoria" && vencedorIdx !== null && (
          <div className="glass-premium rounded-3xl p-8 max-w-lg mx-auto text-center space-y-8 animate-fade-in-up border border-amber-200/50 shadow-2xl relative bg-white">
            {/* Efeitos de confete flutuando */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 rounded-full animate-float"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${100 + Math.random() * 20}%`,
                    backgroundColor: COLOR_MAP[players[vencedorIdx].color].hex,
                    animationDelay: `${Math.random() * 3}s`,
                    animationDuration: `${4 + Math.random() * 4}s`,
                  }}
                />
              ))}
            </div>

            <div className="space-y-4">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-amber-400 rounded-full blur-xl opacity-20 animate-pulse" />
                <Trophy
                  size={64}
                  strokeWidth={1.5}
                  className="text-amber-500 mx-auto relative z-10 animate-bounce"
                />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 font-serif">Jornada Concluída!</h2>
              <p className="text-sm text-gray-500 font-light max-w-sm mx-auto">
                Parabéns! Você alcançou o final do caminho de aprendizado e virtudes morais.
              </p>
            </div>

            {/* Placar do Vencedor */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 max-w-md mx-auto space-y-4 shadow-inner">
              <div className="flex items-center justify-center gap-3">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${
                    COLOR_MAP[players[vencedorIdx].color].bg
                  }`}
                >
                  {(() => {
                    const Icon = AVATAR_ICONS[players[vencedorIdx].avatar];
                    return <Icon size={24} />;
                  })()}
                </div>
                <div className="text-left">
                  <p className="text-xs text-gray-400 font-light font-sans">Grande Vencedor</p>
                  <p className="text-xl font-bold text-slate-800">{players[vencedorIdx].name}</p>
                </div>
              </div>

              {numPlayers === 2 && (
                <div className="text-xs text-slate-500 border-t border-slate-200/60 pt-4 flex justify-between font-medium">
                  <span>
                    {players[0].name}: Casa {positions[0] + 1}
                  </span>
                  <span>
                    {players[1].name}: Casa {positions[1] + 1}
                  </span>
                </div>
              )}
            </div>

            {/* Citação inspiradora de encerramento */}
            <div className="text-xs italic text-indigo-800/80 bg-indigo-50 rounded-xl p-4 leading-relaxed font-light font-serif">
              "O verdadeiro homem de bem é aquele que pratica a lei de justiça, amor e caridade em
              sua maior pureza."
              <span className="block mt-1 font-semibold text-indigo-900">
                — O Livro dos Espíritos
              </span>
            </div>

            {/* Botões */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={iniciarJogo}
                className="flex-1 py-3.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-600/10"
              >
                <RotateCcw size={14} />
                Jogar Novamente
              </button>
              <button
                onClick={() => setFase("config")}
                className="flex-1 py-3.5 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Mudar Configurações
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
