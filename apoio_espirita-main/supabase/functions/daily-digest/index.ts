import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const DIGEST_CRON_SECRET = Deno.env.get("DIGEST_CRON_SECRET") ?? "";
const DEST_EMAIL = "gama.andre@gmail.com";

Deno.serve(async (req) => {
  // Autenticação via header secreto
  const secret = req.headers.get("x-cron-secret");
  if (!DIGEST_CRON_SECRET || secret !== DIGEST_CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [usersRes, solicitacoesRes, problemsRes, votesRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("nome, sigla_casa, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false }),
    supabase
      .from("solicitacoes_dev")
      .select("titulo, descricao, created_at, profiles!user_id(nome, sigla_casa)")
      .gte("created_at", since)
      .order("created_at", { ascending: false }),
    supabase
      .from("problem_reports")
      .select("nome, sigla_casa, descricao, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false }),
    supabase
      .from("painel_votes")
      .select("item_key, created_at")
      .gte("created_at", since)
      .order("item_key", { ascending: true }),
  ]);

  const users = usersRes.data ?? [];
  const solicitacoes = solicitacoesRes.data ?? [];
  const problems = problemsRes.data ?? [];
  const votes = votesRes.data ?? [];

  if (!users.length && !solicitacoes.length && !problems.length && !votes.length) {
    return new Response(JSON.stringify({ ok: true, skipped: "sem atividade" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Agrupa votos por item_key
  const voteMap: Record<string, number> = {};
  for (const v of votes) {
    voteMap[v.item_key] = (voteMap[v.item_key] ?? 0) + 1;
  }
  const voteEntries = Object.entries(voteMap).sort((a, b) => b[1] - a[1]);

  const today = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });

  const block = (color: string, content: string) =>
    `<div style="padding:10px 14px;background:#f8fafc;border-left:4px solid ${color};margin:6px 0;border-radius:4px">${content}</div>`;

  const section = (title: string, color: string, inner: string) =>
    inner
      ? `<h2 style="color:${color};border-bottom:2px solid ${color};padding-bottom:6px;margin-top:32px;font-size:16px">${title}</h2>${inner}`
      : "";

  const usersHtml = users
    .map((u: any) =>
      block(
        "#0e7490",
        `<strong>${u.nome}</strong> · <span style="color:#64748b">${u.sigla_casa ?? "sem sigla"}</span>`,
      ),
    )
    .join("");

  const solHtml = solicitacoes
    .map((s: any) => {
      const p = s.profiles as { nome?: string; sigla_casa?: string } | null;
      return block(
        "#7c3aed",
        `<strong>${s.titulo}</strong><br>
        ${s.descricao ? `<span style="color:#64748b;font-size:13px">${s.descricao}</span><br>` : ""}
        <span style="color:#94a3b8;font-size:12px">${p?.nome ?? "Membro"} · ${p?.sigla_casa ?? ""}</span>`,
      );
    })
    .join("");

  const problemsHtml = problems
    .map((p: any) =>
      block(
        "#ea580c",
        `<strong>${p.nome ?? "Usuário"}</strong> · <span style="color:#64748b">${p.sigla_casa ?? ""}</span><br>
        <span style="color:#64748b;font-size:13px;white-space:pre-wrap">${p.descricao}</span>`,
      ),
    )
    .join("");

  const votesHtml = voteEntries
    .map(
      ([key, count]) =>
        `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 14px;background:#f0fdf4;border-left:4px solid #16a34a;margin:6px 0;border-radius:4px">
        <span style="color:#374151;font-size:13px">${key.replace(/-+/g, " ")}</span>
        <strong style="color:#16a34a;white-space:nowrap">+${count} voto${count > 1 ? "s" : ""}</strong>
      </div>`,
    )
    .join("");

  const summary = [
    users.length ? `${users.length} novo${users.length > 1 ? "s usuários" : " usuário"}` : "",
    solicitacoes.length
      ? `${solicitacoes.length} solicitaç${solicitacoes.length > 1 ? "ões" : "ão"}`
      : "",
    problems.length ? `${problems.length} problema${problems.length > 1 ? "s" : ""}` : "",
    votes.length ? `${votes.length} voto${votes.length > 1 ? "s" : ""}` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  const htmlContent = `
    <div style="font-family:sans-serif;max-width:620px;margin:0 auto;color:#1e293b">
      <div style="background:linear-gradient(135deg,#0e7490,#7c3aed);padding:28px 32px;border-radius:12px;margin-bottom:8px">
        <h1 style="color:white;margin:0;font-size:22px;font-weight:300">Resumo diário</h1>
        <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px">Apoio Espírita · ${today}</p>
        <p style="color:rgba(255,255,255,0.6);margin:4px 0 0;font-size:13px">${summary}</p>
      </div>
      ${section("Novos usuários", "#0e7490", usersHtml)}
      ${section("Solicitações de desenvolvimento", "#7c3aed", solHtml)}
      ${section("Problemas reportados", "#ea580c", problemsHtml)}
      ${section("Votos nas pendências", "#16a34a", votesHtml)}
      <p style="margin-top:40px;color:#94a3b8;font-size:11px;text-align:center;border-top:1px solid #e2e8f0;padding-top:16px">
        Apoio Espírita · apoioespirita.com.br · e-mail automático — não responda
      </p>
    </div>
  `;

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": BREVO_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      sender: { name: "Apoio Espírita", email: DEST_EMAIL },
      to: [{ email: DEST_EMAIL }],
      subject: `Resumo diário — ${summary}`,
      htmlContent,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return new Response(JSON.stringify({ error: err }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true, summary }), {
    headers: { "Content-Type": "application/json" },
  });
});
