/**
 * Tela de projeção: o slide ocupando o aparelho inteiro.
 *
 * Este é o modo que dispensa o computador. O celular vai no cabo do projetor
 * (ou transmite sem fio), abre esta tela e projeta. Três detalhes decidem se
 * isso funciona de verdade num salão:
 *
 *   · **A tela não pode apagar.** Sem segurar o aparelho acordado, o celular
 *     escurece em trinta segundos e o projetor mostra o vazio no meio da
 *     palestra. É o detalhe que separa o recurso utilizável do inútil.
 *   · **Nada de moldura.** Fundo preto e slide inteiro: qualquer barra, título
 *     ou botão fixo apareceria projetado na parede.
 *   · **Os controles aparecem ao toque e somem sozinhos**, porque muitas vezes
 *     o aparelho que projeta é o mesmo que o palestrante tem na mão.
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X, Maximize } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { caminhoDoSlide, slidesParaAdiantar } from "@/lib/apresentacoes";

export const Route = createFileRoute("/apresentar/$id")({
  component: Projecao,
});

interface Estado {
  sessaoId: string;
  codigo: string;
  slide: number;
  total: number;
}

const urlDoSlide = (id: string, n: number) =>
  supabase.storage.from("apresentacoes").getPublicUrl(caminhoDoSlide(id, n)).data.publicUrl;

function Projecao() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [estado, setEstado] = useState<Estado | null>(null);
  const [controlesVisiveis, setControlesVisiveis] = useState(true);
  const relogio = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  const carregar = useCallback(async () => {
    const [{ data: ap }, { data: s }] = await Promise.all([
      supabase.from("apresentacoes").select("total_slides").eq("id", id).maybeSingle(),
      supabase
        .from("apresentacao_sessoes")
        .select("id, codigo, slide_atual")
        .eq("apresentacao_id", id)
        .eq("ativa", true)
        .maybeSingle(),
    ]);
    if (!ap || !s) return setEstado(null);
    setEstado({
      sessaoId: (s as { id: string }).id,
      codigo: (s as { codigo: string }).codigo,
      slide: (s as { slide_atual: number }).slide_atual,
      total: (ap as { total_slides: number }).total_slides,
    });
  }, [id]);

  useEffect(() => {
    if (user) void carregar();
  }, [user, carregar]);

  // Segue o outro aparelho do palestrante, se houver um comandando.
  useEffect(() => {
    if (!estado?.sessaoId) return;
    const canal = supabase
      .channel(`projecao-${estado.sessaoId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "apresentacao_sessoes",
          filter: `id=eq.${estado.sessaoId}`,
        },
        (payload) => {
          const nova = payload.new as { slide_atual: number; ativa: boolean };
          if (!nova.ativa) return void navigate({ to: "/apresentacoes/$id", params: { id } });
          setEstado((e) => (e ? { ...e, slide: nova.slide_atual } : e));
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(canal);
    };
  }, [estado?.sessaoId, id, navigate]);

  // Impede o aparelho de apagar a tela durante a palestra.
  useEffect(() => {
    let trava: WakeLockSentinel | null = null;
    let cancelado = false;
    const segurar = async () => {
      try {
        trava = await navigator.wakeLock?.request("screen");
      } catch {
        // Navegador sem o recurso, ou bateria baixa. A projeção continua; só
        // não há como impedir a tela de apagar sozinha.
      }
    };
    void segurar();
    // Voltar de segundo plano solta a trava: é preciso pedi-la de novo.
    const aoVoltar = () => {
      if (document.visibilityState === "visible" && !cancelado) void segurar();
    };
    document.addEventListener("visibilitychange", aoVoltar);
    return () => {
      cancelado = true;
      document.removeEventListener("visibilitychange", aoVoltar);
      void trava?.release();
    };
  }, []);

  // Adianta os vizinhos: a troca de slide fica instantânea mesmo em rede ruim.
  useEffect(() => {
    if (!estado) return;
    for (const n of slidesParaAdiantar(estado.slide, estado.total)) {
      const img = new Image();
      img.src = urlDoSlide(id, n);
    }
  }, [estado, id]);

  const mostrarControles = useCallback(() => {
    setControlesVisiveis(true);
    if (relogio.current) clearTimeout(relogio.current);
    relogio.current = setTimeout(() => setControlesVisiveis(false), 3000);
  }, []);

  useEffect(() => {
    mostrarControles();
    return () => {
      if (relogio.current) clearTimeout(relogio.current);
    };
  }, [mostrarControles]);

  const irPara = useCallback(
    async (numero: number) => {
      if (!estado) return;
      const alvo = Math.min(Math.max(numero, 1), estado.total);
      if (alvo === estado.slide) return;
      setEstado({ ...estado, slide: alvo });
      await supabase
        .from("apresentacao_sessoes")
        .update({ slide_atual: alvo })
        .eq("id", estado.sessaoId);
    },
    [estado],
  );

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (!estado) return;
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        void irPara(estado.slide + 1);
      }
      if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        void irPara(estado.slide - 1);
      }
      if (e.key === "Escape") navigate({ to: "/apresentacoes/$id", params: { id } });
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [estado, irPara, navigate, id]);

  async function telaCheia() {
    try {
      await document.documentElement.requestFullscreen?.();
      // Girar para deitado só funciona em tela cheia, e nem todo aparelho
      // aceita. Se recusar, a projeção continua — apenas em pé.
      await (
        screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }
      )?.lock?.("landscape");
    } catch {
      /* sem tela cheia, a projeção continua funcionando */
    }
  }

  if (loading || !user) return null;

  if (!estado) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center p-8 text-center">
        <p className="text-sm text-white/60">
          Esta apresentação não tem sessão aberta.
          <br />
          <button
            onClick={() => navigate({ to: "/apresentacoes/$id", params: { id } })}
            className="mt-3 underline text-white/80"
          >
            Voltar e abrir a sessão
          </button>
        </p>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black select-none"
      onClick={mostrarControles}
      onMouseMove={mostrarControles}
    >
      <img
        src={urlDoSlide(id, estado.slide)}
        alt={`Slide ${estado.slide}`}
        className="absolute inset-0 w-full h-full object-contain"
        draggable={false}
      />

      {/* Metades invisíveis: tocar à esquerda volta, à direita avança. */}
      <button
        aria-label="Slide anterior"
        onClick={() => irPara(estado.slide - 1)}
        className="absolute inset-y-0 left-0 w-1/3 cursor-w-resize"
      />
      <button
        aria-label="Próximo slide"
        onClick={() => irPara(estado.slide + 1)}
        className="absolute inset-y-0 right-0 w-1/3 cursor-e-resize"
      />

      <div
        className={`absolute inset-x-0 bottom-0 p-4 transition-opacity duration-500 ${
          controlesVisiveis ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="mx-auto max-w-lg flex items-center gap-2 rounded-2xl bg-black/70 backdrop-blur px-3 py-2.5 border border-white/10">
          <button
            onClick={() => irPara(estado.slide - 1)}
            disabled={estado.slide <= 1}
            className="p-2.5 rounded-xl text-white/80 hover:bg-white/10 disabled:opacity-25 transition-colors"
            aria-label="Anterior"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => irPara(estado.slide + 1)}
            disabled={estado.slide >= estado.total}
            className="p-2.5 rounded-xl text-white/80 hover:bg-white/10 disabled:opacity-25 transition-colors"
            aria-label="Próximo"
          >
            <ChevronRight size={20} />
          </button>

          <div className="flex-1 text-center leading-tight">
            <p className="text-white/90 text-xs font-semibold tabular-nums">
              {estado.slide} / {estado.total}
            </p>
            <p className="text-white/40 text-[10px] tracking-[0.25em] mt-0.5">{estado.codigo}</p>
          </div>

          <button
            onClick={telaCheia}
            className="p-2.5 rounded-xl text-white/80 hover:bg-white/10 transition-colors"
            aria-label="Tela cheia"
          >
            <Maximize size={18} />
          </button>
          <button
            onClick={() => navigate({ to: "/apresentacoes/$id", params: { id } })}
            className="p-2.5 rounded-xl text-white/80 hover:bg-white/10 transition-colors"
            aria-label="Sair da projeção"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
