import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertTriangle, Ban, PenLine } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { gerarSlug } from "@/lib/artigos";
import { mensagemDeErro } from "@/lib/erros";

export const Route = createFileRoute("/artigos/novo")({
  head: () => ({
    meta: [{ title: "Escrever artigo — Apoio Espírita" }, { name: "robots", content: "noindex" }],
  }),
  component: ArtigoNovo,
});

const TITULO_MIN = 5;
const TITULO_MAX = 160;
const CONTEUDO_MIN = 200;
const RESUMO_MAX = 400;
const MAX_TENTATIVAS_SLUG = 5;

type Elegibilidade = "verificando" | "liberado" | "email_nao_verificado" | "sancionado" | "erro";

interface Sancao {
  motivo: string;
  fim: string | null;
}

function formatarData(iso: string): string {
  try {
    return format(parseISO(iso), "d 'de' MMMM 'de' yyyy", { locale: ptBR });
  } catch {
    return "";
  }
}

/** Sufixo curto para desempatar slugs colididos, sem poluir a URL. */
function sufixoCurto(): string {
  return Math.random().toString(36).slice(2, 6);
}

function ArtigoNovo() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  const [elegibilidade, setElegibilidade] = useState<Elegibilidade>("verificando");
  const [sancao, setSancao] = useState<Sancao | null>(null);
  const [erroElegibilidade, setErroElegibilidade] = useState<string | null>(null);

  const [titulo, setTitulo] = useState("");
  const [resumo, setResumo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [erroFormulario, setErroFormulario] = useState<string | null>(null);
  const [publicando, setPublicando] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
    if (
      !loading &&
      user &&
      (!profile?.sigla_casa ||
        !profile?.nome ||
        !profile?.cargo_principal ||
        !profile?.uf ||
        !profile?.cidade)
    ) {
      navigate({ to: "/completar-perfil" });
    }
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    let cancelado = false;
    setElegibilidade("verificando");

    (async () => {
      try {
        const { data: verificado, error: erroVerificado } = await supabase.rpc("email_verificado");
        if (erroVerificado) throw erroVerificado;
        if (cancelado) return;

        if (!verificado) {
          setElegibilidade("email_nao_verificado");
          return;
        }

        const { data: sancoes, error: erroSancoes } = await supabase
          .from("usuarios_sancoes")
          .select("motivo, fim")
          .eq("user_id", user.id)
          .is("revogada_em", null);
        if (erroSancoes) throw erroSancoes;
        if (cancelado) return;

        const agora = Date.now();
        const vigente = (sancoes ?? []).find(
          (s) => s.fim === null || new Date(s.fim).getTime() > agora,
        );

        if (vigente) {
          setSancao({ motivo: vigente.motivo, fim: vigente.fim });
          setElegibilidade("sancionado");
          return;
        }

        setElegibilidade("liberado");
      } catch (e) {
        if (!cancelado) {
          setErroElegibilidade(
            mensagemDeErro(e, "Não foi possível conferir se você pode publicar."),
          );
          setElegibilidade("erro");
        }
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [user]);

  function validar(): string | null {
    const t = titulo.trim();
    const c = conteudo.trim();
    const r = resumo.trim();

    if (t.length < TITULO_MIN || t.length > TITULO_MAX) {
      return `O título deve ter entre ${TITULO_MIN} e ${TITULO_MAX} caracteres.`;
    }
    if (c.length < CONTEUDO_MIN) {
      return `O conteúdo deve ter pelo menos ${CONTEUDO_MIN} caracteres. Faltam ${
        CONTEUDO_MIN - c.length
      }.`;
    }
    if (r.length > RESUMO_MAX) {
      return `O resumo pode ter no máximo ${RESUMO_MAX} caracteres.`;
    }
    return null;
  }

  async function handlePublicar() {
    if (!user || !profile) return;

    const mensagemValidacao = validar();
    if (mensagemValidacao) {
      setErroFormulario(mensagemValidacao);
      return;
    }

    setErroFormulario(null);
    setPublicando(true);

    const tituloFinal = titulo.trim();
    const conteudoFinal = conteudo.trim();
    const resumoFinal = resumo.trim();
    const base = gerarSlug(tituloFinal);

    try {
      let slugTentativa = base;
      for (let tentativa = 0; tentativa <= MAX_TENTATIVAS_SLUG; tentativa++) {
        const { data, error } = await supabase
          .from("artigos")
          .insert({
            autor_id: user.id,
            autor_nome: profile.nome ?? "",
            autor_sigla_casa: profile.sigla_casa,
            titulo: tituloFinal,
            resumo: resumoFinal || null,
            conteudo: conteudoFinal,
            slug: slugTentativa,
          })
          .select("slug")
          .single();

        if (!error) {
          navigate({ to: "/artigos/$slug", params: { slug: data.slug } });
          return;
        }

        const colisaoDeSlug = error.code === "23505";
        if (!colisaoDeSlug || tentativa === MAX_TENTATIVAS_SLUG) {
          throw error;
        }
        slugTentativa = `${base}-${sufixoCurto()}`;
      }
    } catch (e) {
      setErroFormulario(
        mensagemDeErro(
          e,
          "Não foi possível publicar o artigo. Seu texto continua aqui — tente novamente.",
        ),
      );
    } finally {
      setPublicando(false);
    }
  }

  if (loading || !user || !profile?.nome) return null;

  return (
    <main className="page-light min-h-screen px-4 pt-20 pb-20">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.4em] text-cyan-glow mb-2">Comunidade</p>
          <h1 className="text-3xl font-light text-foreground">Escrever artigo</h1>
          <p className="mt-2 text-sm text-muted-foreground font-light max-w-lg">
            Seu texto é publicado imediatamente e avaliado pelos próprios leitores.
          </p>
        </div>

        {elegibilidade === "verificando" && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-3 border-cyan-glow/30 border-t-cyan-glow rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground font-light">Verificando sua conta…</p>
          </div>
        )}

        {elegibilidade === "erro" && (
          <div className="glass rounded-2xl p-6 text-center">
            <p className="text-sm text-muted-foreground">{erroElegibilidade}</p>
          </div>
        )}

        {elegibilidade === "email_nao_verificado" && (
          <div className="glass rounded-2xl p-6 space-y-3">
            <div className="flex items-center gap-2.5">
              <AlertTriangle size={18} strokeWidth={1.6} className="text-amber-600" />
              <h2 className="text-lg font-medium text-foreground">Confirme seu e-mail</h2>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Para publicar um artigo é preciso confirmar seu e-mail. Procure a mensagem de
              confirmação que enviamos quando você criou a conta e clique no link.
            </p>
          </div>
        )}

        {elegibilidade === "sancionado" && sancao && (
          <div className="glass rounded-2xl p-6 space-y-3">
            <div className="flex items-center gap-2.5">
              <Ban size={18} strokeWidth={1.6} className="text-red-600" />
              <h2 className="text-lg font-medium text-foreground">
                Sua conta não pode publicar no momento
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{sancao.motivo}</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {sancao.fim
                ? `Esta restrição vale até ${formatarData(sancao.fim)}.`
                : "Esta restrição não tem data marcada para terminar."}
            </p>
          </div>
        )}

        {elegibilidade === "liberado" && (
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
                {conteudo.trim().length} caracteres (mínimo {CONTEUDO_MIN})
              </p>
            </div>

            {erroFormulario && <p className="text-sm text-red-500 text-center">{erroFormulario}</p>}

            <button
              type="button"
              onClick={handlePublicar}
              disabled={publicando}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm uppercase tracking-widest text-cyan-glow border border-cyan-glow/40 hover:bg-cyan-glow/10 disabled:opacity-40 transition-colors duration-300"
            >
              <PenLine size={14} strokeWidth={1.6} />
              {publicando ? "Publicando…" : "Publicar artigo"}
            </button>
          </div>
        )}

        <div className="text-center mt-6">
          <Link
            to="/artigos"
            className="inline-block text-sm text-cyan-glow/70 hover:text-cyan-glow transition-colors"
          >
            ← Voltar para os artigos
          </Link>
        </div>
      </div>
    </main>
  );
}
