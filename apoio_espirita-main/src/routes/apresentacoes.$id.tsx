/**
 * A apresentação vista por quem a conduz.
 *
 * Fora de sessão é apenas a ficha do material. Com uma sessão aberta, esta
 * mesma tela vira o console do palestrante: controle remoto dos slides, o
 * código e o QR para a plateia entrar, e a fila de perguntas que chega dos
 * celulares.
 *
 * Ela acompanha a sessão em tempo real de propósito. O palestrante costuma
 * ter DOIS aparelhos em cena — o que está no cabo do projetor e o que fica na
 * mão. Sem isso, avançar num deles deixaria o outro mostrando outra coisa.
 */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Square,
  Monitor,
  MessageCircleQuestion,
  Trash2,
  Check,
  Download,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { mensagemDeErro } from "@/lib/erros";
import { svgQR } from "@/lib/qr";
import { caminhoDoSlide, caminhoDoOriginal, slidesParaAdiantar } from "@/lib/apresentacoes";

export const Route = createFileRoute("/apresentacoes/$id")({
  component: DetalheApresentacao,
});

interface Apresentacao {
  id: string;
  titulo: string;
  descricao: string | null;
  autor_nome: string | null;
  total_slides: number;
  permite_download: boolean;
  criado_por: string;
}

interface Sessao {
  id: string;
  codigo: string;
  slide_atual: number;
  ativa: boolean;
}

interface Pergunta {
  id: string;
  texto: string;
  autor_nome: string | null;
  respondida: boolean;
  created_at: string;
}

const urlDoSlide = (id: string, n: number) =>
  supabase.storage.from("apresentacoes").getPublicUrl(caminhoDoSlide(id, n)).data.publicUrl;

const SITE = typeof window !== "undefined" ? window.location.origin : "";

function DetalheApresentacao() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [ap, setAp] = useState<Apresentacao | null>(null);
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  const carregar = useCallback(async () => {
    const [{ data: dadosAp }, { data: dadosSessao }] = await Promise.all([
      supabase
        .from("apresentacoes")
        .select("id, titulo, descricao, autor_nome, total_slides, permite_download, criado_por")
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("apresentacao_sessoes")
        .select("id, codigo, slide_atual, ativa")
        .eq("apresentacao_id", id)
        .eq("ativa", true)
        .maybeSingle(),
    ]);
    setAp(dadosAp as Apresentacao | null);
    setSessao(dadosSessao as Sessao | null);
  }, [id]);

  useEffect(() => {
    if (user) void carregar();
  }, [user, carregar]);

  // Segue a sessão ao vivo: o outro aparelho do palestrante manda no mesmo
  // registro, e esta tela precisa refletir o que ele fez.
  useEffect(() => {
    if (!sessao?.id) return;
    const canal = supabase
      .channel(`sessao-console-${sessao.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "apresentacao_sessoes",
          filter: `id=eq.${sessao.id}`,
        },
        (payload) => setSessao(payload.new as Sessao),
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "apresentacao_perguntas",
          filter: `sessao_id=eq.${sessao.id}`,
        },
        (payload) => {
          const nova = payload.new as Pergunta;
          setPerguntas((atuais) =>
            atuais.some((p) => p.id === nova.id) ? atuais : [...atuais, nova],
          );
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(canal);
    };
  }, [sessao?.id]);

  const carregarPerguntas = useCallback(async (sessaoId: string) => {
    const { data } = await supabase
      .from("apresentacao_perguntas")
      .select("id, texto, autor_nome, respondida, created_at")
      .eq("sessao_id", sessaoId)
      .order("created_at");
    setPerguntas((data as Pergunta[]) ?? []);
  }, []);

  useEffect(() => {
    if (sessao?.id) void carregarPerguntas(sessao.id);
  }, [sessao?.id, carregarPerguntas]);

  // Adianta os slides vizinhos: quando o palestrante avançar, a figura já está
  // no aparelho e a troca é instantânea mesmo em rede fraca.
  useEffect(() => {
    if (!ap || !sessao) return;
    for (const n of slidesParaAdiantar(sessao.slide_atual, ap.total_slides)) {
      const img = new Image();
      img.src = urlDoSlide(ap.id, n);
    }
  }, [ap, sessao]);

  const endereco = sessao ? `${SITE}/ao-vivo/${sessao.codigo}` : "";
  const qr = useMemo(() => {
    if (!endereco) return null;
    try {
      return svgQR(endereco, 200);
    } catch {
      return null;
    }
  }, [endereco]);

  async function abrirSessao() {
    setOcupado(true);
    setErro(null);
    try {
      const { error } = await supabase.rpc("abrir_sessao_apresentacao", { p_apresentacao: id });
      if (error) throw error;
      await carregar();
    } catch (e) {
      setErro(mensagemDeErro(e));
    } finally {
      setOcupado(false);
    }
  }

  async function encerrarSessao() {
    if (!sessao) return;
    setOcupado(true);
    try {
      await supabase
        .from("apresentacao_sessoes")
        .update({ ativa: false, encerrada_em: new Date().toISOString() })
        .eq("id", sessao.id);
      setSessao(null);
      setPerguntas([]);
    } catch (e) {
      setErro(mensagemDeErro(e));
    } finally {
      setOcupado(false);
    }
  }

  async function irPara(numero: number) {
    if (!sessao || !ap) return;
    const alvo = Math.min(Math.max(numero, 1), ap.total_slides);
    setSessao({ ...sessao, slide_atual: alvo });
    await supabase.from("apresentacao_sessoes").update({ slide_atual: alvo }).eq("id", sessao.id);
  }

  async function baixarOriginal() {
    if (!ap) return;
    const { data, error } = await supabase.storage
      .from("apresentacoes-originais")
      .createSignedUrl(caminhoDoOriginal(ap.id), 120);
    if (error || !data) return setErro(mensagemDeErro(error));
    window.open(data.signedUrl, "_blank");
  }

  async function apagar() {
    if (!ap) return;
    setOcupado(true);
    try {
      const caminhos = Array.from({ length: ap.total_slides }, (_, i) =>
        caminhoDoSlide(ap.id, i + 1),
      );
      await supabase.storage.from("apresentacoes").remove(caminhos);
      await supabase.storage.from("apresentacoes-originais").remove([caminhoDoOriginal(ap.id)]);
      const { error } = await supabase.from("apresentacoes").delete().eq("id", ap.id);
      if (error) throw error;
      navigate({ to: "/apresentacoes" });
    } catch (e) {
      setErro(mensagemDeErro(e));
      setOcupado(false);
    }
  }

  // O teclado é o controle natural de quem apresenta de um computador.
  useEffect(() => {
    if (!sessao) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        void irPara(sessao.slide_atual + 1);
      }
      if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        void irPara(sessao.slide_atual - 1);
      }
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessao?.id, sessao?.slide_atual, ap?.total_slides]);

  if (loading || !user) return null;
  if (!ap) {
    return (
      <main className="page-light min-h-screen px-4 pt-20 pb-20">
        <p className="text-center text-xs text-gray-400 italic">Apresentação não encontrada.</p>
      </main>
    );
  }

  const semResposta = perguntas.filter((p) => !p.respondida);

  return (
    <main className="page-light min-h-screen px-4 pt-20 pb-20">
      <div className="mx-auto max-w-3xl space-y-6">
        <header>
          <Link to="/apresentacoes" className="text-xs text-gray-400 hover:text-gray-700">
            ← Apresentações
          </Link>
          <h1 className="text-xl font-bold text-gray-800 mt-2">{ap.titulo}</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {ap.total_slides} slides
            {ap.autor_nome ? ` · ${ap.autor_nome}` : ""}
            {ap.descricao ? ` · ${ap.descricao}` : ""}
          </p>
        </header>

        {erro && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs">
            {erro}
          </div>
        )}

        {!sessao ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4">
            <p className="text-xs text-gray-600 leading-relaxed">
              Ao abrir a sessão, a plateia passa a acompanhar pelo celular com um código de seis
              letras ou pelo QR na tela. Enquanto a sessão estiver fechada, esta apresentação fica
              visível só para a sua casa.
            </p>
            <button
              onClick={abrirSessao}
              disabled={ocupado}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#004a8c] text-white text-xs font-semibold uppercase tracking-widest hover:bg-[#00386b] transition-colors disabled:opacity-40"
            >
              <Play size={14} />
              Abrir a sessão ao vivo
            </button>
            <img
              src={urlDoSlide(ap.id, 1)}
              alt="Primeiro slide"
              className="w-full rounded-xl border border-gray-150 bg-gray-50"
            />
          </div>
        ) : (
          <>
            {/* Como a plateia entra */}
            <div className="rounded-2xl border border-cyan-200 bg-cyan-50/40 p-5 flex flex-col sm:flex-row gap-5 items-center">
              {qr && (
                <div
                  className="rounded-xl bg-white p-2 border border-cyan-100 shrink-0"
                  // Desenho gerado por nós a partir de coordenadas calculadas.
                  dangerouslySetInnerHTML={{ __html: qr }}
                />
              )}
              <div className="text-center sm:text-left">
                <p className="text-[10px] uppercase tracking-widest text-cyan-800 font-bold">
                  A plateia entra assim
                </p>
                <p className="text-3xl font-bold tracking-[0.3em] text-gray-800 mt-1.5">
                  {sessao.codigo}
                </p>
                <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                  Aponte a câmera para o QR, ou acesse
                  <br />
                  <strong className="text-gray-800">
                    {SITE.replace(/^https?:\/\//, "")}/ao-vivo
                  </strong>{" "}
                  e digite o código.
                </p>
              </div>
            </div>

            {/* Controle */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4">
              <img
                src={urlDoSlide(ap.id, sessao.slide_atual)}
                alt={`Slide ${sessao.slide_atual}`}
                className="w-full rounded-xl border border-gray-150 bg-gray-50"
              />
              <div className="flex items-center gap-3">
                <button
                  onClick={() => irPara(sessao.slide_atual - 1)}
                  disabled={sessao.slide_atual <= 1}
                  className="flex-1 flex items-center justify-center gap-1 py-3.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-30"
                >
                  <ChevronLeft size={16} />
                  Anterior
                </button>
                <span className="text-sm font-bold text-gray-700 tabular-nums w-20 text-center">
                  {sessao.slide_atual} / {ap.total_slides}
                </span>
                <button
                  onClick={() => irPara(sessao.slide_atual + 1)}
                  disabled={sessao.slide_atual >= ap.total_slides}
                  className="flex-1 flex items-center justify-center gap-1 py-3.5 rounded-xl bg-[#004a8c] text-white text-xs font-semibold hover:bg-[#00386b] transition-colors disabled:opacity-30"
                >
                  Próximo
                  <ChevronRight size={16} />
                </button>
              </div>
              <p className="text-[11px] text-gray-400 text-center">
                No computador, as setas do teclado e a barra de espaço também avançam.
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                <Link
                  to="/apresentar/$id"
                  params={{ id: ap.id }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Monitor size={13} />
                  Abrir a tela de projeção
                </Link>
                <button
                  onClick={encerrarSessao}
                  disabled={ocupado}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                >
                  <Square size={13} />
                  Encerrar a sessão
                </button>
              </div>
            </div>

            {/* Perguntas da plateia */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-3">
              <div className="flex items-center gap-2">
                <MessageCircleQuestion size={15} className="text-gray-400" />
                <h2 className="text-xs uppercase font-bold tracking-widest text-gray-500">
                  Perguntas da plateia
                  {semResposta.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px]">
                      {semResposta.length}
                    </span>
                  )}
                </h2>
              </div>
              {perguntas.length === 0 ? (
                <p className="text-xs text-gray-400 italic">
                  Nenhuma pergunta ainda. Elas aparecem aqui assim que alguém enviar, e só você as
                  vê.
                </p>
              ) : (
                <ul className="space-y-2">
                  {perguntas.map((p) => (
                    <li
                      key={p.id}
                      className={`rounded-xl border p-3 text-xs ${
                        p.respondida
                          ? "border-gray-150 bg-gray-50 text-gray-400"
                          : "border-amber-200 bg-amber-50/50 text-gray-700"
                      }`}
                    >
                      <p className="leading-relaxed">{p.texto}</p>
                      <div className="flex items-center justify-between gap-2 mt-2">
                        <span className="text-[11px] text-gray-400">
                          {p.autor_nome || "Anônimo"}
                        </span>
                        {!p.respondida && (
                          <button
                            onClick={async () => {
                              await supabase
                                .from("apresentacao_perguntas")
                                .update({ respondida: true })
                                .eq("id", p.id);
                              setPerguntas((atuais) =>
                                atuais.map((q) => (q.id === p.id ? { ...q, respondida: true } : q)),
                              );
                            }}
                            className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900"
                          >
                            <Check size={12} />
                            Respondida
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}

        {/* Ações do dono */}
        {ap.criado_por === user.id && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-150">
            <button
              onClick={baixarOriginal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <Download size={13} />
              Baixar o arquivo original
            </button>
            <button
              onClick={apagar}
              disabled={ocupado}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-200 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
            >
              <Trash2 size={13} />
              Apagar esta apresentação
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
