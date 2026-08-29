-- Canal de avisos por e-mail dos recursos de comunidade.
--
-- Até aqui o site só mandava e-mail para o desenvolvedor (sugestões, problemas,
-- resumo diário). Quem usava a plataforma nunca era avisado de nada: a pessoa
-- que anunciou no bazar só descobria o interesse de alguém se voltasse à tela,
-- e quem pedia carona ficava sem saber se foi aceito.
--
-- Duas tabelas sustentam o canal:
--
--   * `avisos_preferencias` — cada um decide o que quer receber. Aviso sobre
--     coisa MINHA (alguém reservou o meu item, meu pedido foi respondido) vem
--     ligado; aviso sobre coisa DA CASA (um pedido de acolhimento no fórum, uma
--     necessidade que combina comigo) vem desligado, porque é o tipo de mensagem
--     que enche caixa de entrada de quem não pediu.
--
--   * `avisos_enviados` — trava de duplicidade. A chave única (tipo, referência,
--     destinatário) garante que o mesmo aviso não sai duas vezes, mesmo se a
--     tela chamar de novo por engano ou se alguém insistir no botão.

create table if not exists public.avisos_preferencias (
  user_id uuid primary key default auth.uid(),
  meus_avisos boolean not null default true,
  acolhimento boolean not null default false,
  voluntariado boolean not null default false,
  -- Nulo de propósito: significa "ainda não decidiu", e aí quem é da direção
  -- da casa recebe (era o que o roadmap prometia) e os demais, não.
  aniversariantes boolean,
  updated_at timestamptz not null default now()
);

comment on column public.avisos_preferencias.aniversariantes is
  'Nulo = ainda não decidiu: recebe quem é da direção da casa. Verdadeiro ou falso = decisão do próprio membro.';

alter table public.avisos_preferencias enable row level security;

drop policy if exists "avisos_pref_leitura" on public.avisos_preferencias;
create policy "avisos_pref_leitura" on public.avisos_preferencias
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "avisos_pref_insere" on public.avisos_preferencias;
create policy "avisos_pref_insere" on public.avisos_preferencias
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "avisos_pref_edita" on public.avisos_preferencias;
create policy "avisos_pref_edita" on public.avisos_preferencias
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop trigger if exists avisos_pref_updated on public.avisos_preferencias;
create trigger avisos_pref_updated before update on public.avisos_preferencias
  for each row execute function public.set_updated_at();

-- Registro do que já foi enviado. Fica sem NENHUMA política: só a função de
-- borda, que usa a chave de serviço, lê e escreve aqui. Ninguém logado precisa
-- saber quem recebeu o quê.
create table if not exists public.avisos_enviados (
  id uuid primary key default gen_random_uuid(),
  tipo text not null,
  referencia uuid not null,
  destinatario uuid not null,
  created_at timestamptz not null default now(),
  unique (tipo, referencia, destinatario)
);

alter table public.avisos_enviados enable row level security;

revoke all on public.avisos_enviados from anon, authenticated;
