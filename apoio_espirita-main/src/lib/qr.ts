/**
 * Gerador de QR Code — usado para o pagamento por PIX do Bazar On-line.
 *
 * Por que escrito aqui, e não trazido de uma biblioteca: o código que aparece
 * na tela carrega a chave PIX de quem está recebendo o dinheiro. Uma
 * dependência de terceiros nesse caminho é uma peça que pode ser trocada sem
 * ninguém perceber e que passa a decidir o que a pessoa vai pagar. O algoritmo
 * é público (ISO/IEC 18004) e cabe em um arquivo; a correção fica provada em
 * `qr.test.ts`, que desenha o código e o LÊ DE VOLTA com um decodificador
 * independente, conferindo que o texto lido é exatamente o texto enviado.
 *
 * Implementa o modo binário (8 bits) com correção de erros nível M, versões 1 a
 * 15 — de sobra para um BR Code, que raramente passa de 200 caracteres.
 */

/* ── Tabelas do padrão ─────────────────────────────────────────────────────
 * Para cada versão (1 a 15), no nível de correção M:
 *   [códigos de correção por bloco, blocos do grupo 1, dados por bloco do
 *    grupo 1, blocos do grupo 2, dados por bloco do grupo 2]
 */
const BLOCOS_M: [number, number, number, number, number][] = [
  [10, 1, 16, 0, 0],
  [16, 1, 28, 0, 0],
  [26, 1, 44, 0, 0],
  [18, 2, 32, 0, 0],
  [24, 2, 43, 0, 0],
  [16, 4, 27, 0, 0],
  [18, 4, 31, 0, 0],
  [22, 2, 38, 2, 39],
  [22, 3, 36, 2, 37],
  [26, 4, 43, 1, 44],
  [30, 1, 50, 4, 51],
  [22, 6, 36, 2, 37],
  [22, 8, 37, 1, 38],
  [24, 4, 40, 5, 41],
  [24, 5, 41, 5, 42],
];

/** Centros dos padrões de alinhamento, por versão (a versão 1 não tem). */
const ALINHAMENTO: number[][] = [
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50],
  [6, 30, 54],
  [6, 32, 58],
  [6, 34, 62],
  [6, 26, 46, 66],
  [6, 26, 48, 70],
];

/** Bits que sobram depois dos códigos, e que o padrão manda preencher com zero. */
function bitsRestantes(versao: number): number {
  if (versao === 1) return 0;
  if (versao <= 6) return 7;
  if (versao <= 13) return 0;
  return 3;
}

function dadosPorVersao(versao: number): number {
  const [, b1, d1, b2, d2] = BLOCOS_M[versao - 1];
  return b1 * d1 + b2 * d2;
}

/* ── Aritmética de Galois (GF(256)), usada pela correção de erros ────────── */

const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d; // polinômio gerador do padrão
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
})();

function multiplicar(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return EXP[LOG[a] + LOG[b]];
}

/** Polinômio gerador de grau `grau`, para a correção de Reed-Solomon. */
function gerador(grau: number): number[] {
  let poli = [1];
  for (let i = 0; i < grau; i++) {
    const novo = new Array(poli.length + 1).fill(0);
    for (let j = 0; j < poli.length; j++) {
      novo[j] ^= poli[j];
      novo[j + 1] ^= multiplicar(poli[j], EXP[i]);
    }
    poli = novo;
  }
  return poli;
}

/** Códigos de correção de um bloco de dados. */
function correcao(dados: number[], quantidade: number): number[] {
  const g = gerador(quantidade);
  const resto = new Array(quantidade).fill(0);
  for (const byte of dados) {
    const fator = byte ^ resto[0];
    resto.shift();
    resto.push(0);
    if (fator !== 0) {
      for (let i = 0; i < quantidade; i++) {
        resto[i] ^= multiplicar(g[i + 1], fator);
      }
    }
  }
  return resto;
}

/* ── Informação de formato e de versão (correção BCH) ────────────────────── */

/** 15 bits: nível de correção M (10) + máscara, protegidos por BCH. */
function bitsDeFormato(mascara: number): number {
  const dados = (0b00 << 3) | mascara; // 00 = nível M
  let resto = dados << 10;
  for (let i = 14; i >= 10; i--) {
    if (resto & (1 << i)) resto ^= 0b10100110111 << (i - 10);
  }
  return ((dados << 10) | resto) ^ 0b101010000010010;
}

/** 18 bits com o número da versão, presentes apenas da versão 7 em diante. */
function bitsDeVersao(versao: number): number {
  let resto = versao << 12;
  for (let i = 17; i >= 12; i--) {
    if (resto & (1 << i)) resto ^= 0b1111100100101 << (i - 12);
  }
  return (versao << 12) | resto;
}

/* ── Montagem ─────────────────────────────────────────────────────────────── */

type Matriz = (boolean | null)[][];

function novaMatriz(tamanho: number): Matriz {
  return Array.from({ length: tamanho }, () => new Array(tamanho).fill(null));
}

function desenharFixos(m: Matriz, versao: number): void {
  const n = m.length;

  const finder = (linha: number, coluna: number) => {
    for (let i = -1; i <= 7; i++) {
      for (let j = -1; j <= 7; j++) {
        const y = linha + i;
        const x = coluna + j;
        if (y < 0 || y >= n || x < 0 || x >= n) continue;
        // Fora da moldura de 7x7 fica a faixa branca que separa o localizador
        // do resto do código. Sem essa conferência, a faixa era pintada de
        // preto sempre que caía na linha ou na coluna do quadrado.
        const dentro = i >= 0 && i <= 6 && j >= 0 && j <= 6;
        const borda = i === 0 || i === 6 || j === 0 || j === 6;
        const centro = i >= 2 && i <= 4 && j >= 2 && j <= 4;
        m[y][x] = dentro && (borda || centro);
      }
    }
  };
  finder(0, 0);
  finder(0, n - 7);
  finder(n - 7, 0);

  // Linhas de tempo
  for (let i = 8; i < n - 8; i++) {
    m[6][i] = i % 2 === 0;
    m[i][6] = i % 2 === 0;
  }

  // Padrões de alinhamento (não podem encostar nos localizadores)
  const centros = ALINHAMENTO[versao - 1];
  for (const linha of centros) {
    for (const coluna of centros) {
      const encostaNoFinder =
        (linha <= 8 && coluna <= 8) ||
        (linha <= 8 && coluna >= n - 9) ||
        (linha >= n - 9 && coluna <= 8);
      if (encostaNoFinder) continue;
      for (let i = -2; i <= 2; i++) {
        for (let j = -2; j <= 2; j++) {
          m[linha + i][coluna + j] = Math.max(Math.abs(i), Math.abs(j)) !== 1;
        }
      }
    }
  }

  // Módulo sempre escuro
  m[n - 8][8] = true;

  // Espaço reservado para a informação de formato
  for (let i = 0; i < 9; i++) {
    if (m[8][i] === null) m[8][i] = false;
    if (m[i][8] === null) m[i][8] = false;
  }
  for (let i = 0; i < 8; i++) {
    if (m[8][n - 1 - i] === null) m[8][n - 1 - i] = false;
    if (m[n - 1 - i][8] === null) m[n - 1 - i][8] = false;
  }

  // Espaço reservado para a informação de versão
  if (versao >= 7) {
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 3; j++) {
        m[n - 11 + j][i] = false;
        m[i][n - 11 + j] = false;
      }
    }
  }
}

/** Marca quais posições são de função (não recebem dados nem máscara). */
function mapaDeFuncao(versao: number, tamanho: number): boolean[][] {
  const molde = novaMatriz(tamanho);
  desenharFixos(molde, versao);
  return molde.map((linha) => linha.map((c) => c !== null));
}

function colocarDados(m: Matriz, funcao: boolean[][], bits: number[]): void {
  const n = m.length;
  let indice = 0;
  let subindo = true;
  for (let colunaDireita = n - 1; colunaDireita > 0; colunaDireita -= 2) {
    if (colunaDireita === 6) colunaDireita--; // a coluna de tempo é pulada
    for (let passo = 0; passo < n; passo++) {
      const linha = subindo ? n - 1 - passo : passo;
      for (const coluna of [colunaDireita, colunaDireita - 1]) {
        if (funcao[linha][coluna]) continue;
        m[linha][coluna] = indice < bits.length ? bits[indice] === 1 : false;
        indice++;
      }
    }
    subindo = !subindo;
  }
}

function aplicarMascara(m: Matriz, funcao: boolean[][], mascara: number): void {
  const n = m.length;
  for (let linha = 0; linha < n; linha++) {
    for (let coluna = 0; coluna < n; coluna++) {
      if (funcao[linha][coluna]) continue;
      let inverter = false;
      switch (mascara) {
        case 0:
          inverter = (linha + coluna) % 2 === 0;
          break;
        case 1:
          inverter = linha % 2 === 0;
          break;
        case 2:
          inverter = coluna % 3 === 0;
          break;
        case 3:
          inverter = (linha + coluna) % 3 === 0;
          break;
        case 4:
          inverter = (Math.floor(linha / 2) + Math.floor(coluna / 3)) % 2 === 0;
          break;
        case 5:
          inverter = ((linha * coluna) % 2) + ((linha * coluna) % 3) === 0;
          break;
        case 6:
          inverter = (((linha * coluna) % 2) + ((linha * coluna) % 3)) % 2 === 0;
          break;
        default:
          inverter = (((linha + coluna) % 2) + ((linha * coluna) % 3)) % 2 === 0;
          break;
      }
      if (inverter) m[linha][coluna] = !m[linha][coluna];
    }
  }
}

function escreverFormato(m: Matriz, mascara: number): void {
  const n = m.length;
  const bits = bitsDeFormato(mascara);
  // A ordem abaixo é a do padrão, e a leitura é por COLUNA na primeira metade.
  // Escrever linha e coluna trocadas gera um código de aparência perfeita que
  // nenhum leitor abre — o desenho fica certo e a etiqueta que diz qual máscara
  // foi usada, errada.
  for (let i = 0; i < 15; i++) {
    const bit = ((bits >> i) & 1) === 1;
    // Cópia junto ao localizador superior esquerdo
    if (i < 6) m[i][8] = bit;
    else if (i === 6) m[7][8] = bit;
    else if (i === 7) m[8][8] = bit;
    else if (i === 8) m[8][7] = bit;
    else m[8][14 - i] = bit;
    // Segunda cópia, para o código continuar legível se a primeira for danificada
    if (i < 8) m[8][n - 1 - i] = bit;
    else m[n - 15 + i][8] = bit;
  }
}

function escreverVersao(m: Matriz, versao: number): void {
  if (versao < 7) return;
  const n = m.length;
  const bits = bitsDeVersao(versao);
  for (let i = 0; i < 18; i++) {
    const bit = ((bits >> i) & 1) === 1;
    const linha = Math.floor(i / 3);
    const coluna = i % 3;
    m[n - 11 + coluna][linha] = bit;
    m[linha][n - 11 + coluna] = bit;
  }
}

/** Penalidades do padrão: quanto menor, mais fácil o leitor enxerga o código. */
function penalidade(m: Matriz): number {
  const n = m.length;
  const em = (l: number, c: number) => m[l][c] === true;
  let total = 0;

  // Regra 1: sequências de cinco ou mais módulos iguais
  for (let i = 0; i < n; i++) {
    for (const porLinha of [true, false]) {
      let repetidos = 1;
      for (let j = 1; j < n; j++) {
        const atual = porLinha ? em(i, j) : em(j, i);
        const anterior = porLinha ? em(i, j - 1) : em(j - 1, i);
        if (atual === anterior) {
          repetidos++;
        } else {
          if (repetidos >= 5) total += 3 + (repetidos - 5);
          repetidos = 1;
        }
      }
      if (repetidos >= 5) total += 3 + (repetidos - 5);
    }
  }

  // Regra 2: blocos 2x2 da mesma cor
  for (let l = 0; l < n - 1; l++) {
    for (let c = 0; c < n - 1; c++) {
      const a = em(l, c);
      if (a === em(l, c + 1) && a === em(l + 1, c) && a === em(l + 1, c + 1)) total += 3;
    }
  }

  // Regra 3: desenho parecido com o localizador
  const alvo1 = [true, false, true, true, true, false, true, false, false, false, false];
  const alvo2 = [false, false, false, false, true, false, true, true, true, false, true];
  const confere = (seq: boolean[], alvo: boolean[]) => seq.every((v, i) => v === alvo[i]);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= n - 11; j++) {
      const linha = Array.from({ length: 11 }, (_, k) => em(i, j + k));
      const coluna = Array.from({ length: 11 }, (_, k) => em(j + k, i));
      if (confere(linha, alvo1) || confere(linha, alvo2)) total += 40;
      if (confere(coluna, alvo1) || confere(coluna, alvo2)) total += 40;
    }
  }

  // Regra 4: desequilíbrio entre claros e escuros
  let escuros = 0;
  for (let l = 0; l < n; l++) for (let c = 0; c < n; c++) if (em(l, c)) escuros++;
  const porcentagem = (escuros * 100) / (n * n);
  total += Math.floor(Math.abs(porcentagem - 50) / 5) * 10;

  return total;
}

/**
 * Devolve a matriz do QR Code: `true` é módulo escuro.
 * Lança se o texto não couber nas versões implementadas.
 */
export function matrizQR(texto: string): boolean[][] {
  const dados = Array.from(new TextEncoder().encode(texto));

  let versao = 0;
  for (let v = 1; v <= 15; v++) {
    const bitsContagem = v <= 9 ? 8 : 16;
    const cabem = Math.floor((dadosPorVersao(v) * 8 - 4 - bitsContagem) / 8);
    if (dados.length <= cabem) {
      versao = v;
      break;
    }
  }
  if (versao === 0) {
    throw new Error("Texto longo demais para gerar o QR Code.");
  }

  const bitsContagem = versao <= 9 ? 8 : 16;
  const bits: number[] = [];
  const empurrar = (valor: number, quantidade: number) => {
    for (let i = quantidade - 1; i >= 0; i--) bits.push((valor >> i) & 1);
  };

  empurrar(0b0100, 4); // modo binário
  empurrar(dados.length, bitsContagem);
  for (const byte of dados) empurrar(byte, 8);

  const totalDados = dadosPorVersao(versao) * 8;
  empurrar(0, Math.min(4, totalDados - bits.length)); // terminador
  while (bits.length % 8 !== 0) bits.push(0);
  const preenchimento = [0xec, 0x11];
  let i = 0;
  while (bits.length < totalDados) empurrar(preenchimento[i++ % 2], 8);

  // Bits viram códigos, os códigos viram blocos, cada bloco ganha correção
  const codigos: number[] = [];
  for (let k = 0; k < bits.length; k += 8) {
    codigos.push(parseInt(bits.slice(k, k + 8).join(""), 2));
  }

  const [ecPorBloco, b1, d1, b2, d2] = BLOCOS_M[versao - 1];
  const blocosDados: number[][] = [];
  const blocosCorrecao: number[][] = [];
  let cursor = 0;
  for (let b = 0; b < b1 + b2; b++) {
    const tamanho = b < b1 ? d1 : d2;
    const bloco = codigos.slice(cursor, cursor + tamanho);
    cursor += tamanho;
    blocosDados.push(bloco);
    blocosCorrecao.push(correcao(bloco, ecPorBloco));
  }

  // Intercalação: os blocos são lidos coluna a coluna, não um depois do outro
  const finais: number[] = [];
  const maiorDado = Math.max(d1, d2);
  for (let k = 0; k < maiorDado; k++) {
    for (const bloco of blocosDados) if (k < bloco.length) finais.push(bloco[k]);
  }
  for (let k = 0; k < ecPorBloco; k++) {
    for (const bloco of blocosCorrecao) finais.push(bloco[k]);
  }

  const bitsFinais: number[] = [];
  for (const byte of finais) {
    for (let k = 7; k >= 0; k--) bitsFinais.push((byte >> k) & 1);
  }
  for (let k = 0; k < bitsRestantes(versao); k++) bitsFinais.push(0);

  const tamanho = versao * 4 + 17;
  const funcao = mapaDeFuncao(versao, tamanho);

  let melhor: Matriz | null = null;
  let melhorNota = Infinity;
  for (let mascara = 0; mascara < 8; mascara++) {
    const m = novaMatriz(tamanho);
    desenharFixos(m, versao);
    colocarDados(m, funcao, bitsFinais);
    aplicarMascara(m, funcao, mascara);
    escreverFormato(m, mascara);
    escreverVersao(m, versao);
    const nota = penalidade(m);
    if (nota < melhorNota) {
      melhorNota = nota;
      melhor = m;
    }
  }

  return (melhor as Matriz).map((linha) => linha.map((c) => c === true));
}

/**
 * Desenha o QR Code como SVG. Escolhi SVG e não imagem: fica nítido em
 * qualquer tamanho, imprime bem e não depende de canvas — que não existe
 * quando a página é montada no servidor.
 *
 * A margem clara de quatro módulos é exigência do padrão; sem ela, muitos
 * leitores não encontram o código.
 */
export function svgQR(texto: string, tamanho = 220): string {
  const m = matrizQR(texto);
  const margem = 4;
  const lado = m.length + margem * 2;
  const caminho: string[] = [];
  for (let linha = 0; linha < m.length; linha++) {
    for (let coluna = 0; coluna < m.length; coluna++) {
      if (m[linha][coluna]) caminho.push(`M${coluna + margem} ${linha + margem}h1v1h-1z`);
    }
  }
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${tamanho}" height="${tamanho}" viewBox="0 0 ${lado} ${lado}" shape-rendering="crispEdges" role="img" aria-label="QR Code do PIX">`,
    `<rect width="${lado}" height="${lado}" fill="#ffffff"/>`,
    `<path d="${caminho.join("")}" fill="#000000"/>`,
    `</svg>`,
  ].join("");
}
