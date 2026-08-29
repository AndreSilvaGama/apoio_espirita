/**
 * Suspender, reativar e excluir contas.
 *
 * Excluir uma pessoa não é uma operação inocente neste banco. Quatro tabelas
 * apagam EM CASCATA junto com o perfil — entre elas `agenda_eventos`, pela
 * coluna `criador_id`. Excluir um Presidente apaga, sem avisar, todos os
 * eventos que ele criou na agenda da casa. Outras vinte e cinco tabelas
 * guardam o identificador da pessoa SEM chave estrangeira: o conteúdo dela
 * (ficha de atendimento, lançamento de tesouraria, tópico do fórum) permanece,
 * apenas deixa de ter dono.
 *
 * Por isso são três ações e não uma:
 *
 *   · `prever`    — conta exatamente o que será destruído e o que ficará sem
 *                   dono. Não altera nada. Existe para que ninguém descubra o
 *                   estrago depois de causá-lo.
 *   · `suspender` — a pessoa deixa de entrar, e nada é apagado. Reversível.
 *                   É a resposta certa para conta inativa ou abandonada.
 *   · `excluir`   — remove o perfil (com as cascatas) e a conta. Definitivo.
 *
 * Quem pode: o responsável pelo site, sobre qualquer conta menos a própria; e
 * qualquer pessoa sobre a PRÓPRIA conta — o site promete essa saída na tela de
 * ajuda, e promessa que não se cumpre é defeito.
 */
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const RESPONSAVEL = "gama.andre@gmail.com";

/** Cem anos. O Supabase não tem banimento perpétuo; isto é o equivalente. */
const SUSPENSAO = "876000h";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

/** Tabelas que somem junto com o perfil, por cascata declarada no banco. */
const EM_CASCATA: Array<[string, string]> = [
  ["agenda_eventos", "criador_id"],
  ["agenda_participantes", "user_id"],
  ["programacao_participantes", "user_id"],
  ["administradores_pagina", "user_id"],
];

/** Tabelas que guardam a pessoa sem chave estrangeira: ficam sem dono. */
const SEM_DONO: Array<[string, string]> = [
  ["atendimento_fichas", "criado_por"],
  ["tesouraria_autorizacoes", "autorizado_por"],
  ["forum_topicos", "criado_por"],
  ["forum_respostas", "criado_por"],
  ["grupo_mensagens", "criado_por"],
  ["grupos", "criado_por"],
  ["bazar_itens", "criado_por"],
  ["bazar_reservas", "criado_por"],
  ["caronas", "criado_por"],
  ["carona_pedidos", "criado_por"],
  ["entregas", "criado_por"],
  ["voluntariado_ofertas", "criado_por"],
  ["voluntariado_candidaturas", "criado_por"],
  ["oracao_inscricoes", "criado_por"],
  ["jovens_publicacoes", "criado_por"],
];

async function contar(tabelas: Array<[string, string]>, alvo: string) {
  const linhas: Array<{ tabela: string; registros: number }> = [];
  for (const [tabela, coluna] of tabelas) {
    const { count, error } = await admin
      .from(tabela)
      .select("*", { count: "exact", head: true })
      .eq(coluna, alvo);
    if (!error && (count ?? 0) > 0) linhas.push({ tabela, registros: count ?? 0 });
  }
  return linhas;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const responde = (corpo: unknown, status = 200) =>
    new Response(JSON.stringify(corpo), {
      status,
      headers: { ...cors, "Content-Type": "application/json" },
    });

  const token = req.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
  const { data: sessao } = await admin.auth.getUser(token);
  const quem = sessao?.user;
  if (!quem) return responde({ erro: "Entre na sua conta para continuar." }, 401);

  const corpo = await req.json().catch(() => ({}));
  const alvo = String(corpo.alvo ?? "");
  const acao = String(corpo.acao ?? "prever");
  if (!alvo) return responde({ erro: "Diga qual conta." }, 400);

  const ehResponsavel = quem.email === RESPONSAVEL;
  const ehEleMesmo = quem.id === alvo;

  // O responsável não pode excluir a própria conta: perderia o acesso ao
  // painel e não haveria quem o devolvesse.
  if (ehResponsavel && ehEleMesmo) {
    return responde({ erro: "A conta responsável pelo site não pode excluir a si mesma." }, 400);
  }
  if (!ehResponsavel && !ehEleMesmo) {
    return responde({ erro: "Sem permissão para mexer nesta conta." }, 403);
  }
  // Quem age sobre si mesmo só pode sair; suspender a si próprio não faz sentido.
  if (ehEleMesmo && acao !== "excluir" && acao !== "prever") {
    return responde({ erro: "Sobre a própria conta, só é possível excluir." }, 400);
  }

  const { data: perfil } = await admin
    .from("profiles")
    .select("nome, sigla_casa, cargo_principal")
    .eq("id", alvo)
    .maybeSingle();

  if (acao === "prever") {
    // O estado de suspensão não vive em `profiles`: quem sabe se a pessoa
    // está impedida de entrar é a própria conta.
    const { data: conta } = await admin.auth.admin.getUserById(alvo);
    const ate = conta?.user?.banned_until ?? null;
    return responde({
      perfil,
      suspensa: ate != null && new Date(ate) > new Date(),
      sera_apagado: await contar(EM_CASCATA, alvo),
      ficara_sem_dono: await contar(SEM_DONO, alvo),
    });
  }

  if (acao === "suspender" || acao === "reativar") {
    const { error } = await admin.auth.admin.updateUserById(alvo, {
      ban_duration: acao === "suspender" ? SUSPENSAO : "none",
    });
    if (error) return responde({ erro: error.message }, 500);
    return responde({ ok: true, acao, nome: perfil?.nome ?? null });
  }

  if (acao === "excluir") {
    // A ordem importa: `profiles` aponta para a conta com NO ACTION, então
    // apagar a conta primeiro falharia por violação de chave. O perfil sai
    // antes, levando as cascatas consigo; a conta sai depois.
    const apagado = await contar(EM_CASCATA, alvo);
    const { error: erroPerfil } = await admin.from("profiles").delete().eq("id", alvo);
    if (erroPerfil) return responde({ erro: erroPerfil.message }, 500);

    const { error: erroConta } = await admin.auth.admin.deleteUser(alvo);
    if (erroConta) return responde({ erro: erroConta.message }, 500);

    return responde({ ok: true, acao: "excluir", nome: perfil?.nome ?? null, apagado });
  }

  return responde({ erro: "Ação desconhecida." }, 400);
});
