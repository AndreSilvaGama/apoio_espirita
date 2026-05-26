interface WisdomBlockProps {
  texto: string;
  autor: string;
}

export function WisdomBlock({ texto, autor }: WisdomBlockProps) {
  return (
    <div
      style={{
        background: "#faf5e8",
        border: "1px solid rgba(176,136,38,.3)",
        borderRadius: 18,
        padding: "32px 40px",
        marginBottom: 48,
        display: "flex",
        gap: 22,
        alignItems: "flex-start",
      }}
    >
      <div style={{ width: 3, borderRadius: 2, background: "#b08826", alignSelf: "stretch", flexShrink: 0, minHeight: 40 }} />
      <div>
        <div style={{ fontFamily: "Inter", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.13em", textTransform: "uppercase", color: "#b08826", marginBottom: 10 }}>
          Pensamento do dia
        </div>
        <p style={{ fontFamily: '"Libre Caslon Text", Georgia, serif', fontStyle: "italic", fontSize: "1.2rem", color: "#2e3540", lineHeight: 1.65, marginBottom: 10 }}>
          {texto}
        </p>
        <p style={{ fontFamily: "Inter", fontSize: "0.8rem", color: "#a3adb8", fontWeight: 500, letterSpacing: "0.03em" }}>
          {autor}
        </p>
      </div>
    </div>
  );
}
