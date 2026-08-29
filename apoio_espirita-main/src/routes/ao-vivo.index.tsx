/**
 * Entrada da plateia: o campo do código de seis letras.
 *
 * Sem login, de propósito. Quem chega visitando uma casa espírita pela
 * primeira vez não tem conta — e é justamente quem mais precisa acompanhar a
 * palestra. Exigir cadastro aqui seria fechar a porta na cara de quem entrou.
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Radio, ArrowRight } from "lucide-react";
import { normalizarCodigo, codigoEstaCompleto, TAMANHO_DO_CODIGO } from "@/lib/apresentacoes";

export const Route = createFileRoute("/ao-vivo/")({
  component: EntrarAoVivo,
});

function EntrarAoVivo() {
  const navigate = useNavigate();
  const [codigo, setCodigo] = useState("");

  const pronto = codigoEstaCompleto(codigo);

  return (
    <main className="page-light min-h-screen px-4 pt-20 pb-20 flex items-start justify-center">
      <div className="w-full max-w-sm space-y-6 mt-10">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-100 text-cyan-700 flex items-center justify-center mx-auto">
            <Radio size={22} strokeWidth={1.8} />
          </div>
          <h1 className="text-xl font-bold text-gray-800 mt-3">Acompanhar a apresentação</h1>
          <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
            Digite o código que está na tela do salão. Não é preciso ter conta.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (pronto)
              navigate({ to: "/ao-vivo/$codigo", params: { codigo: normalizarCodigo(codigo) } });
          }}
          className="space-y-3"
        >
          <input
            value={codigo}
            onChange={(e) => setCodigo(normalizarCodigo(e.target.value))}
            autoFocus
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            inputMode="text"
            maxLength={TAMANHO_DO_CODIGO}
            placeholder="ABC234"
            aria-label="Código da apresentação"
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-5 text-center text-3xl font-bold tracking-[0.3em] text-gray-800 placeholder-gray-300 focus:outline-none focus:border-cyan-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!pronto}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#004a8c] text-white text-xs font-semibold uppercase tracking-widest hover:bg-[#00386b] transition-colors disabled:opacity-30"
          >
            Entrar
            <ArrowRight size={14} />
          </button>
        </form>

        <p className="text-[11px] text-gray-400 text-center leading-relaxed">
          O código tem seis letras e números. Ele não usa as letras I e O nem os algarismos 0 e 1,
          para não haver confusão de leitura.
        </p>
      </div>
    </main>
  );
}
