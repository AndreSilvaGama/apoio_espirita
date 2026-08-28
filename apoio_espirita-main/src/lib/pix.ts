/**
 * Gera o código PIX "copia e cola" (BR Code) usado no Bazar On-line.
 *
 * O padrão é o EMV® QRCPS-MPM adotado pelo Banco Central: uma sequência de
 * campos no formato ID + tamanho (2 dígitos) + valor, fechada por um CRC-16.
 * A plataforma não processa pagamento nenhum — apenas monta o texto que o
 * aplicativo do banco entende, e o dinheiro vai direto de quem paga para a
 * chave de quem recebe.
 *
 * Os limites (25 caracteres para o nome, 15 para a cidade) são do padrão, não
 * nossos: passar disso gera um código que o banco recusa na hora de pagar. Por
 * isso o banco de dados também os impõe, em `bazar_itens`.
 */

/** Campo no formato do padrão: identificador, tamanho com dois dígitos, valor. */
function campo(id: string, valor: string): string {
  return id + String(valor.length).padStart(2, "0") + valor;
}

/**
 * Deixa o texto no formato aceito pelo BR Code: sem acento, em maiúsculas e sem
 * pontuação. Bancos recusam ou exibem lixo quando recebem acentuação.
 */
export function normalizarTextoPix(texto: string, tamanho: number): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase()
    .slice(0, tamanho);
}

/** CRC-16/CCITT-FALSE, exigido pelo padrão no campo 63. */
export function crc16(dados: string): string {
  let crc = 0xffff;
  for (let i = 0; i < dados.length; i++) {
    crc ^= dados.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export interface DadosPix {
  chave: string;
  nome: string;
  cidade: string;
  /** Em reais. Ausente ou zero gera código de valor livre, que o pagador digita. */
  valor?: number | null;
  /** Identificador da transação. O padrão aceita "***" quando não há um. */
  identificador?: string;
}

/**
 * Monta o código copia e cola. Devolve `null` quando falta chave, nome ou
 * cidade — melhor não exibir código nenhum do que exibir um que não funciona.
 */
export function gerarCodigoPix({
  chave,
  nome,
  cidade,
  valor,
  identificador = "***",
}: DadosPix): string | null {
  const chaveLimpa = chave.trim();
  const nomeLimpo = normalizarTextoPix(nome, 25);
  const cidadeLimpa = normalizarTextoPix(cidade, 15);

  if (!chaveLimpa || !nomeLimpo || !cidadeLimpa) return null;

  const conta = campo("00", "BR.GOV.BCB.PIX") + campo("01", chaveLimpa);

  let payload =
    campo("00", "01") +
    campo("26", conta) +
    campo("52", "0000") +
    campo("53", "986") +
    (valor && valor > 0 ? campo("54", valor.toFixed(2)) : "") +
    campo("58", "BR") +
    campo("59", nomeLimpo) +
    campo("60", cidadeLimpa) +
    campo("62", campo("05", normalizarTextoPix(identificador, 25) || "***"));

  payload += "6304";
  return payload + crc16(payload);
}
