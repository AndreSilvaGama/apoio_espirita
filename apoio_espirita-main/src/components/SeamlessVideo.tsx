import { useEffect, useRef, useState } from "react";

type Props = {
  src: string;
  className?: string;
  /** Duration of crossfade in seconds */
  fade?: number;
  /** Playback rate (1 = normal, <1 = slower) */
  rate?: number;
};

/**
 * Plays a video on an infinite, seamless loop by crossfading between two
 * staggered <video> elements. The fade begins `fade` seconds before the
 * active video ends, masking the natural restart.
 */
export function SeamlessVideo({ src, className, fade = 5, rate = 0.5 }: Props) {
  const aRef = useRef<HTMLVideoElement>(null);
  const bRef = useRef<HTMLVideoElement>(null);
  const [activeIsA, setActiveIsA] = useState(true);

  useEffect(() => {
    const a = aRef.current;
    const b = bRef.current;
    if (!a || !b) return;

    a.playbackRate = rate;
    b.playbackRate = rate;

    let raf = 0;
    let active: HTMLVideoElement = a;
    let inactive: HTMLVideoElement = b;
    let swapping = false;

    const tick = () => {
      const dur = active.duration;
      if (dur && !Number.isNaN(dur)) {
        const remaining = dur - active.currentTime;
        if (remaining <= fade && !swapping) {
          swapping = true;
          inactive.currentTime = 0;
          inactive.play().catch(() => {});
          // Swap roles after the fade completes
          window.setTimeout(() => {
            const tmp = active;
            active = inactive;
            inactive = tmp;
            setActiveIsA(active === a);
            swapping = false;
          }, fade * 1000);
        }
      }
      raf = window.requestAnimationFrame(tick);
    };

    a.play().catch(() => {});
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [fade, rate]);

  const fadeMs = `${fade * 1000}ms`;

  return (
    <>
      <video
        ref={aRef}
        muted
        playsInline
        preload="auto"
        className={className}
        style={{
          opacity: activeIsA ? 1 : 0,
          transition: `opacity ${fadeMs} ease-in-out`,
        }}
      >
        <source src={src} type="video/mp4" />
      </video>
      <video
        ref={bRef}
        muted
        playsInline
        preload="auto"
        className={className}
        style={{
          opacity: activeIsA ? 0 : 1,
          transition: `opacity ${fadeMs} ease-in-out`,
        }}
      >
        <source src={src} type="video/mp4" />
      </video>
    </>
  );
}