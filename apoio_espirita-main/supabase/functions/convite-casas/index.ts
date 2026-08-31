/**
 * Convite às casas espíritas do diretório.
 *
 * São milhares de endereços institucionais, enviados em lotes ao longo de
 * dias. Quatro cuidados moldaram esta função:
 *
 *   1. **Quem pode disparar.** A função não aceita destinatário nem texto
 *      vindos de fora: ela só sabe enviar ESTE convite para quem está na fila.
 *      Ainda assim exige sessão do responsável pelo site OU o segredo do
 *      agendamento, porque um endereço capaz de mandar e-mail em nome do site
 *      para milhares de pessoas é um megafone que não pode ficar aberto.
 *      O segredo é gerado dentro do banco e nunca sai de lá — chave que
 *      precisa ser transportada é chave vazada mais cedo ou mais tarde.
 *   2. **O mesmo convite nunca sai duas vezes.** A fila tem chave única no
 *      endereço e cada envio marca a linha antes de seguir. Repetir a chamada
 *      continua de onde parou, não recomeça. Quem falhou tem direito a UMA
 *      segunda tentativa: falha de rede merece nova chance, endereço extinto
 *      falharia de novo.
 *   3. **Ritmo.** Disparar milhares de uma vez, de um domínio que hoje só manda
 *      e-mail transacional, é o comportamento que provedores tratam como spam —
 *      e é o mesmo domínio que entrega a recuperação de senha dos membros.
 *   4. **Saber parar.** Antes de cada lote a função pergunta ao provedor quanto
 *      crédito resta e reduz o lote se preciso, em vez de gerar centenas de
 *      falhas. Se um lote falhar acima do limite tolerado, ela se DESLIGA e
 *      avisa: rotina desatendida que insiste num domínio bloqueado queima a
 *      lista inteira, e só existe uma primeira impressão com cada casa.
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
/** Acima disto o lote é considerado um problema, e a rotina se desliga. */
const FALHA_TOLERADA = 0.3;
/** Abaixo disto a amostra é pequena demais para concluir qualquer coisa. */
const AMOSTRA_MINIMA = 5;

/**
 * Erros que são do PROVEDOR, e não do destinatário.
 *
 * 401 e 403 dizem que a conta de envio recusou a chamada — chave revogada,
 * restrição por IP, conta suspensa. 429 é excesso de chamadas. Nenhum deles
 * fala do endereço de quem ia receber, e por isso nenhum deles pode gastar uma
 * das duas tentativas daquela casa: seria puni-la por um problema nosso.
 *
 * Aconteceu de verdade em 31/08/2026: a conta do provedor estava com restrição
 * por IP ligada, e as dez primeiras casas foram marcadas como falha. Num lote
 * de 300, teriam sido 300.
 */
const ERRO_DO_PROVEDOR = /^(401|403|429)/;

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
  "Apresentações ao vivo: projete sem computador e a plateia acompanha pelo celular",
  "Biblioteca de orientações públicas da FEB, rádio espírita e artigos da comunidade",
  "O site instala no celular como aplicativo, sem passar por loja nenhuma",
];

function montarHtml(c: Convite): string {
  // A marcacao `?c=` e o que permite saber quantas casas de fato CHEGARAM ao
  // site — o unico numero do funil que nao depende do provedor de e-mail
  // relatar nada. Vai nos dois enderecos, inclusive no da saida do diretorio:
  // quem clica para sair tambem chegou, e esconder isso do numero seria
  // enganar a nos mesmos.
  const pagina = `${SITE}/casas/${c.uf.toLowerCase()}/${c.slug}`;
  const paginaMarcada = `${pagina}?c=${c.convite_id}`;
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
      <a href="${paginaMarcada}" style="display:inline-block;padding:12px 22px;border-radius:999px;border:1px solid #0e7490;color:#0e7490;text-decoration:none;font-size:13px;letter-spacing:.12em;text-transform:uppercase">Ver a página da minha cidade</a>
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
      <a href="${paginaMarcada}" style="color:#0e7490">página da sua cidade</a> &mdash; não é
      preciso conta nem justificativa.
    </p>
  </div>`;
}

/** Envia um convite e devolve o erro do provedor, ou nulo se deu certo. */
async function enviar(c: Convite): Promise<{ erro: string | null; provedorId: string | null }> {
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
    if (!res.ok) return { erro: `${res.status}: ${(await res.text()).slice(0, 300)}`, provedorId: null };

    // O identificador da mensagem é o que liga o evento que o provedor mandar
    // depois — entregue, aberto, clicado — de volta a ESTE convite. Sem ele o
    // webhook teria de adivinhar pelo endereço, e a mesma casa pode receber
    // mais de um convite ao longo do tempo.
    //
    // Não conseguir ler o identificador NÃO é falha de envio: o e-mail saiu.
    // Só significa que este convite ficará sem os números do provedor, e a
    // marcação no link continua respondendo se a casa chegou.
    const corpo = await res.json().catch(() => null);
    const id = corpo?.messageId ?? corpo?.messageIds?.[0] ?? null;
    return { erro: null, provedorId: typeof id === "string" ? id : null };
  } catch (e) {
    return { erro: String(e).slice(0, 300), provedorId: null };
  }
}

async function marcar(
  c: Convite,
  erro: string | null,
  tentativa: number,
  provedorId: string | null,
) {
  await admin
    .from("casas_convites")
    .update({
      status: erro ? "falhou" : "enviado",
      enviado_em: new Date().toISOString(),
      erro,
      tentativas: tentativa,
      provedor_id: provedorId,
    })
    .eq("id", c.convite_id);
}

/** Lê a conta no provedor. Devolve o objeto bruto e o crédito, quando dá para saber. */
async function contaDoProvedor(): Promise<{ bruto: unknown; credito: number | null }> {
  try {
    const res = await fetch("https://api.brevo.com/v3/account", {
      headers: { "api-key": BREVO_API_KEY, Accept: "application/json" },
    });
    const dados = await res.json();
    const planos: Array<Record<string, unknown>> = Array.isArray(dados?.plan) ? dados.plan : [];
    // O formato do plano varia conforme a assinatura. Só considero o número
    // quando ele é claramente um limite de envio; na dúvida, não travo nada —
    // um palpite errado aqui pararia a rotina sem motivo.
    const envio = planos.find(
      (p) =>
        String(p.type ?? "").toLowerCase().includes("send") ||
        String(p.creditsType ?? "").toLowerCase().includes("send"),
    );
    const bruto = envio?.credits;
    const credito = typeof bruto === "number" && Number.isFinite(bruto) ? bruto : null;
    return { bruto: dados?.plan ?? dados, credito };
  } catch {
    return { bruto: null, credito: null };
  }
}

/** Avisa o responsável. Nunca deixa uma falha de aviso derrubar o envio. */
async function avisar(assunto: string, linhas: string[]) {
  try {
    const corpo = linhas.map((l) => `<p style="margin:0 0 10px">${l}</p>`).join("");
    await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": BREVO_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: FROM,
        to: [{ email: RESPONSAVEL }],
        subject: assunto,
        htmlContent: `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;color:#1f2937;line-height:1.6">
          <p style="font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:#0e7490;margin:0 0 10px">Convite às casas</p>
          ${corpo}
          <p style="margin:18px 0 0"><a href="${SITE}/admin" style="color:#0e7490">Abrir o painel</a></p>
        </div>`,
      }),
    });
  } catch {
    /* o aviso é conveniência; a fila continua correta sem ele */
  }
}

async function desligar(motivo: string) {
  await admin
    .from("convite_config")
    .update({
      automatico: false,
      pausado_em: new Date().toISOString(),
      motivo,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", 1);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const responde = (corpo: unknown, status = 200) =>
    new Response(JSON.stringify(corpo), {
      status,
      headers: { ...cors, "Content-Type": "application/json" },
    });

  const { data: cfg } = await admin.from("convite_config").select("*").eq("id", 1).maybeSingle();
  const config = (cfg ?? {
    automatico: false,
    por_dia: 300,
    pausado_em: null,
    motivo: null,
    segredo: null,
    segredo_webhook: null,
  }) as {
    automatico: boolean;
    por_dia: number;
    pausado_em: string | null;
    motivo: string | null;
    segredo: string | null;
    segredo_webhook: string | null;
  };

  // Duas identidades aceitas: o responsável pelo site, com sessão, e o
  // agendamento do banco, que se apresenta com o segredo guardado na
  // configuração — gerado dentro do Postgres e que nunca sai de lá.
  //
  // A verificação de sessão do provedor está desligada nesta função
  // justamente porque o agendamento não tem sessão nenhuma. Quem controla o
  // acesso é o teste abaixo, e nada além dele.
  const segredo = req.headers.get("x-segredo")?.trim() ?? "";
  const ehAgendamento = segredo !== "" && config.segredo !== null && segredo === config.segredo;
  if (!ehAgendamento) {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "").trim() ?? "";
    const { data: quem } = await admin.auth.getUser(token);
    if (quem?.user?.email !== RESPONSAVEL) return responde({ erro: "Sem permissão." }, 401);
  }

  const corpo = await req.json().catch(() => ({}));
  const acao = corpo.acao ?? "conta";

  const restantes = async () => {
    const { data } = await admin.rpc("convites_restantes");
    return (data as number) ?? 0;
  };

  /* ── Consultar, sem enviar nada ─────────────────────────────────────── */
  if (acao === "conta") {
    const conta = await contaDoProvedor();
    const { data: funil } = await admin.rpc("convites_funil");
    return responde({
      plano: conta.bruto,
      credito_de_envio: conta.credito,
      restantes: await restantes(),
      funil: Array.isArray(funil) ? funil[0] : funil,
      // O endereço que precisa ser colado no painel do provedor de e-mail para
      // os eventos começarem a chegar. Vai só para o responsável, que já se
      // identificou acima — o segredo dentro dele é o que autoriza a escrita
      // no funil, e não pode circular.
      webhook: ehAgendamento ? null : `${SUPABASE_URL}/functions/v1/convite-eventos?s=${config.segredo_webhook ?? ""}`,
      // Sem o segredo: ele autoriza o disparo e não tem por que chegar ao
      // navegador, nem mesmo ao do responsável.
      config: {
        automatico: config.automatico,
        por_dia: config.por_dia,
        pausado_em: config.pausado_em,
        motivo: config.motivo,
      },
    });
  }

  /* ── Ligar e desligar a rotina automática ───────────────────────────── */
  if (acao === "ligar" || acao === "desligar") {
    if (ehAgendamento) return responde({ erro: "O agendamento não liga a si mesmo." }, 403);
    const porDia = Math.min(Math.max(Number(corpo.por_dia) || config.por_dia, 1), LOTE_MAXIMO);
    await admin
      .from("convite_config")
      .update({
        automatico: acao === "ligar",
        por_dia: porDia,
        pausado_em: acao === "ligar" ? null : new Date().toISOString(),
        motivo: acao === "ligar" ? null : "Desligado pelo responsável.",
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", 1);
    return responde({ ok: true, automatico: acao === "ligar", por_dia: porDia });
  }

  if (acao !== "enviar") return responde({ erro: "Ação desconhecida." }, 400);

  /* ── Enviar um lote ─────────────────────────────────────────────────── */

  // O agendamento só envia se a rotina estiver ligada. É isto que faz a
  // automação nascer desligada, esperando a conferência do primeiro lote.
  if (ehAgendamento && !config.automatico) {
    return responde({ ignorado: "Rotina automática desligada.", motivo: config.motivo });
  }

  const pedido = ehAgendamento ? config.por_dia : Number(corpo.limite) || 10;
  let limite = Math.min(Math.max(pedido, 1), LOTE_MAXIMO);

  // Pergunta ao provedor antes de tentar. Reduzir o lote é melhor do que
  // produzir um punhado de falhas por falta de crédito.
  const conta = await contaDoProvedor();
  if (conta.credito !== null && conta.credito < limite) {
    if (conta.credito <= 0) {
      if (ehAgendamento) {
        await desligar("O provedor de e-mail está sem crédito de envio.");
        await avisar("Convite às casas: rotina parada por falta de crédito", [
          "A rotina automática foi desligada porque o provedor de e-mail está sem crédito de envio.",
          `Ainda faltam <strong>${await restantes()}</strong> convites.`,
          "Reative no painel depois de renovar o crédito.",
        ]);
      }
      return responde({ enviados: 0, erro: "Sem crédito de envio no provedor." }, 200);
    }
    limite = conta.credito;
  }

  const { data: lote, error } = await admin.rpc("convites_pendentes", { p_limite: limite });
  if (error) return responde({ erro: error.message }, 500);

  const convites = (lote ?? []) as Convite[];
  if (convites.length === 0) {
    return responde({ enviados: 0, falharam: 0, restam: 0, concluido: true });
  }

  // Quantas vezes cada um destes já foi tentado, para a segunda tentativa ser
  // de fato a última.
  const { data: anteriores } = await admin
    .from("casas_convites")
    .select("id, tentativas")
    .in(
      "id",
      convites.map((c) => c.convite_id),
    );
  const jaTentado = new Map(
    ((anteriores ?? []) as Array<{ id: string; tentativas: number }>).map((r) => [
      r.id,
      r.tentativas ?? 0,
    ]),
  );

  let enviados = 0;
  const falhas: Array<{ email: string; erro: string }> = [];
  let problemaNoProvedor: string | null = null;

  for (let i = 0; i < convites.length; i += SIMULTANEOS) {
    // Provedor recusando a conta: parar imediatamente. Insistir só produziria
    // o mesmo erro centenas de vezes e faria a fila parecer cheia de endereços
    // ruins quando o problema é nosso.
    if (problemaNoProvedor) break;

    await Promise.all(
      convites.slice(i, i + SIMULTANEOS).map(async (c) => {
        const { erro, provedorId } = await enviar(c);
        if (erro && ERRO_DO_PROVEDOR.test(erro)) {
          problemaNoProvedor ??= erro;
          // Devolve à fila sem gastar tentativa: a casa não tem culpa.
          await admin
            .from("casas_convites")
            .update({ status: "pendente", erro })
            .eq("id", c.convite_id);
          return;
        }
        await marcar(c, erro, (jaTentado.get(c.convite_id) ?? 0) + 1, provedorId);
        if (erro) falhas.push({ email: c.email, erro });
        else enviados++;
      }),
    );
  }

  if (problemaNoProvedor) {
    if (config.automatico) {
      await desligar(`O provedor de e-mail recusou a conta: ${problemaNoProvedor.slice(0, 200)}`);
    }
    return responde({
      enviados,
      falharam: 0,
      restam: await restantes(),
      problema_no_provedor: problemaNoProvedor,
      recado:
        "O provedor recusou a conta, não os endereços. Nenhuma casa perdeu tentativa e a fila " +
        "continua intacta. Resolva no painel do provedor e mande o lote de novo.",
    });
  }

  const restam = await restantes();
  const proporcaoDeFalha = falhas.length / convites.length;

  /* ── Depois do lote: parar, avisar, ou seguir ───────────────────────── */

  let desligadaAgora: string | null = null;
  if (
    config.automatico &&
    convites.length >= AMOSTRA_MINIMA &&
    proporcaoDeFalha > FALHA_TOLERADA
  ) {
    desligadaAgora = `${falhas.length} de ${convites.length} falharam no lote de ${new Date().toISOString().slice(0, 10)}.`;
    await desligar(desligadaAgora);
    await avisar("Convite às casas: a rotina se desligou sozinha", [
      `<strong>${falhas.length} de ${convites.length}</strong> envios falharam neste lote — acima do limite tolerado.`,
      "A rotina foi desligada para não insistir num problema e queimar o restante da lista.",
      `Ainda faltam <strong>${restam}</strong> convites.`,
      falhas[0] ? `Primeiro erro: <code>${escapar(falhas[0].erro)}</code>` : "",
      "Confira o motivo e reative no painel quando estiver resolvido.",
    ]);
  } else if (ehAgendamento) {
    if (restam === 0) {
      await desligar("Lista concluída.");
      await avisar("Convite às casas: lista concluída", [
        "Todos os convites foram enviados. A rotina automática se desligou sozinha.",
        `Neste último lote saíram <strong>${enviados}</strong> convites.`,
      ]);
    } else {
      await avisar(`Convite às casas: ${enviados} enviados, faltam ${restam}`, [
        `Saíram <strong>${enviados}</strong> convites neste lote.`,
        falhas.length > 0 ? `<strong>${falhas.length}</strong> falharam e serão tentados mais uma vez.` : "Nenhuma falha.",
        `Ainda faltam <strong>${restam}</strong>.`,
      ]);
    }
  }

  return responde({
    enviados,
    falharam: falhas.length,
    restam,
    desligada: desligadaAgora,
    amostra_de_falhas: falhas.slice(0, 5),
  });
});
