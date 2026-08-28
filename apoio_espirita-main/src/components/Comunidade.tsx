/**
 * Peças comuns das telas de comunidade.
 *
 * Dez recursos entraram de uma vez (Fórum, Grupos, Bazar, Caronas, Entregas,
 * Voluntariado, Plantão de Orações, Área de Jovens, Aniversariantes e Ficha de
 * Atendimento). Se cada tela repetisse o cabeçalho, a guarda de acesso, o campo
 * de formulário e o seletor de visibilidade, dez cópias divergiriam na primeira
 * correção — foi exatamente o que aconteceu com os cartões da tela inicial
 * antes de existir um catálogo único.
 *
 * Aqui mora o que as dez telas têm em comum. O que é próprio de cada recurso
 * fica na rota dele.
 */
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Globe2, Home, Info, TriangleAlert } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

/* ─────────────────────────── Página ─────────────────────────── */

interface PaginaProps {
  /** Palavra curta acima do título. Ex.: "Nossa comunidade". */
  secao: string;
  /** Primeira parte do título, em peso leve. */
  titulo: string;
  /** Segunda parte do título, destacada. */
  destaque: string;
  descricao: React.ReactNode;
  children: React.ReactNode;
  /** Some com a exigência de sigla — telas que funcionam sem casa definida. */
  dispensaCasa?: boolean;
}

/**
 * Moldura das telas de comunidade: cabeçalho, volta para o início e as duas
 * guardas que toda tela precisa — estar logado e pertencer a uma casa.
 *
 * A segunda guarda não é capricho: o banco carimba a casa do autor em toda
 * publicação, então sem sigla no perfil o envio falharia no servidor com uma
 * mensagem que a pessoa não saberia resolver. Melhor dizer antes, com o caminho
 * para resolver.
 */
export function PaginaComunidade({
  secao,
  titulo,
  destaque,
  descricao,
  children,
  dispensaCasa = false,
}: PaginaProps) {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  if (loading || !user) return null;

  const semCasa = !dispensaCasa && !profile?.sigla_casa;

  return (
    <main className="page-light min-h-screen px-4 pt-20 pb-20">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/inicio"
          className="text-xs uppercase tracking-[0.3em] text-cyan-glow hover:text-foreground transition-colors"
        >
          ← Início
        </Link>

        <header className="mt-8 mb-10 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-cyan-glow mb-4">{secao}</p>
          <h1 className="text-3xl md:text-4xl font-light text-foreground">
            {titulo} <span className="text-gradient-aurora font-medium">{destaque}</span>
          </h1>
          <div className="mt-4 text-muted-foreground font-light max-w-xl mx-auto text-sm leading-relaxed">
            {descricao}
          </div>
        </header>

        {semCasa ? (
          <div className="glass rounded-3xl p-8 text-center space-y-4">
            <div className="flex justify-center">
              <Home size={32} strokeWidth={1.5} className="text-cyan-glow" />
            </div>
            <h2 className="text-lg font-medium text-foreground">
              Informe a sua casa espírita para continuar
            </h2>
            <p className="text-sm text-muted-foreground font-light max-w-md mx-auto">
              Tudo que se publica aqui pertence a uma casa, e é a casa que decide quem enxerga. Sem
              a sigla no seu perfil, não há onde guardar o que você escrever.
            </p>
            <Link
              to="/completar-perfil"
              className="inline-block mt-2 px-6 py-3 rounded-full text-xs uppercase tracking-widest text-cyan-glow border border-cyan-glow/40 hover:bg-cyan-glow/5 transition-colors"
            >
              Completar perfil
            </Link>
          </div>
        ) : (
          children
        )}
      </div>
    </main>
  );
}

/* ─────────────────────────── Blocos ─────────────────────────── */

export function Cartao({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`glass rounded-3xl p-6 md:p-8 ${className}`}>{children}</div>;
}

export function Abas<T extends string>({
  abas,
  atual,
  aoTrocar,
}: {
  abas: { id: T; rotulo: string }[];
  atual: T;
  aoTrocar: (id: T) => void;
}) {
  return (
    <div className="flex rounded-2xl overflow-hidden border border-border mb-8">
      {abas.map((a) => (
        <button
          key={a.id}
          type="button"
          onClick={() => aoTrocar(a.id)}
          className={`flex-1 py-3 px-2 text-xs uppercase tracking-widest transition-colors ${
            atual === a.id
              ? "bg-cyan-glow/10 text-cyan-glow"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {a.rotulo}
        </button>
      ))}
    </div>
  );
}

export function Vazio({ texto, acao }: { texto: string; acao?: React.ReactNode }) {
  return (
    <div className="glass rounded-3xl p-10 text-center">
      <p className="text-muted-foreground font-light">{texto}</p>
      {acao && <div className="mt-4">{acao}</div>}
    </div>
  );
}

export function Aviso({
  tipo,
  children,
}: {
  tipo: "erro" | "ok" | "nota";
  children: React.ReactNode;
}) {
  const estilo =
    tipo === "erro"
      ? "bg-red-50 border-red-200 text-red-700"
      : tipo === "ok"
        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
        : "bg-cyan-50 border-cyan-200 text-cyan-800";
  const Icone = tipo === "erro" ? TriangleAlert : Info;
  return (
    <div className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${estilo}`}>
      <Icone size={16} strokeWidth={1.8} className="mt-0.5 shrink-0" />
      <div className="font-light leading-relaxed">{children}</div>
    </div>
  );
}

export function Etiqueta({
  children,
  tom = "neutro",
}: {
  children: React.ReactNode;
  tom?: "neutro" | "verde" | "ambar" | "violeta" | "ciano" | "vermelho";
}) {
  const tons: Record<string, string> = {
    neutro: "bg-slate-100 text-slate-500 border-slate-200",
    verde: "bg-emerald-50 text-emerald-700 border-emerald-200",
    ambar: "bg-amber-50 text-amber-700 border-amber-200",
    violeta: "bg-violet-50 text-violet-700 border-violet-200",
    ciano: "bg-cyan-50 text-cyan-700 border-cyan-200",
    vermelho: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border ${tons[tom]}`}
    >
      {children}
    </span>
  );
}

/* ────────────────────────── Formulário ────────────────────────── */

export function Rotulo({
  children,
  ajuda,
  obrigatorio,
}: {
  children: React.ReactNode;
  ajuda?: string;
  obrigatorio?: boolean;
}) {
  return (
    <label className="block text-xs uppercase tracking-[0.3em] text-cyan-glow mb-2">
      {children}
      {obrigatorio && <span className="text-cyan-glow"> *</span>}
      {ajuda && (
        <span className="ml-2 text-muted-foreground/40 normal-case tracking-normal text-[10px]">
          {ajuda}
        </span>
      )}
    </label>
  );
}

const campoCls =
  "w-full bg-transparent border-b border-border/60 text-foreground py-2.5 focus:outline-none focus:border-cyan-glow transition-colors font-light placeholder-muted-foreground/40 text-sm";

export function CampoTexto(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${campoCls} ${props.className ?? ""}`} />;
}

export function CampoArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${campoCls} resize-none ${props.className ?? ""}`} />;
}

export function CampoSelecao(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${campoCls} ${props.className ?? ""}`} />;
}

export function BotaoPrimario({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`px-6 py-3 rounded-full text-xs uppercase tracking-widest text-cyan-glow border border-cyan-glow/40 hover:bg-cyan-glow/5 transition-colors duration-300 disabled:opacity-40 disabled:cursor-not-allowed ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}

export function BotaoDiscreto({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`px-4 py-2 rounded-full text-xs uppercase tracking-widest text-muted-foreground/70 border border-border hover:text-foreground hover:border-cyan-glow/40 transition-colors disabled:opacity-40 ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}

/**
 * Seletor de alcance da publicação.
 *
 * A regra vem do banco (`pode_ver_da_casa`): nasce restrito à casa e quem
 * publica decide abrir. O texto explica a consequência em vez de mostrar apenas
 * um interruptor — "aberto" significa que gente de outras casas vai ler.
 */
export function EscolhaVisibilidade({
  aberto,
  aoMudar,
  substantivo = "esta publicação",
}: {
  aberto: boolean;
  aoMudar: (v: boolean) => void;
  substantivo?: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 p-4">
      <p className="text-xs uppercase tracking-[0.3em] text-cyan-glow mb-3">Quem enxerga</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => aoMudar(false)}
          className={`flex items-start gap-2 rounded-xl border px-3 py-3 text-left transition-colors ${
            !aberto
              ? "border-cyan-glow/50 bg-cyan-glow/5"
              : "border-border/60 hover:border-cyan-glow/30"
          }`}
        >
          <Home size={15} strokeWidth={1.6} className="mt-0.5 text-cyan-glow shrink-0" />
          <span>
            <span className="block text-sm text-foreground">Somente a minha casa</span>
            <span className="block text-xs text-muted-foreground font-light">
              Ninguém de fora vê {substantivo}.
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => aoMudar(true)}
          className={`flex items-start gap-2 rounded-xl border px-3 py-3 text-left transition-colors ${
            aberto
              ? "border-cyan-glow/50 bg-cyan-glow/5"
              : "border-border/60 hover:border-cyan-glow/30"
          }`}
        >
          <Globe2 size={15} strokeWidth={1.6} className="mt-0.5 text-emerald-600 shrink-0" />
          <span>
            <span className="block text-sm text-foreground">Todas as casas</span>
            <span className="block text-xs text-muted-foreground font-light">
              Membros de qualquer casa espírita poderão ler.
            </span>
          </span>
        </button>
      </div>
    </div>
  );
}

/** Etiqueta de alcance para as listagens. */
export function MarcaAlcance({ aberto }: { aberto: boolean }) {
  return aberto ? (
    <Etiqueta tom="verde">
      <Globe2 size={10} strokeWidth={2} /> Todas as casas
    </Etiqueta>
  ) : (
    <Etiqueta>
      <Home size={10} strokeWidth={2} /> Minha casa
    </Etiqueta>
  );
}

/* ─────────────────────────── Formatos ─────────────────────────── */

export function dataPorExtenso(iso: string): string {
  return new Date(iso + "T12:00:00Z").toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

export function quandoFoi(iso: string): string {
  const d = new Date(iso);
  const minutos = Math.round((Date.now() - d.getTime()) / 60000);
  if (minutos < 1) return "agora";
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `há ${horas} h`;
  const dias = Math.round(horas / 24);
  if (dias < 7) return `há ${dias} ${dias === 1 ? "dia" : "dias"}`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export const DIAS_SEMANA = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
] as const;

export function iniciais(nome: string | null | undefined): string {
  const limpo = (nome ?? "").trim();
  if (!limpo) return "?";
  const partes = limpo.split(/\s+/);
  return ((partes[0]?.[0] ?? "") + (partes.length > 1 ? (partes[partes.length - 1][0] ?? "") : ""))
    .toUpperCase()
    .slice(0, 2);
}
