import { useEffect, useState } from "react";
import { Check, Link2, MessageCircle, Share2 } from "lucide-react";
import { toast } from "sonner";

/**
 * O botão de compartilhar das páginas públicas.
 *
 * Por que ele existe: até 31/08/2026 nenhuma página do site tinha como ser
 * compartilhada. Nem a do diretório, nem a da casa, nem um artigo — nada.
 * Quem quisesse indicar o site a alguém tinha que copiar o endereço da barra
 * do navegador, e no celular isso é atrito suficiente para a maioria desistir.
 *
 * Isso importa mais aqui do que importaria em outro site: a divulgação na
 * comunidade espírita anda por grupos de WhatsApp, de pessoa para pessoa. É o
 * único canal de crescimento que não custa nada e não depende de o Google
 * indexar primeiro — e era o único que o site não tinha.
 *
 * Três ações, e cada uma existe por um motivo diferente:
 *
 *   · WhatsApp abre a conversa direto, com o texto pronto. É o caminho de um
 *     toque, e por isso é o primeiro;
 *   · Copiar link serve para todo o resto — e-mail, boletim impresso, mural,
 *     descrição de rede social;
 *   · Mais opções aparece só onde o próprio aparelho oferece a lista de
 *     aplicativos. No computador essa lista é ruim ou não existe, então lá o
 *     botão não aparece em vez de aparecer e frustrar.
 *
 * Todos com rótulo escrito. Ícone sozinho não é encontrado por quem procura
 * "compartilhar" — já aconteceu neste site com a busca, que era só uma lupa.
 */

interface Props {
  /** O que a pessoa está compartilhando, em uma linha. Vira o texto da mensagem. */
  titulo: string;
  /** Endereço absoluto. Nunca relativo: a mensagem sai do site e precisa voltar. */
  url: string;
  /** Uma frase de contexto antes do endereço. Sem ela, vai só o título. */
  contexto?: string;
  /** `discreto` para o rodapé de uma lista; `destacado` para o topo de uma página. */
  aparencia?: "discreto" | "destacado";
  className?: string;
}

function mensagem(titulo: string, contexto: string | undefined, url: string) {
  // Uma linha em branco entre o texto e o endereço: é assim que o WhatsApp
  // monta a pré-visualização do link em vez de deixá-lo colado na frase.
  return [titulo, contexto, "", url].filter((parte) => parte !== undefined).join("\n");
}

export function Compartilhar({
  titulo,
  url,
  contexto,
  aparencia = "discreto",
  className = "",
}: Props) {
  const [copiado, setCopiado] = useState(false);

  const texto = mensagem(titulo, contexto, url);

  const base =
    "inline-flex items-center gap-1.5 rounded-lg border transition-colors disabled:opacity-40";
  const medida =
    aparencia === "destacado" ? "px-3.5 py-2 text-[13px]" : "px-3 py-1.5 text-xs";

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      toast.success("Link copiado. Agora é só colar onde quiser.");
      window.setTimeout(() => setCopiado(false), 2500);
    } catch {
      // Navegador que recusa a área de transferência (contexto sem HTTPS, ou
      // permissão negada) não pode terminar em silêncio: sem aviso, a pessoa
      // cola um endereço antigo e não entende por que está errado.
      toast.error("Não foi possível copiar. Selecione o endereço na barra do navegador.");
    }
  }

  async function compartilharNoAparelho() {
    try {
      await navigator.share({ title: titulo, text: mensagem(titulo, contexto, ""), url });
    } catch {
      // Fechar a lista de aplicativos sem escolher nada cai aqui. Não é erro e
      // não merece aviso nenhum.
    }
  }

  // `navigator.share` só é oferecido quando o aparelho tem uma lista de
  // aplicativos de verdade — na prática, celular e tablet.
  //
  // A verificação mora num efeito, e não no corpo da função, por um motivo
  // técnico que já quebrou tela neste projeto: as páginas públicas são
  // desenhadas no servidor primeiro. No servidor não existe `navigator`, então
  // decidir ali produziria uma marcação diferente da que o navegador desenha,
  // e o React descarta o trecho inteiro quando as duas não batem. Começar
  // sempre em `false` e ligar depois é o que mantém as duas iguais.
  const [temListaDoAparelho, setTemListaDoAparelho] = useState(false);

  useEffect(() => {
    setTemListaDoAparelho(
      typeof navigator.share === "function" && window.matchMedia("(pointer: coarse)").matches,
    );
  }, []);

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(texto)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`${base} ${medida} border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100`}
      >
        <MessageCircle size={14} aria-hidden="true" />
        WhatsApp
      </a>

      <button
        type="button"
        onClick={copiar}
        className={`${base} ${medida} border-border text-muted-foreground hover:bg-black/5`}
      >
        {copiado ? (
          <Check size={14} className="text-emerald-600" aria-hidden="true" />
        ) : (
          <Link2 size={14} aria-hidden="true" />
        )}
        {copiado ? "Link copiado" : "Copiar link"}
      </button>

      {temListaDoAparelho && (
        <button
          type="button"
          onClick={compartilharNoAparelho}
          className={`${base} ${medida} border-cyan-glow/30 text-cyan-glow hover:bg-cyan-glow/10`}
        >
          <Share2 size={14} aria-hidden="true" />
          Mais opções
        </button>
      )}
    </div>
  );
}

/**
 * O mesmo botão, com um título curto acima, para fechar uma página pública.
 *
 * Fica no fim de propósito: quem chegou até ali leu o que queria e é o momento
 * em que faz sentido pedir a indicação. Um convite no topo interrompe a leitura
 * de quem ainda não sabe se gostou.
 */
export function ConviteParaCompartilhar({
  titulo,
  url,
  contexto,
  chamada = "Conhece alguém que precisa disto?",
  explicacao,
}: Props & { chamada?: string; explicacao?: string }) {
  return (
    <div className="mt-10 glass rounded-2xl p-6 space-y-3">
      <h2 className="text-sm font-semibold text-foreground">{chamada}</h2>
      <p className="text-xs leading-relaxed text-muted-foreground">
        {explicacao ??
          "Envie esta página a quem estiver procurando. A consulta é livre, não pede cadastro e não custa nada."}
      </p>
      <Compartilhar titulo={titulo} url={url} contexto={contexto} aparencia="destacado" />
    </div>
  );
}
