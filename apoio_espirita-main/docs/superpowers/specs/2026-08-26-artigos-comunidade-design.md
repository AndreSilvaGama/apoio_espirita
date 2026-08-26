# Artigos da comunidade — design

**Data:** 2026-08-26
**Estado:** aprovado na conversa, aguardando revisão do documento
**Autor da decisão:** André Gama

---

## 1. O que é

Um espaço em que qualquer usuário com e-mail verificado publica artigos espíritas,
assinados com o próprio nome e a casa a que pertence. Os artigos são lidos por toda a
comunidade e por qualquer pessoa na internet. A própria comunidade avalia o que foi
escrito, e um artigo com erro grave reconhecido por gente suficiente sai do ar sozinho.

Sanção a pessoa — suspender ou banir — nunca é automática.

### Por que existe

A plataforma reúne casas espíritas que hoje não conversam entre si. Um artigo bem escrito
por um membro de uma casa em Itaboraí não chega a ninguém fora dela. Este recurso abre
esse canal e, de quebra, dá ao site conteúdo próprio que atrai quem procura o assunto em
buscadores.

### O que este documento NÃO cobre

- Comentários em artigos. Fora de escopo nesta entrega.
- Edição colaborativa, rascunhos compartilhados, agendamento de publicação.
- Notificação por e-mail a cada artigo novo. O único e-mail previsto aqui é o anúncio
  único do recurso entrando em operação.

---

## 2. Decisões tomadas

Cada linha foi decidida pelo André na conversa de 2026-08-26. Estão registradas porque o
motivo importa mais do que a regra, e daqui a seis meses ninguém lembra o motivo.

| Decisão               | Escolha                                                           | Motivo                                                                                                     |
| --------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Quem publica          | Qualquer usuário com e-mail verificado, sem aprovação prévia      | O controle acontece depois, pela comunidade. Aprovação prévia criaria fila e trabalho para os Presidentes. |
| Quem avalia           | Qualquer usuário com e-mail verificado                            | Quem pode escrever pode avaliar.                                                                           |
| Quem lê               | Qualquer pessoa, inclusive sem conta; artigos indexados em buscas | Alcance e tráfego para o site. O risco correspondente está na seção 7.                                     |
| O que a votação faz   | Retira o artigo do ar. Nunca sanciona a pessoa                    | Protege contra brigada e engano coletivo. É o que torna o piso baixo aceitável.                            |
| Quem sanciona o autor | André (DEV) ou o Presidente/Vice da casa do autor                 | Divide a carga e envolve quem conhece a pessoa.                                                            |
| Piso de retirada      | Maior entre 3 e 20% dos usuários verificados                      | Proporcional: acompanha o crescimento da comunidade sem manutenção.                                        |
| Denominador           | Avaliações, não visualizações                                     | Maioria de leitores nunca seria atingida: quem avalia é minoria em qualquer plataforma.                    |
| Artigo retirado       | Endereço continua no ar com aviso; o texto some                   | Transparência de que houve retirada, sem manter o texto errado legível.                                    |
| Autor após a queda    | Avisado com os erros apontados; pode corrigir e reenviar          | Trata erro de boa-fé como erro, não como crime.                                                            |

### Uma decisão que não foi pedida, e por que foi tomada

**O autor não avalia o próprio artigo.** Óbvio, mas precisa estar escrito e garantido no
banco, senão alguém descobre.

---

## 3. A escala de avaliação

Um voto por pessoa por artigo, alterável a qualquer momento.

| Voto           | Conta para retirada    | Exige descrição do erro |
| -------------- | ---------------------- | ----------------------- |
| Ótimo          | Não — protege o artigo | Não                     |
| Bom            | Não — protege o artigo | Não                     |
| Gostei         | Não — protege o artigo | Não                     |
| Não gostei     | **Não**                | Não                     |
| Tem erro       | Não                    | **Sim**                 |
| Tem erro grave | **Sim**                | **Sim**                 |

**"Não gostei" não conta para retirada, e isso é deliberado.** Espiritismo tem divergência
legítima de interpretação. Se discordar derrubasse artigo, o mecanismo puniria a opinião
minoritária em vez da informação falsa. A escala separa discordar de apontar erro de fato,
e só a segunda coisa tem consequência.

**"Tem erro" não derruba nada.** É recado ao autor: erro de data, nome trocado, citação
imprecisa. Aparece para o autor corrigir e conta na fila de revisão como sinal, não como
gatilho.

**A descrição do erro é obrigatória nos dois níveis.** Marcação sem dizer qual é o erro não
ajuda o autor a corrigir nem o revisor a julgar, e o pequeno esforço de escrever já filtra a
marcação de impulso. Mínimo de 10 caracteres, garantido por restrição no banco.

---

## 4. Quando o artigo cai sozinho

O artigo é retirado quando **as duas** condições valem ao mesmo tempo:

1. `tem erro grave` ≥ **piso**
2. `tem erro grave` > (`ótimo` + `bom` + `gostei`)

onde **piso = maior entre 3 e 20% dos usuários com e-mail verificado**, arredondado para
cima.

| Verificados | Piso |
| ----------- | ---- |
| 9 (hoje)    | 3    |
| 15          | 3    |
| 50          | 10   |
| 100         | 20   |

A segunda condição é o que impede popularidade de blindar erro perigoso: não basta o
artigo ser querido, é preciso que mais gente aponte erro grave do que gente aprovou o
texto. A primeira é o que impede que três pessoas decididas derrubem qualquer coisa numa
comunidade grande.

**Retirada por decisão humana** não depende de nenhuma das duas: André ou o Presidente/Vice
da casa do autor retiram a qualquer momento. É o que cobre a janela em que a comunidade
ainda é pequena.

---

## 5. Modelo de dados

Quatro tabelas novas, todas com RLS ligada, como as 27 existentes.

### `artigos`

| Coluna                                                                                     | Tipo                   | Observação                                                      |
| ------------------------------------------------------------------------------------------ | ---------------------- | --------------------------------------------------------------- |
| `id`                                                                                       | uuid PK                |                                                                 |
| `autor_id`                                                                                 | uuid → `auth.users`    |                                                                 |
| `autor_nome`                                                                               | text NOT NULL          | Desnormalizado, como `publicacoes_casa.autor_nome`              |
| `autor_sigla_casa`                                                                         | text                   | Desnormalizado; a assinatura não muda se o autor trocar de casa |
| `titulo`                                                                                   | text NOT NULL          |                                                                 |
| `slug`                                                                                     | text NOT NULL UNIQUE   | Gerado do título; é o endereço público                          |
| `resumo`                                                                                   | text                   | Usado na lista e na descrição para buscadores                   |
| `conteudo`                                                                                 | text NOT NULL          |                                                                 |
| `estado`                                                                                   | text NOT NULL          | `publicado` · `retirado` · `em_correcao`                        |
| `aval_otimo`, `aval_bom`, `aval_gostei`, `aval_nao_gostei`, `aval_erro`, `aval_erro_grave` | int NOT NULL DEFAULT 0 | Contadores mantidos por gatilho                                 |
| `retirado_em`                                                                              | timestamptz            |                                                                 |
| `retirado_por`                                                                             | text                   | `comunidade` · `humano`                                         |
| `retirado_por_user_id`                                                                     | uuid                   | Nulo quando foi a comunidade                                    |
| `retirado_motivo`                                                                          | text                   |                                                                 |
| `created_at`, `editado_em`, `publicado_em`                                                 | timestamptz            |                                                                 |

Os contadores são desnormalizados de propósito: a lista pública precisa ordenar por
avaliação sem varrer a tabela de votos a cada carregamento.

### `artigo_avaliacoes`

| Coluna                     | Tipo                               | Observação                                                        |
| -------------------------- | ---------------------------------- | ----------------------------------------------------------------- |
| `id`                       | uuid PK                            |                                                                   |
| `artigo_id`                | uuid → `artigos` ON DELETE CASCADE |                                                                   |
| `user_id`                  | uuid → `auth.users`                |                                                                   |
| `tipo`                     | text NOT NULL                      | `otimo` · `bom` · `gostei` · `nao_gostei` · `erro` · `erro_grave` |
| `descricao_erro`           | text                               |                                                                   |
| `created_at`, `editado_em` | timestamptz                        |                                                                   |

- `UNIQUE (artigo_id, user_id)` — um voto por pessoa, alterável por UPDATE.
- `CHECK` — quando `tipo` é `erro` ou `erro_grave`, `descricao_erro` não pode ser nulo e
  precisa de pelo menos 10 caracteres. Quando é qualquer outro tipo, `descricao_erro` é
  nulo.

### `artigo_revisoes`

Fila de casos para decisão humana. Uma linha por retirada.

| Coluna          | Tipo                 | Observação                                                          |
| --------------- | -------------------- | ------------------------------------------------------------------- |
| `id`            | uuid PK              |                                                                     |
| `artigo_id`     | uuid → `artigos`     |                                                                     |
| `aberta_em`     | timestamptz NOT NULL |                                                                     |
| `origem`        | text NOT NULL        | `comunidade` · `humano` · `reenvio`                                 |
| `estado`        | text NOT NULL        | `aberta` · `resolvida`                                              |
| `decisao`       | text                 | `restaurar` · `manter_retirado` · `suspender_autor` · `banir_autor` |
| `justificativa` | text                 |                                                                     |
| `decidida_por`  | uuid                 |                                                                     |
| `decidida_em`   | timestamptz          |                                                                     |

`origem = reenvio` é o caso em que o autor corrigiu e pediu para voltar ao ar.

### Ciclo de vida do artigo

```
publicado ──(gatilho ou retirada humana)──> retirado
retirado  ──(autor clica em "corrigir")───> em_correcao
em_correcao ──(autor reenvia)─────────────> em_correcao + linha em artigo_revisoes (origem=reenvio)
em_correcao ──(revisor restaura)──────────> publicado
retirado / em_correcao ──(revisor mantém)─> retirado
```

`em_correcao` é invisível ao público, exatamente como `retirado`: o endereço mostra o mesmo
aviso. A diferença é só de quem está com a bola — em `em_correcao` o autor está mexendo no
texto. Reenviar não devolve o artigo ao ar sozinho; quem restaura é o revisor.

### `usuarios_sancoes`

| Coluna         | Tipo                 | Observação                |
| -------------- | -------------------- | ------------------------- |
| `id`           | uuid PK              |                           |
| `user_id`      | uuid → `auth.users`  |                           |
| `tipo`         | text NOT NULL        | `suspensao` · `banimento` |
| `inicio`       | timestamptz NOT NULL |                           |
| `fim`          | timestamptz          | Nulo = sem prazo          |
| `motivo`       | text NOT NULL        |                           |
| `aplicada_por` | uuid NOT NULL        |                           |
| `revogada_em`  | timestamptz          | Preenchida ao desfazer    |

Sanção **não** impede ler. Impede publicar e avaliar.

---

## 6. Onde a regra é aplicada

### Funções auxiliares (SECURITY DEFINER)

- `public.email_verificado()` → boolean. Lê `auth.users.email_confirmed_at` do usuário
  atual. Precisa ser SECURITY DEFINER porque `auth.users` não é legível pelo usuário comum.
- `public.total_verificados()` → integer. Conta os usuários com e-mail confirmado. Alimenta
  o piso proporcional.
- `public.usuario_sancionado(uid uuid)` → boolean. Verdadeiro quando há sanção vigente
  (`revogada_em` nula e `fim` nulo ou no futuro).
- `public.pode_revisar_artigo(artigo_id uuid)` → boolean. Verdadeiro para o DEV e para
  Presidente/Vice da casa do autor.

### Gatilho de retirada

`AFTER INSERT OR UPDATE OR DELETE ON artigo_avaliacoes`, por linha:

1. Recalcula os seis contadores do artigo afetado.
2. Calcula o piso: `greatest(3, ceil(0.20 * total_verificados()))`.
3. Se o artigo está `publicado` e as duas condições da seção 4 valem, muda o estado para
   `retirado`, marca `retirado_por = 'comunidade'` e insere uma linha em `artigo_revisoes`
   com `origem = 'comunidade'`.

Tudo na mesma transação do voto. Não depende de ninguém abrir tela, não tem janela de
atraso e não dá para burlar pelo navegador — o que importa porque o conteúdo é público.

**O gatilho nunca restaura sozinho.** Se as avaliações mudarem depois e a condição deixar
de valer, o artigo continua retirado até decisão humana. Retirar é reversível por gente;
oscilar sozinho, não.

### Políticas de acesso

| Tabela              | Operação      | Quem                                                                                                           |
| ------------------- | ------------- | -------------------------------------------------------------------------------------------------------------- |
| `artigos`           | SELECT        | Qualquer um (inclusive anônimo) vê os `publicado`. O autor vê os seus em qualquer estado. Quem revisa vê tudo. |
| `artigos`           | INSERT        | `email_verificado()` e não sancionado; `autor_id` = usuário atual                                              |
| `artigos`           | UPDATE        | O autor, enquanto `publicado` ou `em_correcao`; ou quem revisa                                                 |
| `artigos`           | DELETE        | Só quem revisa                                                                                                 |
| `artigo_avaliacoes` | SELECT        | O próprio avaliador vê o seu voto; o autor do artigo e quem revisa veem todos. Mais ninguém lê esta tabela     |
| `artigo_avaliacoes` | INSERT/UPDATE | `email_verificado()`, não sancionado, e **não é o autor do artigo**                                            |
| `artigo_revisoes`   | tudo          | Só quem revisa                                                                                                 |
| `usuarios_sancoes`  | SELECT        | O próprio usuário vê as suas; quem revisa vê todas                                                             |
| `usuarios_sancoes`  | INSERT/UPDATE | Só quem revisa                                                                                                 |

**Por que o público não lê `artigo_avaliacoes`.** Política de acesso no Postgres filtra
linhas, não colunas: não há como liberar a contagem e esconder a descrição do erro na mesma
consulta. Como os contadores já estão desnormalizados em `artigos`, o leitor comum não
precisa da tabela de votos — e as descrições de erro, que são acusações escritas sobre uma
pessoa identificada, ficam restritas a quem tem o que fazer com elas: o autor, para
corrigir, e o revisor, para julgar.

### O texto retirado não sai do servidor

A leitura pública passa por uma **view** `artigos_publicos` que devolve `conteudo = null`
quando o estado é `retirado`. Esconder na tela não bastaria: quem abrisse as ferramentas do
navegador leria o texto na resposta da API.

---

## 7. Risco assumido, e o que se faz sobre ele

Os artigos são públicos e indexados. Entre a publicação e a reação da comunidade existe uma
janela em que um texto com informação falsa fica visível para o mundo, assinado com o nome
do autor e o da casa dele. Foi decisão consciente do André, em troca de alcance.

O que reduz o dano, dentro do que se controla:

- Retirada humana imediata, sem esperar voto — a defesa real enquanto a comunidade é pequena.
- Retirada automática na mesma transação do voto que cruza o limiar, sem atraso.
- O texto some do servidor, não só da tela.

O que **não** se controla, e será dito assim no manual, sem promessa: uma vez indexado, o
artigo sai do buscador quando o buscador rastrear de novo. Cópias em cache e em terceiros
podem sobreviver à retirada. A plataforma não tem como apagar o que já foi copiado.

---

## 8. Telas

| Rota                           | Quem acessa                | O que faz                                                                    |
| ------------------------------ | -------------------------- | ---------------------------------------------------------------------------- |
| `/artigos`                     | Qualquer um                | Lista, ordenável por mais bem avaliados ou mais recentes                     |
| `/artigos/$slug`               | Qualquer um                | Leitura; avaliação para quem está logado e verificado; aviso quando retirado |
| `/artigos/novo`                | Verificado, não sancionado | Escrever                                                                     |
| `/artigos/$slug/editar`        | Autor ou revisor           | Corrigir; do estado `em_correcao`, reenviar para revisão                     |
| `/artigos/meus`                | Autor                      | Os próprios artigos, com os erros apontados em cada um                       |
| `/admin` → aba Artigos         | DEV                        | Fila de revisão de toda a plataforma                                         |
| `/casa/$sigla` → Configurações | Presidente/Vice            | Fila de revisão dos autores da própria casa                                  |

Entrada pelo menu principal e pelo card "Artigos e Colunistas", que já existe em `/inicio` e
na página da casa.

**A página inicial (`src/routes/index.tsx`) não é tocada.** Está protegida por regra do
projeto e nada nesta entrega precisa dela.

### Sitemap

Os artigos `publicado` entram em `scripts/atualiza-sitemap.py`, junto das casas publicadas.
Artigo retirado sai do sitemap — o endereço continua respondendo, com o aviso.

---

## 9. Entregas obrigatórias junto do código

Não são remate; sem elas a entrega não está pronta.

1. **Manual do usuário**, em **Ajuda** (`src/routes/ajuda.tsx`): como escrever, como avaliar,
   o que cada uma das seis opções significa, por que "Não gostei" não derruba artigo, quando
   um artigo cai, o que acontece com o autor, como corrigir e reenviar, e a ressalva honesta
   sobre buscadores. Passo a passo numerado, no padrão das entradas existentes.
2. **Roadmap** em `src/routes/painel.tsx`: o item "Artigos escritos pelos membros da
   comunidade" passa de `planejado` para `feito`, com a descrição batendo com o que foi
   entregue. A descrição atual menciona aprovação pelo Presidente, modelo que foi
   substituído — precisa ser reescrita.
3. **E-mail aos usuários verificados**, pela Edge Function `send-notification`, descrevendo
   **como o recurso funciona** — não só que existe. Texto preparado por Claude, disparado
   somente com aval explícito do André.

---

## 10. Como será construído

Em etapas, cada uma conferida antes da seguinte. Não é trabalho de uma passada.

1. **Banco** — tabelas, funções, gatilho, políticas, view. Testado com casos reais de
   contagem antes de qualquer tela.
2. **Ler e escrever** — lista, leitura, criar e editar. Sem avaliação ainda.
3. **Avaliar** — a escala de seis, a descrição de erro obrigatória, os contadores na tela.
4. **Moderar** — fila de revisão, sanções, corrigir e reenviar.
5. **Acabamento** — sitemap, manual, roadmap, e-mail.

O delta de banco é **aditivo** — só cria tabelas e funções novas, não altera nem remove nada
existente — e é aplicado em produção **antes** do código que depende dele, conforme a regra
do projeto.

---

## 11. Como se sabe que funciona

- **Contagem e limiar:** casos de teste com votos montados à mão, cobrindo piso não
  atingido, piso atingido sem superar os elogios, os dois satisfeitos, voto alterado que
  desfaz a condição (artigo continua retirado), e voto removido.
- **Piso proporcional:** verificado em 9, 15, 50 e 100 usuários verificados.
- **Acesso:** anônimo não lê artigo retirado nem descrição de erro; usuário não verificado
  não publica nem avalia; usuário sancionado não publica nem avalia; autor não avalia o
  próprio artigo. Cada um conferido contra a API, não só contra a tela.
- **Texto retirado:** a resposta da API não traz o conteúdo.
- **Regressão:** as páginas existentes seguem funcionando, e a página inicial permanece
  bit a bit idêntica.
