import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BookOpen, Clock, PenLine, ThumbsUp, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { mensagemDeErro } from "@/lib/erros";

export const Route = createFileRoute("/artigos/")({
  head: () => ({
    meta: [
      { title: "Artigos da Comunidade — Apoio Espírita" },
      {
        name: "description",
        content:
          "Artigos escritos por membros da comunidade espírita, avaliados pelos próprios leitores. Estudo, reflexão e vivência do Evangelho.",
      },
      {
        name: "keywords",
        content: "artigos espiritas, comunidade espirita, textos espiritismo, estudo espirita",
      },
      { property: "og:title", content: "Artigos da Comunidade — Apoio Espírita" },
      {
        property: "og:description",
        content:
          "Artigos escritos por membros da comunidade espírita, avaliados pelos próprios leitores.",
      },
      { property: "og:url", content: "https://apoioespirita.com.br/artigos" },
    ],
    links: [{ rel: "canonical", href: "https://apoioespirita.com.br/artigos" }],
  }),
  component: ArtigosIndex,
});

type Ordem = "recentes" | "avaliados";

interface ArtigoResumo {
  id: string;
  titulo: string;
  slug: string;
  resumo: string | null;
  autor_nome: string | null;
  autor_sigla_casa: string | null;
  publicado_em: string | null;
  aprovacoes: number | null;
}

async function carregar(ordem: Ordem): Promise<ArtigoResumo[]> {
  const coluna = ordem === "avaliados" ? "aprovacoes" : "publicado_em";
  const { data, error } = await supabase
    .from("artigos_publicos")
    .select("id,titulo,slug,resumo,autor_nome,autor_sigla_casa,publicado_em,aprovacoes")
    .eq("estado", "publicado")
    .order(coluna, { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as ArtigoResumo[];
}

function formatarData(iso: string | null): string {
  if (!iso) return "";
  try {
    return format(parseISO(iso), "d 'de' MMMM 'de' yyyy", { locale: ptBR });
  } catch {
    return "";
  }
}

function ArtigosIndex() {
  const { user } = useAuth();
  const [ordem, setOrdem] = useState<Ordem>("recentes");
  const [artigos, setArtigos] = useState<ArtigoResumo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    setErro(null);
    carregar(ordem)
      .then((dados) => {
        if (!cancelado) setArtigos(dados);
      })
      .catch((e) => {
        if (!cancelado) setErro(mensagemDeErro(e, "Não foi possível carregar os artigos."));
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [ordem]);

  const botaoOrdemCls = (o: Ordem) =>
    `px-4 py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
      ordem === o
        ? "bg-cyan-glow/10 text-cyan-glow border-cyan-glow/40"
        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
    }`;

  return (
    <main className="page-light min-h-screen px-4 pt-20 pb-20">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-glow mb-2">Comunidade</p>
            <h1 className="text-3xl font-light text-foreground">Artigos</h1>
            <p className="mt-2 text-sm text-muted-foreground font-light max-w-lg">
              Textos escritos por membros da comunidade e avaliados pelos próprios leitores.
            </p>
          </div>
          {user && (
            <Link
              to="/artigos/novo"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium uppercase tracking-widest text-cyan-glow border border-cyan-glow/40 hover:bg-cyan-glow/10 transition-colors shrink-0"
            >
              <PenLine size={14} strokeWidth={1.6} />
              Escrever artigo
            </Link>
          )}
        </div>

        {/* Ordenação */}
        <div className="flex items-center gap-2 mb-6">
          <button
            type="button"
            onClick={() => setOrdem("recentes")}
            className={botaoOrdemCls("recentes")}
          >
            Mais recentes
          </button>
          <button
            type="button"
            onClick={() => setOrdem("avaliados")}
            className={botaoOrdemCls("avaliados")}
          >
            Mais bem avaliados
          </button>
        </div>

        {/* Conteúdo */}
        {carregando && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-3 border-cyan-glow/30 border-t-cyan-glow rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground font-light">Carregando artigos…</p>
          </div>
        )}

        {!carregando && erro && (
          <div className="glass rounded-2xl p-6 text-center">
            <p className="text-sm text-muted-foreground">{erro}</p>
          </div>
        )}

        {!carregando && !erro && artigos.length === 0 && (
          <div className="glass rounded-3xl p-10 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-100 flex items-center justify-center mx-auto">
              <BookOpen size={20} strokeWidth={1.5} className="text-cyan-700" />
            </div>
            <p className="text-sm text-muted-foreground font-light">
              Ainda não há artigos publicados.
            </p>
            {user && (
              <Link
                to="/artigos/novo"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium uppercase tracking-widest text-cyan-glow border border-cyan-glow/40 hover:bg-cyan-glow/10 transition-colors"
              >
                <PenLine size={14} strokeWidth={1.6} />
                Escrever o primeiro artigo
              </Link>
            )}
          </div>
        )}

        {!carregando && !erro && artigos.length > 0 && (
          <div className="space-y-3">
            {artigos.map((a) => (
              <Link
                key={a.id}
                to="/artigos/$slug"
                params={{ slug: a.slug }}
                className="block glass rounded-2xl p-5 hover:shadow-md transition-all duration-300"
              >
                <h2 className="text-base font-medium text-foreground leading-snug">{a.titulo}</h2>
                {a.resumo && (
                  <p className="text-sm text-muted-foreground/70 mt-1.5 font-light leading-relaxed line-clamp-2">
                    {a.resumo}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-4 flex-wrap">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
                    <User size={12} strokeWidth={1.6} />
                    {a.autor_nome ?? "Anônimo"}
                    {a.autor_sigla_casa ? ` · ${a.autor_sigla_casa}` : ""}
                  </span>
                  {a.publicado_em && (
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
                      <Clock size={12} strokeWidth={1.6} />
                      {formatarData(a.publicado_em)}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
                    <ThumbsUp size={12} strokeWidth={1.6} />
                    {a.aprovacoes ?? 0} aprovações
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
