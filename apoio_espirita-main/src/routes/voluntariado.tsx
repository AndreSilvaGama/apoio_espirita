import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Check, HandHeart, Plus, Sparkles, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { mensagemDeErro } from "@/lib/erros";
import { avisar } from "@/lib/avisos";
import { validarLinguagem } from "@/lib/linguagem";
import { HABILIDADES, afinidade, habilidadesEmComum } from "@/data/habilidades";
import {
  Abas,
  Aviso,
  BotaoDiscreto,
  BotaoPrimario,
  CampoArea,
  CampoSelecao,
  CampoTexto,
  Cartao,
  EscolhaVisibilidade,
  Etiqueta,
  MarcaAlcance,
  PaginaComunidade,
  Rotulo,
  Vazio,
  quandoFoi,
} from "@/components/Comunidade";

export const Route = createFileRoute("/voluntariado")({
  component: Voluntariado,
});

interface Necessidade {
  id: string;
  sigla_casa: string;
  titulo: string;
  descricao: string;
  habilidades: string[];
  urgencia: string;
  prazo: string | null;
  atendida: boolean;
  aberto: boolean;
  criado_por: string;
  autor_nome: string;
  created_at: string;
}

interface Oferta {
  id: string;
  sigla_casa: string;
  habilidades: string[];
  disponibilidade: string | null;
  observacao: string | null;
  ativa: boolean;
  aberto: boolean;
  criado_por: string;
  autor_nome: string;
}

interface Candidatura {
  id: string;
  necessidade_id: string;
  mensagem: string | null;
  status: string;
  criado_por: string;
  autor_nome: string;
  created_at: string;
}

const URGENCIAS: Record<string, { rotulo: string; tom: "verde" | "ambar" | "vermelho" }> = {
  baixa: { rotulo: "Sem pressa", tom: "verde" },
  media: { rotulo: "Neste mês", tom: "ambar" },
  alta: { rotulo: "Urgente", tom: "vermelho" },
};

/** Caixas de seleção das habilidades, agrupadas como no catálogo. */
function SeletorHabilidades({
  escolhidas,
  aoAlternar,
}: {
  escolhidas: string[];
  aoAlternar: (h: string) => void;
}) {
  return (
    <div className="space-y-4">
      {HABILIDADES.map((g) => (
        <div key={g.grupo}>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground/60 mb-2">
            {g.grupo}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {g.itens.map((h) => {
              const ativa = escolhidas.includes(h);
              return (
                <button
                  key={h}
                  type="button"
                  onClick={() => aoAlternar(h)}
                  className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                    ativa
                      ? "border-cyan-glow/50 bg-cyan-glow/10 text-cyan-glow"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {h}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function Voluntariado() {
  const { user, profile, isPresident } = useAuth();
  const [aba, setAba] = useState<"precisa" | "oferta" | "voluntarios">("precisa");
  const [necessidades, setNecessidades] = useState<Necessidade[]>([]);
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [candidaturas, setCandidaturas] = useState<Candidatura[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);

  const [criando, setCriando] = useState(false);
  const [form, setForm] = useState({
    titulo: "",
    descricao: "",
    habilidades: [] as string[],
    urgencia: "media",
    prazo: "",
    aberto: false,
  });

  const [minhaOferta, setMinhaOferta] = useState({
    habilidades: [] as string[],
    disponibilidade: "",
    observacao: "",
    aberto: false,
  });

  const carregar = useCallback(async () => {
    setCarregando(true);
    const [n, o, c] = await Promise.all([
      supabase
        .from("voluntariado_necessidades")
        .select(
          "id, sigla_casa, titulo, descricao, habilidades, urgencia, prazo, atendida, aberto, criado_por, autor_nome, created_at",
        )
        .order("atendida")
        .order("created_at", { ascending: false }),
      supabase
        .from("voluntariado_ofertas")
        .select(
          "id, sigla_casa, habilidades, disponibilidade, observacao, ativa, aberto, criado_por, autor_nome",
        ),
      supabase
        .from("voluntariado_candidaturas")
        .select("id, necessidade_id, mensagem, status, criado_por, autor_nome, created_at"),
    ]);
    if (n.error) setErro(mensagemDeErro(n.error));
    setNecessidades((n.data as Necessidade[]) ?? []);
    const listaOfertas = (o.data as Oferta[]) ?? [];
    setOfertas(listaOfertas);
    setCandidaturas((c.data as Candidatura[]) ?? []);

    // O formulário da aba "Posso ajudar" já abre com o que a pessoa cadastrou.
    // Preencher aqui, e não em um efeito à parte, evita que a tela sobrescreva
    // o que ela estiver digitando a cada recarga da lista.
    const minha = listaOfertas.find((x) => x.criado_por === user?.id);
    if (minha) {
      setMinhaOferta({
        habilidades: minha.habilidades ?? [],
        disponibilidade: minha.disponibilidade ?? "",
        observacao: minha.observacao ?? "",
        aberto: minha.aberto,
      });
    }
    setCarregando(false);
  }, [user?.id]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const ofertaExistente = ofertas.find((o) => o.criado_por === user?.id);

  async function publicarNecessidade(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (form.titulo.trim().length < 5 || form.descricao.trim().length < 10) {
      setErro("Descreva melhor o que a casa precisa.");
      return;
    }
    if (form.habilidades.length === 0) {
      setErro("Escolha ao menos uma habilidade — é assim que encontramos quem pode ajudar.");
      return;
    }
    const problema = validarLinguagem(form.titulo, form.descricao);
    if (problema) {
      setErro(problema);
      return;
    }
    setOcupado("necessidade");
    const { data: nova, error } = await supabase
      .from("voluntariado_necessidades")
      .insert({
        sigla_casa: profile?.sigla_casa ?? "",
        titulo: form.titulo.trim(),
        descricao: form.descricao.trim(),
        habilidades: form.habilidades,
        urgencia: form.urgencia,
        prazo: form.prazo || null,
        aberto: form.aberto,
        criado_por: user?.id ?? "",
        autor_nome: profile?.nome ?? "",
      })
      .select("id")
      .single();
    setOcupado(null);
    if (error) {
      setErro(mensagemDeErro(error));
      return;
    }
    avisar("voluntariado_necessidade", nova?.id);
    setForm({
      titulo: "",
      descricao: "",
      habilidades: [],
      urgencia: "media",
      prazo: "",
      aberto: false,
    });
    setCriando(false);
    await carregar();
  }

  async function salvarOferta() {
    setErro(null);
    if (minhaOferta.habilidades.length === 0) {
      setErro("Escolha ao menos uma habilidade.");
      return;
    }
    const problema = validarLinguagem(minhaOferta.observacao, minhaOferta.disponibilidade);
    if (problema) {
      setErro(problema);
      return;
    }
    setOcupado("oferta");
    const dados = {
      habilidades: minhaOferta.habilidades,
      disponibilidade: minhaOferta.disponibilidade.trim() || null,
      observacao: minhaOferta.observacao.trim() || null,
      aberto: minhaOferta.aberto,
    };
    const { error } = ofertaExistente
      ? await supabase.from("voluntariado_ofertas").update(dados).eq("id", ofertaExistente.id)
      : await supabase.from("voluntariado_ofertas").insert({
          ...dados,
          sigla_casa: profile?.sigla_casa ?? "",
          criado_por: user?.id ?? "",
          autor_nome: profile?.nome ?? "",
        });
    setOcupado(null);
    if (error) {
      setErro(mensagemDeErro(error));
      return;
    }
    await carregar();
  }

  async function candidatar(necessidadeId: string) {
    setOcupado(necessidadeId);
    const { data: nova, error } = await supabase
      .from("voluntariado_candidaturas")
      .insert({
        necessidade_id: necessidadeId,
        sigla_casa: profile?.sigla_casa ?? "",
        criado_por: user?.id ?? "",
        autor_nome: profile?.nome ?? "",
      })
      .select("id")
      .single();
    setOcupado(null);
    if (error) {
      setErro(mensagemDeErro(error));
      return;
    }
    avisar("voluntariado_candidatura", nova?.id);
    await carregar();
  }

  async function responderCandidatura(id: string, status: "aceita" | "recusada") {
    setOcupado(id);
    const { error } = await supabase
      .from("voluntariado_candidaturas")
      .update({ status })
      .eq("id", id);
    setOcupado(null);
    if (error) {
      setErro(mensagemDeErro(error));
      return;
    }
    await carregar();
  }

  async function marcarAtendida(n: Necessidade) {
    setOcupado(n.id);
    const { error } = await supabase
      .from("voluntariado_necessidades")
      .update({ atendida: !n.atendida })
      .eq("id", n.id);
    setOcupado(null);
    if (error) {
      setErro(mensagemDeErro(error));
      return;
    }
    await carregar();
  }

  async function apagarNecessidade(id: string) {
    setOcupado(id);
    const { error } = await supabase.from("voluntariado_necessidades").delete().eq("id", id);
    setOcupado(null);
    if (error) {
      setErro(mensagemDeErro(error));
      return;
    }
    await carregar();
  }

  return (
    <PaginaComunidade
      secao="Nossa comunidade"
      titulo="Localização de"
      destaque="Voluntariado"
      descricao="De um lado, o que a casa precisa. Do outro, o que cada um sabe fazer. A tela cruza os dois e mostra quem tem mais afinidade com cada pedido."
    >
      <div className="space-y-6">
        {erro && <Aviso tipo="erro">{erro}</Aviso>}

        <Abas
          abas={[
            { id: "precisa", rotulo: "Precisa-se" },
            { id: "oferta", rotulo: "Posso ajudar" },
            { id: "voluntarios", rotulo: "Voluntários" },
          ]}
          atual={aba}
          aoTrocar={setAba}
        />

        {/* ── Necessidades ── */}
        {aba === "precisa" && (
          <div className="space-y-5">
            <div className="flex justify-end">
              <BotaoPrimario onClick={() => setCriando((v) => !v)}>
                <span className="inline-flex items-center gap-2">
                  <Plus size={13} strokeWidth={2} /> {criando ? "Fechar" : "Pedir ajuda"}
                </span>
              </BotaoPrimario>
            </div>

            {criando && (
              <Cartao>
                <form onSubmit={publicarNecessidade} className="space-y-5">
                  <div>
                    <Rotulo obrigatorio>Do que a casa precisa</Rotulo>
                    <CampoTexto
                      value={form.titulo}
                      onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                      maxLength={160}
                      placeholder="Ex.: consertar a fiação do salão de palestras"
                    />
                  </div>
                  <div>
                    <Rotulo obrigatorio>Detalhes</Rotulo>
                    <CampoArea
                      rows={4}
                      value={form.descricao}
                      onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                      maxLength={2000}
                      placeholder="Explique o que precisa ser feito, onde e em que horários."
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Rotulo>Urgência</Rotulo>
                      <CampoSelecao
                        value={form.urgencia}
                        onChange={(e) => setForm({ ...form, urgencia: e.target.value })}
                      >
                        <option value="baixa">Sem pressa</option>
                        <option value="media">Neste mês</option>
                        <option value="alta">Urgente</option>
                      </CampoSelecao>
                    </div>
                    <div>
                      <Rotulo ajuda="opcional">Prazo</Rotulo>
                      <CampoTexto
                        type="date"
                        value={form.prazo}
                        onChange={(e) => setForm({ ...form, prazo: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Rotulo obrigatorio>Habilidades necessárias</Rotulo>
                    <SeletorHabilidades
                      escolhidas={form.habilidades}
                      aoAlternar={(h) =>
                        setForm({
                          ...form,
                          habilidades: form.habilidades.includes(h)
                            ? form.habilidades.filter((x) => x !== h)
                            : [...form.habilidades, h],
                        })
                      }
                    />
                  </div>
                  <EscolhaVisibilidade
                    aberto={form.aberto}
                    aoMudar={(v) => setForm({ ...form, aberto: v })}
                    substantivo="este pedido"
                  />
                  <BotaoPrimario type="submit" disabled={ocupado === "necessidade"}>
                    {ocupado === "necessidade" ? "Publicando…" : "Publicar pedido"}
                  </BotaoPrimario>
                </form>
              </Cartao>
            )}

            {carregando ? (
              <p className="text-center text-muted-foreground/50 py-12 font-light">Carregando…</p>
            ) : necessidades.length === 0 ? (
              <Vazio texto="Nenhum pedido de ajuda publicado." />
            ) : (
              <div className="space-y-3">
                {necessidades.map((n) => {
                  const urg = URGENCIAS[n.urgencia] ?? URGENCIAS.media;
                  const souDono = n.criado_por === user?.id || isPresident;
                  const minhaCandidatura = candidaturas.find(
                    (c) => c.necessidade_id === n.id && c.criado_por === user?.id,
                  );
                  const doPedido = candidaturas.filter((c) => c.necessidade_id === n.id);
                  const combinam = ofertas
                    .filter((o) => o.ativa && afinidade(n.habilidades, o.habilidades) > 0)
                    .sort(
                      (a, b) =>
                        afinidade(n.habilidades, b.habilidades) -
                        afinidade(n.habilidades, a.habilidades),
                    );
                  return (
                    <article
                      key={n.id}
                      className={`glass rounded-2xl p-5 ${n.atendida ? "opacity-60" : ""}`}
                    >
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <Etiqueta tom={urg.tom}>{urg.rotulo}</Etiqueta>
                        <MarcaAlcance aberto={n.aberto} />
                        {n.atendida && <Etiqueta tom="verde">Atendido</Etiqueta>}
                      </div>
                      <h3 className="text-foreground">{n.titulo}</h3>
                      <p className="mt-1 text-sm text-muted-foreground font-light whitespace-pre-wrap">
                        {n.descricao}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {n.habilidades.map((h) => (
                          <span
                            key={h}
                            className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700"
                          >
                            {h}
                          </span>
                        ))}
                      </div>

                      {combinam.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-border/40">
                          <p className="text-[11px] uppercase tracking-widest text-muted-foreground/60 mb-2 flex items-center gap-1.5">
                            <Sparkles size={11} strokeWidth={1.8} />
                            {combinam.length}{" "}
                            {combinam.length === 1
                              ? "voluntário com afinidade"
                              : "voluntários com afinidade"}
                          </p>
                          <div className="space-y-1">
                            {combinam.slice(0, 4).map((o) => (
                              <p key={o.id} className="text-xs text-muted-foreground">
                                <span className="text-foreground">{o.autor_nome}</span>{" "}
                                <span className="text-muted-foreground/60">
                                  — {habilidadesEmComum(n.habilidades, o.habilidades).join(", ")}
                                </span>
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      {souDono && doPedido.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-border/40 space-y-2">
                          <p className="text-[11px] uppercase tracking-widest text-muted-foreground/60">
                            Quem se ofereceu
                          </p>
                          {doPedido.map((c) => (
                            <div
                              key={c.id}
                              className="flex items-center justify-between gap-2 flex-wrap"
                            >
                              <p className="text-sm text-foreground">
                                {c.autor_nome}
                                {c.status !== "pendente" && (
                                  <span className="ml-2">
                                    <Etiqueta tom={c.status === "aceita" ? "verde" : "neutro"}>
                                      {c.status === "aceita" ? "Aceito" : "Recusado"}
                                    </Etiqueta>
                                  </span>
                                )}
                              </p>
                              {c.status === "pendente" && (
                                <div className="flex gap-2">
                                  <BotaoDiscreto
                                    onClick={() => responderCandidatura(c.id, "aceita")}
                                    disabled={ocupado === c.id}
                                  >
                                    <Check size={13} strokeWidth={2} />
                                  </BotaoDiscreto>
                                  <BotaoDiscreto
                                    onClick={() => responderCandidatura(c.id, "recusada")}
                                    disabled={ocupado === c.id}
                                  >
                                    <X size={13} strokeWidth={2} />
                                  </BotaoDiscreto>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between gap-2 flex-wrap">
                        <p className="text-xs text-muted-foreground/60">
                          {n.autor_nome} · {quandoFoi(n.created_at)}
                        </p>
                        <div className="flex gap-2">
                          {!souDono &&
                            !n.atendida &&
                            (minhaCandidatura ? (
                              <Etiqueta
                                tom={minhaCandidatura.status === "aceita" ? "verde" : "neutro"}
                              >
                                {minhaCandidatura.status === "aceita"
                                  ? "Você foi aceito"
                                  : minhaCandidatura.status === "recusada"
                                    ? "Não foi desta vez"
                                    : "Você se ofereceu"}
                              </Etiqueta>
                            ) : (
                              <BotaoPrimario
                                onClick={() => candidatar(n.id)}
                                disabled={ocupado === n.id}
                              >
                                <span className="inline-flex items-center gap-1.5">
                                  <HandHeart size={13} strokeWidth={1.8} /> Posso ajudar
                                </span>
                              </BotaoPrimario>
                            ))}
                          {souDono && (
                            <>
                              <BotaoDiscreto
                                onClick={() => marcarAtendida(n)}
                                disabled={ocupado === n.id}
                              >
                                {n.atendida ? "Reabrir" : "Marcar atendido"}
                              </BotaoDiscreto>
                              <BotaoDiscreto
                                onClick={() => apagarNecessidade(n.id)}
                                disabled={ocupado === n.id}
                              >
                                <Trash2 size={13} strokeWidth={1.8} />
                              </BotaoDiscreto>
                            </>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Minha oferta ── */}
        {aba === "oferta" && (
          <Cartao>
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-medium text-foreground">O que eu sei fazer</h2>
                <p className="mt-1 text-sm text-muted-foreground font-light">
                  Marque as suas habilidades. Quando a casa publicar um pedido que combine, o seu
                  nome aparece para quem pediu — sem que você precise procurar.
                </p>
              </div>

              <SeletorHabilidades
                escolhidas={minhaOferta.habilidades}
                aoAlternar={(h) =>
                  setMinhaOferta({
                    ...minhaOferta,
                    habilidades: minhaOferta.habilidades.includes(h)
                      ? minhaOferta.habilidades.filter((x) => x !== h)
                      : [...minhaOferta.habilidades, h],
                  })
                }
              />

              <div>
                <Rotulo ajuda="quando você costuma estar disponível">Disponibilidade</Rotulo>
                <CampoTexto
                  value={minhaOferta.disponibilidade}
                  onChange={(e) =>
                    setMinhaOferta({ ...minhaOferta, disponibilidade: e.target.value })
                  }
                  maxLength={200}
                  placeholder="Ex.: fins de semana e à noite durante a semana"
                />
              </div>
              <div>
                <Rotulo ajuda="opcional">Observação</Rotulo>
                <CampoArea
                  rows={2}
                  value={minhaOferta.observacao}
                  onChange={(e) => setMinhaOferta({ ...minhaOferta, observacao: e.target.value })}
                  maxLength={600}
                />
              </div>

              <EscolhaVisibilidade
                aberto={minhaOferta.aberto}
                aoMudar={(v) => setMinhaOferta({ ...minhaOferta, aberto: v })}
                substantivo="a sua disponibilidade"
              />

              <BotaoPrimario onClick={salvarOferta} disabled={ocupado === "oferta"}>
                {ocupado === "oferta"
                  ? "Salvando…"
                  : ofertaExistente
                    ? "Atualizar minhas habilidades"
                    : "Publicar minhas habilidades"}
              </BotaoPrimario>
            </div>
          </Cartao>
        )}

        {/* ── Voluntários ── */}
        {aba === "voluntarios" &&
          (ofertas.length === 0 ? (
            <Vazio texto="Ninguém cadastrou habilidades ainda. Comece por você, na aba “Posso ajudar”." />
          ) : (
            <div className="space-y-3">
              {ofertas.map((o) => (
                <div key={o.id} className="glass rounded-2xl p-5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="text-foreground">{o.autor_nome}</p>
                    <MarcaAlcance aberto={o.aberto} />
                  </div>
                  {o.disponibilidade && (
                    <p className="mt-1 text-xs text-muted-foreground">{o.disponibilidade}</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {o.habilidades.map((h) => (
                      <span
                        key={h}
                        className="text-[11px] px-2 py-0.5 rounded-full bg-white/60 border border-border text-muted-foreground"
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                  {o.observacao && (
                    <p className="mt-3 text-sm text-muted-foreground font-light">{o.observacao}</p>
                  )}
                </div>
              ))}
            </div>
          ))}
      </div>
    </PaginaComunidade>
  );
}
