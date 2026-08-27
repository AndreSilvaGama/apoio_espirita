import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { FileQuestion, PenLine, ShieldAlert, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  CONTEUDO_MIN,
  RESUMO_MAX,
  ROTULOS,
  TITULO_MAX,
  TITULO_MIN,
  pluralCaracteres,
  validarArtigo,
  type TipoAvaliacao,
} from "@/lib/artigos";
import { mensagemDeErro } from "@/lib/erros";

export const Route = createFileRoute("/artigos/$slug/editar")({
  head: () => ({
    meta: [{ title: "Corrigir artigo — Apoio Espírita" }, { name: "robots", content: "noindex" }],
  }),
  component: ArtigoEditar,
});

type EstadoArtigo = "publicado" | "retirado" | "em_correcao";

interface ArtigoEditavel {
  id: string;
  autor_id: string;
  titulo: string;
  slug: string;
  resumo: string | null;
  conteudo: string;
  estado: EstadoArtigo;
}

interface ErroApontado {
  tipo: TipoAvaliacao;
  descricao_erro: string;
  autor_nome: string;
}

type Situacao = "carregando" | "pronto" | "nao_autorizado" | "nao_encontrado" | "erro";

function ArtigoEditar() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const [situacao, setSituacao] = useState<Situacao>("carregando");
  const [erroCarga, setErroCarga] = useState<string | null>(null);
  const [artigo, setArtigo] = useState<ArtigoEditavel | null>(null);
  const [erros, setErros] = useState<ErroApontado[]>([]);

  const [titulo, setTitulo] = useState("");
  const [resumo, setResumo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [erroFormulario, setErroFormulario] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  /** As descrições de erro são acusações sobre pessoa identificada — só o autor,
   * quem revisa e o próprio avaliador leem `artigo_avaliacoes`. Aqui o autor lê
   * as recebidas nos seus próprios artigos, com o nome de quem apontou, lido de
   * `profiles_public` no mesmo padrão do kanban (colunas anuláveis: descarta
   * linhas sem id/nome). */
  const carregarErros = useCallback(async (artigoId: string) => {
    const { data: avaliacoes, error: erroAvaliacoes } = await supabase
      .from("artigo_avaliacoes")
      .select("tipo, descricao_erro, user_id")
      .eq("artigo_id", artigoId)
      .in("tipo", ["erro", "erro_grave"])
      .order("created_at", { ascending: true });
    if (erroAvaliacoes) throw erroAvaliacoes;

    const idsAvaliadores = [...new Set((avaliacoes ?? []).map((a) => a.user_id))];
    const { data: perfis, error: erroPerfis } =
      idsAvaliadores.length > 0
        ? await supabase.from("profiles_public").select("id, nome").in("id", idsAvaliadores)
        : { data: [], error: null };
    if (erroPerfis) throw erroPerfis;

    const nomePorId = new Map(
      (perfis ?? [])
        .filter((p): p is { id: string; nome: string } => !!p.id && !!p.nome)
        .map((p) => [p.id, p.nome]),
    );

    setErros(
      (avaliacoes ?? [])
        .filter((a): a is typeof a & { descricao_erro: string } => !!a.descricao_erro)
        .map((a) => ({
          tipo: a.tipo as TipoAvaliacao,
          descricao_erro: a.descricao_erro,
          autor_nome: nomePorId.get(a.user_id) ?? "Um avaliador",
        })),
    );
  }, []);

  const carregar = useCallback(async () => {
    if (!user) return;
    setSituacao("carregando");
    setErroCarga(null);

    try {
      const { data: encontrado, error: erroArtigo } = await supabase
        .from("artigos")
        .select("id, autor_id, titulo, slug, resumo, conteudo, estado")
        .eq("slug", slug)
        .maybeSingle();
      if (erroArtigo) throw erroArtigo;

      if (!encontrado) {
        setSituacao("nao_encontrado");
        return;
      }
      if (encontrado.autor_id !== user.id) {
        setSituacao("nao_autorizado");
        return;
      }

      let artigoAtual = encontrado as ArtigoEditavel;

      // O gatilho de máquina de estados (migração
      // 20260826100300_artigos_politicas.sql) permite ao autor só esta
      // transição — retirado → em_correcao — e nunca retirado → publicado.
      // Quem restaura ao ar é sempre o revisor.
      if (artigoAtual.estado === "retirado") {
        const { error: erroTransicao } = await supabase
          .from("artigos")
          .update({ estado: "em_correcao" })
          .eq("id", artigoAtual.id);
        if (erroTransicao) throw erroTransicao;
        artigoAtual = { ...artigoAtual, estado: "em_correcao" };
      }

      setArtigo(artigoAtual);
      setTitulo(artigoAtual.titulo);
      setResumo(artigoAtual.resumo ?? "");
      setConteudo(artigoAtual.conteudo);

      if (artigoAtual.estado === "em_correcao") {
        await carregarErros(artigoAtual.id);
      }

      setSituacao("pronto");
    } catch (e) {
      setErroCarga(mensagemDeErro(e, "Não foi possível carregar este artigo."));
      setSituacao("erro");
    }
  }, [user, slug, carregarErros]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function handleSalvar() {
    if (!user || !artigo) return;

    const mensagemValidacao = validarArtigo(titulo, conteudo, resumo);
    if (mensagemValidacao) {
      setErroFormulario(mensagemValidacao);
      return;
    }

    setErroFormulario(null);
    setSalvando(true);

    const tituloFinal = titulo.trim();
    const conteudoFinal = conteudo.trim();
    const resumoFinal = resumo.trim();
    const emCorrecao = artigo.estado === "em_correcao";

    try {
      const { error: erroUpdate } = await supabase
        .from("artigos")
        .update({
          titulo: tituloFinal,
          resumo: resumoFinal || null,
          conteudo: conteudoFinal,
          editado_em: new Date().toISOString(),
        })
        .eq("id", artigo.id);
      if (erroUpdate) throw erroUpdate;

      if (emCorrecao) {
        const { error: erroRevisao } = await supabase.from("artigo_revisoes").insert({
          artigo_id: artigo.id,
          origem: "reenvio",
          estado: "aberta",
        });
        if (erroRevisao) throw erroRevisao;

        navigate({ to: "/artigos/meus" });
        return;
      }

      navigate({ to: "/artigos/$slug", params: { slug: artigo.slug } });
    } catch (e) {
      setErroFormulario(
        mensagemDeErro(
          e,
          emCorrecao
            ? "Não foi possível enviar a correção. Seu texto continua aqui — tente novamente."
            : "Não foi possível salvar as alterações. Seu texto continua aqui — tente novamente.",
        ),
      );
    } finally {
      setSalvando(false);
    }
  }

  if (loading || !user) return null;

  const emCorrecao = artigo?.estado === "em_correcao";

  return (
    <main className="page-light min-h-screen px-4 pt-20 pb-20">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.4em] text-cyan-glow mb-2">Comunidade</p>
          <h1 className="text-3xl font-light text-foreground">
            {emCorrecao ? "Corrigir artigo" : "Editar artigo"}
          </h1>
          {emCorrecao && (
            <p className="mt-2 text-sm text-muted-foreground font-light max-w-lg">
              Revise o texto com base nos erros apontados e reenvie para revisão.
            </p>
          )}
        </div>

        {situacao === "carregando" && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-3 border-cyan-glow/30 border-t-cyan-glow rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground font-light">Carregando artigo…</p>
          </div>
        )}

        {situacao === "erro" && (
          <div className="glass rounded-2xl p-6 text-center">
            <p className="text-sm text-muted-foreground">{erroCarga}</p>
          </div>
        )}

        {situacao === "nao_encontrado" && (
          <div className="glass rounded-2xl p-6 space-y-3">
            <div className="flex items-center gap-2.5">
              <FileQuestion size={18} strokeWidth={1.6} className="text-muted-foreground" />
              <h2 className="text-lg font-medium text-foreground">Artigo não encontrado</h2>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Não existe nenhum artigo seu neste endereço.
            </p>
          </div>
        )}

        {situacao === "nao_autorizado" && (
          <div className="glass rounded-2xl p-6 space-y-3">
            <div className="flex items-center gap-2.5">
              <ShieldAlert size={18} strokeWidth={1.6} className="text-amber-600" />
              <h2 className="text-lg font-medium text-foreground">
                Você não pode editar este artigo
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Este artigo pertence a outro autor. Só quem escreveu um artigo pode corrigi-lo.
            </p>
          </div>
        )}

        {situacao === "pronto" && artigo && (
          <div className="space-y-6">
            {emCorrecao && (
              <div className="glass rounded-3xl p-6 space-y-4">
                <div className="flex items-center gap-2.5">
                  <Wrench size={18} strokeWidth={1.6} className="text-amber-600" />
                  <h2 className="text-base font-medium text-foreground">Em correção</h2>
                </div>
                {erros.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">
                      {erros.length === 1 ? "1 erro apontado" : `${erros.length} erros apontados`}
                    </p>
                    <ul className="space-y-2">
                      {erros.map((e, i) => (
                        <li
                          key={i}
                          className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm"
                        >
                          <p className="text-xs uppercase tracking-widest text-amber-700 mb-1">
                            {ROTULOS[e.tipo]} · {e.autor_nome}
                          </p>
                          <p className="text-muted-foreground leading-relaxed">
                            {e.descricao_erro}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Nenhuma descrição de erro ficou registrada para este artigo.
                  </p>
                )}
              </div>
            )}

            <div className="glass rounded-3xl p-8 space-y-5">
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
                  Título <span className="text-cyan-glow">*</span>
                </label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  maxLength={TITULO_MAX}
                  placeholder="Um título claro para o seu artigo"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-cyan-glow/40 transition-colors"
                />
                <p className="mt-1.5 text-xs text-muted-foreground/60">
                  {titulo.trim().length}/{TITULO_MAX} caracteres (mínimo {TITULO_MIN})
                </p>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
                  Resumo
                </label>
                <textarea
                  value={resumo}
                  onChange={(e) => setResumo(e.target.value)}
                  maxLength={RESUMO_MAX}
                  rows={2}
                  placeholder="Opcional — um resumo curto para aparecer na lista de artigos"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-cyan-glow/40 transition-colors resize-none"
                />
                <p className="mt-1.5 text-xs text-muted-foreground/60">
                  {resumo.trim().length}/{RESUMO_MAX} caracteres
                </p>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
                  Conteúdo <span className="text-cyan-glow">*</span>
                </label>
                <textarea
                  value={conteudo}
                  onChange={(e) => setConteudo(e.target.value)}
                  rows={16}
                  placeholder="Escreva seu artigo aqui…"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-cyan-glow/40 transition-colors resize-y"
                />
                <p className="mt-1.5 text-xs text-muted-foreground/60">
                  {conteudo.trim().length} {pluralCaracteres(conteudo.trim().length)} (mínimo{" "}
                  {CONTEUDO_MIN})
                </p>
              </div>

              {emCorrecao && (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Ao enviar a correção, seu artigo entra na fila de revisão. Ele volta ao ar quando
                  um revisor conferir a correção — não automaticamente.
                </p>
              )}

              {erroFormulario && (
                <p className="text-sm text-red-500 text-center">{erroFormulario}</p>
              )}

              <button
                type="button"
                onClick={handleSalvar}
                disabled={salvando}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm uppercase tracking-widest text-cyan-glow border border-cyan-glow/40 hover:bg-cyan-glow/10 disabled:opacity-40 transition-colors duration-300"
              >
                <PenLine size={14} strokeWidth={1.6} />
                {salvando ? "Enviando…" : emCorrecao ? "Enviar correção" : "Salvar alterações"}
              </button>
            </div>
          </div>
        )}

        <div className="text-center mt-6">
          <Link
            to="/artigos/meus"
            className="inline-block text-sm text-cyan-glow/70 hover:text-cyan-glow transition-colors"
          >
            ← Voltar para meus artigos
          </Link>
        </div>
      </div>
    </main>
  );
}
