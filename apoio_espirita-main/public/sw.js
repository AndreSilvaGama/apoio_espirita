/*
 * Service worker do Apoio Espírita.
 *
 * Faz duas coisas, e só elas, de propósito:
 *
 * 1. Guarda os arquivos de /assets/ — os que o build gera com um código no
 *    nome (index-BvdnTP-3.js). Esses arquivos nunca mudam de conteúdo sem
 *    mudar de nome, então servi-los do cache não corre risco de entregar
 *    versão velha. É o que faz o site abrir rápido no celular e aguentar
 *    internet fraca.
 *
 * 2. Guarda uma página de aviso para quando a navegação falhar por falta de
 *    conexão, no lugar da tela de erro do navegador.
 *
 * O que ele NÃO faz, também de propósito: guardar as páginas do site. As
 * páginas dependem de quem está logado e mudam a cada publicação — servir
 * uma cópia guardada mostraria conteúdo de outra sessão ou de uma versão
 * antiga. Toda navegação vai à rede primeiro, sempre.
 */

const VERSAO = "apoio-espirita-v2";
const CACHE_ESTATICOS = `${VERSAO}-estaticos`;
const CACHE_OFFLINE = `${VERSAO}-offline`;

// Chave com que a página de aviso é guardada e procurada.
const PAGINA_OFFLINE = "/offline";
// A hospedagem publica o arquivo em /offline e redireciona /offline.html
// para lá; o servidor de desenvolvimento faz o contrário. Tentamos os dois.
const ENDERECOS_OFFLINE = ["/offline", "/offline.html"];

/**
 * Busca a página de aviso e guarda uma cópia limpa.
 *
 * A cópia é remontada de propósito: quando a resposta vem de um
 * redirecionamento, o Cache API recusa guardá-la e derruba a instalação
 * inteira do service worker — foi o que aconteceu com /offline.html.
 */
async function guardarPaginaOffline(cache) {
  for (const endereco of ENDERECOS_OFFLINE) {
    try {
      const resposta = await fetch(endereco, { cache: "reload" });
      if (!resposta.ok) continue;
      const html = await resposta.text();
      await cache.put(
        PAGINA_OFFLINE,
        new Response(html, {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }),
      );
      return true;
    } catch {
      // Tenta o próximo endereço.
    }
  }
  return false;
}

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    (async () => {
      // Falhar aqui não pode impedir a instalação: sem a página de aviso o
      // site continua funcionando, e o cache dos arquivos ainda vale a pena.
      try {
        const cache = await caches.open(CACHE_OFFLINE);
        await guardarPaginaOffline(cache);
      } catch {
        // Segue sem a página de aviso.
      }
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    (async () => {
      const nomes = await caches.keys();
      await Promise.all(
        nomes.filter((nome) => !nome.startsWith(VERSAO)).map((nome) => caches.delete(nome)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (evento) => {
  const requisicao = evento.request;
  if (requisicao.method !== "GET") return;

  const url = new URL(requisicao.url);
  if (url.origin !== self.location.origin) return;

  // Navegação: rede primeiro; sem conexão, mostra o aviso.
  if (requisicao.mode === "navigate") {
    evento.respondWith(
      (async () => {
        try {
          return await fetch(requisicao);
        } catch {
          const cache = await caches.open(CACHE_OFFLINE);
          const aviso = await cache.match(PAGINA_OFFLINE);
          return (
            aviso ??
            new Response("Sem conexão com a internet.", {
              status: 503,
              headers: { "Content-Type": "text/plain; charset=utf-8" },
            })
          );
        }
      })(),
    );
    return;
  }

  // Só os arquivos com código no nome entram no cache.
  if (!url.pathname.startsWith("/assets/")) return;

  evento.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_ESTATICOS);
      const guardado = await cache.match(requisicao);
      if (guardado) return guardado;

      const resposta = await fetch(requisicao);
      if (resposta.ok) cache.put(requisicao, resposta.clone());
      return resposta;
    })(),
  );
});
