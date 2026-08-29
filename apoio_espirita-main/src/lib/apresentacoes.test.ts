import { describe, it, expect } from "vitest";
import {
  recusaDoArquivo,
  recusaDaQuantidade,
  caminhoDoSlide,
  caminhoDoOriginal,
  normalizarCodigo,
  codigoEstaCompleto,
  slidesParaAdiantar,
  TAMANHO_MAXIMO,
  SLIDES_MAXIMO,
  TAMANHO_DO_CODIGO,
} from "./apresentacoes";

const arquivo = (name: string, size = 1000, type = "application/pdf") => ({ name, size, type });

describe("recusa do arquivo", () => {
  it("aceita um PDF de tamanho normal", () => {
    expect(recusaDoArquivo(arquivo("palestra.pdf"))).toBeNull();
  });

  it("aceita PDF cujo tipo o navegador não soube dizer", () => {
    expect(recusaDoArquivo(arquivo("palestra.PDF", 1000, ""))).toBeNull();
  });

  it("ensina a exportar quando vem um arquivo de apresentação", () => {
    for (const nome of ["aula.pptx", "aula.ppt", "aula.odp"]) {
      const recusa = recusaDoArquivo(arquivo(nome, 1000, ""));
      expect(recusa).toContain("PDF");
      // A recusa precisa dizer COMO resolver, não apenas que está errado.
      expect(recusa).toContain("Exportar");
    }
  });

  it("recusa arquivo vazio", () => {
    expect(recusaDoArquivo(arquivo("vazio.pdf", 0))).toContain("vazio");
  });

  it("recusa acima do limite e diz o tamanho encontrado", () => {
    const recusa = recusaDoArquivo(arquivo("grande.pdf", TAMANHO_MAXIMO + 1));
    expect(recusa).toContain("40 MB");
  });

  it("aceita exatamente no limite", () => {
    expect(recusaDoArquivo(arquivo("no-limite.pdf", TAMANHO_MAXIMO))).toBeNull();
  });

  it("recusa o que não é apresentação nenhuma", () => {
    expect(recusaDoArquivo(arquivo("foto.jpg", 1000, "image/jpeg"))).toBe(
      "Escolha um arquivo PDF.",
    );
  });
});

describe("recusa da quantidade de slides", () => {
  it("aceita uma palestra comum", () => {
    expect(recusaDaQuantidade(30)).toBeNull();
  });

  it("aceita exatamente o limite", () => {
    expect(recusaDaQuantidade(SLIDES_MAXIMO)).toBeNull();
  });

  it("recusa acima do limite", () => {
    expect(recusaDaQuantidade(SLIDES_MAXIMO + 1)).toContain(String(SLIDES_MAXIMO));
  });

  it("recusa documento sem página alguma", () => {
    expect(recusaDaQuantidade(0)).toContain("nenhuma página");
  });
});

describe("caminhos no depósito", () => {
  const id = "8f14e45f-ea20-4a1b-9c3d-2b7a91d0c111";

  it("preenche com zeros para a ordem alfabética bater com a da apresentação", () => {
    expect(caminhoDoSlide(id, 1)).toBe(`${id}/slide-001.webp`);
    expect(caminhoDoSlide(id, 10)).toBe(`${id}/slide-010.webp`);
    expect(caminhoDoSlide(id, 150)).toBe(`${id}/slide-150.webp`);
  });

  it("mantém a ordem correta quando ordenado como texto", () => {
    const caminhos = [2, 10, 1, 100, 20].map((n) => caminhoDoSlide(id, n));
    const ordenados = [...caminhos].sort();
    expect(ordenados).toEqual([1, 2, 10, 20, 100].map((n) => caminhoDoSlide(id, n)));
  });

  it("guarda o original numa pasta com o identificador, que a política de leitura confere", () => {
    expect(caminhoDoOriginal(id)).toBe(`${id}/original.pdf`);
    expect(caminhoDoOriginal(id).split("/")[0]).toBe(id);
  });
});

describe("código da sessão", () => {
  it("aceita o que a pessoa digitou com espaço, hífen e minúscula", () => {
    expect(normalizarCodigo("apk-2 3z")).toBe("APK23Z");
    expect(normalizarCodigo("  QWERTY  ")).toBe("QWERTY");
  });

  it("nunca passa do tamanho, mesmo colando texto longo", () => {
    expect(normalizarCodigo("ABCDEFGHIJ").length).toBe(TAMANHO_DO_CODIGO);
  });

  it("reconhece um código completo", () => {
    expect(codigoEstaCompleto("ABC234")).toBe(true);
    expect(codigoEstaCompleto("abc-234")).toBe(true);
  });

  it("não aceita código incompleto", () => {
    expect(codigoEstaCompleto("ABC23")).toBe(false);
    expect(codigoEstaCompleto("")).toBe(false);
  });

  it("recusa as letras ambíguas que o gerador nunca produz", () => {
    // I, O, 0 e 1 ficaram de fora justamente para não serem confundidos.
    expect(codigoEstaCompleto("ABCDEI")).toBe(false);
    expect(codigoEstaCompleto("ABCDEO")).toBe(false);
    expect(codigoEstaCompleto("ABCDE0")).toBe(false);
    expect(codigoEstaCompleto("ABCDE1")).toBe(false);
  });
});

describe("slides adiantados", () => {
  it("prioriza o slide seguinte, que é para onde a palestra vai", () => {
    expect(slidesParaAdiantar(5, 20)).toEqual([6, 7, 4]);
  });

  it("não pede slide antes do primeiro", () => {
    expect(slidesParaAdiantar(1, 20)).toEqual([2, 3]);
  });

  it("não pede slide depois do último", () => {
    expect(slidesParaAdiantar(20, 20)).toEqual([19]);
  });

  it("aguenta apresentação de um slide só", () => {
    expect(slidesParaAdiantar(1, 1)).toEqual([]);
  });

  it("nunca inclui o slide que já está na tela", () => {
    for (let atual = 1; atual <= 10; atual++) {
      expect(slidesParaAdiantar(atual, 10)).not.toContain(atual);
    }
  });
});
