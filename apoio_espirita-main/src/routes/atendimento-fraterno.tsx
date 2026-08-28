import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Eye, Lock, Plus, Search, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { mensagemDeErro } from "@/lib/erros";
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
  PaginaComunidade,
  Rotulo,
  Vazio,
} from "@/components/Comunidade";

export const Route = createFileRoute("/atendimento-fraterno")({
  component: AtendimentoFraterno,
});

/** Cargos que dão acesso pelo próprio cargo, sem autorização nominal. */
const CARGOS_DE_ATENDIMENTO = ["Coordenador", "Atendente fraterno"];

interface Ficha {
  id: string;
  sigla_casa: string;
  atendido_nome: string;
  atendido_contato: string | null;
  data_atendimento: string;
  tipo: string;
  relato: string;
  encaminhamento: string | null;
  retorno_em: string | null;
  concluida: boolean;
  criado_por: string;
  autor_nome: string;
  created_at: string;
}

interface Autorizado {
  id: string;
  user_id: string;
  nome: string | null;
}

const hojeISO = () => new Date().toISOString().slice(0, 10);

function AtendimentoFraterno() {
  const { user, profile, isPresident } = useAuth();
  const [aba, setAba] = useState<"fichas" | "acesso">("fichas");
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [autorizados, setAutorizados] = useState<Autorizado[]>([]);
  const [membros, setMembros] = useState<{ id: string; nome: string | null }[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [aberta, setAberta] = useState<string | null>(null);

  const [criando, setCriando] = useState(false);
  const [form, setForm] = useState({
    atendido_nome: "",
    atendido_contato: "",
    data_atendimento: hojeISO(),
    tipo: "primeira",
    relato: "",
    encaminhamento: "",
    retorno_em: "",
  });

  const souDoCargo = CARGOS_DE_ATENDIMENTO.includes(profile?.cargo_principal ?? "");
  const souAutorizado = autorizados.some((a) => a.user_id === user?.id);
  const podeAtender = souDoCargo || souAutorizado;

  const carregar = useCallback(async () => {
    setCarregando(true);
    const [a, f] = await Promise.all([
      supabase.from("atendimento_autorizados").select("id, user_id, nome"),
      supabase
        .from("atendimento_fichas")
        .select(
          "id, sigla_casa, atendido_nome, atendido_contato, data_atendimento, tipo, relato, encaminhamento, retorno_em, concluida, criado_por, autor_nome, created_at",
        )
        .order("data_atendimento", { ascending: false }),
    ]);
    setAutorizados((a.data as Autorizado[]) ?? []);
    setFichas((f.data as Ficha[]) ?? []);
    setCarregando(false);
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const carregarMembros = useCallback(async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, nome")
      .eq("sigla_casa", profile?.sigla_casa ?? "")
      .order("nome");
    setMembros(data ?? []);
  }, [profile?.sigla_casa]);

  useEffect(() => {
    if (aba === "acesso" && isPresident) void carregarMembros();
  }, [aba, isPresident, carregarMembros]);

  async function salvarFicha(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (form.atendido_nome.trim().length < 2 || form.relato.trim().length < 5) {
      setErro("Informe o nome de quem foi atendido e o relato.");
      return;
    }
    setOcupado("ficha");
    const { error } = await supabase.from("atendimento_fichas").insert({
      sigla_casa: profile?.sigla_casa ?? "",
      atendido_nome: form.atendido_nome.trim(),
      atendido_contato: form.atendido_contato.trim() || null,
      data_atendimento: form.data_atendimento,
      tipo: form.tipo,
      relato: form.relato.trim(),
      encaminhamento: form.encaminhamento.trim() || null,
      retorno_em: form.retorno_em || null,
      criado_por: user?.id ?? "",
      autor_nome: profile?.nome ?? "",
    });
    setOcupado(null);
    if (error) {
      setErro(mensagemDeErro(error));
      return;
    }
    setForm({
      atendido_nome: "",
      atendido_contato: "",
      data_atendimento: hojeISO(),
      tipo: "primeira",
      relato: "",
      encaminhamento: "",
      retorno_em: "",
    });
    setCriando(false);
    await carregar();
  }

  /** Abrir uma ficha deixa registro: dado sigiloso pede prestação de contas. */
  async function abrirFicha(f: Ficha) {
    setAberta(aberta === f.id ? null : f.id);
    if (aberta === f.id) return;
    await supabase.from("atendimento_acessos").insert({
      ficha_id: f.id,
      sigla_casa: f.sigla_casa,
      user_id: user?.id ?? "",
      user_nome: profile?.nome ?? null,
    });
  }

  async function concluir(f: Ficha) {
    setOcupado(f.id);
    const { error } = await supabase
      .from("atendimento_fichas")
      .update({ concluida: !f.concluida })
      .eq("id", f.id);
    setOcupado(null);
    if (error) {
      setErro(mensagemDeErro(error));
      return;
    }
    await carregar();
  }

  async function apagar(id: string) {
    setOcupado(id);
    const { error } = await supabase.from("atendimento_fichas").delete().eq("id", id);
    setOcupado(null);
    if (error) {
      setErro(mensagemDeErro(error));
      return;
    }
    await carregar();
  }

  async function autorizar(pessoa: { id: string; nome: string | null }) {
    setOcupado(pessoa.id);
    const { error } = await supabase.from("atendimento_autorizados").insert({
      sigla_casa: profile?.sigla_casa ?? "",
      user_id: pessoa.id,
      nome: pessoa.nome,
      criado_por: user?.id ?? "",
    });
    setOcupado(null);
    if (error) {
      setErro(mensagemDeErro(error));
      return;
    }
    await carregar();
  }

  async function revogar(id: string) {
    setOcupado(id);
    const { error } = await supabase.from("atendimento_autorizados").delete().eq("id", id);
    setOcupado(null);
    if (error) {
      setErro(mensagemDeErro(error));
      return;
    }
    await carregar();
  }

  const termo = busca.trim().toLowerCase();
  const lista = termo
    ? fichas.filter((f) => f.atendido_nome.toLowerCase().includes(termo))
    : fichas;

  if (carregando) {
    return (
      <PaginaComunidade
        secao="Nossa comunidade"
        titulo="Ficha de"
        destaque="Atendimento Fraterno"
        descricao="Registro confidencial dos atendimentos da casa."
      >
        <p className="text-center text-muted-foreground/50 py-12 font-light">Carregando…</p>
      </PaginaComunidade>
    );
  }

  if (!podeAtender && !isPresident) {
    return (
      <PaginaComunidade
        secao="Nossa comunidade"
        titulo="Ficha de"
        destaque="Atendimento Fraterno"
        descricao="Registro confidencial dos atendimentos da casa."
      >
        <Cartao className="text-center space-y-4">
          <div className="flex justify-center">
            <Lock size={30} strokeWidth={1.5} className="text-cyan-glow" />
          </div>
          <h2 className="text-lg font-medium text-foreground">Esta área é reservada</h2>
          <p className="text-sm text-muted-foreground font-light max-w-md mx-auto">
            O que uma pessoa conta em atendimento fraterno é confiado a quem a atendeu. Só leem
            estas fichas o Atendente fraterno e o Coordenador da casa, além de quem a direção
            autorizar nominalmente — nem a presidência entra sem essa autorização, e o desenvolvedor
            da plataforma também não.
          </p>
          <p className="text-sm text-muted-foreground font-light">
            Se você atende na sua casa, peça à direção para autorizar o seu acesso.
          </p>
        </Cartao>
      </PaginaComunidade>
    );
  }

  return (
    <PaginaComunidade
      secao="Nossa comunidade"
      titulo="Ficha de"
      destaque="Atendimento Fraterno"
      descricao="Registro confidencial dos atendimentos da casa. Cada abertura de ficha fica registrada, e o conteúdo nunca sai daqui."
    >
      <div className="space-y-6">
        {erro && <Aviso tipo="erro">{erro}</Aviso>}

        <Aviso tipo="nota">
          Escreva o necessário para o acompanhamento, e nada além. Quem procura a casa em sofrimento
          confia no sigilo — o registro serve ao cuidado, não à curiosidade.
        </Aviso>

        {isPresident && (
          <Abas
            abas={[
              { id: "fichas", rotulo: "Fichas" },
              { id: "acesso", rotulo: "Quem tem acesso" },
            ]}
            atual={aba}
            aoTrocar={setAba}
          />
        )}

        {aba === "acesso" && isPresident ? (
          <div className="space-y-5">
            <Cartao>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-glow mb-3">
                Autorizados nesta casa
              </p>
              {autorizados.length === 0 ? (
                <p className="text-sm text-muted-foreground font-light">
                  Ninguém foi autorizado nominalmente. Quem tem o cargo de Atendente fraterno ou
                  Coordenador já entra pelo próprio cargo.
                </p>
              ) : (
                <div className="space-y-2">
                  {autorizados.map((a) => (
                    <div key={a.id} className="flex items-center justify-between gap-2">
                      <p className="text-sm text-foreground inline-flex items-center gap-2">
                        <ShieldCheck size={14} strokeWidth={1.6} className="text-emerald-600" />
                        {a.nome ?? "Membro"}
                      </p>
                      <BotaoDiscreto onClick={() => revogar(a.id)} disabled={ocupado === a.id}>
                        Retirar acesso
                      </BotaoDiscreto>
                    </div>
                  ))}
                </div>
              )}
            </Cartao>

            <Cartao>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-glow mb-3">
                Autorizar alguém da casa
              </p>
              <div className="flex flex-wrap gap-2">
                {membros
                  .filter((m) => !autorizados.some((a) => a.user_id === m.id))
                  .map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => autorizar(m)}
                      disabled={ocupado === m.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border border-border hover:border-cyan-glow/40 hover:text-cyan-glow transition-colors disabled:opacity-40"
                    >
                      <UserPlus size={12} strokeWidth={1.8} />
                      {m.nome ?? "Membro"}
                    </button>
                  ))}
              </div>
            </Cartao>
          </div>
        ) : !podeAtender ? (
          <Cartao className="text-center">
            <p className="text-sm text-muted-foreground font-light">
              Você administra a página da casa e pode definir quem tem acesso, mas não lê as fichas
              — para isso é preciso ter o cargo de atendimento ou uma autorização nominal, que
              também fica registrada.
            </p>
          </Cartao>
        ) : (
          <>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50"
                />
                <input
                  type="search"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar pelo nome de quem foi atendido"
                  className="w-full h-10 rounded-xl bg-white/60 border border-border pl-9 pr-3 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-cyan-glow/40 transition-colors"
                />
              </div>
              <BotaoPrimario onClick={() => setCriando((v) => !v)}>
                <span className="inline-flex items-center gap-2">
                  <Plus size={13} strokeWidth={2} /> {criando ? "Fechar" : "Nova ficha"}
                </span>
              </BotaoPrimario>
            </div>

            {criando && (
              <Cartao>
                <form onSubmit={salvarFicha} className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Rotulo obrigatorio>Quem foi atendido</Rotulo>
                      <CampoTexto
                        value={form.atendido_nome}
                        onChange={(e) => setForm({ ...form, atendido_nome: e.target.value })}
                        maxLength={160}
                      />
                    </div>
                    <div>
                      <Rotulo ajuda="opcional">Contato</Rotulo>
                      <CampoTexto
                        value={form.atendido_contato}
                        onChange={(e) => setForm({ ...form, atendido_contato: e.target.value })}
                        maxLength={120}
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <Rotulo obrigatorio>Data</Rotulo>
                      <CampoTexto
                        type="date"
                        value={form.data_atendimento}
                        onChange={(e) => setForm({ ...form, data_atendimento: e.target.value })}
                      />
                    </div>
                    <div>
                      <Rotulo>Tipo</Rotulo>
                      <CampoSelecao
                        value={form.tipo}
                        onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                      >
                        <option value="primeira">Primeira vez</option>
                        <option value="retorno">Retorno</option>
                      </CampoSelecao>
                    </div>
                    <div>
                      <Rotulo ajuda="opcional">Retornar em</Rotulo>
                      <CampoTexto
                        type="date"
                        value={form.retorno_em}
                        onChange={(e) => setForm({ ...form, retorno_em: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Rotulo obrigatorio>Relato</Rotulo>
                    <CampoArea
                      rows={6}
                      value={form.relato}
                      onChange={(e) => setForm({ ...form, relato: e.target.value })}
                      maxLength={8000}
                      placeholder="O essencial para o acompanhamento."
                    />
                  </div>
                  <div>
                    <Rotulo ajuda="orientação dada, encaminhamento, providências">
                      Encaminhamento
                    </Rotulo>
                    <CampoArea
                      rows={3}
                      value={form.encaminhamento}
                      onChange={(e) => setForm({ ...form, encaminhamento: e.target.value })}
                      maxLength={2000}
                    />
                  </div>
                  <BotaoPrimario type="submit" disabled={ocupado === "ficha"}>
                    {ocupado === "ficha" ? "Salvando…" : "Salvar ficha"}
                  </BotaoPrimario>
                </form>
              </Cartao>
            )}

            {lista.length === 0 ? (
              <Vazio texto="Nenhuma ficha registrada." />
            ) : (
              <div className="space-y-2">
                {lista.map((f) => (
                  <article key={f.id} className="glass rounded-2xl p-5">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <p className="text-foreground">{f.atendido_nome}</p>
                        <p className="text-xs text-muted-foreground/70 mt-1">
                          {new Date(f.data_atendimento + "T12:00:00Z").toLocaleDateString("pt-BR")}{" "}
                          · {f.tipo === "retorno" ? "Retorno" : "Primeira vez"} · {f.autor_nome}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {f.concluida && <Etiqueta tom="verde">Concluído</Etiqueta>}
                        {f.retorno_em && !f.concluida && (
                          <Etiqueta tom="ambar">
                            Retorno em{" "}
                            {new Date(f.retorno_em + "T12:00:00Z").toLocaleDateString("pt-BR")}
                          </Etiqueta>
                        )}
                        <BotaoDiscreto onClick={() => abrirFicha(f)}>
                          <span className="inline-flex items-center gap-1.5">
                            <Eye size={13} strokeWidth={1.8} />
                            {aberta === f.id ? "Fechar" : "Abrir"}
                          </span>
                        </BotaoDiscreto>
                      </div>
                    </div>

                    {aberta === f.id && (
                      <div className="mt-4 pt-4 border-t border-border/40 space-y-4">
                        {f.atendido_contato && (
                          <p className="text-sm text-muted-foreground">
                            Contato: {f.atendido_contato}
                          </p>
                        )}
                        <div>
                          <p className="text-[11px] uppercase tracking-widest text-muted-foreground/60 mb-1">
                            Relato
                          </p>
                          <p className="text-sm text-foreground/90 font-light whitespace-pre-wrap leading-relaxed">
                            {f.relato}
                          </p>
                        </div>
                        {f.encaminhamento && (
                          <div>
                            <p className="text-[11px] uppercase tracking-widest text-muted-foreground/60 mb-1">
                              Encaminhamento
                            </p>
                            <p className="text-sm text-foreground/90 font-light whitespace-pre-wrap">
                              {f.encaminhamento}
                            </p>
                          </div>
                        )}
                        <div className="flex gap-2 justify-end">
                          <BotaoDiscreto onClick={() => concluir(f)} disabled={ocupado === f.id}>
                            {f.concluida ? "Reabrir acompanhamento" : "Marcar concluído"}
                          </BotaoDiscreto>
                          {f.criado_por === user?.id && (
                            <BotaoDiscreto onClick={() => apagar(f.id)} disabled={ocupado === f.id}>
                              <Trash2 size={13} strokeWidth={1.8} />
                            </BotaoDiscreto>
                          )}
                        </div>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </PaginaComunidade>
  );
}
