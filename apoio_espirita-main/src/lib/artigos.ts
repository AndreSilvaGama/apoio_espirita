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
