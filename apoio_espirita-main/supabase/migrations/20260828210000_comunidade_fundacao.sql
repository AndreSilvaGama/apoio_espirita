-- Fundação comum dos recursos de comunidade.
--
-- Entram nesta rodada dez recursos que estavam anunciados como "Em breve" nos
-- cartões da tela inicial: Aniversariantes, Plantão de Orações, Área de Jovens,
-- Fórum de Apoio, Comunicação em Grupos, Localização de Voluntariado, Bazar
-- On-line, Carona Solidária, Entrega Solidária e Ficha de Atendimento Fraterno.
--
-- Todos partilham três decisões, tomadas pelo dono do projeto em 28/08/2026:
--
--   1. VISIBILIDADE — o que se publica nasce restrito aos membros da própria
--      casa; quem publica pode marcar "abrir para outras casas". A regra mora
--      numa função só (`pode_ver_da_casa`) em vez de ser repetida em dezenas de
--      políticas, onde um erro de digitação viraria vazamento silencioso.
--
--   2. AUTORIA CARIMBADA NO BANCO — quem escreve, o nome exibido e a casa não
--      vêm do navegador: são gravados por gatilho a partir de `auth.uid()`.
--      É o mesmo cuidado já adotado nos artigos: sem isso, um cliente
--      modificado publica em nome de outra pessoa ou dentro de outra casa.
--
--   3. CONTATO SÓ APÓS O ACEITE — telefone de quem oferece carona, vende no
--      bazar ou faz entrega mora em tabela irmã, com política própria. Guardar
--      o contato na mesma linha do anúncio o entregaria a todo mundo que
--      enxerga o anúncio, porque RLS controla LINHA, não coluna.

-- ── 1. Visibilidade ────────────────────────────────────────────────────────
create or replace function public.pode_ver_da_casa(p_sigla text, p_aberto boolean)
returns boolean
language sql
stable
set search_path = public
as $$
  select coalesce(p_aberto, false)
      or (p_sigla is not null and p_sigla = public.minha_sigla_casa())
      or public.sou_dev()
$$;

comment on function public.pode_ver_da_casa(text, boolean) is
  'Regra única de visibilidade da comunidade: da própria casa, ou aberto a todas.';

revoke execute on function public.pode_ver_da_casa(text, boolean) from anon, public;
grant execute on function public.pode_ver_da_casa(text, boolean) to authenticated;

-- Publicar exige ser de uma casa, ter e-mail confirmado e não estar sancionado.
-- A confirmação de e-mail é a mesma trava que os artigos já usam: vale contra
-- robô e conta descartável, não contra pessoa.
create or replace function public.pode_publicar_na_casa(p_sigla text)
returns boolean
language sql
stable
set search_path = public
as $$
  select p_sigla is not null
     and p_sigla = public.minha_sigla_casa()
     and public.email_verificado()
     and not public.usuario_sancionado(auth.uid())
$$;

revoke execute on function public.pode_publicar_na_casa(text) from anon, public;
grant execute on function public.pode_publicar_na_casa(text) to authenticated;

-- ── 2. Autoria carimbada ───────────────────────────────────────────────────
-- Vale para toda tabela de comunidade que tenha as colunas criado_por,
-- autor_nome e sigla_casa. Só em INSERT: em UPDATE o carimbo original fica.
create or replace function public.carimbar_autor()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nome text;
  v_sigla text;
begin
  select nome, sigla_casa into v_nome, v_sigla
  from public.profiles
  where id = auth.uid();

  if v_sigla is null then
    raise exception 'Informe a sigla da sua casa espírita no perfil antes de publicar.'
      using errcode = 'check_violation';
  end if;

  new.criado_por := auth.uid();
  new.autor_nome := coalesce(nullif(btrim(v_nome), ''), 'Membro');
  new.sigla_casa := v_sigla;
  return new;
end;
$$;

comment on function public.carimbar_autor() is
  'Grava autor, nome e casa a partir de auth.uid(). O navegador não escolhe em nome de quem publica.';
