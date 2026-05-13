import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, RotateCcw, BookOpen, Leaf } from "lucide-react";
import { PALAVRAS, type Palavra } from "@/data/palavras-semente";

export const Route = createFileRoute("/jogos/plante-a-semente")({
  component: PlanteSemente,
});

// ── Utilities ────────────────────────────────────────────────────────────────

function normalizar(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase();
}

function letrasUnicas(palavra: string): Set<string> {
  const norm = normalizar(palavra);
  const set = new Set<string>();
  for (const ch of norm) {
    if (/[A-Z]/.test(ch)) set.add(ch);
  }
  return set;
}

function palavraAleatoria(excluir?: string): Palavra {
  const pool = excluir
    ? PALAVRAS.filter((p) => p.palavra !== excluir)
    : PALAVRAS;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ── Plant SVG (7 stages: 0 = semente … 6 = flor) ────────────────────────────

function PlantaSVG({ stage, completo }: { stage: number; completo: boolean }) {
  const gy = 192; // ground y-coordinate

  const stemTopY = [gy, gy - 22, gy - 45, gy - 72, gy - 98, gy - 116, gy - 126][
    Math.min(stage, 6)
  ];

  return (
    <svg
      viewBox="0 0 200 240"
      className="w-full h-full"
      aria-label={`Planta no estágio ${stage} de 6`}
    >
      <defs>
        <linearGradient id="ps-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F0FFF4" />
          <stop offset="100%" stopColor="#DCFCE7" />
        </linearGradient>
        <linearGradient id="ps-soil" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7B5533" />
          <stop offset="100%" stopColor="#3E2410" />
        </linearGradient>
        {completo && (
          <filter id="ps-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>

      {/* Sky */}
      <rect x="0" y="0" width="200" height={gy} rx="14" fill="url(#ps-sky)" />

      {/* Soil */}
      <rect x="0" y={gy} width="200" height={240 - gy} fill="url(#ps-soil)" />
      <ellipse cx="100" cy={gy} rx="100" ry="7" fill="#5D3A1A" />

      {/* ── Stage 0: semente enterrada ─────────────────── */}
      {stage === 0 && (
        <>
          <ellipse cx="100" cy={gy + 22} rx="14" ry="9" fill="#C8963E" />
          <line
            x1="91" y1={gy + 22} x2="109" y2={gy + 22}
            stroke="#8B6520" strokeWidth="1.5"
          />
          <ellipse cx="100" cy={gy + 22} rx="14" ry="9" fill="none" stroke="#8B6520" strokeWidth="1" />
        </>
      )}

      {/* ── Stage 1: germinando ────────────────────────── */}
      {stage === 1 && (
        <>
          <ellipse cx="100" cy={gy + 7} rx="11" ry="7" fill="#C8963E" />
          <line
            x1="100" y1={gy} x2="100" y2={stemTopY}
            stroke="#66BB6A" strokeWidth="3.5" strokeLinecap="round"
          />
          {/* cotilédones */}
          <ellipse cx="90"  cy={gy - 16} rx="9" ry="4.5" fill="#A5D6A7"
            transform={`rotate(-40, 90, ${gy - 16})`} />
          <ellipse cx="110" cy={gy - 16} rx="9" ry="4.5" fill="#A5D6A7"
            transform={`rotate(40, 110, ${gy - 16})`} />
        </>
      )}

      {/* ── Stage 2+: caule e folhas ───────────────────── */}
      {stage >= 2 && (
        <>
          {/* Caule */}
          <line
            x1="100" y1={gy} x2="100" y2={stemTopY}
            stroke={completo ? "#2E7D32" : "#43A047"}
            strokeWidth={3 + stage * 0.35}
            strokeLinecap="round"
          />

          {/* 1° par de folhas (aparece no stage 2) */}
          {stage >= 2 && (
            <>
              <ellipse cx="83"  cy={gy - 35} rx="17" ry="7" fill="#66BB6A"
                transform={`rotate(-28, 83, ${gy - 35})`} />
              <ellipse cx="117" cy={gy - 35} rx="17" ry="7" fill="#66BB6A"
                transform={`rotate(28, 117, ${gy - 35})`} />
            </>
          )}

          {/* 2° par de folhas (stage 3) */}
          {stage >= 3 && (
            <>
              <ellipse cx="82"  cy={gy - 60} rx="16" ry="6.5" fill="#4CAF50"
                transform={`rotate(-25, 82, ${gy - 60})`} />
              <ellipse cx="118" cy={gy - 60} rx="16" ry="6.5" fill="#4CAF50"
                transform={`rotate(25, 118, ${gy - 60})`} />
            </>
          )}

          {/* 3° par de folhas (stage 4) */}
          {stage >= 4 && (
            <>
              <ellipse cx="83"  cy={gy - 84} rx="15" ry="6" fill="#388E3C"
                transform={`rotate(-30, 83, ${gy - 84})`} />
              <ellipse cx="117" cy={gy - 84} rx="15" ry="6" fill="#388E3C"
                transform={`rotate(30, 117, ${gy - 84})`} />
            </>
          )}

          {/* Botão floral (stage 5) */}
          {stage === 5 && (
            <>
              <ellipse cx="100" cy={gy - 120} rx="9"  ry="13" fill="#A5D6A7" />
              <ellipse cx="100" cy={gy - 125} rx="6.5" ry="8"  fill="#C8E6C9" />
            </>
          )}

          {/* Flor aberta (stage 6) */}
          {stage >= 6 && (
            <>
              {/* 6 pétalas */}
              {[0, 60, 120, 180, 240, 300].map((angle) => (
                <ellipse
                  key={angle}
                  cx="100"
                  cy={gy - 143}
                  rx="7"
                  ry="14"
                  fill={completo ? "#FDD835" : "#FFF176"}
                  transform={`rotate(${angle}, 100, ${gy - 129})`}
                  filter={completo ? "url(#ps-glow)" : undefined}
                />
              ))}
              {/* Centro da flor */}
              <circle
                cx="100" cy={gy - 129} r="12"
                fill="#FF8F00"
                filter={completo ? "url(#ps-glow)" : undefined}
              />
              <circle cx="100" cy={gy - 129} r="6.5" fill="#FFA000" />
              {/* Brilhos decorativos ao completar */}
              {completo && (
                <>
                  <circle cx="68"  cy={gy - 152} r="3"   fill="#FDD835" opacity="0.85" />
                  <circle cx="132" cy={gy - 149} r="2.5" fill="#FDD835" opacity="0.75" />
                  <circle cx="78"  cy={gy - 160} r="2"   fill="#A5D6A7" opacity="0.9"  />
                  <circle cx="122" cy={gy - 156} r="2"   fill="#A5D6A7" opacity="0.7"  />
                  <circle cx="90"  cy={gy - 165} r="1.5" fill="#FFFFFF"  opacity="0.8"  />
                  <circle cx="110" cy={gy - 163} r="1.5" fill="#FFFFFF"  opacity="0.7"  />
                </>
              )}
            </>
          )}
        </>
      )}
    </svg>
  );
}

// ── Stage label ───────────────────────────────────────────────────────────────

const STAGE_LABELS = [
  "Semente",
  "Germinando",
  "Broto",
  "Folhas",
  "Crescendo",
  "Botão",
  "Flor",
];

// ── Main component ────────────────────────────────────────────────────────────

function PlanteSemente() {
  const { user, loading } = useAuth();
  const navigate = Route.useNavigate();

  const [palavra, setPalavra] = useState<Palavra>(() => palavraAleatoria());
  const [usadas, setUsadas] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  // Derived
  const unicas = letrasUnicas(palavra.palavra);
  const corretas = new Set([...usadas].filter((l) => unicas.has(l)));
  const erradas = new Set([...usadas].filter((l) => !unicas.has(l)));
  const completo = corretas.size === unicas.size;
  const stage = completo
    ? 6
    : Math.min(5, Math.round((corretas.size / unicas.size) * 6));

  const adivinhar = useCallback(
    (letra: string) => {
      if (usadas.has(letra) || completo) return;
      setUsadas((prev) => new Set([...prev, letra]));
    },
    [usadas, completo]
  );

  // Keyboard support
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const ch = e.key.toUpperCase();
      if (/^[A-Z]$/.test(ch)) adivinhar(ch);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [adivinhar]);

  function novaRodada() {
    setPalavra(palavraAleatoria(palavra.palavra));
    setUsadas(new Set());
  }

  if (loading || !user) return null;

  return (
    <main className="page-light min-h-screen px-4 py-10">
      <div className="mx-auto max-w-3xl space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            to="/inicio"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Início
          </Link>
          <span className="text-muted-foreground/40">|</span>
          <div className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-emerald-600" />
            <h1 className="text-lg font-semibold tracking-wide text-foreground">
              Plante a Semente
            </h1>
          </div>
        </div>

        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Descubra o termo da codificação espírita
        </p>

        {/* Game area */}
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 items-start">

          {/* Plant */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-full max-w-[200px] mx-auto aspect-[200/240]">
              <PlantaSVG stage={stage} completo={completo} />
            </div>
            <span className="text-xs text-muted-foreground tracking-wide">
              {STAGE_LABELS[stage]}
            </span>
          </div>

          {/* Right panel */}
          <div className="space-y-5">

            {/* Hint */}
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
              <span className="text-xs uppercase tracking-widest text-emerald-700 font-medium">
                Dica
              </span>
              <p className="mt-1 text-sm text-emerald-900">{palavra.dica}</p>
            </div>

            {/* Word display */}
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              {palavra.palavra.split("").map((char, i) => {
                if (char === "-" || char === " ") {
                  return (
                    <span key={i} className="flex items-end pb-1 text-muted-foreground font-bold">
                      {char}
                    </span>
                  );
                }
                const norm = normalizar(char);
                const revealed = usadas.has(norm) || completo;
                return (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <span
                      className={`text-xl font-bold w-8 text-center transition-all duration-300 ${
                        revealed ? "text-foreground" : "text-transparent"
                      }`}
                    >
                      {revealed ? char : "A"}
                    </span>
                    <div
                      className={`h-0.5 w-8 rounded-full transition-colors duration-300 ${
                        revealed ? "bg-emerald-500" : "bg-muted-foreground/30"
                      }`}
                    />
                  </div>
                );
              })}
            </div>

            {/* Wrong letters */}
            {erradas.size > 0 && !completo && (
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-xs text-muted-foreground uppercase tracking-widest">
                  Tentativas:
                </span>
                {[...erradas].sort().map((l) => (
                  <span
                    key={l}
                    className="text-xs font-mono font-semibold text-rose-500 bg-rose-50 border border-rose-200 rounded px-1.5 py-0.5"
                  >
                    {l}
                  </span>
                ))}
              </div>
            )}

            {/* Completion card */}
            {completo && (
              <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-5 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-700 flex-shrink-0" />
                  <span className="text-sm font-semibold text-emerald-800 uppercase tracking-widest">
                    {palavra.palavra}
                  </span>
                </div>
                <p className="text-sm text-emerald-900 leading-relaxed">
                  {palavra.significado}
                </p>
                <p className="text-xs text-emerald-700 italic">
                  {palavra.referencia}
                </p>
              </div>
            )}

          </div>
        </div>

        {/* Keyboard */}
        <div className="grid grid-cols-7 gap-2">
          {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((letra) => {
            const certa = corretas.has(letra);
            const errada = erradas.has(letra);
            return (
              <button
                key={letra}
                onClick={() => adivinhar(letra)}
                disabled={certa || errada || completo}
                className={`
                  h-10 rounded-lg text-sm font-bold transition-all duration-200 border
                  ${certa
                    ? "bg-emerald-500 text-white border-emerald-600 cursor-default"
                    : errada
                    ? "bg-rose-100 text-rose-400 border-rose-200 cursor-default"
                    : completo
                    ? "opacity-40 cursor-default bg-white border-border text-foreground"
                    : "bg-white border-border text-foreground hover:bg-emerald-50 hover:border-emerald-300 active:scale-95 cursor-pointer"
                  }
                `}
              >
                {letra}
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={novaRodada}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm border border-border text-muted-foreground hover:text-foreground hover:border-emerald-400 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            {completo ? "Nova Palavra" : "Pular"}
          </button>
        </div>

      </div>
    </main>
  );
}
