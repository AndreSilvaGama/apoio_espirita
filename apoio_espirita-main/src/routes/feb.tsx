import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Search, X, Download, ExternalLink, FileText, BookOpen, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/feb")({
  component: Feb,
});

type Categoria =
  | "Todos"
  | "Organização"
  | "Evangelização"
  | "Estudo"
  | "Mediunidade"
  | "Assistência"
  | "Comunicação"
  | "Sustentabilidade";

interface Documento {
  arquivo: string;
  titulo: string;
  categoria: Exclude<Categoria, "Todos">;
  descricao: string;
  ano?: number;
}

const DOCUMENTOS: Documento[] = [
  {
    arquivo: "WEB-Orientacao-ao-Centro-Espirita.pdf",
    titulo: "Orientação ao Centro Espírita",
    categoria: "Organização",
    descricao: "Diretrizes para o funcionamento, a organização e a vida interna dos centros espíritas brasileiros.",
  },
  {
    arquivo: "WEBPlanodeTrabalho.pdf",
    titulo: "Plano de Trabalho",
    categoria: "Organização",
    descricao: "Modelo e orientações para a elaboração do plano de trabalho anual do centro espírita.",
  },
  {
    arquivo: "WEB_Orientacao-para-o-AECE-2.-ed.-05-11-25.pdf",
    titulo: "Orientação para o AECE — 2ª Edição",
    categoria: "Organização",
    descricao: "Orientações para o Atendimento Espírita de Comunidade e Evangelização — segunda edição revisada.",
    ano: 2025,
  },
  {
    arquivo: "Orienta.pdf",
    titulo: "Documento de Orientação Geral",
    categoria: "Organização",
    descricao: "Orientação institucional publicada pela Federação Espírita Brasileira.",
  },
  {
    arquivo: "WEB-Orientacao-AEE-Infancia.pdf",
    titulo: "Orientação à AEE — Infância",
    categoria: "Evangelização",
    descricao: "Diretrizes para a Atividade de Evangelização Espírita voltada ao público infantil.",
  },
  {
    arquivo: "WEB-Orientação-AEE-Infância-1.pdf",
    titulo: "Orientação à AEE — Infância (1ª Edição)",
    categoria: "Evangelização",
    descricao: "Primeira edição das orientações para a evangelização espírita infantil nos centros.",
  },
  {
    arquivo: "WEB-Orientação-à-Ação-Evangelizadora-Espírita-da-Juventude.pdf",
    titulo: "Orientação à Ação Evangelizadora Espírita da Juventude",
    categoria: "Evangelização",
    descricao: "Diretrizes para a evangelização e a formação espírita do público jovem.",
  },
  {
    arquivo: "Introdução-ao-Estudo-do-Espiritismo-Estudo-da-Obra-Básica-22-02-19.pdf",
    titulo: "Introdução ao Estudo do Espiritismo — Obra Básica",
    categoria: "Estudo",
    descricao: "Material introdutório ao estudo sistematizado da obra básica da codificação espírita.",
    ano: 2019,
  },
  {
    arquivo: "WEB-Orientacao-a-Pratica-Mediunica-no-Centro-espirita.pdf",
    titulo: "Orientação à Prática Mediúnica no Centro Espírita",
    categoria: "Mediunidade",
    descricao: "Diretrizes para a prática e o exercício responsável da mediunidade nos centros espíritas.",
  },
  {
    arquivo: "WEBOrientacaoparaassistenciaespiritanossistemaspenais-2.pdf",
    titulo: "Orientação para a Assistência Espírita nos Sistemas Penais",
    categoria: "Assistência",
    descricao: "Diretrizes para o trabalho fraterno de assistência espírita junto às pessoas privadas de liberdade.",
  },
  {
    arquivo: "WEB-Familia-vida-e-paz.pdf",
    titulo: "Família, Vida e Paz",
    categoria: "Assistência",
    descricao: "Orientações para o atendimento fraterno e espírita às famílias em situação de vulnerabilidade.",
  },
  {
    arquivo: "2013-Orientação-à-Comunicação-Social-Espírita.pdf",
    titulo: "Orientação à Comunicação Social Espírita",
    categoria: "Comunicação",
    descricao: "Diretrizes para a comunicação espírita nas mídias sociais, sites e demais canais de divulgação.",
    ano: 2013,
  },
  {
    arquivo: "WEB-conscienciaecologica-26-06-23.pdf",
    titulo: "Consciência Ecológica",
    categoria: "Sustentabilidade",
    descricao: "Reflexões e orientações sobre responsabilidade ambiental e cuidado com a criação sob a ótica espírita.",
    ano: 2023,
  },
  {
    arquivo: "WEB-O-livro-espirita-e-a-sustentabilidade-do-movimento-espirita-2.pdf",
    titulo: "O Livro Espírita e a Sustentabilidade do Movimento Espírita",
    categoria: "Sustentabilidade",
    descricao: "Análise sobre o papel do livro espírita como sustentáculo e instrumento de propagação da doutrina.",
  },
];

const CATEGORIAS: Categoria[] = [
  "Todos", "Organização", "Evangelização", "Estudo",
  "Mediunidade", "Assistência", "Comunicação", "Sustentabilidade",
];

const ANOS = [...new Set(DOCUMENTOS.map((d) => d.ano).filter(Boolean) as number[])].sort((a, b) => b - a);

const COR: Record<Exclude<Categoria, "Todos">, string> = {
  Organização:     "bg-slate-100 text-slate-600 border-slate-200",
  Evangelização:   "bg-violet-50 text-violet-600 border-violet-200",
  Estudo:          "bg-cyan-50 text-cyan-700 border-cyan-200",
  Mediunidade:     "bg-indigo-50 text-indigo-600 border-indigo-200",
  Assistência:     "bg-emerald-50 text-emerald-600 border-emerald-200",
  Comunicação:     "bg-amber-50 text-amber-600 border-amber-200",
  Sustentabilidade:"bg-green-50 text-green-600 border-green-200",
};

const fileUrl = (arquivo: string) => `/feb/${encodeURIComponent(arquivo)}`;

function VisualizadorPDF({ doc, onClose }: { doc: Documento; onClose: () => void }) {
  const [pdf, setPdf] = useState<any>(null);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [inputPagina, setInputPagina] = useState("1");
  const [escala, setEscala] = useState(1.3);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);
  const [busca, setBusca] = useState("");
  const [resultados, setResultados] = useState<Array<{ pagina: number; trecho: string }>>([]);
  const [textos, setTextos] = useState<Array<{ pagina: number; texto: string }>>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);
  const paginaRef = useRef(1);
  paginaRef.current = pagina;

  const goToPagina = (p: number, total?: number) => {
    const max = total ?? totalPaginas;
    const n = Math.max(1, Math.min(max || 1, p));
    setPagina(n);
    setInputPagina(String(n));
  };

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    setErro(false);
    setPdf(null);
    setPagina(1);
    setInputPagina("1");
    setTextos([]);
    setResultados([]);
    setBusca("");

    (async () => {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
        const pdfDoc = await pdfjsLib.getDocument(fileUrl(doc.arquivo)).promise;
        if (cancelado) return;
        setPdf(pdfDoc);
        setTotalPaginas(pdfDoc.numPages);
        setCarregando(false);
        const all: Array<{ pagina: number; texto: string }> = [];
        for (let i = 1; i <= pdfDoc.numPages; i++) {
          if (cancelado) return;
          const pg = await pdfDoc.getPage(i);
          const content = await pg.getTextContent();
          const texto = (content.items as Array<{ str: string }>).map((it) => it.str).join(" ");
          all.push({ pagina: i, texto });
        }
        if (!cancelado) setTextos(all);
      } catch {
        if (!cancelado) { setErro(true); setCarregando(false); }
      }
    })();

    return () => { cancelado = true; };
  }, [doc.arquivo]);

  useEffect(() => {
    if (!pdf || !canvasRef.current) return;
    let cancelado = false;
    renderTaskRef.current?.cancel();
    renderTaskRef.current = null;

    (async () => {
      try {
        const pg = await pdf.getPage(pagina);
        if (cancelado) return;
        const viewport = pg.getViewport({ scale: escala });
        const canvas = canvasRef.current!;
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        const task = pg.render({ canvasContext: canvas.getContext("2d")!, viewport });
        renderTaskRef.current = task;
        await task.promise;
      } catch { /* cancelado */ }
    })();

    return () => { cancelado = true; };
  }, [pdf, pagina, escala]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if ((e.target as HTMLElement).tagName === "INPUT") return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") goToPagina(paginaRef.current + 1);
      if (e.key === "ArrowLeft"  || e.key === "ArrowUp")   goToPagina(paginaRef.current - 1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  const handleBuscar = () => {
    const termo = busca.trim().toLowerCase();
    if (!termo || textos.length === 0) { setResultados([]); return; }
    const found = textos
      .filter(({ texto }) => texto.toLowerCase().includes(termo))
      .map(({ pagina: p, texto }) => {
        const idx = texto.toLowerCase().indexOf(termo);
        const start = Math.max(0, idx - 55);
        const end = Math.min(texto.length, idx + termo.length + 55);
        const trecho = (start > 0 ? "…" : "") + texto.slice(start, end) + (end < texto.length ? "…" : "");
        return { pagina: p, trecho };
      });
    setResultados(found);
  };

  const btnCls = "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-gray-300 hover:text-white hover:bg-gray-700 transition-colors shrink-0 disabled:opacity-30";

  return (
    <div className="fixed inset-0 z-200 flex flex-col bg-gray-900">

      {/* Barra 1 — título, navegação, zoom, ações */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 border-b border-gray-700 shrink-0 flex-wrap">
        <FileText size={15} strokeWidth={1.5} className="text-gray-400 shrink-0" />
        <p className="text-sm font-medium text-white truncate flex-1 min-w-0">{doc.titulo}</p>

        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => goToPagina(pagina - 1)} disabled={pagina <= 1 || carregando} className={btnCls}>
            <ChevronLeft size={14} strokeWidth={2} />
          </button>
          <input
            type="number" min={1} max={totalPaginas || 1}
            value={inputPagina}
            onChange={(e) => setInputPagina(e.target.value)}
            onBlur={() => goToPagina(Number(inputPagina))}
            onKeyDown={(e) => e.key === "Enter" && goToPagina(Number(inputPagina))}
            disabled={carregando}
            className="w-11 text-center bg-gray-700 rounded px-1 py-1 text-white text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
          <span className="text-xs text-gray-500 mr-1">/ {totalPaginas || "—"}</span>
          <button onClick={() => goToPagina(pagina + 1)} disabled={pagina >= totalPaginas || carregando} className={btnCls}>
            <ChevronRight size={14} strokeWidth={2} />
          </button>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setEscala((s) => Math.max(0.5, Math.round((s - 0.2) * 10) / 10))} className={btnCls}>
            <ZoomOut size={14} strokeWidth={1.5} />
          </button>
          <span className="text-xs text-gray-400 w-9 text-center">{Math.round(escala * 100)}%</span>
          <button onClick={() => setEscala((s) => Math.min(3, Math.round((s + 0.2) * 10) / 10))} className={btnCls}>
            <ZoomIn size={14} strokeWidth={1.5} />
          </button>
        </div>

        <a href={fileUrl(doc.arquivo)} download={doc.arquivo} className={btnCls}>
          <Download size={13} strokeWidth={1.5} /> Baixar
        </a>
        <a href={fileUrl(doc.arquivo)} target="_blank" rel="noopener noreferrer" className={btnCls}>
          <ExternalLink size={13} strokeWidth={1.5} /> Nova aba
        </a>
        <button onClick={onClose} className={`${btnCls} hover:bg-red-900/40`}>
          <X size={13} strokeWidth={2} /> Fechar
        </button>
      </div>

      {/* Barra 2 — busca sempre visível */}
      <div className="shrink-0 bg-gray-800 border-b border-gray-600 px-4 py-3">
        <div className="flex items-center gap-2 max-w-2xl">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              autoFocus
              type="text"
              placeholder={
                textos.length > 0
                  ? "Buscar palavras no documento… (Enter)"
                  : carregando
                  ? "Aguardando carregamento…"
                  : "Indexando páginas para busca…"
              }
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleBuscar()}
              className="w-full bg-gray-700 border border-gray-500 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 transition-colors"
            />
          </div>
          <button
            onClick={handleBuscar}
            disabled={!busca.trim() || textos.length === 0}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-cyan-600 text-white hover:bg-cyan-500 disabled:opacity-30 transition-colors shrink-0"
          >
            Buscar
          </button>
          {textos.length > 0 && !busca.trim() && (
            <span className="text-xs text-gray-600 shrink-0 hidden sm:inline">{textos.length} págs. indexadas</span>
          )}
          {busca.trim() && resultados.length === 0 && textos.length > 0 && (
            <span className="text-xs text-gray-500 shrink-0">Sem resultados</span>
          )}
        </div>

        {resultados.length > 0 && (
          <div className="mt-2 rounded-lg border border-gray-600 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-1.5 bg-gray-700 border-b border-gray-600">
              <span className="text-[11px] text-gray-300 font-medium">
                {resultados.length} página{resultados.length > 1 ? "s" : ""} com "{busca}"
              </span>
              <button onClick={() => { setResultados([]); setBusca(""); }} className="text-[11px] text-gray-500 hover:text-gray-300 transition-colors">
                Limpar
              </button>
            </div>
            <div className="max-h-40 overflow-y-auto divide-y divide-gray-700 bg-gray-800">
              {resultados.map(({ pagina: p, trecho }) => (
                <button
                  key={p}
                  onClick={() => goToPagina(p)}
                  className={`w-full text-left px-3 py-2 hover:bg-gray-700 transition-colors flex items-baseline gap-2 ${p === pagina ? "bg-cyan-900/30" : ""}`}
                >
                  <span className={`text-[11px] font-bold shrink-0 ${p === pagina ? "text-cyan-400" : "text-gray-300"}`}>
                    Pág. {p}
                  </span>
                  <span className="text-[11px] text-gray-500 truncate">{trecho}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Área do PDF */}
      <div className="flex-1 overflow-auto bg-gray-600 flex justify-center py-6 px-4">
        {carregando && (
          <div className="flex flex-col items-center justify-center text-gray-400 gap-3 mt-20">
            <div className="w-8 h-8 rounded-full border-2 border-gray-500 border-t-cyan-400 animate-spin" />
            <span className="text-sm">Carregando documento…</span>
          </div>
        )}
        {erro && (
          <div className="flex flex-col items-center justify-center text-gray-400 gap-3 mt-20">
            <span className="text-sm">Não foi possível carregar este documento.</span>
            <a href={fileUrl(doc.arquivo)} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 hover:underline">
              Abrir em nova aba
            </a>
          </div>
        )}
        {!carregando && !erro && (
          <canvas ref={canvasRef} className="shadow-2xl" style={{ maxWidth: "100%", height: "auto" }} />
        )}
      </div>
    </div>
  );
}

function Feb() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState<Categoria>("Todos");
  const [ano, setAno] = useState<number | null>(null);
  const [docAberto, setDocAberto] = useState<Documento | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
    if (!loading && user && (!profile?.sigla_casa || !profile?.nome || !profile?.cargo_principal || !profile?.uf || !profile?.cidade)) {
      navigate({ to: "/completar-perfil" });
    }
  }, [user, profile, loading, navigate]);

  if (loading || !user) return null;

  const termo = busca.trim().toLowerCase();
  const filtrados = DOCUMENTOS.filter((d) => {
    const matchBusca = !termo || d.titulo.toLowerCase().includes(termo) || d.descricao.toLowerCase().includes(termo);
    const matchCategoria = categoria === "Todos" || d.categoria === categoria;
    const matchAno = !ano || d.ano === ano;
    return matchBusca && matchCategoria && matchAno;
  });

  return (
    <>
    {docAberto && <VisualizadorPDF doc={docAberto} onClose={() => setDocAberto(null)} />}
    <main className="page-light min-h-screen px-6 pt-20 pb-20">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="flex items-start justify-between mb-10 flex-wrap gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-glow mb-2">Federação Espírita Brasileira</p>
            <h1 className="text-3xl font-light text-foreground">Documentos e Orientações</h1>
            <p className="mt-2 text-sm text-muted-foreground font-light">
              Publicações oficiais da FEB disponíveis para consulta e download.
            </p>
          </div>
          <button
            onClick={() => navigate({ to: "/inicio" })}
            className="text-xs uppercase tracking-widest text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            ← Voltar
          </button>
        </div>

        {/* Nota fraternal */}
        <div className="glass rounded-3xl p-8 mb-10 border-l-4 border-l-cyan-glow/40">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-glow mb-4">Uma palavra com o coração</p>
          <div className="space-y-4 text-sm text-muted-foreground font-light leading-relaxed">
            <p>
              Com amor e reverência, disponibilizamos aqui documentos publicados pela{" "}
              <strong className="text-foreground font-medium">Federação Espírita Brasileira — FEB</strong>.
            </p>
            <p>
              O Apoio Espírita é uma plataforma independente, sem qualquer vínculo institucional, financeiro
              ou hierárquico com a FEB. Não somos representantes, porta-vozes nem filiados da Federação,
              e não temos autoridade para falar em seu nome.
            </p>
            <p>
              No entanto, reconhecemos com gratidão e humildade que a FEB é a instituição que, há mais de
              um século, dedica-se com amor e perseverança a orientar, unir e fortalecer o movimento espírita
              no Brasil. Suas diretrizes norteiam a vida dos centros espíritas de todo o país — inclusive,
              em espírito, as práticas que buscamos cultivar nesta plataforma. Somos, em toda a extensão da
              palavra, subordinados à sua orientação.
            </p>
            <p>
              Disponibilizamos estes documentos não como concorrentes ou substitutos do site oficial da Federação
              — que pode e deve ser acessado em{" "}
              <a
                href="https://www.febnet.org.br"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-glow hover:underline"
              >
                febnet.org.br
              </a>{" "}
              —, mas como um serviço fraterno para facilitar o acesso da comunidade espírita a orientações
              já publicadas e de acesso público.
            </p>
            <p className="italic text-muted-foreground/70">
              Caso a Federação Espírita Brasileira, seus dirigentes ou representantes autorizados entendam que
              esta página não deve existir ou que algum documento não deve ser aqui disponibilizado, atenderemos
              prontamente e com alegria — pois reconhecemos nessa posição a mesma vontade que nos move: servir
              ao Espiritismo com amor, ética e verdade. Para isso, basta entrar em contato pelo formulário de
              sugestões no rodapé desta página.
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="space-y-4 mb-8">

          {/* Busca */}
          <div className="relative">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por título ou tema…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full rounded-xl bg-white/5 border border-white/10 pl-10 pr-10 py-3 text-sm text-foreground placeholder-muted-foreground/40 focus:outline-none focus:border-cyan-glow/40 transition-colors"
            />
            {busca && (
              <button
                onClick={() => setBusca("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Categorias */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIAS.map((c) => (
              <button
                key={c}
                onClick={() => setCategoria(c)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  categoria === c
                    ? "bg-cyan-glow/10 text-cyan-glow border-cyan-glow/40"
                    : "bg-white/5 text-muted-foreground border-white/10 hover:border-white/20"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Filtro de ano */}
          {ANOS.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground/50 uppercase tracking-widest">Ano:</span>
              <button
                onClick={() => setAno(null)}
                className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                  !ano
                    ? "bg-cyan-glow/10 text-cyan-glow border-cyan-glow/40"
                    : "bg-white/5 text-muted-foreground border-white/10 hover:border-white/20"
                }`}
              >
                Todos
              </button>
              {ANOS.map((a) => (
                <button
                  key={a}
                  onClick={() => setAno(a === ano ? null : a)}
                  className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                    ano === a
                      ? "bg-cyan-glow/10 text-cyan-glow border-cyan-glow/40"
                      : "bg-white/5 text-muted-foreground border-white/10 hover:border-white/20"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Contador */}
        <p className="text-xs text-muted-foreground/50 mb-5">
          {filtrados.length === 0
            ? "Nenhum documento encontrado."
            : `${filtrados.length} documento${filtrados.length > 1 ? "s" : ""} encontrado${filtrados.length > 1 ? "s" : ""}`}
        </p>

        {/* Lista de documentos */}
        <div className="space-y-3">
          {filtrados.map((doc) => (
            <div
              key={doc.arquivo}
              className="glass rounded-2xl p-5 flex items-start gap-4 hover:shadow-md transition-all duration-300"
            >
              <div className="shrink-0 w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mt-0.5">
                <FileText size={18} strokeWidth={1.5} className="text-muted-foreground/50" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <h3 className="text-sm font-medium text-foreground leading-snug">{doc.titulo}</h3>
                    <p className="text-xs text-muted-foreground/60 mt-1 font-light leading-relaxed">{doc.descricao}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 mt-0.5">
                    {doc.ano && (
                      <span className="text-[10px] text-muted-foreground/40 uppercase tracking-wider">{doc.ano}</span>
                    )}
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${COR[doc.categoria]}`}>
                      {doc.categoria}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => setDocAberto(doc)}
                    className="flex items-center gap-1.5 text-xs text-cyan-glow hover:text-cyan-glow/70 transition-colors"
                  >
                    <BookOpen size={13} strokeWidth={1.5} />
                    Ler aqui
                  </button>
                  <a
                    href={fileUrl(doc.arquivo)}
                    download={doc.arquivo}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-foreground transition-colors"
                  >
                    <Download size={13} strokeWidth={1.5} />
                    Baixar PDF
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Rodapé */}
        <div className="mt-12 pt-8 border-t border-white/5 text-center space-y-2">
          <p className="text-xs text-muted-foreground/40 font-light">
            Todos os documentos pertencem à Federação Espírita Brasileira e são reproduzidos aqui com fins exclusivamente fraternos e educativos.
          </p>
          <a
            href="https://www.febnet.org.br"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-cyan-glow/60 hover:text-cyan-glow transition-colors"
          >
            <ExternalLink size={12} />
            Acessar o site oficial da FEB — febnet.org.br
          </a>
        </div>

      </div>
    </main>
    </>
  );
}
