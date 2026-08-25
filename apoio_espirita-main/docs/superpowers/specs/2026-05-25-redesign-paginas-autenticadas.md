# Redesign — Páginas Autenticadas (Serene Wisdom)

**Data:** 2026-05-25  
**Escopo:** Todas as páginas acessadas após login  
**Fora do escopo:** Página inicial com vídeo (`/`) — permanece intacta

---

## 1. Visão Geral

As páginas autenticadas do Apoio Espírita recebem um novo design system chamado **Serene Wisdom**, focado em três princípios:

1. **Identidade do centro espírita em primeiro lugar** — o nome da casa do membro é o elemento de maior destaque em toda página autenticada, não o nome da funcionalidade.
2. **Acessibilidade para usuários idosos** — tipografia generosa, hierarquia clara, áreas de toque grandes, navegação sempre visível.
3. **Padrão editorial premium** — visual de publicação cultural de alto nível, não de aplicativo corporativo.

---

## 2. Design System

### 2.1 Paleta de Cores

| Token         | Valor                | Uso                                              |
| ------------- | -------------------- | ------------------------------------------------ |
| `--blue`      | `#004a8c`            | Ações primárias, links, destaque azul            |
| `--blue-mid`  | `#1863a8`            | Hover de botões primários                        |
| `--blue-pale` | `#ebf0f9`            | Fundos de badges, tags, nav-link ativa           |
| `--blue-dim`  | `rgba(0,74,140,.07)` | Faixa de data nos cards de evento                |
| `--gold`      | `#b08826`            | Acento do centro espírita, borda do Wisdom Block |
| `--gold-pale` | `#faf5e8`            | Fundo do Wisdom Block                            |
| `--ink`       | `#111418`            | Texto principal                                  |
| `--ink-2`     | `#2e3540`            | Texto de corpo, descrições                       |
| `--ink-3`     | `#637080`            | Metadata, textos secundários                     |
| `--ink-4`     | `#a3adb8`            | Textos muito discretos, rodapés                  |
| `--surface`   | `#ffffff`            | Superfície de cards                              |
| `--bg`        | `#f7f8fc`            | Fundo geral das páginas                          |
| `--border`    | `rgba(0,20,70,.08)`  | Bordas suaves                                    |
| `--border-2`  | `rgba(0,20,70,.15)`  | Bordas em hover                                  |

### 2.2 Tipografia

**Fontes utilizadas:**

- `Libre Caslon Text` — títulos, nome do centro, citações em bloco
- `Inter` — todo o restante: corpo, metadata, números, botões, labels

**Regra inviolável:** números (horas, datas, contagens) usam sempre `Inter` com `font-variant-numeric: lining-nums tabular-nums`. Nenhuma fonte serifada para números.

**Escala base:** `html { font-size: 18px }` — toda a escala usa `rem`.

| Elemento                | Fonte             | Tamanho             | Peso |
| ----------------------- | ----------------- | ------------------- | ---- |
| Nome do centro espírita | Libre Caslon Text | 3.2rem (~58px)      | 400  |
| Títulos de seção (`h2`) | Libre Caslon Text | 1.5rem (~27px)      | 400  |
| Títulos de item (`h3`)  | Libre Caslon Text | 1.2rem (~22px)      | 400  |
| Corpo / descrições      | Inter             | 0.93rem (~17px)     | 300  |
| Metadata (hora, local)  | Inter             | 0.84rem (~15px)     | 400  |
| Labels e tags           | Inter             | 0.68rem (~12px)     | 700  |
| Botões                  | Inter             | 0.88–0.9rem (~16px) | 600  |

### 2.3 Raio de Borda

- Cards: `20px`
- Botões: `11–13px`
- Tags/pills: `999px`
- Hero do centro: sem borda arredondada (full-bleed)

### 2.4 Sombras

- Card em repouso: `0 1px 4px rgba(0,20,70,.04), 0 3px 14px rgba(0,20,70,.05)`
- Card em hover: `0 4px 16px rgba(0,20,70,.07), 0 12px 36px rgba(0,20,70,.08)`
- Botão primário: `0 2px 10px rgba(0,74,140,.22)`

Sombras têm tom azulado — nunca cinza neutro.

---

## 3. Estrutura de Layout

Toda página autenticada segue esta ordem vertical:

```
┌─────────────────────────────────────────┐
│  Barra de Navegação (sticky, 60px)      │
├─────────────────────────────────────────┤
│  Casa Hero (branco, border-bottom)      │
│  · Nome do centro em destaque máximo   │
│  · Metadata (cidade, sigla, membro desde) │
│  · Estatísticas à direita              │
├─────────────────────────────────────────┤
│  Corpo da Página (max-width 860px)      │
│  · Wisdom Block (quando aplicável)     │
│  · Cabeçalho da seção + controles      │
│  · Conteúdo específico da página       │
│  · Rodapé discreto                     │
└─────────────────────────────────────────┘
```

**Largura máxima do conteúdo:** 860px, centralizado.  
**Padding lateral:** 44px desktop, 20px mobile.

---

## 4. Componentes

### 4.1 Barra de Navegação (`TopBar`)

- Altura: 60px desktop / 56px mobile
- Fundo: `rgba(247,248,252,.95)` com `backdrop-filter: blur(18px)`
- Borda inferior: 1px `--border`
- Conteúdo: logo "Apoio Espírita" (Libre Caslon, azul) + links de nav + avatar do usuário
- Link ativo: fundo `--blue-pale`, texto `--blue`, `font-weight: 600`
- **Mobile:** exibe apenas logo + avatar; navegação vai para o BottomNav

### 4.2 Casa Hero

- Full-width, fundo branco, `border-bottom: 1px solid --border`
- Padding: 52px topo, 44px lados, 44px base (desktop); 28px / 20px (mobile)
- **Esquerda:** label dourado "Sua casa espírita" + nome do centro em Libre Caslon 3.2rem + metadata (cidade, sigla, membro desde)
- **Direita (desktop):** grupo de estatísticas (membros ativos, próximos eventos) em Inter bold 2rem
- **Mobile:** estatísticas em linha abaixo do nome, em cards lado a lado

### 4.3 Wisdom Block (Pensamento do dia)

Exibido nas páginas que têm espaço editorial acima do conteúdo principal (Agenda, futuramente Início autenticado).

- Fundo: `--gold-pale`
- Borda: 1px `--gold-border`, border-radius 18px
- Acento vertical: barra 3px `--gold` à esquerda
- Label: "Pensamento do dia" em Inter, 0.68rem, dourado
- Citação: Libre Caslon Text, itálico, 1.2rem
- Autor: Inter, 0.8rem, `--ink-4`

### 4.4 Cards de Evento (Agenda)

Estrutura de dois blocos:

**Faixa superior (`evento-topo`)**

- Fundo: `--blue-dim`
- Data por extenso: Inter bold, 0.75rem, azul, lining-nums
- Badge Aberto/Fechado: pill verde ou vermelho, à direita

**Corpo (`evento-corpo`)**

- Grid: conteúdo | ações
- Título: Libre Caslon, 1.2rem
- Metadata (hora, local, confirmados): Inter, 0.84rem, icones Lucide 14px
- Descrição: Inter light, 0.93rem, line-height 1.68
- Tags: pills Inter bold 0.66rem uppercase

**Ações**

- Status confirmado: pill verde
- Status aguardando: pill âmbar
- Botão confirmar: outline azul, min-width 164px, padding 11px

### 4.5 Botão Primário

- Background: `--blue`, border-radius 13px
- Padding: `12px 28px`
- Fonte: Inter 600, 0.9rem
- Sombra: `0 2px 10px rgba(0,74,140,.22)`
- Hover: `--blue-mid` + sombra intensificada + `translateY(-1px)`

### 4.6 Tabs de Filtro

- Container: fundo branco, border 1px `--border`, border-radius 12px, padding 4px
- Tab inativa: Inter 500, 0.84rem, `--ink-3`
- Tab ativa: fundo `--blue`, texto branco, Inter 600, sombra azul suave

### 4.7 Navegação Inferior — Mobile (`BottomNav`)

Substitui os links de navegação da TopBar em telas pequenas (< 768px).

- Posição: `sticky bottom: 0`
- Altura: 72px
- Fundo: `rgba(255,255,255,.97)` + `backdrop-filter: blur(16px)`
- Borda superior: 1px `--border`
- 4 itens: Agenda · Kanban · Evangelização · Perfil
- Cada item: ícone Lucide 24px + label 0.66rem bold
- Estado ativo: ícone + label em `--blue`
- Nenhum menu hambúrguer em nenhuma tela

---

## 5. Animações

Cards e seções entram com animação `rise` ao carregar a página:

```css
@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

Escalonamento de 0.04s a 0.52s para criar sequência orgânica de aparecimento. `cubic-bezier(.22,1,.36,1)` — suave, sem bounce.

---

## 6. Acessibilidade

- `html { font-size: 18px }` — base de toda a escala tipográfica
- Todas as áreas de toque (botões, tabs, nav items): mínimo 44×44px
- Números: sempre `font-family: Inter; font-variant-numeric: lining-nums tabular-nums`
- Contraste: todos os textos principais (#111418 sobre #ffffff) ≥ 7:1 (WCAG AAA)
- Navegação sempre visível — sem menus ocultos que exijam descoberta
- Botão "Confirmar presença" em mobile: largura total, altura mínima 48px

---

## 7. Páginas Afetadas

Todas as rotas autenticadas recebem o novo design system:

| Rota                      | Notas                                                                                         |
| ------------------------- | --------------------------------------------------------------------------------------------- |
| `/agenda`                 | Primeiro a ser implementado; serve como referência                                            |
| `/kanban`                 | Adaptar Casa Hero + cards de tarefa no novo estilo                                            |
| `/evangelizacao`          | Adaptar seções de conteúdo                                                                    |
| `/perfil`                 | Adaptar formulários e seções de dados                                                         |
| `/painel`                 | Adaptar roadmap e estatísticas                                                                |
| `/jogos/*`                | Páginas de jogos — aplicar TopBar e fundo `--bg`; Casa Hero opcional pois o contexto é lúdico |
| Demais rotas autenticadas | Seguir o mesmo padrão                                                                         |

---

## 8. O que NÃO muda

- Rota `/` (home com vídeo) — intacta
- Rota `/login` — intacta
- Rota `/transparencia` — intacta
- Rota `/sugestoes` — intacta
- Toda a lógica de negócio, banco de dados e funcionalidades existentes

---

## 9. Arquivos a Modificar

| Arquivo                        | Tipo de mudança                                                                                                                                                                                 |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/styles.css`               | **Estender** (não substituir) `.page-light` com os tokens Serene Wisdom — as variáveis CSS do bloco são sobrescritas, as classes Tailwind existentes continuam funcionando sem alteração no JSX |
| `src/routes/__root.tsx`        | Adicionar `Libre Caslon Text` ao Google Fonts                                                                                                                                                   |
| `src/routes/agenda.tsx`        | Aplicar layout Serene Wisdom                                                                                                                                                                    |
| `src/routes/kanban.tsx`        | Aplicar layout Serene Wisdom                                                                                                                                                                    |
| `src/routes/evangelizacao.tsx` | Aplicar layout Serene Wisdom                                                                                                                                                                    |
| `src/routes/perfil.tsx`        | Aplicar layout Serene Wisdom                                                                                                                                                                    |
| `src/routes/painel.tsx`        | Aplicar layout Serene Wisdom                                                                                                                                                                    |

Novos arquivos a criar:

| Arquivo                          | Descrição                                                                                                                                                                                       |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/CasaHero.tsx`    | Componente reutilizável do hero do centro espírita — recebe dados de `profile` via `useAuth()`: `sigla_casa`, `cidade`, `uf`, `created_at`. Estatísticas (membros, eventos) são props opcionais |
| `src/components/WisdomBlock.tsx` | Componente da citação diária                                                                                                                                                                    |
