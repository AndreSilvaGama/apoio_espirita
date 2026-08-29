import { supabase } from "@/integrations/supabase/client";

/**
 * Pede à função de borda que envie o aviso por e-mail daquele acontecimento.
 *
 * A tela manda só o TIPO e o IDENTIFICADOR do registro — nunca o destinatário
 * nem o texto. Quem descobre para quem enviar, e o que escrever, é o servidor;
 * do contrário, qualquer pessoa poderia disparar e-mail em nome do site.
 *
 * A falha é silenciosa de propósito: o aviso é um extra. Se o e-mail não sair,
 * o registro continua na tela, e travar o botão com um erro de e-mail faria a
 * pessoa achar que a reserva, o pedido ou a resposta não foram gravados — o
 * que seria mentira.
 */
export function avisar(tipo: string, id: string | null | undefined): void {
  if (!id) return;
  void supabase.functions.invoke("avisos", { body: { tipo, id } }).catch(() => {
    /* sem aviso, a vida do site continua */
  });
}
