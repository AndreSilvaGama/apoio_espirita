/**
 * Convite às casas espíritas do diretório.
 *
 * São milhares de endereços institucionais, enviados em lotes ao longo de
 * dias. Três cuidados moldaram esta função:
 *
 *   1. **Ninguém dispara isto além do responsável pelo site.** A função não
 *      aceita destinatário nem texto vindos de fora: ela só sabe enviar ESTE
 *      convite para quem está na fila. Ainda assim exige sessão válida do
 *      responsável, porque um endereço de função capaz de mandar e-mail em
 *      nome do site para milhares de pessoas é um megafone que não pode ficar
 *      aberto.
 *   2. **O mesmo convite nunca sai duas vezes.** A fila tem chave única no
 *      endereço e cada envio marca a linha antes de seguir. Repetir a chamada
 *      continua de onde parou, não recomeça.
 *   3. **Ritmo.** Disparar milhares de uma vez, de um domínio que hoje só manda
 *      e-mail transacional, é o comportamento que provedores tratam como spam —
 *      e é o mesmo domínio que entrega a recuperação de senha dos membros. Por
 *      isso o lote é limitado e os envios saem em pequenos grupos.
 *
 * Duas ações: `conta` apenas consulta o limite do provedor e não envia nada;
 * `enviar` processa um lote.
 */
import { createClient } from "jsr:@supabase/supabase-js@2";

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SITE = "https://apoioespirita.com.br";
const FROM = { name: "Apoio Espírita", email: "contato@apoioespirita.com.br" };
const RESPONSAVEL = "gama.andre@gmail.com";

/** Teto por chamada. Lote grande demais estoura o tempo da função. */
const LOTE_MAXIMO = 500;
/** Quantos e-mails viajam ao mesmo tempo. Fila única seria lenta demais. */
const SIMULTANEOS = 5;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

function escapar(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

interface Convite {
  convite_id: string;
  email: string;
  casa_nome: string;
  cidade: string;
  uf: string;
  slug: string;
}

const RECURSOS = [
  "Agenda de eventos e reuniões, com caderno de presença digital",
  "Tesouraria, com receitas, despesas, saldo do mês, exportação e impressão",
  "Mural de avisos e grupos de comunicação entre os trabalhadores",
  "Bazar on-line com pagamento por PIX e entrega solidária",
  "Kanban de projetos e voluntariado, cruzando as habilidades dos membros com as necessidades da casa",
  "Evangelização infantil, com planos de aula e jogos para as crianças",
  "Atendimento fraterno, com ficha confidencial",
  "Biblioteca de orientações públicas da FEB, rádio espírita e artigos da comunidade",
  "O site instala no celular como aplicativo, sem passar por loja nenhuma",
];

function montarHtml(c: Convite): string {
  const pagina = `${SITE}/casas/${c.uf.toLowerCase()}/${c.slug}`;
  const itens = RECURSOS.map((r) => `<li style="margin:0 0 7px">${escapar(r)}</li>`).join("");
  return `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1f2937;line-height:1.6">
    <p style="font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:#0e7490;margin:0 0 6px">Apoio Espírita</p>
    <h1 style="font-size:22px;font-weight:500;margin:0 0 6px;color:#111827">A sua casa já tem um lugar aqui</h1>
    <p style="font-size:13px;color:#6b7280;margin:0 0 20px">${escapar(c.casa_nome)} &middot; ${escapar(c.cidade)}, ${escapar(c.uf)}</p>

    <p style="margin:0 0 12px">Paz e bem.</p>
    <p style="margin:0 0 12px">Escrevemos para contar algo simples: a sua casa já está no Apoio Espírita, e não há nada a pagar &mdash; nem hoje, nem nunca.</p>
    <p style="margin:0 0 12px">O Apoio Espírita nasceu como serviço fraterno ao movimento espírita. Não vendemos nada, não temos anúncios, mensalidade, plano nem taxa. É trabalho voluntário, oferecido de graça às casas espíritas do Brasil, e é assim que vai permanecer. Um presente, sem contrapartida.</p>
    <p style="margin:0 0 12px">Reunimos um diretório aberto com <strong>3.734 casas espíritas de 961 cidades</strong>, nos 27 estados. Quem procura um centro espírita na sua cidade encontra a sua casa &mdash; com endereço, CEP e caminho no mapa &mdash; sem precisar criar conta nenhuma.</p>

    <p style="margin:24px 0">
      <a href="${pagina}" style="display:inline-block;padding:12px 22px;border-radius:999px;border:1px solid #0e7490;color:#0e7490;text-decoration:none;font-size:13px;letter-spacing:.12em;text-transform:uppercase">Ver a página da minha cidade</a>
    </p>

    <p style="margin:0 0 12px">Se alguém da direção quiser, pode <strong>assumir a página da casa</strong>: basta criar uma conta gratuita, confirmar o e-mail e reivindicá-la. A página nasce privada, e a casa publica quando achar que está pronta.</p>
    <p style="margin:0 0 8px">A partir daí, tudo o que segue fica disponível, sem custo:</p>
    <ul style="margin:0 0 16px;padding-left:20px">${itens}</ul>

    <p style="margin:0 0 12px">E a casa não fica presa a nada. <strong>Se preferir não aparecer no diretório, é um clique na própria página: sai na hora, sem justificar e sem falar com ninguém.</strong></p>
    <p style="margin:0 0 12px">Que a sua casa siga amparando quem chega à porta. Se pudermos ajudar em alguma coisa, basta responder a este e-mail.</p>

    <p style="margin:0 0 4px">Com fraternidade,</p>
    <p style="margin:0 0 24px"><strong>Apoio Espírita</strong> &mdash; <a href="${SITE}" style="color:#0e7490">apoioespirita.com.br</a></p>

    <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 16px">
    <p style="font-size:12px;color:#6b7280;margin:0">
      Você recebeu esta mensagem porque a sua casa consta em cadastro público de casas
      espíritas e está listada no diretório do Apoio Espírita. Para sair do diretório,
      use o botão &ldquo;Sair do diretório&rdquo; na
      <a href="${pagina}" style="color:#0e7490">página da sua cidade</a> &mdash; não é
      preciso conta nem justificativa.
    </p>
  </div>`;
}

/** Envia um convite e devolve o erro do provedor, ou nulo se deu certo. */
async function enviar(c: Convite): Promise<string | null> {
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": BREVO_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: FROM,
        to: [{ email: c.email }],
        subject: "A sua casa já tem um lugar no Apoio Espírita",
        htmlContent: montarHtml(c),
      }),
    });
    if (res.ok) return null;
    return `${res.status}: ${(await res.text()).slice(0, 300)}`;
  } catch (e) {
    return String(e).slice(0, 300);
  }
}

async function marcar(c: Convite, erro: string | null) {
  await admin
    .from("casas_convites")
    .update({
      status: erro ? "falhou" : "enviado",
      enviado_em: new Date().toISOString(),
      erro,
    })
    .eq("id", c.convite_id);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const responde = (corpo: unknown, status = 200) =>
    new Response(JSON.stringify(corpo), {
      status,
      headers: { ...cors, "Content-Type": "application/json" },
    });

  // Só o responsável pelo site dispara isto.
  const token = req.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
  const { data: quem } = await admin.auth.getUser(token);
  if (quem?.user?.email !== RESPONSAVEL) {
    return responde({ erro: "Sem permissão." }, 401);
  }

  const corpo = await req.json().catch(() => ({}));
  const acao = corpo.acao ?? "conta";

  // Consulta o limite do provedor. Não envia nada.
  if (acao === "conta") {
    const res = await fetch("https://api.brevo.com/v3/account", {
      headers: { "api-key": BREVO_API_KEY, Accept: "application/json" },
    });
    const conta = await res.json().catch(() => ({}));
    const { count } = await admin
      .from("casas_convites")
      .select("id", { count: "exact", head: true })
      .eq("status", "pendente");
    return responde({ ok: res.ok, plano: conta.plan ?? conta, pendentes: count ?? 0 });
  }

  if (acao !== "enviar") return responde({ erro: "Ação desconhecida." }, 400);

  const limite = Math.min(Number(corpo.limite) || 100, LOTE_MAXIMO);
  const { data: lote, error } = await admin.rpc("convites_pendentes", { p_limite: limite });
  if (error) return responde({ erro: error.message }, 500);

  const convites = (lote ?? []) as Convite[];
  let enviados = 0;
  const falhas: Array<{ email: string; erro: string }> = [];

  for (let i = 0; i < convites.length; i += SIMULTANEOS) {
    await Promise.all(
      convites.slice(i, i + SIMULTANEOS).map(async (c) => {
        const erro = await enviar(c);
        await marcar(c, erro);
        if (erro) falhas.push({ email: c.email, erro });
        else enviados++;
      }),
    );
  }

  const { count: restam } = await admin
    .from("casas_convites")
    .select("id", { count: "exact", head: true })
    .eq("status", "pendente");

  return responde({
    enviados,
    falharam: falhas.length,
    restam: restam ?? 0,
    amostra_de_falhas: falhas.slice(0, 5),
  });
});
