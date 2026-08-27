import { useCallback, useEffect, useState } from "react";

/**
 * Instalação do site como aplicativo, sem passar por loja.
 *
 * Registra o service worker e guarda o convite de instalação que o navegador
 * dispara. O convite não pode ser criado por nós: o navegador decide quando
 * oferecê-lo, e só aceita ser aberto dentro do clique de quem está usando o
 * site — por isso o evento fica guardado até a pessoa apertar o botão.
 *
 * O Safari do iPhone não dispara esse evento. Lá a instalação é manual, pelo
 * menu Compartilhar do próprio navegador, e por isso `instalavel` vem falso:
 * quem precisa do passo a passo do iPhone encontra na Ajuda.
 */

interface EventoDeInstalacao extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function useInstalarApp() {
  const [convite, setConvite] = useState<EventoDeInstalacao | null>(null);
  const [instalado, setInstalado] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Já está aberto como aplicativo: não há o que oferecer.
    const jaAberto =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (jaAberto) setInstalado(true);

    const guardarConvite = (evento: Event) => {
      evento.preventDefault();
      setConvite(evento as EventoDeInstalacao);
    };
    const aoInstalar = () => {
      setInstalado(true);
      setConvite(null);
    };

    window.addEventListener("beforeinstallprompt", guardarConvite);
    window.addEventListener("appinstalled", aoInstalar);
    return () => {
      window.removeEventListener("beforeinstallprompt", guardarConvite);
      window.removeEventListener("appinstalled", aoInstalar);
    };
  }, []);

  const instalar = useCallback(async () => {
    if (!convite) return false;
    await convite.prompt();
    const { outcome } = await convite.userChoice;
    // O convite é de uso único: o navegador dispara outro quando quiser.
    setConvite(null);
    return outcome === "accepted";
  }, [convite]);

  return { instalavel: convite !== null && !instalado, instalado, instalar };
}

/**
 * Registra o service worker uma única vez. Fica fora do hook acima porque não
 * depende de nenhuma tela — o site inteiro se beneficia dele.
 */
export function registrarServiceWorker() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Sem service worker o site funciona igual; só perde o cache e o
      // aviso de falta de conexão. Não vale interromper ninguém por isso.
    });
  });
}
