-- Carona Solidária.
--
-- Quem tem carro publica a viagem; quem precisa pede lugar; o motorista aceita.
-- O telefone do motorista fica em tabela irmã e só é liberado a quem teve o
-- pedido aceito — antes disso, a conversa acontece dentro da plataforma.
--
-- O limite de vagas é conferido no banco, no momento do aceite. Conferir apenas
-- na tela deixaria o motorista aceitar cinco pessoas para quatro lugares se as
-- respostas saíssem quase ao mesmo tempo.

create table if not exists public.caronas (
  id uuid primary key default gen_random_uuid(),
  sigla_casa text not null,
  origem text not null check (char_length(btrim(origem)) between 3 and 160),
  destino text not null check (char_length(btrim(destino)) between 3 and 160),
  data date not null,
  hora time not null,
  vagas smallint not null default 1 check (vagas between 1 and 8),
  volta boolean not null default false,
  veiculo text check (veiculo is null or char_length(btrim(veiculo)) <= 80),
  observacao text check (observacao is null or char_length(btrim(observacao)) <= 600),
  ativa boolean not null default true,
  aberto boolean not null default false,
  criado_por uuid not null,
  autor_nome text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.caronas.volta is 'O motorista também traz de volta depois da reunião.';

create index if not exists caronas_casa_idx on public.caronas (sigla_casa, data, hora);

create table if not exists public.carona_contatos (
  carona_id uuid primary key references public.caronas(id) on delete cascade,
  contato text not null check (char_length(btrim(contato)) between 5 and 120)
);

create table if not exists public.carona_pedidos (
  id uuid primary key default gen_random_uuid(),
  carona_id uuid not null references public.caronas(id) on delete cascade,
  sigla_casa text not null,
  ponto_encontro text check (ponto_encontro is null or char_length(btrim(ponto_encontro)) <= 200),
  mensagem text check (mensagem is null or char_length(btrim(mensagem)) <= 600),
  contato text not null check (char_length(btrim(contato)) between 5 and 120),
  status text not null default 'pendente' check (status in ('pendente', 'aceito', 'recusado')),
  criado_por uuid not null,
  autor_nome text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (carona_id, criado_por)
);

create index if not exists carona_pedidos_carona_idx on public.carona_pedidos (carona_id);

create or replace function public.carona_conferir_vagas()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_vagas smallint;
  v_aceitos int;
begin
  if new.status <> 'aceito' or (tg_op = 'UPDATE' and old.status = 'aceito') then
    return new;
  end if;

  select vagas into v_vagas from public.caronas where id = new.carona_id;
  select count(*) into v_aceitos
  from public.carona_pedidos
  where carona_id = new.carona_id and status = 'aceito' and id <> new.id;

  if v_aceitos >= coalesce(v_vagas, 0) then
    raise exception 'Todas as vagas desta carona já foram preenchidas.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$fn$;

drop trigger if exists carona_pedidos_vagas on public.carona_pedidos;
create trigger carona_pedidos_vagas
  before insert or update on public.carona_pedidos
  for each row execute function public.carona_conferir_vagas();

drop trigger if exists caronas_autor on public.caronas;
create trigger caronas_autor before insert on public.caronas
  for each row execute function public.carimbar_autor();

drop trigger if exists caronas_updated on public.caronas;
create trigger caronas_updated before update on public.caronas
  for each row execute function public.set_updated_at();

drop trigger if exists carona_pedidos_autor on public.carona_pedidos;
create trigger carona_pedidos_autor before insert on public.carona_pedidos
  for each row execute function public.carimbar_autor();

drop trigger if exists carona_pedidos_updated on public.carona_pedidos;
create trigger carona_pedidos_updated before update on public.carona_pedidos
  for each row execute function public.set_updated_at();

alter table public.caronas enable row level security;
alter table public.carona_contatos enable row level security;
alter table public.carona_pedidos enable row level security;

drop policy if exists "caronas_leitura" on public.caronas;
create policy "caronas_leitura" on public.caronas
  for select to authenticated
  using (public.pode_ver_da_casa(sigla_casa, aberto));

drop policy if exists "caronas_insere" on public.caronas;
create policy "caronas_insere" on public.caronas
  for insert to authenticated
  with check (public.pode_publicar_na_casa(sigla_casa));

drop policy if exists "caronas_edita" on public.caronas;
create policy "caronas_edita" on public.caronas
  for update to authenticated
  using (criado_por = auth.uid() or public.pode_administrar_pagina(sigla_casa))
  with check (criado_por = auth.uid() or public.pode_administrar_pagina(sigla_casa));

drop policy if exists "caronas_apaga" on public.caronas;
create policy "caronas_apaga" on public.caronas
  for delete to authenticated
  using (criado_por = auth.uid() or public.pode_administrar_pagina(sigla_casa));

drop policy if exists "carona_contatos_leitura" on public.carona_contatos;
create policy "carona_contatos_leitura" on public.carona_contatos
  for select to authenticated
  using (
    exists (select 1 from public.caronas c where c.id = carona_id and c.criado_por = auth.uid())
    or exists (
      select 1 from public.carona_pedidos p
      where p.carona_id = carona_contatos.carona_id
        and p.criado_por = auth.uid()
        and p.status = 'aceito'
    )
  );

drop policy if exists "carona_contatos_escreve" on public.carona_contatos;
create policy "carona_contatos_escreve" on public.carona_contatos
  for insert to authenticated
  with check (exists (
    select 1 from public.caronas c where c.id = carona_id and c.criado_por = auth.uid()
  ));

drop policy if exists "carona_contatos_edita" on public.carona_contatos;
create policy "carona_contatos_edita" on public.carona_contatos
  for update to authenticated
  using (exists (select 1 from public.caronas c where c.id = carona_id and c.criado_por = auth.uid()))
  with check (exists (select 1 from public.caronas c where c.id = carona_id and c.criado_por = auth.uid()));

drop policy if exists "carona_contatos_apaga" on public.carona_contatos;
create policy "carona_contatos_apaga" on public.carona_contatos
  for delete to authenticated
  using (exists (select 1 from public.caronas c where c.id = carona_id and c.criado_por = auth.uid()));

drop policy if exists "carona_pedidos_leitura" on public.carona_pedidos;
create policy "carona_pedidos_leitura" on public.carona_pedidos
  for select to authenticated
  using (
    criado_por = auth.uid()
    or exists (select 1 from public.caronas c where c.id = carona_id and c.criado_por = auth.uid())
  );

drop policy if exists "carona_pedidos_insere" on public.carona_pedidos;
create policy "carona_pedidos_insere" on public.carona_pedidos
  for insert to authenticated
  with check (
    criado_por = auth.uid()
    and public.email_verificado()
    and not public.usuario_sancionado(auth.uid())
    and exists (
      select 1 from public.caronas c
      where c.id = carona_id and c.ativa and public.pode_ver_da_casa(c.sigla_casa, c.aberto)
    )
  );

drop policy if exists "carona_pedidos_responde" on public.carona_pedidos;
create policy "carona_pedidos_responde" on public.carona_pedidos
  for update to authenticated
  using (exists (select 1 from public.caronas c where c.id = carona_id and c.criado_por = auth.uid()))
  with check (exists (select 1 from public.caronas c where c.id = carona_id and c.criado_por = auth.uid()));

drop policy if exists "carona_pedidos_desiste" on public.carona_pedidos;
create policy "carona_pedidos_desiste" on public.carona_pedidos
  for delete to authenticated
  using (criado_por = auth.uid());
