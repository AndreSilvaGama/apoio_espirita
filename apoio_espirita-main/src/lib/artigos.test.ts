import { describe, it, expect } from "vitest";
import {
  ROTULOS,
  TIPOS_ERRO,
  DESCRICAO_MINIMA,
  exigeDescricao,
  descricaoValida,
  gerarSlug,
} from "./artigos";

describe("escala de avaliação", () => {
  it("tem rótulo em português para os seis tipos", () => {
    expect(ROTULOS).toEqual({
      otimo: "Ótimo",
      bom: "Bom",
      gostei: "Gostei",
      nao_gostei: "Não gostei",
      erro: "Tem erro",
      erro_grave: "Tem erro grave",
    });
  });

  it("exige descrição apenas nos dois níveis de erro", () => {
    expect(exigeDescricao("erro")).toBe(true);
    expect(exigeDescricao("erro_grave")).toBe(true);
    expect(exigeDescricao("otimo")).toBe(false);
    expect(exigeDescricao("bom")).toBe(false);
    expect(exigeDescricao("gostei")).toBe(false);
    expect(exigeDescricao("nao_gostei")).toBe(false);
  });

  it("lista exatamente os tipos de erro", () => {
    expect([...TIPOS_ERRO].sort()).toEqual(["erro", "erro_grave"]);
  });
});

describe("descrição do erro", () => {
  it("recusa descrição curta demais nos tipos de erro", () => {
    expect(DESCRICAO_MINIMA).toBe(10);
    expect(descricaoValida("erro", "errado")).toBe(false);
    expect(descricaoValida("erro_grave", null)).toBe(false);
    expect(descricaoValida("erro", "   espaços   ")).toBe(false);
  });

  it("aceita descrição com o tamanho mínimo", () => {
    expect(descricaoValida("erro", "A data da obra está errada")).toBe(true);
    expect(descricaoValida("erro_grave", "0123456789")).toBe(true);
  });

  it("ignora a descrição nos tipos que não a exigem", () => {
    expect(descricaoValida("otimo", null)).toBe(true);
    expect(descricaoValida("nao_gostei", "")).toBe(true);
  });
});

describe("slug", () => {
  it("remove acentos, pontuação e caixa", () => {
    expect(gerarSlug("O Evangelho à luz da Razão!")).toBe("o-evangelho-a-luz-da-razao");
  });

  it("colapsa espaços e hífens repetidos", () => {
    expect(gerarSlug("  Caridade   —  amor  ")).toBe("caridade-amor");
  });

  it("não devolve slug vazio", () => {
    expect(gerarSlug("???")).toBe("artigo");
  });

  it("limita o comprimento a 80 caracteres sem cortar no meio da palavra", () => {
    const slug = gerarSlug("palavra ".repeat(30));
    expect(slug.length).toBeLessThanOrEqual(80);
    expect(slug.endsWith("-")).toBe(false);
  });
});
