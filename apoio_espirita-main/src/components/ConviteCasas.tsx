/**
 * Controle do convite às casas espíritas do diretório.
 *
 * O envio em si vive na função `convite-casas`, no servidor: esta tela não
 * sabe para quem enviar nem o que escrever, apenas pede "mande o próximo
 * lote". Se fosse o contrário, a lista de milhares de endereços institucionais
 * teria de descer para o navegador, e não há motivo para isso.
 *
 * O disparo é por lotes, e não de uma vez, por dois motivos concretos:
 * provedores tratam rajada vinda de domínio transacional como spam, e é este
 * mesmo domínio que entrega a recuperação de senha dos membros. Queimar a
 * reputação dele para ganhar dois dias seria um mau negócio.
 */
import { useState } from "react";
import { Mail, Send, Gauge, AlertTriangle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { mensagemDeErro } from "@/lib/erros";

interface Plano {
  type?: string;
  creditsType?: string;
  credits?: number;
  [chave: string]: unknown;
}

interface RespostaConta {
  ok: boolean;
  plano: Plano | Plano[];
  pendentes: number;
}

interface RespostaEnvio {
  enviados: number;
  falharam: number;
  restam: number;
  amostra_de_falhas: Array<{ email: string; erro: string }>;
}

const TAMANHOS = [10, 100, 300, 500];

export function ConviteCasas() {
  const [ocupado, setOcupado] = useState(false);
  const [conta, setConta] = useState<RespostaConta | null>(null);
  const [envio, setEnvio] = useState<RespostaEnvio | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [tamanho, setTamanho] = useState(10);

  async function chamar(corpo: Record<string, unknown>) {
    setErro(null);
    setOcupado(true);
    try {
      const { data, error } = await supabase.functions.invoke("convite-casas", { body: corpo });
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

  async function conferirPlano() {
    const d = (await chamar({ acao: "conta" })) as RespostaConta | null;
    if (d) setConta(d);
  }

  async function enviarLote() {
    const d = (await chamar({ acao: "enviar", limite: tamanho })) as RespostaEnvio | null;
    if (d) {
      setEnvio(d);
      setConta((c) => (c ? { ...c, pendentes: d.restam } : c));
    }
  }

  const pendentes = envio?.restam ?? conta?.pendentes;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Mail size={16} className="text-cyan-600" />
        <div>
          <h2 className="text-lg font-bold text-gray-800">Convite às casas do diretório</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Uma mensagem por casa, com o nome dela, a cidade e o link da própria página. O mesmo
            endereço nunca recebe duas vezes.
          </p>
        </div>
      </div>

      {erro && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-medium flex items-start gap-2">
          <AlertTriangle size={16} className="text-red-600 shrink-0 mt-px" />
          {erro}
        </div>
      )}

      {/* Passo 1 — o limite do provedor, antes de qualquer envio. */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Gauge size={14} className="text-gray-400" />
          <h3 className="text-xs uppercase font-bold tracking-widest text-gray-500">
            1. Conferir o limite do provedor
          </h3>
        </div>
        <p className="text-xs text-gray-500">
          Não envia nada. Só pergunta ao provedor qual é o plano e quantos convites ainda faltam,
          para o lote ser escolhido com base no número real e não no palpite.
        </p>
        <button
          onClick={conferirPlano}
          disabled={ocupado}
          className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-40"
        >
          {ocupado ? "Consultando…" : "Conferir plano e fila"}
        </button>
        {conta && (
          <pre className="text-[11px] bg-gray-50 border border-gray-150 rounded-xl p-3 overflow-x-auto text-gray-700">
            {JSON.stringify(conta.plano, null, 2)}
          </pre>
        )}
      </div>

      {/* Passo 2 — o disparo, em lotes. */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Send size={14} className="text-gray-400" />
          <h3 className="text-xs uppercase font-bold tracking-widest text-gray-500">
            2. Enviar um lote
          </h3>
        </div>
        <p className="text-xs text-gray-500">
          Comece pelo lote de 10 e confira a mensagem na caixa de entrada antes de seguir. Cada
          rodada continua de onde a anterior parou.
        </p>

        <div className="flex flex-wrap gap-1.5">
          {TAMANHOS.map((n) => (
            <button
              key={n}
              onClick={() => setTamanho(n)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                tamanho === n
                  ? "border-[#004a8c] text-[#004a8c] bg-blue-50/60"
                  : "border-gray-200 text-gray-500 bg-white hover:bg-gray-50"
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        <button
          onClick={enviarLote}
          disabled={ocupado}
          className="px-5 py-2.5 rounded-xl bg-[#004a8c] text-white text-xs font-semibold hover:bg-[#00386b] transition-colors disabled:opacity-40"
        >
          {ocupado ? "Enviando…" : `Enviar ${tamanho} convite${tamanho > 1 ? "s" : ""}`}
        </button>

        {envio && (
          <div className="space-y-3">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-px" />
              <span>
                <strong>{envio.enviados}</strong> enviados
                {envio.falharam > 0 && (
                  <>
                    {" · "}
                    <strong>{envio.falharam}</strong> falharam
                  </>
                )}
                {" · "}
                <strong>{envio.restam}</strong> ainda na fila
              </span>
            </div>
            {envio.amostra_de_falhas.length > 0 && (
              <pre className="text-[11px] bg-red-50 border border-red-150 rounded-xl p-3 overflow-x-auto text-red-800">
                {JSON.stringify(envio.amostra_de_falhas, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>

      {pendentes != null && (
        <p className="text-xs text-gray-400">
          Faltam <strong className="text-gray-600">{pendentes}</strong> convites na fila.
        </p>
      )}
    </div>
  );
}
