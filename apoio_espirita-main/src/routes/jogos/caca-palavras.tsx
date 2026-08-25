import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Check,
  Droplet,
  Search,
  BookOpen,
} from "lucide-react";
import {
  CATEGORIAS_CACA,
  PALAVRAS_POR_CATEGORIA,
  type PalavraCaca,
  type CategoriaCaca,
} from "@/data/caca-palavras";

export const Route = createFileRoute("/jogos/caca-palavras")({
  head: () => ({
    meta: [
      { title: "Caça-Palavras Espírita — Apoio Espírita" },
      {
        name: "description",
        content:
          "Encontre palavras relacionadas ao Espiritismo, virtudes e à codificação de Allan Kardec neste jogo de caça-palavras dinâmico e educativo.",
      },
      {
        name: "keywords",
        content:
          "caca palavras espirita, passatempo espirita, jogos evangelizacao, alianca espirita, virtudes da alma",
      },
      { property: "og:title", content: "Caça-Palavras Espírita — Apoio Espírita" },
      {
        property: "og:description",
        content:
          "Encontre palavras relacionadas ao Espiritismo neste jogo de caça-palavras dinâmico e educativo.",
      },
      { property: "og:url", content: "https://apoioespirita.com.br/jogos/caca-palavras" },
    ],
    links: [{ rel: "canonical", href: "https://apoioespirita.com.br/jogos/caca-palavras" }],
  }),
  component: CacaPalavras,
});

// ── Types e Interfaces Locais ────────────────────────────────────────────────

interface CelulaPos {
  r: number;
  c: number;
}
interface PlacedWord {
  palavra: PalavraCaca;
  start: CelulaPos;
  end: CelulaPos;
  coords: CelulaPos[]; // Lista completa de células da palavra
}

// Cores pastéis translúcidas para as palavras encontradas
const PASTEL_COLORS = [
  "bg-rose-100 text-rose-800 border-rose-200",
  "bg-emerald-100 text-emerald-800 border-emerald-200",
  "bg-cyan-100 text-cyan-800 border-cyan-200",
  "bg-amber-100 text-amber-800 border-amber-200",
  "bg-violet-100 text-violet-800 border-violet-200",
  "bg-indigo-100 text-indigo-800 border-indigo-200",
];

// ── Algoritmo de Geração Dinâmica da Grade 10x10 ─────────────────────────────

function gerarGradeCaca(categoria: CategoriaCaca): { grid: string[][]; placedWords: PlacedWord[] } {
  const size = 10;
  const grid: string[][] = Array(size)
    .fill(null)
    .map(() => Array(size).fill(""));
  const pool = PALAVRAS_POR_CATEGORIA[categoria];

  // Sorteia 5 palavras da categoria
  const palavrasSorteadas = [...pool].sort(() => Math.random() - 0.5).slice(0, 5);
  const placedWords: PlacedWord[] = [];

  palavrasSorteadas.forEach((p) => {
    let colocado = false;
    let tentativas = 0;
    const txt = p.palavra;

    while (!colocado && tentativas < 100) {
      tentativas++;
      // Define orientação: 'H' (Horizontal) ou 'V' (Vertical)
      const ori = Math.random() > 0.5 ? "H" : "V";
      const startR = Math.floor(Math.random() * size);
      const startC = Math.floor(Math.random() * size);

      if (ori === "H" && startC + txt.length <= size) {
        // Valida colisão
        let colisao = false;
        const coords: CelulaPos[] = [];
        for (let i = 0; i < txt.length; i++) {
          const r = startR;
          const c = startC + i;
          if (grid[r][c] !== "" && grid[r][c] !== txt[i]) {
            colisao = true;
            break;
          }
          coords.push({ r, c });
        }

        if (!colisao) {
          coords.forEach((coord, i) => {
            grid[coord.r][coord.c] = txt[i];
          });
          placedWords.push({
            palavra: p,
            start: { r: startR, c: startC },
            end: { r: startR, c: startC + txt.length - 1 },
            coords,
          });
          colocado = true;
        }
      } else if (ori === "V" && startR + txt.length <= size) {
        // Valida colisão
        let colisao = false;
        const coords: CelulaPos[] = [];
        for (let i = 0; i < txt.length; i++) {
          const r = startR + i;
          const c = startC;
          if (grid[r][c] !== "" && grid[r][c] !== txt[i]) {
            colisao = true;
            break;
          }
          coords.push({ r, c });
        }

        if (!colisao) {
          coords.forEach((coord, i) => {
            grid[coord.r][coord.c] = txt[i];
          });
          placedWords.push({
            palavra: p,
            start: { r: startR, c: startC },
            end: { r: startR + txt.length - 1, c: startC },
            coords,
          });
          colocado = true;
        }
      }
    }
  });

  // Preenche células vazias com letras aleatórias
  const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === "") {
        grid[r][c] = letras[Math.floor(Math.random() * letras.length)];
      }
    }
  }

  return { grid, placedWords };
}

// ── Componente Principal ──────────────────────────────────────────────────────

function CacaPalavras() {
  const { user, loading } = useAuth();
  const navigate = Route.useNavigate();

  // Estados principais
  const [categoria, setCategoria] = useState<CategoriaCaca>("Virtudes");
  const [fase, setFase] = useState<"selecao" | "jogo" | "conclusao">("selecao");

  // Dados da rodada
  const [grade, setGrade] = useState<string[][]>([]);
  const [palavrasOcultas, setPalavrasOcultas] = useState<PlacedWord[]>([]);
  const [palavrasEncontradas, setPalavrasEncontradas] = useState<string[]>([]);

  // Estado de cliques de seleção
  const [selecaoIniciada, setSelecaoIniciada] = useState<CelulaPos | null>(null);
  const [hoverPos, setHoverPos] = useState<CelulaPos | null>(null);
  const [vidas, setVidas] = useState(5);
  const [erroAtivo, setErroAtivo] = useState(false);

  // Registro de qual cor foi atribuída a cada palavra
  const [colorIndexMap, setColorIndexMap] = useState<Record<string, number>>({});

  // Significado em destaque ao encontrar a palavra
  const [palavraDestaque, setPalavraDestaque] = useState<PalavraCaca | null>(null);

  // Inicializa uma nova partida
  const iniciarJogo = useCallback((cat: CategoriaCaca) => {
    const { grid, placedWords } = gerarGradeCaca(cat);
    setGrade(grid);
    setPalavrasOcultas(placedWords);
    setPalavrasEncontradas([]);
    setSelecaoIniciada(null);
    setHoverPos(null);
    setVidas(5);
    setErroAtivo(false);
    setPalavraDestaque(null);
    setColorIndexMap({});
    setCategoria(cat);
    setFase("jogo");
  }, []);

  // Calcula se duas células estão em linha reta (Horizontal ou Vertical)
  const estaoEmLinha = (a: CelulaPos, b: CelulaPos) => {
    return a.r === b.r || a.c === b.c;
  };

  // Retorna todas as células no trajeto entre A e B
  const obterCelulasTrajeto = useCallback((a: CelulaPos, b: CelulaPos): CelulaPos[] => {
    const coords: CelulaPos[] = [];
    if (a.r === b.r) {
      // Horizontal
      const startC = Math.min(a.c, b.c);
      const endC = Math.max(a.c, b.c);
      for (let c = startC; c <= endC; c++) {
        coords.push({ r: a.r, c });
      }
    } else if (a.c === b.c) {
      // Vertical
      const startR = Math.min(a.r, b.r);
      const endR = Math.max(a.r, b.r);
      for (let r = startR; r <= endR; r++) {
        coords.push({ r, c: a.c });
      }
    }
    return coords;
  }, []);

  // Trata clique nas células da grade
  const handleCliqueCelula = (r: number, c: number) => {
    if (fase !== "jogo" || erroAtivo) return;

    if (!selecaoIniciada) {
      // Primeiro clique: inicia seleção
      setSelecaoIniciada({ r, c });
      setHoverPos({ r, c });
    } else {
      // Segundo clique: tenta fechar a palavra
      const start = selecaoIniciada;
      const end = { r, c };

      if (estaoEmLinha(start, end)) {
        const celulas = obterCelulasTrajeto(start, end);
        // Junta os caracteres do trajeto
        const palavraSelecionada = celulas.map((pos) => grade[pos.r][pos.c]).join("");
        const palavraReversa = palavraSelecionada.split("").reverse().join("");

        // Busca se bate com alguma das palavras ocultas ainda não encontradas
        const match = palavrasOcultas.find((pw) => {
          const jaAchou = palavrasEncontradas.includes(pw.palavra.palavra);
          if (jaAchou) return false;

          const normOculta = pw.palavra.palavra;
          return normOculta === palavraSelecionada || normOculta === palavraReversa;
        });

        if (match) {
          // ACERTOU!
          const termo = match.palavra.palavra;
          setPalavrasEncontradas((prev) => {
            const novaLista = [...prev, termo];
            if (novaLista.length === palavrasOcultas.length) {
              setTimeout(() => setFase("conclusao"), 1000);
            }
            return novaLista;
          });
          setPalavraDestaque(match.palavra);

          // Registra uma cor única para essa palavra
          setColorIndexMap((prev) => ({
            ...prev,
            [termo]: Object.keys(prev).length % PASTEL_COLORS.length,
          }));
        } else {
          // ERROU!
          setVidas((v) => Math.max(0, v - 1));
          setErroAtivo(true);
          setTimeout(() => setErroAtivo(false), 800);
        }
      }

      // Limpa seleção pendente
      setSelecaoIniciada(null);
      setHoverPos(null);
    }
  };

  // Retorna a cor de fundo de uma célula com base no estado do jogo
  const obterEstiloCelula = (r: number, c: number) => {
    // 1. Verifica se já faz parte de alguma palavra encontrada
    const palavraCorrespondente = palavrasOcultas.find((pw) => {
      const achou = palavrasEncontradas.includes(pw.palavra.palavra);
      if (!achou) return false;
      return pw.coords.some((coord) => coord.r === r && coord.c === c);
    });

    if (palavraCorrespondente) {
      const idx = colorIndexMap[palavraCorrespondente.palavra.palavra] ?? 0;
      return PASTEL_COLORS[idx];
    }

    // 2. Verifica se está no trajeto da seleção em andamento
    if (selecaoIniciada && hoverPos && estaoEmLinha(selecaoIniciada, hoverPos)) {
      const celulasNoTrajeto = obterCelulasTrajeto(selecaoIniciada, hoverPos);
      const estaNoTrajeto = celulasNoTrajeto.some((coord) => coord.r === r && coord.c === c);
      if (estaNoTrajeto) {
        if (erroAtivo) {
          return "bg-rose-500 text-white border-rose-600 animate-shake";
        }
        return "bg-violet-200 text-violet-900 border-violet-400";
      }
    }

    // 3. Verifica se é a célula de início da seleção
    if (selecaoIniciada && selecaoIniciada.r === r && selecaoIniciada.c === c) {
      return "bg-violet-500 text-white border-violet-600 scale-105 shadow-md";
    }

    // 4. Estilo padrão neutro
    return "bg-white border-gray-250 text-gray-700 hover:bg-gray-50 active:bg-gray-100 hover:border-gray-300";
  };

  if (loading) return null;

  return (
    <main className="page-light min-h-screen px-4 pt-20 pb-20">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header do Jogo */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/jogos"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Jogos
            </Link>
            <span className="text-muted-foreground/40">|</span>
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-emerald-600" />
              <h1 className="text-lg font-semibold tracking-wide text-foreground">
                Caça-Palavras das Virtudes
              </h1>
            </div>
          </div>
        </div>

        {/* ── FASE 1: SELEÇÃO DE CATEGORIA ──────────────────────────────────────── */}
        {fase === "selecao" && (
          <div className="max-w-xl mx-auto bg-white border border-gray-150 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-gray-800">Escolha um Tema</h2>
              <p className="text-sm text-gray-500 font-light leading-relaxed">
                Selecione uma categoria temática para gerar o seu Caça-Palavras dinâmico de luz.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {CATEGORIAS_CACA.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => iniciarJogo(cat.id)}
                  className="p-5 text-left border border-gray-200 rounded-2xl hover:border-emerald-400 hover:bg-emerald-50/10 transition-all flex items-start gap-4 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 text-emerald-600 group-hover:scale-105 transition-transform">
                    <Search size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 leading-tight group-hover:text-emerald-700 transition-colors">
                      {cat.label}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 font-light leading-relaxed">
                      {cat.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── FASE 2: GRADE DE JOGO ─────────────────────────────────────────────── */}
        {fase === "jogo" && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
            {/* Esquerda: Grade 10x10 */}
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-sm">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                  Tema: {CATEGORIAS_CACA.find((c) => c.id === categoria)?.label}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground mr-1">Regadores:</span>
                  {[1, 2, 3, 4, 5].map((life) => (
                    <Droplet
                      key={life}
                      size={15}
                      className={life <= vidas ? "text-cyan-500 fill-cyan-500" : "text-gray-200"}
                    />
                  ))}
                </div>
              </div>

              {/* A Grade */}
              <div className="aspect-square w-full max-w-[480px] mx-auto bg-gray-50/60 border border-gray-100 p-2.5 rounded-3xl shadow-inner grid grid-cols-10 gap-1 md:gap-1.5">
                {grade.map((row, r) =>
                  row.map((letra, c) => (
                    <button
                      key={`${r}-${c}`}
                      onClick={() => handleCliqueCelula(r, c)}
                      onMouseEnter={() => selecaoIniciada && setHoverPos({ r, c })}
                      className={`
                        aspect-square w-full rounded-lg text-sm md:text-base font-bold flex items-center justify-center border shadow-sm transition-all select-none
                        ${obterEstiloCelula(r, c)}
                      `}
                    >
                      {letra}
                    </button>
                  )),
                )}
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => setFase("selecao")}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Mudar de Categoria
                </button>
                <button
                  onClick={() => iniciarJogo(categoria)}
                  className="text-xs text-muted-foreground hover:text-emerald-700 flex items-center gap-1 transition-colors"
                >
                  <RotateCcw size={12} />
                  Reiniciar Grade
                </button>
              </div>
            </div>

            {/* Direita: Lista de Palavras & Explicações */}
            <div className="space-y-4">
              {/* Lista das Palavras */}
              <div className="bg-white border border-gray-150 rounded-2xl p-5 space-y-3 shadow-sm">
                <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-bold border-b border-gray-100 pb-2">
                  Palavras Ocultas ({palavrasEncontradas.length}/{palavrasOcultas.length})
                </h3>
                <div className="flex flex-col gap-2">
                  {palavrasOcultas.map((pw) => {
                    const achou = palavrasEncontradas.includes(pw.palavra.palavra);
                    const idxColor = colorIndexMap[pw.palavra.palavra];
                    const badgeColor =
                      achou && idxColor !== undefined
                        ? PASTEL_COLORS[idxColor]
                        : "bg-gray-50 text-gray-500 border-gray-200";

                    return (
                      <div
                        key={pw.palavra.palavra}
                        className={`flex items-center justify-between px-3 py-2 border rounded-xl transition-all ${
                          achou ? "opacity-90 scale-95" : "bg-white"
                        }`}
                      >
                        <span
                          className={`text-xs font-semibold uppercase tracking-wider ${achou ? "line-through text-gray-400" : "text-gray-700"}`}
                        >
                          {pw.palavra.palavra}
                        </span>
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeColor}`}
                        >
                          {achou ? "Achou" : "Pista"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Explicação da Palavra Achada (Mensagem de Luz) */}
              {palavraDestaque && (
                <div className="bg-gradient-to-br from-emerald-50/50 to-teal-50/50 border border-emerald-200/60 rounded-2xl p-5 space-y-3 shadow-md animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center gap-2">
                    <BookOpen size={16} className="text-emerald-700" />
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">
                      {palavraDestaque.palavraExibicao}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 italic">{palavraDestaque.dica}</p>
                  <p className="text-xs text-gray-600 font-light leading-relaxed">
                    {palavraDestaque.significado}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── FASE 3: CONCLUSÃO DA SELEÇÃO / VITORIA ───────────────────────────────── */}
        {fase === "conclusao" && (
          <div className="max-w-xl mx-auto bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-3xl p-6 md:p-8 text-center space-y-6 shadow-md animate-in zoom-in-95 duration-500">
            <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center mx-auto shadow-inner">
              <Sparkles size={32} className="text-emerald-700" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-emerald-800 leading-snug">
                ✿ Grade Completa! ✿
              </h2>
              <p className="text-sm text-emerald-600 font-light mt-1.5 leading-relaxed">
                Parabéns! Todas as sementes foram localizadas no canteiro das virtudes e no estudo
                espírita.
              </p>
            </div>

            <div className="bg-white/60 border border-emerald-100/50 rounded-2xl p-5 text-left space-y-4 shadow-inner">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest block border-b border-emerald-200/50 pb-1.5">
                Reflexão Final
              </span>
              <p className="text-xs text-gray-600 leading-relaxed font-light">
                O aprendizado das virtudes morais e dos livros da codificação abre o caminho para o
                autoconhecimento e para a nossa reforma íntima diária. Continue praticando o bem e
                cultivando a caridade em sua vida.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => iniciarJogo(categoria)}
                className="flex-1 py-3.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-md shadow-emerald-600/10"
              >
                <RotateCcw size={15} />
                Jogar Novamente
              </button>
              <button
                onClick={() => setFase("selecao")}
                className="flex-1 py-3.5 rounded-xl text-sm font-medium border border-emerald-200 text-emerald-700 hover:bg-emerald-100/40 bg-white transition-colors"
              >
                Mudar de Categoria
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
