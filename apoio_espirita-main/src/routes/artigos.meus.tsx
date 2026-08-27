import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertTriangle, CheckCircle2, Clock, PenLine, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ROTULOS, type TipoAvaliacao } from "@/lib/artigos";
import { mensagemDeErro } from "@/lib/erros";

export const Route = createFileRoute("/artigos/meus")({
  head: () => ({
    meta: [{ title: "Meus artigos — Apoio Espírita" }, { name: "robots", content: "noindex" }],
  }),
  component: ArtigosMeus,
});

type EstadoArtigo = "publicado" | "retirado" | "em_correcao";

interface Artigo {
  id: string;
  titulo: string;
  slug: string;
  resumo: string | null;
  estado: EstadoArtigo;
  retirado_motivo: string | null;
  publicado_em: string | null;
  editado_em: string | null;
}

interface ErroApontado {
  tipo: TipoAvaliacao;
  descricao_erro: string;
  autor_nome: string;
}

function formatarData(iso: string | null): string {
  if (!iso) return "";
  try {
    return format(parseISO(iso), "d 'de' MMMM 'de' yyyy", { locale: ptBR });
  } catch {
    return "";
  }
}

const ESTADO_INFO: Record<
  EstadoArtigo,
  { rotulo: string; classe: string; icone: typeof CheckCircle2 }
> = {
  publicado: {
    rotulo: "Publicado",
    classe: "bg-cyan-glow/10 text-cyan-glow border-cyan-glow/30",
    icone: CheckCircle2,
  },
  retirado: {
    rotulo: "Retirado do ar",
    classe: "bg-red-50 text-red-700 border-red-200",
    icone: AlertTriangle,
  },
  em_correcao: {
    rotulo: "Em correção",
    classe: "bg-amber-50 text-amber-700 border-amber-200",
    icone: Wrench,
  },
};

function EstadoBadge({ estado }: { estado: EstadoArtigo }) {
  const info = ESTADO_INFO[estado];
  const Icone = info.icone;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${info.classe}`}
    >
      <Icone size={12} strokeWidth={1.8} />
      {info.rotulo}
    </span>
  );
}

function ArtigosMeus() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [artigos, setArtigos] = useState<Artigo[]>([]);
  const [errosPorArtigo, setErrosPorArtigo] = useState<Record<string, ErroApontado[]>>({});

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  const carregar = useCallback(async () => {
    if (!user) return;
    setCarregando(true);
    setErro(null);

    try {
      const { data: meusArtigos, error: erroArtigos } = await supabase
        .from("artigos")
        .select("id, titulo, slug, resumo, estado, retirado_motivo, publicado_em, editado_em")
        .eq("autor_id", user.id)
        .order("publicado_em", { ascending: false });
      if (erroArtigos) throw erroArtigos;

      const lista = (meusArtigos ?? []) as Artigo[];
      setArtigos(lista);

      const idsForaDoAr = lista
        .filter((a) => a.estado === "retirado" || a.estado === "em_correcao")
        .map((a) => a.id);

      if (idsForaDoAr.length === 0) {
        setErrosPorArtigo({});
        return;
      }

      // A descrição do erro é uma acusação escrita sobre pessoa identificada:
      // política de acesso só libera esta tabela para o autor, quem revisa e o
      // próprio avaliador. Aqui lemos como autor, dos nossos próprios artigos.
      const { data: avaliacoes, error: erroAvaliacoes } = await supabase
        .from("artigo_avaliacoes")
        .select("artigo_id, tipo, descricao_erro, user_id, avaliador_nome")
        .in("artigo_id", idsForaDoAr)
        .in("tipo", ["erro", "erro_grave"])
        .order("created_at", { ascending: true });
      if (erroAvaliacoes) throw erroAvaliacoes;

      // avaliador_nome vem congelado no voto (mesmo padrão de artigos.autor_nome).
      // profiles_public só é consultada para avaliações antigas, gravadas antes
      // da coluna existir — mesmo padrão do kanban (src/routes/kanban.tsx) para o
      // que ainda depende dela. Colunas anuláveis — descarta linhas sem id/nome.
      const idsAvaliadores = [
        ...new Set((avaliacoes ?? []).filter((a) => !a.avaliador_nome).map((a) => a.user_id)),
      ];
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

      const agrupado: Record<string, ErroApontado[]> = {};
      for (const av of avaliacoes ?? []) {
        if (!av.descricao_erro) continue;
        const entrada: ErroApontado = {
          tipo: av.tipo as TipoAvaliacao,
          descricao_erro: av.descricao_erro,
          autor_nome: av.avaliador_nome ?? nomePorId.get(av.user_id) ?? "Um avaliador",
        };
        (agrupado[av.artigo_id] ??= []).push(entrada);
      }
      setErrosPorArtigo(agrupado);
    } catch (e) {
      setErro(mensagemDeErro(e, "Não foi possível carregar seus artigos."));
    } finally {
      setCarregando(false);
    }
  }, [user]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  if (loading || !user) return null;

  return (
    <main className="page-light min-h-screen px-4 pt-20 pb-20">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-glow mb-2">Comunidade</p>
            <h1 className="text-3xl font-light text-foreground">Meus artigos</h1>
            <p className="mt-2 text-sm text-muted-foreground font-light max-w-lg">
              Acompanhe o estado dos seus textos e corrija o que a comunidade apontou.
            </p>
          </div>
          <Link
            to="/artigos/novo"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium uppercase tracking-widest text-cyan-glow border border-cyan-glow/40 hover:bg-cyan-glow/10 transition-colors shrink-0"
          >
            <PenLine size={14} strokeWidth={1.6} />
            Escrever artigo
          </Link>
        </div>

        {carregando && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-3 border-cyan-glow/30 border-t-cyan-glow rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground font-light">Carregando seus artigos…</p>
          </div>
        )}

        {!carregando && erro && (
          <div className="glass rounded-2xl p-6 text-center">
            <p className="text-sm text-muted-foreground">{erro}</p>
          </div>
        )}

        {!carregando && !erro && artigos.length === 0 && (
          <div className="glass rounded-3xl p-10 text-center space-y-4">
            <p className="text-sm text-muted-foreground font-light">
              Você ainda não escreveu nenhum artigo.
            </p>
            <Link
              to="/artigos/novo"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium uppercase tracking-widest text-cyan-glow border border-cyan-glow/40 hover:bg-cyan-glow/10 transition-colors"
            >
              <PenLine size={14} strokeWidth={1.6} />
              Escrever o primeiro artigo
            </Link>
          </div>
        )}

        {!carregando && !erro && artigos.length > 0 && (
          <div className="space-y-4">
            {artigos.map((a) => {
              const foraDoAr = a.estado === "retirado" || a.estado === "em_correcao";
              const erros = errosPorArtigo[a.id] ?? [];
              return (
                <div key={a.id} className="glass rounded-2xl p-6 space-y-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <h2 className="text-base font-medium text-foreground leading-snug">
                        {a.titulo}
                      </h2>
                      {a.resumo && (
                        <p className="text-sm text-muted-foreground/70 mt-1.5 font-light leading-relaxed line-clamp-2">
                          {a.resumo}
                        </p>
                      )}
                    </div>
                    <EstadoBadge estado={a.estado} />
                  </div>

                  <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground/60">
                    {a.publicado_em && (
                      <span className="flex items-center gap-1.5">
                        <Clock size={12} strokeWidth={1.6} />
                        Publicado em {formatarData(a.publicado_em)}
                      </span>
                    )}
                    {a.editado_em && (
                      <span className="flex items-center gap-1.5">
                        <Clock size={12} strokeWidth={1.6} />
                        Editado em {formatarData(a.editado_em)}
                      </span>
                    )}
                  </div>

                  {foraDoAr && (
                    <div className="border-t border-white/10 pt-4 space-y-3">
                      {a.retirado_motivo && (
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {a.retirado_motivo}
                        </p>
                      )}

                      {erros.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs uppercase tracking-widest text-muted-foreground">
                            {erros.length === 1
                              ? "1 erro apontado"
                              : `${erros.length} erros apontados`}
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
                      )}

                      <Link
                        to="/artigos/$slug/editar"
                        params={{ slug: a.slug }}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium uppercase tracking-widest text-cyan-glow border border-cyan-glow/40 hover:bg-cyan-glow/10 transition-colors"
                      >
                        <PenLine size={14} strokeWidth={1.6} />
                        Corrigir este artigo
                      </Link>
                    </div>
                  )}

                  {a.estado === "publicado" && (
                    <div className="flex items-center gap-4">
                      <Link
                        to="/artigos/$slug"
                        params={{ slug: a.slug }}
                        className="text-sm text-cyan-glow/70 hover:text-cyan-glow transition-colors"
                      >
                        Ver artigo →
                      </Link>
                      <Link
                        to="/artigos/$slug/editar"
                        params={{ slug: a.slug }}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Editar
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
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
