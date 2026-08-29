-- Apresentações ao vivo.
--
-- Uma casa envia o arquivo, projeta num aparelho qualquer e a plateia
-- acompanha pelo próprio celular, sem instalar nada e sem criar conta.
--
-- Duas decisões de arquitetura estão gravadas aqui:
--
-- 1. O arquivo é convertido em IMAGENS no navegador de quem envia, uma única
--    vez. A plateia nunca baixa o documento inteiro: cada celular carrega
--    apenas a figura do slide atual. Numa palestra de sessenta pessoas isso é
--    a diferença entre centenas de megabytes e alguns poucos na rede da casa,
--    que costuma ser fraca.
--
-- 2. A plateia entra ANÔNIMA, por código de seis letras ou QR na parede. Quem
--    chega visitando pela primeira vez não tem conta — e é justamente quem
--    mais precisa enxergar o slide. Daí o cuidado: o anônimo LÊ, nunca ESCREVE
--    o slide atual. Sem essa separação, qualquer pessoa na sala viraria o
--    slide do palestrante.

create table if not exists public.apresentacoes (
  id               uuid primary key default gen_random_uuid(),
  sigla_casa       text not null,
  titulo           text not null check (length(btrim(titulo)) between 3 and 160),
  descricao        text check (length(descricao) <= 600),
  criado_por       uuid not null references auth.users(id) on delete cascade,
  autor_nome       text,
  total_slides     int  not null check (total_slides between 1 and 150),
  permite_download boolean not null default false,
  created_at       timestamptz not null default now()
);

create index if not exists apresentacoes_da_casa
  on public.apresentacoes (sigla_casa, created_at desc);

create table if not exists public.apresentacao_sessoes (
  id               uuid primary key default gen_random_uuid(),
  apresentacao_id  uuid not null references public.apresentacoes(id) on delete cascade,
  codigo           text not null unique,
  slide_atual      int  not null default 1 check (slide_atual >= 1),
  ativa            boolean not null default true,
  aceita_perguntas boolean not null default true,
  iniciada_por     uuid not null references auth.users(id) on delete cascade,
  created_at       timestamptz not null default now(),
  encerrada_em     timestamptz
);

create index if not exists sessoes_ativas
  on public.apresentacao_sessoes (codigo) where ativa;

create table if not exists public.apresentacao_perguntas (
  id          uuid primary key default gen_random_uuid(),
  sessao_id   uuid not null references public.apresentacao_sessoes(id) on delete cascade,
  texto       text not null check (length(btrim(texto)) between 3 and 400),
  autor_nome  text check (length(autor_nome) <= 60),
  respondida  boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists perguntas_da_sessao
  on public.apresentacao_perguntas (sessao_id, created_at);

alter table public.apresentacoes          enable row level security;
alter table public.apresentacao_sessoes   enable row level security;
alter table public.apresentacao_perguntas enable row level security;

/* ── Quem enxerga o quê ────────────────────────────────────────────────── */

-- Membro da casa vê o acervo da própria casa.
create policy "apresentacoes_leitura_da_casa" on public.apresentacoes
  for select to authenticated
  using (sigla_casa = (select p.sigla_casa from public.profiles p where p.id = auth.uid()));

-- Visitante anônimo enxerga a apresentação SOMENTE enquanto existir uma sessão
-- ativa dela. Encerrada a palestra, o acervo da casa volta a ser interno.
create policy "apresentacoes_leitura_em_sessao" on public.apresentacoes
  for select to anon, authenticated
  using (exists (
    select 1 from public.apresentacao_sessoes s
    where s.apresentacao_id = apresentacoes.id and s.ativa
  ));

create policy "apresentacoes_envio" on public.apresentacoes
  for insert to authenticated
  with check (
    criado_por = auth.uid()
    and sigla_casa = (select p.sigla_casa from public.profiles p where p.id = auth.uid())
  );

create policy "apresentacoes_edita_a_propria" on public.apresentacoes
  for update to authenticated using (criado_por = auth.uid());

create policy "apresentacoes_apaga_a_propria" on public.apresentacoes
  for delete to authenticated using (criado_por = auth.uid());

-- A sessão ativa é pública: é ela que o código de seis letras abre.
create policy "sessoes_leitura_publica" on public.apresentacao_sessoes
  for select to anon, authenticated using (ativa);

create policy "sessoes_leitura_do_dono" on public.apresentacao_sessoes
  for select to authenticated using (iniciada_por = auth.uid());

-- ESCREVER o slide atual é só de quem apresenta. Esta é a trava que impede a
-- plateia de virar o slide do palestrante.
create policy "sessoes_comanda_quem_apresenta" on public.apresentacao_sessoes
  for update to authenticated using (iniciada_por = auth.uid());

create policy "sessoes_cria" on public.apresentacao_sessoes
  for insert to authenticated
  with check (
    iniciada_por = auth.uid()
    and exists (
      select 1 from public.apresentacoes a
      join public.profiles p on p.id = auth.uid()
      where a.id = apresentacao_id and a.sigla_casa = p.sigla_casa
    )
  );

-- Perguntas: qualquer pessoa da plateia envia, só quem apresenta lê.
create policy "perguntas_envia" on public.apresentacao_perguntas
  for insert to anon, authenticated
  with check (exists (
    select 1 from public.apresentacao_sessoes s
    where s.id = sessao_id and s.ativa and s.aceita_perguntas
  ));

create policy "perguntas_le_quem_apresenta" on public.apresentacao_perguntas
  for select to authenticated
  using (exists (
    select 1 from public.apresentacao_sessoes s
    where s.id = sessao_id and s.iniciada_por = auth.uid()
  ));

create policy "perguntas_marca_quem_apresenta" on public.apresentacao_perguntas
  for update to authenticated
  using (exists (
    select 1 from public.apresentacao_sessoes s
    where s.id = sessao_id and s.iniciada_por = auth.uid()
  ));

/* ── Realtime ──────────────────────────────────────────────────────────── */
-- Sem isto, o slide só mudaria no celular da plateia quando a pessoa
-- recarregasse a página.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public'
        and tablename = 'apresentacao_sessoes'
    ) then
      alter publication supabase_realtime add table public.apresentacao_sessoes;
    end if;
  end if;
end $$;
