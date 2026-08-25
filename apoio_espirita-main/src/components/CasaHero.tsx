import { useEffect, useState } from "react";
import { MapPin, Phone, Mail, Globe, Building2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

/** Só os campos da página da casa que este cabeçalho exibe. */
type PaginaCasa = Pick<
  Tables<"paginas_casas">,
  | "nome_completo"
  | "descricao"
  | "missao"
  | "endereco"
  | "bairro"
  | "cidade"
  | "uf"
  | "telefone"
  | "email_contato"
  | "site"
>;

interface CasaHeroProps {
  membros?: number;
  eventos?: number;
  sigla?: string;
  nome?: string;
  cidade?: string;
  uf?: string;
  paginaData?: PaginaCasa | null;
}

function splitNome(nome: string): [string, string] {
  const words = nome.trim().split(/\s+/);
  if (words.length <= 2) return [nome, ""];
  const idx = words.findIndex(
    (w) => w.toLowerCase() === "espírita" || w.toLowerCase() === "espirita",
  );
  if (idx >= 0 && idx < words.length - 1) {
    return [words.slice(0, idx + 1).join(" "), words.slice(idx + 1).join(" ")];
  }
  return [words.slice(0, 2).join(" "), words.slice(2).join(" ")];
}

export function CasaHero({ membros, eventos, sigla, nome, cidade, uf, paginaData }: CasaHeroProps) {
  const { profile } = useAuth();
  const [nomeCasa, setNomeCasa] = useState<string | null>(null);
  const [dataPagina, setDataPagina] = useState<PaginaCasa | null>(paginaData ?? null);

  // Sync state if paginaData prop changes
  useEffect(() => {
    if (paginaData) {
      setDataPagina(paginaData);
    }
  }, [paginaData]);

  // Fetch page info if not provided as prop
  useEffect(() => {
    if (paginaData) return;

    const targetSigla = sigla || profile?.sigla_casa;
    if (!targetSigla) return;

    supabase
      .from("paginas_casas")
      .select("*")
      .eq("sigla_casa", targetSigla)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setDataPagina(data);
        }
      });
  }, [paginaData, sigla, profile?.sigla_casa]);

  // Fetch database house name if name is not configured/passed
  useEffect(() => {
    if (nome || dataPagina?.nome_completo) return;

    const targetSigla = sigla || profile?.sigla_casa;
    const targetCidade = cidade || dataPagina?.cidade || profile?.cidade;
    const targetUf = uf || dataPagina?.uf || profile?.uf;

    if (!targetSigla || !targetCidade || !targetUf) return;

    supabase
      .from("casas_espirita")
      .select("nome")
      .eq("sigla", targetSigla)
      .eq("cidade", targetCidade)
      .eq("estado", targetUf)
      .maybeSingle()
      .then(({ data }) => setNomeCasa(data?.nome ?? null));
  }, [nome, dataPagina, sigla, profile?.sigla_casa, cidade, profile?.cidade, uf, profile?.uf]);

  const targetSigla = sigla || profile?.sigla_casa;
  if (!targetSigla) return null;

  const displayName = nome || dataPagina?.nome_completo || nomeCasa || targetSigla;
  const [linha1, linha2] = splitNome(displayName);

  const displayCidade = cidade || dataPagina?.cidade || profile?.cidade;
  const displayUf = uf || dataPagina?.uf || profile?.uf;

  // `created_at` existe na tabela profiles, mas nao no tipo exposto pelo AuthContext.
  const perfilCriadoEm = (profile as { created_at?: string } | null)?.created_at;

  const membroSince =
    !sigla || sigla === profile?.sigla_casa
      ? perfilCriadoEm
        ? new Date(perfilCriadoEm).getFullYear()
        : null
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
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 32,
            flexWrap: "wrap",
          }}
        >
          {/* nome */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ width: 28, height: 1.5, background: "#b08826", borderRadius: 1 }} />
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "#b08826",
                }}
              >
                {sigla && sigla !== profile?.sigla_casa ? "Casa espírita" : "Sua casa espírita"}
              </span>
            </div>

            <h1
              style={{
                fontFamily: '"Libre Caslon Text", Georgia, serif',
                fontSize: "2.6rem",
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

            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              {/* Localização / Endereço */}
              {(dataPagina?.endereco || displayCidade || displayUf) && (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontFamily: "Inter, sans-serif",
                    fontSize: "0.82rem",
                    color: "#637080",
                  }}
                >
                  <MapPin size={14} strokeWidth={1.5} style={{ opacity: 0.6 }} />
                  {dataPagina?.endereco
                    ? [dataPagina.endereco, dataPagina.bairro, displayCidade]
                        .filter(Boolean)
                        .join(", ")
                    : [displayCidade, displayUf].filter(Boolean).join(" · ")}
                </span>
              )}

              {/* Sigla */}
              {targetSigla && (
                <>
                  <span
                    style={{ width: 3, height: 3, borderRadius: "50%", background: "#a3adb8" }}
                  />
                  <span
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "0.82rem",
                      color: "#637080",
                    }}
                  >
                    Sigla: {targetSigla}
                  </span>
                </>
              )}

              {/* Telefone */}
              {dataPagina?.telefone && (
                <>
                  <span
                    style={{ width: 3, height: 3, borderRadius: "50%", background: "#a3adb8" }}
                  />
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontFamily: "Inter, sans-serif",
                      fontSize: "0.82rem",
                      color: "#637080",
                    }}
                  >
                    <Phone size={14} strokeWidth={1.5} style={{ opacity: 0.6 }} />
                    {dataPagina.telefone}
                  </span>
                </>
              )}

              {/* Website */}
              {dataPagina?.site && (
                <>
                  <span
                    style={{ width: 3, height: 3, borderRadius: "50%", background: "#a3adb8" }}
                  />
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontFamily: "Inter, sans-serif",
                      fontSize: "0.82rem",
                      color: "#637080",
                    }}
                  >
                    <Globe size={14} strokeWidth={1.5} style={{ opacity: 0.6 }} />
                    <a
                      href={
                        dataPagina.site.startsWith("http")
                          ? dataPagina.site
                          : `https://${dataPagina.site}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#004a8c", textDecoration: "none", fontWeight: 500 }}
                      className="hover:underline"
                    >
                      {dataPagina.site.replace(/https?:\/\/(www\.)?/, "")}
                    </a>
                  </span>
                </>
              )}

              {/* E-mail */}
              {dataPagina?.email_contato && (
                <>
                  <span
                    style={{ width: 3, height: 3, borderRadius: "50%", background: "#a3adb8" }}
                  />
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontFamily: "Inter, sans-serif",
                      fontSize: "0.82rem",
                      color: "#637080",
                    }}
                  >
                    <Mail size={14} strokeWidth={1.5} style={{ opacity: 0.6 }} />
                    {dataPagina.email_contato}
                  </span>
                </>
              )}

              {/* Membro Desde */}
              {membroSince && (
                <>
                  <span
                    style={{ width: 3, height: 3, borderRadius: "50%", background: "#a3adb8" }}
                  />
                  <span
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "0.82rem",
                      color: "#637080",
                    }}
                  >
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
                  <div
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "2rem",
                      fontWeight: 700,
                      color: "#004a8c",
                      lineHeight: 1,
                      fontVariantNumeric: "lining-nums",
                    }}
                  >
                    {membros}
                  </div>
                  <div
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "0.72rem",
                      fontWeight: 500,
                      color: "#a3adb8",
                      marginTop: 4,
                      letterSpacing: "0.03em",
                    }}
                  >
                    Membros ativos
                  </div>
                </div>
              )}
              {eventos !== undefined && (
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "2rem",
                      fontWeight: 700,
                      color: "#004a8c",
                      lineHeight: 1,
                      fontVariantNumeric: "lining-nums",
                    }}
                  >
                    {eventos}
                  </div>
                  <div
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "0.72rem",
                      fontWeight: 500,
                      color: "#a3adb8",
                      marginTop: 4,
                      letterSpacing: "0.03em",
                    }}
                  >
                    Próximos eventos
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Description & Mission (Always visible below contacts) */}
        {(dataPagina?.descricao || dataPagina?.missao) && (
          <div style={{ marginTop: 22, paddingTop: 16, borderTop: "1px dashed rgba(0,20,70,.06)" }}>
            {dataPagina.descricao && (
              <p
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "0.88rem",
                  color: "#455060",
                  fontWeight: 300,
                  lineHeight: 1.6,
                  margin: 0,
                  fontStyle: "italic",
                }}
              >
                "{dataPagina.descricao}"
              </p>
            )}
            {dataPagina.missao && (
              <p
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "0.8rem",
                  color: "#637080",
                  fontWeight: 400,
                  marginTop: 8,
                  margin: 0,
                }}
              >
                <strong>Nossa Missão:</strong> {dataPagina.missao}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
