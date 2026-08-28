import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Cake, PartyPopper, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { mensagemDeErro } from "@/lib/erros";
import {
  Aviso,
  BotaoDiscreto,
  BotaoPrimario,
  Cartao,
  CampoSelecao,
  Etiqueta,
  PaginaComunidade,
  Rotulo,
  Vazio,
  iniciais,
} from "@/components/Comunidade";

export const Route = createFileRoute("/aniversariantes")({
  component: Aniversariantes,
});

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

/** Dias que cada mês aceita. Fevereiro vai até 29 porque não guardamos o ano. */
function diasDoMes(mes: number): number {
  if (mes === 2) return 29;
  return [1, 3, 5, 7, 8, 10, 12].includes(mes) ? 31 : 30;
}

interface Membro {
  id: string;
  nome: string | null;
  aniversario_dia: number | null;
  aniversario_mes: number | null;
}

function Aniversariantes() {
  const { user, profile, refreshProfile } = useAuth();
  const hoje = useMemo(() => new Date(), []);
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [membros, setMembros] = useState<Membro[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [editando, setEditando] = useState(false);
  const [meuDia, setMeuDia] = useState("");
  const [meuMes, setMeuMes] = useState("");
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    if (!profile?.sigla_casa) return;
    setCarregando(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, nome, aniversario_dia, aniversario_mes")
      .eq("sigla_casa", profile.sigla_casa)
      .not("aniversario_mes", "is", null);
    if (error) setErro(mensagemDeErro(error));
    setMembros((data as Membro[]) ?? []);
    setCarregando(false);
  }, [profile?.sigla_casa]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  // O próprio aniversário chega pela consulta acima; quando ainda não foi
  // informado, o cartão de convite aparece com os campos em branco.
  const meuRegistro = membros.find((m) => m.id === user?.id);

  useEffect(() => {
    if (meuRegistro?.aniversario_dia && meuRegistro?.aniversario_mes) {
      setMeuDia(String(meuRegistro.aniversario_dia));
      setMeuMes(String(meuRegistro.aniversario_mes));
    }
  }, [meuRegistro?.aniversario_dia, meuRegistro?.aniversario_mes]);

  const doMes = membros
    .filter((m) => m.aniversario_mes === mes)
    .sort((a, b) => (a.aniversario_dia ?? 0) - (b.aniversario_dia ?? 0));

  async function salvarMeuAniversario() {
    if (!user) return;
    const dia = Number(meuDia);
    const mesEscolhido = Number(meuMes);
    if (!dia || !mesEscolhido) {
      setErro("Escolha o dia e o mês do seu aniversário.");
      return;
    }
    if (dia > diasDoMes(mesEscolhido)) {
      setErro(`${MESES[mesEscolhido - 1]} não tem dia ${dia}.`);
      return;
    }
    setSalvando(true);
    setErro(null);
    const { error } = await supabase
      .from("profiles")
      .update({ aniversario_dia: dia, aniversario_mes: mesEscolhido })
      .eq("id", user.id);
    setSalvando(false);
    if (error) {
      setErro(mensagemDeErro(error));
      return;
    }
    setEditando(false);
    await refreshProfile();
    await carregar();
  }

  async function removerMeuAniversario() {
    if (!user) return;
    setSalvando(true);
    const { error } = await supabase
      .from("profiles")
      .update({ aniversario_dia: null, aniversario_mes: null })
      .eq("id", user.id);
    setSalvando(false);
    if (error) {
      setErro(mensagemDeErro(error));
      return;
    }
    setMeuDia("");
    setMeuMes("");
    setEditando(false);
    await carregar();
  }

  return (
    <PaginaComunidade
      secao="Vida espiritual"
      titulo="Aniversariantes"
      destaque="do mês"
      descricao="Quem faz aniversário na sua casa espírita, mês a mês. Guardamos apenas o dia e o mês — nunca o ano, porque a idade de ninguém é necessária para uma lembrança."
    >
      <div className="space-y-6">
        {erro && <Aviso tipo="erro">{erro}</Aviso>}

        {/* Meu aniversário */}
        <Cartao>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-glow mb-2">
                O meu aniversário
              </p>
              {meuRegistro?.aniversario_dia && !editando ? (
                <p className="text-foreground font-light">
                  {meuRegistro.aniversario_dia} de {MESES[(meuRegistro.aniversario_mes ?? 1) - 1]} —
                  a sua casa é avisada neste dia.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground font-light max-w-md">
                  Você ainda não informou. Preencher é o mesmo que autorizar: quem não quer aparecer
                  na lista simplesmente deixa em branco.
                </p>
              )}
            </div>
            {!editando && (
              <BotaoDiscreto onClick={() => setEditando(true)}>
                {meuRegistro?.aniversario_dia ? "Alterar" : "Informar"}
              </BotaoDiscreto>
            )}
          </div>

          {editando && (
            <div className="mt-5 pt-5 border-t border-border/40 grid gap-4 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
              <div>
                <Rotulo>Dia</Rotulo>
                <CampoSelecao value={meuDia} onChange={(e) => setMeuDia(e.target.value)}>
                  <option value="">—</option>
                  {Array.from({ length: diasDoMes(Number(meuMes) || 1) }, (_, i) => i + 1).map(
                    (d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ),
                  )}
                </CampoSelecao>
              </div>
              <div>
                <Rotulo>Mês</Rotulo>
                <CampoSelecao value={meuMes} onChange={(e) => setMeuMes(e.target.value)}>
                  <option value="">—</option>
                  {MESES.map((m, i) => (
                    <option key={m} value={i + 1}>
                      {m}
                    </option>
                  ))}
                </CampoSelecao>
              </div>
              <div className="flex gap-2 pb-1">
                <BotaoPrimario onClick={salvarMeuAniversario} disabled={salvando}>
                  {salvando ? "Salvando…" : "Salvar"}
                </BotaoPrimario>
                {meuRegistro?.aniversario_dia && (
                  <BotaoDiscreto
                    onClick={removerMeuAniversario}
                    disabled={salvando}
                    title="Retirar meu aniversário da lista"
                  >
                    <Trash2 size={13} strokeWidth={1.8} />
                  </BotaoDiscreto>
                )}
              </div>
            </div>
          )}
        </Cartao>

        {/* Seletor de mês */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {MESES.map((m, i) => {
            const numero = i + 1;
            const quantos = membros.filter((x) => x.aniversario_mes === numero).length;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setMes(numero)}
                className={`shrink-0 px-3 py-2 rounded-xl text-xs uppercase tracking-widest border transition-colors ${
                  mes === numero
                    ? "border-cyan-glow/50 bg-cyan-glow/10 text-cyan-glow"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {m.slice(0, 3)}
                {quantos > 0 && <span className="ml-1 text-[10px] opacity-70">{quantos}</span>}
              </button>
            );
          })}
        </div>

        {/* Lista do mês */}
        {carregando ? (
          <p className="text-center text-muted-foreground/50 py-12 font-light">Carregando…</p>
        ) : doMes.length === 0 ? (
          <Vazio
            texto={`Ninguém da sua casa tem aniversário registrado em ${MESES[mes - 1].toLowerCase()}.`}
          />
        ) : (
          <div className="space-y-2">
            {doMes.map((m) => {
              const ehHoje =
                m.aniversario_dia === hoje.getDate() && m.aniversario_mes === hoje.getMonth() + 1;
              return (
                <div
                  key={m.id}
                  className={`glass rounded-2xl p-4 flex items-center gap-4 ${
                    ehHoje ? "ring-1 ring-violet-300" : ""
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-violet-100 border border-violet-200 flex items-center justify-center text-xs font-medium text-violet-600 shrink-0">
                    {iniciais(m.nome)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{m.nome ?? "Membro"}</p>
                    <p className="text-xs text-muted-foreground/70">
                      {m.aniversario_dia} de {MESES[mes - 1]}
                    </p>
                  </div>
                  {ehHoje && (
                    <Etiqueta tom="violeta">
                      <PartyPopper size={10} strokeWidth={2} /> É hoje
                    </Etiqueta>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground/50 font-light flex items-center justify-center gap-2">
          <Cake size={13} strokeWidth={1.5} />
          {membros.length} {membros.length === 1 ? "pessoa informou" : "pessoas informaram"} o
          aniversário nesta casa.
        </p>
      </div>
    </PaginaComunidade>
  );
}
