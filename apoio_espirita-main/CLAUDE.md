# CLAUDE.md — Apoio Espírita (dentro do repo)

> Complementa o CLAUDE.md do diretório pai (`../CLAUDE.md`).
> Foco: eficiência, checklists, referências rápidas e padrões de código.

---

## Checklist obrigatório para QUALQUER feature

```
1. [ ] Ler os arquivos relevantes antes de qualquer edição
2. [ ] Usar Supabase MCP (execute_sql / list_tables) se envolver banco
3. [ ] Implementar
4. [ ] npm run build  — verificar zero erros
5. [ ] npx wrangler deploy --config wrangler.json  (em dist/server/)
6. [ ] Atualizar roadmap em src/routes/painel.tsx  (planejado → feito)
7. [ ] git add <arquivos específicos> && git commit && git push
```

**Nunca pular nenhum passo. Nunca perguntar — só executar.**

---

## Comandos prontos (copiar e colar)

```bash
# Build
cd D:\WEB\APOIO_ESPIRITA\apoio_espirita-main
npm run build

# Deploy
cd D:\WEB\APOIO_ESPIRITA\apoio_espirita-main\dist\server
npx wrangler deploy --config wrangler.json

# Voltar para a raiz do projeto
cd D:\WEB\APOIO_ESPIRITA\apoio_espirita-main
```

---

## Mapa de arquivos-chave

| O que preciso mudar | Arquivo |
|---|---|
| Roadmap / status de features | `src/routes/painel.tsx` — array `roadmap[]` |
| Lista de cargos | `src/routes/completar-perfil.tsx` — `CARGOS[]` e `src/routes/perfil.tsx` — `CARGOS_BASE[]` |
| Estilos globais / tema | `src/styles/` |
| Auth context / perfil do usuário | `src/contexts/AuthContext.tsx` |
| Supabase client | `src/integrations/supabase/client.ts` |
| Rotas | `src/routes/*.tsx` |
| Rotas de jogos | `src/routes/jogos/*.tsx` |
| Root (meta tags, JSON-LD, layout) | `src/routes/__root.tsx` |
| Config Cloudflare | `wrangler.jsonc` (raiz) e `dist/server/wrangler.json` (deploy) |
| Banco de palavras — Plante a Semente | `src/data/palavras-semente.ts` |

---

## Lista completa de cargos (24, 5 níveis)

```typescript
// Nível 1
"Presidente",
// Nível 2
"Vice-presidente",
// Nível 3
"Coordenador", "Diretoria", "Dirigente", "Dirigente de reunião mediúnica",
// Nível 4
"Tesoureiro",
// Nível 5
"Assistido", "Associado", "Atendente fraterno", "Colaborador",
"Estudante", "Evangelizador", "Expositor", "Facilitador",
"Frequentador", "Médium", "Palestrante", "Participante de estudo",
"Passista", "Sócio", "Tarefeiro", "Trabalhador", "Visitante",
// DEV (apenas gama.andre@gmail.com — cargo temporário)
```

Regras de permissão:
- `isPresident` = `cargo_principal === "Presidente" || cargo_principal === "Vice-presidente"`
- Tesoureiro: **não** tem `isPresident`, mas tem acesso total à `/tesouraria`
- DEV: mesmo acesso que Presidente para fins de desenvolvimento

---

## Padrões de código do projeto

### Página autenticada (tema claro)
```tsx
<main className="page-light min-h-screen px-4 pt-20 pb-20">
  <div className="mx-auto max-w-3xl">
    {/* conteúdo */}
  </div>
</main>
```
> `pt-20 pb-20` é obrigatório para respeitar o header fixo (h-14) e o footer fixo.

### Página pública (tema escuro)
```tsx
<main className="min-h-screen flex items-center justify-center px-6 py-16">
  {/* conteúdo com gradiente escuro */}
</main>
```

### Card / painel glass
```tsx
<div className="glass rounded-3xl p-8 space-y-5">
```

### Label de campo
```tsx
<label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
  Campo <span className="text-cyan-glow">*</span>
</label>
```

### Input texto
```tsx
<input className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-cyan-glow/40 transition-colors" />
```

### Select (NUNCA inline style — quebra light theme)
```tsx
<select className="w-full rounded-xl border border-white/10 px-4 py-3 text-sm focus:outline-none focus:border-cyan-glow/40 transition-colors">
```

### Botão primário
```tsx
<button className="w-full py-3 rounded-xl text-sm uppercase tracking-widest text-cyan-glow border border-cyan-glow/40 hover:bg-cyan-glow/10 disabled:opacity-40 transition-colors duration-300">
```

---

## Supabase — referência rápida

### Tabelas principais
| Tabela | Uso |
|---|---|
| `profiles` | Dados do usuário — cargo, sigla_casa, atividades |
| `siglas_casas` | Siglas registradas (2–6 letras maiúsculas) |
| `casas_espirita` | Casas com localização (SELECT público, ativa=true) |
| `mensagens_do_dia` | Fila de mensagens diárias (data_exibicao UNIQUE) |
| `solicitacoes_dev` | Pedidos de desenvolvimento |
| `site_suggestions` | Sugestões públicas |

### View para listagem pública de membros
```sql
-- SEMPRE usar em vez de profiles para exibir membros a terceiros
SELECT * FROM profiles_public;
-- Expõe: nome, sigla_casa, uf, cidade — SEM cargo nem atividades
```

### Verificar estado do banco antes de qualquer migration
```
1. Supabase MCP → list_tables
2. Supabase MCP → execute_sql "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles'"
```

---

## Erros comuns — nunca repetir

| Errado | Correto |
|---|---|
| `"Coordenadoria"` | `"Coordenador"` |
| `style={{ backgroundColor }}` em `<select>` | Usar className; CSS cuida via `.page-light select` |
| Exibir `cargo_principal` para outros membros | Usar `profiles_public` (só nome + sigla_casa) |
| Fazer push sem deploy | Deploy **antes** do push |
| Concluir feature sem atualizar `/painel` | Sempre atualizar o roadmap |
| Emojis em componentes | Lucide React icons |
| `git add .` ou `git add -A` | `git add <arquivos específicos>` |
| `py-10` ou `py-16` em páginas autenticadas | `pt-20 pb-20` — respeita header e footer fixos |
| SVG `filter` em elemento `<line>` | Aplicar filter apenas em `<rect>`, `<ellipse>`, `<circle>` ou `<path>` — `<line>` tem bounding box degenerado e some |

---

## Regras de eficiência para Claude

1. **Paralelizar tool calls independentes** — ler múltiplos arquivos ao mesmo tempo
2. **Usar Supabase MCP** para qualquer consulta/migration — nunca pedir para o usuário copiar dados
3. **Usar Glob/Grep** antes de ler arquivos — localizar o trecho exato antes de carregar o arquivo inteiro
4. **Não perguntar** sobre deploy, push ou atualização do roadmap — fazer automaticamente
5. **Ler MEMORY.md** ao iniciar sessão — recuperar contexto de conversas anteriores
6. **Verificar build antes de deployar** — se `npm run build` falhar, corrigir antes de prosseguir
7. **Ao editar lista de cargos**, atualizar **sempre os dois arquivos**: `completar-perfil.tsx` e `perfil.tsx`

---

## Notificações automáticas (Edge Function `send-notification`)

```typescript
// Sugestão recebida
supabase.functions.invoke("send-notification", {
  body: { type: "sugestao", data: { name, email, suggestion } }
});

// Solicitação de desenvolvimento
supabase.functions.invoke("send-notification", {
  body: { type: "solicitacao", data: { titulo, descricao, user_email } }
});
```

---

## Usuário do projeto

- **E-mail:** gama.andre@gmail.com
- **Cargo atual:** DEV (temporário — trocar para Tarefeiro quando o projeto estiver completo)
- **Preferências:** respostas curtas e diretas, sem explicar o óbvio, sem emojis
