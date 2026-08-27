import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { normalizar, termoInadequado, temLinguagemInadequada, validarLinguagem } from "./linguagem";

describe("normalizar", () => {
  it("tira acento e caixa alta", () => {
    expect(normalizar("Coração")).toBe("coracao");
  });

  it("colapsa letra repetida", () => {
    expect(normalizar("poooorra")).toBe("pora");
    expect(normalizar("carro")).toBe("caro");
  });

  it("troca número por letra", () => {
    expect(normalizar("m3rd4")).toBe("merda");
  });
});

describe("termoInadequado — o que precisa ser barrado", () => {
  it("pega o palavrão escrito por extenso", () => {
    expect(termoInadequado("isso é uma merda")).toBe("merda");
  });

  it("pega no plural e no diminutivo", () => {
    expect(termoInadequado("cheio de merdas")).toBe("merda");
    expect(termoInadequado("que safadinho")).toBe("safado");
  });

  it("pega com acento e caixa alta", () => {
    expect(termoInadequado("SEU OTÁRIO")).toBe("otario");
  });

  it("pega com número no lugar de letra", () => {
    expect(termoInadequado("que m3rda")).toBe("merda");
  });

  it("pega com letra repetida", () => {
    expect(termoInadequado("poooorra nenhuma")).toBe("pora");
  });

  it("pega expressão de mais de uma palavra", () => {
    expect(termoInadequado("ele é um filho da puta")).toBe("filho da puta");
  });

  it("pega termo escrito com separador entre as letras", () => {
    expect(termoInadequado("que m.e.r.d.a")).toBe("merda");
    expect(termoInadequado("que m e r d a")).toBe("merda");
  });

  it("pega xingamento discriminatório", () => {
    expect(termoInadequado("seu retardado")).toBe("retardado");
  });
});

describe("termoInadequado — o que NÃO pode ser barrado", () => {
  const legitimos = [
    "O Evangelho segundo o Espiritismo, capítulo IX.",
    "É preciso cuidar do próximo com caridade e paciência.",
    "O assessor da casa cuidou de toda a documentação.",
    "A cura pela prece exige fé e perseverança.",
    "O culto do Evangelho no lar reúne a família.",
    "Nosso carro levou os mantimentos para a campanha.",
    "O passe é aplicado com concentração e humildade.",
    "Kardec responde na questão 625 de O Livro dos Espíritos.",
    "A pintura do salão foi feita pelos voluntários.",
    "O pintor doou o trabalho à casa espírita.",
    "A reencarnação é uma lei de amor e de justiça.",
    "Ele cultiva a mansuetude diante da provação.",
    "O cuidado com os desencarnados recentes é constante.",
    "A transição planetária é tema de estudo na mocidade.",
    "Custa pouco ser fraterno com quem sofre.",
    "O bicho do mato assustou as crianças no passeio.",
    "Trabalhamos no bazar, na cozinha e na evangelização.",
    "O porão da casa foi reformado pelos voluntários.",
    "O bichinho de estimação da menina foi resgatado.",
    "Cada poro da pele reage ao passe, dizem os antigos.",
    "A córnea do olho é uma obra de engenharia divina.",
    "O pai putativo criou a criança com todo o amor.",
    "A corneta anunciou o início da confraternização.",
    "Imbuídos de fé, seguimos o trabalho na casa.",
  ];

  for (const texto of legitimos) {
    it(`aceita: ${texto.slice(0, 45)}`, () => {
      expect(termoInadequado(texto)).toBeNull();
    });
  }

  it("aceita texto vazio", () => {
    expect(termoInadequado("")).toBeNull();
    expect(temLinguagemInadequada("")).toBe(false);
  });
});

describe("validarLinguagem", () => {
  it("devolve null quando todos os trechos estão limpos", () => {
    expect(
      validarLinguagem("Título fraterno", "Resumo sereno", "Conteúdo sobre caridade"),
    ).toBeNull();
  });

  it("aponta o termo encontrado na mensagem", () => {
    const msg = validarLinguagem("Título limpo", "isso é uma merda");
    expect(msg).toContain("merda");
    expect(msg).toContain("Reescreva");
  });

  it("ignora trechos ausentes", () => {
    expect(validarLinguagem("Texto fraterno", null, undefined)).toBeNull();
  });

  it("examina todos os trechos, não só o primeiro", () => {
    expect(validarLinguagem("limpo", "limpo", "seu babaca")).toContain("babaca");
  });
});

/**
 * Guarda de regressão: o conteúdo real do site não pode ser acusado. Quem
 * incluir um termo novo na lista descobre aqui, e não em produção, que ele
 * derruba um texto legítimo já publicado.
 */
describe("conteúdo real do site", () => {
  const ARQUIVOS = [
    "src/data/palavras-semente.ts",
    "src/data/caca-palavras.ts",
    "src/data/quiz-espirita.ts",
    "src/data/semeador-mensagens.ts",
    "src/data/memoria-evangelizacao.ts",
    "src/data/funcionalidades.ts",
    "src/routes/ajuda.tsx",
    "src/routes/painel.tsx",
    "src/routes/evangelizacao.tsx",
    "src/routes/transparencia.tsx",
  ];

  it("não acusa nenhuma linha dos textos já publicados", () => {
    const acusacoes: string[] = [];
    for (const arquivo of ARQUIVOS) {
      const caminho = path.resolve(process.cwd(), arquivo);
      if (!fs.existsSync(caminho)) continue;
      for (const linha of fs.readFileSync(caminho, "utf8").split(/\r?\n/)) {
        const termo = termoInadequado(linha);
        if (termo) acusacoes.push(`${arquivo} [${termo}]: ${linha.trim().slice(0, 100)}`);
      }
    }
    expect(acusacoes).toEqual([]);
  });
});
