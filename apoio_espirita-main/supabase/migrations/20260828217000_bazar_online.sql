-- Bazar On-line.
--
-- Itens da comunidade com foto, valor sugerido e PIX. Três decisões:
--
--   * O PIX é montado NA TELA a partir da chave, do nome e da cidade — o código
--     copia-e-cola é gerado no navegador (`src/lib/pix.ts`). A plataforma não
--     processa pagamento nenhum, não retém valor e não fica no meio da
--     transação: o dinheiro vai direto de quem paga para a chave da casa.
--
--   * Os limites de tamanho da chave, do nome e da cidade não são capricho: o
--     padrão do BR Code do Banco Central reserva 25 caracteres para o nome e 15
--     para a cidade. Aceitar mais geraria um código que o aplicativo do banco
--     recusa, e o erro apareceria só na hora de pagar.
--
--   * O contato de quem anuncia mora em tabela separada, liberada apenas depois
--     do aceite da reserva. RLS controla linha, não coluna: guardar o telefone
--     na mesma linha do anúncio o entregaria a todos que veem o anúncio.

create table if not exists public.bazar_itens (
  id uuid primary key default gen_random_uuid(),
  sigla_casa text not null,
  titulo text not null check (char_length(btrim(titulo)) between 3 and 120),
  descricao text not null check (char_length(btrim(descricao)) between 5 and 2000),
  categoria text not null default 'outro'
    check (categoria in ('livro', 'artesanato', 'roupa', 'alimento', 'decoracao', 'outro')),
  estado text not null default 'usado' check (estado in ('novo', 'usado')),
  valor numeric(10, 2) check (valor is null or (valor >= 0 and valor <= 99999.99)),
  doacao boolean not null default false,
  foto_url text,
  chave_pix text check (chave_pix is null or char_length(btrim(chave_pix)) between 3 and 77),
  pix_nome text check (pix_nome is null or char_length(btrim(pix_nome)) between 2 and 25),
  pix_cidade text check (pix_cidade is null or char_length(btrim(pix_cidade)) between 2 and 15),
  disponivel boolean not null default true,
  aberto boolean not null default false,
  criado_por uuid not null,
  autor_nome text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.bazar_itens.doacao is 'Item oferecido sem preço fixo — quem recebe contribui com o quanto puder.';

create index if not exists bazar_itens_casa_idx
  on public.bazar_itens (sigla_casa, disponivel, created_at desc);

create table if not exists public.bazar_contatos (
  item_id uuid primary key references public.bazar_itens(id) on delete cascade,
  contato text not null check (char_length(btrim(contato)) between 5 and 120)
);

create table if not exists public.bazar_reservas (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.bazar_itens(id) on delete cascade,
  sigla_casa text not null,
  mensagem text check (mensagem is null or char_length(btrim(mensagem)) <= 600),
  contato text not null check (char_length(btrim(contato)) between 5 and 120),
  status text not null default 'pendente'
    check (status in ('pendente', 'aceita', 'recusada', 'concluida')),
  criado_por uuid not null,
  autor_nome text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (item_id, criado_por)
);

create index if not exists bazar_reservas_item_idx on public.bazar_reservas (item_id);

drop trigger if exists bazar_itens_autor on public.bazar_itens;
create trigger bazar_itens_autor before insert on public.bazar_itens
  for each row execute function public.carimbar_autor();

drop trigger if exists bazar_itens_updated on public.bazar_itens;
create trigger bazar_itens_updated before update on public.bazar_itens
  for each row execute function public.set_updated_at();

drop trigger if exists bazar_reservas_autor on public.bazar_reservas;
create trigger bazar_reservas_autor before insert on public.bazar_reservas
  for each row execute function public.carimbar_autor();

drop trigger if exists bazar_reservas_updated on public.bazar_reservas;
create trigger bazar_reservas_updated before update on public.bazar_reservas
  for each row execute function public.set_updated_at();

alter table public.bazar_itens enable row level security;
alter table public.bazar_contatos enable row level security;
alter table public.bazar_reservas enable row level security;

drop policy if exists "bazar_itens_leitura" on public.bazar_itens;
create policy "bazar_itens_leitura" on public.bazar_itens
  for select to authenticated
  using (public.pode_ver_da_casa(sigla_casa, aberto));

drop policy if exists "bazar_itens_insere" on public.bazar_itens;
create policy "bazar_itens_insere" on public.bazar_itens
  for insert to authenticated
  with check (public.pode_publicar_na_casa(sigla_casa));

drop policy if exists "bazar_itens_edita" on public.bazar_itens;
create policy "bazar_itens_edita" on public.bazar_itens
  for update to authenticated
  using (criado_por = auth.uid() or public.pode_administrar_pagina(sigla_casa))
  with check (criado_por = auth.uid() or public.pode_administrar_pagina(sigla_casa));

drop policy if exists "bazar_itens_apaga" on public.bazar_itens;
create policy "bazar_itens_apaga" on public.bazar_itens
  for delete to authenticated
  using (criado_por = auth.uid() or public.pode_administrar_pagina(sigla_casa));

-- O contato aparece para quem anunciou e para quem teve a reserva aceita.
drop policy if exists "bazar_contatos_leitura" on public.bazar_contatos;
create policy "bazar_contatos_leitura" on public.bazar_contatos
  for select to authenticated
  using (
    exists (select 1 from public.bazar_itens i where i.id = item_id and i.criado_por = auth.uid())
    or exists (
      select 1 from public.bazar_reservas r
      where r.item_id = bazar_contatos.item_id
        and r.criado_por = auth.uid()
        and r.status in ('aceita', 'concluida')
    )
  );

drop policy if exists "bazar_contatos_escreve" on public.bazar_contatos;
create policy "bazar_contatos_escreve" on public.bazar_contatos
  for insert to authenticated
  with check (exists (
    select 1 from public.bazar_itens i where i.id = item_id and i.criado_por = auth.uid()
  ));

drop policy if exists "bazar_contatos_edita" on public.bazar_contatos;
create policy "bazar_contatos_edita" on public.bazar_contatos
  for update to authenticated
  using (exists (select 1 from public.bazar_itens i where i.id = item_id and i.criado_por = auth.uid()))
  with check (exists (select 1 from public.bazar_itens i where i.id = item_id and i.criado_por = auth.uid()));

drop policy if exists "bazar_contatos_apaga" on public.bazar_contatos;
create policy "bazar_contatos_apaga" on public.bazar_contatos
  for delete to authenticated
  using (exists (select 1 from public.bazar_itens i where i.id = item_id and i.criado_por = auth.uid()));

-- A reserva é conversa de duas pessoas: quem reservou e quem anunciou.
drop policy if exists "bazar_reservas_leitura" on public.bazar_reservas;
create policy "bazar_reservas_leitura" on public.bazar_reservas
  for select to authenticated
  using (
    criado_por = auth.uid()
    or exists (select 1 from public.bazar_itens i where i.id = item_id and i.criado_por = auth.uid())
  );

drop policy if exists "bazar_reservas_insere" on public.bazar_reservas;
create policy "bazar_reservas_insere" on public.bazar_reservas
  for insert to authenticated
  with check (
    criado_por = auth.uid()
    and public.email_verificado()
    and not public.usuario_sancionado(auth.uid())
    and exists (
      select 1 from public.bazar_itens i
      where i.id = item_id and i.disponivel and public.pode_ver_da_casa(i.sigla_casa, i.aberto)
    )
  );

drop policy if exists "bazar_reservas_responde" on public.bazar_reservas;
create policy "bazar_reservas_responde" on public.bazar_reservas
  for update to authenticated
  using (exists (select 1 from public.bazar_itens i where i.id = item_id and i.criado_por = auth.uid()))
  with check (exists (select 1 from public.bazar_itens i where i.id = item_id and i.criado_por = auth.uid()));

drop policy if exists "bazar_reservas_desiste" on public.bazar_reservas;
create policy "bazar_reservas_desiste" on public.bazar_reservas
  for delete to authenticated
  using (criado_por = auth.uid());

-- ── Fotos dos itens ────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('bazar', 'bazar', true, 5242880,
        array['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "bazar_foto_leitura" on storage.objects;
create policy "bazar_foto_leitura" on storage.objects
  for select to public
  using (bucket_id = 'bazar');

drop policy if exists "bazar_foto_upload" on storage.objects;
create policy "bazar_foto_upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'bazar');

drop policy if exists "bazar_foto_apaga" on storage.objects;
create policy "bazar_foto_apaga" on storage.objects
  for delete to authenticated
  using (bucket_id = 'bazar' and owner = auth.uid());
