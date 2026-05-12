export function CloudBackground({ className }: { className?: string }) {
  return (
    <div className={className} aria-hidden>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(160deg, oklch(0.08 0.04 260) 0%, oklch(0.12 0.06 270) 40%, oklch(0.10 0.05 285) 100%)",
        }}
      />
      {/* Drifting cloud layers */}
      {[
        { top: "10%", size: 420, dur: 28, delay: 0, opacity: 0.07 },
        { top: "30%", size: 560, dur: 36, delay: -12, opacity: 0.05 },
        { top: "55%", size: 380, dur: 22, delay: -6, opacity: 0.08 },
        { top: "70%", size: 500, dur: 42, delay: -20, opacity: 0.04 },
        { top: "20%", size: 300, dur: 18, delay: -4, opacity: 0.06 },
      ].map((c, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: c.top,
            left: "-30%",
            width: c.size,
            height: c.size * 0.45,
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse at center, oklch(0.9 0.01 260 / 1) 0%, transparent 70%)",
            opacity: c.opacity,
            animation: `cloudDrift ${c.dur}s ${c.delay}s linear infinite`,
            filter: "blur(32px)",
          }}
        />
      ))}
      <style>{`
        @keyframes cloudDrift {
          from { transform: translateX(0); }
          to   { transform: translateX(160vw); }
        }
      `}</style>
    </div>
  );
}
