/**
 * Gera `public/sitemap.xml` a partir do que existe de verdade no banco.
 *
 * O mapa do site era um arquivo escrito à mão com doze endereços fixos, e por
 * isso não listava nenhuma casa espírita nem nenhum artigo — justamente o
 * conteúdo público que precisa ser encontrado. Este script roda antes de cada
 * build (veja o script `build` do package.json) e monta o mapa com:
 *
 *   · as telas públicas fixas;
 *   · o diretório de casas: /casas, cada estado e cada cidade;
 *   · as páginas de casa que a direção publicou;
 *   · os artigos publicados.
 *
 * Um artigo publicado depois do último build ainda é encontrado pelos
 * buscadores, porque a lista em /artigos leva até ele. O mapa apenas acelera.
 *
 * O script usa a chave pública (anon) e lê só o que qualquer visitante já pode
 * ler. Se o banco estiver fora do ar, ele não sobrescreve nada — o mapa anterior
 * continua valendo — e falha em voz alta, parando o build: publicar sem saber que
 * o mapa envelheceu é pior do que não publicar.
 */

import { createClient } from "@supabase/supabase-js";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const SITE = "https://apoioespirita.com.br";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? "https://kitmwxfwwujygcmdjngm.supabase.co";
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpdG13eGZ3d3VqeWdjbWRqbmdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjEwNTYsImV4cCI6MjA5NDA5NzA1Nn0.Er_7LFPyup8LjcFaGuIAKMHcIVzJfbU-ihVs_r-IkXE";

/** Telas públicas que não dependem do banco. */
const FIXAS = [
  { caminho: "/", prioridade: "1.0", frequencia: "weekly" },
  { caminho: "/casas", prioridade: "0.9", frequencia: "weekly" },
  { caminho: "/artigos", prioridade: "0.9", frequencia: "daily" },
  { caminho: "/feb", prioridade: "0.8", frequencia: "weekly" },
  { caminho: "/musicas-cifras", prioridade: "0.8", frequencia: "weekly" },
  { caminho: "/jogos", prioridade: "0.7", frequencia: "weekly" },
  { caminho: "/jogos/caca-palavras", prioridade: "0.6", frequencia: "monthly" },
  { caminho: "/jogos/plante-a-semente", prioridade: "0.6", frequencia: "monthly" },
  { caminho: "/jogos/memoria-evangelizacao", prioridade: "0.6", frequencia: "monthly" },
  { caminho: "/jogos/quiz-espirita", prioridade: "0.6", frequencia: "monthly" },
  { caminho: "/jogos/semeador-mensagens", prioridade: "0.6", frequencia: "monthly" },
  { caminho: "/jogos/caminho-da-luz", prioridade: "0.6", frequencia: "monthly" },
  { caminho: "/transparencia", prioridade: "0.5", frequencia: "monthly" },
  { caminho: "/sugestoes", prioridade: "0.4", frequencia: "monthly" },
];

function escapar(texto) {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function hoje() {
  return new Date().toISOString().slice(0, 10);
}

function url({ caminho, prioridade, frequencia, data }) {
  return [
    "  <url>",
    `    <loc>${escapar(SITE + caminho)}</loc>`,
    `    <lastmod>${data ?? hoje()}</lastmod>`,
    `    <changefreq>${frequencia}</changefreq>`,
    `    <priority>${prioridade}</priority>`,
    "  </url>",
  ].join("\n");
}

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
  });

  const enderecos = [...FIXAS];

  // ── Diretório de casas ────────────────────────────────────────────────
  const { data: estados, error: erroEstados } = await supabase.rpc("diretorio_estados");
  if (erroEstados) throw new Error("estados: " + erroEstados.message);

  for (const estado of estados ?? []) {
    const uf = String(estado.estado).toLowerCase();
    enderecos.push({ caminho: `/casas/${uf}`, prioridade: "0.8", frequencia: "weekly" });

    const { data: cidades, error: erroCidades } = await supabase.rpc("diretorio_cidades", {
      p_uf: estado.estado,
    });
    if (erroCidades) throw new Error(`cidades de ${estado.estado}: ` + erroCidades.message);

    for (const cidade of cidades ?? []) {
      enderecos.push({
        caminho: `/casas/${uf}/${cidade.slug}`,
        prioridade: "0.7",
        frequencia: "weekly",
      });
    }
  }

  // ── Páginas de casa publicadas ────────────────────────────────────────
  const { data: paginas, error: erroPaginas } = await supabase
    .from("paginas_casas")
    .select("sigla_casa, updated_at")
    .eq("publicada", true);
  if (erroPaginas) throw new Error("páginas de casa: " + erroPaginas.message);

  for (const pagina of paginas ?? []) {
    enderecos.push({
      caminho: `/casa/${pagina.sigla_casa}`,
      prioridade: "0.8",
      frequencia: "weekly",
      data: pagina.updated_at ? String(pagina.updated_at).slice(0, 10) : undefined,
    });
  }

  // ── Artigos publicados ────────────────────────────────────────────────
  // `indexavel` é a escolha do autor: quem pediu para ficar fora dos buscadores
  // não entra no mapa do site.
  const { data: artigos, error: erroArtigos } = await supabase
    .from("artigos_publicos")
    .select("slug, editado_em, publicado_em")
    .eq("estado", "publicado")
    .eq("indexavel", true);
  if (erroArtigos) throw new Error("artigos: " + erroArtigos.message);

  for (const artigo of artigos ?? []) {
    const data = artigo.editado_em ?? artigo.publicado_em;
    enderecos.push({
      caminho: `/artigos/${artigo.slug}`,
      prioridade: "0.7",
      frequencia: "monthly",
      data: data ? String(data).slice(0, 10) : undefined,
    });
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...enderecos.map(url),
    "</urlset>",
    "",
  ].join("\n");

  const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
  await writeFile(join(raiz, "public", "sitemap.xml"), xml, "utf8");

  console.log(`sitemap.xml gerado com ${enderecos.length} endereços.`);
}

main().catch((erro) => {
  // Mapa antigo continua valendo: melhor um mapa desatualizado do que um vazio.
  console.error("[sitemap] não foi possível gerar o mapa do site:", erro.message);
  console.error("[sitemap] o public/sitemap.xml anterior foi mantido.");
  process.exitCode = 1;
});
