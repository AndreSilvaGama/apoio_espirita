import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Radio, Play, Pause, Volume2, VolumeX, ExternalLink } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/radio")({
  component: RadioPage,
});

const STREAM_URL = "https://sc4s.cdn.upx.com:8258/stream";

function RadioPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const audioRef = useRef<HTMLAudioElement>(null);

  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = muted;
  }, [muted]);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    setError(false);
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      setBuffering(true);
      audio.load();
      audio.play()
        .then(() => { setPlaying(true); setBuffering(false); })
        .catch(() => { setError(true); setBuffering(false); });
    }
  }

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (muted && v > 0) setMuted(false);
  }

  if (loading || !user) return null;

  return (
    <main className="page-light min-h-screen px-6 py-24">
      <div className="mx-auto max-w-2xl">

        <Link
          to="/inicio"
          className="text-xs uppercase tracking-[0.3em] text-cyan-glow hover:text-foreground transition-colors"
        >
          ← Início
        </Link>

        <div className="mt-10 mb-12 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-cyan-glow mb-4">
            Recursos &amp; Ferramentas
          </p>
          <h1 className="text-4xl md:text-5xl font-light text-foreground mb-3">
            Rádio Rio de Janeiro
          </h1>
          <p className="text-sm text-muted-foreground font-light">
            1400 AM · Fundação Cristã Espírita Cultural Paulo de Tarso
          </p>
        </div>

        {/* Player principal */}
        <div className="glass rounded-3xl p-10 flex flex-col items-center gap-8">

          {/* Ícone animado */}
          <div className="relative">
            <div className={`w-28 h-28 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center ${playing ? "shadow-lg shadow-emerald-100" : ""}`}>
              <Radio size={44} strokeWidth={1.5} className={`transition-colors duration-500 ${playing ? "text-emerald-600" : "text-muted-foreground/40"}`} />
            </div>
            {playing && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500" />
              </span>
            )}
          </div>

          {/* Status */}
          <div className="text-center">
            {buffering && (
              <p className="text-sm text-muted-foreground animate-pulse">Conectando ao stream...</p>
            )}
            {!buffering && playing && (
              <div className="flex items-center gap-2 justify-center">
                <span className="flex gap-0.5 items-end h-4">
                  {[1, 2, 3, 4].map((i) => (
                    <span
                      key={i}
                      className="w-1 rounded-full bg-emerald-500 animate-bounce"
                      style={{ height: `${8 + i * 3}px`, animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </span>
                <span className="text-sm text-emerald-600 font-medium uppercase tracking-widest">Ao vivo</span>
              </div>
            )}
            {!buffering && !playing && !error && (
              <p className="text-sm text-muted-foreground/50">Clique para ouvir ao vivo</p>
            )}
            {error && (
              <p className="text-sm text-red-500/70">Não foi possível conectar. Verifique sua conexão.</p>
            )}
          </div>

          {/* Botão play/pause */}
          <button
            onClick={togglePlay}
            disabled={buffering}
            className={`w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
              playing
                ? "bg-emerald-500 border-emerald-500 hover:bg-emerald-600 hover:border-emerald-600 text-white shadow-md"
                : "bg-white border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50 text-emerald-600"
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {playing
              ? <Pause size={24} strokeWidth={2} />
              : <Play size={24} strokeWidth={2} className="ml-1" />
            }
          </button>

          {/* Volume */}
          <div className="w-full flex items-center gap-4">
            <button
              onClick={() => setMuted((m) => !m)}
              className="text-muted-foreground/50 hover:text-foreground transition-colors shrink-0"
            >
              {muted || volume === 0
                ? <VolumeX size={18} strokeWidth={1.5} />
                : <Volume2 size={18} strokeWidth={1.5} />
              }
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={muted ? 0 : volume}
              onChange={handleVolumeChange}
              className="flex-1 accent-emerald-500 h-1.5 rounded-full cursor-pointer"
            />
            <span className="text-xs text-muted-foreground/40 w-8 text-right shrink-0">
              {muted ? "0" : Math.round(volume * 100)}%
            </span>
          </div>

        </div>

        {/* Rodapé informativo */}
        <div className="mt-8 text-center">
          <a
            href="https://radioriodejaneiro.digital/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors"
          >
            <ExternalLink size={12} />
            radioriodejaneiro.digital
          </a>
        </div>

      </div>

      <audio ref={audioRef} src={STREAM_URL} preload="none" />
    </main>
  );
}
