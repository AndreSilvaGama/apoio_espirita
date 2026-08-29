import { describe, it, expect } from "vitest";
import { FUNCIONALIDADES } from "./funcionalidades";

/**
 * Guarda contra o erro que os cartões já cometeram duas vezes: anunciar como
 * "Em breve" um recurso que já estava no ar (o Mural de Avisos ficou meses
 * assim) e anunciar como disponível um endereço que não existe.
 *
 * Um cartão é uma promessa feita a quem usa o site. Se ele mente, a pessoa
 * clica e não encontra nada — ou deixa de usar o que já está pronto.
 */

/** Rotas que existem em src/routes. Ao criar uma rota nova, some aqui. */
const ROTAS_EXISTENTES = [
  "/agenda",
  "/apresentacoes",
  "/ajuda",
  "/aniversariantes",
  "/artigos",
  "/artigos/meus",
  "/artigos/novo",
  "/atendimento-fraterno",
  "/bazar",
  "/busca",
  "/caronas",
  "/casas",
  "/entregas",
  "/evangelizacao",
  "/feb",
  "/forum",
  "/grupos",
  "/jogos",
  "/jovens",
  "/kanban",
  "/mensagem-do-dia",
  "/musicas-cifras",
  "/oracoes",
  "/perguntas",
  "/painel",
  "/perfil",
  "/radio",
  "/sugestoes",
  "/tesouraria",
  "/transparencia",
  "/voluntariado",
];

/** Abas que existem na página da casa (`src/routes/casa/$sigla.tsx`). */
const ABAS_DA_CASA = [
  "painel",
  "mural",
  "sobre",
  "programacao",
  "tesouraria",
  "doacoes",
  "configuracoes",
  "tarefeiros",
];

const ITENS = FUNCIONALIDADES.flatMap((categoria) => categoria.items);

describe("catálogo de funcionalidades", () => {
  it("tem título e descrição em todo cartão", () => {
    for (const item of ITENS) {
      expect(item.title.trim().length).toBeGreaterThan(0);
      expect(item.desc.trim().length).toBeGreaterThan(0);
    }
  });

  it("não repete o mesmo cartão", () => {
    const titulos = ITENS.map((item) => item.title);
    expect(new Set(titulos).size).toBe(titulos.length);
  });

  it("todo cartão anunciado como pronto leva a algum lugar", () => {
    for (const item of ITENS) {
      if (item.status === "disponivel" || item.status === "beta") {
        expect(
          Boolean(item.href) || Boolean(item.casaAba),
          `"${item.title}" está anunciado como pronto sem endereço nem aba da casa`,
        ).toBe(true);
      }
    }
  });

  it("não anuncia endereço de tela que não existe", () => {
    for (const item of ITENS) {
      if (item.href) expect(ROTAS_EXISTENTES, `cartão "${item.title}"`).toContain(item.href);
    }
  });

  it("não anuncia aba que não existe na página da casa", () => {
    for (const item of ITENS) {
      if (item.casaAba) expect(ABAS_DA_CASA, `cartão "${item.title}"`).toContain(item.casaAba);
    }
  });

  it("cartão ainda por fazer não promete endereço", () => {
    for (const item of ITENS) {
      if (item.status === "breve") {
        expect(item.href, `"${item.title}" está "Em breve" mas aponta para ${item.href}`).toBe(
          undefined,
        );
        expect(item.casaAba).toBe(undefined);
      }
    }
  });
});
