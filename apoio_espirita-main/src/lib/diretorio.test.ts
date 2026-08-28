import { describe, it, expect } from "vitest";
import {
  ESTADOS,
  nomeDoEstado,
  nomeProprio,
  slugDeCidade,
  caminhoDaCidade,
  caminhoDoEstado,
  cepFormatado,
  enderecoParaMapa,
} from "./diretorio";

/**
 * O slug da cidade é gerado em dois lugares: aqui, para montar o link, e na
 * função `diretorio_slug` do banco, para responder à consulta. Se os dois
 * discordarem em um acento, o link leva a uma página vazia — e é justamente a
 * página que precisa ser encontrada por quem procura uma casa espírita.
 *
 * Os pares abaixo foram conferidos rodando `diretorio_slug` no banco de
 * produção em 28/08/2026.
 */
const SLUGS_CONFERIDOS_NO_BANCO: [string, string][] = [
  ["Rio de Janeiro", "rio-de-janeiro"],
  ["São Gonçalo", "sao-goncalo"],
  ["Nilópolis", "nilopolis"],
  ["Duque de Caxias", "duque-de-caxias"],
  ["Angra dos Reis", "angra-dos-reis"],
];

describe("slug de cidade", () => {
  it("bate com a função do banco", () => {
    for (const [cidade, slug] of SLUGS_CONFERIDOS_NO_BANCO) {
      expect(slugDeCidade(cidade), cidade).toBe(slug);
    }
  });

  it("não deixa hífen sobrando nas pontas", () => {
    expect(slugDeCidade(" Santo André ")).toBe("santo-andre");
    expect(slugDeCidade("Sant'Ana do Livramento")).toBe("sant-ana-do-livramento");
  });
});

describe("estados", () => {
  it("cobre as 27 unidades da federação", () => {
    expect(Object.keys(ESTADOS)).toHaveLength(27);
  });

  it("traduz a sigla para o nome por extenso", () => {
    expect(nomeDoEstado("rj")).toBe("Rio de Janeiro");
    expect(nomeDoEstado("SP")).toBe("São Paulo");
  });

  it("devolve a própria sigla quando não conhece", () => {
    expect(nomeDoEstado("ZZ")).toBe("ZZ");
    expect(nomeDoEstado(null)).toBe("");
  });
});

describe("nome próprio", () => {
  it("desfaz a caixa alta do cadastro", () => {
    expect(nomeProprio("ABRIGO TEREZA DE JESUS")).toBe("Abrigo Tereza de Jesus");
    expect(nomeProprio("CENTRO ESPIRITA CASA DO CAMINHO")).toBe("Centro Espirita Casa do Caminho");
  });

  it("preserva siglas", () => {
    expect(nomeProprio("CEI VINHA DE LUZ")).toBe("CEI Vinha de Luz");
  });

  it("não reescreve texto que alguém já escreveu com cuidado", () => {
    expect(nomeProprio("Grupo Espírita Amor e Caridade")).toBe("Grupo Espírita Amor e Caridade");
  });

  it("aguenta vazio", () => {
    expect(nomeProprio(null)).toBe("");
    expect(nomeProprio("   ")).toBe("");
  });
});

describe("endereços das páginas", () => {
  it("monta o caminho do estado em minúsculas", () => {
    expect(caminhoDoEstado("RJ")).toBe("/casas/rj");
  });

  it("aceita tanto o nome quanto o slug da cidade", () => {
    expect(caminhoDaCidade("RJ", "São Gonçalo")).toBe("/casas/rj/sao-goncalo");
    expect(caminhoDaCidade("RJ", "sao-goncalo")).toBe("/casas/rj/sao-goncalo");
  });
});

describe("apresentação dos dados da casa", () => {
  it("formata o CEP de oito dígitos", () => {
    expect(cepFormatado("20271021")).toBe("20271-021");
    expect(cepFormatado("20271-021")).toBe("20271-021");
  });

  it("devolve como veio o CEP fora do padrão", () => {
    expect(cepFormatado("2027")).toBe("2027");
    expect(cepFormatado(null)).toBe("");
  });

  it("monta o endereço da busca no mapa sem campo vazio", () => {
    expect(
      enderecoParaMapa({
        nome: "Casa do Caminho",
        endereco: "Rua Ibituruna, 53",
        cidade: "Rio de Janeiro",
        estado: "RJ",
      }),
    ).toBe("Rua Ibituruna, 53, Rio de Janeiro, RJ");
    expect(
      enderecoParaMapa({
        nome: "Casa do Caminho",
        endereco: null,
        cidade: "Rio de Janeiro",
        estado: "RJ",
      }),
    ).toBe("Rio de Janeiro, RJ");
  });
});
