import { createFileRoute, Link, notFound, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Building2, ChevronLeft, ExternalLink, MapPin, Phone, Shield, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { mensagemDeErro } from "@/lib/erros";
import {
  ESTADOS,
  nomeDoEstado,
  nomeProprio,
  cepFormatado,
  enderecoParaMapa,
  caminhoDoEstado,
} from "@/lib/diretorio";

/**
 * As casas espíritas de uma cidade — a página que responde a quem procura
 * "centro espírita perto de mim".
 *
 * Cada casa listada veio de cadastro público e não pediu para estar aqui. Por
 * isso a página carrega, junto de cada casa, o caminho para a direção assumir a
 * página ou retirar a casa do diretório na hora, sem justificar.
 */

interface CasaNoDiretorio {
  id: string;
  nome: string;
  sigla: string | null;
  endereco: string | null;
  cep: string | null;
  cidade: string;
  estado: string;
  telefone: string | null;
  tem_pagina: boolean;
}

async function carregarCasas(uf: string, cidadeSlug: string): Promise<CasaNoDiretorio[]> {
  const { data, error } = await supabase.rpc("diretorio_casas", {
    p_uf: uf,
    p_cidade_slug: cidadeSlug,
  });
  if (error) throw error;
  return (data ?? []) as CasaNoDiretorio[];
}

export const Route = createFileRoute("/casas/$uf/$cidade")({
  loader: async ({ params }) => {
    const uf = params.uf.toUpperCase();
    if (!ESTADOS[uf]) throw notFound();
    const casas = await carregarCasas(uf, params.cidade.toLowerCase());
    // Cidade sem nenhuma casa não vira página vazia no índice do buscador.
    if (casas.length === 0) throw notFound();
    return casas;
  },
  head: ({ params, loaderData }) => {
    const estado = nomeDoEstado(params.uf);
    const cidade = loaderData?.[0]?.cidade ?? params.cidade;
    const total = loaderData?.length ?? 0;
    const url = `https://apoioespirita.com.br/casas/${params.uf.toLowerCase()}/${params.cidade.toLowerCase()}`;
    const titulo = `Casas espíritas em ${cidade}, ${params.uf.toUpperCase()} — Apoio Espírita`;
    const descricao = `${total} ${total === 1 ? "casa espírita" : "casas espíritas"} em ${cidade}${estado ? ", " + estado : ""}: endereço, telefone e como chegar. Consulta livre, sem cadastro.`;
    return {
      meta: [
        { title: titulo },
        { name: "description", content: descricao },
        { property: "og:title", content: titulo },
        { property: "og:description", content: descricao },
        { property: "og:url", content: url },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: loaderData
        ? [
            {
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "ItemList",
                name: `Casas espíritas em ${cidade}`,
                numberOfItems: total,
                itemListElement: loaderData.slice(0, 50).map((casa, indice) => ({
                  "@type": "ListItem",
                  position: indice + 1,
                  item: {
                    "@type": "PlaceOfWorship",
                    name: nomeProprio(casa.nome),
                    address: {
                      "@type": "PostalAddress",
                      streetAddress: casa.endereco ?? undefined,
                      addressLocality: casa.cidade,
                      addressRegion: casa.estado,
                      postalCode: casa.cep ?? undefined,
                      addressCountry: "BR",
                    },
                    telephone: casa.telefone ?? undefined,
                  },
                })),
              }),
            },
          ]
        : [],
    };
  },
  component: DiretorioCasasDaCidade,
});

function DiretorioCasasDaCidade() {
  const casas = Route.useLoaderData();
  const { uf } = Route.useParams();
  const router = useRouter();
  const { user, profile } = useAuth();
  const [pedindoRemocao, setPedindoRemocao] = useState<string | null>(null);
  const [assumindo, setAssumindo] = useState<string | null>(null);

  // Quem chegou por um convite traz `?c=` no endereço. Registrar isso é o que
  // responde se o convite deu resultado — abertura de e-mail mede intenção,
  // chegada mede resultado.
  //
  // Lido de `window.location` e não dos parâmetros da rota de propósito: assim
  // esta página, que é pública e indexada, não muda de contrato por causa de
  // uma medição. O efeito só roda no navegador, e falhar aqui não pode
  // atrapalhar quem veio ler — por isso o erro é engolido de propósito: a
  // visitante veio ver as casas da cidade dela, não alimentar o nosso número.
  useEffect(() => {
    const convite = new URLSearchParams(window.location.search).get("c");
    if (!convite || !/^[0-9a-f-]{36}$/i.test(convite)) return;
    void supabase.rpc("registrar_chegada_convite", { p_convite: convite }).then(() => {});
  }, []);

  const cidade = casas[0]?.cidade ?? "";
  const estado = nomeDoEstado(uf);

  return (
    <main className="page-light min-h-screen px-4 pt-20 pb-20">
      <div className="mx-auto max-w-3xl">
        <Link
          to={caminhoDoEstado(uf)}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-cyan-glow transition-colors mb-6"
        >
          <ChevronLeft size={14} strokeWidth={1.8} />
          Cidades de {estado}
        </Link>

        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.4em] text-cyan-glow mb-2">
            {cidade} · {uf.toUpperCase()}
          </p>
          <h1 className="text-3xl font-light text-foreground">Casas espíritas em {cidade}</h1>
          <p className="mt-3 text-sm text-muted-foreground font-light leading-relaxed">
            {casas.length === 1
              ? "Uma casa espírita listada nesta cidade"
              : `${casas.length} casas espíritas listadas nesta cidade`}
            . Você pode chegar em qualquer uma delas sem avisar e sem pagar nada — as atividades
            públicas são abertas a quem quiser entrar. Quando puder, confirme o horário por telefone
            antes de ir.
          </p>
        </div>

        <div className="space-y-3">
          {casas.map((casa) => (
            <div key={casa.id} className="glass rounded-2xl p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center shrink-0">
                  <Building2 size={18} strokeWidth={1.5} className="text-cyan-700" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-medium text-foreground leading-snug">
                    {nomeProprio(casa.nome)}
                  </h2>

                  {casa.endereco && (
                    <p className="mt-1 text-xs text-muted-foreground/80 leading-relaxed">
                      {nomeProprio(casa.endereco)}
                      {casa.cep ? ` · CEP ${cepFormatado(casa.cep)}` : ""}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {casa.telefone && (
                      <a
                        href={`tel:${casa.telefone.replace(/\D/g, "")}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-cyan-glow border border-cyan-glow/30 hover:bg-cyan-glow/10 transition-colors"
                      >
                        <Phone size={12} strokeWidth={1.8} />
                        {casa.telefone}
                      </a>
                    )}
                    {casa.endereco && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(enderecoParaMapa(casa))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground border border-border hover:bg-white/5 transition-colors"
                      >
                        <MapPin size={12} strokeWidth={1.8} />
                        Como chegar
                      </a>
                    )}
                    {casa.tem_pagina && casa.sigla && (
                      <Link
                        to="/casa/$sigla"
                        params={{ sigla: casa.sigla }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-emerald-700 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                      >
                        <ExternalLink size={12} strokeWidth={1.8} />
                        Ver a página da casa
                      </Link>
                    )}
                  </div>

                  {assumindo === casa.id ? (
                    <FormularioReivindicacao
                      casa={casa}
                      siglaSugerida={profile?.sigla_casa ?? ""}
                      logado={Boolean(user)}
                      onFechar={() => setAssumindo(null)}
                    />
                  ) : pedindoRemocao === casa.id ? (
                    <FormularioRemocao
                      casa={casa}
                      onFechar={() => setPedindoRemocao(null)}
                      onPronto={() => {
                        setPedindoRemocao(null);
                        router.invalidate();
                      }}
                    />
                  ) : (
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                      {!casa.tem_pagina && (
                        <button
                          type="button"
                          onClick={() => {
                            setPedindoRemocao(null);
                            setAssumindo(casa.id);
                          }}
                          className="text-[11px] text-cyan-glow hover:underline underline-offset-2"
                        >
                          É a minha casa — quero cuidar desta página
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setAssumindo(null);
                          setPedindoRemocao(casa.id);
                        }}
                        className="text-[11px] text-muted-foreground/50 hover:text-muted-foreground underline underline-offset-2"
                      >
                        É da direção desta casa e quer retirá-la desta lista?
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 glass rounded-2xl p-6 space-y-3">
          <h2 className="text-sm font-medium text-foreground">
            Faz parte da direção de uma destas casas?
          </h2>
          <p className="text-xs text-muted-foreground/80 leading-relaxed">
            A casa pode ter uma página própria aqui, gratuita, com a descrição, os horários das
            atividades, o contato e a chave PIX para doações — e passa a aparecer nesta lista com o
            botão de abrir. Para isso, crie a sua conta, informe a sigla da casa e publique a página
            pela aba Configurações.
          </p>
          <Link
            to="/login"
            className="inline-block px-4 py-2 rounded-xl text-xs uppercase tracking-widest text-cyan-glow border border-cyan-glow/40 hover:bg-cyan-glow/10 transition-colors"
          >
            Criar a conta da casa
          </Link>
          <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
            Prefere que a casa não apareça? O pedido é atendido na hora, sem justificar: use o link
            abaixo do nome dela.
          </p>
        </div>
      </div>
    </main>
  );
}

/**
 * Assume a página de uma casa listada no diretório.
 *
 * A casa é assumida na hora, sem conferência humana — decisão do dono do
 * projeto. A página nasce privada, como toda página de casa, então nada é dito
 * em nome da casa até que alguém publique.
 */
function FormularioReivindicacao({
  casa,
  siglaSugerida,
  logado,
  onFechar,
}: {
  casa: CasaNoDiretorio;
  siglaSugerida: string;
  logado: boolean;
  onFechar: () => void;
}) {
  const navigate = useNavigate();
  const [sigla, setSigla] = useState(siglaSugerida.toUpperCase());
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  const assumir = async () => {
    const escolhida = sigla.trim().toUpperCase();
    if (!/^[A-Z]{5}$/.test(escolhida)) {
      setErro("A sigla precisa ter exatamente 5 letras, sem espaços nem números.");
      return;
    }
    setEnviando(true);
    setErro("");
    try {
      const { data, error } = await supabase.rpc("reivindicar_casa", {
        p_casa: casa.id,
        p_sigla: escolhida,
      });
      if (error) throw error;
      navigate({
        to: "/casa/$sigla",
        params: { sigla: (data as string) ?? escolhida },
        search: { aba: "configuracoes" },
      });
    } catch (e: unknown) {
      setErro(mensagemDeErro(e));
      setEnviando(false);
    }
  };

  if (!logado) {
    return (
      <div className="mt-4 rounded-xl border border-border bg-white/60 p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs text-foreground/80 leading-relaxed">
            Para cuidar da página desta casa você precisa de uma conta no site. Ela é gratuita, e
            depois de criada você volta aqui e assume a página em um clique.
          </p>
          <button
            type="button"
            onClick={onFechar}
            className="text-muted-foreground/40 hover:text-muted-foreground shrink-0"
            title="Fechar"
          >
            <X size={14} />
          </button>
        </div>
        <Link
          to="/login"
          className="inline-block px-4 py-2 rounded-lg text-[11px] uppercase tracking-widest text-cyan-glow border border-cyan-glow/40 hover:bg-cyan-glow/10 transition-colors"
        >
          Criar conta ou entrar
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-cyan-glow/30 bg-cyan-50/40 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <Shield size={14} strokeWidth={1.7} className="text-cyan-700 shrink-0 mt-0.5" />
          <p className="text-xs text-foreground/80 leading-relaxed">
            Escolha a sigla desta casa: cinco letras que a identificam no site e que os membros vão
            usar para se vincular a ela. A página é criada com o nome, o endereço e o telefone que
            já estão no cadastro, e nasce <strong className="font-medium">privada</strong> — nada
            aparece ao público antes de você conferir e publicar.
          </p>
        </div>
        <button
          type="button"
          onClick={onFechar}
          className="text-muted-foreground/40 hover:text-muted-foreground shrink-0"
          title="Fechar"
        >
          <X size={14} />
        </button>
      </div>
      <input
        type="text"
        value={sigla}
        onChange={(e) => {
          setSigla(
            e.target.value
              .toUpperCase()
              .replace(/[^A-Z]/g, "")
              .slice(0, 5),
          );
          setErro("");
        }}
        placeholder="SIGLA"
        maxLength={5}
        className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm tracking-[0.3em] text-center font-medium text-foreground placeholder-muted-foreground/40 focus:outline-none focus:border-cyan-glow/50 transition-colors"
      />
      {erro && <p className="text-[11px] text-red-500 leading-relaxed">{erro}</p>}
      <button
        type="button"
        onClick={assumir}
        disabled={enviando}
        className="w-full py-2 rounded-lg text-[11px] uppercase tracking-widest text-cyan-glow border border-cyan-glow/40 hover:bg-cyan-glow/10 disabled:opacity-40 transition-colors"
      >
        {enviando ? "Criando a página…" : "Assumir esta casa"}
      </button>
    </div>
  );
}

function FormularioRemocao({
  casa,
  onFechar,
  onPronto,
}: {
  casa: CasaNoDiretorio;
  onFechar: () => void;
  onPronto: () => void;
}) {
  const [nome, setNome] = useState("");
  const [contato, setContato] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  const enviar = async () => {
    if (!nome.trim() || !contato.trim()) {
      setErro("Informe o seu nome e um contato.");
      return;
    }
    setEnviando(true);
    setErro("");
    try {
      const { error } = await supabase.rpc("remover_casa_do_diretorio", {
        p_casa: casa.id,
        p_nome: nome.trim(),
        p_contato: contato.trim(),
      });
      if (error) throw error;
      onPronto();
    } catch (e: unknown) {
      setErro(mensagemDeErro(e));
      setEnviando(false);
    }
  };

  return (
    <div className="mt-4 rounded-xl border border-border bg-white/60 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs text-foreground/80 leading-relaxed">
          A casa sai da lista assim que você enviar, e não pedimos o motivo. Guardamos apenas quem
          fez o pedido, para poder desfazer caso tenha sido engano de outra pessoa.
        </p>
        <button
          type="button"
          onClick={onFechar}
          className="text-muted-foreground/40 hover:text-muted-foreground shrink-0"
          title="Fechar"
        >
          <X size={14} />
        </button>
      </div>
      <input
        type="text"
        value={nome}
        onChange={(e) => {
          setNome(e.target.value);
          setErro("");
        }}
        placeholder="Seu nome"
        className="w-full rounded-lg border border-border bg-white px-3 py-2 text-xs text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-cyan-glow/40 transition-colors"
      />
      <input
        type="text"
        value={contato}
        onChange={(e) => {
          setContato(e.target.value);
          setErro("");
        }}
        placeholder="E-mail ou telefone para confirmarmos"
        className="w-full rounded-lg border border-border bg-white px-3 py-2 text-xs text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-cyan-glow/40 transition-colors"
      />
      {erro && <p className="text-[11px] text-red-500">{erro}</p>}
      <button
        type="button"
        onClick={enviar}
        disabled={enviando}
        className="w-full py-2 rounded-lg text-[11px] uppercase tracking-widest text-rose-600 border border-rose-200 hover:bg-rose-50 disabled:opacity-40 transition-colors"
      >
        {enviando ? "Retirando…" : "Retirar esta casa da lista"}
      </button>
    </div>
  );
}
