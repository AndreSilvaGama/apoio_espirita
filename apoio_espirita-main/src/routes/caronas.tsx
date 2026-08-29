import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Car, Check, Clock, MapPin, Plus, Trash2, Users, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { mensagemDeErro } from "@/lib/erros";
import { avisar } from "@/lib/avisos";
import { validarLinguagem } from "@/lib/linguagem";
import {
  Aviso,
  BotaoDiscreto,
  BotaoPrimario,
  CampoArea,
  CampoTexto,
  Cartao,
  Etiqueta,
  MarcaAlcance,
  PaginaComunidade,
  Rotulo,
  Vazio,
  dataPorExtenso,
} from "@/components/Comunidade";

export const Route = createFileRoute("/caronas")({
  component: Caronas,
});

interface Carona {
  id: string;
  sigla_casa: string;
  origem: string;
  destino: string;
  data: string;
  hora: string;
  vagas: number;
  volta: boolean;
  veiculo: string | null;
  observacao: string | null;
  ativa: boolean;
  aberto: boolean;
  criado_por: string;
  autor_nome: string;
}

interface Pedido {
  id: string;
  carona_id: string;
  ponto_encontro: string | null;
  mensagem: string | null;
  contato: string;
  status: string;
  criado_por: string;
  autor_nome: string;
}

const hojeISO = () => new Date().toISOString().slice(0, 10);

function Caronas() {
  const { user, profile, isPresident } = useAuth();
  const [caronas, setCaronas] = useState<Carona[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [contatos, setContatos] = useState<Record<string, string>>({});
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [mostrarPassadas, setMostrarPassadas] = useState(false);

  const [criando, setCriando] = useState(false);
  const [form, setForm] = useState({
    origem: "",
    destino: "",
    data: hojeISO(),
    hora: "19:00",
    vagas: "3",
    volta: true,
    veiculo: "",
    observacao: "",
    contato: "",
    aberto: false,
  });

  const [pedindo, setPedindo] = useState<string | null>(null);
  const [formPedido, setFormPedido] = useState({ ponto: "", mensagem: "", contato: "" });

  const carregar = useCallback(async () => {
    setCarregando(true);
    const [c, p, ct] = await Promise.all([
      supabase
        .from("caronas")
        .select(
          "id, sigla_casa, origem, destino, data, hora, vagas, volta, veiculo, observacao, ativa, aberto, criado_por, autor_nome",
        )
        .order("data")
        .order("hora"),
      supabase
        .from("carona_pedidos")
        .select("id, carona_id, ponto_encontro, mensagem, contato, status, criado_por, autor_nome"),
      supabase.from("carona_contatos").select("carona_id, contato"),
    ]);
    if (c.error) setErro(mensagemDeErro(c.error));
    setCaronas((c.data as Carona[]) ?? []);
    setPedidos((p.data as Pedido[]) ?? []);
    setContatos(Object.fromEntries((ct.data ?? []).map((x) => [x.carona_id, x.contato])));
    setCarregando(false);
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function oferecer(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (form.origem.trim().length < 3 || form.destino.trim().length < 3) {
      setErro("Informe de onde você sai e para onde vai.");
      return;
    }
    if (form.contato.trim().length < 5) {
      setErro("Informe um contato — ele só aparece para quem você aceitar.");
      return;
    }
    const problema = validarLinguagem(form.observacao, form.veiculo);
    if (problema) {
      setErro(problema);
      return;
    }
    setOcupado("oferecer");
    const { data, error } = await supabase
      .from("caronas")
      .insert({
        sigla_casa: profile?.sigla_casa ?? "",
        origem: form.origem.trim(),
        destino: form.destino.trim(),
        data: form.data,
        hora: form.hora,
        vagas: Number(form.vagas) || 1,
        volta: form.volta,
        veiculo: form.veiculo.trim() || null,
        observacao: form.observacao.trim() || null,
        aberto: form.aberto,
        criado_por: user?.id ?? "",
        autor_nome: profile?.nome ?? "",
      })
      .select("id")
      .single();
    if (error || !data) {
      setOcupado(null);
      setErro(mensagemDeErro(error));
      return;
    }
    const { error: falhaContato } = await supabase
      .from("carona_contatos")
      .insert({ carona_id: data.id, contato: form.contato.trim() });
    setOcupado(null);
    if (falhaContato) {
      setErro(mensagemDeErro(falhaContato));
      return;
    }
    setForm({ ...form, origem: "", destino: "", observacao: "" });
    setCriando(false);
    await carregar();
  }

  async function pedirVaga(caronaId: string) {
    setErro(null);
    if (formPedido.contato.trim().length < 5) {
      setErro("Informe um contato para o motorista falar com você.");
      return;
    }
    setOcupado(caronaId);
    const { data: novo, error } = await supabase
      .from("carona_pedidos")
      .insert({
        carona_id: caronaId,
        sigla_casa: profile?.sigla_casa ?? "",
        ponto_encontro: formPedido.ponto.trim() || null,
        mensagem: formPedido.mensagem.trim() || null,
        contato: formPedido.contato.trim(),
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
    avisar("carona_pedido", novo?.id);
    setPedindo(null);
    setFormPedido({ ponto: "", mensagem: "", contato: formPedido.contato });
    await carregar();
  }

  async function responder(id: string, status: "aceito" | "recusado") {
    setOcupado(id);
    const { error } = await supabase.from("carona_pedidos").update({ status }).eq("id", id);
    setOcupado(null);
    if (error) {
      setErro(mensagemDeErro(error));
      return;
    }
    avisar("carona_resposta", id);
    await carregar();
  }

  async function encerrar(c: Carona) {
    setOcupado(c.id);
    const { error } = await supabase.from("caronas").update({ ativa: !c.ativa }).eq("id", c.id);
    setOcupado(null);
    if (error) {
      setErro(mensagemDeErro(error));
      return;
    }
    await carregar();
  }

  async function apagar(id: string) {
    setOcupado(id);
    const { error } = await supabase.from("caronas").delete().eq("id", id);
    setOcupado(null);
    if (error) {
      setErro(mensagemDeErro(error));
      return;
    }
    await carregar();
  }

  const hoje = hojeISO();
  const lista = caronas.filter((c) => (mostrarPassadas ? c.data < hoje : c.data >= hoje));

  return (
    <PaginaComunidade
      secao="Nossa comunidade"
      titulo="Carona"
      destaque="Solidária"
      descricao="Quem tem carro oferece; quem precisa pede lugar. O telefone do motorista só aparece depois que ele aceita o pedido — até lá, ninguém vê o contato de ninguém."
    >
      <div className="space-y-6">
        {erro && <Aviso tipo="erro">{erro}</Aviso>}

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => setMostrarPassadas((v) => !v)}
            className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          >
            {mostrarPassadas ? "Ver próximas" : "Ver caronas passadas"}
          </button>
          <BotaoPrimario onClick={() => setCriando((v) => !v)}>
            <span className="inline-flex items-center gap-2">
              <Plus size={13} strokeWidth={2} /> {criando ? "Fechar" : "Oferecer carona"}
            </span>
          </BotaoPrimario>
        </div>

        {criando && (
          <Cartao>
            <form onSubmit={oferecer} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Rotulo obrigatorio>Saio de</Rotulo>
                  <CampoTexto
                    value={form.origem}
                    onChange={(e) => setForm({ ...form, origem: e.target.value })}
                    maxLength={160}
                    placeholder="Bairro ou ponto de referência"
                  />
                </div>
                <div>
                  <Rotulo obrigatorio>Vou para</Rotulo>
                  <CampoTexto
                    value={form.destino}
                    onChange={(e) => setForm({ ...form, destino: e.target.value })}
                    maxLength={160}
                    placeholder="Ex.: Casa Espírita — reunião de quinta"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Rotulo obrigatorio>Data</Rotulo>
                  <CampoTexto
                    type="date"
                    value={form.data}
                    min={hoje}
                    onChange={(e) => setForm({ ...form, data: e.target.value })}
                  />
                </div>
                <div>
                  <Rotulo obrigatorio>Hora</Rotulo>
                  <CampoTexto
                    type="time"
                    value={form.hora}
                    onChange={(e) => setForm({ ...form, hora: e.target.value })}
                  />
                </div>
                <div>
                  <Rotulo obrigatorio>Vagas</Rotulo>
                  <CampoTexto
                    type="number"
                    min={1}
                    max={8}
                    value={form.vagas}
                    onChange={(e) => setForm({ ...form, vagas: e.target.value })}
                  />
                </div>
              </div>

              <label className="flex items-start gap-2 text-sm text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.volta}
                  onChange={(e) => setForm({ ...form, volta: e.target.checked })}
                  className="mt-1"
                />
                <span>
                  Também trago de volta
                  <span className="block text-xs text-muted-foreground font-light">
                    Quem depende de carona precisa saber se tem como voltar.
                  </span>
                </span>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Rotulo ajuda="opcional">Veículo</Rotulo>
                  <CampoTexto
                    value={form.veiculo}
                    onChange={(e) => setForm({ ...form, veiculo: e.target.value })}
                    maxLength={80}
                    placeholder="Ex.: Gol prata"
                  />
                </div>
                <div>
                  <Rotulo obrigatorio ajuda="só para quem for aceito">
                    Seu contato
                  </Rotulo>
                  <CampoTexto
                    value={form.contato}
                    onChange={(e) => setForm({ ...form, contato: e.target.value })}
                    maxLength={120}
                    placeholder="(21) 90000-0000"
                  />
                </div>
              </div>

              <div>
                <Rotulo ajuda="opcional">Observação</Rotulo>
                <CampoArea
                  rows={2}
                  value={form.observacao}
                  onChange={(e) => setForm({ ...form, observacao: e.target.value })}
                  maxLength={600}
                  placeholder="Ex.: passo pela praça central às 18h40."
                />
              </div>

              <div className="rounded-2xl border border-border/60 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-glow mb-3">
                  Quem enxerga
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, aberto: false })}
                    className={`flex-1 rounded-xl border px-3 py-2 text-sm transition-colors ${
                      !form.aberto
                        ? "border-cyan-glow/50 bg-cyan-glow/5 text-foreground"
                        : "border-border/60 text-muted-foreground"
                    }`}
                  >
                    Somente a minha casa
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, aberto: true })}
                    className={`flex-1 rounded-xl border px-3 py-2 text-sm transition-colors ${
                      form.aberto
                        ? "border-cyan-glow/50 bg-cyan-glow/5 text-foreground"
                        : "border-border/60 text-muted-foreground"
                    }`}
                  >
                    Todas as casas
                  </button>
                </div>
              </div>

              <BotaoPrimario type="submit" disabled={ocupado === "oferecer"}>
                {ocupado === "oferecer" ? "Publicando…" : "Oferecer carona"}
              </BotaoPrimario>
            </form>
          </Cartao>
        )}

        {carregando ? (
          <p className="text-center text-muted-foreground/50 py-12 font-light">Carregando…</p>
        ) : lista.length === 0 ? (
          <Vazio
            texto={
              mostrarPassadas
                ? "Nenhuma carona passada."
                : "Nenhuma carona oferecida para os próximos dias."
            }
          />
        ) : (
          <div className="space-y-3">
            {lista.map((c) => {
              const daCarona = pedidos.filter((p) => p.carona_id === c.id);
              const aceitos = daCarona.filter((p) => p.status === "aceito");
              const meu = daCarona.find((p) => p.criado_por === user?.id);
              const souMotorista = c.criado_por === user?.id;
              const lotada = aceitos.length >= c.vagas;
              const contato = contatos[c.id];
              return (
                <article
                  key={c.id}
                  className={`glass rounded-2xl p-5 ${c.ativa ? "" : "opacity-60"}`}
                >
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <Etiqueta tom="ciano">
                      <Clock size={10} strokeWidth={2} />
                      {dataPorExtenso(c.data)} · {c.hora.slice(0, 5)}
                    </Etiqueta>
                    <MarcaAlcance aberto={c.aberto} />
                    {c.volta && <Etiqueta tom="verde">Traz de volta</Etiqueta>}
                    {!c.ativa && <Etiqueta>Encerrada</Etiqueta>}
                    {lotada && c.ativa && <Etiqueta tom="ambar">Sem vagas</Etiqueta>}
                  </div>

                  <p className="text-foreground flex items-start gap-2">
                    <MapPin
                      size={15}
                      strokeWidth={1.6}
                      className="text-cyan-glow mt-0.5 shrink-0"
                    />
                    <span>
                      {c.origem} <span className="text-muted-foreground/50">→</span> {c.destino}
                    </span>
                  </p>

                  {c.observacao && (
                    <p className="mt-2 text-sm text-muted-foreground font-light">{c.observacao}</p>
                  )}

                  <p className="mt-3 text-xs text-muted-foreground/60 flex items-center gap-3 flex-wrap">
                    <span className="inline-flex items-center gap-1">
                      <Car size={11} strokeWidth={1.8} />
                      {c.autor_nome}
                      {c.veiculo ? ` · ${c.veiculo}` : ""}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users size={11} strokeWidth={1.8} />
                      {aceitos.length} de {c.vagas}
                    </span>
                  </p>

                  {contato && (
                    <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-widest text-emerald-700">
                        Contato do motorista
                      </p>
                      <p className="text-sm text-emerald-800">{contato}</p>
                    </div>
                  )}

                  {souMotorista && daCarona.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-border/40 space-y-2">
                      <p className="text-[11px] uppercase tracking-widest text-muted-foreground/60">
                        Pedidos de vaga
                      </p>
                      {daCarona.map((p) => (
                        <div key={p.id}>
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <p className="text-sm text-foreground">
                              {p.autor_nome}
                              {p.status !== "pendente" && (
                                <span className="ml-2">
                                  <Etiqueta tom={p.status === "aceito" ? "verde" : "neutro"}>
                                    {p.status === "aceito" ? "Aceito" : "Recusado"}
                                  </Etiqueta>
                                </span>
                              )}
                            </p>
                            {p.status === "pendente" && (
                              <div className="flex gap-2">
                                <BotaoDiscreto
                                  onClick={() => responder(p.id, "aceito")}
                                  disabled={ocupado === p.id || lotada}
                                  title={lotada ? "Todas as vagas foram preenchidas" : "Aceitar"}
                                >
                                  <Check size={13} strokeWidth={2} />
                                </BotaoDiscreto>
                                <BotaoDiscreto
                                  onClick={() => responder(p.id, "recusado")}
                                  disabled={ocupado === p.id}
                                >
                                  <X size={13} strokeWidth={2} />
                                </BotaoDiscreto>
                              </div>
                            )}
                          </div>
                          {p.ponto_encontro && (
                            <p className="text-xs text-muted-foreground">
                              Encontro: {p.ponto_encontro}
                            </p>
                          )}
                          {p.mensagem && (
                            <p className="text-xs text-muted-foreground font-light">{p.mensagem}</p>
                          )}
                          {p.status === "aceito" && (
                            <p className="text-xs text-cyan-700">Contato: {p.contato}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-end gap-2 flex-wrap">
                    {souMotorista ? (
                      <>
                        <BotaoDiscreto onClick={() => encerrar(c)} disabled={ocupado === c.id}>
                          {c.ativa ? "Encerrar" : "Reabrir"}
                        </BotaoDiscreto>
                        <BotaoDiscreto onClick={() => apagar(c.id)} disabled={ocupado === c.id}>
                          <Trash2 size={13} strokeWidth={1.8} />
                        </BotaoDiscreto>
                      </>
                    ) : meu ? (
                      <Etiqueta tom={meu.status === "aceito" ? "verde" : "neutro"}>
                        {meu.status === "pendente"
                          ? "Pedido enviado"
                          : meu.status === "aceito"
                            ? "Vaga confirmada"
                            : "Não foi desta vez"}
                      </Etiqueta>
                    ) : (
                      c.ativa &&
                      !lotada && (
                        <BotaoPrimario onClick={() => setPedindo(c.id)}>Pedir vaga</BotaoPrimario>
                      )
                    )}
                    {isPresident && !souMotorista && (
                      <BotaoDiscreto onClick={() => apagar(c.id)} disabled={ocupado === c.id}>
                        <Trash2 size={13} strokeWidth={1.8} />
                      </BotaoDiscreto>
                    )}
                  </div>

                  {pedindo === c.id && (
                    <div className="mt-4 pt-4 border-t border-border/40 space-y-3">
                      <div>
                        <Rotulo obrigatorio ajuda="visível só para o motorista">
                          Seu contato
                        </Rotulo>
                        <CampoTexto
                          value={formPedido.contato}
                          onChange={(e) =>
                            setFormPedido({ ...formPedido, contato: e.target.value })
                          }
                          maxLength={120}
                          placeholder="(21) 90000-0000"
                        />
                      </div>
                      <div>
                        <Rotulo ajuda="opcional">Onde posso esperar</Rotulo>
                        <CampoTexto
                          value={formPedido.ponto}
                          onChange={(e) => setFormPedido({ ...formPedido, ponto: e.target.value })}
                          maxLength={200}
                          placeholder="Ex.: em frente à padaria da rua principal"
                        />
                      </div>
                      <div>
                        <Rotulo ajuda="opcional">Mensagem</Rotulo>
                        <CampoArea
                          rows={2}
                          value={formPedido.mensagem}
                          onChange={(e) =>
                            setFormPedido({ ...formPedido, mensagem: e.target.value })
                          }
                          maxLength={600}
                        />
                      </div>
                      <div className="flex gap-2">
                        <BotaoPrimario onClick={() => pedirVaga(c.id)} disabled={ocupado === c.id}>
                          {ocupado === c.id ? "Enviando…" : "Enviar pedido"}
                        </BotaoPrimario>
                        <BotaoDiscreto onClick={() => setPedindo(null)}>Cancelar</BotaoDiscreto>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </PaginaComunidade>
  );
}
