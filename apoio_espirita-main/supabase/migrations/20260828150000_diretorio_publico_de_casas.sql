-- Diretorio publico de casas espiritas, por estado e cidade.
--
-- As 714 casas cadastradas nunca aparecem para quem procura "centro espirita
-- perto de mim": o site pede aos buscadores que nao visitem /casa/ e o mapa do
-- site nao lista nenhuma delas. Estas funcoes alimentam as paginas publicas
-- /casas, /casas/UF e /casas/UF/cidade.
--
-- Toda casa listada pode sair a pedido da direcao, na hora e sem justificar:
-- `visivel_diretorio` desliga a casa do diretorio sem apaga-la do cadastro.

alter table public.casas_espirita
  add column if not exists visivel_diretorio boolean not null default true;

-- Slug de cidade: "São Gonçalo" -> "sao-goncalo". Mesma normalizacao da busca.
create or replace function public.diretorio_slug(texto text)
returns text
language sql
immutable
set search_path to 'public'
as $$
  select trim(both '-' from regexp_replace(public.sem_acento(texto), '[^a-z0-9]+', '-', 'g'))
$$;

-- Estados com casas no diretorio.
create or replace function public.diretorio_estados()
returns table(estado text, casas bigint, cidades bigint)
language sql
stable
security definer
set search_path to 'public'
as $$
  select c.estado, count(*), count(distinct c.cidade)
  from public.casas_espirita c
  where c.ativa
    and c.visivel_diretorio
    and c.estado is not null
    and c.cidade is not null
  group by c.estado
  order by c.estado
$$;

-- Cidades de um estado, ja com o slug que vira endereco da pagina.
create or replace function public.diretorio_cidades(p_uf text)
returns table(cidade text, slug text, casas bigint)
language sql
stable
security definer
set search_path to 'public'
as $$
  select c.cidade, public.diretorio_slug(c.cidade), count(*)
  from public.casas_espirita c
  where c.ativa
    and c.visivel_diretorio
    and c.cidade is not null
    and upper(c.estado) = upper(p_uf)
  group by c.cidade
  order by c.cidade
$$;

-- Casas de uma cidade. `tem_pagina` diz se a casa ja publicou pagina propria —
-- e o que separa quem so esta listado de quem pode ser aberto.
create or replace function public.diretorio_casas(p_uf text, p_cidade_slug text)
returns table(
  id uuid,
  nome text,
  sigla text,
  endereco text,
  cep text,
  cidade text,
  estado text,
  telefone text,
  tem_pagina boolean
)
language sql
stable
security definer
set search_path to 'public'
as $$
  select
    c.id,
    c.nome,
    c.sigla,
    c.endereco,
    c.cep,
    c.cidade,
    c.estado,
    c.telefone,
    exists (
      select 1 from public.paginas_casas p
      where p.sigla_casa = c.sigla and p.publicada
    )
  from public.casas_espirita c
  where c.ativa
    and c.visivel_diretorio
    and upper(c.estado) = upper(p_uf)
    and public.diretorio_slug(c.cidade) = lower(p_cidade_slug)
  order by c.nome
$$;

-- Pedidos de remocao. Guardados para que uma retirada por engano ou por
-- vandalismo possa ser desfeita — a casa sai na hora, mas nao some do registro.
create table if not exists public.casas_pedidos_remocao (
  id uuid primary key default gen_random_uuid(),
  casa_id uuid not null references public.casas_espirita(id) on delete cascade,
  casa_nome text not null,
  nome_solicitante text not null,
  contato text not null,
  restaurada_em timestamptz,
  created_at timestamptz not null default now()
);

alter table public.casas_pedidos_remocao enable row level security;

drop policy if exists "dev ve pedidos de remocao" on public.casas_pedidos_remocao;
create policy "dev ve pedidos de remocao"
  on public.casas_pedidos_remocao for select to authenticated
  using (public.sou_dev());

-- Retira a casa do diretorio imediatamente. Nao pede motivo — so quem esta
-- pedindo, para que a retirada possa ser conferida e desfeita se preciso.
create or replace function public.remover_casa_do_diretorio(
  p_casa uuid,
  p_nome text,
  p_contato text
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_nome_casa text;
begin
  if coalesce(btrim(p_nome), '') = '' or coalesce(btrim(p_contato), '') = '' then
    raise exception 'Informe o seu nome e um contato para que possamos confirmar a retirada.';
  end if;

  select c.nome into v_nome_casa from public.casas_espirita c where c.id = p_casa;
  if v_nome_casa is null then
    raise exception 'Casa não encontrada.';
  end if;

  insert into public.casas_pedidos_remocao (casa_id, casa_nome, nome_solicitante, contato)
  values (p_casa, v_nome_casa, btrim(p_nome), btrim(p_contato));

  update public.casas_espirita set visivel_diretorio = false where id = p_casa;
end
$$;

-- Desfaz uma retirada. Só o desenvolvedor, a partir do /admin.
create or replace function public.restaurar_casa_no_diretorio(p_pedido uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_casa uuid;
begin
  if not public.sou_dev() then
    raise exception 'Apenas o desenvolvedor pode restaurar uma casa no diretório.';
  end if;

  select casa_id into v_casa from public.casas_pedidos_remocao where id = p_pedido;
  if v_casa is null then
    raise exception 'Pedido não encontrado.';
  end if;

  update public.casas_espirita set visivel_diretorio = true where id = v_casa;
  update public.casas_pedidos_remocao set restaurada_em = now() where id = p_pedido;
end
$$;

revoke execute on function public.diretorio_slug(text) from public;
revoke execute on function public.diretorio_estados() from public;
revoke execute on function public.diretorio_cidades(text) from public;
revoke execute on function public.diretorio_casas(text, text) from public;
revoke execute on function public.remover_casa_do_diretorio(uuid, text, text) from public;
revoke execute on function public.restaurar_casa_no_diretorio(uuid) from public;

grant execute on function public.diretorio_estados() to anon, authenticated;
grant execute on function public.diretorio_cidades(text) to anon, authenticated;
grant execute on function public.diretorio_casas(text, text) to anon, authenticated;
grant execute on function public.remover_casa_do_diretorio(uuid, text, text) to anon, authenticated;
grant execute on function public.restaurar_casa_no_diretorio(uuid) to authenticated;
