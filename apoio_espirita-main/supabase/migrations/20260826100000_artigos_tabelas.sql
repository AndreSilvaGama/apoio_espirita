-- Artigos da comunidade.
-- Ver docs/superpowers/specs/2026-08-26-artigos-comunidade-design.md

create table if not exists public.artigos (
  id uuid primary key default gen_random_uuid(),
  autor_id uuid not null references auth.users(id) on delete cascade,
  -- Desnormalizados como em publicacoes_casa: a assinatura do artigo nao muda
  -- se o autor depois trocar de casa ou de nome.
  autor_nome text not null,
  autor_sigla_casa text,
  titulo text not null check (length(trim(titulo)) between 5 and 160),
  slug text not null unique,
  resumo text check (resumo is null or length(resumo) <= 400),
  conteudo text not null check (length(trim(conteudo)) >= 200),
  estado text not null default 'publicado'
    check (estado in ('publicado', 'retirado', 'em_correcao')),
  -- Contadores mantidos pelo gatilho. Desnormalizados para a lista publica
  -- ordenar por avaliacao sem varrer a tabela de votos.
  aval_otimo int not null default 0,
  aval_bom int not null default 0,
  aval_gostei int not null default 0,
  aval_nao_gostei int not null default 0,
  aval_erro int not null default 0,
  aval_erro_grave int not null default 0,
  retirado_em timestamptz,
  retirado_por text check (retirado_por is null or retirado_por in ('comunidade', 'humano')),
  retirado_por_user_id uuid references auth.users(id) on delete set null,
  retirado_motivo text,
  created_at timestamptz not null default now(),
  editado_em timestamptz,
  publicado_em timestamptz not null default now()
);

create index if not exists artigos_estado_publicado_em_idx
  on public.artigos (estado, publicado_em desc);
create index if not exists artigos_autor_idx on public.artigos (autor_id);
create index if not exists artigos_sigla_idx on public.artigos (autor_sigla_casa);

create table if not exists public.artigo_avaliacoes (
  id uuid primary key default gen_random_uuid(),
  artigo_id uuid not null references public.artigos(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null
    check (tipo in ('otimo', 'bom', 'gostei', 'nao_gostei', 'erro', 'erro_grave')),
  descricao_erro text,
  created_at timestamptz not null default now(),
  editado_em timestamptz,
  -- Um voto por pessoa por artigo, alteravel por UPDATE.
  unique (artigo_id, user_id),
  -- Marcar erro sem dizer qual e nao ajuda o autor a corrigir nem o revisor a
  -- julgar, e o pequeno esforco de escrever ja filtra a marcacao de impulso.
  constraint descricao_obrigatoria_no_erro check (
    case
      when tipo in ('erro', 'erro_grave')
        then descricao_erro is not null and length(trim(descricao_erro)) >= 10
      else descricao_erro is null
    end
  )
);

create index if not exists artigo_avaliacoes_artigo_idx
  on public.artigo_avaliacoes (artigo_id);

create table if not exists public.artigo_revisoes (
  id uuid primary key default gen_random_uuid(),
  artigo_id uuid not null references public.artigos(id) on delete cascade,
  aberta_em timestamptz not null default now(),
  origem text not null check (origem in ('comunidade', 'humano', 'reenvio')),
  estado text not null default 'aberta' check (estado in ('aberta', 'resolvida')),
  decisao text check (decisao is null or decisao in
    ('restaurar', 'manter_retirado', 'suspender_autor', 'banir_autor')),
  justificativa text,
  decidida_por uuid references auth.users(id) on delete set null,
  decidida_em timestamptz
);

create index if not exists artigo_revisoes_abertas_idx
  on public.artigo_revisoes (estado, aberta_em desc);

create table if not exists public.usuarios_sancoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null check (tipo in ('suspensao', 'banimento')),
  inicio timestamptz not null default now(),
  fim timestamptz,
  motivo text not null,
  aplicada_por uuid not null references auth.users(id) on delete restrict,
  revogada_em timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists usuarios_sancoes_vigentes_idx
  on public.usuarios_sancoes (user_id) where revogada_em is null;

alter table public.artigos enable row level security;
alter table public.artigo_avaliacoes enable row level security;
alter table public.artigo_revisoes enable row level security;
alter table public.usuarios_sancoes enable row level security;
