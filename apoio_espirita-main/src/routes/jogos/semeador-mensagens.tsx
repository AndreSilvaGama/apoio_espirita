import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Heart,
  Sprout,
  Droplet,
  BookOpen,
  Award,
  CheckCircle,
} from "lucide-react";
import { MENSAGENS_SEMEADOR, type MensagemSemeador } from "@/data/semeador-mensagens";

export const Route = createFileRoute("/jogos/semeador-mensagens")({
  head: () => ({
    meta: [
      { title: "Semeador de Mensagens — Jogo Interativo — Apoio Espírita" },
      {
        name: "description",
        content:
          "Ordene as palavras para reconstruir mensagens de luz, consolo e sabedoria de grandes mentores e obras da literatura espírita.",
      },
      {
        name: "keywords",
        content:
          "semeador de mensagens, frases espiritas, mensagens de luz, jogo frases espiritismo",
      },
      { property: "og:title", content: "Semeador de Mensagens — Jogo Interativo — Apoio Espírita" },
      {
        property: "og:description",
        content:
          "Ordene as palavras para reconstruir mensagens de luz, consolo e sabedoria espírita.",
      },
      { property: "og:url", content: "https://apoioespirita.com.br/jogos/semeador-mensagens" },
    ],
    links: [{ rel: "canonical", href: "https://apoioespirita.com.br/jogos/semeador-mensagens" }],
  }),
  component: SemeadorMensagens,
});

// ── Helpers de normalização para comparação de palavras ────────────────────────

function normalizar(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, "")
    .trim()
    .toUpperCase();
}

function embaralhar<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── SVG do Jardim Dinâmico (representa as flores crescendo) ─────────────────

function JardimSVG({
  stage,
  totalWords,
  falhou,
}: {
  stage: number;
  totalWords: number;
  falhou: boolean;
}) {
  const progress = stage / totalWords;

  // Níveis de crescimento das flores baseados no progresso
  const stemHeight1 = progress >= 0.2 ? 60 : 0;
  const stemHeight2 = progress >= 0.4 ? 75 : 0;
  const stemHeight3 = progress >= 0.6 ? 85 : 0;
  const stemHeight4 = progress >= 0.8 ? 70 : 0;
  const stemHeight5 = progress >= 1.0 ? 55 : 0;

  return (
    <svg
      viewBox="0 0 400 180"
      className="w-full h-full rounded-2xl shadow-inner border border-emerald-100"
      style={{ background: "linear-gradient(to bottom, #f0fdf4, #dcfce7)" }}
    >
      <defs>
        <linearGradient id="soilGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#78350f" />
          <stop offset="100%" stopColor="#451a03" />
        </linearGradient>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e0f2fe" opacity="0.6" />
          <stop offset="100%" stopColor="#f0fdf4" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Céu de fundo */}
      <rect x="0" y="0" width="400" height="150" fill="url(#skyGrad)" />

      {/* Terra fértil */}
      <rect x="0" y="145" width="400" height="35" fill="url(#soilGrad)" />
      <ellipse cx="200" cy="145" rx="200" ry="6" fill="#582f0e" opacity="0.8" />

      {/* ── Flor 1 (Progresso 20%) ── */}
      {stemHeight1 > 0 && (
        <g className="transition-all duration-700">
          <path
            d={`M 70 145 Q 65 ${145 - stemHeight1 / 2} 75 ${145 - stemHeight1}`}
            stroke={falhou ? "#b45309" : "#22c55e"}
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
          {progress >= 0.3 && (
            <ellipse
              cx="66"
              cy={145 - stemHeight1 + 10}
              rx="6"
              ry="3"
              fill={falhou ? "#d97706" : "#4ade80"}
              transform={`rotate(-30 66 ${145 - stemHeight1 + 10})`}
            />
          )}
          {progress >= 0.9 && (
            <g transform={`translate(75 ${145 - stemHeight1})`}>
              <circle cx="0" cy="0" r="10" fill="#f43f5e" filter="url(#glow)" />
              <circle cx="0" cy="0" r="5" fill="#fde047" />
            </g>
          )}
        </g>
      )}

      {/* ── Flor 2 (Progresso 40%) ── */}
      {stemHeight2 > 0 && (
        <g className="transition-all duration-700">
          <path
            d={`M 130 145 Q 140 ${145 - stemHeight2 / 2} 135 ${145 - stemHeight2}`}
            stroke={falhou ? "#b45309" : "#15803d"}
            strokeWidth="4.5"
            fill="none"
            strokeLinecap="round"
          />
          {progress >= 0.5 && (
            <ellipse
              cx="140"
              cy={145 - stemHeight2 + 15}
              rx="8"
              ry="4"
              fill={falhou ? "#d97706" : "#22c55e"}
              transform={`rotate(25 140 ${145 - stemHeight2 + 15})`}
            />
          )}
          {progress >= 0.95 && (
            <g transform={`translate(135 ${145 - stemHeight2})`}>
              {[0, 60, 120, 180, 240, 300].map((deg) => (
                <circle
                  key={deg}
                  cx="0"
                  cy="-8"
                  r="6"
                  fill="#a855f7"
                  transform={`rotate(${deg})`}
                />
              ))}
              <circle cx="0" cy="0" r="6" fill="#facc15" />
            </g>
          )}
        </g>
      )}

      {/* ── Flor 3 (Flor Principal - Progresso 60%) ── */}
      {stemHeight3 > 0 && (
        <g className="transition-all duration-700">
          <path
            d={`M 200 145 Q 195 ${145 - stemHeight3 / 2} 200 ${145 - stemHeight3}`}
            stroke={falhou ? "#b45309" : "#166534"}
            strokeWidth="5.5"
            fill="none"
            strokeLinecap="round"
          />
          {progress >= 0.7 && (
            <>
              <ellipse
                cx="188"
                cy={145 - stemHeight3 + 30}
                rx="10"
                ry="4.5"
                fill={falhou ? "#d97706" : "#22c55e"}
                transform={`rotate(-20 188 ${145 - stemHeight3 + 30})`}
              />
              <ellipse
                cx="212"
                cy={145 - stemHeight3 + 15}
                rx="10"
                ry="4.5"
                fill={falhou ? "#d97706" : "#22c55e"}
                transform={`rotate(30 212 ${145 - stemHeight3 + 15})`}
              />
            </>
          )}
          {progress >= 1.0 && (
            <g transform={`translate(200 ${145 - stemHeight3})`} filter="url(#glow)">
              {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                <ellipse
                  key={deg}
                  cx="0"
                  cy="-12"
                  rx="7"
                  ry="11"
                  fill="#ec4899"
                  transform={`rotate(${deg})`}
                />
              ))}
              <circle cx="0" cy="0" r="9" fill="#facc15" />
              <circle cx="0" cy="0" r="5" fill="#eab308" />
            </g>
          )}
        </g>
      )}

      {/* ── Flor 4 (Progresso 80%) ── */}
      {stemHeight4 > 0 && (
        <g className="transition-all duration-700">
          <path
            d={`M 270 145 Q 265 ${145 - stemHeight4 / 2} 275 ${145 - stemHeight4}`}
            stroke={falhou ? "#b45309" : "#15803d"}
            strokeWidth="4.5"
            fill="none"
            strokeLinecap="round"
          />
          {progress >= 0.85 && (
            <ellipse
              cx="280"
              cy={145 - stemHeight4 + 12}
              rx="8"
              ry="3.5"
              fill={falhou ? "#d97706" : "#22c55e"}
              transform={`rotate(15 280 ${145 - stemHeight4 + 12})`}
            />
          )}
          {progress >= 0.95 && (
            <g transform={`translate(275 ${145 - stemHeight4})`}>
              {[0, 60, 120, 180, 240, 300].map((deg) => (
                <circle
                  key={deg}
                  cx="0"
                  cy="-7"
                  r="5.5"
                  fill="#f97316"
                  transform={`rotate(${deg})`}
                />
              ))}
              <circle cx="0" cy="0" r="5" fill="#fef08a" />
            </g>
          )}
        </g>
      )}

      {/* ── Flor 5 (Progresso 100%) ── */}
      {stemHeight5 > 0 && (
        <g className="transition-all duration-700">
          <path
            d={`M 330 145 Q 335 ${145 - stemHeight5 / 2} 325 ${145 - stemHeight5}`}
            stroke={falhou ? "#b45309" : "#22c55e"}
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
          {progress >= 1.0 && (
            <g transform={`translate(325 ${145 - stemHeight5})`}>
              <circle cx="0" cy="0" r="9" fill="#06b6d4" filter="url(#glow)" />
              <circle cx="0" cy="0" r="4.5" fill="#e0f2fe" />
            </g>
          )}
        </g>
      )}

      {/* Semente que brota caso o progresso seja inicial */}
      {progress < 0.2 && !falhou && (
        <g transform="translate(200 145)" className="animate-bounce">
          <path d="M-4 -3 C-1 -8 1 -8 4 -3 C6 2 2 4 0 5 C-2 4 -6 2 -4 -3 Z" fill="#854d0e" />
          <path d="M0 -3 Q -4 -9 -6 -8" stroke="#a3e635" strokeWidth="2" fill="none" />
          <path d="M0 -3 Q 4 -9 6 -8" stroke="#a3e635" strokeWidth="2" fill="none" />
        </g>
      )}

      {/* Brilhos de sucesso decorativos */}
      {progress >= 1.0 && (
        <>
          <circle cx="45" cy="50" r="2" fill="#fff" opacity="0.9" className="animate-ping" />
          <circle cx="340" cy="60" r="2.5" fill="#fff" opacity="0.8" />
          <circle cx="230" cy="30" r="1.5" fill="#fff" opacity="0.75" />
          <path d="M 100 40 L 104 44 L 100 48 L 96 44 Z" fill="#facc15" opacity="0.8" />
          <path d="M 290 50 L 293 53 L 290 56 L 287 53 Z" fill="#a855f7" opacity="0.75" />
        </>
      )}
    </svg>
  );
}

// ── Componente Principal do Jogo ────────────────────────────────────────────────

function SemeadorMensagens() {
  const { user, loading } = useAuth();
  const navigate = Route.useNavigate();

  // Estados de dados
  const [mensagem, setMensagem] = useState<MensagemSemeador>(() => MENSAGENS_SEMEADOR[0]);
  const [palavrasCorretas, setPalavrasCorretas] = useState<string[]>([]);
  const [bolhasDisponiveis, setBolhasDisponiveis] = useState<
    { id: string; texto: string; indexOriginal: number }[]
  >([]);

  // Estados de jogo
  const [indexPalavraEsperada, setIndexPalavraEsperada] = useState(0);
  const [vidas, setVidas] = useState(5);
  const [erroAtivoId, setErroAtivoId] = useState<string | null>(null);
  const [completo, setCompleto] = useState(false);
  const [falhou, setFalhou] = useState(false);

  // Lista pura de palavras da frase (limpa de pontuação para o algoritmo)
  const palavrasDaFrase = mensagem.texto.split(/\s+/);

  // Inicializa uma nova mensagem/rodada
  const iniciarRodada = useCallback((msg: MensagemSemeador) => {
    setMensagem(msg);
    setPalavrasCorretas([]);
    setIndexPalavraEsperada(0);
    setVidas(5);
    setCompleto(false);
    setFalhou(false);
    setErroAtivoId(null);

    // Divide em palavras e gera bolhas para embaralhar
    const listaPalavras = msg.texto.split(/\s+/);
    const bolhas = listaPalavras.map((palavra, index) => ({
      id: `${palavra}-${index}`,
      texto: palavra,
      indexOriginal: index,
    }));

    setBolhasDisponiveis(embaralhar(bolhas));
  }, []);

  useEffect(() => {
    iniciarRodada(MENSAGENS_SEMEADOR[0]);
  }, [iniciarRodada]);

  // Escolha aleatória de uma nova frase (excluindo a atual)
  const proximaFrase = () => {
    const pool = MENSAGENS_SEMEADOR.filter((m) => m.id !== mensagem.id);
    const randomMsg = pool[Math.floor(Math.random() * pool.length)];
    iniciarRodada(randomMsg);
  };

  // Trata o clique do usuário em uma bolha
  const handleSelecionarPalavra = (bolhaId: string, texto: string, indexOriginal: number) => {
    if (completo || falhou || erroAtivoId) return;

    const palavraCorretaEsperada = palavrasDaFrase[indexPalavraEsperada];

    // Compara de forma tolerante a acentuação e pontuação
    if (normalizar(texto) === normalizar(palavraCorretaEsperada)) {
      // ACERTOU!
      setPalavrasCorretas((prev) => [...prev, palavraCorretaEsperada]);
      setIndexPalavraEsperada((prev) => prev + 1);
      setBolhasDisponiveis((prev) => prev.filter((b) => b.id !== bolhaId));

      // Verifica se concluiu toda a frase
      if (indexPalavraEsperada + 1 === palavrasDaFrase.length) {
        setCompleto(true);
      }
    } else {
      // ERROU!
      setVidas((v) => {
        const novaVida = v - 1;
        if (novaVida <= 0) {
          setFalhou(true);
        }
        return novaVida;
      });

      // Ativa efeito de erro temporário
      setErroAtivoId(bolhaId);
      setTimeout(() => setErroAtivoId(null), 800);
    }
  };

  if (loading) return null;

  return (
    <main className="page-light min-h-screen px-4 pt-20 pb-20">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* ── Header do Jogo ── */}
        <div className="flex items-center gap-3">
          <Link
            to="/jogos"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Portal de Jogos
          </Link>
          <span className="text-muted-foreground/40">|</span>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-rose-500" />
            <h1 className="text-lg font-semibold tracking-wide text-foreground">
              Semeador de Mensagens
            </h1>
          </div>
        </div>

        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Ordene as palavras para florescer o jardim das virtudes
        </p>

        {/* ── Painel de Status (Gotas de Regador de Vidas) ── */}
        <div className="flex justify-between items-center bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mr-1">
              Água no Regador:
            </span>
            {[1, 2, 3, 4, 5].map((drop) => (
              <Droplet
                key={drop}
                size={18}
                className={`transition-all duration-300 ${
                  drop <= vidas
                    ? "text-cyan-500 fill-cyan-500 scale-100"
                    : "text-gray-200 fill-none scale-90"
                }`}
              />
            ))}
          </div>
          <span className="text-[10px] bg-rose-50 text-rose-600 border border-rose-100 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
            {mensagem.autor}
          </span>
        </div>

        {/* ── Ilustração do Canteiro do Jardim ── */}
        <div className="w-full aspect-[400/180] rounded-2xl overflow-hidden relative">
          <JardimSVG
            stage={palavrasCorretas.length}
            totalWords={palavrasDaFrase.length}
            falhou={falhou}
          />
          {completo && (
            <div className="absolute inset-0 bg-emerald-500/10 backdrop-blur-[0.5px] pointer-events-none flex items-center justify-center">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest bg-white/90 border border-emerald-300 px-4 py-1.5 rounded-full shadow-md animate-bounce">
                ✿ O Jardim Floresceu! ✿
              </span>
            </div>
          )}
          {falhou && (
            <div className="absolute inset-0 bg-amber-800/10 backdrop-blur-[0.5px] pointer-events-none flex items-center justify-center">
              <span className="text-xs font-bold text-amber-900 uppercase tracking-widest bg-white/95 border border-amber-300 px-4 py-1.5 rounded-full shadow-md">
                ⚠ Canteiro seco! Regue e tente novamente ⚠
              </span>
            </div>
          )}
        </div>

        {/* ── Painel de Dicas ── */}
        {!completo && !falhou && (
          <div className="bg-rose-50/50 border border-rose-100 rounded-2xl px-5 py-4">
            <span className="text-xs font-bold text-rose-700 uppercase tracking-widest flex items-center gap-1">
              <Heart size={12} className="fill-rose-100" /> Dica de Luz
            </span>
            <p className="mt-1 text-sm text-gray-700 font-light">{mensagem.dica}</p>
          </div>
        )}

        {/* ── Exibição da Frase Sendo Formada ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 min-h-[100px] flex flex-wrap gap-x-2 gap-y-3 items-center justify-center md:justify-start shadow-sm">
          {palavrasCorretas.length === 0 ? (
            <span className="text-sm text-muted-foreground/40 italic font-light">
              Clique nas palavras abaixo na ordem correta para semear a mensagem...
            </span>
          ) : (
            palavrasCorretas.map((palavra, i) => (
              <span
                key={i}
                className="text-base md:text-lg font-medium text-emerald-800 bg-emerald-50 border border-emerald-100 px-3.5 py-1.5 rounded-xl shadow-sm transition-all duration-300 scale-100 animate-in zoom-in-90"
              >
                {palavra}
              </span>
            ))
          )}
        </div>

        {/* ── Área de Bolhas de Palavras para Clicar ── */}
        {!completo && !falhou && (
          <div className="bg-gray-50 border border-gray-100 rounded-3xl p-5 flex flex-wrap gap-2.5 justify-center shadow-inner">
            {bolhasDisponiveis.map((bolha) => {
              const eErro = erroAtivoId === bolha.id;
              return (
                <button
                  key={bolha.id}
                  onClick={() =>
                    handleSelecionarPalavra(bolha.id, bolha.texto, bolha.indexOriginal)
                  }
                  className={`
                    px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200 active:scale-95 shadow-sm
                    ${
                      eErro
                        ? "bg-rose-500 text-white border-rose-600 animate-shake"
                        : "bg-white border-gray-200 text-gray-700 hover:bg-rose-50/40 hover:border-rose-300"
                    }
                  `}
                >
                  {bolha.texto}
                </button>
              );
            })}
          </div>
        )}

        {/* ── Tela de Sucesso / Conclusão de Sementeira ── */}
        {completo && (
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-3xl p-6 md:p-8 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0 shadow-inner">
                <Award className="text-emerald-700 w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-emerald-800 leading-snug">
                  Sementeira Realizada!
                </h3>
                <p className="text-xs text-emerald-600/80">
                  Você completou a mensagem espírita perfeitamente.
                </p>
              </div>
            </div>

            <div className="bg-white/70 border border-emerald-100/50 rounded-2xl p-5 shadow-inner">
              <blockquote className="text-lg font-serif font-light text-gray-800 leading-relaxed italic">
                "{mensagem.texto}"
              </blockquote>
              <p className="mt-3 text-xs text-emerald-700 font-semibold text-right">
                — {mensagem.autor} {mensagem.origem ? `· ${mensagem.origem}` : ""}
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest flex items-center gap-1.5">
                <BookOpen size={12} /> Reflexão Fraterna
              </span>
              <p className="text-sm text-gray-600 font-light leading-relaxed">
                {mensagem.significado}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={proximaFrase}
                className="flex-1 py-3.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-md shadow-emerald-600/10"
              >
                <Sparkles size={15} />
                Próxima Mensagem
              </button>
              <button
                onClick={() => iniciarRodada(mensagem)}
                className="flex-1 py-3.5 rounded-xl text-sm font-medium border border-emerald-200 text-emerald-700 hover:bg-emerald-100/40 transition-colors flex items-center justify-center gap-2 bg-white"
              >
                <RotateCcw size={14} />
                Jogar esta de novo
              </button>
            </div>
          </div>
        )}

        {/* ── Tela de Fracasso / Canteiro Seco ── */}
        {falhou && (
          <div className="bg-white border border-amber-200 rounded-3xl p-6 md:p-8 text-center space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-md">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto shadow-inner">
              <Sprout className="text-amber-600 w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Canteiro Desidratado!</h3>
              <p className="text-sm text-gray-500 mt-1 font-light leading-relaxed">
                O regador ficou sem água! Mas não desanime, o aprendizado é constante na seara
                espiritual.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto pt-2">
              <button
                onClick={() => iniciarRodada(mensagem)}
                className="flex-1 py-3.5 rounded-xl text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 transition-colors flex items-center justify-center gap-2 shadow-md shadow-amber-600/15"
              >
                <RotateCcw size={15} />
                Tentar novamente
              </button>
              <Link
                to="/jogos"
                className="flex-1 py-3.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center"
              >
                Voltar aos jogos
              </Link>
            </div>
          </div>
        )}

        {/* ── Ações no Rodapé ── */}
        <div className="flex justify-between items-center pt-2">
          <Link
            to="/jogos"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Sair do Jogo
          </Link>
          {!completo && !falhou && (
            <button
              onClick={() => iniciarRodada(mensagem)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-rose-600 transition-colors"
            >
              <RotateCcw size={12} />
              Recomeçar
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
