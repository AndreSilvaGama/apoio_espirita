/**
 * Etiquetas de cabeçalho que decidem como o site aparece no Google e como um
 * link dele aparece quando alguém o compartilha no WhatsApp.
 *
 * Até aqui cada rota pública montava a própria lista de etiquetas à mão, e o
 * resultado foi o previsível: umas trazem `og:url`, outras não; umas trazem
 * `twitter:title`, outras não; e a página de casa — justamente a que a direção
 * compartilha com os frequentadores — não trazia nenhuma. Este módulo é a
 * fonte única dessas etiquetas.
 *
 * O que ele NÃO faz: não substitui as rotas que já estavam prontas e corretas.
 * Reescrever vinte cabeçalhos que funcionam para ganhar uniformidade não vale o
 * risco. Toda rota nova, e toda que eu precisar consertar, passa a usar isto.
 */

export const SITE = "https://apoioespirita.com.br";

/** A imagem que aparece no compartilhamento. Ver `scripts/gerar-og-image.mjs`. */
export const IMAGEM_PADRAO = `${SITE}/og-image.png`;

/** Assinatura no fim do título, no mesmo formato que o resto do site usa. */
const ASSINATURA = " — Apoio Espírita";

export interface DadosDaPagina {
  /** Sem a assinatura: ela é acrescentada aqui, se ainda não estiver no texto. */
  titulo: string;
  descricao: string;
  /** Endereço absoluto e canônico desta página, sem parâmetros de busca. */
  url: string;
  /** Imagem própria da página; na falta, a do site. */
  imagem?: string;
  /**
   * `false` mantém a página fora dos buscadores. Serve para tela de trabalho
   * interno que por algum motivo tenha endereço público.
   */
  indexavel?: boolean;
}

/**
 * Monta `meta` e `links` de uma página pública: título, descrição, o bloco do
 * WhatsApp/Facebook (`og:`), o do X (`twitter:`) e o endereço canônico.
 *
 * O canônico é o que diz ao Google qual é o endereço verdadeiro da página. Ele
 * mora aqui, e só aqui, porque duas etiquetas canônicas numa mesma página
 * fazem o Google descartar as duas — foi exatamente o que acontecia no site
 * até 31/08/2026, com o `__root.tsx` apontando todas as páginas para a inicial.
 */
export function paginaPublica({
  titulo,
  descricao,
  url,
  imagem = IMAGEM_PADRAO,
  indexavel = true,
}: DadosDaPagina) {
  const tituloCompleto = titulo.includes("Apoio Espírita") ? titulo : titulo + ASSINATURA;

  return {
    meta: [
      { title: tituloCompleto },
      { name: "description", content: descricao },
      {
        name: "robots",
        content: indexavel ? "index, follow" : "noindex, follow",
      },
      { property: "og:type", content: "website" },
      { property: "og:title", content: tituloCompleto },
      { property: "og:description", content: descricao },
      { property: "og:url", content: url },
      { property: "og:image", content: imagem },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: tituloCompleto },
      { name: "twitter:description", content: descricao },
      { name: "twitter:image", content: imagem },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}

/**
 * Trilha de navegação em JSON-LD.
 *
 * É o que faz o Google trocar, no resultado da busca, a linha crua de endereço
 * por "Apoio Espírita › Casas espíritas › São Paulo › Campinas". Não muda a
 * posição, muda a aparência — e um resultado que se explica é mais clicado.
 */
export function migalhas(itens: { nome: string; caminho: string }[]) {
  return {
    type: "application/ld+json",
    children: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: itens.map((item, indice) => ({
        "@type": "ListItem",
        position: indice + 1,
        name: item.nome,
        item: SITE + item.caminho,
      })),
    }),
  };
}

/**
 * Corta um texto no limite que o Google mostra na descrição do resultado
 * (~160 caracteres), sem partir palavra no meio e sem cortar quando não
 * precisa. Descrição truncada com "..." pelo buscador parece descuido.
 */
export function resumir(texto: string, limite = 158): string {
  const limpo = texto.replace(/\s+/g, " ").trim();
  if (limpo.length <= limite) return limpo;
  const corte = limpo.slice(0, limite);
  const ultimoEspaco = corte.lastIndexOf(" ");
  return (ultimoEspaco > limite * 0.6 ? corte.slice(0, ultimoEspaco) : corte).replace(
    /[,;:.\s]+$/,
    "",
  );
}
