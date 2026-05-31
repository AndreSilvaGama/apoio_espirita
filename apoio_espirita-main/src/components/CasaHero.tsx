import { useEffect, useState } from "react";
import { 
  MapPin, Phone, Mail, Globe, Building2, 
  Heart, QrCode, Copy, Check, Info, Calendar 
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CasaHeroProps {
  membros?: number;
  eventos?: number;
  sigla?: string;
  nome?: string;
  cidade?: string;
  uf?: string;
  paginaData?: any;
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

function InfoItem({ Icon, label, value, isLink }: { Icon: any; label: string; value: string; isLink?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        width: 22, 
        height: 22, 
        borderRadius: 6, 
        background: "rgba(0, 74, 140, 0.04)", 
        color: "#004a8c", 
        flexShrink: 0, 
        justifyContent: "center", 
        marginTop: 2 
      }}>
        <Icon size={12} strokeWidth={1.8} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <span style={{ 
          fontFamily: "Inter, sans-serif", 
          fontSize: "0.6rem", 
          fontWeight: 700, 
          textTransform: "uppercase", 
          color: "#a3adb8", 
          display: "block", 
          lineHeight: 1,
          marginBottom: 3
        }}>
          {label}
        </span>
        {isLink ? (
          <a 
            href={value.startsWith("http") ? value : `https://${value}`} 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{ 
              fontFamily: "Inter, sans-serif", 
              fontSize: "0.8rem", 
              color: "#004a8c", 
              textDecoration: "none", 
              fontWeight: 400, 
              wordBreak: "break-all" 
            }} 
            className="hover:underline"
          >
            {value}
          </a>
        ) : (
          <span style={{ 
            fontFamily: "Inter, sans-serif", 
            fontSize: "0.8rem", 
            color: "#455060", 
            fontWeight: 300, 
            wordBreak: "break-word" 
          }}>
            {value}
          </span>
        )}
      </div>
    </div>
  );
}

export function CasaHero({ membros, eventos, sigla, nome, cidade, uf, paginaData }: CasaHeroProps) {
  const { profile } = useAuth();
  const [nomeCasa, setNomeCasa] = useState<string | null>(null);
  const [dataPagina, setDataPagina] = useState<any>(paginaData || null);
  const [copiadoPix, setCopiadoPix] = useState(false);

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

  const membroSince = !sigla || sigla === profile?.sigla_casa
    ? (profile as any)?.created_at
      ? new Date((profile as any).created_at).getFullYear()
      : null
    : null;

  const hasExtraInfo = dataPagina && (
    dataPagina.descricao ||
    dataPagina.missao ||
    dataPagina.ano_fundacao ||
    dataPagina.endereco ||
    dataPagina.telefone ||
    dataPagina.email_contato ||
    dataPagina.site ||
    dataPagina.chave_pix
  );

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
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 32, flexWrap: "wrap" }}>
          {/* nome */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ width: 28, height: 1.5, background: "#b08826", borderRadius: 1 }} />
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#b08826" }}>
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
              {/* Localização */}
              {(dataPagina?.endereco || displayCidade || displayUf) && (
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "Inter, sans-serif", fontSize: "0.82rem", color: "#637080" }}>
                  <MapPin size={14} strokeWidth={1.5} style={{ opacity: 0.6 }} />
                  {dataPagina?.endereco 
                    ? [dataPagina.endereco, dataPagina.bairro, displayCidade].filter(Boolean).join(", ")
                    : [displayCidade, displayUf].filter(Boolean).join(" · ")
                  }
                </span>
              )}

              {/* Sigla */}
              {targetSigla && (
                <>
                  <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#a3adb8" }} />
                  <span style={{ fontFamily: "Inter, sans-serif", fontSize: "0.82rem", color: "#637080" }}>
                    Sigla: {targetSigla}
                  </span>
                </>
              )}

              {/* Telefone Rápido */}
              {dataPagina?.telefone && (
                <>
                  <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#a3adb8" }} />
                  <span style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "Inter, sans-serif", fontSize: "0.82rem", color: "#637080" }}>
                    <Phone size={14} strokeWidth={1.5} style={{ opacity: 0.6 }} />
                    {dataPagina.telefone}
                  </span>
                </>
              )}

              {/* Site Rápido */}
              {dataPagina?.site && (
                <>
                  <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#a3adb8" }} />
                  <span style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "Inter, sans-serif", fontSize: "0.82rem", color: "#637080" }}>
                    <Globe size={14} strokeWidth={1.5} style={{ opacity: 0.6 }} />
                    <a 
                      href={dataPagina.site.startsWith("http") ? dataPagina.site : `https://${dataPagina.site}`} 
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

              {/* Membro Desde */}
              {membroSince && (
                <>
                  <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#a3adb8" }} />
                  <span style={{ fontFamily: "Inter, sans-serif", fontSize: "0.82rem", color: "#637080" }}>
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
                  <div style={{ fontFamily: "Inter, sans-serif", fontSize: "0.72rem", fontWeight: 500, color: "#a3adb8", marginTop: 4, letterSpacing: "0.03em" }}>
                    Membros ativos
                  </div>
                </div>
              )}
              {eventos !== undefined && (
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "Inter, sans-serif", fontSize: "2rem", fontWeight: 700, color: "#004a8c", lineHeight: 1, fontVariantNumeric: "lining-nums" }}>
                    {eventos}
                  </div>
                  <div style={{ fontFamily: "Inter, sans-serif", fontSize: "0.72rem", fontWeight: 500, color: "#a3adb8", marginTop: 4, letterSpacing: "0.03em" }}>
                    Próximos eventos
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Detailed Info Grid (Always visible for superior aesthetics and clear organization) */}
        {hasExtraInfo && (
          <div
            style={{
              marginTop: 32,
              paddingTop: 32,
              borderTop: "1px solid rgba(0, 20, 70, 0.06)",
              width: "100%",
            }}
          >
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", 
              gap: 24 
            }}>
              {/* Column 1: Description & Mission */}
              {(dataPagina.descricao || dataPagina.missao) && (
                <div style={{ 
                  display: "flex", 
                  flexDirection: "column", 
                  gap: 16, 
                  background: "linear-gradient(135deg, rgba(124, 58, 237, 0.02) 0%, rgba(6, 182, 212, 0.02) 100%)", 
                  border: "1px solid rgba(0, 20, 70, 0.04)", 
                  borderRadius: 20, 
                  padding: 20 
                }}>
                  {dataPagina.descricao && (
                    <div>
                      <span style={{ 
                        fontFamily: "Inter, sans-serif", 
                        fontSize: "0.7rem", 
                        fontWeight: 700, 
                        letterSpacing: "0.1em", 
                        textTransform: "uppercase", 
                        color: "#637080", 
                        display: "block", 
                        marginBottom: 6 
                      }}>
                        Sobre a Casa
                      </span>
                      <p style={{ 
                        fontFamily: "Inter, sans-serif", 
                        fontSize: "0.85rem", 
                        color: "#455060", 
                        fontWeight: 300, 
                        lineHeight: 1.6, 
                        margin: 0 
                      }}>
                        {dataPagina.descricao}
                      </p>
                    </div>
                  )}
                  {dataPagina.missao && (
                    <div style={{ borderTop: "1px solid rgba(0, 20, 70, 0.05)", paddingTop: 16 }}>
                      <span style={{ 
                        fontFamily: "Inter, sans-serif", 
                        fontSize: "0.7rem", 
                        fontWeight: 700, 
                        letterSpacing: "0.1em", 
                        textTransform: "uppercase", 
                        color: "#637080", 
                        display: "block", 
                        marginBottom: 6 
                      }}>
                        Nossa Missão
                      </span>
                      <p style={{ 
                        fontFamily: "Inter, sans-serif", 
                        fontSize: "0.85rem", 
                        color: "#455060", 
                        fontWeight: 300, 
                        lineHeight: 1.6, 
                        margin: 0 
                      }}>
                        {dataPagina.missao}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Column 2: Contact & Location */}
              <div style={{ 
                display: "flex", 
                flexDirection: "column", 
                gap: 16, 
                background: "#fafbfc", 
                border: "1px solid rgba(0, 20, 70, 0.04)", 
                borderRadius: 20, 
                padding: 20 
              }}>
                <span style={{ 
                  fontFamily: "Inter, sans-serif", 
                  fontSize: "0.7rem", 
                  fontWeight: 700, 
                  letterSpacing: "0.1em", 
                  textTransform: "uppercase", 
                  color: "#637080", 
                  display: "block", 
                  marginBottom: 4 
                }}>
                  Contato e Localização
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {dataPagina.ano_fundacao && (
                    <InfoItem Icon={Building2} label="Fundação" value={`Ano de ${dataPagina.ano_fundacao}`} />
                  )}
                  {dataPagina.telefone && (
                    <InfoItem Icon={Phone} label="Telefone" value={dataPagina.telefone} />
                  )}
                  {dataPagina.email_contato && (
                    <InfoItem Icon={Mail} label="E-mail" value={dataPagina.email_contato} />
                  )}
                  {dataPagina.site && (
                    <InfoItem Icon={Globe} label="Website" value={dataPagina.site} isLink />
                  )}
                  {dataPagina.endereco && (
                    <InfoItem 
                      Icon={MapPin} 
                      label="Endereço" 
                      value={[
                        dataPagina.endereco, 
                        dataPagina.bairro, 
                        dataPagina.cidade && `${dataPagina.cidade}/${dataPagina.uf}`, 
                        dataPagina.cep
                      ].filter(Boolean).join(", ")} 
                    />
                  )}
                </div>
              </div>

              {/* Column 3: Donations & PIX */}
              <div style={{ 
                display: "flex", 
                flexDirection: "column", 
                gap: 16, 
                background: "linear-gradient(135deg, rgba(244, 63, 94, 0.02) 0%, rgba(244, 63, 94, 0.05) 100%)", 
                border: "1px solid rgba(244, 63, 94, 0.1)", 
                borderRadius: 20, 
                padding: 20 
              }}>
                <span style={{ 
                  fontFamily: "Inter, sans-serif", 
                  fontSize: "0.7rem", 
                  fontWeight: 700, 
                  letterSpacing: "0.1em", 
                  textTransform: "uppercase", 
                  color: "#e11d48", 
                  display: "block", 
                  marginBottom: 2 
                }}>
                  Contribua com a Casa
                </span>
                <p style={{ 
                  fontFamily: "Inter, sans-serif", 
                  fontSize: "0.8rem", 
                  color: "#637080", 
                  fontWeight: 300, 
                  lineHeight: 1.5, 
                  margin: 0 
                }}>
                  {dataPagina.texto_doacao || "Sua contribuição ajuda a manter os trabalhos espirituais e de assistência da nossa casa."}
                </p>

                {dataPagina.chave_pix ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <div style={{ 
                        padding: 6, 
                        background: "#ffffff", 
                        borderRadius: 12, 
                        border: "1px solid rgba(244, 63, 94, 0.15)", 
                        boxShadow: "0 2px 8px rgba(244, 63, 94, 0.04)" 
                      }}>
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(dataPagina.chave_pix)}&bgcolor=ffffff&color=1e3a5f&margin=2`}
                          alt="QR Code PIX" 
                          width={110} 
                          height={110} 
                          style={{ borderRadius: 8, display: "block" }} 
                        />
                      </div>
                    </div>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ 
                        fontFamily: "Inter, sans-serif", 
                        fontSize: "0.65rem", 
                        fontWeight: 700, 
                        textTransform: "uppercase", 
                        color: "#a3adb8" 
                      }}>
                        Chave PIX
                      </span>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <div style={{ 
                          flex: 1, 
                          fontFamily: "monospace", 
                          fontSize: "0.75rem", 
                          background: "#ffffff", 
                          border: "1px solid rgba(0, 0, 0, 0.05)", 
                          padding: "6px 10px", 
                          borderRadius: 8, 
                          overflow: "hidden", 
                          textOverflow: "ellipsis", 
                          whiteSpace: "nowrap", 
                          color: "#455060" 
                        }}>
                          {dataPagina.chave_pix}
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(dataPagina.chave_pix);
                            setCopiadoPix(true);
                            toast.success("Chave PIX copiada com sucesso!");
                            setTimeout(() => setCopiadoPix(false), 2000);
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            border: "1px solid rgba(244, 63, 94, 0.2)",
                            background: "#ffffff",
                            color: "#e11d48",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            outline: "none"
                          }}
                          title="Copiar Chave PIX"
                        >
                          {copiadoPix ? <Check size={14} style={{ color: "#10b981" }} /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ 
                    display: "flex", 
                    flexDirection: "column", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    padding: "16px 0", 
                    border: "1px dashed rgba(244, 63, 94, 0.2)", 
                    borderRadius: 12, 
                    background: "rgba(255,255,255,0.4)" 
                  }}>
                    <QrCode size={24} strokeWidth={1} style={{ color: "rgba(244, 63, 94, 0.4)", marginBottom: 6 }} />
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: "0.75rem", color: "#a3adb8" }}>
                      PIX não configurado
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
