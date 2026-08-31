/**
 * Eventos do provedor de e-mail sobre os convites às casas.
 *
 * O provedor avisa, por chamada HTTP, o que aconteceu com cada mensagem:
 * entregue, aberta, clicada, devolvida. É o que separa "ninguém abriu" de
 * "abriram e não se interessaram" — dois diagnósticos com correções opostas.
 *
 * Três cuidados moldaram esta função:
 *
 *   1. **Quem pode escrever aqui.** Um webhook não tem sessão: quem chega é um
 *      servidor de terceiro. A única credencial que ele consegue carregar é um
 *      segredo no endereço, e por isso este endereço usa um segredo PRÓPRIO,
 *      diferente do que autoriza o disparo de convites. O endereço fica
 *      gravado no painel de um terceiro; se vazar de lá, o estrago possível é
 *      escrever número errado no funil — nunca mandar e-mail em nome do site.
 *   2. **Nunca inventar.** Se o evento não casa com nenhum convite conhecido,
 *      a função responde 200 e não grava nada. Erro de medição é ruim; medição
 *      inventada é pior, porque parece um dado.
 *   3. **Responder 200 quase sempre.** Provedor que recebe erro repete o envio
 *      e, depois de insistir, desliga o webhook sozinho. Só a credencial errada
 *      merece recusa — essa precisa mesmo aparecer.
 *
 * A primeira data de cada tipo é a que fica: `coalesce` no que já existe. Uma
 * casa pode abrir o mesmo e-mail cinco vezes, e a quinta abertura não é notícia.
 */
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

/**
 * Nomes de evento do provedor → coluna do convite.
 *
 * Os nomes variam entre provedores e entre versões do mesmo provedor (com
 * hífen, com sublinhado, no plural). Em vez de exigir a grafia exata, cada
 * coluna declara os pedaços que reconhece — assim uma grafia diferente é
 * classificada, e não descartada em silêncio.
 */
const EVENTOS: Array<{ coluna: string; combina: (e: string) => boolean }> = [
  { coluna: "entregue_em", combina: (e) => e.includes("deliver") },
  { coluna: "aberto_em", combina: (e) => e.includes("open") },
  { coluna: "clicado_em", combina: (e) => e.includes("click") },
  {
    coluna: "devolvido_em",
    combina: (e) =>
      e.includes("bounce") || e.includes("blocked") || e.includes("spam") || e.includes("invalid"),
  },
];

interface Evento {
  event?: string;
  "message-id"?: string;
  messageId?: string;
  email?: string;
  reason?: string;
}

/** Aplica um evento a um convite. Devolve se encontrou a quem aplicar. */
async function aplicar(ev: Evento): Promise<boolean> {
  const nome = String(ev.event ?? "").toLowerCase();
  const alvo = EVENTOS.find((c) => c.combina(nome));
  if (!alvo) return false;

  const provedorId = ev["message-id"] ?? ev.messageId ?? null;
  const email = ev.email ?? null;

  // O identificador da mensagem é o caminho certo: aponta para UM convite.
  // O endereço é o caminho de reserva, para quando o provedor não devolveu
  // identificador no envio; nesse caso vale o convite mais recente daquele
  // endereço, que é o único que poderia ter gerado este evento.
  let consulta = admin.from("casas_convites").select("id, chegou_em").limit(1);
  consulta = provedorId
    ? consulta.eq("provedor_id", provedorId)
    : email
      ? consulta.eq("email", email).order("enviado_em", { ascending: false })
      : consulta.eq("id", "00000000-0000-0000-0000-000000000000");

  const { data } = await consulta.maybeSingle();
  if (!data) return false;

  // Só grava se a coluna ainda estiver vazia: fica a PRIMEIRA vez, e reenvio
  // do mesmo evento pelo provedor não reescreve nada.
  const campos: Record<string, string> = {};
  campos[alvo.coluna] = new Date().toISOString();
  if (alvo.coluna === "devolvido_em" && ev.reason) {
    campos.devolvido_motivo = String(ev.reason).slice(0, 300);
  }

  await admin
    .from("casas_convites")
    .update(campos)
    .eq("id", data.id)
    .is(alvo.coluna, null);

  return true;
}

Deno.serve(async (req) => {
  const responde = (corpo: unknown, status = 200) =>
    new Response(JSON.stringify(corpo), {
      status,
      headers: { "Content-Type": "application/json" },
    });

  const { data: cfg } = await admin
    .from("convite_config")
    .select("segredo_webhook")
    .eq("id", 1)
    .maybeSingle();

  const esperado = cfg?.segredo_webhook ?? null;
  const recebido = new URL(req.url).searchParams.get("s") ?? "";
  if (!esperado || recebido !== esperado) return responde({ erro: "Sem permissão." }, 401);

  const corpo = await req.json().catch(() => null);
  if (!corpo) return responde({ ignorado: "Corpo ilegível." });

  // Alguns provedores mandam um evento por chamada, outros mandam uma lista.
  const eventos: Evento[] = Array.isArray(corpo) ? corpo : [corpo];

  let aplicados = 0;
  for (const ev of eventos.slice(0, 200)) {
    if (await aplicar(ev)) aplicados++;
  }

  return responde({ recebidos: eventos.length, aplicados });
});
