import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { CalendarClock, MapPin, PackageCheck, Plus, Trash2, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { mensagemDeErro } from "@/lib/erros";
import { validarLinguagem } from "@/lib/linguagem";
import {
  Abas,
  Aviso,
  BotaoDiscreto,
  BotaoPrimario,
  CampoArea,
  CampoSelecao,
  CampoTexto,
  Cartao,
  Etiqueta,
  MarcaAlcance,
  PaginaComunidade,
  Rotulo,
  Vazio,
  quandoFoi,
} from "@/components/Comunidade";

export const Route = createFileRoute("/entregas")({
  component: Entregas,
});

interface Entrega {
  id: string;
  sigla_casa: string;
  item_id: string | null;
  reserva_id: string | null;
  descricao: string;
  bairro: string | null;
  referencia: string | null;
  status: string;
  voluntario: string | null;
  voluntario_nome: string | null;
  agendada_para: string | null;
  aberto: boolean;
  criado_por: string;
  autor_nome: string;
  created_at: string;
}

interface Contato {
  entrega_id: string;
  contato_pedinte: string;
  contato_voluntario: string | null;
}

interface ReservaMinha {
  id: string;
  item_id: string;
  status: string;
  titulo: string;
}

const ESTADOS: Record<string, { rotulo: string; tom: "ambar" | "ciano" | "verde" | "neutro" }> = {
  aberta: { rotulo: "Procurando voluntário", tom: "ambar" },
  assumida: { rotulo: "Voluntário a caminho", tom: "ciano" },
  entregue: { rotulo: "Entregue", tom: "verde" },
  cancelada: { rotulo: "Cancelada", tom: "neutro" },
};

function Entregas() {
  const { user, profile, isPresident } = useAuth();
  const [aba, setAba] = useState<"abertas" | "minhas" | "assumidas">("abertas");
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [contatos, setContatos] = useState<Record<string, Contato>>({});
  const [reservas, setReservas] = useState<ReservaMinha[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);

  const [criando, setCriando] = useState(false);
  const [form, setForm] = useState({
    descricao: "",
    bairro: "",
    referencia: "",
    contato: "",
    reserva: "",
    aberto: false,
  });

  const [assumindo, setAssumindo] = useState<string | null>(null);
  const [contatoVoluntario, setContatoVoluntario] = useState("");
  const [agendamento, setAgendamento] = useState<Record<string, string>>({});

  const carregar = useCallback(async () => {
    setCarregando(true);
    const [e, c] = await Promise.all([
      supabase
        .from("entregas")
        .select(
          "id, sigla_casa, item_id, reserva_id, descricao, bairro, referencia, status, voluntario, voluntario_nome, agendada_para, aberto, criado_por, autor_nome, created_at",
        )
        .order("created_at", { ascending: false }),
      supabase.from("entrega_contatos").select("entrega_id, contato_pedinte, contato_voluntario"),
    ]);
    if (e.error) setErro(mensagemDeErro(e.error));
    setEntregas((e.data as Entrega[]) ?? []);
    setContatos(Object.fromEntries(((c.data as Contato[]) ?? []).map((x) => [x.entrega_id, x])));

    // Reservas aceitas do bazar: são o caso mais comum de pedido de entrega, e
    // já vêm prontas para escolher em vez de o usuário redigitar o que comprou.
    const { data: r } = await supabase
      .from("bazar_reservas")
      .select("id, item_id, status, bazar_itens(titulo)")
      .eq("criado_por", user?.id ?? "")
      .in("status", ["aceita", "concluida"]);
    setReservas(
      (
        (r ?? []) as unknown as {
          id: string;
          item_id: string;
          status: string;
          bazar_itens: { titulo: string } | null;
        }[]
      ).map((x) => ({
        id: x.id,
        item_id: x.item_id,
        status: x.status,
        titulo: x.bazar_itens?.titulo ?? "Item do bazar",
      })),
    );
    setCarregando(false);
  }, [user?.id]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function pedir(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (form.descricao.trim().length < 5) {
      setErro("Descreva o que precisa ser entregue.");
      return;
    }
    if (form.contato.trim().length < 5) {
      setErro("Informe um contato — ele aparece só para o voluntário que assumir.");
      return;
    }
    const problema = validarLinguagem(form.descricao, form.referencia);
    if (problema) {
      setErro(problema);
      return;
    }
    const reservaEscolhida = reservas.find((r) => r.id === form.reserva);
    setOcupado("pedir");
    const { data, error } = await supabase
      .from("entregas")
      .insert({
        sigla_casa: profile?.sigla_casa ?? "",
        descricao: form.descricao.trim(),
        bairro: form.bairro.trim() || null,
        referencia: form.referencia.trim() || null,
        reserva_id: reservaEscolhida?.id ?? null,
        item_id: reservaEscolhida?.item_id ?? null,
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
      .from("entrega_contatos")
      .insert({ entrega_id: data.id, contato_pedinte: form.contato.trim() });
    setOcupado(null);
    if (falhaContato) {
      setErro(mensagemDeErro(falhaContato));
      return;
    }
    setForm({ ...form, descricao: "", bairro: "", referencia: "", reserva: "" });
    setCriando(false);
    await carregar();
  }

  async function assumir(entrega: Entrega) {
    setErro(null);
    if (contatoVoluntario.trim().length < 5) {
      setErro("Informe um contato para quem pediu falar com você.");
      return;
    }
    setOcupado(entrega.id);
    const { error } = await supabase
      .from("entregas")
      .update({ status: "assumida" })
      .eq("id", entrega.id);
    if (error) {
      setOcupado(null);
      setErro(mensagemDeErro(error));
      return;
    }
    const { error: falhaContato } = await supabase
      .from("entrega_contatos")
      .update({ contato_voluntario: contatoVoluntario.trim() })
      .eq("entrega_id", entrega.id);
    setOcupado(null);
    if (falhaContato) {
      setErro(mensagemDeErro(falhaContato));
      return;
    }
    setAssumindo(null);
    setContatoVoluntario("");
    await carregar();
  }

  async function mudarStatus(id: string, status: string) {
    setOcupado(id);
    const { error } = await supabase.from("entregas").update({ status }).eq("id", id);
    setOcupado(null);
    if (error) {
      setErro(mensagemDeErro(error));
      return;
    }
    await carregar();
  }

  async function agendar(id: string) {
    const quando = agendamento[id];
    if (!quando) return;
    setOcupado(id);
    const { error } = await supabase
      .from("entregas")
      .update({ agendada_para: new Date(quando).toISOString() })
      .eq("id", id);
    setOcupado(null);
    if (error) {
      setErro(mensagemDeErro(error));
      return;
    }
    await carregar();
  }

  async function apagar(id: string) {
    setOcupado(id);
    const { error } = await supabase.from("entregas").delete().eq("id", id);
    setOcupado(null);
    if (error) {
      setErro(mensagemDeErro(error));
      return;
    }
    await carregar();
  }

  const abertas = entregas.filter((e) => e.status === "aberta");
  const minhas = entregas.filter((e) => e.criado_por === user?.id);
  const assumidas = entregas.filter((e) => e.voluntario === user?.id);
  const lista = aba === "abertas" ? abertas : aba === "minhas" ? minhas : assumidas;

  return (
    <PaginaComunidade
      secao="Nossa comunidade"
      titulo="Entrega"
      destaque="Solidária"
      descricao="Quem não pode buscar pede; quem pode levar assume. Serve para os itens do bazar e para qualquer coisa que precise chegar a alguém — o endereço completo é combinado direto entre as duas pessoas, nunca fica publicado."
    >
      <div className="space-y-6">
        {erro && <Aviso tipo="erro">{erro}</Aviso>}

        <Abas
          abas={[
            { id: "abertas", rotulo: `Precisam de voluntário (${abertas.length})` },
            { id: "minhas", rotulo: `Meus pedidos (${minhas.length})` },
            { id: "assumidas", rotulo: `Assumi (${assumidas.length})` },
          ]}
          atual={aba}
          aoTrocar={setAba}
        />

        <div className="flex justify-end">
          <BotaoPrimario onClick={() => setCriando((v) => !v)}>
            <span className="inline-flex items-center gap-2">
              <Plus size={13} strokeWidth={2} /> {criando ? "Fechar" : "Pedir uma entrega"}
            </span>
          </BotaoPrimario>
        </div>

        {criando && (
          <Cartao>
            <form onSubmit={pedir} className="space-y-5">
              {reservas.length > 0 && (
                <div>
                  <Rotulo ajuda="opcional — liga esta entrega a uma compra sua">
                    Item do bazar
                  </Rotulo>
                  <CampoSelecao
                    value={form.reserva}
                    onChange={(e) => setForm({ ...form, reserva: e.target.value })}
                  >
                    <option value="">Não é do bazar</option>
                    {reservas.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.titulo}
                      </option>
                    ))}
                  </CampoSelecao>
                </div>
              )}
              <div>
                <Rotulo obrigatorio>O que precisa ser entregue</Rotulo>
                <CampoArea
                  rows={3}
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  maxLength={600}
                  placeholder="Ex.: duas caixas de livros da biblioteca para uma irmã acamada."
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Rotulo>Bairro</Rotulo>
                  <CampoTexto
                    value={form.bairro}
                    onChange={(e) => setForm({ ...form, bairro: e.target.value })}
                    maxLength={120}
                  />
                </div>
                <div>
                  <Rotulo obrigatorio ajuda="só para quem assumir">
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
                <Rotulo ajuda="ponto de referência — o endereço completo você combina por contato">
                  Referência
                </Rotulo>
                <CampoTexto
                  value={form.referencia}
                  onChange={(e) => setForm({ ...form, referencia: e.target.value })}
                  maxLength={300}
                  placeholder="Ex.: próximo à praça, prédio azul"
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

              <BotaoPrimario type="submit" disabled={ocupado === "pedir"}>
                {ocupado === "pedir" ? "Publicando…" : "Publicar pedido"}
              </BotaoPrimario>
            </form>
          </Cartao>
        )}

        {carregando ? (
          <p className="text-center text-muted-foreground/50 py-12 font-light">Carregando…</p>
        ) : lista.length === 0 ? (
          <Vazio
            texto={
              aba === "abertas"
                ? "Nenhuma entrega esperando voluntário."
                : aba === "minhas"
                  ? "Você não pediu nenhuma entrega."
                  : "Você ainda não assumiu nenhuma entrega."
            }
          />
        ) : (
          <div className="space-y-3">
            {lista.map((e) => {
              const estado = ESTADOS[e.status] ?? ESTADOS.aberta;
              const souPedinte = e.criado_por === user?.id;
              const souVoluntario = e.voluntario === user?.id;
              const contato = contatos[e.id];
              return (
                <article key={e.id} className="glass rounded-2xl p-5">
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <Etiqueta tom={estado.tom}>{estado.rotulo}</Etiqueta>
                    <MarcaAlcance aberto={e.aberto} />
                    {e.agendada_para && (
                      <span className="text-xs text-muted-foreground/70 inline-flex items-center gap-1">
                        <CalendarClock size={11} strokeWidth={1.8} />
                        {new Date(e.agendada_para).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>

                  <p className="text-foreground font-light whitespace-pre-wrap">{e.descricao}</p>

                  {(e.bairro || e.referencia) && (
                    <p className="mt-2 text-sm text-muted-foreground flex items-start gap-1.5">
                      <MapPin size={13} strokeWidth={1.6} className="mt-0.5 shrink-0" />
                      <span>{[e.bairro, e.referencia].filter(Boolean).join(" · ")}</span>
                    </p>
                  )}

                  <p className="mt-3 text-xs text-muted-foreground/60">
                    Pedido por {e.autor_nome} · {quandoFoi(e.created_at)}
                    {e.voluntario_nome && ` · Voluntário: ${e.voluntario_nome}`}
                  </p>

                  {contato && (souPedinte || souVoluntario) && (
                    <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 space-y-1">
                      <p className="text-[11px] uppercase tracking-widest text-emerald-700">
                        Contatos liberados
                      </p>
                      <p className="text-sm text-emerald-800">
                        Quem pediu: {contato.contato_pedinte}
                      </p>
                      {contato.contato_voluntario && (
                        <p className="text-sm text-emerald-800">
                          Voluntário: {contato.contato_voluntario}
                        </p>
                      )}
                    </div>
                  )}

                  {souVoluntario && e.status === "assumida" && (
                    <div className="mt-4 pt-3 border-t border-border/40 flex items-end gap-2 flex-wrap">
                      <div className="flex-1 min-w-[200px]">
                        <Rotulo>Combinar dia e hora</Rotulo>
                        <CampoTexto
                          type="datetime-local"
                          value={agendamento[e.id] ?? ""}
                          onChange={(ev) =>
                            setAgendamento({ ...agendamento, [e.id]: ev.target.value })
                          }
                        />
                      </div>
                      <BotaoDiscreto
                        onClick={() => agendar(e.id)}
                        disabled={ocupado === e.id || !agendamento[e.id]}
                      >
                        Agendar
                      </BotaoDiscreto>
                    </div>
                  )}

                  <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-end gap-2 flex-wrap">
                    {e.status === "aberta" && !souPedinte && (
                      <BotaoPrimario onClick={() => setAssumindo(e.id)}>
                        <span className="inline-flex items-center gap-1.5">
                          <Truck size={13} strokeWidth={1.8} /> Assumir a entrega
                        </span>
                      </BotaoPrimario>
                    )}
                    {souVoluntario && e.status === "assumida" && (
                      <>
                        <BotaoPrimario
                          onClick={() => mudarStatus(e.id, "entregue")}
                          disabled={ocupado === e.id}
                        >
                          <span className="inline-flex items-center gap-1.5">
                            <PackageCheck size={13} strokeWidth={1.8} /> Confirmar entrega
                          </span>
                        </BotaoPrimario>
                        <BotaoDiscreto
                          onClick={() => mudarStatus(e.id, "aberta")}
                          disabled={ocupado === e.id}
                        >
                          Não vou conseguir
                        </BotaoDiscreto>
                      </>
                    )}
                    {souPedinte && e.status !== "entregue" && (
                      <BotaoDiscreto
                        onClick={() => mudarStatus(e.id, "cancelada")}
                        disabled={ocupado === e.id}
                      >
                        Cancelar
                      </BotaoDiscreto>
                    )}
                    {(souPedinte || isPresident) && (
                      <BotaoDiscreto onClick={() => apagar(e.id)} disabled={ocupado === e.id}>
                        <Trash2 size={13} strokeWidth={1.8} />
                      </BotaoDiscreto>
                    )}
                  </div>

                  {assumindo === e.id && (
                    <div className="mt-4 pt-4 border-t border-border/40 space-y-3">
                      <Rotulo obrigatorio ajuda="visível só para quem pediu">
                        Seu contato
                      </Rotulo>
                      <CampoTexto
                        value={contatoVoluntario}
                        onChange={(ev) => setContatoVoluntario(ev.target.value)}
                        maxLength={120}
                        placeholder="(21) 90000-0000"
                      />
                      <div className="flex gap-2">
                        <BotaoPrimario onClick={() => assumir(e)} disabled={ocupado === e.id}>
                          {ocupado === e.id ? "Assumindo…" : "Confirmar"}
                        </BotaoPrimario>
                        <BotaoDiscreto onClick={() => setAssumindo(null)}>Cancelar</BotaoDiscreto>
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
