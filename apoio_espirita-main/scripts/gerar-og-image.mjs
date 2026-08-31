/**
 * Gera `public/og-image.png` — a imagem que aparece quando alguém compartilha
 * um endereço do site no WhatsApp, no Facebook, no Telegram ou no X.
 *
 * Por que existe este script: o `__root.tsx` anunciava
 * `https://apoioespirita.com.br/og-image.png` em `og:image` e em
 * `twitter:image` desde sempre, mas o arquivo nunca foi criado — o endereço
 * respondia HTTP 404 (medido em 31/08/2026). O efeito prático é que TODO link
 * do site compartilhado em qualquer lugar aparecia sem imagem, e link sem
 * imagem é clicado muito menos. Como a divulgação da comunidade espírita
 * acontece principalmente por grupos de WhatsApp, esse 404 desperdiçava a
 * divulgação inteira, feita à mão, uma mensagem por vez.
 *
 * Rode à mão quando a marca ou a frase mudarem:
 *
 *     node scripts/gerar-og-image.mjs
 *
 * De propósito FORA do `build`: o desenho do texto depende das fontes
 * instaladas na máquina que gera, então rodar no computador de outra pessoa
 * produziria uma imagem diferente sem ninguém pedir. O PNG fica versionado no
 * repositório e é ele que vai ao ar.
 */

import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Medida que WhatsApp, Facebook, Telegram e X esperam. */
const LARGURA = 1200;
const ALTURA = 630;

/**
 * Fontes: só o que existe em qualquer Windows e macOS. A serifada carrega o
 * nome, no mesmo espírito da Libre Caslon do site; a sem serifa carrega o
 * resto. Nunca depender de fonte baixada — se faltar, o desenho quebra calado.
 */
const SERIFADA = "Georgia, 'Times New Roman', serif";
const SEM_SERIFA = "'Segoe UI', Tahoma, Verdana, sans-serif";

function escapar(texto) {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function main() {
  // A logomarca entra embutida: o librsvg que desenha o SVG não busca arquivo
  // externo por caminho relativo de forma confiável.
  const logo = await readFile(join(RAIZ, "public", "logomarca.png"));
  const logoBase64 = logo.toString("base64");

  const titulo = "Apoio Espírita";
  const frase = "Fora da caridade não há salvação";
  const linha = "Diretório nacional de casas espíritas · Estudo · Serviço";
  const endereco = "apoioespirita.com.br";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${LARGURA}" height="${ALTURA}" viewBox="0 0 ${LARGURA} ${ALTURA}">
  <defs>
    <!-- O mesmo azul profundo do tema escuro das telas públicas. -->
    <linearGradient id="fundo" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0b1030"/>
      <stop offset="55%" stop-color="#111a4a"/>
      <stop offset="100%" stop-color="#1b2a6b"/>
    </linearGradient>
    <!-- Clarão atrás da logomarca, lembrando a nebulosa da página inicial. -->
    <radialGradient id="clarao" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="#7fe3ff" stop-opacity="0.45"/>
      <stop offset="60%" stop-color="#4aa8ff" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#4aa8ff" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="risco" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#7fe3ff" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#7fe3ff" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <rect width="${LARGURA}" height="${ALTURA}" fill="url(#fundo)"/>

  <!-- Poeira de estrelas: pontos fixos, escolhidos à mão para não mudar a cada
       geração. Sorteio dentro do script daria uma imagem diferente por rodada. -->
  <g fill="#ffffff">
    <circle cx="96"  cy="88"  r="1.6" opacity="0.55"/>
    <circle cx="1063" cy="122" r="2.1" opacity="0.5"/>
    <circle cx="216" cy="536" r="1.4" opacity="0.4"/>
    <circle cx="1140" cy="470" r="1.7" opacity="0.45"/>
    <circle cx="640" cy="58"  r="1.2" opacity="0.35"/>
    <circle cx="382" cy="128" r="1.5" opacity="0.3"/>
    <circle cx="980" cy="588" r="1.3" opacity="0.35"/>
    <circle cx="60"  cy="330" r="1.8" opacity="0.3"/>
  </g>

  <ellipse cx="245" cy="315" rx="240" ry="240" fill="url(#clarao)"/>
  <image x="130" y="200" width="230" height="230"
         xlink:href="data:image/png;base64,${logoBase64}"/>

  <g>
    <text x="440" y="252" font-family="${SERIFADA}" font-size="82" font-weight="700" fill="#ffffff" letter-spacing="-1">${escapar(titulo)}</text>
    <rect x="442" y="286" width="300" height="3" fill="url(#risco)"/>
    <text x="440" y="352" font-family="${SERIFADA}" font-size="37" font-style="italic" fill="#bfe6ff">${escapar(frase)}</text>
    <text x="440" y="420" font-family="${SEM_SERIFA}" font-size="24" fill="#93a7d4">${escapar(linha)}</text>
    <text x="440" y="486" font-family="${SEM_SERIFA}" font-size="23" font-weight="600" fill="#7fe3ff" letter-spacing="1.5">${escapar(endereco)}</text>
  </g>

  <rect x="0" y="${ALTURA - 6}" width="${LARGURA}" height="6" fill="#7fe3ff" opacity="0.75"/>
</svg>`;

  const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
  const destino = join(RAIZ, "public", "og-image.png");
  await writeFile(destino, png);

  const { width, height } = await sharp(png).metadata();
  console.log(`og-image.png gerado: ${width}x${height}, ${(png.length / 1024).toFixed(1)} kB`);

  if (width !== LARGURA || height !== ALTURA) {
    throw new Error(`medida inesperada: ${width}x${height}`);
  }
}

main().catch((erro) => {
  console.error("[og-image] falhou:", erro.message);
  process.exitCode = 1;
});
