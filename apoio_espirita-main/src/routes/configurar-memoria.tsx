import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Upload,
  Check,
  X,
  ImageOff,
  Loader,
  AlertCircle,
  GripVertical,
} from "lucide-react";
import { VIRTUDES } from "@/data/memoria-evangelizacao";

export const Route = createFileRoute("/configurar-memoria")({
  component: ConfigurarMemoria,
});

const SUPABASE_URL = "https://kitmwxfwwujygcmdjngm.supabase.co";
const BUCKET = "memoria-imagens";

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface VirtudeCasa {
  id: string;
  sigla_casa: string;
  nome: string;
  imagem_url: string | null;
  cor: string;
  ordem: number;
  ativo: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const CORES = [
  "bg-rose-100",
  "bg-pink-100",
  "bg-violet-100",
  "bg-blue-100",
  "bg-teal-100",
  "bg-yellow-100",
  "bg-indigo-100",
  "bg-green-100",
  "bg-orange-100",
  "bg-cyan-100",
  "bg-amber-100",
  "bg-purple-100",
];

async function uploadImagem(file: File, sigla: string): Promise<string | null> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `virtudes/${sigla}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: false,
    contentType: file.type,
  });
  if (error) {
    console.error(error);
    return null;
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}

async function deletarImagem(url: string) {
  const path = url.replace(`${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`, "");
  await supabase.storage.from(BUCKET).remove([path]);
}

// ── Card de virtude ───────────────────────────────────────────────────────────

function CardVirtude({
  v,
  onSave,
  onDelete,
}: {
  v: VirtudeCasa;
  onSave: (id: string, nome: string, imagem_url: string | null, cor: string) => Promise<void>;
  onDelete: (id: string, imagem_url: string | null) => Promise<void>;
}) {
  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState(v.nome);
  const [cor, setCor] = useState(v.cor);
  const [imagemUrl, setImagemUrl] = useState<string | null>(v.imagem_url);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { profile } = useAuth();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.sigla_casa) return;
    setUploading(true);
    const url = await uploadImagem(file, profile.sigla_casa);
    if (url) setImagemUrl(url);
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(v.id, nome, imagemUrl, cor);
    setSaving(false);
    setEditando(false);
  };

  const handleCancel = () => {
    setNome(v.nome);
    setCor(v.cor);
    setImagemUrl(v.imagem_url);
    setEditando(false);
  };

  const handleDelete = async () => {
    if (!confirm(`Remover "${v.nome}"?`)) return;
    setDeleting(true);
    await onDelete(v.id, imagemUrl);
  };

  return (
    <div
      className={`border border-gray-200 rounded-xl overflow-hidden bg-white ${deleting ? "opacity-40" : ""}`}
    >
      {/* Preview da carta */}
      <div className={`h-28 flex items-center justify-center ${cor} relative`}>
        {uploading ? (
          <Loader size={28} strokeWidth={1.5} className="text-gray-400 animate-spin" />
        ) : imagemUrl ? (
          <img src={imagemUrl} alt={nome} className="h-full w-full object-contain p-2" />
        ) : (
          <ImageOff size={28} strokeWidth={1.5} className="text-gray-400" />
        )}

        {editando && (
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute inset-0 flex items-center justify-center bg-black/30 text-white text-xs font-medium gap-1.5 hover:bg-black/40 transition-colors"
          >
            <Upload size={14} strokeWidth={2} />
            {imagemUrl ? "Trocar imagem" : "Adicionar imagem"}
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      {/* Nome e ações */}
      <div className="p-3 space-y-2">
        {editando ? (
          <>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome da virtude"
              className="w-full text-sm rounded-lg border border-gray-200 px-3 py-1.5 focus:outline-none focus:border-cyan-400"
            />
            {/* Paleta de cores */}
            <div className="flex flex-wrap gap-1">
              {CORES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCor(c)}
                  className={`w-5 h-5 rounded-full ${c} border-2 transition-all ${cor === c ? "border-gray-700 scale-110" : "border-transparent"}`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving || !nome.trim()}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-medium hover:bg-emerald-600 disabled:opacity-40 transition-colors"
              >
                {saving ? (
                  <Loader size={12} className="animate-spin" />
                ) : (
                  <Check size={12} strokeWidth={2.5} />
                )}
                Salvar
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs hover:bg-gray-50 transition-colors"
              >
                <X size={12} strokeWidth={2.5} />
                Cancelar
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-gray-800 truncate">{v.nome}</span>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setEditando(true)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                title="Editar"
              >
                <Upload size={13} strokeWidth={2} />
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Remover"
              >
                <Trash2 size={13} strokeWidth={2} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Formulário para adicionar nova virtude ────────────────────────────────────

function FormNovaVirtude({
  sigla,
  proximaOrdem,
  onAdicionada,
  onCancelar,
}: {
  sigla: string;
  proximaOrdem: number;
  onAdicionada: (v: VirtudeCasa) => void;
  onCancelar: () => void;
}) {
  const [nome, setNome] = useState("");
  const [cor, setCor] = useState("bg-blue-100");
  const [imagemUrl, setImagemUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadImagem(file, sigla);
    if (url) setImagemUrl(url);
    setUploading(false);
  };

  const handleSalvar = async () => {
    if (!nome.trim()) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("memoria_virtudes_custom")
      .insert({
        sigla_casa: sigla,
        nome: nome.trim(),
        imagem_url: imagemUrl,
        cor,
        ordem: proximaOrdem,
      })
      .select()
      .single();
    setSaving(false);
    if (!error && data) onAdicionada(data as VirtudeCasa);
  };

  return (
    <div className="border-2 border-dashed border-cyan-300 rounded-xl p-4 bg-cyan-50/50 space-y-3">
      <p className="text-xs font-semibold text-cyan-700 uppercase tracking-wider">Nova virtude</p>

      {/* Preview da imagem */}
      <button
        onClick={() => fileRef.current?.click()}
        className={`w-full h-24 rounded-xl flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 text-gray-400 hover:border-cyan-400 hover:text-cyan-600 transition-colors ${cor}`}
      >
        {uploading ? (
          <Loader size={20} className="animate-spin" />
        ) : imagemUrl ? (
          <img src={imagemUrl} alt="preview" className="h-full object-contain p-1" />
        ) : (
          <>
            <Upload size={16} strokeWidth={1.5} />
            <span className="text-xs">Clique para adicionar imagem</span>
          </>
        )}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUpload}
      />

      <input
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        placeholder="Nome da virtude (ex: Coragem)"
        className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:border-cyan-400"
      />

      <div className="flex flex-wrap gap-1">
        {CORES.map((c) => (
          <button
            key={c}
            onClick={() => setCor(c)}
            className={`w-5 h-5 rounded-full ${c} border-2 transition-all ${cor === c ? "border-gray-700 scale-110" : "border-transparent"}`}
          />
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSalvar}
          disabled={saving || !nome.trim()}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-cyan-500 text-white text-sm font-medium hover:bg-cyan-600 disabled:opacity-40 transition-colors"
        >
          {saving ? (
            <Loader size={14} className="animate-spin" />
          ) : (
            <Plus size={14} strokeWidth={2.5} />
          )}
          Adicionar
        </button>
        <button
          onClick={onCancelar}
          className="px-4 py-2 rounded-xl border border-gray-200 text-gray-500 text-sm hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

function ConfigurarMemoria() {
  const { user, isEvangelizador, loading, profile } = useAuth();
  const [virtudes, setVirtudes] = useState<VirtudeCasa[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [adicionando, setAdicionando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const sigla = profile?.sigla_casa ?? "";

  const carregar = useCallback(async () => {
    if (!sigla) return;
    setCarregando(true);
    const { data, error } = await supabase
      .from("memoria_virtudes_custom")
      .select("*")
      .eq("sigla_casa", sigla)
      .eq("ativo", true)
      .order("ordem");
    if (error) setErro(error.message);
    else setVirtudes((data ?? []) as VirtudeCasa[]);
    setCarregando(false);
  }, [sigla]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const inicializarComPadroes = async () => {
    if (!sigla) return;
    setSaving(true);
    const rows = VIRTUDES.map((v, i) => ({
      sigla_casa: sigla,
      nome: v.virtude,
      imagem_url: null,
      cor: v.cor,
      ordem: i,
    }));
    const { error } = await supabase.from("memoria_virtudes_custom").insert(rows);
    setSaving(false);
    if (!error) carregar();
  };
  const [saving, setSaving] = useState(false);

  const handleSave = async (id: string, nome: string, imagem_url: string | null, cor: string) => {
    const { error } = await supabase
      .from("memoria_virtudes_custom")
      .update({ nome, imagem_url, cor, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (!error)
      setVirtudes((prev) => prev.map((v) => (v.id === id ? { ...v, nome, imagem_url, cor } : v)));
  };

  const handleDelete = async (id: string, imagem_url: string | null) => {
    if (imagem_url) await deletarImagem(imagem_url);
    const { error } = await supabase
      .from("memoria_virtudes_custom")
      .update({ ativo: false })
      .eq("id", id);
    if (!error) setVirtudes((prev) => prev.filter((v) => v.id !== id));
  };

  const handleAdicionada = (v: VirtudeCasa) => {
    setVirtudes((prev) => [...prev, v]);
    setAdicionando(false);
  };

  // ── Guards ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <main className="page-light min-h-screen px-4 pt-20 pb-20 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!user || !isEvangelizador) {
    return (
      <main className="page-light min-h-screen px-4 pt-20 pb-20 flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            Acesso restrito a Evangelizadores e cargos de decisão.
          </p>
          <Link to="/evangelizacao" className="text-xs text-cyan-600 hover:underline">
            Voltar
          </Link>
        </div>
      </main>
    );
  }

  if (!sigla) {
    return (
      <main className="page-light min-h-screen px-4 pt-20 pb-20 flex items-center justify-center">
        <div className="text-center space-y-3">
          <AlertCircle size={28} strokeWidth={1.5} className="text-amber-400 mx-auto" />
          <p className="text-sm text-muted-foreground">
            Complete seu perfil com a sigla da casa para continuar.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="page-light min-h-screen px-4 pt-20 pb-20">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center gap-3">
          <Link
            to="/evangelizacao"
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={18} strokeWidth={2} />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-gray-800">Configurar Jogo da Memória</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Virtudes de <strong className="text-gray-600">{sigla}</strong> — modo Virtudes do jogo
            </p>
          </div>
        </div>

        {/* Aviso de uso */}
        <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
          <AlertCircle size={16} strokeWidth={1.5} className="shrink-0 mt-0.5" />
          <div>
            Cada virtude aparece como <strong>dois cartões no jogo</strong>: um com o nome e outro
            com a imagem. Sem imagem, o cartão fica com um fundo colorido. Adicione imagens simples
            e coloridas, fáceis de reconhecer por crianças.
          </div>
        </div>

        {/* Erro */}
        {erro && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {erro}
          </div>
        )}

        {/* Estado vazio — oferece carregar padrões */}
        {!carregando && virtudes.length === 0 && !adicionando && (
          <div className="text-center py-10 space-y-4 border-2 border-dashed border-gray-200 rounded-2xl">
            <ImageOff size={32} strokeWidth={1} className="text-gray-300 mx-auto" />
            <div>
              <p className="text-sm font-medium text-gray-700">
                Nenhuma virtude configurada para {sigla}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Comece pelos padrões ou adicione uma por uma.
              </p>
            </div>
            <div className="flex justify-center gap-3 flex-wrap">
              <button
                onClick={inicializarComPadroes}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 text-white text-sm font-medium hover:bg-cyan-600 disabled:opacity-40 transition-colors"
              >
                {saving ? (
                  <Loader size={14} className="animate-spin" />
                ) : (
                  <GripVertical size={14} />
                )}
                Carregar 10 virtudes padrão
              </button>
              <button
                onClick={() => setAdicionando(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors"
              >
                <Plus size={14} strokeWidth={2} />
                Adicionar manualmente
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {carregando && (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Grid de virtudes */}
        {!carregando && virtudes.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {virtudes.map((v) => (
                <CardVirtude key={v.id} v={v} onSave={handleSave} onDelete={handleDelete} />
              ))}
            </div>

            {/* Botão adicionar */}
            {!adicionando && (
              <button
                onClick={() => setAdicionando(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-cyan-400 hover:text-cyan-600 text-sm transition-colors"
              >
                <Plus size={16} strokeWidth={2} />
                Adicionar virtude
              </button>
            )}
          </>
        )}

        {/* Formulário de nova virtude */}
        {adicionando && (
          <FormNovaVirtude
            sigla={sigla}
            proximaOrdem={virtudes.length}
            onAdicionada={handleAdicionada}
            onCancelar={() => setAdicionando(false)}
          />
        )}
      </div>
    </main>
  );
}
