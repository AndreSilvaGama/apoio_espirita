import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Resolvendo __dirname para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminhos das pastas
const ROOT_DIR = path.resolve(__dirname, "..");
const SOURCE_DIR = path.join(ROOT_DIR, "biblioteca");
const DEST_DIR = path.join(ROOT_DIR, "public", "biblioteca");
const OUTPUT_FILE = path.join(ROOT_DIR, "src", "data", "biblioteca-books.json");

// Dicionário rico com dados reais das 24 obras padrão
const LIVROS_DICIONARIO = {
  "01-parnasodealemtumulo": {
    titulo: "Parnaso de Além-Túmulo",
    autorEspiritual: "Espíritos Diversos",
    categoria: "Poesia / Crônica",
    ano: 1932,
    descricao: "A primeira obra psicografada por Chico Xavier. Reúne poemas extraordinários ditados por grandes poetas falecidos da língua portuguesa, atestando a imortalidade da alma."
  },
  "02-cartasdeumamorta": {
    titulo: "Cartas de uma Morta",
    autorEspiritual: "Maria João de Deus",
    categoria: "Mensagens / Diversos",
    ano: 1935,
    descricao: "Coletânea de cartas consoladoras e esclarecedoras da mãe de Chico Xavier, narrando com afeto e delicadeza suas primeiras impressões da vida no plano espiritual."
  },
  "03-palavras-do-infinito": {
    titulo: "Palavras do Infinito",
    autorEspiritual: "Espíritos Diversos",
    categoria: "Mensagens / Diversos",
    ano: 1936,
    descricao: "Valiosas páginas de instrução moral e consolação recebidas de variados mentores espirituais, estimulando o autoaperfeiçoamento à luz do Cristo."
  },
  "04-cronicasdealemturmulo": {
    titulo: "Crônicas de Além-Túmulo",
    autorEspiritual: "Humberto de Campos",
    categoria: "Poesia / Crônica",
    ano: 1937,
    descricao: "Crônicas tocantes de Humberto de Campos no plano espiritual, analisando as fraquezas humanas e a grandeza das leis divinas com sensibilidade ímpar."
  },
  "05-emmanuel": {
    titulo: "Emmanuel",
    autorEspiritual: "Emmanuel",
    categoria: "Estudos / Dissertações",
    ano: 1938,
    descricao: "Estudos e dissertações profundas sobre ciência, filosofia, história e religião conduzidas pelo benfeitor espiritual Emmanuel."
  },
  "06-brasil_coracao_do_mundo_patria_do_evangelho": {
    titulo: "Brasil, Coração do Mundo, Pátria do Evangelho",
    autorEspiritual: "Humberto de Campos",
    categoria: "Mensagens / Diversos",
    ano: 1938,
    descricao: "Revelação fascinante sobre a missão espiritual e o destino transcendente do Brasil como polo difusor da mensagem evangélica para a humanidade."
  },
  "07-lira_imortal": {
    titulo: "Lira Imortal",
    autorEspiritual: "Espíritos Diversos",
    categoria: "Poesia / Crônica",
    ano: 1938,
    descricao: "Belo relicário poético estruturado por poetas consagrados que prosseguem cantando o amor, a natureza e as sublimes verdades da vida espiritual."
  },
  "08-acaminhodaluz": {
    titulo: "A Caminho da Luz",
    autorEspiritual: "Emmanuel",
    categoria: "Romance Histórico",
    ano: 1939,
    descricao: "A extraordinária história da evolução humana sob o olhar compassivo do Cristo Jesus. Um farol que esclarece os fatos históricos sob a ótica espiritual."
  },
  "09-novasmensagens": {
    titulo: "Novas Mensagens",
    autorEspiritual: "Humberto de Campos",
    categoria: "Mensagens / Diversos",
    ano: 1940,
    descricao: "Mais um conjunto de ensinamentos proveitosos voltados para a renovação íntima e o despertamento espiritual do trabalhador cristão."
  },
  "10-ha2000anos": {
    titulo: "Há 2000 Anos",
    autorEspiritual: "Emmanuel",
    categoria: "Romance Histórico",
    ano: 1939,
    descricao: "Inesquecível romance histórico narrando a encarnação do senador romano Publius Lentulus na época do Cristo. Uma obra clássica de renúncia, fé e amor."
  },
  "11-50anosdepois": {
    titulo: "50 Anos Depois",
    autorEspiritual: "Emmanuel",
    categoria: "Romance Histórico",
    ano: 1940,
    descricao: "A tocante continuação de 'Há 2000 Anos', retratando a reencarnação do senador Publius Lentulus sob as vestes de Nestório, um humilde escravo cristão."
  },
  "12-cartasdoevangelho": {
    titulo: "Cartas do Evangelho",
    autorEspiritual: "Casimiro Cunha",
    categoria: "Poesia / Crônica",
    ano: 1941,
    descricao: "Versos simples, cativantes e de profunda beleza espiritual, comentando lições eternas do Evangelho para o nosso aprimoramento moral diário."
  },
  "13-oconsolador": {
    titulo: "O Consolador",
    autorEspiritual: "Emmanuel",
    categoria: "Estudos / Dissertações",
    ano: 1941,
    descricao: "Uma obra indispensável que oferece esclarecimento seguro para a mente e consolo doce para o coração em 411 respostas profundas formuladas por Emmanuel."
  },
  "14-boanova": {
    titulo: "Boa Nova",
    autorEspiritual: "Humberto de Campos",
    categoria: "Mensagens / Diversos",
    ano: 1941,
    descricao: "Belíssimas narrativas que reconstituem episódios marcantes da vida e pregação de Jesus com Seus apóstolos, ressaltando o espírito amoroso do Evangelho."
  },
  "15-pauloeestevao": {
    titulo: "Paulo e Estêvão",
    autorEspiritual: "Emmanuel",
    categoria: "Romance Histórico",
    ano: 1941,
    descricao: "Soberbo painel histórico-espiritual que reconstitui a saga gloriosa do Apóstolo Paulo de Tarso sob a inspiradora e constante influência do mártir Estêvão."
  },
  "16-renuncia": {
    titulo: "Renúncia",
    autorEspiritual: "Emmanuel",
    categoria: "Romance Histórico",
    ano: 1944,
    descricao: "Sublime história de amor, sacrifício e profunda renúncia espiritual, retratando a encarnação de Alcíone para salvar e guiar seu companheiro de outrora."
  },
  "17-reportagensdealemtumulo": {
    titulo: "Reportagens de Além-Túmulo",
    autorEspiritual: "Humberto de Campos",
    categoria: "Mensagens / Diversos",
    ano: 1943,
    descricao: "Mensagens instigantes e reportagens do plano espiritual que descortinam a ilusão da matéria e a verdade da existência imperecível da alma."
  },
  "18-cartilhadanatureza": {
    titulo: "Cartilha da Natureza",
    autorEspiritual: "Casimiro Cunha",
    categoria: "Poesia / Crônica",
    ano: 1944,
    descricao: "Páginas repletas de doçura e sabedoria infantil e lúdica, apresentando a simplicidade das trovas poéticas para instruir as almas no caminho do bem."
  },
  "19-nossolar": {
    titulo: "Nosso Lar",
    autorEspiritual: "André Luiz",
    categoria: "Vida no Mundo Espiritual",
    ano: 1944,
    descricao: "A célebre obra que descortina a jornada de André Luiz na pátria espiritual, narrando com riqueza de detalhes a vida e as tarefas na colônia de regeneração Nosso Lar."
  },
  "20-osmensageiros": {
    titulo: "Os Mensageiros",
    autorEspiritual: "André Luiz",
    categoria: "Vida no Mundo Espiritual",
    ano: 1944,
    descricao: "André Luiz revela o trabalho incessante de socorro espiritual e a preparação dos espíritos mensageiros antes de retornar à crosta física."
  },
  "21-missionariosdaluz": {
    titulo: "Missionários da Luz",
    autorEspiritual: "André Luiz",
    categoria: "Vida no Mundo Espiritual",
    ano: 1945,
    descricao: "Um estudo fascinante sobre a mediunidade, o planejamento de reencarnações e o amparo espiritual dispensado nas transições do plano físico para o extrafísico."
  },
  "22-coletaneasdoalem": {
    titulo: "Coletâneas do Além",
    autorEspiritual: "Espíritos Diversos",
    categoria: "Mensagens / Diversos",
    ano: 1945,
    descricao: "Diversos ensinamentos fraternos focados no consolo moral, no reerguimento da alma e na compreensão do sofrimento à luz da imortalidade."
  },
  "23-lazaroredivivo": {
    titulo: "Lázaro Redivivo",
    autorEspiritual: "Irmão X",
    categoria: "Mensagens / Diversos",
    ano: 1945,
    descricao: "Humor fino, observação profunda e agudeza espiritual por Humberto de Campos (Irmão X), despertando-nos para a vivência integral da caridade cristã."
  },
  "24-obreirosdavidaeterna": {
    titulo: "Obreiros da Vida Eterna",
    autorEspiritual: "André Luiz",
    categoria: "Vida no Mundo Espiritual",
    ano: 1946,
    descricao: "Sublimes ensinamentos e descrições do plano espiritual sobre a transição do corpo de carne para a pátria espiritual de devotados seareiros."
  },
  "25-ocaminhooculto": {
    titulo: "O Caminho Oculto",
    autorEspiritual: "Emmanuel",
    categoria: "Estudos / Dissertações",
    ano: 1947,
    descricao: "Preciosas lições morais comentadas por Emmanuel, nos direcionando no caminho silencioso da fé viva e do crescimento individual perante Deus."
  },
  "237-humorismo-no-alem-espiritos-diversos-chico-xavier-ano-1984": {
    titulo: "Humorismo no Além",
    autorEspiritual: "Espíritos Diversos",
    categoria: "Mensagens / Diversos",
    ano: 1984,
    descricao: "Crônicas e causos leves e cheios de bom humor psicografados por Chico Xavier. Demonstra que a alegria nobre e o sorriso sincero sobrevivem à morte."
  },
  "248-fe-espiritos-diversos-chico-xavier-carlos-a.bacelli": {
    titulo: "Fé",
    autorEspiritual: "Espíritos Diversos",
    categoria: "Mensagens / Diversos",
    ano: 1984,
    descricao: "Uma profunda exaltação à fé viva e raciocinada, incentivando a confiança absoluta no Criador diante das tormentas humanas."
  },
  "354-mentores_e_seareiros": {
    titulo: "Mentores e Seareiros",
    autorEspiritual: "Espíritos Diversos",
    categoria: "Estudos / Dissertações",
    ano: 1990,
    descricao: "Coletânea de reflexões e instruções práticas ditadas por mentores espirituais para guiar e inspirar os trabalhadores do movimento espírita."
  },
  "36-caminhoverdadeevida": {
    titulo: "Caminho, Verdade e Vida",
    autorEspiritual: "Emmanuel",
    categoria: "Estudo do Evangelho",
    ano: 1948,
    descricao: "Primeiro livro da monumental coleção de comentários a versículos do Novo Testamento, convocando-nos a vivenciar o Cristianismo Redivivo."
  },
  "39-pao_nosso": {
    titulo: "Pão Nosso",
    autorEspiritual: "Emmanuel",
    categoria: "Estudo do Evangelho",
    ano: 1950,
    descricao: "Segundo volume de comentários ao Evangelho, oferecendo alimento espiritual nutritivo e indispensável para a caminhada evolutiva diária."
  },
  "412-amor_e_verdade": {
    titulo: "Amor e Verdade",
    autorEspiritual: "Emmanuel",
    categoria: "Mensagens / Diversos",
    ano: 1999,
    descricao: "Mensagens inspiradoras de Emmanuel e outros espíritos benfeitores, destacando o amor incondicional e a busca pela verdade interna."
  },
  "44-vinha_de_luz": {
    titulo: "Vinha de Luz",
    autorEspiritual: "Emmanuel",
    categoria: "Estudo do Evangelho",
    ano: 1951,
    descricao: "Terceiro livro de comentários de Emmanuel. Traz profundas lições baseadas nas epístolas apostólicas para a iluminação da conduta cristã."
  },
  "55-fonte_viva": {
    titulo: "Fonte Viva",
    autorEspiritual: "Emmanuel",
    categoria: "Estudo do Evangelho",
    ano: 1953,
    descricao: "Quarto livro da coleção de comentários evangélicos. Lições luminosas que acalmam a alma e jorram sabedoria crística no coração do leitor."
  },
  "83-palavrasdevidaeterna": {
    titulo: "Palavras de Vida Eterna",
    autorEspiritual: "Emmanuel",
    categoria: "Estudo do Evangelho",
    ano: 1962,
    descricao: "Quinto livro de comentários de Emmanuel, guiando o leitor a encontrar no Evangelho do Cristo a bússola perfeita para as decisões da alma."
  },
  "93-eavidacontinua": {
    titulo: "E a Vida Continua...",
    autorEspiritual: "André Luiz",
    categoria: "Vida no Mundo Espiritual",
    ano: 1968,
    descricao: "Fechando a clássica coleção de André Luiz, esta obra narra de forma eletrizante os reencontros e as lutas evolutivas de almas afins na vida além-túmulo."
  }
};

// Dicionários de autores e médiuns conhecidos para extração automática
const BENFEITORES = [
  { nome: "Emmanuel", padrao: "Emmanuel" },
  { nome: "Andre Luiz", padrao: "André Luiz" },
  { nome: "André Luiz", padrao: "André Luiz" },
  { nome: "Humberto de Campos", padrao: "Humberto de Campos" },
  { nome: "Irmao X", padrao: "Irmão X" },
  { nome: "Irmão X", padrao: "Irmão X" },
  { nome: "Meimei", padrao: "Meimei" },
  { nome: "Maria Dolores", padrao: "Maria Dolores" },
  { nome: "Joanna de Angelis", padrao: "Joanna de Ângelis" },
  { nome: "Joanna de Ângelis", padrao: "Joanna de Ângelis" },
  { nome: "Bezerra de Menezes", padrao: "Bezerra de Menezes" },
  { nome: "Casimiro Cunha", padrao: "Casimiro Cunha" },
  { nome: "Neio Lucio", padrao: "Neio Lúcio" },
  { nome: "Neio Lúcio", padrao: "Neio Lúcio" },
  { nome: "Patricia", padrao: "Patrícia" },
  { nome: "Patrícia", padrao: "Patrícia" },
  { nome: "Scheilla", padrao: "Scheilla" }
];

const MEDIUNS = [
  { nome: "Chico Xavier", padrao: "Chico Xavier" },
  { nome: "ChicoXavier", padrao: "Chico Xavier" },
  { nome: "Divaldo Franco", padrao: "Divaldo Franco" },
  { nome: "Divaldo", padrao: "Divaldo Franco" },
  { nome: "Zibia Gasparetto", padrao: "Zíbia Gasparetto" },
  { nome: "Zíbia Gasparetto", padrao: "Zíbia Gasparetto" },
  { nome: "Vera Lucia", padrao: "Vera Lúcia Marinzeck" },
  { nome: "Vera Lúcia", padrao: "Vera Lúcia Marinzeck" },
  { nome: "Carlos Baccelli", padrao: "Carlos Baccelli" },
  { nome: "Carlos Bacceli", padrao: "Carlos Baccelli" }
];

// Função para formatar fallback de arquivos novos
function parseFallbackMetadata(filename) {
  const baseName = filename.replace(/\.pdf$/i, "");
  
  // Extrair números no início
  const numMatch = baseName.match(/^(\d+)[\s-_]*/);
  let cleanedName = baseName;
  if (numMatch) {
    cleanedName = baseName.substring(numMatch[0].length);
  }

  // Extrair ano no formato Ano-XXXX ou AnoXXXX se houver
  let ano = null;
  const anoMatch = cleanedName.match(/Ano[-_]?(\d{4})/i);
  if (anoMatch) {
    ano = parseInt(anoMatch[1], 10);
    cleanedName = cleanedName.replace(/[-_]?Ano[-_]?\d{4}/i, "");
  }

  // Tentar extrair autor espiritual
  let autorEspiritual = "Espíritos Diversos";
  for (const benfeitor of BENFEITORES) {
    const regex = new RegExp(`[-_]?${benfeitor.nome}[-_]?`, "gi");
    if (regex.test(cleanedName)) {
      autorEspiritual = benfeitor.padrao;
      cleanedName = cleanedName.replace(regex, " ");
      break;
    }
  }

  // Tentar extrair médium
  let medium = null;
  for (const med of MEDIUNS) {
    const regex = new RegExp(`[-_]?${med.nome}[-_]?`, "gi");
    if (regex.test(cleanedName)) {
      medium = med.padrao;
      cleanedName = cleanedName.replace(regex, " ");
      break;
    }
  }

  // Limpar termos repetitivos genéricos
  cleanedName = cleanedName
    .replace(/Espiritos[-_]?diversos/gi, "")
    .replace(/[-_]+/g, " ")
    .trim();

  // Capitalizar palavras do título
  let titulo = cleanedName
    .split(/\s+/)
    .map(word => {
      if (word.length <= 2 && !["a", "o", "no", "do", "da", "de", "e", "em", "um", "uma"].includes(word.toLowerCase())) {
        return word.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");

  // Remover espaços extras e pontuações remanescentes no título
  titulo = titulo.replace(/\s+/g, " ").trim();

  // Se o título ficou vazio
  if (!titulo) {
    titulo = "Obra Sincronizada";
  }

  let descricao = "Livro digitalizado em formato PDF, adicionado recentemente à biblioteca local.";
  if (medium) {
    descricao = `Obra psicografada pelo médium ${medium}. Disponível para estudos fraternos.`;
  }

  return {
    titulo,
    autorEspiritual,
    categoria: "Mensagens / Diversos",
    ano,
    descricao
  };
}

function sync() {
  console.log("--------------------------------------------------");
  console.log("INICIANDO SINCRONIZAÇÃO DA BIBLIOTECA DE LIVROS...");
  console.log("--------------------------------------------------");

  // 1. Verificar pasta de origem
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`[Erro] Pasta raiz "biblioteca" não encontrada em: ${SOURCE_DIR}`);
    console.log("Por favor, crie a pasta e coloque alguns PDFs nela.");
    process.exit(0);
  }

  // 2. Criar pasta de destino se não existir
  if (!fs.existsSync(DEST_DIR)) {
    fs.mkdirSync(DEST_DIR, { recursive: true });
    console.log(`[Criado] Diretório de destino: ${DEST_DIR}`);
  }

  // 3. Ler PDFs da pasta de origem
  const files = fs.readdirSync(SOURCE_DIR).filter(file => file.endsWith(".pdf"));
  console.log(`Encontrados ${files.length} arquivos PDF na pasta de origem.`);

  const booksList = [];

  for (const file of files) {
    const sourcePath = path.join(SOURCE_DIR, file);
    const destPath = path.join(DEST_DIR, file);

    // Copiar arquivo de forma incremental se necessário (tamanho diferente ou inexistente)
    let shouldCopy = true;
    if (fs.existsSync(destPath)) {
      const sourceStat = fs.statSync(sourcePath);
      const destStat = fs.statSync(destPath);
      if (sourceStat.size === destStat.size) {
        shouldCopy = false;
      }
    }

    if (shouldCopy) {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`[Copiado] ${file}`);
    } else {
      console.log(`[Mantido] ${file} (já sincronizado)`);
    }

    // 4. Mapear metadados do livro
    const key = file.toLowerCase().replace(/\.pdf$/i, "");
    let meta = LIVROS_DICIONARIO[key];

    if (!meta) {
      // Tentar encontrar uma correspondência sem caracteres especiais
      const fuzzyKey = key.replace(/[^a-z0-9]/g, "");
      const matchedKey = Object.keys(LIVROS_DICIONARIO).find(dKey => {
        return dKey.replace(/[^a-z0-9]/g, "") === fuzzyKey;
      });
      
      if (matchedKey) {
        meta = LIVROS_DICIONARIO[matchedKey];
      }
    }

    if (!meta) {
      // Fallback inteligente para arquivos novos
      meta = parseFallbackMetadata(file);
      console.log(`[Metadata Fallback] ${file} -> "${meta.titulo}"`);
    }

    // Evitar duplicados (mesmo título e mesmo autor espiritual)
    const normalizedNewTitle = meta.titulo.toLowerCase().replace(/[^a-z0-9]/g, "");
    const normalizedNewAuthor = (meta.autorEspiritual || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    
    const isDuplicate = booksList.find(b => {
      const normalizedExistingTitle = b.titulo.toLowerCase().replace(/[^a-z0-9]/g, "");
      const normalizedExistingAuthor = (b.autorEspiritual || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      return normalizedExistingTitle === normalizedNewTitle && normalizedExistingAuthor === normalizedNewAuthor;
    });

    if (isDuplicate) {
      console.log(`[Duplicado Ignorado] O arquivo "${file}" representa o livro "${meta.titulo}" que já foi catalogado através do arquivo "${isDuplicate.arquivo}".`);
      continue;
    }

    booksList.push({
      arquivo: file,
      ...meta
    });
  }

  // Ordenar lista por título para facilitar leitura
  booksList.sort((a, b) => a.titulo.localeCompare(b.titulo));

  // 5. Salvar arquivo JSON
  const jsonDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(jsonDir)) {
    fs.mkdirSync(jsonDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(booksList, null, 2), "utf8");
  console.log(`[Sucesso] ${booksList.length} livros catalogados em: ${OUTPUT_FILE}`);
  console.log("--------------------------------------------------");
}

sync();
