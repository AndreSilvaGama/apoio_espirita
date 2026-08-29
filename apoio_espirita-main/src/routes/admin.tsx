import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  ShieldAlert,
  Building2,
  Users,
  AlertTriangle,
  MessageCircle,
  Check,
  X,
  Search,
  Trash2,
  RefreshCw,
  Power,
  CheckCircle2,
  LayoutDashboard,
  PlusCircle,
  Scale,
} from "lucide-react";
import { mensagemDeErro } from "@/lib/erros";
import { FilaRevisaoArtigos } from "@/components/FilaRevisaoArtigos";
import { ConviteCasas } from "@/components/ConviteCasas";
import { GerirUsuario } from "@/components/GerirUsuario";

export const Route = createFileRoute("/admin")({
  component: AdminDashboard,
});

type Tab =
  | "overview"
  | "casas"
  | "usuarios"
  | "solicitacoes"
  | "problemas"
  | "sugestoes"
  | "artigos"
  | "convite";

interface StatOverview {
  casasTotal: number;
  casasAtivas: number;
  usuariosTotal: number;
  problemasTotal: number;
  sugestoesTotal: number;
  solicitacoesTotal: number;
}

interface Casa {
  id: string;
  nome: string;
  sigla: string | null;
  cidade: string;
  estado: string;
  ativa: boolean;
  endereco: string | null;
  telefone: string | null;
}

interface Usuario {
  id: string;
  nome: string | null;
  sigla_casa: string | null;
  cargo_principal: string | null;
  cidade: string | null;
  uf: string | null;
  created_at: string;
}

interface SolicitacaoDev {
  id: string;
  titulo: string;
  descricao: string | null;
  created_at: string | null;
  user_id: string | null;
  status: string;
  resposta_dev: string | null;
  atualizado_em: string | null;
}

/**
 * Situacoes de uma solicitacao de desenvolvimento. O mesmo valor e gravado em
 * `solicitacoes_dev.status` e lido pelo /painel, onde quem pediu acompanha.
 */
const STATUS_SOLICITACAO = [
  { valor: "pendente", label: "Pendente", cor: "bg-gray-100 text-gray-600 border-gray-200" },
  { valor: "andamento", label: "Em andamento", cor: "bg-amber-50 text-amber-700 border-amber-200" },
  {
    valor: "concluida",
    label: "Concluída",
    cor: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  { valor: "recusada", label: "Não será feito", cor: "bg-rose-50 text-rose-700 border-rose-200" },
] as const;

interface RelatorioProblema {
  id: string;
  nome: string | null;
  sigla_casa: string | null;
  descricao: string;
  created_at: string | null;
  user_id: string | null;
}

interface ReivindicacaoCasa {
  id: string;
  casa_nome: string;
  sigla: string;
  user_nome: string | null;
  desfeita_em: string | null;
  created_at: string;
}

interface PedidoRemocaoCasa {
  id: string;
  casa_nome: string;
  nome_solicitante: string;
  contato: string;
  restaurada_em: string | null;
  created_at: string;
}

interface SugestaoSite {
  id: string;
  name: string;
  email: string;
  suggestion: string;
  created_at: string | null;
}

function AdminDashboard() {
  const { user, isDev, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<StatOverview>({
    casasTotal: 0,
    casasAtivas: 0,
    usuariosTotal: 0,
    problemasTotal: 0,
    sugestoesTotal: 0,
    solicitacoesTotal: 0,
  });

  const [loadingData, setLoadingData] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Lists
  const [casas, setCasas] = useState<Casa[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoDev[]>([]);
  const [problemas, setProblemas] = useState<RelatorioProblema[]>([]);
  const [sugestoes, setSugestoes] = useState<SugestaoSite[]>([]);
  const [reivindicacoes, setReivindicacoes] = useState<ReivindicacaoCasa[]>([]);
  const [remocoes, setRemocoes] = useState<PedidoRemocaoCasa[]>([]);
  // Edicao em curso de cada solicitacao: status escolhido e devolutiva.
  const [edicaoSolicitacao, setEdicaoSolicitacao] = useState<
    Record<string, { status: string; resposta: string }>
  >({});
  const [salvandoSolicitacao, setSalvandoSolicitacao] = useState<string | null>(null);

  // Search/Filters
  const [searchCasa, setSearchCasa] = useState("");
  const [searchUsuario, setSearchUsuario] = useState("");

  // Modals / Actions
  const [novaCasa, setNovaCasa] = useState({
    nome: "",
    sigla: "",
    cidade: "",
    estado: "",
    endereco: "",
  });
  const [showAddCasa, setShowAddCasa] = useState(false);

  const loadAllData = async () => {
    if (!isDev) return;
    setLoadingData(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      // 1. Fetch houses
      const { data: casasData, error: casasErr } = await supabase
        .from("casas_espirita")
        .select("*")
        .order("nome");
      if (casasErr) throw casasErr;
      setCasas(casasData || []);

      // 2. Fetch users
      const { data: profilesData, error: profilesErr } = await supabase
        .from("profiles")
        .select("id, nome, sigla_casa, cargo_principal, cidade, uf, created_at")
        .order("nome");
      if (profilesErr) throw profilesErr;
      setUsuarios(profilesData || []);

      // 3. Fetch problem reports
      const { data: problemasData, error: problemasErr } = await supabase
        .from("problem_reports")
        .select("*")
        .order("created_at", { ascending: false });
      if (problemasErr) throw problemasErr;
      setProblemas(problemasData || []);

      // 4. Fetch site suggestions
      const { data: sugestoesData, error: sugestoesErr } = await supabase
        .from("site_suggestions")
        .select("*")
        .order("created_at", { ascending: false });
      if (sugestoesErr) throw sugestoesErr;
      setSugestoes(sugestoesData || []);

      // 5. Fetch dev requests
      const { data: devData, error: devErr } = await supabase
        .from("solicitacoes_dev")
        .select("*")
        .order("created_at", { ascending: false });
      if (devErr) throw devErr;
      setSolicitacoes(devData || []);

      // 6. Casas assumidas pela direção e pedidos de retirada do diretório
      const { data: reivData, error: reivErr } = await supabase
        .from("casas_reivindicacoes")
        .select("id, casa_nome, sigla, user_nome, desfeita_em, created_at")
        .order("created_at", { ascending: false });
      if (reivErr) throw reivErr;
      setReivindicacoes(reivData || []);

      const { data: remData, error: remErr } = await supabase
        .from("casas_pedidos_remocao")
        .select("id, casa_nome, nome_solicitante, contato, restaurada_em, created_at")
        .order("created_at", { ascending: false });
      if (remErr) throw remErr;
      setRemocoes(remData || []);

      // Update statistics
      const totalCasas = casasData?.length || 0;

      // Casas ativas = aquelas que possuem pelo menos um usuário cadastrado (estão usando o sistema)
      const siglasAtivas = new Set(
        profilesData
          ?.map((p) => p.sigla_casa)
          .filter((sigla): sigla is string => typeof sigla === "string" && sigla.trim().length > 0)
          .map((sigla) => sigla.trim().toUpperCase()),
      );
      const ativasCasas = siglasAtivas.size;

      const totalUsuarios = profilesData?.length || 0;
      const totalProblemas = problemasData?.length || 0;
      const totalSugestoes = sugestoesData?.length || 0;
      const totalSolicitacoes = devData?.length || 0;

      setStats({
        casasTotal: totalCasas,
        casasAtivas: ativasCasas,
        usuariosTotal: totalUsuarios,
        problemasTotal: totalProblemas,
        sugestoesTotal: totalSugestoes,
        solicitacoesTotal: totalSolicitacoes,
      });
    } catch (e: unknown) {
      console.error(e);
      setErrorMsg("Erro ao carregar dados do banco: " + mensagemDeErro(e));
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (!loading && isDev) {
      loadAllData();
    }
  }, [loading, isDev]);

  // Casa toggle active
  const toggleCasaAtiva = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("casas_espirita")
        .update({ ativa: !currentStatus })
        .eq("id", id);
      if (error) throw error;
      setSuccessMsg("Status da casa espírita atualizado com sucesso.");
      loadAllData();
    } catch (e: unknown) {
      setErrorMsg("Erro ao atualizar status da casa: " + mensagemDeErro(e));
    }
  };

  // Add new house
  const handleAddCasa = async (e: React.FormEvent) => {
    e.preventDefault();
    const siglaUpper = novaCasa.sigla.trim().toUpperCase();
    if (!novaCasa.nome.trim()) {
      setErrorMsg("Informe o nome da casa");
      return;
    }
    if (siglaUpper.length !== 5) {
      setErrorMsg("A sigla deve conter exatamente 5 letras");
      return;
    }
    if (!novaCasa.cidade.trim() || !novaCasa.estado.trim()) {
      setErrorMsg("Cidade e Estado são obrigatórios");
      return;
    }

    try {
      // Insert in siglas_casas table first to ensure integrity
      const { error: siglaErr } = await supabase.from("siglas_casas").insert({ sigla: siglaUpper });

      if (siglaErr && siglaErr.code !== "23505") {
        // Ignore if code 23505 (already exists)
        throw siglaErr;
      }

      // Insert in casas_espirita
      const { error } = await supabase.from("casas_espirita").insert({
        nome: novaCasa.nome.trim().toUpperCase(),
        sigla: siglaUpper,
        cidade: novaCasa.cidade.trim(),
        estado: novaCasa.estado.trim().toUpperCase(),
        endereco: novaCasa.endereco.trim() || null,
        ativa: true,
        aceita_doacao_alimentos: false,
      });

      if (error) throw error;

      setSuccessMsg(`Casa espírita com sigla ${siglaUpper} cadastrada com sucesso!`);
      setShowAddCasa(false);
      setNovaCasa({ nome: "", sigla: "", cidade: "", estado: "", endereco: "" });
      loadAllData();
    } catch (e: unknown) {
      setErrorMsg("Erro ao cadastrar casa: " + mensagemDeErro(e));
    }
  };

  // Delete problem report
  const deleteProblema = async (id: string) => {
    if (!window.confirm("Deseja marcar este relatório como resolvido/removido?")) return;
    try {
      const { error } = await supabase.from("problem_reports").delete().eq("id", id);
      if (error) throw error;
      setSuccessMsg("Relatório resolvido com sucesso.");
      loadAllData();
    } catch (e: unknown) {
      setErrorMsg("Erro ao remover relatório: " + mensagemDeErro(e));
    }
  };

  // Delete suggestion
  //
  // O `.select()` no fim nao e enfeite: sem ele, uma remocao barrada pela
  // permissao do banco volta sem erro e com zero linhas, e a tela dizia
  // "removida com sucesso" sem ter removido nada.
  const deleteSugestao = async (id: string) => {
    if (!window.confirm("Deseja excluir esta sugestão?")) return;
    try {
      const { data, error } = await supabase
        .from("site_suggestions")
        .delete()
        .eq("id", id)
        .select("id");
      if (error) throw error;
      if (!data || data.length === 0)
        throw new Error("nenhuma linha foi removida — verifique a permissão do banco");
      setSuccessMsg("Sugestão removida com sucesso.");
      loadAllData();
    } catch (e: unknown) {
      setErrorMsg("Erro ao remover sugestão: " + mensagemDeErro(e));
    }
  };

  // Delete dev request
  const deleteSolicitacao = async (id: string) => {
    if (!window.confirm("Deseja remover esta solicitação de desenvolvimento?")) return;
    try {
      const { data, error } = await supabase
        .from("solicitacoes_dev")
        .delete()
        .eq("id", id)
        .select("id");
      if (error) throw error;
      if (!data || data.length === 0)
        throw new Error("nenhuma linha foi removida — verifique a permissão do banco");
      setSuccessMsg("Solicitação removida com sucesso.");
      loadAllData();
    } catch (e: unknown) {
      setErrorMsg("Erro ao remover solicitação: " + mensagemDeErro(e));
    }
  };

  // Desfaz uma casa assumida indevidamente: tira o acesso de quem assumiu,
  // despublica a página e devolve a casa ao diretório sem sigla.
  const desfazerReivindicacao = async (r: ReivindicacaoCasa) => {
    if (
      !window.confirm(
        `Desfazer a posse da casa "${r.casa_nome}" (${r.sigla}) por ${r.user_nome ?? "membro"}? ` +
          "A página será despublicada e a casa volta ao diretório sem dono.",
      )
    )
      return;
    try {
      const { error } = await supabase.rpc("desfazer_reivindicacao", { p_reivindicacao: r.id });
      if (error) throw error;
      setSuccessMsg("Posse desfeita. A casa voltou ao diretório sem página.");
      loadAllData();
    } catch (e: unknown) {
      setErrorMsg("Erro ao desfazer: " + mensagemDeErro(e));
    }
  };

  // Devolve ao diretório uma casa retirada por engano ou por má-fé.
  const restaurarCasa = async (r: PedidoRemocaoCasa) => {
    if (!window.confirm(`Colocar "${r.casa_nome}" de volta no diretório público?`)) return;
    try {
      const { error } = await supabase.rpc("restaurar_casa_no_diretorio", { p_pedido: r.id });
      if (error) throw error;
      setSuccessMsg("Casa devolvida ao diretório.");
      loadAllData();
    } catch (e: unknown) {
      setErrorMsg("Erro ao restaurar: " + mensagemDeErro(e));
    }
  };

  // Atualiza o andamento de uma solicitacao. Quem pediu ve o novo status e a
  // devolutiva no Status do Projeto, sem precisar perguntar a ninguem.
  const salvarSolicitacao = async (s: SolicitacaoDev) => {
    const edicao = edicaoSolicitacao[s.id] ?? {
      status: s.status,
      resposta: s.resposta_dev ?? "",
    };
    if (edicao.status === "recusada" && !edicao.resposta.trim()) {
      setErrorMsg('Escreva o motivo antes de marcar como "Não será feito" — quem pediu vai lê-lo.');
      return;
    }
    setSalvandoSolicitacao(s.id);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const { data, error } = await supabase
        .from("solicitacoes_dev")
        .update({
          status: edicao.status,
          resposta_dev: edicao.resposta.trim() || null,
          atualizado_em: new Date().toISOString(),
        })
        .eq("id", s.id)
        .select("id");
      if (error) throw error;
      if (!data || data.length === 0)
        throw new Error("nenhuma linha foi alterada — verifique a permissão do banco");
      setSuccessMsg("Solicitação atualizada. Quem pediu já vê o novo status no Status do Projeto.");
      loadAllData();
    } catch (e: unknown) {
      setErrorMsg("Erro ao atualizar solicitação: " + mensagemDeErro(e));
    } finally {
      setSalvandoSolicitacao(null);
    }
  };

  // Safe checks
  if (loading) {
    return (
      <main className="page-light min-h-screen px-4 pt-24 pb-20 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!user || !isDev) {
    return (
      <main className="page-light min-h-screen px-4 pt-24 pb-20 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm glass rounded-3xl p-8 shadow-sm">
          <ShieldAlert size={36} strokeWidth={1.5} className="text-red-500 mx-auto animate-pulse" />
          <h1 className="text-lg font-bold text-gray-800">Acesso Restrito</h1>
          <p className="text-sm text-gray-500">
            Esta área é de uso restrito do administrador / desenvolvedor do sistema.
          </p>
          <Link
            to="/inicio"
            className="inline-block mt-2 px-5 py-2.5 rounded-xl bg-[#004a8c] text-white text-xs font-semibold hover:bg-[#00386b] transition-all"
          >
            Voltar ao Início
          </Link>
        </div>
      </main>
    );
  }

  // Filtered lists
  const filteredCasas = casas.filter(
    (c) =>
      c.nome.toLowerCase().includes(searchCasa.toLowerCase()) ||
      (c.sigla && c.sigla.toLowerCase().includes(searchCasa.toLowerCase())) ||
      c.cidade.toLowerCase().includes(searchCasa.toLowerCase()),
  );

  const filteredUsuarios = usuarios.filter(
    (u) =>
      (u.nome && u.nome.toLowerCase().includes(searchUsuario.toLowerCase())) ||
      (u.sigla_casa && u.sigla_casa.toLowerCase().includes(searchUsuario.toLowerCase())) ||
      (u.cargo_principal && u.cargo_principal.toLowerCase().includes(searchUsuario.toLowerCase())),
  );

  return (
    <main className="page-light min-h-screen px-4 pt-24 pb-20">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center border border-violet-100 text-violet-600 shrink-0">
              <LayoutDashboard size={22} strokeWidth={1.8} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
                Painel do Administrador
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Controle global de usuários, casas cadastradas, problemas e solicitações
              </p>
            </div>
          </div>
          <button
            onClick={loadAllData}
            disabled={loadingData}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 bg-white hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={14} className={loadingData ? "animate-spin" : ""} />
            Atualizar dados
          </button>
        </div>

        {/* Notifications */}
        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2 animate-fade-in">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-medium flex items-center gap-2 animate-fade-in">
            <AlertTriangle size={16} className="text-red-600 shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            {
              label: "Casas Espíritas",
              value: `${stats.casasAtivas} / ${stats.casasTotal}`,
              sub: "ativas (uso) / registradas",
              icon: Building2,
              col: "text-blue-600 bg-blue-50/50",
            },
            {
              label: "Usuários / Perfis",
              value: stats.usuariosTotal,
              sub: "contas cadastradas",
              icon: Users,
              col: "text-indigo-600 bg-indigo-50/50",
            },
            {
              label: "Solicitações DEV",
              value: stats.solicitacoesTotal,
              sub: "pedidos pendentes",
              icon: LayoutDashboard,
              col: "text-violet-600 bg-violet-50/50",
            },
            {
              label: "Relatórios de Problemas",
              value: stats.problemasTotal,
              sub: "alertas do site",
              icon: AlertTriangle,
              col: "text-amber-600 bg-amber-50/50",
            },
            {
              label: "Sugestões do Site",
              value: stats.sugestoesTotal,
              sub: "ideias recebidas",
              icon: MessageCircle,
              col: "text-cyan-600 bg-cyan-50/50",
            },
            {
              label: "Casas Ativas %",
              value:
                stats.casasTotal > 0
                  ? `${Math.round((stats.casasAtivas / stats.casasTotal) * 100)}%`
                  : "0%",
              sub: "taxa de atividade",
              icon: Check,
              col: "text-emerald-600 bg-emerald-50/50",
            },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="bg-white border border-gray-150 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400 leading-none">
                    {s.label}
                  </span>
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center border border-current/10 shrink-0 ${s.col}`}
                  >
                    <Icon size={14} />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-xl font-bold text-gray-800 tracking-tight leading-none">
                    {s.value}
                  </span>
                  <p className="text-[10px] text-gray-400 mt-1">{s.sub}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-1.5 border-b border-gray-250 pb-px">
          {[
            { id: "overview", label: "Visão Geral" },
            { id: "casas", label: "Casas Espíritas" },
            { id: "usuarios", label: "Usuários" },
            { id: "solicitacoes", label: "Solicitações DEV" },
            { id: "problemas", label: "Problemas do Site" },
            { id: "sugestoes", label: "Sugestões" },
            { id: "artigos", label: "Artigos" },
            { id: "convite", label: "Convite às casas" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as Tab)}
              className={`px-4 py-2.5 text-xs font-semibold transition-all border-b-2 -mb-px rounded-t-xl ${
                activeTab === t.id
                  ? "border-[#004a8c] text-[#004a8c] bg-white/70"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm min-h-[400px]">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Resumo Administrativo</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Visão rápida das últimas atividades e ações mais recomendadas
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Problemas Recentes */}
                <div className="border border-gray-150 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <h3 className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                      <AlertTriangle size={15} className="text-amber-500" />
                      Problemas Reportados Recentes ({problemas.length})
                    </h3>
                    <button
                      onClick={() => setActiveTab("problemas")}
                      className="text-[10px] font-bold text-cyan-600 hover:underline"
                    >
                      Ver todos
                    </button>
                  </div>
                  {problemas.length === 0 ? (
                    <p className="text-xs text-gray-400 italic text-center py-6">
                      Nenhum problema relatado pendente.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {problemas.slice(0, 3).map((p) => (
                        <div
                          key={p.id}
                          className="p-3 bg-gray-50/50 border border-gray-100 rounded-xl space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-xs text-gray-700">
                              {p.nome || "Usuário Anônimo"} ({p.sigla_casa || "Sem Casa"})
                            </span>
                            <span className="text-[9px] text-gray-400">
                              {p.created_at
                                ? new Date(p.created_at).toLocaleDateString("pt-BR")
                                : "Recente"}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                            {p.descricao}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sugestões Recentes */}
                <div className="border border-gray-150 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <h3 className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                      <MessageCircle size={15} className="text-cyan-500" />
                      Sugestões Recebidas Recentes ({sugestoes.length})
                    </h3>
                    <button
                      onClick={() => setActiveTab("sugestoes")}
                      className="text-[10px] font-bold text-cyan-600 hover:underline"
                    >
                      Ver todas
                    </button>
                  </div>
                  {sugestoes.length === 0 ? (
                    <p className="text-xs text-gray-400 italic text-center py-6">
                      Nenhuma sugestão enviada recentemente.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {sugestoes.slice(0, 3).map((s) => (
                        <div
                          key={s.id}
                          className="p-3 bg-gray-50/50 border border-gray-100 rounded-xl space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-xs text-gray-700">
                              {s.name} ({s.email})
                            </span>
                            <span className="text-[9px] text-gray-400">
                              {s.created_at
                                ? new Date(s.created_at).toLocaleDateString("pt-BR")
                                : "Recente"}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                            {s.suggestion}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Admin Actions */}
              <div className="bg-violet-50/20 border border-violet-100 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-violet-800 mb-3">
                  Atalhos de Administração Rápida
                </h3>
                <div className="flex flex-wrap gap-2.5">
                  <button
                    onClick={() => {
                      setShowAddCasa(true);
                      setActiveTab("casas");
                    }}
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    <PlusCircle size={14} />
                    Cadastrar Nova Casa Espírita
                  </button>
                  <button
                    onClick={() => setActiveTab("casas")}
                    className="px-4 py-2 border border-violet-250 bg-white hover:bg-violet-50 text-violet-700 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Gerenciar Atividade de Casas
                  </button>
                  <button
                    onClick={() => setActiveTab("usuarios")}
                    className="px-4 py-2 border border-violet-250 bg-white hover:bg-violet-50 text-violet-700 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Listar e Filtrar Usuários
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CASAS ESPÍRITAS */}
          {activeTab === "casas" && (
            <div className="space-y-6">
              {/* Diretório público: quem assumiu casa e quem pediu para sair.
                  Assumir uma casa não passa por conferência — a escolha foi
                  não barrar ninguém —, então este é o lugar de olhar e desfazer
                  o que estiver errado. */}
              {(reivindicacoes.length > 0 || remocoes.length > 0) && (
                <div className="border border-gray-200 rounded-2xl p-5 bg-white space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-gray-800">Diretório público</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Casas assumidas pela direção e casas retiradas a pedido. Nada aqui passou por
                      conferência: confira e desfaça o que não procede.
                    </p>
                  </div>

                  {reivindicacoes.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] uppercase tracking-widest text-gray-400">
                        Casas assumidas ({reivindicacoes.filter((r) => !r.desfeita_em).length}{" "}
                        ativas)
                      </p>
                      {reivindicacoes.map((r) => (
                        <div
                          key={r.id}
                          className="flex flex-wrap items-center justify-between gap-3 border border-gray-100 rounded-xl px-4 py-3"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-800">
                              {r.casa_nome}{" "}
                              <span className="font-normal text-gray-400">· {r.sigla}</span>
                            </p>
                            <p className="text-[11px] text-gray-500">
                              Assumida por {r.user_nome ?? "membro"} em{" "}
                              {new Date(r.created_at).toLocaleDateString("pt-BR")}
                              {r.desfeita_em
                                ? ` · desfeita em ${new Date(r.desfeita_em).toLocaleDateString("pt-BR")}`
                                : ""}
                            </p>
                          </div>
                          {!r.desfeita_em && (
                            <button
                              onClick={() => desfazerReivindicacao(r)}
                              className="text-[10px] font-semibold uppercase tracking-widest px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              Desfazer
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {remocoes.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] uppercase tracking-widest text-gray-400">
                        Casas retiradas a pedido
                      </p>
                      {remocoes.map((r) => (
                        <div
                          key={r.id}
                          className="flex flex-wrap items-center justify-between gap-3 border border-gray-100 rounded-xl px-4 py-3"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-800">{r.casa_nome}</p>
                            <p className="text-[11px] text-gray-500">
                              Pedido por {r.nome_solicitante} ({r.contato}) em{" "}
                              {new Date(r.created_at).toLocaleDateString("pt-BR")}
                              {r.restaurada_em
                                ? ` · devolvida em ${new Date(r.restaurada_em).toLocaleDateString("pt-BR")}`
                                : ""}
                            </p>
                          </div>
                          {!r.restaurada_em && (
                            <button
                              onClick={() => restaurarCasa(r)}
                              className="text-[10px] font-semibold uppercase tracking-widest px-3 py-1.5 rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-colors"
                            >
                              Devolver ao diretório
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Casas Espíritas Cadastradas</h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Pesquise, gerencie atividade e cadastre novos centros
                  </p>
                </div>
                <button
                  onClick={() => setShowAddCasa(!showAddCasa)}
                  className="px-4 py-2 bg-[#004a8c] hover:bg-[#003c73] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors self-start"
                >
                  <PlusCircle size={14} />
                  {showAddCasa ? "Fechar Form" : "Cadastrar Nova Casa"}
                </button>
              </div>

              {/* Form Add Casa */}
              {showAddCasa && (
                <form
                  onSubmit={handleAddCasa}
                  className="p-5 border border-[#004a8c]/15 bg-gray-50/50 rounded-2xl space-y-4 animate-fade-in-up"
                >
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Cadastrar Nova Casa Espírita
                  </h3>
                  <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1.5">
                        Sigla (5 letras) *
                      </label>
                      <input
                        type="text"
                        maxLength={5}
                        placeholder="Ex: CEBGD"
                        value={novaCasa.sigla}
                        onChange={(e) =>
                          setNovaCasa({
                            ...novaCasa,
                            sigla: e.target.value.toUpperCase().replace(/[^A-Z]/g, ""),
                          })
                        }
                        required
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium uppercase tracking-widest text-gray-700 bg-white focus:outline-none focus:border-[#004a8c]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1.5">
                        Nome Oficial *
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: CENTRO ESPÍRITA..."
                        value={novaCasa.nome}
                        onChange={(e) => setNovaCasa({ ...novaCasa, nome: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 bg-white focus:outline-none focus:border-[#004a8c]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1.5">
                        Cidade *
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Rio de Janeiro"
                        value={novaCasa.cidade}
                        onChange={(e) => setNovaCasa({ ...novaCasa, cidade: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 bg-white focus:outline-none focus:border-[#004a8c]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1.5">
                        Estado (UF) *
                      </label>
                      <input
                        type="text"
                        maxLength={2}
                        placeholder="Ex: RJ"
                        value={novaCasa.estado}
                        onChange={(e) =>
                          setNovaCasa({
                            ...novaCasa,
                            estado: e.target.value.toUpperCase().replace(/[^A-Z]/g, ""),
                          })
                        }
                        required
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium uppercase text-gray-700 bg-white focus:outline-none focus:border-[#004a8c]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1.5">
                      Endereço Completo
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Rua das Flores, 123 - Centro"
                      value={novaCasa.endereco}
                      onChange={(e) => setNovaCasa({ ...novaCasa, endereco: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 bg-white focus:outline-none focus:border-[#004a8c]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
                  >
                    Salvar e Ativar Casa
                  </button>
                </form>
              )}

              {/* Search Bar */}
              <div className="relative max-w-md">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Pesquise por nome, sigla ou cidade..."
                  value={searchCasa}
                  onChange={(e) => setSearchCasa(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-xs text-gray-700 focus:outline-none focus:border-cyan-500 bg-gray-50/50"
                />
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-2xl border border-gray-150">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-150 text-gray-700 font-semibold">
                      <th className="text-left px-5 py-3 w-20">Sigla</th>
                      <th className="text-left px-4 py-3">Nome da Casa Espírita</th>
                      <th className="text-left px-4 py-3">Cidade / UF</th>
                      <th className="text-left px-4 py-3">Endereço</th>
                      <th className="text-center px-4 py-3 w-28">Status</th>
                      <th className="text-center px-4 py-3 w-28">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCasas.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-8 text-center text-gray-400 italic">
                          Nenhuma casa espírita encontrada.
                        </td>
                      </tr>
                    ) : (
                      filteredCasas.map((c, idx) => (
                        <tr
                          key={c.id}
                          className={`border-b border-gray-100 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/20"}`}
                        >
                          <td className="px-5 py-3 font-bold tracking-widest text-[#004a8c]">
                            {c.sigla || "—"}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-800">{c.nome}</td>
                          <td className="px-4 py-3 text-gray-500">
                            {c.cidade} - {c.estado}
                          </td>
                          <td className="px-4 py-3 text-gray-400 line-clamp-1 mt-1">
                            {c.endereco || "Não cadastrado"}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full font-semibold text-[10px] ${
                                c.ativa
                                  ? "text-emerald-600 bg-emerald-50 border border-emerald-200"
                                  : "text-gray-400 bg-gray-50 border border-gray-200"
                              }`}
                            >
                              {c.ativa ? "Ativa" : "Inativa"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => toggleCasaAtiva(c.id, c.ativa)}
                              className={`p-1.5 rounded-lg border text-xs font-semibold shadow-sm transition-colors cursor-pointer ${
                                c.ativa
                                  ? "border-red-200 text-red-500 bg-white hover:bg-red-50"
                                  : "border-emerald-200 text-emerald-600 bg-white hover:bg-emerald-50"
                              }`}
                              title={c.ativa ? "Desativar" : "Ativar"}
                            >
                              <Power size={13} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: USUÁRIOS */}
          {activeTab === "usuarios" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Usuários Cadastrados no Sistema</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Monitore os perfis ativos, cargos e centros correspondentes
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative max-w-md">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Pesquise por nome, sigla ou cargo..."
                  value={searchUsuario}
                  onChange={(e) => setSearchUsuario(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-xs text-gray-700 focus:outline-none focus:border-cyan-500 bg-gray-50/50"
                />
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-2xl border border-gray-150">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-150 text-gray-700 font-semibold">
                      <th className="text-left px-5 py-3">Nome</th>
                      <th className="text-left px-4 py-3 w-28">Casa Espírita</th>
                      <th className="text-left px-4 py-3">Cargo Principal</th>
                      <th className="text-left px-4 py-3">Cidade / UF</th>
                      <th className="text-left px-4 py-3 w-40">Data de Cadastro</th>
                      <th className="text-right px-5 py-3 w-28">Conta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsuarios.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-8 text-center text-gray-400 italic">
                          Nenhum perfil cadastrado ou encontrado.
                        </td>
                      </tr>
                    ) : (
                      filteredUsuarios.map((u, idx) => (
                        <tr
                          key={u.id}
                          className={`border-b border-gray-100 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/20"}`}
                        >
                          <td className="px-5 py-3 font-semibold text-gray-800">
                            {u.nome || "Não informado"}
                          </td>
                          <td className="px-4 py-3 font-bold tracking-widest text-[#004a8c]">
                            {u.sigla_casa || "—"}
                          </td>
                          <td className="px-4 py-3">
                            {u.cargo_principal ? (
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                                  u.cargo_principal === "DEV"
                                    ? "bg-violet-100 text-violet-700 border border-violet-200"
                                    : u.cargo_principal === "Presidente"
                                      ? "bg-rose-100 text-rose-700 border border-rose-200"
                                      : "bg-gray-100 text-gray-600 border border-gray-200"
                                }`}
                              >
                                {u.cargo_principal}
                              </span>
                            ) : (
                              <span className="text-gray-400 italic">Sem cargo</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-500">
                            {u.cidade || "—"} {u.uf ? `- ${u.uf}` : ""}
                          </td>
                          <td className="px-4 py-3 text-gray-400">
                            {u.created_at
                              ? new Date(u.created_at).toLocaleDateString("pt-BR")
                              : "Antigo"}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <GerirUsuario
                              usuarioId={u.id}
                              nome={u.nome || "Não informado"}
                              onConcluido={loadAllData}
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: SOLICITAÇÕES DEV */}
          {activeTab === "solicitacoes" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Solicitações de Desenvolvimento</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Pedidos de novas funcionalidades enviados pelos coordenadores do site
                </p>
              </div>

              {solicitacoes.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-gray-250 rounded-2xl">
                  <LayoutDashboard size={32} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-400 italic">
                    Nenhuma solicitação de desenvolvimento recebida.
                  </p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {solicitacoes.map((s) => {
                    const edicao = edicaoSolicitacao[s.id] ?? {
                      status: s.status,
                      resposta: s.resposta_dev ?? "",
                    };
                    const alterado =
                      edicao.status !== s.status || edicao.resposta !== (s.resposta_dev ?? "");
                    const statusAtual =
                      STATUS_SOLICITACAO.find((op) => op.valor === s.status) ??
                      STATUS_SOLICITACAO[0];
                    return (
                      <div
                        key={s.id}
                        className="border border-gray-200 rounded-2xl p-5 bg-white space-y-3 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.01)] hover:shadow-sm transition-shadow"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-4">
                            <h3 className="font-semibold text-sm text-gray-800 leading-snug">
                              {s.titulo}
                            </h3>
                            <button
                              onClick={() => deleteSolicitacao(s.id)}
                              className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                              title="Remover"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 leading-relaxed font-light">
                            {s.descricao || "Sem detalhes adicionais."}
                          </p>
                          <span
                            className={`inline-block text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full border ${statusAtual.cor}`}
                          >
                            {statusAtual.label}
                          </span>
                        </div>

                        <div className="space-y-2 pt-1">
                          <label className="block text-[10px] uppercase tracking-widest text-gray-400">
                            Situação
                          </label>
                          <select
                            value={edicao.status}
                            onChange={(e) =>
                              setEdicaoSolicitacao((prev) => ({
                                ...prev,
                                [s.id]: { ...edicao, status: e.target.value },
                              }))
                            }
                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-700 focus:outline-none focus:border-gray-400 transition-colors"
                          >
                            {STATUS_SOLICITACAO.map((op) => (
                              <option key={op.valor} value={op.valor}>
                                {op.label}
                              </option>
                            ))}
                          </select>
                          <label className="block text-[10px] uppercase tracking-widest text-gray-400 pt-1">
                            Resposta a quem pediu
                          </label>
                          <textarea
                            value={edicao.resposta}
                            rows={2}
                            placeholder="O que foi feito, quando entra ou por que não será feito."
                            onChange={(e) =>
                              setEdicaoSolicitacao((prev) => ({
                                ...prev,
                                [s.id]: { ...edicao, resposta: e.target.value },
                              }))
                            }
                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-700 placeholder-gray-300 focus:outline-none focus:border-gray-400 transition-colors resize-none"
                          />
                          <button
                            onClick={() => salvarSolicitacao(s)}
                            disabled={!alterado || salvandoSolicitacao === s.id}
                            className="w-full py-2 rounded-xl text-[10px] font-semibold uppercase tracking-widest border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-default transition-colors"
                          >
                            {salvandoSolicitacao === s.id ? "Salvando…" : "Salvar situação"}
                          </button>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-gray-400 pt-2 border-t border-gray-50">
                          <span>
                            {s.atualizado_em
                              ? "Respondida em " +
                                new Date(s.atualizado_em).toLocaleDateString("pt-BR")
                              : "Sem resposta ainda"}
                          </span>
                          <span>
                            {s.created_at ? new Date(s.created_at).toLocaleDateString("pt-BR") : ""}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: PROBLEMAS DO SITE */}
          {activeTab === "problemas" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Relatórios de Problemas e Bugs</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Notificações enviadas pelos usuários sobre erros no uso da plataforma
                </p>
              </div>

              {problemas.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-gray-250 rounded-2xl">
                  <AlertTriangle size={32} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-400 italic">
                    Nenhum erro reportado. Tudo funcionando perfeitamente.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {problemas.map((p) => (
                    <div
                      key={p.id}
                      className="p-5 border border-gray-150 rounded-2xl bg-white space-y-3 flex flex-col sm:flex-row sm:items-start justify-between gap-4 shadow-[0_1px_3px_rgba(0,0,0,0.01)]"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="text-xs font-bold text-gray-800">
                            {p.nome || "Usuário"}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            ({p.sigla_casa || "Sem Casa vinculada"})
                          </span>
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                          <span className="text-[10px] text-gray-400">
                            {p.created_at
                              ? new Date(p.created_at).toLocaleDateString("pt-BR") +
                                " " +
                                new Date(p.created_at).toLocaleTimeString("pt-BR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "Desconhecido"}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed font-light">
                          {p.descricao}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteProblema(p.id)}
                        className="px-3 py-1.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold shadow-sm transition-colors shrink-0 flex items-center gap-1 cursor-pointer align-self-start"
                      >
                        <Check size={13} strokeWidth={2.5} />
                        Marcar como Resolvido
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: SUGESTÕES */}
          {activeTab === "sugestoes" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Sugestões de Melhorias do Site</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Ideias fraternas de evolução do Apoio Espírita enviadas pelo formulário público
                </p>
              </div>

              {sugestoes.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-gray-250 rounded-2xl">
                  <MessageCircle size={32} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-400 italic">Nenhuma sugestão recebida ainda.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sugestoes.map((s) => (
                    <div
                      key={s.id}
                      className="p-5 border border-gray-150 rounded-2xl bg-white space-y-3 flex flex-col sm:flex-row sm:items-start justify-between gap-4 shadow-[0_1px_3px_rgba(0,0,0,0.01)]"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="text-xs font-bold text-gray-800">{s.name}</span>
                          <span className="text-xs text-[#004a8c] font-medium">({s.email})</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                          <span className="text-[10px] text-gray-400">
                            {s.created_at
                              ? new Date(s.created_at).toLocaleDateString("pt-BR")
                              : "Recente"}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed font-light">
                          {s.suggestion}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteSugestao(s.id)}
                        className="p-2 rounded-xl border border-gray-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors shadow-sm text-gray-400 cursor-pointer align-self-start"
                        title="Excluir Sugestão"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 7: ARTIGOS (MODERAÇÃO) */}
          {activeTab === "artigos" && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <Scale size={16} className="text-violet-600" />
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Moderação de Artigos</h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Fila completa da plataforma — casos retirados pela comunidade, por decisão
                    humana ou reenviados após correção
                  </p>
                </div>
              </div>
              <FilaRevisaoArtigos escopo="plataforma" />
            </div>
          )}

          {/* TAB 8: CONVITE ÀS CASAS DO DIRETÓRIO */}
          {activeTab === "convite" && <ConviteCasas />}
        </div>
      </div>
    </main>
  );
}
