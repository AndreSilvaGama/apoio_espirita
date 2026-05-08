export function Particles({ count = 30 }: { count?: number }) {
  const particles = Array.from({ length: count }, (_, i) => {
    const size = Math.random() * 3 + 1;
    const left = Math.random() * 100;
    const top = Math.random() * 100;
    const delay = Math.random() * 8;
    const duration = 6 + Math.random() * 8;
    const opacity = 0.3 + Math.random() * 0.5;
    return (
      <span
        key={i}
        className="absolute rounded-full bg-cyan-glow animate-float pointer-events-none"
        style={{
          width: size,
          height: size,
          left: `${left}%`,
          top: `${top}%`,
          opacity,
          animationDelay: `${delay}s`,
          animationDuration: `${duration}s`,
          boxShadow: `0 0 ${size * 4}px currentColor`,
        }}
      />
    );
  });
  return <div className="absolute inset-0 overflow-hidden pointer-events-none">{particles}</div>;
}