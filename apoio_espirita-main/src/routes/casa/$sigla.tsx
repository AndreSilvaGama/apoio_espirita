import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Building2, MapPin, Phone, Mail, Globe, Clock,
  QrCode, Copy, Check, Plus, Trash2, Pin, PinOff,
  Edit3, Save, X, Users, Shield, Calendar,
  MessageSquare, Info, Heart, UserPlus, UserMinus,
  Image, Video, CalendarDays, Lock, Unlock,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  PenLine, Music, Guitar, Sprout, Sparkles, Gamepad2,
  MessageCircle, HeartHandshake, ShoppingBag, Car, Truck,
  Cast, Film, MonitorPlay, CircleHelp, BarChart3, ClipboardList,
  Wallet, BookOpen, BookMarked, Shirt, Footprints, Star,
  LayoutDashboard, Flame, UsersRound, CalendarCheck, Wrench,
  Megaphone, ClipboardCheck, CalendarRange, FileHeart, Cake, ThumbsUp,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, parseISO, isAfter, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CasaHero } from "@/components/CasaHero";
import { ProjetosTab } from "@/components/ProjetosTab";


export const Route = createFileRoute("/casa/$sigla")({
  component: PaginaCasa,
});

/* ── Types ─────────────────────────────────────────────────────── */

type Aba = "painel" | "mural" | "sobre" | "programacao" | "projetos" | "doacoes";

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
  horarios: HorarioItem[];
  chave_pix: string;
  texto_doacao: string;
  publicada: boolean;
}

interface HorarioItem { dia: string; hora: string; atividade: string; }

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

interface Membro { id: string; nome: string; }

const DIAS = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado", "Domingo"];

const FORM_POST_INICIAL = { conteudo: "", imagem_url: "", video_url: "" };
const FORM_EVENTO_INICIAL = { titulo: "", descricao: "", data_evento: "", hora_inicio: "", hora_fim: "", local_evento: "", publica: true };

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
  { text: "Não façais aos outros o que não quiserdes que vos façam; fazei-lhes todo o bem que quiserdes que vos façam.", author: "O Evangelho segundo o Espiritismo" },
  { text: "A caridade bem compreendida consiste em fazer o bem a todos os homens sem distinção.", author: "O Livro dos Espíritos" },
  { text: "Amai-vos uns aos outros: eis toda a lei; lei divina, pela qual Deus governa os mundos.", author: "O Evangelho segundo o Espiritismo" },
  { text: "A humildade é o adorno da alma, assim como a modéstia é o adorno do mérito.", author: "O Livro dos Espíritos" },
  { text: "Quem semeia o bem colhe bons frutos; quem semeia o mal colhe maus frutos.", author: "A Gênese · Cap. VII" },
  { text: "O verdadeiro espiritismo é aquele que tem por divisa: fora da caridade não há salvação.", author: "Allan Kardec · A Gênese" },
];

const DASH_BAZAR: { Icon: LucideIcon; name: string; category: string; price: string; desc: string }[] = [
  { Icon: BookOpen,  name: "O Livro dos Espíritos",              category: "Livro",     price: "R$ 35,00", desc: "Allan Kardec · Edição FEB" },
  { Icon: BookMarked, name: "O Evangelho segundo o Espiritismo", category: "Livro",     price: "R$ 30,00", desc: "Allan Kardec · Edição FEB" },
  { Icon: Shirt,     name: "Calça",                              category: "Vestuário", price: "R$ 45,00", desc: "Tamanho M · boa conservação" },
  { Icon: Shirt,     name: "Camisa",                             category: "Vestuário", price: "R$ 20,00", desc: "Tamanho G · algodão" },
  { Icon: Shirt,     name: "Blusa",                              category: "Vestuário", price: "R$ 25,00", desc: "Tamanho P · malha" },
  { Icon: Footprints, name: "Sapato",                            category: "Calçado",   price: "R$ 30,00", desc: "Nº 38 · couro sintético" },
];

type DashStatus = "disponivel" | "breve" | "beta";

interface DashFeatureItem {
  Icon: LucideIcon;
  title: string;
  desc: string;
  status: DashStatus;
  casa?: boolean;
  href?: string;
}

interface DashFeatureCategory {
  label: string;
  SectionIcon: LucideIcon;
  color: string;
  iconColor: string;
  bg: string;
  border: string;
  borderB: string;
  items: DashFeatureItem[];
}

const DASH_FEATURES: DashFeatureCategory[] = [
  {
    label: "Vida Espiritual",
    SectionIcon: Flame,
    color: "text-violet-700",
    iconColor: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-200",
    borderB: "border-violet-200",
    items: [
      { Icon: PenLine,   title: "Artigos e Colunistas",    desc: "Textos escritos por membros da sua comunidade, com identificação do autor e da casa.", status: "breve", casa: true },
      { Icon: Music,     title: "Área de Músicas",         desc: "Playlists espíritas para recepção, hora do passe e estudo. Inclui a Rádio Rio de Janeiro no rodapé.", status: "breve" },
      { Icon: Guitar,    title: "Área de Cifras",          desc: "Cifras, partituras e letras de músicas espíritas enviadas pela comunidade.", status: "breve", casa: true },
      { Icon: Sprout,    title: "Evangelização Infantil",  desc: "Módulo escolar com recursos lúdicos, jogos e atividades para a formação das crianças.", status: "breve", casa: true },
      { Icon: Sparkles,  title: "Área de Jovens Espíritas", desc: "Conteúdo, eventos e comunidade exclusivos para jovens trabalhadores da vinha.", status: "breve", casa: true },
      { Icon: Gamepad2,  title: "Jogos Educativos",        desc: "Jogos sobre os livros da codificação espírita e atividades para todas as idades.", status: "disponivel", href: "/jogos/plante-a-semente" },
      { Icon: Cake,      title: "Aniversariantes do Mês",  desc: "Calendário de aniversários dos membros. Aparece em destaque no topo da home no mês do aniversário.", status: "breve", casa: true },
      { Icon: Clock,     title: "Plantão de Orações",      desc: "Membros se inscrevem em horários de oração coletiva à distância. Agenda semanal visível para todos.", status: "breve", casa: true },
    ],
  },
  {
    label: "Nossa Comunidade",
    SectionIcon: UsersRound,
    color: "text-cyan-700",
    iconColor: "text-cyan-700",
    bg: "bg-cyan-50",
    border: "border-cyan-200",
    borderB: "border-cyan-200",
    items: [
      { Icon: MessageCircle,  title: "Fórum de Apoio",                desc: "Espaço fraterno de perguntas, respostas e acolhimento espiritual entre membros.", status: "breve" },
      { Icon: Users,          title: "Comunicação em Grupos",         desc: "Grupos internos por tipo de atividade, semelhante a grupos de WhatsApp — dentro da plataforma.", status: "breve", casa: true },
      { Icon: HeartHandshake, title: "Localização de Voluntariado",   desc: "Matchmaking entre as habilidades dos membros and as necessidades da comunidade.", status: "breve", casa: true },
      { Icon: ShoppingBag,    title: "Bazar On-line",                 desc: "Livros, artesanatos e itens da comunidade com integração PIX para doações.", status: "breve", casa: true },
      { Icon: Car,            title: "Carona Solidária",              desc: "Membros com carro se disponibilizam para dar carona a quem precisa — da mesma casa ou de outra.", status: "breve" },
      { Icon: Truck,          title: "Entrega Solidária",             desc: "Voluntários se oferecem para entregar itens comprados no bazar — com agendamento e confirmação.", status: "breve", casa: true },
      { Icon: Megaphone,      title: "Mural de Avisos",               desc: "Quadro digital da casa. Presidentes e coordenadores publicam comunicados. Membros visualizam ao entrar.", status: "breve", casa: true },
      { Icon: FileHeart,      title: "Ficha de Atendimento Fraterno", desc: "Formulário confidencial para registro de pessoas atendidas. Acessível apenas pelo coordenador de assistência.", status: "breve", casa: true },
    ],
  },
  {
    label: "Agenda & Eventos",
    SectionIcon: CalendarCheck,
    color: "text-amber-700",
    iconColor: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    borderB: "border-amber-200",
    items: [
      { Icon: CalendarDays, title: "Agenda de Eventos e Reuniões", desc: "Calendário completo com confirmação de presença e relatório de presenças por membro.", status: "disponivel", casa: true, href: "/agenda" },
      { Icon: Cast,         title: "Live Streaming",               desc: "Transmissão ao vivo das palestras pelo celular — um transmite, todos acompanham.", status: "breve", casa: true },
      { Icon: Video,        title: "Google Meet",                  desc: "Videoconferências integradas à plataforma para reuniões remotas.", status: "breve" },
      { Icon: Film,          title: "Integração de Vídeos",          desc: "Palestras gravadas, arquivos em vídeo e integração com StreamYard.", status: "breve", casa: true },
      { Icon: ClipboardCheck, title: "Caderno de Presença Digital",  desc: "Membros marcam presença nas reuniões pelo celular com um toque. Coordenador vê relatório por reunião e por membro.", status: "disponivel", casa: true, href: "/agenda" },
      { Icon: CalendarRange,  title: "Escala de Trabalho",           desc: "Presidente ou coordenador monta a escala semanal e mensal de tarefeiros. Cada membro vê sua escala pelo celular.", status: "breve", casa: true },
    ],
  },
  {
    label: "Recursos & Ferramentas",
    SectionIcon: Wrench,
    color: "text-emerald-700",
    iconColor: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    borderB: "border-emerald-200",
    items: [
      { Icon: MonitorPlay, title: "Player de PowerPoint",  desc: "Apresente arquivos de PowerPoint diretamente na plataforma, sem instalações.", status: "breve" },
      { Icon: CircleHelp,  title: "FAQ",                   desc: "Perguntas e respostas detalhadas sobre o uso do site e a doutrina espírita.", status: "disponivel", href: "/ajuda" },
    ],
  },
];

const STATUS_LABEL: Record<DashStatus, string> = {
  disponivel: "Disponível",
  breve: "Em breve",
  beta: "Beta",
};
const STATUS_STYLE: Record<DashStatus, string> = {
  disponivel: "bg-emerald-100 text-emerald-700 border-emerald-200",
  breve: "bg-amber-50 text-amber-600 border-amber-200",
  beta: "bg-blue-50 text-blue-600 border-blue-200",
};

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
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  /* UI */
  const [aba, setAba] = useState<Aba>("mural");
  const [modoAdmin, setModoAdmin] = useState(false);

  useEffect(() => {
    if (!loading && user && profile) {
      if (profile.sigla_casa === sigla) {
        setAba("painel");
      } else {
        setAba("mural");
      }
    }
  }, [loading, user, profile, sigla]);

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

  /* Admin panel */
  const [showAdmins, setShowAdmins] = useState(false);

  /* Utils */
  const [salvando, setSalvando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  /* Dashboard State */
  const [todayMsg, setTodayMsg] = useState<DashTodayMsg | null>(null);
  const [votes, setVotes] = useState<Record<string, { count: number; votedByMe: boolean }>>({});
  const [votingKey, setVotingKey] = useState<string | null>(null);
  const [agendaEventos, setAgendaEventos] = useState<DashAgendaEvento[]>([]);
  const [membrosCount, setMembrosCount] = useState<number | undefined>(undefined);
  const [eventosCount, setEventosCount] = useState<number | undefined>(undefined);


  /* ── Admin check ── */
  const isAdmin = !loading && !!user && !!profile && (
    profile.cargo_principal === "DEV" ||
    (profile.sigla_casa === sigla && (
      profile.cargo_principal === "Presidente" ||
      profile.cargo_principal === "Vice-presidente"
    )) ||
    adminIds.includes(user.id)
  );

  const isSameCasa = profile?.sigla_casa === sigla;

  /* ── Auth guard ── */
  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
    if (!loading && user && (!profile?.sigla_casa || !profile?.nome || !profile?.cargo_principal || !profile?.uf || !profile?.cidade)) {
      navigate({ to: "/completar-perfil" });
    }
  }, [user, profile, loading, navigate]);

  /* ── Load data ── */
  const carregar = useCallback(async () => {
    setCarregando(true);
    const [pRes, posRes, aRes, evRes, mCountRes, eCountRes] = await Promise.all([
      supabase.from("paginas_casas").select("*").eq("sigla_casa", sigla).maybeSingle(),
      supabase.from("publicacoes_casa").select("*").eq("sigla_casa", sigla)
        .order("fixado", { ascending: false }).order("created_at", { ascending: false }),
      supabase.from("administradores_pagina").select("user_id").eq("sigla_casa", sigla),
      supabase.from("programacao_eventos").select("*").eq("sigla_casa", sigla)
        .order("data_evento", { ascending: true }).order("hora_inicio", { ascending: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("sigla_casa", sigla),
      supabase.from("programacao_eventos").select("id", { count: "exact", head: true })
        .eq("sigla_casa", sigla)
        .gte("data_evento", new Date().toISOString().slice(0, 10)),
    ]);
    if (pRes.data) setPagina(pRes.data as PaginaData);
    if (posRes.data) setPosts(posRes.data as Post[]);
    if (aRes.data) setAdminIds(aRes.data.map((a: { user_id: string }) => a.user_id));
    if (evRes.data) setEventos(evRes.data as Evento[]);
    if (mCountRes.count !== null) setMembrosCount(mCountRes.count);
    if (eCountRes.count !== null) setEventosCount(eCountRes.count);
    setCarregando(false);
  }, [sigla]);


  useEffect(() => {
    if (!loading && user) carregar();
  }, [loading, user, carregar]);

  const fetchAgenda = useCallback(async () => {
    if (!user || !profile?.sigla_casa) return;
    const hojeStr = new Date().toISOString().slice(0, 10);
    const { data } = await supabase
      .from("agenda_eventos")
      .select("id, titulo, data_inicio, data_fim, tipo, aceita_confirmacao, agenda_participantes(id, user_id, confirmado)")
      .eq("sigla_casa", profile.sigla_casa)
      .gte("data_inicio", hojeStr)
      .order("data_inicio", { ascending: true })
      .limit(10);
    setAgendaEventos((data as DashAgendaEvento[]) ?? []);
  }, [user, profile?.sigla_casa]);

  const handleConfirmarEvento = useCallback(async (eventoId: string) => {
    if (!user) return;
    await supabase.from("agenda_participantes").upsert(
      { evento_id: eventoId, user_id: user.id, confirmado: true },
      { onConflict: "evento_id,user_id" }
    );
    fetchAgenda();
  }, [user, fetchAgenda]);

  const handleResponderConvite = useCallback(async (participanteId: string, confirmado: boolean) => {
    await supabase.from("agenda_participantes").update({ confirmado }).eq("id", participanteId);
    fetchAgenda();
  }, [fetchAgenda]);

  const fetchVotes = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("painel_votes").select("item_key, user_id");
    if (!data) return;
    const map: Record<string, { count: number; votedByMe: boolean }> = {};
    for (const row of data) {
      if (!map[row.item_key]) map[row.item_key] = { count: 0, votedByMe: false };
      map[row.item_key].count++;
      if (row.user_id === user.id) map[row.item_key].votedByMe = true;
    }
    setVotes(map);
  }, [user]);

  const handleCardVote = useCallback(async (title: string) => {
    if (!user) return;
    const key = title.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 80);
    if (votingKey === key || votes[key]?.votedByMe) return;
    setVotingKey(key);
    try {
      await supabase.from("painel_votes").insert({ item_key: key, user_id: user.id });
      setVotes((v) => ({ ...v, [key]: { count: (v[key]?.count ?? 0) + 1, votedByMe: true } }));
    } finally {
      setVotingKey(null);
    }
  }, [user, votes, votingKey]);

  useEffect(() => {
    if (user && profile?.sigla_casa && sigla === profile.sigla_casa) {
      fetchAgenda();
      fetchVotes();
      
      const todayStr = new Date().toISOString().slice(0, 10);
      supabase
        .from("mensagens_do_dia")
        .select("texto, referencia, autor_nome, sigla_casa")
        .eq("data_exibicao", todayStr)
        .eq("aprovada", true)
        .single()
        .then(({ data }) => { if (data) setTodayMsg(data); });
    }
  }, [user, profile?.sigla_casa, sigla, fetchAgenda, fetchVotes]);

  /* ── Load membros (lazy) ── */
  const garantirMembros = useCallback(async () => {
    if (membrosCarregados.current) return;
    const { data } = await supabase.from("profiles").select("id, nome")
      .eq("sigla_casa", sigla).order("nome");
    if (data) setMembros(data as Membro[]);
    membrosCarregados.current = true;
  }, [sigla]);

  /* ── Load participants for an event ── */
  const carregarParticipantes = useCallback(async (eventoId: string) => {
    if (evParts[eventoId]) return;
    const { data: parts } = await supabase.from("programacao_participantes")
      .select("evento_id, user_id, status").eq("evento_id", eventoId);
    if (!parts) return;
    const ids = parts.map(p => p.user_id);
    let nomes: Record<string, string> = {};
    if (ids.length > 0) {
      const { data: profs } = await supabase.from("profiles").select("id, nome").in("id", ids);
      profs?.forEach((p: { id: string; nome: string }) => { nomes[p.id] = p.nome; });
    }
    setEvParts(prev => ({
      ...prev,
      [eventoId]: parts.map(p => ({ ...p, nome: nomes[p.user_id] || "Membro" })) as EvParticipante[],
    }));
  }, [evParts]);

  /* ═══════════════════════════════════════════════
     ACTIONS — MURAL
  ═══════════════════════════════════════════════ */

  const publicarPost = async () => {
    if (!formNovoPost.conteudo.trim()) return;
    const { data, error } = await supabase.from("publicacoes_casa").insert({
      sigla_casa: sigla,
      autor_id: user!.id,
      autor_nome: profile?.nome || "Membro",
      conteudo: formNovoPost.conteudo.trim(),
      imagem_url: formNovoPost.imagem_url.trim() || null,
      video_url: formNovoPost.video_url.trim() || null,
      fixado: false,
    }).select().single();
    if (error || !data) { toast.error("Erro ao publicar."); return; }
    setPosts(prev => [data as Post, ...prev.filter(p => !p.fixado)].concat(prev.filter(p => p.fixado)));
    setPosts(prev => { const n = data as Post; return [n, ...prev.filter(p => p.fixado)].concat(prev.filter(p => !p.fixado)); });
    setPosts(prev => {
      const novo = data as Post;
      const fixados = prev.filter(p => p.fixado);
      const normais = prev.filter(p => !p.fixado);
      return [...fixados, novo, ...normais];
    });
    setFormNovoPost(FORM_POST_INICIAL);
    setShowNovoPost(false);
    toast.success("Publicado no mural.");
  };

  const iniciarEdicaoPost = (post: Post) => {
    setEditandoPostId(post.id);
    setFormEditPost({ conteudo: post.conteudo, imagem_url: post.imagem_url || "", video_url: post.video_url || "" });
  };

  const salvarEdicaoPost = async (id: string) => {
    const { error } = await supabase.from("publicacoes_casa").update({
      conteudo: formEditPost.conteudo.trim(),
      imagem_url: formEditPost.imagem_url.trim() || null,
      video_url: formEditPost.video_url.trim() || null,
      editado_em: new Date().toISOString(),
    }).eq("id", id);
    if (error) { toast.error("Erro ao salvar."); return; }
    setPosts(prev => prev.map(p => p.id === id ? {
      ...p, conteudo: formEditPost.conteudo.trim(),
      imagem_url: formEditPost.imagem_url.trim() || null,
      video_url: formEditPost.video_url.trim() || null,
      editado_em: new Date().toISOString(),
    } : p));
    setEditandoPostId(null);
    toast.success("Publicação atualizada.");
  };

  const excluirPost = async (id: string) => {
    await supabase.from("publicacoes_casa").delete().eq("id", id);
    setPosts(prev => prev.filter(p => p.id !== id));
    toast.success("Publicação removida.");
  };

  const toggleFixar = async (post: Post) => {
    const { error } = await supabase.from("publicacoes_casa")
      .update({ fixado: !post.fixado }).eq("id", post.id);
    if (error) return;
    setPosts(prev => {
      const list = prev.map(p => p.id === post.id ? { ...p, fixado: !p.fixado } : p);
      return [...list.filter(p => p.fixado), ...list.filter(p => !p.fixado)];
    });
  };

  /* ═══════════════════════════════════════════════
     ACTIONS — SOBRE
  ═══════════════════════════════════════════════ */

  const salvarSobre = async () => {
    setSalvando(true);
    const { error } = await supabase.from("paginas_casas").update({ ...formSobre }).eq("sigla_casa", sigla);
    setSalvando(false);
    if (error) { toast.error("Erro ao salvar."); return; }
    setPagina(prev => prev ? { ...prev, ...formSobre } : prev);
    setEditSobre(false);
    toast.success("Página atualizada.");
  };

  /* ═══════════════════════════════════════════════
     ACTIONS — PROGRAMAÇÃO / HORÁRIOS
  ═══════════════════════════════════════════════ */

  const adicionarHorario = async () => {
    if (!novoHorario.hora || !novoHorario.atividade.trim()) { toast.error("Preencha horário e atividade."); return; }
    const updated = [...(pagina!.horarios ?? []), { ...novoHorario }];
    const { error } = await supabase.from("paginas_casas").update({ horarios: updated }).eq("sigla_casa", sigla);
    if (error) { toast.error("Erro ao salvar."); return; }
    setPagina(prev => prev ? { ...prev, horarios: updated } : prev);
    setNovoHorario({ dia: DIAS[0], hora: "", atividade: "" });
    setShowNovoHorario(false);
  };

  const removerHorario = async (idx: number) => {
    const updated = (pagina!.horarios ?? []).filter((_, i) => i !== idx);
    const { error } = await supabase.from("paginas_casas").update({ horarios: updated }).eq("sigla_casa", sigla);
    if (error) { toast.error("Erro ao remover."); return; }
    setPagina(prev => prev ? { ...prev, horarios: updated } : prev);
  };

  /* ═══════════════════════════════════════════════
     ACTIONS — PROGRAMAÇÃO / EVENTOS
  ═══════════════════════════════════════════════ */

  const criarEvento = async () => {
    if (!formNovoEvento.titulo.trim() || !formNovoEvento.data_evento) { toast.error("Título e data são obrigatórios."); return; }
    const { data, error } = await supabase.from("programacao_eventos").insert({
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
    }).select().single();
    if (error || !data) { toast.error("Erro ao criar evento."); return; }
    setEventos(prev => [...prev, data as Evento].sort((a, b) => a.data_evento.localeCompare(b.data_evento)));
    setFormNovoEvento(FORM_EVENTO_INICIAL);
    setShowNovoEvento(false);
    toast.success("Evento criado.");
  };

  const salvarEdicaoEvento = async (id: string) => {
    if (!formEditEvento.titulo.trim() || !formEditEvento.data_evento) { toast.error("Título e data obrigatórios."); return; }
    const { error } = await supabase.from("programacao_eventos").update({
      titulo: formEditEvento.titulo.trim(),
      descricao: formEditEvento.descricao.trim() || null,
      data_evento: formEditEvento.data_evento,
      hora_inicio: formEditEvento.hora_inicio || null,
      hora_fim: formEditEvento.hora_fim || null,
      local_evento: formEditEvento.local_evento.trim() || null,
      publica: formEditEvento.publica,
    }).eq("id", id);
    if (error) { toast.error("Erro ao salvar."); return; }
    setEventos(prev => prev.map(e => e.id === id ? { ...e,
      titulo: formEditEvento.titulo.trim(),
      descricao: formEditEvento.descricao.trim() || null,
      data_evento: formEditEvento.data_evento,
      hora_inicio: formEditEvento.hora_inicio || null,
      hora_fim: formEditEvento.hora_fim || null,
      local_evento: formEditEvento.local_evento.trim() || null,
      publica: formEditEvento.publica,
    } : e).sort((a, b) => a.data_evento.localeCompare(b.data_evento)));
    setEditandoEventoId(null);
    toast.success("Evento atualizado.");
  };

  const excluirEvento = async (id: string) => {
    await supabase.from("programacao_eventos").delete().eq("id", id);
    setEventos(prev => prev.filter(e => e.id !== id));
    setEvParts(prev => { const n = { ...prev }; delete n[id]; return n; });
    if (eventoExpandido === id) setEventoExpandido(null);
    toast.success("Evento removido.");
  };

  const adicionarParticipante = async (eventoId: string, membroId: string) => {
    if (evParts[eventoId]?.find(p => p.user_id === membroId)) return;
    const { error } = await supabase.from("programacao_participantes").insert({
      evento_id: eventoId, user_id: membroId, status: "convidado", adicionado_por: user!.id,
    });
    if (error) { toast.error("Erro."); return; }
    const m = membros.find(m => m.id === membroId);
    setEvParts(prev => ({ ...prev, [eventoId]: [...(prev[eventoId] || []), { evento_id: eventoId, user_id: membroId, status: "convidado", nome: m?.nome }] }));
    toast.success("Participante adicionado.");
  };

  const removerParticipante = async (eventoId: string, userId: string) => {
    await supabase.from("programacao_participantes").delete().eq("evento_id", eventoId).eq("user_id", userId);
    setEvParts(prev => ({ ...prev, [eventoId]: prev[eventoId]?.filter(p => p.user_id !== userId) || [] }));
  };

  const confirmarPresenca = async (eventoId: string, status: "confirmado" | "recusou") => {
    const { error } = await supabase.from("programacao_participantes")
      .update({ status }).eq("evento_id", eventoId).eq("user_id", user!.id);
    if (error) { toast.error("Erro."); return; }
    setEvParts(prev => ({ ...prev, [eventoId]: prev[eventoId]?.map(p => p.user_id === user!.id ? { ...p, status } : p) || [] }));
    toast.success(status === "confirmado" ? "Presenca confirmada!" : "Participacao recusada.");
  };

  /* ═══════════════════════════════════════════════
     ACTIONS — DOAÇÕES
  ═══════════════════════════════════════════════ */

  const salvarDoacoes = async () => {
    setSalvando(true);
    const { error } = await supabase.from("paginas_casas").update({ ...formDoacoes }).eq("sigla_casa", sigla);
    setSalvando(false);
    if (error) { toast.error("Erro ao salvar."); return; }
    setPagina(prev => prev ? { ...prev, ...formDoacoes } : prev);
    setEditDoacoes(false);
    toast.success("Doações atualizadas.");
  };

  /* ═══════════════════════════════════════════════
     ACTIONS — ADMINS
  ═══════════════════════════════════════════════ */

  const adicionarAdmin = async (membroId: string) => {
    if (adminIds.includes(membroId)) return;
    const { error } = await supabase.from("administradores_pagina")
      .insert({ sigla_casa: sigla, user_id: membroId, adicionado_por: user!.id });
    if (error) { toast.error("Erro."); return; }
    setAdminIds(prev => [...prev, membroId]);
    toast.success("Administrador adicionado.");
  };

  const removerAdmin = async (membroId: string) => {
    await supabase.from("administradores_pagina").delete().eq("sigla_casa", sigla).eq("user_id", membroId);
    setAdminIds(prev => prev.filter(id => id !== membroId));
    toast.success("Administrador removido.");
  };

  const copiarPix = () => {
    navigator.clipboard.writeText(pagina!.chave_pix);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  /* ── Early returns ── */
  if (loading || !user) return null;
  if (carregando) return (
    <main className="page-light min-h-screen pt-20 pb-20 flex items-center justify-center">
      <p className="text-sm text-muted-foreground">Carregando...</p>
    </main>
  );

  /* ── Page not created ── */
  if (!pagina) {
    const podeInicializar = profile?.cargo_principal === "DEV" ||
      (profile?.sigla_casa === sigla && (
        profile.cargo_principal === "Presidente" || profile.cargo_principal === "Vice-presidente"
      ));
    return (
      <main className="page-light min-h-screen pt-20 pb-20 flex items-center justify-center px-4">
        <div className="glass rounded-3xl p-10 max-w-md text-center space-y-5">
          <Building2 size={40} strokeWidth={1} className="text-muted-foreground/30 mx-auto" />
          <div>
            <h1 className="text-lg font-medium text-foreground">{sigla}</h1>
            <p className="text-sm text-muted-foreground/70 font-light mt-1">Esta casa espírita ainda não tem uma página criada.</p>
          </div>
          {podeInicializar ? (
            <button onClick={async () => {
              const { error } = await supabase.from("paginas_casas").insert({
                sigla_casa: sigla, nome_completo: "", descricao: "", missao: "",
                endereco: "", bairro: profile?.bairro ?? "", cidade: profile?.cidade ?? "",
                uf: profile?.uf ?? "", cep: "", telefone: "", email_contato: "", site: "",
                horarios: [], chave_pix: "",
                texto_doacao: "Sua contribuição ajuda a manter os trabalhos espíritas. Qualquer valor é bem-vindo. Gratidão.",
                publicada: true,
              });
              if (!error) carregar(); else toast.error("Erro ao criar página.");
            }} className="w-full py-3 rounded-xl text-sm uppercase tracking-widest text-cyan-glow border border-cyan-glow/40 hover:bg-cyan-glow/10 transition-colors">
              Criar página desta casa
            </button>
          ) : (
            <p className="text-xs text-muted-foreground/50">Somente o Presidente pode criar a página.</p>
          )}
          <Link to="/inicio" className="block text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors">
            ← Voltar ao início
          </Link>
        </div>
      </main>
    );
  }

  /* ── Filter visible events ── */
  const hoje = startOfDay(new Date());
  const eventosVisiveis = eventos.filter(e =>
    e.publica || isSameCasa || isAdmin ||
    evParts[e.id]?.some(p => p.user_id === user.id)
  );
  const eventosProximos = eventosVisiveis.filter(e => !isAfter(hoje, parseISO(e.data_evento)));
  const eventosPassados = eventosVisiveis.filter(e => isAfter(hoje, parseISO(e.data_evento)));

  /* ══════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════ */
  return (
    <main className="page-light min-h-screen pt-14 pb-20">

      {/* Premium Hero with espectacular destaque for the name */}
      <CasaHero membros={membrosCount} eventos={eventosCount} />

      <div className="mx-auto max-w-4xl px-4">

        {/* Option to toggle administration mode */}
        {isAdmin && (
          <div className="flex justify-end mb-4 pt-4">
            <button
              onClick={() => setModoAdmin(m => !m)}
              className={`flex items-center gap-2 text-xs uppercase tracking-widest px-4 py-2 rounded-xl border transition-colors ${
                modoAdmin ? "border-amber-400/60 text-amber-600 bg-amber-50" : "border-white/20 text-muted-foreground/60 hover:border-cyan-glow/40 hover:text-cyan-glow"
              }`}
            >
              <Shield size={13} />
              {modoAdmin ? "Visitante" : "Administrar"}
            </button>
          </div>
        )}


        {/* ── Tabs ── */}
        <div className="flex gap-0.5 border-b border-white/10 mb-6 overflow-x-auto">
          {([
            ...(isSameCasa ? [{ id: "painel", label: "Painel", Icon: LayoutDashboard }] : []),
            { id: "mural",       label: "Mural",       Icon: MessageSquare },
            { id: "sobre",       label: "Sobre",        Icon: Info },
            { id: "programacao", label: "Programação",  Icon: Calendar },
            { id: "projetos",    label: "Projetos",     Icon: ClipboardList },
            { id: "doacoes",     label: "Doações",      Icon: Heart },
          ] as { id: Aba; label: string; Icon: LucideIcon }[]).map(t => (
            <button key={t.id} onClick={() => setAba(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-light whitespace-nowrap border-b-2 transition-colors ${
                aba === t.id ? "border-cyan-glow text-cyan-glow" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.Icon size={13} strokeWidth={1.8} />{t.label}
            </button>
          ))}
        </div>

        {/* ══════════════ PAINEL ══════════════ */}
        {aba === "painel" && isSameCasa && (
          <div className="space-y-8 animate-fade-in-up" style={{ animationDuration: '400ms' }}>
            
            {/* Boas-vindas */}
            <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-violet-600 mb-1 font-semibold">
                  {new Date().getHours() < 12 ? "Bom dia" : new Date().getHours() < 18 ? "Boa tarde" : "Boa noite"}, irmão
                </p>
                <h2 className="text-3xl font-light tracking-tight text-foreground">
                  Olá, <span className="font-medium text-gradient-aurora">{profile?.nome?.split(" ")[0]}</span>
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

            {/* Mensagem do Dia */}
            <div
              className="relative rounded-3xl overflow-hidden border border-violet-200/60 shadow-lg"
              style={{ background: "linear-gradient(135deg, oklch(0.985 0.01 295) 0%, oklch(0.965 0.01 260) 100%)" }}
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-violet-300/10 to-cyan-300/10 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-gradient-to-tr from-cyan-300/10 to-violet-300/10 blur-3xl pointer-events-none" />

              <div className="relative px-6 py-6 md:px-10 md:py-8 flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="shrink-0 w-12 h-12 rounded-2xl bg-violet-100 border border-violet-200/50 flex items-center justify-center shadow-inner">
                  <Star size={22} strokeWidth={1.5} className="text-violet-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-[0.35em] text-violet-600 font-semibold mb-2">Mensagem do Dia</p>
                  {todayMsg ? (
                    <>
                      <blockquote className="text-lg md:text-xl font-serif font-light text-gray-800 leading-relaxed italic pr-4">
                        "{todayMsg.texto}"
                      </blockquote>
                      {todayMsg.referencia && (
                        <p className="mt-2 text-sm text-gray-500 font-light italic">— {todayMsg.referencia}</p>
                      )}
                      <div className="mt-3 flex items-center gap-3 flex-wrap">
                        <span className="text-xs font-medium text-violet-700">{todayMsg.autor_nome}</span>
                        {todayMsg.sigla_casa && (
                          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 bg-white/80 border border-violet-100/50 px-2.5 py-0.5 rounded-full">
                            {todayMsg.sigla_casa}
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <blockquote className="text-lg md:text-xl font-serif font-light text-gray-800 leading-relaxed italic pr-4">
                        "{DAILY_MESSAGES[Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000) % DAILY_MESSAGES.length].text}"
                      </blockquote>
                      <p className="mt-2 text-sm text-gray-500 font-light italic">
                        — {DAILY_MESSAGES[Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000) % DAILY_MESSAGES.length].author}
                      </p>
                    </>
                  )}
                </div>
              </div>
              <div className="px-6 py-4 md:px-10 flex items-center gap-5 border-t border-violet-100/40 pt-3 bg-white/20">
                <Link
                  to="/mensagem-do-dia"
                  className="text-xs font-semibold text-violet-700 hover:text-violet-900 transition-colors uppercase tracking-widest"
                >
                  Enviar mensagem
                </Link>
                <Link
                  to="/mensagem-do-dia"
                  search={{ tab: "fila" }}
                  className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-widest"
                >
                  Ver fila
                </Link>
              </div>
            </div>

            {/* Próximos Eventos */}
            {agendaEventos.length > 0 && (
              <section className="mt-8">
                <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-amber-200">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                      <CalendarDays size={18} strokeWidth={1.5} className="text-amber-600" />
                    </div>
                    <h3 className="text-sm font-semibold text-amber-700 tracking-wide">Próximos Eventos da Casa</h3>
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
                      const p = e.agenda_participantes.find((p) => p.user_id === user.id);
                      return p?.confirmado === null || (!p && e.tipo === "aberto" && e.aceita_confirmacao);
                    }),
                    ...agendaEventos.filter((e) => {
                      const p = e.agenda_participantes.find((p) => p.user_id === user.id);
                      return p?.confirmado === true;
                    }),
                  ].map((evento) => {
                    const minha = evento.agenda_participantes.find((p) => p.user_id === user.id);
                    const pendente = minha?.confirmado === null;
                    const confirmado = minha?.confirmado === true;
                    const abertoPendente = evento.tipo === "aberto" && !minha && evento.aceita_confirmacao;
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
                            {new Date(evento.data_inicio).toLocaleDateString("pt-BR", { month: "short" })}
                          </p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{evento.titulo}</p>
                          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
                            <Clock size={10} className="text-gray-400" />
                            <span className="font-light">{new Date(evento.data_inicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                            {pendente && <span className="text-amber-600 font-semibold animate-pulse">· Aguardando resposta</span>}
                            {confirmado && <span className="text-emerald-600 font-medium">· Confirmado</span>}
                            {abertoPendente && <span className="text-cyan-600 font-medium">· Confirmar presença</span>}
                          </p>
                        </div>
                        {(pendente || abertoPendente) && (
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => pendente ? handleResponderConvite(minha!.id, true) : handleConfirmarEvento(evento.id)}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
                <DashDashCard
                  Icon={BarChart3}
                  title="Meu Painel Pessoal"
                  desc="Resumo das suas atividades, frequência e dados relevantes ao seu papel na casa espírita."
                  status="breve"
                  accent="slate"
                  votes={votes}
                  votingKey={votingKey}
                  onVote={handleCardVote}
                />
                <DashDashCard
                  Icon={ClipboardList}
                  title="Acompanhamento do Projeto"
                  desc="Veja o progresso da plataforma, as novidades recentes e solicite novos recursos ao desenvolvedor."
                  status="disponivel"
                  accent="slate"
                  href="/painel"
                  votes={votes}
                  votingKey={votingKey}
                  onVote={handleCardVote}
                />
                <DashDashCard
                  Icon={Wallet}
                  title="Tesouraria"
                  desc="Registro de receitas e despesas, saldo mensal, exportação em Excel (.xlsx) e impressão formatada."
                  status="disponivel"
                  accent="amber"
                  casa
                  href="/tesouraria"
                  votes={votes}
                  votingKey={votingKey}
                  onVote={handleCardVote}
                />
                <DashDashCard
                  Icon={ClipboardCheck}
                  title="Projetos"
                  desc="Planeje e organize projetos, ideias, tarefas e reuniões da casa espírita."
                  status="disponivel"
                  accent="cyan"
                  onClick={() => setAba("projetos")}
                  votes={votes}
                  votingKey={votingKey}
                  onVote={handleCardVote}
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
                  onVote={handleCardVote}
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
                      votes={votes}
                      votingKey={votingKey}
                      onVote={handleCardVote}
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
                <span className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Disponível
                </span>
                <span className="text-xs text-muted-foreground/50 bg-white/60 border border-border px-2 py-0.5 rounded-full">
                  Por casa espírita
                </span>
              </DashSectionHeader>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {DASH_BAZAR.map((item) => (
                  <DashBazarCard key={item.name} item={item} />
                ))}
              </div>
              <p className="mt-3 text-xs text-center text-muted-foreground/50">
                Itens de exemplo · Cada casa espírita gerenciará seu próprio bazar
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
                  <button onClick={() => setShowNovoPost(true)}
                    className="flex items-center gap-2 text-sm text-muted-foreground/60 hover:text-cyan-glow transition-colors">
                    <Plus size={15} />Nova publicação no mural
                  </button>
                ) : (
                  <PostForm
                    form={formNovoPost}
                    onChange={setFormNovoPost}
                    onCancel={() => { setShowNovoPost(false); setFormNovoPost(FORM_POST_INICIAL); }}
                    onSubmit={publicarPost}
                    submitLabel="Publicar"
                  />
                )}
              </div>
            )}

            {/* Lista de posts */}
            {posts.length === 0 ? (
              <div className="glass rounded-2xl p-10 text-center">
                <MessageSquare size={32} strokeWidth={1} className="text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground/50">Nenhuma publicação no mural ainda.</p>
              </div>
            ) : posts.map(post => (
              <article key={post.id} className={`glass rounded-2xl overflow-hidden ${post.fixado ? "border border-amber-200/50" : ""}`}>
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
                        <Pin size={11} />Fixado
                      </div>
                    )}
                    <p className="text-sm text-foreground font-light leading-relaxed whitespace-pre-wrap">{post.conteudo}</p>

                    {/* Imagem */}
                    {post.imagem_url && (
                      <img
                        src={post.imagem_url} alt=""
                        className="w-full rounded-xl max-h-96 object-cover border border-white/10"
                        onError={e => (e.currentTarget.style.display = "none")}
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
                        <span>{format(new Date(post.created_at), "d 'de' MMM 'de' yyyy", { locale: ptBR })}</span>
                        {post.editado_em && <span className="italic">· editado</span>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Editar: autor OU admin */}
                        {(modoAdmin || post.autor_id === user?.id) && (
                          <button onClick={() => iniciarEdicaoPost(post)} title="Editar"
                            className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-cyan-glow hover:bg-cyan-50 transition-colors">
                            <Edit3 size={14} />
                          </button>
                        )}
                        {modoAdmin && (
                          <>
                            <button onClick={() => toggleFixar(post)} title={post.fixado ? "Desafixar" : "Fixar no topo"}
                              className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-amber-500 hover:bg-amber-50 transition-colors">
                              {post.fixado ? <PinOff size={14} /> : <Pin size={14} />}
                            </button>
                            <button onClick={() => excluirPost(post.id)} title="Excluir"
                              className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-red-500 hover:bg-red-50 transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}

        {/* ══════════════ SOBRE ══════════════ */}
        {aba === "sobre" && (
          <div className="space-y-4">
            {modoAdmin && !editSobre && (
              <div className="flex justify-end">
                <button onClick={() => { setFormSobre({ ...pagina }); setEditSobre(true); }}
                  className="flex items-center gap-2 text-xs uppercase tracking-widest text-cyan-glow border border-cyan-glow/30 px-4 py-2 rounded-xl hover:bg-cyan-glow/10 transition-colors">
                  <Edit3 size={13} />Editar informações
                </button>
              </div>
            )}

            {editSobre ? (
              <div className="glass rounded-2xl p-6 space-y-5">
                <h2 className="text-sm font-medium text-foreground">Editar informações da casa</h2>
                <Field label="Nome completo da casa">
                  <input value={formSobre.nome_completo ?? ""} onChange={e => setFormSobre(s => ({ ...s, nome_completo: e.target.value }))} placeholder="Ex.: Centro Espírita Paz e Amor" className={inputCls} />
                </Field>
                <Field label="Descrição">
                  <textarea value={formSobre.descricao ?? ""} onChange={e => setFormSobre(s => ({ ...s, descricao: e.target.value }))} rows={3} placeholder="Apresentação da casa…" className={`${inputCls} resize-none`} />
                </Field>
                <Field label="Missão">
                  <textarea value={formSobre.missao ?? ""} onChange={e => setFormSobre(s => ({ ...s, missao: e.target.value }))} rows={2} placeholder="Missão e valores…" className={`${inputCls} resize-none`} />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Ano de fundação">
                    <input type="number" value={formSobre.ano_fundacao ?? ""} onChange={e => setFormSobre(s => ({ ...s, ano_fundacao: e.target.value ? +e.target.value : null }))} placeholder="Ex.: 1985" className={inputCls} />
                  </Field>
                  <Field label="CEP">
                    <input value={formSobre.cep ?? ""} onChange={e => setFormSobre(s => ({ ...s, cep: e.target.value }))} placeholder="00000-000" className={inputCls} />
                  </Field>
                </div>
                <Field label="Endereço">
                  <input value={formSobre.endereco ?? ""} onChange={e => setFormSobre(s => ({ ...s, endereco: e.target.value }))} placeholder="Rua, número…" className={inputCls} />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Bairro"><input value={formSobre.bairro ?? ""} onChange={e => setFormSobre(s => ({ ...s, bairro: e.target.value }))} placeholder="Bairro" className={inputCls} /></Field>
                  <Field label="Cidade"><input value={formSobre.cidade ?? ""} onChange={e => setFormSobre(s => ({ ...s, cidade: e.target.value }))} placeholder="Cidade" className={inputCls} /></Field>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="UF"><input value={formSobre.uf ?? ""} maxLength={2} onChange={e => setFormSobre(s => ({ ...s, uf: e.target.value.toUpperCase() }))} placeholder="SP" className={inputCls} /></Field>
                  <Field label="Telefone"><input value={formSobre.telefone ?? ""} onChange={e => setFormSobre(s => ({ ...s, telefone: e.target.value }))} placeholder="(11) 99999-9999" className={inputCls} /></Field>
                  <Field label="E-mail de contato"><input type="email" value={formSobre.email_contato ?? ""} onChange={e => setFormSobre(s => ({ ...s, email_contato: e.target.value }))} placeholder="contato@…" className={inputCls} /></Field>
                </div>
                <Field label="Site (opcional)"><input value={formSobre.site ?? ""} onChange={e => setFormSobre(s => ({ ...s, site: e.target.value }))} placeholder="https://…" className={inputCls} /></Field>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setEditSobre(false)} className="flex-1 py-2.5 rounded-xl text-xs text-muted-foreground border border-white/10 hover:bg-white/5 transition-colors">Cancelar</button>
                  <button onClick={salvarSobre} disabled={salvando} className="flex-1 py-2.5 rounded-xl text-xs uppercase tracking-widest text-cyan-glow border border-cyan-glow/40 hover:bg-cyan-glow/10 disabled:opacity-40 transition-colors flex items-center justify-center gap-2">
                    <Save size={13} />{salvando ? "Salvando…" : "Salvar"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {(pagina.descricao || pagina.missao) && (
                  <div className="glass rounded-2xl p-6 space-y-4">
                    {pagina.descricao && <div><p className={labelCls}>Sobre a casa</p><p className="text-sm text-foreground/80 font-light leading-relaxed">{pagina.descricao}</p></div>}
                    {pagina.missao && <div className="border-t border-white/10 pt-4"><p className={labelCls}>Missão</p><p className="text-sm text-foreground/80 font-light leading-relaxed">{pagina.missao}</p></div>}
                  </div>
                )}
                <div className="glass rounded-2xl p-6 space-y-4">
                  {pagina.ano_fundacao && <InfoRow Icon={Building2} label="Fundada em" value={String(pagina.ano_fundacao)} />}
                  {pagina.endereco && <InfoRow Icon={MapPin} label="Endereço" value={[pagina.endereco, pagina.bairro, pagina.cidade && `${pagina.cidade}/${pagina.uf}`, pagina.cep].filter(Boolean).join(", ")} />}
                  {pagina.telefone && <InfoRow Icon={Phone} label="Telefone" value={pagina.telefone} />}
                  {pagina.email_contato && <InfoRow Icon={Mail} label="E-mail" value={pagina.email_contato} />}
                  {pagina.site && <InfoRow Icon={Globe} label="Site" value={pagina.site} link />}
                  {!pagina.ano_fundacao && !pagina.endereco && !pagina.telefone && !pagina.email_contato && !pagina.site && !pagina.descricao && !pagina.missao && (
                    <p className="text-sm text-muted-foreground/50 text-center py-4">Nenhuma informação cadastrada ainda.{isAdmin && " Use 'Editar informações' para adicionar."}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════ PROGRAMAÇÃO ══════════════ */}
        {aba === "programacao" && (
          <div className="space-y-6">

            {/* ── Seção: Eventos ── */}
            <div className="glass rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarDays size={15} strokeWidth={1.5} className="text-cyan-glow" />
                  <span className="text-sm font-medium text-foreground">Eventos</span>
                </div>
                {modoAdmin && (
                  <button onClick={() => { setShowNovoEvento(s => !s); setFormNovoEvento(FORM_EVENTO_INICIAL); }}
                    className="flex items-center gap-1.5 text-xs text-cyan-glow hover:underline">
                    <Plus size={13} />Criar evento
                  </button>
                )}
              </div>

              {/* Formulário novo evento */}
              {modoAdmin && showNovoEvento && (
                <div className="px-6 py-5 border-b border-white/10 bg-cyan-50/20 space-y-4">
                  <EventoForm form={formNovoEvento} onChange={setFormNovoEvento}
                    onCancel={() => setShowNovoEvento(false)} onSubmit={criarEvento} submitLabel="Criar" />
                </div>
              )}

              {/* Lista de eventos próximos */}
              {eventosProximos.length === 0 && !showNovoEvento && (
                <div className="px-6 py-10 text-center">
                  <Calendar size={28} strokeWidth={1} className="text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground/50">Nenhum evento programado.</p>
                </div>
              )}

              <div className="divide-y divide-white/5">
                {eventosProximos.map(ev => (
                  <EventoCard key={ev.id} ev={ev} user={user} profile={profile}
                    isAdmin={modoAdmin} isSameCasa={isSameCasa}
                    participantes={evParts[ev.id]}
                    expandido={eventoExpandido === ev.id}
                    editando={editandoEventoId === ev.id}
                    formEdit={formEditEvento}
                    membros={membros}
                    addPartOpen={addPartEventoId === ev.id}
                    onToggleExpand={async () => {
                      const abrindo = eventoExpandido !== ev.id;
                      setEventoExpandido(abrindo ? ev.id : null);
                      setEditandoEventoId(null);
                      if (abrindo) { await carregarParticipantes(ev.id); await garantirMembros(); }
                    }}
                    onEdit={() => { setEditandoEventoId(ev.id); setFormEditEvento({ titulo: ev.titulo, descricao: ev.descricao || "", data_evento: ev.data_evento, hora_inicio: ev.hora_inicio || "", hora_fim: ev.hora_fim || "", local_evento: ev.local_evento || "", publica: ev.publica }); }}
                    onCancelEdit={() => setEditandoEventoId(null)}
                    onSaveEdit={() => salvarEdicaoEvento(ev.id)}
                    onChangeFormEdit={setFormEditEvento}
                    onDelete={() => excluirEvento(ev.id)}
                    onAddPart={membroId => adicionarParticipante(ev.id, membroId)}
                    onRemovePart={userId => removerParticipante(ev.id, userId)}
                    onToggleAddPart={() => { setAddPartEventoId(p => p === ev.id ? null : ev.id); garantirMembros(); }}
                    onConfirmar={status => confirmarPresenca(ev.id, status)}
                  />
                ))}
              </div>

              {/* Eventos passados */}
              {eventosPassados.length > 0 && (
                <details className="border-t border-white/10">
                  <summary className="px-6 py-3 text-xs text-muted-foreground/50 cursor-pointer hover:text-muted-foreground transition-colors select-none">
                    {eventosPassados.length} evento{eventosPassados.length > 1 ? "s" : ""} passado{eventosPassados.length > 1 ? "s" : ""}
                  </summary>
                  <div className="divide-y divide-white/5 opacity-60">
                    {eventosPassados.map(ev => (
                      <EventoCard key={ev.id} ev={ev} user={user} profile={profile}
                        isAdmin={modoAdmin} isSameCasa={isSameCasa}
                        participantes={evParts[ev.id]}
                        expandido={eventoExpandido === ev.id}
                        editando={editandoEventoId === ev.id}
                        formEdit={formEditEvento}
                        membros={membros}
                        addPartOpen={addPartEventoId === ev.id}
                        onToggleExpand={async () => {
                          const abrindo = eventoExpandido !== ev.id;
                          setEventoExpandido(abrindo ? ev.id : null);
                          setEditandoEventoId(null);
                          if (abrindo) { await carregarParticipantes(ev.id); await garantirMembros(); }
                        }}
                        onEdit={() => { setEditandoEventoId(ev.id); setFormEditEvento({ titulo: ev.titulo, descricao: ev.descricao || "", data_evento: ev.data_evento, hora_inicio: ev.hora_inicio || "", hora_fim: ev.hora_fim || "", local_evento: ev.local_evento || "", publica: ev.publica }); }}
                        onCancelEdit={() => setEditandoEventoId(null)}
                        onSaveEdit={() => salvarEdicaoEvento(ev.id)}
                        onChangeFormEdit={setFormEditEvento}
                        onDelete={() => excluirEvento(ev.id)}
                        onAddPart={membroId => adicionarParticipante(ev.id, membroId)}
                        onRemovePart={userId => removerParticipante(ev.id, userId)}
                        onToggleAddPart={() => { setAddPartEventoId(p => p === ev.id ? null : ev.id); garantirMembros(); }}
                        onConfirmar={status => confirmarPresenca(ev.id, status)}
                      />
                    ))}
                  </div>
                </details>
              )}
            </div>

            {/* ── Seção: Atividades Regulares ── */}
            <div className="glass rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock size={15} strokeWidth={1.5} className="text-cyan-glow" />
                  <span className="text-sm font-medium text-foreground">Atividades Regulares</span>
                </div>
                {modoAdmin && (
                  <button onClick={() => setShowNovoHorario(s => !s)}
                    className="flex items-center gap-1.5 text-xs text-cyan-glow hover:underline">
                    <Plus size={13} />Adicionar
                  </button>
                )}
              </div>

              {modoAdmin && showNovoHorario && (
                <div className="px-6 py-4 border-b border-white/10 bg-cyan-50/20 space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div><p className={labelCls}>Dia</p>
                      <select value={novoHorario.dia} onChange={e => setNovoHorario(h => ({ ...h, dia: e.target.value }))} className={inputCls}>
                        {DIAS.map(d => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                    <div><p className={labelCls}>Horário</p>
                      <input type="time" value={novoHorario.hora} onChange={e => setNovoHorario(h => ({ ...h, hora: e.target.value }))} className={inputCls} />
                    </div>
                    <div><p className={labelCls}>Atividade</p>
                      <input value={novoHorario.atividade} onChange={e => setNovoHorario(h => ({ ...h, atividade: e.target.value }))} placeholder="Ex.: Evangelização" className={inputCls} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowNovoHorario(false)} className="flex-1 py-2 rounded-xl text-xs text-muted-foreground border border-white/10 hover:bg-white/5 transition-colors">Cancelar</button>
                    <button onClick={adicionarHorario} className="flex-1 py-2 rounded-xl text-xs uppercase tracking-widest text-cyan-glow border border-cyan-glow/40 hover:bg-cyan-glow/10 transition-colors">Adicionar</button>
                  </div>
                </div>
              )}

              {(pagina.horarios ?? []).length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <p className="text-sm text-muted-foreground/50">Nenhuma atividade regular cadastrada.</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {(pagina.horarios ?? []).map((h, i) => (
                    <div key={i} className="flex items-center justify-between px-6 py-3 hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-medium text-cyan-glow w-24 shrink-0">{h.dia.slice(0, 3)}.</span>
                        <span className="text-xs font-mono text-muted-foreground/70 w-12 shrink-0">{h.hora}</span>
                        <span className="text-sm text-foreground/80 font-light">{h.atividade}</span>
                      </div>
                      {modoAdmin && (
                        <button onClick={() => removerHorario(i)} className="p-1.5 rounded-lg text-muted-foreground/30 hover:text-red-500 hover:bg-red-50 transition-colors">
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════ PROJETOS ══════════════ */}
        {aba === "projetos" && (
          <ProjetosTab sigla={sigla} />
        )}

        {/* ══════════════ DOAÇÕES ══════════════ */}
        {aba === "doacoes" && (
          <div className="space-y-4">
            {modoAdmin && !editDoacoes && (
              <div className="flex justify-end">
                <button onClick={() => { setFormDoacoes({ chave_pix: pagina.chave_pix, texto_doacao: pagina.texto_doacao }); setEditDoacoes(true); }}
                  className="flex items-center gap-2 text-xs uppercase tracking-widest text-cyan-glow border border-cyan-glow/30 px-4 py-2 rounded-xl hover:bg-cyan-glow/10 transition-colors">
                  <Edit3 size={13} />Editar doações
                </button>
              </div>
            )}

            {editDoacoes ? (
              <div className="glass rounded-2xl p-6 space-y-5">
                <h2 className="text-sm font-medium text-foreground">Configurar doações</h2>
                <Field label="Chave PIX">
                  <input value={formDoacoes.chave_pix} onChange={e => setFormDoacoes(f => ({ ...f, chave_pix: e.target.value }))} placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória" className={inputCls} />
                  <p className="text-xs text-muted-foreground/50 mt-1">O QR code é gerado automaticamente a partir da chave inserida.</p>
                </Field>
                <Field label="Texto de apresentação">
                  <textarea value={formDoacoes.texto_doacao} onChange={e => setFormDoacoes(f => ({ ...f, texto_doacao: e.target.value }))} rows={3} className={`${inputCls} resize-none`} />
                </Field>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setEditDoacoes(false)} className="flex-1 py-2.5 rounded-xl text-xs text-muted-foreground border border-white/10 hover:bg-white/5 transition-colors">Cancelar</button>
                  <button onClick={salvarDoacoes} disabled={salvando} className="flex-1 py-2.5 rounded-xl text-xs uppercase tracking-widest text-cyan-glow border border-cyan-glow/40 hover:bg-cyan-glow/10 disabled:opacity-40 transition-colors flex items-center justify-center gap-2">
                    <Save size={13} />{salvando ? "Salvando…" : "Salvar"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="glass rounded-2xl p-8 space-y-6">
                <div className="text-center space-y-2">
                  <Heart size={22} strokeWidth={1.5} className="text-rose-400 mx-auto" />
                  <h2 className="text-base font-medium text-foreground">Contribua com nossa missão</h2>
                  <p className="text-sm text-muted-foreground/70 font-light leading-relaxed max-w-sm mx-auto">
                    {pagina.texto_doacao || "Sua contribuição ajuda a manter os trabalhos espíritas."}
                  </p>
                </div>
                {pagina.chave_pix ? (
                  <>
                    <div className="flex justify-center">
                      <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pagina.chave_pix)}&bgcolor=ffffff&color=1e3a5f&margin=4`}
                          alt="QR Code PIX" width={200} height={200} className="rounded-xl" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className={labelCls}>Chave PIX</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-foreground/80 font-mono truncate">{pagina.chave_pix}</div>
                        <button onClick={copiarPix} className="shrink-0 p-2.5 rounded-xl border border-white/10 hover:border-cyan-glow/40 hover:text-cyan-glow text-muted-foreground/60 transition-colors">
                          {copiado ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
                        </button>
                      </div>
                    </div>
                    <p className="text-center text-xs text-muted-foreground/40">Aponte a câmera para o QR code ou copie a chave PIX.</p>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <QrCode size={32} strokeWidth={1} className="text-muted-foreground/20 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground/50">
                      {isAdmin ? "Nenhuma chave PIX cadastrada. Use 'Editar doações'." : "Informações de doação ainda não configuradas."}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ══════════════ PAINEL ADMIN ══════════════ */}
        {modoAdmin && (
          <div className="mt-10 border-t border-white/10 pt-8">
            <button onClick={() => { setShowAdmins(s => !s); if (!showAdmins) garantirMembros(); }}
              className="flex items-center gap-2 text-sm text-muted-foreground/60 hover:text-foreground transition-colors mb-4 w-full">
              <Users size={15} />Gerenciar administradores da página
              <span className="ml-auto">{showAdmins ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
            </button>
            {showAdmins && (
              <div className="glass rounded-2xl p-5 space-y-4">
                <p className="text-xs text-muted-foreground/50 font-light">
                  Administradores autorizados podem editar a página, publicar no mural e gerenciar eventos. O Presidente sempre tem acesso.
                </p>
                <div className="space-y-1">
                  {membros.map(m => {
                    const jaAdmin = adminIds.includes(m.id);
                    return (
                      <div key={m.id} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-white/5">
                        <span className="text-sm text-foreground/80">{m.nome}</span>
                        <button onClick={() => jaAdmin ? removerAdmin(m.id) : adicionarAdmin(m.id)}
                          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${jaAdmin ? "border-red-200 text-red-500 hover:bg-red-50" : "border-cyan-glow/30 text-cyan-glow hover:bg-cyan-glow/10"}`}>
                          {jaAdmin ? <><UserMinus size={12} />Remover</> : <><UserPlus size={12} />Autorizar</>}
                        </button>
                      </div>
                    );
                  })}
                  {membros.length === 0 && <p className="text-xs text-muted-foreground/40 text-center py-3">Nenhum outro membro encontrado.</p>}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-12 text-center">
          <Link to="/inicio" className="text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors uppercase tracking-widest">
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

const inputCls = "w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground/40 focus:outline-none focus:border-cyan-glow/40 transition-colors";
const labelCls = "text-xs uppercase tracking-widest text-muted-foreground/60 mb-1.5 block";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className={labelCls}>{label}</label>{children}</div>;
}

function InfoRow({ Icon, label, value, link }: { Icon: LucideIcon; label: string; value: string; link?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-cyan-50 border border-cyan-100 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={14} strokeWidth={1.5} className="text-cyan-700" />
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">{label}</p>
        {link
          ? <a href={value} target="_blank" rel="noopener noreferrer" className="text-sm text-cyan-glow hover:underline break-all">{value}</a>
          : <p className="text-sm text-foreground/80 font-light">{value}</p>}
      </div>
    </div>
  );
}

/* ── PostForm ─────────────────────────────────────────────── */

function PostForm({
  form, onChange, onCancel, onSubmit, submitLabel,
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
        value={form.conteudo} onChange={e => onChange({ ...form, conteudo: e.target.value })}
        maxLength={2000} rows={4}
        placeholder="Escreva o comunicado ou aviso para a comunidade…"
        className={`${inputCls} resize-none`}
      />

      {/* Imagem */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <Image size={13} className="text-muted-foreground/50" />
          <p className="text-xs uppercase tracking-widest text-muted-foreground/60">URL da imagem (opcional)</p>
        </div>
        <input
          type="url" value={form.imagem_url}
          onChange={e => onChange({ ...form, imagem_url: e.target.value })}
          placeholder="https://…"
          className={inputCls}
        />
        <p className="text-[10px] text-muted-foreground/40 leading-relaxed">
          Dimensões recomendadas: <strong>1200 × 630 px</strong> (paisagem) ou <strong>1080 × 1080 px</strong> (quadrado). Mínimo: 600 px de largura. Formatos: JPG, PNG, WebP.
        </p>
        {form.imagem_url && (
          <img src={form.imagem_url} alt="Prévia"
            className="w-full max-h-48 object-cover rounded-xl border border-white/10 mt-1"
            onError={e => (e.currentTarget.style.display = "none")}
          />
        )}
      </div>

      {/* Vídeo */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <Video size={13} className="text-muted-foreground/50" />
          <p className="text-xs uppercase tracking-widest text-muted-foreground/60">URL do vídeo (opcional)</p>
        </div>
        <input
          type="url" value={form.video_url}
          onChange={e => onChange({ ...form, video_url: e.target.value })}
          placeholder="youtube.com/watch?v=… ou vimeo.com/…"
          className={inputCls}
        />
        <p className="text-[10px] text-muted-foreground/40">
          Cole o link normal do YouTube ou Vimeo. O vídeo será incorporado automaticamente.
        </p>
        {embedUrl && (
          <div className="rounded-xl overflow-hidden aspect-video bg-black/10 mt-1">
            <iframe src={embedUrl} className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground/40">{form.conteudo.length}/2000</span>
        <div className="flex gap-2">
          <button onClick={onCancel} className="px-4 py-2 rounded-xl text-xs text-muted-foreground border border-white/10 hover:bg-white/5 transition-colors">
            Cancelar
          </button>
          <button onClick={onSubmit} disabled={!form.conteudo.trim()}
            className="px-5 py-2 rounded-xl text-xs uppercase tracking-widest text-cyan-glow border border-cyan-glow/40 hover:bg-cyan-glow/10 disabled:opacity-40 transition-colors">
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── EventoForm ───────────────────────────────────────────── */

type FormEvento = { titulo: string; descricao: string; data_evento: string; hora_inicio: string; hora_fim: string; local_evento: string; publica: boolean };

function EventoForm({
  form, onChange, onCancel, onSubmit, submitLabel,
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
        <input value={form.titulo} onChange={e => onChange({ ...form, titulo: e.target.value })} placeholder="Ex.: Palestra Pública" className={inputCls} />
      </Field>
      <Field label="Descrição">
        <textarea value={form.descricao} onChange={e => onChange({ ...form, descricao: e.target.value })} rows={2} placeholder="Detalhes do evento…" className={`${inputCls} resize-none`} />
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Data *">
          <input type="date" value={form.data_evento} onChange={e => onChange({ ...form, data_evento: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Início">
          <input type="time" value={form.hora_inicio} onChange={e => onChange({ ...form, hora_inicio: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Término">
          <input type="time" value={form.hora_fim} onChange={e => onChange({ ...form, hora_fim: e.target.value })} className={inputCls} />
        </Field>
      </div>
      <Field label="Local">
        <input value={form.local_evento} onChange={e => onChange({ ...form, local_evento: e.target.value })} placeholder="Ex.: Salão Principal" className={inputCls} />
      </Field>
      {/* Visibilidade */}
      <div>
        <p className={labelCls}>Visibilidade</p>
        <div className="flex gap-3">
          <button type="button"
            onClick={() => onChange({ ...form, publica: true })}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs border transition-colors ${form.publica ? "border-cyan-glow/60 text-cyan-glow bg-cyan-50" : "border-white/10 text-muted-foreground hover:bg-white/5"}`}>
            <Unlock size={13} />Público
          </button>
          <button type="button"
            onClick={() => onChange({ ...form, publica: false })}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs border transition-colors ${!form.publica ? "border-amber-400/60 text-amber-600 bg-amber-50" : "border-white/10 text-muted-foreground hover:bg-white/5"}`}>
            <Lock size={13} />Privado
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground/40 mt-1.5">
          {form.publica ? "Visível para todos que visitarem a página." : "Visível apenas para membros desta casa e participantes convidados."}
        </p>
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-xs text-muted-foreground border border-white/10 hover:bg-white/5 transition-colors">Cancelar</button>
        <button onClick={onSubmit} disabled={!form.titulo.trim() || !form.data_evento}
          className="flex-1 py-2.5 rounded-xl text-xs uppercase tracking-widest text-cyan-glow border border-cyan-glow/40 hover:bg-cyan-glow/10 disabled:opacity-40 transition-colors">
          {submitLabel}
        </button>
      </div>
    </div>
  );
}

/* ── EventoCard ───────────────────────────────────────────── */

function EventoCard({
  ev, user, profile, isAdmin, isSameCasa, participantes, expandido, editando,
  formEdit, membros, addPartOpen,
  onToggleExpand, onEdit, onCancelEdit, onSaveEdit, onChangeFormEdit,
  onDelete, onAddPart, onRemovePart, onToggleAddPart, onConfirmar,
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

  const minhaParticipacao = participantes?.find(p => p.user_id === user?.id);
  const confirmados = participantes?.filter(p => p.status === "confirmado").length ?? 0;
  const total = participantes?.length ?? 0;

  const statusLabel: Record<string, string> = { convidado: "Convidado", confirmado: "Confirmado", recusou: "Não vai" };
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
            <span className={`shrink-0 text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-full border flex items-center gap-1 ${ev.publica ? "text-cyan-600 bg-cyan-50 border-cyan-200" : "text-amber-600 bg-amber-50 border-amber-200"}`}>
              {ev.publica ? <><Unlock size={9} />Público</> : <><Lock size={9} />Privado</>}
            </span>
          </div>
          {horaStr && <p className="text-xs text-muted-foreground/70 mb-0.5">{horaStr}</p>}
          {ev.local_evento && (
            <p className="text-xs text-muted-foreground/60 flex items-center gap-1">
              <MapPin size={10} />{ev.local_evento}
            </p>
          )}
          {ev.descricao && <p className="text-xs text-foreground/60 mt-1.5 leading-relaxed">{ev.descricao}</p>}

          {/* Participação do usuário atual */}
          {minhaParticipacao && !expandido && (
            <span className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded-full border mt-2 ${statusColor[minhaParticipacao.status]}`}>
              {statusLabel[minhaParticipacao.status]}
            </span>
          )}
        </div>

        {/* Expand button */}
        <button onClick={onToggleExpand}
          className="shrink-0 p-1.5 rounded-lg text-muted-foreground/40 hover:text-foreground hover:bg-white/10 transition-colors mt-0.5">
          {expandido ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>

      {/* ── Painel expandido ── */}
      {expandido && (
        <div className="px-5 pb-5 space-y-4 border-t border-white/5 pt-4">

          {/* Editar evento */}
          {editando ? (
            <EventoForm form={formEdit} onChange={onChangeFormEdit} onCancel={onCancelEdit} onSubmit={onSaveEdit} submitLabel="Salvar" />
          ) : (
            <>
              {/* Participantes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground/50">
                    Participantes {total > 0 && `(${confirmados} confirmado${confirmados !== 1 ? "s" : ""} / ${total})`}
                  </p>
                  {isAdmin && (
                    <button onClick={onToggleAddPart}
                      className="flex items-center gap-1 text-xs text-cyan-glow hover:underline">
                      <UserPlus size={12} />Adicionar
                    </button>
                  )}
                </div>

                {/* Selector de membro a adicionar */}
                {isAdmin && addPartOpen && (
                  <div className="mb-3">
                    <select
                      className={`${inputCls} mb-1`}
                      defaultValue=""
                      onChange={e => { if (e.target.value) { onAddPart(e.target.value); e.target.value = ""; } }}
                    >
                      <option value="" disabled>Selecione um membro…</option>
                      {membros
                        .filter(m => !participantes?.find(p => p.user_id === m.id))
                        .map(m => <option key={m.id} value={m.id}>{m.nome}</option>)
                      }
                    </select>
                  </div>
                )}

                {/* Lista de participantes */}
                {(!participantes || participantes.length === 0) ? (
                  <p className="text-xs text-muted-foreground/40 py-2">Nenhum participante adicionado.</p>
                ) : (
                  <div className="space-y-1.5">
                    {participantes.map(p => (
                      <div key={p.user_id} className="flex items-center justify-between py-1.5 px-3 rounded-xl hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-foreground/80">{p.nome || "Membro"}</span>
                          <span className={`text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-full border ${statusColor[p.status]}`}>
                            {statusLabel[p.status]}
                          </span>
                        </div>
                        {isAdmin && (
                          <button onClick={() => onRemovePart(p.user_id)}
                            className="p-1 rounded-lg text-muted-foreground/30 hover:text-red-500 transition-colors">
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
                  <button onClick={onEdit} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs border border-white/10 text-muted-foreground hover:border-cyan-glow/40 hover:text-cyan-glow transition-colors">
                    <Edit3 size={12} />Editar
                  </button>
                  <button onClick={onDelete} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs border border-white/10 text-muted-foreground hover:border-red-300 hover:text-red-500 transition-colors">
                    <Trash2 size={12} />Excluir
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

function DashSectionHeader({ Icon, label, color, iconColor, bg, border, borderB, children }: {
  Icon: LucideIcon; label: string; color: string; iconColor: string;
  bg: string; border: string; borderB: string; children?: React.ReactNode;
}) {
  return (
    <div className={`flex items-center gap-4 mb-5 pb-3 border-b-2 ${borderB}`}>
      <div className={`w-9 h-9 rounded-xl ${bg} border ${border} flex items-center justify-center shrink-0`}>
        <Icon size={18} strokeWidth={1.5} className={iconColor} />
      </div>
      <h3 className={`text-sm font-semibold ${color} tracking-wide`}>{label}</h3>
      {children && <div className="ml-auto flex items-center gap-2">{children}</div>}
    </div>
  );
}

function DashVoteBadge({ title, votes, votingKey }: {
  title: string; votes: Record<string, { count: number; votedByMe: boolean }>; votingKey: string | null;
}) {
  const key = title.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 80);
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
      title={voted ? "Você já votou neste recurso" : "Clique no card para votar neste recurso"}
    >
      <ThumbsUp size={10} />
      {count > 0 && <span className="font-medium">{count}</span>}
    </span>
  );
}

function DashDashCard({ Icon, title, desc, status, accent, href, casa, votes, votingKey, onVote, onClick }: {
  Icon: LucideIcon; title: string; desc: string; status: DashStatus;
  accent: string; href?: string; casa?: boolean;
  votes: Record<string, { count: number; votedByMe: boolean }>; votingKey: string | null; onVote: (title: string) => void;
  onClick?: () => void;
}) {
  const borderMap: Record<string, string> = {
    slate: "border-t-slate-300/80 focus-within:border-t-slate-400",
    amber: "border-t-amber-300/80 focus-within:border-t-amber-400",
    cyan:  "border-t-cyan-300/80 focus-within:border-t-cyan-400",
  };
  const iconMap: Record<string, string> = {
    slate: "bg-slate-50 border-slate-200 text-slate-600",
    cyan:  "bg-cyan-50 border-cyan-200 text-cyan-600",
    amber: "bg-amber-50 border-amber-200 text-amber-600",
  };
  const isPending = status === "breve";
  const content = (
    <div
      className={`glass-premium hover-premium rounded-2xl p-5 border-t-4 ${borderMap[accent] ?? "border-t-slate-300"} h-full flex flex-col gap-4 ${(isPending || onClick) ? "cursor-pointer" : ""}`}
      onClick={onClick ? onClick : (isPending ? () => onVote(title) : undefined)}
    >
      <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${iconMap[accent] ?? iconMap.slate}`}>
        <Icon size={18} strokeWidth={1.5} />
      </div>
      <div className="flex-1">
        <h4 className="text-xs font-bold text-gray-800 leading-snug mb-1">{title}</h4>
        <p className="text-[11px] text-gray-500 leading-relaxed font-light">{desc}</p>
      </div>
      <div className="flex items-center gap-2 flex-wrap mt-1">
        <span className={`text-[9px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full border ${STATUS_STYLE[status]}`}>
          {STATUS_LABEL[status]}
        </span>
        {casa && (
          <span className="text-[9px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full border border-gray-200 text-gray-400">
            Por casa
          </span>
        )}
        {isPending && (
          <DashVoteBadge title={title} votes={votes} votingKey={votingKey} />
        )}
      </div>
    </div>
  );
  if (href) return <Link to={href} className="block h-full">{content}</Link>;
  return content;
}

function DashFeatureCard({ item, cat, votes, votingKey, onVote }: {
  item: DashFeatureItem; cat: DashFeatureCategory;
  votes: Record<string, { count: number; votedByMe: boolean }>; votingKey: string | null; onVote: (title: string) => void;
}) {
  const isAvailable = item.status === "disponivel";
  const isPending = item.status === "breve";

  const inner = (
    <div
      className={`group glass-premium hover-premium rounded-2xl p-5 flex flex-col gap-4 h-full ${!isAvailable ? "opacity-80" : ""} ${isPending ? "cursor-pointer" : ""}`}
      onClick={isPending ? () => onVote(item.title) : undefined}
    >
      <div className={`w-9 h-9 rounded-xl ${cat.bg} border ${cat.border} flex items-center justify-center shrink-0`}>
        <item.Icon size={18} strokeWidth={1.5} className={cat.iconColor} />
      </div>
      <div className="flex-1">
        <h4 className="text-xs font-bold text-gray-800 leading-snug mb-1">{item.title}</h4>
        <p className="text-[11px] text-gray-500 leading-relaxed font-light">{item.desc}</p>
      </div>
      <div className="flex items-center gap-2 flex-wrap mt-1">
        <span className={`text-[9px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full border ${STATUS_STYLE[item.status]}`}>
          {STATUS_LABEL[item.status]}
        </span>
        {item.casa && (
          <span className="text-[9px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full border border-gray-200 text-gray-400">
            Por casa
          </span>
        )}
        {isPending && (
          <DashVoteBadge title={item.title} votes={votes} votingKey={votingKey} />
        )}
      </div>
    </div>
  );
  if (item.href) return <a href={item.href} className="block h-full">{inner}</a>;
  return inner;
}

function DashBazarCard({ item }: { item: typeof DASH_BAZAR[0] }) {
  return (
    <div className="glass-premium hover-premium rounded-2xl p-4 flex flex-col gap-3">
      <div className="w-11 h-11 rounded-xl bg-cyan-50/70 border border-cyan-100 flex items-center justify-center mx-auto shadow-sm">
        <item.Icon size={20} strokeWidth={1.5} className="text-cyan-600" />
      </div>
      <div className="text-center flex-1">
        <p className="text-[9px] font-bold text-cyan-600/70 uppercase tracking-widest mb-0.5">{item.category}</p>
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
