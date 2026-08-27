import { describe, expect, it } from "vitest";
import { PAGINAS_DO_SITE, buscarPaginas, semAcento, termoValido } from "./busca";

describe("semAcento", () => {
  it("iguala texto com e sem acento", () => {
    expect(semAcento("Espírita")).toBe(semAcento("espirita"));
    expect(semAcento("Itaboraí")).toBe("itaborai");
    expect(semAcento("EVANGELHO")).toBe("evangelho");
  });
});

describe("termoValido", () => {
  it("recusa termo curto demais", () => {
    expect(termoValido("")).toBe(false);
    expect(termoValido(" a ")).toBe(false);
    expect(termoValido("ar")).toBe(true);
  });
});

describe("buscarPaginas", () => {
  it("não busca com termo curto", () => {
    expect(buscarPaginas("a")).toEqual([]);
  });

  it("acha a tela pelo nome, sem acento", () => {
    const achados = buscarPaginas("musicas");
    expect(achados.map((p) => p.href)).toContain("/musicas-cifras");
  });

  it("acha a tela por uma palavra que não está no título", () => {
    const achados = buscarPaginas("dinheiro");
    expect(achados.map((p) => p.href)).toContain("/tesouraria");
  });

  it("coloca quem casa pelo título antes de quem casa pela descrição", () => {
    const achados = buscarPaginas("artigo");
    expect(achados[0].titulo.toLowerCase()).toContain("artigo");
  });

  it("respeita o limite pedido", () => {
    expect(buscarPaginas("a".repeat(2), 3).length).toBeLessThanOrEqual(3);
    expect(buscarPaginas("e", 3)).toEqual([]);
  });

  it("não devolve a mesma tela duas vezes", () => {
    const achados = buscarPaginas("casa", 20);
    const chaves = achados.map((p) => p.href + p.titulo);
    expect(new Set(chaves).size).toBe(chaves.length);
  });
});

describe("catálogo de telas", () => {
  it("só lista telas com endereço", () => {
    for (const pagina of PAGINAS_DO_SITE) {
      expect(pagina.href.startsWith("/")).toBe(true);
      expect(pagina.titulo.trim().length).toBeGreaterThan(0);
    }
  });

  it("não anuncia tela que ainda não existe", () => {
    // Guarda contra o erro que os cartões já cometeram: prometer endereço de
    // recurso que não está no ar. Cada rota aqui precisa existir em src/routes.
    const rotasConhecidas = [
      "/agenda",
      "/ajuda",
      "/artigos",
      "/artigos/meus",
      "/artigos/novo",
      "/evangelizacao",
      "/feb",
      "/jogos",
      "/kanban",
      "/mensagem-do-dia",
      "/musicas-cifras",
      "/painel",
      "/perfil",
      "/radio",
      "/sugestoes",
      "/tesouraria",
      "/transparencia",
    ];
    for (const pagina of PAGINAS_DO_SITE) {
      expect(rotasConhecidas).toContain(pagina.href);
    }
  });
});
