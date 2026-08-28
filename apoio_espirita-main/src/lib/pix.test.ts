import { describe, expect, it } from "vitest";
import { crc16, gerarCodigoPix, normalizarTextoPix } from "./pix";

describe("normalizarTextoPix", () => {
  it("tira acento e sobe para maiúsculas", () => {
    expect(normalizarTextoPix("Sociedade Espírita São João", 25)).toBe("SOCIEDADE ESPIRITA SAO JO");
  });

  it("troca pontuação por espaço e corta no tamanho do padrão", () => {
    expect(normalizarTextoPix("Casa-Lar, Ltda.", 25)).toBe("CASA LAR LTDA");
    expect(normalizarTextoPix("Rio de Janeiro", 15)).toBe("RIO DE JANEIRO");
    expect(normalizarTextoPix("São Bernardo do Campo", 15)).toBe("SAO BERNARDO DO");
  });
});

describe("crc16", () => {
  // Valor de referência do padrão EMV: o dígito verificador da cadeia
  // "123456789" no CRC-16/CCITT-FALSE é 0x29B1.
  it("confere com o valor de referência do padrão", () => {
    expect(crc16("123456789")).toBe("29B1");
  });
});

describe("gerarCodigoPix", () => {
  const base = { chave: "casa@exemplo.org.br", nome: "Casa Espirita Luz", cidade: "Niteroi" };

  it("monta o código com os campos obrigatórios do padrão", () => {
    const codigo = gerarCodigoPix(base)!;
    expect(codigo.startsWith("000201")).toBe(true);
    expect(codigo).toContain("BR.GOV.BCB.PIX");
    expect(codigo).toContain("5303986"); // moeda: real
    expect(codigo).toContain("5802BR"); // país
    expect(codigo).toContain("6304"); // abertura do CRC
  });

  it("fecha com um CRC que confere com o próprio conteúdo", () => {
    const codigo = gerarCodigoPix(base)!;
    const corpo = codigo.slice(0, -4);
    expect(codigo.slice(-4)).toBe(crc16(corpo));
  });

  it("inclui o valor quando há preço e o omite quando é doação livre", () => {
    expect(gerarCodigoPix({ ...base, valor: 25 })).toContain("540525.00");
    expect(gerarCodigoPix({ ...base, valor: null })).not.toContain("5405");
    expect(gerarCodigoPix({ ...base, valor: 0 })).not.toContain("5405");
  });

  it("declara o tamanho certo de cada campo", () => {
    const codigo = gerarCodigoPix(base)!;
    // 59 é o nome do recebedor: "CASA ESPIRITA LUZ" tem 17 caracteres.
    expect(codigo).toContain("5917CASA ESPIRITA LUZ");
    expect(codigo).toContain("6007NITEROI");
  });

  it("não devolve código nenhum quando falta chave, nome ou cidade", () => {
    expect(gerarCodigoPix({ ...base, chave: "  " })).toBeNull();
    expect(gerarCodigoPix({ ...base, nome: "" })).toBeNull();
    expect(gerarCodigoPix({ ...base, cidade: "!!!" })).toBeNull();
  });

  it("usa *** quando não há identificador de transação", () => {
    expect(gerarCodigoPix(base)).toContain("62070503***");
  });
});
