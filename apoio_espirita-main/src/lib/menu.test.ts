import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { MANUAL } from "@/data/manual";

/**
 * O menu do computador e o do celular sao dois blocos separados de JSX, escritos
 * a mao. Quem acrescenta uma tela mexe num e esquece do outro — e ninguem e
 * avisado: a tela existe, o link existe, so nao aparece para metade das pessoas.
 *
 * Foi o que aconteceu com tres telas ao mesmo tempo (31/08/2026): /perguntas e
 * /casas so estavam no menu do computador, e o jogo Caminho da Luz, o mais
 * recente, nao estava em nenhum dos dois — chegava-se a ele so pela pagina de
 * jogos. Sao dias no ar sem ninguem notar, porque nada quebra.
 *
 * Estes testes sao o aviso. Nao impedem uma diferenca proposital: impedem uma
 * diferenca ESQUECIDA, obrigando quem quiser manter a assimetria a declara-la
 * abaixo, por escrito e com motivo.
 */

const RAIZ = path.resolve(__dirname, "..");
const ROOT_TSX = readFileSync(path.join(RAIZ, "routes", "__root.tsx"), "utf8");

/** Diferencas propositais entre os dois menus. Vazio ate haver um motivo. */
const SO_NO_COMPUTADOR: string[] = [];
const SO_NO_CELULAR: string[] = [];

/**
 * Cada item do menu e um <Link>. O que diz a qual menu ele pertence e a classe:
 * `dropItemCls` no computador, `subItemMobileCls` no celular. Ler as classes e
 * mais fiel do que tentar recortar o arquivo por regiao — recorte quebra quando
 * alguem reordena o JSX; a classe acompanha o item para onde ele for.
 */
function rotasDoMenu(marcadorDeClasse: string): string[] {
  const links = ROOT_TSX.match(/<Link\b[^>]*>/g) ?? [];
  const rotas = links
    .filter((link) => link.includes(marcadorDeClasse))
    .map((link) => link.match(/to="([^"]+)"/)?.[1])
    .filter((rota): rota is string => Boolean(rota));
  return [...new Set(rotas)].sort();
}

describe("paridade entre o menu do computador e o do celular", () => {
  const computador = rotasDoMenu("dropItemCls");
  const celular = rotasDoMenu("subItemMobileCls");

  it("encontra os dois menus", () => {
    // Se um dos blocos deixar de ser reconhecido, os testes abaixo passariam
    // comparando duas listas vazias — aprovando tudo sem olhar nada.
    expect(computador.length, "menu do computador nao foi reconhecido").toBeGreaterThan(10);
    expect(celular.length, "menu do celular nao foi reconhecido").toBeGreaterThan(10);
  });

  it("nao esconde do celular nada que o computador oferece", () => {
    const faltando = computador.filter(
      (rota) => !celular.includes(rota) && !SO_NO_COMPUTADOR.includes(rota),
    );
    expect(
      faltando,
      `no menu do computador e ausente no do celular: ${faltando.join(", ")}`,
    ).toEqual([]);
  });

  it("nao esconde do computador nada que o celular oferece", () => {
    const faltando = celular.filter(
      (rota) => !computador.includes(rota) && !SO_NO_CELULAR.includes(rota),
    );
    expect(
      faltando,
      `no menu do celular e ausente no do computador: ${faltando.join(", ")}`,
    ).toEqual([]);
  });
});

describe("o manual so promete caminho que existe", () => {
  it("nao manda o leitor abrir um item de menu que nao esta la", () => {
    // Um caminho errado no manual e pior do que caminho nenhum: a pessoa
    // procura, nao acha, e conclui que o erro e dela. Foi o caso da Radio, que
    // o manual mandava abrir em 'Estudo' enquanto o link so existia no rodape.
    //
    // Aqui nao da para olhar so os itens de dentro dos grupos: o menu tambem
    // tem links de primeiro nivel (Tesouraria) e os proprios botoes de grupo
    // (Jogos). O recorte certo e por regiao — tudo o que vem antes do rodape e
    // navegacao; o que vem depois e rodape, e foi exatamente ali que a Radio
    // estava escondida.
    const navegacao = ROOT_TSX.slice(0, ROOT_TSX.indexOf("<footer"));

    const mentindo = MANUAL.filter(
      (item) =>
        item.href &&
        /menu superior/i.test(item.ondeFica) &&
        !navegacao.includes(`to="${item.href}"`),
    ).map((item) => `${item.href} (manual diz: "${item.ondeFica}")`);

    expect(mentindo, `caminho prometido pelo manual e ausente no menu: ${mentindo.join("; ")}`).toEqual(
      [],
    );
  });
});

describe("todo jogo publicado chega ao menu", () => {
  it("nao deixa jogo algum alcancavel so pela pagina de jogos", () => {
    const jogos = readdirSync(path.join(RAIZ, "routes", "jogos"))
      .filter((arquivo) => arquivo.endsWith(".tsx") && arquivo !== "index.tsx")
      .map((arquivo) => `/jogos/${arquivo.replace(/\.tsx$/, "")}`);

    // A pagina /jogos e a vitrine; o menu e o caminho de quem ja sabe o que
    // quer. Um jogo fora do menu so e encontrado por quem passa pela vitrine.
    const foraDoMenu = jogos.filter((jogo) => !ROOT_TSX.includes(`to="${jogo}"`));
    expect(foraDoMenu, `jogo sem link no menu: ${foraDoMenu.join(", ")}`).toEqual([]);
  });
});
