/**
 * Validação de senha no cadastro e na redefinição.
 *
 * O bloqueio de senhas vazadas (base do HaveIBeenPwned) só existe no plano pago
 * do Supabase. Até lá, esta checagem barra o que aparece na esmagadora maioria
 * das invasões por tentativa: senhas óbvias, sequências e a senha ser o próprio
 * e-mail. Não substitui a base real de vazamentos — reduz o risco mais comum.
 */

/** Mínimo exigido no formulário. O Supabase aceita 6; aqui pedimos um pouco mais. */
export const TAMANHO_MINIMO_SENHA = 8;

/** Senhas que aparecem no topo de toda lista de vazamento. */
const SENHAS_OBVIAS = new Set([
  "12345678",
  "123456789",
  "1234567890",
  "123456",
  "1234567",
  "senha123",
  "senha1234",
  "password",
  "password1",
  "password123",
  "qwertyui",
  "qwerty123",
  "abcd1234",
  "a1b2c3d4",
  "11111111",
  "00000000",
  "12341234",
  "iloveyou",
  "admin123",
  "brasil123",
  "flamengo",
  "corinthians",
  "deusefiel",
  "deusnocomando",
  "jesuscristo",
  "espirita123",
  "kardec123",
  "mudar123",
  "trocar123",
]);

function ehSequencia(s: string) {
  if (s.length < 4) return false;
  let crescente = true;
  let decrescente = true;
  for (let i = 1; i < s.length; i++) {
    const d = s.charCodeAt(i) - s.charCodeAt(i - 1);
    if (d !== 1) crescente = false;
    if (d !== -1) decrescente = false;
  }
  return crescente || decrescente;
}

function ehRepeticao(s: string) {
  return s.length > 0 && new Set(s).size === 1;
}

/**
 * Devolve a mensagem do problema, ou `null` se a senha serve.
 * A mensagem é escrita para o usuário final: diz o que houve e o que fazer.
 */
export function validarSenha(senha: string, email?: string): string | null {
  if (senha.length < TAMANHO_MINIMO_SENHA)
    return `A senha precisa ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.`;

  const normal = senha.toLowerCase().trim();

  if (SENHAS_OBVIAS.has(normal))
    return "Esta senha é muito comum e está entre as primeiras que um invasor tenta. Escolha outra.";

  if (ehRepeticao(normal))
    return "A senha não pode ser o mesmo caractere repetido. Misture letras e números.";

  if (ehSequencia(normal))
    return "A senha não pode ser uma sequência como 12345678 ou abcdefgh. Escolha outra.";

  if (/^\d+$/.test(normal)) return "A senha não pode ser só números. Inclua pelo menos uma letra.";

  if (email) {
    const usuario = email.split("@")[0]?.toLowerCase().trim();
    if (usuario && usuario.length >= 3 && normal.includes(usuario))
      return "A senha não pode conter o seu e-mail. Escolha algo diferente.";
  }

  return null;
}
