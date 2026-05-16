import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import {
  Building2, MapPin, Phone, Mail, Globe, Clock,
  QrCode, Copy, Check, Plus, Trash2, Pin, PinOff,
  Edit3, Save, X, Users, Shield, Calendar,
  MessageSquare, Info, Heart, UserPlus, UserMinus,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/casa/$sigla")({
  component: PaginaCasa,
});

/* ── Types ─────────────────────────────────────────────────────── */

type Aba = "mural" | "sobre" | "programacao" | "doacoes";

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

interface HorarioItem {
  dia: string;
  hora: string;
  atividade: string;
}

interface Post {
  id: string;
  sigla_casa: string;
  autor_id: string | null;
  autor_nome: string;
  conteudo: string;
  fixado: boolean;
  created_at: string;
}

interface Membro {
  id: string;
  nome: string;
}

const DIAS = [
  "Segunda-feira", "Terça-feira", "Quarta-feira",
  "Quinta-feira", "Sexta-feira", "Sábado", "Domingo",
];

/* ── Component ──────────────────────────────────────────────────── */

function PaginaCasa() {
  const { sigla } = Route.useParams();
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  // UI
  const [aba, setAba] = useState<Aba>("mural");
  const [modoAdmin, setModoAdmin] = useState(false);

  // Data
  const [pagina, setPagina] = useState<PaginaData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [adminIds, setAdminIds] = useState<string[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Edit toggles
  const [editSobre, setEditSobre] = useState(false);
  const [editDoacoes, setEditDoacoes] = useState(false);
  const [showNovoPost, setShowNovoPost] = useState(false);
  const [showAdmins, setShowAdmins] = useState(false);
  const [showNovoHorario, setShowNovoHorario] = useState(false);

  // Forms
  const [formSobre, setFormSobre] = useState<Partial<PaginaData>>({});
  const [formDoacoes, setFormDoacoes] = useState({ chave_pix: "", texto_doacao: "" });
  const [textoPost, setTextoPost] = useState("");
  const [novoHorario, setNovoHorario] = useState({ dia: DIAS[0], hora: "", atividade: "" });

  // Admin management
  const [membros, setMembros] = useState<Membro[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  /* ── Admin check ── */
  const isAdmin = !loading && !!user && !!profile && (
    profile.cargo_principal === "DEV" ||
    (profile.sigla_casa === sigla && (
      profile.cargo_principal === "Presidente" ||
      profile.cargo_principal === "Vice-presidente"
    )) ||
    adminIds.includes(user.id)
  );

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
    const [pRes, posRes, aRes] = await Promise.all([
      supabase.from("paginas_casas").select("*").eq("sigla_casa", sigla).maybeSingle(),
      supabase.from("publicacoes_casa").select("*").eq("sigla_casa", sigla)
        .order("fixado", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase.from("administradores_pagina").select("user_id").eq("sigla_casa", sigla),
    ]);
    if (pRes.data) setPagina(pRes.data as PaginaData);
    if (posRes.data) setPosts(posRes.data as Post[]);
    if (aRes.data) setAdminIds(aRes.data.map((a: { user_id: string }) => a.user_id));
    setCarregando(false);
  }, [sigla]);

  useEffect(() => {
    if (!loading && user) carregar();
  }, [loading, user, carregar]);

  /* ── Load members for admin management ── */
  const carregarMembros = useCallback(async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, nome")
      .eq("sigla_casa", sigla)
      .order("nome");
    if (data) setMembros(data as Membro[]);
  }, [sigla]);

  /* ── Actions ── */
  const salvarSobre = async () => {
    setSalvando(true);
    const { error } = await supabase.from("paginas_casas")
      .update({ ...formSobre }).eq("sigla_casa", sigla);
    setSalvando(false);
    if (error) { toast.error("Erro ao salvar."); return; }
    setPagina(prev => prev ? { ...prev, ...formSobre } : prev);
    setEditSobre(false);
    toast.success("Página atualizada.");
  };

  const salvarDoacoes = async () => {
    setSalvando(true);
    const { error } = await supabase.from("paginas_casas")
      .update({ ...formDoacoes }).eq("sigla_casa", sigla);
    setSalvando(false);
    if (error) { toast.error("Erro ao salvar."); return; }
    setPagina(prev => prev ? { ...prev, ...formDoacoes } : prev);
    setEditDoacoes(false);
    toast.success("Doações atualizadas.");
  };

  const publicarPost = async () => {
    if (!textoPost.trim()) return;
    const { data, error } = await supabase.from("publicacoes_casa").insert({
      sigla_casa: sigla,
      autor_id: user!.id,
      autor_nome: profile?.nome || "Membro",
      conteudo: textoPost.trim(),
      fixado: false,
    }).select().single();
    if (error || !data) { toast.error("Erro ao publicar."); return; }
    setPosts(prev => [data as Post, ...prev]);
    setTextoPost("");
    setShowNovoPost(false);
    toast.success("Publicado no mural.");
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

  const adicionarHorario = async () => {
    if (!novoHorario.hora || !novoHorario.atividade.trim()) {
      toast.error("Preencha horário e atividade.");
      return;
    }
    const updated = [...(pagina!.horarios ?? []), { ...novoHorario }];
    const { error } = await supabase.from("paginas_casas")
      .update({ horarios: updated }).eq("sigla_casa", sigla);
    if (error) { toast.error("Erro ao salvar."); return; }
    setPagina(prev => prev ? { ...prev, horarios: updated } : prev);
    setNovoHorario({ dia: DIAS[0], hora: "", atividade: "" });
    setShowNovoHorario(false);
  };

  const removerHorario = async (idx: number) => {
    const updated = (pagina!.horarios ?? []).filter((_, i) => i !== idx);
    const { error } = await supabase.from("paginas_casas")
      .update({ horarios: updated }).eq("sigla_casa", sigla);
    if (error) { toast.error("Erro ao remover."); return; }
    setPagina(prev => prev ? { ...prev, horarios: updated } : prev);
  };

  const adicionarAdmin = async (membroId: string) => {
    if (adminIds.includes(membroId)) return;
    const { error } = await supabase.from("administradores_pagina").insert({
      sigla_casa: sigla,
      user_id: membroId,
      adicionado_por: user!.id,
    });
    if (error) { toast.error("Erro ao adicionar."); return; }
    setAdminIds(prev => [...prev, membroId]);
    toast.success("Administrador adicionado.");
  };

  const removerAdmin = async (membroId: string) => {
    const { error } = await supabase.from("administradores_pagina")
      .delete().eq("sigla_casa", sigla).eq("user_id", membroId);
    if (error) { toast.error("Erro ao remover."); return; }
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
        profile.cargo_principal === "Presidente" ||
        profile.cargo_principal === "Vice-presidente"
      ));
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
                  texto_doacao: "Sua contribuição ajuda a manter os trabalhos espíritas. Qualquer valor é bem-vindo. Gratidão.",
                  publicada: true,
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
              Somente o Presidente pode criar a página da casa.
            </p>
          )}
          <Link to="/inicio" className="block text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors">
            ← Voltar ao início
          </Link>
        </div>
      </main>
    );
  }

  /* ── Main page ── */
  return (
    <main className="page-light min-h-screen pt-14 pb-20">

      {/* ── Capa ── */}
      <div className="h-32 md:h-44 bg-gradient-to-br from-cyan-50 via-slate-100 to-indigo-50 border-b border-white/30" />

      <div className="mx-auto max-w-4xl px-4">

        {/* ── Identidade ── */}
        <div className="-mt-9 flex items-end gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-white shadow-md border border-white/60 flex items-center justify-center shrink-0">
            <Building2 size={28} strokeWidth={1.5} className="text-cyan-700" />
          </div>
          <div className="pb-1 min-w-0">
            <h1 className="text-xl font-medium text-foreground leading-tight truncate">
              {pagina.nome_completo || sigla}
            </h1>
            <p className="text-xs text-muted-foreground/60 mt-0.5">
              {sigla}{pagina.cidade ? ` · ${pagina.cidade}/${pagina.uf}` : ""}
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setModoAdmin(m => !m)}
              className={`ml-auto shrink-0 flex items-center gap-2 text-xs uppercase tracking-widest px-4 py-2 rounded-xl border transition-colors ${
                modoAdmin
                  ? "border-amber-400/60 text-amber-600 bg-amber-50"
                  : "border-white/20 text-muted-foreground/60 hover:border-cyan-glow/40 hover:text-cyan-glow"
              }`}
            >
              <Shield size={13} />
              {modoAdmin ? "Visitante" : "Administrar"}
            </button>
          )}
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-0.5 border-b border-white/10 mb-6 overflow-x-auto">
          {([
            { id: "mural",       label: "Mural",       Icon: MessageSquare },
            { id: "sobre",       label: "Sobre",        Icon: Info },
            { id: "programacao", label: "Programação",  Icon: Calendar },
            { id: "doacoes",     label: "Doações",      Icon: Heart },
          ] as { id: Aba; label: string; Icon: LucideIcon }[]).map(t => (
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

        {/* ══ MURAL ══════════════════════════════════════════════════ */}
        {aba === "mural" && (
          <div className="space-y-4">

            {/* Criar publicação (admin) */}
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
                  <div className="space-y-3">
                    <textarea
                      value={textoPost}
                      onChange={e => setTextoPost(e.target.value)}
                      maxLength={2000}
                      rows={4}
                      placeholder="Escreva o comunicado ou aviso para a comunidade…"
                      className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-foreground placeholder-muted-foreground/40 focus:outline-none focus:border-cyan-glow/40 transition-colors resize-none"
                    />
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-muted-foreground/40">{textoPost.length}/2000</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setShowNovoPost(false); setTextoPost(""); }}
                          className="px-4 py-2 rounded-xl text-xs text-muted-foreground border border-white/10 hover:bg-white/5 transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={publicarPost}
                          disabled={!textoPost.trim()}
                          className="px-5 py-2 rounded-xl text-xs uppercase tracking-widest text-cyan-glow border border-cyan-glow/40 hover:bg-cyan-glow/10 disabled:opacity-40 transition-colors"
                        >
                          Publicar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Lista de publicações */}
            {posts.length === 0 ? (
              <div className="glass rounded-2xl p-10 text-center">
                <MessageSquare size={32} strokeWidth={1} className="text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground/50">Nenhuma publicação no mural ainda.</p>
              </div>
            ) : posts.map(post => (
              <article key={post.id} className={`glass rounded-2xl p-5 space-y-3 ${post.fixado ? "border border-amber-200/50" : ""}`}>
                {post.fixado && (
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-amber-500">
                    <Pin size={11} />
                    Fixado
                  </div>
                )}
                <p className="text-sm text-foreground font-light leading-relaxed whitespace-pre-wrap">{post.conteudo}</p>
                <div className="flex items-center justify-between gap-3 pt-1 border-t border-white/5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground/50">
                    <span>{post.autor_nome}</span>
                    <span>·</span>
                    <span>{format(new Date(post.created_at), "d 'de' MMM 'de' yyyy", { locale: ptBR })}</span>
                  </div>
                  {modoAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleFixar(post)}
                        title={post.fixado ? "Desafixar" : "Fixar no topo"}
                        className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-amber-500 hover:bg-amber-50 transition-colors"
                      >
                        {post.fixado ? <PinOff size={14} /> : <Pin size={14} />}
                      </button>
                      <button
                        onClick={() => excluirPost(post.id)}
                        title="Excluir publicação"
                        className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {/* ══ SOBRE ══════════════════════════════════════════════════ */}
        {aba === "sobre" && (
          <div className="space-y-4">
            {modoAdmin && !editSobre && (
              <div className="flex justify-end">
                <button
                  onClick={() => { setFormSobre({ ...pagina }); setEditSobre(true); }}
                  className="flex items-center gap-2 text-xs uppercase tracking-widest text-cyan-glow border border-cyan-glow/30 px-4 py-2 rounded-xl hover:bg-cyan-glow/10 transition-colors"
                >
                  <Edit3 size={13} />
                  Editar informações
                </button>
              </div>
            )}

            {editSobre ? (
              /* ── Formulário de edição ── */
              <div className="glass rounded-2xl p-6 space-y-5">
                <h2 className="text-sm font-medium text-foreground">Editar informações da casa</h2>

                <Field label="Nome completo da casa">
                  <input
                    value={formSobre.nome_completo ?? ""}
                    onChange={e => setFormSobre(s => ({ ...s, nome_completo: e.target.value }))}
                    placeholder="Ex.: Centro Espírita Paz e Amor"
                    className={inputCls}
                  />
                </Field>

                <Field label="Descrição">
                  <textarea
                    value={formSobre.descricao ?? ""}
                    onChange={e => setFormSobre(s => ({ ...s, descricao: e.target.value }))}
                    rows={3}
                    placeholder="Apresentação da casa espírita…"
                    className={`${inputCls} resize-none`}
                  />
                </Field>

                <Field label="Missão">
                  <textarea
                    value={formSobre.missao ?? ""}
                    onChange={e => setFormSobre(s => ({ ...s, missao: e.target.value }))}
                    rows={2}
                    placeholder="Missão e valores do centro…"
                    className={`${inputCls} resize-none`}
                  />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Ano de fundação">
                    <input
                      type="number"
                      value={formSobre.ano_fundacao ?? ""}
                      onChange={e => setFormSobre(s => ({ ...s, ano_fundacao: e.target.value ? +e.target.value : null }))}
                      placeholder="Ex.: 1985"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="CEP">
                    <input
                      value={formSobre.cep ?? ""}
                      onChange={e => setFormSobre(s => ({ ...s, cep: e.target.value }))}
                      placeholder="00000-000"
                      className={inputCls}
                    />
                  </Field>
                </div>

                <Field label="Endereço">
                  <input
                    value={formSobre.endereco ?? ""}
                    onChange={e => setFormSobre(s => ({ ...s, endereco: e.target.value }))}
                    placeholder="Rua, número…"
                    className={inputCls}
                  />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Bairro">
                    <input
                      value={formSobre.bairro ?? ""}
                      onChange={e => setFormSobre(s => ({ ...s, bairro: e.target.value }))}
                      placeholder="Bairro"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Cidade">
                    <input
                      value={formSobre.cidade ?? ""}
                      onChange={e => setFormSobre(s => ({ ...s, cidade: e.target.value }))}
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
                      onChange={e => setFormSobre(s => ({ ...s, uf: e.target.value.toUpperCase() }))}
                      placeholder="SP"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Telefone">
                    <input
                      value={formSobre.telefone ?? ""}
                      onChange={e => setFormSobre(s => ({ ...s, telefone: e.target.value }))}
                      placeholder="(11) 99999-9999"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="E-mail de contato">
                    <input
                      type="email"
                      value={formSobre.email_contato ?? ""}
                      onChange={e => setFormSobre(s => ({ ...s, email_contato: e.target.value }))}
                      placeholder="contato@casa.org"
                      className={inputCls}
                    />
                  </Field>
                </div>

                <Field label="Site (opcional)">
                  <input
                    value={formSobre.site ?? ""}
                    onChange={e => setFormSobre(s => ({ ...s, site: e.target.value }))}
                    placeholder="https://…"
                    className={inputCls}
                  />
                </Field>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setEditSobre(false)}
                    className="flex-1 py-2.5 rounded-xl text-xs text-muted-foreground border border-white/10 hover:bg-white/5 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={salvarSobre}
                    disabled={salvando}
                    className="flex-1 py-2.5 rounded-xl text-xs uppercase tracking-widest text-cyan-glow border border-cyan-glow/40 hover:bg-cyan-glow/10 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
                  >
                    <Save size={13} />
                    {salvando ? "Salvando…" : "Salvar"}
                  </button>
                </div>
              </div>
            ) : (
              /* ── Display mode ── */
              <div className="space-y-4">
                {/* Descrição */}
                {(pagina.descricao || pagina.missao) && (
                  <div className="glass rounded-2xl p-6 space-y-4">
                    {pagina.descricao && (
                      <div>
                        <p className={labelCls}>Sobre a casa</p>
                        <p className="text-sm text-foreground/80 font-light leading-relaxed">{pagina.descricao}</p>
                      </div>
                    )}
                    {pagina.missao && (
                      <div className="border-t border-white/10 pt-4">
                        <p className={labelCls}>Missão</p>
                        <p className="text-sm text-foreground/80 font-light leading-relaxed">{pagina.missao}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Info cards */}
                <div className="glass rounded-2xl p-6 space-y-4">
                  {pagina.ano_fundacao && (
                    <InfoRow Icon={Building2} label="Fundada em" value={String(pagina.ano_fundacao)} />
                  )}
                  {pagina.endereco && (
                    <InfoRow
                      Icon={MapPin}
                      label="Endereço"
                      value={[pagina.endereco, pagina.bairro, pagina.cidade && `${pagina.cidade}/${pagina.uf}`, pagina.cep].filter(Boolean).join(", ")}
                    />
                  )}
                  {pagina.telefone && (
                    <InfoRow Icon={Phone} label="Telefone" value={pagina.telefone} />
                  )}
                  {pagina.email_contato && (
                    <InfoRow Icon={Mail} label="E-mail" value={pagina.email_contato} />
                  )}
                  {pagina.site && (
                    <InfoRow Icon={Globe} label="Site" value={pagina.site} link />
                  )}
                  {!pagina.ano_fundacao && !pagina.endereco && !pagina.telefone && !pagina.email_contato && !pagina.site && !pagina.descricao && !pagina.missao && (
                    <p className="text-sm text-muted-foreground/50 text-center py-4">
                      Nenhuma informação cadastrada ainda.
                      {isAdmin && " Clique em 'Editar informações' para adicionar."}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ PROGRAMAÇÃO ════════════════════════════════════════════ */}
        {aba === "programacao" && (
          <div className="space-y-4">
            <div className="glass rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock size={15} strokeWidth={1.5} className="text-cyan-glow" />
                  <span className="text-sm font-medium text-foreground">Atividades Regulares</span>
                </div>
                {modoAdmin && (
                  <button
                    onClick={() => setShowNovoHorario(s => !s)}
                    className="flex items-center gap-1.5 text-xs text-cyan-glow hover:underline transition-colors"
                  >
                    <Plus size={13} />
                    Adicionar
                  </button>
                )}
              </div>

              {/* Formulário novo horário */}
              {modoAdmin && showNovoHorario && (
                <div className="px-6 py-4 border-b border-white/10 bg-cyan-50/30 space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className={labelCls}>Dia</p>
                      <select
                        value={novoHorario.dia}
                        onChange={e => setNovoHorario(h => ({ ...h, dia: e.target.value }))}
                        className={inputCls}
                      >
                        {DIAS.map(d => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <p className={labelCls}>Horário</p>
                      <input
                        type="time"
                        value={novoHorario.hora}
                        onChange={e => setNovoHorario(h => ({ ...h, hora: e.target.value }))}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <p className={labelCls}>Atividade</p>
                      <input
                        value={novoHorario.atividade}
                        onChange={e => setNovoHorario(h => ({ ...h, atividade: e.target.value }))}
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

              {/* Lista de horários */}
              {(pagina.horarios ?? []).length === 0 ? (
                <div className="px-6 py-10 text-center">
                  <Calendar size={28} strokeWidth={1} className="text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground/50">Nenhuma atividade cadastrada.</p>
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
                        <button
                          onClick={() => removerHorario(i)}
                          className="p-1.5 rounded-lg text-muted-foreground/30 hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
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

        {/* ══ DOAÇÕES ════════════════════════════════════════════════ */}
        {aba === "doacoes" && (
          <div className="space-y-4">
            {modoAdmin && !editDoacoes && (
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setFormDoacoes({ chave_pix: pagina.chave_pix, texto_doacao: pagina.texto_doacao });
                    setEditDoacoes(true);
                  }}
                  className="flex items-center gap-2 text-xs uppercase tracking-widest text-cyan-glow border border-cyan-glow/30 px-4 py-2 rounded-xl hover:bg-cyan-glow/10 transition-colors"
                >
                  <Edit3 size={13} />
                  Editar doações
                </button>
              </div>
            )}

            {editDoacoes ? (
              <div className="glass rounded-2xl p-6 space-y-5">
                <h2 className="text-sm font-medium text-foreground">Configurar doações</h2>
                <Field label="Chave PIX">
                  <input
                    value={formDoacoes.chave_pix}
                    onChange={e => setFormDoacoes(f => ({ ...f, chave_pix: e.target.value }))}
                    placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória"
                    className={inputCls}
                  />
                  <p className="text-xs text-muted-foreground/50 mt-1">
                    O QR code é gerado automaticamente a partir da chave inserida.
                  </p>
                </Field>
                <Field label="Texto de apresentação das doações">
                  <textarea
                    value={formDoacoes.texto_doacao}
                    onChange={e => setFormDoacoes(f => ({ ...f, texto_doacao: e.target.value }))}
                    rows={3}
                    placeholder="Explique como as doações são usadas…"
                    className={`${inputCls} resize-none`}
                  />
                </Field>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setEditDoacoes(false)}
                    className="flex-1 py-2.5 rounded-xl text-xs text-muted-foreground border border-white/10 hover:bg-white/5 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={salvarDoacoes}
                    disabled={salvando}
                    className="flex-1 py-2.5 rounded-xl text-xs uppercase tracking-widest text-cyan-glow border border-cyan-glow/40 hover:bg-cyan-glow/10 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
                  >
                    <Save size={13} />
                    {salvando ? "Salvando…" : "Salvar"}
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
                    {/* QR Code */}
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

                    {/* Chave PIX */}
                    <div className="space-y-2">
                      <p className={labelCls}>Chave PIX</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-foreground/80 font-mono truncate">
                          {pagina.chave_pix}
                        </div>
                        <button
                          onClick={copiarPix}
                          title="Copiar chave"
                          className="shrink-0 p-2.5 rounded-xl border border-white/10 hover:border-cyan-glow/40 hover:text-cyan-glow text-muted-foreground/60 transition-colors"
                        >
                          {copiado ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
                        </button>
                      </div>
                    </div>

                    <p className="text-center text-xs text-muted-foreground/40">
                      Aponte a câmera do celular para o QR code ou copie a chave PIX acima.
                    </p>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <QrCode size={32} strokeWidth={1} className="text-muted-foreground/20 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground/50">
                      {isAdmin
                        ? "Nenhuma chave PIX cadastrada. Clique em 'Editar doações' para configurar."
                        : "Informações de doação ainda não configuradas."}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ══ PAINEL DE ADMINISTRADORES (modo admin) ══════════════════ */}
        {modoAdmin && (
          <div className="mt-10 border-t border-white/10 pt-8">
            <button
              onClick={() => {
                setShowAdmins(s => !s);
                if (!showAdmins) carregarMembros();
              }}
              className="flex items-center gap-2 text-sm text-muted-foreground/60 hover:text-foreground transition-colors mb-4"
            >
              <Users size={15} />
              Gerenciar administradores da página
              <span className="ml-auto text-xs">{showAdmins ? "▲" : "▼"}</span>
            </button>

            {showAdmins && (
              <div className="glass rounded-2xl p-5 space-y-4">
                <p className="text-xs text-muted-foreground/50 font-light">
                  Administradores autorizados podem editar a página, publicar no mural e gerenciar a programação. O Presidente sempre tem acesso, independente desta lista.
                </p>

                <div className="space-y-2">
                  {membros.map(m => {
                    const jaAdmin = adminIds.includes(m.id);
                    return (
                      <div key={m.id} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-white/5 transition-colors">
                        <span className="text-sm text-foreground/80">{m.nome}</span>
                        <button
                          onClick={() => jaAdmin ? removerAdmin(m.id) : adicionarAdmin(m.id)}
                          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                            jaAdmin
                              ? "border-red-200 text-red-500 hover:bg-red-50"
                              : "border-cyan-glow/30 text-cyan-glow hover:bg-cyan-glow/10"
                          }`}
                        >
                          {jaAdmin ? <><UserMinus size={12} /> Remover</> : <><UserPlus size={12} /> Autorizar</>}
                        </button>
                      </div>
                    );
                  })}
                  {membros.length === 0 && (
                    <p className="text-xs text-muted-foreground/40 text-center py-3">
                      Nenhum outro membro encontrado.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Voltar ── */}
        <div className="mt-12 text-center">
          <Link to="/inicio" className="text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors uppercase tracking-widest">
            ← Início
          </Link>
        </div>
      </div>
    </main>
  );
}

/* ── Helper components ─────────────────────────────────────────── */

const inputCls = "w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground/40 focus:outline-none focus:border-cyan-glow/40 transition-colors";
const labelCls = "text-xs uppercase tracking-widest text-muted-foreground/60 mb-1.5 block";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

function InfoRow({ Icon, label, value, link }: { Icon: LucideIcon; label: string; value: string; link?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-cyan-50 border border-cyan-100 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={14} strokeWidth={1.5} className="text-cyan-700" />
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">{label}</p>
        {link ? (
          <a href={value} target="_blank" rel="noopener noreferrer" className="text-sm text-cyan-glow hover:underline break-all">
            {value}
          </a>
        ) : (
          <p className="text-sm text-foreground/80 font-light">{value}</p>
        )}
      </div>
    </div>
  );
}
