import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY") ?? "";
const BREVO_URL = "https://api.brevo.com/v3/smtp/email";
const DEST_EMAIL = "gama.andre@gmail.com";
const FROM_EMAIL = "gama.andre@gmail.com";
const FROM_NAME = "Apoio Espírita";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, data } = await req.json();

    let subject = "";
    let htmlContent = "";

    if (type === "sugestao") {
      subject = `Nova sugestão — ${data.name}`;
      htmlContent = `
        <h2 style="color:#0e7490">Nova sugestão recebida</h2>
        <p><strong>Nome:</strong> ${data.name}</p>
        <p><strong>E-mail:</strong> ${data.email}</p>
        <p><strong>Sugestão:</strong></p>
        <p style="white-space:pre-wrap">${data.suggestion}</p>
      `;
    } else if (type === "solicitacao") {
      subject = `Nova solicitação de desenvolvimento — ${data.titulo}`;
      htmlContent = `
        <h2 style="color:#0e7490">Nova solicitação de desenvolvimento</h2>
        <p><strong>Título:</strong> ${data.titulo}</p>
        ${data.descricao ? `<p><strong>Descrição:</strong></p><p style="white-space:pre-wrap">${data.descricao}</p>` : ""}
        <p><strong>Usuário:</strong> ${data.user_email ?? "não informado"}</p>
      `;
    } else if (type === "problema") {
      subject = `Problema reportado no site — ${data.nome ?? "Anônimo"}`;
      htmlContent = `
        <h2 style="color:#dc2626">Problema reportado no site</h2>
        <p><strong>Nome:</strong> ${data.nome ?? "não informado"}</p>
        <p><strong>Casa:</strong> ${data.sigla_casa ?? "não informada"}</p>
        <p><strong>Descrição do problema:</strong></p>
        <p style="white-space:pre-wrap">${data.descricao}</p>
      `;
    } else {
      return new Response(JSON.stringify({ error: "Tipo inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch(BREVO_URL, {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: FROM_NAME, email: FROM_EMAIL },
        to: [{ email: DEST_EMAIL }],
        subject,
        htmlContent,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(err);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
