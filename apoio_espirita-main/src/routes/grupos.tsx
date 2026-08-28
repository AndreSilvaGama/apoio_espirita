import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Lock, Plus, Send, Trash2, UserPlus, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { mensagemDeErro } from "@/lib/erros";
import { validarLinguagem } from "@/lib/linguagem";
import {
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
  iniciais,
  quandoFoi,
} from "@/components/Comunidade";

export const Route = createFileRoute("/grupos")({
  validateSearch: (search: Record<string, unknown>): { grupo?: string } => ({
    grupo: typeof search.grupo === "string" ? search.grupo : undefined,
  }),
  component: Grupos,
});

interface Grupo {
  id: string;
  sigla_casa: string;
  nome: string;
  descricao: string | null;
  atividade: string | null;
  privado: boolean;
  aberto: boolean;
  criado_por: string;
  autor_nome: string;
}

interface MembroGrupo {
  id: string;
  grupo_id: string;
  user_id: string;
  nome: string;
  papel: string;
}

interface Mensagem {
  id: string;
  grupo_id: string;
  texto: string;
  criado_por: string;
  autor_nome: string;
  created_at: string;
}

const ATIVIDADES = [
  "Assistência social",
  "Atendimento fraterno",
  "Comunicação",
  "Estudo",
  "Evangelização infantil",
  "Juventude",
  "Manutenção",
  "Mediunidade",
  "Música",
  "Secretaria",
  "Tesouraria",
  "Outra",
];

function Grupos() {
  const navigate = useNavigate();
  const { grupo: grupoAberto } = Route.useSearch();
  const { user, profile } = useAuth();

  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [membros, setMembros] = useState<MembroGrupo[]>([]);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);

  const [criando, setCriando] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    atividade: "Estudo",
    privado: false,
    aberto: false,
  });
  const [texto, setTexto] = useState("");
  const fimDaConversa = useRef<HTMLDivElement>(null);

  const [candidatos, setCandidatos] = useState<{ id: string; nome: string | null }[]>([]);
  const [mostrarConvite, setMostrarConvite] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const [g, m] = await Promise.all([
      supabase
        .from("grupos")
        .select(
          "id, sigla_casa, nome, descricao, atividade, privado, aberto, criado_por, autor_nome",
        )
        .order("created_at", { ascending: false }),
      supabase.from("grupo_membros").select("id, grupo_id, user_id, nome, papel"),
    ]);
    if (g.error) setErro(mensagemDeErro(g.error));
    setGrupos((g.data as Grupo[]) ?? []);
    setMembros((m.data as MembroGrupo[]) ?? []);
    setCarregando(false);
  }, []);

  const carregarMensagens = useCallback(async (id: string) => {
    const { data } = await supabase
      .from("grupo_mensagens")
      .select("id, grupo_id, texto, criado_por, autor_nome, created_at")
      .eq("grupo_id", id)
      .order("created_at");
    setMensagens((data as Mensagem[]) ?? []);
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  useEffect(() => {
    if (!grupoAberto) return;
    void carregarMensagens(grupoAberto);

    // Conversa ao vivo: sem isto, a mensagem do outro só apareceria ao
    // recarregar a página. O canal respeita as políticas do banco — chega
    // apenas o que esta pessoa já poderia ler.
    const canal = supabase
      .channel(`grupo-${grupoAberto}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "grupo_mensagens",
          filter: `grupo_id=eq.${grupoAberto}`,
        },
        (payload) => {
          const nova = payload.new as Mensagem;
          setMensagens((atuais) =>
            atuais.some((m) => m.id === nova.id) ? atuais : [...atuais, nova],
          );
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(canal);
    };
  }, [grupoAberto, carregarMensagens]);

  useEffect(() => {
    fimDaConversa.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [mensagens.length]);

  async function criarGrupo(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (form.nome.trim().length < 3) {
      setErro("Dê um nome ao grupo (pelo menos 3 caracteres).");
      return;
    }
    const problema = validarLinguagem(form.nome, form.descricao);
    if (problema) {
      setErro(problema);
      return;
    }
    setOcupado("criar");
    const { data, error } = await supabase
      .from("grupos")
      .insert({
        sigla_casa: profile?.sigla_casa ?? "",
        nome: form.nome.trim(),
        descricao: form.descricao.trim() || null,
        atividade: form.atividade,
        privado: form.privado,
        aberto: form.privado ? false : form.aberto,
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
    // Quem cria entra como moderador — o gatilho do banco cuida do papel.
    await supabase.from("grupo_membros").insert({
      grupo_id: data.id,
      sigla_casa: profile?.sigla_casa ?? "",
      user_id: user?.id ?? "",
      nome: profile?.nome ?? "",
      adicionado_por: user?.id ?? "",
    });
    setOcupado(null);
    setForm({ nome: "", descricao: "", atividade: "Estudo", privado: false, aberto: false });
    setCriando(false);
    await carregar();
  }

  async function entrar(id: string) {
    setOcupado(id);
    const { error } = await supabase.from("grupo_membros").insert({
      grupo_id: id,
      sigla_casa: profile?.sigla_casa ?? "",
      user_id: user?.id ?? "",
      nome: profile?.nome ?? "",
      adicionado_por: user?.id ?? "",
    });
    setOcupado(null);
    if (error) {
      setErro(mensagemDeErro(error));
      return;
    }
    await carregar();
  }

  async function sair(membroId: string) {
    setOcupado(membroId);
    const { error } = await supabase.from("grupo_membros").delete().eq("id", membroId);
    setOcupado(null);
    if (error) {
      setErro(mensagemDeErro(error));
      return;
    }
    await carregar();
  }

  async function enviar(id: string) {
    const limpo = texto.trim();
    if (!limpo) return;
    const problema = validarLinguagem(limpo);
    if (problema) {
      setErro(problema);
      return;
    }
    setTexto("");
    const { error } = await supabase.from("grupo_mensagens").insert({
      grupo_id: id,
      sigla_casa: profile?.sigla_casa ?? "",
      texto: limpo,
      criado_por: user?.id ?? "",
      autor_nome: profile?.nome ?? "",
    });
    if (error) {
      setErro(mensagemDeErro(error));
      setTexto(limpo);
      return;
    }
    await carregarMensagens(id);
  }

  async function apagarGrupo(id: string) {
    setOcupado(id);
    const { error } = await supabase.from("grupos").delete().eq("id", id);
    setOcupado(null);
    if (error) {
      setErro(mensagemDeErro(error));
      return;
    }
    navigate({ to: "/grupos", search: { grupo: undefined } });
    await carregar();
  }

  async function carregarCandidatos(id: string) {
    const jaEstao = new Set(membros.filter((m) => m.grupo_id === id).map((m) => m.user_id));
    const { data } = await supabase
      .from("profiles")
      .select("id, nome")
      .eq("sigla_casa", profile?.sigla_casa ?? "")
      .order("nome");
    setCandidatos((data ?? []).filter((p) => !jaEstao.has(p.id)));
    setMostrarConvite(true);
  }

  async function adicionar(grupoId: string, pessoa: { id: string; nome: string | null }) {
    setOcupado(pessoa.id);
    const { error } = await supabase.from("grupo_membros").insert({
      grupo_id: grupoId,
      sigla_casa: profile?.sigla_casa ?? "",
      user_id: pessoa.id,
      nome: pessoa.nome ?? "Membro",
      adicionado_por: user?.id ?? "",
    });
    setOcupado(null);
    if (error) {
      setErro(mensagemDeErro(error));
      return;
    }
    setCandidatos((c) => c.filter((p) => p.id !== pessoa.id));
    await carregar();
  }

  const atual = grupos.find((g) => g.id === grupoAberto);

  /* ── Conversa de um grupo ── */
  if (atual) {
    const doGrupo = membros.filter((m) => m.grupo_id === atual.id);
    const souMembro = doGrupo.find((m) => m.user_id === user?.id);
    const souModerador = souMembro?.papel === "moderador" || atual.criado_por === user?.id;

    return (
      <PaginaComunidade
        secao="Nossa comunidade"
        titulo="Grupo"
        destaque={atual.nome}
        descricao={atual.descricao ?? "Conversa do grupo."}
      >
        <div className="space-y-5">
          {erro && <Aviso tipo="erro">{erro}</Aviso>}

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => navigate({ to: "/grupos", search: { grupo: undefined } })}
              className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={13} strokeWidth={2} /> Todos os grupos
            </button>
            <div className="flex items-center gap-2">
              {souModerador && (
                <BotaoDiscreto onClick={() => carregarCandidatos(atual.id)}>
                  <span className="inline-flex items-center gap-1.5">
                    <UserPlus size={13} strokeWidth={1.8} /> Adicionar
                  </span>
                </BotaoDiscreto>
              )}
              {souMembro && (
                <BotaoDiscreto onClick={() => sair(souMembro.id)}>Sair do grupo</BotaoDiscreto>
              )}
              {atual.criado_por === user?.id && (
                <BotaoDiscreto onClick={() => apagarGrupo(atual.id)}>
                  <Trash2 size={13} strokeWidth={1.8} />
                </BotaoDiscreto>
              )}
            </div>
          </div>

          {mostrarConvite && souModerador && (
            <Cartao>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-glow mb-3">
                Adicionar da minha casa
              </p>
              {candidatos.length === 0 ? (
                <p className="text-sm text-muted-foreground font-light">
                  Todo mundo da casa já está neste grupo.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {candidatos.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => adicionar(atual.id, c)}
                      disabled={ocupado === c.id}
                      className="px-3 py-1.5 rounded-full text-xs border border-border hover:border-cyan-glow/40 hover:text-cyan-glow transition-colors disabled:opacity-40"
                    >
                      {c.nome ?? "Membro"}
                    </button>
                  ))}
                </div>
              )}
              <div className="mt-4">
                <BotaoDiscreto onClick={() => setMostrarConvite(false)}>Fechar</BotaoDiscreto>
              </div>
            </Cartao>
          )}

          <div className="flex flex-wrap gap-1.5">
            {doGrupo.map((m) => (
              <span
                key={m.id}
                className="text-[11px] px-2 py-0.5 rounded-full bg-white/60 border border-border text-muted-foreground"
                title={m.papel === "moderador" ? "Modera o grupo" : undefined}
              >
                {m.nome}
                {m.papel === "moderador" && " ★"}
              </span>
            ))}
          </div>

          {!souMembro ? (
            <Vazio
              texto="Você ainda não faz parte deste grupo. Entre para ler e participar da conversa."
              acao={<BotaoPrimario onClick={() => entrar(atual.id)}>Entrar no grupo</BotaoPrimario>}
            />
          ) : (
            <>
              <div className="glass rounded-3xl p-5 space-y-4 max-h-[55vh] overflow-y-auto">
                {mensagens.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground/60 font-light py-8">
                    Nenhuma mensagem ainda. Diga o primeiro olá.
                  </p>
                ) : (
                  mensagens.map((m) => {
                    const minha = m.criado_por === user?.id;
                    return (
                      <div
                        key={m.id}
                        className={`flex gap-3 ${minha ? "flex-row-reverse text-right" : ""}`}
                      >
                        <div className="w-8 h-8 rounded-full bg-cyan-50 border border-cyan-200 flex items-center justify-center text-[10px] font-medium text-cyan-700 shrink-0">
                          {iniciais(m.autor_nome)}
                        </div>
                        <div className={`max-w-[75%] ${minha ? "items-end" : ""}`}>
                          <p className="text-[11px] text-muted-foreground/60">
                            {minha ? "Você" : m.autor_nome} · {quandoFoi(m.created_at)}
                          </p>
                          <p
                            className={`mt-1 inline-block rounded-2xl px-3.5 py-2 text-sm font-light whitespace-pre-wrap text-left ${
                              minha
                                ? "bg-cyan-glow/10 border border-cyan-glow/20 text-foreground"
                                : "bg-white/70 border border-border text-foreground"
                            }`}
                          >
                            {m.texto}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={fimDaConversa} />
              </div>

              <div className="flex items-end gap-2">
                <CampoArea
                  rows={2}
                  value={texto}
                  maxLength={2000}
                  onChange={(e) => setTexto(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void enviar(atual.id);
                    }
                  }}
                  placeholder="Escreva uma mensagem — Enter envia, Shift+Enter quebra a linha"
                />
                <BotaoPrimario onClick={() => enviar(atual.id)} disabled={!texto.trim()}>
                  <Send size={13} strokeWidth={2} />
                </BotaoPrimario>
              </div>
            </>
          )}
        </div>
      </PaginaComunidade>
    );
  }

  /* ── Lista de grupos ── */
  return (
    <PaginaComunidade
      secao="Nossa comunidade"
      titulo="Comunicação em"
      destaque="Grupos"
      descricao="Grupos internos por frente de trabalho, com a conversa dentro da plataforma — sem depender de aplicativo de fora e sem expor o telefone de ninguém."
    >
      <div className="space-y-6">
        {erro && <Aviso tipo="erro">{erro}</Aviso>}

        <div className="flex justify-end">
          <BotaoPrimario onClick={() => setCriando((v) => !v)}>
            <span className="inline-flex items-center gap-2">
              <Plus size={13} strokeWidth={2} /> {criando ? "Fechar" : "Criar grupo"}
            </span>
          </BotaoPrimario>
        </div>

        {criando && (
          <Cartao>
            <form onSubmit={criarGrupo} className="space-y-5">
              <div>
                <Rotulo obrigatorio>Nome do grupo</Rotulo>
                <CampoTexto
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  maxLength={80}
                  placeholder="Ex.: Evangelização — sábado de manhã"
                />
              </div>
              <div>
                <Rotulo>Para que serve</Rotulo>
                <CampoArea
                  rows={2}
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  maxLength={400}
                  placeholder="Uma linha explicando o propósito do grupo."
                />
              </div>
              <div>
                <Rotulo>Frente de trabalho</Rotulo>
                <CampoSelecao
                  value={form.atividade}
                  onChange={(e) => setForm({ ...form, atividade: e.target.value })}
                >
                  {ATIVIDADES.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </CampoSelecao>
              </div>

              <div className="rounded-2xl border border-border/60 p-4 space-y-3">
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-glow">Quem participa</p>
                <label className="flex items-start gap-2 text-sm text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.privado}
                    onChange={(e) => setForm({ ...form, privado: e.target.checked })}
                    className="mt-1"
                  />
                  <span>
                    Grupo fechado
                    <span className="block text-xs text-muted-foreground font-light">
                      Só entra quem for adicionado por quem modera. Grupo fechado não aparece na
                      lista para quem não é membro.
                    </span>
                  </span>
                </label>
                {!form.privado && (
                  <label className="flex items-start gap-2 text-sm text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.aberto}
                      onChange={(e) => setForm({ ...form, aberto: e.target.checked })}
                      className="mt-1"
                    />
                    <span>
                      Aceitar membros de outras casas
                      <span className="block text-xs text-muted-foreground font-light">
                        Útil para trabalhos entre casas. Sem isto, o grupo é só da sua.
                      </span>
                    </span>
                  </label>
                )}
              </div>

              <BotaoPrimario type="submit" disabled={ocupado === "criar"}>
                {ocupado === "criar" ? "Criando…" : "Criar grupo"}
              </BotaoPrimario>
            </form>
          </Cartao>
        )}

        {carregando ? (
          <p className="text-center text-muted-foreground/50 py-12 font-light">Carregando…</p>
        ) : grupos.length === 0 ? (
          <Vazio texto="Nenhum grupo ainda. Crie o primeiro para a sua frente de trabalho." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {grupos.map((g) => {
              const doGrupo = membros.filter((m) => m.grupo_id === g.id);
              const souMembro = doGrupo.some((m) => m.user_id === user?.id);
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => navigate({ to: "/grupos", search: { grupo: g.id } })}
                  className="text-left glass rounded-2xl p-5 hover:ring-1 hover:ring-cyan-glow/30 transition-all"
                >
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    {g.privado && (
                      <Etiqueta tom="ambar">
                        <Lock size={10} strokeWidth={2} /> Fechado
                      </Etiqueta>
                    )}
                    <MarcaAlcance aberto={g.aberto} />
                    {souMembro && <Etiqueta tom="verde">Você participa</Etiqueta>}
                  </div>
                  <p className="text-foreground">{g.nome}</p>
                  {g.descricao && (
                    <p className="mt-1 text-sm text-muted-foreground font-light line-clamp-2">
                      {g.descricao}
                    </p>
                  )}
                  <p className="mt-3 text-xs text-muted-foreground/60 flex items-center gap-3">
                    {g.atividade && <span>{g.atividade}</span>}
                    <span className="inline-flex items-center gap-1">
                      <Users size={11} strokeWidth={1.8} />
                      {doGrupo.length}
                    </span>
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </PaginaComunidade>
  );
}
