-- Medicao do funil de convites.
--
-- Ate aqui `casas_convites` sabia dizer se o e-mail SAIU e se o provedor
-- recusou na hora. So isso. Com 10 enviados e 2.272 esperando, isso nao
-- responde a unica pergunta que importa antes de acelerar o volume: o convite
-- esta funcionando?
--
-- "Ninguem abriu" e "abriram e nao se interessaram" pedem correcoes opostas —
-- a primeira e problema de entrega ou de assunto, a segunda e da mensagem ou
-- da pagina de destino. Sem separar as duas, aumentar o envio e repetir o
-- mesmo erro mais rapido.
--
-- Duas fontes independentes, de proposito:
--
--   1. O PROVEDOR conta o que aconteceu com o e-mail (entregue, aberto,
--      clicado, devolvido). Chega por webhook.
--   2. O NOSSO SITE conta quem de fato chegou, pela marcacao no link do
--      convite. Nao depende de provedor nenhum e e o dado mais valioso:
--      abertura e intencao, chegada e resultado.
--
-- A segunda sobrevive se a primeira falhar (webhook desligado, provedor
-- trocado, imagem de rastreio bloqueada pelo leitor de e-mail — bloqueio
-- comum, que faz a taxa de abertura ser sempre um piso, nunca um numero
-- exato). Por isso as duas, e nao so a do provedor.

alter table public.casas_convites
  add column if not exists provedor_id      text,
  add column if not exists entregue_em      timestamptz,
  add column if not exists aberto_em        timestamptz,
  add column if not exists clicado_em       timestamptz,
  add column if not exists devolvido_em     timestamptz,
  add column if not exists devolvido_motivo text,
  add column if not exists chegou_em        timestamptz,
  add column if not exists visitas          integer not null default 0;

comment on column public.casas_convites.provedor_id is
  'Identificador da mensagem no provedor de e-mail. E por ele que o webhook '
  'reencontra o convite; o e-mail sozinho nao serve, porque a mesma casa pode '
  'receber mais de um convite ao longo do tempo.';
comment on column public.casas_convites.aberto_em is
  'Primeira abertura relatada pelo provedor. E sempre um PISO: leitor de '
  'e-mail que bloqueia imagens nao gera abertura, e a pessoa pode ter lido.';
comment on column public.casas_convites.chegou_em is
  'Primeira visita a pagina da cidade vinda do link deste convite. Este e o '
  'numero que mede resultado — os outros medem intencao.';

-- O webhook reencontra o convite por este identificador, uma vez por evento.
create index if not exists idx_casas_convites_provedor_id
  on public.casas_convites (provedor_id);

-- == Segredo proprio para o webhook ==========================================
--
-- O webhook nao tem sessao: quem se apresenta e o provedor, e a unica coisa
-- que ele pode carregar e um segredo no endereco. Por isso um segredo SEPARADO
-- do que autoriza o disparo: o endereco do webhook fica gravado no painel de
-- um terceiro, e um segredo que vaza dali nao pode dar poder de ENVIAR convite
-- a ninguem — no maximo, de escrever numeros errados no funil.
--
-- Como o do agendamento, nasce dentro do Postgres e nunca sai daqui.
alter table public.convite_config
  add column if not exists segredo_webhook text;

update public.convite_config
   set segredo_webhook = encode(gen_random_bytes(32), 'hex')
 where id = 1
   and (segredo_webhook is null or length(segredo_webhook) < 32);

-- == Registro da chegada =====================================================
--
-- Chamada pela pagina publica da cidade quando o endereco traz a marcacao do
-- convite. Quem chega nao tem conta — entao `anon` precisa poder executar.
--
-- O que alguem consegue fazer de errado sabendo um identificador de convite:
-- somar visitas que nao existiram. O identificador e aleatorio de 128 bits e
-- nao da para adivinhar, o dano possivel e um numero inflado num painel
-- privado, e a funcao nao le nem devolve nada — so escreve nessas duas
-- colunas, numa linha que ja existe. E o menor poder que resolve o problema.
create or replace function public.registrar_chegada_convite(p_convite uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.casas_convites
     set chegou_em = coalesce(chegou_em, now()),
         visitas   = visitas + 1
   where id = p_convite;
$$;

revoke all on function public.registrar_chegada_convite(uuid) from public;
grant execute on function public.registrar_chegada_convite(uuid) to anon, authenticated;

-- == Numeros do funil ========================================================
--
-- Uma consulta so, para o painel nao montar a conta por conta propria e as
-- duas telas nunca divergirem.
create or replace function public.convites_funil()
returns table (
  total        bigint,
  pendentes    bigint,
  enviados     bigint,
  falharam     bigint,
  entregues    bigint,
  abertos      bigint,
  clicados     bigint,
  devolvidos   bigint,
  chegaram     bigint,
  visitas      bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    count(*),
    count(*) filter (where status = 'pendente'),
    count(*) filter (where enviado_em is not null),
    count(*) filter (where status = 'falhou'),
    count(*) filter (where entregue_em is not null),
    count(*) filter (where aberto_em is not null),
    count(*) filter (where clicado_em is not null),
    count(*) filter (where devolvido_em is not null),
    count(*) filter (where chegou_em is not null),
    coalesce(sum(visitas), 0)
  from public.casas_convites;
$$;

-- Ninguem chama isto do navegador: quem le e a funcao de borda, com a chave de
-- servico, depois de conferir quem esta pedindo.
revoke all on function public.convites_funil() from public, anon, authenticated;
