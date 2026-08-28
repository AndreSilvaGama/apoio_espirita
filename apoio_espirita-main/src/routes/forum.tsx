import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, MessageCircle, Pin, Plus, Trash2 } from "lucide-react";
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

export const Route = createFileRoute("/forum")({
  validateSearch: (search: Record<string, unknown>): { topico?: string } => ({
    topico: typeof search.topico === "string" ? search.topico : undefined,
  }),
  component: Forum,
});

const CATEGORIAS = [
  { id: "duvida", rotulo: "Dúvida", tom: "ciano" as const },
  { id: "acolhimento", rotulo: "Acolhimento", tom: "violeta" as const },
  { id: "estudo", rotulo: "Estudo", tom: "ambar" as const },
  { id: "testemunho", rotulo: "Testemunho", tom: "verde" as const },
];

function rotuloCategoria(id: string) {
  return CATEGORIAS.find((c) => c.id === id) ?? CATEGORIAS[0];
}

interface Topico {
  id: string;
  sigla_casa: string;
  titulo: string;
  texto: string;
  categoria: string;
  aberto: boolean;
  resolvido: boolean;
  fixado: boolean;
  respostas: number;
  ultima_resposta_em: string | null;
  criado_por: string;
  autor_nome: string;
  created_at: string;
}

interface Resposta {
  id: string;
  topico_id: string;
  texto: string;
  criado_por: string;
  autor_nome: string;
  created_at: string;
}

function Forum() {
  const navigate = useNavigate();
  const { topico: topicoAberto } = Route.useSearch();
  const { user, profile, isPresident } = useAuth();

  const [topicos, setTopicos] = useState<Topico[]>([]);
  const [respostas, setRespostas] = useState<Resposta[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<string>("todos");
  const [ocupado, setOcupado] = useState<string | null>(null);

  const [criando, setCriando] = useState(false);
  const [form, setForm] = useState({
    titulo: "",
    texto: "",
    categoria: "duvida",
    aberto: false,
  });
  const [salvando, setSalvando] = useState(false);
  const [novaResposta, setNovaResposta] = useState("");

  const carregar = useCallback(async () => {
    setCarregando(true);
    const { data, error } = await supabase
      .from("forum_topicos")
      .select(
        "id, sigla_casa, titulo, texto, categoria, aberto, resolvido, fixado, respostas, ultima_resposta_em, criado_por, autor_nome, created_at",
      )
      .order("fixado", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) setErro(mensagemDeErro(error));
    setTopicos((data as Topico[]) ?? []);
    setCarregando(false);
  }, []);

  const carregarRespostas = useCallback(async (id: string) => {
    const { data } = await supabase
      .from("forum_respostas")
      .select("id, topico_id, texto, criado_por, autor_nome, created_at")
      .eq("topico_id", id)
      .order("created_at");
    setRespostas((data as Resposta[]) ?? []);
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  useEffect(() => {
    if (topicoAberto) void carregarRespostas(topicoAberto);
  }, [topicoAberto, carregarRespostas]);

  async function publicarTopico(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (form.titulo.trim().length < 5) {
      setErro("O título precisa de pelo menos 5 caracteres.");
      return;
    }
    if (form.texto.trim().length < 10) {
      setErro("Escreva um pouco mais para que as pessoas possam ajudar.");
      return;
    }
    const problema = validarLinguagem(form.titulo, form.texto);
    if (problema) {
      setErro(problema);
      return;
    }
    setSalvando(true);
    const { error } = await supabase.from("forum_topicos").insert({
      sigla_casa: profile?.sigla_casa ?? "",
      titulo: form.titulo.trim(),
      texto: form.texto.trim(),
      categoria: form.categoria,
      aberto: form.aberto,
      criado_por: user?.id ?? "",
      autor_nome: profile?.nome ?? "",
    });
    setSalvando(false);
    if (error) {
      setErro(mensagemDeErro(error));
      return;
    }
    setForm({ titulo: "", texto: "", categoria: "duvida", aberto: false });
    setCriando(false);
    await carregar();
  }

  async function responder(id: string) {
    setErro(null);
    if (novaResposta.trim().length < 2) return;
    const problema = validarLinguagem(novaResposta);
    if (problema) {
      setErro(problema);
      return;
    }
    setOcupado("resposta");
    const { error } = await supabase.from("forum_respostas").insert({
      topico_id: id,
      sigla_casa: profile?.sigla_casa ?? "",
      texto: novaResposta.trim(),
      criado_por: user?.id ?? "",
      autor_nome: profile?.nome ?? "",
    });
    setOcupado(null);
    if (error) {
      setErro(mensagemDeErro(error));
      return;
    }
    setNovaResposta("");
    await Promise.all([carregarRespostas(id), carregar()]);
  }

  async function alternar(t: Topico, campo: "resolvido" | "fixado") {
    setOcupado(t.id);
    const alteracao = campo === "resolvido" ? { resolvido: !t.resolvido } : { fixado: !t.fixado };
    const { error } = await supabase.from("forum_topicos").update(alteracao).eq("id", t.id);
    setOcupado(null);
    if (error) {
      setErro(mensagemDeErro(error));
      return;
    }
    await carregar();
  }

  async function apagarTopico(id: string) {
    setOcupado(id);
    const { error } = await supabase.from("forum_topicos").delete().eq("id", id);
    setOcupado(null);
    if (error) {
      setErro(mensagemDeErro(error));
      return;
    }
    navigate({ to: "/forum", search: { topico: undefined } });
    await carregar();
  }

  async function apagarResposta(id: string, topicoId: string) {
    setOcupado(id);
    const { error } = await supabase.from("forum_respostas").delete().eq("id", id);
    setOcupado(null);
    if (error) {
      setErro(mensagemDeErro(error));
      return;
    }
    await Promise.all([carregarRespostas(topicoId), carregar()]);
  }

  const atual = topicos.find((t) => t.id === topicoAberto);

  /* ── Tópico aberto ── */
  if (atual) {
    const cat = rotuloCategoria(atual.categoria);
    const souDono = atual.criado_por === user?.id;
    return (
      <PaginaComunidade
        secao="Nossa comunidade"
        titulo="Fórum de"
        destaque="Apoio"
        descricao="Conversa entre membros: perguntas, respostas e acolhimento."
      >
        <div className="space-y-5">
          {erro && <Aviso tipo="erro">{erro}</Aviso>}

          <button
            type="button"
            onClick={() => navigate({ to: "/forum", search: { topico: undefined } })}
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={13} strokeWidth={2} /> Todos os tópicos
          </button>

          <Cartao>
            <div className="flex items-center gap-2 flex-wrap mb-4">
              <Etiqueta tom={cat.tom}>{cat.rotulo}</Etiqueta>
              <MarcaAlcance aberto={atual.aberto} />
              {atual.resolvido && <Etiqueta tom="verde">Resolvido</Etiqueta>}
              {atual.fixado && <Etiqueta tom="ambar">Fixado</Etiqueta>}
              <span className="text-xs text-muted-foreground/50">
                {quandoFoi(atual.created_at)}
              </span>
            </div>

            <h2 className="text-2xl font-light text-foreground mb-3">{atual.titulo}</h2>
            <p className="text-sm text-foreground/90 font-light whitespace-pre-wrap leading-relaxed">
              {atual.texto}
            </p>

            <div className="mt-5 pt-4 border-t border-border/40 flex items-center justify-between gap-3 flex-wrap">
              <p className="text-xs text-muted-foreground/70">
                {atual.autor_nome} · {atual.sigla_casa}
              </p>
              <div className="flex gap-2">
                {souDono && (
                  <BotaoDiscreto
                    onClick={() => alternar(atual, "resolvido")}
                    disabled={ocupado === atual.id}
                  >
                    {atual.resolvido ? "Reabrir" : "Marcar resolvido"}
                  </BotaoDiscreto>
                )}
                {isPresident && (
                  <BotaoDiscreto
                    onClick={() => alternar(atual, "fixado")}
                    disabled={ocupado === atual.id}
                  >
                    <Pin size={13} strokeWidth={1.8} />
                  </BotaoDiscreto>
                )}
                {(souDono || isPresident) && (
                  <BotaoDiscreto
                    onClick={() => apagarTopico(atual.id)}
                    disabled={ocupado === atual.id}
                  >
                    <Trash2 size={13} strokeWidth={1.8} />
                  </BotaoDiscreto>
                )}
              </div>
            </div>
          </Cartao>

          <div className="space-y-3">
            {respostas.map((r) => (
              <div key={r.id} className="glass rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-cyan-50 border border-cyan-200 flex items-center justify-center text-[10px] font-medium text-cyan-700 shrink-0">
                    {iniciais(r.autor_nome)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground">
                        {r.autor_nome}
                        <span className="text-muted-foreground/40">
                          {" "}
                          · {quandoFoi(r.created_at)}
                        </span>
                      </p>
                      {(r.criado_por === user?.id || isPresident) && (
                        <button
                          type="button"
                          onClick={() => apagarResposta(r.id, atual.id)}
                          disabled={ocupado === r.id}
                          className="text-muted-foreground/40 hover:text-red-500 transition-colors"
                          title="Apagar resposta"
                        >
                          <Trash2 size={13} strokeWidth={1.8} />
                        </button>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-foreground/90 font-light whitespace-pre-wrap leading-relaxed">
                      {r.texto}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Cartao>
            <Rotulo>Responder</Rotulo>
            <CampoArea
              rows={4}
              value={novaResposta}
              maxLength={5000}
              onChange={(e) => setNovaResposta(e.target.value)}
              placeholder="Escreva com o cuidado de quem fala com um irmão…"
            />
            <div className="mt-4">
              <BotaoPrimario
                onClick={() => responder(atual.id)}
                disabled={ocupado === "resposta" || novaResposta.trim().length < 2}
              >
                {ocupado === "resposta" ? "Enviando…" : "Enviar resposta"}
              </BotaoPrimario>
            </div>
          </Cartao>
        </div>
      </PaginaComunidade>
    );
  }

  /* ── Lista ── */
  const lista = filtro === "todos" ? topicos : topicos.filter((t) => t.categoria === filtro);

  return (
    <PaginaComunidade
      secao="Nossa comunidade"
      titulo="Fórum de"
      destaque="Apoio"
      descricao="Espaço fraterno de perguntas, respostas e acolhimento entre membros. O que você publica fica na sua casa, a menos que você escolha abrir para todas."
    >
      <div className="space-y-6">
        {erro && <Aviso tipo="erro">{erro}</Aviso>}

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setFiltro("todos")}
              className={`px-3 py-1.5 rounded-full text-[11px] uppercase tracking-widest border transition-colors ${
                filtro === "todos"
                  ? "border-cyan-glow/50 bg-cyan-glow/10 text-cyan-glow"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              Tudo
            </button>
            {CATEGORIAS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setFiltro(c.id)}
                className={`px-3 py-1.5 rounded-full text-[11px] uppercase tracking-widest border transition-colors ${
                  filtro === c.id
                    ? "border-cyan-glow/50 bg-cyan-glow/10 text-cyan-glow"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {c.rotulo}
              </button>
            ))}
          </div>
          <BotaoPrimario onClick={() => setCriando((v) => !v)}>
            <span className="inline-flex items-center gap-2">
              <Plus size={13} strokeWidth={2} /> {criando ? "Fechar" : "Novo tópico"}
            </span>
          </BotaoPrimario>
        </div>

        {criando && (
          <Cartao>
            <form onSubmit={publicarTopico} className="space-y-5">
              <div>
                <Rotulo obrigatorio>Título</Rotulo>
                <CampoTexto
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  maxLength={160}
                  placeholder="Em poucas palavras, o que você quer conversar?"
                />
              </div>
              <div>
                <Rotulo obrigatorio>Mensagem</Rotulo>
                <CampoArea
                  rows={5}
                  value={form.texto}
                  onChange={(e) => setForm({ ...form, texto: e.target.value })}
                  maxLength={5000}
                  placeholder="Conte com calma. Quanto mais claro, melhor quem lê poderá ajudar."
                />
              </div>
              <div>
                <Rotulo>Assunto</Rotulo>
                <CampoSelecao
                  value={form.categoria}
                  onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                >
                  {CATEGORIAS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.rotulo}
                    </option>
                  ))}
                </CampoSelecao>
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
              <BotaoPrimario type="submit" disabled={salvando}>
                {salvando ? "Publicando…" : "Publicar tópico"}
              </BotaoPrimario>
            </form>
          </Cartao>
        )}

        {carregando ? (
          <p className="text-center text-muted-foreground/50 py-12 font-light">Carregando…</p>
        ) : lista.length === 0 ? (
          <Vazio texto="Nenhum tópico por aqui ainda. O primeiro pode ser o seu." />
        ) : (
          <div className="space-y-2">
            {lista.map((t) => {
              const cat = rotuloCategoria(t.categoria);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => navigate({ to: "/forum", search: { topico: t.id } })}
                  className="w-full text-left glass rounded-2xl p-5 hover:ring-1 hover:ring-cyan-glow/30 transition-all"
                >
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    {t.fixado && <Etiqueta tom="ambar">Fixado</Etiqueta>}
                    <Etiqueta tom={cat.tom}>{cat.rotulo}</Etiqueta>
                    {t.resolvido && (
                      <Etiqueta tom="verde">
                        <CheckCircle2 size={10} strokeWidth={2} /> Resolvido
                      </Etiqueta>
                    )}
                    <MarcaAlcance aberto={t.aberto} />
                  </div>
                  <p className="text-foreground">{t.titulo}</p>
                  <p className="mt-1 text-sm text-muted-foreground font-light line-clamp-2">
                    {t.texto}
                  </p>
                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground/60">
                    <span>{t.autor_nome}</span>
                    <span className="inline-flex items-center gap-1">
                      <MessageCircle size={11} strokeWidth={1.8} />
                      {t.respostas}
                    </span>
                    <span>{quandoFoi(t.ultima_resposta_em ?? t.created_at)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </PaginaComunidade>
  );
}
