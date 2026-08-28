-- A direção assume a página de uma casa listada no diretório.
--
-- O diretório público lista 714 casas vindas de cadastro público, e a maioria
-- nem sigla tem. Quem é da direção via a casa listada e não tinha caminho: se
-- criasse conta, a página nascia solta, sem se ligar ao registro que já estava
-- ali. Esta função faz a ligação num ato só.
--
-- Decisão do dono do projeto em 28/08/2026: a casa é assumida NA HORA, sem
-- conferência humana. As salvaguardas que sobram não barram ninguém:
--   * exige e-mail confirmado, a mesma trava que o site já usa para publicar
--     artigo — vale contra robô, não contra pessoa;
--   * a página nasce PRIVADA, como toda página de casa sempre nasceu: ninguém
--     passa a falar em nome da casa sem que alguém publique;
--   * cada ato fica registrado em `casas_reivindicacoes`, com quem assumiu e
--     quando, e o desenvolvedor desfaz num clique.
--
-- Correção de segurança que vai junto: `administradores_pagina` aceitava INSERT
-- e DELETE de QUALQUER usuário autenticado, para QUALQUER casa. Ou seja, uma
-- pessoa logada podia se nomear administradora da página de uma casa que já
-- tinha dono, ou expulsar quem lá estava. Isso não tem relação com assumir uma
-- casa sem página: é invasão de casa com dono, e está fechado abaixo.

create table if not exists public.casas_reivindicacoes (
  id uuid primary key default gen_random_uuid(),
  casa_id uuid not null references public.casas_espirita(id) on delete cascade,
  casa_nome text not null,
  sigla text not null,
  user_id uuid not null,
  user_nome text,
  desfeita_em timestamptz,
  created_at timestamptz not null default now()
);

alter table public.casas_reivindicacoes enable row level security;

drop policy if exists "dev ve reivindicacoes" on public.casas_reivindicacoes;
create policy "dev ve reivindicacoes"
  on public.casas_reivindicacoes for select to authenticated
  using (public.sou_dev());

-- ── Correção: só quem administra a página mexe na lista de administradores ──
drop policy if exists "admins_insert" on public.administradores_pagina;
create policy "admins_insert"
  on public.administradores_pagina for insert to authenticated
  with check (public.pode_administrar_pagina(sigla_casa));

drop policy if exists "admins_delete" on public.administradores_pagina;
create policy "admins_delete"
  on public.administradores_pagina for delete to authenticated
  using (public.pode_administrar_pagina(sigla_casa));

-- ── Assumir a casa ────────────────────────────────────────────────────────
create or replace function public.reivindicar_casa(p_casa uuid, p_sigla text)
returns text
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_casa public.casas_espirita%rowtype;
  v_sigla text := upper(btrim(p_sigla));
  v_dono_da_sigla text;
  v_nome text;
begin
  if auth.uid() is null then
    raise exception 'Entre na sua conta para assumir a página desta casa.';
  end if;

  if not public.email_verificado() then
    raise exception 'Confirme o seu e-mail antes de assumir a página de uma casa. A mensagem de confirmação foi enviada quando você criou a conta.';
  end if;

  if v_sigla !~ '^[A-Z]{5}$' then
    raise exception 'A sigla precisa ter exatamente 5 letras, sem espaços nem números.';
  end if;

  select * into v_casa from public.casas_espirita where id = p_casa;
  if v_casa.id is null then
    raise exception 'Casa não encontrada no diretório.';
  end if;
  if not v_casa.ativa or not v_casa.visivel_diretorio then
    raise exception 'Esta casa não está mais no diretório.';
  end if;

  -- Casa que já tem página não é assumida por aqui.
  if v_casa.sigla is not null
     and exists (select 1 from public.paginas_casas where sigla_casa = v_casa.sigla) then
    raise exception 'Esta casa já tem página no site. Se ela é sua e você perdeu o acesso, procure o suporte.';
  end if;

  -- Sigla já usada por outra casa não pode ser tomada.
  select c.nome into v_dono_da_sigla
  from public.casas_espirita c
  where c.sigla = v_sigla and c.id <> p_casa
  limit 1;
  if v_dono_da_sigla is not null then
    raise exception 'A sigla % já pertence a outra casa (%). Escolha outra.', v_sigla, v_dono_da_sigla;
  end if;

  if exists (select 1 from public.paginas_casas where sigla_casa = v_sigla) then
    raise exception 'Já existe uma página com a sigla %. Escolha outra.', v_sigla;
  end if;

  insert into public.siglas_casas (sigla) values (v_sigla)
  on conflict (sigla) do nothing;

  update public.casas_espirita set sigla = v_sigla where id = p_casa;

  -- A página nasce com o que o cadastro público já sabe: quem assume revisa,
  -- em vez de redigitar nome, endereço e telefone que já estão ali.
  insert into public.paginas_casas (
    sigla_casa, nome_completo, endereco, cidade, uf, cep, telefone, publicada
  )
  values (
    v_sigla,
    v_casa.nome,
    coalesce(v_casa.endereco, ''),
    coalesce(v_casa.cidade, ''),
    coalesce(v_casa.estado, ''),
    coalesce(v_casa.cep, ''),
    coalesce(v_casa.telefone, ''),
    false
  )
  on conflict (sigla_casa) do nothing;

  insert into public.administradores_pagina (sigla_casa, user_id, adicionado_por)
  values (v_sigla, auth.uid(), auth.uid())
  on conflict do nothing;

  -- Membro sem casa passa a pertencer a esta; quem já tem casa não é mudado.
  update public.profiles
  set sigla_casa = v_sigla
  where id = auth.uid() and coalesce(btrim(sigla_casa), '') = '';

  select nome into v_nome from public.profiles where id = auth.uid();

  insert into public.casas_reivindicacoes (casa_id, casa_nome, sigla, user_id, user_nome)
  values (p_casa, v_casa.nome, v_sigla, auth.uid(), v_nome);

  return v_sigla;
end
$$;

-- ── Desfazer, quando o desenvolvedor constatar que foi indevido ───────────
create or replace function public.desfazer_reivindicacao(p_reivindicacao uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_reg public.casas_reivindicacoes%rowtype;
begin
  if not public.sou_dev() then
    raise exception 'Apenas o desenvolvedor pode desfazer uma reivindicação.';
  end if;

  select * into v_reg from public.casas_reivindicacoes where id = p_reivindicacao;
  if v_reg.id is null then
    raise exception 'Reivindicação não encontrada.';
  end if;
  if v_reg.desfeita_em is not null then
    raise exception 'Esta reivindicação já foi desfeita.';
  end if;

  -- Tira o acesso e devolve a casa ao diretório sem página. A página em si não
  -- é apagada: se houver conteúdo escrito, ele fica para conferência.
  delete from public.administradores_pagina
  where sigla_casa = v_reg.sigla and user_id = v_reg.user_id;

  update public.paginas_casas set publicada = false where sigla_casa = v_reg.sigla;
  update public.casas_espirita set sigla = null where id = v_reg.casa_id;

  update public.casas_reivindicacoes set desfeita_em = now() where id = p_reivindicacao;
end
$$;

revoke execute on function public.reivindicar_casa(uuid, text) from public;
revoke execute on function public.desfazer_reivindicacao(uuid) from public;
grant execute on function public.reivindicar_casa(uuid, text) to authenticated;
grant execute on function public.desfazer_reivindicacao(uuid) to authenticated;
