-- Localização de Voluntariado.
--
-- De um lado a casa registra o que precisa; do outro o membro registra o que
-- sabe fazer. A tela cruza os dois e ordena pela quantidade de habilidades em
-- comum. Por isso as habilidades são um vocabulário fechado (`src/data/
-- habilidades.ts`), gravado como texto[]: se cada um escrevesse com as próprias
-- palavras, "pedreiro", "Pedreiro" e "alvenaria" nunca se encontrariam e o
-- cruzamento não acharia ninguém.

create table if not exists public.voluntariado_necessidades (
  id uuid primary key default gen_random_uuid(),
  sigla_casa text not null,
  titulo text not null check (char_length(btrim(titulo)) between 5 and 160),
  descricao text not null check (char_length(btrim(descricao)) between 10 and 2000),
  habilidades text[] not null default '{}',
  urgencia text not null default 'media' check (urgencia in ('baixa', 'media', 'alta')),
  prazo date,
  atendida boolean not null default false,
  aberto boolean not null default false,
  criado_por uuid not null,
  autor_nome text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.voluntariado_ofertas (
  id uuid primary key default gen_random_uuid(),
  sigla_casa text not null,
  habilidades text[] not null default '{}',
  disponibilidade text check (disponibilidade is null or char_length(btrim(disponibilidade)) <= 200),
  observacao text check (observacao is null or char_length(btrim(observacao)) <= 600),
  ativa boolean not null default true,
  aberto boolean not null default false,
  criado_por uuid not null,
  autor_nome text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (criado_por)
);

create table if not exists public.voluntariado_candidaturas (
  id uuid primary key default gen_random_uuid(),
  necessidade_id uuid not null references public.voluntariado_necessidades(id) on delete cascade,
  sigla_casa text not null,
  mensagem text check (mensagem is null or char_length(btrim(mensagem)) <= 600),
  status text not null default 'pendente' check (status in ('pendente', 'aceita', 'recusada')),
  criado_por uuid not null,
  autor_nome text not null,
  created_at timestamptz not null default now(),
  unique (necessidade_id, criado_por)
);

create index if not exists voluntariado_necessidades_casa_idx
  on public.voluntariado_necessidades (sigla_casa, atendida, created_at desc);

drop trigger if exists voluntariado_necessidades_autor on public.voluntariado_necessidades;
create trigger voluntariado_necessidades_autor before insert on public.voluntariado_necessidades
  for each row execute function public.carimbar_autor();

drop trigger if exists voluntariado_necessidades_updated on public.voluntariado_necessidades;
create trigger voluntariado_necessidades_updated before update on public.voluntariado_necessidades
  for each row execute function public.set_updated_at();

drop trigger if exists voluntariado_ofertas_autor on public.voluntariado_ofertas;
create trigger voluntariado_ofertas_autor before insert on public.voluntariado_ofertas
  for each row execute function public.carimbar_autor();

drop trigger if exists voluntariado_ofertas_updated on public.voluntariado_ofertas;
create trigger voluntariado_ofertas_updated before update on public.voluntariado_ofertas
  for each row execute function public.set_updated_at();

drop trigger if exists voluntariado_candidaturas_autor on public.voluntariado_candidaturas;
create trigger voluntariado_candidaturas_autor before insert on public.voluntariado_candidaturas
  for each row execute function public.carimbar_autor();

alter table public.voluntariado_necessidades enable row level security;
alter table public.voluntariado_ofertas enable row level security;
alter table public.voluntariado_candidaturas enable row level security;

drop policy if exists "necessidades_leitura" on public.voluntariado_necessidades;
create policy "necessidades_leitura" on public.voluntariado_necessidades
  for select to authenticated
  using (public.pode_ver_da_casa(sigla_casa, aberto));

drop policy if exists "necessidades_insere" on public.voluntariado_necessidades;
create policy "necessidades_insere" on public.voluntariado_necessidades
  for insert to authenticated
  with check (public.pode_publicar_na_casa(sigla_casa));

drop policy if exists "necessidades_edita" on public.voluntariado_necessidades;
create policy "necessidades_edita" on public.voluntariado_necessidades
  for update to authenticated
  using (criado_por = auth.uid() or public.pode_administrar_pagina(sigla_casa))
  with check (criado_por = auth.uid() or public.pode_administrar_pagina(sigla_casa));

drop policy if exists "necessidades_apaga" on public.voluntariado_necessidades;
create policy "necessidades_apaga" on public.voluntariado_necessidades
  for delete to authenticated
  using (criado_por = auth.uid() or public.pode_administrar_pagina(sigla_casa));

drop policy if exists "ofertas_leitura" on public.voluntariado_ofertas;
create policy "ofertas_leitura" on public.voluntariado_ofertas
  for select to authenticated
  using (public.pode_ver_da_casa(sigla_casa, aberto));

drop policy if exists "ofertas_insere" on public.voluntariado_ofertas;
create policy "ofertas_insere" on public.voluntariado_ofertas
  for insert to authenticated
  with check (public.pode_publicar_na_casa(sigla_casa));

-- A oferta é a vitrine do próprio membro: ninguém edita as habilidades alheias,
-- nem o administrador da casa. Ele pode apagar, se for caso de moderação.
drop policy if exists "ofertas_edita" on public.voluntariado_ofertas;
create policy "ofertas_edita" on public.voluntariado_ofertas
  for update to authenticated
  using (criado_por = auth.uid())
  with check (criado_por = auth.uid());

drop policy if exists "ofertas_apaga" on public.voluntariado_ofertas;
create policy "ofertas_apaga" on public.voluntariado_ofertas
  for delete to authenticated
  using (criado_por = auth.uid() or public.pode_administrar_pagina(sigla_casa));

-- A candidatura é conversa entre quem se ofereceu e quem pediu ajuda. Terceiros
-- não leem: seria expor quem se voluntariou e foi recusado.
drop policy if exists "candidaturas_leitura" on public.voluntariado_candidaturas;
create policy "candidaturas_leitura" on public.voluntariado_candidaturas
  for select to authenticated
  using (
    criado_por = auth.uid()
    or exists (
      select 1 from public.voluntariado_necessidades n
      where n.id = necessidade_id
        and (n.criado_por = auth.uid() or public.pode_administrar_pagina(n.sigla_casa))
    )
  );

drop policy if exists "candidaturas_insere" on public.voluntariado_candidaturas;
create policy "candidaturas_insere" on public.voluntariado_candidaturas
  for insert to authenticated
  with check (
    criado_por = auth.uid()
    and public.email_verificado()
    and not public.usuario_sancionado(auth.uid())
    and exists (
      select 1 from public.voluntariado_necessidades n
      where n.id = necessidade_id and public.pode_ver_da_casa(n.sigla_casa, n.aberto)
    )
  );

-- Aceitar ou recusar é de quem publicou a necessidade.
drop policy if exists "candidaturas_responde" on public.voluntariado_candidaturas;
create policy "candidaturas_responde" on public.voluntariado_candidaturas
  for update to authenticated
  using (exists (
    select 1 from public.voluntariado_necessidades n
    where n.id = necessidade_id
      and (n.criado_por = auth.uid() or public.pode_administrar_pagina(n.sigla_casa))
  ))
  with check (exists (
    select 1 from public.voluntariado_necessidades n
    where n.id = necessidade_id
      and (n.criado_por = auth.uid() or public.pode_administrar_pagina(n.sigla_casa))
  ));

drop policy if exists "candidaturas_apaga" on public.voluntariado_candidaturas;
create policy "candidaturas_apaga" on public.voluntariado_candidaturas
  for delete to authenticated
  using (criado_por = auth.uid());
