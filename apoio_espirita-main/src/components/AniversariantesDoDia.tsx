/**
 * Faixa dos aniversariantes do dia, exibida no painel da casa.
 *
 * O cartão de funcionalidade promete que quem faz aniversário hoje aparece na
 * página da casa — é esta faixa que cumpre a promessa. Ela some sozinha nos dias
 * em que não há aniversariante: um bloco vazio ocupando espaço todo dia acaba
 * ensinando a pessoa a ignorar aquele canto da tela.
 */
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Cake } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function AniversariantesDoDia({ sigla }: { sigla: string }) {
  const [nomes, setNomes] = useState<string[]>([]);

  useEffect(() => {
    if (!sigla) return;
    const hoje = new Date();
    let ativo = true;
    void supabase
      .from("profiles")
      .select("nome")
      .eq("sigla_casa", sigla)
      .eq("aniversario_dia", hoje.getDate())
      .eq("aniversario_mes", hoje.getMonth() + 1)
      .then(({ data }) => {
        if (ativo) setNomes((data ?? []).map((p) => p.nome ?? "Membro"));
      });
    return () => {
      ativo = false;
    };
  }, [sigla]);

  if (nomes.length === 0) return null;

  const lista =
    nomes.length === 1 ? nomes[0] : `${nomes.slice(0, -1).join(", ")} e ${nomes[nomes.length - 1]}`;

  return (
    <Link
      to="/aniversariantes"
      className="flex items-center gap-3.5 rounded-2xl border border-amber-200/60 bg-amber-50/70 px-5 py-3.5 hover:border-amber-300 transition-colors"
    >
      <div className="shrink-0 w-9 h-9 rounded-xl bg-amber-100 border border-amber-200/50 flex items-center justify-center">
        <Cake size={16} strokeWidth={1.5} className="text-amber-600" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.3em] text-amber-700 font-semibold">
          {nomes.length === 1 ? "Aniversariante de hoje" : "Aniversariantes de hoje"}
        </p>
        <p className="text-sm text-foreground mt-0.5 truncate">{lista}</p>
      </div>
    </Link>
  );
}
