/**
 * Mostra o QR Code de um código PIX já montado.
 *
 * O desenho é gerado aqui, no navegador, a partir do próprio texto do
 * pagamento (`src/lib/qr.ts`) — nenhum serviço de fora recebe a chave PIX de
 * quem está recebendo o dinheiro, e a imagem continua aparecendo mesmo sem
 * internet, depois que a página carregou.
 */
import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { svgQR } from "@/lib/qr";

export function QrCodePix({ codigo, tamanho = 168 }: { codigo: string; tamanho?: number }) {
  const [falhou, setFalhou] = useState(false);

  const svg = useMemo(() => {
    try {
      return svgQR(codigo, tamanho);
    } catch {
      // Só acontece com texto grande demais para o padrão. Melhor a tela
      // continuar de pé com o código copia e cola do que quebrar inteira.
      setFalhou(true);
      return null;
    }
  }, [codigo, tamanho]);

  if (!svg || falhou) return null;

  const arquivo = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="rounded-xl border border-border bg-white p-2"
        // O conteúdo é gerado por nós a partir de coordenadas calculadas: não
        // há texto de usuário dentro do SVG.
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <a
        href={arquivo}
        download="pix-apoio-espirita.svg"
        className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-cyan-glow transition-colors"
      >
        <Download size={11} strokeWidth={1.8} />
        Baixar a imagem para imprimir
      </a>
    </div>
  );
}
