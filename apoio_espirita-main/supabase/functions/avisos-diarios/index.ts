/**
 * Aviso diário dos aniversariantes, para a direção de cada casa.
 *
 * Roda uma vez por dia, chamado pelo mesmo agendador que já envia o resumo do
 * desenvolvedor (`.github/workflows/vigia-diario.yml`, 8h de Brasília). Não é
 * chamado por tela nenhuma: exige o segredo do agendador no cabeçalho.
 *
 * Quem recebe: quem ligou o aviso no perfil e, para quem ainda não decidiu, a
 * direção da casa — que era exatamente o que o roadmap prometia ("o coordenador
 * recebe um aviso automático para organizar uma homenagem"). Qualquer um desliga
 * em /avisos.
 */
import { createClient } from "jsr:@supabase/supabase-js@2";

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const CRON_SECRET = Deno.env.get("DIGEST_CRON_SECRET") ?? "";
const SITE = "https://apoioespirita.com.br";
const FROM = { name: "Apoio Espírita", email: "contato@apoioespirita.com.br" };

/** Cargos que recebem o aviso enquanto a pessoa não escolher nada. */
const DIRECAO = [
  "Presidente",
  "Vice-presidente",
  "Coordenador",
  "Diretoria",
  "Dirigente",
  "Dirigente de reunião mediúnica",
];

const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

/**
 * Identificador estável do aviso do dia, para a trava de duplicidade.
 * Rodar o agendador duas vezes no mesmo dia não manda o e-mail duas vezes.
 */
async function chaveDoDia(sigla: string, dia: string): Promise<string> {
  const bytes = new TextEncoder().encode(`aniversariantes:${sigla}:${dia}`);
  const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  const hex = Array.from(hash.slice(0, 16))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

function escapar(texto: string): string {
  return texto.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function enviar(email: string, assunto: string, html: string): Promise<boolean> {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": BREVO_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ sender: FROM, to: [{ email }], subject: assunto, htmlContent: html }),
  });
  return res.ok;
}

Deno.serve(async (req) => {
  if (!CRON_SECRET || req.headers.get("x-cron-secret") !== CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  // O dia é o de Brasília: um aniversário não pode aparecer com um dia de
  // atraso porque o servidor conta em UTC.
  const agora = new Date(Date.now() - 3 * 60 * 60 * 1000);
  const dia = agora.getUTCDate();
  const mes = agora.getUTCMonth() + 1;
  const dataISO = agora.toISOString().slice(0, 10);

  const { data: aniversariantes } = await admin
    .from("profiles")
    .select("id, nome, sigla_casa")
    .eq("aniversario_dia", dia)
    .eq("aniversario_mes", mes)
    .not("sigla_casa", "is", null);

  if (!aniversariantes || aniversariantes.length === 0) {
    return new Response(JSON.stringify({ ok: true, casas: 0, enviados: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const porCasa = new Map<string, string[]>();
  for (const p of aniversariantes) {
    const lista = porCasa.get(p.sigla_casa!) ?? [];
    lista.push(p.nome ?? "Um membro");
    porCasa.set(p.sigla_casa!, lista);
  }

  let enviados = 0;

  for (const [sigla, nomes] of porCasa) {
    const { data: membros } = await admin
      .from("profiles")
      .select("id, nome, cargo_principal")
      .eq("sigla_casa", sigla);

    const referencia = await chaveDoDia(sigla, dataISO);
    const lista =
      nomes.length === 1 ? nomes[0] : `${nomes.slice(0, -1).join(", ")} e ${nomes[nomes.length - 1]}`;

    for (const membro of membros ?? []) {
      const { data: pref } = await admin
        .from("avisos_preferencias")
        .select("aniversariantes")
        .eq("user_id", membro.id)
        .maybeSingle();

      const quer =
        pref?.aniversariantes === true ||
        ((pref == null || pref.aniversariantes == null) &&
          DIRECAO.includes(membro.cargo_principal ?? ""));
      if (!quer) continue;

      const { data: conta } = await admin.auth.admin.getUserById(membro.id);
      const email = conta?.user?.email;
      if (!email || !conta?.user?.email_confirmed_at) continue;

      const { error: jaEnviado } = await admin
        .from("avisos_enviados")
        .insert({ tipo: "aniversariantes", referencia, destinatario: membro.id });
      if (jaEnviado) continue;

      const html = `
      <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1f2937">
        <p style="font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:#0e7490;margin:0 0 6px">Apoio Espírita</p>
        <h1 style="font-size:20px;font-weight:500;margin:0 0 16px;color:#111827">Aniversariantes de hoje na ${escapar(sigla)}</h1>
        <p style="margin:0 0 12px">Olá, ${escapar(membro.nome?.trim() || "irmão")}.</p>
        <p style="margin:0 0 12px">Hoje é o aniversário de <strong>${escapar(lista)}</strong>.</p>
        <p style="margin:0 0 12px">Uma lembrança da casa costuma valer mais do que se imagina para quem a recebe.</p>
        <p style="margin:24px 0">
          <a href="${SITE}/aniversariantes" style="display:inline-block;padding:12px 22px;border-radius:999px;border:1px solid #0e7490;color:#0e7490;text-decoration:none;font-size:13px;letter-spacing:.12em;text-transform:uppercase">Ver o calendário</a>
        </p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
        <p style="font-size:12px;color:#6b7280;margin:0">
          Você recebe este aviso por fazer parte da direção da casa ou por tê-lo ligado no perfil.
          Para deixar de receber, acesse <a href="${SITE}/avisos" style="color:#0e7490">${SITE}/avisos</a>.
        </p>
      </div>`;

      if (await enviar(email, `Aniversariantes de hoje na ${sigla}`, html)) enviados++;
    }
  }

  return new Response(JSON.stringify({ ok: true, casas: porCasa.size, enviados }), {
    headers: { "Content-Type": "application/json" },
  });
});
