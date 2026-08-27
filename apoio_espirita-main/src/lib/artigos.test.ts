import { describe, it, expect } from "vitest";
import {
  ROTULOS,
  TIPOS_ERRO,
  DESCRICAO_MINIMA,
  TITULO_MIN,
  TITULO_MAX,
  CONTEUDO_MIN,
  RESUMO_MAX,
  JUSTIFICATIVA_MINIMA,
  exigeDescricao,
  descricaoValida,
  gerarSlug,
  pluralCaracteres,
  validarArtigo,
  justificativaValida,
  pluralDias,
  pluralCasos,
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

describe("plural de caracteres", () => {
  it("usa singular só para 1", () => {
    expect(pluralCaracteres(1)).toBe("caractere");
    expect(pluralCaracteres(0)).toBe("caracteres");
    expect(pluralCaracteres(2)).toBe("caracteres");
  });
});

describe("validação do formulário de artigo", () => {
  const conteudoValido = "a".repeat(CONTEUDO_MIN);

  it("aceita título, conteúdo e resumo dentro dos limites", () => {
    expect(validarArtigo("Um título válido", conteudoValido, "Resumo curto")).toBeNull();
  });

  it("mede o texto sem espaços nas pontas, como o banco faz", () => {
    expect(validarArtigo(`  ${"a".repeat(TITULO_MIN)}  `, conteudoValido, "")).toBeNull();
    expect(validarArtigo("a".repeat(TITULO_MIN - 1), conteudoValido, "")).not.toBeNull();
  });

  it("recusa título fora do intervalo permitido", () => {
    expect(validarArtigo("abc", conteudoValido, "")).toContain(String(TITULO_MIN));
    expect(validarArtigo("a".repeat(TITULO_MAX + 1), conteudoValido, "")).toContain(
      String(TITULO_MAX),
    );
  });

  it("recusa conteúdo curto demais e concorda o número de caracteres faltando", () => {
    const faltaUm = "b".repeat(CONTEUDO_MIN - 1);
    expect(validarArtigo("Título válido", faltaUm, "")).toMatch(/Falta 1 caractere\.$/);

    const faltamDois = "b".repeat(CONTEUDO_MIN - 2);
    expect(validarArtigo("Título válido", faltamDois, "")).toMatch(/Faltam 2 caracteres\.$/);
  });

  it("recusa resumo além do máximo", () => {
    expect(validarArtigo("Título válido", conteudoValido, "r".repeat(RESUMO_MAX + 1))).toContain(
      String(RESUMO_MAX),
    );
  });
});

describe("justificativa de decisão de revisão", () => {
  it("recusa justificativa curta demais ou só com espaços", () => {
    expect(JUSTIFICATIVA_MINIMA).toBe(10);
    expect(justificativaValida("curta")).toBe(false);
    expect(justificativaValida("   ")).toBe(false);
    expect(justificativaValida("")).toBe(false);
  });

  it("aceita justificativa com o tamanho mínimo, medindo sem espaços nas pontas", () => {
    expect(justificativaValida("0123456789")).toBe(true);
    expect(justificativaValida("  0123456789  ")).toBe(true);
  });
});

describe("plural de dias de suspensão", () => {
  it("usa singular só para 1", () => {
    expect(pluralDias(1)).toBe("dia");
    expect(pluralDias(0)).toBe("dias");
    expect(pluralDias(2)).toBe("dias");
    expect(pluralDias(30)).toBe("dias");
  });
});

describe("plural de casos na fila de revisão", () => {
  it("usa singular só para 1", () => {
    expect(pluralCasos(1)).toBe("caso");
    expect(pluralCasos(0)).toBe("casos");
    expect(pluralCasos(2)).toBe("casos");
  });
});

describe("validarArtigo — linguagem", () => {
  const conteudoLongo = "Reflexao fraterna sobre a caridade no Evangelho. ".repeat(8);

  it("recusa palavrao no conteudo", () => {
    const msg = validarArtigo("Titulo valido", conteudoLongo + " que merda", "Resumo");
    expect(msg).toContain("merda");
  });

  it("recusa palavrao no titulo", () => {
    const msg = validarArtigo("Seu otario", conteudoLongo, "Resumo");
    expect(msg).toContain("otario");
  });

  it("aceita artigo fraterno", () => {
    expect(validarArtigo("A pratica da caridade", conteudoLongo, "Resumo sereno")).toBeNull();
  });
});
