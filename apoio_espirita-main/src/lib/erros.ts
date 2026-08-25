/**
 * Tradução única das falhas que chegam ao usuário.
 *
 * Sem isto, uma queda de rede ou uma recusa do banco aparece na tela em inglês
 * e em linguagem técnica ("Failed to fetch", "violates row-level security"),
 * que não diz nada a quem está usando o site nem ajuda no suporte.
 */

/** Extrai o texto cru de qualquer coisa que tenha sido lançada. */
export function textoDoErro(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  if (e && typeof e === "object" && "message" in e)
    return String((e as { message: unknown }).message);
  return "";
}

/** Mensagem pronta para exibir ao usuário, em português e sem jargão. */
export function mensagemDeErro(
  e: unknown,
  padrao = "Não foi possível concluir a operação.",
): string {
  const msg = textoDoErro(e);
  if (!msg) return padrao;

  // Rede: o navegador devolve estes textos em inglês.
  if (
    msg.includes("Failed to fetch") ||
    msg.includes("NetworkError") ||
    msg.includes("fetch failed") ||
    msg.includes("Load failed")
  )
    return "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente em alguns instantes.";

  // Autenticação
  if (msg.includes("Invalid login credentials")) return "E-mail ou senha incorretos.";
  if (msg.includes("Email not confirmed")) return "Confirme seu e-mail antes de entrar.";
  if (msg.includes("User already registered")) return "Este e-mail já está cadastrado.";
  if (msg.includes("Password should be")) return "A senha deve ter pelo menos 6 caracteres.";
  if (msg.includes("Email rate limit exceeded") || msg.includes("For security purposes"))
    return "Muitas tentativas seguidas. Aguarde alguns instantes e tente de novo.";

  // Banco de dados
  if (msg.includes("row-level security") || msg.includes("violates row-level"))
    return "Você não tem permissão para esta ação. Fale com o responsável da sua casa ou com o suporte pelo menu Ajuda.";
  if (msg.includes("duplicate key"))
    return "Esses dados já constam no sistema. Recarregue a página e tente novamente.";
  if (msg.includes("violates foreign key"))
    return "Este registro depende de outro que não foi encontrado. Recarregue a página e tente novamente.";
  if (msg.includes("violates not-null"))
    return "Faltou preencher um campo obrigatório. Revise o formulário e tente novamente.";

  return msg;
}
