import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Clock, Plus, Trash2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { mensagemDeErro } from "@/lib/erros";
import { validarLinguagem } from "@/lib/linguagem";
import {
  Aviso,
  BotaoDiscreto,
  BotaoPrimario,
  Cartao,
  CampoSelecao,
  CampoTexto,
  DIAS_SEMANA,
  EscolhaVisibilidade,
  Etiqueta,
  MarcaAlcance,
  PaginaComunidade,
  Rotulo,
  Vazio,
} from "@/components/Comunidade";

export const Route = createFileRoute("/oracoes")({
  component: PlantaoDeOracoes,
});

interface Horario {
  id: string;
  sigla_casa: string;
  dia_semana: number;
  hora: number;
  minuto: number;
  intencao: string | null;
  vagas: number;
  aberto: boolean;
  criado_por: string;
  autor_nome: string;
}

interface Inscricao {
  id: string;
  horario_id: string;
  criado_por: string;
  autor_nome: string;
}

const HORAS = Array.from({ length: 24 }, (_, i) => i);

function relogio(hora: number, minuto: number): string {
  return `${String(hora).padStart(2, "0")}h${minuto === 0 ? "" : String(minuto).padStart(2, "0")}`;
}

function PlantaoDeOracoes() {
  const { user, profile, isPresident } = useAuth();
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);

  const [criando, setCriando] = useState(false);
  const [form, setForm] = useState({
    dia_semana: "0",
    hora: "20",
    minuto: "0",
    intencao: "",
    vagas: "0",
    aberto: false,
  });
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const [h, i] = await Promise.all([
      supabase
        .from("oracao_horarios")
        .select(
          "id, sigla_casa, dia_semana, hora, minuto, intencao, vagas, aberto, criado_por, autor_nome",
        )
        .order("dia_semana")
        .order("hora"),
      supabase.from("oracao_inscricoes").select("id, horario_id, criado_por, autor_nome"),
    ]);
    if (h.error) setErro(mensagemDeErro(h.error));
    setHorarios((h.data as Horario[]) ?? []);
    setInscricoes((i.data as Inscricao[]) ?? []);
    setCarregando(false);
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function criarHorario(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    const problema = validarLinguagem(form.intencao);
    if (problema) {
      setErro(problema);
      return;
    }
    setSalvando(true);
    const { error } = await supabase.from("oracao_horarios").insert({
      sigla_casa: profile?.sigla_casa ?? "",
      dia_semana: Number(form.dia_semana),
      hora: Number(form.hora),
      minuto: Number(form.minuto),
      intencao: form.intencao.trim() || null,
      vagas: Number(form.vagas) || 0,
      aberto: form.aberto,
      criado_por: user?.id ?? "",
      autor_nome: profile?.nome ?? "",
    });
    setSalvando(false);
    if (error) {
      setErro(
        error.message.includes("duplicate key")
          ? "A sua casa já tem um plantão neste dia e horário."
          : mensagemDeErro(error),
      );
      return;
    }
    setForm({ ...form, intencao: "", vagas: "0" });
    setCriando(false);
    await carregar();
  }

  async function entrar(horario: Horario) {
    if (!user) return;
    setOcupado(horario.id);
    setErro(null);
    const { error } = await supabase.from("oracao_inscricoes").insert({
      horario_id: horario.id,
      sigla_casa: profile?.sigla_casa ?? "",
      criado_por: user.id,
      autor_nome: profile?.nome ?? "",
    });
    setOcupado(null);
    if (error) {
      setErro(mensagemDeErro(error));
      return;
    }
    await carregar();
  }

  async function sair(inscricaoId: string) {
    setOcupado(inscricaoId);
    const { error } = await supabase.from("oracao_inscricoes").delete().eq("id", inscricaoId);
    setOcupado(null);
    if (error) {
      setErro(mensagemDeErro(error));
      return;
    }
    await carregar();
  }

  async function apagarHorario(id: string) {
    setOcupado(id);
    const { error } = await supabase.from("oracao_horarios").delete().eq("id", id);
    setOcupado(null);
    if (error) {
      setErro(mensagemDeErro(error));
      return;
    }
    await carregar();
  }

  const totalInscricoes = inscricoes.filter((i) => i.criado_por === user?.id).length;

  return (
    <PaginaComunidade
      secao="Vida espiritual"
      titulo="Plantão de"
      destaque="Orações"
      descricao="Horários fixos de oração à distância. Cada um se inscreve no horário em que pode orar, e a casa toda enxerga a grade — ninguém ora sozinho."
    >
      <div className="space-y-6">
        {erro && <Aviso tipo="erro">{erro}</Aviso>}

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-muted-foreground font-light">
            {totalInscricoes === 0
              ? "Você ainda não assumiu nenhum horário."
              : `Você está em ${totalInscricoes} ${totalInscricoes === 1 ? "horário" : "horários"}.`}
          </p>
          <BotaoPrimario onClick={() => setCriando((v) => !v)}>
            <span className="inline-flex items-center gap-2">
              <Plus size={13} strokeWidth={2} /> {criando ? "Fechar" : "Abrir um horário"}
            </span>
          </BotaoPrimario>
        </div>

        {criando && (
          <Cartao>
            <form onSubmit={criarHorario} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Rotulo obrigatorio>Dia</Rotulo>
                  <CampoSelecao
                    value={form.dia_semana}
                    onChange={(e) => setForm({ ...form, dia_semana: e.target.value })}
                  >
                    {DIAS_SEMANA.map((d, i) => (
                      <option key={d} value={i}>
                        {d}
                      </option>
                    ))}
                  </CampoSelecao>
                </div>
                <div>
                  <Rotulo obrigatorio>Hora</Rotulo>
                  <CampoSelecao
                    value={form.hora}
                    onChange={(e) => setForm({ ...form, hora: e.target.value })}
                  >
                    {HORAS.map((h) => (
                      <option key={h} value={h}>
                        {String(h).padStart(2, "0")}h
                      </option>
                    ))}
                  </CampoSelecao>
                </div>
                <div>
                  <Rotulo>Minutos</Rotulo>
                  <CampoSelecao
                    value={form.minuto}
                    onChange={(e) => setForm({ ...form, minuto: e.target.value })}
                  >
                    <option value="0">em ponto</option>
                    <option value="30">e meia</option>
                  </CampoSelecao>
                </div>
              </div>

              <div>
                <Rotulo ajuda="opcional — o motivo que reúne as pessoas neste horário">
                  Intenção
                </Rotulo>
                <CampoTexto
                  value={form.intencao}
                  onChange={(e) => setForm({ ...form, intencao: e.target.value })}
                  maxLength={200}
                  placeholder="Ex.: pelos enfermos da casa"
                />
              </div>

              <div>
                <Rotulo ajuda="deixe zero para não limitar">Vagas</Rotulo>
                <CampoTexto
                  type="number"
                  min={0}
                  max={200}
                  value={form.vagas}
                  onChange={(e) => setForm({ ...form, vagas: e.target.value })}
                />
              </div>

              <EscolhaVisibilidade
                aberto={form.aberto}
                aoMudar={(v) => setForm({ ...form, aberto: v })}
                substantivo="este plantão"
              />

              <BotaoPrimario type="submit" disabled={salvando}>
                {salvando ? "Abrindo…" : "Abrir horário"}
              </BotaoPrimario>
            </form>
          </Cartao>
        )}

        {carregando ? (
          <p className="text-center text-muted-foreground/50 py-12 font-light">Carregando grade…</p>
        ) : horarios.length === 0 ? (
          <Vazio texto="Nenhum horário de oração aberto ainda. Abra o primeiro e convide a casa." />
        ) : (
          <div className="space-y-6">
            {DIAS_SEMANA.map((dia, indice) => {
              const doDia = horarios
                .filter((h) => h.dia_semana === indice)
                .sort((a, b) => a.hora * 60 + a.minuto - (b.hora * 60 + b.minuto));
              if (doDia.length === 0) return null;
              return (
                <section key={dia}>
                  <h2 className="text-xs uppercase tracking-[0.3em] text-cyan-glow mb-3">{dia}</h2>
                  <div className="space-y-2">
                    {doDia.map((h) => {
                      const participantes = inscricoes.filter((i) => i.horario_id === h.id);
                      const minha = participantes.find((i) => i.criado_por === user?.id);
                      const lotado = h.vagas > 0 && participantes.length >= h.vagas && !minha;
                      const posso = h.criado_por === user?.id || isPresident;
                      return (
                        <div key={h.id} className="glass rounded-2xl p-5">
                          <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div className="flex items-start gap-3 min-w-0">
                              <Clock
                                size={18}
                                strokeWidth={1.5}
                                className="text-cyan-glow mt-0.5 shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="text-foreground">
                                  {relogio(h.hora, h.minuto)}
                                  {h.intencao && (
                                    <span className="text-muted-foreground font-light">
                                      {" "}
                                      — {h.intencao}
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-muted-foreground/60 mt-1 flex items-center gap-2 flex-wrap">
                                  <span className="inline-flex items-center gap-1">
                                    <Users size={11} strokeWidth={1.8} />
                                    {participantes.length}
                                    {h.vagas > 0 ? ` de ${h.vagas}` : ""}
                                  </span>
                                  <MarcaAlcance aberto={h.aberto} />
                                  {h.aberto && h.sigla_casa !== profile?.sigla_casa && (
                                    <Etiqueta tom="ciano">{h.sigla_casa}</Etiqueta>
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {minha ? (
                                <BotaoDiscreto
                                  onClick={() => sair(minha.id)}
                                  disabled={ocupado === minha.id}
                                >
                                  Sair
                                </BotaoDiscreto>
                              ) : (
                                <BotaoPrimario
                                  onClick={() => entrar(h)}
                                  disabled={ocupado === h.id || lotado}
                                >
                                  {lotado ? "Sem vagas" : "Vou orar"}
                                </BotaoPrimario>
                              )}
                              {posso && (
                                <BotaoDiscreto
                                  onClick={() => apagarHorario(h.id)}
                                  disabled={ocupado === h.id}
                                  title="Apagar este horário"
                                >
                                  <Trash2 size={13} strokeWidth={1.8} />
                                </BotaoDiscreto>
                              )}
                            </div>
                          </div>

                          {participantes.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-border/40 flex flex-wrap gap-1.5">
                              {participantes.map((p) => (
                                <span
                                  key={p.id}
                                  className="text-[11px] px-2 py-0.5 rounded-full bg-white/60 border border-border text-muted-foreground"
                                >
                                  {p.autor_nome}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </PaginaComunidade>
  );
}
