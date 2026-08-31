import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ESTADOS, nomeDoEstado, caminhoDoEstado } from "@/lib/diretorio";
import { ConviteParaCompartilhar } from "@/components/Compartilhar";
import { SITE, migalhas } from "@/lib/seo";

/**
 * Índice nacional do diretório de casas espíritas.
 *
 * Os dados são carregados no `loader`, e não num `useEffect`, de propósito: esta
 * página existe para ser encontrada por quem procura um centro espírita, e um
 * buscador precisa achar a lista já no HTML que o servidor devolve.
 */

interface EstadoNoDiretorio {
  estado: string;
  casas: number;
  cidades: number;
}

async function carregarEstados(): Promise<EstadoNoDiretorio[]> {
  const { data, error } = await supabase.rpc("diretorio_estados");
  if (error) throw error;
  return (data ?? []) as EstadoNoDiretorio[];
}

export const Route = createFileRoute("/casas/")({
  loader: () => carregarEstados(),
  head: () => ({
    meta: [
      { title: "Casas Espíritas do Brasil, por estado e cidade — Apoio Espírita" },
      {
        name: "description",
        content:
          "Encontre uma casa espírita perto de você: endereço, telefone e horários das atividades, organizados por estado e cidade.",
      },
      {
        name: "keywords",
        content:
          "casa espirita perto de mim, centro espirita, casas espiritas por cidade, endereco centro espirita",
      },
      { property: "og:title", content: "Casas Espíritas do Brasil — Apoio Espírita" },
      {
        property: "og:description",
        content:
          "Endereço, telefone e horários das casas espíritas, organizados por estado e cidade.",
      },
      { property: "og:url", content: "https://apoioespirita.com.br/casas" },
    ],
    links: [{ rel: "canonical", href: `${SITE}/casas` }],
    scripts: [migalhas([{ nome: "Casas espíritas", caminho: "/casas" }])],
  }),
  component: DiretorioEstados,
});

function DiretorioEstados() {
  const estados = Route.useLoaderData();
  const totalCasas = estados.reduce((soma, e) => soma + Number(e.casas), 0);
  const totalCidades = estados.reduce((soma, e) => soma + Number(e.cidades), 0);

  return (
    <main className="page-light min-h-screen px-4 pt-20 pb-20">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.4em] text-cyan-glow mb-2">Onde encontrar</p>
          <h1 className="text-3xl font-light text-foreground">Casas espíritas do Brasil</h1>
          <p className="mt-3 text-sm text-muted-foreground font-light max-w-xl leading-relaxed">
            {totalCasas.toLocaleString("pt-BR")} casas em {totalCidades.toLocaleString("pt-BR")}{" "}
            cidades. Escolha o seu estado para ver o endereço e o contato das casas mais próximas de
            você. Entrar em qualquer uma delas não exige conta nem cadastro.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {estados.map((estado) => (
            <Link
              key={estado.estado}
              to={caminhoDoEstado(estado.estado)}
              className="glass rounded-2xl px-5 py-4 flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center shrink-0">
                <MapPin size={18} strokeWidth={1.5} className="text-cyan-700" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">
                  {nomeDoEstado(estado.estado)}
                </p>
                <p className="text-xs text-muted-foreground/70">
                  {Number(estado.casas).toLocaleString("pt-BR")}{" "}
                  {Number(estado.casas) === 1 ? "casa" : "casas"} ·{" "}
                  {Number(estado.cidades).toLocaleString("pt-BR")}{" "}
                  {Number(estado.cidades) === 1 ? "cidade" : "cidades"}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {estados.length === 0 && (
          <div className="glass rounded-3xl p-10 text-center">
            <Building2
              size={28}
              strokeWidth={1.2}
              className="text-muted-foreground/30 mx-auto mb-3"
            />
            <p className="text-sm text-muted-foreground font-light">
              Nenhuma casa espírita listada no momento.
            </p>
          </div>
        )}

        <div className="mt-10 glass rounded-2xl p-6">
          <h2 className="text-sm font-medium text-foreground mb-2">
            A sua casa espírita está nesta lista?
          </h2>
          <p className="text-xs text-muted-foreground/80 leading-relaxed">
            As casas listadas vêm de cadastros públicos, com nome, endereço e telefone. Se você faz
            parte da direção de uma delas, pode assumir a página da casa e acrescentar os horários
            das atividades, a descrição e o contato — ou pedir que ela saia do diretório, na hora e
            sem precisar justificar. As duas opções ficam na página da cidade, junto ao nome da
            casa.
          </p>
          <p className="mt-3 text-xs text-muted-foreground/60">
            Estados atendidos: {Object.keys(ESTADOS).length} unidades da federação.
          </p>
        </div>

        <ConviteParaCompartilhar
          titulo="Diretório nacional de casas espíritas"
          contexto={`${totalCasas.toLocaleString("pt-BR")} casas em ${totalCidades.toLocaleString("pt-BR")} cidades do Brasil, com endereço e telefone.`}
          url={`${SITE}/casas`}
          chamada="Divulgue o diretório"
          explicacao="É a lista mais completa que conseguimos reunir, aberta a qualquer pessoa e sem cadastro. Compartilhar é o que faz uma casa que ainda não está aqui ser encontrada."
        />
      </div>
    </main>
  );
}
