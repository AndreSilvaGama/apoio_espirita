/**
 * Apoio ao diretório público de casas espíritas (`/casas`).
 *
 * O cadastro tem 3.734 casas gravadas em caixa alta e com o estado em sigla —
 * "ABRIGO TEREZA DE JESUS", "RJ". Isso serve ao banco, não a quem lê. Aqui
 * ficam a apresentação desses dados e o endereço de cada página, sempre com a
 * mesma normalização usada pela função `diretorio_slug` do banco: quem clica no
 * link precisa cair exatamente na consulta que o banco sabe responder.
 */

export const ESTADOS: Record<string, string> = {
  AC: "Acre",
  AL: "Alagoas",
  AP: "Amapá",
  AM: "Amazonas",
  BA: "Bahia",
  CE: "Ceará",
  DF: "Distrito Federal",
  ES: "Espírito Santo",
  GO: "Goiás",
  MA: "Maranhão",
  MT: "Mato Grosso",
  MS: "Mato Grosso do Sul",
  MG: "Minas Gerais",
  PA: "Pará",
  PB: "Paraíba",
  PR: "Paraná",
  PE: "Pernambuco",
  PI: "Piauí",
  RJ: "Rio de Janeiro",
  RN: "Rio Grande do Norte",
  RS: "Rio Grande do Sul",
  RO: "Rondônia",
  RR: "Roraima",
  SC: "Santa Catarina",
  SP: "São Paulo",
  SE: "Sergipe",
  TO: "Tocantins",
};

export function nomeDoEstado(uf: string | null | undefined): string {
  if (!uf) return "";
  return ESTADOS[uf.toUpperCase()] ?? uf.toUpperCase();
}

/** Palavras que ficam em minúscula no meio de um nome próprio. */
const MINUSCULAS = new Set([
  "a",
  "as",
  "à",
  "às",
  "da",
  "das",
  "de",
  "do",
  "dos",
  "e",
  "em",
  "na",
  "nas",
  "no",
  "nos",
  "o",
  "os",
  "para",
  "por",
  "sob",
  "sobre",
]);

/** Siglas que perdem o sentido se virarem palavra comum. */
const SIGLAS = new Set(["CEI", "CE", "GE", "SEI", "UEM", "FEB", "AME", "USE", "CEU"]);

/**
 * "CENTRO ESPIRITA CASA DO CAMINHO" → "Centro Espírita Casa do Caminho".
 *
 * Só muda a exibição; o dado gravado continua exatamente como veio do cadastro.
 * Texto que já venha com letras minúsculas é devolvido intacto — sinal de que
 * alguém o escreveu com cuidado e não cabe a nós reescrever.
 */
export function nomeProprio(texto: string | null | undefined): string {
  if (!texto) return "";
  const limpo = texto.trim().replace(/\s+/g, " ");
  if (limpo !== limpo.toUpperCase()) return limpo;

  return limpo
    .toLowerCase()
    .split(" ")
    .map((palavra, indice) => {
      const semPontuacao = palavra.replace(/[^a-zà-ÿ]/gi, "");
      if (SIGLAS.has(semPontuacao.toUpperCase())) return palavra.toUpperCase();
      if (indice > 0 && MINUSCULAS.has(semPontuacao)) return palavra;
      return palavra.charAt(0).toUpperCase() + palavra.slice(1);
    })
    .join(" ");
}

/**
 * Mesma normalização da função `diretorio_slug` do banco: sem acento, em
 * minúsculas, com hífen no lugar de qualquer outro caractere.
 */
export function slugDeCidade(cidade: string): string {
  return cidade
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Endereço da página de um estado no diretório. */
export function caminhoDoEstado(uf: string): string {
  return `/casas/${uf.toLowerCase()}`;
}

/** Endereço da página de uma cidade no diretório. */
export function caminhoDaCidade(uf: string, cidadeOuSlug: string): string {
  const slug = cidadeOuSlug.includes(" ") ? slugDeCidade(cidadeOuSlug) : cidadeOuSlug.toLowerCase();
  return `/casas/${uf.toLowerCase()}/${slug}`;
}

/** "20271021" → "20271-021". CEP fora do padrão é devolvido como veio. */
export function cepFormatado(cep: string | null | undefined): string {
  if (!cep) return "";
  const digitos = cep.replace(/\D/g, "");
  return digitos.length === 8 ? `${digitos.slice(0, 5)}-${digitos.slice(5)}` : cep.trim();
}

/** Endereço completo para a busca de rota no mapa. */
export function enderecoParaMapa(casa: {
  nome: string;
  endereco: string | null;
  cidade: string;
  estado: string;
}): string {
  return [casa.endereco, casa.cidade, casa.estado].filter(Boolean).join(", ");
}
