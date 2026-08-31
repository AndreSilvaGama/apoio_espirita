import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Building2, ChevronLeft, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ESTADOS, nomeDoEstado, caminhoDaCidade } from "@/lib/diretorio";
import { ConviteParaCompartilhar } from "@/components/Compartilhar";
import { SITE, paginaPublica, migalhas } from "@/lib/seo";

/** Cidades de um estado que têm casa espírita no diretório. */

interface CidadeNoDiretorio {
  cidade: string;
  slug: string;
  casas: number;
}

async function carregarCidades(uf: string): Promise<CidadeNoDiretorio[]> {
  const { data, error } = await supabase.rpc("diretorio_cidades", { p_uf: uf });
  if (error) throw error;
  return (data ?? []) as CidadeNoDiretorio[];
}

export const Route = createFileRoute("/casas/$uf/")({
  loader: ({ params }) => {
    const uf = params.uf.toUpperCase();
    // Endereço inventado não vira página vazia: vira 404, para o buscador não
    // guardar no índice uma tela sem conteúdo.
    if (!ESTADOS[uf]) throw notFound();
    return carregarCidades(uf);
  },
  head: ({ params, loaderData }) => {
    const uf = params.uf.toUpperCase();
    const estado = nomeDoEstado(params.uf);
    const url = `${SITE}/casas/${params.uf.toLowerCase()}`;
    const cidades = loaderData?.length ?? 0;
    const casas = (loaderData ?? []).reduce((soma, c) => soma + Number(c.casas), 0);

    // Numero na descricao porque numero e o que distingue esta pagina das
    // outras 26: "1.204 casas em 189 cidades" e informacao, "casas espiritas
    // de Sao Paulo" e so o titulo repetido.
    const descricao = casas
      ? `${casas.toLocaleString("pt-BR")} ${casas === 1 ? "casa espírita" : "casas espíritas"} em ${cidades.toLocaleString("pt-BR")} ${cidades === 1 ? "cidade" : "cidades"}${estado ? " de " + estado : ""}: endereço, telefone e como chegar. Consulta livre, sem cadastro.`
      : `Casas espíritas${estado ? " de " + estado : ""} por cidade: endereço, telefone e como chegar. Consulta livre, sem cadastro.`;

    return {
      ...paginaPublica({
        titulo: `Casas espíritas${estado ? " em " + estado : ""}`,
        descricao,
        url,
      }),
      scripts: [
        migalhas([
          { nome: "Casas espíritas", caminho: "/casas" },
          { nome: estado || uf, caminho: `/casas/${params.uf.toLowerCase()}` },
        ]),
      ],
    };
  },
  component: DiretorioCidades,
});

function DiretorioCidades() {
  const cidades = Route.useLoaderData();
  const { uf } = Route.useParams();
  const estado = nomeDoEstado(uf);
  const totalCasas = cidades.reduce((soma, c) => soma + Number(c.casas), 0);

  return (
    <main className="page-light min-h-screen px-4 pt-20 pb-20">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/casas"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-cyan-glow transition-colors mb-6"
        >
          <ChevronLeft size={14} strokeWidth={1.8} />
          Todos os estados
        </Link>

        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.4em] text-cyan-glow mb-2">
            {uf.toUpperCase()}
          </p>
          <h1 className="text-3xl font-light text-foreground">Casas espíritas em {estado}</h1>
          <p className="mt-3 text-sm text-muted-foreground font-light leading-relaxed">
            {totalCasas.toLocaleString("pt-BR")}{" "}
            {totalCasas === 1 ? "casa espírita" : "casas espíritas"} em{" "}
            {cidades.length.toLocaleString("pt-BR")} {cidades.length === 1 ? "cidade" : "cidades"}.
            Escolha a sua cidade para ver o endereço e o contato de cada uma.
          </p>
        </div>

        {cidades.length === 0 ? (
          <div className="glass rounded-3xl p-10 text-center">
            <Building2
              size={28}
              strokeWidth={1.2}
              className="text-muted-foreground/30 mx-auto mb-3"
            />
            <p className="text-sm text-muted-foreground font-light">
              Nenhuma casa espírita listada em {estado} no momento.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {cidades.map((cidade) => (
              <Link
                key={cidade.slug}
                to={caminhoDaCidade(uf, cidade.slug)}
                className="glass rounded-2xl px-5 py-4 flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center shrink-0">
                  <MapPin size={18} strokeWidth={1.5} className="text-cyan-700" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{cidade.cidade}</p>
                  <p className="text-xs text-muted-foreground/70">
                    {Number(cidade.casas).toLocaleString("pt-BR")}{" "}
                    {Number(cidade.casas) === 1 ? "casa" : "casas"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        <ConviteParaCompartilhar
          titulo={`Casas espíritas em ${estado}`}
          contexto={`${totalCasas.toLocaleString("pt-BR")} casas em ${cidades.length.toLocaleString("pt-BR")} cidades, com endereço e telefone.`}
          url={`${SITE}/casas/${uf.toLowerCase()}`}
          chamada="Ajude alguém a encontrar a casa mais perto"
          explicacao="Envie esta lista por WhatsApp para o grupo da sua casa ou para quem acabou de se mudar de cidade. Abre sem cadastro."
        />
      </div>
    </main>
  );
}
