create table if not exists public.casas_espirita (
  id                      uuid primary key default gen_random_uuid(),
  nome                    text not null check (char_length(nome) between 2 and 200),
  endereco                text not null,
  cep                     text not null,
  cidade                  text not null,
  estado                  text not null check (char_length(estado) = 2),
  latitude                double precision not null,
  longitude               double precision not null,
  telefone                text,
  aceita_doacao_alimentos boolean not null default false,
  ativa                   boolean not null default true,
  created_at              timestamptz not null default now()
);

alter table public.casas_espirita enable row level security;

-- Leitura pública (para a busca de casas que aceitam doações)
create policy "leitura_publica"
  on public.casas_espirita for select
  using (ativa = true);

-- Inserção apenas via service role (cadastro feito pelo admin)
create policy "insercao_service_role"
  on public.casas_espirita for insert
  with check (false);
