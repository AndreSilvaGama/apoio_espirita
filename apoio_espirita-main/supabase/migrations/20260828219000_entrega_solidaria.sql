-- Entrega Solidária.
--
-- Um pedido de entrega nasce de uma reserva aceita no bazar (ou avulso, para
-- levar qualquer coisa a quem não pode buscar). Um voluntário assume, marca o
-- dia e confirma a entrega.
--
-- Quem pode fazer o quê não cabe só nas políticas de linha: aqui o mesmo UPDATE
-- é legítimo ou não conforme a TRANSIÇÃO. Assumir uma entrega aberta é ato de
-- qualquer voluntário; confirmar a entrega é do voluntário que assumiu ou de
-- quem pediu; mudar a descrição é só de quem pediu. Por isso a política deixa
-- passar quem enxerga o pedido e um gatilho confere a transição — é o mesmo
-- desenho já usado nos artigos (`artigo_transicao_valida`).

create table if not exists public.entregas (
  id uuid primary key default gen_random_uuid(),
  sigla_casa text not null,
  item_id uuid references public.bazar_itens(id) on delete set null,
  reserva_id uuid references public.bazar_reservas(id) on delete set null,
  descricao text not null check (char_length(btrim(descricao)) between 5 and 600),
  bairro text check (bairro is null or char_length(btrim(bairro)) <= 120),
  referencia text check (referencia is null or char_length(btrim(referencia)) <= 300),
  status text not null default 'aberta'
    check (status in ('aberta', 'assumida', 'entregue', 'cancelada')),
  voluntario uuid,
  voluntario_nome text,
  agendada_para timestamptz,
  aberto boolean not null default false,
  criado_por uuid not null,
  autor_nome text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.entregas.referencia is
  'Ponto de referência do endereço. O endereço completo é combinado entre as duas pessoas pelo contato liberado, nunca publicado na lista.';

create index if not exists entregas_casa_idx on public.entregas (sigla_casa, status, created_at desc);

create table if not exists public.entrega_contatos (
  entrega_id uuid primary key references public.entregas(id) on delete cascade,
  contato_pedinte text not null check (char_length(btrim(contato_pedinte)) between 5 and 120),
  contato_voluntario text check (contato_voluntario is null or char_length(btrim(contato_voluntario)) between 5 and 120)
);

create or replace function public.entrega_transicao_valida()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_dono boolean := old.criado_por = auth.uid() or public.pode_administrar_pagina(old.sigla_casa);
  v_voluntario boolean := old.voluntario is not null and old.voluntario = auth.uid();
  v_nome text;
begin
  -- Quem pediu (ou quem administra a casa) mexe em tudo.
  if v_dono then
    return new;
  end if;

  -- Assumir: só sai de "aberta", e o voluntário é sempre quem está pedindo —
  -- o navegador não escolhe em nome de quem a entrega é assumida.
  if old.status = 'aberta' and new.status = 'assumida' then
    select coalesce(nullif(btrim(nome), ''), 'Membro') into v_nome
    from public.profiles where id = auth.uid();
    new.voluntario := auth.uid();
    new.voluntario_nome := coalesce(v_nome, 'Membro');
    new.descricao := old.descricao;
    new.criado_por := old.criado_por;
    new.autor_nome := old.autor_nome;
    new.sigla_casa := old.sigla_casa;
    return new;
  end if;

  -- O voluntário que assumiu marca o dia, confirma a entrega ou devolve o
  -- pedido à fila se não puder mais.
  if v_voluntario then
    if new.status in ('assumida', 'entregue') then
      new.voluntario := old.voluntario;
      new.voluntario_nome := old.voluntario_nome;
      new.descricao := old.descricao;
      new.criado_por := old.criado_por;
      new.autor_nome := old.autor_nome;
      new.sigla_casa := old.sigla_casa;
      return new;
    end if;
    if new.status = 'aberta' then
      new.voluntario := null;
      new.voluntario_nome := null;
      new.agendada_para := null;
      new.descricao := old.descricao;
      new.criado_por := old.criado_por;
      new.autor_nome := old.autor_nome;
      new.sigla_casa := old.sigla_casa;
      return new;
    end if;
  end if;

  raise exception 'Esta mudança na entrega não é permitida para você.'
    using errcode = 'insufficient_privilege';
end;
$fn$;

drop trigger if exists entregas_transicao on public.entregas;
create trigger entregas_transicao before update on public.entregas
  for each row execute function public.entrega_transicao_valida();

drop trigger if exists entregas_autor on public.entregas;
create trigger entregas_autor before insert on public.entregas
  for each row execute function public.carimbar_autor();

drop trigger if exists entregas_updated on public.entregas;
create trigger entregas_updated before update on public.entregas
  for each row execute function public.set_updated_at();

alter table public.entregas enable row level security;
alter table public.entrega_contatos enable row level security;

drop policy if exists "entregas_leitura" on public.entregas;
create policy "entregas_leitura" on public.entregas
  for select to authenticated
  using (public.pode_ver_da_casa(sigla_casa, aberto));

drop policy if exists "entregas_insere" on public.entregas;
create policy "entregas_insere" on public.entregas
  for insert to authenticated
  with check (public.pode_publicar_na_casa(sigla_casa));

-- Deixa passar quem enxerga; o gatilho acima decide se a transição vale.
drop policy if exists "entregas_atualiza" on public.entregas;
create policy "entregas_atualiza" on public.entregas
  for update to authenticated
  using (public.pode_ver_da_casa(sigla_casa, aberto))
  with check (public.pode_ver_da_casa(sigla_casa, aberto));

drop policy if exists "entregas_apaga" on public.entregas;
create policy "entregas_apaga" on public.entregas
  for delete to authenticated
  using (criado_por = auth.uid() or public.pode_administrar_pagina(sigla_casa));

-- Os dois contatos aparecem um para o outro depois que a entrega é assumida.
drop policy if exists "entrega_contatos_leitura" on public.entrega_contatos;
create policy "entrega_contatos_leitura" on public.entrega_contatos
  for select to authenticated
  using (exists (
    select 1 from public.entregas e
    where e.id = entrega_id and (e.criado_por = auth.uid() or e.voluntario = auth.uid())
  ));

drop policy if exists "entrega_contatos_escreve" on public.entrega_contatos;
create policy "entrega_contatos_escreve" on public.entrega_contatos
  for insert to authenticated
  with check (exists (
    select 1 from public.entregas e where e.id = entrega_id and e.criado_por = auth.uid()
  ));

drop policy if exists "entrega_contatos_edita" on public.entrega_contatos;
create policy "entrega_contatos_edita" on public.entrega_contatos
  for update to authenticated
  using (exists (
    select 1 from public.entregas e
    where e.id = entrega_id and (e.criado_por = auth.uid() or e.voluntario = auth.uid())
  ))
  with check (exists (
    select 1 from public.entregas e
    where e.id = entrega_id and (e.criado_por = auth.uid() or e.voluntario = auth.uid())
  ));

drop policy if exists "entrega_contatos_apaga" on public.entrega_contatos;
create policy "entrega_contatos_apaga" on public.entrega_contatos
  for delete to authenticated
  using (exists (
    select 1 from public.entregas e where e.id = entrega_id and e.criado_por = auth.uid()
  ));
