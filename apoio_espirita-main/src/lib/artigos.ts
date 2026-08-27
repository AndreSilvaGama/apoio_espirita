/**
 * Apoio às telas de artigos. Só lógica pura: nada aqui consulta o banco.
 *
 * O piso de retirada NÃO mora aqui de propósito. Ele depende de quantos
 * usuários têm e-mail verificado, dado que só o banco enxerga, e duplicar a
 * regra criaria duas versões livres para divergir. A tela lê `piso_atual`
 * pronto da view `artigos_publicos`.
 */

export type TipoAvaliacao = "otimo" | "bom" | "gostei" | "nao_gostei" | "erro" | "erro_grave";

export const ROTULOS: Record<TipoAvaliacao, string> = {
  otimo: "Ótimo",
  bom: "Bom",
  gostei: "Gostei",
  nao_gostei: "Não gostei",
  erro: "Tem erro",
  erro_grave: "Tem erro grave",
};

/** Únicos tipos que pedem ao leitor dizer qual é o erro. */
export const TIPOS_ERRO = ["erro", "erro_grave"] as const;

/** Mesmo mínimo garantido por restrição no banco. */
export const DESCRICAO_MINIMA = 10;

export function exigeDescricao(tipo: TipoAvaliacao): boolean {
  return (TIPOS_ERRO as readonly string[]).includes(tipo);
}

export function descricaoValida(tipo: TipoAvaliacao, texto: string | null): boolean {
  if (!exigeDescricao(tipo)) return true;
  return (texto ?? "").trim().length >= DESCRICAO_MINIMA;
}

export function gerarSlug(titulo: string): string {
  const base = titulo
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!base) return "artigo";
  if (base.length <= 80) return base;
  return base
    .slice(0, 80)
    .replace(/-+[^-]*$/, "")
    .replace(/-+$/, "");
}

/**
 * Mesmos limites das restrições no banco (migração
 * `20260826100000_artigos_tabelas.sql`). Compartilhados entre a tela de
 * escrever e a de editar/corrigir para não duplicar a regra.
 */
export const TITULO_MIN = 5;
export const TITULO_MAX = 160;
export const CONTEUDO_MIN = 200;
export const RESUMO_MAX = 400;

/** "1 caractere" / "2 caracteres" — concordância de número, não fixo no plural. */
export function pluralCaracteres(n: number): string {
  return n === 1 ? "caractere" : "caracteres";
}

/**
 * Mesma validação que o banco aplica via CHECK, medindo o texto já sem
 * espaços nas pontas — para o formulário barrar antes de gastar uma ida ao
 * servidor. Devolve a mensagem pronta para exibir, ou `null` quando válido.
 */
export function validarArtigo(titulo: string, conteudo: string, resumo: string): string | null {
  const t = titulo.trim();
  const c = conteudo.trim();
  const r = resumo.trim();

  if (t.length < TITULO_MIN || t.length > TITULO_MAX) {
    return `O título deve ter entre ${TITULO_MIN} e ${TITULO_MAX} caracteres.`;
  }
  if (c.length < CONTEUDO_MIN) {
    const faltam = CONTEUDO_MIN - c.length;
    return `O conteúdo deve ter pelo menos ${CONTEUDO_MIN} caracteres. ${
      faltam === 1 ? "Falta" : "Faltam"
    } ${faltam} ${pluralCaracteres(faltam)}.`;
  }
  if (r.length > RESUMO_MAX) {
    return `O resumo pode ter no máximo ${RESUMO_MAX} caracteres.`;
  }
  return null;
}

/**
 * Mínimo para toda justificativa escrita de decisão de revisão (retirar,
 * restaurar, manter retirado, suspender ou banir). Campo próprio, sem CHECK
 * no banco — não é o mesmo mínimo de `DESCRICAO_MINIMA`, que é o da coluna
 * `descricao_erro` de `artigo_avaliacoes`. Mesma ordem de grandeza, escolhida
 * à parte, para não fazer o formulário depender de uma restrição que não é a
 * dele.
 */
export const JUSTIFICATIVA_MINIMA = 10;

export function justificativaValida(texto: string): boolean {
  return texto.trim().length >= JUSTIFICATIVA_MINIMA;
}

/** "1 dia" / "2 dias" — concordância de número no prazo de suspensão. */
export function pluralDias(n: number): string {
  return n === 1 ? "dia" : "dias";
}

/** "1 caso" / "2 casos" — concordância de número na fila de revisão. */
export function pluralCasos(n: number): string {
  return n === 1 ? "caso" : "casos";
}
