/**
 * Avisos por e-mail dos recursos de comunidade.
 *
 * A tela NUNCA diz para quem enviar nem o que escrever: manda apenas o tipo do
 * aviso e o identificador do registro. Quem descobre o destinatário, monta o
 * texto e envia é esta função, com a chave de serviço. Se fosse o contrário,
 * qualquer pessoa com o endereço da função poderia disparar e-mail em nome do
 * site para quem quisesse, com o texto que quisesse.
 *
 * Três travas, nesta ordem:
 *   1. Quem chamou precisa estar logado e ser a pessoa legítima daquele ato —
 *      só quem reservou avisa o dono do item, só o motorista avisa o passageiro.
 *   2. O destinatário precisa ter pedido para receber aquele tipo de aviso, e
 *      ter e-mail confirmado.
 *   3. O mesmo aviso não sai duas vezes: `avisos_enviados` tem chave única em
 *      (tipo, referência, destinatário), então repetir a chamada não repete o
 *      e-mail.
 */
import { createClient } from "jsr:@supabase/supabase-js@2";

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SITE = "https://apoioespirita.com.br";
const FROM = { name: "Apoio Espírita", email: "contato@apoioespirita.com.br" };

/** Quantas pessoas um aviso de casa pode alcançar de uma vez. */
const LIMITE_DE_ALCANCE = 200;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Chave = "meus_avisos" | "acolhimento" | "voluntariado";

interface Destinatario {
  id: string;
  nome: string;
}

interface Aviso {
  destinatarios: Destinatario[];
  preferencia: Chave;
  assunto: string;
  titulo: string;
  linhas: string[];
  botao: { texto: string; href: string };
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

function escapar(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function montarHtml(aviso: Aviso, nome: string): string {
  const corpo = aviso.linhas.map((l) => `<p style="margin:0 0 12px">${escapar(l)}</p>`).join("");
  return `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1f2937">
    <p style="font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:#0e7490;margin:0 0 6px">Apoio Espírita</p>
    <h1 style="font-size:20px;font-weight:500;margin:0 0 16px;color:#111827">${escapar(aviso.titulo)}</h1>
    <p style="margin:0 0 12px">Olá, ${escapar(nome)}.</p>
    ${corpo}
    <p style="margin:24px 0">
      <a href="${aviso.botao.href}" style="display:inline-block;padding:12px 22px;border-radius:999px;border:1px solid #0e7490;color:#0e7490;text-decoration:none;font-size:13px;letter-spacing:.12em;text-transform:uppercase">${escapar(aviso.botao.texto)}</a>
    </p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
    <p style="font-size:12px;color:#6b7280;margin:0">
      Você recebeu este aviso porque ele está ligado no seu perfil.
      Para deixar de receber, acesse <a href="${SITE}/avisos" style="color:#0e7490">${SITE}/avisos</a>.
    </p>
  </div>`;
}

async function enviar(email: string, assunto: string, html: string): Promise<boolean> {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": BREVO_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ sender: FROM, to: [{ email }], subject: assunto, htmlContent: html }),
  });
  return res.ok;
}

/** E-mail confirmado do destinatário, ou nulo se ele não puder receber. */
async function emailConfirmado(userId: string): Promise<string | null> {
  const { data } = await admin.auth.admin.getUserById(userId);
  const u = data?.user;
  if (!u?.email || !u.email_confirmed_at) return null;
  return u.email;
}

async function querReceber(userId: string, chave: Chave): Promise<boolean> {
  const { data } = await admin
    .from("avisos_preferencias")
    .select("meus_avisos, acolhimento, voluntariado")
    .eq("user_id", userId)
    .maybeSingle();
  // Sem linha de preferência valem os padrões: o que é meu, sim; o que é da
  // casa, não.
  if (!data) return chave === "meus_avisos";
  return data[chave] === true;
}

async function nomeDe(userId: string): Promise<string> {
  const { data } = await admin.from("profiles").select("nome").eq("id", userId).maybeSingle();
  return data?.nome?.trim() || "irmão";
}

/** Monta o aviso conforme o tipo, conferindo se quem chamou tem esse direito. */
async function montar(tipo: string, id: string, autorId: string): Promise<Aviso | null> {
  if (tipo === "bazar_reserva") {
    const { data: r } = await admin
      .from("bazar_reservas")
      .select("id, item_id, criado_por, autor_nome")
      .eq("id", id)
      .maybeSingle();
    if (!r || r.criado_por !== autorId) return null;
    const { data: item } = await admin
      .from("bazar_itens")
      .select("titulo, criado_por")
      .eq("id", r.item_id)
      .maybeSingle();
    if (!item) return null;
    return {
      destinatarios: [{ id: item.criado_por, nome: await nomeDe(item.criado_por) }],
      preferencia: "meus_avisos",
      assunto: `Alguém se interessou por "${item.titulo}"`,
      titulo: "Seu item do bazar recebeu um interessado",
      linhas: [
        `${r.autor_nome} demonstrou interesse em "${item.titulo}".`,
        "Abra o bazar para aceitar ou recusar. Ao aceitar, vocês dois passam a ver o contato um do outro.",
      ],
      botao: { texto: "Ver no bazar", href: `${SITE}/bazar` },
    };
  }

  if (tipo === "bazar_resposta") {
    const { data: r } = await admin
      .from("bazar_reservas")
      .select("id, item_id, criado_por, status")
      .eq("id", id)
      .maybeSingle();
    if (!r) return null;
    const { data: item } = await admin
      .from("bazar_itens")
      .select("titulo, criado_por, autor_nome")
      .eq("id", r.item_id)
      .maybeSingle();
    if (!item || item.criado_por !== autorId) return null;
    const aceita = r.status === "aceita" || r.status === "concluida";
    return {
      destinatarios: [{ id: r.criado_por, nome: await nomeDe(r.criado_por) }],
      preferencia: "meus_avisos",
      assunto: aceita
        ? `Sua reserva de "${item.titulo}" foi aceita`
        : `Resposta sobre "${item.titulo}"`,
      titulo: aceita ? "Reserva aceita" : "Resposta à sua reserva",
      linhas: aceita
        ? [
            `${item.autor_nome} aceitou a sua reserva de "${item.titulo}".`,
            "O contato de quem anunciou já aparece para você na tela do bazar, junto do código PIX para o pagamento.",
          ]
        : [
            `${item.autor_nome} respondeu à sua reserva de "${item.titulo}", e desta vez não foi possível atendê-la.`,
            "Outros itens continuam disponíveis no bazar da sua casa.",
          ],
      botao: { texto: "Abrir o bazar", href: `${SITE}/bazar` },
    };
  }

  if (tipo === "carona_pedido") {
    const { data: p } = await admin
      .from("carona_pedidos")
      .select("id, carona_id, criado_por, autor_nome")
      .eq("id", id)
      .maybeSingle();
    if (!p || p.criado_por !== autorId) return null;
    const { data: c } = await admin
      .from("caronas")
      .select("origem, destino, data, criado_por")
      .eq("id", p.carona_id)
      .maybeSingle();
    if (!c) return null;
    return {
      destinatarios: [{ id: c.criado_por, nome: await nomeDe(c.criado_por) }],
      preferencia: "meus_avisos",
      assunto: "Alguém pediu uma vaga na sua carona",
      titulo: "Pedido de vaga na sua carona",
      linhas: [
        `${p.autor_nome} pediu uma vaga na carona de ${c.origem} para ${c.destino}, no dia ${c.data}.`,
        "Ao aceitar, vocês dois passam a ver o contato um do outro para combinar o encontro.",
      ],
      botao: { texto: "Ver o pedido", href: `${SITE}/caronas` },
    };
  }

  if (tipo === "carona_resposta") {
    const { data: p } = await admin
      .from("carona_pedidos")
      .select("id, carona_id, criado_por, status")
      .eq("id", id)
      .maybeSingle();
    if (!p) return null;
    const { data: c } = await admin
      .from("caronas")
      .select("origem, destino, data, hora, criado_por, autor_nome")
      .eq("id", p.carona_id)
      .maybeSingle();
    if (!c || c.criado_por !== autorId) return null;
    const aceito = p.status === "aceito";
    return {
      destinatarios: [{ id: p.criado_por, nome: await nomeDe(p.criado_por) }],
      preferencia: "meus_avisos",
      assunto: aceito ? "Sua vaga na carona foi confirmada" : "Resposta sobre a carona",
      titulo: aceito ? "Vaga confirmada" : "Resposta ao seu pedido de carona",
      linhas: aceito
        ? [
            `${c.autor_nome} confirmou a sua vaga na carona de ${c.origem} para ${c.destino}, no dia ${c.data} às ${String(c.hora).slice(0, 5)}.`,
            "O contato do motorista já aparece para você na tela de caronas.",
          ]
        : [
            `${c.autor_nome} respondeu ao seu pedido de carona e desta vez não foi possível atendê-lo.`,
            "Outras caronas continuam abertas na tela de caronas.",
          ],
      botao: { texto: "Abrir caronas", href: `${SITE}/caronas` },
    };
  }

  if (tipo === "entrega_assumida") {
    const { data: e } = await admin
      .from("entregas")
      .select("id, descricao, criado_por, voluntario, voluntario_nome")
      .eq("id", id)
      .maybeSingle();
    if (!e || e.voluntario !== autorId) return null;
    return {
      destinatarios: [{ id: e.criado_por, nome: await nomeDe(e.criado_por) }],
      preferencia: "meus_avisos",
      assunto: "Um voluntário assumiu a sua entrega",
      titulo: "Sua entrega tem voluntário",
      linhas: [
        `${e.voluntario_nome ?? "Um voluntário"} assumiu a entrega: ${e.descricao}`,
        "O contato de vocês dois já está liberado na tela de entregas, para combinarem o endereço e o horário.",
      ],
      botao: { texto: "Ver a entrega", href: `${SITE}/entregas` },
    };
  }

  if (tipo === "voluntariado_candidatura") {
    const { data: cand } = await admin
      .from("voluntariado_candidaturas")
      .select("id, necessidade_id, criado_por, autor_nome")
      .eq("id", id)
      .maybeSingle();
    if (!cand || cand.criado_por !== autorId) return null;
    const { data: n } = await admin
      .from("voluntariado_necessidades")
      .select("titulo, criado_por")
      .eq("id", cand.necessidade_id)
      .maybeSingle();
    if (!n) return null;
    return {
      destinatarios: [{ id: n.criado_por, nome: await nomeDe(n.criado_por) }],
      preferencia: "meus_avisos",
      assunto: `Alguém se ofereceu: ${n.titulo}`,
      titulo: "Um voluntário se ofereceu",
      linhas: [
        `${cand.autor_nome} se ofereceu para ajudar em "${n.titulo}".`,
        "Abra o voluntariado para aceitar ou recusar.",
      ],
      botao: { texto: "Ver quem se ofereceu", href: `${SITE}/voluntariado` },
    };
  }

  if (tipo === "forum_acolhimento") {
    const { data: t } = await admin
      .from("forum_topicos")
      .select("id, titulo, categoria, sigla_casa, criado_por, autor_nome")
      .eq("id", id)
      .maybeSingle();
    if (!t || t.criado_por !== autorId || t.categoria !== "acolhimento") return null;

    const { data: membros } = await admin
      .from("profiles")
      .select("id, nome")
      .eq("sigla_casa", t.sigla_casa)
      .limit(LIMITE_DE_ALCANCE);

    return {
      destinatarios: (membros ?? [])
        .filter((m) => m.id !== t.criado_por)
        .map((m) => ({ id: m.id, nome: m.nome ?? "irmão" })),
      preferencia: "acolhimento",
      assunto: "Alguém da sua casa pediu acolhimento",
      titulo: "Um irmão pediu acolhimento",
      linhas: [
        `${t.autor_nome} abriu no fórum da casa um pedido de acolhimento: "${t.titulo}".`,
        "Se puder oferecer uma palavra fraterna, o fórum está aberto. Uma resposta serena costuma valer mais do que uma resposta rápida.",
      ],
      botao: { texto: "Ler e responder", href: `${SITE}/forum?topico=${t.id}` },
    };
  }

  if (tipo === "voluntariado_necessidade") {
    const { data: n } = await admin
      .from("voluntariado_necessidades")
      .select("id, titulo, habilidades, sigla_casa, criado_por, autor_nome, aberto")
      .eq("id", id)
      .maybeSingle();
    if (!n || n.criado_por !== autorId) return null;

    // Só quem cadastrou habilidade em comum é avisado — é o que diferencia
    // este aviso de um recado para a casa inteira.
    const consulta = admin
      .from("voluntariado_ofertas")
      .select("criado_por, autor_nome, habilidades, sigla_casa")
      .eq("ativa", true)
      .limit(LIMITE_DE_ALCANCE);
    const { data: ofertas } = n.aberto
      ? await consulta
      : await consulta.eq("sigla_casa", n.sigla_casa);

    const necessarias = new Set(n.habilidades ?? []);
    const combinam = (ofertas ?? []).filter(
      (o) =>
        o.criado_por !== n.criado_por &&
        (o.habilidades ?? []).some((h: string) => necessarias.has(h)),
    );

    return {
      destinatarios: combinam.map((o) => ({ id: o.criado_por, nome: o.autor_nome ?? "irmão" })),
      preferencia: "voluntariado",
      assunto: `A casa precisa de ajuda: ${n.titulo}`,
      titulo: "Um pedido combina com o que você sabe fazer",
      linhas: [
        `${n.autor_nome} publicou o pedido "${n.titulo}", e ele pede habilidades que você cadastrou.`,
        "Se puder ajudar, o pedido está aberto na tela de voluntariado.",
      ],
      botao: { texto: "Ver o pedido", href: `${SITE}/voluntariado` },
    };
  }

  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const jwt = req.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
    const { data: autenticado } = await admin.auth.getUser(jwt);
    const autor = autenticado?.user;
    if (!autor) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const { tipo, id } = await req.json();
    if (typeof tipo !== "string" || typeof id !== "string") {
      return new Response(JSON.stringify({ error: "Pedido inválido" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const aviso = await montar(tipo, id, autor.id);
    if (!aviso) {
      // Ou o tipo não existe, ou quem chamou não é a pessoa daquele ato.
      return new Response(JSON.stringify({ error: "Aviso não permitido" }), {
        status: 403,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    let enviados = 0;
    for (const destinatario of aviso.destinatarios) {
      if (destinatario.id === autor.id) continue;
      if (!(await querReceber(destinatario.id, aviso.preferencia))) continue;
      const email = await emailConfirmado(destinatario.id);
      if (!email) continue;

      // A chave única impede o mesmo aviso de sair duas vezes. Gravar ANTES de
      // enviar: se o envio falhar, é melhor um aviso perdido do que a mesma
      // mensagem repetida na caixa de entrada de quem já a recebeu.
      const { error: jaEnviado } = await admin
        .from("avisos_enviados")
        .insert({ tipo, referencia: id, destinatario: destinatario.id });
      if (jaEnviado) continue;

      if (await enviar(email, aviso.assunto, montarHtml(aviso, destinatario.nome))) enviados++;
    }

    return new Response(JSON.stringify({ ok: true, enviados }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
