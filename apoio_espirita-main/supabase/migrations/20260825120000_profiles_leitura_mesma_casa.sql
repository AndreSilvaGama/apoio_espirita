-- Corrige a listagem de membros da casa.
-- A política existente (profiles_leitura_propria) limita SELECT a auth.uid() = id,
-- o que fazia /permissoes, /kanban, /agenda, /casa/$sigla e /admin enxergarem apenas
-- o próprio usuário. Políticas permissivas se somam: as novas apenas ampliam a
-- leitura, nada é revogado.

-- Funções SECURITY DEFINER: consultar profiles dentro de uma policy SOBRE profiles
-- causaria recursão infinita. Mesmo padrão já usado em has_kanban_access.
create or replace function public.minha_sigla_casa()
returns text
language sql
stable
security definer
set search_path = public
as $$ select sigla_casa from public.profiles where id = auth.uid() $$;

create or replace function public.sou_dev()
returns boolean
language sql
stable
security definer
set search_path = public
as $$ select exists (
  select 1 from public.profiles
  where id = auth.uid() and cargo_principal = 'DEV'
) $$;

revoke execute on function public.minha_sigla_casa() from anon, public;
revoke execute on function public.sou_dev() from anon, public;
grant execute on function public.minha_sigla_casa() to authenticated;
grant execute on function public.sou_dev() to authenticated;

-- Membros da mesma casa se enxergam
drop policy if exists profiles_leitura_mesma_casa on public.profiles;
create policy profiles_leitura_mesma_casa on public.profiles
  for select to authenticated
  using (sigla_casa is not null and sigla_casa = public.minha_sigla_casa());

-- O DEV enxerga todos (necessário para a lista de usuários em /admin)
drop policy if exists profiles_leitura_dev on public.profiles;
create policy profiles_leitura_dev on public.profiles
  for select to authenticated
  using (public.sou_dev());
