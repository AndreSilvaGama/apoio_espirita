// @ts-nocheck
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { DndContext, DragEndEvent, DragStartEvent, DragOverEvent, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners, useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, arrayMove, horizontalListSortingStrategy, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus, Calendar, User, Pencil, Trash2, X, ChevronLeft, ChevronRight,
  ChevronDown, ChevronUp, Check, Users, Share2, Palette, Archive,
  Paperclip, MessageSquare, Search, ArrowLeft, CheckSquare, Tag,
  Sparkles, CheckCircle2, Clock, Undo, GripVertical, LayoutGrid, Image as ImageIcon
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";

export const Route = createFileRoute("/kanban")({
  component: KanbanPage,
});

type Status = string; // Now dynamic (references kanban_listas.id)

interface KanbanEvento {
  id: string;
  sigla_casa: string;
  titulo: string;
  descricao: string | null;
  data: string | null;
  responsavel: string | null;
  lista_id: string | null;
  criador_id: string | null;
  criador_nome: string | null;
  created_at: string;
  labels: string[];
  membros_atribuidos: string[];
  prazo_concluido: boolean;
  anexos: { nome: string; url: string }[];
  arquivado: boolean;
  ordem: number;
  cover: string | null;
}

interface KanbanTarefa {
  id: string;
  grupo_id: string;
  sigla_casa: string;
  titulo: string;
  feito: boolean;
  responsavel: string | null;
  prazo: string | null;
  ordem: number;
  created_at: string;
}

interface KanbanGrupo {
  id: string;
  evento_id: string;
  sigla_casa: string;
  nome: string;
  responsavel: string | null;
  membros: string[];
  ordem: number;
  created_at: string;
  kanban_tarefas: KanbanTarefa[];
}

interface KanbanLista {
  id: string;
  sigla_casa: string;
  nome: string;
  ordem: number;
  board_id: string | null;
  created_at: string;
}

interface KanbanBoard {
  id: string;
  sigla_casa: string;
  nome: string;
  ordem: number;
  created_at: string;
}

interface KanbanComentario {
  id: string;
  evento_id: string;
  user_id: string | null;
  autor_nome: string;
  comentario: string;
  created_at: string;
}

const ETIQUETAS = [
  { id: "espiritual", label: "Espiritual", bg: "bg-emerald-50 border-emerald-200 text-emerald-700", dot: "bg-emerald-500" },
  { id: "financeiro", label: "Financeiro", bg: "bg-amber-50 border-amber-200 text-amber-700", dot: "bg-amber-500" },
  { id: "urgente", label: "Urgente", bg: "bg-rose-50 border-rose-200 text-rose-700", dot: "bg-rose-500" },
  { id: "reuniao", label: "Reunião", bg: "bg-blue-50 border-blue-200 text-blue-700", dot: "bg-blue-500" },
  { id: "evento", label: "Evento", bg: "bg-purple-50 border-purple-200 text-purple-700", dot: "bg-purple-500" },
  { id: "infraestrutura", label: "Infraestrutura", bg: "bg-cyan-50 border-cyan-200 text-cyan-700", dot: "bg-cyan-500" }
];

const BACKGROUNDS = [
  { id: "bg-slate-50", label: "Branco Suave", css: "bg-slate-50 text-gray-800" },
  { id: "bg-[#f4f5f8]", label: "Cinza Claro", css: "bg-[#f4f5f8] text-gray-800" },
  { id: "bg-blue-50", label: "Azul Sereno", css: "bg-blue-50/50 text-gray-800" },
  { id: "bg-emerald-50", label: "Verde Esperança", css: "bg-emerald-50/50 text-gray-800" },
  { id: "bg-gradient-to-br from-indigo-50 to-cyan-50", label: "Gradiente Celestial", css: "bg-gradient-to-br from-indigo-50 to-cyan-50 text-gray-800" },
  { id: "bg-gradient-to-br from-blue-50 to-purple-50", label: "Gradiente Harmonia", css: "bg-gradient-to-br from-blue-50 to-purple-50 text-gray-800" },
  { id: "bg-gradient-to-br from-emerald-50 to-teal-50", label: "Gradiente Vitalidade", css: "bg-gradient-to-br from-emerald-50 to-teal-50 text-gray-800" },
  { id: "bg-gradient-to-br from-amber-50 to-rose-50", label: "Gradiente Fraternidade", css: "bg-gradient-to-br from-amber-50 to-rose-50 text-gray-800" }
];

const DEFAULT_LISTAS = ["Ideia", "Planejado", "Em andamento", "Realizado"];

// Cores de capa do card (estilo Trello)
const COVERS = [
  { id: "cyan", css: "bg-cyan-500" },
  { id: "blue", css: "bg-blue-600" },
  { id: "emerald", css: "bg-emerald-500" },
  { id: "amber", css: "bg-amber-500" },
  { id: "rose", css: "bg-rose-500" },
  { id: "violet", css: "bg-violet-500" },
  { id: "slate", css: "bg-slate-600" }
];

function coverCss(id: string | null): string {
  if (!id) return "";
  return COVERS.find(c => c.id === id)?.css || "";
}

// Cor determinística para avatar com base no nome
const AVATAR_COLORS = [
  "bg-cyan-500", "bg-blue-500", "bg-emerald-500", "bg-amber-500",
  "bg-rose-500", "bg-violet-500", "bg-teal-500", "bg-indigo-500"
];

function avatarColor(nome: string): string {
  let hash = 0;
  for (let i = 0; i < nome.length; i++) hash = nome.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function avatarInitials(nome: string): string {
  const parts = nome.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function fmtData(iso: string) {
  const [year, month, day] = iso.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

function getPrazoInfo(prazo: string | null, concluido: boolean): { cor: string; texto: string } {
  if (!prazo) return { cor: "text-muted-foreground/50", texto: "" };
  if (concluido) return { cor: "text-emerald-600 bg-emerald-50 border-emerald-200 px-2 py-0.5 rounded", texto: "Concluído" };
  
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);
  const data = new Date(prazo + "T00:00:00");
  
  if (data < hoje) return { cor: "text-red-600 bg-red-50 border-red-200 px-2 py-0.5 rounded font-medium", texto: "Atrasado" };
  if (data <= amanha) return { cor: "text-amber-600 bg-amber-50 border-amber-200 px-2 py-0.5 rounded font-medium", texto: "Amanhã" };
  return { cor: "text-gray-500 bg-gray-100 px-2 py-0.5 rounded", texto: "" };
}

// Custom guest client instantiation
function getSupabaseClient(guestToken?: string | null) {
  if (guestToken) {
    const url = import.meta.env.VITE_SUPABASE_URL || "https://kitmwxfwwujygcmdjngm.supabase.co";
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpdG13eGZ3d3VqeWdjbWRqbmdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjEwNTYsImV4cCI6MjA5NDA5NzA1Nn0.Er_7LFPyup8LjcFaGuIAKMHcIVzJfbU-ihVs_r-IkXE";
    return createClient(url, key, {
      global: {
        headers: {
          "x-kanban-token": guestToken
        }
      },
      auth: {
        persistSession: false
      }
    });
  }
  return supabase;
}

function KanbanPage() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8,
    },
  });
  const sensors = useSensors(pointerSensor);

  const [guestToken, setGuestToken] = useState<string | null>(null);
  const [guestName, setGuestName] = useState<string | null>(null);
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const [tempGuestName, setTempGuestName] = useState("");

  const [sigla, setSigla] = useState<string | null>(null);
  const [config, setConfig] = useState<{ board_background: string; share_token: string } | null>(null);
  
  const [boards, setBoards] = useState<KanbanBoard[]>([]);
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [listas, setListas] = useState<KanbanLista[]>([]);
  const [eventos, setEventos] = useState<KanbanEvento[]>([]);
  const [membrosCasa, setMembrosCasa] = useState<{ id: string; nome: string }[]>([]);

  // Board management UI
  const [showBoardMenu, setShowBoardMenu] = useState(false);
  const [showNewBoardForm, setShowNewBoardForm] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null);
  const [editingBoardName, setEditingBoardName] = useState("");

  // Drag overlay (Trello-style smooth dragging)
  const [activeDrag, setActiveDrag] = useState<{ type: "card" | "list"; id: string } | null>(null);
  
  const [loadingBoard, setLoadingBoard] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLabel, setFilterLabel] = useState("");
  const [filterMember, setFilterMember] = useState("");
  const [filterPrazo, setFilterPrazo] = useState("");

  // Card & List editing state
  const [showNewCardForm, setShowNewCardForm] = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [showNewListForm, setShowNewListForm] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingListName, setEditingListName] = useState("");

  // Card details modal
  const [selectedCard, setSelectedCard] = useState<KanbanEvento | null>(null);
  const [loadingCardDetails, setLoadingCardDetails] = useState(false);
  const [gruposCard, setGruposCard] = useState<KanbanGrupo[]>([]);
  const [comentariosCard, setComentariosCard] = useState<KanbanComentario[]>([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [editingDescription, setEditingDescription] = useState(false);
  const [tempDescription, setTempDescription] = useState("");
  const [showAddLabelMenu, setShowAddLabelMenu] = useState(false);
  const [showAddMemberMenu, setShowAddMemberMenu] = useState(false);
  const [showMoveCardMenu, setShowMoveCardMenu] = useState(false);
  const [newAttachmentName, setNewAttachmentName] = useState("");
  const [newAttachmentUrl, setNewAttachmentUrl] = useState("");
  const [newChecklistName, setNewChecklistName] = useState("");
  const [showNewChecklistForm, setShowNewChecklistForm] = useState(false);
  const [showNewChecklistItemForm, setShowNewChecklistItemForm] = useState<string | null>(null);
  const [newChecklistItemTitle, setNewChecklistItemTitle] = useState("");

  // Parse Guest Token on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      setGuestToken(token);
      const name = sessionStorage.getItem("kanban_guest_name");
      if (name) {
        setGuestName(name);
      } else {
        setShowGuestPrompt(true);
      }
    }
  }, []);

  // Set sigla based on user or token
  useEffect(() => {
    if (!loading && !user && !guestToken) {
      navigate({ to: "/login" });
      return;
    }

    if (user && profile?.sigla_casa && !guestToken) {
      setSigla(profile.sigla_casa);
    }
  }, [user, profile, loading, guestToken, navigate]);

  // Load house sigla from guest token if present
  useEffect(() => {
    if (guestToken) {
      const fetchSiglaFromToken = async () => {
        try {
          const client = getSupabaseClient(guestToken);
          const { data, error } = await client
            .from("kanban_config")
            .select("sigla_casa, board_background, share_token")
            .eq("share_token", guestToken)
            .maybeSingle();

          if (error) throw error;
          if (data) {
            setSigla(data.sigla_casa);
            setConfig(data);
          } else {
            toast.error("Link de convite inválido ou expirado.");
          }
        } catch (e) {
          console.error(e);
          toast.error("Erro ao validar token de convidado.");
        }
      };
      fetchSiglaFromToken();
    }
  }, [guestToken]);

  // Load board data once sigla is resolved
  const fetchBoardData = async (siglaCasa: string) => {
    setLoadingBoard(true);
    const client = getSupabaseClient(guestToken);
    try {
      // 1. Fetch Board Config
      const { data: configData } = await client
        .from("kanban_config")
        .select("*")
        .eq("sigla_casa", siglaCasa)
        .maybeSingle();
      
      let currentConfig = configData;
      if (!configData && !guestToken && user) {
        // Create config if not exists (only authenticated users can do this)
        const { data: newConfig } = await client
          .from("kanban_config")
          .insert({ sigla_casa: siglaCasa })
          .select()
          .single();
        currentConfig = newConfig;
      }
      setConfig(currentConfig);

      // 2. Fetch Boards (quadros nomeados)
      let { data: boardsData } = await client
        .from("kanban_boards")
        .select("*")
        .eq("sigla_casa", siglaCasa)
        .order("ordem");

      // Auto-create a default board if none exists
      if ((!boardsData || boardsData.length === 0) && !guestToken && user) {
        const { data: newBoard } = await client
          .from("kanban_boards")
          .insert({ sigla_casa: siglaCasa, nome: "Geral", ordem: 0 })
          .select()
          .single();
        boardsData = newBoard ? [newBoard] : [];
      }
      const boardsList = boardsData || [];
      setBoards(boardsList);

      // Resolve active board (preserva seleção atual / localStorage / primeiro)
      const stored = typeof window !== "undefined" ? localStorage.getItem(`kanban_board_${siglaCasa}`) : null;
      const chosenBoardId =
        (activeBoardId && boardsList.some(b => b.id === activeBoardId) && activeBoardId) ||
        (stored && boardsList.some(b => b.id === stored) && stored) ||
        (boardsList[0]?.id ?? null);
      setActiveBoardId(chosenBoardId);

      // 3. Fetch Lists (todas da casa; a filtragem por board ocorre na renderização)
      let { data: listasData } = await client
        .from("kanban_listas")
        .select("*")
        .eq("sigla_casa", siglaCasa)
        .order("ordem");

      // Auto-create default columns only on first-time setup (casa sem nenhuma lista)
      if ((!listasData || listasData.length === 0) && chosenBoardId && !guestToken && user) {
        const defaultLists = DEFAULT_LISTAS.map((nome, idx) => ({
          sigla_casa: siglaCasa,
          nome,
          ordem: idx,
          board_id: chosenBoardId
        }));
        const { data: insertedListas } = await client
          .from("kanban_listas")
          .insert(defaultLists)
          .select();
        listasData = insertedListas || [];
      }
      setListas(listasData || []);

      // 3. Fetch Cards
      const { data: cardsData } = await client
        .from("kanban_eventos")
        .select("*")
        .eq("sigla_casa", siglaCasa)
        .order("ordem", { ascending: true });
      
      setEventos((cardsData as KanbanEvento[]) || []);

      // 4. Fetch Members for assignment (from profiles_public)
      const { data: membersData } = await client
        .from("profiles_public")
        .select("id, nome")
        .eq("sigla_casa", siglaCasa)
        .order("nome");
      
      setMembrosCasa(membersData || []);

    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar o quadro de projetos.");
    } finally {
      setLoadingBoard(false);
    }
  };

  useEffect(() => {
    if (sigla) {
      fetchBoardData(sigla);
    }
  }, [sigla, guestToken]);

  // Load card details when card selection changes
  const fetchCardDetails = async (cardId: string) => {
    setLoadingCardDetails(true);
    const client = getSupabaseClient(guestToken);
    try {
      // Fetch checkpoints/checklists
      const { data: gruposData } = await client
        .from("kanban_grupos")
        .select("*, kanban_tarefas(*)")
        .eq("evento_id", cardId)
        .order("ordem");
      
      const sortedGrupos = (gruposData || []).map(g => ({
        ...g,
        kanban_tarefas: [...g.kanban_tarefas].sort((a, b) => a.ordem - b.ordem)
      }));
      setGruposCard(sortedGrupos);

      // Fetch comments
      const { data: comentariosData } = await client
        .from("kanban_comentarios")
        .select("*")
        .eq("evento_id", cardId)
        .order("created_at", { ascending: false });
      
      setComentariosCard(comentariosData || []);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar detalhes do card.");
    } finally {
      setLoadingCardDetails(false);
    }
  };

  useEffect(() => {
    if (selectedCard) {
      fetchCardDetails(selectedCard.id);
      setTempDescription(selectedCard.descricao || "");
      setEditingDescription(false);
    }
  }, [selectedCard]);

  if (loading || !sigla) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-gray-500 font-light">Carregando quadro de projetos...</p>
        </div>
      </div>
    );
  }

  // Helper to get active client
  const getClient = () => getSupabaseClient(guestToken);

  // Handle Guest Prompt Submit
  const handleGuestPromptSubmit = () => {
    if (!tempGuestName.trim()) {
      toast.error("Informe seu nome.");
      return;
    }
    sessionStorage.setItem("kanban_guest_name", tempGuestName.trim());
    setGuestName(tempGuestName.trim());
    setShowGuestPrompt(false);
    toast.success(`Acesso concedido como ${tempGuestName.trim()}`);
  };

  // Actions for Boards (quadros)
  const switchBoard = (boardId: string) => {
    setActiveBoardId(boardId);
    setShowBoardMenu(false);
    if (typeof window !== "undefined" && sigla) {
      localStorage.setItem(`kanban_board_${sigla}`, boardId);
    }
  };

  const handleAddBoard = async () => {
    if (!newBoardName.trim()) return;
    const client = getClient();
    try {
      const { data, error } = await client
        .from("kanban_boards")
        .insert({
          sigla_casa: sigla,
          nome: newBoardName.trim(),
          ordem: boards.length
        })
        .select()
        .single();

      if (error) throw error;
      setBoards([...boards, data]);
      setNewBoardName("");
      setShowNewBoardForm(false);
      switchBoard(data.id);
      toast.success("Projeto criado.");
    } catch (e) {
      toast.error("Erro ao criar projeto.");
    }
  };

  const handleRenameBoard = async (boardId: string) => {
    if (!editingBoardName.trim()) return;
    const client = getClient();
    try {
      const { error } = await client
        .from("kanban_boards")
        .update({ nome: editingBoardName.trim() })
        .eq("id", boardId);

      if (error) throw error;
      setBoards(boards.map(b => b.id === boardId ? { ...b, nome: editingBoardName.trim() } : b));
      setEditingBoardId(null);
      toast.success("Projeto renomeado.");
    } catch (e) {
      toast.error("Erro ao renomear projeto.");
    }
  };

  const handleDeleteBoard = async (boardId: string, boardName: string) => {
    if (boards.length <= 1) {
      toast.error("Você precisa manter ao menos um projeto.");
      return;
    }
    if (!confirm(`Excluir o projeto "${boardName}"? Todas as listas e cards dele serão excluídos!`)) return;
    const client = getClient();
    try {
      const { error } = await client
        .from("kanban_boards")
        .delete()
        .eq("id", boardId);

      if (error) throw error;
      const remaining = boards.filter(b => b.id !== boardId);
      setBoards(remaining);
      // Remove listas/cards do board excluído do estado local (cascade no banco)
      const removedListaIds = listas.filter(l => l.board_id === boardId).map(l => l.id);
      setListas(listas.filter(l => l.board_id !== boardId));
      setEventos(eventos.filter(e => !removedListaIds.includes(e.lista_id || "")));
      if (activeBoardId === boardId) {
        switchBoard(remaining[0].id);
      }
      toast.success("Projeto excluído.");
    } catch (e) {
      toast.error("Erro ao excluir projeto.");
    }
  };

  // Actions for Lists
  const handleAddList = async () => {
    if (!newListName.trim() || !activeBoardId) return;
    const client = getClient();
    const boardListas = listas.filter(l => l.board_id === activeBoardId);
    try {
      const { data, error } = await client
        .from("kanban_listas")
        .insert({
          sigla_casa: sigla,
          nome: newListName.trim(),
          ordem: boardListas.length,
          board_id: activeBoardId
        })
        .select()
        .single();

      if (error) throw error;
      setListas([...listas, data]);
      setNewListName("");
      setShowNewListForm(false);
      toast.success("Lista criada.");
    } catch (e) {
      toast.error("Erro ao criar lista.");
    }
  };

  const handleRenameList = async (listId: string) => {
    if (!editingListName.trim()) return;
    const client = getClient();
    try {
      const { error } = await client
        .from("kanban_listas")
        .update({ nome: editingListName.trim() })
        .eq("id", listId);
      
      if (error) throw error;
      setListas(listas.map(l => l.id === listId ? { ...l, nome: editingListName.trim() } : l));
      setEditingListId(null);
      toast.success("Lista renomeada.");
    } catch (e) {
      toast.error("Erro ao renomear lista.");
    }
  };

  const handleDeleteList = async (listId: string, listName: string) => {
    if (!confirm(`Excluir a lista "${listName}"? Todos os cards nela também serão excluídos!`)) return;
    const client = getClient();
    try {
      const { error } = await client
        .from("kanban_listas")
        .delete()
        .eq("id", listId);
      
      if (error) throw error;
      setListas(listas.filter(l => l.id !== listId));
      setEventos(eventos.filter(e => e.lista_id !== listId));
      toast.success("Lista excluída.");
    } catch (e) {
      toast.error("Erro ao excluir lista.");
    }
  };

  // Actions for Cards (KanbanEventos)
  const handleCreateCard = async (listId: string) => {
    if (!newCardTitle.trim()) return;
    const client = getClient();
    const authorId = user?.id || null;
    const authorName = user ? (profile?.nome || "Membro") : (guestName || "Visitante");
    
    // Calculate new card order
    const listCards = eventos.filter(e => e.lista_id === listId);
    const ordem = listCards.length;

    try {
      const { data, error } = await client
        .from("kanban_eventos")
        .insert({
          sigla_casa: sigla,
          titulo: newCardTitle.trim(),
          lista_id: listId,
          criador_id: authorId,
          criador_nome: authorName,
          ordem,
          status: "ideia", // legacy field default
          labels: [],
          membros_atribuidos: [],
          anexos: []
        })
        .select()
        .single();
      
      if (error) throw error;
      setEventos([...eventos, data]);
      setNewCardTitle("");
      setShowNewCardForm(null);
      toast.success("Projeto criado.");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao criar projeto.");
    }
  };

  const handleUpdateCard = async (updatedCard: KanbanEvento) => {
    const client = getClient();
    try {
      const { error } = await client
        .from("kanban_eventos")
        .update({
          titulo: updatedCard.titulo,
          descricao: updatedCard.descricao,
          data: updatedCard.data,
          responsavel: updatedCard.responsavel,
          labels: updatedCard.labels,
          membros_atribuidos: updatedCard.membros_atribuidos,
          prazo_concluido: updatedCard.prazo_concluido,
          anexos: updatedCard.anexos,
          arquivado: updatedCard.arquivado,
          lista_id: updatedCard.lista_id
        })
        .eq("id", updatedCard.id);
      
      if (error) throw error;
      setEventos(eventos.map(e => e.id === updatedCard.id ? updatedCard : e));
      if (selectedCard?.id === updatedCard.id) {
        setSelectedCard(updatedCard);
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro ao atualizar card.");
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm("Excluir este card permanentemente?")) return;
    const client = getClient();
    try {
      const { error } = await client
        .from("kanban_eventos")
        .delete()
        .eq("id", cardId);
      
      if (error) throw error;
      setEventos(eventos.filter(e => e.id !== cardId));
      setSelectedCard(null);
      toast.success("Card excluído.");
    } catch (e) {
      toast.error("Erro ao excluir card.");
    }
  };

  // ── Drag and Drop (estilo Trello, com DragOverlay) ──
  const eventosSnapshot = useRef<KanbanEvento[]>([]);

  const findListIdByCard = (cardId: string) => eventos.find(e => e.id === cardId)?.lista_id || null;

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as any;
    if (data?.type) {
      eventosSnapshot.current = eventos;
      setActiveDrag({ type: data.type, id: event.active.id as string });
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeData = active.data.current as any;
    if (activeData?.type !== "card") return; // reordenação de listas é tratada no end

    const activeId = active.id as string;
    const overId = over.id as string;
    const overData = over.data.current as any;

    const sourceListId = findListIdByCard(activeId);
    let targetListId: string | null = null;
    if (overData?.type === "card") targetListId = findListIdByCard(overId);
    else if (overData?.type === "column") targetListId = overData.listId;
    if (!targetListId || targetListId === sourceListId) return;

    // Move o card para a lista de destino no estado local (preview entre colunas)
    setEventos(prev => {
      const moving = prev.find(e => e.id === activeId);
      if (!moving) return prev;
      const without = prev.filter(e => e.id !== activeId);
      const targetCards = without.filter(e => e.lista_id === targetListId).sort((a, b) => a.ordem - b.ordem);
      let insertIndex = targetCards.length;
      if (overData?.type === "card") {
        const idx = targetCards.findIndex(e => e.id === overId);
        if (idx >= 0) insertIndex = idx;
      }
      targetCards.splice(insertIndex, 0, { ...moving, lista_id: targetListId });
      const reTarget = targetCards.map((e, i) => ({ ...e, ordem: i }));
      return without.filter(e => e.lista_id !== targetListId).concat(reTarget);
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    const activeData = active.data.current as any;
    setActiveDrag(null);
    if (!over) return;
    const activeId = active.id as string;
    const overId = over.id as string;
    const overData = over.data.current as any;

    // ── Reordenação de LISTAS ──
    if (activeData?.type === "list") {
      if (activeId === overId) return;
      const ordered = listas.filter(l => l.board_id === activeBoardId).sort((a, b) => a.ordem - b.ordem);
      const oldIndex = ordered.findIndex(l => l.id === activeId);
      const newIndex = ordered.findIndex(l => l.id === overId);
      if (oldIndex < 0 || newIndex < 0) return;
      const reordered = arrayMove(ordered, oldIndex, newIndex).map((l, i) => ({ ...l, ordem: i }));
      setListas(listas.map(l => reordered.find(r => r.id === l.id) || l));
      const client = getClient();
      try {
        await Promise.all(reordered.map(l => client.from("kanban_listas").update({ ordem: l.ordem }).eq("id", l.id)));
      } catch (err) {
        toast.error("Erro ao salvar ordem das listas.");
      }
      return;
    }

    // ── Reordenação / movimentação de CARDS ──
    if (activeData?.type === "card") {
      const snapshot = eventosSnapshot.current;
      const activeListId = findListIdByCard(activeId); // lista atual (após dragOver)
      if (!activeListId) return;

      let working = [...eventos];
      const listCards = working.filter(e => e.lista_id === activeListId).sort((a, b) => a.ordem - b.ordem);
      const oldIndex = listCards.findIndex(e => e.id === activeId);
      let newIndex = listCards.length - 1;
      if (overData?.type === "card") {
        const idx = listCards.findIndex(e => e.id === overId);
        if (idx >= 0) newIndex = idx;
      }
      let orderedCards = listCards;
      if (oldIndex >= 0 && newIndex >= 0 && oldIndex !== newIndex) {
        orderedCards = arrayMove(listCards, oldIndex, newIndex);
      }
      const normalized = orderedCards.map((e, i) => ({ ...e, ordem: i }));
      working = working.map(e => normalized.find(r => r.id === e.id) || e);

      // Renormaliza a lista de origem (fecha buracos deixados pelo card movido)
      const sourceListId = snapshot.find(s => s.id === activeId)?.lista_id;
      if (sourceListId && sourceListId !== activeListId) {
        const srcCards = working
          .filter(e => e.lista_id === sourceListId)
          .sort((a, b) => a.ordem - b.ordem)
          .map((e, i) => ({ ...e, ordem: i }));
        working = working.map(e => srcCards.find(r => r.id === e.id) || e);
      }
      setEventos(working);

      const changed = working.filter(e => {
        const orig = snapshot.find(o => o.id === e.id);
        return orig && (orig.lista_id !== e.lista_id || orig.ordem !== e.ordem);
      });
      if (changed.length === 0) return;
      const client = getClient();
      try {
        await Promise.all(changed.map(c =>
          client.from("kanban_eventos").update({ lista_id: c.lista_id, ordem: c.ordem }).eq("id", c.id)
        ));
      } catch (err) {
        console.error(err);
        setEventos(snapshot);
        toast.error("Erro ao salvar ordenação no banco de dados.");
      }
    }
  };

  // Comments Operations
  const handleAddComment = async () => {
    if (!newCommentText.trim() || !selectedCard) return;
    const client = getClient();
    const authorName = user ? (profile?.nome || "Membro") : (guestName || "Visitante");
    try {
      const { data, error } = await client
        .from("kanban_comentarios")
        .insert({
          evento_id: selectedCard.id,
          user_id: user?.id || null,
          autor_nome: authorName,
          comentario: newCommentText.trim()
        })
        .select()
        .single();
      
      if (error) throw error;
      setComentariosCard([data, ...comentariosCard]);
      setNewCommentText("");
      toast.success("Comentário publicado.");
    } catch (e) {
      toast.error("Erro ao adicionar comentário.");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Excluir seu comentário?")) return;
    const client = getClient();
    try {
      const { error } = await client
        .from("kanban_comentarios")
        .delete()
        .eq("id", commentId);
      
      if (error) throw error;
      setComentariosCard(comentariosCard.filter(c => c.id !== commentId));
      toast.success("Comentário excluído.");
    } catch (e) {
      toast.error("Erro ao excluir comentário.");
    }
  };

  // Checklist Operations
  const handleAddChecklist = async () => {
    if (!newChecklistName.trim() || !selectedCard) return;
    const client = getClient();
    try {
      const { data, error } = await client
        .from("kanban_grupos")
        .insert({
          evento_id: selectedCard.id,
          sigla_casa: sigla,
          nome: newChecklistName.trim(),
          ordem: gruposCard.length
        })
        .select()
        .single();
      
      if (error) throw error;
      setGruposCard([...gruposCard, { ...data, kanban_tarefas: [] }]);
      setNewChecklistName("");
      setShowNewChecklistForm(false);
      toast.success("Checklist criado.");
    } catch (e) {
      toast.error("Erro ao criar checklist.");
    }
  };

  const handleDeleteChecklist = async (grupoId: string, name: string) => {
    if (!confirm(`Excluir o checklist "${name}"?`)) return;
    const client = getClient();
    try {
      const { error } = await client
        .from("kanban_grupos")
        .delete()
        .eq("id", grupoId);
      
      if (error) throw error;
      setGruposCard(gruposCard.filter(g => g.id !== grupoId));
      toast.success("Checklist excluído.");
    } catch (e) {
      toast.error("Erro ao excluir checklist.");
    }
  };

  const handleAddChecklistItem = async (grupoId: string) => {
    if (!newChecklistItemTitle.trim()) return;
    const client = getClient();
    const grupo = gruposCard.find(g => g.id === grupoId);
    if (!grupo) return;
    try {
      const { data, error } = await client
        .from("kanban_tarefas")
        .insert({
          grupo_id: grupoId,
          sigla_casa: sigla,
          titulo: newChecklistItemTitle.trim(),
          feito: false,
          ordem: grupo.kanban_tarefas.length
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setGruposCard(gruposCard.map(g => {
        if (g.id === grupoId) {
          return { ...g, kanban_tarefas: [...g.kanban_tarefas, data] };
        }
        return g;
      }));
      setNewChecklistItemTitle("");
      setShowNewChecklistItemForm(null);
    } catch (e) {
      toast.error("Erro ao adicionar tarefa.");
    }
  };

  const handleToggleChecklistItem = async (tarefaId: string, feito: boolean, grupoId: string) => {
    const client = getClient();
    try {
      const { error } = await client
        .from("kanban_tarefas")
        .update({ feito })
        .eq("id", tarefaId);
      
      if (error) throw error;
      
      setGruposCard(gruposCard.map(g => {
        if (g.id === grupoId) {
          return {
            ...g,
            kanban_tarefas: g.kanban_tarefas.map(t => t.id === tarefaId ? { ...t, feito } : t)
          };
        }
        return g;
      }));
    } catch (e) {
      toast.error("Erro ao atualizar tarefa.");
    }
  };

  const handleDeleteChecklistItem = async (tarefaId: string, grupoId: string) => {
    const client = getClient();
    try {
      const { error } = await client
        .from("kanban_tarefas")
        .delete()
        .eq("id", tarefaId);
      
      if (error) throw error;
      
      setGruposCard(gruposCard.map(g => {
        if (g.id === grupoId) {
          return {
            ...g,
            kanban_tarefas: g.kanban_tarefas.filter(t => t.id !== tarefaId)
          };
        }
        return g;
      }));
    } catch (e) {
      toast.error("Erro ao excluir tarefa.");
    }
  };

  // Attachments Operations
  const handleAddAttachment = () => {
    if (!newAttachmentName.trim() || !newAttachmentUrl.trim() || !selectedCard) return;
    
    // Add protocol if missing
    let url = newAttachmentUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = "https://" + url;
    }

    const updatedAnexos = [...(selectedCard.anexos || []), { nome: newAttachmentName.trim(), url }];
    const updatedCard = { ...selectedCard, anexos: updatedAnexos };
    
    handleUpdateCard(updatedCard);
    setNewAttachmentName("");
    setNewAttachmentUrl("");
    toast.success("Anexo adicionado.");
  };

  const handleDeleteAttachment = (idx: number) => {
    if (!selectedCard) return;
    const updatedAnexos = selectedCard.anexos.filter((_, i) => i !== idx);
    const updatedCard = { ...selectedCard, anexos: updatedAnexos };
    handleUpdateCard(updatedCard);
    toast.success("Anexo excluído.");
  };

  // Change Background
  const handleChangeBackground = async (bgId: string) => {
    const client = getClient();
    try {
      const { error } = await client
        .from("kanban_config")
        .update({ board_background: bgId })
        .eq("sigla_casa", sigla);
      
      if (error) throw error;
      setConfig(prev => prev ? { ...prev, board_background: bgId } : null);
      toast.success("Plano de fundo atualizado.");
    } catch (e) {
      toast.error("Erro ao alterar plano de fundo.");
    }
  };

  // Generate Invite URL
  const getInviteUrl = () => {
    if (!config?.share_token) return "";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/kanban?token=${config.share_token}`;
  };

  const handleCopyInvite = () => {
    const url = getInviteUrl();
    if (url) {
      navigator.clipboard.writeText(url);
      toast.success("Link de convite copiado para a área de transferência!");
    }
  };

  // Filtering Logic
  const filteredEventos = eventos.filter(evento => {
    // 1. Arquivado check
    if (evento.arquivado !== showArchived) return false;

    // 2. Text Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = evento.titulo.toLowerCase().includes(q);
      const matchDesc = (evento.descricao || "").toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }

    // 3. Label Filter
    if (filterLabel) {
      if (!evento.labels || !evento.labels.includes(filterLabel)) return false;
    }

    // 4. Member Filter
    if (filterMember) {
      if (!evento.membros_atribuidos || !evento.membros_atribuidos.includes(filterMember)) return false;
    }

    // 5. Prazo/Deadline Filter
    if (filterPrazo) {
      if (!evento.data) return false;
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const amanha = new Date(hoje);
      amanha.setDate(amanha.getDate() + 1);
      const data = new Date(evento.data + "T00:00:00");

      if (filterPrazo === "atrasado" && (data >= hoje || evento.prazo_concluido)) return false;
      if (filterPrazo === "amanha" && (data.getTime() !== amanha.getTime() || evento.prazo_concluido)) return false;
      if (filterPrazo === "concluido" && !evento.prazo_concluido) return false;
    }

    return true;
  });

  const activeBg = BACKGROUNDS.find(b => b.id === (config?.board_background)) || BACKGROUNDS[0];
  const boardListas = listas.filter(l => l.board_id === activeBoardId).sort((a, b) => a.ordem - b.ordem);
  const activeDragCard = activeDrag?.type === "card" ? eventos.find(e => e.id === activeDrag.id) : null;
  const activeDragList = activeDrag?.type === "list" ? boardListas.find(l => l.id === activeDrag.id) : null;

  return (
    <main className={`min-h-screen ${activeBg.id} pt-20 pb-20 transition-all duration-500`}>
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        
        {/* Guest Warning */}
        {guestToken && guestName && (
          <div className="mb-4 bg-amber-500/10 border border-amber-500/20 text-amber-800 rounded-xl px-4 py-2 flex items-center justify-between text-xs">
            <p className="font-light">
              <span className="font-semibold">Modo Visitante:</span> Você está acessando como <strong className="font-medium">{guestName}</strong> via link de convite.
            </p>
            <button 
              onClick={() => {
                sessionStorage.removeItem("kanban_guest_name");
                setGuestName(null);
                setShowGuestPrompt(true);
              }}
              className="text-amber-800 underline font-medium cursor-pointer"
            >
              Alterar Nome
            </button>
          </div>
        )}

        {/* Board Header Toolbar */}
        <div className="glass rounded-2xl p-4 md:p-6 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-white/20">
          <div>
            <div className="flex items-center gap-3">
              <Link
                to={user ? `/casa/${sigla}` : "/inicio"}
                className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600"
              >
                <ArrowLeft size={16} />
              </Link>
              <div className="relative">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold">
                  Projetos · {sigla}
                </p>
                <button
                  onClick={() => setShowBoardMenu(!showBoardMenu)}
                  className="mt-0.5 flex items-center gap-2 group cursor-pointer"
                >
                  <LayoutGrid size={18} className="text-cyan-600 shrink-0" />
                  <span style={{ fontFamily: '"Libre Caslon Text", Georgia, serif', fontSize: "1.35rem", fontWeight: 400, color: "#111418" }} className="truncate max-w-[60vw] group-hover:text-cyan-700 transition-colors">
                    {boards.find(b => b.id === activeBoardId)?.nome || "Selecionar projeto"}
                  </span>
                  <ChevronDown size={15} className="text-gray-400 group-hover:text-gray-600 shrink-0" />
                </button>

                {showBoardMenu && (
                  <div className="absolute left-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-2xl shadow-xl z-30 p-2 animate-fade-in-up">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-2 py-1">Seus projetos</p>
                    <div className="max-h-64 overflow-y-auto space-y-0.5">
                      {boards.map(b => (
                        <div key={b.id} className="group/board flex items-center gap-1">
                          {editingBoardId === b.id ? (
                            <div className="flex-1 flex gap-1 p-1">
                              <input
                                type="text"
                                value={editingBoardName}
                                onChange={e => setEditingBoardName(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && handleRenameBoard(b.id)}
                                autoFocus
                                className="flex-1 rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-800 focus:outline-none focus:border-cyan-600 bg-white"
                              />
                              <button onClick={() => handleRenameBoard(b.id)} className="p-1 bg-cyan-600 text-white rounded hover:bg-cyan-700 cursor-pointer"><Check size={12} /></button>
                              <button onClick={() => setEditingBoardId(null)} className="p-1 border border-gray-200 text-gray-500 rounded hover:bg-gray-50 cursor-pointer"><X size={12} /></button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => switchBoard(b.id)}
                                className={`flex-1 flex items-center justify-between px-2.5 py-2 rounded-lg text-xs text-left cursor-pointer ${
                                  b.id === activeBoardId ? "bg-cyan-50 text-cyan-700 font-semibold" : "text-gray-700 hover:bg-gray-50"
                                }`}
                              >
                                <span className="truncate">{b.nome}</span>
                                {b.id === activeBoardId && <Check size={13} className="shrink-0" />}
                              </button>
                              {user && (
                                <div className="flex gap-0.5 opacity-0 group-hover/board:opacity-100 transition-opacity pr-1">
                                  <button
                                    onClick={() => { setEditingBoardId(b.id); setEditingBoardName(b.nome); }}
                                    className="p-1 hover:bg-gray-200/50 rounded text-gray-500 cursor-pointer"
                                  >
                                    <Pencil size={11} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteBoard(b.id, b.nome)}
                                    className="p-1 hover:bg-red-50 rounded text-red-400 hover:text-red-500 cursor-pointer"
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      ))}
                    </div>

                    {user && (
                      <div className="border-t border-gray-100 mt-1.5 pt-1.5">
                        {showNewBoardForm ? (
                          <div className="p-1 space-y-1.5">
                            <input
                              type="text"
                              placeholder="Nome do novo projeto..."
                              value={newBoardName}
                              onChange={e => setNewBoardName(e.target.value)}
                              onKeyDown={e => e.key === "Enter" && handleAddBoard()}
                              autoFocus
                              className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-cyan-600"
                            />
                            <div className="flex gap-1.5">
                              <button onClick={handleAddBoard} className="flex-1 py-1.5 text-xs font-semibold bg-[#004a8c] text-white rounded-lg hover:bg-[#003c73] cursor-pointer">Criar projeto</button>
                              <button onClick={() => { setShowNewBoardForm(false); setNewBoardName(""); }} className="p-1.5 border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 cursor-pointer"><X size={13} /></button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowNewBoardForm(true)}
                            className="w-full flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold text-cyan-600 hover:bg-cyan-50 cursor-pointer"
                          >
                            <Plus size={13} /> Novo projeto
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-all cursor-pointer shadow-xs"
            >
              <Palette size={14} className="text-violet-600" />
              Fundo
            </button>
            <button
              onClick={handleCopyInvite}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-all cursor-pointer shadow-xs"
            >
              <Share2 size={14} className="text-cyan-600" />
              Convidar
            </button>
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-xs ${
                showArchived 
                  ? "bg-amber-100 border-amber-300 text-amber-800" 
                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Archive size={14} className="text-amber-600" />
              {showArchived ? "Ver Ativos" : "Arquivados"}
            </button>
          </div>
        </div>

        {/* Background Config Drawer */}
        {showConfig && (
          <div className="glass rounded-2xl p-5 mb-6 border border-white/20 animate-fade-in-up">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                <Palette size={14} className="text-violet-600" /> Alterar Plano de Fundo
              </h2>
              <button onClick={() => setShowConfig(false)} className="text-gray-400 hover:text-gray-600">
                <X size={15} />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {BACKGROUNDS.map(bg => (
                <button
                  key={bg.id}
                  onClick={() => handleChangeBackground(bg.id)}
                  className={`p-3 rounded-xl border text-xs font-medium transition-all text-center cursor-pointer ${
                    config?.board_background === bg.id
                      ? "border-violet-600 ring-2 ring-violet-600/20"
                      : "border-gray-200 hover:border-gray-300"
                  } ${bg.id}`}
                >
                  {bg.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Filters Panel */}
        <div className="glass rounded-2xl p-4 mb-6 border border-white/20 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar cards..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-xl bg-white/70 border border-gray-200 pl-9 pr-4 py-2 text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:border-cyan-600 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={filterLabel}
              onChange={e => setFilterLabel(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2 text-xs bg-white/70 text-gray-700 focus:outline-none focus:border-cyan-600"
            >
              <option value="">Todas Etiquetas</option>
              {ETIQUETAS.map(tag => (
                <option key={tag.id} value={tag.id}>{tag.label}</option>
              ))}
            </select>
            <select
              value={filterMember}
              onChange={e => setFilterMember(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2 text-xs bg-white/70 text-gray-700 focus:outline-none focus:border-cyan-600"
            >
              <option value="">Todos Responsáveis</option>
              {membrosCasa.map(m => (
                <option key={m.id} value={m.nome}>{m.nome}</option>
              ))}
            </select>
            <select
              value={filterPrazo}
              onChange={e => setFilterPrazo(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2 text-xs bg-white/70 text-gray-700 focus:outline-none focus:border-cyan-600"
            >
              <option value="">Todos Prazos</option>
              <option value="atrasado">Atrasados</option>
              <option value="amanha">Vencendo amanhã</option>
              <option value="concluido">Concluídos</option>
            </select>
            {(searchQuery || filterLabel || filterMember || filterPrazo) && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setFilterLabel("");
                  setFilterMember("");
                  setFilterPrazo("");
                }}
                className="text-xs text-cyan-600 hover:text-cyan-700 font-semibold cursor-pointer px-1"
              >
                Limpar Filtros
              </button>
            )}
          </div>
        </div>

        {/* Board lists layout */}
        {loadingBoard ? (
          <div className="py-20 text-center text-sm text-gray-500 font-light">Carregando quadro de projetos...</div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 overflow-x-auto pb-4 items-start select-none">

              {/* Render Lists (sortable horizontalmente) */}
              <SortableContext items={boardListas.map(l => l.id)} strategy={horizontalListSortingStrategy}>
                {boardListas.map(lista => (
                  <KanbanColumnWrapper
                    key={lista.id}
                    list={lista}
                    cards={filteredEventos.filter(e => e.lista_id === lista.id).sort((a, b) => a.ordem - b.ordem)}
                    editingListId={editingListId}
                    editingListName={editingListName}
                    setEditingListId={setEditingListId}
                    setEditingListName={setEditingListName}
                    handleRenameList={handleRenameList}
                    handleDeleteList={handleDeleteList}
                    showNewCardForm={showNewCardForm}
                    setShowNewCardForm={setShowNewCardForm}
                    newCardTitle={newCardTitle}
                    setNewCardTitle={setNewCardTitle}
                    handleCreateCard={handleCreateCard}
                    onCardClick={setSelectedCard}
                    membros={membrosCasa}
                  />
                ))}
              </SortableContext>

              {/* Add List Trigger */}
              {showNewListForm ? (
                <div className="min-w-[260px] bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                  <input
                    type="text"
                    placeholder="Título da lista..."
                    value={newListName}
                    onChange={e => setNewListName(e.target.value)}
                    autoFocus
                    className="w-full rounded-xl bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-cyan-600 mb-2"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddList}
                      className="flex-1 py-2 text-xs font-semibold bg-[#004a8c] text-white rounded-xl hover:bg-[#003c73] transition-colors cursor-pointer"
                    >
                      Adicionar
                    </button>
                    <button
                      onClick={() => setShowNewListForm(false)}
                      className="p-2 text-xs font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50 rounded-xl cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowNewListForm(true)}
                  className="min-w-[260px] flex items-center justify-center gap-1.5 py-4 border border-dashed border-white/40 rounded-2xl text-xs font-semibold text-gray-700 bg-white/30 hover:bg-white/50 hover:border-white/70 transition-all cursor-pointer shrink-0"
                >
                  <Plus size={14} />
                  Adicionar Lista
                </button>
              )}

            </div>

            {/* Drag Overlay (flutua sob o cursor, estilo Trello) */}
            <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)" }}>
              {activeDragCard ? (
                <div className="rotate-3 cursor-grabbing">
                  <CardPresentation card={activeDragCard} membros={membrosCasa} />
                </div>
              ) : activeDragList ? (
                <div className="min-w-[272px] max-w-[272px] rounded-2xl border border-cyan-300 bg-white shadow-xl p-4 rotate-2 cursor-grabbing">
                  <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider truncate">{activeDragList.nome}</h3>
                  <p className="text-[10px] text-gray-400 mt-1">{eventos.filter(e => e.lista_id === activeDragList.id && !e.arquivado).length} card(s)</p>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}

      </div>

      {/* ── Guest Access Prompt Modal ── */}
      {showGuestPrompt && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl space-y-4 border border-gray-100 animate-scale-up">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-cyan-50 border border-cyan-100 rounded-full flex items-center justify-center mx-auto text-cyan-600">
                <Sparkles size={22} />
              </div>
              <h2 style={{ fontFamily: '"Libre Caslon Text", Georgia, serif', fontSize: "1.25rem", color: "#111418" }}>
                Acesso de Convidado
              </h2>
              <p className="text-xs text-gray-500 font-light leading-relaxed">
                Você foi convidado para o quadro. Para colaborar (criar e mover cards, checklists e comentar), informe seu nome abaixo:
              </p>
            </div>
            <input
              type="text"
              placeholder="Digite seu nome..."
              value={tempGuestName}
              onChange={e => setTempGuestName(e.target.value)}
              autoFocus
              className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-cyan-600 transition-colors"
            />
            <button
              onClick={handleGuestPromptSubmit}
              className="w-full py-3 rounded-xl text-sm font-semibold uppercase tracking-widest text-white bg-[#004a8c] hover:bg-[#00386b] transition-all cursor-pointer shadow-md"
            >
              Começar a colaborar
            </button>
          </div>
        </div>
      )}

      {/* ── Card Details Modal (Trello style) ── */}
      {selectedCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col border border-gray-100 max-h-[90vh] animate-scale-up">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between">
              <div className="flex-1 pr-4">
                <input
                  type="text"
                  value={selectedCard.titulo}
                  onChange={e => handleUpdateCard({ ...selectedCard, titulo: e.target.value })}
                  className="w-full text-base font-semibold text-gray-800 bg-transparent border-b border-transparent hover:border-gray-200 focus:border-cyan-600 focus:outline-none transition-colors"
                />
                <p className="text-[10px] text-gray-400 mt-1 font-light flex items-center gap-1">
                  na lista <strong className="font-semibold">{listas.find(l => l.id === selectedCard.lista_id)?.nome}</strong>
                  {selectedCard.criador_nome && ` · Criado por ${selectedCard.criador_nome}`}
                </p>
              </div>
              <button 
                onClick={() => setSelectedCard(null)}
                className="p-1 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Left Column (Details, Checklists, Comments, Attachments) */}
              <div className="md:col-span-2 space-y-6">
                
                {/* Meta Summary Badges */}
                <div className="flex flex-wrap gap-2">
                  {selectedCard.labels && selectedCard.labels.map(lId => {
                    const tag = ETIQUETAS.find(t => t.id === lId);
                    if (!tag) return null;
                    return (
                      <span key={lId} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${tag.bg}`}>
                        {tag.label}
                      </span>
                    );
                  })}
                  {selectedCard.membros_atribuidos && selectedCard.membros_atribuidos.map(mNome => (
                    <span key={mNome} className="text-[10px] font-medium bg-cyan-50 border border-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <User size={10} />
                      {mNome}
                    </span>
                  ))}
                  {selectedCard.data && (
                    <span className={`text-[10px] font-medium border flex items-center gap-1 ${getPrazoInfo(selectedCard.data, selectedCard.prazo_concluido).cor}`}>
                      <Clock size={10} />
                      {fmtData(selectedCard.data)} {getPrazoInfo(selectedCard.data, selectedCard.prazo_concluido).texto}
                    </span>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                      <MessageSquare size={13} className="text-gray-400" /> Descrição
                    </h3>
                    {!editingDescription && (
                      <button
                        onClick={() => setEditingDescription(true)}
                        className="text-[10px] font-semibold text-cyan-600 hover:underline cursor-pointer"
                      >
                        Editar
                      </button>
                    )}
                  </div>

                  {editingDescription ? (
                    <div className="space-y-2">
                      <textarea
                        value={tempDescription}
                        onChange={e => setTempDescription(e.target.value)}
                        placeholder="Adicione detalhes sobre o projeto..."
                        rows={3}
                        className="w-full rounded-xl bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-cyan-600 transition-colors resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            handleUpdateCard({ ...selectedCard, descricao: tempDescription.trim() || null });
                            setEditingDescription(false);
                          }}
                          className="px-3 py-1.5 text-xs font-semibold bg-[#004a8c] text-white rounded-lg hover:bg-[#003c73] cursor-pointer"
                        >
                          Salvar
                        </button>
                        <button
                          onClick={() => {
                            setTempDescription(selectedCard.descricao || "");
                            setEditingDescription(false);
                          }}
                          className="px-3 py-1.5 text-xs font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50 rounded-lg cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-600 font-light whitespace-pre-wrap bg-gray-50/50 border border-gray-100 rounded-xl p-3 leading-relaxed">
                      {selectedCard.descricao || <span className="italic text-gray-400">Nenhuma descrição adicionada.</span>}
                    </p>
                  )}
                </div>

                {/* Attachments (Links) */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                    <Paperclip size={13} className="text-gray-400" /> Anexos e Links
                  </h3>
                  
                  {selectedCard.anexos && selectedCard.anexos.length > 0 && (
                    <div className="space-y-1.5 max-w-md">
                      {selectedCard.anexos.map((anexo, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs">
                          <a 
                            href={anexo.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="font-medium text-cyan-600 hover:underline truncate max-w-[80%]"
                          >
                            {anexo.nome}
                          </a>
                          <button
                            onClick={() => handleDeleteAttachment(idx)}
                            className="text-red-400 hover:text-red-600 p-0.5 rounded cursor-pointer"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Attachment */}
                  <div className="flex flex-col sm:flex-row gap-2 max-w-lg items-end">
                    <input
                      type="text"
                      placeholder="Nome do link..."
                      value={newAttachmentName}
                      onChange={e => setNewAttachmentName(e.target.value)}
                      className="w-full sm:w-1/3 rounded-lg border border-gray-200 px-2.5 py-1.5 text-[11px] focus:outline-none focus:border-cyan-600"
                    />
                    <input
                      type="text"
                      placeholder="URL (ex: drive.google.com)..."
                      value={newAttachmentUrl}
                      onChange={e => setNewAttachmentUrl(e.target.value)}
                      className="w-full sm:flex-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-[11px] focus:outline-none focus:border-cyan-600"
                    />
                    <button
                      onClick={handleAddAttachment}
                      disabled={!newAttachmentName.trim() || !newAttachmentUrl.trim()}
                      className="px-3 py-1.5 text-[11px] font-semibold bg-gray-100 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      Anexar
                    </button>
                  </div>
                </div>

                {/* Checklists (Nested Groups & Tasks) */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                      <CheckSquare size={13} className="text-gray-400" /> Checklists de Trabalho
                    </h3>
                    {!showNewChecklistForm && (
                      <button
                        onClick={() => setShowNewChecklistForm(true)}
                        className="text-[10px] font-semibold text-cyan-600 hover:underline cursor-pointer"
                      >
                        + Novo Checklist
                      </button>
                    )}
                  </div>

                  {showNewChecklistForm && (
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 max-w-sm space-y-2">
                      <input
                        type="text"
                        placeholder="Nome do checklist..."
                        value={newChecklistName}
                        onChange={e => setNewChecklistName(e.target.value)}
                        autoFocus
                        className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs focus:outline-none focus:border-cyan-600"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleAddChecklist}
                          className="px-2.5 py-1 text-xs font-semibold bg-cyan-600 text-white rounded hover:bg-cyan-700 cursor-pointer"
                        >
                          Criar
                        </button>
                        <button
                          onClick={() => setShowNewChecklistForm(false)}
                          className="px-2.5 py-1 text-xs font-semibold border border-gray-200 text-gray-500 rounded hover:bg-gray-50 cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}

                  {loadingCardDetails ? (
                    <p className="text-[10px] text-gray-400">Carregando checklists...</p>
                  ) : gruposCard.length === 0 ? (
                    <p className="text-[10px] text-gray-400 italic">Nenhum checklist criado para este projeto.</p>
                  ) : (
                    <div className="space-y-4">
                      {gruposCard.map(grupo => {
                        const total = grupo.kanban_tarefas.length;
                        const concluídas = grupo.kanban_tarefas.filter(t => t.feito).length;
                        const porcentagem = total > 0 ? Math.round((concluídas / total) * 100) : 0;

                        return (
                          <div key={grupo.id} className="bg-white border border-gray-150 rounded-xl p-4 shadow-xs space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-semibold text-gray-700">{grupo.nome}</h4>
                              <button
                                onClick={() => handleDeleteChecklist(grupo.id, grupo.nome)}
                                className="text-red-400 hover:text-red-500 p-0.5 rounded cursor-pointer"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>

                            {/* Progress bar */}
                            {total > 0 && (
                              <div className="flex items-center gap-3">
                                <span className="text-[9px] font-bold text-gray-500 w-8">{porcentagem}%</span>
                                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-emerald-500 transition-all duration-300"
                                    style={{ width: `${porcentagem}%` }}
                                  ></div>
                                </div>
                              </div>
                            )}

                            {/* Task List */}
                            {grupo.kanban_tarefas.length > 0 && (
                              <div className="space-y-2 border-t border-gray-50 pt-2">
                                {grupo.kanban_tarefas.map(tarefa => (
                                  <div key={tarefa.id} className="flex items-start justify-between gap-2 group/task text-xs">
                                    <label className="flex items-start gap-2 flex-1 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={tarefa.feito}
                                        onChange={e => handleToggleChecklistItem(tarefa.id, e.target.checked, grupo.id)}
                                        className="mt-0.5 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                                      />
                                      <span className={`${tarefa.feito ? "line-through text-gray-400" : "text-gray-600"}`}>
                                        {tarefa.titulo}
                                      </span>
                                    </label>
                                    <button
                                      onClick={() => handleDeleteChecklistItem(tarefa.id, grupo.id)}
                                      className="opacity-0 group-hover/task:opacity-100 text-red-300 hover:text-red-500 transition-opacity p-0.5 cursor-pointer"
                                    >
                                      <X size={10} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Add checklist item */}
                            {showNewChecklistItemForm === grupo.id ? (
                              <div className="space-y-2 pt-2 border-t border-gray-50">
                                <input
                                  type="text"
                                  placeholder="Nome da tarefa..."
                                  value={newChecklistItemTitle}
                                  onChange={e => setNewChecklistItemTitle(e.target.value)}
                                  autoFocus
                                  className="w-full rounded-lg border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:border-cyan-600"
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleAddChecklistItem(grupo.id)}
                                    className="px-2 py-1 text-[10px] font-semibold bg-cyan-600 text-white rounded hover:bg-cyan-700 cursor-pointer"
                                  >
                                    Adicionar
                                  </button>
                                  <button
                                    onClick={() => {
                                      setNewChecklistItemTitle("");
                                      setShowNewChecklistItemForm(null);
                                    }}
                                    className="px-2 py-1 text-[10px] font-semibold border border-gray-200 text-gray-500 rounded hover:bg-gray-50 cursor-pointer"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => setShowNewChecklistItemForm(grupo.id)}
                                className="text-[10px] font-semibold text-cyan-600 hover:text-cyan-700 flex items-center gap-1 cursor-pointer pt-1"
                              >
                                <Plus size={10} /> Adicionar Item
                              </button>
                            )}

                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Comments & Activities timeline */}
                <div className="space-y-4 border-t border-gray-100 pt-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                    <MessageSquare size={13} className="text-gray-400" /> Comentários
                  </h3>

                  {/* Add comment */}
                  <div className="flex items-start gap-3 max-w-xl">
                    <div className="w-8 h-8 rounded-full bg-cyan-100 border border-cyan-200 flex items-center justify-center shrink-0 text-cyan-600 text-xs font-bold uppercase">
                      {user ? (profile?.nome?.slice(0, 2) || "ME") : (guestName?.slice(0, 2) || "VI")}
                    </div>
                    <div className="flex-1 space-y-2">
                      <textarea
                        value={newCommentText}
                        onChange={e => setNewCommentText(e.target.value)}
                        placeholder="Escreva um comentário..."
                        rows={2}
                        className="w-full rounded-xl bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-cyan-600 transition-colors resize-none"
                      />
                      <button
                        onClick={handleAddComment}
                        disabled={!newCommentText.trim()}
                        className="px-3 py-1.5 text-xs font-semibold bg-[#004a8c] text-white rounded-lg hover:bg-[#003c73] transition-colors disabled:opacity-45 cursor-pointer"
                      >
                        Comentar
                      </button>
                    </div>
                  </div>

                  {/* Comments Timeline */}
                  {loadingCardDetails ? (
                    <p className="text-[10px] text-gray-400">Carregando comentários...</p>
                  ) : (
                    <div className="space-y-3 pt-2 max-w-xl">
                      {comentariosCard.map(comment => {
                        const isMyComment = user ? (comment.user_id === user.id) : (comment.autor_nome === guestName);
                        
                        return (
                          <div key={comment.id} className="flex items-start gap-3 bg-gray-50/45 border border-gray-100 rounded-2xl p-3 animate-fade-in-up">
                            <div className="w-8 h-8 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center shrink-0 text-gray-600 text-[10px] font-bold uppercase">
                              {comment.autor_nome?.slice(0, 2)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-gray-700">{comment.autor_nome}</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] text-gray-400">
                                    {new Date(comment.created_at).toLocaleString("pt-BR", {
                                      day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit"
                                    })}
                                  </span>
                                  {isMyComment && (
                                    <button 
                                      onClick={() => handleDeleteComment(comment.id)}
                                      className="text-red-300 hover:text-red-500 p-0.5 rounded cursor-pointer"
                                    >
                                      <X size={10} />
                                    </button>
                                  )}
                                </div>
                              </div>
                              <p className="text-xs text-gray-600 font-light mt-1 whitespace-pre-wrap">{comment.comentario}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>

              </div>

              {/* Right Column (Settings and Actions) */}
              <div className="space-y-4">
                
                {/* Labels Selector */}
                <div className="relative">
                  <button
                    onClick={() => setShowAddLabelMenu(!showAddLabelMenu)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-all cursor-pointer bg-white"
                  >
                    <span className="flex items-center gap-1.5"><Tag size={13} className="text-gray-400" /> Etiquetas</span>
                    <ChevronDown size={12} className="text-gray-400" />
                  </button>
                  
                  {showAddLabelMenu && (
                    <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl p-2.5 shadow-lg z-10 space-y-1">
                      {ETIQUETAS.map(tag => {
                        const active = selectedCard.labels && selectedCard.labels.includes(tag.id);
                        return (
                          <button
                            key={tag.id}
                            onClick={() => {
                              const labels = selectedCard.labels || [];
                              const newLabels = active 
                                ? labels.filter(id => id !== tag.id) 
                                : [...labels, tag.id];
                              handleUpdateCard({ ...selectedCard, labels: newLabels });
                            }}
                            className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-medium cursor-pointer ${tag.bg}`}
                          >
                            <span className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${tag.dot}`}></span>
                              {tag.label}
                            </span>
                            {active && <Check size={12} />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Member Selector */}
                <div className="relative">
                  <button
                    onClick={() => setShowAddMemberMenu(!showAddMemberMenu)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-all cursor-pointer bg-white"
                  >
                    <span className="flex items-center gap-1.5"><Users size={13} className="text-gray-400" /> Membros</span>
                    <ChevronDown size={12} className="text-gray-400" />
                  </button>
                  
                  {showAddMemberMenu && (
                    <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl p-2 shadow-lg z-10 max-h-48 overflow-y-auto space-y-0.5">
                      {membrosCasa.map(m => {
                        const active = selectedCard.membros_atribuidos && selectedCard.membros_atribuidos.includes(m.nome);
                        return (
                          <button
                            key={m.id}
                            onClick={() => {
                              const membros = selectedCard.membros_atribuidos || [];
                              const newMembros = active 
                                ? membros.filter(n => n !== m.nome) 
                                : [...membros, m.nome];
                              
                              // Legacy compatibility for single responsavel string
                              const mainResp = newMembros.length > 0 ? newMembros[0] : null;
                              
                              handleUpdateCard({ 
                                ...selectedCard, 
                                membros_atribuidos: newMembros,
                                responsavel: mainResp
                              });
                            }}
                            className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg text-xs text-left cursor-pointer text-gray-700"
                          >
                            {m.nome}
                            {active && <Check size={12} className="text-cyan-600" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Cover Color */}
                <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-2">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                    <ImageIcon size={13} className="text-gray-400" /> Capa
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {COVERS.map(c => (
                      <button
                        key={c.id}
                        onClick={() => handleUpdateCard({ ...selectedCard, cover: selectedCard.cover === c.id ? null : c.id })}
                        title={c.id}
                        className={`w-7 h-7 rounded-lg ${c.css} transition-transform hover:scale-110 cursor-pointer ${
                          selectedCard.cover === c.id ? "ring-2 ring-offset-1 ring-gray-700" : ""
                        }`}
                      />
                    ))}
                    {selectedCard.cover && (
                      <button
                        onClick={() => handleUpdateCard({ ...selectedCard, cover: null })}
                        title="Remover capa"
                        className="w-7 h-7 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 flex items-center justify-center cursor-pointer"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Date Picker & Completion */}
                <div className="bg-gray-50 border border-gray-150 rounded-xl p-4 space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500 flex items-center gap-1">
                      <Calendar size={11} /> Prazo Estimado
                    </label>
                    <input
                      type="date"
                      value={selectedCard.data || ""}
                      onChange={e => handleUpdateCard({ ...selectedCard, data: e.target.value || null })}
                      className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs focus:outline-none focus:border-cyan-600 bg-white text-gray-700"
                    />
                  </div>
                  
                  {selectedCard.data && (
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-600">
                      <input
                        type="checkbox"
                        checked={selectedCard.prazo_concluido}
                        onChange={e => handleUpdateCard({ ...selectedCard, prazo_concluido: e.target.checked })}
                        className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                      />
                      Marcar data como concluída
                    </label>
                  )}
                </div>

                {/* Move Card Option */}
                <div className="relative">
                  <button
                    onClick={() => setShowMoveCardMenu(!showMoveCardMenu)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-all cursor-pointer bg-white"
                  >
                    <span className="flex items-center gap-1.5"><ChevronRight size={13} className="text-gray-400" /> Mover para Lista</span>
                    <ChevronDown size={12} className="text-gray-400" />
                  </button>
                  
                  {showMoveCardMenu && (
                    <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl p-2 shadow-lg z-10 space-y-0.5">
                      {boardListas.map(l => {
                        const active = selectedCard.lista_id === l.id;
                        return (
                          <button
                            key={l.id}
                            disabled={active}
                            onClick={() => {
                              handleUpdateCard({ ...selectedCard, lista_id: l.id });
                              setShowMoveCardMenu(false);
                              toast.success(`Movido para ${l.nome}`);
                            }}
                            className={`w-full flex items-center justify-between p-2 rounded-lg text-xs text-left cursor-pointer ${
                              active ? "text-cyan-600 font-semibold bg-cyan-50" : "text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            {l.nome}
                            {active && <Check size={12} />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Archiving & Delete Actions */}
                <div className="pt-4 border-t border-gray-150 space-y-2">
                  <button
                    onClick={() => {
                      const updated = { ...selectedCard, arquivado: !selectedCard.arquivado };
                      handleUpdateCard(updated);
                      setSelectedCard(null);
                      toast.success(updated.arquivado ? "Card arquivado." : "Card restaurado.");
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-all cursor-pointer bg-white"
                  >
                    <Archive size={14} className="text-amber-600" />
                    {selectedCard.arquivado ? "Desarquivar Card" : "Arquivar Card"}
                  </button>
                  
                  <button
                    onClick={() => handleDeleteCard(selectedCard.id)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50 transition-all cursor-pointer bg-white"
                  >
                    <Trash2 size={14} className="text-red-500" />
                    Excluir Card
                  </button>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

      {/* Archived Cards List Modal */}
      {showArchived && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl flex flex-col border border-gray-100 max-h-[80vh] animate-scale-up">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                <Archive size={14} className="text-amber-600" /> Cards Arquivados
              </h2>
              <button onClick={() => setShowArchived(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X size={15} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredEventos.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-8 italic">Nenhum card arquivado nesta busca.</p>
              ) : (
                filteredEventos.map(evento => (
                  <div key={evento.id} className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
                    <span className="text-xs font-medium text-gray-700 truncate max-w-[60%]">{evento.titulo}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          handleUpdateCard({ ...evento, arquivado: false });
                          toast.success("Card restaurado.");
                        }}
                        title="Restaurar Card"
                        className="p-1 text-cyan-600 hover:bg-cyan-50 rounded-lg text-xs flex items-center gap-1 font-semibold cursor-pointer"
                      >
                        <Undo size={12} /> Restaurar
                      </button>
                      <button
                        onClick={() => handleDeleteCard(evento.id)}
                        title="Excluir Definitivamente"
                        className="p-1 text-red-500 hover:bg-red-50 rounded-lg text-xs cursor-pointer"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </main>
  );
}

// ── Kanban Column Wrapper (useDroppable) ──
interface ColumnProps {
  list: KanbanLista;
  cards: KanbanEvento[];
  editingListId: string | null;
  editingListName: string;
  setEditingListId: (id: string | null) => void;
  setEditingListName: (name: string) => void;
  handleRenameList: (id: string) => void;
  handleDeleteList: (id: string, name: string) => void;
  showNewCardForm: string | null;
  setShowNewCardForm: (id: string | null) => void;
  newCardTitle: string;
  setNewCardTitle: (title: string) => void;
  handleCreateCard: (listId: string) => void;
  onCardClick: (card: KanbanEvento) => void;
  membros: { id: string; nome: string }[];
}

function KanbanColumnWrapper({
  list, cards, editingListId, editingListName, setEditingListId, setEditingListName,
  handleRenameList, handleDeleteList, showNewCardForm, setShowNewCardForm,
  newCardTitle, setNewCardTitle, handleCreateCard, onCardClick, membros
}: ColumnProps) {

  const isEditing = editingListId === list.id;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: list.id, data: { type: "list" } });
  const { setNodeRef: setCardDropRef, isOver } = useDroppable({ id: `col-${list.id}`, data: { type: "column", listId: list.id } });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className={`min-w-[272px] max-w-[272px] flex-shrink-0 rounded-2xl border p-4 transition-colors duration-300 ${
        isOver ? "bg-white/90 border-cyan-300 shadow-md" : "bg-white/60 border-white/20"
      } glass shrink-0`}
    >

      {/* List Header */}
      <div className="flex items-center justify-between mb-3 gap-2">
        {isEditing ? (
          <div className="flex-1 flex gap-1">
            <input
              type="text"
              value={editingListName}
              onChange={e => setEditingListName(e.target.value)}
              autoFocus
              className="flex-1 rounded-lg border border-gray-200 px-2 py-0.5 text-xs text-gray-800 focus:outline-none focus:border-cyan-600 bg-white"
            />
            <button
              onClick={() => handleRenameList(list.id)}
              className="p-1 bg-cyan-600 text-white rounded hover:bg-cyan-700 cursor-pointer"
            >
              <Check size={12} />
            </button>
            <button
              onClick={() => setEditingListId(null)}
              className="p-1 border border-gray-200 text-gray-500 rounded hover:bg-gray-50 cursor-pointer"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <>
            <button
              {...attributes}
              {...listeners}
              className="p-0.5 -ml-1 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none shrink-0"
              title="Arraste para reordenar a lista"
            >
              <GripVertical size={13} />
            </button>
            <h3
              onDoubleClick={() => {
                setEditingListId(list.id);
                setEditingListName(list.nome);
              }}
              className="text-xs font-bold text-gray-700 uppercase tracking-wider truncate cursor-pointer hover:text-gray-900 flex-1"
            >
              {list.nome}
            </h3>
            <span className="text-[10px] font-bold text-gray-400 bg-white border border-gray-100/50 rounded-full px-2 py-0.5 shrink-0 select-none">
              {cards.length}
            </span>
            <div className="flex gap-0.5 shrink-0 opacity-40 hover:opacity-100 transition-opacity">
              <button
                onClick={() => {
                  setEditingListId(list.id);
                  setEditingListName(list.nome);
                }}
                className="p-1 hover:bg-gray-200/50 rounded text-gray-500 cursor-pointer"
              >
                <Pencil size={11} />
              </button>
              <button
                onClick={() => handleDeleteList(list.id, list.nome)}
                className="p-1 hover:bg-red-50 rounded text-red-400 hover:text-red-500 cursor-pointer"
              >
                <Trash2 size={11} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Cards List container (droppable + sortable) */}
      <div ref={setCardDropRef} className="space-y-3 max-h-[55vh] overflow-y-auto pr-1 min-h-[12px]">
        <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map(card => (
            <KanbanCardWrapper
              key={card.id}
              card={card}
              onCardClick={onCardClick}
              membros={membros}
            />
          ))}
        </SortableContext>
        {cards.length === 0 && (
          <div className="text-[10px] text-gray-300 italic text-center py-3 select-none">Solte cards aqui</div>
        )}
      </div>

      {/* Add Card form */}
      {showNewCardForm === list.id ? (
        <div className="mt-3 bg-white border border-gray-100 rounded-xl p-3 shadow-xs">
          <input
            type="text"
            placeholder="Título do card..."
            value={newCardTitle}
            onChange={e => setNewCardTitle(e.target.value)}
            autoFocus
            className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-cyan-600 mb-2"
          />
          <div className="flex gap-1.5">
            <button
              onClick={() => handleCreateCard(list.id)}
              className="flex-1 py-1 text-xs font-semibold bg-[#004a8c] text-white rounded-lg hover:bg-[#003c73] transition-colors cursor-pointer"
            >
              Adicionar
            </button>
            <button
              onClick={() => {
                setNewCardTitle("");
                setShowNewCardForm(null);
              }}
              className="p-1 text-xs border border-gray-200 text-gray-500 hover:bg-gray-50 rounded-lg cursor-pointer"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowNewCardForm(list.id)}
          className="mt-3 w-full flex items-center gap-1.5 py-1.5 text-[10px] text-gray-500 hover:text-[#004a8c] transition-colors justify-center font-bold border border-dashed border-gray-200 hover:border-gray-300 rounded-xl bg-white/50 cursor-pointer"
        >
          <Plus size={12} />
          Criar Card
        </button>
      )}

    </div>
  );
}

// ── Kanban Card Wrapper (sortable) ──
interface CardProps {
  card: KanbanEvento;
  onCardClick: (card: KanbanEvento) => void;
  membros: { id: string; nome: string }[];
}

function KanbanCardWrapper({ card, onCardClick, membros }: CardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id, data: { type: "card" } });
  const startCoords = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    startCoords.current = { x: e.clientX, y: e.clientY };
  };

  const handleCardClick = (e: React.MouseEvent) => {
    const distance = Math.sqrt(
      Math.pow(e.clientX - startCoords.current.x, 2) +
      Math.pow(e.clientY - startCoords.current.y, 2)
    );
    if (distance > 5) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onCardClick(card);
  };

  return (
    <div
      ref={setNodeRef}
      onPointerDown={handlePointerDown}
      onClick={handleCardClick}
      {...listeners}
      {...attributes}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.35 : 1,
      }}
      className="touch-none cursor-grab active:cursor-grabbing group"
    >
      <CardPresentation card={card} membros={membros} />
    </div>
  );
}

// ── Card Presentation (visual compartilhado entre coluna e DragOverlay) ──
function CardPresentation({ card, membros }: { card: KanbanEvento; membros: { id: string; nome: string }[] }) {
  const cover = coverCss(card.cover);
  const assigned = (card.membros_atribuidos && card.membros_atribuidos.length > 0)
    ? card.membros_atribuidos
    : (card.responsavel ? [card.responsavel] : []);

  return (
    <div className="bg-white rounded-[14px] border border-[rgba(0,20,70,.07)] shadow-[0_1px_3px_rgba(0,20,70,.015),0_2px_5px_rgba(0,20,70,.02)] hover:shadow-md hover:border-cyan-100 transition-all relative overflow-hidden">

      {/* Cover color bar */}
      {cover && <div className={`h-2.5 w-full ${cover}`} />}

      <div className="p-3.5">
        {/* Labels row */}
        {card.labels && card.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2 pr-6">
            {card.labels.map(lId => {
              const tag = ETIQUETAS.find(t => t.id === lId);
              if (!tag) return null;
              return (
                <span key={lId} className={`w-3.5 h-1.5 rounded-full ${tag.dot}`} title={tag.label}></span>
              );
            })}
          </div>
        )}

        {/* Card title */}
        <p className="text-xs font-semibold text-gray-800 leading-snug pr-1">{card.titulo}</p>

        {/* Description preview */}
        {card.descricao && (
          <p className="text-[10px] text-gray-400 font-light mt-1.5 line-clamp-2 leading-relaxed">
            {card.descricao}
          </p>
        )}

        {/* Badges footer */}
        {(card.data || assigned.length > 0 || (card.anexos && card.anexos.length > 0)) && (
          <div className="mt-2.5 pt-2 border-t border-gray-50 flex items-center justify-between flex-wrap gap-1.5 text-[9px] text-gray-400 font-light">

            <div className="flex items-center gap-1.5">
              {card.data && (
                <span className={`flex items-center gap-0.5 ${getPrazoInfo(card.data, card.prazo_concluido).cor.split(" ")[0]}`}>
                  {card.prazo_concluido ? <CheckCircle2 size={10} className="text-emerald-500" /> : <Clock size={10} />}
                  {fmtData(card.data)}
                </span>
              )}
              {card.anexos && card.anexos.length > 0 && (
                <span className="flex items-center gap-0.5">
                  <Paperclip size={9} />
                  {card.anexos.length}
                </span>
              )}
            </div>

            {/* Member avatars */}
            {assigned.length > 0 && (
              <div className="flex -space-x-1.5">
                {assigned.slice(0, 3).map(nome => (
                  <span
                    key={nome}
                    title={nome}
                    className={`w-5 h-5 rounded-full ${avatarColor(nome)} text-white text-[8px] font-bold flex items-center justify-center ring-2 ring-white`}
                  >
                    {avatarInitials(nome)}
                  </span>
                ))}
                {assigned.length > 3 && (
                  <span className="w-5 h-5 rounded-full bg-gray-300 text-gray-700 text-[8px] font-bold flex items-center justify-center ring-2 ring-white">
                    +{assigned.length - 3}
                  </span>
                )}
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
