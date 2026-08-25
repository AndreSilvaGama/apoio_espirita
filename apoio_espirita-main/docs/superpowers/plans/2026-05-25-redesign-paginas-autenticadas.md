# Redesign Páginas Autenticadas — Serene Wisdom

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicar o design system Serene Wisdom a todas as páginas autenticadas, colocando o nome do centro espírita em destaque máximo, adotando tipografia premium acessível para idosos (Libre Caslon Text + Inter) e navegação inferior no mobile.

**Architecture:** O `.page-light` CSS recebe os novos tokens Serene Wisdom globalmente, afetando todas as rotas autenticadas de uma vez. Dois componentes reutilizáveis (`CasaHero`, `WisdomBlock`) encapsulam os padrões visuais de destaque. Cada página principal recebe o `CasaHero` + estrutura de conteúdo atualizada. A spec está em `docs/superpowers/specs/2026-05-25-redesign-paginas-autenticadas.md`.

**Tech Stack:** React 18, TanStack Router, Tailwind CSS v4, Supabase, Lucide React, Google Fonts (Libre Caslon Text + Inter)

**Mockup de referência:** `.superpowers/brainstorm/1339-1779749631/content/agenda-v4.html` (desktop) e `mobile-v1.html` (mobile)

---

## Mapa de Arquivos

| Arquivo                          | Ação                                                                                                                 |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `src/styles.css`                 | Modificar — atualizar `.page-light` com tokens Serene Wisdom; adicionar `html { font-size: 18px }`                   |
| `src/routes/__root.tsx`          | Modificar — adicionar Libre Caslon Text ao Google Fonts; atualizar cores do NavBar ativo; adicionar BottomNav mobile |
| `src/components/CasaHero.tsx`    | Criar — hero reutilizável com nome do centro espírita                                                                |
| `src/components/WisdomBlock.tsx` | Criar — bloco de citação com acento dourado                                                                          |
| `src/routes/agenda.tsx`          | Modificar — aplicar CasaHero + WisdomBlock + novo layout de cards                                                    |
| `src/routes/kanban.tsx`          | Modificar — aplicar CasaHero + atualizar estilos de cards                                                            |
| `src/routes/evangelizacao.tsx`   | Modificar — aplicar CasaHero + atualizar seções                                                                      |
| `src/routes/perfil.tsx`          | Modificar — aplicar CasaHero + atualizar formulários                                                                 |
| `src/routes/painel.tsx`          | Modificar — aplicar CasaHero + atualizar seções                                                                      |

---

## Task 1: Atualizar tokens de design em styles.css

**Files:**

- Modify: `src/styles.css`

- [ ] **Passo 1: Substituir o bloco `.page-light` completo**

Localizar o bloco atual `.page-light { ... }` (linhas ~233–307) e substituir por:

```css
/* ── Serene Wisdom — páginas autenticadas ── */
.page-light {
  --background: #f7f8fc;
  --foreground: #111418;
  --muted-foreground: #637080;
  --border: rgba(0, 20, 70, 0.08);
  --card: #ffffff;
  --card-foreground: #111418;
  --glass-bg: rgba(255, 255, 255, 0.92);
  --glass-border: rgba(0, 20, 70, 0.1);

  /* tokens Serene Wisdom */
  --sw-blue: #004a8c;
  --sw-blue-mid: #1863a8;
  --sw-blue-pale: #ebf0f9;
  --sw-blue-dim: rgba(0, 74, 140, 0.07);
  --sw-gold: #b08826;
  --sw-gold-pale: #faf5e8;
  --sw-gold-border: rgba(176, 136, 38, 0.3);
  --sw-ink: #111418;
  --sw-ink-2: #2e3540;
  --sw-ink-3: #637080;
  --sw-ink-4: #a3adb8;
  --sw-surface: #ffffff;
  --sw-border-2: rgba(0, 20, 70, 0.15);
  --sw-shadow-card: 0 1px 4px rgba(0, 20, 70, 0.04), 0 3px 14px rgba(0, 20, 70, 0.05);
  --sw-shadow-hover: 0 4px 16px rgba(0, 20, 70, 0.07), 0 12px 36px rgba(0, 20, 70, 0.08);

  /* cyan-glow e violet-glow redefinidos para o contexto claro */
  --cyan-glow: #004a8c;
  --violet-glow: #004a8c;

  background: var(--background);
  color: var(--foreground);
}

/* inputs dentro de .page-light */
.page-light input[type="text"],
.page-light input[type="email"],
.page-light input[type="password"],
.page-light select,
.page-light textarea {
  background-color: white !important;
  border-color: rgba(0, 20, 70, 0.15) !important;
  color: #111418 !important;
  transition: all 0.2s ease !important;
}
.page-light input[type="text"]:focus,
.page-light input[type="email"]:focus,
.page-light input[type="password"]:focus,
.page-light select:focus,
.page-light textarea:focus {
  border-color: rgba(0, 74, 140, 0.6) !important;
  box-shadow: 0 0 0 3px rgba(0, 74, 140, 0.1) !important;
  outline: none !important;
}
.page-light input::placeholder,
.page-light textarea::placeholder {
  color: rgba(99, 112, 128, 0.55) !important;
}
.page-light select {
  background-color: white !important;
  border-color: rgba(0, 20, 70, 0.15) !important;
  color: #111418 !important;
}
.page-light select option {
  background-color: white;
  color: #111418;
}
.page-light .text-gradient-aurora {
  background: linear-gradient(135deg, #004a8c, #1863a8);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
```

- [ ] **Passo 2: Adicionar `html { font-size: 18px }` e animação `sw-rise` ao bloco `@layer base`**

Localizar o bloco `@layer base { ... }` e adicionar antes do fechamento `}`:

```css
html {
  font-size: 18px;
}
```

E após o bloco `@layer base`, adicionar:

```css
/* Serene Wisdom — animação de entrada suave */
@keyframes sw-rise {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.sw-rise {
  animation: sw-rise 0.65s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.sw-rise-1 {
  animation-delay: 0.04s;
}
.sw-rise-2 {
  animation-delay: 0.12s;
}
.sw-rise-3 {
  animation-delay: 0.2s;
}
.sw-rise-4 {
  animation-delay: 0.28s;
}
.sw-rise-5 {
  animation-delay: 0.36s;
}
.sw-rise-6 {
  animation-delay: 0.44s;
}
```

- [ ] **Passo 3: Verificar build sem erros**

```bash
cd D:\WEB\APOIO_ESPIRITA\apoio_espirita-main
npm run build
```

Esperado: zero erros. Se houver erros de CSS, verificar sintaxe dos blocos adicionados.

- [ ] **Passo 4: Commit**

```bash
git add src/styles.css
git commit -m "feat: tokens Serene Wisdom em .page-light + animação sw-rise"
```

---

## Task 2: Adicionar Libre Caslon Text ao projeto

**Files:**

- Modify: `src/routes/__root.tsx`

- [ ] **Passo 1: Atualizar URL do Google Fonts**

Localizar a linha com o Google Fonts stylesheet (linha ~91):

```tsx
{ rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@300;400;500;600&display=swap" },
```

Substituir por:

```tsx
{ rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@300;400;500;600;700&display=swap" },
```

> Mantém Lora (usada pelo dark theme público). Adiciona Libre Caslon Text e Inter 700.

- [ ] **Passo 2: Adicionar `--font-caslon` ao `@theme inline` em styles.css**

Localizar o bloco `@theme inline { ... }` (segunda ocorrência, linhas ~149–154) e adicionar:

```css
--font-caslon: "Libre Caslon Text", Georgia, serif;
```

- [ ] **Passo 3: Build e commit**

```bash
npm run build
git add src/routes/__root.tsx src/styles.css
git commit -m "feat: adicionar Libre Caslon Text ao projeto"
```

---

## Task 3: Atualizar cores do NavBar para Serene Wisdom

**Files:**

- Modify: `src/routes/__root.tsx` — função `NavBar`

O NavBar já é claro nas páginas autenticadas (`.glass-premium`). A mudança é substituir o violeta (`violet-50`/`violet-700`) pelo azul Serene Wisdom.

- [ ] **Passo 1: Atualizar `linkCls` na função `NavBar`**

Localizar (linhas ~320–325):

```tsx
const linkCls = (path: string) =>
  `px-3.5 py-2 text-sm font-medium rounded-xl transition-all duration-300 ${
    isActive(path)
      ? "bg-violet-50 text-violet-700 shadow-sm border border-violet-100/50"
      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
  }`;
```

Substituir por:

```tsx
const linkCls = (path: string) =>
  `px-3.5 py-2 text-sm font-medium rounded-xl transition-all duration-300 ${
    isActive(path)
      ? "bg-[#ebf0f9] text-[#004a8c] shadow-sm border border-[#004a8c]/10"
      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
  }`;
```

- [ ] **Passo 2: Atualizar `dropBtnCls` na função `NavBar`**

Localizar (linhas ~327–332):

```tsx
const dropBtnCls = (paths: string[]) =>
  `flex items-center gap-1 px-3.5 py-2 text-sm font-medium rounded-xl transition-all duration-300 ${
    isAnyActive(paths)
      ? "bg-violet-50 text-violet-700 shadow-sm border border-violet-100/50"
      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
  }`;
```

Substituir por:

```tsx
const dropBtnCls = (paths: string[]) =>
  `flex items-center gap-1 px-3.5 py-2 text-sm font-medium rounded-xl transition-all duration-300 ${
    isAnyActive(paths)
      ? "bg-[#ebf0f9] text-[#004a8c] shadow-sm border border-[#004a8c]/10"
      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
  }`;
```

- [ ] **Passo 3: Atualizar `dropItemCls`**

Localizar (linha ~334):

```tsx
const dropItemCls =
  "flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-violet-50 hover:text-violet-700 rounded-lg mx-1 my-0.5 transition-all duration-200";
```

Substituir por:

```tsx
const dropItemCls =
  "flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#ebf0f9] hover:text-[#004a8c] rounded-lg mx-1 my-0.5 transition-all duration-200";
```

- [ ] **Passo 4: Build e commit**

```bash
npm run build
git add src/routes/__root.tsx
git commit -m "feat: atualizar NavBar para cores Serene Wisdom"
```

---

## Task 4: Criar componente CasaHero

**Files:**

- Create: `src/components/CasaHero.tsx`

O `CasaHero` busca o nome completo da casa espírita em `casas_espirita` e exibe o hero de identidade. Valores opcionais `membros` e `eventos` vêm de quem usa o componente.

- [ ] **Passo 1: Criar o arquivo**

```tsx
// src/components/CasaHero.tsx
import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface CasaHeroProps {
  membros?: number;
  eventos?: number;
}

function splitNome(nome: string): [string, string] {
  const words = nome.trim().split(/\s+/);
  if (words.length <= 2) return [nome, ""];
  const idx = words.findIndex(
    (w) => w.toLowerCase() === "espírita" || w.toLowerCase() === "espirita",
  );
  if (idx >= 0 && idx < words.length - 1) {
    return [words.slice(0, idx + 1).join(" "), words.slice(idx + 1).join(" ")];
  }
  return [words.slice(0, 2).join(" "), words.slice(2).join(" ")];
}

export function CasaHero({ membros, eventos }: CasaHeroProps) {
  const { profile } = useAuth();
  const [nomeCasa, setNomeCasa] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.sigla_casa || !profile?.cidade || !profile?.uf) return;
    supabase
      .from("casas_espirita")
      .select("nome")
      .eq("sigla", profile.sigla_casa)
      .eq("cidade", profile.cidade)
      .eq("estado", profile.uf)
      .maybeSingle()
      .then(({ data }) => setNomeCasa(data?.nome ?? null));
  }, [profile?.sigla_casa, profile?.cidade, profile?.uf]);

  if (!profile?.sigla_casa) return null;

  const displayName = nomeCasa || profile.sigla_casa;
  const [linha1, linha2] = splitNome(displayName);
  const membroSince = profile.created_at ? new Date(profile.created_at).getFullYear() : null;

  return (
    <section
      className="sw-rise sw-rise-1"
      style={{
        background: "#ffffff",
        borderBottom: "1px solid rgba(0,20,70,.08)",
        padding: "52px 44px 44px",
      }}
    >
      <div
        style={{
          maxWidth: 860,
          margin: "0 auto",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 32,
          flexWrap: "wrap",
        }}
      >
        {/* nome */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 28, height: 1.5, background: "#b08826", borderRadius: 1 }} />
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "0.7rem",
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#b08826",
              }}
            >
              Sua casa espírita
            </span>
          </div>

          <h1
            style={{
              fontFamily: '"Libre Caslon Text", Georgia, serif',
              fontSize: "3.2rem",
              fontWeight: 400,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              color: "#111418",
              marginBottom: 14,
            }}
          >
            {linha1}
            {linha2 && (
              <span style={{ display: "block", fontStyle: "italic", color: "#004a8c" }}>
                {linha2}
              </span>
            )}
          </h1>

          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            {(profile.cidade || profile.uf) && (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontFamily: "Inter",
                  fontSize: "0.82rem",
                  color: "#637080",
                }}
              >
                <MapPin size={14} strokeWidth={1.5} style={{ opacity: 0.6 }} />
                {[profile.cidade, profile.uf].filter(Boolean).join(" · ")}
              </span>
            )}
            {profile.sigla_casa && (
              <>
                <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#a3adb8" }} />
                <span style={{ fontFamily: "Inter", fontSize: "0.82rem", color: "#637080" }}>
                  Sigla: {profile.sigla_casa}
                </span>
              </>
            )}
            {membroSince && (
              <>
                <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#a3adb8" }} />
                <span style={{ fontFamily: "Inter", fontSize: "0.82rem", color: "#637080" }}>
                  Membro desde {membroSince}
                </span>
              </>
            )}
          </div>
        </div>

        {/* estatísticas */}
        {(membros !== undefined || eventos !== undefined) && (
          <div style={{ display: "flex", gap: 28, flexShrink: 0, paddingBottom: 4 }}>
            {membros !== undefined && (
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "2rem",
                    fontWeight: 700,
                    color: "#004a8c",
                    lineHeight: 1,
                    fontVariantNumeric: "lining-nums",
                  }}
                >
                  {membros}
                </div>
                <div
                  style={{
                    fontFamily: "Inter",
                    fontSize: "0.72rem",
                    fontWeight: 500,
                    color: "#a3adb8",
                    marginTop: 4,
                    letterSpacing: "0.03em",
                  }}
                >
                  Membros ativos
                </div>
              </div>
            )}
            {eventos !== undefined && (
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "2rem",
                    fontWeight: 700,
                    color: "#004a8c",
                    lineHeight: 1,
                    fontVariantNumeric: "lining-nums",
                  }}
                >
                  {eventos}
                </div>
                <div
                  style={{
                    fontFamily: "Inter",
                    fontSize: "0.72rem",
                    fontWeight: 500,
                    color: "#a3adb8",
                    marginTop: 4,
                    letterSpacing: "0.03em",
                  }}
                >
                  Próximos eventos
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Passo 2: Build para verificar tipos**

```bash
npm run build
```

Esperado: zero erros de TypeScript.

- [ ] **Passo 3: Commit**

```bash
git add src/components/CasaHero.tsx
git commit -m "feat: componente CasaHero para páginas autenticadas"
```

---

## Task 5: Criar componente WisdomBlock

**Files:**

- Create: `src/components/WisdomBlock.tsx`

- [ ] **Passo 1: Criar o arquivo**

```tsx
// src/components/WisdomBlock.tsx
interface WisdomBlockProps {
  texto: string;
  autor: string;
}

export function WisdomBlock({ texto, autor }: WisdomBlockProps) {
  return (
    <div
      style={{
        background: "#faf5e8",
        border: "1px solid rgba(176,136,38,.3)",
        borderRadius: 18,
        padding: "32px 40px",
        marginBottom: 48,
        display: "flex",
        gap: 22,
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          width: 3,
          borderRadius: 2,
          background: "#b08826",
          alignSelf: "stretch",
          flexShrink: 0,
          minHeight: 40,
        }}
      />
      <div>
        <div
          style={{
            fontFamily: "Inter",
            fontSize: "0.68rem",
            fontWeight: 700,
            letterSpacing: "0.13em",
            textTransform: "uppercase",
            color: "#b08826",
            marginBottom: 10,
          }}
        >
          Pensamento do dia
        </div>
        <p
          style={{
            fontFamily: '"Libre Caslon Text", Georgia, serif',
            fontStyle: "italic",
            fontSize: "1.2rem",
            color: "#2e3540",
            lineHeight: 1.65,
            marginBottom: 10,
          }}
        >
          {texto}
        </p>
        <p
          style={{
            fontFamily: "Inter",
            fontSize: "0.8rem",
            color: "#a3adb8",
            fontWeight: 500,
            letterSpacing: "0.03em",
          }}
        >
          {autor}
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Passo 2: Build e commit**

```bash
npm run build
git add src/components/WisdomBlock.tsx
git commit -m "feat: componente WisdomBlock"
```

---

## Task 6: Aplicar Serene Wisdom à página /agenda

**Files:**

- Modify: `src/routes/agenda.tsx`

Esta é a página de referência. O padrão aqui se repete nas demais.

- [ ] **Passo 1: Adicionar imports dos novos componentes**

No topo do arquivo, após os imports existentes, adicionar:

```tsx
import { CasaHero } from "@/components/CasaHero";
import { WisdomBlock } from "@/components/WisdomBlock";
```

- [ ] **Passo 2: Atualizar o `<main>` — remover padding lateral**

Localizar a linha com `<main className="page-light min-h-screen px-4 pt-20 pb-28">` e substituir por:

```tsx
<main className="page-light min-h-screen pt-20 pb-28">
```

> Remove `px-4` do `<main>` — o CasaHero precisa ser full-bleed. Cada seção de conteúdo gerencia seu próprio padding.

- [ ] **Passo 3: Adicionar CasaHero como primeiro filho do `<main>`**

Logo após o `<main ...>`, antes do conteúdo existente, inserir:

```tsx
<CasaHero eventos={eventos.length} />
```

- [ ] **Passo 4: Envolver o conteúdo existente em div com padding e max-width**

Após o `<CasaHero>`, envolver todo o conteúdo restante da página em:

```tsx
<div style={{ maxWidth: 860, margin: "0 auto", padding: "48px 44px 0" }}>
  {/* conteúdo existente da agenda */}
</div>
```

- [ ] **Passo 5: Adicionar WisdomBlock antes da lista de eventos**

Localizar onde a lista de eventos começa (logo após o cabeçalho de seção com os filtros). Inserir antes da lista:

```tsx
<WisdomBlock
  texto='"Fora da caridade não há salvação."'
  autor="Allan Kardec — O Evangelho Segundo o Espiritismo"
/>
```

- [ ] **Passo 6: Atualizar estilos dos cards de evento**

Localizar a renderização de cada `Evento` na lista. Substituir o `className` do card-container por estilos inline alinhados ao design system:

Para o card externo (hoje provavelmente `<div className="glass rounded-...">` ou similar), substituir por:

```tsx
<div
  key={ev.id}
  style={{
    background: "#ffffff",
    border: "1px solid rgba(0,20,70,.08)",
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 12,
    boxShadow: "0 1px 4px rgba(0,20,70,.04), 0 3px 14px rgba(0,20,70,.05)",
    transition: "box-shadow .3s, border-color .3s, transform .3s cubic-bezier(.22,1,.36,1)",
  }}
  onMouseEnter={(e) => {
    (e.currentTarget as HTMLDivElement).style.boxShadow =
      "0 4px 16px rgba(0,20,70,.07), 0 12px 36px rgba(0,20,70,.08)";
    (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
    (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(0,20,70,.18)";
  }}
  onMouseLeave={(e) => {
    (e.currentTarget as HTMLDivElement).style.boxShadow =
      "0 1px 4px rgba(0,20,70,.04), 0 3px 14px rgba(0,20,70,.05)";
    (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
    (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(0,20,70,.08)";
  }}
>
  {/* faixa de data */}
  <div
    style={{
      background: "rgba(0,74,140,.07)",
      padding: "10px 24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      borderBottom: "1px solid rgba(0,20,70,.08)",
    }}
  >
    <span
      style={{
        fontFamily: "Inter, sans-serif",
        fontSize: "0.75rem",
        fontWeight: 700,
        letterSpacing: "0.09em",
        textTransform: "uppercase",
        color: "#004a8c",
        fontVariantNumeric: "lining-nums",
      }}
    >
      {fmtData(ev.data_inicio)}
    </span>
    <span
      style={{
        fontFamily: "Inter",
        fontSize: "0.68rem",
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        padding: "3px 11px",
        borderRadius: 999,
        background: ev.tipo === "aberto" ? "#eaf8f1" : "#fdf0f0",
        color: ev.tipo === "aberto" ? "#0a5c35" : "#8a1515",
      }}
    >
      {ev.tipo === "aberto" ? "Aberto" : "Fechado"}
    </span>
  </div>
  {/* corpo do card — manter JSX existente, apenas atualizar classes de texto */}
  <div style={{ padding: "22px 28px 24px" }}>
    {/* título */}
    <h3
      style={{
        fontFamily: '"Libre Caslon Text", Georgia, serif',
        fontSize: "1.2rem",
        fontWeight: 400,
        color: "#111418",
        lineHeight: 1.3,
        marginBottom: 10,
      }}
    >
      {ev.titulo}
    </h3>
    {/* metas existentes — manter lógica, atualizar apenas cores de texto para --sw-ink-3 */}
    {/* ... resto do conteúdo existente ... */}
  </div>
</div>
```

- [ ] **Passo 7: Build e verificar visualmente**

```bash
npm run build
```

Abrir `http://localhost:5173/agenda` no navegador com o dev server rodando e comparar com o mockup de referência.

- [ ] **Passo 8: Commit**

```bash
git add src/routes/agenda.tsx
git commit -m "feat: aplicar Serene Wisdom à página Agenda"
```

---

## Task 7: Aplicar Serene Wisdom à página /kanban

**Files:**

- Modify: `src/routes/kanban.tsx`

- [ ] **Passo 1: Importar CasaHero**

```tsx
import { CasaHero } from "@/components/CasaHero";
```

- [ ] **Passo 2: Atualizar `<main>` e adicionar CasaHero**

```tsx
// antes:
<main className="page-light min-h-screen px-4 pt-20 pb-28">

// depois:
<main className="page-light min-h-screen pt-20 pb-28">
```

Adicionar `<CasaHero />` como primeiro filho do `<main>`.

Envolver o conteúdo restante em:

```tsx
<div style={{ maxWidth: 860, margin: "0 auto", padding: "48px 44px 0" }}>
  {/* conteúdo existente */}
</div>
```

- [ ] **Passo 3: Atualizar cores dos cards de tarefa e colunas do kanban**

Localizar onde as colunas e cards são renderizados. Substituir classes de fundo violeta/dark por equivalentes Serene Wisdom:

| Classe antiga                      | Substituto                              |
| ---------------------------------- | --------------------------------------- |
| `bg-white/5` ou `glass` em colunas | `background: "#f7f8fc"`                 |
| `border-white/10`                  | `border: "1px solid rgba(0,20,70,.08)"` |
| `text-cyan-glow` em títulos        | `color: "#004a8c"`                      |
| badges de status violeta           | azul `#ebf0f9` / `#004a8c`              |

- [ ] **Passo 4: Build e commit**

```bash
npm run build
git add src/routes/kanban.tsx
git commit -m "feat: aplicar Serene Wisdom à página Kanban"
```

---

## Task 8: Aplicar Serene Wisdom à página /evangelizacao

**Files:**

- Modify: `src/routes/evangelizacao.tsx`

- [ ] **Passo 1: Importar CasaHero**

```tsx
import { CasaHero } from "@/components/CasaHero";
```

- [ ] **Passo 2: Atualizar `<main>` e adicionar CasaHero**

Localizar (linha ~279):

```tsx
<main className="page-light min-h-screen px-4 pt-20 pb-28">
```

Substituir por:

```tsx
<main className="page-light min-h-screen pt-20 pb-28">
```

Adicionar `<CasaHero />` como primeiro filho. Envolver conteúdo restante em:

```tsx
<div style={{ maxWidth: 860, margin: "0 auto", padding: "48px 44px 0" }}>
```

- [ ] **Passo 3: Atualizar classes de faixas etárias**

Localizar onde `cor` e `corBadge` são usados nos cards de plano de aula. As cores de borda rosa/emerald do conteúdo de evangelização podem ser mantidas (são semânticas por faixa etária) — apenas atualizar o container principal dos cards:

Substituir `className="glass rounded-2xl p-6"` por:

```tsx
style={{ background: "#ffffff", border: "1px solid rgba(0,20,70,.08)", borderRadius: 20, padding: "24px 28px", boxShadow: "0 1px 4px rgba(0,20,70,.04), 0 3px 14px rgba(0,20,70,.05)" }}
```

- [ ] **Passo 4: Build e commit**

```bash
npm run build
git add src/routes/evangelizacao.tsx
git commit -m "feat: aplicar Serene Wisdom à página Evangelização"
```

---

## Task 9: Aplicar Serene Wisdom à página /perfil

**Files:**

- Modify: `src/routes/perfil.tsx`

- [ ] **Passo 1: Importar CasaHero**

```tsx
import { CasaHero } from "@/components/CasaHero";
```

- [ ] **Passo 2: Atualizar `<main>` e adicionar CasaHero**

Localizar (linha ~273):

```tsx
<main className="page-light min-h-screen px-6 pt-20 pb-28">
```

Substituir por:

```tsx
<main className="page-light min-h-screen pt-20 pb-28">
```

Adicionar `<CasaHero />` como primeiro filho. Envolver conteúdo restante em:

```tsx
<div style={{ maxWidth: 860, margin: "0 auto", padding: "48px 44px 0" }}>
```

- [ ] **Passo 3: Atualizar cards de seção do perfil**

Localizar containers `<div className="glass rounded-3xl p-8 ...">` e substituir por:

```tsx
style={{ background: "#ffffff", border: "1px solid rgba(0,20,70,.08)", borderRadius: 20, padding: "32px", boxShadow: "0 1px 4px rgba(0,20,70,.04), 0 3px 14px rgba(0,20,70,.05)" }}
```

- [ ] **Passo 4: Atualizar botão de salvar perfil**

Localizar `<button>` de submit do formulário e atualizar para:

```tsx
style={{ background: "#004a8c", color: "#fff", borderRadius: 13, padding: "12px 28px", fontFamily: "Inter", fontSize: "0.9rem", fontWeight: 600, border: "none", cursor: "pointer", boxShadow: "0 2px 10px rgba(0,74,140,.22)" }}
```

- [ ] **Passo 5: Build e commit**

```bash
npm run build
git add src/routes/perfil.tsx
git commit -m "feat: aplicar Serene Wisdom à página Perfil"
```

---

## Task 10: Aplicar Serene Wisdom à página /painel

**Files:**

- Modify: `src/routes/painel.tsx`

- [ ] **Passo 1: Importar CasaHero**

```tsx
import { CasaHero } from "@/components/CasaHero";
```

- [ ] **Passo 2: Atualizar `<main>` e adicionar CasaHero**

Localizar (linha ~299):

```tsx
<main className="page-light min-h-screen px-6 pt-20 pb-20">
```

Substituir por:

```tsx
<main className="page-light min-h-screen pt-20 pb-20">
```

Adicionar `<CasaHero />` como primeiro filho. Envolver conteúdo restante em:

```tsx
<div style={{ maxWidth: 860, margin: "0 auto", padding: "48px 44px 0" }}>
```

- [ ] **Passo 3: Atualizar cards do roadmap**

Localizar renderização dos itens do `roadmap[]`. Substituir container de status `"feito"` e `"planejado"` pelos estilos Serene Wisdom:

```tsx
// feito:
style={{ background: "#eaf8f1", border: "1px solid rgba(10,92,53,.15)", borderRadius: 12, padding: "10px 16px" }}
// planejado:
style={{ background: "#ffffff", border: "1px solid rgba(0,20,70,.08)", borderRadius: 12, padding: "10px 16px" }}
```

- [ ] **Passo 4: Build e commit**

```bash
npm run build
git add src/routes/painel.tsx
git commit -m "feat: aplicar Serene Wisdom à página Painel"
```

---

## Task 11: Adicionar BottomNav mobile ao layout raiz

**Files:**

- Modify: `src/routes/__root.tsx`

O BottomNav substitui o menu hamburger mobile para as rotas autenticadas. O NavBar desktop permanece inalterado.

- [ ] **Passo 1: Criar o componente `BottomNav` em `__root.tsx`**

Adicionar após a definição de `NavBar`, antes de `RootComponent`:

```tsx
function BottomNav() {
  const { user } = useAuth();
  const { location } = useRouterState();

  if (!user || PUBLIC_ROUTES.includes(location.pathname)) return null;

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  const itemStyle = (path: string): React.CSSProperties => ({
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    padding: "8px 0",
    textDecoration: "none",
    color: isActive(path) ? "#004a8c" : "#a3adb8",
    transition: "color .15s",
  });

  const labelStyle: React.CSSProperties = {
    fontFamily: "Inter, sans-serif",
    fontSize: "0.66rem",
    fontWeight: 600,
    letterSpacing: "0.04em",
  };

  return (
    <nav
      className="lg:hidden"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: 72,
        background: "rgba(255,255,255,.97)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderTop: "1px solid rgba(0,20,70,.08)",
        display: "flex",
        alignItems: "center",
        zIndex: 50,
      }}
    >
      <Link to="/agenda" style={itemStyle("/agenda")}>
        <CalendarDays size={24} strokeWidth={1.8} />
        <span style={labelStyle}>Agenda</span>
      </Link>
      <Link to="/kanban" style={itemStyle("/kanban")}>
        <KanbanSquare size={24} strokeWidth={1.8} />
        <span style={labelStyle}>Kanban</span>
      </Link>
      <Link to="/evangelizacao" style={itemStyle("/evangelizacao")}>
        <GraduationCap size={24} strokeWidth={1.8} />
        <span style={labelStyle}>Evangel.</span>
      </Link>
      <Link to="/perfil" style={itemStyle("/perfil")}>
        <User size={24} strokeWidth={1.8} />
        <span style={labelStyle}>Perfil</span>
      </Link>
    </nav>
  );
}
```

- [ ] **Passo 2: Adicionar ícones necessários ao import de Lucide**

Verificar que `CalendarDays`, `KanbanSquare`, `GraduationCap`, `User` já estão nos imports do arquivo. Se algum faltar, adicionar ao import existente:

```tsx
import { ..., CalendarDays, KanbanSquare } from "lucide-react";
```

> `GraduationCap` e `User` já estão importados.

- [ ] **Passo 3: Renderizar `BottomNav` em `RootComponent`**

Localizar a função `RootComponent` e adicionar `<BottomNav />` logo após `<NavBar />`:

```tsx
function RootComponent() {
  return (
    <AuthProvider>
      <RadioProvider>
        <NavBar />
        <BottomNav />
        <Outlet />
        {/* ... resto existente ... */}
      </RadioProvider>
    </AuthProvider>
  );
}
```

- [ ] **Passo 4: Ocultar o menu hamburger mobile na NavBar para evitar redundância**

Na `NavBar`, localizar o botão de hamburger (deve conter `Menu` icon e `className` com `lg:hidden`). Adicionar `hidden` ou `xl:flex` para escondê-lo:

```tsx
// localizar algo como:
<button className="lg:hidden ...">
  <Menu ... />
</button>

// substituir lg:hidden por xl:hidden para ocultar também em lg:
<button className="xl:hidden ...">
```

> Assim em `lg` e acima o desktop nav aparece. Em mobile/tablet, o BottomNav substitui.

- [ ] **Passo 5: Ajustar `pb-28` nas páginas que precisam de espaço para o BottomNav**

As páginas com `pb-28` (112px) já têm espaço suficiente para o BottomNav de 72px. Confirmar que as páginas atualizadas nas Tasks 6–10 usam `pb-28` ou mais.

- [ ] **Passo 6: Build e commit**

```bash
npm run build
git add src/routes/__root.tsx
git commit -m "feat: BottomNav mobile para páginas autenticadas"
```

---

## Task 12: Deploy final

- [ ] **Passo 1: Build de produção limpo**

```bash
cd D:\WEB\APOIO_ESPIRITA\apoio_espirita-main
npm run build
```

Esperado: zero erros, zero warnings de TypeScript relevantes.

- [ ] **Passo 2: Deploy Cloudflare**

```bash
cd D:\WEB\APOIO_ESPIRITA\apoio_espirita-main\dist\server
npx wrangler deploy --config wrangler.json
```

- [ ] **Passo 3: Atualizar roadmap em /painel**

Em `src/routes/painel.tsx`, localizar o item do roadmap referente a este redesign e mover de `"planejado"` para `"feito"`.

- [ ] **Passo 4: Commit e push final**

```bash
cd D:\WEB\APOIO_ESPIRITA\apoio_espirita-main
git add src/routes/painel.tsx
git commit -m "chore: marcar redesign Serene Wisdom como concluído no roadmap"
git push
```

---

## Auto-revisão do plano

**Cobertura da spec:**

- ✅ Tokens Serene Wisdom em `.page-light` → Task 1
- ✅ `html { font-size: 18px }` → Task 1
- ✅ Libre Caslon Text → Task 2
- ✅ NavBar cores → Task 3
- ✅ CasaHero com nome do centro em destaque → Task 4
- ✅ WisdomBlock → Task 5
- ✅ /agenda com novo layout de cards (faixa de data no topo) → Task 6
- ✅ /kanban → Task 7
- ✅ /evangelizacao → Task 8
- ✅ /perfil → Task 9
- ✅ /painel → Task 10
- ✅ BottomNav mobile (ícone + label, sem hamburger) → Task 11
- ✅ Build + deploy + roadmap → Task 12
- ✅ Inter com lining-nums para números → declarado em Task 4 e aplicado nos cards

**Páginas não cobertas explicitamente (seguem `.page-light` automaticamente após Task 1):**

- `/tesouraria`, `/ajuda`, `/mensagem-do-dia`, `/permissoes`, `/configurar-memoria`, `/feb`, `/radio`, `/jogos/*`, `/casa/$sigla` — recebem os tokens Serene Wisdom via `.page-light` sem mudanças de JSX.
