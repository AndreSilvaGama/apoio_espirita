import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { BookOpen, Building2, Compass, Search, User, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { buscarPaginas, termoValido, TERMO_MINIMO, type PaginaDoSite } from "@/lib/busca";
import { mensagemDeErro } from "@/lib/erros";

export const Route = createFileRoute("/busca")({
  // `q` é opcional de propósito. Se fosse sempre devolvido, abrir /busca sem
  // parâmetro faria o roteador redirecionar para /busca?q= só para completar
  // o endereço — uma ida e volta ao servidor antes de a tela aparecer.
  validateSearch: (search: Record<string, unknown>): { q?: string } => {
    const q = typeof search.q === "string" ? search.q : "";
    return q ? { q } : {};
  },
  component: Busca,
});

interface Resultado {
  tipo: string;
  titulo: string;
  subtitulo: string;
  referencia: string | null;
}

const ESPERA_MS = 300;

function Busca() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { q } = Route.useSearch();

  const [termo, setTermo] = useState(q ?? "");
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [paginas, setPaginas] = useState<PaginaDoSite[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState("");
  const [jaBuscou, setJaBuscou] = useState(false);

  // Cada busca recebe um número; só a resposta da última vale. Sem isso, uma
  // consulta lenta de três letras atrás chegaria depois e sobrescreveria o
  // resultado do que a pessoa acabou de digitar.
  const sequencia = useRef(0);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  const buscar = useCallback(async (texto: string) => {
    const meuTurno = ++sequencia.current;
    if (!termoValido(texto)) {
      setResultados([]);
      setPaginas([]);
      setJaBuscou(false);
      setBuscando(false);
      setErro("");
      return;
    }

    setBuscando(true);
    setErro("");
    setPaginas(buscarPaginas(texto));

    const { data, error } = await supabase.rpc("buscar_geral", { termo: texto, limite: 6 });
    if (meuTurno !== sequencia.current) return;

    if (error) {
      setErro(mensagemDeErro(error));
      setResultados([]);
    } else {
      setResultados((data ?? []) as Resultado[]);
    }
    setJaBuscou(true);
    setBuscando(false);
  }, []);

  // Espera a digitação parar antes de consultar o banco.
  useEffect(() => {
    const id = setTimeout(() => void buscar(termo), ESPERA_MS);
    return () => clearTimeout(id);
  }, [termo, buscar]);

  // Mantém o endereço em dia para que o resultado possa ser guardado ou
  // compartilhado, e para o botão voltar do navegador funcionar.
  useEffect(() => {
    const id = setTimeout(() => {
      navigate({ to: "/busca", search: termo ? { q: termo } : {}, replace: true });
    }, ESPERA_MS);
    return () => clearTimeout(id);
  }, [termo, navigate]);

  if (loading || !user) return null;

  const artigos = resultados.filter((r) => r.tipo === "artigo");
  const casas = resultados.filter((r) => r.tipo === "casa");
  const membros = resultados.filter((r) => r.tipo === "membro");
  const totalAchados = paginas.length + resultados.length;
  const curto = termo.trim().length > 0 && !termoValido(termo);

  return (
    <main className="page-light min-h-screen px-4 pt-20 pb-20">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6 mt-6">
          <h1
            style={{ fontFamily: '"Libre Caslon Text", Georgia, serif' }}
            className="text-2xl font-normal text-foreground mb-1"
          >
            Buscar
          </h1>
          <p className="text-sm text-muted-foreground/70 font-light">
            Encontre uma tela do site, um artigo publicado, uma casa espírita cadastrada ou alguém
            da sua casa.
          </p>
        </header>

        <div className="relative mb-8">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none"
          />
          <input
            type="search"
            autoFocus
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            placeholder="O que você procura?"
            aria-label="Termo da busca"
            className="w-full min-h-[52px] rounded-2xl bg-white border border-[rgba(0,20,70,.15)] pl-12 pr-12 py-3 text-base text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[rgba(0,74,140,.6)] transition-colors"
          />
          {termo && (
            <button
              type="button"
              onClick={() => setTermo("")}
              aria-label="Limpar a busca"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full text-muted-foreground/50 hover:text-foreground hover:bg-gray-100 transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {curto && (
          <p className="text-sm text-muted-foreground/60 font-light">
            Escreva pelo menos {TERMO_MINIMO} letras para buscar.
          </p>
        )}

        {erro && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            Não foi possível concluir a busca: {erro}
          </div>
        )}

        {buscando && !jaBuscou && (
          <p className="text-sm text-muted-foreground/60 font-light">Buscando…</p>
        )}

        {!erro && jaBuscou && totalAchados === 0 && (
          <div className="rounded-2xl border border-[rgba(0,20,70,.08)] bg-white px-6 py-8 text-center">
            <p className="text-sm text-foreground font-light mb-1">
              Nada encontrado para “{termo.trim()}”.
            </p>
            <p className="text-xs text-muted-foreground/60">
              Tente outra palavra, ou parte do nome. A busca não diferencia acento nem maiúsculas.
            </p>
          </div>
        )}

        <Grupo titulo="No site" Icone={Compass} vazio={paginas.length === 0}>
          {paginas.map((pagina) => (
            <Link
              key={pagina.href + pagina.titulo}
              to={pagina.href}
              className="block rounded-2xl border border-[rgba(0,20,70,.08)] bg-white px-5 py-4 hover:border-[rgba(0,74,140,.35)] hover:shadow-sm transition-all"
            >
              <p className="text-sm font-medium text-foreground">{pagina.titulo}</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">{pagina.descricao}</p>
            </Link>
          ))}
        </Grupo>

        <Grupo titulo="Artigos" Icone={BookOpen} vazio={artigos.length === 0}>
          {artigos.map((artigo) => (
            <Link
              key={`artigo-${artigo.referencia}`}
              to="/artigos/$slug"
              params={{ slug: artigo.referencia ?? "" }}
              className="block rounded-2xl border border-[rgba(0,20,70,.08)] bg-white px-5 py-4 hover:border-[rgba(0,74,140,.35)] hover:shadow-sm transition-all"
            >
              <p className="text-sm font-medium text-foreground">{artigo.titulo}</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">{artigo.subtitulo}</p>
            </Link>
          ))}
        </Grupo>

        <Grupo titulo="Casas espíritas" Icone={Building2} vazio={casas.length === 0}>
          {casas.map((casa, i) => {
            const conteudo = (
              <>
                <p className="text-sm font-medium text-foreground">{casa.titulo}</p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">
                  {casa.subtitulo}
                  {!casa.referencia && " · sem página no site"}
                </p>
              </>
            );
            // Sem página publicada não há para onde levar: mostra sem link, em
            // vez de oferecer um caminho que não abre nada.
            return casa.referencia ? (
              <Link
                key={`casa-${casa.referencia}`}
                to="/casa/$sigla"
                params={{ sigla: casa.referencia }}
                className="block rounded-2xl border border-[rgba(0,20,70,.08)] bg-white px-5 py-4 hover:border-[rgba(0,74,140,.35)] hover:shadow-sm transition-all"
              >
                {conteudo}
              </Link>
            ) : (
              <div
                key={`casa-${i}-${casa.titulo}`}
                className="rounded-2xl border border-[rgba(0,20,70,.08)] bg-white/60 px-5 py-4"
              >
                {conteudo}
              </div>
            );
          })}
        </Grupo>

        <Grupo
          titulo="Membros da sua casa"
          Icone={User}
          vazio={membros.length === 0}
          nota="A plataforma mostra apenas os membros da casa espírita a que você pertence."
        >
          {membros.map((membro, i) => (
            <div
              key={`membro-${i}-${membro.titulo}`}
              className="rounded-2xl border border-[rgba(0,20,70,.08)] bg-white px-5 py-4"
            >
              <p className="text-sm font-medium text-foreground">{membro.titulo}</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">
                {membro.subtitulo}
                {membro.referencia ? ` · ${membro.referencia}` : ""}
              </p>
            </div>
          ))}
        </Grupo>
      </div>
    </main>
  );
}

function Grupo({
  titulo,
  Icone,
  vazio,
  nota,
  children,
}: {
  titulo: string;
  Icone: typeof Search;
  vazio: boolean;
  nota?: string;
  children: React.ReactNode;
}) {
  if (vazio) return null;
  return (
    <section className="mb-8">
      <h2 className="text-xs uppercase tracking-[0.3em] text-muted-foreground/60 mb-3 flex items-center gap-2">
        <Icone size={14} strokeWidth={1.5} className="text-[#004a8c]" />
        {titulo}
      </h2>
      <div className="space-y-2">{children}</div>
      {nota && <p className="text-xs text-muted-foreground/50 mt-2">{nota}</p>}
    </section>
  );
}
