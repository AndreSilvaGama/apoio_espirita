import { createContext, useContext, useEffect, useRef, useState } from "react";

const STREAM_URL = "https://sc4s.cdn.upx.com:8258/stream";

interface RadioContextValue {
  active: boolean;
  playing: boolean;
  buffering: boolean;
  error: boolean;
  volume: number;
  muted: boolean;
  activate: () => void;
  togglePlay: () => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  dismiss: () => void;
}

const RadioContext = createContext<RadioContextValue>({
  active: false,
  playing: false,
  buffering: false,
  error: false,
  volume: 0.8,
  muted: false,
  activate: () => {},
  togglePlay: () => {},
  setVolume: () => {},
  toggleMute: () => {},
  dismiss: () => {},
});

export function RadioProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [active, setActive] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [error, setError] = useState(false);
  const [volume, setVolumeState] = useState(0.8);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const audio = new Audio(STREAM_URL);
    audio.preload = "none";
    audio.volume = 0.8;
    audioRef.current = audio;

    audio.addEventListener("playing", () => { setPlaying(true); setBuffering(false); setError(false); });
    audio.addEventListener("waiting", () => setBuffering(true));
    audio.addEventListener("error", () => { setError(true); setBuffering(false); setPlaying(false); });
    audio.addEventListener("pause", () => setPlaying(false));

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  function activate() {
    setActive(true);
    setError(false);
    const audio = audioRef.current;
    if (!audio) return;
    setBuffering(true);
    audio.load();
    audio.play().catch(() => { setError(true); setBuffering(false); });
  }

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    setError(false);
    if (playing || buffering) {
      audio.pause();
    } else {
      setBuffering(true);
      audio.load();
      audio.play().catch(() => { setError(true); setBuffering(false); });
    }
  }

  function setVolume(v: number) {
    setVolumeState(v);
    if (audioRef.current) audioRef.current.volume = v;
    if (v > 0) setMuted(false);
  }

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    if (audioRef.current) audioRef.current.muted = next;
  }

  function dismiss() {
    const audio = audioRef.current;
    if (audio) audio.pause();
    setActive(false);
    setPlaying(false);
    setBuffering(false);
  }

  return (
    <RadioContext.Provider value={{ active, playing, buffering, error, volume, muted, activate, togglePlay, setVolume, toggleMute, dismiss }}>
      {children}
    </RadioContext.Provider>
  );
}

export const useRadio = () => useContext(RadioContext);
