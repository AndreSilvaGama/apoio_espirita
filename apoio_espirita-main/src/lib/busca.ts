import { FUNCIONALIDADES } from "@/data/funcionalidades";

/**
 * Parte da busca que não depende do banco: as telas do próprio site.
 *
 * É a pergunta mais comum de quem está começando — "onde fica a tesouraria?",
 * "como envio a mensagem do dia?" — e a resposta não está em nenhuma tabela.
 * O catálogo de funcionalidades já lista o que existe e onde fica; aqui ele é
 * reaproveitado, somado às telas que não aparecem como cartão.
 *
 * A comparação ignora acento e caixa, igual à do banco: quem digita "tesouraria"
 * ou "TESOURARIA" no celular, sem acento, encontra do mesmo jeito.
 */

export interface PaginaDoSite {
  titulo: string;
  descricao: string;
  href: string;
  /** Palavras que levam até a página sem estarem no título. */
  termos?: string[];
}

/** Telas que não têm cartão de funcionalidade, mas que as pessoas procuram. */
const PAGINAS_EXTRAS: PaginaDoSite[] = [
  {
    titulo: "Tesouraria",
    descricao: "Receitas, despesas, saldo do mês e exportação para Excel.",
    href: "/tesouraria",
    termos: ["financeiro", "caixa", "dinheiro", "contas", "balanço", "despesas", "receitas"],
  },
  {
    titulo: "Mensagem do Dia",
    descricao: "Envie uma mensagem para a fila da sua casa e acompanhe a fila.",
    href: "/mensagem-do-dia",
    termos: ["fila", "mensagem", "pensamento"],
  },
  {
    titulo: "Meu perfil",
    descricao: "Nome, casa, cargo, cidade, troca de senha e exclusão da conta.",
    href: "/perfil",
    termos: ["senha", "cargo", "conta", "sair", "excluir", "dados"],
  },
  {
    titulo: "Status do Projeto",
    descricao: "O que está pendente, votação dos itens e pedido de novos recursos.",
    href: "/painel",
    termos: ["roadmap", "pendente", "votar", "solicitar", "sugerir", "novidades"],
  },
  {
    titulo: "Ajuda e dúvidas frequentes",
    descricao: "Perguntas e respostas sobre o uso do site e sobre a doutrina.",
    href: "/ajuda",
    termos: ["faq", "duvida", "suporte", "como faz", "problema"],
  },
  {
    titulo: "Enviar uma sugestão",
    descricao: "Conte o que poderia melhorar no site.",
    href: "/sugestoes",
    termos: ["sugestao", "ideia", "melhoria", "reclamacao"],
  },
  {
    titulo: "Escrever um artigo",
    descricao: "Publique um texto espírita assinado com seu nome e sua casa.",
    href: "/artigos/novo",
    termos: ["escrever", "publicar", "texto", "colunista"],
  },
  {
    titulo: "Meus artigos",
    descricao: "Seus textos publicados, os retirados e o motivo de cada retirada.",
    href: "/artigos/meus",
    termos: ["meus textos", "retirado", "corrigir artigo"],
  },
  {
    titulo: "Transparência",
    descricao: "Como o projeto se mantém e o que é feito com o que se arrecada.",
    href: "/transparencia",
    termos: ["prestacao de contas", "doacao", "custos"],
  },
];

/** Todas as telas buscáveis: as dos cartões mais as extras. */
export const PAGINAS_DO_SITE: PaginaDoSite[] = [
  ...FUNCIONALIDADES.flatMap((categoria) =>
    categoria.items
      .filter((item) => item.status === "disponivel" && item.href)
      .map((item) => ({
        titulo: item.title,
        descricao: item.desc,
        href: item.href as string,
      })),
  ),
  ...PAGINAS_EXTRAS,
];

/** Mesma normalização da função `sem_acento` do banco. */
export function semAcento(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** Termo curto demais não busca: devolveria o site inteiro. */
export const TERMO_MINIMO = 2;

export function termoValido(termo: string): boolean {
  return termo.trim().length >= TERMO_MINIMO;
}

/**
 * Páginas que casam com o termo. Quem casa pelo título vem antes de quem casa
 * só pela descrição — buscar "artigo" deve trazer a tela de artigos no topo,
 * não uma tela cuja descrição por acaso menciona artigos.
 */
export function buscarPaginas(termo: string, limite = 5): PaginaDoSite[] {
  if (!termoValido(termo)) return [];
  const q = semAcento(termo.trim());

  const porTitulo: PaginaDoSite[] = [];
  const porTexto: PaginaDoSite[] = [];

  for (const pagina of PAGINAS_DO_SITE) {
    if (semAcento(pagina.titulo).includes(q)) {
      porTitulo.push(pagina);
      continue;
    }
    const outros = [pagina.descricao, ...(pagina.termos ?? [])];
    if (outros.some((texto) => semAcento(texto).includes(q))) porTexto.push(pagina);
  }

  const vistos = new Set<string>();
  return [...porTitulo, ...porTexto]
    .filter((pagina) => {
      if (vistos.has(pagina.href + pagina.titulo)) return false;
      vistos.add(pagina.href + pagina.titulo);
      return true;
    })
    .slice(0, limite);
}
