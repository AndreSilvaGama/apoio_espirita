import { useEffect, useState } from "react";
import {
  Wallet,
  Plus,
  TrendingUp,
  TrendingDown,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Download,
  Printer,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const CATEGORIAS_RECEITA = ["Doações", "Bazar", "Mensalidade", "Eventos", "Outros"];
const CATEGORIAS_DESPESA = [
  "Água/Luz/Gás",
  "Aluguel",
  "Material de escritório",
  "Material de limpeza",
  "Manutenção",
  "Alimentação",
  "Outros",
];
const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
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
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function TesourariaTab({ sigla }: { sigla: string }) {
  const { user, profile, canTesouraria } = useAuth();

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

  const fetchTransacoes = async () => {
    if (!sigla) return;
    setLoadingTx(true);
    const dataInicio = `${ano}-${String(mes + 1).padStart(2, "0")}-01`;
    const dataFim = new Date(ano, mes + 1, 0).toISOString().split("T")[0];

    const { data } = await supabase
      .from("tesouraria_transacoes")
      .select("*")
      .eq("sigla_casa", sigla)
      .gte("data", dataInicio)
      .lte("data", dataFim)
      .order("data", { ascending: false });

    setTransacoes((data as Transacao[]) ?? []);
    setLoadingTx(false);
  };

  useEffect(() => {
    if (user && sigla && canTesouraria) fetchTransacoes();
  }, [user, sigla, mes, ano, canTesouraria]);

  if (!user) return null;

  if (!canTesouraria) {
    return (
      <div className="glass rounded-2xl p-10 text-center max-w-md mx-auto">
        <Wallet size={32} strokeWidth={1.5} className="text-muted-foreground/40 mx-auto mb-4" />
        <p className="text-muted-foreground font-light leading-relaxed">
          Somente o(a) Presidente e pessoas autorizadas pelo(a) Presidente podem acessar a
          Tesouraria.
        </p>
      </div>
    );
  }

  // Totais do mês
  const receitas = transacoes
    .filter((t) => t.tipo === "receita")
    .reduce((s, t) => s + Number(t.valor), 0);
  const despesas = transacoes
    .filter((t) => t.tipo === "despesa")
    .reduce((s, t) => s + Number(t.valor), 0);
  const saldo = receitas - despesas;

  const navegarMes = (dir: 1 | -1) => {
    let novoMes = mes + dir;
    let novoAno = ano;
    if (novoMes < 0) {
      novoMes = 11;
      novoAno--;
    }
    if (novoMes > 11) {
      novoMes = 0;
      novoAno++;
    }
    setMes(novoMes);
    setAno(novoAno);
  };

  const categorias = fTipo === "receita" ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA;

  const handleSalvar = async () => {
    if (!canTesouraria) return;
    if (!fCategoria) {
      setFormError("Selecione a categoria.");
      return;
    }
    if (!fDescricao.trim()) {
      setFormError("Informe a descrição.");
      return;
    }
    const valor = parseFloat(fValor.replace(",", "."));
    if (!fValor || isNaN(valor) || valor <= 0) {
      setFormError("Informe um valor válido (ex: 150,00).");
      return;
    }
    if (!fData) {
      setFormError("Informe a data.");
      return;
    }
    if (!sigla) return;

    setSaving(true);
    setFormError("");
    try {
      const { error } = await supabase.from("tesouraria_transacoes").insert({
        sigla_casa: sigla,
        tipo: fTipo,
        categoria: fCategoria,
        descricao: fDescricao.trim(),
        valor,
        data: fData,
        observacao: fObs.trim() || null,
        criador_id: user.id,
        criador_nome: profile?.nome ?? "",
      });
      if (error) throw error;
      setFDescricao("");
      setFCategoria("");
      setFValor("");
      setFObs("");
      setFData(hoje.toISOString().split("T")[0]);
      setFTipo("receita");
      setShowForm(false);
      fetchTransacoes();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Erro ao salvar lançamento.");
    } finally {
      setSaving(false);
    }
  };

  const handleExcluir = async (id: string) => {
    if (!canTesouraria) return;
    if (!confirm("Excluir este lançamento? A ação não pode ser desfeita.")) return;
    await supabase.from("tesouraria_transacoes").delete().eq("id", id);
    fetchTransacoes();
  };

  const handleExportarXLS = async () => {
    const XLSX = await import("xlsx");
    const geradoEm = new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    const rows: (string | number)[][] = [
      [`Tesouraria — Casa Espírita ${sigla}`],
      [`Período: ${MESES[mes]} de ${ano}`],
      [`Emitido por: ${profile?.nome ?? ""}`],
      [`Gerado em: ${geradoEm}`],
      [],
      ["RESUMO DO MÊS"],
      ["Total Receitas", receitas],
      ["Total Despesas", despesas],
      ["Saldo do Mês", saldo],
      [],
      ["LANÇAMENTOS"],
      ["Data", "Tipo", "Categoria", "Descrição", "Valor (R$)", "Responsável", "Observação"],
      ...transacoes.map((tx) => [
        fmtData(tx.data),
        tx.tipo === "receita" ? "Receita" : "Despesa",
        tx.categoria,
        tx.descricao,
        Number(tx.valor),
        tx.criador_nome ?? "",
        tx.observacao ?? "",
      ]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tesouraria");
    XLSX.writeFile(wb, `tesouraria_${sigla}_${MESES[mes]}_${ano}.xlsx`);
  };

  const handleImprimir = () => {
    const dataAtual = new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    const linhas = transacoes
      .map(
        (tx) => `
      <tr>
        <td>${fmtData(tx.data)}</td>
        <td class="${tx.tipo}">${tx.tipo === "receita" ? "Receita" : "Despesa"}</td>
        <td>${tx.categoria}</td>
        <td>${tx.descricao}</td>
        <td class="${tx.tipo}" style="text-align:right;white-space:nowrap">
          ${tx.tipo === "receita" ? "+" : "−"}${fmtBRL(Number(tx.valor))}
        </td>
        <td>${tx.criador_nome ?? "—"}</td>
        <td>${tx.observacao ?? "—"}</td>
      </tr>`,
      )
      .join("");

    const html = `<!DOCTYPE html><html lang="pt-BR"><head>
<meta charset="UTF-8">
<title>Tesouraria ${sigla} — ${MESES[mes]} ${ano}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Arial,sans-serif;font-size:11px;color:#222;padding:24px}
  h1{font-size:15px;font-weight:bold;margin-bottom:4px}
  .sub{color:#666;font-size:10px;margin-bottom:18px}
  .cards{display:flex;gap:12px;margin-bottom:20px}
  .card{flex:1;border:1px solid #ddd;border-radius:5px;padding:8px 12px}
  .card .lbl{font-size:9px;text-transform:uppercase;letter-spacing:.06em;color:#999;margin-bottom:3px}
  .card .val{font-size:13px;font-weight:bold}
  .receita{color:#059669}.despesa{color:#e11d48}
  .saldo-p{color:#0e7490}.saldo-n{color:#e11d48}
  h2{font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#999;margin-bottom:6px}
  table{width:100%;border-collapse:collapse}
  thead th{background:#f2f2f2;border:1px solid #ccc;padding:5px 7px;text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:.04em;color:#555}
  tbody td{border:1px solid #e5e5e5;padding:4px 7px;vertical-align:top}
  tbody tr:nth-child(even){background:#fafafa}
  .foot{margin-top:18px;font-size:9px;color:#aaa;border-top:1px solid #eee;padding-top:8px;display:flex;justify-content:space-between}
  @media print{@page{margin:1.5cm;size:landscape}body{padding:0}}
</style></head><body>
<h1>Tesouraria — Casa Espírita ${sigla}</h1>
<div class="sub">Período: ${MESES[mes]} de ${ano} &nbsp;·&nbsp; Emitido por: ${profile?.nome ?? ""} &nbsp;·&nbsp; ${dataAtual}</div>
<div class="cards">
  <div class="card"><div class="lbl">Saldo</div><div class="val ${saldo >= 0 ? "saldo-p" : "saldo-n"}">${fmtBRL(saldo)}</div></div>
  <div class="card"><div class="lbl">Receitas</div><div class="val receita">${fmtBRL(receitas)}</div></div>
  <div class="card"><div class="lbl">Despesas</div><div class="val despesa">${fmtBRL(despesas)}</div></div>
</div>
<h2>Lançamentos do período</h2>
<table>
  <thead><tr><th>Data</th><th>Tipo</th><th>Categoria</th><th>Descrição</th><th>Valor</th><th>Responsável</th><th>Observação</th></tr></thead>
  <tbody>${linhas}</tbody>
</table>
<div class="foot">
  <span>${transacoes.length} lançamento${transacoes.length !== 1 ? "s" : ""} no período</span>
  <span>Apoio Espírita · apoioespirita.com.br</span>
</div>
<script>window.onload=function(){window.print();window.onafterprint=function(){window.close();}}</script>
</body></html>`;

    const w = window.open("", "_blank", "width=960,height=680");
    if (w) {
      w.document.write(html);
      w.document.close();
    }
  };

  return (
    <section className="space-y-6 animate-fade-in-up" style={{ animationDuration: "400ms" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2 flex-wrap gap-4 border-b border-gray-100 pb-4">
        <div>
          <h3
            style={{
              fontFamily: '"Libre Caslon Text", Georgia, serif',
              fontSize: "1.4rem",
              fontWeight: 400,
              color: "#111418",
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Wallet size={22} style={{ color: "#004a8c", opacity: 0.7 }} />
            Tesouraria · {sigla}
          </h3>
          <p className="text-xs text-muted-foreground/60 mt-1 font-light">
            Fluxo financeiro da casa espírita.
          </p>
        </div>
        {canTesouraria && (
          <button
            onClick={() => {
              setShowForm((v) => !v);
              setFormError("");
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 18px",
              borderRadius: 12,
              background: "#004a8c",
              color: "#fff",
              fontFamily: "Inter",
              fontSize: "0.82rem",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              boxShadow: "0 2px 10px rgba(0,74,140,.2)",
            }}
          >
            <Plus size={14} />
            {showForm ? "Cancelar" : "Novo Lançamento"}
          </button>
        )}
      </div>

      {/* Navegação de mês */}
      <div className="flex items-center justify-between mb-6 bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3">
        <button
          onClick={() => navegarMes(-1)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700 select-none">
          <Calendar size={14} className="text-cyan-600" />
          {MESES[mes]} de {ano}
        </div>
        <div className="flex items-center gap-1">
          {transacoes.length > 0 && (
            <>
              <button
                onClick={handleImprimir}
                title="Imprimir relatório"
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <Printer size={16} />
              </button>
              <button
                onClick={handleExportarXLS}
                title="Exportar para Excel"
                className="p-1.5 rounded-lg text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 transition-colors cursor-pointer"
              >
                <Download size={16} />
              </button>
            </>
          )}
          <button
            onClick={() => navegarMes(1)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div
          className={`rounded-2xl p-4 border ${saldo >= 0 ? "bg-cyan-50 border-cyan-100" : "bg-rose-50 border-rose-100"}`}
        >
          <div className="flex items-center gap-1.5 mb-2">
            <Wallet
              size={13}
              strokeWidth={1.5}
              className={saldo >= 0 ? "text-cyan-500" : "text-rose-400"}
            />
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold select-none">
              Saldo
            </p>
          </div>
          <p
            className={`text-sm sm:text-base font-semibold ${saldo >= 0 ? "text-cyan-700" : "text-rose-600"}`}
          >
            {fmtBRL(saldo)}
          </p>
        </div>
        <div className="rounded-2xl p-4 bg-emerald-50 border border-emerald-100">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp size={13} strokeWidth={1.5} className="text-emerald-500" />
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold select-none">
              Receitas
            </p>
          </div>
          <p className="text-sm sm:text-base font-semibold text-emerald-700">{fmtBRL(receitas)}</p>
        </div>
        <div className="rounded-2xl p-4 bg-rose-50 border border-rose-100">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingDown size={13} strokeWidth={1.5} className="text-rose-400" />
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold select-none">
              Despesas
            </p>
          </div>
          <p className="text-sm sm:text-base font-semibold text-rose-600">{fmtBRL(despesas)}</p>
        </div>
      </div>

      {/* Formulário de nova transação (Authorized Only) */}
      {canTesouraria && showForm && (
        <div className="glass rounded-3xl p-6 mb-6 space-y-4 border border-white/20">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <h4 className="text-xs uppercase tracking-widest font-semibold text-cyan-800">
              Novo Lançamento
            </h4>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Tipo */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                setFTipo("receita");
                setFCategoria("");
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${fTipo === "receita" ? "border-emerald-400/60 text-emerald-600 bg-emerald-400/5" : "border-gray-200 text-gray-500 hover:border-gray-300 bg-white"}`}
            >
              <TrendingUp size={14} /> Receita
            </button>
            <button
              onClick={() => {
                setFTipo("despesa");
                setFCategoria("");
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${fTipo === "despesa" ? "border-rose-400/60 text-rose-500 bg-rose-400/5" : "border-gray-200 text-gray-500 hover:border-gray-300 bg-white"}`}
            >
              <TrendingDown size={14} /> Despesa
            </button>
          </div>

          {/* Categoria */}
          <select
            value={fCategoria}
            onChange={(e) => {
              setFCategoria(e.target.value);
              setFormError("");
            }}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-xs bg-white text-gray-700 focus:outline-none focus:border-cyan-600 transition-colors"
          >
            <option value="">Selecione a categoria</option>
            {categorias.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Descrição */}
          <input
            type="text"
            placeholder="Descrição *"
            value={fDescricao}
            onChange={(e) => {
              setFDescricao(e.target.value);
              setFormError("");
            }}
            className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-cyan-600 transition-colors"
          />

          <div className="grid grid-cols-2 gap-3">
            {/* Valor */}
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">
                Valor (R$) *
              </label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="Ex: 150,00"
                value={fValor}
                onChange={(e) => {
                  setFValor(e.target.value);
                  setFormError("");
                }}
                className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-cyan-600 transition-colors"
              />
            </div>
            {/* Data */}
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">
                Data *
              </label>
              <input
                type="date"
                value={fData}
                onChange={(e) => setFData(e.target.value)}
                className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-cyan-600 transition-colors"
              />
            </div>
          </div>

          {/* Observação */}
          <textarea
            placeholder="Observação (opcional)"
            value={fObs}
            onChange={(e) => setFObs(e.target.value)}
            rows={2}
            className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-cyan-600 transition-colors resize-none"
          />

          {formError && (
            <p className="text-xs text-red-500 text-center font-semibold">{formError}</p>
          )}

          <button
            onClick={handleSalvar}
            disabled={saving}
            className="w-full py-2.5 rounded-xl text-xs uppercase tracking-widest text-white bg-[#004a8c] hover:bg-[#00386b] disabled:opacity-40 transition-colors font-semibold cursor-pointer shadow-sm"
          >
            {saving ? "Salvando…" : "Salvar Lançamento"}
          </button>
        </div>
      )}

      {/* Lista de transações */}
      {loadingTx ? (
        <p className="text-sm text-gray-400 text-center py-12">Carregando lançamentos...</p>
      ) : transacoes.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-200 rounded-2xl bg-white/40">
          <Wallet size={36} className="mx-auto text-gray-300 mb-2" />
          <p className="text-xs text-gray-400 font-light">
            Nenhum lançamento registrado em {MESES[mes]} de {ano}.
          </p>
          {canTesouraria && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-3 text-xs text-cyan-600 font-semibold hover:underline cursor-pointer"
            >
              + Registrar primeiro lançamento
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {transacoes.map((tx) => (
            <div
              key={tx.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-xs px-4 py-3.5 flex items-center gap-3"
            >
              {/* Indicador de tipo */}
              <div
                className={`shrink-0 w-1 h-8 rounded-full ${tx.tipo === "receita" ? "bg-emerald-400" : "bg-rose-400"}`}
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate">{tx.descricao}</p>
                <p className="text-[10px] text-gray-400 mt-0.5 font-light">
                  {tx.categoria} · {fmtData(tx.data)}
                  {tx.criador_nome ? ` · ${tx.criador_nome}` : ""}
                </p>
                {tx.observacao && (
                  <p className="text-[10px] text-gray-300 mt-0.5 truncate font-light italic">
                    {tx.observacao}
                  </p>
                )}
              </div>

              {/* Valor e ações */}
              <div className="shrink-0 text-right">
                <p
                  className={`text-xs font-bold ${tx.tipo === "receita" ? "text-emerald-600" : "text-rose-500"}`}
                >
                  {tx.tipo === "receita" ? "+" : "−"}
                  {fmtBRL(Number(tx.valor))}
                </p>
                {canTesouraria && (
                  <button
                    onClick={() => handleExcluir(tx.id)}
                    className="mt-1 text-gray-300 hover:text-red-400 transition-colors cursor-pointer"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Rodapé do mês */}
          <div className="mt-4 pt-3 border-t border-gray-150 flex justify-between text-[11px] text-gray-400 select-none">
            <span>
              {transacoes.length} lançamento{transacoes.length !== 1 ? "s" : ""}
            </span>
            <span className={`font-semibold ${saldo >= 0 ? "text-cyan-600" : "text-rose-500"}`}>
              Saldo: {fmtBRL(saldo)}
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
