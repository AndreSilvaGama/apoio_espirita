/**
 * Vocabulário fechado de habilidades do Voluntariado.
 *
 * O cruzamento entre quem precisa e quem sabe fazer só funciona se os dois
 * lados usarem a MESMA palavra. Com campo livre, "pedreiro", "Pedreiro" e
 * "alvenaria" nunca se encontrariam, e a tela diria que não há ninguém
 * disponível quando havia. Por isso a lista é fixa e vale para os dois lados.
 *
 * Para acrescentar uma habilidade, basta incluí-la aqui: as duas telas (a de
 * quem cadastra a necessidade e a de quem se oferece) leem esta lista.
 */

export interface GrupoHabilidades {
  grupo: string;
  itens: string[];
}

export const HABILIDADES: GrupoHabilidades[] = [
  {
    grupo: "Atendimento espiritual",
    itens: [
      "Passe",
      "Atendimento fraterno",
      "Evangelização infantil",
      "Mocidade",
      "Recepção",
      "Visita a enfermos",
      "Reunião mediúnica",
    ],
  },
  {
    grupo: "Estudo e exposição",
    itens: [
      "Palestra",
      "Coordenação de estudo",
      "Leitura em público",
      "Preparo de material de estudo",
      "Biblioteca",
    ],
  },
  {
    grupo: "Música e som",
    itens: ["Canto", "Violão", "Teclado", "Sonoplastia", "Regência de coral"],
  },
  {
    grupo: "Casa e manutenção",
    itens: [
      "Elétrica",
      "Hidráulica",
      "Pintura",
      "Alvenaria",
      "Marcenaria",
      "Jardinagem",
      "Limpeza",
      "Reparos em geral",
    ],
  },
  {
    grupo: "Administração",
    itens: [
      "Secretaria",
      "Contas e tesouraria",
      "Informática",
      "Redes sociais",
      "Design gráfico",
      "Fotografia",
      "Edição de vídeo",
      "Redação de textos",
    ],
  },
  {
    grupo: "Assistência social",
    itens: [
      "Cozinha",
      "Costura",
      "Distribuição de cestas",
      "Organização de bazar",
      "Transporte e carga",
      "Motorista",
      "Corte de cabelo",
    ],
  },
  {
    grupo: "Formação profissional",
    itens: [
      "Enfermagem",
      "Psicologia",
      "Direito",
      "Contabilidade",
      "Pedagogia",
      "Fisioterapia",
      "Tradução",
      "Aulas de reforço",
    ],
  },
];

/** Lista corrida, para validar o que vem do banco. */
export const HABILIDADES_LISTA: string[] = HABILIDADES.flatMap((g) => g.itens);

/**
 * Quantas habilidades as duas listas têm em comum. É o número que ordena os
 * voluntários diante de uma necessidade: quanto maior, mais a pessoa serve
 * para aquele pedido.
 */
export function afinidade(necessidade: string[] | null, oferta: string[] | null): number {
  if (!necessidade?.length || !oferta?.length) return 0;
  const conjunto = new Set(oferta);
  return necessidade.filter((h) => conjunto.has(h)).length;
}

/** As habilidades em comum, para a tela dizer QUAIS combinaram. */
export function habilidadesEmComum(
  necessidade: string[] | null,
  oferta: string[] | null,
): string[] {
  if (!necessidade?.length || !oferta?.length) return [];
  const conjunto = new Set(oferta);
  return necessidade.filter((h) => conjunto.has(h));
}
