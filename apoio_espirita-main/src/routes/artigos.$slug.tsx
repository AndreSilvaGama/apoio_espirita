import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertTriangle, Clock, FileQuestion, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AvaliacaoArtigo } from "@/components/AvaliacaoArtigo";
import { mensagemDeErro } from "@/lib/erros";

export const Route = createFileRoute("/artigos/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: "Artigo — Apoio Espírita" },
      {
        name: "description",
        content: "Leia este artigo da comunidade espírita, avaliado pelos próprios leitores.",
      },
      { property: "og:title", content: "Artigo — Apoio Espírita" },
      { property: "og:url", content: `https://apoioespirita.com.br/artigos/${params.slug}` },
    ],
    links: [{ rel: "canonical", href: `https://apoioespirita.com.br/artigos/${params.slug}` }],
  }),
  component: ArtigoPage,
});

interface ArtigoCompleto {
  id: string;
  autor_id: string;
  titulo: string | null;
  slug: string | null;
  resumo: string | null;
  conteudo: string | null;
  estado: string | null;
  autor_nome: string | null;
  autor_sigla_casa: string | null;
  publicado_em: string | null;
  editado_em: string | null;
  aval_otimo: number | null;
  aval_bom: number | null;
  aval_gostei: number | null;
  aval_nao_gostei: number | null;
  piso_atual: number | null;
}

type Situacao = "carregando" | "publicado" | "retirado" | "nao_encontrado" | "erro";

function formatarData(iso: string | null): string {
  if (!iso) return "";
  try {
    return format(parseISO(iso), "d 'de' MMMM 'de' yyyy", { locale: ptBR });
  } catch {
    return "";
  }
}

function AvisoRetirado() {
  return (
    <div className="glass rounded-2xl p-6 space-y-3">
      <div className="flex items-center gap-2.5">
        <AlertTriangle size={18} strokeWidth={1.6} className="text-amber-600" />
        <h1 className="text-lg font-medium text-foreground">Este artigo foi retirado</h1>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Este texto foi retirado do ar após revisão. O endereço continua aqui para quem chegou por um
        link antigo saber o que aconteceu.
      </p>
    </div>
  );
}

function ArtigoPage() {
  const { slug } = Route.useParams();
  const [situacao, setSituacao] = useState<Situacao>("carregando");
  const [artigo, setArtigo] = useState<ArtigoCompleto | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  /**
   * Também usado depois de gravar uma avaliação, para recarregar o artigo —
   * se o gatilho do banco derrubou o texto, a tela já mostra o aviso de
   * retirada sozinha. Nesse segundo caso `mostrarCarregando` fica falso: a
   * recarga é silenciosa, sem apagar o cartão de avaliação da tela.
   */
  const carregarArtigo = useCallback(
    async (opts?: { mostrarCarregando?: boolean }) => {
      const mostrarCarregando = opts?.mostrarCarregando ?? true;
      if (mostrarCarregando) {
        setSituacao("carregando");
        setArtigo(null);
        setErro(null);
      }

      try {
        const { data: encontrado, error: erroArtigo } = await supabase
          .from("artigos_publicos")
          .select("*")
          .eq("slug", slug)
          .maybeSingle();
        if (erroArtigo) throw erroArtigo;

        if (encontrado) {
          setArtigo(encontrado as ArtigoCompleto);
          setSituacao(encontrado.estado === "publicado" ? "publicado" : "retirado");
          return;
        }

        const { data: aviso, error: erroAviso } = await supabase
          .from("artigos_avisos")
          .select("slug")
          .eq("slug", slug)
          .maybeSingle();
        if (erroAviso) throw erroAviso;

        setSituacao(aviso ? "retirado" : "nao_encontrado");
      } catch (e) {
        setErro(mensagemDeErro(e, "Não foi possível carregar este artigo."));
        setSituacao("erro");
      }
    },
    [slug],
  );

  useEffect(() => {
    carregarArtigo();
  }, [carregarArtigo]);

  return (
    <main className="page-light min-h-screen px-4 pt-20 pb-20">
      <div className="mx-auto max-w-2xl">
        {situacao === "carregando" && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-3 border-cyan-glow/30 border-t-cyan-glow rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground font-light">Carregando artigo…</p>
          </div>
        )}

        {situacao === "erro" && (
          <div className="glass rounded-2xl p-6 text-center">
            <p className="text-sm text-muted-foreground">{erro}</p>
          </div>
        )}

        {situacao === "retirado" && <AvisoRetirado />}

        {situacao === "nao_encontrado" && (
          <div className="glass rounded-2xl p-6 space-y-3">
            <div className="flex items-center gap-2.5">
              <FileQuestion size={18} strokeWidth={1.6} className="text-muted-foreground" />
              <h1 className="text-lg font-medium text-foreground">Artigo não encontrado</h1>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Não existe nenhum artigo neste endereço. Ele pode ter sido digitado errado ou o link
              pode estar desatualizado.
            </p>
            <Link
              to="/artigos"
              className="inline-block text-sm text-cyan-glow/70 hover:text-cyan-glow transition-colors"
            >
              ← Ver todos os artigos
            </Link>
          </div>
        )}

        {situacao === "publicado" && artigo && (
          <article className="space-y-8">
            <header className="space-y-4">
              <h1 className="text-2xl md:text-3xl font-light text-foreground leading-snug">
                {artigo.titulo}
              </h1>
              <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground/70">
                <span className="flex items-center gap-1.5">
                  <User size={12} strokeWidth={1.6} />
                  {artigo.autor_nome ?? "Anônimo"}
                  {artigo.autor_sigla_casa ? ` · ${artigo.autor_sigla_casa}` : ""}
                </span>
                {artigo.publicado_em && (
                  <span className="flex items-center gap-1.5">
                    <Clock size={12} strokeWidth={1.6} />
                    {formatarData(artigo.publicado_em)}
                  </span>
                )}
              </div>
            </header>

            <div className="glass rounded-3xl p-8 md:p-10">
              {(artigo.conteudo ?? "").split("\n\n").map((paragrafo, i) => (
                <p
                  key={i}
                  className="text-muted-foreground font-light leading-relaxed mb-4 last:mb-0"
                >
                  {paragrafo}
                </p>
              ))}
            </div>

            <AvaliacaoArtigo
              artigoId={artigo.id}
              autorId={artigo.autor_id}
              contagens={{
                otimo: artigo.aval_otimo ?? 0,
                bom: artigo.aval_bom ?? 0,
                gostei: artigo.aval_gostei ?? 0,
                nao_gostei: artigo.aval_nao_gostei ?? 0,
              }}
              pisoAtual={artigo.piso_atual ?? 0}
              onAvaliado={() => carregarArtigo({ mostrarCarregando: false })}
            />

            <div className="text-center">
              <Link
                to="/artigos"
                className="inline-block text-sm text-cyan-glow/70 hover:text-cyan-glow transition-colors"
              >
                ← Ver todos os artigos
              </Link>
            </div>
          </article>
        )}
      </div>
    </main>
  );
}
