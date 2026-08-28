-- Fórum de Apoio.
--
-- Perguntas, respostas e acolhimento entre membros. O contador de respostas e a
-- data da última resposta ficam gravados no tópico por gatilho: sem isso, listar
-- vinte tópicos custaria vinte contagens, e a lista ficaria mais lenta a cada
-- resposta escrita.

create table if not exists public.forum_topicos (
  id uuid primary key default gen_random_uuid(),
  sigla_casa text not null,
  titulo text not null check (char_length(btrim(titulo)) between 5 and 160),
  texto text not null check (char_length(btrim(texto)) between 10 and 5000),
  categoria text not null default 'duvida'
    check (categoria in ('duvida', 'acolhimento', 'estudo', 'testemunho')),
  aberto boolean not null default false,
  resolvido boolean not null default false,
  fixado boolean not null default false,
  respostas integer not null default 0,
  ultima_resposta_em timestamptz,
  criado_por uuid not null,
  autor_nome text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists forum_topicos_casa_idx
  on public.forum_topicos (sigla_casa, fixado desc, created_at desc);

create table if not exists public.forum_respostas (
  id uuid primary key default gen_random_uuid(),
  topico_id uuid not null references public.forum_topicos(id) on delete cascade,
  sigla_casa text not null,
  texto text not null check (char_length(btrim(texto)) between 2 and 5000),
  criado_por uuid not null,
  autor_nome text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists forum_respostas_topico_idx
  on public.forum_respostas (topico_id, created_at);

create or replace function public.forum_recontar()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_topico uuid := coalesce(new.topico_id, old.topico_id);
begin
  update public.forum_topicos t
  set respostas = (select count(*) from public.forum_respostas r where r.topico_id = v_topico),
      ultima_resposta_em = (select max(created_at) from public.forum_respostas r where r.topico_id = v_topico)
  where t.id = v_topico;
  return null;
end;
$$;

drop trigger if exists forum_respostas_recontar on public.forum_respostas;
create trigger forum_respostas_recontar
  after insert or delete on public.forum_respostas
  for each row execute function public.forum_recontar();

drop trigger if exists forum_topicos_autor on public.forum_topicos;
create trigger forum_topicos_autor
  before insert on public.forum_topicos
  for each row execute function public.carimbar_autor();

drop trigger if exists forum_respostas_autor on public.forum_respostas;
create trigger forum_respostas_autor
  before insert on public.forum_respostas
  for each row execute function public.carimbar_autor();

drop trigger if exists forum_topicos_updated on public.forum_topicos;
create trigger forum_topicos_updated
  before update on public.forum_topicos
  for each row execute function public.set_updated_at();

drop trigger if exists forum_respostas_updated on public.forum_respostas;
create trigger forum_respostas_updated
  before update on public.forum_respostas
  for each row execute function public.set_updated_at();

alter table public.forum_topicos enable row level security;
alter table public.forum_respostas enable row level security;

drop policy if exists "forum_topicos_leitura" on public.forum_topicos;
create policy "forum_topicos_leitura" on public.forum_topicos
  for select to authenticated
  using (public.pode_ver_da_casa(sigla_casa, aberto));

drop policy if exists "forum_topicos_insere" on public.forum_topicos;
create policy "forum_topicos_insere" on public.forum_topicos
  for insert to authenticated
  with check (public.pode_publicar_na_casa(sigla_casa));

drop policy if exists "forum_topicos_edita" on public.forum_topicos;
create policy "forum_topicos_edita" on public.forum_topicos
  for update to authenticated
  using (criado_por = auth.uid() or public.pode_administrar_pagina(sigla_casa))
  with check (criado_por = auth.uid() or public.pode_administrar_pagina(sigla_casa));

drop policy if exists "forum_topicos_apaga" on public.forum_topicos;
create policy "forum_topicos_apaga" on public.forum_topicos
  for delete to authenticated
  using (criado_por = auth.uid() or public.pode_administrar_pagina(sigla_casa));

-- A resposta segue o tópico: quem enxerga um enxerga o outro, e quem responde
-- precisa poder enxergar o tópico. Um tópico aberto a outras casas recebe
-- resposta de outra casa — é o que "abrir" quer dizer.
drop policy if exists "forum_respostas_leitura" on public.forum_respostas;
create policy "forum_respostas_leitura" on public.forum_respostas
  for select to authenticated
  using (exists (
    select 1 from public.forum_topicos t
    where t.id = topico_id and public.pode_ver_da_casa(t.sigla_casa, t.aberto)
  ));

drop policy if exists "forum_respostas_insere" on public.forum_respostas;
create policy "forum_respostas_insere" on public.forum_respostas
  for insert to authenticated
  with check (
    criado_por = auth.uid()
    and public.email_verificado()
    and not public.usuario_sancionado(auth.uid())
    and exists (
      select 1 from public.forum_topicos t
      where t.id = topico_id and public.pode_ver_da_casa(t.sigla_casa, t.aberto)
    )
  );

drop policy if exists "forum_respostas_edita" on public.forum_respostas;
create policy "forum_respostas_edita" on public.forum_respostas
  for update to authenticated
  using (criado_por = auth.uid())
  with check (criado_por = auth.uid());

-- Quem administra a página da casa DONA do tópico modera as respostas, mesmo as
-- vindas de fora — a conversa acontece na casa dela.
drop policy if exists "forum_respostas_apaga" on public.forum_respostas;
create policy "forum_respostas_apaga" on public.forum_respostas
  for delete to authenticated
  using (
    criado_por = auth.uid()
    or exists (
      select 1 from public.forum_topicos t
      where t.id = topico_id and public.pode_administrar_pagina(t.sigla_casa)
    )
  );
