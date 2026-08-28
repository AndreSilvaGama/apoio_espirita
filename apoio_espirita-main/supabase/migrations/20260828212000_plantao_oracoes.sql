-- Plantão de Orações.
--
-- Grade semanal fixa: cada horário é um ponto de encontro que se repete toda
-- semana, e o membro se inscreve nele. Não guardamos data, e sim dia da semana
-- e hora — um plantão não é um evento único, é um compromisso recorrente.
-- Eventos com data já têm lugar próprio na Agenda.

create table if not exists public.oracao_horarios (
  id uuid primary key default gen_random_uuid(),
  sigla_casa text not null,
  dia_semana smallint not null check (dia_semana between 0 and 6),
  hora smallint not null check (hora between 0 and 23),
  minuto smallint not null default 0 check (minuto in (0, 30)),
  intencao text check (intencao is null or char_length(btrim(intencao)) <= 200),
  vagas smallint not null default 0 check (vagas >= 0),
  aberto boolean not null default false,
  criado_por uuid not null,
  autor_nome text not null,
  created_at timestamptz not null default now(),
  unique (sigla_casa, dia_semana, hora, minuto)
);

comment on column public.oracao_horarios.vagas is 'Zero significa sem limite de participantes.';
comment on column public.oracao_horarios.dia_semana is '0 = domingo, 6 = sábado.';

create table if not exists public.oracao_inscricoes (
  id uuid primary key default gen_random_uuid(),
  horario_id uuid not null references public.oracao_horarios(id) on delete cascade,
  sigla_casa text not null,
  criado_por uuid not null,
  autor_nome text not null,
  created_at timestamptz not null default now(),
  unique (horario_id, criado_por)
);

create index if not exists oracao_inscricoes_horario_idx on public.oracao_inscricoes (horario_id);

-- O limite de vagas é conferido no banco. Conferir só na tela deixaria passar
-- duas pessoas que clicam ao mesmo tempo no último lugar.
create or replace function public.oracao_conferir_vagas()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_vagas smallint;
  v_ocupadas int;
begin
  select vagas into v_vagas from public.oracao_horarios where id = new.horario_id;
  if v_vagas is null or v_vagas = 0 then
    return new;
  end if;
  select count(*) into v_ocupadas from public.oracao_inscricoes where horario_id = new.horario_id;
  if v_ocupadas >= v_vagas then
    raise exception 'Este horário já preencheu todas as vagas.' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists oracao_inscricoes_vagas on public.oracao_inscricoes;
create trigger oracao_inscricoes_vagas
  before insert on public.oracao_inscricoes
  for each row execute function public.oracao_conferir_vagas();

drop trigger if exists oracao_horarios_autor on public.oracao_horarios;
create trigger oracao_horarios_autor
  before insert on public.oracao_horarios
  for each row execute function public.carimbar_autor();

drop trigger if exists oracao_inscricoes_autor on public.oracao_inscricoes;
create trigger oracao_inscricoes_autor
  before insert on public.oracao_inscricoes
  for each row execute function public.carimbar_autor();

alter table public.oracao_horarios enable row level security;
alter table public.oracao_inscricoes enable row level security;

drop policy if exists "oracao_horarios_leitura" on public.oracao_horarios;
create policy "oracao_horarios_leitura" on public.oracao_horarios
  for select to authenticated
  using (public.pode_ver_da_casa(sigla_casa, aberto));

drop policy if exists "oracao_horarios_insere" on public.oracao_horarios;
create policy "oracao_horarios_insere" on public.oracao_horarios
  for insert to authenticated
  with check (public.pode_publicar_na_casa(sigla_casa));

drop policy if exists "oracao_horarios_edita" on public.oracao_horarios;
create policy "oracao_horarios_edita" on public.oracao_horarios
  for update to authenticated
  using (criado_por = auth.uid() or public.pode_administrar_pagina(sigla_casa))
  with check (criado_por = auth.uid() or public.pode_administrar_pagina(sigla_casa));

drop policy if exists "oracao_horarios_apaga" on public.oracao_horarios;
create policy "oracao_horarios_apaga" on public.oracao_horarios
  for delete to authenticated
  using (criado_por = auth.uid() or public.pode_administrar_pagina(sigla_casa));

-- Quem enxerga o horário enxerga quem está inscrito nele: a agenda do plantão
-- só serve se as pessoas souberem que não estão orando sozinhas.
drop policy if exists "oracao_inscricoes_leitura" on public.oracao_inscricoes;
create policy "oracao_inscricoes_leitura" on public.oracao_inscricoes
  for select to authenticated
  using (exists (
    select 1 from public.oracao_horarios h
    where h.id = horario_id and public.pode_ver_da_casa(h.sigla_casa, h.aberto)
  ));

drop policy if exists "oracao_inscricoes_insere" on public.oracao_inscricoes;
create policy "oracao_inscricoes_insere" on public.oracao_inscricoes
  for insert to authenticated
  with check (
    criado_por = auth.uid()
    and exists (
      select 1 from public.oracao_horarios h
      where h.id = horario_id and public.pode_ver_da_casa(h.sigla_casa, h.aberto)
    )
  );

-- Sair do plantão é ato de quem entrou; o administrador da casa também remove.
drop policy if exists "oracao_inscricoes_apaga" on public.oracao_inscricoes;
create policy "oracao_inscricoes_apaga" on public.oracao_inscricoes
  for delete to authenticated
  using (criado_por = auth.uid() or public.pode_administrar_pagina(sigla_casa));
