# Apoio Espírita

> *"Fora da caridade não há salvação."* — Allan Kardec

Plataforma espírita gratuita de acolhimento, estudo e serviço. Desenvolvida como trabalho de caridade, sem fins lucrativos e sem vínculo com a FEB, UFE ou qualquer federação.

**Site:** [apoioespirita.com.br](https://apoioespirita.com.br)

---

## Sobre o projeto

O Apoio Espírita nasceu para oferecer às casas espíritas uma plataforma digital moderna, acessível e de fácil uso — especialmente para comunidades com membros mais idosos ou com pouca familiaridade com tecnologia.

Cada casa espírita cadastrada gerencia seu próprio espaço: membros, cargos, mensagens, avisos e muito mais. A plataforma é independente e os dados de cada casa pertencem à própria casa.

---

## Funcionalidades disponíveis

- **Autenticação** — Login com e-mail/senha ou Google
- **Perfil por casa** — Sigla da casa, cargo, atividades
- **Mensagem do Dia** — Fila colaborativa de mensagens agendadas por data
- **Rádio Rio de Janeiro** — Player ao vivo integrado (1400 AM, 24h de espiritismo)
- **Roadmap público** — Acompanhe o desenvolvimento e envie sugestões
- **Transparência** — Declaração de valores e independência institucional

## Em desenvolvimento

- Mural de Avisos por casa
- Aniversariantes do Mês
- Tesouraria (controle financeiro)
- Agenda de Eventos e Reuniões
- Caderno de Presença Digital
- Escala de Trabalho
- Fórum de Apoio
- Bazar On-line
- [e muito mais no roadmap](https://apoioespirita.com.br/painel)

---

## Stack técnica

| Camada | Tecnologia |
|---|---|
| Framework | React 19 + TanStack Start (SSR) |
| Linguagem | TypeScript |
| CSS | Tailwind CSS 4 |
| Componentes | shadcn/ui + Lucide React |
| Backend | Supabase (PostgreSQL + Auth + RLS) |
| Build | Vite 7 |
| Deploy | Cloudflare Workers |
| E-mail | Brevo |

---

## Como rodar localmente

### Pré-requisitos

- Node.js 20+ ou Bun
- Conta no [Supabase](https://supabase.com) (gratuita)

### 1. Clone o repositório

```bash
git clone https://github.com/AndreSilvaGama/apoio_espirita.git
cd apoio_espirita/apoio_espirita-main
```

### 2. Instale as dependências

```bash
npm install
# ou
bun install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz com as seguintes variáveis:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anon_do_supabase
```

Você encontra esses valores em **Supabase → Settings → API**.

### 4. Configure o banco de dados

Execute as migrations na ordem:

```bash
# Via Supabase CLI
supabase db push

# Ou manualmente no Supabase SQL Editor:
# execute os arquivos em supabase/migrations/ em ordem
```

### 5. Rode o servidor de desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

---

## Deploy

O deploy é feito para o Cloudflare Workers via Wrangler:

```bash
# Build
npm run build

# Deploy
cd dist/server
npx wrangler deploy --config wrangler.json
```

---

## Como contribuir

Contribuições são muito bem-vindas — especialmente de desenvolvedores que compartilham os valores espíritas.

### Formas de contribuir

- **Reportar bugs** → Abra uma [issue](https://github.com/AndreSilvaGama/apoio_espirita/issues)
- **Sugerir funcionalidades** → Abra uma issue com a tag `enhancement`
- **Código** → Faça um fork, crie uma branch e abra um Pull Request
- **Design / UX** → Compartilhe mockups ou feedbacks nas issues

### Padrões do projeto

- Código em TypeScript
- Componentes funcionais com hooks
- Sem inline styles em `<select>` e `<option>` (causa bug no light theme)
- Ícones: somente Lucide React — sem emojis nos componentes
- Espiritismo é ciência, filosofia e religião — nunca associar a esoterismo, cristais, rituais ou ocultismo

### Branch e commits

- Branch principal: `master`
- Commits em português, descritivos
- Sem força em commits já publicados

---

## Valores do projeto

Este projeto é guiado pelos princípios do Espiritismo conforme codificado por Allan Kardec:

- **Caridade** — desenvolvido e mantido gratuitamente, como serviço ao próximo
- **Transparência** — código aberto, sem fins lucrativos, sem coleta de dados desnecessária
- **Independência** — sem vínculo com federações ou entidades representativas
- **Respeito** — ao usuário, à doutrina e à diversidade de casas espíritas

---

## Licença

Este projeto é distribuído sob a licença **MIT**. Você pode usar, copiar, modificar e distribuir livremente — inclusive para adaptar à realidade da sua casa espírita.

Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## Contato

Desenvolvido por [André Silva Gama](https://github.com/AndreSilvaGama).

Para sugestões ao site: [apoioespirita.com.br/sugestoes](https://apoioespirita.com.br/sugestoes)
