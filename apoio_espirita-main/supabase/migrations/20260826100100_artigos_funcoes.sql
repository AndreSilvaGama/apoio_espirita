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
