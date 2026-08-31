-- Cadastro da Evangelização Infantil.
--
-- Guarda a ficha de cada criança da evangelização: quem chamar numa
-- emergência, do que ela tem alergia, o que o evangelizador precisa saber — e
-- o acompanhamento dela ao longo do ano (presença nos encontros e avaliação
-- do desenvolvimento).
--
-- É dado de criança, e boa parte dele é dado de saúde. O desenho segue a
-- postura já adotada na ficha de atendimento fraterno, e não a da comunidade:
--
--   * NÃO EXISTE "abrir para outras casas". A coluna não foi criada. O que a
--     mãe escreveu na ficha é da casa onde ela matriculou o filho.
--   * O DEV NÃO LÊ ficha. Em quase toda tabela `sou_dev()` abre a porta para
--     dar suporte; aqui não abre. O preço é honesto: um defeito no cadastro
--     terá de ser investigado sem olhar o conteúdo das fichas.
--   * Quem lê é quem evangeliza: o cargo de Evangelizador ou de Coordenador
--     da casa, mais quem a direção autorizar nominalmente. A presidência não
--     lê pelo cargo — se precisar, autoriza-se, e o ato fica registrado em
--     `evangelizacao_autorizados`.
--   * A casa é carimbada pelo banco (gatilho `carimbar_autor`), nunca enviada
--     pelo navegador: sem isso um cliente modificado gravaria a ficha de uma
--     criança dentro de outra casa.

-- ── Quem pode ─────────────────────────────────────────────────────────────
create table if not exists public.evangelizacao_autorizados (
  id uuid primary key default gen_random_uuid(),
  sigla_casa text not null,
  user_id uuid not null,
  nome text,
  criado_por uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  unique (sigla_casa, user_id)
);

create or replace function public.pode_evangelizacao(p_sigla text)
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
        and cargo_principal in ('Evangelizador', 'Coordenador')
    )
    or exists (
      select 1 from public.evangelizacao_autorizados
      where sigla_casa = p_sigla and user_id = auth.uid()
    )
  )
$fn$;

comment on function public.pode_evangelizacao(text) is
  'Acesso às fichas da evangelização. De propósito não inclui sou_dev(): ninguém lê a ficha de uma criança a título de suporte técnico.';

revoke execute on function public.pode_evangelizacao(text) from anon, public;
grant execute on function public.pode_evangelizacao(text) to authenticated;

-- ── Turmas ────────────────────────────────────────────────────────────────
create table if not exists public.evangelizacao_turmas (
  id uuid primary key default gen_random_uuid(),
  sigla_casa text not null,
  nome text not null check (char_length(btrim(nome)) between 2 and 80),
  faixa_etaria text not null default 'mista'
    check (faixa_etaria in ('0-2', '3-5', '6-8', '9-11', '12-14', '15-17', 'mista')),
  dia_semana smallint check (dia_semana between 0 and 6),
  horario text check (horario is null or char_length(btrim(horario)) <= 40),
  sala text check (sala is null or char_length(btrim(sala)) <= 60),
  evangelizadores text check (evangelizadores is null or char_length(btrim(evangelizadores)) <= 200),
  ativa boolean not null default true,
  criado_por uuid not null,
  autor_nome text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists evangelizacao_turmas_casa_idx
  on public.evangelizacao_turmas (sigla_casa, ativa, nome);

-- ── Ficha da criança ──────────────────────────────────────────────────────
create table if not exists public.evangelizacao_criancas (
  id uuid primary key default gen_random_uuid(),
  sigla_casa text not null,
  turma_id uuid references public.evangelizacao_turmas(id) on delete set null,
  nome text not null check (char_length(btrim(nome)) between 2 and 160),
  data_nascimento date not null check (data_nascimento > date '1950-01-01'),
  -- Saúde em campos próprios, de propósito. Num "observações" único, a
  -- alergia que importa numa emergência ficaria perdida no meio do texto.
  alergias text check (alergias is null or char_length(btrim(alergias)) <= 1000),
  medicamentos text check (medicamentos is null or char_length(btrim(medicamentos)) <= 1000),
  condicoes_saude text check (condicoes_saude is null or char_length(btrim(condicoes_saude)) <= 1000),
  observacoes text check (observacoes is null or char_length(btrim(observacoes)) <= 2000),
  -- Autorizações que a casa precisa ter por escrito antes de agir.
  autoriza_imagem boolean not null default false,
  autoriza_passeio boolean not null default false,
  pode_sair_sozinha boolean not null default false,
  matriculada_em date not null default current_date,
  ativa boolean not null default true,
  criado_por uuid not null,
  autor_nome text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists evangelizacao_criancas_casa_idx
  on public.evangelizacao_criancas (sigla_casa, ativa, nome);
create index if not exists evangelizacao_criancas_turma_idx
  on public.evangelizacao_criancas (turma_id);

-- ── Responsáveis e telefones de emergência ────────────────────────────────
-- Tabela própria porque uma criança tem mais de um responsável, e numa
-- emergência liga-se para o segundo quando o primeiro não atende.
create table if not exists public.evangelizacao_responsaveis (
  id uuid primary key default gen_random_uuid(),
  sigla_casa text not null,
  crianca_id uuid not null references public.evangelizacao_criancas(id) on delete cascade,
  nome text not null check (char_length(btrim(nome)) between 2 and 160),
  parentesco text check (parentesco is null or char_length(btrim(parentesco)) <= 40),
  telefone text not null check (char_length(btrim(telefone)) between 8 and 40),
  telefone_alternativo text check (telefone_alternativo is null or char_length(btrim(telefone_alternativo)) <= 40),
  email text check (email is null or char_length(btrim(email)) <= 160),
  principal boolean not null default false,
  pode_retirar boolean not null default true,
  observacao text check (observacao is null or char_length(btrim(observacao)) <= 500),
  criado_por uuid not null,
  autor_nome text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists evangelizacao_responsaveis_crianca_idx
  on public.evangelizacao_responsaveis (crianca_id, principal desc);

-- ── Presença nos encontros ────────────────────────────────────────────────
-- Uma linha por criança por data. Sem tabela de "encontro": a chamada é feita
-- escolhendo turma e dia, e uma tabela a mais só acrescentaria um passo antes
-- de marcar o primeiro presente.
create table if not exists public.evangelizacao_presencas (
  id uuid primary key default gen_random_uuid(),
  sigla_casa text not null,
  crianca_id uuid not null references public.evangelizacao_criancas(id) on delete cascade,
  turma_id uuid references public.evangelizacao_turmas(id) on delete set null,
  data_encontro date not null default current_date,
  presente boolean not null default true,
  observacao text check (observacao is null or char_length(btrim(observacao)) <= 500),
  criado_por uuid not null,
  autor_nome text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (crianca_id, data_encontro)
);

create index if not exists evangelizacao_presencas_casa_idx
  on public.evangelizacao_presencas (sigla_casa, data_encontro desc);

-- ── Acompanhamento do desenvolvimento ─────────────────────────────────────
-- Três eixos de 1 a 5 e o comentário do evangelizador. A nota sozinha não diz
-- nada sobre uma criança; o comentário é o que a próxima pessoa que assumir a
-- turma vai ler.
create table if not exists public.evangelizacao_avaliacoes (
  id uuid primary key default gen_random_uuid(),
  sigla_casa text not null,
  crianca_id uuid not null references public.evangelizacao_criancas(id) on delete cascade,
  data_avaliacao date not null default current_date,
  participacao smallint check (participacao between 1 and 5),
  convivencia smallint check (convivencia between 1 and 5),
  assimilacao smallint check (assimilacao between 1 and 5),
  comentario text check (comentario is null or char_length(btrim(comentario)) <= 2000),
  criado_por uuid not null,
  autor_nome text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists evangelizacao_avaliacoes_crianca_idx
  on public.evangelizacao_avaliacoes (crianca_id, data_avaliacao desc);

-- ── Carimbo de autoria e data ─────────────────────────────────────────────
do $trg$
declare t text;
begin
  foreach t in array array[
    'evangelizacao_turmas', 'evangelizacao_criancas', 'evangelizacao_responsaveis',
    'evangelizacao_presencas', 'evangelizacao_avaliacoes'
  ] loop
    execute format('drop trigger if exists %I on public.%I', t || '_autor', t);
    execute format(
      'create trigger %I before insert on public.%I for each row execute function public.carimbar_autor()',
      t || '_autor', t);
    execute format('drop trigger if exists %I on public.%I', t || '_updated', t);
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      t || '_updated', t);
  end loop;
end $trg$;

-- ── Row Level Security ────────────────────────────────────────────────────
alter table public.evangelizacao_autorizados enable row level security;
alter table public.evangelizacao_turmas enable row level security;
alter table public.evangelizacao_criancas enable row level security;
alter table public.evangelizacao_responsaveis enable row level security;
alter table public.evangelizacao_presencas enable row level security;
alter table public.evangelizacao_avaliacoes enable row level security;

-- A lista de autorizados é da direção; quem já evangeliza também a enxerga,
-- para saber com quem pode tratar do caso de uma criança.
drop policy if exists "evangelizacao_autorizados_leitura" on public.evangelizacao_autorizados;
create policy "evangelizacao_autorizados_leitura" on public.evangelizacao_autorizados
  for select to authenticated
  using (public.pode_administrar_pagina(sigla_casa) or public.pode_evangelizacao(sigla_casa));

drop policy if exists "evangelizacao_autorizados_insere" on public.evangelizacao_autorizados;
create policy "evangelizacao_autorizados_insere" on public.evangelizacao_autorizados
  for insert to authenticated
  with check (public.pode_administrar_pagina(sigla_casa) and criado_por = auth.uid());

drop policy if exists "evangelizacao_autorizados_apaga" on public.evangelizacao_autorizados;
create policy "evangelizacao_autorizados_apaga" on public.evangelizacao_autorizados
  for delete to authenticated
  using (public.pode_administrar_pagina(sigla_casa));

-- As cinco tabelas do cadastro seguem a mesma regra: quem evangeliza na casa
-- lê e escreve; ninguém mais entra. Escrever exige ainda que a casa da linha
-- seja a casa de quem escreve — a mesma que o gatilho carimba.
do $pol$
declare t text;
begin
  foreach t in array array[
    'evangelizacao_turmas', 'evangelizacao_criancas', 'evangelizacao_responsaveis',
    'evangelizacao_presencas', 'evangelizacao_avaliacoes'
  ] loop
    execute format('drop policy if exists %I on public.%I', t || '_leitura', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using (public.pode_evangelizacao(sigla_casa))',
      t || '_leitura', t);

    execute format('drop policy if exists %I on public.%I', t || '_insere', t);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (public.pode_evangelizacao(sigla_casa) and sigla_casa = public.minha_sigla_casa())',
      t || '_insere', t);

    execute format('drop policy if exists %I on public.%I', t || '_edita', t);
    execute format(
      'create policy %I on public.%I for update to authenticated using (public.pode_evangelizacao(sigla_casa)) with check (public.pode_evangelizacao(sigla_casa))',
      t || '_edita', t);

    execute format('drop policy if exists %I on public.%I', t || '_apaga', t);
    execute format(
      'create policy %I on public.%I for delete to authenticated using (public.pode_evangelizacao(sigla_casa))',
      t || '_apaga', t);
  end loop;
end $pol$;

revoke all on public.evangelizacao_autorizados from anon;
revoke all on public.evangelizacao_turmas from anon;
revoke all on public.evangelizacao_criancas from anon;
revoke all on public.evangelizacao_responsaveis from anon;
revoke all on public.evangelizacao_presencas from anon;
revoke all on public.evangelizacao_avaliacoes from anon;
