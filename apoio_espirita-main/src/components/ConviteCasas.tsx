/**
 * Controle do convite às casas espíritas do diretório.
 *
 * O envio vive na função `convite-casas`, no servidor: esta tela não sabe para
 * quem enviar nem o que escrever, apenas pede "mande um lote" ou "ligue a
 * rotina". Se fosse o contrário, a lista de milhares de endereços
 * institucionais teria de descer para o navegador, e não há motivo para isso.
 *
 * A ordem dos passos na tela é a ordem certa de usar, e não é decorativa:
 * confira o provedor, mande 10, abra um deles na sua caixa de entrada, e só
 * então ligue a rotina. Só existe uma primeira impressão com cada casa; um
 * problema no texto descoberto no lote 6 já terá alcançado 1.500 delas.
 */
import { useCallback, useEffect, useState } from "react";
import {
  Mail,
  Send,
  Gauge,
  AlertTriangle,
  CheckCircle2,
  Play,
  Pause,
  CalendarClock,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { mensagemDeErro } from "@/lib/erros";

interface Config {
  automatico: boolean;
  por_dia: number;
  pausado_em: string | null;
  motivo: string | null;
}

interface RespostaConta {
  plano: unknown;
  credito_de_envio: number | null;
  restantes: number;
  config: Config;
}

interface RespostaEnvio {
  enviados: number;
  falharam: number;
  restam: number;
  desligada: string | null;
  amostra_de_falhas: Array<{ email: string; erro: string }>;
}

const TAMANHOS = [10, 100, 300, 500];

export function ConviteCasas() {
  const [ocupado, setOcupado] = useState(false);
  const [conta, setConta] = useState<RespostaConta | null>(null);
  const [envio, setEnvio] = useState<RespostaEnvio | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [tamanho, setTamanho] = useState(10);

  const chamar = useCallback(async (corpo: Record<string, unknown>) => {
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
  }, []);

  const conferir = useCallback(async () => {
    const d = (await chamar({ acao: "conta" })) as RespostaConta | null;
    if (d) setConta(d);
  }, [chamar]);

  // A tela abre já sabendo o estado: se a rotina está ligada, quanto falta e
  // se ela se desligou sozinha por algum motivo.
  useEffect(() => {
    void conferir();
  }, [conferir]);

  async function enviarLote() {
    const d = (await chamar({ acao: "enviar", limite: tamanho })) as RespostaEnvio | null;
    if (d) {
      setEnvio(d);
      await conferir();
    }
  }

  async function alternarRotina() {
    const ligando = !conta?.config.automatico;
    await chamar({ acao: ligando ? "ligar" : "desligar", por_dia: tamanho });
    await conferir();
  }

  const cfg = conta?.config;
  const restam = envio?.restam ?? conta?.restantes;

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

      {/* Estado da rotina, sempre à vista. */}
      {cfg && (
        <div
          className={`rounded-2xl border p-4 flex items-start gap-3 ${
            cfg.automatico ? "border-emerald-200 bg-emerald-50/50" : "border-gray-200 bg-white"
          }`}
        >
          <CalendarClock
            size={16}
            className={`shrink-0 mt-0.5 ${cfg.automatico ? "text-emerald-600" : "text-gray-400"}`}
          />
          <div className="text-xs">
            <p className="font-semibold text-gray-800">
              {cfg.automatico
                ? `Rotina LIGADA — ${cfg.por_dia} convites por dia útil, às 9h`
                : "Rotina desligada — nada sai sozinho"}
            </p>
            {cfg.motivo && (
              <p className="text-gray-500 mt-1">
                Último motivo de parada: <strong>{cfg.motivo}</strong>
              </p>
            )}
            {restam != null && (
              <p className="text-gray-500 mt-1">
                Faltam <strong className="text-gray-700">{restam}</strong> convites na fila.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Passo 1 — o limite do provedor, antes de qualquer envio. */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Gauge size={14} className="text-gray-400" />
          <h3 className="text-xs uppercase font-bold tracking-widest text-gray-500">
            1. Conferir o provedor
          </h3>
        </div>
        <p className="text-xs text-gray-500">
          Não envia nada. Pergunta ao provedor qual é o plano e quanto crédito resta. A rotina faz
          essa mesma pergunta antes de cada lote e reduz o envio se o crédito não cobrir.
        </p>
        <button
          onClick={conferir}
          disabled={ocupado}
          className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-40"
        >
          {ocupado ? "Consultando…" : "Conferir agora"}
        </button>
        {conta && (
          <>
            <p className="text-xs text-gray-600">
              Crédito de envio identificado:{" "}
              <strong>
                {conta.credito_de_envio === null
                  ? "não informado pelo provedor"
                  : conta.credito_de_envio}
              </strong>
            </p>
            <pre className="text-[11px] bg-gray-50 border border-gray-150 rounded-xl p-3 overflow-x-auto text-gray-700">
              {JSON.stringify(conta.plano, null, 2)}
            </pre>
          </>
        )}
      </div>

      {/* Passo 2 — o lote de conferência, na mão. */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Send size={14} className="text-gray-400" />
          <h3 className="text-xs uppercase font-bold tracking-widest text-gray-500">
            2. Enviar um lote agora
          </h3>
        </div>
        <p className="text-xs text-gray-500">
          Comece por <strong>10</strong> e abra um deles na sua caixa de entrada antes de seguir.
          Cada rodada continua de onde a anterior parou.
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
            {envio.desligada && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                A rotina foi desligada automaticamente: {envio.desligada}
              </div>
            )}
            {envio.amostra_de_falhas.length > 0 && (
              <pre className="text-[11px] bg-red-50 border border-red-150 rounded-xl p-3 overflow-x-auto text-red-800">
                {JSON.stringify(envio.amostra_de_falhas, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>

      {/* Passo 3 — deixar a rotina seguir sozinha. */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <CalendarClock size={14} className="text-gray-400" />
          <h3 className="text-xs uppercase font-bold tracking-widest text-gray-500">
            3. Deixar a rotina seguir sozinha
          </h3>
        </div>
        <p className="text-xs text-gray-500">
          Ligada, ela envia <strong>{tamanho}</strong> convites por dia útil, às 9h, até a lista
          acabar. Você recebe um relatório por e-mail a cada lote. Ela se desliga sozinha se a lista
          terminar, se o crédito acabar ou se mais de 30% de um lote falhar — e avisa em qualquer um
          dos três casos.
        </p>
        <button
          onClick={alternarRotina}
          disabled={ocupado || !cfg}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-colors disabled:opacity-40 ${
            cfg?.automatico
              ? "border border-red-200 text-red-600 hover:bg-red-50"
              : "bg-emerald-600 text-white hover:bg-emerald-700"
          }`}
        >
          {cfg?.automatico ? <Pause size={13} /> : <Play size={13} />}
          {cfg?.automatico
            ? "Desligar a rotina automática"
            : `Ligar a rotina — ${tamanho} por dia útil`}
        </button>
      </div>
    </div>
  );
}
