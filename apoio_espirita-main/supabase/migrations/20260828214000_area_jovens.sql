-- Área de Jovens Espíritas.
--
-- Duas partes, porque o cartão promete duas coisas: "comunidade" (quem está na
-- juventude da casa) e "conteúdo e eventos" (o que essa juventude publica).
-- Entrar na área é ato voluntário do próprio membro — a plataforma não tem
-- idade de ninguém e não vai adivinhar quem é jovem.

create table if not exists public.jovens_membros (
  id uuid primary key default gen_random_uuid(),
  sigla_casa text not null,
  criado_por uuid not null,
  autor_nome text not null,
  apresentacao text check (apresentacao is null or char_length(btrim(apresentacao)) <= 300),
  created_at timestamptz not null default now(),
  unique (criado_por)
);

create table if not exists public.jovens_publicacoes (
  id uuid primary key default gen_random_uuid(),
  sigla_casa text not null,
  titulo text not null check (char_length(btrim(titulo)) between 3 and 160),
  texto text not null check (char_length(btrim(texto)) between 10 and 5000),
  categoria text not null default 'conteudo'
    check (categoria in ('conteudo', 'evento', 'convite')),
  link text check (link is null or link ~* '^https?://'),
  data_evento date,
  aberto boolean not null default false,
  criado_por uuid not null,
  autor_nome text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists jovens_publicacoes_casa_idx
  on public.jovens_publicacoes (sigla_casa, created_at desc);

drop trigger if exists jovens_membros_autor on public.jovens_membros;
create trigger jovens_membros_autor
  before insert on public.jovens_membros
  for each row execute function public.carimbar_autor();

drop trigger if exists jovens_publicacoes_autor on public.jovens_publicacoes;
create trigger jovens_publicacoes_autor
  before insert on public.jovens_publicacoes
  for each row execute function public.carimbar_autor();

drop trigger if exists jovens_publicacoes_updated on public.jovens_publicacoes;
create trigger jovens_publicacoes_updated
  before update on public.jovens_publicacoes
  for each row execute function public.set_updated_at();

alter table public.jovens_membros enable row level security;
alter table public.jovens_publicacoes enable row level security;

drop policy if exists "jovens_membros_leitura" on public.jovens_membros;
create policy "jovens_membros_leitura" on public.jovens_membros
  for select to authenticated
  using (public.pode_ver_da_casa(sigla_casa, false));

drop policy if exists "jovens_membros_entra" on public.jovens_membros;
create policy "jovens_membros_entra" on public.jovens_membros
  for insert to authenticated
  with check (public.pode_publicar_na_casa(sigla_casa) and criado_por = auth.uid());

drop policy if exists "jovens_membros_edita" on public.jovens_membros;
create policy "jovens_membros_edita" on public.jovens_membros
  for update to authenticated
  using (criado_por = auth.uid())
  with check (criado_por = auth.uid());

drop policy if exists "jovens_membros_sai" on public.jovens_membros;
create policy "jovens_membros_sai" on public.jovens_membros
  for delete to authenticated
  using (criado_por = auth.uid() or public.pode_administrar_pagina(sigla_casa));

-- Ler é de toda a casa (ou de todas, quando aberto). Publicar é de quem entrou
-- na área — do contrário "área de jovens" seria só mais um mural.
drop policy if exists "jovens_publicacoes_leitura" on public.jovens_publicacoes;
create policy "jovens_publicacoes_leitura" on public.jovens_publicacoes
  for select to authenticated
  using (public.pode_ver_da_casa(sigla_casa, aberto));

drop policy if exists "jovens_publicacoes_insere" on public.jovens_publicacoes;
create policy "jovens_publicacoes_insere" on public.jovens_publicacoes
  for insert to authenticated
  with check (
    public.pode_publicar_na_casa(sigla_casa)
    and exists (select 1 from public.jovens_membros m where m.criado_por = auth.uid())
  );

drop policy if exists "jovens_publicacoes_edita" on public.jovens_publicacoes;
create policy "jovens_publicacoes_edita" on public.jovens_publicacoes
  for update to authenticated
  using (criado_por = auth.uid() or public.pode_administrar_pagina(sigla_casa))
  with check (criado_por = auth.uid() or public.pode_administrar_pagina(sigla_casa));

drop policy if exists "jovens_publicacoes_apaga" on public.jovens_publicacoes;
create policy "jovens_publicacoes_apaga" on public.jovens_publicacoes
  for delete to authenticated
  using (criado_por = auth.uid() or public.pode_administrar_pagina(sigla_casa));
