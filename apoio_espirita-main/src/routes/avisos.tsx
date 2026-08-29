import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { BellRing, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CARGOS_DECISAO } from "@/contexts/AuthContext";
import { mensagemDeErro } from "@/lib/erros";
import { Aviso, BotaoPrimario, Cartao, PaginaComunidade } from "@/components/Comunidade";

export const Route = createFileRoute("/avisos")({
  component: Avisos,
});

interface Preferencias {
  meus_avisos: boolean;
  acolhimento: boolean;
  voluntariado: boolean;
  aniversariantes: boolean | null;
}

const PADRAO: Preferencias = {
  meus_avisos: true,
  acolhimento: false,
  voluntariado: false,
  aniversariantes: null,
};

function Interruptor({
  ligado,
  aoMudar,
  titulo,
  explicacao,
  nota,
}: {
  ligado: boolean;
  aoMudar: (v: boolean) => void;
  titulo: string;
  explicacao: string;
  nota?: string;
}) {
  return (
    <label className="flex items-start gap-3 py-4 cursor-pointer">
      <input
        type="checkbox"
        checked={ligado}
        onChange={(e) => aoMudar(e.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 accent-cyan-600"
      />
      <span className="min-w-0">
        <span className="block text-sm text-foreground">{titulo}</span>
        <span className="block text-xs text-muted-foreground font-light mt-0.5">{explicacao}</span>
        {nota && <span className="block text-xs text-cyan-700 font-light mt-1">{nota}</span>}
      </span>
    </label>
  );
}

function Avisos() {
  const { user, profile } = useAuth();
  const [pref, setPref] = useState<Preferencias>(PADRAO);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const ehDirecao = (CARGOS_DECISAO as readonly string[]).includes(profile?.cargo_principal ?? "");

  const carregar = useCallback(async () => {
    if (!user) return;
    setCarregando(true);
    const { data } = await supabase
      .from("avisos_preferencias")
      .select("meus_avisos, acolhimento, voluntariado, aniversariantes")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data) setPref(data as Preferencias);
    setCarregando(false);
  }, [user]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function salvar() {
    if (!user) return;
    setSalvando(true);
    setErro(null);
    const { error } = await supabase
      .from("avisos_preferencias")
      .upsert({ user_id: user.id, ...pref }, { onConflict: "user_id" });
    setSalvando(false);
    if (error) {
      setErro(mensagemDeErro(error));
      return;
    }
    setSalvo(true);
    window.setTimeout(() => setSalvo(false), 3000);
  }

  // Enquanto a pessoa não decide, quem é da direção recebe o aviso de
  // aniversários. A tela mostra isso como já ligado, para não mentir sobre o
  // que vai chegar na caixa de entrada.
  const aniversariantesLigado = pref.aniversariantes ?? ehDirecao;

  return (
    <PaginaComunidade
      secao="Nossa comunidade"
      titulo="Avisos por"
      destaque="e-mail"
      descricao="Você escolhe o que chega no seu e-mail. O que é sobre você vem ligado; o que é sobre a casa toda, não — assim ninguém recebe mensagem que não pediu."
      dispensaCasa
    >
      <div className="space-y-6">
        {erro && <Aviso tipo="erro">{erro}</Aviso>}
        {salvo && (
          <Aviso tipo="ok">
            <span className="inline-flex items-center gap-2">
              <Check size={14} strokeWidth={2} /> Preferências salvas.
            </span>
          </Aviso>
        )}

        {carregando ? (
          <p className="text-center text-muted-foreground/50 py-12 font-light">Carregando…</p>
        ) : (
          <>
            <Cartao>
              <div className="flex items-start gap-3 pb-4 mb-2 border-b border-border/40">
                <BellRing size={20} strokeWidth={1.5} className="text-cyan-glow mt-0.5" />
                <div>
                  <h2 className="text-lg font-medium text-foreground">O que quero receber</h2>
                  <p className="text-xs text-muted-foreground font-light mt-0.5">
                    Avisos importantes de conta e de segurança continuam chegando, independentemente
                    do que estiver marcado aqui.
                  </p>
                </div>
              </div>

              <div className="divide-y divide-border/40">
                <Interruptor
                  ligado={pref.meus_avisos}
                  aoMudar={(v) => setPref({ ...pref, meus_avisos: v })}
                  titulo="Quando alguém responde algo meu"
                  explicacao="Alguém se interessou por um item que anunciei no bazar, pediu vaga na minha carona, se ofereceu para um pedido meu, assumiu a minha entrega — ou respondeu ao que eu pedi."
                />
                <Interruptor
                  ligado={pref.acolhimento}
                  aoMudar={(v) => setPref({ ...pref, acolhimento: v })}
                  titulo="Pedidos de acolhimento no fórum"
                  explicacao="Quando alguém da sua casa abre um tópico pedindo acolhimento. Marque se você se dispõe a oferecer uma palavra fraterna nesses momentos."
                />
                <Interruptor
                  ligado={pref.voluntariado}
                  aoMudar={(v) => setPref({ ...pref, voluntariado: v })}
                  titulo="Pedidos de ajuda que combinam comigo"
                  explicacao="Quando a casa publica uma necessidade que pede alguma das habilidades que você cadastrou no voluntariado. Sem habilidades cadastradas, nada é enviado."
                />
                <Interruptor
                  ligado={aniversariantesLigado}
                  aoMudar={(v) => setPref({ ...pref, aniversariantes: v })}
                  titulo="Aniversariantes do dia"
                  explicacao="Uma mensagem pela manhã, apenas nos dias em que alguém da casa faz aniversário."
                  nota={
                    pref.aniversariantes == null && ehDirecao
                      ? "Ligado porque você é da direção da casa. Desmarque se preferir não receber."
                      : undefined
                  }
                />
              </div>
            </Cartao>

            <div className="flex justify-end">
              <BotaoPrimario onClick={salvar} disabled={salvando}>
                {salvando ? "Salvando…" : "Salvar preferências"}
              </BotaoPrimario>
            </div>

            <p className="text-center text-xs text-muted-foreground/50 font-light">
              A plataforma não envia propaganda e não passa o seu endereço para ninguém.
            </p>
          </>
        )}
      </div>
    </PaginaComunidade>
  );
}
