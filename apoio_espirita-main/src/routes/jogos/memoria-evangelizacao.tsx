import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, RotateCcw, Trophy, Brain, Layers } from "lucide-react";
import {
  VIRTUDES,
  PALAVRAS_EVANGELHO,
  PARES_POR_DIFICULDADE,
  type ModoJogo,
  type Dificuldade,
} from "@/data/memoria-evangelizacao";

export const Route = createFileRoute("/jogos/memoria-evangelizacao")({
  component: MemoriaEvangelizacao,
});

// ── Types ─────────────────────────────────────────────────────────────────────

interface Carta {
  uid: string;
  grupoId: string;
  tipo: "a" | "b";
  virada: boolean;
  combinada: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function embaralhar<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function criarCartas(modo: ModoJogo, dificuldade: Dificuldade): Carta[] {
  const n = PARES_POR_DIFICULDADE[dificuldade];
  const pool = modo === "virtudes"
    ? VIRTUDES.slice(0, n).map((v) => v.id)
    : PALAVRAS_EVANGELHO.slice(0, n).map((p) => p.id);

  const cartas: Carta[] = [];
  pool.forEach((grupoId) => {
    cartas.push({ uid: `${grupoId}-a`, grupoId, tipo: "a", virada: false, combinada: false });
    cartas.push({ uid: `${grupoId}-b`, grupoId, tipo: "b", virada: false, combinada: false });
  });
  return embaralhar(cartas);
}

function formatarTempo(seg: number): string {
  const m = Math.floor(seg / 60).toString().padStart(2, "0");
  const s = (seg % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// ── Card faces ────────────────────────────────────────────────────────────────

function FaceVirtude({ carta, modo }: { carta: Carta; modo: ModoJogo }) {
  if (modo !== "virtudes") return null;
  const virtude = VIRTUDES.find((v) => v.id === carta.grupoId);
  if (!virtude) return null;

  if (carta.tipo === "a") {
    return (
      <div className={`w-full h-full rounded-xl flex items-center justify-center ${virtude.cor}`}>
        <span className="text-center font-semibold text-gray-700 text-sm px-2 leading-tight">
          {virtude.virtude}
        </span>
      </div>
    );
  }
  return (
    <div className={`w-full h-full rounded-xl flex items-center justify-center ${virtude.cor}`}>
      <virtude.Icone size={32} strokeWidth={1.5} className={virtude.corIcone} />
    </div>
  );
}

function FaceEvangelho({ carta, modo }: { carta: Carta; modo: ModoJogo }) {
  if (modo !== "evangelho") return null;
  const par = PALAVRAS_EVANGELHO.find((p) => p.id === carta.grupoId);
  if (!par) return null;

  if (carta.tipo === "a") {
    return (
      <div className={`w-full h-full rounded-xl flex items-center justify-center ${par.cor}`}>
        <span className="text-center font-bold text-gray-700 text-base px-2">{par.palavra}</span>
      </div>
    );
  }
  return (
    <div className={`w-full h-full rounded-xl flex items-center justify-center p-2 ${par.cor}`}>
      <span className="text-center text-gray-600 text-xs leading-snug">{par.significado}</span>
    </div>
  );
}

// ── Card component ────────────────────────────────────────────────────────────

function CartaComponent({
  carta,
  modo,
  onClick,
  bloqueada,
}: {
  carta: Carta;
  modo: ModoJogo;
  onClick: () => void;
  bloqueada: boolean;
}) {
  const aberta = carta.virada || carta.combinada;

  return (
    <button
      onClick={onClick}
      disabled={carta.combinada || bloqueada || carta.virada}
      aria-label={aberta ? undefined : "Carta virada — clique para revelar"}
      className={`aspect-square w-full transition-transform duration-200 active:scale-95 focus:outline-none rounded-xl ${
        carta.combinada ? "ring-2 ring-emerald-400" : ""
      }`}
      style={{ perspective: "600px" }}
    >
      <div
        className="relative w-full h-full"
        style={{
          transformStyle: "preserve-3d",
          transform: aberta ? "rotateY(180deg)" : "rotateY(0deg)",
          transition: "transform 0.35s ease",
        }}
      >
        {/* Verso (frente quando fechada) */}
        <div
          className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shadow-md"
          style={{ backfaceVisibility: "hidden" }}
        >
          <Brain size={24} strokeWidth={1.5} className="text-white/70" />
        </div>

        {/* Face (frente quando aberta) */}
        <div
          className="absolute inset-0 shadow-md"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          {modo === "virtudes"
            ? <FaceVirtude carta={carta} modo={modo} />
            : <FaceEvangelho carta={carta} modo={modo} />
          }
        </div>
      </div>
    </button>
  );
}

// ── Tela de seleção ───────────────────────────────────────────────────────────

function TelaSelecao({
  onIniciar,
}: {
  onIniciar: (modo: ModoJogo, dificuldade: Dificuldade) => void;
}) {
  const [modo, setModo] = useState<ModoJogo | null>(null);
  const [dificuldade, setDificuldade] = useState<Dificuldade>("facil");

  const modos: { id: ModoJogo; label: string; desc: string; cor: string }[] = [
    {
      id: "virtudes",
      label: "Virtudes",
      desc: "Casa o nome da virtude com o seu símbolo",
      cor: "border-violet-300 bg-violet-50 hover:bg-violet-100",
    },
    {
      id: "evangelho",
      label: "Palavras do Evangelho",
      desc: "Casa a palavra com o seu significado",
      cor: "border-cyan-300 bg-cyan-50 hover:bg-cyan-100",
    },
  ];

  const dificuldades: { id: Dificuldade; label: string; pares: number }[] = [
    { id: "facil",   label: "Fácil",   pares: 6  },
    { id: "medio",   label: "Médio",   pares: 8  },
    { id: "dificil", label: "Difícil", pares: 10 },
  ];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Escolha o modo</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {modos.map((m) => (
            <button
              key={m.id}
              onClick={() => setModo(m.id)}
              className={`rounded-xl border-2 p-4 text-left transition-all ${m.cor} ${
                modo === m.id ? "ring-2 ring-offset-1 ring-current" : ""
              }`}
            >
              <p className="font-semibold text-gray-800 text-sm">{m.label}</p>
              <p className="text-xs text-gray-500 mt-1">{m.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Dificuldade</p>
        <div className="grid grid-cols-3 gap-2">
          {dificuldades.map((d) => (
            <button
              key={d.id}
              onClick={() => setDificuldade(d.id)}
              className={`rounded-xl border-2 py-3 text-sm font-medium transition-all ${
                dificuldade === d.id
                  ? "border-cyan-400 bg-cyan-50 text-cyan-700"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
            >
              <span className="block">{d.label}</span>
              <span className="text-xs font-normal text-gray-400">{d.pares} pares</span>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => modo && onIniciar(modo, dificuldade)}
        disabled={!modo}
        className="w-full py-3 rounded-xl text-sm uppercase tracking-widest font-medium text-white bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md"
      >
        Começar
      </button>
    </div>
  );
}

// ── Tela de conclusão ─────────────────────────────────────────────────────────

function TelaConclusao({
  tentativas,
  tempo,
  modo,
  dificuldade,
  onReiniciar,
  onVoltarSelecao,
}: {
  tentativas: number;
  tempo: number;
  modo: ModoJogo;
  dificuldade: Dificuldade;
  onReiniciar: () => void;
  onVoltarSelecao: () => void;
}) {
  return (
    <div className="text-center space-y-6 py-4">
      <div className="flex justify-center">
        <div className="w-20 h-20 rounded-full bg-yellow-50 border-4 border-yellow-300 flex items-center justify-center">
          <Trophy size={36} strokeWidth={1.5} className="text-yellow-500" />
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-800">Parabéns!</h2>
        <p className="text-sm text-gray-500 mt-1">Você encontrou todos os pares!</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-gray-50 border border-gray-200 py-4">
          <p className="text-2xl font-bold text-gray-800">{tentativas}</p>
          <p className="text-xs text-gray-500 mt-1">tentativas</p>
        </div>
        <div className="rounded-xl bg-gray-50 border border-gray-200 py-4">
          <p className="text-2xl font-bold text-gray-800">{formatarTempo(tempo)}</p>
          <p className="text-xs text-gray-500 mt-1">tempo</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onReiniciar}
          className="flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <RotateCcw size={14} strokeWidth={2} />
          Jogar de novo
        </button>
        <button
          onClick={onVoltarSelecao}
          className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-sm font-medium text-white hover:from-cyan-600 hover:to-teal-600 transition-all shadow-sm"
        >
          <Layers size={14} strokeWidth={2} />
          Outro modo
        </button>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

function MemoriaEvangelizacao() {
  const { user } = useAuth();
  const [fase, setFase] = useState<"selecao" | "jogo" | "conclusao">("selecao");
  const [modo, setModo] = useState<ModoJogo>("virtudes");
  const [dificuldade, setDificuldade] = useState<Dificuldade>("facil");
  const [cartas, setCartas] = useState<Carta[]>([]);
  const [viradas, setViradas] = useState<string[]>([]);
  const [bloqueado, setBloqueado] = useState(false);
  const [tentativas, setTentativas] = useState(0);
  const [tempo, setTempo] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (fase === "jogo") {
      timerRef.current = setInterval(() => setTempo((t) => t + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [fase]);

  const iniciarJogo = useCallback((m: ModoJogo, d: Dificuldade) => {
    setModo(m);
    setDificuldade(d);
    setCartas(criarCartas(m, d));
    setViradas([]);
    setBloqueado(false);
    setTentativas(0);
    setTempo(0);
    setFase("jogo");
  }, []);

  const reiniciar = useCallback(() => {
    iniciarJogo(modo, dificuldade);
  }, [iniciarJogo, modo, dificuldade]);

  const clicarCarta = useCallback((uid: string) => {
    if (bloqueado || viradas.includes(uid)) return;

    setCartas((prev) =>
      prev.map((c) => (c.uid === uid ? { ...c, virada: true } : c))
    );

    const novasViradas = [...viradas, uid];
    setViradas(novasViradas);

    if (novasViradas.length === 2) {
      setBloqueado(true);
      setTentativas((t) => t + 1);

      const [uidA, uidB] = novasViradas;
      const cartaA = cartas.find((c) => c.uid === uidA);
      const cartaB = cartas.find((c) => c.uid === uidB);

      if (cartaA && cartaB && cartaA.grupoId === cartaB.grupoId) {
        // Par correto
        setCartas((prev) =>
          prev.map((c) =>
            c.uid === uidA || c.uid === uidB
              ? { ...c, combinada: true, virada: false }
              : c
          )
        );
        setViradas([]);
        setBloqueado(false);

        // Verificar se terminou
        const totalPares = PARES_POR_DIFICULDADE[dificuldade];
        setCartas((prev) => {
          const combinadas = prev.filter((c) => c.uid === uidA || c.uid === uidB
            ? true : c.combinada).length;
          if (combinadas === totalPares * 2) {
            setTimeout(() => setFase("conclusao"), 400);
          }
          return prev;
        });
      } else {
        // Par errado
        setTimeout(() => {
          setCartas((prev) =>
            prev.map((c) =>
              c.uid === uidA || c.uid === uidB ? { ...c, virada: false } : c
            )
          );
          setViradas([]);
          setBloqueado(false);
        }, 900);
      }
    }
  }, [bloqueado, viradas, cartas, dificuldade]);

  // Verificar conclusão após cada match
  useEffect(() => {
    if (fase !== "jogo") return;
    const totalPares = PARES_POR_DIFICULDADE[dificuldade];
    const combinadas = cartas.filter((c) => c.combinada).length;
    if (cartas.length > 0 && combinadas === totalPares * 2) {
      setTimeout(() => setFase("conclusao"), 500);
    }
  }, [cartas, dificuldade, fase]);

  if (!user) {
    return (
      <main className="page-light min-h-screen px-4 pt-20 pb-20 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">
          <Link to="/login" className="text-cyan-600 hover:underline">Faça login</Link> para jogar.
        </p>
      </main>
    );
  }

  const colunas = (() => {
    const n = cartas.length;
    if (n <= 12) return "grid-cols-4";
    if (n <= 16) return "grid-cols-4";
    return "grid-cols-5";
  })();

  const modoLabel = modo === "virtudes" ? "Virtudes" : "Palavras do Evangelho";
  const difLabel = { facil: "Fácil", medio: "Médio", dificil: "Difícil" }[dificuldade];

  return (
    <main className="page-light min-h-screen px-4 pt-20 pb-20">
      <div className="mx-auto max-w-2xl">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            to="/evangelizacao"
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={18} strokeWidth={2} />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-gray-800">Jogo da Memória</h1>
            <p className="text-xs text-gray-400">Evangelização · 3–11 anos</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">

          {/* Seleção */}
          {fase === "selecao" && (
            <TelaSelecao onIniciar={iniciarJogo} />
          )}

          {/* Jogo */}
          {fase === "jogo" && (
            <div className="space-y-4">
              {/* Status bar */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="font-medium text-gray-700">{modoLabel} · {difLabel}</span>
                <div className="flex items-center gap-4">
                  <span>{tentativas} tentativas</span>
                  <span className="tabular-nums font-mono">{formatarTempo(tempo)}</span>
                  <button
                    onClick={reiniciar}
                    aria-label="Reiniciar"
                    className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <RotateCcw size={14} strokeWidth={2} />
                  </button>
                </div>
              </div>

              {/* Grid de cartas */}
              <div className={`grid ${colunas} gap-2`}>
                {cartas.map((carta) => (
                  <CartaComponent
                    key={carta.uid}
                    carta={carta}
                    modo={modo}
                    onClick={() => clicarCarta(carta.uid)}
                    bloqueada={bloqueado}
                  />
                ))}
              </div>

              <button
                onClick={() => setFase("selecao")}
                className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Voltar à seleção
              </button>
            </div>
          )}

          {/* Conclusão */}
          {fase === "conclusao" && (
            <TelaConclusao
              tentativas={tentativas}
              tempo={tempo}
              modo={modo}
              dificuldade={dificuldade}
              onReiniciar={reiniciar}
              onVoltarSelecao={() => setFase("selecao")}
            />
          )}
        </div>
      </div>
    </main>
  );
}
