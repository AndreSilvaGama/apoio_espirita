/**
 * Suspender ou excluir a conta de um usuário, a partir do painel.
 *
 * A tela nunca apaga direto. Primeiro pergunta ao servidor o que vai acontecer
 * — quantos registros somem, quantos ficam sem dono — e mostra isso antes de
 * oferecer o botão. O motivo é concreto: excluir quem criou eventos na agenda
 * apaga esses eventos junto, por cascata do banco, e isso não pode ser
 * descoberto depois do fato.
 *
 * Duas saídas, e a mais branda vem primeiro. Suspender resolve o caso comum
 * (conta abandonada, frequentador que nunca voltou) sem destruir nada e sem
 * porta de mão única. Excluir fica reservado a quem pede para sair de verdade,
 * exige digitar o nome da pessoa e diz, em letra grande, o que se perde.
 */
import { useState } from "react";
import { UserX, ShieldOff, ShieldCheck, AlertTriangle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { mensagemDeErro } from "@/lib/erros";

interface Impacto {
  tabela: string;
  registros: number;
}

interface Previsao {
  perfil: { nome: string | null; sigla_casa: string | null; cargo_principal: string | null } | null;
  suspensa: boolean;
  sera_apagado: Impacto[];
  ficara_sem_dono: Impacto[];
}

/** Nomes de tabela não servem para quem lê. Isto traduz. */
const EM_PORTUGUES: Record<string, string> = {
  agenda_eventos: "eventos criados na agenda",
  agenda_participantes: "presenças confirmadas em eventos",
  programacao_participantes: "inscrições em programações",
  administradores_pagina: "permissões de administrar a página da casa",
  atendimento_fichas: "fichas de atendimento fraterno",
  tesouraria_autorizacoes: "autorizações de tesouraria",
  forum_topicos: "tópicos abertos no fórum",
  forum_respostas: "respostas no fórum",
  grupo_mensagens: "mensagens em grupos",
  grupos: "grupos criados",
  bazar_itens: "itens anunciados no bazar",
  bazar_reservas: "reservas no bazar",
  caronas: "caronas oferecidas",
  carona_pedidos: "pedidos de carona",
  entregas: "entregas solidárias",
  voluntariado_ofertas: "ofertas de voluntariado",
  voluntariado_candidaturas: "candidaturas de voluntariado",
  oracao_inscricoes: "inscrições no plantão de orações",
  jovens_publicacoes: "publicações na área de jovens",
};

const traduzir = (t: string) => EM_PORTUGUES[t] ?? t;

export function GerirUsuario({
  usuarioId,
  nome,
  onConcluido,
}: {
  usuarioId: string;
  nome: string;
  onConcluido: () => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [previsao, setPrevisao] = useState<Previsao | null>(null);
  const [confirmacao, setConfirmacao] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function chamar(acao: string) {
    setErro(null);
    setOcupado(true);
    try {
      const { data, error } = await supabase.functions.invoke("gerir-usuario", {
        body: { alvo: usuarioId, acao },
      });
      if (error) throw error;
      if (data?.erro) throw new Error(data.erro);
      return data;
    } catch (e) {
      setErro(mensagemDeErro(e));
      return null;
    } finally {
      setOcupado(false);
    }
  }

  async function abrir() {
    setAberto(true);
    setConfirmacao("");
    setPrevisao(null);
    const d = (await chamar("prever")) as Previsao | null;
    if (d) setPrevisao(d);
  }

  async function agir(acao: "suspender" | "reativar" | "excluir") {
    const d = await chamar(acao);
    if (d) {
      setAberto(false);
      onConcluido();
    }
  }

  const nomeConfere = confirmacao.trim().toLowerCase() === nome.trim().toLowerCase();

  return (
    <>
      <button
        onClick={abrir}
        className="px-2.5 py-1 rounded-lg border border-gray-200 text-[11px] font-semibold text-gray-500 bg-white hover:bg-gray-50 hover:text-gray-800 transition-colors"
      >
        Gerir conta
      </button>

      {aberto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => !ocupado && setAberto(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-3xl p-6 space-y-5 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-gray-800">{nome}</h3>
                {previsao?.perfil && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {previsao.perfil.cargo_principal ?? "Sem cargo"}
                    {previsao.perfil.sigla_casa ? ` · ${previsao.perfil.sigla_casa}` : ""}
                    {previsao.suspensa ? " · conta suspensa" : ""}
                  </p>
                )}
              </div>
              <button
                onClick={() => !ocupado && setAberto(false)}
                className="text-gray-400 hover:text-gray-700 transition-colors shrink-0"
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            {erro && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-start gap-2">
                <AlertTriangle size={15} className="text-red-600 shrink-0 mt-px" />
                {erro}
              </div>
            )}

            {!previsao ? (
              <p className="text-xs text-gray-400 italic py-6 text-center">
                Conferindo o que esta conta tem no site…
              </p>
            ) : (
              <>
                {/* A saída branda, primeiro. */}
                <div className="rounded-2xl border border-gray-200 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    {previsao.suspensa ? (
                      <ShieldCheck size={15} className="text-emerald-600" />
                    ) : (
                      <ShieldOff size={15} className="text-amber-600" />
                    )}
                    <h4 className="text-xs uppercase font-bold tracking-widest text-gray-500">
                      {previsao.suspensa ? "Reativar a conta" : "Suspender a conta"}
                    </h4>
                  </div>
                  <p className="text-xs text-gray-500">
                    {previsao.suspensa
                      ? "A pessoa volta a conseguir entrar, com tudo como estava."
                      : "A pessoa deixa de conseguir entrar e nada é apagado. Pode ser desfeito a qualquer momento. É o caminho certo para conta abandonada ou frequentador que não voltou."}
                  </p>
                  <button
                    onClick={() => agir(previsao.suspensa ? "reativar" : "suspender")}
                    disabled={ocupado}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-40"
                  >
                    {previsao.suspensa ? "Reativar" : "Suspender"}
                  </button>
                </div>

                {/* A saída definitiva, com o estrago à vista. */}
                <div className="rounded-2xl border border-red-200 bg-red-50/40 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <UserX size={15} className="text-red-600" />
                    <h4 className="text-xs uppercase font-bold tracking-widest text-red-700">
                      Excluir definitivamente
                    </h4>
                  </div>

                  {previsao.sera_apagado.length > 0 ? (
                    <div className="text-xs text-red-900">
                      <p className="font-semibold mb-1">Isto será apagado junto, sem volta:</p>
                      <ul className="list-disc pl-5 space-y-0.5">
                        {previsao.sera_apagado.map((i) => (
                          <li key={i.tabela}>
                            <strong>{i.registros}</strong> {traduzir(i.tabela)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-xs text-red-900">
                      Esta conta não tem registros que sejam apagados em cascata.
                    </p>
                  )}

                  {previsao.ficara_sem_dono.length > 0 && (
                    <div className="text-xs text-gray-600">
                      <p className="font-semibold mb-1">
                        Isto permanece no site, mas deixa de ter autor:
                      </p>
                      <ul className="list-disc pl-5 space-y-0.5">
                        {previsao.ficara_sem_dono.map((i) => (
                          <li key={i.tabela}>
                            <strong>{i.registros}</strong> {traduzir(i.tabela)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1.5">
                      Para confirmar, digite o nome: <strong className="text-gray-700">{nome}</strong>
                    </label>
                    <input
                      value={confirmacao}
                      onChange={(e) => setConfirmacao(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:border-red-400 transition-colors"
                      placeholder="Nome exato da pessoa"
                    />
                  </div>

                  <button
                    onClick={() => agir("excluir")}
                    disabled={ocupado || !nomeConfere}
                    className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors disabled:opacity-30"
                  >
                    {ocupado ? "Excluindo…" : "Excluir esta conta para sempre"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
