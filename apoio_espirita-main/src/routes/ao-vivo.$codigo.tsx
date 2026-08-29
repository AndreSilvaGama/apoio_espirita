/**
 * A apresentação vista pela plateia, no celular de cada um.
 *
 * Quatro escolhas moldam esta tela, e todas nasceram da sala real:
 *
 *   · **Explorar sozinho.** Quem chegou atrasado quer ver o slide anterior sem
 *     pedir para ninguém. Ao tocar em voltar, esta tela solta o vínculo com o
 *     palestrante e mostra um botão para retomar — em vez de arrastar a pessoa
 *     de volta e frustrá-la.
 *   · **Rede ruim.** O tempo real é o caminho principal, mas há uma conferência
 *     periódica por trás: numa Wi-Fi que oscila, a conexão persistente cai sem
 *     avisar e a plateia ficaria vendo o slide errado sem saber.
 *   · **Ampliar.** Quem está na última fileira e não enxerga o telão usa isto
 *     como lupa. É o argumento mais forte do recurso inteiro.
 *   · **Perguntar em silêncio.** Numa palestra doutrinária ninguém interrompe,
 *     e a dúvida se perde. Aqui ela chega ao palestrante sem ruído.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Radio,
  Download,
  ImageDown,
  Send,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { mensagemDeErro } from "@/lib/erros";
import { caminhoDoSlide, caminhoDoOriginal, slidesParaAdiantar } from "@/lib/apresentacoes";

export const Route = createFileRoute("/ao-vivo/$codigo")({
  component: PlateiaAoVivo,
});

interface Dados {
  sessaoId: string;
  apresentacaoId: string;
  titulo: string;
  total: number;
  permiteDownload: boolean;
  aceitaPerguntas: boolean;
  slideDoPalestrante: number;
}

const urlDoSlide = (id: string, n: number) =>
  supabase.storage.from("apresentacoes").getPublicUrl(caminhoDoSlide(id, n)).data.publicUrl;

/** De quanto em quanto tempo conferir o slide, caso o tempo real caia. */
const CONFERENCIA = 5000;

function PlateiaAoVivo() {
  const { codigo } = Route.useParams();
  const [dados, setDados] = useState<Dados | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [meuSlide, setMeuSlide] = useState<number | null>(null);
  const [ampliado, setAmpliado] = useState(false);
  const [pergunta, setPergunta] = useState("");
  const [nomeDaPergunta, setNomeDaPergunta] = useState("");
  const [enviada, setEnviada] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const perguntaAberta = useRef(false);
  const [caixaAberta, setCaixaAberta] = useState(false);
  perguntaAberta.current = caixaAberta;

  const buscar = useCallback(async () => {
    const { data: s } = await supabase
      .from("apresentacao_sessoes")
      .select("id, slide_atual, aceita_perguntas, apresentacao_id")
      .eq("codigo", codigo.toUpperCase())
      .eq("ativa", true)
      .maybeSingle();

    if (!s) {
      setDados(null);
      setCarregando(false);
      return;
    }
    const sessao = s as {
      id: string;
      slide_atual: number;
      aceita_perguntas: boolean;
      apresentacao_id: string;
    };

    const { data: a } = await supabase
      .from("apresentacoes")
      .select("id, titulo, total_slides, permite_download")
      .eq("id", sessao.apresentacao_id)
      .maybeSingle();
    if (!a) {
      setDados(null);
      setCarregando(false);
      return;
    }
    const ap = a as {
      id: string;
      titulo: string;
      total_slides: number;
      permite_download: boolean;
    };

    setDados({
      sessaoId: sessao.id,
      apresentacaoId: ap.id,
      titulo: ap.titulo,
      total: ap.total_slides,
      permiteDownload: ap.permite_download,
      aceitaPerguntas: sessao.aceita_perguntas,
      slideDoPalestrante: sessao.slide_atual,
    });
    setCarregando(false);
  }, [codigo]);

  useEffect(() => {
    void buscar();
  }, [buscar]);

  // Caminho principal: o slide muda no mesmo instante em que o palestrante avança.
  useEffect(() => {
    if (!dados?.sessaoId) return;
    const canal = supabase
      .channel(`plateia-${dados.sessaoId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "apresentacao_sessoes",
          filter: `id=eq.${dados.sessaoId}`,
        },
        (payload) => {
          const nova = payload.new as { slide_atual: number; ativa: boolean };
          if (!nova.ativa) return setDados(null);
          setDados((d) => (d ? { ...d, slideDoPalestrante: nova.slide_atual } : d));
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(canal);
    };
  }, [dados?.sessaoId]);

  // Rede de segurança: se a conexão persistente cair numa Wi-Fi ruim, a plateia
  // continuaria vendo o slide antigo sem perceber.
  useEffect(() => {
    if (!dados?.sessaoId) return;
    const conferir = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      void (async () => {
        const { data } = await supabase
          .from("apresentacao_sessoes")
          .select("slide_atual, ativa")
          .eq("id", dados.sessaoId)
          .maybeSingle();
        if (!data) return;
        const s = data as { slide_atual: number; ativa: boolean };
        if (!s.ativa) return setDados(null);
        setDados((d) => (d ? { ...d, slideDoPalestrante: s.slide_atual } : d));
      })();
    }, CONFERENCIA);
    return () => clearInterval(conferir);
  }, [dados?.sessaoId]);

  const slideNaTela = meuSlide ?? dados?.slideDoPalestrante ?? 1;

  useEffect(() => {
    if (!dados) return;
    for (const n of slidesParaAdiantar(slideNaTela, dados.total)) {
      const img = new Image();
      img.src = urlDoSlide(dados.apresentacaoId, n);
    }
  }, [dados, slideNaTela]);

  async function salvarImagem() {
    if (!dados) return;
    const url = urlDoSlide(dados.apresentacaoId, slideNaTela);
    const a = document.createElement("a");
    a.href = url;
    a.download = `slide-${slideNaTela}.webp`;
    a.target = "_blank";
    a.rel = "noopener";
    a.click();
  }

  async function baixarTudo() {
    if (!dados) return;
    const { data, error } = await supabase.storage
      .from("apresentacoes-originais")
      .createSignedUrl(caminhoDoOriginal(dados.apresentacaoId), 300);
    if (error || !data) return setErro("O palestrante não liberou o download deste material.");
    window.open(data.signedUrl, "_blank");
  }

  async function enviarPergunta(e: React.FormEvent) {
    e.preventDefault();
    if (!dados || pergunta.trim().length < 3) return;
    setErro(null);
    const { error } = await supabase.from("apresentacao_perguntas").insert({
      sessao_id: dados.sessaoId,
      texto: pergunta.trim(),
      autor_nome: nomeDaPergunta.trim() || null,
    });
    if (error) return setErro(mensagemDeErro(error));
    setPergunta("");
    setEnviada(true);
    setCaixaAberta(false);
    setTimeout(() => setEnviada(false), 4000);
  }

  if (carregando) {
    return (
      <main className="page-light min-h-screen px-4 pt-20 pb-20">
        <p className="text-center text-xs text-gray-400 italic">Procurando a apresentação…</p>
      </main>
    );
  }

  if (!dados) {
    return (
      <main className="page-light min-h-screen px-4 pt-20 pb-20">
        <div className="mx-auto max-w-sm text-center space-y-4 mt-10">
          <Radio size={30} className="text-gray-300 mx-auto" />
          <p className="text-sm text-gray-600">
            Não há apresentação aberta com o código{" "}
            <strong className="tracking-widest">{codigo.toUpperCase()}</strong>.
          </p>
          <p className="text-xs text-gray-400 leading-relaxed">
            Ou a palestra já foi encerrada, ou o código foi digitado com alguma letra trocada.
          </p>
          <Link
            to="/ao-vivo"
            className="inline-block px-5 py-2.5 rounded-xl bg-[#004a8c] text-white text-xs font-semibold"
          >
            Digitar outro código
          </Link>
        </div>
      </main>
    );
  }

  const seguindo = meuSlide === null;

  return (
    <main className="page-light min-h-screen px-3 pt-20 pb-20">
      <div className="mx-auto max-w-2xl space-y-3">
        <header className="flex items-baseline justify-between gap-3 px-1">
          <h1 className="text-sm font-semibold text-gray-800 truncate">{dados.titulo}</h1>
          <span className="text-[11px] text-gray-400 tabular-nums shrink-0">
            {slideNaTela} / {dados.total}
          </span>
        </header>

        <button
          onClick={() => setAmpliado((v) => !v)}
          className="block w-full"
          aria-label={ampliado ? "Reduzir o slide" : "Ampliar o slide"}
        >
          <img
            src={urlDoSlide(dados.apresentacaoId, slideNaTela)}
            alt={`Slide ${slideNaTela}`}
            className={`w-full rounded-xl border border-gray-200 bg-white transition-transform duration-200 ${
              ampliado ? "scale-[1.6] origin-top" : ""
            }`}
          />
        </button>

        {ampliado && (
          <p className="text-[11px] text-center text-gray-400">
            Toque no slide de novo para reduzir. Deslize para os lados para enxergar as bordas.
          </p>
        )}

        {!seguindo && (
          <button
            onClick={() => setMeuSlide(null)}
            className="w-full py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition-colors"
          >
            Você está vendo sozinho — voltar ao slide do palestrante ({dados.slideDoPalestrante})
          </button>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={() => setMeuSlide(Math.max(1, slideNaTela - 1))}
            disabled={slideNaTela <= 1}
            className="flex-1 flex items-center justify-center gap-1 py-3 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-30"
          >
            <ChevronLeft size={15} />
            Anterior
          </button>
          <button
            onClick={() => setAmpliado((v) => !v)}
            className="px-3.5 py-3 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
            aria-label="Ampliar"
          >
            {ampliado ? <ZoomOut size={15} /> : <ZoomIn size={15} />}
          </button>
          <button
            onClick={() => setMeuSlide(Math.min(dados.total, slideNaTela + 1))}
            disabled={slideNaTela >= dados.total}
            className="flex-1 flex items-center justify-center gap-1 py-3 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-30"
          >
            Próximo
            <ChevronRight size={15} />
          </button>
        </div>

        {erro && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
            {erro}
          </p>
        )}
        {enviada && (
          <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
            A sua pergunta chegou ao palestrante. Só ele a vê.
          </p>
        )}

        {/* Pergunta */}
        {dados.aceitaPerguntas && (
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            {!caixaAberta ? (
              <button
                onClick={() => setCaixaAberta(true)}
                className="w-full text-xs font-semibold text-gray-600 hover:text-cyan-700 transition-colors"
              >
                Enviar uma pergunta ao palestrante
              </button>
            ) : (
              <form onSubmit={enviarPergunta} className="space-y-3">
                <textarea
                  value={pergunta}
                  onChange={(e) => setPergunta(e.target.value)}
                  maxLength={400}
                  rows={3}
                  autoFocus
                  placeholder="Escreva a sua pergunta…"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-colors resize-none"
                />
                <input
                  value={nomeDaPergunta}
                  onChange={(e) => setNomeDaPergunta(e.target.value)}
                  maxLength={60}
                  placeholder="Seu nome (opcional — pode perguntar sem se identificar)"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs focus:outline-none focus:border-cyan-500 transition-colors"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={pergunta.trim().length < 3}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#004a8c] text-white text-xs font-semibold hover:bg-[#00386b] transition-colors disabled:opacity-30"
                  >
                    <Send size={13} />
                    Enviar
                  </button>
                  <button
                    type="button"
                    onClick={() => setCaixaAberta(false)}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2 justify-center pt-1">
          <button
            onClick={salvarImagem}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 bg-white text-[11px] font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <ImageDown size={12} />
            Salvar este slide
          </button>
          {dados.permiteDownload && (
            <button
              onClick={baixarTudo}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 bg-white text-[11px] font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <Download size={12} />
              Baixar a apresentação
            </button>
          )}
        </div>

        <p className="text-[11px] text-gray-400 text-center pt-2">
          {seguindo
            ? "Acompanhando o palestrante ao vivo."
            : "Navegação livre — o palestrante não é afetado pelo que você faz aqui."}
        </p>
      </div>
    </main>
  );
}
