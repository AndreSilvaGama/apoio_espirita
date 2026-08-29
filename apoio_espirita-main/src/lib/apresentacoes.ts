/**
 * Apoio às apresentações ao vivo (`/apresentacoes`).
 *
 * Aqui fica só o que não depende de tela nem de rede: validação do arquivo,
 * feitio dos caminhos no depósito e a leitura do código de sessão. O que
 * envolve navegador — desenhar o documento e transformar cada página em
 * imagem — vive na própria tela, porque depende de `canvas`.
 */

/** Teto do arquivo enviado. Acima disto o envio trava a máquina de quem sobe. */
export const TAMANHO_MAXIMO = 40 * 1024 * 1024;

/** Teto de slides. Palestra maior que isto não é palestra, é livro. */
export const SLIDES_MAXIMO = 150;

/**
 * Largura de cada slide gerado.
 *
 * 1600 pontos cobrem com folga um projetor comum e ainda deixam a figura leve
 * o bastante para abrir depressa num celular em rede fraca — que é a condição
 * real de uma casa espírita cheia.
 */
export const LARGURA_DO_SLIDE = 1600;

/** Sem I, O, 0 e 1: o código é lido em voz alta e digitado por quem não vê bem. */
const ALFABETO_DO_CODIGO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const TAMANHO_DO_CODIGO = 6;

/**
 * Confere o arquivo escolhido antes de qualquer trabalho pesado.
 *
 * Devolve o motivo da recusa, em português, ou `null` se estiver bom. Recusar
 * cedo poupa a pessoa de esperar uma conversão que ia falhar no fim.
 */
export function recusaDoArquivo(arquivo: {
  name: string;
  size: number;
  type: string;
}): string | null {
  const ehPdf = arquivo.type === "application/pdf" || arquivo.name.toLowerCase().endsWith(".pdf");

  if (!ehPdf) {
    const nome = arquivo.name.toLowerCase();
    if (nome.endsWith(".ppt") || nome.endsWith(".pptx") || nome.endsWith(".odp")) {
      return (
        "Por enquanto o envio aceita apenas PDF. No PowerPoint, use Arquivo › " +
        "Exportar › Criar PDF/XPS; no Google Apresentações, use Arquivo › Fazer " +
        "download › Documento PDF. O resultado fica idêntico ao original."
      );
    }
    return "Escolha um arquivo PDF.";
  }
  if (arquivo.size === 0) return "Este arquivo está vazio.";
  if (arquivo.size > TAMANHO_MAXIMO) {
    const mb = Math.round(arquivo.size / (1024 * 1024));
    return `O arquivo tem ${mb} MB e o limite é 40 MB. Exporte em qualidade menor e tente de novo.`;
  }
  return null;
}

/** Recusa a quantidade de páginas, ou `null` se couber. */
export function recusaDaQuantidade(paginas: number): string | null {
  if (paginas < 1) return "Não foi possível ler nenhuma página deste arquivo.";
  if (paginas > SLIDES_MAXIMO) {
    return `Esta apresentação tem ${paginas} slides e o limite é ${SLIDES_MAXIMO}.`;
  }
  return null;
}

/**
 * Caminho da imagem de um slide dentro do depósito.
 *
 * O número vai com zeros à esquerda para que a ordem alfabética coincida com a
 * ordem da apresentação — sem isso, o slide 10 viria antes do 2.
 */
export function caminhoDoSlide(apresentacaoId: string, numero: number): string {
  return `${apresentacaoId}/slide-${String(numero).padStart(3, "0")}.webp`;
}

/** Caminho do arquivo original, no depósito privado. */
export function caminhoDoOriginal(apresentacaoId: string): string {
  return `${apresentacaoId}/original.pdf`;
}

/**
 * Normaliza o que a pessoa digitou no campo do código.
 *
 * Quem lê "APOIO-2K" da parede digita com espaço, com hífen e em minúscula. É
 * mais barato aceitar tudo isso do que devolver "código inválido" para alguém
 * que acertou.
 */
export function normalizarCodigo(digitado: string): string {
  return digitado
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, TAMANHO_DO_CODIGO);
}

/** Diz se o código já está completo e usa apenas letras do alfabeto aceito. */
export function codigoEstaCompleto(codigo: string): boolean {
  const limpo = normalizarCodigo(codigo);
  return (
    limpo.length === TAMANHO_DO_CODIGO && [...limpo].every((c) => ALFABETO_DO_CODIGO.includes(c))
  );
}

/**
 * Vizinhos do slide atual, para carregar antes da hora.
 *
 * A rede de uma casa espírita cai no meio da palestra. Se o slide seguinte já
 * estiver no aparelho quando o palestrante avançar, a queda passa despercebida.
 * Adianta mais o slide da frente do que o de trás: é para lá que se vai.
 */
export function slidesParaAdiantar(atual: number, total: number): number[] {
  const candidatos = [atual + 1, atual + 2, atual - 1];
  return candidatos.filter((n) => n >= 1 && n <= total && n !== atual);
}
