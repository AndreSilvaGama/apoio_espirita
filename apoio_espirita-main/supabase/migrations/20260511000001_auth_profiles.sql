-- Siglas das casas espíritas (lista global compartilhada)
create table if not exists public.siglas_casas (
  sigla      text primary key check (sigla ~ '^[A-Z]{5}$'),
  created_at timestamptz not null default now()
);

alter table public.siglas_casas enable row level security;

create policy "siglas_leitura_publica"
  on public.siglas_casas for select using (true);

create policy "siglas_insercao_autenticado"
  on public.siglas_casas for insert
  to authenticated
  with check (sigla ~ '^[A-Z]{5}$');

-- Perfis de usuário
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  sigla_casa  text references public.siglas_casas(sigla),
  nome        text,
  role        text not null default 'membro'
                check (role in ('membro', 'coordenador', 'presidente', 'admin')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_leitura_propria"
  on public.profiles for select using (auth.uid() = id);

create policy "profiles_insercao_propria"
  on public.profiles for insert with check (auth.uid() = id);

create policy "profiles_atualizacao_propria"
  on public.profiles for update using (auth.uid() = id);

-- Cria perfil automaticamente ao cadastrar novo usuário
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
