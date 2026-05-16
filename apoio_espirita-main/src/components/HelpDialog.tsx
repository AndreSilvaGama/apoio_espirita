import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

type Step =
  | "initial"
  | "food"
  | "food-result"
  | "emotional"
  | "find-center"
  | "find-center-result";

interface CasaEspirita {
  id: string;
  nome: string;
  endereco: string;
  cidade: string;
  estado: string;
  telefone: string | null;
  latitude: number;
  longitude: number;
}

interface CasaResult {
  casa: CasaEspirita;
  distKm: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function coordsFromCep(cep: string) {
  const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${cep.replace(/\D/g, "")}`);
  if (!res.ok) throw new Error("CEP não encontrado.");
  const data = await res.json();
  const { latitude, longitude } = data.location?.coordinates ?? {};
  if (!latitude || !longitude) throw new Error("Não foi possível localizar este CEP.");
  return { latitude: Number(latitude), longitude: Number(longitude) };
}

const UFS = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO",
  "MA", "MG", "MS", "MT", "PA", "PB", "PE", "PI", "PR",
  "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO",
];

async function fetchCidadesPorUF(uf: string): Promise<string[]> {
  const { data } = await supabase
    .from("casas_espirita")
    .select("cidade")
    .eq("estado", uf)
    .eq("ativa", true)
    .order("cidade");
  return [...new Set((data ?? []).map((r: { cidade: string }) => r.cidade))].sort();
}

async function fetchCasasPorCidade(estado: string, cidade: string): Promise<CasaEspirita[]> {
  const { data, error } = await supabase
    .from("casas_espirita")
    .select("id, nome, endereco, cidade, estado, telefone, latitude, longitude")
    .eq("estado", estado)
    .eq("cidade", cidade)
    .eq("ativa", true);
  if (error) throw new Error("Erro ao buscar casas espíritas.");
  return (data ?? []) as CasaEspirita[];
}

async function fetchCasas(filter?: { aceita_doacao_alimentos: boolean }) {
  let query = supabase
    .from("casas_espirita")
    .select("id, nome, endereco, cidade, estado, telefone, latitude, longitude")
    .eq("ativa", true);
  if (filter) query = query.eq("aceita_doacao_alimentos", filter.aceita_doacao_alimentos);
  const { data, error } = await query;
  if (error) throw new Error("Erro ao buscar casas espíritas.");
  return (data ?? []) as CasaEspirita[];
}

function sortByDistance(casas: CasaEspirita[], lat: number, lon: number): CasaResult[] {
  return casas
    .map((c) => ({ casa: c, distKm: Math.round(haversineKm(lat, lon, c.latitude, c.longitude)) }))
    .sort((a, b) => a.distKm - b.distKm);
}

// ── Sub-components ─────────────────────────────────────────────────────────

function InitialStep({ onChoose }: { onChoose: (s: "food" | "emotional" | "find-center") => void }) {
  return (
    <div className="space-y-3">
      <p className="text-center text-muted-foreground font-light text-sm pb-1">
        Estamos aqui. Conte-nos o que você está precisando.
      </p>

      <button
        onClick={() => onChoose("emotional")}
        className="w-full glass rounded-2xl p-5 text-left hover:border-cyan-glow/40 transition-all duration-500 hover:-translate-y-1"
      >
        <span className="text-2xl">💙</span>
        <h3 className="mt-2 text-base font-medium text-foreground">Estou com sentimentos difíceis</h3>
        <p className="mt-1 text-sm text-muted-foreground font-light">
          Ansiedade, tristeza, solidão — você não precisa carregar isso sozinho.
        </p>
      </button>

      <button
        onClick={() => onChoose("find-center")}
        className="w-full glass rounded-2xl p-5 text-left hover:border-cyan-glow/40 transition-all duration-500 hover:-translate-y-1"
      >
        <span className="text-2xl">🍞</span>
        <h3 className="mt-2 text-base font-medium text-foreground">Preciso de alimentação</h3>
        <p className="mt-1 text-sm text-muted-foreground font-light">
          Encontramos casas espíritas próximas — muitas oferecem assistência com alimentos.
        </p>
      </button>

      <button
        onClick={() => onChoose("find-center")}
        className="w-full glass rounded-2xl p-5 text-left hover:border-cyan-glow/40 transition-all duration-500 hover:-translate-y-1"
      >
        <span className="text-2xl">🏛️</span>
        <h3 className="mt-2 text-base font-medium text-foreground">Encontrar uma casa espírita</h3>
        <p className="mt-1 text-sm text-muted-foreground font-light">
          Buscamos as casas espíritas mais próximas de você.
        </p>
      </button>
    </div>
  );
}

// ── Food search ────────────────────────────────────────────────────────────

function FoodStep({
  onResult,
}: {
  onResult: (r: CasaResult | null, err?: string) => void;
}) {
  const [cep, setCep] = useState("");
  const [loading, setLoading] = useState(false);

  const fmt = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 8);
    return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
  };

  const search = async () => {
    setLoading(true);
    try {
      const { latitude, longitude } = await coordsFromCep(cep);
      const casas = await fetchCasas({ aceita_doacao_alimentos: true });
      const sorted = sortByDistance(casas, latitude, longitude);
      onResult(sorted[0] ?? null);
    } catch (e: unknown) {
      onResult(null, e instanceof Error ? e.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <p className="text-center text-muted-foreground font-light text-sm leading-relaxed">
        Digite seu CEP para encontrar a casa espírita mais próxima que distribui alimentos.
      </p>
      <div className="flex gap-3">
        <input
          type="text"
          inputMode="numeric"
          placeholder="00000-000"
          value={cep}
          onChange={(e) => setCep(fmt(e.target.value))}
          onKeyDown={(e) => e.key === "Enter" && cep.replace(/\D/g, "").length === 8 && search()}
          className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-cyan-glow/40 transition-colors text-sm"
        />
        <button
          onClick={search}
          disabled={loading || cep.replace(/\D/g, "").length < 8}
          className="px-5 py-3 rounded-xl text-sm font-medium bg-cyan-glow/10 text-cyan-glow border border-cyan-glow/30 hover:bg-cyan-glow/20 disabled:opacity-40 transition-colors"
        >
          {loading ? "Buscando…" : "Buscar"}
        </button>
      </div>
    </div>
  );
}

function FoodResult({
  result,
  error,
  onBack,
}: {
  result: CasaResult | null;
  error?: string;
  onBack: () => void;
}) {
  if (error) return <ResultError msg={error} onBack={onBack} backLabel="Tentar com outro CEP" />;
  if (!result) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-muted-foreground font-light text-sm leading-relaxed">
          Não encontramos casas cadastradas próximas a você no momento.
          <br />
          Entre em contato com a Federação Espírita do seu estado.
        </p>
        <BackLink onClick={onBack} label="Tentar com outro CEP" />
      </div>
    );
  }
  return (
    <>
      <p className="text-center text-xs uppercase tracking-widest text-cyan-glow mb-3">
        A casa espírita mais próxima que está aceitando famílias para entrega de alimentos é:
      </p>
      <CasaCard result={result} />
      <BackLink onClick={onBack} label="Buscar em outro CEP" />
    </>
  );
}

// ── Find center ────────────────────────────────────────────────────────────

function FindCenterStep({
  onResult,
}: {
  onResult: (r: CasaResult[], err?: string) => void;
}) {
  const [uf, setUf] = useState("");
  const [cidade, setCidade] = useState("");
  const [cidades, setCidades] = useState<string[]>([]);
  const [loadingCidades, setLoadingCidades] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleUfChange(novaUf: string) {
    setUf(novaUf);
    setCidade("");
    setCidades([]);
    if (!novaUf) return;
    setLoadingCidades(true);
    const lista = await fetchCidadesPorUF(novaUf);
    setCidades(lista);
    setLoadingCidades(false);
  }

  const search = async () => {
    setLoading(true);
    try {
      const casas = await fetchCasasPorCidade(uf, cidade);
      onResult(casas.map((c) => ({ casa: c, distKm: 0 })));
    } catch (e: unknown) {
      onResult([], e instanceof Error ? e.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  };

  const selectClass =
    "w-full rounded-xl bg-zinc-800 border border-white/10 px-4 py-3 text-sm text-foreground [color-scheme:dark] focus:outline-none focus:border-cyan-glow/40 transition-colors disabled:opacity-50";

  return (
    <div className="space-y-4">
      <p className="text-center text-muted-foreground font-light text-sm">
        Selecione o estado e a cidade para ver as casas espíritas cadastradas.
      </p>

      <select value={uf} onChange={(e) => handleUfChange(e.target.value)} className={selectClass}>
        <option value="">Selecione o estado (UF)</option>
        {UFS.map((u) => (
          <option key={u} value={u}>{u}</option>
        ))}
      </select>

      <select
        value={cidade}
        onChange={(e) => setCidade(e.target.value)}
        disabled={!uf || loadingCidades || cidades.length === 0}
        className={selectClass}
      >
        <option value="">
          {loadingCidades
            ? "Carregando cidades…"
            : !uf
            ? "Selecione o estado primeiro"
            : cidades.length === 0
            ? "Nenhuma cidade cadastrada"
            : "Selecione a cidade"}
        </option>
        {cidades.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <button
        onClick={search}
        disabled={loading || !uf || !cidade}
        className="w-full py-3 rounded-xl text-sm font-medium bg-cyan-glow/10 text-cyan-glow border border-cyan-glow/30 hover:bg-cyan-glow/20 disabled:opacity-40 transition-colors"
      >
        {loading ? "Buscando…" : "Ver casas espíritas"}
      </button>
    </div>
  );
}

function FindCenterResult({
  results,
  error,
  onBack,
}: {
  results: CasaResult[];
  error?: string;
  onBack: () => void;
}) {
  if (error) return <ResultError msg={error} onBack={onBack} backLabel="Tentar novamente" />;
  if (results.length === 0) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-muted-foreground font-light text-sm leading-relaxed">
          Não encontramos casas espíritas cadastradas na sua região ainda.
        </p>
        <BackLink onClick={onBack} label="Tentar outra busca" />
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <p className="text-center text-xs uppercase tracking-widest text-cyan-glow mb-1">
        {results.length} casa{results.length !== 1 ? "s" : ""} espírita{results.length !== 1 ? "s" : ""} encontrada{results.length !== 1 ? "s" : ""}
      </p>
      {results.map((r, i) => (
        <CasaCard key={r.casa.id} result={r} rank={i + 1} showDist={false} />
      ))}
      <BackLink onClick={onBack} label="Nova busca" />
    </div>
  );
}

// ── Emotional ──────────────────────────────────────────────────────────────

function EmotionalStep() {
  return (
    <div className="space-y-6 text-center">
      <div className="text-4xl">🕊️</div>
      <p className="text-lg font-light text-foreground leading-relaxed">
        O que você está sentindo tem{" "}
        <span className="text-gradient-aurora font-medium">valor e significado.</span>
      </p>
      <p className="text-sm text-muted-foreground font-light leading-relaxed">
        Momentos de dor, angústia ou vazio fazem parte da jornada humana.
        Você não precisa enfrentar isso sozinho — existe alguém pronto para
        ouvir, sem julgamentos, com total sigilo e cuidado.
      </p>
      <a
        href="https://cvv.org.br/chat/"
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full px-6 py-4 rounded-full text-sm uppercase tracking-widest text-cyan-glow border border-cyan-glow/40 hover:bg-cyan-glow/10 transition-colors duration-500 animate-pulse-glow"
      >
        Conversar agora — CVV
      </a>
      <p className="text-xs text-muted-foreground/60 font-light">
        Centro de Valorização da Vida · Gratuito · Sigiloso · 24 horas · Ligue 188
      </p>
    </div>
  );
}

// ── Shared UI ──────────────────────────────────────────────────────────────

function CasaCard({ result, rank, showDist = true }: { result: CasaResult; rank?: number; showDist?: boolean }) {
  const { casa, distKm } = result;
  return (
    <div className="glass rounded-2xl p-4 space-y-1">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium text-foreground leading-snug">
          {rank && <span className="text-cyan-glow mr-1">{rank}.</span>}
          {casa.nome.toUpperCase()}
        </h3>
        {showDist && <span className="text-xs text-muted-foreground/60 shrink-0">≈ {distKm} km</span>}
      </div>
      <p className="text-xs text-muted-foreground font-light">{casa.endereco}</p>
      <p className="text-xs text-muted-foreground font-light">
        {casa.cidade} — {casa.estado}
      </p>
      {casa.telefone && (
        <p className="text-xs text-cyan-glow">{casa.telefone}</p>
      )}
    </div>
  );
}

function ResultError({ msg, onBack, backLabel }: { msg: string; onBack: () => void; backLabel: string }) {
  return (
    <div className="space-y-4 text-center">
      <p className="text-muted-foreground font-light text-sm">{msg}</p>
      <BackLink onClick={onBack} label={backLabel} />
    </div>
  );
}

function BackLink({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-xs text-cyan-glow/70 hover:text-cyan-glow underline underline-offset-2 transition-colors"
    >
      {label}
    </button>
  );
}

// ── Dialog titles ──────────────────────────────────────────────────────────

const titles: Record<Step, React.ReactNode> = {
  initial: <>Você não está <span className="text-gradient-aurora font-medium">sozinho(a)</span></>,
  food: "Buscar alimentação",
  "food-result": "Resultado da busca",
  emotional: <>Um cuidado que <span className="text-gradient-aurora font-medium">acolhe</span></>,
  "find-center": "Encontrar casa espírita",
  "find-center-result": "Casas espíritas encontradas",
};

// ── Main Dialog ────────────────────────────────────────────────────────────

export function HelpDialog({
  children,
  initialStep = "initial",
}: {
  children: React.ReactNode;
  initialStep?: Step;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>(initialStep);

  // food
  const [foodResult, setFoodResult] = useState<CasaResult | null>(null);
  const [foodError, setFoodError] = useState<string | undefined>();

  // find center
  const [centerResults, setCenterResults] = useState<CasaResult[]>([]);
  const [centerError, setCenterError] = useState<string | undefined>();

  const reset = () => {
    setStep(initialStep);
    setFoodResult(null);
    setFoodError(undefined);
    setCenterResults([]);
    setCenterError(undefined);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="bg-background/95 backdrop-blur-xl border-cyan-glow/20 max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-light text-foreground text-center">
            {titles[step]}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-2">
          {step === "initial" && (
            <InitialStep onChoose={(s) => setStep(s)} />
          )}

          {step === "food" && (
            <FoodStep
              onResult={(r, err) => {
                setFoodResult(r);
                setFoodError(err);
                setStep("food-result");
              }}
            />
          )}
          {step === "food-result" && (
            <FoodResult
              result={foodResult}
              error={foodError}
              onBack={() => { setFoodResult(null); setFoodError(undefined); setStep("food"); }}
            />
          )}

          {step === "find-center" && (
            <FindCenterStep
              onResult={(r, err) => {
                setCenterResults(r);
                setCenterError(err);
                setStep("find-center-result");
              }}
            />
          )}
          {step === "find-center-result" && (
            <FindCenterResult
              results={centerResults}
              error={centerError}
              onBack={() => { setCenterResults([]); setCenterError(undefined); setStep("find-center"); }}
            />
          )}

          {step === "emotional" && <EmotionalStep />}
        </div>

        {step !== "initial" && (
          <button
            onClick={reset}
            className="mt-3 mx-auto block text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            ← Voltar ao início
          </button>
        )}
      </DialogContent>
    </Dialog>
  );
}
