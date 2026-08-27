/**
 * Filtro de linguagem inadequada para conteúdo público.
 *
 * Só lógica pura: nada aqui consulta o banco. É usado antes de gravar
 * qualquer texto que outras pessoas vão ler — artigos, mensagem do dia,
 * publicações da casa, sugestões e solicitações.
 *
 * Duas decisões de projeto, ambas para não barrar texto legítimo:
 *
 * 1. A comparação é por PALAVRA INTEIRA, nunca por pedaço. "Assessor" contém
 *    "sses" e "cuidar" começa com "cu": filtro por trecho reprovaria os dois.
 *    Aqui a palavra do texto precisa ser o termo, ou o termo mais um sufixo
 *    conhecido do português ("merdas", "merdinha").
 *
 * 2. A lista tem apenas termos que são ofensa em qualquer contexto. Palavras
 *    de duplo sentido ficam de fora de propósito: num site espírita, barrar
 *    um texto correto custa mais do que deixar passar uma palavra dúbia — e
 *    a avaliação dos leitores e a moderação humana continuam existindo.
 *
 * O filtro reconhece as fugas comuns: acento, letra repetida ("poooorra"),
 * número no lugar de letra ("m3rda") e separador entre as letras ("m.e.r.d.a").
 * Ele não pretende ser inviolável — quem quiser burlar, burla. O objetivo é
 * impedir a ofensa acidental ou impulsiva de chegar ao público.
 */

/**
 * Termos bloqueados, em forma já normalizada (sem acento, minúsculas e sem
 * letras repetidas — ver `normalizar`). Palavrões, termos sexuais explícitos
 * e xingamentos discriminatórios.
 */
const TERMOS_BLOQUEADOS = [
  // Palavrões de uso geral
  "buceta",
  "caralho",
  "cacete",
  "cu",
  "cuzao",
  "cuzona",
  "foda",
  "foder",
  "fodase",
  "merda",
  "porra",
  "puta",
  "puto",
  "putaria",
  "piroca",
  "arrombado",
  "arrombada",
  "babaca",
  "bosta",
  "cretino",
  "cretina",
  "escroto",
  "escrota",
  "filho da puta",
  "fdp",
  "imbecil",
  "imbecis",
  "otario",
  "otaria",
  "pilantra",
  "safado",
  "safada",
  "vagabundo",
  "vagabunda",
  "corno",
  "corna",
  "canalha",
  "pau no cu",
  "tomar no cu",
  "vai se foder",
  "vsf",
  // Termos sexuais explícitos
  "boquete",
  "punheta",
  "siririca",
  "xoxota",
  // Xingamentos discriminatórios
  "viado",
  "baitola",
  "sapatao",
  "traveco",
  "crioulo",
  "preto imundo",
  "retardado",
  "retardada",
  "mongoloide",
];

/**
 * Rede de segurança: palavras corretas que a normalização deixa perto de um
 * termo da lista. Nenhuma delas é barrada pelas regras atuais — estão aqui
 * para que uma inclusão futura na lista não as derrube em silêncio.
 */
const PERMITIDAS = new Set([
  "cuidar",
  "cuidado",
  "cuidados",
  "cura",
  "curar",
  "custa",
  "culto",
  "cultivo",
  "porao",
  "poro",
  "poros",
  "corneta",
  "cornea",
  "bicho",
  "bichinho",
  "putativo",
]);

/**
 * Sufixos aceitos logo depois do termo inteiro: "merdas", "cus".
 * Deliberadamente curto. Cada sufixo a mais é uma palavra correta a menos:
 * com "o" na lista, "porão" (por-a + o, depois de normalizado) cairia junto
 * com "porra".
 */
const SUFIXOS_DIRETOS = ["", "s", "es"];

/**
 * Sufixos aceitos sobre o radical — o termo sem a vogal final —, para pegar
 * o diminutivo: "safadinho", "merdinha". Só diminutivos: o aumentativo "ao"
 * transformaria "porra" em "porão" e as terminações de gênero ("o"/"a")
 * transformariam um termo no seu homônimo inocente. Quando as duas formas de
 * gênero ofendem, as duas estão escritas na lista.
 */
const SUFIXOS_RADICAL = ["inho", "inha", "inhos", "inhas", "zinho", "zinha"];

/** Números e símbolos usados no lugar de letras. */
const SUBSTITUICOES: Record<string, string> = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "@": "a",
  $: "s",
  "!": "i",
};

/**
 * Deixa o texto na forma comparável: minúsculas, sem acento, com número
 * trocado pela letra correspondente e sem letra repetida em sequência.
 */
export function normalizar(texto: string): string {
  const semAcento = texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

  const semLeet = semAcento.replace(/[013457@$!]/g, (c) => SUBSTITUICOES[c] ?? c);

  // "poooorra" → "porra"; "carro" → "caro" (a lista também vem colapsada)
  return semLeet.replace(/(.)\1+/g, "$1");
}

/** Termos comparáveis, calculados uma vez. */
const TERMOS_NORMALIZADOS = TERMOS_BLOQUEADOS.map(normalizar);

/** Termos de uma palavra só, para a comparação palavra a palavra. */
const TERMOS_SIMPLES = TERMOS_NORMALIZADOS.filter((t) => !t.includes(" "));

/** Expressões de mais de uma palavra ("filho da puta"), comparadas na frase. */
const TERMOS_COMPOSTOS = TERMOS_NORMALIZADOS.filter((t) => t.includes(" "));

/**
 * Termos longos o bastante para serem procurados com separador entre as
 * letras ("m.e.r.d.a"). Termos curtos ficam de fora: "c u" apareceria por
 * acidente no meio de qualquer frase.
 */
const TERMOS_ESPACADOS = TERMOS_SIMPLES.filter((t) => t.length >= 5);

function palavraBloqueada(palavra: string): string | null {
  if (PERMITIDAS.has(palavra)) return null;

  for (const termo of TERMOS_SIMPLES) {
    if (palavra.startsWith(termo)) {
      const resto = palavra.slice(termo.length);
      if (SUFIXOS_DIRETOS.includes(resto)) return termo;
    }

    // "safadinho" perde a vogal final de "safado" antes do diminutivo
    if (!/[ao]$/.test(termo)) continue;
    const radical = termo.slice(0, -1);
    if (!palavra.startsWith(radical)) continue;
    if (SUFIXOS_RADICAL.includes(palavra.slice(radical.length))) return termo;
  }

  return null;
}

/**
 * Procura o termo escrito com separador entre as letras. Exige limite de
 * palavra dos dois lados para não emendar o fim de uma palavra com o começo
 * da seguinte.
 */
function espacadoBloqueado(normalizado: string): string | null {
  for (const termo of TERMOS_ESPACADOS) {
    const meio = termo.split("").join("[^a-z0-9]{1,2}");
    const re = new RegExp(`(?:^|[^a-z0-9])${meio}(?:$|[^a-z0-9])`);
    if (re.test(normalizado)) return termo;
  }
  return null;
}

/**
 * Devolve o primeiro termo inadequado encontrado, ou `null` quando o texto
 * está limpo. Devolver o termo permite dizer ao autor exatamente o que
 * precisa reescrever.
 */
export function termoInadequado(texto: string): string | null {
  if (!texto) return null;
  const normalizado = normalizar(texto);

  for (const termo of TERMOS_COMPOSTOS) {
    if (normalizado.includes(termo)) return termo;
  }

  for (const palavra of normalizado.split(/[^a-z0-9]+/)) {
    if (!palavra) continue;
    const encontrado = palavraBloqueada(palavra);
    if (encontrado) return encontrado;
  }

  return espacadoBloqueado(normalizado);
}

/** Atalho para quem só precisa saber se pode publicar. */
export function temLinguagemInadequada(texto: string): boolean {
  return termoInadequado(texto) !== null;
}

/**
 * Mensagem pronta para a tela, ou `null` quando todos os trechos estão
 * limpos. Recebe os trechos na ordem em que aparecem no formulário.
 */
export function validarLinguagem(...trechos: (string | null | undefined)[]): string | null {
  for (const trecho of trechos) {
    const termo = termoInadequado(trecho ?? "");
    if (termo) {
      return `O texto contém uma palavra inadequada para uma publicação pública ("${termo}"). Reescreva o trecho com fraternidade antes de enviar.`;
    }
  }
  return null;
}
