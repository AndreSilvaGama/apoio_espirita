import { describe, expect, it } from "vitest";
import jsQR from "jsqr";
import { matrizQR, svgQR } from "./qr";
import { gerarCodigoPix } from "./pix";

/**
 * O teste não confere o desenho módulo a módulo: ele LÊ o código de volta.
 *
 * Quem valida é o jsQR, um decodificador independente que não conhece nada
 * deste projeto. Se o texto lido for igual ao texto enviado, o código funciona
 * no aplicativo do banco — que é a única coisa que importa aqui. É o mesmo
 * critério de um teste de ida e volta: escreve, lê, compara.
 */
function lerDeVolta(texto: string): string | null {
  const m = matrizQR(texto);
  const margem = 4;
  const escala = 4;
  const lado = (m.length + margem * 2) * escala;
  const pixels = new Uint8ClampedArray(lado * lado * 4);

  for (let y = 0; y < lado; y++) {
    for (let x = 0; x < lado; x++) {
      const linha = Math.floor(y / escala) - margem;
      const coluna = Math.floor(x / escala) - margem;
      const escuro =
        linha >= 0 && linha < m.length && coluna >= 0 && coluna < m.length && m[linha][coluna];
      const valor = escuro ? 0 : 255;
      const i = (y * lado + x) * 4;
      pixels[i] = valor;
      pixels[i + 1] = valor;
      pixels[i + 2] = valor;
      pixels[i + 3] = 255;
    }
  }

  return jsQR(pixels, lado, lado)?.data ?? null;
}

describe("QR Code", () => {
  it("lê de volta exatamente o que foi codificado", () => {
    const texto = "APOIO ESPIRITA";
    expect(lerDeVolta(texto)).toBe(texto);
  });

  it("funciona com um código PIX real, do começo ao fim", () => {
    const codigo = gerarCodigoPix({
      chave: "casa.espirita@exemplo.org.br",
      nome: "Casa Espirita Luz",
      cidade: "Niteroi",
      valor: 35,
    })!;
    expect(lerDeVolta(codigo)).toBe(codigo);
  });

  it("funciona com chave aleatória, nome e cidade no limite do padrão", () => {
    const codigo = gerarCodigoPix({
      chave: "123e4567-e89b-12d3-a456-426614174000",
      nome: "Sociedade Espirita Amor e",
      cidade: "Sao Bernardo do",
      valor: 1234.56,
    })!;
    expect(lerDeVolta(codigo)).toBe(codigo);
  });

  it("funciona sem valor definido, quando a contribuição é livre", () => {
    const codigo = gerarCodigoPix({
      chave: "+5521999999999",
      nome: "Grupo Fraterno",
      cidade: "Rio de Janeiro",
    })!;
    expect(lerDeVolta(codigo)).toBe(codigo);
  });

  it("atravessa as faixas de versão sem se perder", () => {
    for (const tamanho of [1, 20, 60, 120, 200, 300, 400]) {
      const texto = "P".repeat(tamanho);
      expect(lerDeVolta(texto), `texto de ${tamanho} caracteres`).toBe(texto);
    }
  });

  it("mantém acentuação, que o padrão transmite em UTF-8", () => {
    const texto = "Casa Espírita São João — coração";
    expect(lerDeVolta(texto)).toBe(texto);
  });

  it("avisa quando o texto não cabe, em vez de devolver código quebrado", () => {
    expect(() => matrizQR("x".repeat(1000))).toThrow(/longo demais/i);
  });

  it("desenha um SVG com a margem clara que o padrão exige", () => {
    const svg = svgQR("teste", 200);
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain('width="200"');
    expect(svg).toContain('fill="#ffffff"');
    // 21 módulos da versão 1 mais quatro de margem de cada lado
    expect(svg).toContain('viewBox="0 0 29 29"');
  });
});
