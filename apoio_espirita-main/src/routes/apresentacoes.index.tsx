/**
 * Acervo de apresentações da casa e envio de arquivo novo.
 *
 * O envio faz um trabalho que normalmente ficaria no servidor: desenha cada
 * página do documento aqui mesmo, no navegador de quem envia, e guarda uma
 * imagem por slide. É feito uma vez só, na máquina de quem já tem o arquivo.
 *
 * A razão é a plateia. Se cada celular baixasse o documento inteiro, uma
 * palestra com sessenta pessoas na rede de uma casa espírita simplesmente não
 * carregaria. Guardando imagem por slide, cada aparelho pede só a figura que
 * está na tela — e a palestra roda numa conexão fraca.
 */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Presentation, Upload, FileText, Loader2, AlertTriangle, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { mensagemDeErro } from "@/lib/erros";
import {
  recusaDoArquivo,
  recusaDaQuantidade,
  caminhoDoSlide,
  caminhoDoOriginal,
  LARGURA_DO_SLIDE,
} from "@/lib/apresentacoes";

export const Route = createFileRoute("/apresentacoes/")({
  component: Apresentacoes,
});

interface Apresentacao {
  id: string;
  titulo: string;
  descricao: string | null;
  autor_nome: string | null;
  total_slides: number;
  permite_download: boolean;
  created_at: string;
}

const urlDoSlide = (id: string, n: number) =>
  supabase.storage.from("apresentacoes").getPublicUrl(caminhoDoSlide(id, n)).data.publicUrl;

function Apresentacoes() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [lista, setLista] = useState<Apresentacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [progresso, setProgresso] = useState<{ feitos: number; total: number } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [permiteDownload, setPermiteDownload] = useState(false);
  const [formAberto, setFormAberto] = useState(false);
  const campoArquivo = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  const carregar = useCallback(async () => {
    const { data } = await supabase
      .from("apresentacoes")
      .select("id, titulo, descricao, autor_nome, total_slides, permite_download, created_at")
      .order("created_at", { ascending: false });
    setLista((data as Apresentacao[]) ?? []);
    setCarregando(false);
  }, []);

  useEffect(() => {
    if (user) void carregar();
  }, [user, carregar]);

  async function enviar(arquivo: File) {
    setErro(null);

    const recusa = recusaDoArquivo(arquivo);
    if (recusa) return setErro(recusa);
    if (titulo.trim().length < 3) return setErro("Dê um título à apresentação.");
    if (!profile?.sigla_casa) {
      return setErro("Complete o seu perfil com a sigla da casa antes de enviar.");
    }

    setEnviando(true);
    let criada: string | null = null;
    try {
      const dados = await arquivo.arrayBuffer();

      const lib = await import("pdfjs-dist");
      lib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${lib.version}/build/pdf.worker.min.mjs`;
      const documento = await lib.getDocument({ data: new Uint8Array(dados) }).promise;

      const recusaPaginas = recusaDaQuantidade(documento.numPages);
      if (recusaPaginas) throw new Error(recusaPaginas);

      const { data: nova, error: erroInsert } = await supabase
        .from("apresentacoes")
        .insert({
          sigla_casa: profile.sigla_casa,
          titulo: titulo.trim(),
          descricao: descricao.trim() || null,
          criado_por: user!.id,
          autor_nome: profile.nome ?? null,
          total_slides: documento.numPages,
          permite_download: permiteDownload,
        })
        .select("id")
        .single();
      if (erroInsert) throw erroInsert;
      criada = (nova as { id: string }).id;

      // O arquivo original vai para o depósito privado: serve ao botão de
      // baixar, que só existe se o palestrante liberar.
      const { error: erroOriginal } = await supabase.storage
        .from("apresentacoes-originais")
        .upload(caminhoDoOriginal(criada), arquivo, { contentType: "application/pdf" });
      if (erroOriginal) throw erroOriginal;

      setProgresso({ feitos: 0, total: documento.numPages });
      const tela = document.createElement("canvas");
      const pincel = tela.getContext("2d");
      if (!pincel) throw new Error("Este navegador não conseguiu desenhar os slides.");

      for (let n = 1; n <= documento.numPages; n++) {
        const pagina = await documento.getPage(n);
        const medida = pagina.getViewport({ scale: 1 });
        const janela = pagina.getViewport({ scale: LARGURA_DO_SLIDE / medida.width });
        tela.width = Math.round(janela.width);
        tela.height = Math.round(janela.height);
        // Fundo branco: PDF sem cor de fundo sairia transparente e, no modo
        // escuro do celular de quem assiste, o texto preto sumiria.
        pincel.fillStyle = "#ffffff";
        pincel.fillRect(0, 0, tela.width, tela.height);
        await pagina.render({ canvas: tela, canvasContext: pincel, viewport: janela }).promise;

        const figura = await new Promise<Blob | null>((resolver) =>
          tela.toBlob(resolver, "image/webp", 0.82),
        );
        if (!figura) throw new Error(`Não foi possível gerar a imagem do slide ${n}.`);

        const { error: erroSlide } = await supabase.storage
          .from("apresentacoes")
          .upload(caminhoDoSlide(criada, n), figura, { contentType: "image/webp" });
        if (erroSlide) throw erroSlide;

        setProgresso({ feitos: n, total: documento.numPages });
      }

      setTitulo("");
      setDescricao("");
      setPermiteDownload(false);
      setFormAberto(false);
      if (campoArquivo.current) campoArquivo.current.value = "";
      await carregar();
    } catch (e) {
      // Envio pela metade é pior que envio nenhum: a casa veria uma
      // apresentação que falha ao abrir. Desfaz o que já subiu.
      if (criada) {
        await supabase.storage.from("apresentacoes-originais").remove([caminhoDoOriginal(criada)]);
        await supabase.from("apresentacoes").delete().eq("id", criada);
      }
      setErro(mensagemDeErro(e));
    } finally {
      setEnviando(false);
      setProgresso(null);
    }
  }

  if (loading || !user) return null;

  return (
    <main className="page-light min-h-screen px-4 pt-20 pb-20">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-cyan-50 border border-cyan-100 text-cyan-700 flex items-center justify-center shrink-0">
              <Presentation size={20} strokeWidth={1.8} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Apresentações</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Projete sem computador e deixe a plateia acompanhar pelo próprio celular
              </p>
            </div>
          </div>
          <Link
            to="/ao-vivo"
            className="shrink-0 px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 bg-white hover:bg-gray-50 transition-colors"
          >
            Assistir a uma
          </Link>
        </header>

        {erro && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-start gap-2">
            <AlertTriangle size={15} className="text-red-600 shrink-0 mt-px" />
            <span className="leading-relaxed">{erro}</span>
          </div>
        )}

        {/* Envio */}
        {!formAberto ? (
          <button
            onClick={() => setFormAberto(true)}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-dashed border-gray-300 text-xs font-semibold text-gray-500 hover:border-cyan-400 hover:text-cyan-700 transition-colors"
          >
            <Plus size={15} />
            Enviar uma apresentação
          </button>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4">
            <h2 className="text-xs uppercase font-bold tracking-widest text-gray-500">
              Nova apresentação
            </h2>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1.5">
                Título
              </label>
              <input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                disabled={enviando}
                placeholder="A vida além da matéria"
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-colors disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1.5">
                Descrição <span className="normal-case tracking-normal">(opcional)</span>
              </label>
              <input
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                disabled={enviando}
                placeholder="Palestra pública de quinta-feira"
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-colors disabled:opacity-50"
              />
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={permiteDownload}
                onChange={(e) => setPermiteDownload(e.target.checked)}
                disabled={enviando}
                className="mt-0.5"
              />
              <span className="text-xs text-gray-600 leading-relaxed">
                Deixar a plateia baixar o arquivo inteiro.
                <span className="text-gray-400">
                  {" "}
                  Sem isto, cada pessoa vê os slides e pode salvar a imagem de um deles, mas não
                  leva o documento.
                </span>
              </span>
            </label>

            <div className="rounded-xl bg-gray-50 border border-gray-150 p-3.5 text-xs text-gray-600 leading-relaxed">
              <strong className="text-gray-700">O envio aceita PDF.</strong> No PowerPoint, use
              Arquivo › Exportar › Criar PDF/XPS. No Google Apresentações, Arquivo › Fazer download
              › Documento PDF. O resultado fica igual ao original — só as animações se perdem, o que
              acontece em qualquer conversão.
            </div>

            <input
              ref={campoArquivo}
              type="file"
              accept="application/pdf,.pdf"
              disabled={enviando}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void enviar(f);
              }}
              className="hidden"
            />

            <div className="flex gap-2">
              <button
                onClick={() => campoArquivo.current?.click()}
                disabled={enviando}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#004a8c] text-white text-xs font-semibold hover:bg-[#00386b] transition-colors disabled:opacity-40"
              >
                {enviando ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {enviando
                  ? progresso
                    ? `Preparando slide ${progresso.feitos} de ${progresso.total}…`
                    : "Lendo o arquivo…"
                  : "Escolher o arquivo PDF"}
              </button>
              {!enviando && (
                <button
                  onClick={() => {
                    setFormAberto(false);
                    setErro(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              )}
            </div>

            {progresso && (
              <div className="h-1.5 rounded-full bg-gray-150 overflow-hidden">
                <div
                  className="h-full bg-cyan-500 transition-all duration-300"
                  style={{ width: `${(progresso.feitos / progresso.total) * 100}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* Acervo */}
        {carregando ? (
          <p className="text-xs text-gray-400 italic text-center py-8">Carregando…</p>
        ) : lista.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-gray-250 rounded-2xl">
            <FileText size={30} className="text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-400 italic">
              A sua casa ainda não tem apresentações guardadas.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {lista.map((a) => (
              <Link
                key={a.id}
                to="/apresentacoes/$id"
                params={{ id: a.id }}
                className="flex gap-4 items-center rounded-2xl border border-gray-200 bg-white p-3 hover:border-cyan-300 transition-colors"
              >
                <img
                  src={urlDoSlide(a.id, 1)}
                  alt=""
                  loading="lazy"
                  className="w-24 h-16 object-cover rounded-lg border border-gray-150 bg-gray-50 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-gray-800 truncate">{a.titulo}</h3>
                  {a.descricao && (
                    <p className="text-xs text-gray-500 truncate mt-0.5">{a.descricao}</p>
                  )}
                  <p className="text-[11px] text-gray-400 mt-1">
                    {a.total_slides} slides
                    {a.autor_nome ? ` · ${a.autor_nome}` : ""} ·{" "}
                    {new Date(a.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
