import { describe, it, expect } from "vitest";
import { readFileSync, existsSync, statSync, readdirSync } from "node:fs";
import path from "node:path";
import { paginaPublica, migalhas, resumir, SITE } from "@/lib/seo";

/**
 * Travas da divulgação.
 *
 * Nada aqui testa uma regra de negócio: tudo aqui testa um defeito que já
 * aconteceu, ficou no ar sem ninguém perceber e desperdiçou divulgação já feita.
 * São defeitos silenciosos por natureza — a tela abre, o teste passa, o build
 * fica verde, e o prejuízo só aparece semanas depois num número que não subiu.
 *
 * Os três casos medidos em 31/08/2026:
 *
 *   1. `og:image` apontava para `/og-image.png` desde sempre, e o arquivo nunca
 *      existiu: HTTP 404. Todo link do site compartilhado no WhatsApp aparecia
 *      sem imagem.
 *   2. O `__root.tsx` declarava um canônico apontando para a página inicial.
 *      Como ele vale para todas as páginas, cada página não-inicial saía com
 *      DUAS etiquetas canônicas conflitantes — e o Google descarta as duas
 *      quando isso acontece. As 989 páginas de cidade ficaram sem canônico.
 *   3. `/casa/$sigla` não declarava cabeçalho nenhum: a página que a direção da
 *      casa compartilha com os frequentadores saía com o título da inicial.
 */

const RAIZ = path.resolve(__dirname, "..", "..");
const ROTAS = path.join(RAIZ, "src", "routes");

function ler(...partes: string[]) {
  return readFileSync(path.join(RAIZ, ...partes), "utf8");
}

describe("imagem de compartilhamento", () => {
  const caminho = path.join(RAIZ, "public", "og-image.png");

  it("o arquivo que og:image anuncia existe de verdade", () => {
    expect(
      existsSync(caminho),
      "public/og-image.png não existe, e o __root.tsx anuncia esse endereço em og:image. " +
        "Todo link compartilhado no WhatsApp vai aparecer sem imagem. " +
        "Rode: node scripts/gerar-og-image.mjs",
    ).toBe(true);
  });

  it("tem a medida que WhatsApp e Facebook esperam", () => {
    // Lido do cabeçalho do PNG, sem depender de biblioteca: bytes 16..23 do
    // trecho IHDR trazem largura e altura, cada uma em 4 bytes.
    const png = readFileSync(caminho);
    const largura = png.readUInt32BE(16);
    const altura = png.readUInt32BE(20);
    expect({ largura, altura }).toEqual({ largura: 1200, altura: 630 });
  });

  it("é leve o suficiente para o pré-visualizador buscar", () => {
    // Acima de ~1 MB o WhatsApp desiste de baixar a imagem e mostra o cartão
    // sem ela — o mesmo resultado do 404 que este arquivo veio consertar.
    const kb = statSync(caminho).size / 1024;
    expect(kb).toBeLessThan(1024);
  });
});

describe("etiqueta canônica", () => {
  it("a raiz não declara canônico", () => {
    const root = ler("src", "routes", "__root.tsx");
    // Só as declarações de verdade contam: o comentário que explica a ausência
    // menciona a palavra e não pode derrubar o teste.
    const declaracoes = root.match(/rel:\s*"canonical"/g) ?? [];
    expect(
      declaracoes.length,
      "O __root.tsx voltou a declarar um canônico. Como a raiz vale para todas " +
        "as páginas, cada página pública passa a ter dois canônicos conflitantes " +
        "e o Google descarta os dois. O canônico é de cada rota.",
    ).toBe(0);
  });

  /**
   * As rotas públicas, uma a uma. Lista escrita à mão de propósito: uma rota
   * nova entra aqui por decisão de quem a criou, e não por varredura que a
   * inclui sozinha e depois cobra um canônico de uma tela interna.
   */
  const PUBLICAS = [
    "index.tsx",
    "casas.index.tsx",
    "casas.$uf.index.tsx",
    "casas.$uf.$cidade.tsx",
    "casa/$sigla.tsx",
    "artigos.index.tsx",
    "artigos.$slug.tsx",
    "perguntas.index.tsx",
    "perguntas.$slug.tsx",
    "feb.tsx",
    "musicas-cifras.tsx",
    "transparencia.tsx",
    "sugestoes.tsx",
  ];

  it.each(PUBLICAS)("%s declara o próprio canônico", (arquivo) => {
    const fonte = readFileSync(path.join(ROTAS, arquivo), "utf8");
    const temDireto = /rel:\s*"canonical"/.test(fonte);
    // Rota que usa o utilitário ganha o canônico por ele.
    const temPeloUtilitario = /paginaPublica\(/.test(fonte);
    expect(
      temDireto || temPeloUtilitario,
      `${arquivo} é uma página pública e não diz ao Google qual é o endereço ` +
        `verdadeiro dela. Use paginaPublica() de src/lib/seo.ts.`,
    ).toBe(true);
  });

  it("toda página pública se apresenta ao ser compartilhada", () => {
    // Título e descrição próprios: sem eles o cartão do WhatsApp repete o texto
    // da página inicial, e quem recebe não sabe o que está abrindo.
    const semCabecalho = PUBLICAS.filter((arquivo) => {
      const fonte = readFileSync(path.join(ROTAS, arquivo), "utf8");
      return !/head:\s*\(/.test(fonte);
    });
    expect(semCabecalho).toEqual([]);
  });
});

describe("robots.txt", () => {
  const robots = ler("public", "robots.txt");

  it("aponta o mapa do site", () => {
    expect(robots).toContain(`Sitemap: ${SITE}/sitemap.xml`);
  });

  /**
   * Telas que exigem conta. Deixá-las abertas ao robô não vaza nada — a
   * permissão do banco fecha os dados —, mas gasta o limite de páginas que o
   * Google percorre por visita devolvendo sempre a mesma parede de login, e
   * tira rastreio das páginas de cidade, que são as que podem ranquear.
   */
  const EXIGEM_CONTA = [
    "/admin",
    "/agenda",
    "/aniversariantes",
    "/atendimento-fraterno",
    "/avisos",
    "/bazar",
    "/busca",
    "/caronas",
    "/entregas",
    "/evangelizacao",
    "/forum",
    "/grupos",
    "/inicio",
    "/jovens",
    "/kanban",
    "/oracoes",
    "/painel",
    "/perfil",
    "/permissoes",
    "/tesouraria",
    "/voluntariado",
  ];

  it.each(EXIGEM_CONTA)("mantém %s fora do buscador", (rota) => {
    expect(robots).toMatch(new RegExp(`^Disallow: ${rota}\\s*$`, "m"));
  });

  it("não bloqueia o que precisa ser encontrado", () => {
    const PRECISAM_APARECER = ["/casas", "/casa/", "/artigos", "/perguntas", "/jogos"];
    for (const rota of PRECISAM_APARECER) {
      expect(robots).not.toMatch(new RegExp(`^Disallow: ${rota}\\s*$`, "m"));
    }
  });

  it("cobre toda rota pública que existe no projeto", () => {
    // A varredura acusa uma tela nova que ninguém classificou: ou ela é pública
    // e entra na lista de páginas com canônico, ou exige conta e entra no
    // Disallow. O que não pode é ficar sem decisão, que é como as onze telas da
    // comunidade ficaram abertas ao robô por dias.
    const arquivos = readdirSync(ROTAS)
      .filter((n) => n.endsWith(".tsx") && !n.startsWith("__"))
      .map((n) => n.replace(/\.tsx$/, ""));

    // Telas de fluxo de entrada e de edição: já tratadas, e não são vitrine.
    const JA_TRATADAS = [
      "login",
      "nova-senha",
      "completar-perfil",
      "configurar-memoria",
      "mensagem-do-dia",
      "radio",
      "ajuda",
      "apresentacoes.index",
      "apresentar.$id",
      "ao-vivo.index",
      "ao-vivo.$codigo",
      "apresentacoes.$id",
      "artigos.meus",
      "artigos.novo",
      "artigos.$slug.editar",
      "index",
    ];

    const naoClassificadas = arquivos.filter((nome) => {
      if (JA_TRATADAS.includes(nome)) return false;
      const primeiroSegmento = "/" + nome.split(".")[0];
      const bloqueada = new RegExp(`^Disallow: ${primeiroSegmento}\\s*$`, "m").test(robots);
      const publica = PUBLICAS_CONHECIDAS.some((p) => p === nome || p.startsWith(nome + "."));
      return !bloqueada && !publica;
    });

    expect(
      naoClassificadas,
      "Estas telas não foram classificadas: decida se são públicas (e então " +
        "declaram cabeçalho e canônico) ou se exigem conta (e então entram no " +
        "Disallow do robots.txt).",
    ).toEqual([]);
  });
});

/** Espelha a lista do bloco de canônico, para a varredura acima poder consultá-la. */
const PUBLICAS_CONHECIDAS = [
  "index",
  "casas",
  "casas.index",
  "casas.$uf",
  "casas.$uf.index",
  "casas.$uf.$cidade",
  "artigos",
  "artigos.index",
  "artigos.$slug",
  "perguntas",
  "perguntas.index",
  "perguntas.$slug",
  "feb",
  "musicas-cifras",
  "transparencia",
  "sugestoes",
  "jogos",
];

describe("paginaPublica", () => {
  const dados = {
    titulo: "Casas espíritas em Campinas, SP",
    descricao: "12 casas espíritas em Campinas: endereço, telefone e como chegar.",
    url: `${SITE}/casas/sp/campinas`,
  };

  it("declara um único canônico, e é o da própria página", () => {
    const { links } = paginaPublica(dados);
    expect(links).toEqual([{ rel: "canonical", href: dados.url }]);
  });

  it("assina o título sem repetir a assinatura", () => {
    const uma = paginaPublica(dados).meta.find((m) => "title" in m) as { title: string };
    expect(uma.title).toBe("Casas espíritas em Campinas, SP — Apoio Espírita");

    const jaAssinado = paginaPublica({ ...dados, titulo: "Ajuda — Apoio Espírita" }).meta.find(
      (m) => "title" in m,
    ) as { title: string };
    expect(jaAssinado.title).toBe("Ajuda — Apoio Espírita");
  });

  it("leva imagem de compartilhamento em toda página", () => {
    const meta = paginaPublica(dados).meta;
    expect(meta).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ property: "og:image" }),
        expect.objectContaining({ name: "twitter:image" }),
      ]),
    );
  });

  it("respeita o pedido de ficar fora dos buscadores", () => {
    const meta = paginaPublica({ ...dados, indexavel: false }).meta;
    expect(meta).toEqual(
      expect.arrayContaining([{ name: "robots", content: "noindex, follow" }]),
    );
  });
});

describe("migalhas", () => {
  it("monta a trilha com endereços absolutos e em ordem", () => {
    const ld = JSON.parse(
      migalhas([
        { nome: "Casas espíritas", caminho: "/casas" },
        { nome: "SP", caminho: "/casas/sp" },
      ]).children,
    );
    expect(ld["@type"]).toBe("BreadcrumbList");
    expect(ld.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "Casas espíritas", item: `${SITE}/casas` },
      { "@type": "ListItem", position: 2, name: "SP", item: `${SITE}/casas/sp` },
    ]);
  });
});

describe("resumir", () => {
  it("não mexe no que já cabe", () => {
    expect(resumir("Uma frase curta.")).toBe("Uma frase curta.");
  });

  it("corta em palavra inteira e sem pontuação solta no fim", () => {
    const texto = "palavra ".repeat(40).trim();
    const curto = resumir(texto);
    expect(curto.length).toBeLessThanOrEqual(158);
    expect(curto.endsWith("palavra")).toBe(true);
  });

  it("junta quebras de linha, que o buscador mostra como espaço", () => {
    expect(resumir("Uma linha.\n\n  Outra linha.")).toBe("Uma linha. Outra linha.");
  });
});
