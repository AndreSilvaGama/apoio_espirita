# Artigos da comunidade — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que qualquer usuário com e-mail verificado publique artigos lidos por toda a comunidade e pela internet, com avaliação em seis níveis, retirada automática do texto quando a comunidade aponta erro grave em número suficiente, e sanção ao autor somente por decisão humana.

**Architecture:** Contagem, limiar e retirada vivem no Postgres, em gatilho que roda na mesma transação do voto — sem janela de atraso e sem depender do navegador. A aritmética do limiar fica isolada em duas funções **puras** (`artigo_piso_retirada`, `artigo_deve_cair`), testáveis por `SELECT` sem escrever nada. O acesso é filtrado por RLS, como nas 27 tabelas existentes. O front-end **nunca recalcula o limiar**: lê o piso pronto da view pública, para não existirem duas versões da regra que possam divergir.

**Tech Stack:** TanStack Start + React 19, Tailwind v4, Supabase (Postgres + RLS + Edge Functions), Cloudflare Workers, Vitest (introduzido por este plano).

**Spec:** [`docs/superpowers/specs/2026-08-26-artigos-comunidade-design.md`](../specs/2026-08-26-artigos-comunidade-design.md)

## Global Constraints

- **Nunca alterar `src/routes/index.tsx`** (página inicial / vídeo). Regra do projeto, sem exceção nesta entrega.
- **Delta de banco é aditivo** — só cria; não altera nem remove nada existente — e é aplicado em produção **antes** do código que depende dele.
- **Migrations** em `supabase/migrations/`, nome `YYYYMMDDHHMMSS_descricao.sql`, seguindo as 14 existentes.
- **Toda tabela nova nasce com RLS ligada.**
- Ícones: **Lucide React**, nunca emoji.
- Página autenticada: `<main className="page-light min-h-screen px-4 pt-20 pb-20">`.
- `git add <arquivos específicos>` — nunca `git add .` nem `-A`.
- Textos de interface em **português correto e profissional**, sem gíria e sem citar marcas de terceiros.
- Piso de retirada: **maior entre 3 e 20% dos usuários com e-mail verificado**, arredondado para cima.
- Descrição de erro: **mínimo 10 caracteres**, obrigatória em `erro` e `erro_grave`.
- Só **`erro_grave`** conta para retirada. `nao_gostei` **nunca** conta.

---

## Decisão necessária antes da Task 3

As Tasks 1 e 2 testam a aritmética com funções puras, sem escrever nada em lugar nenhum — podem rodar contra produção com segurança total, porque `SELECT funcao(1,2,3)` não grava.

A Task 3 em diante testa o **gatilho**, e isso exige inserir linhas. Três caminhos:

| Caminho                                                                     | Custo                                        | Isolamento                                                            |
| --------------------------------------------------------------------------- | -------------------------------------------- | --------------------------------------------------------------------- |
| **Branch do Supabase** (recomendado)                                        | US$ 0,01344/hora, centavos por algumas horas | Total: banco separado                                                 |
| Tabelas novas em produção, vazias, com as linhas de teste apagadas ao final | Zero                                         | Não toca nenhuma tabela existente, mas é escrita no banco de produção |
| Instalar Docker e rodar a pilha local                                       | Zero                                         | Total, porém exige instalar Docker na máquina                         |

**Não prosseguir da Task 3 sem o André escolher.** Escrita em banco de produção exige autorização nomeada, mesmo em tabela nova e vazia.

---

## Estrutura de arquivos

**Criar:**

| Arquivo                                                       | Responsabilidade                                              |
| ------------------------------------------------------------- | ------------------------------------------------------------- |
| `supabase/migrations/20260826100000_artigos_tabelas.sql`      | As quatro tabelas e seus índices                              |
| `supabase/migrations/20260826100100_artigos_funcoes.sql`      | Funções puras e auxiliares                                    |
| `supabase/migrations/20260826100200_artigos_gatilho.sql`      | Recontagem e retirada automática                              |
| `supabase/migrations/20260826100300_artigos_politicas.sql`    | RLS de todas as quatro tabelas                                |
| `supabase/migrations/20260826100400_artigos_view_publica.sql` | `artigos_publicos`, sem o texto retirado                      |
| `src/lib/artigos.ts`                                          | Puro: slug, rótulos da escala, regra de descrição obrigatória |
| `src/lib/artigos.test.ts`                                     | Testes de `src/lib/artigos.ts`                                |
| `src/components/AvaliacaoArtigo.tsx`                          | A escala de seis e o campo de descrição do erro               |
| `src/components/FilaRevisaoArtigos.tsx`                       | Fila de revisão, reusada em `/admin` e na casa                |
| `src/routes/artigos.index.tsx`                                | Lista pública                                                 |
| `src/routes/artigos.novo.tsx`                                 | Escrever                                                      |
| `src/routes/artigos.$slug.tsx`                                | Leitura e avaliação                                           |
| `src/routes/artigos.$slug.editar.tsx`                         | Corrigir e reenviar                                           |
| `src/routes/artigos.meus.tsx`                                 | Artigos do autor, com os erros apontados                      |
| `vitest.config.ts`                                            | Configuração do Vitest                                        |

**Modificar:**

| Arquivo                              | O quê                                              |
| ------------------------------------ | -------------------------------------------------- |
| `package.json`                       | Vitest e o script `test`                           |
| `src/routes/__root.tsx`              | Entrada "Artigos" no menu                          |
| `src/routes/admin.tsx`               | Aba com a fila de revisão de toda a plataforma     |
| `src/routes/casa/$sigla.tsx`         | Fila de revisão dos autores da própria casa        |
| `src/routes/ajuda.tsx`               | Manual do recurso                                  |
| `src/routes/painel.tsx`              | Roadmap: item passa a `feito`, descrição reescrita |
| `scripts/atualiza-sitemap.py`        | Artigos publicados no sitemap                      |
| `src/integrations/supabase/types.ts` | Regerado do banco                                  |

**Por que `src/lib/artigos.ts` não calcula o piso:** o piso depende de quantos usuários têm e-mail verificado, dado que só o banco enxerga. Recalcular no front-end criaria duas versões da mesma regra, livres para divergir. A tela lê `piso_atual` pronto da view.

---

## Task 1: Ferramenta de teste

O projeto não tem nenhuma. Sem ela não há como provar a regra que retira o texto das pessoas.

**Files:**

- Create: `vitest.config.ts`
- Modify: `package.json`
- Create: `src/lib/artigos.ts`
- Test: `src/lib/artigos.test.ts`

**Interfaces:**

- Consumes: nada.
- Produces: `npm test`; e de `src/lib/artigos.ts`:
  - `type TipoAvaliacao = "otimo" | "bom" | "gostei" | "nao_gostei" | "erro" | "erro_grave"`
  - `ROTULOS: Record<TipoAvaliacao, string>`
  - `TIPOS_ERRO: readonly TipoAvaliacao[]`
  - `DESCRICAO_MINIMA: number`
  - `exigeDescricao(tipo: TipoAvaliacao): boolean`
  - `descricaoValida(tipo: TipoAvaliacao, texto: string | null): boolean`
  - `gerarSlug(titulo: string): string`

- [ ] **Step 1: Instalar o Vitest**

```bash
cd "d:/DEV/Apoio Espírita/apoio_espirita-main"
npm install -D vitest@^3
```

- [ ] **Step 2: Criar `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
```

- [ ] **Step 3: Acrescentar o script `test` ao `package.json`**

Na chave `scripts`, logo depois de `"lint"`, acrescentar:

```json
"test": "vitest run",
```

- [ ] **Step 4: Escrever o teste que falha**

Criar `src/lib/artigos.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  ROTULOS,
  TIPOS_ERRO,
  DESCRICAO_MINIMA,
  exigeDescricao,
  descricaoValida,
  gerarSlug,
} from "./artigos";

describe("escala de avaliação", () => {
  it("tem rótulo em português para os seis tipos", () => {
    expect(ROTULOS).toEqual({
      otimo: "Ótimo",
      bom: "Bom",
      gostei: "Gostei",
      nao_gostei: "Não gostei",
      erro: "Tem erro",
      erro_grave: "Tem erro grave",
    });
  });

  it("exige descrição apenas nos dois níveis de erro", () => {
    expect(exigeDescricao("erro")).toBe(true);
    expect(exigeDescricao("erro_grave")).toBe(true);
    expect(exigeDescricao("otimo")).toBe(false);
    expect(exigeDescricao("bom")).toBe(false);
    expect(exigeDescricao("gostei")).toBe(false);
    expect(exigeDescricao("nao_gostei")).toBe(false);
  });

  it("lista exatamente os tipos de erro", () => {
    expect([...TIPOS_ERRO].sort()).toEqual(["erro", "erro_grave"]);
  });
});

describe("descrição do erro", () => {
  it("recusa descrição curta demais nos tipos de erro", () => {
    expect(DESCRICAO_MINIMA).toBe(10);
    expect(descricaoValida("erro", "errado")).toBe(false);
    expect(descricaoValida("erro_grave", null)).toBe(false);
    expect(descricaoValida("erro", "   espaços   ")).toBe(false);
  });

  it("aceita descrição com o tamanho mínimo", () => {
    expect(descricaoValida("erro", "A data da obra está errada")).toBe(true);
    expect(descricaoValida("erro_grave", "0123456789")).toBe(true);
  });

  it("ignora a descrição nos tipos que não a exigem", () => {
    expect(descricaoValida("otimo", null)).toBe(true);
    expect(descricaoValida("nao_gostei", "")).toBe(true);
  });
});

describe("slug", () => {
  it("remove acentos, pontuação e caixa", () => {
    expect(gerarSlug("O Evangelho à luz da Razão!")).toBe("o-evangelho-a-luz-da-razao");
  });

  it("colapsa espaços e hífens repetidos", () => {
    expect(gerarSlug("  Caridade   —  amor  ")).toBe("caridade-amor");
  });

  it("não devolve slug vazio", () => {
    expect(gerarSlug("???")).toBe("artigo");
  });

  it("limita o comprimento a 80 caracteres sem cortar no meio da palavra", () => {
    const slug = gerarSlug("palavra ".repeat(30));
    expect(slug.length).toBeLessThanOrEqual(80);
    expect(slug.endsWith("-")).toBe(false);
  });
});
```

- [ ] **Step 5: Rodar o teste e confirmar que falha**

Run: `npm test`
Expected: FAIL — `Failed to resolve import "./artigos"`.

- [ ] **Step 6: Escrever `src/lib/artigos.ts`**

```ts
/**
 * Apoio às telas de artigos. Só lógica pura: nada aqui consulta o banco.
 *
 * O piso de retirada NÃO mora aqui de propósito. Ele depende de quantos
 * usuários têm e-mail verificado, dado que só o banco enxerga, e duplicar a
 * regra criaria duas versões livres para divergir. A tela lê `piso_atual`
 * pronto da view `artigos_publicos`.
 */

export type TipoAvaliacao = "otimo" | "bom" | "gostei" | "nao_gostei" | "erro" | "erro_grave";

export const ROTULOS: Record<TipoAvaliacao, string> = {
  otimo: "Ótimo",
  bom: "Bom",
  gostei: "Gostei",
  nao_gostei: "Não gostei",
  erro: "Tem erro",
  erro_grave: "Tem erro grave",
};

/** Únicos tipos que pedem ao leitor dizer qual é o erro. */
export const TIPOS_ERRO = ["erro", "erro_grave"] as const;

/** Mesmo mínimo garantido por restrição no banco. */
export const DESCRICAO_MINIMA = 10;

export function exigeDescricao(tipo: TipoAvaliacao): boolean {
  return (TIPOS_ERRO as readonly string[]).includes(tipo);
}

export function descricaoValida(tipo: TipoAvaliacao, texto: string | null): boolean {
  if (!exigeDescricao(tipo)) return true;
  return (texto ?? "").trim().length >= DESCRICAO_MINIMA;
}

export function gerarSlug(titulo: string): string {
  const base = titulo
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!base) return "artigo";
  if (base.length <= 80) return base;
  return base
    .slice(0, 80)
    .replace(/-+[^-]*$/, "")
    .replace(/-+$/, "");
}
```

- [ ] **Step 7: Rodar o teste e confirmar que passa**

Run: `npm test`
Expected: PASS — 8 testes.

- [ ] **Step 8: Confirmar que o build e o lint continuam limpos**

Run: `npm run build && npx eslint src/lib/artigos.ts src/lib/artigos.test.ts`
Expected: build sem erro; eslint sem erro.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/lib/artigos.ts src/lib/artigos.test.ts
git commit -m "test: introduz Vitest e cobre a escala de avaliacao dos artigos"
```

---

## Task 2: A aritmética do limiar, em funções puras

O coração do recurso. Duas funções sem acesso a tabela, provadas por `SELECT` — que não grava nada e por isso pode ser conferido em qualquer banco, inclusive produção.

**Files:**

- Create: `supabase/migrations/20260826100100_artigos_funcoes.sql`

**Interfaces:**

- Consumes: nada.
- Produces:
  - `public.artigo_piso_retirada(verificados int) returns int` — IMMUTABLE
  - `public.artigo_deve_cair(erro_grave int, elogios int, piso int) returns boolean` — IMMUTABLE
  - `public.total_verificados() returns int` — STABLE, SECURITY DEFINER
  - `public.email_verificado() returns boolean` — STABLE, SECURITY DEFINER
  - `public.usuario_sancionado(uid uuid) returns boolean` — STABLE, SECURITY DEFINER

- [ ] **Step 1: Escrever a migration**

Criar `supabase/migrations/20260826100100_artigos_funcoes.sql`:

```sql
-- Funcoes de apoio aos artigos da comunidade.
--
-- As duas primeiras sao PURAS de proposito: nenhuma le tabela. Toda a decisao
-- de retirar um artigo passa por elas, entao elas precisam ser provaveis com
-- um SELECT, sem gravar nada em lugar nenhum.

-- Piso: maior entre 3 e 20% dos usuarios verificados, arredondado para cima.
-- Impede que tres pessoas decididas derrubem qualquer coisa numa comunidade
-- grande, e acompanha o crescimento sem manutencao.
create or replace function public.artigo_piso_retirada(verificados int)
returns int
language sql
immutable
set search_path = ''
as $$
  select greatest(3, ceil(coalesce(verificados, 0) * 0.20))::int;
$$;

-- O artigo cai quando AS DUAS condicoes valem:
--   1. marcacoes de erro grave atingem o piso
--   2. marcacoes de erro grave superam a soma dos elogios
-- A segunda impede que popularidade blinde erro perigoso.
-- "Nao gostei" e "Tem erro" nao entram em nenhum dos dois lados: discordar
-- nao e apontar erro, e erro leve e recado ao autor, nao gatilho.
create or replace function public.artigo_deve_cair(erro_grave int, elogios int, piso int)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(erro_grave, 0) >= piso
     and coalesce(erro_grave, 0) > coalesce(elogios, 0);
$$;

-- auth.users nao e legivel pelo usuario comum: dai SECURITY DEFINER.
create or replace function public.total_verificados()
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::int from auth.users where email_confirmed_at is not null;
$$;

create or replace function public.email_verificado()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from auth.users
    where id = auth.uid() and email_confirmed_at is not null
  );
$$;

create or replace function public.usuario_sancionado(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.usuarios_sancoes
    where user_id = uid
      and revogada_em is null
      and (fim is null or fim > now())
  );
$$;

revoke execute on function public.artigo_piso_retirada(int) from public;
revoke execute on function public.artigo_deve_cair(int, int, int) from public;
revoke execute on function public.total_verificados() from public;
revoke execute on function public.email_verificado() from public;
revoke execute on function public.usuario_sancionado(uuid) from public;

grant execute on function public.artigo_piso_retirada(int) to authenticated, anon;
grant execute on function public.artigo_deve_cair(int, int, int) to authenticated, anon;
grant execute on function public.total_verificados() to authenticated, anon;
grant execute on function public.email_verificado() to authenticated;
grant execute on function public.usuario_sancionado(uuid) to authenticated;
```

**Atenção:** `usuario_sancionado` referencia `public.usuarios_sancoes`, criada na Task 3. Aplicar esta migration **depois** da Task 3, ou aplicar as duas juntas. A ordem de execução está na Task 3, Step 1.

- [ ] **Step 2: Provar o piso — casos que devem passar**

Rodar via Supabase MCP `execute_sql` (só leitura, não grava nada):

```sql
select
  public.artigo_piso_retirada(0)   as v0,    -- espera 3
  public.artigo_piso_retirada(9)   as v9,    -- espera 3  (20% = 1,8 -> piso 3)
  public.artigo_piso_retirada(15)  as v15,   -- espera 3  (20% = 3)
  public.artigo_piso_retirada(16)  as v16,   -- espera 4  (20% = 3,2 -> 4)
  public.artigo_piso_retirada(50)  as v50,   -- espera 10
  public.artigo_piso_retirada(100) as v100;  -- espera 20
```

Expected: `3, 3, 3, 4, 10, 20`.

- [ ] **Step 3: Provar a condição de queda**

```sql
select
  public.artigo_deve_cair(3, 2, 3)  as cai,          -- true: piso ok, supera elogios
  public.artigo_deve_cair(2, 0, 3)  as sob_piso,     -- false: nao atinge o piso
  public.artigo_deve_cair(3, 3, 3)  as empate,       -- false: nao SUPERA os elogios
  public.artigo_deve_cair(3, 9, 3)  as popular,      -- false: popularidade protege
  public.artigo_deve_cair(20, 19, 20) as grande,     -- true
  public.artigo_deve_cair(0, 0, 3)  as sem_votos,    -- false
  public.artigo_deve_cair(null, null, 3) as nulos;   -- false, sem estourar
```

Expected: `true, false, false, false, true, false, false`.

O caso `empate` é o que garante "supera" e não "iguala ou supera": três marcações de erro grave contra três elogios **não** derrubam.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260826100100_artigos_funcoes.sql
git commit -m "feat: funcoes puras do limiar de retirada de artigos"
```

---

## Task 3: As quatro tabelas

**Files:**

- Create: `supabase/migrations/20260826100000_artigos_tabelas.sql`

**Interfaces:**

- Consumes: nada.
- Produces: `public.artigos`, `public.artigo_avaliacoes`, `public.artigo_revisoes`, `public.usuarios_sancoes` — colunas exatamente como abaixo. As Tasks 4 a 14 dependem destes nomes.

- [ ] **Step 1: Confirmar o caminho de teste com o André**

Ver "Decisão necessária antes da Task 3", no topo. **Não seguir sem a escolha dele.** Se for branch, criar com o MCP do Supabase (`create_branch`, precedido de `confirm_cost`) e usar o `project_id` da branch em todos os passos daqui em diante.

- [ ] **Step 2: Escrever a migration**

Criar `supabase/migrations/20260826100000_artigos_tabelas.sql`:

```sql
-- Artigos da comunidade.
-- Ver docs/superpowers/specs/2026-08-26-artigos-comunidade-design.md

create table if not exists public.artigos (
  id uuid primary key default gen_random_uuid(),
  autor_id uuid not null references auth.users(id) on delete cascade,
  -- Desnormalizados como em publicacoes_casa: a assinatura do artigo nao muda
  -- se o autor depois trocar de casa ou de nome.
  autor_nome text not null,
  autor_sigla_casa text,
  titulo text not null check (length(trim(titulo)) between 5 and 160),
  slug text not null unique,
  resumo text check (resumo is null or length(resumo) <= 400),
  conteudo text not null check (length(trim(conteudo)) >= 200),
  estado text not null default 'publicado'
    check (estado in ('publicado', 'retirado', 'em_correcao')),
  -- Contadores mantidos pelo gatilho. Desnormalizados para a lista publica
  -- ordenar por avaliacao sem varrer a tabela de votos.
  aval_otimo int not null default 0,
  aval_bom int not null default 0,
  aval_gostei int not null default 0,
  aval_nao_gostei int not null default 0,
  aval_erro int not null default 0,
  aval_erro_grave int not null default 0,
  retirado_em timestamptz,
  retirado_por text check (retirado_por is null or retirado_por in ('comunidade', 'humano')),
  retirado_por_user_id uuid references auth.users(id) on delete set null,
  retirado_motivo text,
  created_at timestamptz not null default now(),
  editado_em timestamptz,
  publicado_em timestamptz not null default now()
);

create index if not exists artigos_estado_publicado_em_idx
  on public.artigos (estado, publicado_em desc);
create index if not exists artigos_autor_idx on public.artigos (autor_id);
create index if not exists artigos_sigla_idx on public.artigos (autor_sigla_casa);

create table if not exists public.artigo_avaliacoes (
  id uuid primary key default gen_random_uuid(),
  artigo_id uuid not null references public.artigos(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null
    check (tipo in ('otimo', 'bom', 'gostei', 'nao_gostei', 'erro', 'erro_grave')),
  descricao_erro text,
  created_at timestamptz not null default now(),
  editado_em timestamptz,
  -- Um voto por pessoa por artigo, alteravel por UPDATE.
  unique (artigo_id, user_id),
  -- Marcar erro sem dizer qual e nao ajuda o autor a corrigir nem o revisor a
  -- julgar, e o pequeno esforco de escrever ja filtra a marcacao de impulso.
  constraint descricao_obrigatoria_no_erro check (
    case
      when tipo in ('erro', 'erro_grave')
        then descricao_erro is not null and length(trim(descricao_erro)) >= 10
      else descricao_erro is null
    end
  )
);

create index if not exists artigo_avaliacoes_artigo_idx
  on public.artigo_avaliacoes (artigo_id);

create table if not exists public.artigo_revisoes (
  id uuid primary key default gen_random_uuid(),
  artigo_id uuid not null references public.artigos(id) on delete cascade,
  aberta_em timestamptz not null default now(),
  origem text not null check (origem in ('comunidade', 'humano', 'reenvio')),
  estado text not null default 'aberta' check (estado in ('aberta', 'resolvida')),
  decisao text check (decisao is null or decisao in
    ('restaurar', 'manter_retirado', 'suspender_autor', 'banir_autor')),
  justificativa text,
  decidida_por uuid references auth.users(id) on delete set null,
  decidida_em timestamptz
);

create index if not exists artigo_revisoes_abertas_idx
  on public.artigo_revisoes (estado, aberta_em desc);

create table if not exists public.usuarios_sancoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null check (tipo in ('suspensao', 'banimento')),
  inicio timestamptz not null default now(),
  fim timestamptz,
  motivo text not null,
  aplicada_por uuid not null references auth.users(id) on delete restrict,
  revogada_em timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists usuarios_sancoes_vigentes_idx
  on public.usuarios_sancoes (user_id) where revogada_em is null;

alter table public.artigos enable row level security;
alter table public.artigo_avaliacoes enable row level security;
alter table public.artigo_revisoes enable row level security;
alter table public.usuarios_sancoes enable row level security;
```

- [ ] **Step 3: Aplicar as tabelas e, em seguida, as funções da Task 2**

Nesta ordem, porque `usuario_sancionado` referencia `usuarios_sancoes`:

1. `20260826100000_artigos_tabelas.sql`
2. `20260826100100_artigos_funcoes.sql`

Aplicar com o MCP do Supabase (`apply_migration`), no ambiente escolhido no Step 1.

- [ ] **Step 4: Provar que RLS está ligada nas quatro**

```sql
select relname, relrowsecurity
from pg_class
where relname in ('artigos','artigo_avaliacoes','artigo_revisoes','usuarios_sancoes')
order by relname;
```

Expected: `relrowsecurity = true` nas quatro linhas.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260826100000_artigos_tabelas.sql
git commit -m "feat: tabelas dos artigos da comunidade, com RLS ligada"
```

---

## Task 4: O gatilho que reconta e retira

**Files:**

- Create: `supabase/migrations/20260826100200_artigos_gatilho.sql`

**Interfaces:**

- Consumes: as tabelas da Task 3; `artigo_piso_retirada`, `artigo_deve_cair`, `total_verificados` da Task 2.
- Produces: `public.artigo_recontar()` e o gatilho `artigo_avaliacoes_reconta` sobre `public.artigo_avaliacoes`.

- [ ] **Step 1: Escrever a migration**

Criar `supabase/migrations/20260826100200_artigos_gatilho.sql`:

```sql
-- Recontagem e retirada automatica, na MESMA transacao do voto.
--
-- Fica no banco, e nao no aplicativo, por tres motivos: nao depende de ninguem
-- abrir tela nenhuma, nao tem janela de atraso (o conteudo e publico e
-- indexado) e nao da para burlar pelo navegador.
create or replace function public.artigo_recontar()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  alvo uuid := coalesce(new.artigo_id, old.artigo_id);
  reg record;
  piso int;
begin
  update public.artigos a
     set aval_otimo      = c.otimo,
         aval_bom        = c.bom,
         aval_gostei     = c.gostei,
         aval_nao_gostei = c.nao_gostei,
         aval_erro       = c.erro,
         aval_erro_grave = c.erro_grave
    from (
      select
        count(*) filter (where tipo = 'otimo')      as otimo,
        count(*) filter (where tipo = 'bom')        as bom,
        count(*) filter (where tipo = 'gostei')     as gostei,
        count(*) filter (where tipo = 'nao_gostei') as nao_gostei,
        count(*) filter (where tipo = 'erro')       as erro,
        count(*) filter (where tipo = 'erro_grave') as erro_grave
      from public.artigo_avaliacoes where artigo_id = alvo
    ) c
   where a.id = alvo
   returning a.* into reg;

  if reg is null then
    return coalesce(new, old);
  end if;

  piso := public.artigo_piso_retirada(public.total_verificados());

  -- So retira o que esta no ar. O gatilho NUNCA restaura sozinho: se as
  -- avaliacoes mudarem depois, o artigo continua retirado ate decisao humana.
  -- Retirar e reversivel por gente; oscilar sozinho, nao.
  if reg.estado = 'publicado'
     and public.artigo_deve_cair(
           reg.aval_erro_grave,
           reg.aval_otimo + reg.aval_bom + reg.aval_gostei,
           piso
         )
  then
    update public.artigos
       set estado = 'retirado',
           retirado_em = now(),
           retirado_por = 'comunidade',
           retirado_motivo = format(
             'Retirado automaticamente: %s marcacoes de erro grave, piso de %s, contra %s aprovacoes.',
             reg.aval_erro_grave, piso,
             reg.aval_otimo + reg.aval_bom + reg.aval_gostei)
     where id = alvo;

    insert into public.artigo_revisoes (artigo_id, origem)
    values (alvo, 'comunidade');
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists artigo_avaliacoes_reconta on public.artigo_avaliacoes;
create trigger artigo_avaliacoes_reconta
after insert or update or delete on public.artigo_avaliacoes
for each row execute function public.artigo_recontar();

revoke execute on function public.artigo_recontar() from public;
```

- [ ] **Step 2: Aplicar a migration**

Aplicar com `apply_migration` no ambiente escolhido na Task 3.

- [ ] **Step 3: Montar o artigo de teste**

Todo dado de teste leva `autor_sigla_casa = 'TESTE'`, que é como o Step 9 encontra e apaga tudo depois.

```sql
with autor as (select id from auth.users order by created_at limit 1)
insert into public.artigos (autor_id, autor_nome, autor_sigla_casa, titulo, slug, conteudo)
select id, 'Autor de teste', 'TESTE',
       'Artigo de teste do limiar',
       'teste-limiar-' || substr(gen_random_uuid()::text, 1, 8),
       repeat('conteudo de teste. ', 20)
from autor
returning id;
```

Guardar o `id` devolvido; ele é o `:artigo` dos passos seguintes.

- [ ] **Step 4: Provar que abaixo do piso o artigo NÃO cai**

Com 9 verificados o piso é 3. Duas marcações de erro grave, de usuários diferentes:

```sql
insert into public.artigo_avaliacoes (artigo_id, user_id, tipo, descricao_erro)
select ':artigo', id, 'erro_grave', 'A citacao atribuida esta incorreta.'
from auth.users order by created_at limit 2;

select estado, aval_erro_grave from public.artigos where id = ':artigo';
```

Expected: `estado = 'publicado'`, `aval_erro_grave = 2`.

- [ ] **Step 5: Provar que ao atingir o piso o artigo CAI**

```sql
insert into public.artigo_avaliacoes (artigo_id, user_id, tipo, descricao_erro)
select ':artigo', id, 'erro_grave', 'A citacao atribuida esta incorreta.'
from auth.users order by created_at offset 2 limit 1;

select estado, retirado_por, aval_erro_grave, retirado_motivo
from public.artigos where id = ':artigo';

select origem, estado from public.artigo_revisoes where artigo_id = ':artigo';
```

Expected: `estado = 'retirado'`, `retirado_por = 'comunidade'`, `aval_erro_grave = 3`, e uma linha em `artigo_revisoes` com `origem = 'comunidade'` e `estado = 'aberta'`.

- [ ] **Step 6: Provar que aprovação protege o artigo**

Segundo artigo, criado como no Step 3 e guardado como `:artigo2`. Três marcações de erro grave contra três elogios — empate não derruba:

```sql
insert into public.artigo_avaliacoes (artigo_id, user_id, tipo, descricao_erro)
select ':artigo2', id, 'erro_grave', 'Informacao sem fonte verificavel.'
from auth.users order by created_at limit 3;

insert into public.artigo_avaliacoes (artigo_id, user_id, tipo)
select ':artigo2', id, 'otimo'
from auth.users order by created_at offset 3 limit 3;

select estado, aval_erro_grave, aval_otimo from public.artigos where id = ':artigo2';
```

Expected: `estado = 'publicado'` — 3 não supera 3.

- [ ] **Step 7: Provar que "Não gostei" e "Tem erro" não derrubam**

Terceiro artigo, criado como no Step 3 e guardado como `:artigo3`:

```sql
insert into public.artigo_avaliacoes (artigo_id, user_id, tipo)
select ':artigo3', id, 'nao_gostei' from auth.users order by created_at limit 5;

insert into public.artigo_avaliacoes (artigo_id, user_id, tipo, descricao_erro)
select ':artigo3', id, 'erro', 'A data do livro esta trocada.'
from auth.users order by created_at offset 5 limit 4;

select estado, aval_nao_gostei, aval_erro from public.artigos where id = ':artigo3';
```

Expected: `estado = 'publicado'`, `aval_nao_gostei = 5`, `aval_erro = 4`. **Nove marcações negativas e o artigo continua no ar** — é a proteção da divergência doutrinária, provada.

- [ ] **Step 8: Provar que o gatilho não restaura sozinho**

```sql
update public.artigo_avaliacoes set tipo = 'bom', descricao_erro = null
where artigo_id = ':artigo' and tipo = 'erro_grave';

select estado, aval_erro_grave from public.artigos where id = ':artigo';
```

Expected: `aval_erro_grave = 0` e `estado` **continua** `'retirado'`.

- [ ] **Step 9: Provar a restrição da descrição obrigatória**

```sql
insert into public.artigo_avaliacoes (artigo_id, user_id, tipo)
select ':artigo3', id, 'erro_grave' from auth.users order by created_at limit 1;
```

Expected: FALHA com `violates check constraint "descricao_obrigatoria_no_erro"`.

- [ ] **Step 10: Limpar os dados de teste**

```sql
delete from public.artigos where autor_sigla_casa = 'TESTE';
select count(*) as deve_ser_zero from public.artigos where autor_sigla_casa = 'TESTE';
select count(*) as revisoes_orfas from public.artigo_revisoes r
  where not exists (select 1 from public.artigos a where a.id = r.artigo_id);
```

Expected: `0` nas duas. Avaliações e revisões somem junto, por `on delete cascade`.

- [ ] **Step 11: Commit**

```bash
git add supabase/migrations/20260826100200_artigos_gatilho.sql
git commit -m "feat: gatilho que reconta avaliacoes e retira artigo com erro grave"
```

---

## Task 5: Políticas de acesso

**Files:**

- Create: `supabase/migrations/20260826100300_artigos_politicas.sql`

**Interfaces:**

- Consumes: tabelas da Task 3; `email_verificado`, `usuario_sancionado` da Task 2.
- Produces: `public.pode_revisar_artigo(alvo uuid) returns boolean`, e as políticas de todas as quatro tabelas.

- [ ] **Step 1: Escrever a migration**

Criar `supabase/migrations/20260826100300_artigos_politicas.sql`:

```sql
-- Quem revisa: o DEV do site, e o Presidente ou Vice da casa do autor.
-- Banir alguem atravessa as casas, entao o DEV enxerga tudo; o Presidente
-- enxerga apenas os autores da propria casa.
create or replace function public.pode_revisar_artigo(alvo uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.artigos a
      join public.profiles p on p.id = auth.uid()
     where a.id = alvo
       and (
         p.cargo_principal = 'DEV'
         or (p.sigla_casa = a.autor_sigla_casa
             and p.cargo_principal in ('Presidente', 'Vice-presidente'))
       )
  );
$$;

revoke execute on function public.pode_revisar_artigo(uuid) from public;
grant execute on function public.pode_revisar_artigo(uuid) to authenticated;

-- ── artigos ────────────────────────────────────────────────────────────────
-- Qualquer pessoa, com ou sem conta, le os publicados. O autor ve os seus em
-- qualquer estado. Quem revisa ve tudo.
create policy artigos_select on public.artigos for select
  using (
    estado = 'publicado'
    or autor_id = auth.uid()
    or public.pode_revisar_artigo(id)
  );

create policy artigos_insert on public.artigos for insert
  with check (
    autor_id = auth.uid()
    and public.email_verificado()
    and not public.usuario_sancionado(auth.uid())
  );

-- O autor corrige enquanto o texto nao esta sob decisao; o revisor mexe sempre.
create policy artigos_update on public.artigos for update
  using (
    (autor_id = auth.uid() and estado in ('publicado', 'retirado', 'em_correcao'))
    or public.pode_revisar_artigo(id)
  )
  with check (
    autor_id = auth.uid() or public.pode_revisar_artigo(id)
  );

create policy artigos_delete on public.artigos for delete
  using (public.pode_revisar_artigo(id));

-- ── artigo_avaliacoes ──────────────────────────────────────────────────────
-- O publico NAO le esta tabela. Politica no Postgres filtra linha, nao coluna:
-- nao ha como liberar a contagem e esconder a descricao do erro na mesma
-- consulta. As contagens ja estao em artigos; as descricoes, que sao acusacoes
-- escritas sobre pessoa identificada, ficam com quem tem o que fazer com elas.
create policy artigo_avaliacoes_select on public.artigo_avaliacoes for select
  using (
    user_id = auth.uid()
    or exists (select 1 from public.artigos a
                where a.id = artigo_id and a.autor_id = auth.uid())
    or public.pode_revisar_artigo(artigo_id)
  );

create policy artigo_avaliacoes_insert on public.artigo_avaliacoes for insert
  with check (
    user_id = auth.uid()
    and public.email_verificado()
    and not public.usuario_sancionado(auth.uid())
    -- Ninguem avalia o proprio artigo.
    and not exists (select 1 from public.artigos a
                     where a.id = artigo_id and a.autor_id = auth.uid())
  );

create policy artigo_avaliacoes_update on public.artigo_avaliacoes for update
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and public.email_verificado()
    and not public.usuario_sancionado(auth.uid())
  );

create policy artigo_avaliacoes_delete on public.artigo_avaliacoes for delete
  using (user_id = auth.uid());

-- ── artigo_revisoes ────────────────────────────────────────────────────────
create policy artigo_revisoes_select on public.artigo_revisoes for select
  using (
    public.pode_revisar_artigo(artigo_id)
    or exists (select 1 from public.artigos a
                where a.id = artigo_id and a.autor_id = auth.uid())
  );

create policy artigo_revisoes_update on public.artigo_revisoes for update
  using (public.pode_revisar_artigo(artigo_id))
  with check (public.pode_revisar_artigo(artigo_id));

-- Abrir revisao: o gatilho (SECURITY DEFINER, passa por cima da politica),
-- quem revisa, e o AUTOR quando reenvia o proprio artigo corrigido. Sem o
-- ultimo caso o reenvio da Task 10 seria bloqueado pela politica.
create policy artigo_revisoes_insert on public.artigo_revisoes for insert
  with check (
    public.pode_revisar_artigo(artigo_id)
    or (
      origem = 'reenvio'
      and exists (select 1 from public.artigos a
                   where a.id = artigo_id
                     and a.autor_id = auth.uid()
                     and a.estado = 'em_correcao')
    )
  );

-- ── usuarios_sancoes ───────────────────────────────────────────────────────
create policy usuarios_sancoes_select on public.usuarios_sancoes for select
  using (
    user_id = auth.uid()
    or exists (select 1 from public.profiles p
                where p.id = auth.uid() and p.cargo_principal = 'DEV')
    or exists (select 1 from public.profiles p
               join public.profiles alvo on alvo.id = public.usuarios_sancoes.user_id
                where p.id = auth.uid()
                  and p.sigla_casa = alvo.sigla_casa
                  and p.cargo_principal in ('Presidente', 'Vice-presidente'))
  );

create policy usuarios_sancoes_insert on public.usuarios_sancoes for insert
  with check (
    aplicada_por = auth.uid()
    and exists (select 1 from public.profiles p
                 where p.id = auth.uid()
                   and p.cargo_principal in ('DEV', 'Presidente', 'Vice-presidente'))
  );

create policy usuarios_sancoes_update on public.usuarios_sancoes for update
  using (exists (select 1 from public.profiles p
                  where p.id = auth.uid()
                    and p.cargo_principal in ('DEV', 'Presidente', 'Vice-presidente')));
```

- [ ] **Step 2: Aplicar a migration**

Aplicar com `apply_migration` no ambiente escolhido na Task 3.

- [ ] **Step 3: Conferir o que o visitante anônimo enxerga**

Sem token, direto na API REST, com a chave pública:

```bash
KEY="<VITE_SUPABASE_PUBLISHABLE_KEY>"
U="https://<projeto>.supabase.co/rest/v1"
curl -s -H "apikey: $KEY" "$U/artigos?select=titulo,estado" | head -c 400
curl -s -o /dev/null -w "avaliacoes: HTTP %{http_code}\n" -H "apikey: $KEY" "$U/artigo_avaliacoes?select=*"
curl -s -H "apikey: $KEY" "$U/artigo_avaliacoes?select=*" | head -c 200
```

Expected: em `artigos`, só linhas com `estado = 'publicado'` — nenhuma `retirado` nem `em_correcao`. Em `artigo_avaliacoes`, HTTP 200 com **lista vazia** (a política nega toda linha ao anônimo), nunca uma descrição de erro.

- [ ] **Step 4: Conferir que não verificado não publica**

Com o token de um usuário sem `email_confirmed_at` (há 2 na base):

```bash
curl -s -X POST -H "apikey: $KEY" -H "Authorization: Bearer <token_nao_verificado>" \
  -H "Content-Type: application/json" \
  -d '{"autor_id":"<uid>","autor_nome":"Teste","titulo":"Titulo de teste","slug":"teste-rls","conteudo":"'"$(printf 'x%.0s' {1..250})"'"}' \
  "$U/artigos"
```

Expected: HTTP 403 com `new row violates row-level security policy`.

- [ ] **Step 5: Conferir que o autor não avalia o próprio artigo**

Com o token do autor de um artigo de teste:

```bash
curl -s -X POST -H "apikey: $KEY" -H "Authorization: Bearer <token_do_autor>" \
  -H "Content-Type: application/json" \
  -d '{"artigo_id":"<id>","user_id":"<uid_do_autor>","tipo":"otimo"}' \
  "$U/artigo_avaliacoes"
```

Expected: HTTP 403 por violação de política.

- [ ] **Step 6: Rodar o verificador de segurança do Supabase**

Usar o MCP `get_advisors` com `type: "security"`.
Expected: nenhum aviso novo sobre as quatro tabelas.

- [ ] **Step 7: Limpar o que os testes criaram e commitar**

```sql
delete from public.artigos where autor_sigla_casa = 'TESTE';
```

```bash
git add supabase/migrations/20260826100300_artigos_politicas.sql
git commit -m "feat: politicas de acesso dos artigos da comunidade"
```

---

## Task 6: A view pública e os tipos

**Files:**

- Create: `supabase/migrations/20260826100400_artigos_view_publica.sql`
- Modify: `src/integrations/supabase/types.ts`

**Interfaces:**

- Consumes: tabelas da Task 3; `artigo_piso_retirada`, `total_verificados` da Task 2.
- Produces: view `public.artigos_publicos` com as colunas de `artigos` mais `piso_atual int`, e com `conteudo` nulo quando o estado não é `publicado`.

- [ ] **Step 1: Escrever a migration**

Criar `supabase/migrations/20260826100400_artigos_view_publica.sql`:

```sql
-- Esconder o texto retirado na tela nao bastaria: quem abrisse as ferramentas
-- do navegador leria o conteudo na resposta da API. A view zera o texto na
-- origem, no servidor.
--
-- Traz tambem piso_atual, para a tela mostrar quantas marcacoes faltam sem
-- recalcular a regra por conta propria. Uma regra, um lugar.
create or replace view public.artigos_publicos
with (security_invoker = true)
as
select
  a.id, a.autor_id, a.autor_nome, a.autor_sigla_casa,
  a.titulo, a.slug, a.resumo,
  case when a.estado = 'publicado' then a.conteudo else null end as conteudo,
  a.estado,
  a.aval_otimo, a.aval_bom, a.aval_gostei,
  a.aval_nao_gostei, a.aval_erro, a.aval_erro_grave,
  (a.aval_otimo + a.aval_bom + a.aval_gostei) as aprovacoes,
  a.retirado_em, a.retirado_por, a.retirado_motivo,
  a.created_at, a.editado_em, a.publicado_em,
  public.artigo_piso_retirada(public.total_verificados()) as piso_atual
from public.artigos a;

grant select on public.artigos_publicos to anon, authenticated;
```

`security_invoker = true` faz a view respeitar as políticas de quem consulta, em vez de rodar com os poderes de quem a criou. Sem isso, a view viraria um buraco em volta da RLS.

- [ ] **Step 2: Aplicar e conferir que o texto retirado não sai do servidor**

Criar um artigo de teste com `autor_sigla_casa = 'TESTE'`, derrubá-lo como na Task 4, e então:

```bash
curl -s -H "apikey: $KEY" \
  "$U/artigos_publicos?select=titulo,estado,conteudo,piso_atual&estado=eq.retirado"
```

Expected: `conteudo` vem `null`. **Ler o corpo da resposta inteiro e confirmar que o texto não aparece em lugar nenhum** — é a prova que importa.

- [ ] **Step 3: Conferir `piso_atual`**

```bash
curl -s -H "apikey: $KEY" "$U/artigos_publicos?select=piso_atual&limit=1"
```

Expected: `3` com a base atual de 9 verificados.

- [ ] **Step 4: Regerar os tipos**

Usar o MCP `generate_typescript_types` e gravar em `src/integrations/supabase/types.ts`.

Run: `npx tsc --noEmit`
Expected: sem erro.

- [ ] **Step 5: Limpar e commitar**

```sql
delete from public.artigos where autor_sigla_casa = 'TESTE';
```

```bash
git add supabase/migrations/20260826100400_artigos_view_publica.sql src/integrations/supabase/types.ts
git commit -m "feat: view publica dos artigos, sem o texto retirado"
```

---

## Task 7: Ler — lista e artigo

**Files:**

- Create: `src/routes/artigos.index.tsx`
- Create: `src/routes/artigos.$slug.tsx`
- Modify: `src/routes/__root.tsx` (entrada "Artigos" no menu)

**Interfaces:**

- Consumes: `artigos_publicos` (Task 6); `ROTULOS` de `src/lib/artigos.ts` (Task 1).
- Produces: rotas `/artigos` e `/artigos/$slug`.

- [ ] **Step 1: Criar a lista**

`src/routes/artigos.index.tsx`. Pontos obrigatórios:

- `<main className="page-light min-h-screen px-4 pt-20 pb-20">`, como manda o padrão do projeto.
- Consulta e ordenação:

```ts
type Ordem = "recentes" | "avaliados";

async function carregar(ordem: Ordem) {
  const coluna = ordem === "avaliados" ? "aprovacoes" : "publicado_em";
  const { data, error } = await supabase
    .from("artigos_publicos")
    .select("id,titulo,slug,resumo,autor_nome,autor_sigla_casa,publicado_em,aprovacoes")
    .eq("estado", "publicado")
    .order(coluna, { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}
```

- Dois botões de ordenação, "Mais recentes" (padrão) e "Mais bem avaliados".
- Cada cartão: título, resumo, assinatura `autor_nome · autor_sigla_casa`, data, e as aprovações.
- Vazio: "Ainda não há artigos publicados." e, para quem está logado e verificado, o botão de escrever.
- Botão "Escrever artigo" leva a `/artigos/novo`; aparece só para quem está logado.

- [ ] **Step 2: Criar a leitura**

`src/routes/artigos.$slug.tsx`. Pontos obrigatórios:

- Busca por `slug`:

```ts
const { data: artigo } = await supabase
  .from("artigos_publicos")
  .select("*")
  .eq("slug", slug)
  .maybeSingle();
```

`conteudo` já chega nulo quando o artigo não está publicado — a view zera no servidor.

- Se `estado !== "publicado"`, **não** renderizar `conteudo` (que virá nulo de qualquer forma) e mostrar o aviso:

```tsx
<div className="glass rounded-2xl p-6 space-y-3">
  <div className="flex items-center gap-2.5">
    <AlertTriangle size={18} strokeWidth={1.6} className="text-amber-600" />
    <h1 className="text-lg font-medium text-foreground">Este artigo foi retirado</h1>
  </div>
  <p className="text-sm leading-relaxed text-muted-foreground">
    A comunidade apontou erro grave neste texto, e ele saiu do ar. O endereço continua aqui para
    quem chegou por um link antigo saber o que aconteceu.
  </p>
</div>
```

- Se publicado: título, assinatura, data, conteúdo, e o espaço da avaliação (Task 9), que por ora fica vazio.
- Meta tags de título e descrição para buscadores, no padrão já usado em `src/routes/__root.tsx`.

- [ ] **Step 3: Ligar no menu**

Em `src/routes/__root.tsx`, acrescentar `<Link to="/artigos" className={linkCls("/artigos")}>Artigos</Link>` na navegação de desktop, junto de "Biblioteca" e "Músicas", e o item equivalente no menu do celular.

**Não tocar em `src/routes/index.tsx`.**

- [ ] **Step 4: Conferir**

Run: `npm run build && npm test && npx eslint src/routes/artigos.index.tsx src/routes/artigos.\$slug.tsx src/routes/__root.tsx`
Expected: tudo limpo.

Subir `npm run dev` e abrir `/artigos` **deslogado**: a lista aparece e não exige conta.

- [ ] **Step 5: Commit**

```bash
git add src/routes/artigos.index.tsx "src/routes/artigos.\$slug.tsx" src/routes/__root.tsx
git commit -m "feat: lista e leitura publica de artigos"
```

---

## Task 8: Escrever

**Files:**

- Create: `src/routes/artigos.novo.tsx`

**Interfaces:**

- Consumes: `gerarSlug` de `src/lib/artigos.ts`; tabela `artigos`.
- Produces: rota `/artigos/novo`.

- [ ] **Step 1: Criar a tela**

Pontos obrigatórios:

- Campos: título, resumo (opcional, até 400), conteúdo. Rótulos e caixas no padrão do projeto (`.page-light`, rótulo em versalete, `<textarea>` alto para o conteúdo).
- Slug por `gerarSlug(titulo)`; em caso de colisão de chave única, acrescentar um sufixo curto e tentar de novo, no máximo 5 vezes.
- `autor_nome` e `autor_sigla_casa` vêm do `profile` do `AuthContext`, gravados junto — a assinatura não deve mudar se o autor trocar de casa depois.
- **Quem não tem e-mail verificado não vê o formulário.** No lugar, o aviso:

```tsx
<p className="text-sm leading-relaxed text-muted-foreground">
  Para publicar um artigo é preciso confirmar seu e-mail. Procure a mensagem de confirmação que
  enviamos quando você criou a conta e clique no link.
</p>
```

- Quem está sancionado também não vê o formulário; consultar `usuarios_sancoes` do próprio usuário (a política permite ler as próprias) e mostrar o motivo e a data de término.
- Ao salvar, ir para `/artigos/{slug}`.

- [ ] **Step 2: Conferir os limites do banco na tela**

Título entre 5 e 160 caracteres, conteúdo com pelo menos 200: validar antes de enviar, com mensagem clara na tela — nunca deixar a restrição do banco estourar como erro técnico.

- [ ] **Step 3: Conferir**

Run: `npm run build && npx eslint src/routes/artigos.novo.tsx`
Expected: limpo.

Publicar um artigo de teste pela tela, com uma conta verificada, e conferir que ele aparece em `/artigos` deslogado. Apagar em seguida.

- [ ] **Step 4: Commit**

```bash
git add src/routes/artigos.novo.tsx
git commit -m "feat: tela de escrever artigo"
```

---

## Task 9: Avaliar

**Files:**

- Create: `src/components/AvaliacaoArtigo.tsx`
- Modify: `src/routes/artigos.$slug.tsx`

**Interfaces:**

- Consumes: `ROTULOS`, `exigeDescricao`, `descricaoValida`, `DESCRICAO_MINIMA`, `TipoAvaliacao` de `src/lib/artigos.ts`; tabela `artigo_avaliacoes`.
- Produces: `<AvaliacaoArtigo artigoId={string} autorId={string} contagens={...} pisoAtual={number} />`.

- [ ] **Step 1: Criar o componente**

Pontos obrigatórios:

- Seis botões, na ordem: Ótimo · Bom · Gostei · Não gostei · Tem erro · Tem erro grave. Os três primeiros em azul do sistema; "Não gostei" neutro; os dois de erro em âmbar e vermelho contido — o vermelho só no grave.
- Escolher "Tem erro" ou "Tem erro grave" abre o campo de descrição, obrigatório. Botão de enviar desabilitado enquanto `descricaoValida(...)` for falso, com o contador `{n}/{DESCRICAO_MINIMA}`.
- Gravar por `upsert` com `onConflict: "artigo_id,user_id"`, para o voto ser alterável.
- Quem não está logado vê as contagens e o convite a entrar. Quem não tem e-mail verificado vê a mesma mensagem da Task 8. **O autor não vê os botões** — vê "Você é o autor deste artigo."
- Mostrar as contagens de Ótimo, Bom, Gostei e Não gostei. **Não** mostrar publicamente quantas marcações de erro grave o artigo tem: exibir um placar de denúncias convida a brigada. Essa contagem aparece só para o autor e para quem revisa.
- Depois de gravar, recarregar o artigo: se o gatilho derrubou, a tela já mostra o aviso de retirada.

- [ ] **Step 2: Explicar a escala na própria tela**

Abaixo dos botões, uma linha de texto pequeno, que é também o que o manual repete:

```tsx
<p className="text-xs leading-relaxed text-muted-foreground">
  "Não gostei" registra discordância e não retira o artigo do ar. Apenas "Tem erro grave", apontado
  por um número suficiente de pessoas, retira o texto — e mesmo assim ninguém é suspenso ou banido
  de forma automática.
</p>
```

- [ ] **Step 3: Conferir o caminho inteiro**

Com duas contas verificadas diferentes, avaliar o mesmo artigo e conferir que as contagens sobem; trocar o voto e conferir que não duplica; tentar avaliar o próprio artigo e conferir que a tela nem oferece; tentar por API e conferir HTTP 403.

- [ ] **Step 4: Commit**

```bash
git add src/components/AvaliacaoArtigo.tsx "src/routes/artigos.\$slug.tsx"
git commit -m "feat: escala de avaliacao de artigos, com descricao de erro obrigatoria"
```

---

## Task 10: Meus artigos, corrigir e reenviar

**Files:**

- Create: `src/routes/artigos.meus.tsx`
- Create: `src/routes/artigos.$slug.editar.tsx`

**Interfaces:**

- Consumes: tabelas `artigos`, `artigo_avaliacoes`, `artigo_revisoes`.
- Produces: rotas `/artigos/meus` e `/artigos/$slug/editar`.

- [ ] **Step 1: Criar "meus artigos"**

- Lista os artigos do usuário em qualquer estado, com o estado bem visível.
- Em artigo retirado, mostrar `retirado_motivo` e **as descrições de erro recebidas** — é para isso que elas existem. A política já permite ao autor lê-las.
- Botão "Corrigir este artigo" leva a `/artigos/{slug}/editar`.

- [ ] **Step 2: Criar a edição**

- Mesmos campos da Task 8.
- Artigo `publicado`: salvar atualiza o texto e grava `editado_em`.
- Artigo `retirado`: ao abrir a edição, o estado passa a `em_correcao`. Ao enviar, gravar o texto e inserir uma linha em `artigo_revisoes` com `origem = 'reenvio'` e `estado = 'aberta'`.
- **Deixar explícito na tela que reenviar não devolve o artigo ao ar sozinho:**

```tsx
<p className="text-sm leading-relaxed text-muted-foreground">
  Ao enviar a correção, seu artigo entra na fila de revisão. Ele volta ao ar quando um revisor
  conferir a correção — não automaticamente.
</p>
```

- [ ] **Step 3: Conferir**

Derrubar um artigo de teste, abrir a correção, conferir que o estado virou `em_correcao`, enviar, e conferir a linha em `artigo_revisoes` com `origem = 'reenvio'`. Conferir que o artigo **continua fora do ar** para o público.

- [ ] **Step 4: Commit**

```bash
git add src/routes/artigos.meus.tsx "src/routes/artigos.\$slug.editar.tsx"
git commit -m "feat: meus artigos, correcao e reenvio para revisao"
```

---

## Task 11: Moderar

**Files:**

- Create: `src/components/FilaRevisaoArtigos.tsx`
- Modify: `src/routes/admin.tsx`
- Modify: `src/routes/casa/$sigla.tsx`

**Interfaces:**

- Consumes: `artigo_revisoes`, `artigos`, `artigo_avaliacoes`, `usuarios_sancoes`.
- Produces: `<FilaRevisaoArtigos escopo="plataforma" | "casa" sigla={string | undefined} />`.

- [ ] **Step 1: Criar a fila**

Cada caso mostra: título e trecho do artigo, autor com casa, origem (comunidade, humano ou reenvio), as contagens completas — inclusive erro grave — e **todas as descrições de erro recebidas, com quem escreveu**.

Ações, cada uma pedindo justificativa escrita:

| Ação            | Efeito                                                                                                            |
| --------------- | ----------------------------------------------------------------------------------------------------------------- |
| Restaurar       | `artigos.estado = 'publicado'`, limpa os campos de retirada; revisão vira `resolvida` com `decisao = 'restaurar'` |
| Manter retirado | Revisão vira `resolvida` com `decisao = 'manter_retirado'`                                                        |
| Suspender autor | Insere em `usuarios_sancoes` com `tipo='suspensao'` e `fim` escolhido; `decisao='suspender_autor'`                |
| Banir autor     | Insere com `tipo='banimento'` e `fim` nulo; `decisao='banir_autor'`                                               |

Suspender e banir pedem **confirmação em segundo passo**, com o nome do autor escrito por extenso no aviso. São as ações que atingem uma pessoa.

- [ ] **Step 2: Ligar em `/admin`**

Aba nova "Artigos", com `escopo="plataforma"`. Visível só para o DEV.

- [ ] **Step 3: Ligar na página da casa**

Em Configurações, com `escopo="casa"` e a sigla da casa. Visível só para Presidente e Vice.

- [ ] **Step 4: Acrescentar a retirada por decisão humana**

Em `/artigos/$slug`, para quem revisa: botão "Retirar este artigo", com justificativa obrigatória. Grava `estado='retirado'`, `retirado_por='humano'`, `retirado_por_user_id`, `retirado_motivo`, e abre revisão com `origem='humano'`.

Esta é a defesa real enquanto a comunidade é pequena — sem ela, com 9 verificados, um artigo perigoso dependeria de 3 votos para sair.

- [ ] **Step 5: Conferir**

Confirmar que um Presidente de outra casa **não** vê nem age sobre o caso de um autor que não é da casa dele — testar pela API, não só pela tela. Confirmar que um usuário suspenso não consegue publicar nem avaliar (HTTP 403).

- [ ] **Step 6: Commit**

```bash
git add src/components/FilaRevisaoArtigos.tsx src/routes/admin.tsx "src/routes/casa/\$sigla.tsx"
git commit -m "feat: fila de revisao de artigos e sancoes por decisao humana"
```

---

## Task 12: Sitemap

**Files:**

- Modify: `scripts/atualiza-sitemap.py`

- [ ] **Step 1: Incluir os artigos publicados**

Ler `artigos` com `estado = 'publicado'` e acrescentar `https://apoioespirita.com.br/artigos/{slug}` ao sitemap, com `lastmod` de `editado_em` ou `publicado_em`. Seguir o mesmo formato já usado para as casas publicadas, e a mesma filtragem de entradas vazias.

- [ ] **Step 2: Conferir**

Run: `python scripts/atualiza-sitemap.py`
Expected: o arquivo gerado traz os artigos publicados e **nenhum** retirado ou em correção.

- [ ] **Step 3: Commit**

```bash
git add scripts/atualiza-sitemap.py public/sitemap.xml
git commit -m "feat: artigos publicados no sitemap"
```

---

## Task 13: Manual e roadmap

**Files:**

- Modify: `src/routes/ajuda.tsx`
- Modify: `src/routes/painel.tsx`

- [ ] **Step 1: Escrever o manual**

Em **Ajuda**, no formato das entradas existentes (`pergunta` e `resposta`), acrescentar:

1. **"O que são os artigos da comunidade?"** — o que é, quem lê, que são públicos e aparecem em buscas.
2. **"Como publico um artigo?"** — passo a passo numerado: entrar, Artigos no menu, Escrever artigo, título, resumo, texto, publicar. Dizer que exige e-mail confirmado e como confirmar.
3. **"O que significa cada opção de avaliação?"** — as seis, uma a uma. Dizer com todas as letras que **"Não gostei" registra discordância e não retira artigo nenhum**, e por quê.
4. **"Por que preciso escrever qual é o erro?"** — porque o autor precisa saber o que corrigir e o revisor precisa julgar; marcação sem explicação não ajuda ninguém.
5. **"Quando um artigo sai do ar?"** — as duas condições, o piso proporcional, e a tabela de exemplos. Dizer que a votação **nunca** suspende nem bane.
6. **"Meu artigo foi retirado. E agora?"** — como ver os erros apontados, corrigir e reenviar, e que a volta ao ar depende de revisor.
7. **"Quem pode suspender ou banir um autor?"** — só decisão humana, do administrador do site ou do Presidente/Vice da casa do autor, a partir da fila de revisão.
8. **"Artigo retirado some do Google?"** — a resposta honesta: sai do sitemap e o endereço passa a mostrar o aviso; a saída do índice depende do buscador rastrear de novo, e cópias em cache podem sobreviver alguns dias. **Não prometer remoção imediata.**

- [ ] **Step 2: Acertar o roadmap**

O item "Artigos escritos pelos membros da comunidade" passa a `feito`. A descrição atual diz que _"o Presidente define se cada artigo precisa da sua aprovação antes de aparecer"_ — esse modelo **não foi implementado** e precisa ser reescrito, senão o painel anuncia comportamento que o sistema não tem.

- [ ] **Step 3: Conferir**

Run: `npm run build && npx prettier --check src/routes/ajuda.tsx src/routes/painel.tsx`
Expected: limpo. Abrir `/ajuda` e ler as oito entradas na tela.

- [ ] **Step 4: Commit**

```bash
git add src/routes/ajuda.tsx src/routes/painel.tsx
git commit -m "docs: manual dos artigos da comunidade e roadmap atualizado"
```

---

## Task 14: Publicar e anunciar

- [ ] **Step 1: Aplicar as cinco migrations em produção**

Só depois de tudo provado no ambiente de teste. O delta é aditivo e vai **antes** do código, na ordem: tabelas → funções → gatilho → políticas → view.

**Pedir autorização nomeada ao André.** Aplicar delta em produção não está coberto por "pode fazer" nem por "publique".

- [ ] **Step 2: Conferir a produção antes do código**

```sql
select relname, relrowsecurity from pg_class
where relname in ('artigos','artigo_avaliacoes','artigo_revisoes','usuarios_sancoes');
select public.artigo_piso_retirada(public.total_verificados()) as piso_em_producao;
```

Expected: RLS ligada nas quatro; piso `3`.

- [ ] **Step 3: Publicar**

```bash
npm run build
cd dist/server && npx wrangler deploy --config wrangler.json
```

Confirmar com prova em produção: `/artigos` responde 200 deslogado, e o arquivo de estilo novo é o referenciado no HTML.

- [ ] **Step 4: Commit e push**

```bash
git add supabase/migrations/20260826100000_artigos_tabelas.sql         supabase/migrations/20260826100100_artigos_funcoes.sql         supabase/migrations/20260826100200_artigos_gatilho.sql         supabase/migrations/20260826100300_artigos_politicas.sql         supabase/migrations/20260826100400_artigos_view_publica.sql
git commit -m "feat: artigos da comunidade em producao"
git push origin master
```

As migrations são o único item que ainda pode estar sem commit a esta altura;
todo o resto já foi commitado nas Tasks 1 a 13.

Provar o push perguntando ao servidor: `git ls-remote origin refs/heads/master` igual ao `git rev-parse HEAD`, e `git remote get-url origin` apontando para o repositório certo.

- [ ] **Step 5: Provar que nada existente quebrou**

Exigência da seção 11 da spec.

```bash
git diff HEAD~14 --stat -- src/routes/index.tsx
```

Expected: **saída vazia** — a página inicial não foi tocada em nenhuma das 14 tasks.

```bash
npm run build && npm test && npm run lint
```

Expected: build sem erro, testes verdes, ESLint sem **erros** (avisos pré-existentes seguem).

Em produção, conferir que as rotas antigas continuam de pé:

```bash
for r in "" login feb jogos transparencia musicas-cifras sugestoes casa/GECAL artigos; do
  printf "%-18s HTTP %s
" "/$r" "$(curl -s -o /dev/null -w '%{http_code}' https://apoioespirita.com.br/$r)"
done
```

Expected: 200 em todas, inclusive na `/artigos` nova.

- [ ] **Step 6: Preparar o e-mail aos verificados**

Pela Edge Function `send-notification`, para os usuários com `email_confirmed_at is not null` (9 hoje). O texto **descreve como o recurso funciona**, não só que existe: como publicar, o que significa cada uma das seis avaliações, que "Não gostei" não derruba artigo, quando um artigo sai do ar, e que ninguém é banido automaticamente.

Só fatos do que foi realmente entregue. Sem citar marcas de terceiros.

- [ ] **Step 7: Mostrar o texto ao André e só disparar com o aval dele**

Enviar alcança pessoas reais e não se desfaz. **Não disparar por conta própria.**
