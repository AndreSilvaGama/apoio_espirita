import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import type { Json, TablesUpdate } from "@/integrations/supabase/types";
import { mensagemDeErro } from "@/lib/erros";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  QrCode,
  Copy,
  Check,
  Plus,
  Trash2,
  Pin,
  PinOff,
  Edit3,
  Save,
  X,
  Users,
  Shield,
  Calendar,
  MessageSquare,
  Info,
  Heart,
  UserPlus,
  UserMinus,
  Image,
  Video,
  CalendarDays,
  Lock,
  Unlock,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  CircleHelp,
  ClipboardList,
  Wallet,
  BookOpen,
  BookMarked,
  Shirt,
  Footprints,
  Star,
  LayoutDashboard,
  Wrench,
  Megaphone,
  ThumbsUp,
  Scale,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  FUNCIONALIDADES,
  FUNCIONALIDADE_STATUS_LABEL,
  FUNCIONALIDADE_STATUS_STYLE,
  type FuncionalidadeCategoria,
  type FuncionalidadeItem,
  type FuncionalidadeStatus,
} from "@/data/funcionalidades";
import { supabase } from "@/integrations/supabase/client";
import { usePainelVotes, toItemKey } from "@/hooks/usePainelVotes";
import { validarLinguagem } from "@/lib/linguagem";
import { toast } from "sonner";
import { format, parseISO, isAfter, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CasaHero } from "@/components/CasaHero";
import { TesourariaTab } from "@/components/TesourariaTab";
import { FilaRevisaoArtigos } from "@/components/FilaRevisaoArtigos";

/**
 * As abas da pagina da casa. Ficam tambem no endereco (`?aba=`) para que um
 * cartao de funcionalidade — o Mural de Avisos, a Escala de Trabalho — consiga
 * levar direto ao lugar certo: esses recursos vivem aqui dentro e nao tem rota
 * propria.
 */
const ABAS = [
  "painel",
  "mural",
  "sobre",
  "programacao",
  "tesouraria",
  "doacoes",
  "configuracoes",
  "tarefeiros",
] as const;

/** Abas que um visitante sem login pode abrir; as outras sao internas. */
const ABAS_PUBLICAS: readonly Aba[] = ["sobre", "doacoes"];

export const Route = createFileRoute("/casa/$sigla")({
  component: PaginaCasa,
  validateSearch: (search: Record<string, unknown>): { aba?: Aba } => {
    const aba = search.aba;
    return typeof aba === "string" && (ABAS as readonly string[]).includes(aba)
      ? { aba: aba as Aba }
      : {};
  },
});

/* ── Types ─────────────────────────────────────────────────────── */

type Aba = (typeof ABAS)[number];

interface PaginaData {
  sigla_casa: string;
  nome_completo: string;
  descricao: string;
  missao: string;
  ano_fundacao: number | null;
  endereco: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  telefone: string;
  email_contato: string;
  site: string;
  horarios: (HorarioItem | MuralItem)[];
  chave_pix: string;
  texto_doacao: string;
  publicada: boolean;
}

/**
 * A coluna `horarios` guarda dois tipos de item: os horários fixos da casa e os
 * itens do mural (escalas). Estes últimos trazem `tipo` e `id`.
 */
interface MuralItem {
  id: string;
  tipo: string;
  dia: string;
  mes_ano: string;
  dia_semana: string;
  tema: string;
  facilitador: string;
  casa: string;
  coordenador: string;
  passe: string;
  streamyard: string;
  recepcao: string;
  arquivado?: boolean;
}

interface HorarioItem {
  dia: string;
  hora: string;
  atividade: string;
}

/**
 * O que o visitante procura numa página de casa espírita.
 *
 * Publicar com estes campos em branco entrega uma casa que parece abandonada —
 * pior do que não publicar. A lista não bloqueia a publicação: ela informa, com
 * nome e lugar, o que ainda falta. A decisão continua sendo da direção da casa.
 */
const ITENS_PAGINA_PUBLICA: {
  chave: string;
  rotulo: string;
  onde: string;
  preenchido: (p: PaginaData) => boolean;
}[] = [
  {
    chave: "nome",
    rotulo: "Nome completo da casa",
    onde: "aqui em Configurações",
    preenchido: (p) => !!p.nome_completo?.trim(),
  },
  {
    chave: "descricao",
    rotulo: "Descrição — o que a casa é",
    onde: "aqui em Configurações",
    preenchido: (p) => !!p.descricao?.trim(),
  },
  {
    chave: "endereco",
    rotulo: "Endereço, para o visitante chegar",
    onde: "aqui em Configurações",
    preenchido: (p) => !!p.endereco?.trim(),
  },
  {
    chave: "contato",
    rotulo: "Um contato: telefone, e-mail ou site",
    onde: "aqui em Configurações",
    preenchido: (p) => !!(p.telefone?.trim() || p.email_contato?.trim() || p.site?.trim()),
  },
  {
    chave: "horarios",
    rotulo: "Horários das atividades",
    onde: "na aba Atividades",
    preenchido: (p) =>
      (p.horarios ?? []).some((h) => !("tipo" in h) || (h as MuralItem).tipo !== "escala"),
  },
];

function pendenciasDaPagina(p: PaginaData) {
  return ITENS_PAGINA_PUBLICA.filter((i) => !i.preenchido(p));
}

interface Post {
  id: string;
  sigla_casa: string;
  autor_id: string | null;
  autor_nome: string;
  conteudo: string;
  imagem_url: string | null;
  video_url: string | null;
  fixado: boolean;
  created_at: string;
  editado_em: string | null;
}

interface Evento {
  id: string;
  sigla_casa: string;
  titulo: string;
  descricao: string | null;
  data_evento: string;
  hora_inicio: string | null;
  hora_fim: string | null;
  local_evento: string | null;
  publica: boolean;
  criado_por: string | null;
  criado_por_nome: string;
  created_at: string;
}

interface EvParticipante {
  evento_id: string;
  user_id: string;
  status: "convidado" | "confirmado" | "recusou";
  nome?: string;
}

interface Membro {
  id: string;
  nome: string;
  cargo_principal?: string | null;
  atividades?: string[] | null;
}

const DIAS = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
  "Domingo",
];

const CARGOS = [
  "Presidente",
  "Vice-presidente",
  "Coordenador",
  "Diretoria",
  "Dirigente",
  "Dirigente de reunião mediúnica",
  "Tesoureiro",
  "Assistido",
  "Associado",
  "Atendente fraterno",
  "Colaborador",
  "Estudante",
  "Evangelizador",
  "Expositor",
  "Facilitador",
  "Frequentador",
  "Médium",
  "Palestrante",
  "Participante de estudo",
  "Passista",
  "Sócio",
  "Tarefeiro",
  "Trabalhador",
  "Visitante",
];

const FORM_POST_INICIAL = { conteudo: "", imagem_url: "", video_url: "" };
const FORM_EVENTO_INICIAL = {
  titulo: "",
  descricao: "",
  data_evento: "",
  hora_inicio: "",
  hora_fim: "",
  local_evento: "",
  publica: true,
};

interface DashTodayMsg {
  texto: string;
  referencia: string | null;
  autor_nome: string;
  sigla_casa: string | null;
}

interface DashAgendaEvento {
  id: string;
  titulo: string;
  data_inicio: string;
  data_fim: string | null;
  tipo: "aberto" | "fechado";
  aceita_confirmacao: boolean;
  agenda_participantes: { id: string; user_id: string; confirmado: boolean | null }[];
}

const DAILY_MESSAGES = [
  { text: "Fora da caridade não há salvação.", author: "Allan Kardec" },
  {
    text: "Não façais aos outros o que não quiserdes que vos façam; fazei-lhes todo o bem que quiserdes que vos façam.",
    author: "O Evangelho segundo o Espiritismo",
  },
  {
    text: "A caridade bem compreendida consiste em fazer o bem a todos os homens sem distinção.",
    author: "O Livro dos Espíritos",
  },
  {
    text: "Amai-vos uns aos outros: eis toda a lei; lei divina, pela qual Deus governa os mundos.",
    author: "O Evangelho segundo o Espiritismo",
  },
  {
    text: "A humildade é o adorno da alma, assim como a modéstia é o adorno do mérito.",
    author: "O Livro dos Espíritos",
  },
  {
    text: "Quem semeia o bem colhe bons frutos; quem semeia o mal colhe maus frutos.",
    author: "A Gênese · Cap. VII",
  },
  {
    text: "O verdadeiro espiritismo é aquele que tem por divisa: fora da caridade não há salvação.",
    author: "Allan Kardec · A Gênese",
  },
];

const DASH_BAZAR: {
  Icon: LucideIcon;
  name: string;
  category: string;
  price: string;
  desc: string;
}[] = [
  {
    Icon: BookOpen,
    name: "O Livro dos Espíritos",
    category: "Livro",
    price: "R$ 35,00",
    desc: "Allan Kardec · Edição FEB",
  },
  {
    Icon: BookMarked,
    name: "O Evangelho segundo o Espiritismo",
    category: "Livro",
    price: "R$ 30,00",
    desc: "Allan Kardec · Edição FEB",
  },
  {
    Icon: Shirt,
    name: "Calça",
    category: "Vestuário",
    price: "R$ 45,00",
    desc: "Tamanho M · boa conservação",
  },
  {
    Icon: Shirt,
    name: "Camisa",
    category: "Vestuário",
    price: "R$ 20,00",
    desc: "Tamanho G · algodão",
  },
  {
    Icon: Shirt,
    name: "Blusa",
    category: "Vestuário",
    price: "R$ 25,00",
    desc: "Tamanho P · malha",
  },
  {
    Icon: Footprints,
    name: "Sapato",
    category: "Calçado",
    price: "R$ 30,00",
    desc: "Nº 38 · couro sintético",
  },
];

const DEFAULT_GECAL_ESCALAS: {
  id: string;
  tipo: string;
  dia: string;
  mes_ano: string;
  dia_semana: string;
  tema: string;
  facilitador: string;
  casa: string;
  coordenador: string;
  passe: string;
  streamyard: string;
  recepcao: string;
  arquivado?: boolean;
}[] = [
  {
    id: "gecal-1",
    tipo: "escala",
    dia: "05",
    mes_ano: "Junho 2026",
    dia_semana: "Sexta-feira",
    tema: "Exemplificar o bem: Nossa luz deve brilhar",
    facilitador: "Sandra Helena",
    casa: "GECAL",
    coordenador: "BELO",
    passe: "Luana · Jacqueline · Bárbara · Lidiane",
    streamyard: "Bárbara e Igor",
    recepcao: "Marion",
  },
  {
    id: "gecal-2",
    tipo: "escala",
    dia: "12",
    mes_ano: "Junho 2026",
    dia_semana: "Sexta-feira",
    tema: "O Dever e a Consciência: O Serviço ao Próximo como mandamento.",
    facilitador: "Marco Antônio",
    casa: "GECAL",
    coordenador: "MARCELI",
    passe: "Ana Lúcia · Belo",
    streamyard: "André e Tamires",
    recepcao: "Zélia",
  },
  {
    id: "gecal-3",
    tipo: "escala",
    dia: "19",
    mes_ano: "Junho 2026",
    dia_semana: "Sexta-feira",
    tema: "A Causa Primária de Todas as Coisas: Raciocinando sobre a Existência do Criador",
    facilitador: "Jailton Guilherme",
    casa: "GENOVA",
    coordenador: "BEATRIZ",
    passe: "Priscila · Graça · Belo · Ana Lúcia",
    streamyard: "Fabiana e Thiago",
    recepcao: "Jacqueline",
  },
  {
    id: "gecal-4",
    tipo: "escala",
    dia: "26",
    mes_ano: "Junho 2026",
    dia_semana: "Sexta-feira",
    tema: "Zaqueu, o Publicano: Uma História de Transformação pelo Encontro com Jesus",
    facilitador: "Claudiomar Fernandes",
    casa: "G.E. Luz no Lar",
    coordenador: "PRISCILA",
    passe: "Claudia Kaku · Leda · Luana · Marceli",
    streamyard: "Emerson e Virginia",
    recepcao: "Jorge",
  },
];

// A lista de funcionalidades e os rotulos de status vivem em
// src/data/funcionalidades.ts, compartilhados com a tela inicial (/inicio).
type DashStatus = FuncionalidadeStatus;
type DashFeatureItem = FuncionalidadeItem;
type DashFeatureCategory = FuncionalidadeCategoria;
const DASH_FEATURES = FUNCIONALIDADES;
const STATUS_LABEL = FUNCIONALIDADE_STATUS_LABEL;
const STATUS_STYLE = FUNCIONALIDADE_STATUS_STYLE;

/* ── Helpers ────────────────────────────────────────────────────── */

function videoEmbed(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?rel=0`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return null;
}

function fmtData(d: string) {
  return format(parseISO(d), "EEE, d 'de' MMM", { locale: ptBR });
}

function fmtHora(h: string | null) {
  return h ? h.slice(0, 5) : null;
}

/* ── Component ──────────────────────────────────────────────────── */

function PaginaCasa() {
  const { sigla } = Route.useParams();
  const { aba: abaDaUrl } = Route.useSearch();
  const { user, profile, loading, isPresident } = useAuth();
  const navigate = useNavigate();

  /* UI */
  const [aba, setAba] = useState<Aba>(abaDaUrl ?? "mural");
  const [modoAdmin, setModoAdmin] = useState(false);
  const [salvandoPublicacao, setSalvandoPublicacao] = useState(false);

  // Quem chegou por um endereco com `?aba=` pediu uma aba especifica: nao pode
  // ser jogado para outra assim que o perfil carrega.
  useEffect(() => {
    if (abaDaUrl) {
      setAba(abaDaUrl);
      return;
    }
    if (!loading && user && profile) {
      if (profile.sigla_casa === sigla) {
        setAba("painel");
      } else {
        setAba("mural");
      }
    }
  }, [loading, user, profile, sigla, abaDaUrl]);

  /* Data */
  const [pagina, setPagina] = useState<PaginaData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [adminIds, setAdminIds] = useState<string[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [evParts, setEvParts] = useState<Record<string, EvParticipante[]>>({});
  const [membros, setMembros] = useState<Membro[]>([]);
  const [carregando, setCarregando] = useState(true);
  const membrosCarregados = useRef(false);

  /* Mural UI */
  const [showNovoPost, setShowNovoPost] = useState(false);
  const [formNovoPost, setFormNovoPost] = useState(FORM_POST_INICIAL);
  const [editandoPostId, setEditandoPostId] = useState<string | null>(null);
  const [formEditPost, setFormEditPost] = useState(FORM_POST_INICIAL);

  /* Sobre */
  const [editSobre, setEditSobre] = useState(false);
  const [formSobre, setFormSobre] = useState<Partial<PaginaData>>({});

  /* Programação */
  const [showNovoHorario, setShowNovoHorario] = useState(false);
  const [novoHorario, setNovoHorario] = useState({ dia: DIAS[0], hora: "", atividade: "" });
  const [showNovoEvento, setShowNovoEvento] = useState(false);
  const [formNovoEvento, setFormNovoEvento] = useState(FORM_EVENTO_INICIAL);
  const [editandoEventoId, setEditandoEventoId] = useState<string | null>(null);
  const [formEditEvento, setFormEditEvento] = useState(FORM_EVENTO_INICIAL);
  const [eventoExpandido, setEventoExpandido] = useState<string | null>(null);
  const [addPartEventoId, setAddPartEventoId] = useState<string | null>(null);

  /* Doações */
  const [editDoacoes, setEditDoacoes] = useState(false);
  const [formDoacoes, setFormDoacoes] = useState({ chave_pix: "", texto_doacao: "" });

  /* Mural de Escalas UI */
  const [escalaDiaAtivo, setEscalaDiaAtivo] = useState<string>("");
  const [mostrarMuralArquivado, setMostrarMuralArquivado] = useState(false);
  const [showNovoMural, setShowNovoMural] = useState(false);
  const [editandoMuralId, setEditandoMuralId] = useState<string | null>(null);
  const [formMural, setFormMural] = useState({
    dia: "",
    mes_ano: "Junho 2026",
    dia_semana: "Sexta-feira",
    tema: "",
    facilitador: "",
    casa: "",
    coordenador: "",
    passe: "",
    streamyard: "",
    recepcao: "",
  });

  /* Admin panel */
  const [showAdmins, setShowAdmins] = useState(false);

  /* Utils */
  const [salvando, setSalvando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  /* Dashboard State */
  const [todayMsg, setTodayMsg] = useState<DashTodayMsg | null>(null);
  const [msgExpandida, setMsgExpandida] = useState(false);
  const { votes, votingKey, fetchVotes, toggleVoteByTitle } = usePainelVotes(user);
  const [agendaEventos, setAgendaEventos] = useState<DashAgendaEvento[]>([]);
  const [membrosCount, setMembrosCount] = useState<number | undefined>(undefined);
  const [eventosCount, setEventosCount] = useState<number | undefined>(undefined);

  /* Sync form states with loaded page data */
  useEffect(() => {
    if (pagina) {
      setFormSobre({
        nome_completo: pagina.nome_completo || "",
        descricao: pagina.descricao || "",
        missao: pagina.missao || "",
        ano_fundacao: pagina.ano_fundacao,
        cep: pagina.cep || "",
        endereco: pagina.endereco || "",
        bairro: pagina.bairro || "",
        cidade: pagina.cidade || "",
        uf: pagina.uf || "",
        telefone: pagina.telefone || "",
        email_contato: pagina.email_contato || "",
        site: pagina.site || "",
      });
      setFormDoacoes({
        chave_pix: pagina.chave_pix || "",
        texto_doacao: pagina.texto_doacao || "",
      });
    }
  }, [pagina]);

  /* ── Admin check ── */
  const isAdmin =
    !loading &&
    !!user &&
    !!profile &&
    (profile.cargo_principal === "DEV" ||
      (profile.sigla_casa === sigla &&
        (profile.cargo_principal === "Presidente" ||
          profile.cargo_principal === "Vice-presidente")) ||
      adminIds.includes(user.id));

  const isSameCasa = profile?.sigla_casa === sigla;

  // Visitante sem sessao vendo a versao publica da casa.
  const visitantePublico = !user;
  // A pagina so aparece a quem nao esta logado se a casa tiver publicado.
  const paginaPublica = !!pagina?.publicada;

  /* ── Auth guard ── */
  // Visitante anonimo NAO e mais expulso: se a casa publicou a pagina, ele ve a
  // versao publica. O redirecionamento para o login so acontece depois de
  // carregar, quando se sabe que nao ha pagina publicada para mostrar.
  useEffect(() => {
    if (
      !loading &&
      user &&
      (!profile?.sigla_casa ||
        !profile?.nome ||
        !profile?.cargo_principal ||
        !profile?.uf ||
        !profile?.cidade)
    ) {
      navigate({ to: "/completar-perfil" });
    }
  }, [user, profile, loading, navigate]);

  /* ── Load data ── */
  const carregar = useCallback(async () => {
    setCarregando(true);
    const [pRes, posRes, aRes, evRes, mCountRes, eCountRes] = await Promise.all([
      supabase.from("paginas_casas").select("*").eq("sigla_casa", sigla).maybeSingle(),
      supabase
        .from("publicacoes_casa")
        .select("*")
        .eq("sigla_casa", sigla)
        .order("fixado", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase.from("administradores_pagina").select("user_id").eq("sigla_casa", sigla),
      supabase
        .from("programacao_eventos")
        .select("*")
        .eq("sigla_casa", sigla)
        .order("data_evento", { ascending: true })
        .order("hora_inicio", { ascending: true }),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("sigla_casa", sigla),
      supabase
        .from("programacao_eventos")
        .select("id", { count: "exact", head: true })
        .eq("sigla_casa", sigla)
        .gte("data_evento", new Date().toISOString().slice(0, 10)),
    ]);
    if (pRes.data) setPagina(pRes.data as unknown as PaginaData);
    if (posRes.data) setPosts(posRes.data as Post[]);
    if (aRes.data) setAdminIds(aRes.data.map((a: { user_id: string }) => a.user_id));
    if (evRes.data) setEventos(evRes.data as Evento[]);
    if (mCountRes.count !== null) setMembrosCount(mCountRes.count);
    if (eCountRes.count !== null) setEventosCount(eCountRes.count);
    setCarregando(false);
  }, [sigla]);

  // Carrega tambem para visitante anonimo. Enquanto isto dependia de `user`,
  // quem chegava sem sessao ficava preso em "Carregando..." para sempre:
  // `carregando` nasce true e so e desligado dentro de carregar(). A pagina
  // publica da casa nunca chegava a aparecer. O que o visitante pode ler e
  // decidido pela RLS no banco, nao por este efeito.
  useEffect(() => {
    if (!loading) carregar();
  }, [loading, carregar]);

  // O visitante nao tem a aba Mural, mas a aba inicial nasce nela: sem esta
  // correcao ele cai num painel interno vazio, sem nenhuma aba marcada.
  // Atividades e o que ele veio procurar — os horarios da casa.
  useEffect(() => {
    if (!loading && !user) setAba((a) => (ABAS_PUBLICAS.includes(a) ? a : "sobre"));
  }, [loading, user]);

  // Auto-archive expired mural scales in the database
  useEffect(() => {
    if (modoAdmin && pagina?.horarios && sigla) {
      const currentList = (pagina.horarios ?? []) as unknown as MuralItem[];
      let changed = false;
      const updated = currentList.map((item) => {
        if (item.tipo === "escala" && !item.arquivado && isEscalaVencida(item.dia, item.mes_ano)) {
          changed = true;
          return { ...item, arquivado: true };
        }
        return item;
      });

      if (changed) {
        const updateDb = async () => {
          const { error } = await supabase
            .from("paginas_casas")
            .update({ horarios: updated as unknown as Json })
            .eq("sigla_casa", sigla);

          if (!error) {
            setPagina((prev) => (prev ? { ...prev, horarios: updated } : prev));
            toast.info("Programações públicas vencidas foram arquivadas automaticamente.");
          }
        };
        updateDb();
      }
    }
  }, [modoAdmin, pagina?.horarios, sigla]);

  const fetchAgenda = useCallback(async () => {
    if (!user || !profile?.sigla_casa) return;
    const hojeStr = new Date().toISOString().slice(0, 10);
    const { data } = await supabase
      .from("agenda_eventos")
      .select(
        "id, titulo, data_inicio, data_fim, tipo, aceita_confirmacao, agenda_participantes(id, user_id, confirmado)",
      )
      .eq("sigla_casa", profile.sigla_casa)
      .gte("data_inicio", hojeStr)
      .order("data_inicio", { ascending: true })
      .limit(10);
    setAgendaEventos((data as DashAgendaEvento[]) ?? []);
  }, [user, profile?.sigla_casa]);

  const handleConfirmarEvento = useCallback(
    async (eventoId: string) => {
      if (!user) return;
      await supabase
        .from("agenda_participantes")
        .upsert(
          { evento_id: eventoId, user_id: user.id, confirmado: true },
          { onConflict: "evento_id,user_id" },
        );
      fetchAgenda();
    },
    [user, fetchAgenda],
  );

  const handleResponderConvite = useCallback(
    async (participanteId: string, confirmado: boolean) => {
      await supabase.from("agenda_participantes").update({ confirmado }).eq("id", participanteId);
      fetchAgenda();
    },
    [fetchAgenda],
  );

  useEffect(() => {
    if (user && profile?.sigla_casa && sigla === profile.sigla_casa) {
      fetchAgenda();
      fetchVotes();

      const todayStr = new Date().toISOString().slice(0, 10);
      supabase
        .from("mensagens_do_dia")
        .select("texto, referencia, autor_nome, sigla_casa")
        .eq("sigla_casa", sigla) // ← isolamento: cada casa vê apenas sua mensagem
        .eq("data_exibicao", todayStr)
        .eq("aprovada", true)
        .single()
        .then(({ data }) => {
          if (data) setTodayMsg(data);
        });
    }
  }, [user, profile?.sigla_casa, sigla, fetchAgenda, fetchVotes]);

  // Mensagem exibida: a que a casa enviou para hoje ou, na falta dela, uma do
  // acervo fixo. O bloco mostra duas linhas; o texto pode ter ate 1000
  // caracteres e empurraria o resto do painel para fora da tela.
  const mensagemDoDia = todayMsg
    ? {
        texto: todayMsg.texto,
        autor: todayMsg.autor_nome,
        referencia: todayMsg.referencia,
      }
    : (() => {
        const diaDoAno = Math.floor(
          (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000,
        );
        const m = DAILY_MESSAGES[diaDoAno % DAILY_MESSAGES.length];
        return { texto: m.text, autor: m.author, referencia: null as string | null };
      })();
  const mensagemLonga = mensagemDoDia.texto.length > 150;

  /* ── Load membros (lazy) ── */
  const garantirMembros = useCallback(
    async (force = false) => {
      if (membrosCarregados.current && !force) return;
      const { data } = await supabase
        .from("profiles")
        .select("id, nome, cargo_principal, atividades")
        .eq("sigla_casa", sigla)
        .order("nome");
      if (data) setMembros((data as Membro[]).filter((m) => m.cargo_principal !== "DEV"));
      membrosCarregados.current = true;
    },
    [sigla],
  );

  useEffect(() => {
    if (aba === "tarefeiros") {
      garantirMembros();
    }
  }, [aba, garantirMembros]);

  /* ── Load participants for an event ── */
  const carregarParticipantes = useCallback(
    async (eventoId: string) => {
      if (evParts[eventoId]) return;
      const { data: parts } = await supabase
        .from("programacao_participantes")
        .select("evento_id, user_id, status")
        .eq("evento_id", eventoId);
      if (!parts) return;
      const ids = parts.map((p) => p.user_id);
      const nomes: Record<string, string> = {};
      if (ids.length > 0) {
        const { data: profs } = await supabase.from("profiles").select("id, nome").in("id", ids);
        profs?.forEach((p: { id: string; nome: string | null }) => {
          nomes[p.id] = p.nome ?? "";
        });
      }
      setEvParts((prev) => ({
        ...prev,
        [eventoId]: parts.map((p) => ({
          ...p,
          nome: nomes[p.user_id] || "Membro",
        })) as EvParticipante[],
      }));
    },
    [evParts],
  );

  /* ═══════════════════════════════════════════════
     ACTIONS — MURAL
  ═══════════════════════════════════════════════ */

  const publicarPost = async () => {
    if (!formNovoPost.conteudo.trim()) return;
    // O mural fica visível a todos os membros da casa e aos visitantes.
    const linguagem = validarLinguagem(formNovoPost.conteudo);
    if (linguagem) {
      toast.error(linguagem);
      return;
    }
    const { data, error } = await supabase
      .from("publicacoes_casa")
      .insert({
        sigla_casa: sigla,
        autor_id: user!.id,
        autor_nome: profile?.nome || "Membro",
        conteudo: formNovoPost.conteudo.trim(),
        imagem_url: formNovoPost.imagem_url.trim() || null,
        video_url: formNovoPost.video_url.trim() || null,
        fixado: false,
      })
      .select()
      .single();
    if (error || !data) {
      toast.error("Erro ao publicar.");
      return;
    }
    // Uma unica atualizacao da lista: as tres que existiam aqui empilhavam o
    // mesmo post e ele aparecia em triplicata ate a pagina ser recarregada.
    // O post novo entra abaixo dos fixados e acima dos demais.
    setPosts((prev) => {
      const novo = data as Post;
      const fixados = prev.filter((p) => p.fixado);
      const normais = prev.filter((p) => !p.fixado);
      return [...fixados, novo, ...normais];
    });
    setFormNovoPost(FORM_POST_INICIAL);
    setShowNovoPost(false);
    toast.success("Publicado no mural.");
  };

  const iniciarEdicaoPost = (post: Post) => {
    setEditandoPostId(post.id);
    setFormEditPost({
      conteudo: post.conteudo,
      imagem_url: post.imagem_url || "",
      video_url: post.video_url || "",
    });
  };

  const salvarEdicaoPost = async (id: string) => {
    const linguagem = validarLinguagem(formEditPost.conteudo);
    if (linguagem) {
      toast.error(linguagem);
      return;
    }
    const { data, error } = await supabase
      .from("publicacoes_casa")
      .update({
        conteudo: formEditPost.conteudo.trim(),
        imagem_url: formEditPost.imagem_url.trim() || null,
        video_url: formEditPost.video_url.trim() || null,
        editado_em: new Date().toISOString(),
      })
      .eq("id", id)
      .select();

    if (error) {
      toast.error(`Erro ao salvar: ${error.message}`);
      return;
    }
    if (!data || data.length === 0) {
      toast.error("Erro: Sem permissão para editar esta publicação.");
      return;
    }

    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              conteudo: formEditPost.conteudo.trim(),
              imagem_url: formEditPost.imagem_url.trim() || null,
              video_url: formEditPost.video_url.trim() || null,
              editado_em: new Date().toISOString(),
            }
          : p,
      ),
    );
    setEditandoPostId(null);
    toast.success("Publicação atualizada.");
  };

  const excluirPost = async (id: string) => {
    if (!window.confirm("Deseja realmente excluir esta publicação do mural?")) return;
    const { data, error } = await supabase.from("publicacoes_casa").delete().eq("id", id).select();

    if (error) {
      toast.error(`Erro ao excluir: ${error.message}`);
      return;
    }
    if (!data || data.length === 0) {
      toast.error("Erro: Sem permissão no banco de dados para excluir esta publicação.");
      return;
    }

    setPosts((prev) => prev.filter((p) => p.id !== id));
    toast.success("Publicação removida.");
  };

  const toggleFixar = async (post: Post) => {
    const { error } = await supabase
      .from("publicacoes_casa")
      .update({ fixado: !post.fixado })
      .eq("id", post.id);
    if (error) return;
    setPosts((prev) => {
      const list = prev.map((p) => (p.id === post.id ? { ...p, fixado: !p.fixado } : p));
      return [...list.filter((p) => p.fixado), ...list.filter((p) => !p.fixado)];
    });
  };

  /* ═══════════════════════════════════════════════
     ACTIONS — SOBRE
  ═══════════════════════════════════════════════ */

  const salvarSobre = async () => {
    setSalvando(true);
    const { error } = await supabase
      .from("paginas_casas")
      .update({ ...formSobre } as unknown as TablesUpdate<"paginas_casas">)
      .eq("sigla_casa", sigla);
    setSalvando(false);
    if (error) {
      toast.error("Erro ao salvar.");
      return;
    }
    setPagina((prev) => (prev ? { ...prev, ...formSobre } : prev));
    setEditSobre(false);
    toast.success("Página atualizada.");
  };

  /* ═══════════════════════════════════════════════
     ACTIONS — PROGRAMAÇÃO / HORÁRIOS
  ═══════════════════════════════════════════════ */

  const adicionarHorario = async () => {
    if (!novoHorario.hora || !novoHorario.atividade.trim()) {
      toast.error("Preencha horário e atividade.");
      return;
    }
    const updated = [...(pagina!.horarios ?? []), { ...novoHorario }];
    const { error } = await supabase
      .from("paginas_casas")
      .update({ horarios: updated as unknown as Json })
      .eq("sigla_casa", sigla);
    if (error) {
      toast.error("Erro ao salvar.");
      return;
    }
    setPagina((prev) => (prev ? { ...prev, horarios: updated } : prev));
    setNovoHorario({ dia: DIAS[0], hora: "", atividade: "" });
    setShowNovoHorario(false);
  };

  const removerHorario = async (item: HorarioItem | MuralItem) => {
    const updated = (pagina!.horarios ?? []).filter((h) => h !== item);
    const { error } = await supabase
      .from("paginas_casas")
      .update({ horarios: updated as unknown as Json })
      .eq("sigla_casa", sigla);
    if (error) {
      toast.error("Erro ao remover.");
      return;
    }
    setPagina((prev) => (prev ? { ...prev, horarios: updated } : prev));
  };

  /* ═══════════════════════════════════════════════
     ACTIONS — PROGRAMAÇÃO / EVENTOS
  ═══════════════════════════════════════════════ */

  const criarEvento = async () => {
    if (!formNovoEvento.titulo.trim() || !formNovoEvento.data_evento) {
      toast.error("Título e data são obrigatórios.");
      return;
    }
    const { data, error } = await supabase
      .from("programacao_eventos")
      .insert({
        sigla_casa: sigla,
        titulo: formNovoEvento.titulo.trim(),
        descricao: formNovoEvento.descricao.trim() || null,
        data_evento: formNovoEvento.data_evento,
        hora_inicio: formNovoEvento.hora_inicio || null,
        hora_fim: formNovoEvento.hora_fim || null,
        local_evento: formNovoEvento.local_evento.trim() || null,
        publica: formNovoEvento.publica,
        criado_por: user!.id,
        criado_por_nome: profile?.nome || "Admin",
      })
      .select()
      .single();
    if (error || !data) {
      toast.error("Erro ao criar evento.");
      return;
    }
    setEventos((prev) =>
      [...prev, data as Evento].sort((a, b) => a.data_evento.localeCompare(b.data_evento)),
    );
    setFormNovoEvento(FORM_EVENTO_INICIAL);
    setShowNovoEvento(false);
    toast.success("Evento criado.");
  };

  const salvarEdicaoEvento = async (id: string) => {
    if (!formEditEvento.titulo.trim() || !formEditEvento.data_evento) {
      toast.error("Título e data obrigatórios.");
      return;
    }
    const { error } = await supabase
      .from("programacao_eventos")
      .update({
        titulo: formEditEvento.titulo.trim(),
        descricao: formEditEvento.descricao.trim() || null,
        data_evento: formEditEvento.data_evento,
        hora_inicio: formEditEvento.hora_inicio || null,
        hora_fim: formEditEvento.hora_fim || null,
        local_evento: formEditEvento.local_evento.trim() || null,
        publica: formEditEvento.publica,
      })
      .eq("id", id);
    if (error) {
      toast.error("Erro ao salvar.");
      return;
    }
    setEventos((prev) =>
      prev
        .map((e) =>
          e.id === id
            ? {
                ...e,
                titulo: formEditEvento.titulo.trim(),
                descricao: formEditEvento.descricao.trim() || null,
                data_evento: formEditEvento.data_evento,
                hora_inicio: formEditEvento.hora_inicio || null,
                hora_fim: formEditEvento.hora_fim || null,
                local_evento: formEditEvento.local_evento.trim() || null,
                publica: formEditEvento.publica,
              }
            : e,
        )
        .sort((a, b) => a.data_evento.localeCompare(b.data_evento)),
    );
    setEditandoEventoId(null);
    toast.success("Evento atualizado.");
  };

  const excluirEvento = async (id: string) => {
    await supabase.from("programacao_eventos").delete().eq("id", id);
    setEventos((prev) => prev.filter((e) => e.id !== id));
    setEvParts((prev) => {
      const n = { ...prev };
      delete n[id];
      return n;
    });
    if (eventoExpandido === id) setEventoExpandido(null);
    toast.success("Evento removido.");
  };

  const adicionarParticipante = async (eventoId: string, membroId: string) => {
    if (evParts[eventoId]?.find((p) => p.user_id === membroId)) return;
    const { error } = await supabase.from("programacao_participantes").insert({
      evento_id: eventoId,
      user_id: membroId,
      status: "convidado",
      adicionado_por: user!.id,
    });
    if (error) {
      toast.error("Erro.");
      return;
    }
    const m = membros.find((m) => m.id === membroId);
    setEvParts((prev) => ({
      ...prev,
      [eventoId]: [
        ...(prev[eventoId] || []),
        { evento_id: eventoId, user_id: membroId, status: "convidado", nome: m?.nome },
      ],
    }));
    toast.success("Participante adicionado.");
  };

  const removerParticipante = async (eventoId: string, userId: string) => {
    await supabase
      .from("programacao_participantes")
      .delete()
      .eq("evento_id", eventoId)
      .eq("user_id", userId);
    setEvParts((prev) => ({
      ...prev,
      [eventoId]: prev[eventoId]?.filter((p) => p.user_id !== userId) || [],
    }));
  };

  const confirmarPresenca = async (eventoId: string, status: "confirmado" | "recusou") => {
    const { error } = await supabase
      .from("programacao_participantes")
      .update({ status })
      .eq("evento_id", eventoId)
      .eq("user_id", user!.id);
    if (error) {
      toast.error("Erro.");
      return;
    }
    setEvParts((prev) => ({
      ...prev,
      [eventoId]: prev[eventoId]?.map((p) => (p.user_id === user!.id ? { ...p, status } : p)) || [],
    }));
    toast.success(status === "confirmado" ? "Presenca confirmada!" : "Participacao recusada.");
  };

  /* ═══════════════════════════════════════════════
     ACTIONS — MURAL DE ESCALAS (CRUD)
  ═══════════════════════════════════════════════ */

  const parseEscalaDate = (dia: string, mesAno: string): Date | null => {
    const parts = mesAno.trim().split(/\s+/);
    if (parts.length < 2) return null;
    const mesStr = parts[0].toLowerCase();
    const ano = parseInt(parts[1]);
    const meses: Record<string, number> = {
      janeiro: 0,
      fevereiro: 1,
      março: 2,
      abril: 3,
      maio: 4,
      junho: 5,
      julho: 6,
      agosto: 7,
      setembro: 8,
      outubro: 9,
      novembro: 10,
      dezembro: 11,
    };
    const mes = meses[mesStr];
    if (mes === undefined || isNaN(ano)) return null;
    const diaNum = parseInt(dia);
    if (isNaN(diaNum)) return null;
    return new Date(ano, mes, diaNum, 23, 59, 59);
  };

  const isEscalaVencida = (dia: string, mesAno: string): boolean => {
    const dataEvento = parseEscalaDate(dia, mesAno);
    if (!dataEvento) return false;
    return dataEvento < new Date();
  };

  const getEscalaItems = () => {
    const list = (pagina?.horarios ?? []) as unknown as MuralItem[];
    const dbItems = list.filter((h) => h.tipo === "escala");

    if (dbItems.length > 0) {
      return dbItems.filter((h) => {
        const vencida = isEscalaVencida(h.dia, h.mes_ano);
        const arquivada = h.arquivado || vencida;
        return mostrarMuralArquivado ? arquivada : !arquivada;
      });
    }

    if (sigla === "GECAL") {
      return DEFAULT_GECAL_ESCALAS.filter((h) => {
        const vencida = isEscalaVencida(h.dia, h.mes_ano);
        const arquivada = h.arquivado || vencida;
        return mostrarMuralArquivado ? arquivada : !arquivada;
      });
    }

    return [];
  };

  const salvarMuralItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMural.dia || !formMural.tema.trim()) {
      toast.error("Preencha o dia e o tema.");
      return;
    }

    const currentList = (pagina!.horarios ?? []) as unknown as MuralItem[];
    let updated: MuralItem[];

    if (editandoMuralId) {
      updated = currentList.map((item) =>
        item.id === editandoMuralId ? { ...item, ...formMural } : item,
      );
    } else {
      const newItem = {
        id: "escala-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
        tipo: "escala",
        ...formMural,
      };

      const dbEscalas = currentList.filter((h) => h.tipo === "escala");
      if (dbEscalas.length === 0 && sigla === "GECAL") {
        const nonEscalas = currentList.filter((h) => h.tipo !== "escala");
        updated = [...nonEscalas, ...DEFAULT_GECAL_ESCALAS, newItem];
      } else {
        updated = [...currentList, newItem];
      }
    }

    const { error } = await supabase
      .from("paginas_casas")
      .update({ horarios: updated as unknown as Json })
      .eq("sigla_casa", sigla);
    if (error) {
      toast.error("Erro ao salvar escala.");
      return;
    }

    setPagina((prev) => (prev ? { ...prev, horarios: updated } : prev));
    setFormMural({
      dia: "",
      mes_ano: "Junho 2026",
      dia_semana: "Sexta-feira",
      tema: "",
      facilitador: "",
      casa: "",
      coordenador: "",
      passe: "",
      streamyard: "",
      recepcao: "",
    });
    setShowNovoMural(false);
    setEditandoMuralId(null);
    toast.success(editandoMuralId ? "Escala editada." : "Escala adicionada.");
  };

  const alterarFuncaoMembro = async (membroId: string, novoCargo: string) => {
    try {
      const { data: currentProfile, error: getError } = await supabase
        .from("profiles")
        .select("cargo_principal, atividades")
        .eq("id", membroId)
        .single();
      if (getError) throw getError;

      const currentAtividades = currentProfile?.atividades || [];
      const novasAtividades = currentAtividades.includes("cargo_definido_por_admin")
        ? currentAtividades
        : [...currentAtividades, "cargo_definido_por_admin"];

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          cargo_principal: novoCargo,
          atividades: novasAtividades,
          updated_at: new Date().toISOString(),
        })
        .eq("id", membroId);

      if (updateError) throw updateError;

      toast.success("Função do tarefeiro atualizada com sucesso!");
      await garantirMembros(true);
    } catch (err: unknown) {
      console.error("Erro ao alterar função:", err);
      toast.error("Não foi possível atualizar a função do tarefeiro.");
    }
  };

  const removerMuralItem = async (itemId: string) => {
    if (!window.confirm("Deseja realmente remover este item do mural?")) return;

    const currentList = (pagina!.horarios ?? []) as unknown as MuralItem[];
    let updated: MuralItem[];

    const dbEscalas = currentList.filter((h) => h.tipo === "escala");
    if (dbEscalas.length === 0 && sigla === "GECAL") {
      const nonEscalas = currentList.filter((h) => h.tipo !== "escala");
      updated = [...nonEscalas, ...DEFAULT_GECAL_ESCALAS.filter((item) => item.id !== itemId)];
    } else {
      updated = currentList.filter((item) => item.id !== itemId);
    }

    const { error } = await supabase
      .from("paginas_casas")
      .update({ horarios: updated as unknown as Json })
      .eq("sigla_casa", sigla);
    if (error) {
      toast.error("Erro ao excluir.");
      return;
    }

    setPagina((prev) => (prev ? { ...prev, horarios: updated } : prev));
    toast.success("Escala removida.");
  };

  const iniciarEdicaoMuralItem = (item: MuralItem) => {
    setEditandoMuralId(item.id);
    setFormMural({
      dia: item.dia,
      mes_ano: item.mes_ano,
      dia_semana: item.dia_semana,
      tema: item.tema,
      facilitador: item.facilitador,
      casa: item.casa,
      coordenador: item.coordenador,
      passe: Array.isArray(item.passe) ? item.passe.join(" · ") : item.passe,
      streamyard: Array.isArray(item.streamyard) ? item.streamyard.join(" e ") : item.streamyard,
      recepcao: item.recepcao,
    });
    setShowNovoMural(true);
    // Rola de forma suave para o formulário
    const element = document.getElementById("escala-form-anchor");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo({ top: 400, behavior: "smooth" });
    }
  };

  /* ═══════════════════════════════════════════════
     ACTIONS — DOAÇÕES
  ═══════════════════════════════════════════════ */

  const salvarDoacoes = async () => {
    setSalvando(true);
    const { error } = await supabase
      .from("paginas_casas")
      .update({ ...formDoacoes })
      .eq("sigla_casa", sigla);
    setSalvando(false);
    if (error) {
      toast.error("Erro ao salvar.");
      return;
    }
    setPagina((prev) => (prev ? { ...prev, ...formDoacoes } : prev));
    setEditDoacoes(false);
    toast.success("Doações atualizadas.");
  };

  /* ═══════════════════════════════════════════════
     ACTIONS — ADMINS
  ═══════════════════════════════════════════════ */

  const adicionarAdmin = async (membroId: string) => {
    if (adminIds.includes(membroId)) return;
    const { error } = await supabase
      .from("administradores_pagina")
      .insert({ sigla_casa: sigla, user_id: membroId, adicionado_por: user!.id });
    if (error) {
      toast.error("Erro.");
      return;
    }
    setAdminIds((prev) => [...prev, membroId]);
    toast.success("Administrador adicionado.");
  };

  const removerAdmin = async (membroId: string) => {
    await supabase
      .from("administradores_pagina")
      .delete()
      .eq("sigla_casa", sigla)
      .eq("user_id", membroId);
    setAdminIds((prev) => prev.filter((id) => id !== membroId));
    toast.success("Administrador removido.");
  };

  const alternarPublicacao = async () => {
    if (!pagina) return;
    const novo = !pagina.publicada;
    const nl = String.fromCharCode(10);
    // Nomeia o que falta em vez de dar conselho generico: quem publica precisa
    // saber exatamente o que o visitante NAO vai encontrar. Continua podendo
    // publicar assim mesmo — a decisao e da casa.
    const faltando = novo ? pendenciasDaPagina(pagina) : [];
    if (
      novo &&
      !window.confirm(
        [
          "Tornar esta página pública?",
          "",
          ...(faltando.length
            ? [
                `Ainda faltam ${faltando.length} ${faltando.length === 1 ? "item" : "itens"} que o visitante procura:`,
                ...faltando.map((i) => `  • ${i.rotulo}`),
                "",
                "Publicando agora, a página aparece praticamente vazia para quem chegar.",
                "",
              ]
            : []),
          "Passam a ficar visíveis a qualquer pessoa: nome, descrição, missão, endereço, contatos e os horários das atividades.",
          "",
          "Continuam privados: mural, tarefeiros, agenda, projetos, tesouraria e a chave PIX.",
          "",
          "Você pode desfazer isso quando quiser.",
        ].join(nl),
      )
    )
      return;

    setSalvandoPublicacao(true);
    const { error } = await supabase
      .from("paginas_casas")
      .update({ publicada: novo })
      .eq("sigla_casa", sigla);
    setSalvandoPublicacao(false);

    if (error) {
      toast.error(mensagemDeErro(error, "Não foi possível alterar a publicação."));
      return;
    }
    setPagina((prev) => (prev ? { ...prev, publicada: novo } : prev));
    toast.success(
      novo
        ? "Página publicada. Qualquer pessoa já pode encontrá-la."
        : "Página despublicada. Voltou a exigir login.",
    );
  };

  const copiarPix = () => {
    navigator.clipboard.writeText(pagina!.chave_pix);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  /* ── Early returns ── */
  if (loading) return null;

  // Sem sessao e sem pagina publicada, nao ha o que mostrar a um visitante.
  if (!user && !carregando && !paginaPublica) {
    return (
      <main className="page-light min-h-screen px-6 flex items-center justify-center">
        <div className="text-center max-w-sm space-y-4">
          <Building2 size={32} strokeWidth={1.5} className="text-muted-foreground/40 mx-auto" />
          <p className="text-sm text-muted-foreground font-light leading-relaxed">
            Esta casa ainda não publicou sua página. Se você faz parte dela, entre para acessar a
            área dos membros.
          </p>
          <Link
            to="/login"
            className="inline-block text-sm text-cyan-glow hover:text-foreground transition-colors"
          >
            Entrar →
          </Link>
        </div>
      </main>
    );
  }
  if (carregando)
    return (
      <main className="page-light min-h-screen pt-20 pb-20 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </main>
    );

  /* ── Page not created ── */
  if (!pagina) {
    const podeInicializar =
      profile?.cargo_principal === "DEV" ||
      (profile?.sigla_casa === sigla &&
        (profile.cargo_principal === "Presidente" ||
          profile.cargo_principal === "Vice-presidente"));
    return (
      <main className="page-light min-h-screen pt-20 pb-20 flex items-center justify-center px-4">
        <div className="glass rounded-3xl p-10 max-w-md text-center space-y-5">
          <Building2 size={40} strokeWidth={1} className="text-muted-foreground/30 mx-auto" />
          <div>
            <h1 className="text-lg font-medium text-foreground">{sigla}</h1>
            <p className="text-sm text-muted-foreground/70 font-light mt-1">
              Esta casa espírita ainda não tem uma página criada.
            </p>
          </div>
          {podeInicializar ? (
            <button
              onClick={async () => {
                const { error } = await supabase.from("paginas_casas").insert({
                  sigla_casa: sigla,
                  nome_completo: "",
                  descricao: "",
                  missao: "",
                  endereco: "",
                  bairro: profile?.bairro ?? "",
                  cidade: profile?.cidade ?? "",
                  uf: profile?.uf ?? "",
                  cep: "",
                  telefone: "",
                  email_contato: "",
                  site: "",
                  horarios: [],
                  chave_pix: "",
                  texto_doacao:
                    "Sua contribuição ajuda a manter os trabalhos espíritas. Qualquer valor é bem-vindo. Gratidão.",
                  // Nasce privada: nenhuma casa e exposta sem alguem da direcao decidir.
                  publicada: false,
                });
                if (!error) carregar();
                else toast.error("Erro ao criar página.");
              }}
              className="w-full py-3 rounded-xl text-sm uppercase tracking-widest text-cyan-glow border border-cyan-glow/40 hover:bg-cyan-glow/10 transition-colors"
            >
              Criar página desta casa
            </button>
          ) : (
            <p className="text-xs text-muted-foreground/50">
              Somente o Presidente pode criar a página.
            </p>
          )}
          <Link
            to="/inicio"
            className="block text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors"
          >
            ← Voltar ao início
          </Link>
        </div>
      </main>
    );
  }

  /* ── Filter visible events ── */
  const hoje = startOfDay(new Date());
  const eventosVisiveis = eventos.filter(
    (e) => e.publica || isSameCasa || isAdmin || evParts[e.id]?.some((p) => p.user_id === user?.id),
  );
  const eventosProximos = eventosVisiveis.filter((e) => !isAfter(hoje, parseISO(e.data_evento)));
  const eventosPassados = eventosVisiveis.filter((e) => isAfter(hoje, parseISO(e.data_evento)));

  const totalEventosCount =
    (eventosCount || 0) + (agendaEventos?.length || 0) + (getEscalaItems()?.length || 0);

  /* ══════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════ */
  return (
    <main className="page-light min-h-screen pt-14 pb-20">
      {/* Premium Hero with espectacular destaque for the name */}
      {/* A contagem de membros vem de `profiles`, que a RLS fecha para quem
          nao esta logado: o visitante receberia sempre zero. Anunciar "0
          membros ativos" na vitrine da casa e pior do que nao contar nada,
          entao as estatisticas ficam so para quem faz parte. */}
      <CasaHero
        membros={visitantePublico ? undefined : membrosCount}
        eventos={visitantePublico ? undefined : totalEventosCount}
        publico={visitantePublico}
        sigla={sigla}
        nome={pagina.nome_completo || sigla}
        cidade={pagina.cidade}
        uf={pagina.uf}
        paginaData={pagina}
      />

      <div className="mx-auto max-w-4xl px-4">
        {visitantePublico && (
          <ComoChegar
            endereco={pagina.endereco}
            bairro={pagina.bairro}
            cidade={pagina.cidade}
            uf={pagina.uf}
            telefone={pagina.telefone}
            email={pagina.email_contato}
            site={pagina.site}
          />
        )}

        {/* Option to toggle administration mode */}
        {isAdmin && (
          <div className="flex justify-end mb-4 pt-4">
            <button
              onClick={() => setModoAdmin((m) => !m)}
              className={`flex items-center gap-2 text-xs uppercase tracking-widest px-4 py-2 rounded-xl border transition-colors ${
                modoAdmin
                  ? "border-amber-400/60 text-amber-600 bg-amber-50"
                  : "border-white/20 text-muted-foreground/60 hover:border-cyan-glow/40 hover:text-cyan-glow"
              }`}
            >
              <Shield size={13} />
              {modoAdmin ? "Visitante" : "Administrar"}
            </button>
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="flex gap-0.5 border-b border-white/10 mb-6 overflow-x-auto">
          {(
            [
              // Visitante publico ve so o que a casa quis divulgar. Mural,
              // tesouraria e tarefeiros sao internos e nem aparecem como aba —
              // alem de estarem fechados pela RLS no banco.
              ...(isSameCasa && !visitantePublico
                ? [{ id: "painel", label: "Painel", Icon: LayoutDashboard }]
                : []),
              ...(visitantePublico ? [] : [{ id: "mural", label: "Mural", Icon: MessageSquare }]),
              { id: "sobre", label: "Atividades", Icon: Info },
              ...(visitantePublico
                ? []
                : [{ id: "tesouraria", label: "Tesouraria", Icon: Wallet }]),
              { id: "doacoes", label: "Doações", Icon: Heart },
              ...(visitantePublico ? [] : [{ id: "tarefeiros", label: "Tarefeiros", Icon: Users }]),
              ...(modoAdmin ? [{ id: "configuracoes", label: "Configurações", Icon: Wrench }] : []),
            ] as { id: Aba; label: string; Icon: LucideIcon }[]
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setAba(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-light whitespace-nowrap border-b-2 transition-colors ${
                aba === t.id
                  ? "border-cyan-glow text-cyan-glow"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.Icon size={13} strokeWidth={1.8} />
              {t.label}
            </button>
          ))}
        </div>

        {/* ══════════════ PAINEL ══════════════ */}
        {aba === "painel" && isSameCasa && (
          <div className="space-y-8 animate-fade-in-up" style={{ animationDuration: "400ms" }}>
            {/* Boas-vindas */}
            <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-violet-600 mb-1 font-semibold">
                  {new Date().getHours() < 12
                    ? "Bom dia"
                    : new Date().getHours() < 18
                      ? "Boa tarde"
                      : "Boa noite"}
                  , irmão
                </p>
                <h2 className="text-3xl font-light tracking-tight text-foreground">
                  Olá,{" "}
                  <span className="font-medium text-gradient-aurora">
                    {profile?.nome?.split(" ")[0]}
                  </span>
                </h2>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest bg-violet-50 text-violet-700 border border-violet-100/50">
                  Casa Espírita {profile?.sigla_casa}
                </span>
                {profile?.cargo_principal && (
                  <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest bg-gray-100 text-gray-600 border border-gray-200/50">
                    {profile?.cargo_principal}
                  </span>
                )}
              </div>
            </div>

            {/* Mensagem do Dia — bloco compacto, altura previsível */}
            <div
              className="relative rounded-2xl overflow-hidden border border-violet-200/50 shadow-sm"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.985 0.01 295) 0%, oklch(0.97 0.01 260) 100%)",
              }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-300/5 to-cyan-300/5 blur-2xl pointer-events-none" />

              <div className="relative px-5 py-3.5 md:px-7 md:py-4 flex items-start gap-3.5">
                <div className="shrink-0 w-9 h-9 rounded-xl bg-violet-100 border border-violet-200/50 flex items-center justify-center shadow-inner">
                  <Star size={16} strokeWidth={1.5} className="text-violet-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-violet-600 font-semibold">
                      Mensagem do Dia
                    </p>
                    {todayMsg?.sigla_casa && (
                      <span className="text-[9px] font-bold uppercase tracking-widest text-violet-500/80 bg-violet-50 border border-violet-100/30 px-2 py-0.5 rounded-full">
                        {todayMsg.sigla_casa}
                      </span>
                    )}
                    <span className="ml-auto flex items-center gap-3">
                      <Link
                        to="/mensagem-do-dia"
                        search={{ tab: "enviar" }}
                        className="text-[10px] font-bold text-violet-700 hover:text-violet-900 transition-colors uppercase tracking-widest"
                      >
                        Enviar
                      </Link>
                      <Link
                        to="/mensagem-do-dia"
                        search={{ tab: "fila" }}
                        className="text-[10px] font-semibold text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-widest"
                      >
                        Ver fila
                      </Link>
                    </span>
                  </div>
                  <blockquote
                    className={`text-sm md:text-base font-serif font-light text-gray-800 leading-relaxed italic pr-2 ${
                      msgExpandida ? "" : "line-clamp-2"
                    }`}
                  >
                    &ldquo;{mensagemDoDia.texto}&rdquo;
                  </blockquote>
                  <div className="flex items-center gap-2 flex-wrap mt-1">
                    <span className="text-xs font-semibold text-violet-700">
                      {mensagemDoDia.autor}
                    </span>
                    {mensagemDoDia.referencia && (
                      <span className="text-xs text-gray-400 font-light italic">
                        — {mensagemDoDia.referencia}
                      </span>
                    )}
                    {mensagemLonga && (
                      <button
                        type="button"
                        onClick={() => setMsgExpandida((v) => !v)}
                        className="ml-auto text-[10px] font-bold uppercase tracking-widest text-violet-700 hover:text-violet-900 transition-colors"
                      >
                        {msgExpandida ? "Recolher" : "Ler tudo"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Mural de Palestras Dinâmico */}
            {(() => {
              const list = (pagina?.horarios ?? []) as unknown as MuralItem[];
              const dbItems = list.filter((h) => h.tipo === "escala");
              const totalMuralItemsCount =
                dbItems.length > 0
                  ? dbItems.length
                  : sigla === "GECAL"
                    ? DEFAULT_GECAL_ESCALAS.length
                    : 0;

              if (sigla !== "GECAL" && totalMuralItemsCount === 0) return null;

              return (
                <section
                  className="glass rounded-3xl border border-violet-100/50 shadow-md p-6 md:p-8 space-y-6 bg-white/80 animate-fade-in-up"
                  style={{ animationDuration: "500ms" }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-violet-100/40 pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
                        <Megaphone className="w-5 h-5 text-violet-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 leading-tight">
                          Programação Pública
                        </h3>
                        <p className="text-xs text-gray-500 font-light mt-0.5 font-sans">
                          Palestras Públicas &amp; Escalas de Trabalho
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Toggle para visualizar escalas arquivadas */}
                      <button
                        type="button"
                        onClick={() => setMostrarMuralArquivado((prev) => !prev)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                          mostrarMuralArquivado
                            ? "bg-amber-600 border-amber-600 text-white shadow-sm hover:bg-amber-700"
                            : "bg-slate-100 border-gray-200 text-gray-500 hover:bg-gray-200"
                        }`}
                      >
                        {mostrarMuralArquivado ? "Ver Ativas" : "Ver Arquivadas"}
                      </button>

                      {modoAdmin && !showNovoMural && (
                        <button
                          onClick={() => {
                            setEditandoMuralId(null);
                            setFormMural({
                              dia: "",
                              mes_ano: "Junho 2026",
                              dia_semana: "Sexta-feira",
                              tema: "",
                              facilitador: "",
                              casa: "",
                              coordenador: "",
                              passe: "",
                              streamyard: "",
                              recepcao: "",
                            });
                            setShowNovoMural(true);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-violet-200 text-violet-600 bg-violet-50 text-[10px] font-bold hover:bg-violet-100 transition-colors uppercase tracking-wider"
                        >
                          <Plus size={12} strokeWidth={2.5} /> Adicionar Item
                        </button>
                      )}
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-violet-100 text-violet-700">
                        Palestras &amp; Passes
                      </span>
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700">
                        Presencial &amp; Online
                      </span>
                    </div>
                  </div>

                  {/* Formulário de Escala / Mural */}
                  {modoAdmin && showNovoMural && (
                    <form
                      onSubmit={salvarMuralItem}
                      id="escala-form-anchor"
                      className="glass rounded-2xl p-5 border border-amber-300 bg-amber-50/10 space-y-4"
                    >
                      <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-amber-500" />
                        {editandoMuralId ? "Editar Item do Mural" : "Adicionar Item ao Mural"}
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">
                            Dia (Número)
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: 05"
                            value={formMural.dia}
                            required
                            onChange={(e) =>
                              setFormMural((f) => ({
                                ...f,
                                dia: e.target.value.replace(/\D/g, ""),
                              }))
                            }
                            className="w-full rounded-xl bg-white border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:border-cyan-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">
                            Dia da Semana
                          </label>
                          <select
                            value={formMural.dia_semana}
                            onChange={(e) =>
                              setFormMural((f) => ({ ...f, dia_semana: e.target.value }))
                            }
                            className="w-full rounded-xl bg-white border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:border-cyan-500"
                          >
                            <option>Sexta-feira</option>
                            <option>Domingo</option>
                            <option>Segunda-feira</option>
                            <option>Terça-feira</option>
                            <option>Quarta-feira</option>
                            <option>Quinta-feira</option>
                            <option>Sábado</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">
                            Mês / Ano
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: Junho 2026"
                            value={formMural.mes_ano}
                            required
                            onChange={(e) =>
                              setFormMural((f) => ({ ...f, mes_ano: e.target.value }))
                            }
                            className="w-full rounded-xl bg-white border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:border-cyan-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">
                            Coordenador
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: BELO"
                            value={formMural.coordenador}
                            onChange={(e) =>
                              setFormMural((f) => ({
                                ...f,
                                coordenador: e.target.value.toUpperCase(),
                              }))
                            }
                            className="w-full rounded-xl bg-white border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:border-cyan-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">
                            Tema da Palestra
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: Exemplificar o bem..."
                            value={formMural.tema}
                            required
                            onChange={(e) => setFormMural((f) => ({ ...f, tema: e.target.value }))}
                            className="w-full rounded-xl bg-white border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:border-cyan-500"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">
                              Facilitador
                            </label>
                            <input
                              type="text"
                              placeholder="Sandra Helena"
                              value={formMural.facilitador}
                              onChange={(e) =>
                                setFormMural((f) => ({ ...f, facilitador: e.target.value }))
                              }
                              className="w-full rounded-xl bg-white border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:border-cyan-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">
                              Casa / Origem
                            </label>
                            <input
                              type="text"
                              placeholder="GECAL"
                              value={formMural.casa}
                              onChange={(e) =>
                                setFormMural((f) => ({ ...f, casa: e.target.value }))
                              }
                              className="w-full rounded-xl bg-white border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:border-cyan-500"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">
                            Equipe de Passe (separado por · ou /)
                          </label>
                          <input
                            type="text"
                            placeholder="Luana · Jacqueline · Bárbara"
                            value={formMural.passe}
                            onChange={(e) => setFormMural((f) => ({ ...f, passe: e.target.value }))}
                            className="w-full rounded-xl bg-white border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:border-cyan-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">
                            Equipe de Stream (separado por e)
                          </label>
                          <input
                            type="text"
                            placeholder="Bárbara e Igor"
                            value={formMural.streamyard}
                            onChange={(e) =>
                              setFormMural((f) => ({ ...f, streamyard: e.target.value }))
                            }
                            className="w-full rounded-xl bg-white border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:border-cyan-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">
                            Recepção
                          </label>
                          <input
                            type="text"
                            placeholder="Marion"
                            value={formMural.recepcao}
                            onChange={(e) =>
                              setFormMural((f) => ({ ...f, recepcao: e.target.value }))
                            }
                            className="w-full rounded-xl bg-white border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:border-cyan-500"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setShowNovoMural(false);
                            setEditandoMuralId(null);
                          }}
                          className="flex-1 py-2 rounded-xl text-xs text-muted-foreground border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-2 rounded-xl text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                        >
                          Salvar Item
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Listagem do Mural */}
                  {(() => {
                    const escalas = getEscalaItems();
                    if (escalas.length === 0) {
                      return (
                        <div className="text-center py-6 text-sm text-gray-400 font-light font-sans">
                          {mostrarMuralArquivado
                            ? "Nenhuma palestra ou escala arquivada no mural."
                            : "Nenhuma palestra ou escala ativa registrada no mural."}
                        </div>
                      );
                    }

                    const diasSemana = Array.from(new Set(escalas.map((e) => e.dia_semana)));
                    const diaAtivo = escalaDiaAtivo || diasSemana[0] || "Sexta-feira";
                    const items = escalas
                      .filter((e) => e.dia_semana === diaAtivo)
                      .sort((a, b) => parseInt(a.dia) - parseInt(b.dia));

                    return (
                      <div className="space-y-6">
                        {/* Abas dos Dias da Semana */}
                        {diasSemana.length > 1 && (
                          <div className="flex gap-2 border-b border-violet-100/40 pb-2 overflow-x-auto">
                            {diasSemana.map((d) => (
                              <button
                                key={d}
                                type="button"
                                onClick={() => setEscalaDiaAtivo(d)}
                                className={`px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all ${
                                  diaAtivo === d
                                    ? "bg-violet-600 text-white shadow-sm"
                                    : "bg-violet-50 text-violet-600 hover:bg-violet-100"
                                }`}
                              >
                                {d}s
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Lista de Escalas do Dia Ativo */}
                        {items.length === 0 ? (
                          <div className="text-center py-6 text-sm text-gray-400 font-light font-sans">
                            Nenhuma escala registrada para este dia.
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {items.map((item) => (
                              <div
                                key={item.id}
                                className="relative bg-white border border-violet-100/50 rounded-2xl p-5 hover:shadow-md transition-all duration-300 flex flex-col md:flex-row gap-5"
                              >
                                {/* Esquerda: Bloco de Data e Coordenador */}
                                <div className="flex md:flex-col items-center justify-between md:justify-center md:border-r md:border-violet-100/30 pr-0 md:pr-5 md:w-32 shrink-0 gap-3">
                                  <div className="flex items-center md:flex-col gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/60 flex flex-col items-center justify-center shadow-inner">
                                      <span className="text-xl font-bold text-amber-700 leading-none">
                                        {item.dia}
                                      </span>
                                    </div>
                                    <div className="text-left md:text-center">
                                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                                        {item.mes_ano.split(" ")[0]}
                                      </span>
                                      <span className="text-[9px] text-gray-500 font-medium md:block">
                                        {item.dia_semana}
                                      </span>
                                    </div>
                                  </div>

                                  {item.coordenador && (
                                    <div className="text-right md:text-center mt-1">
                                      <span className="text-[8px] uppercase tracking-widest font-bold text-gray-400 block">
                                        Coordenação
                                      </span>
                                      <span className="text-xs font-semibold text-gray-700 block">
                                        {item.coordenador}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* Centro: Palestra (Tema & Facilitador) */}
                                <div className="flex-1 space-y-3">
                                  <div>
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full">
                                      Palestra Pública
                                    </span>
                                    <h5 className="text-base font-serif italic text-gray-800 font-medium leading-relaxed mt-2.5">
                                      "{item.tema}"
                                    </h5>
                                  </div>

                                  <div className="flex items-center gap-2 flex-wrap pt-0.5">
                                    <span className="text-sm font-semibold text-gray-700">
                                      {item.facilitador || "Facilitador a definir"}
                                    </span>
                                    {item.casa && (
                                      <span className="text-[10px] font-bold uppercase tracking-widest text-violet-500 bg-violet-50 border border-violet-100/50 px-2 py-0.5 rounded-full">
                                        {item.casa}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Direita: Escala de Equipes */}
                                <div className="md:w-64 shrink-0 bg-gray-50/50 border border-gray-100 rounded-xl p-3.5 space-y-2.5 text-xs">
                                  <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider border-b border-gray-200/60 pb-1">
                                    Tarefeiros da Escala
                                  </div>

                                  {item.passe && (
                                    <div className="space-y-0.5">
                                      <span className="text-[8px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-100/60 px-1.5 py-0.5 rounded shrink-0 inline-block">
                                        Passe
                                      </span>
                                      <p className="text-gray-600 font-light leading-relaxed pl-0.5">
                                        {item.passe}
                                      </p>
                                    </div>
                                  )}

                                  {item.streamyard && (
                                    <div className="space-y-0.5">
                                      <span className="text-[8px] font-bold uppercase tracking-widest text-blue-700 bg-blue-50 border border-blue-100/60 px-1.5 py-0.5 rounded shrink-0 inline-block">
                                        Transmissão
                                      </span>
                                      <p className="text-gray-600 font-light leading-relaxed pl-0.5">
                                        {item.streamyard}
                                      </p>
                                    </div>
                                  )}

                                  {item.recepcao && (
                                    <div className="space-y-0.5">
                                      <span className="text-[8px] font-bold uppercase tracking-widest text-indigo-700 bg-indigo-50 border border-indigo-100/60 px-1.5 py-0.5 rounded shrink-0 inline-block">
                                        Recepção
                                      </span>
                                      <p className="text-gray-600 font-light leading-relaxed pl-0.5">
                                        {item.recepcao}
                                      </p>
                                    </div>
                                  )}

                                  {!item.passe && !item.streamyard && !item.recepcao && (
                                    <p className="text-[11px] text-gray-400 italic">
                                      Nenhum tarefeiro escalado ainda.
                                    </p>
                                  )}
                                </div>

                                {/* Botões de Ação para Admin */}
                                {modoAdmin && (
                                  <div className="absolute right-3 top-3 flex items-center gap-1 bg-white/95 shadow-sm rounded-xl p-0.5 border border-gray-200">
                                    <button
                                      type="button"
                                      onClick={() => iniciarEdicaoMuralItem(item)}
                                      className="p-1.5 rounded-lg text-cyan-600 hover:bg-cyan-50 transition-colors"
                                      title="Editar"
                                    >
                                      <Edit3 size={13} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => removerMuralItem(item.id)}
                                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                                      title="Excluir"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  <div className="flex justify-between items-center text-[10px] text-gray-400 font-light border-t border-violet-100/30 pt-4">
                    <p className="font-sans">
                      Escala interna de tarefeiros · {pagina.nome_completo || sigla}
                    </p>
                    {sigla === "GECAL" && (
                      <p className="font-semibold text-violet-600">37 Anos a Caminho da Luz</p>
                    )}
                  </div>
                </section>
              );
            })()}

            {/* Próximos Eventos */}
            {agendaEventos.length > 0 && (
              <section className="mt-8">
                <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-amber-200">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                      <CalendarDays size={18} strokeWidth={1.5} className="text-amber-600" />
                    </div>
                    <h3 className="text-sm font-semibold text-amber-700 tracking-wide">
                      Próximos Eventos da Casa
                    </h3>
                  </div>
                  <Link
                    to="/agenda"
                    className="text-xs text-cyan-600 uppercase tracking-widest hover:text-foreground transition-colors font-semibold"
                  >
                    Ver agenda
                  </Link>
                </div>
                <div className="space-y-2">
                  {[
                    ...agendaEventos.filter((e) => {
                      const p = e.agenda_participantes.find((p) => p.user_id === user?.id);
                      return (
                        p?.confirmado === null ||
                        (!p && e.tipo === "aberto" && e.aceita_confirmacao)
                      );
                    }),
                    ...agendaEventos.filter((e) => {
                      const p = e.agenda_participantes.find((p) => p.user_id === user?.id);
                      return p?.confirmado === true;
                    }),
                  ].map((evento) => {
                    const minha = evento.agenda_participantes.find((p) => p.user_id === user?.id);
                    const pendente = minha?.confirmado === null;
                    const confirmado = minha?.confirmado === true;
                    const abertoPendente =
                      evento.tipo === "aberto" && !minha && evento.aceita_confirmacao;
                    return (
                      <div
                        key={evento.id}
                        className={`glass rounded-2xl border px-4 py-3 flex items-center gap-4 transition-all hover-premium ${pendente ? "border-amber-300 bg-amber-50/10" : "border-gray-100"}`}
                      >
                        <div className="shrink-0 w-11 h-11 rounded-xl bg-violet-50 border border-violet-100/70 flex flex-col items-center justify-center">
                          <p className="text-lg font-bold text-violet-700 leading-none">
                            {String(new Date(evento.data_inicio).getDate()).padStart(2, "0")}
                          </p>
                          <p className="text-[9px] font-bold text-violet-400 uppercase tracking-widest">
                            {new Date(evento.data_inicio).toLocaleDateString("pt-BR", {
                              month: "short",
                            })}
                          </p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">
                            {evento.titulo}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
                            <Clock size={10} className="text-gray-400" />
                            <span className="font-light">
                              {new Date(evento.data_inicio).toLocaleTimeString("pt-BR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {pendente && (
                              <span className="text-amber-600 font-semibold animate-pulse">
                                · Aguardando resposta
                              </span>
                            )}
                            {confirmado && (
                              <span className="text-emerald-600 font-medium">· Confirmado</span>
                            )}
                            {abertoPendente && (
                              <span className="text-cyan-600 font-medium">
                                · Confirmar presença
                              </span>
                            )}
                          </p>
                        </div>
                        {(pendente || abertoPendente) && (
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() =>
                                pendente
                                  ? handleResponderConvite(minha!.id, true)
                                  : handleConfirmarEvento(evento.id)
                              }
                              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-emerald-300 text-emerald-600 text-xs font-bold hover:bg-emerald-50 transition-colors shadow-sm bg-white"
                            >
                              <Check size={12} strokeWidth={2.5} /> Confirmar
                            </button>
                            {pendente && (
                              <button
                                onClick={() => handleResponderConvite(minha!.id, false)}
                                className="flex items-center justify-center w-8 h-8 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors shadow-sm bg-white"
                              >
                                <X size={14} strokeWidth={2.5} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Gestão */}
            <section className="mt-8">
              <DashSectionHeader
                Icon={LayoutDashboard}
                label="Gestão"
                color="text-slate-700"
                iconColor="text-slate-500"
                bg="bg-slate-50"
                border="border-slate-200"
                borderB="border-slate-200"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                <DashDashCard
                  Icon={ClipboardList}
                  title="Acompanhamento do Projeto"
                  desc="Veja o progresso da plataforma, as novidades recentes e solicite novos recursos ao desenvolvedor."
                  status="disponivel"
                  accent="slate"
                  href="/painel"
                  votes={votes}
                  votingKey={votingKey}
                  onVote={toggleVoteByTitle}
                />
                <DashDashCard
                  Icon={Wallet}
                  title="Tesouraria"
                  desc="Registro de receitas e despesas, saldo mensal, exportação em Excel (.xlsx) e impressão formatada."
                  status="disponivel"
                  accent="amber"
                  onClick={() => setAba("tesouraria")}
                  votes={votes}
                  votingKey={votingKey}
                  onVote={toggleVoteByTitle}
                />
                <DashDashCard
                  Icon={CircleHelp}
                  title="Ajuda com o Site"
                  desc="Tire dúvidas sobre como usar o site, busque uma casa espírita ou encontre apoio pessoal."
                  status="disponivel"
                  accent="cyan"
                  href="/ajuda"
                  votes={votes}
                  votingKey={votingKey}
                  onVote={toggleVoteByTitle}
                />
              </div>
            </section>

            {/* Grade de Funcionalidades */}
            {DASH_FEATURES.map((cat) => (
              <section key={cat.label} className="mt-8">
                <DashSectionHeader
                  Icon={cat.SectionIcon}
                  label={cat.label}
                  color={cat.color}
                  iconColor={cat.iconColor}
                  bg={cat.bg}
                  border={cat.border}
                  borderB={cat.borderB}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {cat.items.map((item) => (
                    <DashFeatureCard
                      key={item.title}
                      item={item}
                      cat={cat}
                      onAbrirAba={setAba}
                      votes={votes}
                      votingKey={votingKey}
                      onVote={toggleVoteByTitle}
                    />
                  ))}
                </div>
              </section>
            ))}

            {/* Bazar */}
            <section id="bazar" className="mt-8">
              <DashSectionHeader
                Icon={ShoppingBag}
                label="Bazar On-line"
                color="text-cyan-700"
                iconColor="text-cyan-700"
                bg="bg-cyan-50"
                border="border-cyan-200"
                borderB="border-cyan-200"
              >
                <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  Em breve
                </span>
              </DashSectionHeader>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {DASH_BAZAR.map((item) => (
                  <DashBazarCard key={item.name} item={item} />
                ))}
              </div>
              <p className="mt-3 text-xs text-center text-muted-foreground/50">
                Demonstração de como o bazar vai funcionar · Os itens e os preços são fictícios e
                nenhuma compra é feita por aqui
              </p>
            </section>
          </div>
        )}

        {/* ══════════════ MURAL ══════════════ */}
        {aba === "mural" && (
          <div className="space-y-4">
            {/* Criar post (admin) */}
            {modoAdmin && (
              <div className="glass rounded-2xl p-5">
                {!showNovoPost ? (
                  <button
                    onClick={() => setShowNovoPost(true)}
                    className="flex items-center gap-2 text-sm text-muted-foreground/60 hover:text-cyan-glow transition-colors"
                  >
                    <Plus size={15} />
                    Nova publicação no mural
                  </button>
                ) : (
                  <PostForm
                    form={formNovoPost}
                    onChange={setFormNovoPost}
                    onCancel={() => {
                      setShowNovoPost(false);
                      setFormNovoPost(FORM_POST_INICIAL);
                    }}
                    onSubmit={publicarPost}
                    submitLabel="Publicar"
                  />
                )}
              </div>
            )}

            {/* Lista de posts */}
            {posts.length === 0 ? (
              <div className="glass rounded-2xl p-10 text-center">
                <MessageSquare
                  size={32}
                  strokeWidth={1}
                  className="text-muted-foreground/20 mx-auto mb-3"
                />
                <p className="text-sm text-muted-foreground/50">
                  Nenhuma publicação no mural ainda.
                </p>
              </div>
            ) : (
              posts.map((post) => (
                <article
                  key={post.id}
                  className={`glass rounded-2xl overflow-hidden ${post.fixado ? "border border-amber-200/50" : ""}`}
                >
                  {editandoPostId === post.id ? (
                    /* ── Editar post ── */
                    <div className="p-5">
                      <PostForm
                        form={formEditPost}
                        onChange={setFormEditPost}
                        onCancel={() => setEditandoPostId(null)}
                        onSubmit={() => salvarEdicaoPost(post.id)}
                        submitLabel="Salvar edição"
                      />
                    </div>
                  ) : (
                    /* ── Exibir post ── */
                    <div className="p-5 space-y-3">
                      {post.fixado && (
                        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-amber-500">
                          <Pin size={11} />
                          Fixado
                        </div>
                      )}
                      <p className="text-sm text-foreground font-light leading-relaxed whitespace-pre-wrap">
                        {post.conteudo}
                      </p>

                      {/* Imagem */}
                      {post.imagem_url && (
                        <img
                          src={post.imagem_url}
                          alt=""
                          className="w-full rounded-xl max-h-96 object-cover border border-white/10"
                          onError={(e) => (e.currentTarget.style.display = "none")}
                        />
                      )}

                      {/* Vídeo embed */}
                      {post.video_url && videoEmbed(post.video_url) && (
                        <div className="rounded-xl overflow-hidden aspect-video bg-black/10">
                          <iframe
                            src={videoEmbed(post.video_url)!}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between gap-3 pt-1 border-t border-white/5">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground/50 flex-wrap">
                          <span>{post.autor_nome}</span>
                          <span>·</span>
                          <span>
                            {format(new Date(post.created_at), "d 'de' MMM 'de' yyyy", {
                              locale: ptBR,
                            })}
                          </span>
                          {post.editado_em && <span className="italic">· editado</span>}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {/* Editar/Excluir: autor OU admin */}
                          {(modoAdmin || post.autor_id === user?.id) && (
                            <>
                              <button
                                onClick={() => iniciarEdicaoPost(post)}
                                title="Editar"
                                className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-cyan-glow hover:bg-cyan-50 transition-colors"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                onClick={() => excluirPost(post.id)}
                                title="Excluir"
                                className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-red-500 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                          {modoAdmin && (
                            <button
                              onClick={() => toggleFixar(post)}
                              title={post.fixado ? "Desafixar" : "Fixar no topo"}
                              className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-amber-500 hover:bg-amber-50 transition-colors"
                            >
                              {post.fixado ? <PinOff size={14} /> : <Pin size={14} />}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              ))
            )}
          </div>
        )}

        {/* ══════════════ ATIVIDADES ══════════════ */}
        {aba === "sobre" && (
          <div className="space-y-4">
            <div className="space-y-4">
              {/* ── Atividades Regulares ── */}
              <div className="glass rounded-2xl overflow-hidden mt-6">
                <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock size={15} strokeWidth={1.5} className="text-cyan-glow" />
                    <span className="text-sm font-medium text-foreground">
                      Atividades Regulares
                    </span>
                  </div>
                  {modoAdmin && (
                    <button
                      onClick={() => setShowNovoHorario((s) => !s)}
                      className="flex items-center gap-1.5 text-xs text-cyan-glow hover:underline"
                    >
                      <Plus size={13} />
                      Adicionar
                    </button>
                  )}
                </div>

                {modoAdmin && showNovoHorario && (
                  <div className="px-6 py-4 border-b border-white/10 bg-cyan-50/20 space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <p className={labelCls}>Dia</p>
                        <select
                          value={novoHorario.dia}
                          onChange={(e) => setNovoHorario((h) => ({ ...h, dia: e.target.value }))}
                          className={inputCls}
                        >
                          {DIAS.map((d) => (
                            <option key={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <p className={labelCls}>Horário</p>
                        <input
                          type="time"
                          value={novoHorario.hora}
                          onChange={(e) => setNovoHorario((h) => ({ ...h, hora: e.target.value }))}
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <p className={labelCls}>Atividade</p>
                        <input
                          value={novoHorario.atividade}
                          onChange={(e) =>
                            setNovoHorario((h) => ({ ...h, atividade: e.target.value }))
                          }
                          placeholder="Ex.: Evangelização"
                          className={inputCls}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowNovoHorario(false)}
                        className="flex-1 py-2 rounded-xl text-xs text-muted-foreground border border-white/10 hover:bg-white/5 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={adicionarHorario}
                        className="flex-1 py-2 rounded-xl text-xs uppercase tracking-widest text-cyan-glow border border-cyan-glow/40 hover:bg-cyan-glow/10 transition-colors"
                      >
                        Adicionar
                      </button>
                    </div>
                  </div>
                )}

                {(() => {
                  const horariosRegulares = (pagina.horarios ?? []).filter(
                    (h): h is HorarioItem => !("tipo" in h) || h.tipo !== "escala",
                  );
                  if (horariosRegulares.length === 0) {
                    return (
                      <div className="px-6 py-8 text-center">
                        <p className="text-sm text-muted-foreground/50">
                          Nenhuma atividade regular cadastrada.
                        </p>
                      </div>
                    );
                  }
                  return (
                    <div className="divide-y divide-white/5">
                      {horariosRegulares.map((h, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between px-6 py-3 hover:bg-white/5 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <span className="text-xs font-medium text-cyan-glow w-14 sm:w-24 shrink-0">
                              {h.dia.slice(0, 3)}.
                            </span>
                            <span className="text-xs font-mono text-muted-foreground/70 w-12 shrink-0">
                              {h.hora}
                            </span>
                            <span className="text-sm text-foreground/80 font-light">
                              {h.atividade}
                            </span>
                          </div>
                          {modoAdmin && (
                            <button
                              onClick={() => removerHorario(h)}
                              className="p-1.5 rounded-lg text-muted-foreground/30 hover:text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <X size={13} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ TESOURARIA ══════════════ */}
        {aba === "tesouraria" && <TesourariaTab sigla={sigla} />}

        {/* ══════════════ DOAÇÕES ══════════════ */}
        {aba === "doacoes" && (
          <div className="space-y-4">
            <div className="glass rounded-2xl p-8 space-y-6">
              <div className="text-center space-y-2">
                <Heart size={22} strokeWidth={1.5} className="text-rose-400 mx-auto" />
                <h2 className="text-base font-medium text-foreground">
                  Contribua com nossa missão
                </h2>
                <p className="text-sm text-muted-foreground/70 font-light leading-relaxed max-w-sm mx-auto">
                  {pagina.texto_doacao || "Sua contribuição ajuda a manter os trabalhos espíritas."}
                </p>
              </div>
              {/* A chave PIX NUNCA vai para o publico: exposta, permite que um
                  golpista copie a pagina e troque a chave pela dele. Visitante
                  ve o convite a doar e o contato da casa; a chave so aparece a
                  quem esta logado. */}
              {visitantePublico ? (
                <div className="text-center space-y-3">
                  {/* A instrucao anterior mandava procurar o contato na aba
                      "Atividades", que so tem horarios. Os contatos estao no
                      bloco "Como chegar e falar", no topo desta pagina. */}
                  <p className="text-sm text-muted-foreground/70 font-light leading-relaxed max-w-sm mx-auto">
                    Para contribuir, fale diretamente com a casa pelo telefone ou e-mail em
                    &ldquo;Como chegar e falar&rdquo;, no topo desta página.
                  </p>
                  <p className="text-xs text-muted-foreground/50 font-light">
                    Por segurança, a chave PIX não é exibida publicamente — assim ninguém pode
                    copiar esta página e trocar a chave pela própria.
                  </p>
                </div>
              ) : pagina.chave_pix ? (
                <>
                  <div className="flex justify-center">
                    <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pagina.chave_pix)}&bgcolor=ffffff&color=1e3a5f&margin=4`}
                        alt="QR Code PIX"
                        width={200}
                        height={200}
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className={labelCls}>Chave PIX</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-foreground/80 font-mono truncate">
                        {pagina.chave_pix}
                      </div>
                      <button
                        onClick={copiarPix}
                        className="shrink-0 p-2.5 rounded-xl border border-white/10 hover:border-cyan-glow/40 hover:text-cyan-glow text-muted-foreground/60 transition-colors"
                      >
                        {copiado ? (
                          <Check size={15} className="text-emerald-500" />
                        ) : (
                          <Copy size={15} />
                        )}
                      </button>
                    </div>
                  </div>
                  <p className="text-center text-xs text-muted-foreground/40">
                    Aponte a câmera para o QR code ou copie a chave PIX.
                  </p>
                </>
              ) : (
                <div className="text-center py-6">
                  <QrCode
                    size={32}
                    strokeWidth={1}
                    className="text-muted-foreground/20 mx-auto mb-2"
                  />
                  <p className="text-sm text-muted-foreground/50">
                    Informações de doação ainda não configuradas.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════ TAREFEIROS ══════════════ */}
        {aba === "tarefeiros" && (
          <div className="space-y-8 animate-fade-in-up">
            {/* Bloco relocated: Gerenciar Administradores da Página (Apenas para admin) */}
            {modoAdmin && (
              <section className="glass rounded-3xl border border-violet-100/50 shadow-md p-6 md:p-8 bg-white/80">
                <h3 className="text-lg font-semibold text-gray-800 border-b border-violet-100/40 pb-4 mb-5 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-cyan-600" />
                  Gerenciar Administradores da Página
                </h3>

                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground/50 font-light leading-relaxed">
                    Administradores autorizados podem editar a página, publicar no mural e gerenciar
                    eventos. O Presidente sempre tem acesso de administração automático.
                  </p>

                  <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden bg-white/50">
                    {membros.map((m) => {
                      const jaAdmin = adminIds.includes(m.id);
                      return (
                        <div
                          key={m.id}
                          className="flex items-center justify-between py-3 px-4 hover:bg-gray-50/50 transition-colors"
                        >
                          <span className="text-sm font-medium text-gray-700">{m.nome}</span>
                          <button
                            onClick={() => (jaAdmin ? removerAdmin(m.id) : adicionarAdmin(m.id))}
                            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${jaAdmin ? "border-red-200 text-red-500 hover:bg-red-50" : "border-cyan-600/30 text-cyan-600 hover:bg-cyan-50"}`}
                          >
                            {jaAdmin ? (
                              <>
                                <UserMinus size={12} />
                                Remover
                              </>
                            ) : (
                              <>
                                <UserPlus size={12} />
                                Autorizar
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                    {membros.length === 0 && (
                      <div className="text-center py-6">
                        <button
                          onClick={() => garantirMembros()}
                          className="px-4 py-2 text-xs font-semibold text-violet-600 bg-violet-50 rounded-xl hover:bg-violet-100 transition-colors"
                        >
                          Carregar Lista de Membros da Casa
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* Listagem de Tarefeiros */}
            <section className="glass rounded-3xl border border-violet-100/50 shadow-md p-6 md:p-8 bg-white/80">
              <h3 className="text-lg font-semibold text-gray-800 border-b border-violet-100/40 pb-4 mb-5 flex items-center gap-2">
                <Users className="w-5 h-5 text-violet-600" />
                Tarefeiros e Membros da Casa
              </h3>

              <div className="space-y-4">
                {modoAdmin && (
                  <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200/50 rounded-xl p-3 leading-relaxed">
                    <strong>Painel Administrativo Ativo:</strong> Você pode atribuir funções
                    oficiais aos membros. Ao definir a função de um membro, a edição do próprio
                    cargo será bloqueada na tela dele para garantir a segurança organizacional.
                  </p>
                )}

                <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden bg-white/50">
                  {membros.map((m) => {
                    const cargoDefinidoPorAdmin =
                      m.atividades?.includes("cargo_definido_por_admin") ?? false;
                    return (
                      <div
                        key={m.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between py-4 px-4 hover:bg-gray-50/50 transition-colors gap-3"
                      >
                        <div className="min-w-0">
                          <span className="text-sm font-semibold text-gray-800 block truncate">
                            {m.nome}
                          </span>
                          <span className="text-xs text-muted-foreground/60 block mt-0.5">
                            {m.cargo_principal || "Voluntário / Colaborador"}
                            {cargoDefinidoPorAdmin && (
                              <span className="ml-2 text-[10px] bg-amber-50 text-amber-700 border border-amber-200/40 px-2 py-0.5 rounded-full font-medium">
                                Definido por admin
                              </span>
                            )}
                          </span>
                        </div>

                        <div className="shrink-0 flex items-center gap-2">
                          {modoAdmin ? (
                            <select
                              value={m.cargo_principal || ""}
                              onChange={(e) => alterarFuncaoMembro(m.id, e.target.value)}
                              className="rounded-xl border border-gray-200 px-3 py-2 text-xs bg-white text-gray-700 focus:outline-none focus:border-cyan-500 w-full sm:w-auto"
                            >
                              <option value="">(Sem função / Colaborador)</option>
                              {CARGOS.map((cargo) => (
                                <option key={cargo} value={cargo}>
                                  {cargo}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg">
                              Trabalhador
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {membros.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-xs text-muted-foreground/50 mb-3">
                        Nenhum tarefeiro carregado.
                      </p>
                      <button
                        onClick={() => garantirMembros()}
                        className="px-4 py-2 text-xs font-semibold text-violet-600 bg-violet-50 rounded-xl hover:bg-violet-100 transition-colors"
                      >
                        Carregar Lista de Membros da Casa
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ══════════════ CONFIGURAÇÕES (ADMIN ONLY) ══════════════ */}
        {aba === "configuracoes" && modoAdmin && (
          <div className="space-y-8 animate-fade-in-up">
            {/* Bloco 1: Editar Informações da Casa */}
            <section className="glass rounded-3xl border border-violet-100/50 shadow-md p-6 md:p-8 bg-white/80">
              <h3 className="text-lg font-semibold text-gray-800 border-b border-violet-100/40 pb-4 mb-5 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-violet-600" />
                Informações da Casa Espírita
              </h3>

              <div className="space-y-5">
                <Field label="Nome completo da casa">
                  <input
                    value={formSobre.nome_completo ?? ""}
                    onChange={(e) => setFormSobre((s) => ({ ...s, nome_completo: e.target.value }))}
                    placeholder="Ex.: Centro Espírita Paz e Amor"
                    className={inputCls}
                  />
                </Field>
                <Field label="Descrição">
                  <textarea
                    value={formSobre.descricao ?? ""}
                    onChange={(e) => setFormSobre((s) => ({ ...s, descricao: e.target.value }))}
                    rows={3}
                    placeholder="Apresentação da casa…"
                    className={`${inputCls} resize-none`}
                  />
                </Field>
                <Field label="Missão">
                  <textarea
                    value={formSobre.missao ?? ""}
                    onChange={(e) => setFormSobre((s) => ({ ...s, missao: e.target.value }))}
                    rows={2}
                    placeholder="Missão e valores…"
                    className={`${inputCls} resize-none`}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Ano de fundação">
                    <input
                      type="number"
                      value={formSobre.ano_fundacao ?? ""}
                      onChange={(e) =>
                        setFormSobre((s) => ({
                          ...s,
                          ano_fundacao: e.target.value ? +e.target.value : null,
                        }))
                      }
                      placeholder="Ex.: 1985"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="CEP">
                    <input
                      value={formSobre.cep ?? ""}
                      onChange={(e) => setFormSobre((s) => ({ ...s, cep: e.target.value }))}
                      placeholder="00000-000"
                      className={inputCls}
                    />
                  </Field>
                </div>
                <Field label="Endereço">
                  <input
                    value={formSobre.endereco ?? ""}
                    onChange={(e) => setFormSobre((s) => ({ ...s, endereco: e.target.value }))}
                    placeholder="Rua, número…"
                    className={inputCls}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Bairro">
                    <input
                      value={formSobre.bairro ?? ""}
                      onChange={(e) => setFormSobre((s) => ({ ...s, bairro: e.target.value }))}
                      placeholder="Bairro"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Cidade">
                    <input
                      value={formSobre.cidade ?? ""}
                      onChange={(e) => setFormSobre((s) => ({ ...s, cidade: e.target.value }))}
                      placeholder="Cidade"
                      className={inputCls}
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="UF">
                    <input
                      value={formSobre.uf ?? ""}
                      maxLength={2}
                      onChange={(e) =>
                        setFormSobre((s) => ({ ...s, uf: e.target.value.toUpperCase() }))
                      }
                      placeholder="SP"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Telefone">
                    <input
                      value={formSobre.telefone ?? ""}
                      onChange={(e) => setFormSobre((s) => ({ ...s, telefone: e.target.value }))}
                      placeholder="(11) 99999-9999"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="E-mail de contato">
                    <input
                      type="email"
                      value={formSobre.email_contato ?? ""}
                      onChange={(e) =>
                        setFormSobre((s) => ({ ...s, email_contato: e.target.value }))
                      }
                      placeholder="contato@…"
                      className={inputCls}
                    />
                  </Field>
                </div>
                <Field label="Site (opcional)">
                  <input
                    value={formSobre.site ?? ""}
                    onChange={(e) => setFormSobre((s) => ({ ...s, site: e.target.value }))}
                    placeholder="https://…"
                    className={inputCls}
                  />
                </Field>

                <div className="pt-2">
                  <button
                    onClick={salvarSobre}
                    disabled={salvando}
                    className="w-full md:w-auto px-6 py-2.5 rounded-xl text-xs uppercase tracking-widest text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-40 transition-colors flex items-center justify-center gap-2 ml-auto shadow-sm"
                  >
                    <Save size={13} />
                    {salvando ? "Salvando…" : "Salvar Alterações da Casa"}
                  </button>
                </div>
              </div>
            </section>

            {/* Bloco: Visibilidade da página */}
            <section className="glass rounded-3xl border border-violet-100/50 shadow-md p-6 md:p-8 bg-white/40">
              <h3 className="text-lg font-semibold text-gray-800 border-b border-violet-100/40 pb-4 mb-5 flex items-center gap-2">
                <Globe className="w-5 h-5 text-violet-600" />
                Visibilidade da página
              </h3>

              <div className="space-y-5">
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 shrink-0 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                      pagina.publicada
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : "bg-slate-50 border-slate-200 text-slate-600"
                    }`}
                  >
                    {pagina.publicada ? "Pública" : "Privada"}
                  </span>
                  <p className="text-sm text-gray-600 font-light leading-relaxed">
                    {pagina.publicada
                      ? "Qualquer pessoa pode ver esta página, inclusive pelo Google. É assim que quem procura um centro espírita na região encontra a casa."
                      : "Somente membros da casa com conta no site conseguem ver esta página."}
                  </p>
                </div>

                <div className="rounded-2xl border border-violet-100/60 bg-white/50 p-4 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                    O que fica visível ao publicar
                  </p>
                  <p className="text-sm text-gray-600 font-light leading-relaxed">
                    Nome, descrição, missão, ano de fundação, endereço, telefone, e-mail, site e os
                    horários das atividades.
                  </p>
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 pt-2">
                    O que continua privado
                  </p>
                  <p className="text-sm text-gray-600 font-light leading-relaxed">
                    Mural, tarefeiros e seus cargos, agenda, projetos, tesouraria e a chave PIX —
                    protegidos no próprio banco de dados, não apenas escondidos na tela.
                  </p>
                </div>

                {/* Antes era um conselho genérico em letra miúda ("preencha a
                    descrição e os horários"). Agora diz, item a item, o que o
                    visitante vai ou não encontrar — e onde preencher. */}
                {(() => {
                  const faltando = pendenciasDaPagina(pagina);
                  const completa = faltando.length === 0;
                  return (
                    <div className="rounded-2xl border border-violet-100/60 bg-white/50 p-4 space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                        O que o visitante vai encontrar
                      </p>
                      <ul className="space-y-2">
                        {ITENS_PAGINA_PUBLICA.map((item) => {
                          const ok = item.preenchido(pagina);
                          return (
                            <li key={item.chave} className="flex items-start gap-2.5 text-sm">
                              {ok ? (
                                <Check
                                  size={15}
                                  strokeWidth={2.4}
                                  className="mt-0.5 shrink-0 text-emerald-600"
                                />
                              ) : (
                                <span
                                  aria-hidden
                                  className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"
                                />
                              )}
                              <span
                                className={
                                  ok ? "text-gray-500 font-light" : "text-gray-700 font-light"
                                }
                              >
                                {item.rotulo}
                                {!ok && (
                                  <span className="text-amber-700">
                                    {" "}
                                    — falta preencher {item.onde}
                                  </span>
                                )}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                      <p
                        className={`text-sm font-light leading-relaxed pt-1 ${
                          completa ? "text-emerald-700" : "text-amber-700"
                        }`}
                      >
                        {completa
                          ? "A página está pronta para receber visitantes."
                          : `Publicando assim, quem chegar vê uma página quase vazia. Nada impede publicar agora — dá para completar depois, a qualquer momento.`}
                      </p>
                    </div>
                  );
                })()}

                <button
                  onClick={alternarPublicacao}
                  disabled={salvandoPublicacao}
                  // Publicar é a ação construtiva e vem preenchida; tornar
                  // privada recua um passo e fica de contorno. Com os campos
                  // agora rebaixados, um botão vazado ao lado deles seria lido
                  // como mais um campo em branco.
                  className={`w-full py-3 rounded-xl text-sm uppercase tracking-widest border font-semibold transition-colors disabled:opacity-40 ${
                    pagina.publicada
                      ? "text-slate-600 border-slate-300 hover:bg-slate-50"
                      : "bg-emerald-600 border-emerald-700 text-white shadow-sm hover:bg-emerald-700"
                  }`}
                >
                  {salvandoPublicacao
                    ? "Salvando…"
                    : pagina.publicada
                      ? "Tornar privada"
                      : "Publicar página"}
                </button>

                <p className="text-xs text-gray-400 font-light text-center">
                  Reversível a qualquer momento.
                </p>
              </div>
            </section>

            {/* Bloco 2: Configurar Doações & Pix */}
            <section className="glass rounded-3xl border border-violet-100/50 shadow-md p-6 md:p-8 bg-white/80">
              <h3 className="text-lg font-semibold text-gray-800 border-b border-violet-100/40 pb-4 mb-5 flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500" />
                Configurar Doações &amp; PIX
              </h3>

              <div className="space-y-5">
                <Field label="Chave PIX">
                  <input
                    value={formDoacoes.chave_pix}
                    onChange={(e) => setFormDoacoes((f) => ({ ...f, chave_pix: e.target.value }))}
                    placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória"
                    className={inputCls}
                  />
                  <p className="text-[10px] text-muted-foreground/50 mt-1">
                    O QR code é gerado automaticamente para os visitantes a partir da chave
                    inserida.
                  </p>
                </Field>
                <Field label="Texto de apresentação">
                  <textarea
                    value={formDoacoes.texto_doacao}
                    onChange={(e) =>
                      setFormDoacoes((f) => ({ ...f, texto_doacao: e.target.value }))
                    }
                    rows={3}
                    className={`${inputCls} resize-none`}
                  />
                </Field>

                <div className="pt-2">
                  <button
                    onClick={salvarDoacoes}
                    disabled={salvando}
                    className="w-full md:w-auto px-6 py-2.5 rounded-xl text-xs uppercase tracking-widest text-white bg-rose-500 hover:bg-rose-600 disabled:opacity-40 transition-colors flex items-center justify-center gap-2 ml-auto shadow-sm"
                  >
                    <Save size={13} />
                    {salvando ? "Salvando…" : "Salvar Chave PIX"}
                  </button>
                </div>
              </div>
            </section>

            {/* Bloco 3: Moderação de artigos — só Presidente e Vice da casa (ou DEV) */}
            {isPresident && (
              <section className="glass rounded-3xl border border-violet-100/50 shadow-md p-6 md:p-8 bg-white/80">
                <h3 className="text-lg font-semibold text-gray-800 border-b border-violet-100/40 pb-4 mb-5 flex items-center gap-2">
                  <Scale className="w-5 h-5 text-violet-600" />
                  Moderação de Artigos
                </h3>
                <p className="text-xs text-gray-400 -mt-3 mb-5">
                  Casos de autores desta casa retirados pela comunidade, por decisão humana ou
                  reenviados após correção.
                </p>
                <FilaRevisaoArtigos escopo="casa" sigla={sigla} />
              </section>
            )}
          </div>
        )}

        <div className="mt-12 text-center">
          <Link
            to="/inicio"
            className="text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors uppercase tracking-widest"
          >
            ← Início
          </Link>
        </div>
      </div>
    </main>
  );
}

/* ══════════════════════════════════════════════════════════════
   SUB-COMPONENTS
══════════════════════════════════════════════════════════════ */

const inputCls =
  "w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground/40 focus:outline-none focus:border-cyan-glow/40 transition-colors";
const labelCls = "text-xs uppercase tracking-widest text-muted-foreground/60 mb-1.5 block";

/**
 * Bloco exibido apenas ao visitante que chega sem login.
 *
 * Ele responde as duas perguntas que nenhuma aba do visitante responde: onde
 * a casa fica e com quem falar. Os contatos existiam somente como texto solto
 * no cabecalho — no celular nao dava para tocar e ligar, e a aba Doacoes ainda
 * mandava o visitante procurar contato em "Atividades", onde ha apenas
 * horarios.
 *
 * Cada item so aparece quando a casa preencheu o dado. Nada aqui afirma como a
 * casa recebe quem chega: o texto apresenta o que a propria casa divulgou.
 */
function ComoChegar({
  endereco,
  bairro,
  cidade,
  uf,
  telefone,
  email,
  site,
}: {
  endereco?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
  telefone?: string | null;
  email?: string | null;
  site?: string | null;
}) {
  const enderecoCompleto = [endereco, bairro, cidade, uf].filter(Boolean).join(", ");
  const temEndereco = !!endereco;
  const temContato = !!(telefone || email || site);
  const telefoneDiscagem = telefone?.replace(/[^\d+]/g, "") || null;
  const siteHref = site ? (site.startsWith("http") ? site : `https://${site}`) : null;

  const itemCls =
    "flex items-center gap-3 min-h-11 px-4 rounded-xl border border-white/10 bg-white/5 text-sm text-foreground/85 hover:border-cyan-glow/40 hover:text-cyan-glow transition-colors";

  return (
    <section className="glass rounded-2xl p-6 md:p-8 mt-6 sw-rise sw-rise-2">
      <div className="flex items-center gap-2.5 mb-1">
        <span className="block h-px w-7 rounded-sm bg-[#b08826]" />
        <span className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-[#b08826]">
          Para quem deseja conhecer
        </span>
      </div>
      <h2 className="text-2xl font-normal text-foreground">Como chegar e falar</h2>

      {temEndereco || temContato ? (
        <div className="grid gap-6 md:grid-cols-2 mt-5">
          {temEndereco && (
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                Onde fica
              </p>
              <p className="text-sm leading-relaxed text-foreground/85">{enderecoCompleto}</p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(enderecoCompleto)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`${itemCls} mt-3`}
              >
                <MapPin size={15} strokeWidth={1.6} />
                Ver rota no mapa
              </a>
            </div>
          )}

          {temContato && (
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                Fale com a casa
              </p>
              <div className="space-y-2">
                {telefone && (
                  <a href={`tel:${telefoneDiscagem}`} className={itemCls}>
                    <Phone size={15} strokeWidth={1.6} />
                    {telefone}
                  </a>
                )}
                {email && (
                  <a href={`mailto:${email}`} className={itemCls}>
                    <Mail size={15} strokeWidth={1.6} />
                    <span className="truncate">{email}</span>
                  </a>
                )}
                {siteHref && (
                  <a href={siteHref} target="_blank" rel="noopener noreferrer" className={itemCls}>
                    <Globe size={15} strokeWidth={1.6} />
                    <span className="truncate">{site!.replace(/https?:\/\/(www\.)?/, "")}</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Esta casa ainda não divulgou endereço nem contato nesta página.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm text-cyan-glow hover:underline"
          >
            Faço parte desta casa e quero completar a página →
          </Link>
        </div>
      )}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

function InfoRow({
  Icon,
  label,
  value,
  link,
}: {
  Icon: LucideIcon;
  label: string;
  value: string;
  link?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-cyan-50 border border-cyan-100 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={14} strokeWidth={1.5} className="text-cyan-700" />
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">
          {label}
        </p>
        {link ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-cyan-glow hover:underline break-all"
          >
            {value}
          </a>
        ) : (
          <p className="text-sm text-foreground/80 font-light">{value}</p>
        )}
      </div>
    </div>
  );
}

/* ── PostForm ─────────────────────────────────────────────── */

function PostForm({
  form,
  onChange,
  onCancel,
  onSubmit,
  submitLabel,
}: {
  form: { conteudo: string; imagem_url: string; video_url: string };
  onChange: (v: typeof form) => void;
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel: string;
}) {
  const embedUrl = form.video_url ? videoEmbed(form.video_url) : null;

  return (
    <div className="space-y-4">
      <textarea
        value={form.conteudo}
        onChange={(e) => onChange({ ...form, conteudo: e.target.value })}
        maxLength={2000}
        rows={4}
        placeholder="Escreva o comunicado ou aviso para a comunidade…"
        className={`${inputCls} resize-none`}
      />

      {/* Imagem */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <Image size={13} className="text-muted-foreground/50" />
          <p className="text-xs uppercase tracking-widest text-muted-foreground/60">
            URL da imagem (opcional)
          </p>
        </div>
        <input
          type="url"
          value={form.imagem_url}
          onChange={(e) => onChange({ ...form, imagem_url: e.target.value })}
          placeholder="https://…"
          className={inputCls}
        />
        <p className="text-[10px] text-muted-foreground/40 leading-relaxed">
          Dimensões recomendadas: <strong>1200 × 630 px</strong> (paisagem) ou{" "}
          <strong>1080 × 1080 px</strong> (quadrado). Mínimo: 600 px de largura. Formatos: JPG, PNG,
          WebP.
        </p>
        {form.imagem_url && (
          <img
            src={form.imagem_url}
            alt="Prévia"
            className="w-full max-h-48 object-cover rounded-xl border border-white/10 mt-1"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        )}
      </div>

      {/* Vídeo */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <Video size={13} className="text-muted-foreground/50" />
          <p className="text-xs uppercase tracking-widest text-muted-foreground/60">
            URL do vídeo (opcional)
          </p>
        </div>
        <input
          type="url"
          value={form.video_url}
          onChange={(e) => onChange({ ...form, video_url: e.target.value })}
          placeholder="youtube.com/watch?v=… ou vimeo.com/…"
          className={inputCls}
        />
        <p className="text-[10px] text-muted-foreground/40">
          Cole o link normal do YouTube ou Vimeo. O vídeo será incorporado automaticamente.
        </p>
        {embedUrl && (
          <div className="rounded-xl overflow-hidden aspect-video bg-black/10 mt-1">
            <iframe
              src={embedUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground/40">{form.conteudo.length}/2000</span>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs text-muted-foreground border border-white/10 hover:bg-white/5 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onSubmit}
            disabled={!form.conteudo.trim()}
            className="px-5 py-2 rounded-xl text-xs uppercase tracking-widest text-cyan-glow border border-cyan-glow/40 hover:bg-cyan-glow/10 disabled:opacity-40 transition-colors"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── EventoForm ───────────────────────────────────────────── */

type FormEvento = {
  titulo: string;
  descricao: string;
  data_evento: string;
  hora_inicio: string;
  hora_fim: string;
  local_evento: string;
  publica: boolean;
};

function EventoForm({
  form,
  onChange,
  onCancel,
  onSubmit,
  submitLabel,
}: {
  form: FormEvento;
  onChange: (v: FormEvento) => void;
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel: string;
}) {
  return (
    <div className="space-y-4">
      <Field label="Título do evento *">
        <input
          value={form.titulo}
          onChange={(e) => onChange({ ...form, titulo: e.target.value })}
          placeholder="Ex.: Palestra Pública"
          className={inputCls}
        />
      </Field>
      <Field label="Descrição">
        <textarea
          value={form.descricao}
          onChange={(e) => onChange({ ...form, descricao: e.target.value })}
          rows={2}
          placeholder="Detalhes do evento…"
          className={`${inputCls} resize-none`}
        />
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Data *">
          <input
            type="date"
            value={form.data_evento}
            onChange={(e) => onChange({ ...form, data_evento: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Início">
          <input
            type="time"
            value={form.hora_inicio}
            onChange={(e) => onChange({ ...form, hora_inicio: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Término">
          <input
            type="time"
            value={form.hora_fim}
            onChange={(e) => onChange({ ...form, hora_fim: e.target.value })}
            className={inputCls}
          />
        </Field>
      </div>
      <Field label="Local">
        <input
          value={form.local_evento}
          onChange={(e) => onChange({ ...form, local_evento: e.target.value })}
          placeholder="Ex.: Salão Principal"
          className={inputCls}
        />
      </Field>
      {/* Visibilidade */}
      <div>
        <p className={labelCls}>Visibilidade</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => onChange({ ...form, publica: true })}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs border transition-colors ${form.publica ? "border-cyan-glow/60 text-cyan-glow bg-cyan-50" : "border-white/10 text-muted-foreground hover:bg-white/5"}`}
          >
            <Unlock size={13} />
            Público
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...form, publica: false })}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs border transition-colors ${!form.publica ? "border-amber-400/60 text-amber-600 bg-amber-50" : "border-white/10 text-muted-foreground hover:bg-white/5"}`}
          >
            <Lock size={13} />
            Privado
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground/40 mt-1.5">
          {form.publica
            ? "Visível para todos que visitarem a página."
            : "Visível apenas para membros desta casa e participantes convidados."}
        </p>
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl text-xs text-muted-foreground border border-white/10 hover:bg-white/5 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={onSubmit}
          disabled={!form.titulo.trim() || !form.data_evento}
          className="flex-1 py-2.5 rounded-xl text-xs uppercase tracking-widest text-cyan-glow border border-cyan-glow/40 hover:bg-cyan-glow/10 disabled:opacity-40 transition-colors"
        >
          {submitLabel}
        </button>
      </div>
    </div>
  );
}

/* ── EventoCard ───────────────────────────────────────────── */

function EventoCard({
  ev,
  user,
  profile,
  isAdmin,
  isSameCasa,
  participantes,
  expandido,
  editando,
  formEdit,
  membros,
  addPartOpen,
  onToggleExpand,
  onEdit,
  onCancelEdit,
  onSaveEdit,
  onChangeFormEdit,
  onDelete,
  onAddPart,
  onRemovePart,
  onToggleAddPart,
  onConfirmar,
}: {
  ev: Evento;
  user: { id: string } | null;
  profile: { sigla_casa?: string; nome?: string } | null;
  isAdmin: boolean;
  isSameCasa: boolean;
  participantes?: EvParticipante[];
  expandido: boolean;
  editando: boolean;
  formEdit: FormEvento;
  membros: Membro[];
  addPartOpen: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onChangeFormEdit: (v: FormEvento) => void;
  onDelete: () => void;
  onAddPart: (id: string) => void;
  onRemovePart: (id: string) => void;
  onToggleAddPart: () => void;
  onConfirmar: (s: "confirmado" | "recusou") => void;
}) {
  const data = parseISO(ev.data_evento);
  const dia = format(data, "d");
  const mes = format(data, "MMM", { locale: ptBR });
  const semana = format(data, "EEE", { locale: ptBR });

  const horaInicio = fmtHora(ev.hora_inicio);
  const horaFim = fmtHora(ev.hora_fim);
  const horaStr = horaInicio ? (horaFim ? `${horaInicio} – ${horaFim}` : horaInicio) : null;

  const minhaParticipacao = participantes?.find((p) => p.user_id === user?.id);
  const confirmados = participantes?.filter((p) => p.status === "confirmado").length ?? 0;
  const total = participantes?.length ?? 0;

  const statusLabel: Record<string, string> = {
    convidado: "Convidado",
    confirmado: "Confirmado",
    recusou: "Não vai",
  };
  const statusColor: Record<string, string> = {
    convidado: "text-amber-500 bg-amber-50 border-amber-200",
    confirmado: "text-emerald-600 bg-emerald-50 border-emerald-200",
    recusou: "text-red-500 bg-red-50 border-red-200",
  };

  return (
    <div className="border-b border-white/5 last:border-0">
      {/* ── Header do evento ── */}
      <div className="flex items-start gap-4 px-5 py-4 hover:bg-white/5 transition-colors">
        {/* Badge de data */}
        <div className="text-center bg-cyan-50 border border-cyan-100 rounded-xl px-3 pt-1.5 pb-2 shrink-0 min-w-[52px]">
          <p className="text-[9px] uppercase tracking-widest text-cyan-500 font-medium">{mes}</p>
          <p className="text-2xl font-bold text-cyan-700 leading-none">{dia}</p>
          <p className="text-[9px] text-cyan-400 capitalize">{semana}</p>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-sm font-medium text-foreground leading-snug">{ev.titulo}</h3>
            <span
              className={`shrink-0 text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-full border flex items-center gap-1 ${ev.publica ? "text-cyan-600 bg-cyan-50 border-cyan-200" : "text-amber-600 bg-amber-50 border-amber-200"}`}
            >
              {ev.publica ? (
                <>
                  <Unlock size={9} />
                  Público
                </>
              ) : (
                <>
                  <Lock size={9} />
                  Privado
                </>
              )}
            </span>
          </div>
          {horaStr && <p className="text-xs text-muted-foreground/70 mb-0.5">{horaStr}</p>}
          {ev.local_evento && (
            <p className="text-xs text-muted-foreground/60 flex items-center gap-1">
              <MapPin size={10} />
              {ev.local_evento}
            </p>
          )}
          {ev.descricao && (
            <p className="text-xs text-foreground/60 mt-1.5 leading-relaxed">{ev.descricao}</p>
          )}

          {/* Participação do usuário atual */}
          {minhaParticipacao && !expandido && (
            <span
              className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded-full border mt-2 ${statusColor[minhaParticipacao.status]}`}
            >
              {statusLabel[minhaParticipacao.status]}
            </span>
          )}
        </div>

        {/* Expand button */}
        <button
          onClick={onToggleExpand}
          className="shrink-0 p-1.5 rounded-lg text-muted-foreground/40 hover:text-foreground hover:bg-white/10 transition-colors mt-0.5"
        >
          {expandido ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>

      {/* ── Painel expandido ── */}
      {expandido && (
        <div className="px-5 pb-5 space-y-4 border-t border-white/5 pt-4">
          {/* Editar evento */}
          {editando ? (
            <EventoForm
              form={formEdit}
              onChange={onChangeFormEdit}
              onCancel={onCancelEdit}
              onSubmit={onSaveEdit}
              submitLabel="Salvar"
            />
          ) : (
            <>
              {/* Participantes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground/50">
                    Participantes{" "}
                    {total > 0 &&
                      `(${confirmados} confirmado${confirmados !== 1 ? "s" : ""} / ${total})`}
                  </p>
                  {isAdmin && (
                    <button
                      onClick={onToggleAddPart}
                      className="flex items-center gap-1 text-xs text-cyan-glow hover:underline"
                    >
                      <UserPlus size={12} />
                      Adicionar
                    </button>
                  )}
                </div>

                {/* Selector de membro a adicionar */}
                {isAdmin && addPartOpen && (
                  <div className="mb-3">
                    <select
                      className={`${inputCls} mb-1`}
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) {
                          onAddPart(e.target.value);
                          e.target.value = "";
                        }
                      }}
                    >
                      <option value="" disabled>
                        Selecione um membro…
                      </option>
                      {membros
                        .filter((m) => !participantes?.find((p) => p.user_id === m.id))
                        .map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.nome}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                {/* Lista de participantes */}
                {!participantes || participantes.length === 0 ? (
                  <p className="text-xs text-muted-foreground/40 py-2">
                    Nenhum participante adicionado.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {participantes.map((p) => (
                      <div
                        key={p.user_id}
                        className="flex items-center justify-between py-1.5 px-3 rounded-xl hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-foreground/80">{p.nome || "Membro"}</span>
                          <span
                            className={`text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-full border ${statusColor[p.status]}`}
                          >
                            {statusLabel[p.status]}
                          </span>
                        </div>
                        {isAdmin && (
                          <button
                            onClick={() => onRemovePart(p.user_id)}
                            className="p-1 rounded-lg text-muted-foreground/30 hover:text-red-500 transition-colors"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Confirmar/recusar própria participação */}
                {minhaParticipacao && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-white/5">
                    <button
                      onClick={() => onConfirmar("confirmado")}
                      disabled={minhaParticipacao.status === "confirmado"}
                      className={`flex-1 py-2 rounded-xl text-xs border transition-colors ${minhaParticipacao.status === "confirmado" ? "border-emerald-300 text-emerald-600 bg-emerald-50" : "border-white/10 text-muted-foreground hover:border-emerald-300 hover:text-emerald-600"}`}
                    >
                      Confirmar presença
                    </button>
                    <button
                      onClick={() => onConfirmar("recusou")}
                      disabled={minhaParticipacao.status === "recusou"}
                      className={`flex-1 py-2 rounded-xl text-xs border transition-colors ${minhaParticipacao.status === "recusou" ? "border-red-300 text-red-500 bg-red-50" : "border-white/10 text-muted-foreground hover:border-red-300 hover:text-red-500"}`}
                    >
                      Não vou comparecer
                    </button>
                  </div>
                )}
              </div>

              {/* Ações de admin */}
              {isAdmin && (
                <div className="flex gap-2 pt-2 border-t border-white/5">
                  <button
                    onClick={onEdit}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs border border-white/10 text-muted-foreground hover:border-cyan-glow/40 hover:text-cyan-glow transition-colors"
                  >
                    <Edit3 size={12} />
                    Editar
                  </button>
                  <button
                    onClick={onDelete}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs border border-white/10 text-muted-foreground hover:border-red-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={12} />
                    Excluir
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Dashboard Helper Components ───────────────────────────────── */

function DashSectionHeader({
  Icon,
  label,
  color,
  iconColor,
  bg,
  border,
  borderB,
  children,
}: {
  Icon: LucideIcon;
  label: string;
  color: string;
  iconColor: string;
  bg: string;
  border: string;
  borderB: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={`flex items-center gap-4 mb-5 pb-3 border-b-2 ${borderB}`}>
      <div
        className={`w-9 h-9 rounded-xl ${bg} border ${border} flex items-center justify-center shrink-0`}
      >
        <Icon size={18} strokeWidth={1.5} className={iconColor} />
      </div>
      <h3 className={`text-sm font-semibold ${color} tracking-wide`}>{label}</h3>
      {children && <div className="ml-auto flex items-center gap-2">{children}</div>}
    </div>
  );
}

function DashVoteBadge({
  title,
  votes,
  votingKey,
}: {
  title: string;
  votes: Record<string, { count: number; votedByMe: boolean }>;
  votingKey: string | null;
}) {
  const key = toItemKey(title);
  const voteData = votes[key];
  const count = voteData?.count ?? 0;
  const voted = voteData?.votedByMe ?? false;
  const isVoting = votingKey === key;
  return (
    <span
      className={`ml-auto flex items-center gap-1 text-[10px] rounded-full px-2 py-0.5 border transition-colors ${
        voted
          ? "text-cyan-600 border-cyan-300 bg-cyan-50"
          : "text-muted-foreground/40 border-border bg-transparent"
      } ${isVoting ? "opacity-50" : ""}`}
      title={
        voted
          ? "Você curtiu este recurso — clique no cartão para retirar a curtida"
          : "Clique no cartão para curtir este recurso"
      }
    >
      <ThumbsUp size={10} />
      {count > 0 && <span className="font-medium">{count}</span>}
    </span>
  );
}

function DashDashCard({
  Icon,
  title,
  desc,
  status,
  accent,
  href,
  casa,
  votes,
  votingKey,
  onVote,
  onClick,
}: {
  Icon: LucideIcon;
  title: string;
  desc: string;
  status: DashStatus;
  accent: string;
  href?: string;
  casa?: boolean;
  votes: Record<string, { count: number; votedByMe: boolean }>;
  votingKey: string | null;
  onVote: (title: string) => void;
  onClick?: () => void;
}) {
  const borderMap: Record<string, string> = {
    slate: "border-t-slate-300/80 focus-within:border-t-slate-400",
    amber: "border-t-amber-300/80 focus-within:border-t-amber-400",
    cyan: "border-t-cyan-300/80 focus-within:border-t-cyan-400",
  };
  const iconMap: Record<string, string> = {
    slate: "bg-slate-50 border-slate-200 text-slate-600",
    cyan: "bg-cyan-50 border-cyan-200 text-cyan-600",
    amber: "bg-amber-50 border-amber-200 text-amber-600",
  };
  const isPending = status === "breve";
  const content = (
    <div
      className={`glass-premium hover-premium rounded-2xl p-5 border-t-4 ${borderMap[accent] ?? "border-t-slate-300"} h-full flex flex-col gap-4 ${isPending || onClick ? "cursor-pointer" : ""}`}
      onClick={onClick ? onClick : isPending ? () => onVote(title) : undefined}
    >
      <div
        className={`w-9 h-9 rounded-xl border flex items-center justify-center ${iconMap[accent] ?? iconMap.slate}`}
      >
        <Icon size={18} strokeWidth={1.5} />
      </div>
      <div className="flex-1">
        <h4 className="text-xs font-bold text-gray-800 leading-snug mb-1">{title}</h4>
        <p className="text-[11px] text-gray-500 leading-relaxed font-light">{desc}</p>
      </div>
      <div className="flex items-center gap-2 flex-wrap mt-1">
        <span
          className={`text-[9px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full border ${STATUS_STYLE[status]}`}
        >
          {STATUS_LABEL[status]}
        </span>
        {isPending && <DashVoteBadge title={title} votes={votes} votingKey={votingKey} />}
      </div>
    </div>
  );
  if (href)
    return (
      <Link to={href} className="block h-full">
        {content}
      </Link>
    );
  return content;
}

function DashFeatureCard({
  item,
  cat,
  onAbrirAba,
  votes,
  votingKey,
  onVote,
}: {
  item: DashFeatureItem;
  cat: DashFeatureCategory;
  onAbrirAba: (aba: Aba) => void;
  votes: Record<string, { count: number; votedByMe: boolean }>;
  votingKey: string | null;
  onVote: (title: string) => void;
}) {
  const isAvailable = item.status === "disponivel";
  const isPending = item.status === "breve";
  // O recurso mora nesta mesma pagina, em outra aba: o cartao troca de aba em
  // vez de recarregar o site.
  const abaDoCartao = item.casaAba;

  const inner = (
    <div
      className={`group glass-premium hover-premium rounded-2xl p-5 flex flex-col gap-4 h-full ${!isAvailable ? "opacity-80" : ""} ${isPending || abaDoCartao ? "cursor-pointer" : ""}`}
      onClick={
        isPending
          ? () => onVote(item.title)
          : abaDoCartao
            ? () => onAbrirAba(abaDoCartao)
            : undefined
      }
    >
      <div
        className={`w-9 h-9 rounded-xl ${cat.bg} border ${cat.border} flex items-center justify-center shrink-0`}
      >
        <item.Icon size={18} strokeWidth={1.5} className={cat.iconColor} />
      </div>
      <div className="flex-1">
        <h4 className="text-xs font-bold text-gray-800 leading-snug mb-1">{item.title}</h4>
        <p className="text-[11px] text-gray-500 leading-relaxed font-light">{item.desc}</p>
      </div>
      <div className="flex items-center gap-2 flex-wrap mt-1">
        <span
          className={`text-[9px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full border ${STATUS_STYLE[item.status]}`}
        >
          {STATUS_LABEL[item.status]}
        </span>
        {isPending && <DashVoteBadge title={item.title} votes={votes} votingKey={votingKey} />}
      </div>
    </div>
  );
  if (item.href)
    return (
      <a href={item.href} className="block h-full">
        {inner}
      </a>
    );
  return inner;
}

function DashBazarCard({ item }: { item: (typeof DASH_BAZAR)[0] }) {
  return (
    <div className="glass-premium hover-premium rounded-2xl p-4 flex flex-col gap-3">
      <div className="w-11 h-11 rounded-xl bg-cyan-50/70 border border-cyan-100 flex items-center justify-center mx-auto shadow-sm">
        <item.Icon size={20} strokeWidth={1.5} className="text-cyan-600" />
      </div>
      <div className="text-center flex-1">
        <p className="text-[9px] font-bold text-cyan-600/70 uppercase tracking-widest mb-0.5">
          {item.category}
        </p>
        <h4 className="text-xs font-semibold text-gray-800 leading-snug mb-1">{item.name}</h4>
        <p className="text-[9px] text-gray-400 font-light">{item.desc}</p>
      </div>
      <div className="text-center mt-1">
        <p className="text-xs font-semibold text-cyan-600 mb-2">{item.price}</p>
        <button className="w-full text-[9px] font-bold uppercase tracking-widest py-1.5 rounded-lg border border-cyan-200 text-cyan-600 hover:bg-cyan-50 transition-colors shadow-sm">
          Consultar
        </button>
      </div>
    </div>
  );
}
