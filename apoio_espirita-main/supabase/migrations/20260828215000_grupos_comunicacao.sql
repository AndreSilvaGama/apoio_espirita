-- Comunicação em Grupos.
--
-- Grupos internos por frente de trabalho, com conversa dentro da plataforma.
-- Dois cuidados decidem o desenho:
--
--   * Quem pertence ao grupo é conferido por função SECURITY DEFINER. Uma
--     política SOBRE `grupo_membros` que consultasse `grupo_membros` entraria em
--     recursão infinita — o mesmo motivo que fez `minha_sigla_casa()` existir.
--
--   * Grupo privado não aparece para quem não é membro. Grupo da casa aparece
--     para a casa inteira e qualquer membro entra sozinho.

create table if not exists public.grupos (
  id uuid primary key default gen_random_uuid(),
  sigla_casa text not null,
  nome text not null check (char_length(btrim(nome)) between 3 and 80),
  descricao text check (descricao is null or char_length(btrim(descricao)) <= 400),
  atividade text check (atividade is null or char_length(btrim(atividade)) <= 60),
  privado boolean not null default false,
  aberto boolean not null default false,
  criado_por uuid not null,
  autor_nome text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.grupo_membros (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid not null references public.grupos(id) on delete cascade,
  sigla_casa text not null,
  user_id uuid not null,
  nome text not null,
  papel text not null default 'membro' check (papel in ('membro', 'moderador')),
  adicionado_por uuid not null,
  created_at timestamptz not null default now(),
  unique (grupo_id, user_id)
);

create table if not exists public.grupo_mensagens (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid not null references public.grupos(id) on delete cascade,
  sigla_casa text not null,
  texto text not null check (char_length(btrim(texto)) between 1 and 2000),
  criado_por uuid not null,
  autor_nome text not null,
  created_at timestamptz not null default now()
);

create index if not exists grupo_membros_usuario_idx on public.grupo_membros (user_id);
create index if not exists grupo_mensagens_grupo_idx on public.grupo_mensagens (grupo_id, created_at);

create or replace function public.sou_do_grupo(p_grupo uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $fn$
  select exists (
    select 1 from public.grupo_membros
    where grupo_id = p_grupo and user_id = auth.uid()
  )
$fn$;

create or replace function public.sou_moderador_do_grupo(p_grupo uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $fn$
  select exists (
    select 1 from public.grupo_membros
    where grupo_id = p_grupo and user_id = auth.uid() and papel = 'moderador'
  )
  or exists (
    select 1 from public.grupos where id = p_grupo and criado_por = auth.uid()
  )
$fn$;

revoke execute on function public.sou_do_grupo(uuid) from anon, public;
revoke execute on function public.sou_moderador_do_grupo(uuid) from anon, public;
grant execute on function public.sou_do_grupo(uuid) to authenticated;
grant execute on function public.sou_moderador_do_grupo(uuid) to authenticated;

-- Quem entra sozinho não escolhe o próprio papel nem o nome exibido; quem é
-- adicionado por um moderador tem o nome buscado no cadastro, não no navegador.
create or replace function public.carimbar_membro_grupo()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_grupo public.grupos%rowtype;
  v_nome text;
begin
  select * into v_grupo from public.grupos where id = new.grupo_id;
  if v_grupo.id is null then
    raise exception 'Grupo não encontrado.' using errcode = 'foreign_key_violation';
  end if;

  new.adicionado_por := auth.uid();
  new.sigla_casa := v_grupo.sigla_casa;

  if new.user_id is null then
    new.user_id := auth.uid();
  end if;

  if new.user_id <> auth.uid() and not public.sou_moderador_do_grupo(new.grupo_id) then
    raise exception 'Somente quem modera o grupo adiciona outra pessoa.'
      using errcode = 'insufficient_privilege';
  end if;

  select coalesce(nullif(btrim(nome), ''), 'Membro') into v_nome
  from public.profiles where id = new.user_id;
  new.nome := coalesce(v_nome, 'Membro');

  -- Quem cria o grupo é o primeiro moderador. Os demais entram como membros.
  if new.user_id = v_grupo.criado_por then
    new.papel := 'moderador';
  elsif new.papel = 'moderador' and not public.sou_moderador_do_grupo(new.grupo_id) then
    new.papel := 'membro';
  end if;

  return new;
end;
$fn$;

drop trigger if exists grupos_autor on public.grupos;
create trigger grupos_autor before insert on public.grupos
  for each row execute function public.carimbar_autor();

drop trigger if exists grupos_updated on public.grupos;
create trigger grupos_updated before update on public.grupos
  for each row execute function public.set_updated_at();

drop trigger if exists grupo_membros_carimbo on public.grupo_membros;
create trigger grupo_membros_carimbo before insert on public.grupo_membros
  for each row execute function public.carimbar_membro_grupo();

drop trigger if exists grupo_mensagens_autor on public.grupo_mensagens;
create trigger grupo_mensagens_autor before insert on public.grupo_mensagens
  for each row execute function public.carimbar_autor();

alter table public.grupos enable row level security;
alter table public.grupo_membros enable row level security;
alter table public.grupo_mensagens enable row level security;

drop policy if exists "grupos_leitura" on public.grupos;
create policy "grupos_leitura" on public.grupos
  for select to authenticated
  using (
    (public.pode_ver_da_casa(sigla_casa, aberto) and not privado)
    or public.sou_do_grupo(id)
  );

drop policy if exists "grupos_insere" on public.grupos;
create policy "grupos_insere" on public.grupos
  for insert to authenticated
  with check (public.pode_publicar_na_casa(sigla_casa));

drop policy if exists "grupos_edita" on public.grupos;
create policy "grupos_edita" on public.grupos
  for update to authenticated
  using (criado_por = auth.uid() or public.pode_administrar_pagina(sigla_casa))
  with check (criado_por = auth.uid() or public.pode_administrar_pagina(sigla_casa));

drop policy if exists "grupos_apaga" on public.grupos;
create policy "grupos_apaga" on public.grupos
  for delete to authenticated
  using (criado_por = auth.uid() or public.pode_administrar_pagina(sigla_casa));

drop policy if exists "grupo_membros_leitura" on public.grupo_membros;
create policy "grupo_membros_leitura" on public.grupo_membros
  for select to authenticated
  using (
    public.sou_do_grupo(grupo_id)
    or exists (
      select 1 from public.grupos g
      where g.id = grupo_id and not g.privado and public.pode_ver_da_casa(g.sigla_casa, g.aberto)
    )
  );

drop policy if exists "grupo_membros_entra" on public.grupo_membros;
create policy "grupo_membros_entra" on public.grupo_membros
  for insert to authenticated
  with check (
    public.sou_moderador_do_grupo(grupo_id)
    or (
      user_id = auth.uid()
      and exists (
        select 1 from public.grupos g
        where g.id = grupo_id and not g.privado and public.pode_ver_da_casa(g.sigla_casa, g.aberto)
      )
    )
  );

drop policy if exists "grupo_membros_sai" on public.grupo_membros;
create policy "grupo_membros_sai" on public.grupo_membros
  for delete to authenticated
  using (
    user_id = auth.uid()
    or public.sou_moderador_do_grupo(grupo_id)
    or public.pode_administrar_pagina(sigla_casa)
  );

drop policy if exists "grupo_mensagens_leitura" on public.grupo_mensagens;
create policy "grupo_mensagens_leitura" on public.grupo_mensagens
  for select to authenticated
  using (public.sou_do_grupo(grupo_id));

drop policy if exists "grupo_mensagens_insere" on public.grupo_mensagens;
create policy "grupo_mensagens_insere" on public.grupo_mensagens
  for insert to authenticated
  with check (
    criado_por = auth.uid()
    and public.sou_do_grupo(grupo_id)
    and not public.usuario_sancionado(auth.uid())
  );

drop policy if exists "grupo_mensagens_apaga" on public.grupo_mensagens;
create policy "grupo_mensagens_apaga" on public.grupo_mensagens
  for delete to authenticated
  using (criado_por = auth.uid() or public.sou_moderador_do_grupo(grupo_id));

-- Conversa em tempo real: sem isto a mensagem só apareceria ao recarregar a
-- página. A publicação respeita RLS, então cada pessoa recebe apenas o que já
-- poderia ler.
do $bloco$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'grupo_mensagens'
    ) then
      alter publication supabase_realtime add table public.grupo_mensagens;
    end if;
  end if;
end $bloco$;
