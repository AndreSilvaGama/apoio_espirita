import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Wallet, Plus, TrendingUp, TrendingDown,
  Trash2, ChevronLeft, ChevronRight, Calendar, Download,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/tesouraria")({
  component: Tesouraria,
});

const CATEGORIAS_RECEITA = ["Doações", "Bazar", "Mensalidade", "Eventos", "Outros"];
const CATEGORIAS_DESPESA = [
  "Água/Luz/Gás", "Aluguel", "Material de escritório",
  "Material de limpeza", "Manutenção", "Alimentação", "Outros",
];
const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

type Tipo = "receita" | "despesa";

interface Transacao {
  id: string;
  tipo: Tipo;
  categoria: string;
  descricao: string;
  valor: number;
  data: string;
  observacao: string | null;
  criador_id: string;
  criador_nome: string | null;
}

function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtData(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

function Tesouraria() {
  const navigate = useNavigate();
  const { user, profile, loading, isTesoureiro } = useAuth();

  const hoje = new Date();
  const [mes, setMes] = useState(hoje.getMonth());
  const [ano, setAno] = useState(hoje.getFullYear());

  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [loadingTx, setLoadingTx] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [fTipo, setFTipo] = useState<Tipo>("receita");
  const [fCategoria, setFCategoria] = useState("");
  const [fDescricao, setFDescricao] = useState("");
  const [fValor, setFValor] = useState("");
  const [fData, setFData] = useState(hoje.toISOString().split("T")[0]);
  const [fObs, setFObs] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
    if (!loading && user && (!profile?.sigla_casa || !profile?.nome)) navigate({ to: "/completar-perfil" });
  }, [user, profile, loading, navigate]);

  const fetchTransacoes = async () => {
    if (!profile?.sigla_casa) return;
    setLoadingTx(true);
    const dataInicio = `${ano}-${String(mes + 1).padStart(2, "0")}-01`;
    const dataFim = new Date(ano, mes + 1, 0).toISOString().split("T")[0];

    const { data } = await supabase
      .from("tesouraria_transacoes")
      .select("*")
      .eq("sigla_casa", profile.sigla_casa)
      .gte("data", dataInicio)
      .lte("data", dataFim)
      .order("data", { ascending: false });

    setTransacoes((data as Transacao[]) ?? []);
    setLoadingTx(false);
  };

  useEffect(() => {
    if (user && profile?.sigla_casa && isTesoureiro) fetchTransacoes();
  }, [user, profile?.sigla_casa, mes, ano, isTesoureiro]);

  if (loading || !user) return null;

  if (!isTesoureiro) {
    return (
      <main className="page-light min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-muted-foreground font-light">
            Acesso restrito a Presidente, Vice-presidente e Tesoureiro.
          </p>
          <button
            onClick={() => navigate({ to: "/inicio" })}
            className="mt-4 text-sm text-cyan-glow hover:text-foreground transition-colors"
          >
            ← Voltar ao início
          </button>
        </div>
      </main>
    );
  }

  // Totais do mês
  const receitas = transacoes.filter((t) => t.tipo === "receita").reduce((s, t) => s + Number(t.valor), 0);
  const despesas = transacoes.filter((t) => t.tipo === "despesa").reduce((s, t) => s + Number(t.valor), 0);
  const saldo = receitas - despesas;

  const navegarMes = (dir: 1 | -1) => {
    let novoMes = mes + dir;
    let novoAno = ano;
    if (novoMes < 0) { novoMes = 11; novoAno--; }
    if (novoMes > 11) { novoMes = 0; novoAno++; }
    setMes(novoMes);
    setAno(novoAno);
  };

  const categorias = fTipo === "receita" ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA;

  const handleSalvar = async () => {
    if (!fCategoria) { setFormError("Selecione a categoria."); return; }
    if (!fDescricao.trim()) { setFormError("Informe a descrição."); return; }
    const valor = parseFloat(fValor.replace(",", "."));
    if (!fValor || isNaN(valor) || valor <= 0) { setFormError("Informe um valor válido (ex: 150,00)."); return; }
    if (!fData) { setFormError("Informe a data."); return; }
    if (!profile?.sigla_casa || !user) return;

    setSaving(true);
    setFormError("");
    try {
      const { error } = await supabase.from("tesouraria_transacoes").insert({
        sigla_casa: profile.sigla_casa,
        tipo: fTipo,
        categoria: fCategoria,
        descricao: fDescricao.trim(),
        valor,
        data: fData,
        observacao: fObs.trim() || null,
        criador_id: user.id,
        criador_nome: profile.nome ?? "",
      });
      if (error) throw error;
      setFDescricao(""); setFCategoria(""); setFValor(""); setFObs("");
      setFData(hoje.toISOString().split("T")[0]);
      setFTipo("receita");
      setShowForm(false);
      fetchTransacoes();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Erro ao salvar transação.");
    } finally {
      setSaving(false);
    }
  };

  const handleExcluir = async (id: string) => {
    if (!confirm("Excluir esta transação? A ação não pode ser desfeita.")) return;
    await supabase.from("tesouraria_transacoes").delete().eq("id", id);
    fetchTransacoes();
  };

  const handleExportarCSV = () => {
    const cabecalho = ["Data", "Tipo", "Categoria", "Descrição", "Valor (R$)", "Observação"];
    const linhas = transacoes.map((tx) => [
      fmtData(tx.data),
      tx.tipo === "receita" ? "Receita" : "Despesa",
      tx.categoria,
      tx.descricao,
      Number(tx.valor).toFixed(2).replace(".", ","),
      tx.observacao ?? "",
    ]);
    const csv = [cabecalho, ...linhas]
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";"))
      .join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tesouraria_${profile?.sigla_casa}_${MESES[mes]}_${ano}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="page-light min-h-screen px-4 pt-20 pb-20">
      <div className="mx-auto max-w-3xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-glow mb-1">Tesouraria</p>
            <h1 className="text-3xl font-light text-foreground">Casa {profile?.sigla_casa}</h1>
          </div>
          <button
            onClick={() => { setShowForm((v) => !v); setFormError(""); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-cyan-glow/40 text-cyan-glow text-xs uppercase tracking-widest hover:bg-cyan-glow/10 transition-colors"
          >
            <Plus size={14} />
            {showForm ? "Cancelar" : "Nova Transação"}
          </button>
        </div>

        {/* Navegação de mês */}
        <div className="flex items-center justify-between mb-6 bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3">
          <button
            onClick={() => navegarMes(-1)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Calendar size={14} className="text-cyan-600" />
            {MESES[mes]} de {ano}
          </div>
          <div className="flex items-center gap-1">
            {transacoes.length > 0 && (
              <button
                onClick={handleExportarCSV}
                title="Exportar planilha CSV"
                className="p-1.5 rounded-lg text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 transition-colors"
              >
                <Download size={16} />
              </button>
            )}
            <button
              onClick={() => navegarMes(1)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className={`rounded-2xl p-4 border ${saldo >= 0 ? "bg-cyan-50 border-cyan-100" : "bg-rose-50 border-rose-100"}`}>
            <div className="flex items-center gap-1.5 mb-2">
              <Wallet size={13} strokeWidth={1.5} className={saldo >= 0 ? "text-cyan-500" : "text-rose-400"} />
              <p className="text-xs uppercase tracking-wider text-gray-400">Saldo</p>
            </div>
            <p className={`text-base font-semibold ${saldo >= 0 ? "text-cyan-700" : "text-rose-600"}`}>
              {fmtBRL(saldo)}
            </p>
          </div>
          <div className="rounded-2xl p-4 bg-emerald-50 border border-emerald-100">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp size={13} strokeWidth={1.5} className="text-emerald-500" />
              <p className="text-xs uppercase tracking-wider text-gray-400">Receitas</p>
            </div>
            <p className="text-base font-semibold text-emerald-700">{fmtBRL(receitas)}</p>
          </div>
          <div className="rounded-2xl p-4 bg-rose-50 border border-rose-100">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingDown size={13} strokeWidth={1.5} className="text-rose-400" />
              <p className="text-xs uppercase tracking-wider text-gray-400">Despesas</p>
            </div>
            <p className="text-base font-semibold text-rose-600">{fmtBRL(despesas)}</p>
          </div>
        </div>

        {/* Formulário de nova transação */}
        {showForm && (
          <div className="glass rounded-3xl p-6 mb-8 space-y-4">
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground/60">Nova Transação</h2>

            {/* Tipo */}
            <div className="flex gap-3">
              <button
                onClick={() => { setFTipo("receita"); setFCategoria(""); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm transition-colors ${fTipo === "receita" ? "border-emerald-400/60 text-emerald-600 bg-emerald-400/5" : "border-white/10 text-muted-foreground hover:border-white/20"}`}
              >
                <TrendingUp size={14} /> Receita
              </button>
              <button
                onClick={() => { setFTipo("despesa"); setFCategoria(""); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm transition-colors ${fTipo === "despesa" ? "border-rose-400/60 text-rose-500 bg-rose-400/5" : "border-white/10 text-muted-foreground hover:border-white/20"}`}
              >
                <TrendingDown size={14} /> Despesa
              </button>
            </div>

            {/* Categoria */}
            <select
              value={fCategoria}
              onChange={(e) => { setFCategoria(e.target.value); setFormError(""); }}
              className="w-full rounded-xl border border-white/10 px-4 py-3 text-sm focus:outline-none focus:border-cyan-glow/40 transition-colors"
            >
              <option value="">Selecione a categoria</option>
              {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>

            {/* Descrição */}
            <input
              type="text"
              placeholder="Descrição *"
              value={fDescricao}
              onChange={(e) => { setFDescricao(e.target.value); setFormError(""); }}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-cyan-glow/40 transition-colors"
            />

            <div className="grid grid-cols-2 gap-3">
              {/* Valor */}
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground/60 mb-1">Valor (R$) *</label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Ex: 150,00"
                  value={fValor}
                  onChange={(e) => { setFValor(e.target.value); setFormError(""); }}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-cyan-glow/40 transition-colors"
                />
              </div>
              {/* Data */}
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground/60 mb-1">Data *</label>
                <input
                  type="date"
                  value={fData}
                  onChange={(e) => setFData(e.target.value)}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-foreground focus:outline-none focus:border-cyan-glow/40 transition-colors"
                />
              </div>
            </div>

            {/* Observação */}
            <textarea
              placeholder="Observação (opcional)"
              value={fObs}
              onChange={(e) => setFObs(e.target.value)}
              rows={2}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-cyan-glow/40 transition-colors resize-none"
            />

            {formError && <p className="text-xs text-red-400 text-center">{formError}</p>}

            <button
              onClick={handleSalvar}
              disabled={saving}
              className="w-full py-3 rounded-xl text-sm uppercase tracking-widest text-cyan-glow border border-cyan-glow/40 hover:bg-cyan-glow/10 disabled:opacity-40 transition-colors"
            >
              {saving ? "Salvando…" : "Salvar Transação"}
            </button>
          </div>
        )}

        {/* Lista de transações */}
        {loadingTx ? (
          <p className="text-sm text-muted-foreground/50 text-center py-16">Carregando…</p>
        ) : transacoes.length === 0 ? (
          <div className="text-center py-16">
            <Wallet size={40} className="mx-auto text-muted-foreground/20 mb-3" />
            <p className="text-sm text-muted-foreground/50">
              Nenhuma transação em {MESES[mes]} de {ano}.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 text-xs text-cyan-glow/70 hover:text-cyan-glow transition-colors"
            >
              + Registrar primeira transação
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {transacoes.map((tx) => (
              <div key={tx.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4">
                {/* Indicador de tipo */}
                <div className={`shrink-0 w-1.5 h-10 rounded-full ${tx.tipo === "receita" ? "bg-emerald-400" : "bg-rose-400"}`} />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{tx.descricao}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {tx.categoria} · {fmtData(tx.data)}
                  </p>
                  {tx.observacao && (
                    <p className="text-xs text-gray-300 mt-0.5 truncate">{tx.observacao}</p>
                  )}
                </div>

                {/* Valor e ações */}
                <div className="shrink-0 text-right">
                  <p className={`text-sm font-semibold ${tx.tipo === "receita" ? "text-emerald-600" : "text-rose-500"}`}>
                    {tx.tipo === "receita" ? "+" : "−"}{fmtBRL(Number(tx.valor))}
                  </p>
                  {tx.criador_id === user?.id && (
                    <button
                      onClick={() => handleExcluir(tx.id)}
                      className="mt-1 text-gray-300 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Rodapé do mês */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-xs text-gray-400">
              <span>{transacoes.length} transação{transacoes.length !== 1 ? "ões" : ""}</span>
              <span className={`font-medium ${saldo >= 0 ? "text-cyan-600" : "text-rose-500"}`}>
                Saldo: {fmtBRL(saldo)}
              </span>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
