import { useEffect, useRef, useState } from "react";

/**
 * Discreet ambient piano player. Starts muted so browser autoplay policies
 * don't block it; the user toggles with a small fixed-position button.
 */
export function AmbientAudio({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const a = audioRef.current;
    if (!a) return;
    a.volume = 0.35;

    // Try to autoplay. Browsers usually block it without prior interaction,
    // so we fall back to starting on the first user gesture.
    const tryPlay = async () => {
      try {
        await a.play();
        setPlaying(true);
      } catch {
        const start = async () => {
          try {
            await a.play();
            setPlaying(true);
          } catch {
            /* ignored */
          }
          window.removeEventListener("pointerdown", start);
          window.removeEventListener("keydown", start);
        };
        window.addEventListener("pointerdown", start, { once: true });
        window.addEventListener("keydown", start, { once: true });
      }
    };
    tryPlay();
  }, []);

  const toggle = async () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      try {
        await a.play();
        setPlaying(true);
      } catch {
        /* ignored */
      }
    }
  };

  if (!mounted) return null;

  return (
    <>
      <audio ref={audioRef} src={src} loop preload="auto" />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pausar música" : "Tocar música suave"}
        title={playing ? "Pausar música" : "Tocar música suave"}
        className="fixed bottom-5 right-5 z-50 h-11 w-11 rounded-full glass flex items-center justify-center text-cyan-glow hover:bg-white/10 transition-colors duration-500"
      >
        {playing ? (
          // Speaker with sound waves
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 5 6 9H2v6h4l5 4z" />
            <path d="M15.5 8.5a5 5 0 0 1 0 7" />
            <path d="M18.5 5.5a9 9 0 0 1 0 13" />
          </svg>
        ) : (
          // Muted speaker
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 5 6 9H2v6h4l5 4z" />
            <line x1="22" y1="9" x2="16" y2="15" />
            <line x1="16" y1="9" x2="22" y2="15" />
          </svg>
        )}
      </button>
    </>
  );
}