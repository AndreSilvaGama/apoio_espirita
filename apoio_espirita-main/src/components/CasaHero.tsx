import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface CasaHeroProps {
  membros?: number;
  eventos?: number;
}

function splitNome(nome: string): [string, string] {
  const words = nome.trim().split(/\s+/);
  if (words.length <= 2) return [nome, ""];
  const idx = words.findIndex((w) => w.toLowerCase() === "espírita" || w.toLowerCase() === "espirita");
  if (idx >= 0 && idx < words.length - 1) {
    return [words.slice(0, idx + 1).join(" "), words.slice(idx + 1).join(" ")];
  }
  return [words.slice(0, 2).join(" "), words.slice(2).join(" ")];
}

export function CasaHero({ membros, eventos }: CasaHeroProps) {
  const { profile } = useAuth();
  const [nomeCasa, setNomeCasa] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.sigla_casa || !profile?.cidade || !profile?.uf) return;
    supabase
      .from("casas_espirita")
      .select("nome")
      .eq("sigla", profile.sigla_casa)
      .eq("cidade", profile.cidade)
      .eq("estado", profile.uf)
      .maybeSingle()
      .then(({ data }) => setNomeCasa(data?.nome ?? null));
  }, [profile?.sigla_casa, profile?.cidade, profile?.uf]);

  if (!profile?.sigla_casa) return null;

  const displayName = nomeCasa || profile.sigla_casa;
  const [linha1, linha2] = splitNome(displayName);
  const membroSince = (profile as any).created_at
    ? new Date((profile as any).created_at).getFullYear()
    : null;

  return (
    <section
      className="sw-rise sw-rise-1"
      style={{
        background: "#ffffff",
        borderBottom: "1px solid rgba(0,20,70,.08)",
        padding: "52px 44px 44px",
      }}
    >
      <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 32, flexWrap: "wrap" }}>
        {/* nome */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 28, height: 1.5, background: "#b08826", borderRadius: 1 }} />
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#b08826" }}>
              Sua casa espírita
            </span>
          </div>

          <h1
            style={{
              fontFamily: '"Libre Caslon Text", Georgia, serif',
              fontSize: "3.2rem",
              fontWeight: 400,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              color: "#111418",
              marginBottom: 14,
            }}
          >
            {linha1}
            {linha2 && (
              <span style={{ display: "block", fontStyle: "italic", color: "#004a8c" }}>
                {linha2}
              </span>
            )}
          </h1>

          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            {(profile.cidade || profile.uf) && (
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "Inter", fontSize: "0.82rem", color: "#637080" }}>
                <MapPin size={14} strokeWidth={1.5} style={{ opacity: 0.6 }} />
                {[profile.cidade, profile.uf].filter(Boolean).join(" · ")}
              </span>
            )}
            {profile.sigla_casa && (
              <>
                <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#a3adb8" }} />
                <span style={{ fontFamily: "Inter", fontSize: "0.82rem", color: "#637080" }}>
                  Sigla: {profile.sigla_casa}
                </span>
              </>
            )}
            {membroSince && (
              <>
                <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#a3adb8" }} />
                <span style={{ fontFamily: "Inter", fontSize: "0.82rem", color: "#637080" }}>
                  Membro desde {membroSince}
                </span>
              </>
            )}
          </div>
        </div>

        {/* estatísticas */}
        {(membros !== undefined || eventos !== undefined) && (
          <div style={{ display: "flex", gap: 28, flexShrink: 0, paddingBottom: 4 }}>
            {membros !== undefined && (
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: "2rem", fontWeight: 700, color: "#004a8c", lineHeight: 1, fontVariantNumeric: "lining-nums" }}>
                  {membros}
                </div>
                <div style={{ fontFamily: "Inter", fontSize: "0.72rem", fontWeight: 500, color: "#a3adb8", marginTop: 4, letterSpacing: "0.03em" }}>
                  Membros ativos
                </div>
              </div>
            )}
            {eventos !== undefined && (
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: "2rem", fontWeight: 700, color: "#004a8c", lineHeight: 1, fontVariantNumeric: "lining-nums" }}>
                  {eventos}
                </div>
                <div style={{ fontFamily: "Inter", fontSize: "0.72rem", fontWeight: 500, color: "#a3adb8", marginTop: 4, letterSpacing: "0.03em" }}>
                  Próximos eventos
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
