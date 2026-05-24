import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldAlert, Check, X, Minus, Info } from "lucide-react";

export const Route = createFileRoute("/permissoes")({
  component: Permissoes,
});

// ── Tipos ─────────────────────────────────────────────────────────────────────

type Acesso = "sim" | "nao" | "parcial";

interface Permissao {
  area: string;
  descricao: string;
  presidente: Acesso;
  vice: Acesso;
  decisao: Acesso;   // Coordenador, Diretoria, Dirigente, Dirigente de reunião mediúnica
  tesoureiro: Acesso;
  membros: Acesso;
  nota?: string;
}

// ── Matriz de permissões ──────────────────────────────────────────────────────

const PERMISSOES: Permissao[] = [
  {
    area: "Painel de Permissões",
    descricao: "Visualizar quem pode fazer o quê no sistema",
    presidente: "sim",
    vice: "sim",
    decisao: "sim",
    tesoureiro: "nao",
    membros: "nao",
  },
  {
    area: "Tesouraria",
    descricao: "Acessar movimentações financeiras, receitas e despesas da casa",
    presidente: "sim",
    vice: "nao",
    decisao: "nao",
    tesoureiro: "sim",
    membros: "nao",
    nota: "O Presidente pode conceder acesso ao Tesoureiro ou revogar a qualquer momento.",
  },
  {
    area: "Evangelização",
    descricao: "Planos de aula, jogo da memória e documentos AEE Infância",
    presidente: "sim",
    vice: "sim",
    decisao: "sim",
    tesoureiro: "sim",
    membros: "sim",
  },
  {
    area: "Documentos FEB",
    descricao: "Visualizar e navegar pelos documentos oficiais da Federação Espírita Brasileira",
    presidente: "sim",
    vice: "sim",
    decisao: "sim",
    tesoureiro: "sim",
    membros: "sim",
  },
  {
    area: "Jogos Educativos",
    descricao: "Plante a Semente e Jogo da Memória da Evangelização",
    presidente: "sim",
    vice: "sim",
    decisao: "sim",
    tesoureiro: "sim",
    membros: "sim",
  },
  {
    area: "Agenda / Eventos",
    descricao: "Visualizar eventos, confirmar presença e consultar programação",
    presidente: "sim",
    vice: "sim",
    decisao: "sim",
    tesoureiro: "sim",
    membros: "sim",
  },
  {
    area: "Criar e Editar Eventos",
    descricao: "Cadastrar novos eventos e alterar data, hora e detalhes",
    presidente: "sim",
    vice: "sim",
    decisao: "sim",
    tesoureiro: "nao",
    membros: "nao",
    nota: "Disponível para cargos de decisão; em desenvolvimento.",
  },
  {
    area: "Mensagem do Dia",
    descricao: "Visualizar e receber a mensagem diária",
    presidente: "sim",
    vice: "sim",
    decisao: "sim",
    tesoureiro: "sim",
    membros: "sim",
  },
  {
    area: "Enviar Mensagem do Dia",
    descricao: "Cadastrar e programar mensagens para a fila diária",
    presidente: "sim",
    vice: "sim",
    decisao: "sim",
    tesoureiro: "nao",
    membros: "nao",
    nota: "Em desenvolvimento — disponível para cargos de decisão.",
  },
  {
    area: "Rádio Espírita",
    descricao: "Ouvir a Rádio Rio de Janeiro 1400 AM diretamente no site",
    presidente: "sim",
    vice: "sim",
    decisao: "sim",
    tesoureiro: "sim",
    membros: "sim",
  },
  {
    area: "Acompanhamento do Projeto",
    descricao: "Consultar o roadmap, votar em funcionalidades e acompanhar o progresso",
    presidente: "sim",
    vice: "sim",
    decisao: "sim",
    tesoureiro: "sim",
    membros: "sim",
  },
  {
    area: "Solicitar Desenvolvimento",
    descricao: "Abrir pedidos de novas funcionalidades ao desenvolvedor",
    presidente: "sim",
    vice: "sim",
    decisao: "sim",
    tesoureiro: "sim",
    membros: "sim",
  },
  {
    area: "Gerenciar Membros",
    descricao: "Alterar cargo, vincular ou desvincular membros da casa (em desenvolvimento)",
    presidente: "sim",
    vice: "parcial",
    decisao: "nao",
    tesoureiro: "nao",
    membros: "nao",
    nota: "Vice-presidente somente com autorização expressa do Presidente.",
  },
  {
    area: "Alterar Permissões",
    descricao: "Conceder ou revogar acessos de qualquer membro ou cargo",
    presidente: "sim",
    vice: "nao",
    decisao: "nao",
    tesoureiro: "nao",
    membros: "nao",
    nota: "Exclusivo do Presidente. Nenhum outro cargo pode alterar permissões sem autorização direta.",
  },
  {
    area: "Configurações da Casa",
    descricao: "Dados cadastrais, sigla, endereço e informações públicas da casa",
    presidente: "sim",
    vice: "nao",
    decisao: "nao",
    tesoureiro: "nao",
    membros: "nao",
    nota: "Em desenvolvimento. Somente o Presidente pode alterar.",
  },
];

// ── Ícone de acesso ───────────────────────────────────────────────────────────

function IconeAcesso({ acesso }: { acesso: Acesso }) {
  if (acesso === "sim") return <Check size={16} strokeWidth={2.5} className="text-emerald-500 mx-auto" />;
  if (acesso === "nao") return <X size={16} strokeWidth={2.5} className="text-red-400 mx-auto" />;
  return <Minus size={16} strokeWidth={2.5} className="text-amber-400 mx-auto" />;
}

// ── Legenda do cargo ──────────────────────────────────────────────────────────

function Badge({ label, cor }: { label: string; cor: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${cor}`}>
      {label}
    </span>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

function Permissoes() {
  const { user, isDecisao, isDev, loading, profile } = useAuth();

  if (loading) {
    return (
      <main className="page-light min-h-screen px-4 pt-20 pb-20 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!user || (!isDecisao && !isDev)) {
    return (
      <main className="page-light min-h-screen px-4 pt-20 pb-20 flex items-center justify-center">
        <div className="text-center space-y-3">
          <ShieldAlert size={32} strokeWidth={1.5} className="text-gray-300 mx-auto" />
          <p className="text-sm text-muted-foreground">
            Esta página é restrita aos cargos de decisão da casa.
          </p>
          <Link to="/inicio" className="text-xs text-cyan-600 hover:underline">
            Voltar ao início
          </Link>
        </div>
      </main>
    );
  }

  const cargo = profile?.cargo_principal ?? "—";

  return (
    <main className="page-light min-h-screen px-4 pt-20 pb-20">
      <div className="mx-auto max-w-5xl space-y-6">

        {/* Cabeçalho */}
        <div className="flex items-start gap-3">
          <ShieldAlert size={24} strokeWidth={1.5} className="text-gray-400 mt-0.5 shrink-0" />
          <div>
            <h1 className="text-xl font-bold text-gray-800">Painel de Permissões</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Visível apenas para cargos de decisão · Seu cargo: <strong className="text-gray-700">{cargo}</strong>
            </p>
          </div>
        </div>

        {/* Aviso de autoridade */}
        <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <Info size={16} strokeWidth={1.5} className="text-amber-600 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-800 leading-relaxed">
            <strong>Somente o Presidente</strong>, ou pessoa por ele expressamente autorizada, pode conceder,
            revogar ou alterar as permissões de qualquer membro ou cargo neste sistema. Qualquer solicitação
            de alteração deve ser feita diretamente ao Presidente da casa.
          </p>
        </div>

        {/* Legenda */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
          <span className="font-medium text-gray-600">Legenda:</span>
          <span className="flex items-center gap-1.5">
            <Check size={13} strokeWidth={2.5} className="text-emerald-500" /> Acesso total
          </span>
          <span className="flex items-center gap-1.5">
            <Minus size={13} strokeWidth={2.5} className="text-amber-400" /> Acesso parcial / condicional
          </span>
          <span className="flex items-center gap-1.5">
            <X size={13} strokeWidth={2.5} className="text-red-400" /> Sem acesso
          </span>
        </div>

        {/* Tabela — desktop */}
        <div className="hidden md:block overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-5 py-3 font-semibold text-gray-700 w-1/4">Área / Recurso</th>
                <th className="text-center px-3 py-3 font-semibold text-gray-700 whitespace-nowrap">
                  <Badge label="Presidente" cor="bg-violet-100 text-violet-700" />
                </th>
                <th className="text-center px-3 py-3 font-semibold text-gray-700 whitespace-nowrap">
                  <Badge label="Vice-presidente" cor="bg-indigo-100 text-indigo-700" />
                </th>
                <th className="text-center px-3 py-3 font-semibold text-gray-700 whitespace-nowrap">
                  <div className="flex flex-col gap-0.5 items-center">
                    <Badge label="Coordenador" cor="bg-cyan-100 text-cyan-700" />
                    <span className="text-[10px] text-gray-400">Dirigente · Diretoria</span>
                  </div>
                </th>
                <th className="text-center px-3 py-3 font-semibold text-gray-700 whitespace-nowrap">
                  <Badge label="Tesoureiro" cor="bg-emerald-100 text-emerald-700" />
                </th>
                <th className="text-center px-3 py-3 font-semibold text-gray-700 whitespace-nowrap">
                  <Badge label="Demais membros" cor="bg-gray-100 text-gray-600" />
                </th>
              </tr>
            </thead>
            <tbody>
              {PERMISSOES.map((p, i) => (
                <tr
                  key={p.area}
                  className={`border-b border-gray-100 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                >
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-800">{p.area}</p>
                    <p className="text-xs text-gray-400 mt-0.5 leading-snug">{p.descricao}</p>
                    {p.nota && (
                      <p className="text-xs text-amber-700 mt-1 flex items-start gap-1">
                        <Info size={11} strokeWidth={2} className="mt-0.5 shrink-0" />
                        {p.nota}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center"><IconeAcesso acesso={p.presidente} /></td>
                  <td className="px-3 py-3 text-center"><IconeAcesso acesso={p.vice} /></td>
                  <td className="px-3 py-3 text-center"><IconeAcesso acesso={p.decisao} /></td>
                  <td className="px-3 py-3 text-center"><IconeAcesso acesso={p.tesoureiro} /></td>
                  <td className="px-3 py-3 text-center"><IconeAcesso acesso={p.membros} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cards — mobile */}
        <div className="md:hidden space-y-3">
          {PERMISSOES.map((p) => (
            <div key={p.area} className="border border-gray-200 rounded-xl p-4 bg-white space-y-3">
              <div>
                <p className="font-semibold text-gray-800 text-sm">{p.area}</p>
                <p className="text-xs text-gray-400 mt-0.5">{p.descricao}</p>
                {p.nota && (
                  <p className="text-xs text-amber-700 mt-1.5 flex items-start gap-1">
                    <Info size={11} strokeWidth={2} className="mt-0.5 shrink-0" />
                    {p.nota}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
                {[
                  { label: "Presidente",     acesso: p.presidente, cor: "text-violet-700" },
                  { label: "Vice-presidente",acesso: p.vice,       cor: "text-indigo-700" },
                  { label: "Coordenador/Dirigente", acesso: p.decisao, cor: "text-cyan-700" },
                  { label: "Tesoureiro",     acesso: p.tesoureiro, cor: "text-emerald-700" },
                  { label: "Demais membros", acesso: p.membros,    cor: "text-gray-600"   },
                ].map(({ label, acesso, cor }) => (
                  <div key={label} className="flex items-center gap-2">
                    <IconeAcesso acesso={acesso} />
                    <span className={`font-medium ${cor}`}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Rodapé */}
        <p className="text-xs text-gray-400 text-center">
          Esta tabela reflete as permissões atuais do sistema · Alterações somente pelo Presidente
        </p>
      </div>
    </main>
  );
}
