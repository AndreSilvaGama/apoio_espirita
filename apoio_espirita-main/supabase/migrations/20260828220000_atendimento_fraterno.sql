-- Ficha de Atendimento Fraterno.
--
-- É o dado mais sensível da plataforma: o que uma pessoa em sofrimento contou
-- em confiança. Por isso o desenho é mais fechado que o de todo o resto:
--
--   * Não existe "aberto para outras casas". Nunca. A coluna sequer foi criada.
--   * O DEV NÃO LÊ ficha. Em todas as outras tabelas `sou_dev()` abre a porta,
--     para dar suporte; aqui não abre. Suporte técnico não é motivo para ler o
--     relato de ninguém — e o preço disso é honesto: um defeito no atendimento
--     fraterno terá de ser investigado sem olhar o conteúdo das fichas.
--   * Quem lê é quem atende: o cargo de Atendente fraterno ou Coordenador da
--     casa, mais quem a direção autorizar nominalmente. Presidente não lê pelo
--     cargo — se precisar, a direção o autoriza, e o ato fica registrado.
--   * Toda abertura de ficha é registrada em `atendimento_acessos`. O registro
--     é gravado pela tela, então serve para prestar contas de quem consultou o
--     quê, não como prova contra um cliente adulterado.

create table if not exists public.atendimento_autorizados (
  id uuid primary key default gen_random_uuid(),
  sigla_casa text not null,
  user_id uuid not null,
  nome text,
  criado_por uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  unique (sigla_casa, user_id)
);

create or replace function public.pode_atendimento_fraterno(p_sigla text)
returns boolean
language sql
stable
security definer
set search_path = public
as $fn$
  select p_sigla is not null and (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and sigla_casa = p_sigla
        and cargo_principal in ('Atendente fraterno', 'Coordenador')
    )
    or exists (
      select 1 from public.atendimento_autorizados
      where sigla_casa = p_sigla and user_id = auth.uid()
    )
  )
$fn$;

comment on function public.pode_atendimento_fraterno(text) is
  'Acesso às fichas de atendimento fraterno. De propósito não inclui sou_dev(): ninguém lê o relato de um atendido a título de suporte técnico.';

revoke execute on function public.pode_atendimento_fraterno(text) from anon, public;
grant execute on function public.pode_atendimento_fraterno(text) to authenticated;

create table if not exists public.atendimento_fichas (
  id uuid primary key default gen_random_uuid(),
  sigla_casa text not null,
  atendido_nome text not null check (char_length(btrim(atendido_nome)) between 2 and 160),
  atendido_contato text check (atendido_contato is null or char_length(btrim(atendido_contato)) <= 120),
  data_atendimento date not null default current_date,
  tipo text not null default 'primeira' check (tipo in ('primeira', 'retorno')),
  relato text not null check (char_length(btrim(relato)) between 5 and 8000),
  encaminhamento text check (encaminhamento is null or char_length(btrim(encaminhamento)) <= 2000),
  retorno_em date,
  concluida boolean not null default false,
  criado_por uuid not null,
  autor_nome text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists atendimento_fichas_casa_idx
  on public.atendimento_fichas (sigla_casa, data_atendimento desc);

create table if not exists public.atendimento_acessos (
  id uuid primary key default gen_random_uuid(),
  ficha_id uuid not null references public.atendimento_fichas(id) on delete cascade,
  sigla_casa text not null,
  user_id uuid not null default auth.uid(),
  user_nome text,
  created_at timestamptz not null default now()
);

create index if not exists atendimento_acessos_ficha_idx on public.atendimento_acessos (ficha_id, created_at desc);

drop trigger if exists atendimento_fichas_autor on public.atendimento_fichas;
create trigger atendimento_fichas_autor before insert on public.atendimento_fichas
  for each row execute function public.carimbar_autor();

drop trigger if exists atendimento_fichas_updated on public.atendimento_fichas;
create trigger atendimento_fichas_updated before update on public.atendimento_fichas
  for each row execute function public.set_updated_at();

alter table public.atendimento_autorizados enable row level security;
alter table public.atendimento_fichas enable row level security;
alter table public.atendimento_acessos enable row level security;

-- A lista de autorizados é da direção da casa; quem já atende também a enxerga,
-- para saber com quem pode falar do caso.
drop policy if exists "atendimento_autorizados_leitura" on public.atendimento_autorizados;
create policy "atendimento_autorizados_leitura" on public.atendimento_autorizados
  for select to authenticated
  using (public.pode_administrar_pagina(sigla_casa) or public.pode_atendimento_fraterno(sigla_casa));

drop policy if exists "atendimento_autorizados_insere" on public.atendimento_autorizados;
create policy "atendimento_autorizados_insere" on public.atendimento_autorizados
  for insert to authenticated
  with check (public.pode_administrar_pagina(sigla_casa) and criado_por = auth.uid());

drop policy if exists "atendimento_autorizados_apaga" on public.atendimento_autorizados;
create policy "atendimento_autorizados_apaga" on public.atendimento_autorizados
  for delete to authenticated
  using (public.pode_administrar_pagina(sigla_casa));

drop policy if exists "atendimento_fichas_leitura" on public.atendimento_fichas;
create policy "atendimento_fichas_leitura" on public.atendimento_fichas
  for select to authenticated
  using (public.pode_atendimento_fraterno(sigla_casa));

drop policy if exists "atendimento_fichas_insere" on public.atendimento_fichas;
create policy "atendimento_fichas_insere" on public.atendimento_fichas
  for insert to authenticated
  with check (
    public.pode_atendimento_fraterno(sigla_casa)
    and sigla_casa = public.minha_sigla_casa()
  );

drop policy if exists "atendimento_fichas_edita" on public.atendimento_fichas;
create policy "atendimento_fichas_edita" on public.atendimento_fichas
  for update to authenticated
  using (public.pode_atendimento_fraterno(sigla_casa))
  with check (public.pode_atendimento_fraterno(sigla_casa));

-- Apagar é só de quem escreveu: histórico de atendimento não se limpa por
-- conveniência de terceiros.
drop policy if exists "atendimento_fichas_apaga" on public.atendimento_fichas;
create policy "atendimento_fichas_apaga" on public.atendimento_fichas
  for delete to authenticated
  using (criado_por = auth.uid() and public.pode_atendimento_fraterno(sigla_casa));

drop policy if exists "atendimento_acessos_leitura" on public.atendimento_acessos;
create policy "atendimento_acessos_leitura" on public.atendimento_acessos
  for select to authenticated
  using (public.pode_administrar_pagina(sigla_casa) or public.pode_atendimento_fraterno(sigla_casa));

drop policy if exists "atendimento_acessos_registra" on public.atendimento_acessos;
create policy "atendimento_acessos_registra" on public.atendimento_acessos
  for insert to authenticated
  with check (user_id = auth.uid() and public.pode_atendimento_fraterno(sigla_casa));

-- Registro de acesso não se apaga nem se corrige: um histórico que pode ser
-- reescrito não presta contas de nada. Sem política de UPDATE e de DELETE,
-- ninguém apaga — nem quem escreveu.

revoke all on public.atendimento_fichas from anon;
revoke all on public.atendimento_acessos from anon;
revoke all on public.atendimento_autorizados from anon;
