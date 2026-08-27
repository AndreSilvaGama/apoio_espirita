import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertTriangle, Ban } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  DESCRICAO_MINIMA,
  ROTULOS,
  descricaoValida,
  exigeDescricao,
  type TipoAvaliacao,
} from "@/lib/artigos";
import { mensagemDeErro } from "@/lib/erros";

/** Só os quatro tipos que a comunidade vê em público — nunca os de erro. */
const TIPOS_PUBLICOS = ["otimo", "bom", "gostei", "nao_gostei"] as const;

const ORDEM_BOTOES: TipoAvaliacao[] = [
  "otimo",
  "bom",
  "gostei",
  "nao_gostei",
  "erro",
  "erro_grave",
];

/** Azul do sistema nos três primeiros, neutro em "Não gostei", âmbar e vermelho contido nos dois de erro. */
const CORES: Record<TipoAvaliacao, { base: string; ativo: string }> = {
  otimo: {
    base: "border-cyan-glow/40 text-cyan-glow hover:bg-cyan-glow/10",
    ativo: "bg-cyan-glow/15 border-cyan-glow text-cyan-glow",
  },
  bom: {
    base: "border-cyan-glow/40 text-cyan-glow hover:bg-cyan-glow/10",
    ativo: "bg-cyan-glow/15 border-cyan-glow text-cyan-glow",
  },
  gostei: {
    base: "border-cyan-glow/40 text-cyan-glow hover:bg-cyan-glow/10",
    ativo: "bg-cyan-glow/15 border-cyan-glow text-cyan-glow",
  },
  nao_gostei: {
    base: "border-gray-300 text-gray-600 hover:bg-gray-50",
    ativo: "bg-gray-100 border-gray-500 text-gray-800",
  },
  erro: {
    base: "border-amber-500/40 text-amber-700 hover:bg-amber-500/10",
    ativo: "bg-amber-500/15 border-amber-600 text-amber-800",
  },
  erro_grave: {
    base: "border-red-500/40 text-red-700 hover:bg-red-500/10",
    ativo: "bg-red-500/15 border-red-600 text-red-800",
  },
};

type Contagens = Record<(typeof TIPOS_PUBLICOS)[number], number>;

interface MeuVoto {
  tipo: TipoAvaliacao;
  descricao_erro: string | null;
}

interface Sancao {
  motivo: string;
  fim: string | null;
}

type Elegibilidade = "carregando" | "liberado" | "email_nao_verificado" | "sancionado" | "erro";

function formatarData(iso: string): string {
  try {
    return format(parseISO(iso), "d 'de' MMMM 'de' yyyy", { locale: ptBR });
  } catch {
    return "";
  }
}

interface AvaliacaoArtigoProps {
  artigoId: string;
  autorId: string;
  contagens: Contagens;
  /**
   * Quantas marcações de "tem erro grave" são necessárias para a retirada
   * automática. Recebido para manter a interface combinada com o resto da
   * tela, mas deliberadamente NÃO é exibido aqui: mostrar o piso ao lado de
   * qualquer contagem de erro grave permitiria estimar essa contagem, que é
   * exatamente o placar que a Task 9 proíbe tornar público.
   */
  pisoAtual: number;
  onAvaliado: () => void;
}

export function AvaliacaoArtigo({
  artigoId,
  autorId,
  contagens,
  onAvaliado,
}: AvaliacaoArtigoProps) {
  const { user } = useAuth();
  const ehAutor = !!user && user.id === autorId;

  const [elegibilidade, setElegibilidade] = useState<Elegibilidade>("carregando");
  const [erroElegibilidade, setErroElegibilidade] = useState<string | null>(null);
  const [sancao, setSancao] = useState<Sancao | null>(null);
  const [meuVoto, setMeuVoto] = useState<MeuVoto | null>(null);

  const [painelAberto, setPainelAberto] = useState<TipoAvaliacao | null>(null);
  const [descricaoTexto, setDescricaoTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);

  useEffect(() => {
    if (!user || ehAutor) return;
    let cancelado = false;
    setElegibilidade("carregando");
    setErroElegibilidade(null);
    setSancao(null);

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
            mensagemDeErro(e, "Não foi possível conferir se você pode avaliar."),
          );
          setElegibilidade("erro");
        }
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [user, ehAutor, artigoId]);

  useEffect(() => {
    if (elegibilidade !== "liberado" || !user) return;
    let cancelado = false;

    (async () => {
      const { data, error } = await supabase
        .from("artigo_avaliacoes")
        .select("tipo, descricao_erro")
        .eq("artigo_id", artigoId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!cancelado && !error && data) {
        setMeuVoto(data as MeuVoto);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [elegibilidade, user, artigoId]);

  function abrirPainelErro(tipo: TipoAvaliacao) {
    if (painelAberto === tipo) return; // já aberto — não apagar o que a pessoa está digitando
    setErroEnvio(null);
    setPainelAberto(tipo);
    setDescricaoTexto(
      meuVoto && exigeDescricao(meuVoto.tipo) ? (meuVoto.descricao_erro ?? "") : "",
    );
  }

  function cancelarPainel() {
    setPainelAberto(null);
    setDescricaoTexto("");
    setErroEnvio(null);
  }

  async function registrarVoto(tipo: TipoAvaliacao, descricao: string | null) {
    if (!user) return;
    setEnviando(true);
    setErroEnvio(null);
    try {
      const { error } = await supabase
        .from("artigo_avaliacoes")
        .upsert(
          { artigo_id: artigoId, user_id: user.id, tipo, descricao_erro: descricao },
          { onConflict: "artigo_id,user_id" },
        );
      if (error) throw error;
      setMeuVoto({ tipo, descricao_erro: descricao });
      setPainelAberto(null);
      setDescricaoTexto("");
      onAvaliado();
    } catch (e) {
      setErroEnvio(mensagemDeErro(e, "Não foi possível registrar sua avaliação."));
    } finally {
      setEnviando(false);
    }
  }

  function handleClique(tipo: TipoAvaliacao) {
    if (exigeDescricao(tipo)) {
      abrirPainelErro(tipo);
      return;
    }
    registrarVoto(tipo, null);
  }

  const botaoClasse = (tipo: TipoAvaliacao) => {
    const ativo = meuVoto?.tipo === tipo || painelAberto === tipo;
    const cor = CORES[tipo];
    return `inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium uppercase tracking-widest border transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
      ativo ? cor.ativo : cor.base
    }`;
  };

  return (
    <section className="glass rounded-3xl p-8 space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
          Avaliação da comunidade
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          {TIPOS_PUBLICOS.map((tipo) => (
            <span
              key={tipo}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-muted-foreground"
            >
              {ROTULOS[tipo]}
              <span className="text-foreground font-medium">{contagens[tipo]}</span>
            </span>
          ))}
        </div>
      </div>

      {!user && (
        <p className="text-sm text-muted-foreground">
          <Link to="/login" className="text-cyan-glow hover:text-foreground transition-colors">
            Entrar
          </Link>{" "}
          para avaliar este artigo.
        </p>
      )}

      {ehAutor && <p className="text-sm text-muted-foreground">Você é o autor deste artigo.</p>}

      {user && !ehAutor && elegibilidade === "carregando" && (
        <div className="flex items-center gap-3 py-2">
          <div className="w-5 h-5 border-2 border-cyan-glow/30 border-t-cyan-glow rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground font-light">Verificando sua conta…</p>
        </div>
      )}

      {user && !ehAutor && elegibilidade === "erro" && (
        <p className="text-sm text-muted-foreground">{erroElegibilidade}</p>
      )}

      {user && !ehAutor && elegibilidade === "email_nao_verificado" && (
        <div className="flex items-start gap-2.5">
          <AlertTriangle size={18} strokeWidth={1.6} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm leading-relaxed text-muted-foreground">
            Para avaliar um artigo é preciso confirmar seu e-mail. Procure a mensagem de confirmação
            que enviamos quando você criou a conta e clique no link.
          </p>
        </div>
      )}

      {user && !ehAutor && elegibilidade === "sancionado" && sancao && (
        <div className="flex items-start gap-2.5">
          <Ban size={18} strokeWidth={1.6} className="text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-foreground">Você não pode avaliar no momento</p>
            <p className="text-sm leading-relaxed text-muted-foreground">{sancao.motivo}</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {sancao.fim
                ? `Esta restrição vale até ${formatarData(sancao.fim)}.`
                : "Esta restrição não tem data marcada para terminar."}
            </p>
          </div>
        </div>
      )}

      {user && !ehAutor && elegibilidade === "liberado" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {ORDEM_BOTOES.map((tipo) => (
              <button
                key={tipo}
                type="button"
                disabled={enviando}
                onClick={() => handleClique(tipo)}
                className={botaoClasse(tipo)}
              >
                {tipo === "erro" && <AlertTriangle size={13} strokeWidth={1.8} />}
                {tipo === "erro_grave" && <Ban size={13} strokeWidth={1.8} />}
                {ROTULOS[tipo]}
              </button>
            ))}
          </div>

          {painelAberto && (
            <div className="space-y-2 border-t border-white/10 pt-4">
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
                Descreva o erro <span className="text-cyan-glow">*</span>
              </label>
              <textarea
                value={descricaoTexto}
                onChange={(e) => setDescricaoTexto(e.target.value)}
                rows={3}
                placeholder="Explique qual é o erro, para o autor poder corrigir"
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-cyan-glow/40 transition-colors resize-y"
              />
              <p className="text-xs text-muted-foreground/60">
                {descricaoTexto.trim().length}/{DESCRICAO_MINIMA} caracteres
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                O autor verá esta observação com o seu nome.
              </p>

              {erroEnvio && <p className="text-sm text-red-500">{erroEnvio}</p>}

              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => registrarVoto(painelAberto, descricaoTexto.trim())}
                  disabled={enviando || !descricaoValida(painelAberto, descricaoTexto)}
                  className="px-5 py-2.5 rounded-xl text-xs uppercase tracking-widest text-cyan-glow border border-cyan-glow/40 hover:bg-cyan-glow/10 disabled:opacity-40 transition-colors duration-300"
                >
                  {enviando ? "Enviando…" : "Enviar avaliação"}
                </button>
                <button
                  type="button"
                  onClick={cancelarPainel}
                  disabled={enviando}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {!painelAberto && erroEnvio && <p className="text-sm text-red-500">{erroEnvio}</p>}
        </div>
      )}

      <p className="text-xs leading-relaxed text-muted-foreground">
        "Não gostei" registra discordância e não retira o artigo do ar. Apenas "Tem erro grave",
        apontado por um número suficiente de pessoas, retira o texto — e mesmo assim ninguém é
        suspenso ou banido de forma automática.
      </p>
    </section>
  );
}
