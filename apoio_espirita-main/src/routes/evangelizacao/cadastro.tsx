/**
 * Cadastro da Evangelização Infantil.
 *
 * Reúne o que o evangelizador precisa ter à mão: a ficha de cada criança (com
 * os telefones de quem chamar numa emergência e as alergias), as turmas, a
 * chamada de cada encontro e o acompanhamento do desenvolvimento.
 *
 * Duas decisões de tela que valem registro:
 *
 *   1. A alergia aparece na LISTA, não só dentro da ficha. Um dado que só
 *      existe atrás de um clique não é consultado no momento em que faria
 *      diferença.
 *   2. Criança e primeiro responsável são cadastrados no MESMO formulário. Uma
 *      ficha de criança sem telefone de emergência não serve para nada — e
 *      um cadastro em duas etapas é um cadastro que fica pela metade.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarCheck,
  ChevronDown,
  Lock,
  Phone,
  Plus,
  Printer,
  Search,
  ShieldCheck,
  Trash2,
  TriangleAlert,
  UserPlus,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { mensagemDeErro } from "@/lib/erros";
import {
  Abas,
  Aviso,
  BotaoDiscreto,
  BotaoPrimario,
  CampoArea,
  CampoSelecao,
  CampoTexto,
  Cartao,
  DIAS_SEMANA,
  Etiqueta,
  PaginaComunidade,
  Rotulo,
  Vazio,
} from "@/components/Comunidade";

export const Route = createFileRoute("/evangelizacao/cadastro")({
  component: CadastroEvangelizacao,
});

/** Cargos que dão acesso pelo próprio cargo, sem autorização nominal. */
const CARGOS_DE_EVANGELIZACAO = ["Evangelizador", "Coordenador"];

const FAIXAS = [
  { id: "0-2", rotulo: "0 a 2 anos" },
  { id: "3-5", rotulo: "3 a 5 anos" },
  { id: "6-8", rotulo: "6 a 8 anos" },
  { id: "9-11", rotulo: "9 a 11 anos" },
  { id: "12-14", rotulo: "12 a 14 anos" },
  { id: "15-17", rotulo: "15 a 17 anos" },
  { id: "mista", rotulo: "Turma mista" },
];

const EIXOS = [
  { campo: "participacao", rotulo: "Participação", ajuda: "envolvimento nas atividades" },
  { campo: "convivencia", rotulo: "Convivência", ajuda: "relação com os colegas" },
  { campo: "assimilacao", rotulo: "Assimilação", ajuda: "compreensão do tema" },
] as const;

interface Turma {
  id: string;
  nome: string;
  faixa_etaria: string;
  dia_semana: number | null;
  horario: string | null;
  sala: string | null;
  evangelizadores: string | null;
  ativa: boolean;
}

interface Crianca {
  id: string;
  nome: string;
  data_nascimento: string;
  turma_id: string | null;
  alergias: string | null;
  medicamentos: string | null;
  condicoes_saude: string | null;
  observacoes: string | null;
  autoriza_imagem: boolean;
  autoriza_passeio: boolean;
  pode_sair_sozinha: boolean;
  matriculada_em: string;
  ativa: boolean;
}

interface Responsavel {
  id: string;
  crianca_id: string;
  nome: string;
  parentesco: string | null;
  telefone: string;
  telefone_alternativo: string | null;
  email: string | null;
  principal: boolean;
  pode_retirar: boolean;
  observacao: string | null;
}

interface Presenca {
  id: string;
  crianca_id: string;
  data_encontro: string;
  presente: boolean;
}

interface Avaliacao {
  id: string;
  crianca_id: string;
  data_avaliacao: string;
  participacao: number | null;
  convivencia: number | null;
  assimilacao: number | null;
  comentario: string | null;
  autor_nome: string;
}

const hojeISO = () => new Date().toISOString().slice(0, 10);

/** Idade em anos completos. Usada na lista, para a turma fazer sentido. */
function idadeEmAnos(nascimento: string): number {
  const nasce = new Date(nascimento + "T12:00:00Z");
  const hoje = new Date();
  let anos = hoje.getFullYear() - nasce.getFullYear();
  const mes = hoje.getMonth() - nasce.getMonth();
  if (mes < 0 || (mes === 0 && hoje.getDate() < nasce.getDate())) anos--;
  return anos;
}

function dataCurta(iso: string): string {
  return new Date(iso + "T12:00:00Z").toLocaleDateString("pt-BR");
}

function rotuloFaixa(id: string): string {
  return FAIXAS.find((f) => f.id === id)?.rotulo ?? id;
}

function quandoAcontece(t: Turma): string {
  const partes = [
    t.dia_semana != null ? DIAS_SEMANA[t.dia_semana] : null,
    t.horario?.trim() || null,
    t.sala?.trim() ? `Sala ${t.sala.trim()}` : null,
  ].filter(Boolean);
  return partes.join(" · ");
}

const formCriancaVazio = {
  nome: "",
  data_nascimento: "",
  turma_id: "",
  alergias: "",
  medicamentos: "",
  condicoes_saude: "",
  observacoes: "",
  autoriza_imagem: false,
  autoriza_passeio: false,
  pode_sair_sozinha: false,
};

const formResponsavelVazio = {
  nome: "",
  parentesco: "Mãe",
  telefone: "",
  telefone_alternativo: "",
  email: "",
  pode_retirar: true,
  observacao: "",
};

function CadastroEvangelizacao() {
  const { user, profile, isPresident } = useAuth();
  const [aba, setAba] = useState<"criancas" | "turmas" | "chamada" | "acesso">("criancas");

  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [criancas, setCriancas] = useState<Crianca[]>([]);
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([]);
  const [autorizados, setAutorizados] = useState<
    { id: string; user_id: string; nome: string | null }[]
  >([]);
  const [membros, setMembros] = useState<{ id: string; nome: string | null }[]>([]);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [detalhe, setDetalhe] = useState<string | null>(null);

  const [criandoCrianca, setCriandoCrianca] = useState(false);
  const [formCrianca, setFormCrianca] = useState({ ...formCriancaVazio });
  const [formResponsavel, setFormResponsavel] = useState({ ...formResponsavelVazio });
  const [editando, setEditando] = useState<string | null>(null);

  const [criandoTurma, setCriandoTurma] = useState(false);
  const [formTurma, setFormTurma] = useState({
    nome: "",
    faixa_etaria: "mista",
    dia_semana: "",
    horario: "",
    sala: "",
    evangelizadores: "",
  });

  // Acompanhamento carregado sob demanda: a ficha aberta é uma criança só, e
  // trazer o histórico de todas na abertura da tela seria lento à toa.
  const [presencas, setPresencas] = useState<Record<string, Presenca[]>>({});
  const [avaliacoes, setAvaliacoes] = useState<Record<string, Avaliacao[]>>({});
  const [formAvaliacao, setFormAvaliacao] = useState({
    data_avaliacao: hojeISO(),
    participacao: "",
    convivencia: "",
    assimilacao: "",
    comentario: "",
  });
  const [novoResponsavel, setNovoResponsavel] = useState<string | null>(null);
  const [formResponsavelExtra, setFormResponsavelExtra] = useState({ ...formResponsavelVazio });

  const [turmaChamada, setTurmaChamada] = useState("");
  const [dataChamada, setDataChamada] = useState(hojeISO());
  const [chamada, setChamada] = useState<Record<string, boolean>>({});

  const sigla = profile?.sigla_casa ?? "";
  const souDoCargo = CARGOS_DE_EVANGELIZACAO.includes(profile?.cargo_principal ?? "");
  const souAutorizado = autorizados.some((a) => a.user_id === user?.id);
  const podeEvangelizar = souDoCargo || souAutorizado;

  const carregar = useCallback(async () => {
    setCarregando(true);
    const [aut, t, c, r] = await Promise.all([
      supabase.from("evangelizacao_autorizados").select("id, user_id, nome"),
      supabase
        .from("evangelizacao_turmas")
        .select("id, nome, faixa_etaria, dia_semana, horario, sala, evangelizadores, ativa")
        .order("nome"),
      supabase
        .from("evangelizacao_criancas")
        .select(
          "id, nome, data_nascimento, turma_id, alergias, medicamentos, condicoes_saude, observacoes, autoriza_imagem, autoriza_passeio, pode_sair_sozinha, matriculada_em, ativa",
        )
        .order("nome"),
      supabase
        .from("evangelizacao_responsaveis")
        .select(
          "id, crianca_id, nome, parentesco, telefone, telefone_alternativo, email, principal, pode_retirar, observacao",
        )
        .order("principal", { ascending: false }),
    ]);
    setAutorizados(aut.data ?? []);
    setTurmas((t.data as Turma[]) ?? []);
    setCriancas((c.data as Crianca[]) ?? []);
    setResponsaveis((r.data as Responsavel[]) ?? []);
    setCarregando(false);
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const carregarMembros = useCallback(async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, nome")
      .eq("sigla_casa", sigla)
      .order("nome");
    setMembros(data ?? []);
  }, [sigla]);

  useEffect(() => {
    if (aba === "acesso" && isPresident) void carregarMembros();
  }, [aba, isPresident, carregarMembros]);

  /* ── Ficha da criança ─────────────────────────────────────────────── */

  const carimbo = {
    sigla_casa: sigla,
    criado_por: user?.id ?? "",
    autor_nome: profile?.nome ?? "",
  };

  async function salvarCrianca(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (formCrianca.nome.trim().length < 2 || !formCrianca.data_nascimento) {
      setErro("Informe o nome da criança e a data de nascimento.");
      return;
    }
    if (
      !editando &&
      (formResponsavel.nome.trim().length < 2 || formResponsavel.telefone.trim().length < 8)
    ) {
      setErro("Informe o responsável e um telefone de emergência com DDD.");
      return;
    }
    setOcupado("crianca");

    const campos = {
      nome: formCrianca.nome.trim(),
      data_nascimento: formCrianca.data_nascimento,
      turma_id: formCrianca.turma_id || null,
      alergias: formCrianca.alergias.trim() || null,
      medicamentos: formCrianca.medicamentos.trim() || null,
      condicoes_saude: formCrianca.condicoes_saude.trim() || null,
      observacoes: formCrianca.observacoes.trim() || null,
      autoriza_imagem: formCrianca.autoriza_imagem,
      autoriza_passeio: formCrianca.autoriza_passeio,
      pode_sair_sozinha: formCrianca.pode_sair_sozinha,
    };

    if (editando) {
      const { error } = await supabase
        .from("evangelizacao_criancas")
        .update(campos)
        .eq("id", editando);
      setOcupado(null);
      if (error) {
        setErro(mensagemDeErro(error));
        return;
      }
    } else {
      const { data, error } = await supabase
        .from("evangelizacao_criancas")
        .insert({ ...carimbo, ...campos })
        .select("id")
        .single();
      if (error || !data) {
        setOcupado(null);
        setErro(mensagemDeErro(error));
        return;
      }
      const { error: erroResp } = await supabase.from("evangelizacao_responsaveis").insert({
        ...carimbo,
        crianca_id: data.id,
        nome: formResponsavel.nome.trim(),
        parentesco: formResponsavel.parentesco.trim() || null,
        telefone: formResponsavel.telefone.trim(),
        telefone_alternativo: formResponsavel.telefone_alternativo.trim() || null,
        email: formResponsavel.email.trim() || null,
        pode_retirar: formResponsavel.pode_retirar,
        observacao: formResponsavel.observacao.trim() || null,
        principal: true,
      });
      setOcupado(null);
      if (erroResp) {
        // A criança já foi gravada: dizer exatamente isto, para ninguém
        // cadastrá-la de novo achando que nada foi salvo.
        setErro(
          `A ficha de ${campos.nome} foi salva, mas o responsável não: ${mensagemDeErro(erroResp)} Abra a ficha e cadastre o responsável.`,
        );
        await carregar();
        return;
      }
    }

    setFormCrianca({ ...formCriancaVazio });
    setFormResponsavel({ ...formResponsavelVazio });
    setCriandoCrianca(false);
    setEditando(null);
    await carregar();
  }

  function abrirEdicao(c: Crianca) {
    setEditando(c.id);
    setCriandoCrianca(true);
    setFormCrianca({
      nome: c.nome,
      data_nascimento: c.data_nascimento,
      turma_id: c.turma_id ?? "",
      alergias: c.alergias ?? "",
      medicamentos: c.medicamentos ?? "",
      condicoes_saude: c.condicoes_saude ?? "",
      observacoes: c.observacoes ?? "",
      autoriza_imagem: c.autoriza_imagem,
      autoriza_passeio: c.autoriza_passeio,
      pode_sair_sozinha: c.pode_sair_sozinha,
    });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function alternarAtiva(c: Crianca) {
    setOcupado(c.id);
    const { error } = await supabase
      .from("evangelizacao_criancas")
      .update({ ativa: !c.ativa })
      .eq("id", c.id);
    setOcupado(null);
    if (error) {
      setErro(mensagemDeErro(error));
      return;
    }
    await carregar();
  }

  async function apagarCrianca(c: Crianca) {
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        `Apagar a ficha de ${c.nome}? Isto remove também os responsáveis, as presenças e as avaliações dela. Para apenas tirá-la da turma, use "Arquivar".`,
      )
    )
      return;
    setOcupado(c.id);
    const { error } = await supabase.from("evangelizacao_criancas").delete().eq("id", c.id);
    setOcupado(null);
    if (error) {
      setErro(mensagemDeErro(error));
      return;
    }
    setDetalhe(null);
    await carregar();
  }

  /* ── Responsáveis ─────────────────────────────────────────────────── */

  async function adicionarResponsavel(criancaId: string) {
    setErro(null);
    if (
      formResponsavelExtra.nome.trim().length < 2 ||
      formResponsavelExtra.telefone.trim().length < 8
    ) {
      setErro("Informe o nome do responsável e um telefone com DDD.");
      return;
    }
    setOcupado("responsavel");
    const { error } = await supabase.from("evangelizacao_responsaveis").insert({
      ...carimbo,
      crianca_id: criancaId,
      nome: formResponsavelExtra.nome.trim(),
      parentesco: formResponsavelExtra.parentesco.trim() || null,
      telefone: formResponsavelExtra.telefone.trim(),
      telefone_alternativo: formResponsavelExtra.telefone_alternativo.trim() || null,
      email: formResponsavelExtra.email.trim() || null,
      pode_retirar: formResponsavelExtra.pode_retirar,
      observacao: formResponsavelExtra.observacao.trim() || null,
      principal: !responsaveis.some((r) => r.crianca_id === criancaId),
    });
    setOcupado(null);
    if (error) {
      setErro(mensagemDeErro(error));
      return;
    }
    setFormResponsavelExtra({ ...formResponsavelVazio });
    setNovoResponsavel(null);
    await carregar();
  }

  async function apagarResponsavel(id: string) {
    setOcupado(id);
    const { error } = await supabase.from("evangelizacao_responsaveis").delete().eq("id", id);
    setOcupado(null);
    if (error) {
      setErro(mensagemDeErro(error));
      return;
    }
    await carregar();
  }

  /* ── Turmas ───────────────────────────────────────────────────────── */

  async function salvarTurma(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (formTurma.nome.trim().length < 2) {
      setErro("Dê um nome à turma.");
      return;
    }
    setOcupado("turma");
    const { error } = await supabase.from("evangelizacao_turmas").insert({
      ...carimbo,
      nome: formTurma.nome.trim(),
      faixa_etaria: formTurma.faixa_etaria,
      dia_semana: formTurma.dia_semana === "" ? null : Number(formTurma.dia_semana),
      horario: formTurma.horario.trim() || null,
      sala: formTurma.sala.trim() || null,
      evangelizadores: formTurma.evangelizadores.trim() || null,
    });
    setOcupado(null);
    if (error) {
      setErro(mensagemDeErro(error));
      return;
    }
    setFormTurma({
      nome: "",
      faixa_etaria: "mista",
      dia_semana: "",
      horario: "",
      sala: "",
      evangelizadores: "",
    });
    setCriandoTurma(false);
    await carregar();
  }

  async function alternarTurma(t: Turma) {
    setOcupado(t.id);
    const { error } = await supabase
      .from("evangelizacao_turmas")
      .update({ ativa: !t.ativa })
      .eq("id", t.id);
    setOcupado(null);
    if (error) {
      setErro(mensagemDeErro(error));
      return;
    }
    await carregar();
  }

  async function apagarTurma(t: Turma) {
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        `Apagar a turma ${t.nome}? As crianças continuam cadastradas, mas ficam sem turma.`,
      )
    )
      return;
    setOcupado(t.id);
    const { error } = await supabase.from("evangelizacao_turmas").delete().eq("id", t.id);
    setOcupado(null);
    if (error) {
      setErro(mensagemDeErro(error));
      return;
    }
    await carregar();
  }

  /* ── Acompanhamento ───────────────────────────────────────────────── */

  const abrirFicha = useCallback(
    async (criancaId: string) => {
      if (detalhe === criancaId) {
        setDetalhe(null);
        return;
      }
      setDetalhe(criancaId);
      setNovoResponsavel(null);
      if (presencas[criancaId] && avaliacoes[criancaId]) return;
      const [p, a] = await Promise.all([
        supabase
          .from("evangelizacao_presencas")
          .select("id, crianca_id, data_encontro, presente")
          .eq("crianca_id", criancaId)
          .order("data_encontro", { ascending: false })
          .limit(60),
        supabase
          .from("evangelizacao_avaliacoes")
          .select(
            "id, crianca_id, data_avaliacao, participacao, convivencia, assimilacao, comentario, autor_nome",
          )
          .eq("crianca_id", criancaId)
          .order("data_avaliacao", { ascending: false }),
      ]);
      setPresencas((atual) => ({ ...atual, [criancaId]: (p.data as Presenca[]) ?? [] }));
      setAvaliacoes((atual) => ({ ...atual, [criancaId]: (a.data as Avaliacao[]) ?? [] }));
    },
    [detalhe, presencas, avaliacoes],
  );

  async function salvarAvaliacao(criancaId: string) {
    setErro(null);
    const notas = {
      participacao: formAvaliacao.participacao === "" ? null : Number(formAvaliacao.participacao),
      convivencia: formAvaliacao.convivencia === "" ? null : Number(formAvaliacao.convivencia),
      assimilacao: formAvaliacao.assimilacao === "" ? null : Number(formAvaliacao.assimilacao),
    };
    if (
      notas.participacao === null &&
      notas.convivencia === null &&
      notas.assimilacao === null &&
      !formAvaliacao.comentario.trim()
    ) {
      setErro("Dê ao menos uma nota ou escreva um comentário.");
      return;
    }
    setOcupado("avaliacao");
    const { data, error } = await supabase
      .from("evangelizacao_avaliacoes")
      .insert({
        ...carimbo,
        crianca_id: criancaId,
        data_avaliacao: formAvaliacao.data_avaliacao,
        ...notas,
        comentario: formAvaliacao.comentario.trim() || null,
      })
      .select(
        "id, crianca_id, data_avaliacao, participacao, convivencia, assimilacao, comentario, autor_nome",
      )
      .single();
    setOcupado(null);
    if (error || !data) {
      setErro(mensagemDeErro(error));
      return;
    }
    setAvaliacoes((atual) => ({
      ...atual,
      [criancaId]: [data as Avaliacao, ...(atual[criancaId] ?? [])],
    }));
    setFormAvaliacao({
      data_avaliacao: hojeISO(),
      participacao: "",
      convivencia: "",
      assimilacao: "",
      comentario: "",
    });
  }

  /* ── Chamada ──────────────────────────────────────────────────────── */

  const criancasDaTurma = useMemo(
    () => criancas.filter((c) => c.ativa && c.turma_id === turmaChamada),
    [criancas, turmaChamada],
  );

  const carregarChamada = useCallback(async () => {
    if (!turmaChamada || !dataChamada) return;
    const { data } = await supabase
      .from("evangelizacao_presencas")
      .select("crianca_id, presente")
      .eq("turma_id", turmaChamada)
      .eq("data_encontro", dataChamada);
    const mapa: Record<string, boolean> = {};
    for (const linha of data ?? []) mapa[linha.crianca_id] = linha.presente;
    setChamada(mapa);
  }, [turmaChamada, dataChamada]);

  useEffect(() => {
    if (aba === "chamada") void carregarChamada();
  }, [aba, carregarChamada]);

  async function marcarPresenca(criancaId: string, presente: boolean) {
    setOcupado(criancaId);
    setErro(null);
    const { error } = await supabase.from("evangelizacao_presencas").upsert(
      {
        ...carimbo,
        crianca_id: criancaId,
        turma_id: turmaChamada || null,
        data_encontro: dataChamada,
        presente,
      },
      { onConflict: "crianca_id,data_encontro" },
    );
    setOcupado(null);
    if (error) {
      setErro(mensagemDeErro(error));
      return;
    }
    setChamada((atual) => ({ ...atual, [criancaId]: presente }));
    // O histórico já lido fica velho na hora em que a chamada muda.
    setPresencas((atual) => {
      const copia = { ...atual };
      delete copia[criancaId];
      return copia;
    });
  }

  async function marcarTodosPresentes() {
    for (const c of criancasDaTurma) {
      if (chamada[c.id] === undefined) await marcarPresenca(c.id, true);
    }
  }

  /* ── Acesso ───────────────────────────────────────────────────────── */

  async function autorizar(m: { id: string; nome: string | null }) {
    setOcupado(m.id);
    const { error } = await supabase
      .from("evangelizacao_autorizados")
      .insert({ sigla_casa: sigla, user_id: m.id, nome: m.nome });
    setOcupado(null);
    if (error) {
      setErro(mensagemDeErro(error));
      return;
    }
    await carregar();
  }

  async function revogar(id: string) {
    setOcupado(id);
    const { error } = await supabase.from("evangelizacao_autorizados").delete().eq("id", id);
    setOcupado(null);
    if (error) {
      setErro(mensagemDeErro(error));
      return;
    }
    await carregar();
  }

  /* ── Render ───────────────────────────────────────────────────────── */

  const termo = busca.trim().toLowerCase();
  const listaCriancas = criancas.filter(
    (c) =>
      !termo ||
      c.nome.toLowerCase().includes(termo) ||
      responsaveis.some((r) => r.crianca_id === c.id && r.nome.toLowerCase().includes(termo)),
  );
  const ativas = listaCriancas.filter((c) => c.ativa);
  const arquivadas = listaCriancas.filter((c) => !c.ativa);

  const cabecalho = {
    secao: "Evangelização infantil",
    titulo: "Cadastro da",
    destaque: "Evangelização",
    descricao:
      "A ficha de cada criança, os telefones de emergência dos responsáveis, a chamada dos encontros e o acompanhamento do desenvolvimento.",
  };

  if (carregando) {
    return (
      <PaginaComunidade {...cabecalho}>
        <p className="text-center text-muted-foreground/50 py-12 font-light">Carregando…</p>
      </PaginaComunidade>
    );
  }

  if (!podeEvangelizar && !isPresident) {
    return (
      <PaginaComunidade {...cabecalho}>
        <Cartao className="text-center space-y-4">
          <div className="flex justify-center">
            <Lock size={30} strokeWidth={1.5} className="text-cyan-glow" />
          </div>
          <h2 className="text-lg font-medium text-foreground">Esta área é reservada</h2>
          <p className="text-sm text-muted-foreground font-light max-w-md mx-auto">
            A ficha guarda dado de criança — telefone dos responsáveis, alergias e condições de
            saúde. Leem apenas quem tem o cargo de Evangelizador ou de Coordenador na casa e quem a
            direção autorizar nominalmente. O desenvolvedor da plataforma também não lê.
          </p>
          <p className="text-sm text-muted-foreground font-light">
            Se você trabalha na evangelização da sua casa, peça à direção para autorizar o seu
            acesso.
          </p>
        </Cartao>
      </PaginaComunidade>
    );
  }

  return (
    <PaginaComunidade {...cabecalho}>
      <div className="space-y-6">
        {erro && <Aviso tipo="erro">{erro}</Aviso>}

        <Abas
          abas={[
            { id: "criancas" as const, rotulo: "Crianças" },
            { id: "turmas" as const, rotulo: "Turmas" },
            { id: "chamada" as const, rotulo: "Chamada" },
            ...(isPresident ? [{ id: "acesso" as const, rotulo: "Quem tem acesso" }] : []),
          ]}
          atual={aba}
          aoTrocar={setAba}
        />

        {/* ══ Quem tem acesso ══════════════════════════════════════════ */}
        {aba === "acesso" && isPresident && (
          <div className="space-y-5">
            <Cartao>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-glow mb-3">
                Autorizados nesta casa
              </p>
              {autorizados.length === 0 ? (
                <p className="text-sm text-muted-foreground font-light">
                  Ninguém foi autorizado nominalmente. Quem tem o cargo de Evangelizador ou de
                  Coordenador já entra pelo próprio cargo.
                </p>
              ) : (
                <div className="space-y-2">
                  {autorizados.map((a) => (
                    <div key={a.id} className="flex items-center justify-between gap-2">
                      <p className="text-sm text-foreground inline-flex items-center gap-2">
                        <ShieldCheck size={14} strokeWidth={1.6} className="text-emerald-600" />
                        {a.nome ?? "Membro"}
                      </p>
                      <BotaoDiscreto onClick={() => revogar(a.id)} disabled={ocupado === a.id}>
                        Retirar acesso
                      </BotaoDiscreto>
                    </div>
                  ))}
                </div>
              )}
            </Cartao>

            <Cartao>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-glow mb-3">
                Autorizar alguém da casa
              </p>
              <div className="flex flex-wrap gap-2">
                {membros
                  .filter((m) => !autorizados.some((a) => a.user_id === m.id))
                  .map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => autorizar(m)}
                      disabled={ocupado === m.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border border-border hover:border-cyan-glow/40 hover:text-cyan-glow transition-colors disabled:opacity-40"
                    >
                      <UserPlus size={12} strokeWidth={1.8} />
                      {m.nome ?? "Membro"}
                    </button>
                  ))}
              </div>
            </Cartao>
          </div>
        )}

        {aba !== "acesso" && !podeEvangelizar && (
          <Cartao className="text-center">
            <p className="text-sm text-muted-foreground font-light">
              Você administra a página da casa e pode definir quem tem acesso, mas não lê as fichas
              — para isso é preciso ter o cargo de Evangelizador ou de Coordenador, ou uma
              autorização nominal.
            </p>
          </Cartao>
        )}

        {/* ══ Turmas ═══════════════════════════════════════════════════ */}
        {aba === "turmas" && podeEvangelizar && (
          <div className="space-y-5">
            <div className="flex justify-end">
              <BotaoPrimario onClick={() => setCriandoTurma((v) => !v)}>
                <span className="inline-flex items-center gap-2">
                  <Plus size={13} strokeWidth={2} /> {criandoTurma ? "Fechar" : "Nova turma"}
                </span>
              </BotaoPrimario>
            </div>

            {criandoTurma && (
              <Cartao>
                <form onSubmit={salvarTurma} className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Rotulo obrigatorio>Nome da turma</Rotulo>
                      <CampoTexto
                        value={formTurma.nome}
                        onChange={(e) => setFormTurma({ ...formTurma, nome: e.target.value })}
                        maxLength={80}
                        placeholder="Turma do Amor"
                      />
                    </div>
                    <div>
                      <Rotulo>Faixa etária</Rotulo>
                      <CampoSelecao
                        value={formTurma.faixa_etaria}
                        onChange={(e) =>
                          setFormTurma({ ...formTurma, faixa_etaria: e.target.value })
                        }
                      >
                        {FAIXAS.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.rotulo}
                          </option>
                        ))}
                      </CampoSelecao>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <Rotulo>Dia do encontro</Rotulo>
                      <CampoSelecao
                        value={formTurma.dia_semana}
                        onChange={(e) => setFormTurma({ ...formTurma, dia_semana: e.target.value })}
                      >
                        <option value="">Não definido</option>
                        {DIAS_SEMANA.map((d, i) => (
                          <option key={d} value={i}>
                            {d}
                          </option>
                        ))}
                      </CampoSelecao>
                    </div>
                    <div>
                      <Rotulo ajuda="ex.: 9h às 10h30">Horário</Rotulo>
                      <CampoTexto
                        value={formTurma.horario}
                        onChange={(e) => setFormTurma({ ...formTurma, horario: e.target.value })}
                        maxLength={40}
                      />
                    </div>
                    <div>
                      <Rotulo ajuda="opcional">Sala</Rotulo>
                      <CampoTexto
                        value={formTurma.sala}
                        onChange={(e) => setFormTurma({ ...formTurma, sala: e.target.value })}
                        maxLength={60}
                      />
                    </div>
                  </div>
                  <div>
                    <Rotulo ajuda="quem conduz os encontros">Evangelizadores</Rotulo>
                    <CampoTexto
                      value={formTurma.evangelizadores}
                      onChange={(e) =>
                        setFormTurma({ ...formTurma, evangelizadores: e.target.value })
                      }
                      maxLength={200}
                    />
                  </div>
                  <BotaoPrimario type="submit" disabled={ocupado === "turma"}>
                    {ocupado === "turma" ? "Salvando…" : "Criar turma"}
                  </BotaoPrimario>
                </form>
              </Cartao>
            )}

            {turmas.length === 0 ? (
              <Vazio texto="Nenhuma turma criada. Comece pela turma — a ficha da criança pergunta a qual ela pertence." />
            ) : (
              <div className="space-y-2">
                {turmas.map((t) => {
                  const quantas = criancas.filter((c) => c.ativa && c.turma_id === t.id).length;
                  return (
                    <article key={t.id} className="glass rounded-2xl p-5">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <p className="text-foreground inline-flex items-center gap-2">
                            {t.nome}
                            {!t.ativa && <Etiqueta>Arquivada</Etiqueta>}
                          </p>
                          <p className="text-xs text-muted-foreground/70 mt-1">
                            {rotuloFaixa(t.faixa_etaria)}
                            {quandoAcontece(t) && ` · ${quandoAcontece(t)}`}
                          </p>
                          {t.evangelizadores && (
                            <p className="text-xs text-muted-foreground/70 mt-1">
                              {t.evangelizadores}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Etiqueta tom="ciano">
                            <Users size={10} strokeWidth={2} /> {quantas}
                          </Etiqueta>
                          <BotaoDiscreto
                            onClick={() => alternarTurma(t)}
                            disabled={ocupado === t.id}
                          >
                            {t.ativa ? "Arquivar" : "Reativar"}
                          </BotaoDiscreto>
                          <BotaoDiscreto onClick={() => apagarTurma(t)} disabled={ocupado === t.id}>
                            <Trash2 size={13} strokeWidth={1.8} />
                          </BotaoDiscreto>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══ Chamada ══════════════════════════════════════════════════ */}
        {aba === "chamada" && podeEvangelizar && (
          <div className="space-y-5">
            <Cartao>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Rotulo obrigatorio>Turma</Rotulo>
                  <CampoSelecao
                    value={turmaChamada}
                    onChange={(e) => setTurmaChamada(e.target.value)}
                  >
                    <option value="">Escolha a turma</option>
                    {turmas
                      .filter((t) => t.ativa)
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.nome}
                        </option>
                      ))}
                  </CampoSelecao>
                </div>
                <div>
                  <Rotulo obrigatorio>Dia do encontro</Rotulo>
                  <CampoTexto
                    type="date"
                    value={dataChamada}
                    onChange={(e) => setDataChamada(e.target.value)}
                  />
                </div>
              </div>
            </Cartao>

            {!turmaChamada ? (
              <Vazio texto="Escolha a turma para fazer a chamada." />
            ) : criancasDaTurma.length === 0 ? (
              <Vazio texto="Nenhuma criança nesta turma. Cadastre as crianças na aba Crianças." />
            ) : (
              <>
                <div className="flex justify-between items-center gap-3 flex-wrap">
                  <p className="text-xs text-muted-foreground font-light">
                    {Object.values(chamada).filter(Boolean).length} de {criancasDaTurma.length}{" "}
                    presentes em {dataCurta(dataChamada)}
                  </p>
                  <BotaoDiscreto onClick={marcarTodosPresentes}>
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarCheck size={13} strokeWidth={1.8} /> Marcar os que faltam como
                      presentes
                    </span>
                  </BotaoDiscreto>
                </div>

                <div className="space-y-2">
                  {criancasDaTurma.map((c) => {
                    const estado = chamada[c.id];
                    return (
                      <div
                        key={c.id}
                        className="glass rounded-2xl p-4 flex items-center justify-between gap-3 flex-wrap"
                      >
                        <div>
                          <p className="text-sm text-foreground">{c.nome}</p>
                          {c.alergias && (
                            <p className="text-xs text-red-600 font-light mt-0.5 inline-flex items-center gap-1">
                              <TriangleAlert size={11} strokeWidth={1.8} /> {c.alergias}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => marcarPresenca(c.id, true)}
                            disabled={ocupado === c.id}
                            className={`px-4 py-2 rounded-full text-xs uppercase tracking-widest border transition-colors disabled:opacity-40 ${
                              estado === true
                                ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                                : "border-border text-muted-foreground hover:border-emerald-300"
                            }`}
                          >
                            Presente
                          </button>
                          <button
                            type="button"
                            onClick={() => marcarPresenca(c.id, false)}
                            disabled={ocupado === c.id}
                            className={`px-4 py-2 rounded-full text-xs uppercase tracking-widest border transition-colors disabled:opacity-40 ${
                              estado === false
                                ? "border-amber-400 bg-amber-50 text-amber-700"
                                : "border-border text-muted-foreground hover:border-amber-300"
                            }`}
                          >
                            Faltou
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* ══ Crianças ═════════════════════════════════════════════════ */}
        {aba === "criancas" && podeEvangelizar && (
          <div className="space-y-5">
            <Aviso tipo="nota">
              Guarde o necessário para cuidar bem da criança e nada além. Esta ficha não sai da sua
              casa espírita: nenhuma outra casa a enxerga, e o desenvolvedor da plataforma também
              não.
            </Aviso>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50"
                />
                <input
                  type="search"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar pelo nome da criança ou do responsável"
                  className="w-full h-10 rounded-xl bg-white/60 border border-border pl-9 pr-3 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-cyan-glow/40 transition-colors"
                />
              </div>
              <BotaoDiscreto onClick={() => typeof window !== "undefined" && window.print()}>
                <span className="inline-flex items-center gap-1.5">
                  <Printer size={13} strokeWidth={1.8} /> Imprimir emergência
                </span>
              </BotaoDiscreto>
              <BotaoPrimario
                onClick={() => {
                  setEditando(null);
                  setFormCrianca({ ...formCriancaVazio });
                  setCriandoCrianca((v) => !v);
                }}
              >
                <span className="inline-flex items-center gap-2">
                  <Plus size={13} strokeWidth={2} /> {criandoCrianca ? "Fechar" : "Nova criança"}
                </span>
              </BotaoPrimario>
            </div>

            {criandoCrianca && (
              <Cartao>
                <form onSubmit={salvarCrianca} className="space-y-6">
                  <p className="text-xs uppercase tracking-[0.3em] text-cyan-glow">
                    {editando ? "Editar ficha" : "Dados da criança"}
                  </p>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Rotulo obrigatorio>Nome completo</Rotulo>
                      <CampoTexto
                        value={formCrianca.nome}
                        onChange={(e) => setFormCrianca({ ...formCrianca, nome: e.target.value })}
                        maxLength={160}
                      />
                    </div>
                    <div>
                      <Rotulo obrigatorio>Data de nascimento</Rotulo>
                      <CampoTexto
                        type="date"
                        value={formCrianca.data_nascimento}
                        onChange={(e) =>
                          setFormCrianca({ ...formCrianca, data_nascimento: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <Rotulo>Turma</Rotulo>
                    <CampoSelecao
                      value={formCrianca.turma_id}
                      onChange={(e) => setFormCrianca({ ...formCrianca, turma_id: e.target.value })}
                    >
                      <option value="">Sem turma por enquanto</option>
                      {turmas
                        .filter((t) => t.ativa)
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.nome} — {rotuloFaixa(t.faixa_etaria)}
                          </option>
                        ))}
                    </CampoSelecao>
                  </div>

                  <div className="space-y-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-cyan-glow">Saúde</p>
                    <div>
                      <Rotulo ajuda="alimentos, medicamentos, picadas — o que causa reação">
                        Alergias
                      </Rotulo>
                      <CampoArea
                        rows={2}
                        value={formCrianca.alergias}
                        onChange={(e) =>
                          setFormCrianca({ ...formCrianca, alergias: e.target.value })
                        }
                        maxLength={1000}
                        placeholder="Amendoim, dipirona…"
                      />
                    </div>
                    <div>
                      <Rotulo ajuda="uso contínuo e o que fazer em caso de crise">
                        Medicamentos
                      </Rotulo>
                      <CampoArea
                        rows={2}
                        value={formCrianca.medicamentos}
                        onChange={(e) =>
                          setFormCrianca({ ...formCrianca, medicamentos: e.target.value })
                        }
                        maxLength={1000}
                      />
                    </div>
                    <div>
                      <Rotulo ajuda="asma, epilepsia, autismo, restrição alimentar">
                        Condições de saúde
                      </Rotulo>
                      <CampoArea
                        rows={2}
                        value={formCrianca.condicoes_saude}
                        onChange={(e) =>
                          setFormCrianca({ ...formCrianca, condicoes_saude: e.target.value })
                        }
                        maxLength={1000}
                      />
                    </div>
                  </div>

                  <div>
                    <Rotulo ajuda="o que ajuda quem for cuidar dela">Outras observações</Rotulo>
                    <CampoArea
                      rows={3}
                      value={formCrianca.observacoes}
                      onChange={(e) =>
                        setFormCrianca({ ...formCrianca, observacoes: e.target.value })
                      }
                      maxLength={2000}
                    />
                  </div>

                  <div className="rounded-2xl border border-border/60 p-4 space-y-3">
                    <p className="text-xs uppercase tracking-[0.3em] text-cyan-glow">
                      Autorizações do responsável
                    </p>
                    {[
                      {
                        campo: "autoriza_imagem" as const,
                        texto: "Autoriza o uso da imagem da criança em fotos da casa",
                      },
                      {
                        campo: "autoriza_passeio" as const,
                        texto: "Autoriza a participação em passeios e atividades externas",
                      },
                      {
                        campo: "pode_sair_sozinha" as const,
                        texto: "A criança pode sair sozinha ao fim do encontro",
                      },
                    ].map((opcao) => (
                      <label
                        key={opcao.campo}
                        className="flex items-start gap-3 text-sm text-foreground font-light cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formCrianca[opcao.campo]}
                          onChange={(e) =>
                            setFormCrianca({ ...formCrianca, [opcao.campo]: e.target.checked })
                          }
                          className="mt-1 accent-cyan-600"
                        />
                        {opcao.texto}
                      </label>
                    ))}
                    <p className="text-xs text-muted-foreground/70 font-light">
                      Marque apenas o que o responsável autorizou por escrito.
                    </p>
                  </div>

                  {!editando && (
                    <div className="rounded-2xl border border-border/60 p-4 space-y-4">
                      <p className="text-xs uppercase tracking-[0.3em] text-cyan-glow">
                        Responsável e telefone de emergência
                      </p>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <Rotulo obrigatorio>Nome do responsável</Rotulo>
                          <CampoTexto
                            value={formResponsavel.nome}
                            onChange={(e) =>
                              setFormResponsavel({ ...formResponsavel, nome: e.target.value })
                            }
                            maxLength={160}
                          />
                        </div>
                        <div>
                          <Rotulo>Parentesco</Rotulo>
                          <CampoTexto
                            value={formResponsavel.parentesco}
                            onChange={(e) =>
                              setFormResponsavel({ ...formResponsavel, parentesco: e.target.value })
                            }
                            maxLength={40}
                            placeholder="Mãe, pai, avó…"
                          />
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <Rotulo obrigatorio ajuda="com DDD">
                            Telefone
                          </Rotulo>
                          <CampoTexto
                            type="tel"
                            value={formResponsavel.telefone}
                            onChange={(e) =>
                              setFormResponsavel({ ...formResponsavel, telefone: e.target.value })
                            }
                            maxLength={40}
                            placeholder="(21) 99999-0000"
                          />
                        </div>
                        <div>
                          <Rotulo ajuda="para quando o primeiro não atender">Outro telefone</Rotulo>
                          <CampoTexto
                            type="tel"
                            value={formResponsavel.telefone_alternativo}
                            onChange={(e) =>
                              setFormResponsavel({
                                ...formResponsavel,
                                telefone_alternativo: e.target.value,
                              })
                            }
                            maxLength={40}
                          />
                        </div>
                      </div>
                      <div>
                        <Rotulo ajuda="opcional">E-mail</Rotulo>
                        <CampoTexto
                          type="email"
                          value={formResponsavel.email}
                          onChange={(e) =>
                            setFormResponsavel({ ...formResponsavel, email: e.target.value })
                          }
                          maxLength={160}
                        />
                      </div>
                      <label className="flex items-start gap-3 text-sm text-foreground font-light cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formResponsavel.pode_retirar}
                          onChange={(e) =>
                            setFormResponsavel({
                              ...formResponsavel,
                              pode_retirar: e.target.checked,
                            })
                          }
                          className="mt-1 accent-cyan-600"
                        />
                        Pode retirar a criança ao fim do encontro
                      </label>
                      <p className="text-xs text-muted-foreground/70 font-light">
                        Outros responsáveis podem ser acrescentados depois, abrindo a ficha.
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <BotaoPrimario type="submit" disabled={ocupado === "crianca"}>
                      {ocupado === "crianca"
                        ? "Salvando…"
                        : editando
                          ? "Salvar ficha"
                          : "Cadastrar"}
                    </BotaoPrimario>
                    {editando && (
                      <BotaoDiscreto
                        type="button"
                        onClick={() => {
                          setEditando(null);
                          setCriandoCrianca(false);
                          setFormCrianca({ ...formCriancaVazio });
                        }}
                      >
                        Cancelar
                      </BotaoDiscreto>
                    )}
                  </div>
                </form>
              </Cartao>
            )}

            {ativas.length === 0 && arquivadas.length === 0 ? (
              <Vazio texto="Nenhuma criança cadastrada ainda." />
            ) : (
              <div className="space-y-2 print:hidden">
                {[...ativas, ...arquivadas].map((c) => {
                  const resp = responsaveis.filter((r) => r.crianca_id === c.id);
                  const turma = turmas.find((t) => t.id === c.turma_id);
                  const historico = presencas[c.id] ?? [];
                  const notas = avaliacoes[c.id] ?? [];
                  const presentes = historico.filter((p) => p.presente).length;
                  const aberta = detalhe === c.id;

                  return (
                    <article
                      key={c.id}
                      className={`glass rounded-2xl p-5 ${c.ativa ? "" : "opacity-60"}`}
                    >
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <p className="text-foreground inline-flex items-center gap-2 flex-wrap">
                            {c.nome}
                            {!c.ativa && <Etiqueta>Arquivada</Etiqueta>}
                            {c.alergias && (
                              <Etiqueta tom="vermelho">
                                <TriangleAlert size={10} strokeWidth={2} /> Alergia
                              </Etiqueta>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground/70 mt-1">
                            {idadeEmAnos(c.data_nascimento)} anos ·{" "}
                            {turma ? turma.nome : "Sem turma"}
                            {resp[0] && ` · ${resp[0].nome}`}
                          </p>
                          {resp[0] && (
                            <a
                              href={`tel:${resp[0].telefone.replace(/[^\d+]/g, "")}`}
                              className="text-xs text-cyan-700 hover:underline mt-1 inline-flex items-center gap-1"
                            >
                              <Phone size={11} strokeWidth={1.8} /> {resp[0].telefone}
                            </a>
                          )}
                        </div>
                        <BotaoDiscreto onClick={() => abrirFicha(c.id)}>
                          <span className="inline-flex items-center gap-1.5">
                            <ChevronDown
                              size={13}
                              strokeWidth={1.8}
                              className={
                                aberta ? "rotate-180 transition-transform" : "transition-transform"
                              }
                            />
                            {aberta ? "Fechar" : "Abrir ficha"}
                          </span>
                        </BotaoDiscreto>
                      </div>

                      {aberta && (
                        <div className="mt-5 pt-5 border-t border-border/40 space-y-6">
                          {/* Responsáveis */}
                          <section className="space-y-3">
                            <p className="text-[11px] uppercase tracking-widest text-muted-foreground/60">
                              Responsáveis e telefones de emergência
                            </p>
                            {resp.length === 0 ? (
                              <Aviso tipo="erro">
                                Esta ficha não tem telefone de emergência. Cadastre um responsável.
                              </Aviso>
                            ) : (
                              resp.map((r) => (
                                <div
                                  key={r.id}
                                  className="rounded-xl border border-border/60 p-3 flex items-start justify-between gap-3 flex-wrap"
                                >
                                  <div>
                                    <p className="text-sm text-foreground">
                                      {r.nome}
                                      {r.parentesco && (
                                        <span className="text-muted-foreground/70 font-light">
                                          {" "}
                                          · {r.parentesco}
                                        </span>
                                      )}
                                    </p>
                                    <div className="flex gap-3 flex-wrap mt-1">
                                      <a
                                        href={`tel:${r.telefone.replace(/[^\d+]/g, "")}`}
                                        className="text-sm text-cyan-700 hover:underline inline-flex items-center gap-1"
                                      >
                                        <Phone size={12} strokeWidth={1.8} /> {r.telefone}
                                      </a>
                                      {r.telefone_alternativo && (
                                        <a
                                          href={`tel:${r.telefone_alternativo.replace(/[^\d+]/g, "")}`}
                                          className="text-sm text-cyan-700 hover:underline inline-flex items-center gap-1"
                                        >
                                          <Phone size={12} strokeWidth={1.8} />{" "}
                                          {r.telefone_alternativo}
                                        </a>
                                      )}
                                    </div>
                                    {r.email && (
                                      <p className="text-xs text-muted-foreground/70 mt-1">
                                        {r.email}
                                      </p>
                                    )}
                                    {r.observacao && (
                                      <p className="text-xs text-muted-foreground/70 mt-1 font-light">
                                        {r.observacao}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {r.pode_retirar ? (
                                      <Etiqueta tom="verde">Pode retirar</Etiqueta>
                                    ) : (
                                      <Etiqueta tom="ambar">Não retira</Etiqueta>
                                    )}
                                    <BotaoDiscreto
                                      onClick={() => apagarResponsavel(r.id)}
                                      disabled={ocupado === r.id}
                                    >
                                      <Trash2 size={12} strokeWidth={1.8} />
                                    </BotaoDiscreto>
                                  </div>
                                </div>
                              ))
                            )}

                            {novoResponsavel === c.id ? (
                              <div className="rounded-xl border border-border/60 p-4 space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                  <div>
                                    <Rotulo obrigatorio>Nome</Rotulo>
                                    <CampoTexto
                                      value={formResponsavelExtra.nome}
                                      onChange={(e) =>
                                        setFormResponsavelExtra({
                                          ...formResponsavelExtra,
                                          nome: e.target.value,
                                        })
                                      }
                                      maxLength={160}
                                    />
                                  </div>
                                  <div>
                                    <Rotulo>Parentesco</Rotulo>
                                    <CampoTexto
                                      value={formResponsavelExtra.parentesco}
                                      onChange={(e) =>
                                        setFormResponsavelExtra({
                                          ...formResponsavelExtra,
                                          parentesco: e.target.value,
                                        })
                                      }
                                      maxLength={40}
                                    />
                                  </div>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                  <div>
                                    <Rotulo obrigatorio ajuda="com DDD">
                                      Telefone
                                    </Rotulo>
                                    <CampoTexto
                                      type="tel"
                                      value={formResponsavelExtra.telefone}
                                      onChange={(e) =>
                                        setFormResponsavelExtra({
                                          ...formResponsavelExtra,
                                          telefone: e.target.value,
                                        })
                                      }
                                      maxLength={40}
                                    />
                                  </div>
                                  <div>
                                    <Rotulo ajuda="opcional">Outro telefone</Rotulo>
                                    <CampoTexto
                                      type="tel"
                                      value={formResponsavelExtra.telefone_alternativo}
                                      onChange={(e) =>
                                        setFormResponsavelExtra({
                                          ...formResponsavelExtra,
                                          telefone_alternativo: e.target.value,
                                        })
                                      }
                                      maxLength={40}
                                    />
                                  </div>
                                </div>
                                <label className="flex items-start gap-3 text-sm text-foreground font-light cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={formResponsavelExtra.pode_retirar}
                                    onChange={(e) =>
                                      setFormResponsavelExtra({
                                        ...formResponsavelExtra,
                                        pode_retirar: e.target.checked,
                                      })
                                    }
                                    className="mt-1 accent-cyan-600"
                                  />
                                  Pode retirar a criança ao fim do encontro
                                </label>
                                <div className="flex gap-2">
                                  <BotaoPrimario
                                    type="button"
                                    onClick={() => adicionarResponsavel(c.id)}
                                    disabled={ocupado === "responsavel"}
                                  >
                                    {ocupado === "responsavel" ? "Salvando…" : "Salvar responsável"}
                                  </BotaoPrimario>
                                  <BotaoDiscreto onClick={() => setNovoResponsavel(null)}>
                                    Cancelar
                                  </BotaoDiscreto>
                                </div>
                              </div>
                            ) : (
                              <BotaoDiscreto onClick={() => setNovoResponsavel(c.id)}>
                                <span className="inline-flex items-center gap-1.5">
                                  <UserPlus size={12} strokeWidth={1.8} /> Acrescentar responsável
                                </span>
                              </BotaoDiscreto>
                            )}
                          </section>

                          {/* Saúde e autorizações */}
                          <section className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-3">
                              <p className="text-[11px] uppercase tracking-widest text-muted-foreground/60">
                                Saúde
                              </p>
                              {c.alergias ? (
                                <p className="text-sm text-red-700 font-light">
                                  <span className="font-medium">Alergias:</span> {c.alergias}
                                </p>
                              ) : (
                                <p className="text-sm text-muted-foreground/70 font-light">
                                  Sem alergia registrada.
                                </p>
                              )}
                              {c.medicamentos && (
                                <p className="text-sm text-foreground/90 font-light">
                                  <span className="text-muted-foreground/70">Medicamentos:</span>{" "}
                                  {c.medicamentos}
                                </p>
                              )}
                              {c.condicoes_saude && (
                                <p className="text-sm text-foreground/90 font-light">
                                  <span className="text-muted-foreground/70">Condições:</span>{" "}
                                  {c.condicoes_saude}
                                </p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <p className="text-[11px] uppercase tracking-widest text-muted-foreground/60">
                                Autorizações
                              </p>
                              <div className="flex flex-wrap gap-2">
                                <Etiqueta tom={c.autoriza_imagem ? "verde" : "neutro"}>
                                  Imagem {c.autoriza_imagem ? "autorizada" : "não autorizada"}
                                </Etiqueta>
                                <Etiqueta tom={c.autoriza_passeio ? "verde" : "neutro"}>
                                  Passeios {c.autoriza_passeio ? "autorizados" : "não autorizados"}
                                </Etiqueta>
                                <Etiqueta tom={c.pode_sair_sozinha ? "ambar" : "neutro"}>
                                  {c.pode_sair_sozinha ? "Pode sair sozinha" : "Sai acompanhada"}
                                </Etiqueta>
                              </div>
                              <p className="text-xs text-muted-foreground/60 font-light">
                                Matriculada em {dataCurta(c.matriculada_em)}
                              </p>
                            </div>
                          </section>

                          {c.observacoes && (
                            <section>
                              <p className="text-[11px] uppercase tracking-widest text-muted-foreground/60 mb-1">
                                Observações
                              </p>
                              <p className="text-sm text-foreground/90 font-light whitespace-pre-wrap leading-relaxed">
                                {c.observacoes}
                              </p>
                            </section>
                          )}

                          {/* Desempenho */}
                          <section className="space-y-4">
                            <p className="text-[11px] uppercase tracking-widest text-muted-foreground/60">
                              Acompanhamento
                            </p>

                            <div className="flex flex-wrap gap-2">
                              <Etiqueta tom="ciano">
                                <CalendarCheck size={10} strokeWidth={2} /> {presentes} presenças em{" "}
                                {historico.length} encontros
                              </Etiqueta>
                              {historico.length > 0 && (
                                <Etiqueta
                                  tom={
                                    presentes / historico.length >= 0.75
                                      ? "verde"
                                      : presentes / historico.length >= 0.5
                                        ? "ambar"
                                        : "vermelho"
                                  }
                                >
                                  {Math.round((presentes / historico.length) * 100)}% de frequência
                                </Etiqueta>
                              )}
                            </div>

                            {notas.length > 0 && (
                              <div className="space-y-2">
                                {notas.map((a) => (
                                  <div
                                    key={a.id}
                                    className="rounded-xl border border-border/60 p-3"
                                  >
                                    <p className="text-xs text-muted-foreground/70">
                                      {dataCurta(a.data_avaliacao)} · {a.autor_nome}
                                    </p>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      {EIXOS.map((eixo) =>
                                        a[eixo.campo] != null ? (
                                          <Etiqueta key={eixo.campo}>
                                            {eixo.rotulo} {a[eixo.campo]}/5
                                          </Etiqueta>
                                        ) : null,
                                      )}
                                    </div>
                                    {a.comentario && (
                                      <p className="text-sm text-foreground/90 font-light mt-2 whitespace-pre-wrap">
                                        {a.comentario}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="rounded-xl border border-border/60 p-4 space-y-4">
                              <p className="text-xs uppercase tracking-[0.3em] text-cyan-glow">
                                Registrar acompanhamento
                              </p>
                              <div className="grid gap-4 sm:grid-cols-4">
                                <div>
                                  <Rotulo>Data</Rotulo>
                                  <CampoTexto
                                    type="date"
                                    value={formAvaliacao.data_avaliacao}
                                    onChange={(e) =>
                                      setFormAvaliacao({
                                        ...formAvaliacao,
                                        data_avaliacao: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                {EIXOS.map((eixo) => (
                                  <div key={eixo.campo}>
                                    <Rotulo ajuda={eixo.ajuda}>{eixo.rotulo}</Rotulo>
                                    <CampoSelecao
                                      value={formAvaliacao[eixo.campo]}
                                      onChange={(e) =>
                                        setFormAvaliacao({
                                          ...formAvaliacao,
                                          [eixo.campo]: e.target.value,
                                        })
                                      }
                                    >
                                      <option value="">—</option>
                                      {[1, 2, 3, 4, 5].map((n) => (
                                        <option key={n} value={n}>
                                          {n}
                                        </option>
                                      ))}
                                    </CampoSelecao>
                                  </div>
                                ))}
                              </div>
                              <div>
                                <Rotulo ajuda="o que a próxima pessoa que assumir a turma precisa saber">
                                  Comentário
                                </Rotulo>
                                <CampoArea
                                  rows={3}
                                  value={formAvaliacao.comentario}
                                  onChange={(e) =>
                                    setFormAvaliacao({
                                      ...formAvaliacao,
                                      comentario: e.target.value,
                                    })
                                  }
                                  maxLength={2000}
                                />
                              </div>
                              <BotaoPrimario
                                type="button"
                                onClick={() => salvarAvaliacao(c.id)}
                                disabled={ocupado === "avaliacao"}
                              >
                                {ocupado === "avaliacao" ? "Salvando…" : "Registrar"}
                              </BotaoPrimario>
                            </div>
                          </section>

                          <div className="flex gap-2 justify-end flex-wrap">
                            <BotaoDiscreto onClick={() => abrirEdicao(c)}>
                              Editar ficha
                            </BotaoDiscreto>
                            <BotaoDiscreto
                              onClick={() => alternarAtiva(c)}
                              disabled={ocupado === c.id}
                            >
                              {c.ativa ? "Arquivar" : "Reativar"}
                            </BotaoDiscreto>
                            <BotaoDiscreto
                              onClick={() => apagarCrianca(c)}
                              disabled={ocupado === c.id}
                            >
                              <Trash2 size={13} strokeWidth={1.8} />
                            </BotaoDiscreto>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}

            {/* Folha de emergência: existe só no papel. Numa emergência ninguém
                abre ficha por ficha no celular — a lista fica na parede da
                sala, com o telefone e a alergia de cada criança. */}
            <div className="hidden print:block text-black">
              <h1 className="text-lg font-bold mb-1">Contatos de emergência — Evangelização</h1>
              <p className="text-xs mb-4">
                {sigla} · Impresso em {new Date().toLocaleDateString("pt-BR")}
              </p>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr>
                    {["Criança", "Turma", "Alergias / saúde", "Responsáveis e telefones"].map(
                      (th) => (
                        <th key={th} className="border border-black/40 p-1 text-left">
                          {th}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {ativas.map((c) => (
                    <tr key={c.id}>
                      <td className="border border-black/40 p-1 align-top">
                        {c.nome} ({idadeEmAnos(c.data_nascimento)})
                      </td>
                      <td className="border border-black/40 p-1 align-top">
                        {turmas.find((t) => t.id === c.turma_id)?.nome ?? "—"}
                      </td>
                      <td className="border border-black/40 p-1 align-top">
                        {[c.alergias, c.medicamentos, c.condicoes_saude]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </td>
                      <td className="border border-black/40 p-1 align-top">
                        {responsaveis
                          .filter((r) => r.crianca_id === c.id)
                          .map((r) => `${r.nome}: ${r.telefone}`)
                          .join(" · ") || "sem telefone cadastrado"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </PaginaComunidade>
  );
}
