// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { execSync } from "child_process";

// Sincroniza a biblioteca de livros e gera metadados antes da inicialização do Vite
try {
  console.log("[Vite] Executando sincronização de livros da biblioteca...");
  execSync("node scripts/sync-books.js", { stdio: "inherit" });
} catch (e) {
  console.error("[Vite] Falha ao sincronizar livros da biblioteca:", e);
}

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
});
