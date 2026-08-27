import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertTriangle,
  Ban,
  EyeOff,
  RotateCcw,
  RotateCw,
  Scale,
  ShieldAlert,
  UserX,
  Users,
  type LucideIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  JUSTIFICATIVA_MINIMA,
  ROTULOS,
  justificativaValida,
  pluralCasos,
  pluralDias,
  type TipoAvaliacao,
} from "@/lib/artigos";
import { mensagemDeErro } from "@/lib/erros";

interface FilaRevisaoArtigosProps {
  escopo: "plataforma" | "casa";
  sigla?: string;
}

type OrigemCaso = "comunidade" | "humano" | "reenvio";
type TipoAcao = "restaurar" | "manter_retirado" | "suspender_autor" | "banir_autor";

interface ErroApontado {
  tipo: TipoAvaliacao;
  descricao: string;
  autorNome: string;
}

interface CasoRevisao {
  revisaoId: string;
  artigoId: string;
  abertaEm: string;
  origem: OrigemCaso;
  titulo: string;
  slug: string;
  trecho: string;
  autorId: string;
  autorNome: string;
  autorSigla: string | null;
  retiradoMotivo: string | null;
  contagens: Record<TipoAvaliacao, number>;
  erros: ErroApontado[];
}

interface FormEstado {
  acao: TipoAcao | null;
  justificativa: string;
  dias: number;
  confirmando: boolean;
  enviando: boolean;
  erro: string | null;
}

const FORM_VAZIO: FormEstado = {
  acao: null,
  justificativa: "",
  dias: 7,
  confirmando: false,
  enviando: false,
  erro: null,
};

const ORDEM_TIPOS: TipoAvaliacao[] = ["otimo", "bom", "gostei", "nao_gostei", "erro", "erro_grave"];

const CHIP_CLASSES: Record<TipoAvaliacao, string> = {
  otimo: "bg-cyan-glow/10 text-cyan-glow border-cyan-glow/30",
  bom: "bg-cyan-glow/10 text-cyan-glow border-cyan-glow/30",
  gostei: "bg-cyan-glow/10 text-cyan-glow border-cyan-glow/30",
  nao_gostei: "bg-white/5 text-muted-foreground border-white/10",
  erro: "bg-amber-50 text-amber-700 border-amber-200",
  erro_grave: "bg-red-50 text-red-700 border-red-200",
};

const ORIGEM_INFO: Record<OrigemCaso, { rotulo: string; icone: LucideIcon; classe: string }> = {
  comunidade: {
    rotulo: "Retirado pela comunidade",
    icone: Users,
    classe: "bg-amber-50 text-amber-700 border-amber-200",
  },
  humano: {
    rotulo: "Retirado por decisão humana",
    icone: ShieldAlert,
    classe: "bg-red-50 text-red-700 border-red-200",
  },
  reenvio: {
    rotulo: "Reenviado após correção",
    icone: RotateCw,
    classe: "bg-cyan-glow/10 text-cyan-glow border-cyan-glow/30",
  },
};

const ACAO_ROTULOS: Record<TipoAcao, string> = {
  restaurar: "Restaurar",
  manter_retirado: "Manter retirado",
  suspender_autor: "Suspender autor",
  banir_autor: "Banir autor",
};

const ACAO_ICONES: Record<TipoAcao, LucideIcon> = {
  restaurar: RotateCcw,
  manter_retirado: EyeOff,
  suspender_autor: UserX,
  banir_autor: Ban,
};

const ACAO_BOTAO_CLASSES: Record<TipoAcao, string> = {
  restaurar: "text-cyan-glow border-cyan-glow/40 hover:bg-cyan-glow/10",
  manter_retirado: "text-muted-foreground border-white/20 hover:bg-white/5",
  suspender_autor: "text-amber-700 border-amber-300 hover:bg-amber-50",
  banir_autor: "text-red-700 border-red-300 hover:bg-red-50",
};

const ACOES_QUE_ATINGEM_PESSOA: TipoAcao[] = ["suspender_autor", "banir_autor"];

function formatarData(iso: string): string {
  try {
    return format(parseISO(iso), "d 'de' MMMM 'de' yyyy", { locale: ptBR });
  } catch {
    return "";
  }
}

/** Resumo se houver; senão os primeiros caracteres do conteúdo. */
function trechoDoArtigo(resumo: string | null, conteudo: string): string {
  if (resumo && resumo.trim()) return resumo.trim();
  const texto = conteudo.trim();
  if (texto.length <= 220) return texto;
  return texto.slice(0, 220).trimEnd() + "…";
}

function OrigemBadge({ origem }: { origem: OrigemCaso }) {
  const info = ORIGEM_INFO[origem];
  const Icone = info.icone;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium uppercase tracking-widest border ${info.classe}`}
    >
      <Icone size={11} strokeWidth={1.8} />
      {info.rotulo}
    </span>
  );
}

export function FilaRevisaoArtigos({ escopo, sigla }: FilaRevisaoArtigosProps) {
  const { user } = useAuth();

  const [casos, setCasos] = useState<CasoRevisao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroCarga, setErroCarga] = useState<string | null>(null);
  const [forms, setForms] = useState<Record<string, FormEstado>>({});

  const obterForm = useCallback((id: string) => forms[id] ?? FORM_VAZIO, [forms]);

  const atualizarForm = useCallback((id: string, patch: Partial<FormEstado>) => {
    setForms((f) => ({ ...f, [id]: { ...(f[id] ?? FORM_VAZIO), ...patch } }));
  }, []);

  const cancelarAcao = useCallback((id: string) => {
    setForms((f) => {
      const novo = { ...f };
      delete novo[id];
      return novo;
    });
  }, []);

  const carregar = useCallback(async () => {
    if (escopo === "casa" && !sigla) {
      setCasos([]);
      setCarregando(false);
      return;
    }
    setCarregando(true);
    setErroCarga(null);

    try {
      const { data: revisoes, error: erroRevisoes } = await supabase
        .from("artigo_revisoes")
        .select("id, artigo_id, aberta_em, origem")
        .eq("estado", "aberta")
        .order("aberta_em", { ascending: true });
      if (erroRevisoes) throw erroRevisoes;

      const idsArtigos = [...new Set((revisoes ?? []).map((r) => r.artigo_id))];
      if (idsArtigos.length === 0) {
        setCasos([]);
        return;
      }

      // Lê a tabela, não a view pública: quem revisa precisa das contagens de
      // erro/erro_grave, que a view não expõe (Task 9 — placar de denúncia
      // fica fora do alcance público). A política artigos_select libera esta
      // leitura para quem pode_revisar_artigo, e o filtro de casa abaixo é
      // redundante com a política — mantido para reduzir o que trafega.
      let consultaArtigos = supabase
        .from("artigos")
        .select(
          "id, titulo, slug, resumo, conteudo, autor_id, autor_nome, autor_sigla_casa, aval_otimo, aval_bom, aval_gostei, aval_nao_gostei, aval_erro, aval_erro_grave, retirado_motivo",
        )
        .in("id", idsArtigos);
      if (escopo === "casa" && sigla) {
        consultaArtigos = consultaArtigos.eq("autor_sigla_casa", sigla);
      }
      const { data: artigosData, error: erroArtigos } = await consultaArtigos;
      if (erroArtigos) throw erroArtigos;

      const artigoPorId = new Map((artigosData ?? []).map((a) => [a.id, a]));
      const idsVisiveis = [...artigoPorId.keys()];

      const { data: avaliacoes, error: erroAvaliacoes } =
        idsVisiveis.length > 0
          ? await supabase
              .from("artigo_avaliacoes")
              .select("artigo_id, tipo, descricao_erro, user_id, avaliador_nome")
              .in("artigo_id", idsVisiveis)
              .in("tipo", ["erro", "erro_grave"])
              .order("created_at", { ascending: true })
          : { data: [], error: null };
      if (erroAvaliacoes) throw erroAvaliacoes;

      // avaliador_nome vem congelado no voto (mesmo padrão de artigos.autor_nome).
      // profiles_public só é consultada para avaliações antigas, gravadas antes
      // da coluna existir.
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

      const errosPorArtigo: Record<string, ErroApontado[]> = {};
      for (const av of avaliacoes ?? []) {
        if (!av.descricao_erro) continue;
        (errosPorArtigo[av.artigo_id] ??= []).push({
          tipo: av.tipo as TipoAvaliacao,
          descricao: av.descricao_erro,
          autorNome: av.avaliador_nome ?? nomePorId.get(av.user_id) ?? "Um avaliador",
        });
      }

      const lista: CasoRevisao[] = [];
      for (const r of revisoes ?? []) {
        const a = artigoPorId.get(r.artigo_id);
        if (!a) continue; // fora do escopo desta fila, ou artigo já removido
        lista.push({
          revisaoId: r.id,
          artigoId: r.artigo_id,
          abertaEm: r.aberta_em,
          origem: r.origem as OrigemCaso,
          titulo: a.titulo,
          slug: a.slug,
          trecho: trechoDoArtigo(a.resumo, a.conteudo),
          autorId: a.autor_id,
          autorNome: a.autor_nome,
          autorSigla: a.autor_sigla_casa,
          retiradoMotivo: a.retirado_motivo,
          contagens: {
            otimo: a.aval_otimo,
            bom: a.aval_bom,
            gostei: a.aval_gostei,
            nao_gostei: a.aval_nao_gostei,
            erro: a.aval_erro,
            erro_grave: a.aval_erro_grave,
          },
          erros: errosPorArtigo[r.artigo_id] ?? [],
        });
      }
      setCasos(lista);
    } catch (e) {
      setErroCarga(mensagemDeErro(e, "Não foi possível carregar a fila de revisão."));
    } finally {
      setCarregando(false);
    }
  }, [escopo, sigla]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function executarAcao(caso: CasoRevisao, acao: TipoAcao) {
    if (!user) return;
    const form = obterForm(caso.revisaoId);
    atualizarForm(caso.revisaoId, { enviando: true, erro: null });

    try {
      // Uma única chamada atômica: o banco faz o update de artigos, o insert
      // em usuarios_sancoes e o update de artigo_revisoes dentro da mesma
      // transação, travando a linha da revisão — um segundo clique nunca cria
      // uma segunda sanção. As mensagens de erro já vêm prontas em português
      // (inclusive a de revisão já resolvida) e são mostradas ao revisor sem
      // alteração, no catch abaixo.
      const { error } = await supabase.rpc("resolver_revisao_artigo", {
        p_revisao: caso.revisaoId,
        p_decisao: acao,
        p_justificativa: form.justificativa.trim(),
        p_dias_suspensao: acao === "suspender_autor" ? form.dias : undefined,
      });
      if (error) throw error;

      setCasos((cs) => cs.filter((c) => c.revisaoId !== caso.revisaoId));
      cancelarAcao(caso.revisaoId);
    } catch (e) {
      atualizarForm(caso.revisaoId, {
        enviando: false,
        erro: mensagemDeErro(e, "Não foi possível concluir esta decisão."),
      });
    }
  }

  function avancar(caso: CasoRevisao) {
    const form = obterForm(caso.revisaoId);
    if (!justificativaValida(form.justificativa)) {
      atualizarForm(caso.revisaoId, {
        erro: `A justificativa precisa ter pelo menos ${JUSTIFICATIVA_MINIMA} caracteres.`,
      });
      return;
    }
    if (form.acao === "suspender_autor" && (!Number.isInteger(form.dias) || form.dias < 1)) {
      atualizarForm(caso.revisaoId, { erro: "Informe um número de dias válido (no mínimo 1)." });
      return;
    }
    if (form.acao && ACOES_QUE_ATINGEM_PESSOA.includes(form.acao)) {
      atualizarForm(caso.revisaoId, { erro: null, confirmando: true });
      return;
    }
    if (form.acao) executarAcao(caso, form.acao);
  }

  if (carregando) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-8 h-8 border-3 border-cyan-glow/30 border-t-cyan-glow rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground font-light">Carregando a fila de revisão…</p>
      </div>
    );
  }

  if (erroCarga) {
    return (
      <div className="glass rounded-2xl p-6 text-center">
        <p className="text-sm text-muted-foreground">{erroCarga}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <Scale size={18} strokeWidth={1.8} className="text-cyan-glow" />
          <h2 className="text-base font-medium text-foreground">Fila de revisão de artigos</h2>
        </div>
        {casos.length > 0 && (
          <span className="text-xs text-muted-foreground/70">
            {casos.length} {pluralCasos(casos.length)} aguardando decisão
          </span>
        )}
      </div>

      {casos.length === 0 && (
        <div className="glass rounded-2xl p-8 text-center">
          <p className="text-sm text-muted-foreground font-light">
            Nenhum caso aguardando decisão. Tudo revisado.
          </p>
        </div>
      )}

      {casos.map((caso) => {
        const form = obterForm(caso.revisaoId);
        return (
          <div key={caso.revisaoId} className="glass rounded-2xl p-6 space-y-5">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <OrigemBadge origem={caso.origem} />
                  <span className="text-xs text-muted-foreground/60">
                    Aberta em {formatarData(caso.abertaEm)}
                  </span>
                </div>
                <h3 className="text-base font-medium text-foreground leading-snug">
                  {caso.titulo}
                </h3>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  {caso.autorNome}
                  {caso.autorSigla ? ` · ${caso.autorSigla}` : ""}
                </p>
              </div>
              <Link
                to="/artigos/$slug"
                params={{ slug: caso.slug }}
                target="_blank"
                className="text-xs text-cyan-glow/70 hover:text-cyan-glow transition-colors shrink-0"
              >
                Ver artigo →
              </Link>
            </div>

            {caso.trecho && (
              <p className="text-sm text-muted-foreground font-light leading-relaxed">
                {caso.trecho}
              </p>
            )}

            {caso.retiradoMotivo && (
              <p className="text-xs leading-relaxed text-muted-foreground/80 border-l-2 border-amber-400/40 pl-3">
                {caso.retiradoMotivo}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              {ORDEM_TIPOS.map((tipo) => (
                <span
                  key={tipo}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border ${CHIP_CLASSES[tipo]}`}
                >
                  {ROTULOS[tipo]} <strong>{caso.contagens[tipo]}</strong>
                </span>
              ))}
            </div>

            {caso.erros.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  {caso.erros.length === 1
                    ? "1 erro apontado"
                    : `${caso.erros.length} erros apontados`}
                </p>
                <ul className="space-y-2">
                  {caso.erros.map((e, i) => (
                    <li
                      key={i}
                      className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm"
                    >
                      <p className="text-xs uppercase tracking-widest text-amber-700 mb-1">
                        {ROTULOS[e.tipo]} · {e.autorNome}
                      </p>
                      <p className="text-muted-foreground leading-relaxed">{e.descricao}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="border-t border-white/10 pt-4">
              {form.acao === null && (
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(ACAO_ROTULOS) as TipoAcao[]).map((acao) => {
                    const Icone = ACAO_ICONES[acao];
                    return (
                      <button
                        key={acao}
                        type="button"
                        onClick={() => atualizarForm(caso.revisaoId, { ...FORM_VAZIO, acao })}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium uppercase tracking-widest border transition-colors ${ACAO_BOTAO_CLASSES[acao]}`}
                      >
                        <Icone size={13} strokeWidth={1.8} />
                        {ACAO_ROTULOS[acao]}
                      </button>
                    );
                  })}
                </div>
              )}

              {form.acao !== null && !form.confirmando && (
                <div className="space-y-3">
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground">
                    Justificativa <span className="text-cyan-glow">*</span>
                  </label>
                  <textarea
                    value={form.justificativa}
                    onChange={(e) =>
                      atualizarForm(caso.revisaoId, { justificativa: e.target.value, erro: null })
                    }
                    rows={3}
                    placeholder="Explique o motivo desta decisão — o registro fica salvo na revisão"
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-cyan-glow/40 transition-colors resize-y"
                  />
                  <p className="text-xs text-muted-foreground/60">
                    {form.justificativa.trim().length}/{JUSTIFICATIVA_MINIMA} caracteres
                  </p>

                  {form.acao === "suspender_autor" && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <label className="text-xs uppercase tracking-widest text-muted-foreground shrink-0">
                        Duração da suspensão
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={form.dias}
                        onChange={(e) =>
                          atualizarForm(caso.revisaoId, {
                            dias: Math.max(1, Math.trunc(Number(e.target.value)) || 1),
                          })
                        }
                        className="w-20 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-foreground focus:outline-none focus:border-cyan-glow/40 transition-colors"
                      />
                      <span className="text-xs text-muted-foreground">
                        {pluralDias(form.dias)}, a partir de hoje
                      </span>
                    </div>
                  )}

                  {form.erro && <p className="text-sm text-red-500">{form.erro}</p>}

                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => avancar(caso)}
                      disabled={form.enviando}
                      className={`px-5 py-2.5 rounded-xl text-xs uppercase tracking-widest border disabled:opacity-40 transition-colors duration-300 ${ACAO_BOTAO_CLASSES[form.acao]}`}
                    >
                      {form.enviando
                        ? "Enviando…"
                        : ACOES_QUE_ATINGEM_PESSOA.includes(form.acao)
                          ? "Continuar"
                          : "Confirmar decisão"}
                    </button>
                    <button
                      type="button"
                      onClick={() => cancelarAcao(caso.revisaoId)}
                      disabled={form.enviando}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {form.acao !== null && form.confirmando && (
                <div className="space-y-4 rounded-xl border border-red-200 bg-red-50/60 p-5">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle
                      size={18}
                      strokeWidth={1.8}
                      className="text-red-600 shrink-0 mt-0.5"
                    />
                    <p className="text-sm leading-relaxed text-red-800">
                      {form.acao === "suspender_autor"
                        ? `Você está prestes a suspender ${caso.autorNome} por ${form.dias} ${pluralDias(form.dias)}, a partir de hoje. Durante este período a pessoa não poderá publicar nem avaliar artigos.`
                        : `Você está prestes a banir ${caso.autorNome} da plataforma, sem prazo para terminar. A pessoa deixará de poder publicar e avaliar artigos até que a decisão seja revista.`}
                    </p>
                  </div>
                  <p className="text-sm text-red-800/80 leading-relaxed">
                    Justificativa registrada: "{form.justificativa.trim()}"
                  </p>

                  {form.erro && <p className="text-sm text-red-700">{form.erro}</p>}

                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => form.acao && executarAcao(caso, form.acao)}
                      disabled={form.enviando}
                      className="px-5 py-2.5 rounded-xl text-xs uppercase tracking-widest text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 transition-colors"
                    >
                      {form.enviando
                        ? "Enviando…"
                        : form.acao === "suspender_autor"
                          ? "Confirmar suspensão"
                          : "Confirmar banimento"}
                    </button>
                    <button
                      type="button"
                      onClick={() => atualizarForm(caso.revisaoId, { confirmando: false })}
                      disabled={form.enviando}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
                    >
                      Voltar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
