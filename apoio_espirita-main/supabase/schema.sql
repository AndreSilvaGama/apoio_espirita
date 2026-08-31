-- Estrutura do banco de produção, gerada automaticamente pelo Vigia diário.
-- NÃO EDITE À MÃO: este arquivo é sobrescrito todo dia pelo pg_dump.
-- Contém apenas estrutura (tabelas, RLS, políticas, funções). Nenhum dado.
--
--
-- PostgreSQL database dump
--

\restrict ZWDLJhmqjY5MzWRHXcfPPB2XVdebjgPWhsbRttuwyhD3mN6TU4M68OOM8WNElCW

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.11 (Ubuntu 17.11-1.pgdg24.04+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: abrir_sessao_apresentacao(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.abrir_sessao_apresentacao(p_apresentacao uuid) RETURNS TABLE(id uuid, codigo text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_alfabeto constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_codigo text;
  v_id uuid;
  v_tentativa int := 0;
begin
  if not exists (
    select 1 from public.apresentacoes a
    join public.profiles p on p.id = auth.uid()
    where a.id = p_apresentacao and a.sigla_casa = p.sigla_casa
  ) then
    raise exception 'Esta apresentação não é da sua casa espírita.';
  end if;

  update public.apresentacao_sessoes
     set ativa = false, encerrada_em = now()
   where apresentacao_id = p_apresentacao and ativa;

  loop
    v_tentativa := v_tentativa + 1;
    if v_tentativa > 40 then
      raise exception 'Não foi possível gerar um código livre. Tente de novo.';
    end if;
    v_codigo := '';
    for _ in 1..6 loop
      v_codigo := v_codigo || substr(v_alfabeto, 1 + floor(random() * length(v_alfabeto))::int, 1);
    end loop;
    exit when not exists (select 1 from public.apresentacao_sessoes s where s.codigo = v_codigo);
  end loop;

  insert into public.apresentacao_sessoes (apresentacao_id, codigo, iniciada_por)
  values (p_apresentacao, v_codigo, auth.uid())
  returning apresentacao_sessoes.id into v_id;

  return query select v_id, v_codigo;
end;
$$;


--
-- Name: artigo_avaliacao_carimbar_nome(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.artigo_avaliacao_carimbar_nome() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare
  v_nome text;
begin
  if tg_op = 'INSERT' or new.user_id is distinct from old.user_id then
    select p.nome into v_nome
      from public.profiles p
     where p.id = new.user_id;

    new.avaliador_nome := coalesce(nullif(trim(v_nome), ''), 'Um avaliador');
  end if;

  return new;
end;
$$;


--
-- Name: artigo_carimbar_identidade(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.artigo_carimbar_identidade() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare
  v_nome text;
  v_sigla text;
begin
  if tg_op = 'INSERT' or new.autor_id is distinct from old.autor_id then
    select p.nome, p.sigla_casa into v_nome, v_sigla
      from public.profiles p
     where p.id = new.autor_id;

    new.autor_nome := coalesce(nullif(trim(v_nome), ''), 'Membro da comunidade');
    new.autor_sigla_casa := v_sigla;
  end if;

  if tg_op = 'UPDATE'
     and old.autor_id = auth.uid()
     and not public.pode_revisar_artigo(new.id)
  then
    new.retirado_em := old.retirado_em;
    new.retirado_por := old.retirado_por;
    new.retirado_por_user_id := old.retirado_por_user_id;
    new.retirado_motivo := old.retirado_motivo;
  end if;

  return new;
end;
$$;


--
-- Name: artigo_deve_cair(integer, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.artigo_deve_cair(erro_grave integer, elogios integer, piso integer) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    SET search_path TO ''
    AS $$
  select coalesce(erro_grave, 0) >= piso
     and coalesce(erro_grave, 0) > coalesce(elogios, 0);
$$;


--
-- Name: artigo_piso_retirada(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.artigo_piso_retirada(verificados integer) RETURNS integer
    LANGUAGE sql IMMUTABLE
    SET search_path TO ''
    AS $$
  select greatest(3, ceil(coalesce(verificados, 0) * 0.20))::int;
$$;


--
-- Name: artigo_recontar(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.artigo_recontar() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare
  alvo uuid := coalesce(new.artigo_id, old.artigo_id);
  reg record;
  piso int;
  v_palavra_marcacoes text;
  v_palavra_aprovacoes text;
begin
  update public.artigos a
     set aval_otimo      = c.otimo,
         aval_bom        = c.bom,
         aval_gostei     = c.gostei,
         aval_nao_gostei = c.nao_gostei,
         aval_erro       = c.erro,
         aval_erro_grave = c.erro_grave
    from (
      select
        count(*) filter (where tipo = 'otimo')      as otimo,
        count(*) filter (where tipo = 'bom')        as bom,
        count(*) filter (where tipo = 'gostei')     as gostei,
        count(*) filter (where tipo = 'nao_gostei') as nao_gostei,
        count(*) filter (where tipo = 'erro')       as erro,
        count(*) filter (where tipo = 'erro_grave') as erro_grave
      from public.artigo_avaliacoes where artigo_id = alvo
    ) c
   where a.id = alvo
   returning a.* into reg;

  if reg is null then
    return coalesce(new, old);
  end if;

  piso := public.artigo_piso_retirada(public.total_verificados());

  if reg.estado = 'publicado'
     and public.artigo_deve_cair(
           reg.aval_erro_grave,
           reg.aval_otimo + reg.aval_bom + reg.aval_gostei,
           piso
         )
  then
    v_palavra_marcacoes := case when reg.aval_erro_grave = 1 then 'marcação' else 'marcações' end;
    v_palavra_aprovacoes := case
      when (reg.aval_otimo + reg.aval_bom + reg.aval_gostei) = 1 then 'aprovação'
      else 'aprovações'
    end;

    update public.artigos
       set estado = 'retirado',
           retirado_em = now(),
           retirado_por = 'comunidade',
           retirado_motivo = format(
             'Retirado automaticamente: %s %s de erro grave, piso de %s, contra %s %s.',
             reg.aval_erro_grave, v_palavra_marcacoes, piso,
             reg.aval_otimo + reg.aval_bom + reg.aval_gostei, v_palavra_aprovacoes)
     where id = alvo;

    insert into public.artigo_revisoes (artigo_id, origem)
    values (alvo, 'comunidade');
  end if;

  return coalesce(new, old);
end;
$$;


--
-- Name: artigo_transicao_valida(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.artigo_transicao_valida() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
begin
  if new.estado is distinct from old.estado then
    if public.pode_revisar_artigo(new.id) then
      return new;
    end if;
    if old.estado = 'publicado' and new.estado = 'retirado' then
      return new;
    end if;
    if old.autor_id = auth.uid()
       and old.estado = 'retirado'
       and new.estado = 'em_correcao' then
      return new;
    end if;
    raise exception
      'Transicao de estado nao permitida para este usuario: % -> %',
      old.estado, new.estado;
  end if;
  return new;
end;
$$;


--
-- Name: buscar_geral(text, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.buscar_geral(termo text, limite integer DEFAULT 6) RETURNS TABLE(tipo text, titulo text, subtitulo text, referencia text)
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$
  with entrada as (
    select public.sem_acento(coalesce(trim(termo), '')) as q,
           least(greatest(coalesce(limite, 6), 1), 20) as n
  ),
  casas as (
    select pc.sigla_casa as sigla,
           coalesce(nullif(trim(pc.nome_completo), ''), nullif(trim(ce.nome), ''), pc.sigla_casa)
             as nome,
           coalesce(nullif(trim(pc.cidade), ''), ce.cidade) as cidade,
           coalesce(nullif(trim(pc.uf), ''), ce.estado) as uf,
           pc.publicada
    from public.paginas_casas pc
    left join lateral (
      select c.nome, c.cidade, c.estado
      from public.casas_espirita c
      where c.sigla = pc.sigla_casa
      limit 1
    ) ce on true
    union all
    select ce.sigla, ce.nome, ce.cidade, ce.estado, false
    from public.casas_espirita ce
    where ce.sigla is null
       or not exists (
         select 1 from public.paginas_casas p where p.sigla_casa = ce.sigla
       )
  )
  (
    select 'artigo'::text,
           a.titulo,
           a.autor_nome || coalesce(' · ' || a.autor_sigla_casa, ''),
           a.slug
    from public.artigos_publicos a, entrada e
    where length(e.q) >= 2
      and (strpos(public.sem_acento(a.titulo), e.q) > 0
        or strpos(public.sem_acento(coalesce(a.resumo, '')), e.q) > 0
        or strpos(public.sem_acento(a.autor_nome), e.q) > 0)
    order by a.publicado_em desc nulls last
    limit (select n from entrada)
  )
  union all
  (
    select distinct 'casa'::text,
           c.nome,
           coalesce(c.cidade, '') || coalesce(' · ' || c.uf, ''),
           case when c.publicada then c.sigla end
    from casas c, entrada e
    where length(e.q) >= 2
      and coalesce(trim(c.nome), '') <> ''
      and (strpos(public.sem_acento(c.nome), e.q) > 0
        or strpos(public.sem_acento(coalesce(c.sigla, '')), e.q) > 0
        or strpos(public.sem_acento(coalesce(c.cidade, '')), e.q) > 0)
    order by 4 nulls last, 2
    limit (select n from entrada)
  )
  union all
  (
    select distinct 'membro'::text,
           p.nome,
           coalesce(p.cidade, '') || coalesce(' · ' || p.uf, ''),
           p.sigla_casa
    from public.profiles_public p, entrada e
    where length(e.q) >= 2
      and p.nome is not null
      and (strpos(public.sem_acento(p.nome), e.q) > 0
        or strpos(public.sem_acento(coalesce(p.cidade, '')), e.q) > 0)
    order by 2
    limit (select n from entrada)
  )
$$;


--
-- Name: FUNCTION buscar_geral(termo text, limite integer); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.buscar_geral(termo text, limite integer) IS 'Busca artigos publicados, casas ativas e membros visíveis a quem chama.';


--
-- Name: carimbar_autor(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.carimbar_autor() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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


--
-- Name: FUNCTION carimbar_autor(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.carimbar_autor() IS 'Grava autor, nome e casa a partir de auth.uid(). O navegador não escolhe em nome de quem publica.';


--
-- Name: carimbar_membro_grupo(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.carimbar_membro_grupo() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_grupo public.grupos%rowtype;
  v_nome text;
begin
  select * into v_grupo from public.grupos where id = new.grupo_id;
  if v_grupo.id is null then
    raise exception 'Grupo não encontrado.' using errcode = 'foreign_key_violation';
  end if;

  new.adicionado_por := auth.uid();
  new.sigla_casa := v_grupo.sigla_casa;

  if new.user_id is null then
    new.user_id := auth.uid();
  end if;

  if new.user_id <> auth.uid() and not public.sou_moderador_do_grupo(new.grupo_id) then
    raise exception 'Somente quem modera o grupo adiciona outra pessoa.'
      using errcode = 'insufficient_privilege';
  end if;

  select coalesce(nullif(btrim(nome), ''), 'Membro') into v_nome
  from public.profiles where id = new.user_id;
  new.nome := coalesce(v_nome, 'Membro');

  if new.user_id = v_grupo.criado_por then
    new.papel := 'moderador';
  elsif new.papel = 'moderador' and not public.sou_moderador_do_grupo(new.grupo_id) then
    new.papel := 'membro';
  end if;

  return new;
end;
$$;


--
-- Name: carona_conferir_vagas(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.carona_conferir_vagas() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


--
-- Name: convites_funil(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.convites_funil() RETURNS TABLE(total bigint, pendentes bigint, enviados bigint, falharam bigint, entregues bigint, abertos bigint, clicados bigint, devolvidos bigint, chegaram bigint, visitas bigint)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select
    count(*),
    count(*) filter (where status = 'pendente'),
    count(*) filter (where enviado_em is not null),
    count(*) filter (where status = 'falhou'),
    count(*) filter (where entregue_em is not null),
    count(*) filter (where aberto_em is not null),
    count(*) filter (where clicado_em is not null),
    count(*) filter (where devolvido_em is not null),
    count(*) filter (where chegou_em is not null),
    coalesce(sum(visitas), 0)
  from public.casas_convites;
$$;


--
-- Name: convites_pendentes(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.convites_pendentes(p_limite integer) RETURNS TABLE(convite_id uuid, email text, casa_nome text, cidade text, uf text, slug text)
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select v.id, v.email, c.nome, c.cidade, c.estado, public.diretorio_slug(c.cidade)
  from public.casas_convites v
  join public.casas_espirita c on c.id = v.casa_id
  where c.ativa and c.visivel_diretorio
    and (
      v.status = 'pendente'
      or (v.status = 'falhou' and v.tentativas < 2)
    )
  order by (v.status = 'falhou'), v.created_at, v.id
  limit greatest(0, least(p_limite, 1000));
$$;


--
-- Name: convites_restantes(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.convites_restantes() RETURNS integer
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select count(*)::int
  from public.casas_convites v
  join public.casas_espirita c on c.id = v.casa_id
  where c.ativa and c.visivel_diretorio
    and (v.status = 'pendente' or (v.status = 'falhou' and v.tentativas < 2));
$$;


--
-- Name: desfazer_reivindicacao(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.desfazer_reivindicacao(p_reivindicacao uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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

  delete from public.administradores_pagina
  where sigla_casa = v_reg.sigla and user_id = v_reg.user_id;

  update public.paginas_casas set publicada = false where sigla_casa = v_reg.sigla;
  update public.casas_espirita set sigla = null where id = v_reg.casa_id;

  update public.casas_reivindicacoes set desfeita_em = now() where id = p_reivindicacao;
end
$$;


--
-- Name: diretorio_casas(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.diretorio_casas(p_uf text, p_cidade_slug text) RETURNS TABLE(id uuid, nome text, sigla text, endereco text, cep text, cidade text, estado text, telefone text, tem_pagina boolean)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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


--
-- Name: diretorio_cidades(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.diretorio_cidades(p_uf text) RETURNS TABLE(cidade text, slug text, casas bigint)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select c.cidade, public.diretorio_slug(c.cidade), count(*)
  from public.casas_espirita c
  where c.ativa
    and c.visivel_diretorio
    and c.cidade is not null
    and upper(c.estado) = upper(p_uf)
  group by c.cidade
  order by c.cidade
$$;


--
-- Name: diretorio_estados(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.diretorio_estados() RETURNS TABLE(estado text, casas bigint, cidades bigint)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select c.estado, count(*), count(distinct c.cidade)
  from public.casas_espirita c
  where c.ativa
    and c.visivel_diretorio
    and c.estado is not null
    and c.cidade is not null
  group by c.estado
  order by c.estado
$$;


--
-- Name: diretorio_slug(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.diretorio_slug(texto text) RETURNS text
    LANGUAGE sql IMMUTABLE
    SET search_path TO 'public'
    AS $$
  select trim(both '-' from regexp_replace(public.sem_acento(texto), '[^a-z0-9]+', '-', 'g'))
$$;


--
-- Name: disparar_convites_agendados(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.disparar_convites_agendados() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_segredo text;
begin
  select segredo into v_segredo from public.convite_config where id = 1;
  if v_segredo is null then
    raise warning 'Convite às casas: segredo do agendamento ausente.';
    return;
  end if;

  perform net.http_post(
    url := 'https://kitmwxfwwujygcmdjngm.supabase.co/functions/v1/convite-casas',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-segredo', v_segredo
    ),
    body := jsonb_build_object('acao', 'enviar'),
    timeout_milliseconds := 120000
  );
end;
$$;


--
-- Name: email_verificado(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.email_verificado() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO ''
    AS $$
  select exists (
    select 1 from auth.users
    where id = auth.uid() and email_confirmed_at is not null
  );
$$;


--
-- Name: entrega_transicao_valida(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.entrega_transicao_valida() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_dono boolean := old.criado_por = auth.uid() or public.pode_administrar_pagina(old.sigla_casa);
  v_voluntario boolean := old.voluntario is not null and old.voluntario = auth.uid();
  v_nome text;
begin
  if v_dono then
    return new;
  end if;

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
$$;


--
-- Name: forum_recontar(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.forum_recontar() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_topico uuid := coalesce(new.topico_id, old.topico_id);
begin
  update public.forum_topicos t
  set respostas = (select count(*) from public.forum_respostas r where r.topico_id = v_topico),
      ultima_resposta_em = (select max(created_at) from public.forum_respostas r where r.topico_id = v_topico)
  where t.id = v_topico;
  return null;
end;
$$;


--
-- Name: get_request_kanban_token(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_request_kanban_token() RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  headers text;
BEGIN
  headers := current_setting('request.headers', true);
  IF headers IS NULL OR headers = '' THEN
    RETURN NULL;
  END IF;
  RETURN (headers::json)->>'x-kanban-token';
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;


--
-- Name: has_kanban_access(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_kanban_access(p_sigla_casa text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'auth'
    AS $$
DECLARE
  v_token text;
  v_user_sigla text;
BEGIN
  -- 1. Check if authenticated user belongs to the house
  IF auth.role() = 'authenticated' THEN
    SELECT sigla_casa INTO v_user_sigla FROM public.profiles WHERE id = auth.uid();
    IF v_user_sigla = p_sigla_casa THEN
      RETURN TRUE;
    END IF;
  END IF;
  -- 2. Check if request token matches the share token for the house
  v_token := public.get_request_kanban_token();
  IF v_token IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.kanban_config
      WHERE sigla_casa = p_sigla_casa AND share_token::text = v_token
    ) THEN
      RETURN TRUE;
    END IF;
  END IF;
  RETURN FALSE;
END;
$$;


--
-- Name: is_tesouraria_admin(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_tesouraria_admin(p_sigla_casa text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'auth'
    AS $$
DECLARE
  v_cargo text;
  v_sigla text;
  v_email text;
BEGIN
  IF auth.role() <> 'authenticated' THEN
    RETURN false;
  END IF;
  v_email := auth.jwt() ->> 'email';
  IF v_email = 'gama.andre@gmail.com' THEN
    RETURN true;
  END IF;
  SELECT cargo_principal, sigla_casa INTO v_cargo, v_sigla
  FROM public.profiles WHERE id = auth.uid();
  IF v_sigla = p_sigla_casa AND v_cargo = 'Presidente' THEN
    RETURN true;
  END IF;
  RETURN false;
END;
$$;


--
-- Name: minha_sigla_casa(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.minha_sigla_casa() RETURNS text
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$ SELECT sigla_casa FROM public.profiles WHERE id = auth.uid() $$;


--
-- Name: oracao_conferir_vagas(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.oracao_conferir_vagas() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_vagas smallint;
  v_ocupadas int;
begin
  select vagas into v_vagas from public.oracao_horarios where id = new.horario_id;
  if v_vagas is null or v_vagas = 0 then
    return new;
  end if;
  select count(*) into v_ocupadas from public.oracao_inscricoes where horario_id = new.horario_id;
  if v_ocupadas >= v_vagas then
    raise exception 'Este horário já preencheu todas as vagas.' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;


--
-- Name: pode_administrar_pagina(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.pode_administrar_pagina(p_sigla text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND (
        cargo_principal = 'DEV'
        OR (sigla_casa = p_sigla
            AND cargo_principal IN ('Presidente', 'Vice-presidente'))
      )
  )
  OR EXISTS (
    SELECT 1 FROM public.administradores_pagina
    WHERE sigla_casa = p_sigla AND user_id = auth.uid()
  )
$$;


--
-- Name: pode_atendimento_fraterno(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.pode_atendimento_fraterno(p_sigla text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select p_sigla is not null and (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and sigla_casa = p_sigla
        and cargo_principal in ('Atendente fraterno', 'Coordenador')
    )
    or exists (
      select 1 from public.atendimento_autorizados
      where sigla_casa = p_sigla and user_id = auth.uid()
    )
  )
$$;


--
-- Name: FUNCTION pode_atendimento_fraterno(p_sigla text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.pode_atendimento_fraterno(p_sigla text) IS 'Acesso às fichas de atendimento fraterno. De propósito não inclui sou_dev(): ninguém lê o relato de um atendido a título de suporte técnico.';


--
-- Name: pode_evangelizacao(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.pode_evangelizacao(p_sigla text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select p_sigla is not null and (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and sigla_casa = p_sigla
        and cargo_principal in ('Evangelizador', 'Coordenador')
    )
    or exists (
      select 1 from public.evangelizacao_autorizados
      where sigla_casa = p_sigla and user_id = auth.uid()
    )
  )
$$;


--
-- Name: FUNCTION pode_evangelizacao(p_sigla text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.pode_evangelizacao(p_sigla text) IS 'Acesso às fichas da evangelização. De propósito não inclui sou_dev(): ninguém lê a ficha de uma criança a título de suporte técnico.';


--
-- Name: pode_publicar_na_casa(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.pode_publicar_na_casa(p_sigla text) RETURNS boolean
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$
  select p_sigla is not null
     and p_sigla = public.minha_sigla_casa()
     and public.email_verificado()
     and not public.usuario_sancionado(auth.uid())
$$;


--
-- Name: pode_revisar_artigo(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.pode_revisar_artigo(alvo uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO ''
    AS $$
  select exists (
    select 1
      from public.artigos a
      join public.profiles p on p.id = auth.uid()
     where a.id = alvo
       and (
         p.cargo_principal = 'DEV'
         or (p.sigla_casa = a.autor_sigla_casa
             and p.cargo_principal in ('Presidente', 'Vice-presidente'))
       )
  );
$$;


--
-- Name: pode_sancionar(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.pode_sancionar(alvo_user uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO ''
    AS $$
  select exists (
    select 1 from public.profiles quem
     where quem.id = auth.uid()
       and (
         quem.cargo_principal = 'DEV'
         or (
           quem.cargo_principal in ('Presidente', 'Vice-presidente')
           and quem.sigla_casa = (
             select alvo.sigla_casa from public.profiles alvo where alvo.id = alvo_user
           )
         )
       )
  );
$$;


--
-- Name: pode_ver_da_casa(text, boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.pode_ver_da_casa(p_sigla text, p_aberto boolean) RETURNS boolean
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$
  select coalesce(p_aberto, false)
      or (p_sigla is not null and p_sigla = public.minha_sigla_casa())
      or public.sou_dev()
$$;


--
-- Name: FUNCTION pode_ver_da_casa(p_sigla text, p_aberto boolean); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.pode_ver_da_casa(p_sigla text, p_aberto boolean) IS 'Regra única de visibilidade da comunidade: da própria casa, ou aberto a todas.';


--
-- Name: registrar_chegada_convite(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.registrar_chegada_convite(p_convite uuid) RETURNS void
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  update public.casas_convites
     set chegou_em = coalesce(chegou_em, now()),
         visitas   = visitas + 1
   where id = p_convite;
$$;


--
-- Name: reivindicar_casa(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.reivindicar_casa(p_casa uuid, p_sigla text) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
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

  if v_casa.sigla is not null
     and exists (select 1 from public.paginas_casas where sigla_casa = v_casa.sigla) then
    raise exception 'Esta casa já tem página no site. Se ela é sua e você perdeu o acesso, procure o suporte.';
  end if;

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

  update public.profiles
  set sigla_casa = v_sigla
  where id = auth.uid() and coalesce(btrim(sigla_casa), '') = '';

  select nome into v_nome from public.profiles where id = auth.uid();

  insert into public.casas_reivindicacoes (casa_id, casa_nome, sigla, user_id, user_nome)
  values (p_casa, v_casa.nome, v_sigla, auth.uid(), v_nome);

  return v_sigla;
end
$_$;


--
-- Name: remover_casa_do_diretorio(uuid, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.remover_casa_do_diretorio(p_casa uuid, p_nome text, p_contato text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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


--
-- Name: resolver_revisao_artigo(uuid, text, text, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.resolver_revisao_artigo(p_revisao uuid, p_decisao text, p_justificativa text, p_dias_suspensao integer DEFAULT NULL::integer) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare
  v_revisao public.artigo_revisoes%rowtype;
  v_autor_id uuid;
  v_ja_vigente boolean;
begin
  if p_decisao not in ('restaurar', 'manter_retirado', 'suspender_autor', 'banir_autor') then
    raise exception 'Decisão inválida: %.', p_decisao;
  end if;

  select * into v_revisao
    from public.artigo_revisoes
   where id = p_revisao
     for update;

  if not found then
    raise exception 'Revisão não encontrada.';
  end if;

  if v_revisao.estado = 'resolvida' then
    raise exception 'Esta revisão já foi resolvida — recarregue a fila antes de tentar de novo.';
  end if;

  if p_justificativa is null or length(trim(p_justificativa)) < 10 then
    raise exception 'A justificativa precisa ter pelo menos 10 caracteres.';
  end if;

  if not public.pode_revisar_artigo(v_revisao.artigo_id) then
    raise exception 'Você não tem permissão para revisar este artigo.';
  end if;

  select autor_id into v_autor_id
    from public.artigos
   where id = v_revisao.artigo_id;

  if p_decisao in ('suspender_autor', 'banir_autor')
     and not public.pode_sancionar(v_autor_id) then
    raise exception 'Você não tem permissão para sancionar o autor deste artigo.';
  end if;

  if p_decisao = 'restaurar' then
    update public.artigos
       set estado = 'publicado',
           retirado_em = null,
           retirado_por = null,
           retirado_por_user_id = null,
           retirado_motivo = null
     where id = v_revisao.artigo_id;
  end if;

  if p_decisao = 'manter_retirado' then
    update public.artigos
       set estado = 'retirado'
     where id = v_revisao.artigo_id
       and estado = 'em_correcao';
  end if;

  if p_decisao = 'suspender_autor' then
    if p_dias_suspensao is null or p_dias_suspensao < 1 then
      raise exception 'Informe a quantidade de dias de suspensão (mínimo 1).';
    end if;

    select exists (
      select 1 from public.usuarios_sancoes
       where user_id = v_autor_id
         and tipo = 'suspensao'
         and revogada_em is null
         and (fim is null or fim > now())
    ) into v_ja_vigente;

    if not v_ja_vigente then
      insert into public.usuarios_sancoes (user_id, tipo, fim, motivo, aplicada_por)
      values (v_autor_id, 'suspensao', now() + make_interval(days => p_dias_suspensao),
              p_justificativa, auth.uid());
    end if;
  end if;

  if p_decisao = 'banir_autor' then
    select exists (
      select 1 from public.usuarios_sancoes
       where user_id = v_autor_id
         and tipo = 'banimento'
         and revogada_em is null
    ) into v_ja_vigente;

    if not v_ja_vigente then
      insert into public.usuarios_sancoes (user_id, tipo, fim, motivo, aplicada_por)
      values (v_autor_id, 'banimento', null, p_justificativa, auth.uid());
    end if;
  end if;

  update public.artigo_revisoes
     set estado = 'resolvida',
         decisao = p_decisao,
         justificativa = p_justificativa,
         decidida_por = auth.uid(),
         decidida_em = now()
   where id = p_revisao;
end;
$$;


--
-- Name: restaurar_casa_no_diretorio(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.restaurar_casa_no_diretorio(p_pedido uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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


--
-- Name: rls_auto_enable(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rls_auto_enable() RETURNS event_trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


--
-- Name: sem_acento(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sem_acento(texto text) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE
    SET search_path TO 'extensions', 'public'
    AS $$
  select lower(extensions.unaccent('extensions.unaccent'::regdictionary, texto))
$$;


--
-- Name: FUNCTION sem_acento(texto text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.sem_acento(texto text) IS 'Devolve o texto sem acento e em minúsculas, para comparação de busca.';


--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: sou_dev(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sou_dev() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$ SELECT EXISTS (
  SELECT 1 FROM public.profiles
  WHERE id = auth.uid() AND cargo_principal = 'DEV'
) $$;


--
-- Name: sou_do_grupo(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sou_do_grupo(p_grupo uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select exists (
    select 1 from public.grupo_membros
    where grupo_id = p_grupo and user_id = auth.uid()
  )
$$;


--
-- Name: sou_moderador_do_grupo(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sou_moderador_do_grupo(p_grupo uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select exists (
    select 1 from public.grupo_membros
    where grupo_id = p_grupo and user_id = auth.uid() and papel = 'moderador'
  )
  or exists (
    select 1 from public.grupos where id = p_grupo and criado_por = auth.uid()
  )
$$;


--
-- Name: total_verificados(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.total_verificados() RETURNS integer
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO ''
    AS $$
  select count(*)::int from auth.users where email_confirmed_at is not null;
$$;


--
-- Name: usuario_sancionado(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.usuario_sancionado(uid uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO ''
    AS $$
  select exists (
    select 1 from public.usuarios_sancoes
    where user_id = uid
      and revogada_em is null
      and (fim is null or fim > now())
  );
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: administradores_pagina; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.administradores_pagina (
    sigla_casa text NOT NULL,
    user_id uuid NOT NULL,
    adicionado_por uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: agenda_eventos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agenda_eventos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sigla_casa text NOT NULL,
    titulo text NOT NULL,
    descricao text,
    local text,
    data_inicio timestamp with time zone NOT NULL,
    data_fim timestamp with time zone,
    tipo text DEFAULT 'aberto'::text NOT NULL,
    aceita_confirmacao boolean DEFAULT true NOT NULL,
    criador_id uuid NOT NULL,
    criador_nome text NOT NULL,
    ata text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT agenda_eventos_tipo_check CHECK ((tipo = ANY (ARRAY['aberto'::text, 'fechado'::text])))
);


--
-- Name: agenda_participantes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agenda_participantes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    evento_id uuid NOT NULL,
    user_id uuid NOT NULL,
    confirmado boolean,
    presente boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: apresentacao_perguntas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.apresentacao_perguntas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sessao_id uuid NOT NULL,
    texto text NOT NULL,
    autor_nome text,
    respondida boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT apresentacao_perguntas_autor_nome_check CHECK ((length(autor_nome) <= 60)),
    CONSTRAINT apresentacao_perguntas_texto_check CHECK (((length(btrim(texto)) >= 3) AND (length(btrim(texto)) <= 400)))
);


--
-- Name: apresentacao_sessoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.apresentacao_sessoes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    apresentacao_id uuid NOT NULL,
    codigo text NOT NULL,
    slide_atual integer DEFAULT 1 NOT NULL,
    ativa boolean DEFAULT true NOT NULL,
    aceita_perguntas boolean DEFAULT true NOT NULL,
    iniciada_por uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    encerrada_em timestamp with time zone,
    CONSTRAINT apresentacao_sessoes_slide_atual_check CHECK ((slide_atual >= 1))
);


--
-- Name: apresentacoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.apresentacoes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sigla_casa text NOT NULL,
    titulo text NOT NULL,
    descricao text,
    criado_por uuid NOT NULL,
    autor_nome text,
    total_slides integer NOT NULL,
    permite_download boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT apresentacoes_descricao_check CHECK ((length(descricao) <= 600)),
    CONSTRAINT apresentacoes_titulo_check CHECK (((length(btrim(titulo)) >= 3) AND (length(btrim(titulo)) <= 160))),
    CONSTRAINT apresentacoes_total_slides_check CHECK (((total_slides >= 1) AND (total_slides <= 150)))
);


--
-- Name: artigo_avaliacoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.artigo_avaliacoes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    artigo_id uuid NOT NULL,
    user_id uuid NOT NULL,
    tipo text NOT NULL,
    descricao_erro text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    editado_em timestamp with time zone,
    avaliador_nome text,
    CONSTRAINT artigo_avaliacoes_tipo_check CHECK ((tipo = ANY (ARRAY['otimo'::text, 'bom'::text, 'gostei'::text, 'nao_gostei'::text, 'erro'::text, 'erro_grave'::text]))),
    CONSTRAINT descricao_obrigatoria_no_erro CHECK (
CASE
    WHEN (tipo = ANY (ARRAY['erro'::text, 'erro_grave'::text])) THEN ((descricao_erro IS NOT NULL) AND (length(TRIM(BOTH FROM descricao_erro)) >= 10))
    ELSE (descricao_erro IS NULL)
END)
);


--
-- Name: artigo_revisoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.artigo_revisoes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    artigo_id uuid NOT NULL,
    aberta_em timestamp with time zone DEFAULT now() NOT NULL,
    origem text NOT NULL,
    estado text DEFAULT 'aberta'::text NOT NULL,
    decisao text,
    justificativa text,
    decidida_por uuid,
    decidida_em timestamp with time zone,
    CONSTRAINT artigo_revisoes_decisao_check CHECK (((decisao IS NULL) OR (decisao = ANY (ARRAY['restaurar'::text, 'manter_retirado'::text, 'suspender_autor'::text, 'banir_autor'::text])))),
    CONSTRAINT artigo_revisoes_estado_check CHECK ((estado = ANY (ARRAY['aberta'::text, 'resolvida'::text]))),
    CONSTRAINT artigo_revisoes_origem_check CHECK ((origem = ANY (ARRAY['comunidade'::text, 'humano'::text, 'reenvio'::text]))),
    CONSTRAINT justificativa_obrigatoria_ao_resolver CHECK (
CASE
    WHEN (estado = 'resolvida'::text) THEN ((justificativa IS NOT NULL) AND (length(TRIM(BOTH FROM justificativa)) >= 10))
    ELSE true
END)
);


--
-- Name: artigos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.artigos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    autor_id uuid NOT NULL,
    autor_nome text NOT NULL,
    autor_sigla_casa text,
    titulo text NOT NULL,
    slug text NOT NULL,
    resumo text,
    conteudo text NOT NULL,
    estado text DEFAULT 'publicado'::text NOT NULL,
    aval_otimo integer DEFAULT 0 NOT NULL,
    aval_bom integer DEFAULT 0 NOT NULL,
    aval_gostei integer DEFAULT 0 NOT NULL,
    aval_nao_gostei integer DEFAULT 0 NOT NULL,
    aval_erro integer DEFAULT 0 NOT NULL,
    aval_erro_grave integer DEFAULT 0 NOT NULL,
    retirado_em timestamp with time zone,
    retirado_por text,
    retirado_por_user_id uuid,
    retirado_motivo text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    editado_em timestamp with time zone,
    publicado_em timestamp with time zone DEFAULT now() NOT NULL,
    assinatura text DEFAULT 'completa'::text NOT NULL,
    indexavel boolean DEFAULT true NOT NULL,
    CONSTRAINT artigos_assinatura_check CHECK ((assinatura = ANY (ARRAY['completa'::text, 'primeiro_nome'::text]))),
    CONSTRAINT artigos_conteudo_check CHECK ((length(TRIM(BOTH FROM conteudo)) >= 200)),
    CONSTRAINT artigos_estado_check CHECK ((estado = ANY (ARRAY['publicado'::text, 'retirado'::text, 'em_correcao'::text]))),
    CONSTRAINT artigos_resumo_check CHECK (((resumo IS NULL) OR (length(resumo) <= 400))),
    CONSTRAINT artigos_retirado_por_check CHECK (((retirado_por IS NULL) OR (retirado_por = ANY (ARRAY['comunidade'::text, 'humano'::text])))),
    CONSTRAINT artigos_titulo_check CHECK (((length(TRIM(BOTH FROM titulo)) >= 5) AND (length(TRIM(BOTH FROM titulo)) <= 160)))
);


--
-- Name: artigos_avisos; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.artigos_avisos WITH (security_invoker='false') AS
 SELECT slug,
    estado,
    retirado_em
   FROM public.artigos a
  WHERE (estado = ANY (ARRAY['retirado'::text, 'em_correcao'::text]));


--
-- Name: VIEW artigos_avisos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.artigos_avisos IS 'DELIBERADAMENTE security definer. Existe para o endereco de um artigo retirado continuar respondendo com um aviso em vez de nao-encontrado — o que exige enxergar linhas que as politicas escondem. Por isso e minima: so slug, estado e data. Nao le conteudo, nem titulo, nem o motivo da retirada. Nao vaza o que nao enxerga.';


--
-- Name: artigos_publicos; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.artigos_publicos WITH (security_invoker='true') AS
 SELECT id,
    autor_id,
        CASE
            WHEN (assinatura = 'primeiro_nome'::text) THEN split_part(btrim(autor_nome), ' '::text, 1)
            ELSE autor_nome
        END AS autor_nome,
    autor_sigla_casa,
    titulo,
    slug,
    resumo,
        CASE
            WHEN (estado = 'publicado'::text) THEN conteudo
            ELSE NULL::text
        END AS conteudo,
    estado,
    aval_otimo,
    aval_bom,
    aval_gostei,
    aval_nao_gostei,
    ((aval_otimo + aval_bom) + aval_gostei) AS aprovacoes,
    retirado_em,
    retirado_por,
    retirado_motivo,
    created_at,
    editado_em,
    publicado_em,
    public.artigo_piso_retirada(public.total_verificados()) AS piso_atual,
    assinatura,
    indexavel
   FROM public.artigos a;


--
-- Name: VIEW artigos_publicos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.artigos_publicos IS 'Leitura publica de artigos. Mascara o conteudo fora do estado publicado e roda com security_invoker: as linhas visiveis sao as que a politica artigos_select libera para quem consulta. Ao recriar esta view, REPETIR a clausula with (security_invoker = true) — create or replace view apaga a opcao sem avisar.';


--
-- Name: atendimento_acessos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.atendimento_acessos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ficha_id uuid NOT NULL,
    sigla_casa text NOT NULL,
    user_id uuid DEFAULT auth.uid() NOT NULL,
    user_nome text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: atendimento_autorizados; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.atendimento_autorizados (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sigla_casa text NOT NULL,
    user_id uuid NOT NULL,
    nome text,
    criado_por uuid DEFAULT auth.uid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: atendimento_fichas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.atendimento_fichas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sigla_casa text NOT NULL,
    atendido_nome text NOT NULL,
    atendido_contato text,
    data_atendimento date DEFAULT CURRENT_DATE NOT NULL,
    tipo text DEFAULT 'primeira'::text NOT NULL,
    relato text NOT NULL,
    encaminhamento text,
    retorno_em date,
    concluida boolean DEFAULT false NOT NULL,
    criado_por uuid NOT NULL,
    autor_nome text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT atendimento_fichas_atendido_contato_check CHECK (((atendido_contato IS NULL) OR (char_length(btrim(atendido_contato)) <= 120))),
    CONSTRAINT atendimento_fichas_atendido_nome_check CHECK (((char_length(btrim(atendido_nome)) >= 2) AND (char_length(btrim(atendido_nome)) <= 160))),
    CONSTRAINT atendimento_fichas_encaminhamento_check CHECK (((encaminhamento IS NULL) OR (char_length(btrim(encaminhamento)) <= 2000))),
    CONSTRAINT atendimento_fichas_relato_check CHECK (((char_length(btrim(relato)) >= 5) AND (char_length(btrim(relato)) <= 8000))),
    CONSTRAINT atendimento_fichas_tipo_check CHECK ((tipo = ANY (ARRAY['primeira'::text, 'retorno'::text])))
);


--
-- Name: avisos_enviados; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.avisos_enviados (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tipo text NOT NULL,
    referencia uuid NOT NULL,
    destinatario uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: avisos_preferencias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.avisos_preferencias (
    user_id uuid DEFAULT auth.uid() NOT NULL,
    meus_avisos boolean DEFAULT true NOT NULL,
    acolhimento boolean DEFAULT false NOT NULL,
    voluntariado boolean DEFAULT false NOT NULL,
    aniversariantes boolean,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: COLUMN avisos_preferencias.aniversariantes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.avisos_preferencias.aniversariantes IS 'Nulo = ainda não decidiu: recebe quem é da direção da casa. Verdadeiro ou falso = decisão do próprio membro.';


--
-- Name: bazar_contatos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bazar_contatos (
    item_id uuid NOT NULL,
    contato text NOT NULL,
    CONSTRAINT bazar_contatos_contato_check CHECK (((char_length(btrim(contato)) >= 5) AND (char_length(btrim(contato)) <= 120)))
);


--
-- Name: bazar_itens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bazar_itens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sigla_casa text NOT NULL,
    titulo text NOT NULL,
    descricao text NOT NULL,
    categoria text DEFAULT 'outro'::text NOT NULL,
    estado text DEFAULT 'usado'::text NOT NULL,
    valor numeric(10,2),
    doacao boolean DEFAULT false NOT NULL,
    foto_url text,
    chave_pix text,
    pix_nome text,
    pix_cidade text,
    disponivel boolean DEFAULT true NOT NULL,
    aberto boolean DEFAULT false NOT NULL,
    criado_por uuid NOT NULL,
    autor_nome text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT bazar_itens_categoria_check CHECK ((categoria = ANY (ARRAY['livro'::text, 'artesanato'::text, 'roupa'::text, 'alimento'::text, 'decoracao'::text, 'outro'::text]))),
    CONSTRAINT bazar_itens_chave_pix_check CHECK (((chave_pix IS NULL) OR ((char_length(btrim(chave_pix)) >= 3) AND (char_length(btrim(chave_pix)) <= 77)))),
    CONSTRAINT bazar_itens_descricao_check CHECK (((char_length(btrim(descricao)) >= 5) AND (char_length(btrim(descricao)) <= 2000))),
    CONSTRAINT bazar_itens_estado_check CHECK ((estado = ANY (ARRAY['novo'::text, 'usado'::text]))),
    CONSTRAINT bazar_itens_pix_cidade_check CHECK (((pix_cidade IS NULL) OR ((char_length(btrim(pix_cidade)) >= 2) AND (char_length(btrim(pix_cidade)) <= 15)))),
    CONSTRAINT bazar_itens_pix_nome_check CHECK (((pix_nome IS NULL) OR ((char_length(btrim(pix_nome)) >= 2) AND (char_length(btrim(pix_nome)) <= 25)))),
    CONSTRAINT bazar_itens_titulo_check CHECK (((char_length(btrim(titulo)) >= 3) AND (char_length(btrim(titulo)) <= 120))),
    CONSTRAINT bazar_itens_valor_check CHECK (((valor IS NULL) OR ((valor >= (0)::numeric) AND (valor <= 99999.99))))
);


--
-- Name: COLUMN bazar_itens.doacao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.bazar_itens.doacao IS 'Item oferecido sem preço fixo — quem recebe contribui com o quanto puder.';


--
-- Name: bazar_reservas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bazar_reservas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    item_id uuid NOT NULL,
    sigla_casa text NOT NULL,
    mensagem text,
    contato text NOT NULL,
    status text DEFAULT 'pendente'::text NOT NULL,
    criado_por uuid NOT NULL,
    autor_nome text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT bazar_reservas_contato_check CHECK (((char_length(btrim(contato)) >= 5) AND (char_length(btrim(contato)) <= 120))),
    CONSTRAINT bazar_reservas_mensagem_check CHECK (((mensagem IS NULL) OR (char_length(btrim(mensagem)) <= 600))),
    CONSTRAINT bazar_reservas_status_check CHECK ((status = ANY (ARRAY['pendente'::text, 'aceita'::text, 'recusada'::text, 'concluida'::text])))
);


--
-- Name: carona_contatos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.carona_contatos (
    carona_id uuid NOT NULL,
    contato text NOT NULL,
    CONSTRAINT carona_contatos_contato_check CHECK (((char_length(btrim(contato)) >= 5) AND (char_length(btrim(contato)) <= 120)))
);


--
-- Name: carona_pedidos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.carona_pedidos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    carona_id uuid NOT NULL,
    sigla_casa text NOT NULL,
    ponto_encontro text,
    mensagem text,
    contato text NOT NULL,
    status text DEFAULT 'pendente'::text NOT NULL,
    criado_por uuid NOT NULL,
    autor_nome text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT carona_pedidos_contato_check CHECK (((char_length(btrim(contato)) >= 5) AND (char_length(btrim(contato)) <= 120))),
    CONSTRAINT carona_pedidos_mensagem_check CHECK (((mensagem IS NULL) OR (char_length(btrim(mensagem)) <= 600))),
    CONSTRAINT carona_pedidos_ponto_encontro_check CHECK (((ponto_encontro IS NULL) OR (char_length(btrim(ponto_encontro)) <= 200))),
    CONSTRAINT carona_pedidos_status_check CHECK ((status = ANY (ARRAY['pendente'::text, 'aceito'::text, 'recusado'::text])))
);


--
-- Name: caronas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.caronas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sigla_casa text NOT NULL,
    origem text NOT NULL,
    destino text NOT NULL,
    data date NOT NULL,
    hora time without time zone NOT NULL,
    vagas smallint DEFAULT 1 NOT NULL,
    volta boolean DEFAULT false NOT NULL,
    veiculo text,
    observacao text,
    ativa boolean DEFAULT true NOT NULL,
    aberto boolean DEFAULT false NOT NULL,
    criado_por uuid NOT NULL,
    autor_nome text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT caronas_destino_check CHECK (((char_length(btrim(destino)) >= 3) AND (char_length(btrim(destino)) <= 160))),
    CONSTRAINT caronas_observacao_check CHECK (((observacao IS NULL) OR (char_length(btrim(observacao)) <= 600))),
    CONSTRAINT caronas_origem_check CHECK (((char_length(btrim(origem)) >= 3) AND (char_length(btrim(origem)) <= 160))),
    CONSTRAINT caronas_vagas_check CHECK (((vagas >= 1) AND (vagas <= 8))),
    CONSTRAINT caronas_veiculo_check CHECK (((veiculo IS NULL) OR (char_length(btrim(veiculo)) <= 80)))
);


--
-- Name: COLUMN caronas.volta; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.caronas.volta IS 'O motorista também traz de volta depois da reunião.';


--
-- Name: casas_convites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.casas_convites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    casa_id uuid NOT NULL,
    email text NOT NULL,
    status text DEFAULT 'pendente'::text NOT NULL,
    enviado_em timestamp with time zone,
    erro text,
    tentativas integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    provedor_id text,
    entregue_em timestamp with time zone,
    aberto_em timestamp with time zone,
    clicado_em timestamp with time zone,
    devolvido_em timestamp with time zone,
    devolvido_motivo text,
    chegou_em timestamp with time zone,
    visitas integer DEFAULT 0 NOT NULL,
    CONSTRAINT casas_convites_status_check CHECK ((status = ANY (ARRAY['pendente'::text, 'enviado'::text, 'falhou'::text])))
);


--
-- Name: COLUMN casas_convites.provedor_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.casas_convites.provedor_id IS 'Identificador da mensagem no provedor de e-mail. E por ele que o webhook reencontra o convite; o e-mail sozinho nao serve, porque a mesma casa pode receber mais de um convite ao longo do tempo.';


--
-- Name: COLUMN casas_convites.aberto_em; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.casas_convites.aberto_em IS 'Primeira abertura relatada pelo provedor. E sempre um PISO: leitor de e-mail que bloqueia imagens nao gera abertura, e a pessoa pode ter lido.';


--
-- Name: COLUMN casas_convites.chegou_em; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.casas_convites.chegou_em IS 'Primeira visita a pagina da cidade vinda do link deste convite. Este e o numero que mede resultado — os outros medem intencao.';


--
-- Name: casas_espirita; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.casas_espirita (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    endereco text,
    cep text,
    cidade text NOT NULL,
    estado text NOT NULL,
    latitude double precision,
    longitude double precision,
    telefone text,
    aceita_doacao_alimentos boolean DEFAULT false NOT NULL,
    ativa boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    sigla text,
    visivel_diretorio boolean DEFAULT true NOT NULL,
    email text,
    site text,
    instagram text,
    facebook text,
    CONSTRAINT casas_espirita_estado_check CHECK ((char_length(estado) = 2)),
    CONSTRAINT casas_espirita_nome_check CHECK (((char_length(nome) >= 2) AND (char_length(nome) <= 200)))
);


--
-- Name: COLUMN casas_espirita.email; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.casas_espirita.email IS 'E-mail institucional da casa. Guardado, mas ainda não exibido em nenhuma tela.';


--
-- Name: casas_pedidos_remocao; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.casas_pedidos_remocao (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    casa_id uuid NOT NULL,
    casa_nome text NOT NULL,
    nome_solicitante text NOT NULL,
    contato text NOT NULL,
    restaurada_em timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: casas_reivindicacoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.casas_reivindicacoes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    casa_id uuid NOT NULL,
    casa_nome text NOT NULL,
    sigla text NOT NULL,
    user_id uuid NOT NULL,
    user_nome text,
    desfeita_em timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: convite_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.convite_config (
    id integer DEFAULT 1 NOT NULL,
    automatico boolean DEFAULT false NOT NULL,
    por_dia integer DEFAULT 300 NOT NULL,
    pausado_em timestamp with time zone,
    motivo text,
    atualizado_em timestamp with time zone DEFAULT now() NOT NULL,
    segredo text NOT NULL,
    segredo_webhook text,
    CONSTRAINT convite_config_id_check CHECK ((id = 1)),
    CONSTRAINT convite_config_por_dia_check CHECK (((por_dia >= 1) AND (por_dia <= 500)))
);


--
-- Name: entrega_contatos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.entrega_contatos (
    entrega_id uuid NOT NULL,
    contato_pedinte text NOT NULL,
    contato_voluntario text,
    CONSTRAINT entrega_contatos_contato_pedinte_check CHECK (((char_length(btrim(contato_pedinte)) >= 5) AND (char_length(btrim(contato_pedinte)) <= 120))),
    CONSTRAINT entrega_contatos_contato_voluntario_check CHECK (((contato_voluntario IS NULL) OR ((char_length(btrim(contato_voluntario)) >= 5) AND (char_length(btrim(contato_voluntario)) <= 120))))
);


--
-- Name: entregas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.entregas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sigla_casa text NOT NULL,
    item_id uuid,
    reserva_id uuid,
    descricao text NOT NULL,
    bairro text,
    referencia text,
    status text DEFAULT 'aberta'::text NOT NULL,
    voluntario uuid,
    voluntario_nome text,
    agendada_para timestamp with time zone,
    aberto boolean DEFAULT false NOT NULL,
    criado_por uuid NOT NULL,
    autor_nome text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT entregas_bairro_check CHECK (((bairro IS NULL) OR (char_length(btrim(bairro)) <= 120))),
    CONSTRAINT entregas_descricao_check CHECK (((char_length(btrim(descricao)) >= 5) AND (char_length(btrim(descricao)) <= 600))),
    CONSTRAINT entregas_referencia_check CHECK (((referencia IS NULL) OR (char_length(btrim(referencia)) <= 300))),
    CONSTRAINT entregas_status_check CHECK ((status = ANY (ARRAY['aberta'::text, 'assumida'::text, 'entregue'::text, 'cancelada'::text])))
);


--
-- Name: COLUMN entregas.referencia; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.entregas.referencia IS 'Ponto de referência do endereço. O endereço completo é combinado entre as duas pessoas pelo contato liberado, nunca publicado na lista.';


--
-- Name: evangelizacao_autorizados; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evangelizacao_autorizados (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sigla_casa text NOT NULL,
    user_id uuid NOT NULL,
    nome text,
    criado_por uuid DEFAULT auth.uid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: evangelizacao_avaliacoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evangelizacao_avaliacoes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sigla_casa text NOT NULL,
    crianca_id uuid NOT NULL,
    data_avaliacao date DEFAULT CURRENT_DATE NOT NULL,
    participacao smallint,
    convivencia smallint,
    assimilacao smallint,
    comentario text,
    criado_por uuid NOT NULL,
    autor_nome text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT evangelizacao_avaliacoes_assimilacao_check CHECK (((assimilacao >= 1) AND (assimilacao <= 5))),
    CONSTRAINT evangelizacao_avaliacoes_comentario_check CHECK (((comentario IS NULL) OR (char_length(btrim(comentario)) <= 2000))),
    CONSTRAINT evangelizacao_avaliacoes_convivencia_check CHECK (((convivencia >= 1) AND (convivencia <= 5))),
    CONSTRAINT evangelizacao_avaliacoes_participacao_check CHECK (((participacao >= 1) AND (participacao <= 5)))
);


--
-- Name: evangelizacao_criancas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evangelizacao_criancas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sigla_casa text NOT NULL,
    turma_id uuid,
    nome text NOT NULL,
    data_nascimento date NOT NULL,
    alergias text,
    medicamentos text,
    condicoes_saude text,
    observacoes text,
    autoriza_imagem boolean DEFAULT false NOT NULL,
    autoriza_passeio boolean DEFAULT false NOT NULL,
    pode_sair_sozinha boolean DEFAULT false NOT NULL,
    matriculada_em date DEFAULT CURRENT_DATE NOT NULL,
    ativa boolean DEFAULT true NOT NULL,
    criado_por uuid NOT NULL,
    autor_nome text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT evangelizacao_criancas_alergias_check CHECK (((alergias IS NULL) OR (char_length(btrim(alergias)) <= 1000))),
    CONSTRAINT evangelizacao_criancas_condicoes_saude_check CHECK (((condicoes_saude IS NULL) OR (char_length(btrim(condicoes_saude)) <= 1000))),
    CONSTRAINT evangelizacao_criancas_data_nascimento_check CHECK ((data_nascimento > '1950-01-01'::date)),
    CONSTRAINT evangelizacao_criancas_medicamentos_check CHECK (((medicamentos IS NULL) OR (char_length(btrim(medicamentos)) <= 1000))),
    CONSTRAINT evangelizacao_criancas_nome_check CHECK (((char_length(btrim(nome)) >= 2) AND (char_length(btrim(nome)) <= 160))),
    CONSTRAINT evangelizacao_criancas_observacoes_check CHECK (((observacoes IS NULL) OR (char_length(btrim(observacoes)) <= 2000)))
);


--
-- Name: evangelizacao_presencas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evangelizacao_presencas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sigla_casa text NOT NULL,
    crianca_id uuid NOT NULL,
    turma_id uuid,
    data_encontro date DEFAULT CURRENT_DATE NOT NULL,
    presente boolean DEFAULT true NOT NULL,
    observacao text,
    criado_por uuid NOT NULL,
    autor_nome text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT evangelizacao_presencas_observacao_check CHECK (((observacao IS NULL) OR (char_length(btrim(observacao)) <= 500)))
);


--
-- Name: evangelizacao_responsaveis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evangelizacao_responsaveis (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sigla_casa text NOT NULL,
    crianca_id uuid NOT NULL,
    nome text NOT NULL,
    parentesco text,
    telefone text NOT NULL,
    telefone_alternativo text,
    email text,
    principal boolean DEFAULT false NOT NULL,
    pode_retirar boolean DEFAULT true NOT NULL,
    observacao text,
    criado_por uuid NOT NULL,
    autor_nome text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT evangelizacao_responsaveis_email_check CHECK (((email IS NULL) OR (char_length(btrim(email)) <= 160))),
    CONSTRAINT evangelizacao_responsaveis_nome_check CHECK (((char_length(btrim(nome)) >= 2) AND (char_length(btrim(nome)) <= 160))),
    CONSTRAINT evangelizacao_responsaveis_observacao_check CHECK (((observacao IS NULL) OR (char_length(btrim(observacao)) <= 500))),
    CONSTRAINT evangelizacao_responsaveis_parentesco_check CHECK (((parentesco IS NULL) OR (char_length(btrim(parentesco)) <= 40))),
    CONSTRAINT evangelizacao_responsaveis_telefone_alternativo_check CHECK (((telefone_alternativo IS NULL) OR (char_length(btrim(telefone_alternativo)) <= 40))),
    CONSTRAINT evangelizacao_responsaveis_telefone_check CHECK (((char_length(btrim(telefone)) >= 8) AND (char_length(btrim(telefone)) <= 40)))
);


--
-- Name: evangelizacao_turmas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evangelizacao_turmas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sigla_casa text NOT NULL,
    nome text NOT NULL,
    faixa_etaria text DEFAULT 'mista'::text NOT NULL,
    dia_semana smallint,
    horario text,
    sala text,
    evangelizadores text,
    ativa boolean DEFAULT true NOT NULL,
    criado_por uuid NOT NULL,
    autor_nome text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT evangelizacao_turmas_dia_semana_check CHECK (((dia_semana >= 0) AND (dia_semana <= 6))),
    CONSTRAINT evangelizacao_turmas_evangelizadores_check CHECK (((evangelizadores IS NULL) OR (char_length(btrim(evangelizadores)) <= 200))),
    CONSTRAINT evangelizacao_turmas_faixa_etaria_check CHECK ((faixa_etaria = ANY (ARRAY['0-2'::text, '3-5'::text, '6-8'::text, '9-11'::text, '12-14'::text, '15-17'::text, 'mista'::text]))),
    CONSTRAINT evangelizacao_turmas_horario_check CHECK (((horario IS NULL) OR (char_length(btrim(horario)) <= 40))),
    CONSTRAINT evangelizacao_turmas_nome_check CHECK (((char_length(btrim(nome)) >= 2) AND (char_length(btrim(nome)) <= 80))),
    CONSTRAINT evangelizacao_turmas_sala_check CHECK (((sala IS NULL) OR (char_length(btrim(sala)) <= 60)))
);


--
-- Name: forum_respostas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.forum_respostas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    topico_id uuid NOT NULL,
    sigla_casa text NOT NULL,
    texto text NOT NULL,
    criado_por uuid NOT NULL,
    autor_nome text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT forum_respostas_texto_check CHECK (((char_length(btrim(texto)) >= 2) AND (char_length(btrim(texto)) <= 5000)))
);


--
-- Name: forum_topicos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.forum_topicos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sigla_casa text NOT NULL,
    titulo text NOT NULL,
    texto text NOT NULL,
    categoria text DEFAULT 'duvida'::text NOT NULL,
    aberto boolean DEFAULT false NOT NULL,
    resolvido boolean DEFAULT false NOT NULL,
    fixado boolean DEFAULT false NOT NULL,
    respostas integer DEFAULT 0 NOT NULL,
    ultima_resposta_em timestamp with time zone,
    criado_por uuid NOT NULL,
    autor_nome text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT forum_topicos_categoria_check CHECK ((categoria = ANY (ARRAY['duvida'::text, 'acolhimento'::text, 'estudo'::text, 'testemunho'::text]))),
    CONSTRAINT forum_topicos_texto_check CHECK (((char_length(btrim(texto)) >= 10) AND (char_length(btrim(texto)) <= 5000))),
    CONSTRAINT forum_topicos_titulo_check CHECK (((char_length(btrim(titulo)) >= 5) AND (char_length(btrim(titulo)) <= 160)))
);


--
-- Name: grupo_membros; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.grupo_membros (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    grupo_id uuid NOT NULL,
    sigla_casa text NOT NULL,
    user_id uuid NOT NULL,
    nome text NOT NULL,
    papel text DEFAULT 'membro'::text NOT NULL,
    adicionado_por uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT grupo_membros_papel_check CHECK ((papel = ANY (ARRAY['membro'::text, 'moderador'::text])))
);


--
-- Name: grupo_mensagens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.grupo_mensagens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    grupo_id uuid NOT NULL,
    sigla_casa text NOT NULL,
    texto text NOT NULL,
    criado_por uuid NOT NULL,
    autor_nome text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT grupo_mensagens_texto_check CHECK (((char_length(btrim(texto)) >= 1) AND (char_length(btrim(texto)) <= 2000)))
);


--
-- Name: grupos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.grupos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sigla_casa text NOT NULL,
    nome text NOT NULL,
    descricao text,
    atividade text,
    privado boolean DEFAULT false NOT NULL,
    aberto boolean DEFAULT false NOT NULL,
    criado_por uuid NOT NULL,
    autor_nome text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT grupos_atividade_check CHECK (((atividade IS NULL) OR (char_length(btrim(atividade)) <= 60))),
    CONSTRAINT grupos_descricao_check CHECK (((descricao IS NULL) OR (char_length(btrim(descricao)) <= 400))),
    CONSTRAINT grupos_nome_check CHECK (((char_length(btrim(nome)) >= 3) AND (char_length(btrim(nome)) <= 80)))
);


--
-- Name: jovens_membros; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.jovens_membros (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sigla_casa text NOT NULL,
    criado_por uuid NOT NULL,
    autor_nome text NOT NULL,
    apresentacao text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT jovens_membros_apresentacao_check CHECK (((apresentacao IS NULL) OR (char_length(btrim(apresentacao)) <= 300)))
);


--
-- Name: jovens_publicacoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.jovens_publicacoes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sigla_casa text NOT NULL,
    titulo text NOT NULL,
    texto text NOT NULL,
    categoria text DEFAULT 'conteudo'::text NOT NULL,
    link text,
    data_evento date,
    aberto boolean DEFAULT false NOT NULL,
    criado_por uuid NOT NULL,
    autor_nome text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT jovens_publicacoes_categoria_check CHECK ((categoria = ANY (ARRAY['conteudo'::text, 'evento'::text, 'convite'::text]))),
    CONSTRAINT jovens_publicacoes_link_check CHECK (((link IS NULL) OR (link ~* '^https?://'::text))),
    CONSTRAINT jovens_publicacoes_texto_check CHECK (((char_length(btrim(texto)) >= 10) AND (char_length(btrim(texto)) <= 5000))),
    CONSTRAINT jovens_publicacoes_titulo_check CHECK (((char_length(btrim(titulo)) >= 3) AND (char_length(btrim(titulo)) <= 160)))
);


--
-- Name: kanban_boards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kanban_boards (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sigla_casa text NOT NULL,
    nome text NOT NULL,
    ordem integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: kanban_comentarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kanban_comentarios (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    evento_id uuid NOT NULL,
    user_id uuid,
    autor_nome text NOT NULL,
    comentario text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: kanban_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kanban_config (
    sigla_casa text NOT NULL,
    board_background text DEFAULT 'bg-slate-50'::text NOT NULL,
    share_token uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: kanban_eventos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kanban_eventos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sigla_casa text NOT NULL,
    titulo text NOT NULL,
    descricao text,
    data date,
    responsavel text,
    status text DEFAULT 'ideia'::text NOT NULL,
    criador_id uuid,
    criador_nome text,
    created_at timestamp with time zone DEFAULT now(),
    lista_id uuid,
    labels text[] DEFAULT '{}'::text[] NOT NULL,
    membros_atribuidos text[] DEFAULT '{}'::text[] NOT NULL,
    prazo_concluido boolean DEFAULT false NOT NULL,
    anexos jsonb DEFAULT '[]'::jsonb NOT NULL,
    arquivado boolean DEFAULT false NOT NULL,
    ordem integer DEFAULT 0 NOT NULL,
    cover text,
    CONSTRAINT kanban_eventos_status_check CHECK ((status = ANY (ARRAY['ideia'::text, 'planejado'::text, 'em andamento'::text, 'realizado'::text])))
);


--
-- Name: kanban_frentes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kanban_frentes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sigla_casa text NOT NULL,
    board_id uuid NOT NULL,
    nome text NOT NULL,
    ordem integer DEFAULT 0 NOT NULL,
    membros text[] DEFAULT '{}'::text[] NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: kanban_grupos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kanban_grupos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    evento_id uuid NOT NULL,
    sigla_casa text NOT NULL,
    nome text NOT NULL,
    responsavel text,
    membros text[] DEFAULT '{}'::text[],
    ordem integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: kanban_listas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kanban_listas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sigla_casa text NOT NULL,
    nome text NOT NULL,
    ordem integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    board_id uuid,
    frente_id uuid
);


--
-- Name: kanban_tarefas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kanban_tarefas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    grupo_id uuid NOT NULL,
    sigla_casa text NOT NULL,
    titulo text NOT NULL,
    feito boolean DEFAULT false NOT NULL,
    responsavel text,
    prazo date,
    ordem integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: memoria_virtudes_custom; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.memoria_virtudes_custom (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sigla_casa text NOT NULL,
    nome text NOT NULL,
    imagem_url text,
    cor text DEFAULT 'bg-blue-100'::text NOT NULL,
    ordem integer DEFAULT 0 NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: mensagens_do_dia; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mensagens_do_dia (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    texto text NOT NULL,
    referencia text,
    autor_id uuid,
    autor_nome text NOT NULL,
    sigla_casa text,
    data_exibicao date,
    aprovada boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT mensagens_do_dia_referencia_check CHECK (((referencia IS NULL) OR (char_length(referencia) <= 500))),
    CONSTRAINT mensagens_do_dia_texto_check CHECK (((char_length(texto) >= 10) AND (char_length(texto) <= 1000)))
);


--
-- Name: musicas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.musicas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    artist text NOT NULL,
    audio_url text NOT NULL,
    is_exclusive boolean DEFAULT false NOT NULL,
    sigla_casa text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid
);


--
-- Name: oracao_horarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.oracao_horarios (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sigla_casa text NOT NULL,
    dia_semana smallint NOT NULL,
    hora smallint NOT NULL,
    minuto smallint DEFAULT 0 NOT NULL,
    intencao text,
    vagas smallint DEFAULT 0 NOT NULL,
    aberto boolean DEFAULT false NOT NULL,
    criado_por uuid NOT NULL,
    autor_nome text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT oracao_horarios_dia_semana_check CHECK (((dia_semana >= 0) AND (dia_semana <= 6))),
    CONSTRAINT oracao_horarios_hora_check CHECK (((hora >= 0) AND (hora <= 23))),
    CONSTRAINT oracao_horarios_intencao_check CHECK (((intencao IS NULL) OR (char_length(btrim(intencao)) <= 200))),
    CONSTRAINT oracao_horarios_minuto_check CHECK ((minuto = ANY (ARRAY[0, 30]))),
    CONSTRAINT oracao_horarios_vagas_check CHECK ((vagas >= 0))
);


--
-- Name: COLUMN oracao_horarios.dia_semana; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.oracao_horarios.dia_semana IS '0 = domingo, 6 = sábado.';


--
-- Name: COLUMN oracao_horarios.vagas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.oracao_horarios.vagas IS 'Zero significa sem limite de participantes.';


--
-- Name: oracao_inscricoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.oracao_inscricoes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    horario_id uuid NOT NULL,
    sigla_casa text NOT NULL,
    criado_por uuid NOT NULL,
    autor_nome text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: paginas_casas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.paginas_casas (
    sigla_casa text NOT NULL,
    nome_completo text DEFAULT ''::text NOT NULL,
    descricao text DEFAULT ''::text NOT NULL,
    missao text DEFAULT ''::text NOT NULL,
    ano_fundacao integer,
    endereco text DEFAULT ''::text NOT NULL,
    bairro text DEFAULT ''::text NOT NULL,
    cidade text DEFAULT ''::text NOT NULL,
    uf character(2) DEFAULT ''::bpchar NOT NULL,
    cep text DEFAULT ''::text NOT NULL,
    telefone text DEFAULT ''::text NOT NULL,
    email_contato text DEFAULT ''::text NOT NULL,
    site text DEFAULT ''::text NOT NULL,
    horarios jsonb DEFAULT '[]'::jsonb NOT NULL,
    chave_pix text DEFAULT ''::text NOT NULL,
    texto_doacao text DEFAULT 'Sua contribuição ajuda a manter os trabalhos espíritas. Qualquer valor é bem-vindo. Gratidão.'::text NOT NULL,
    publicada boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: painel_votes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.painel_votes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    item_key text NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: problem_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.problem_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    nome text,
    sigla_casa text,
    descricao text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    sigla_casa text,
    nome text,
    role text DEFAULT 'membro'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    uf character(2),
    cidade text,
    bairro text,
    cargo_principal text,
    atividades text[] DEFAULT '{}'::text[],
    aniversario_dia smallint,
    aniversario_mes smallint,
    CONSTRAINT profiles_aniversario_completo CHECK ((((aniversario_dia IS NULL) AND (aniversario_mes IS NULL)) OR ((aniversario_dia IS NOT NULL) AND (aniversario_mes IS NOT NULL)))),
    CONSTRAINT profiles_aniversario_dia_do_mes CHECK (((aniversario_mes IS NULL) OR (aniversario_dia <=
CASE
    WHEN (aniversario_mes = ANY (ARRAY[1, 3, 5, 7, 8, 10, 12])) THEN 31
    WHEN (aniversario_mes = 2) THEN 29
    ELSE 30
END))),
    CONSTRAINT profiles_aniversario_dia_valido CHECK (((aniversario_dia IS NULL) OR ((aniversario_dia >= 1) AND (aniversario_dia <= 31)))),
    CONSTRAINT profiles_aniversario_mes_valido CHECK (((aniversario_mes IS NULL) OR ((aniversario_mes >= 1) AND (aniversario_mes <= 12)))),
    CONSTRAINT profiles_role_check CHECK ((role = ANY (ARRAY['membro'::text, 'coordenador'::text, 'presidente'::text, 'admin'::text])))
);


--
-- Name: COLUMN profiles.aniversario_dia; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.profiles.aniversario_dia IS 'Dia do aniversário (1-31). Sem ano, de propósito.';


--
-- Name: COLUMN profiles.aniversario_mes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.profiles.aniversario_mes IS 'Mês do aniversário (1-12). Preencher é consentir em aparecer no calendário da casa.';


--
-- Name: profiles_public; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.profiles_public WITH (security_invoker='true') AS
 SELECT id,
    nome,
    sigla_casa,
    uf,
    cidade
   FROM public.profiles;


--
-- Name: VIEW profiles_public; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.profiles_public IS 'Visão pública de membros: expõe apenas nome, sigla_casa, uf, cidade. Cargo e atividades são privados.';


--
-- Name: programacao_eventos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.programacao_eventos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sigla_casa text NOT NULL,
    titulo text NOT NULL,
    descricao text,
    data_evento date NOT NULL,
    hora_inicio time without time zone,
    hora_fim time without time zone,
    local_evento text,
    publica boolean DEFAULT true NOT NULL,
    criado_por uuid,
    criado_por_nome text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT programacao_eventos_titulo_check CHECK (((char_length(titulo) >= 2) AND (char_length(titulo) <= 200)))
);


--
-- Name: programacao_participantes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.programacao_participantes (
    evento_id uuid NOT NULL,
    user_id uuid NOT NULL,
    status text DEFAULT 'convidado'::text NOT NULL,
    adicionado_por uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT programacao_participantes_status_check CHECK ((status = ANY (ARRAY['convidado'::text, 'confirmado'::text, 'recusou'::text])))
);


--
-- Name: publicacoes_casa; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.publicacoes_casa (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sigla_casa text NOT NULL,
    autor_id uuid,
    autor_nome text NOT NULL,
    conteudo text NOT NULL,
    fixado boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    imagem_url text,
    video_url text,
    editado_em timestamp with time zone,
    CONSTRAINT publicacoes_casa_conteudo_check CHECK (((char_length(conteudo) >= 1) AND (char_length(conteudo) <= 2000)))
);


--
-- Name: siglas_casas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.siglas_casas (
    sigla text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT siglas_casas_sigla_check CHECK ((sigla ~ '^[A-Z]{2,6}$'::text))
);


--
-- Name: site_suggestions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.site_suggestions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    suggestion text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: solicitacoes_dev; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.solicitacoes_dev (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    titulo text NOT NULL,
    descricao text,
    created_at timestamp with time zone DEFAULT now(),
    status text DEFAULT 'pendente'::text NOT NULL,
    resposta_dev text,
    atualizado_em timestamp with time zone,
    CONSTRAINT solicitacoes_dev_status_check CHECK ((status = ANY (ARRAY['pendente'::text, 'andamento'::text, 'concluida'::text, 'recusada'::text])))
);


--
-- Name: tesouraria_autorizacoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tesouraria_autorizacoes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sigla_casa text NOT NULL,
    user_id uuid NOT NULL,
    autorizado_por uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: tesouraria_transacoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tesouraria_transacoes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sigla_casa text NOT NULL,
    tipo text NOT NULL,
    categoria text NOT NULL,
    descricao text NOT NULL,
    valor numeric(12,2) NOT NULL,
    data date DEFAULT CURRENT_DATE NOT NULL,
    observacao text,
    criador_id uuid,
    criador_nome text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT tesouraria_transacoes_tipo_check CHECK ((tipo = ANY (ARRAY['receita'::text, 'despesa'::text]))),
    CONSTRAINT tesouraria_transacoes_valor_check CHECK ((valor > (0)::numeric))
);


--
-- Name: usuarios_sancoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuarios_sancoes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    tipo text NOT NULL,
    inicio timestamp with time zone DEFAULT now() NOT NULL,
    fim timestamp with time zone,
    motivo text NOT NULL,
    aplicada_por uuid NOT NULL,
    revogada_em timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT motivo_obrigatorio_na_sancao CHECK ((length(TRIM(BOTH FROM motivo)) >= 10)),
    CONSTRAINT usuarios_sancoes_tipo_check CHECK ((tipo = ANY (ARRAY['suspensao'::text, 'banimento'::text])))
);


--
-- Name: voluntariado_candidaturas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.voluntariado_candidaturas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    necessidade_id uuid NOT NULL,
    sigla_casa text NOT NULL,
    mensagem text,
    status text DEFAULT 'pendente'::text NOT NULL,
    criado_por uuid NOT NULL,
    autor_nome text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT voluntariado_candidaturas_mensagem_check CHECK (((mensagem IS NULL) OR (char_length(btrim(mensagem)) <= 600))),
    CONSTRAINT voluntariado_candidaturas_status_check CHECK ((status = ANY (ARRAY['pendente'::text, 'aceita'::text, 'recusada'::text])))
);


--
-- Name: voluntariado_necessidades; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.voluntariado_necessidades (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sigla_casa text NOT NULL,
    titulo text NOT NULL,
    descricao text NOT NULL,
    habilidades text[] DEFAULT '{}'::text[] NOT NULL,
    urgencia text DEFAULT 'media'::text NOT NULL,
    prazo date,
    atendida boolean DEFAULT false NOT NULL,
    aberto boolean DEFAULT false NOT NULL,
    criado_por uuid NOT NULL,
    autor_nome text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT voluntariado_necessidades_descricao_check CHECK (((char_length(btrim(descricao)) >= 10) AND (char_length(btrim(descricao)) <= 2000))),
    CONSTRAINT voluntariado_necessidades_titulo_check CHECK (((char_length(btrim(titulo)) >= 5) AND (char_length(btrim(titulo)) <= 160))),
    CONSTRAINT voluntariado_necessidades_urgencia_check CHECK ((urgencia = ANY (ARRAY['baixa'::text, 'media'::text, 'alta'::text])))
);


--
-- Name: voluntariado_ofertas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.voluntariado_ofertas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sigla_casa text NOT NULL,
    habilidades text[] DEFAULT '{}'::text[] NOT NULL,
    disponibilidade text,
    observacao text,
    ativa boolean DEFAULT true NOT NULL,
    aberto boolean DEFAULT false NOT NULL,
    criado_por uuid NOT NULL,
    autor_nome text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT voluntariado_ofertas_disponibilidade_check CHECK (((disponibilidade IS NULL) OR (char_length(btrim(disponibilidade)) <= 200))),
    CONSTRAINT voluntariado_ofertas_observacao_check CHECK (((observacao IS NULL) OR (char_length(btrim(observacao)) <= 600)))
);


--
-- Name: administradores_pagina administradores_pagina_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.administradores_pagina
    ADD CONSTRAINT administradores_pagina_pkey PRIMARY KEY (sigla_casa, user_id);


--
-- Name: agenda_eventos agenda_eventos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agenda_eventos
    ADD CONSTRAINT agenda_eventos_pkey PRIMARY KEY (id);


--
-- Name: agenda_participantes agenda_participantes_evento_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agenda_participantes
    ADD CONSTRAINT agenda_participantes_evento_id_user_id_key UNIQUE (evento_id, user_id);


--
-- Name: agenda_participantes agenda_participantes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agenda_participantes
    ADD CONSTRAINT agenda_participantes_pkey PRIMARY KEY (id);


--
-- Name: apresentacao_perguntas apresentacao_perguntas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.apresentacao_perguntas
    ADD CONSTRAINT apresentacao_perguntas_pkey PRIMARY KEY (id);


--
-- Name: apresentacao_sessoes apresentacao_sessoes_codigo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.apresentacao_sessoes
    ADD CONSTRAINT apresentacao_sessoes_codigo_key UNIQUE (codigo);


--
-- Name: apresentacao_sessoes apresentacao_sessoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.apresentacao_sessoes
    ADD CONSTRAINT apresentacao_sessoes_pkey PRIMARY KEY (id);


--
-- Name: apresentacoes apresentacoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.apresentacoes
    ADD CONSTRAINT apresentacoes_pkey PRIMARY KEY (id);


--
-- Name: artigo_avaliacoes artigo_avaliacoes_artigo_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artigo_avaliacoes
    ADD CONSTRAINT artigo_avaliacoes_artigo_id_user_id_key UNIQUE (artigo_id, user_id);


--
-- Name: artigo_avaliacoes artigo_avaliacoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artigo_avaliacoes
    ADD CONSTRAINT artigo_avaliacoes_pkey PRIMARY KEY (id);


--
-- Name: artigo_revisoes artigo_revisoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artigo_revisoes
    ADD CONSTRAINT artigo_revisoes_pkey PRIMARY KEY (id);


--
-- Name: artigos artigos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artigos
    ADD CONSTRAINT artigos_pkey PRIMARY KEY (id);


--
-- Name: artigos artigos_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artigos
    ADD CONSTRAINT artigos_slug_key UNIQUE (slug);


--
-- Name: atendimento_acessos atendimento_acessos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atendimento_acessos
    ADD CONSTRAINT atendimento_acessos_pkey PRIMARY KEY (id);


--
-- Name: atendimento_autorizados atendimento_autorizados_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atendimento_autorizados
    ADD CONSTRAINT atendimento_autorizados_pkey PRIMARY KEY (id);


--
-- Name: atendimento_autorizados atendimento_autorizados_sigla_casa_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atendimento_autorizados
    ADD CONSTRAINT atendimento_autorizados_sigla_casa_user_id_key UNIQUE (sigla_casa, user_id);


--
-- Name: atendimento_fichas atendimento_fichas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atendimento_fichas
    ADD CONSTRAINT atendimento_fichas_pkey PRIMARY KEY (id);


--
-- Name: avisos_enviados avisos_enviados_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avisos_enviados
    ADD CONSTRAINT avisos_enviados_pkey PRIMARY KEY (id);


--
-- Name: avisos_enviados avisos_enviados_tipo_referencia_destinatario_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avisos_enviados
    ADD CONSTRAINT avisos_enviados_tipo_referencia_destinatario_key UNIQUE (tipo, referencia, destinatario);


--
-- Name: avisos_preferencias avisos_preferencias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avisos_preferencias
    ADD CONSTRAINT avisos_preferencias_pkey PRIMARY KEY (user_id);


--
-- Name: bazar_contatos bazar_contatos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bazar_contatos
    ADD CONSTRAINT bazar_contatos_pkey PRIMARY KEY (item_id);


--
-- Name: bazar_itens bazar_itens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bazar_itens
    ADD CONSTRAINT bazar_itens_pkey PRIMARY KEY (id);


--
-- Name: bazar_reservas bazar_reservas_item_id_criado_por_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bazar_reservas
    ADD CONSTRAINT bazar_reservas_item_id_criado_por_key UNIQUE (item_id, criado_por);


--
-- Name: bazar_reservas bazar_reservas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bazar_reservas
    ADD CONSTRAINT bazar_reservas_pkey PRIMARY KEY (id);


--
-- Name: carona_contatos carona_contatos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carona_contatos
    ADD CONSTRAINT carona_contatos_pkey PRIMARY KEY (carona_id);


--
-- Name: carona_pedidos carona_pedidos_carona_id_criado_por_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carona_pedidos
    ADD CONSTRAINT carona_pedidos_carona_id_criado_por_key UNIQUE (carona_id, criado_por);


--
-- Name: carona_pedidos carona_pedidos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carona_pedidos
    ADD CONSTRAINT carona_pedidos_pkey PRIMARY KEY (id);


--
-- Name: caronas caronas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.caronas
    ADD CONSTRAINT caronas_pkey PRIMARY KEY (id);


--
-- Name: casas_convites casas_convites_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.casas_convites
    ADD CONSTRAINT casas_convites_email_key UNIQUE (email);


--
-- Name: casas_convites casas_convites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.casas_convites
    ADD CONSTRAINT casas_convites_pkey PRIMARY KEY (id);


--
-- Name: casas_espirita casas_espirita_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.casas_espirita
    ADD CONSTRAINT casas_espirita_pkey PRIMARY KEY (id);


--
-- Name: casas_pedidos_remocao casas_pedidos_remocao_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.casas_pedidos_remocao
    ADD CONSTRAINT casas_pedidos_remocao_pkey PRIMARY KEY (id);


--
-- Name: casas_reivindicacoes casas_reivindicacoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.casas_reivindicacoes
    ADD CONSTRAINT casas_reivindicacoes_pkey PRIMARY KEY (id);


--
-- Name: convite_config convite_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.convite_config
    ADD CONSTRAINT convite_config_pkey PRIMARY KEY (id);


--
-- Name: entrega_contatos entrega_contatos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entrega_contatos
    ADD CONSTRAINT entrega_contatos_pkey PRIMARY KEY (entrega_id);


--
-- Name: entregas entregas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entregas
    ADD CONSTRAINT entregas_pkey PRIMARY KEY (id);


--
-- Name: evangelizacao_autorizados evangelizacao_autorizados_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evangelizacao_autorizados
    ADD CONSTRAINT evangelizacao_autorizados_pkey PRIMARY KEY (id);


--
-- Name: evangelizacao_autorizados evangelizacao_autorizados_sigla_casa_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evangelizacao_autorizados
    ADD CONSTRAINT evangelizacao_autorizados_sigla_casa_user_id_key UNIQUE (sigla_casa, user_id);


--
-- Name: evangelizacao_avaliacoes evangelizacao_avaliacoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evangelizacao_avaliacoes
    ADD CONSTRAINT evangelizacao_avaliacoes_pkey PRIMARY KEY (id);


--
-- Name: evangelizacao_criancas evangelizacao_criancas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evangelizacao_criancas
    ADD CONSTRAINT evangelizacao_criancas_pkey PRIMARY KEY (id);


--
-- Name: evangelizacao_presencas evangelizacao_presencas_crianca_id_data_encontro_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evangelizacao_presencas
    ADD CONSTRAINT evangelizacao_presencas_crianca_id_data_encontro_key UNIQUE (crianca_id, data_encontro);


--
-- Name: evangelizacao_presencas evangelizacao_presencas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evangelizacao_presencas
    ADD CONSTRAINT evangelizacao_presencas_pkey PRIMARY KEY (id);


--
-- Name: evangelizacao_responsaveis evangelizacao_responsaveis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evangelizacao_responsaveis
    ADD CONSTRAINT evangelizacao_responsaveis_pkey PRIMARY KEY (id);


--
-- Name: evangelizacao_turmas evangelizacao_turmas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evangelizacao_turmas
    ADD CONSTRAINT evangelizacao_turmas_pkey PRIMARY KEY (id);


--
-- Name: forum_respostas forum_respostas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forum_respostas
    ADD CONSTRAINT forum_respostas_pkey PRIMARY KEY (id);


--
-- Name: forum_topicos forum_topicos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forum_topicos
    ADD CONSTRAINT forum_topicos_pkey PRIMARY KEY (id);


--
-- Name: grupo_membros grupo_membros_grupo_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grupo_membros
    ADD CONSTRAINT grupo_membros_grupo_id_user_id_key UNIQUE (grupo_id, user_id);


--
-- Name: grupo_membros grupo_membros_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grupo_membros
    ADD CONSTRAINT grupo_membros_pkey PRIMARY KEY (id);


--
-- Name: grupo_mensagens grupo_mensagens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grupo_mensagens
    ADD CONSTRAINT grupo_mensagens_pkey PRIMARY KEY (id);


--
-- Name: grupos grupos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grupos
    ADD CONSTRAINT grupos_pkey PRIMARY KEY (id);


--
-- Name: jovens_membros jovens_membros_criado_por_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jovens_membros
    ADD CONSTRAINT jovens_membros_criado_por_key UNIQUE (criado_por);


--
-- Name: jovens_membros jovens_membros_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jovens_membros
    ADD CONSTRAINT jovens_membros_pkey PRIMARY KEY (id);


--
-- Name: jovens_publicacoes jovens_publicacoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jovens_publicacoes
    ADD CONSTRAINT jovens_publicacoes_pkey PRIMARY KEY (id);


--
-- Name: kanban_boards kanban_boards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kanban_boards
    ADD CONSTRAINT kanban_boards_pkey PRIMARY KEY (id);


--
-- Name: kanban_comentarios kanban_comentarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kanban_comentarios
    ADD CONSTRAINT kanban_comentarios_pkey PRIMARY KEY (id);


--
-- Name: kanban_config kanban_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kanban_config
    ADD CONSTRAINT kanban_config_pkey PRIMARY KEY (sigla_casa);


--
-- Name: kanban_eventos kanban_eventos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kanban_eventos
    ADD CONSTRAINT kanban_eventos_pkey PRIMARY KEY (id);


--
-- Name: kanban_frentes kanban_frentes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kanban_frentes
    ADD CONSTRAINT kanban_frentes_pkey PRIMARY KEY (id);


--
-- Name: kanban_grupos kanban_grupos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kanban_grupos
    ADD CONSTRAINT kanban_grupos_pkey PRIMARY KEY (id);


--
-- Name: kanban_listas kanban_listas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kanban_listas
    ADD CONSTRAINT kanban_listas_pkey PRIMARY KEY (id);


--
-- Name: kanban_tarefas kanban_tarefas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kanban_tarefas
    ADD CONSTRAINT kanban_tarefas_pkey PRIMARY KEY (id);


--
-- Name: memoria_virtudes_custom memoria_virtudes_custom_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.memoria_virtudes_custom
    ADD CONSTRAINT memoria_virtudes_custom_pkey PRIMARY KEY (id);


--
-- Name: mensagens_do_dia mensagens_do_dia_data_exibicao_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mensagens_do_dia
    ADD CONSTRAINT mensagens_do_dia_data_exibicao_key UNIQUE (data_exibicao);


--
-- Name: mensagens_do_dia mensagens_do_dia_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mensagens_do_dia
    ADD CONSTRAINT mensagens_do_dia_pkey PRIMARY KEY (id);


--
-- Name: musicas musicas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.musicas
    ADD CONSTRAINT musicas_pkey PRIMARY KEY (id);


--
-- Name: oracao_horarios oracao_horarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oracao_horarios
    ADD CONSTRAINT oracao_horarios_pkey PRIMARY KEY (id);


--
-- Name: oracao_horarios oracao_horarios_sigla_casa_dia_semana_hora_minuto_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oracao_horarios
    ADD CONSTRAINT oracao_horarios_sigla_casa_dia_semana_hora_minuto_key UNIQUE (sigla_casa, dia_semana, hora, minuto);


--
-- Name: oracao_inscricoes oracao_inscricoes_horario_id_criado_por_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oracao_inscricoes
    ADD CONSTRAINT oracao_inscricoes_horario_id_criado_por_key UNIQUE (horario_id, criado_por);


--
-- Name: oracao_inscricoes oracao_inscricoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oracao_inscricoes
    ADD CONSTRAINT oracao_inscricoes_pkey PRIMARY KEY (id);


--
-- Name: paginas_casas paginas_casas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paginas_casas
    ADD CONSTRAINT paginas_casas_pkey PRIMARY KEY (sigla_casa);


--
-- Name: painel_votes painel_votes_item_key_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.painel_votes
    ADD CONSTRAINT painel_votes_item_key_user_id_key UNIQUE (item_key, user_id);


--
-- Name: painel_votes painel_votes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.painel_votes
    ADD CONSTRAINT painel_votes_pkey PRIMARY KEY (id);


--
-- Name: problem_reports problem_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.problem_reports
    ADD CONSTRAINT problem_reports_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: programacao_eventos programacao_eventos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.programacao_eventos
    ADD CONSTRAINT programacao_eventos_pkey PRIMARY KEY (id);


--
-- Name: programacao_participantes programacao_participantes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.programacao_participantes
    ADD CONSTRAINT programacao_participantes_pkey PRIMARY KEY (evento_id, user_id);


--
-- Name: publicacoes_casa publicacoes_casa_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.publicacoes_casa
    ADD CONSTRAINT publicacoes_casa_pkey PRIMARY KEY (id);


--
-- Name: siglas_casas siglas_casas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.siglas_casas
    ADD CONSTRAINT siglas_casas_pkey PRIMARY KEY (sigla);


--
-- Name: site_suggestions site_suggestions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_suggestions
    ADD CONSTRAINT site_suggestions_pkey PRIMARY KEY (id);


--
-- Name: solicitacoes_dev solicitacoes_dev_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitacoes_dev
    ADD CONSTRAINT solicitacoes_dev_pkey PRIMARY KEY (id);


--
-- Name: tesouraria_autorizacoes tesouraria_autorizacoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tesouraria_autorizacoes
    ADD CONSTRAINT tesouraria_autorizacoes_pkey PRIMARY KEY (id);


--
-- Name: tesouraria_autorizacoes tesouraria_autorizacoes_sigla_casa_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tesouraria_autorizacoes
    ADD CONSTRAINT tesouraria_autorizacoes_sigla_casa_user_id_key UNIQUE (sigla_casa, user_id);


--
-- Name: tesouraria_transacoes tesouraria_transacoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tesouraria_transacoes
    ADD CONSTRAINT tesouraria_transacoes_pkey PRIMARY KEY (id);


--
-- Name: usuarios_sancoes usuarios_sancoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios_sancoes
    ADD CONSTRAINT usuarios_sancoes_pkey PRIMARY KEY (id);


--
-- Name: voluntariado_candidaturas voluntariado_candidaturas_necessidade_id_criado_por_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.voluntariado_candidaturas
    ADD CONSTRAINT voluntariado_candidaturas_necessidade_id_criado_por_key UNIQUE (necessidade_id, criado_por);


--
-- Name: voluntariado_candidaturas voluntariado_candidaturas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.voluntariado_candidaturas
    ADD CONSTRAINT voluntariado_candidaturas_pkey PRIMARY KEY (id);


--
-- Name: voluntariado_necessidades voluntariado_necessidades_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.voluntariado_necessidades
    ADD CONSTRAINT voluntariado_necessidades_pkey PRIMARY KEY (id);


--
-- Name: voluntariado_ofertas voluntariado_ofertas_criado_por_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.voluntariado_ofertas
    ADD CONSTRAINT voluntariado_ofertas_criado_por_key UNIQUE (criado_por);


--
-- Name: voluntariado_ofertas voluntariado_ofertas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.voluntariado_ofertas
    ADD CONSTRAINT voluntariado_ofertas_pkey PRIMARY KEY (id);


--
-- Name: apresentacoes_da_casa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX apresentacoes_da_casa ON public.apresentacoes USING btree (sigla_casa, created_at DESC);


--
-- Name: artigo_avaliacoes_artigo_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX artigo_avaliacoes_artigo_idx ON public.artigo_avaliacoes USING btree (artigo_id);


--
-- Name: artigo_revisoes_abertas_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX artigo_revisoes_abertas_idx ON public.artigo_revisoes USING btree (estado, aberta_em DESC);


--
-- Name: artigos_autor_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX artigos_autor_idx ON public.artigos USING btree (autor_id);


--
-- Name: artigos_estado_publicado_em_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX artigos_estado_publicado_em_idx ON public.artigos USING btree (estado, publicado_em DESC);


--
-- Name: artigos_sigla_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX artigos_sigla_idx ON public.artigos USING btree (autor_sigla_casa);


--
-- Name: atendimento_acessos_ficha_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX atendimento_acessos_ficha_idx ON public.atendimento_acessos USING btree (ficha_id, created_at DESC);


--
-- Name: atendimento_fichas_casa_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX atendimento_fichas_casa_idx ON public.atendimento_fichas USING btree (sigla_casa, data_atendimento DESC);


--
-- Name: bazar_itens_casa_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX bazar_itens_casa_idx ON public.bazar_itens USING btree (sigla_casa, disponivel, created_at DESC);


--
-- Name: bazar_reservas_item_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX bazar_reservas_item_idx ON public.bazar_reservas USING btree (item_id);


--
-- Name: carona_pedidos_carona_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX carona_pedidos_carona_idx ON public.carona_pedidos USING btree (carona_id);


--
-- Name: caronas_casa_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX caronas_casa_idx ON public.caronas USING btree (sigla_casa, data, hora);


--
-- Name: casas_convites_pendentes; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX casas_convites_pendentes ON public.casas_convites USING btree (status) WHERE (status = 'pendente'::text);


--
-- Name: casas_espirita_nome_cidade_estado_uq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX casas_espirita_nome_cidade_estado_uq ON public.casas_espirita USING btree (lower(nome), cidade, estado);


--
-- Name: casas_espirita_sigla_cidade_estado_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX casas_espirita_sigla_cidade_estado_key ON public.casas_espirita USING btree (sigla, cidade, estado) WHERE (sigla IS NOT NULL);


--
-- Name: entregas_casa_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX entregas_casa_idx ON public.entregas USING btree (sigla_casa, status, created_at DESC);


--
-- Name: evangelizacao_avaliacoes_crianca_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX evangelizacao_avaliacoes_crianca_idx ON public.evangelizacao_avaliacoes USING btree (crianca_id, data_avaliacao DESC);


--
-- Name: evangelizacao_criancas_casa_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX evangelizacao_criancas_casa_idx ON public.evangelizacao_criancas USING btree (sigla_casa, ativa, nome);


--
-- Name: evangelizacao_criancas_turma_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX evangelizacao_criancas_turma_idx ON public.evangelizacao_criancas USING btree (turma_id);


--
-- Name: evangelizacao_presencas_casa_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX evangelizacao_presencas_casa_idx ON public.evangelizacao_presencas USING btree (sigla_casa, data_encontro DESC);


--
-- Name: evangelizacao_responsaveis_crianca_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX evangelizacao_responsaveis_crianca_idx ON public.evangelizacao_responsaveis USING btree (crianca_id, principal DESC);


--
-- Name: evangelizacao_turmas_casa_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX evangelizacao_turmas_casa_idx ON public.evangelizacao_turmas USING btree (sigla_casa, ativa, nome);


--
-- Name: forum_respostas_topico_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX forum_respostas_topico_idx ON public.forum_respostas USING btree (topico_id, created_at);


--
-- Name: forum_topicos_casa_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX forum_topicos_casa_idx ON public.forum_topicos USING btree (sigla_casa, fixado DESC, created_at DESC);


--
-- Name: grupo_membros_usuario_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX grupo_membros_usuario_idx ON public.grupo_membros USING btree (user_id);


--
-- Name: grupo_mensagens_grupo_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX grupo_mensagens_grupo_idx ON public.grupo_mensagens USING btree (grupo_id, created_at);


--
-- Name: idx_administradores_pagina_adicionado_por; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_administradores_pagina_adicionado_por ON public.administradores_pagina USING btree (adicionado_por);


--
-- Name: idx_administradores_pagina_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_administradores_pagina_user_id ON public.administradores_pagina USING btree (user_id);


--
-- Name: idx_agenda_eventos_criador_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agenda_eventos_criador_id ON public.agenda_eventos USING btree (criador_id);


--
-- Name: idx_agenda_eventos_sigla_casa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agenda_eventos_sigla_casa ON public.agenda_eventos USING btree (sigla_casa);


--
-- Name: idx_agenda_participantes_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agenda_participantes_user_id ON public.agenda_participantes USING btree (user_id);


--
-- Name: idx_apresentacao_sessoes_apresentacao_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_apresentacao_sessoes_apresentacao_id ON public.apresentacao_sessoes USING btree (apresentacao_id);


--
-- Name: idx_apresentacao_sessoes_iniciada_por; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_apresentacao_sessoes_iniciada_por ON public.apresentacao_sessoes USING btree (iniciada_por);


--
-- Name: idx_apresentacoes_criado_por; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_apresentacoes_criado_por ON public.apresentacoes USING btree (criado_por);


--
-- Name: idx_artigo_avaliacoes_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_artigo_avaliacoes_user_id ON public.artigo_avaliacoes USING btree (user_id);


--
-- Name: idx_artigo_revisoes_artigo_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_artigo_revisoes_artigo_id ON public.artigo_revisoes USING btree (artigo_id);


--
-- Name: idx_artigo_revisoes_decidida_por; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_artigo_revisoes_decidida_por ON public.artigo_revisoes USING btree (decidida_por);


--
-- Name: idx_artigos_retirado_por_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_artigos_retirado_por_user_id ON public.artigos USING btree (retirado_por_user_id);


--
-- Name: idx_casas_convites_casa_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_casas_convites_casa_id ON public.casas_convites USING btree (casa_id);


--
-- Name: idx_casas_convites_provedor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_casas_convites_provedor_id ON public.casas_convites USING btree (provedor_id);


--
-- Name: idx_casas_pedidos_remocao_casa_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_casas_pedidos_remocao_casa_id ON public.casas_pedidos_remocao USING btree (casa_id);


--
-- Name: idx_casas_reivindicacoes_casa_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_casas_reivindicacoes_casa_id ON public.casas_reivindicacoes USING btree (casa_id);


--
-- Name: idx_entregas_item_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_entregas_item_id ON public.entregas USING btree (item_id);


--
-- Name: idx_entregas_reserva_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_entregas_reserva_id ON public.entregas USING btree (reserva_id);


--
-- Name: idx_evangelizacao_presencas_turma_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_evangelizacao_presencas_turma_id ON public.evangelizacao_presencas USING btree (turma_id);


--
-- Name: idx_kanban_comentarios_evento_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kanban_comentarios_evento_id ON public.kanban_comentarios USING btree (evento_id);


--
-- Name: idx_kanban_comentarios_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kanban_comentarios_user_id ON public.kanban_comentarios USING btree (user_id);


--
-- Name: idx_kanban_eventos_criador_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kanban_eventos_criador_id ON public.kanban_eventos USING btree (criador_id);


--
-- Name: idx_kanban_eventos_lista_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kanban_eventos_lista_id ON public.kanban_eventos USING btree (lista_id);


--
-- Name: idx_kanban_frentes_board; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kanban_frentes_board ON public.kanban_frentes USING btree (board_id);


--
-- Name: idx_kanban_grupos_evento_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kanban_grupos_evento_id ON public.kanban_grupos USING btree (evento_id);


--
-- Name: idx_kanban_listas_board_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kanban_listas_board_id ON public.kanban_listas USING btree (board_id);


--
-- Name: idx_kanban_listas_frente; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kanban_listas_frente ON public.kanban_listas USING btree (frente_id);


--
-- Name: idx_kanban_listas_sigla_casa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kanban_listas_sigla_casa ON public.kanban_listas USING btree (sigla_casa);


--
-- Name: idx_kanban_tarefas_grupo_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kanban_tarefas_grupo_id ON public.kanban_tarefas USING btree (grupo_id);


--
-- Name: idx_memoria_virtudes_sigla; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_memoria_virtudes_sigla ON public.memoria_virtudes_custom USING btree (sigla_casa);


--
-- Name: idx_mensagens_do_dia_autor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mensagens_do_dia_autor_id ON public.mensagens_do_dia USING btree (autor_id);


--
-- Name: idx_musicas_sigla_casa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_musicas_sigla_casa ON public.musicas USING btree (sigla_casa);


--
-- Name: idx_musicas_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_musicas_user_id ON public.musicas USING btree (user_id);


--
-- Name: idx_painel_votes_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_painel_votes_user_id ON public.painel_votes USING btree (user_id);


--
-- Name: idx_problem_reports_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_problem_reports_user_id ON public.problem_reports USING btree (user_id);


--
-- Name: idx_programacao_eventos_criado_por; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_programacao_eventos_criado_por ON public.programacao_eventos USING btree (criado_por);


--
-- Name: idx_programacao_eventos_sigla_casa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_programacao_eventos_sigla_casa ON public.programacao_eventos USING btree (sigla_casa);


--
-- Name: idx_programacao_participantes_adicionado_por; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_programacao_participantes_adicionado_por ON public.programacao_participantes USING btree (adicionado_por);


--
-- Name: idx_programacao_participantes_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_programacao_participantes_user_id ON public.programacao_participantes USING btree (user_id);


--
-- Name: idx_publicacoes_casa_autor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_publicacoes_casa_autor_id ON public.publicacoes_casa USING btree (autor_id);


--
-- Name: idx_publicacoes_casa_sigla_casa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_publicacoes_casa_sigla_casa ON public.publicacoes_casa USING btree (sigla_casa);


--
-- Name: idx_solicitacoes_dev_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_solicitacoes_dev_user_id ON public.solicitacoes_dev USING btree (user_id);


--
-- Name: idx_tes_autoriz_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tes_autoriz_user ON public.tesouraria_autorizacoes USING btree (user_id);


--
-- Name: idx_tesouraria_transacoes_criador_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tesouraria_transacoes_criador_id ON public.tesouraria_transacoes USING btree (criador_id);


--
-- Name: idx_tesouraria_transacoes_sigla_casa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tesouraria_transacoes_sigla_casa ON public.tesouraria_transacoes USING btree (sigla_casa);


--
-- Name: idx_usuarios_sancoes_aplicada_por; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_usuarios_sancoes_aplicada_por ON public.usuarios_sancoes USING btree (aplicada_por);


--
-- Name: jovens_publicacoes_casa_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX jovens_publicacoes_casa_idx ON public.jovens_publicacoes USING btree (sigla_casa, created_at DESC);


--
-- Name: oracao_inscricoes_horario_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX oracao_inscricoes_horario_idx ON public.oracao_inscricoes USING btree (horario_id);


--
-- Name: perguntas_da_sessao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX perguntas_da_sessao ON public.apresentacao_perguntas USING btree (sessao_id, created_at);


--
-- Name: profiles_aniversario_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX profiles_aniversario_idx ON public.profiles USING btree (sigla_casa, aniversario_mes, aniversario_dia) WHERE (aniversario_mes IS NOT NULL);


--
-- Name: sessoes_ativas; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sessoes_ativas ON public.apresentacao_sessoes USING btree (codigo) WHERE ativa;


--
-- Name: usuarios_sancoes_vigentes_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX usuarios_sancoes_vigentes_idx ON public.usuarios_sancoes USING btree (user_id) WHERE (revogada_em IS NULL);


--
-- Name: voluntariado_necessidades_casa_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX voluntariado_necessidades_casa_idx ON public.voluntariado_necessidades USING btree (sigla_casa, atendida, created_at DESC);


--
-- Name: artigo_avaliacoes artigo_avaliacoes_carimbo_nome; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER artigo_avaliacoes_carimbo_nome BEFORE INSERT OR UPDATE ON public.artigo_avaliacoes FOR EACH ROW EXECUTE FUNCTION public.artigo_avaliacao_carimbar_nome();


--
-- Name: artigo_avaliacoes artigo_avaliacoes_reconta; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER artigo_avaliacoes_reconta AFTER INSERT OR DELETE OR UPDATE ON public.artigo_avaliacoes FOR EACH ROW EXECUTE FUNCTION public.artigo_recontar();


--
-- Name: artigos artigos_carimbo_identidade; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER artigos_carimbo_identidade BEFORE INSERT OR UPDATE ON public.artigos FOR EACH ROW EXECUTE FUNCTION public.artigo_carimbar_identidade();


--
-- Name: artigos artigos_transicao; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER artigos_transicao BEFORE UPDATE ON public.artigos FOR EACH ROW EXECUTE FUNCTION public.artigo_transicao_valida();


--
-- Name: atendimento_fichas atendimento_fichas_autor; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER atendimento_fichas_autor BEFORE INSERT ON public.atendimento_fichas FOR EACH ROW EXECUTE FUNCTION public.carimbar_autor();


--
-- Name: atendimento_fichas atendimento_fichas_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER atendimento_fichas_updated BEFORE UPDATE ON public.atendimento_fichas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: avisos_preferencias avisos_pref_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER avisos_pref_updated BEFORE UPDATE ON public.avisos_preferencias FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: bazar_itens bazar_itens_autor; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER bazar_itens_autor BEFORE INSERT ON public.bazar_itens FOR EACH ROW EXECUTE FUNCTION public.carimbar_autor();


--
-- Name: bazar_itens bazar_itens_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER bazar_itens_updated BEFORE UPDATE ON public.bazar_itens FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: bazar_reservas bazar_reservas_autor; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER bazar_reservas_autor BEFORE INSERT ON public.bazar_reservas FOR EACH ROW EXECUTE FUNCTION public.carimbar_autor();


--
-- Name: bazar_reservas bazar_reservas_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER bazar_reservas_updated BEFORE UPDATE ON public.bazar_reservas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: carona_pedidos carona_pedidos_autor; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER carona_pedidos_autor BEFORE INSERT ON public.carona_pedidos FOR EACH ROW EXECUTE FUNCTION public.carimbar_autor();


--
-- Name: carona_pedidos carona_pedidos_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER carona_pedidos_updated BEFORE UPDATE ON public.carona_pedidos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: carona_pedidos carona_pedidos_vagas; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER carona_pedidos_vagas BEFORE INSERT OR UPDATE ON public.carona_pedidos FOR EACH ROW EXECUTE FUNCTION public.carona_conferir_vagas();


--
-- Name: caronas caronas_autor; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER caronas_autor BEFORE INSERT ON public.caronas FOR EACH ROW EXECUTE FUNCTION public.carimbar_autor();


--
-- Name: caronas caronas_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER caronas_updated BEFORE UPDATE ON public.caronas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: entregas entregas_autor; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER entregas_autor BEFORE INSERT ON public.entregas FOR EACH ROW EXECUTE FUNCTION public.carimbar_autor();


--
-- Name: entregas entregas_transicao; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER entregas_transicao BEFORE UPDATE ON public.entregas FOR EACH ROW EXECUTE FUNCTION public.entrega_transicao_valida();


--
-- Name: entregas entregas_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER entregas_updated BEFORE UPDATE ON public.entregas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: evangelizacao_avaliacoes evangelizacao_avaliacoes_autor; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER evangelizacao_avaliacoes_autor BEFORE INSERT ON public.evangelizacao_avaliacoes FOR EACH ROW EXECUTE FUNCTION public.carimbar_autor();


--
-- Name: evangelizacao_avaliacoes evangelizacao_avaliacoes_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER evangelizacao_avaliacoes_updated BEFORE UPDATE ON public.evangelizacao_avaliacoes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: evangelizacao_criancas evangelizacao_criancas_autor; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER evangelizacao_criancas_autor BEFORE INSERT ON public.evangelizacao_criancas FOR EACH ROW EXECUTE FUNCTION public.carimbar_autor();


--
-- Name: evangelizacao_criancas evangelizacao_criancas_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER evangelizacao_criancas_updated BEFORE UPDATE ON public.evangelizacao_criancas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: evangelizacao_presencas evangelizacao_presencas_autor; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER evangelizacao_presencas_autor BEFORE INSERT ON public.evangelizacao_presencas FOR EACH ROW EXECUTE FUNCTION public.carimbar_autor();


--
-- Name: evangelizacao_presencas evangelizacao_presencas_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER evangelizacao_presencas_updated BEFORE UPDATE ON public.evangelizacao_presencas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: evangelizacao_responsaveis evangelizacao_responsaveis_autor; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER evangelizacao_responsaveis_autor BEFORE INSERT ON public.evangelizacao_responsaveis FOR EACH ROW EXECUTE FUNCTION public.carimbar_autor();


--
-- Name: evangelizacao_responsaveis evangelizacao_responsaveis_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER evangelizacao_responsaveis_updated BEFORE UPDATE ON public.evangelizacao_responsaveis FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: evangelizacao_turmas evangelizacao_turmas_autor; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER evangelizacao_turmas_autor BEFORE INSERT ON public.evangelizacao_turmas FOR EACH ROW EXECUTE FUNCTION public.carimbar_autor();


--
-- Name: evangelizacao_turmas evangelizacao_turmas_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER evangelizacao_turmas_updated BEFORE UPDATE ON public.evangelizacao_turmas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: forum_respostas forum_respostas_autor; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER forum_respostas_autor BEFORE INSERT ON public.forum_respostas FOR EACH ROW EXECUTE FUNCTION public.carimbar_autor();


--
-- Name: forum_respostas forum_respostas_recontar; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER forum_respostas_recontar AFTER INSERT OR DELETE ON public.forum_respostas FOR EACH ROW EXECUTE FUNCTION public.forum_recontar();


--
-- Name: forum_respostas forum_respostas_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER forum_respostas_updated BEFORE UPDATE ON public.forum_respostas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: forum_topicos forum_topicos_autor; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER forum_topicos_autor BEFORE INSERT ON public.forum_topicos FOR EACH ROW EXECUTE FUNCTION public.carimbar_autor();


--
-- Name: forum_topicos forum_topicos_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER forum_topicos_updated BEFORE UPDATE ON public.forum_topicos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: grupo_membros grupo_membros_carimbo; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER grupo_membros_carimbo BEFORE INSERT ON public.grupo_membros FOR EACH ROW EXECUTE FUNCTION public.carimbar_membro_grupo();


--
-- Name: grupo_mensagens grupo_mensagens_autor; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER grupo_mensagens_autor BEFORE INSERT ON public.grupo_mensagens FOR EACH ROW EXECUTE FUNCTION public.carimbar_autor();


--
-- Name: grupos grupos_autor; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER grupos_autor BEFORE INSERT ON public.grupos FOR EACH ROW EXECUTE FUNCTION public.carimbar_autor();


--
-- Name: grupos grupos_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER grupos_updated BEFORE UPDATE ON public.grupos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: jovens_membros jovens_membros_autor; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER jovens_membros_autor BEFORE INSERT ON public.jovens_membros FOR EACH ROW EXECUTE FUNCTION public.carimbar_autor();


--
-- Name: jovens_publicacoes jovens_publicacoes_autor; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER jovens_publicacoes_autor BEFORE INSERT ON public.jovens_publicacoes FOR EACH ROW EXECUTE FUNCTION public.carimbar_autor();


--
-- Name: jovens_publicacoes jovens_publicacoes_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER jovens_publicacoes_updated BEFORE UPDATE ON public.jovens_publicacoes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: oracao_horarios oracao_horarios_autor; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER oracao_horarios_autor BEFORE INSERT ON public.oracao_horarios FOR EACH ROW EXECUTE FUNCTION public.carimbar_autor();


--
-- Name: oracao_inscricoes oracao_inscricoes_autor; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER oracao_inscricoes_autor BEFORE INSERT ON public.oracao_inscricoes FOR EACH ROW EXECUTE FUNCTION public.carimbar_autor();


--
-- Name: oracao_inscricoes oracao_inscricoes_vagas; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER oracao_inscricoes_vagas BEFORE INSERT ON public.oracao_inscricoes FOR EACH ROW EXECUTE FUNCTION public.oracao_conferir_vagas();


--
-- Name: paginas_casas paginas_casas_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER paginas_casas_updated_at BEFORE UPDATE ON public.paginas_casas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: voluntariado_candidaturas voluntariado_candidaturas_autor; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER voluntariado_candidaturas_autor BEFORE INSERT ON public.voluntariado_candidaturas FOR EACH ROW EXECUTE FUNCTION public.carimbar_autor();


--
-- Name: voluntariado_necessidades voluntariado_necessidades_autor; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER voluntariado_necessidades_autor BEFORE INSERT ON public.voluntariado_necessidades FOR EACH ROW EXECUTE FUNCTION public.carimbar_autor();


--
-- Name: voluntariado_necessidades voluntariado_necessidades_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER voluntariado_necessidades_updated BEFORE UPDATE ON public.voluntariado_necessidades FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: voluntariado_ofertas voluntariado_ofertas_autor; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER voluntariado_ofertas_autor BEFORE INSERT ON public.voluntariado_ofertas FOR EACH ROW EXECUTE FUNCTION public.carimbar_autor();


--
-- Name: voluntariado_ofertas voluntariado_ofertas_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER voluntariado_ofertas_updated BEFORE UPDATE ON public.voluntariado_ofertas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: administradores_pagina administradores_pagina_adicionado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.administradores_pagina
    ADD CONSTRAINT administradores_pagina_adicionado_por_fkey FOREIGN KEY (adicionado_por) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: administradores_pagina administradores_pagina_sigla_casa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.administradores_pagina
    ADD CONSTRAINT administradores_pagina_sigla_casa_fkey FOREIGN KEY (sigla_casa) REFERENCES public.siglas_casas(sigla) ON DELETE CASCADE;


--
-- Name: administradores_pagina administradores_pagina_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.administradores_pagina
    ADD CONSTRAINT administradores_pagina_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: agenda_eventos agenda_eventos_criador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agenda_eventos
    ADD CONSTRAINT agenda_eventos_criador_id_fkey FOREIGN KEY (criador_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: agenda_eventos agenda_eventos_sigla_casa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agenda_eventos
    ADD CONSTRAINT agenda_eventos_sigla_casa_fkey FOREIGN KEY (sigla_casa) REFERENCES public.siglas_casas(sigla);


--
-- Name: agenda_participantes agenda_participantes_evento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agenda_participantes
    ADD CONSTRAINT agenda_participantes_evento_id_fkey FOREIGN KEY (evento_id) REFERENCES public.agenda_eventos(id) ON DELETE CASCADE;


--
-- Name: agenda_participantes agenda_participantes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agenda_participantes
    ADD CONSTRAINT agenda_participantes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: apresentacao_perguntas apresentacao_perguntas_sessao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.apresentacao_perguntas
    ADD CONSTRAINT apresentacao_perguntas_sessao_id_fkey FOREIGN KEY (sessao_id) REFERENCES public.apresentacao_sessoes(id) ON DELETE CASCADE;


--
-- Name: apresentacao_sessoes apresentacao_sessoes_apresentacao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.apresentacao_sessoes
    ADD CONSTRAINT apresentacao_sessoes_apresentacao_id_fkey FOREIGN KEY (apresentacao_id) REFERENCES public.apresentacoes(id) ON DELETE CASCADE;


--
-- Name: apresentacao_sessoes apresentacao_sessoes_iniciada_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.apresentacao_sessoes
    ADD CONSTRAINT apresentacao_sessoes_iniciada_por_fkey FOREIGN KEY (iniciada_por) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: apresentacoes apresentacoes_criado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.apresentacoes
    ADD CONSTRAINT apresentacoes_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: artigo_avaliacoes artigo_avaliacoes_artigo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artigo_avaliacoes
    ADD CONSTRAINT artigo_avaliacoes_artigo_id_fkey FOREIGN KEY (artigo_id) REFERENCES public.artigos(id) ON DELETE CASCADE;


--
-- Name: artigo_avaliacoes artigo_avaliacoes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artigo_avaliacoes
    ADD CONSTRAINT artigo_avaliacoes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: artigo_revisoes artigo_revisoes_artigo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artigo_revisoes
    ADD CONSTRAINT artigo_revisoes_artigo_id_fkey FOREIGN KEY (artigo_id) REFERENCES public.artigos(id) ON DELETE CASCADE;


--
-- Name: artigo_revisoes artigo_revisoes_decidida_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artigo_revisoes
    ADD CONSTRAINT artigo_revisoes_decidida_por_fkey FOREIGN KEY (decidida_por) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: artigos artigos_autor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artigos
    ADD CONSTRAINT artigos_autor_id_fkey FOREIGN KEY (autor_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: artigos artigos_retirado_por_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artigos
    ADD CONSTRAINT artigos_retirado_por_user_id_fkey FOREIGN KEY (retirado_por_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: atendimento_acessos atendimento_acessos_ficha_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atendimento_acessos
    ADD CONSTRAINT atendimento_acessos_ficha_id_fkey FOREIGN KEY (ficha_id) REFERENCES public.atendimento_fichas(id) ON DELETE CASCADE;


--
-- Name: bazar_contatos bazar_contatos_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bazar_contatos
    ADD CONSTRAINT bazar_contatos_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.bazar_itens(id) ON DELETE CASCADE;


--
-- Name: bazar_reservas bazar_reservas_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bazar_reservas
    ADD CONSTRAINT bazar_reservas_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.bazar_itens(id) ON DELETE CASCADE;


--
-- Name: carona_contatos carona_contatos_carona_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carona_contatos
    ADD CONSTRAINT carona_contatos_carona_id_fkey FOREIGN KEY (carona_id) REFERENCES public.caronas(id) ON DELETE CASCADE;


--
-- Name: carona_pedidos carona_pedidos_carona_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carona_pedidos
    ADD CONSTRAINT carona_pedidos_carona_id_fkey FOREIGN KEY (carona_id) REFERENCES public.caronas(id) ON DELETE CASCADE;


--
-- Name: casas_convites casas_convites_casa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.casas_convites
    ADD CONSTRAINT casas_convites_casa_id_fkey FOREIGN KEY (casa_id) REFERENCES public.casas_espirita(id) ON DELETE CASCADE;


--
-- Name: casas_pedidos_remocao casas_pedidos_remocao_casa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.casas_pedidos_remocao
    ADD CONSTRAINT casas_pedidos_remocao_casa_id_fkey FOREIGN KEY (casa_id) REFERENCES public.casas_espirita(id) ON DELETE CASCADE;


--
-- Name: casas_reivindicacoes casas_reivindicacoes_casa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.casas_reivindicacoes
    ADD CONSTRAINT casas_reivindicacoes_casa_id_fkey FOREIGN KEY (casa_id) REFERENCES public.casas_espirita(id) ON DELETE CASCADE;


--
-- Name: entrega_contatos entrega_contatos_entrega_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entrega_contatos
    ADD CONSTRAINT entrega_contatos_entrega_id_fkey FOREIGN KEY (entrega_id) REFERENCES public.entregas(id) ON DELETE CASCADE;


--
-- Name: entregas entregas_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entregas
    ADD CONSTRAINT entregas_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.bazar_itens(id) ON DELETE SET NULL;


--
-- Name: entregas entregas_reserva_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entregas
    ADD CONSTRAINT entregas_reserva_id_fkey FOREIGN KEY (reserva_id) REFERENCES public.bazar_reservas(id) ON DELETE SET NULL;


--
-- Name: evangelizacao_avaliacoes evangelizacao_avaliacoes_crianca_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evangelizacao_avaliacoes
    ADD CONSTRAINT evangelizacao_avaliacoes_crianca_id_fkey FOREIGN KEY (crianca_id) REFERENCES public.evangelizacao_criancas(id) ON DELETE CASCADE;


--
-- Name: evangelizacao_criancas evangelizacao_criancas_turma_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evangelizacao_criancas
    ADD CONSTRAINT evangelizacao_criancas_turma_id_fkey FOREIGN KEY (turma_id) REFERENCES public.evangelizacao_turmas(id) ON DELETE SET NULL;


--
-- Name: evangelizacao_presencas evangelizacao_presencas_crianca_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evangelizacao_presencas
    ADD CONSTRAINT evangelizacao_presencas_crianca_id_fkey FOREIGN KEY (crianca_id) REFERENCES public.evangelizacao_criancas(id) ON DELETE CASCADE;


--
-- Name: evangelizacao_presencas evangelizacao_presencas_turma_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evangelizacao_presencas
    ADD CONSTRAINT evangelizacao_presencas_turma_id_fkey FOREIGN KEY (turma_id) REFERENCES public.evangelizacao_turmas(id) ON DELETE SET NULL;


--
-- Name: evangelizacao_responsaveis evangelizacao_responsaveis_crianca_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evangelizacao_responsaveis
    ADD CONSTRAINT evangelizacao_responsaveis_crianca_id_fkey FOREIGN KEY (crianca_id) REFERENCES public.evangelizacao_criancas(id) ON DELETE CASCADE;


--
-- Name: forum_respostas forum_respostas_topico_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forum_respostas
    ADD CONSTRAINT forum_respostas_topico_id_fkey FOREIGN KEY (topico_id) REFERENCES public.forum_topicos(id) ON DELETE CASCADE;


--
-- Name: grupo_membros grupo_membros_grupo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grupo_membros
    ADD CONSTRAINT grupo_membros_grupo_id_fkey FOREIGN KEY (grupo_id) REFERENCES public.grupos(id) ON DELETE CASCADE;


--
-- Name: grupo_mensagens grupo_mensagens_grupo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grupo_mensagens
    ADD CONSTRAINT grupo_mensagens_grupo_id_fkey FOREIGN KEY (grupo_id) REFERENCES public.grupos(id) ON DELETE CASCADE;


--
-- Name: kanban_comentarios kanban_comentarios_evento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kanban_comentarios
    ADD CONSTRAINT kanban_comentarios_evento_id_fkey FOREIGN KEY (evento_id) REFERENCES public.kanban_eventos(id) ON DELETE CASCADE;


--
-- Name: kanban_comentarios kanban_comentarios_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kanban_comentarios
    ADD CONSTRAINT kanban_comentarios_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: kanban_config kanban_config_sigla_casa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kanban_config
    ADD CONSTRAINT kanban_config_sigla_casa_fkey FOREIGN KEY (sigla_casa) REFERENCES public.siglas_casas(sigla) ON DELETE CASCADE;


--
-- Name: kanban_eventos kanban_eventos_criador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kanban_eventos
    ADD CONSTRAINT kanban_eventos_criador_id_fkey FOREIGN KEY (criador_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: kanban_eventos kanban_eventos_lista_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kanban_eventos
    ADD CONSTRAINT kanban_eventos_lista_id_fkey FOREIGN KEY (lista_id) REFERENCES public.kanban_listas(id) ON DELETE SET NULL;


--
-- Name: kanban_frentes kanban_frentes_board_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kanban_frentes
    ADD CONSTRAINT kanban_frentes_board_id_fkey FOREIGN KEY (board_id) REFERENCES public.kanban_boards(id) ON DELETE CASCADE;


--
-- Name: kanban_grupos kanban_grupos_evento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kanban_grupos
    ADD CONSTRAINT kanban_grupos_evento_id_fkey FOREIGN KEY (evento_id) REFERENCES public.kanban_eventos(id) ON DELETE CASCADE;


--
-- Name: kanban_listas kanban_listas_board_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kanban_listas
    ADD CONSTRAINT kanban_listas_board_id_fkey FOREIGN KEY (board_id) REFERENCES public.kanban_boards(id) ON DELETE CASCADE;


--
-- Name: kanban_listas kanban_listas_frente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kanban_listas
    ADD CONSTRAINT kanban_listas_frente_id_fkey FOREIGN KEY (frente_id) REFERENCES public.kanban_frentes(id) ON DELETE CASCADE;


--
-- Name: kanban_listas kanban_listas_sigla_casa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kanban_listas
    ADD CONSTRAINT kanban_listas_sigla_casa_fkey FOREIGN KEY (sigla_casa) REFERENCES public.siglas_casas(sigla) ON DELETE CASCADE;


--
-- Name: kanban_tarefas kanban_tarefas_grupo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kanban_tarefas
    ADD CONSTRAINT kanban_tarefas_grupo_id_fkey FOREIGN KEY (grupo_id) REFERENCES public.kanban_grupos(id) ON DELETE CASCADE;


--
-- Name: memoria_virtudes_custom memoria_virtudes_custom_sigla_casa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.memoria_virtudes_custom
    ADD CONSTRAINT memoria_virtudes_custom_sigla_casa_fkey FOREIGN KEY (sigla_casa) REFERENCES public.siglas_casas(sigla) ON DELETE CASCADE;


--
-- Name: mensagens_do_dia mensagens_do_dia_autor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mensagens_do_dia
    ADD CONSTRAINT mensagens_do_dia_autor_id_fkey FOREIGN KEY (autor_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: musicas musicas_sigla_casa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.musicas
    ADD CONSTRAINT musicas_sigla_casa_fkey FOREIGN KEY (sigla_casa) REFERENCES public.siglas_casas(sigla) ON DELETE SET NULL;


--
-- Name: musicas musicas_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.musicas
    ADD CONSTRAINT musicas_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: oracao_inscricoes oracao_inscricoes_horario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oracao_inscricoes
    ADD CONSTRAINT oracao_inscricoes_horario_id_fkey FOREIGN KEY (horario_id) REFERENCES public.oracao_horarios(id) ON DELETE CASCADE;


--
-- Name: paginas_casas paginas_casas_sigla_casa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paginas_casas
    ADD CONSTRAINT paginas_casas_sigla_casa_fkey FOREIGN KEY (sigla_casa) REFERENCES public.siglas_casas(sigla) ON DELETE CASCADE;


--
-- Name: painel_votes painel_votes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.painel_votes
    ADD CONSTRAINT painel_votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: problem_reports problem_reports_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.problem_reports
    ADD CONSTRAINT problem_reports_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_sigla_casa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_sigla_casa_fkey FOREIGN KEY (sigla_casa) REFERENCES public.siglas_casas(sigla);


--
-- Name: programacao_eventos programacao_eventos_criado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.programacao_eventos
    ADD CONSTRAINT programacao_eventos_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: programacao_eventos programacao_eventos_sigla_casa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.programacao_eventos
    ADD CONSTRAINT programacao_eventos_sigla_casa_fkey FOREIGN KEY (sigla_casa) REFERENCES public.siglas_casas(sigla) ON DELETE CASCADE;


--
-- Name: programacao_participantes programacao_participantes_adicionado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.programacao_participantes
    ADD CONSTRAINT programacao_participantes_adicionado_por_fkey FOREIGN KEY (adicionado_por) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: programacao_participantes programacao_participantes_evento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.programacao_participantes
    ADD CONSTRAINT programacao_participantes_evento_id_fkey FOREIGN KEY (evento_id) REFERENCES public.programacao_eventos(id) ON DELETE CASCADE;


--
-- Name: programacao_participantes programacao_participantes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.programacao_participantes
    ADD CONSTRAINT programacao_participantes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: publicacoes_casa publicacoes_casa_autor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.publicacoes_casa
    ADD CONSTRAINT publicacoes_casa_autor_id_fkey FOREIGN KEY (autor_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: publicacoes_casa publicacoes_casa_sigla_casa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.publicacoes_casa
    ADD CONSTRAINT publicacoes_casa_sigla_casa_fkey FOREIGN KEY (sigla_casa) REFERENCES public.siglas_casas(sigla) ON DELETE CASCADE;


--
-- Name: solicitacoes_dev solicitacoes_dev_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitacoes_dev
    ADD CONSTRAINT solicitacoes_dev_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: tesouraria_autorizacoes tesouraria_autorizacoes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tesouraria_autorizacoes
    ADD CONSTRAINT tesouraria_autorizacoes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: tesouraria_transacoes tesouraria_transacoes_criador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tesouraria_transacoes
    ADD CONSTRAINT tesouraria_transacoes_criador_id_fkey FOREIGN KEY (criador_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: tesouraria_transacoes tesouraria_transacoes_sigla_casa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tesouraria_transacoes
    ADD CONSTRAINT tesouraria_transacoes_sigla_casa_fkey FOREIGN KEY (sigla_casa) REFERENCES public.siglas_casas(sigla);


--
-- Name: usuarios_sancoes usuarios_sancoes_aplicada_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios_sancoes
    ADD CONSTRAINT usuarios_sancoes_aplicada_por_fkey FOREIGN KEY (aplicada_por) REFERENCES auth.users(id) ON DELETE RESTRICT;


--
-- Name: usuarios_sancoes usuarios_sancoes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios_sancoes
    ADD CONSTRAINT usuarios_sancoes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: voluntariado_candidaturas voluntariado_candidaturas_necessidade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.voluntariado_candidaturas
    ADD CONSTRAINT voluntariado_candidaturas_necessidade_id_fkey FOREIGN KEY (necessidade_id) REFERENCES public.voluntariado_necessidades(id) ON DELETE CASCADE;


--
-- Name: administradores_pagina; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.administradores_pagina ENABLE ROW LEVEL SECURITY;

--
-- Name: administradores_pagina admins_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admins_delete ON public.administradores_pagina FOR DELETE TO authenticated USING (public.pode_administrar_pagina(sigla_casa));


--
-- Name: administradores_pagina admins_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admins_insert ON public.administradores_pagina FOR INSERT TO authenticated WITH CHECK (public.pode_administrar_pagina(sigla_casa));


--
-- Name: administradores_pagina admins_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admins_select ON public.administradores_pagina FOR SELECT TO authenticated USING (true);


--
-- Name: agenda_eventos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.agenda_eventos ENABLE ROW LEVEL SECURITY;

--
-- Name: agenda_participantes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.agenda_participantes ENABLE ROW LEVEL SECURITY;

--
-- Name: apresentacao_perguntas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.apresentacao_perguntas ENABLE ROW LEVEL SECURITY;

--
-- Name: apresentacao_sessoes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.apresentacao_sessoes ENABLE ROW LEVEL SECURITY;

--
-- Name: apresentacoes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.apresentacoes ENABLE ROW LEVEL SECURITY;

--
-- Name: apresentacoes apresentacoes_apaga_a_propria; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY apresentacoes_apaga_a_propria ON public.apresentacoes FOR DELETE TO authenticated USING ((criado_por = ( SELECT auth.uid() AS uid)));


--
-- Name: apresentacoes apresentacoes_edita_a_propria; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY apresentacoes_edita_a_propria ON public.apresentacoes FOR UPDATE TO authenticated USING ((criado_por = ( SELECT auth.uid() AS uid)));


--
-- Name: apresentacoes apresentacoes_envio; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY apresentacoes_envio ON public.apresentacoes FOR INSERT TO authenticated WITH CHECK (((criado_por = ( SELECT auth.uid() AS uid)) AND (sigla_casa = ( SELECT p.sigla_casa
   FROM public.profiles p
  WHERE (p.id = ( SELECT auth.uid() AS uid))))));


--
-- Name: apresentacoes apresentacoes_leitura_da_casa; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY apresentacoes_leitura_da_casa ON public.apresentacoes FOR SELECT TO authenticated USING ((sigla_casa = ( SELECT p.sigla_casa
   FROM public.profiles p
  WHERE (p.id = ( SELECT auth.uid() AS uid)))));


--
-- Name: apresentacoes apresentacoes_leitura_em_sessao; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY apresentacoes_leitura_em_sessao ON public.apresentacoes FOR SELECT TO authenticated, anon USING ((EXISTS ( SELECT 1
   FROM public.apresentacao_sessoes s
  WHERE ((s.apresentacao_id = apresentacoes.id) AND s.ativa))));


--
-- Name: artigo_avaliacoes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.artigo_avaliacoes ENABLE ROW LEVEL SECURITY;

--
-- Name: artigo_avaliacoes artigo_avaliacoes_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY artigo_avaliacoes_delete ON public.artigo_avaliacoes FOR DELETE USING ((user_id = ( SELECT auth.uid() AS uid)));


--
-- Name: artigo_avaliacoes artigo_avaliacoes_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY artigo_avaliacoes_insert ON public.artigo_avaliacoes FOR INSERT WITH CHECK (((user_id = ( SELECT auth.uid() AS uid)) AND ( SELECT public.email_verificado() AS email_verificado) AND (NOT public.usuario_sancionado(( SELECT auth.uid() AS uid))) AND (NOT (EXISTS ( SELECT 1
   FROM public.artigos a
  WHERE ((a.id = artigo_avaliacoes.artigo_id) AND (a.autor_id = ( SELECT auth.uid() AS uid))))))));


--
-- Name: artigo_avaliacoes artigo_avaliacoes_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY artigo_avaliacoes_select ON public.artigo_avaliacoes FOR SELECT USING (((user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM public.artigos a
  WHERE ((a.id = artigo_avaliacoes.artigo_id) AND (a.autor_id = ( SELECT auth.uid() AS uid))))) OR public.pode_revisar_artigo(artigo_id)));


--
-- Name: artigo_avaliacoes artigo_avaliacoes_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY artigo_avaliacoes_update ON public.artigo_avaliacoes FOR UPDATE USING ((user_id = ( SELECT auth.uid() AS uid))) WITH CHECK (((user_id = ( SELECT auth.uid() AS uid)) AND ( SELECT public.email_verificado() AS email_verificado) AND (NOT public.usuario_sancionado(( SELECT auth.uid() AS uid)))));


--
-- Name: artigo_revisoes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.artigo_revisoes ENABLE ROW LEVEL SECURITY;

--
-- Name: artigo_revisoes artigo_revisoes_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY artigo_revisoes_insert ON public.artigo_revisoes FOR INSERT WITH CHECK ((public.pode_revisar_artigo(artigo_id) OR ((origem = 'reenvio'::text) AND (EXISTS ( SELECT 1
   FROM public.artigos a
  WHERE ((a.id = artigo_revisoes.artigo_id) AND (a.autor_id = ( SELECT auth.uid() AS uid)) AND (a.estado = 'em_correcao'::text)))))));


--
-- Name: artigo_revisoes artigo_revisoes_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY artigo_revisoes_select ON public.artigo_revisoes FOR SELECT USING ((public.pode_revisar_artigo(artigo_id) OR (EXISTS ( SELECT 1
   FROM public.artigos a
  WHERE ((a.id = artigo_revisoes.artigo_id) AND (a.autor_id = ( SELECT auth.uid() AS uid)))))));


--
-- Name: artigo_revisoes artigo_revisoes_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY artigo_revisoes_update ON public.artigo_revisoes FOR UPDATE USING (public.pode_revisar_artigo(artigo_id)) WITH CHECK (public.pode_revisar_artigo(artigo_id));


--
-- Name: artigos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.artigos ENABLE ROW LEVEL SECURITY;

--
-- Name: artigos artigos_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY artigos_delete ON public.artigos FOR DELETE USING (public.pode_revisar_artigo(id));


--
-- Name: artigos artigos_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY artigos_insert ON public.artigos FOR INSERT WITH CHECK (((autor_id = ( SELECT auth.uid() AS uid)) AND ( SELECT public.email_verificado() AS email_verificado) AND (NOT public.usuario_sancionado(( SELECT auth.uid() AS uid)))));


--
-- Name: artigos artigos_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY artigos_select ON public.artigos FOR SELECT USING (((estado = 'publicado'::text) OR (autor_id = ( SELECT auth.uid() AS uid)) OR public.pode_revisar_artigo(id)));


--
-- Name: artigos artigos_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY artigos_update ON public.artigos FOR UPDATE USING ((((autor_id = ( SELECT auth.uid() AS uid)) AND (estado = ANY (ARRAY['publicado'::text, 'retirado'::text, 'em_correcao'::text]))) OR public.pode_revisar_artigo(id))) WITH CHECK (((autor_id = ( SELECT auth.uid() AS uid)) OR public.pode_revisar_artigo(id)));


--
-- Name: atendimento_acessos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.atendimento_acessos ENABLE ROW LEVEL SECURITY;

--
-- Name: atendimento_acessos atendimento_acessos_leitura; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY atendimento_acessos_leitura ON public.atendimento_acessos FOR SELECT TO authenticated USING ((public.pode_administrar_pagina(sigla_casa) OR public.pode_atendimento_fraterno(sigla_casa)));


--
-- Name: atendimento_acessos atendimento_acessos_registra; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY atendimento_acessos_registra ON public.atendimento_acessos FOR INSERT TO authenticated WITH CHECK (((user_id = ( SELECT auth.uid() AS uid)) AND public.pode_atendimento_fraterno(sigla_casa)));


--
-- Name: atendimento_autorizados; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.atendimento_autorizados ENABLE ROW LEVEL SECURITY;

--
-- Name: atendimento_autorizados atendimento_autorizados_apaga; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY atendimento_autorizados_apaga ON public.atendimento_autorizados FOR DELETE TO authenticated USING (public.pode_administrar_pagina(sigla_casa));


--
-- Name: atendimento_autorizados atendimento_autorizados_insere; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY atendimento_autorizados_insere ON public.atendimento_autorizados FOR INSERT TO authenticated WITH CHECK ((public.pode_administrar_pagina(sigla_casa) AND (criado_por = ( SELECT auth.uid() AS uid))));


--
-- Name: atendimento_autorizados atendimento_autorizados_leitura; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY atendimento_autorizados_leitura ON public.atendimento_autorizados FOR SELECT TO authenticated USING ((public.pode_administrar_pagina(sigla_casa) OR public.pode_atendimento_fraterno(sigla_casa)));


--
-- Name: atendimento_fichas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.atendimento_fichas ENABLE ROW LEVEL SECURITY;

--
-- Name: atendimento_fichas atendimento_fichas_apaga; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY atendimento_fichas_apaga ON public.atendimento_fichas FOR DELETE TO authenticated USING (((criado_por = ( SELECT auth.uid() AS uid)) AND public.pode_atendimento_fraterno(sigla_casa)));


--
-- Name: atendimento_fichas atendimento_fichas_edita; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY atendimento_fichas_edita ON public.atendimento_fichas FOR UPDATE TO authenticated USING (public.pode_atendimento_fraterno(sigla_casa)) WITH CHECK (public.pode_atendimento_fraterno(sigla_casa));


--
-- Name: atendimento_fichas atendimento_fichas_insere; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY atendimento_fichas_insere ON public.atendimento_fichas FOR INSERT TO authenticated WITH CHECK ((public.pode_atendimento_fraterno(sigla_casa) AND (sigla_casa = ( SELECT public.minha_sigla_casa() AS minha_sigla_casa))));


--
-- Name: atendimento_fichas atendimento_fichas_leitura; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY atendimento_fichas_leitura ON public.atendimento_fichas FOR SELECT TO authenticated USING (public.pode_atendimento_fraterno(sigla_casa));


--
-- Name: casas_espirita authenticated_insert_casa; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY authenticated_insert_casa ON public.casas_espirita FOR INSERT TO authenticated WITH CHECK ((sigla IS NOT NULL));


--
-- Name: casas_espirita authenticated_update_own_casa; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY authenticated_update_own_casa ON public.casas_espirita FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.sigla_casa = casas_espirita.sigla) AND (profiles.cidade = casas_espirita.cidade) AND ((profiles.uf)::text = casas_espirita.estado))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.sigla_casa = casas_espirita.sigla) AND (profiles.cidade = casas_espirita.cidade) AND ((profiles.uf)::text = casas_espirita.estado)))));


--
-- Name: avisos_enviados; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.avisos_enviados ENABLE ROW LEVEL SECURITY;

--
-- Name: avisos_preferencias avisos_pref_edita; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY avisos_pref_edita ON public.avisos_preferencias FOR UPDATE TO authenticated USING ((user_id = ( SELECT auth.uid() AS uid))) WITH CHECK ((user_id = ( SELECT auth.uid() AS uid)));


--
-- Name: avisos_preferencias avisos_pref_insere; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY avisos_pref_insere ON public.avisos_preferencias FOR INSERT TO authenticated WITH CHECK ((user_id = ( SELECT auth.uid() AS uid)));


--
-- Name: avisos_preferencias avisos_pref_leitura; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY avisos_pref_leitura ON public.avisos_preferencias FOR SELECT TO authenticated USING ((user_id = ( SELECT auth.uid() AS uid)));


--
-- Name: avisos_preferencias; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.avisos_preferencias ENABLE ROW LEVEL SECURITY;

--
-- Name: bazar_contatos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.bazar_contatos ENABLE ROW LEVEL SECURITY;

--
-- Name: bazar_contatos bazar_contatos_apaga; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY bazar_contatos_apaga ON public.bazar_contatos FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.bazar_itens i
  WHERE ((i.id = bazar_contatos.item_id) AND (i.criado_por = ( SELECT auth.uid() AS uid))))));


--
-- Name: bazar_contatos bazar_contatos_edita; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY bazar_contatos_edita ON public.bazar_contatos FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.bazar_itens i
  WHERE ((i.id = bazar_contatos.item_id) AND (i.criado_por = ( SELECT auth.uid() AS uid)))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.bazar_itens i
  WHERE ((i.id = bazar_contatos.item_id) AND (i.criado_por = ( SELECT auth.uid() AS uid))))));


--
-- Name: bazar_contatos bazar_contatos_escreve; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY bazar_contatos_escreve ON public.bazar_contatos FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.bazar_itens i
  WHERE ((i.id = bazar_contatos.item_id) AND (i.criado_por = ( SELECT auth.uid() AS uid))))));


--
-- Name: bazar_contatos bazar_contatos_leitura; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY bazar_contatos_leitura ON public.bazar_contatos FOR SELECT TO authenticated USING (((EXISTS ( SELECT 1
   FROM public.bazar_itens i
  WHERE ((i.id = bazar_contatos.item_id) AND (i.criado_por = ( SELECT auth.uid() AS uid))))) OR (EXISTS ( SELECT 1
   FROM public.bazar_reservas r
  WHERE ((r.item_id = bazar_contatos.item_id) AND (r.criado_por = ( SELECT auth.uid() AS uid)) AND (r.status = ANY (ARRAY['aceita'::text, 'concluida'::text])))))));


--
-- Name: bazar_itens; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.bazar_itens ENABLE ROW LEVEL SECURITY;

--
-- Name: bazar_itens bazar_itens_apaga; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY bazar_itens_apaga ON public.bazar_itens FOR DELETE TO authenticated USING (((criado_por = ( SELECT auth.uid() AS uid)) OR public.pode_administrar_pagina(sigla_casa)));


--
-- Name: bazar_itens bazar_itens_edita; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY bazar_itens_edita ON public.bazar_itens FOR UPDATE TO authenticated USING (((criado_por = ( SELECT auth.uid() AS uid)) OR public.pode_administrar_pagina(sigla_casa))) WITH CHECK (((criado_por = ( SELECT auth.uid() AS uid)) OR public.pode_administrar_pagina(sigla_casa)));


--
-- Name: bazar_itens bazar_itens_insere; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY bazar_itens_insere ON public.bazar_itens FOR INSERT TO authenticated WITH CHECK (public.pode_publicar_na_casa(sigla_casa));


--
-- Name: bazar_itens bazar_itens_leitura; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY bazar_itens_leitura ON public.bazar_itens FOR SELECT TO authenticated USING (public.pode_ver_da_casa(sigla_casa, aberto));


--
-- Name: bazar_reservas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.bazar_reservas ENABLE ROW LEVEL SECURITY;

--
-- Name: bazar_reservas bazar_reservas_desiste; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY bazar_reservas_desiste ON public.bazar_reservas FOR DELETE TO authenticated USING ((criado_por = ( SELECT auth.uid() AS uid)));


--
-- Name: bazar_reservas bazar_reservas_insere; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY bazar_reservas_insere ON public.bazar_reservas FOR INSERT TO authenticated WITH CHECK (((criado_por = ( SELECT auth.uid() AS uid)) AND ( SELECT public.email_verificado() AS email_verificado) AND (NOT public.usuario_sancionado(( SELECT auth.uid() AS uid))) AND (EXISTS ( SELECT 1
   FROM public.bazar_itens i
  WHERE ((i.id = bazar_reservas.item_id) AND i.disponivel AND public.pode_ver_da_casa(i.sigla_casa, i.aberto))))));


--
-- Name: bazar_reservas bazar_reservas_leitura; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY bazar_reservas_leitura ON public.bazar_reservas FOR SELECT TO authenticated USING (((criado_por = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM public.bazar_itens i
  WHERE ((i.id = bazar_reservas.item_id) AND (i.criado_por = ( SELECT auth.uid() AS uid)))))));


--
-- Name: bazar_reservas bazar_reservas_responde; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY bazar_reservas_responde ON public.bazar_reservas FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.bazar_itens i
  WHERE ((i.id = bazar_reservas.item_id) AND (i.criado_por = ( SELECT auth.uid() AS uid)))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.bazar_itens i
  WHERE ((i.id = bazar_reservas.item_id) AND (i.criado_por = ( SELECT auth.uid() AS uid))))));


--
-- Name: voluntariado_candidaturas candidaturas_apaga; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY candidaturas_apaga ON public.voluntariado_candidaturas FOR DELETE TO authenticated USING ((criado_por = ( SELECT auth.uid() AS uid)));


--
-- Name: voluntariado_candidaturas candidaturas_insere; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY candidaturas_insere ON public.voluntariado_candidaturas FOR INSERT TO authenticated WITH CHECK (((criado_por = ( SELECT auth.uid() AS uid)) AND ( SELECT public.email_verificado() AS email_verificado) AND (NOT public.usuario_sancionado(( SELECT auth.uid() AS uid))) AND (EXISTS ( SELECT 1
   FROM public.voluntariado_necessidades n
  WHERE ((n.id = voluntariado_candidaturas.necessidade_id) AND public.pode_ver_da_casa(n.sigla_casa, n.aberto))))));


--
-- Name: voluntariado_candidaturas candidaturas_leitura; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY candidaturas_leitura ON public.voluntariado_candidaturas FOR SELECT TO authenticated USING (((criado_por = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM public.voluntariado_necessidades n
  WHERE ((n.id = voluntariado_candidaturas.necessidade_id) AND ((n.criado_por = ( SELECT auth.uid() AS uid)) OR public.pode_administrar_pagina(n.sigla_casa)))))));


--
-- Name: voluntariado_candidaturas candidaturas_responde; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY candidaturas_responde ON public.voluntariado_candidaturas FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.voluntariado_necessidades n
  WHERE ((n.id = voluntariado_candidaturas.necessidade_id) AND ((n.criado_por = ( SELECT auth.uid() AS uid)) OR public.pode_administrar_pagina(n.sigla_casa)))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.voluntariado_necessidades n
  WHERE ((n.id = voluntariado_candidaturas.necessidade_id) AND ((n.criado_por = ( SELECT auth.uid() AS uid)) OR public.pode_administrar_pagina(n.sigla_casa))))));


--
-- Name: carona_contatos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.carona_contatos ENABLE ROW LEVEL SECURITY;

--
-- Name: carona_contatos carona_contatos_apaga; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY carona_contatos_apaga ON public.carona_contatos FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.caronas c
  WHERE ((c.id = carona_contatos.carona_id) AND (c.criado_por = ( SELECT auth.uid() AS uid))))));


--
-- Name: carona_contatos carona_contatos_edita; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY carona_contatos_edita ON public.carona_contatos FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.caronas c
  WHERE ((c.id = carona_contatos.carona_id) AND (c.criado_por = ( SELECT auth.uid() AS uid)))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.caronas c
  WHERE ((c.id = carona_contatos.carona_id) AND (c.criado_por = ( SELECT auth.uid() AS uid))))));


--
-- Name: carona_contatos carona_contatos_escreve; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY carona_contatos_escreve ON public.carona_contatos FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.caronas c
  WHERE ((c.id = carona_contatos.carona_id) AND (c.criado_por = ( SELECT auth.uid() AS uid))))));


--
-- Name: carona_contatos carona_contatos_leitura; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY carona_contatos_leitura ON public.carona_contatos FOR SELECT TO authenticated USING (((EXISTS ( SELECT 1
   FROM public.caronas c
  WHERE ((c.id = carona_contatos.carona_id) AND (c.criado_por = ( SELECT auth.uid() AS uid))))) OR (EXISTS ( SELECT 1
   FROM public.carona_pedidos p
  WHERE ((p.carona_id = carona_contatos.carona_id) AND (p.criado_por = ( SELECT auth.uid() AS uid)) AND (p.status = 'aceito'::text))))));


--
-- Name: carona_pedidos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.carona_pedidos ENABLE ROW LEVEL SECURITY;

--
-- Name: carona_pedidos carona_pedidos_desiste; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY carona_pedidos_desiste ON public.carona_pedidos FOR DELETE TO authenticated USING ((criado_por = ( SELECT auth.uid() AS uid)));


--
-- Name: carona_pedidos carona_pedidos_insere; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY carona_pedidos_insere ON public.carona_pedidos FOR INSERT TO authenticated WITH CHECK (((criado_por = ( SELECT auth.uid() AS uid)) AND ( SELECT public.email_verificado() AS email_verificado) AND (NOT public.usuario_sancionado(( SELECT auth.uid() AS uid))) AND (EXISTS ( SELECT 1
   FROM public.caronas c
  WHERE ((c.id = carona_pedidos.carona_id) AND c.ativa AND public.pode_ver_da_casa(c.sigla_casa, c.aberto))))));


--
-- Name: carona_pedidos carona_pedidos_leitura; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY carona_pedidos_leitura ON public.carona_pedidos FOR SELECT TO authenticated USING (((criado_por = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM public.caronas c
  WHERE ((c.id = carona_pedidos.carona_id) AND (c.criado_por = ( SELECT auth.uid() AS uid)))))));


--
-- Name: carona_pedidos carona_pedidos_responde; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY carona_pedidos_responde ON public.carona_pedidos FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.caronas c
  WHERE ((c.id = carona_pedidos.carona_id) AND (c.criado_por = ( SELECT auth.uid() AS uid)))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.caronas c
  WHERE ((c.id = carona_pedidos.carona_id) AND (c.criado_por = ( SELECT auth.uid() AS uid))))));


--
-- Name: caronas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.caronas ENABLE ROW LEVEL SECURITY;

--
-- Name: caronas caronas_apaga; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY caronas_apaga ON public.caronas FOR DELETE TO authenticated USING (((criado_por = ( SELECT auth.uid() AS uid)) OR public.pode_administrar_pagina(sigla_casa)));


--
-- Name: caronas caronas_edita; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY caronas_edita ON public.caronas FOR UPDATE TO authenticated USING (((criado_por = ( SELECT auth.uid() AS uid)) OR public.pode_administrar_pagina(sigla_casa))) WITH CHECK (((criado_por = ( SELECT auth.uid() AS uid)) OR public.pode_administrar_pagina(sigla_casa)));


--
-- Name: caronas caronas_insere; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY caronas_insere ON public.caronas FOR INSERT TO authenticated WITH CHECK (public.pode_publicar_na_casa(sigla_casa));


--
-- Name: caronas caronas_leitura; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY caronas_leitura ON public.caronas FOR SELECT TO authenticated USING (public.pode_ver_da_casa(sigla_casa, aberto));


--
-- Name: casas_convites; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.casas_convites ENABLE ROW LEVEL SECURITY;

--
-- Name: casas_espirita; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.casas_espirita ENABLE ROW LEVEL SECURITY;

--
-- Name: casas_pedidos_remocao; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.casas_pedidos_remocao ENABLE ROW LEVEL SECURITY;

--
-- Name: casas_reivindicacoes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.casas_reivindicacoes ENABLE ROW LEVEL SECURITY;

--
-- Name: convite_config; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.convite_config ENABLE ROW LEVEL SECURITY;

--
-- Name: solicitacoes_dev dev atualiza solicitacao; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "dev atualiza solicitacao" ON public.solicitacoes_dev FOR UPDATE TO authenticated USING (( SELECT public.sou_dev() AS sou_dev)) WITH CHECK (( SELECT public.sou_dev() AS sou_dev));


--
-- Name: solicitacoes_dev dev remove solicitacao; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "dev remove solicitacao" ON public.solicitacoes_dev FOR DELETE TO authenticated USING (( SELECT public.sou_dev() AS sou_dev));


--
-- Name: site_suggestions dev remove sugestao; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "dev remove sugestao" ON public.site_suggestions FOR DELETE TO authenticated USING (( SELECT public.sou_dev() AS sou_dev));


--
-- Name: casas_pedidos_remocao dev ve pedidos de remocao; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "dev ve pedidos de remocao" ON public.casas_pedidos_remocao FOR SELECT TO authenticated USING (( SELECT public.sou_dev() AS sou_dev));


--
-- Name: casas_reivindicacoes dev ve reivindicacoes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "dev ve reivindicacoes" ON public.casas_reivindicacoes FOR SELECT TO authenticated USING (( SELECT public.sou_dev() AS sou_dev));


--
-- Name: site_suggestions dev ve sugestoes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "dev ve sugestoes" ON public.site_suggestions FOR SELECT TO authenticated USING (( SELECT public.sou_dev() AS sou_dev));


--
-- Name: entrega_contatos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.entrega_contatos ENABLE ROW LEVEL SECURITY;

--
-- Name: entrega_contatos entrega_contatos_apaga; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY entrega_contatos_apaga ON public.entrega_contatos FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.entregas e
  WHERE ((e.id = entrega_contatos.entrega_id) AND (e.criado_por = ( SELECT auth.uid() AS uid))))));


--
-- Name: entrega_contatos entrega_contatos_edita; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY entrega_contatos_edita ON public.entrega_contatos FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.entregas e
  WHERE ((e.id = entrega_contatos.entrega_id) AND ((e.criado_por = ( SELECT auth.uid() AS uid)) OR (e.voluntario = ( SELECT auth.uid() AS uid))))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.entregas e
  WHERE ((e.id = entrega_contatos.entrega_id) AND ((e.criado_por = ( SELECT auth.uid() AS uid)) OR (e.voluntario = ( SELECT auth.uid() AS uid)))))));


--
-- Name: entrega_contatos entrega_contatos_escreve; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY entrega_contatos_escreve ON public.entrega_contatos FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.entregas e
  WHERE ((e.id = entrega_contatos.entrega_id) AND (e.criado_por = ( SELECT auth.uid() AS uid))))));


--
-- Name: entrega_contatos entrega_contatos_leitura; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY entrega_contatos_leitura ON public.entrega_contatos FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.entregas e
  WHERE ((e.id = entrega_contatos.entrega_id) AND ((e.criado_por = ( SELECT auth.uid() AS uid)) OR (e.voluntario = ( SELECT auth.uid() AS uid)))))));


--
-- Name: entregas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.entregas ENABLE ROW LEVEL SECURITY;

--
-- Name: entregas entregas_apaga; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY entregas_apaga ON public.entregas FOR DELETE TO authenticated USING (((criado_por = ( SELECT auth.uid() AS uid)) OR public.pode_administrar_pagina(sigla_casa)));


--
-- Name: entregas entregas_atualiza; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY entregas_atualiza ON public.entregas FOR UPDATE TO authenticated USING (public.pode_ver_da_casa(sigla_casa, aberto)) WITH CHECK (public.pode_ver_da_casa(sigla_casa, aberto));


--
-- Name: entregas entregas_insere; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY entregas_insere ON public.entregas FOR INSERT TO authenticated WITH CHECK (public.pode_publicar_na_casa(sigla_casa));


--
-- Name: entregas entregas_leitura; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY entregas_leitura ON public.entregas FOR SELECT TO authenticated USING (public.pode_ver_da_casa(sigla_casa, aberto));


--
-- Name: evangelizacao_autorizados; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.evangelizacao_autorizados ENABLE ROW LEVEL SECURITY;

--
-- Name: evangelizacao_autorizados evangelizacao_autorizados_apaga; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY evangelizacao_autorizados_apaga ON public.evangelizacao_autorizados FOR DELETE TO authenticated USING (public.pode_administrar_pagina(sigla_casa));


--
-- Name: evangelizacao_autorizados evangelizacao_autorizados_insere; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY evangelizacao_autorizados_insere ON public.evangelizacao_autorizados FOR INSERT TO authenticated WITH CHECK ((public.pode_administrar_pagina(sigla_casa) AND (criado_por = ( SELECT auth.uid() AS uid))));


--
-- Name: evangelizacao_autorizados evangelizacao_autorizados_leitura; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY evangelizacao_autorizados_leitura ON public.evangelizacao_autorizados FOR SELECT TO authenticated USING ((public.pode_administrar_pagina(sigla_casa) OR public.pode_evangelizacao(sigla_casa)));


--
-- Name: evangelizacao_avaliacoes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.evangelizacao_avaliacoes ENABLE ROW LEVEL SECURITY;

--
-- Name: evangelizacao_avaliacoes evangelizacao_avaliacoes_apaga; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY evangelizacao_avaliacoes_apaga ON public.evangelizacao_avaliacoes FOR DELETE TO authenticated USING (public.pode_evangelizacao(sigla_casa));


--
-- Name: evangelizacao_avaliacoes evangelizacao_avaliacoes_edita; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY evangelizacao_avaliacoes_edita ON public.evangelizacao_avaliacoes FOR UPDATE TO authenticated USING (public.pode_evangelizacao(sigla_casa)) WITH CHECK (public.pode_evangelizacao(sigla_casa));


--
-- Name: evangelizacao_avaliacoes evangelizacao_avaliacoes_insere; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY evangelizacao_avaliacoes_insere ON public.evangelizacao_avaliacoes FOR INSERT TO authenticated WITH CHECK ((public.pode_evangelizacao(sigla_casa) AND (sigla_casa = ( SELECT public.minha_sigla_casa() AS minha_sigla_casa))));


--
-- Name: evangelizacao_avaliacoes evangelizacao_avaliacoes_leitura; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY evangelizacao_avaliacoes_leitura ON public.evangelizacao_avaliacoes FOR SELECT TO authenticated USING (public.pode_evangelizacao(sigla_casa));


--
-- Name: evangelizacao_criancas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.evangelizacao_criancas ENABLE ROW LEVEL SECURITY;

--
-- Name: evangelizacao_criancas evangelizacao_criancas_apaga; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY evangelizacao_criancas_apaga ON public.evangelizacao_criancas FOR DELETE TO authenticated USING (public.pode_evangelizacao(sigla_casa));


--
-- Name: evangelizacao_criancas evangelizacao_criancas_edita; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY evangelizacao_criancas_edita ON public.evangelizacao_criancas FOR UPDATE TO authenticated USING (public.pode_evangelizacao(sigla_casa)) WITH CHECK (public.pode_evangelizacao(sigla_casa));


--
-- Name: evangelizacao_criancas evangelizacao_criancas_insere; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY evangelizacao_criancas_insere ON public.evangelizacao_criancas FOR INSERT TO authenticated WITH CHECK ((public.pode_evangelizacao(sigla_casa) AND (sigla_casa = ( SELECT public.minha_sigla_casa() AS minha_sigla_casa))));


--
-- Name: evangelizacao_criancas evangelizacao_criancas_leitura; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY evangelizacao_criancas_leitura ON public.evangelizacao_criancas FOR SELECT TO authenticated USING (public.pode_evangelizacao(sigla_casa));


--
-- Name: evangelizacao_presencas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.evangelizacao_presencas ENABLE ROW LEVEL SECURITY;

--
-- Name: evangelizacao_presencas evangelizacao_presencas_apaga; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY evangelizacao_presencas_apaga ON public.evangelizacao_presencas FOR DELETE TO authenticated USING (public.pode_evangelizacao(sigla_casa));


--
-- Name: evangelizacao_presencas evangelizacao_presencas_edita; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY evangelizacao_presencas_edita ON public.evangelizacao_presencas FOR UPDATE TO authenticated USING (public.pode_evangelizacao(sigla_casa)) WITH CHECK (public.pode_evangelizacao(sigla_casa));


--
-- Name: evangelizacao_presencas evangelizacao_presencas_insere; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY evangelizacao_presencas_insere ON public.evangelizacao_presencas FOR INSERT TO authenticated WITH CHECK ((public.pode_evangelizacao(sigla_casa) AND (sigla_casa = ( SELECT public.minha_sigla_casa() AS minha_sigla_casa))));


--
-- Name: evangelizacao_presencas evangelizacao_presencas_leitura; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY evangelizacao_presencas_leitura ON public.evangelizacao_presencas FOR SELECT TO authenticated USING (public.pode_evangelizacao(sigla_casa));


--
-- Name: evangelizacao_responsaveis; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.evangelizacao_responsaveis ENABLE ROW LEVEL SECURITY;

--
-- Name: evangelizacao_responsaveis evangelizacao_responsaveis_apaga; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY evangelizacao_responsaveis_apaga ON public.evangelizacao_responsaveis FOR DELETE TO authenticated USING (public.pode_evangelizacao(sigla_casa));


--
-- Name: evangelizacao_responsaveis evangelizacao_responsaveis_edita; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY evangelizacao_responsaveis_edita ON public.evangelizacao_responsaveis FOR UPDATE TO authenticated USING (public.pode_evangelizacao(sigla_casa)) WITH CHECK (public.pode_evangelizacao(sigla_casa));


--
-- Name: evangelizacao_responsaveis evangelizacao_responsaveis_insere; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY evangelizacao_responsaveis_insere ON public.evangelizacao_responsaveis FOR INSERT TO authenticated WITH CHECK ((public.pode_evangelizacao(sigla_casa) AND (sigla_casa = ( SELECT public.minha_sigla_casa() AS minha_sigla_casa))));


--
-- Name: evangelizacao_responsaveis evangelizacao_responsaveis_leitura; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY evangelizacao_responsaveis_leitura ON public.evangelizacao_responsaveis FOR SELECT TO authenticated USING (public.pode_evangelizacao(sigla_casa));


--
-- Name: evangelizacao_turmas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.evangelizacao_turmas ENABLE ROW LEVEL SECURITY;

--
-- Name: evangelizacao_turmas evangelizacao_turmas_apaga; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY evangelizacao_turmas_apaga ON public.evangelizacao_turmas FOR DELETE TO authenticated USING (public.pode_evangelizacao(sigla_casa));


--
-- Name: evangelizacao_turmas evangelizacao_turmas_edita; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY evangelizacao_turmas_edita ON public.evangelizacao_turmas FOR UPDATE TO authenticated USING (public.pode_evangelizacao(sigla_casa)) WITH CHECK (public.pode_evangelizacao(sigla_casa));


--
-- Name: evangelizacao_turmas evangelizacao_turmas_insere; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY evangelizacao_turmas_insere ON public.evangelizacao_turmas FOR INSERT TO authenticated WITH CHECK ((public.pode_evangelizacao(sigla_casa) AND (sigla_casa = ( SELECT public.minha_sigla_casa() AS minha_sigla_casa))));


--
-- Name: evangelizacao_turmas evangelizacao_turmas_leitura; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY evangelizacao_turmas_leitura ON public.evangelizacao_turmas FOR SELECT TO authenticated USING (public.pode_evangelizacao(sigla_casa));


--
-- Name: agenda_eventos eventos_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY eventos_delete ON public.agenda_eventos FOR DELETE TO authenticated USING ((criador_id = ( SELECT auth.uid() AS uid)));


--
-- Name: agenda_eventos eventos_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY eventos_insert ON public.agenda_eventos FOR INSERT TO authenticated WITH CHECK (((criador_id = ( SELECT auth.uid() AS uid)) AND (sigla_casa = ( SELECT profiles.sigla_casa
   FROM public.profiles
  WHERE (profiles.id = ( SELECT auth.uid() AS uid))))));


--
-- Name: agenda_eventos eventos_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY eventos_select ON public.agenda_eventos FOR SELECT TO authenticated USING ((sigla_casa = ( SELECT profiles.sigla_casa
   FROM public.profiles
  WHERE (profiles.id = ( SELECT auth.uid() AS uid)))));


--
-- Name: agenda_eventos eventos_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY eventos_update ON public.agenda_eventos FOR UPDATE TO authenticated USING ((criador_id = ( SELECT auth.uid() AS uid)));


--
-- Name: forum_respostas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.forum_respostas ENABLE ROW LEVEL SECURITY;

--
-- Name: forum_respostas forum_respostas_apaga; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY forum_respostas_apaga ON public.forum_respostas FOR DELETE TO authenticated USING (((criado_por = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM public.forum_topicos t
  WHERE ((t.id = forum_respostas.topico_id) AND public.pode_administrar_pagina(t.sigla_casa))))));


--
-- Name: forum_respostas forum_respostas_edita; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY forum_respostas_edita ON public.forum_respostas FOR UPDATE TO authenticated USING ((criado_por = ( SELECT auth.uid() AS uid))) WITH CHECK ((criado_por = ( SELECT auth.uid() AS uid)));


--
-- Name: forum_respostas forum_respostas_insere; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY forum_respostas_insere ON public.forum_respostas FOR INSERT TO authenticated WITH CHECK (((criado_por = ( SELECT auth.uid() AS uid)) AND ( SELECT public.email_verificado() AS email_verificado) AND (NOT public.usuario_sancionado(( SELECT auth.uid() AS uid))) AND (EXISTS ( SELECT 1
   FROM public.forum_topicos t
  WHERE ((t.id = forum_respostas.topico_id) AND public.pode_ver_da_casa(t.sigla_casa, t.aberto))))));


--
-- Name: forum_respostas forum_respostas_leitura; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY forum_respostas_leitura ON public.forum_respostas FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.forum_topicos t
  WHERE ((t.id = forum_respostas.topico_id) AND public.pode_ver_da_casa(t.sigla_casa, t.aberto)))));


--
-- Name: forum_topicos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.forum_topicos ENABLE ROW LEVEL SECURITY;

--
-- Name: forum_topicos forum_topicos_apaga; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY forum_topicos_apaga ON public.forum_topicos FOR DELETE TO authenticated USING (((criado_por = ( SELECT auth.uid() AS uid)) OR public.pode_administrar_pagina(sigla_casa)));


--
-- Name: forum_topicos forum_topicos_edita; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY forum_topicos_edita ON public.forum_topicos FOR UPDATE TO authenticated USING (((criado_por = ( SELECT auth.uid() AS uid)) OR public.pode_administrar_pagina(sigla_casa))) WITH CHECK (((criado_por = ( SELECT auth.uid() AS uid)) OR public.pode_administrar_pagina(sigla_casa)));


--
-- Name: forum_topicos forum_topicos_insere; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY forum_topicos_insere ON public.forum_topicos FOR INSERT TO authenticated WITH CHECK (public.pode_publicar_na_casa(sigla_casa));


--
-- Name: forum_topicos forum_topicos_leitura; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY forum_topicos_leitura ON public.forum_topicos FOR SELECT TO authenticated USING (public.pode_ver_da_casa(sigla_casa, aberto));


--
-- Name: grupo_membros; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.grupo_membros ENABLE ROW LEVEL SECURITY;

--
-- Name: grupo_membros grupo_membros_entra; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY grupo_membros_entra ON public.grupo_membros FOR INSERT TO authenticated WITH CHECK ((public.sou_moderador_do_grupo(grupo_id) OR ((user_id = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM public.grupos g
  WHERE ((g.id = grupo_membros.grupo_id) AND (NOT g.privado) AND public.pode_ver_da_casa(g.sigla_casa, g.aberto)))))));


--
-- Name: grupo_membros grupo_membros_leitura; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY grupo_membros_leitura ON public.grupo_membros FOR SELECT TO authenticated USING ((public.sou_do_grupo(grupo_id) OR (EXISTS ( SELECT 1
   FROM public.grupos g
  WHERE ((g.id = grupo_membros.grupo_id) AND (NOT g.privado) AND public.pode_ver_da_casa(g.sigla_casa, g.aberto))))));


--
-- Name: grupo_membros grupo_membros_sai; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY grupo_membros_sai ON public.grupo_membros FOR DELETE TO authenticated USING (((user_id = ( SELECT auth.uid() AS uid)) OR public.sou_moderador_do_grupo(grupo_id) OR public.pode_administrar_pagina(sigla_casa)));


--
-- Name: grupo_mensagens; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.grupo_mensagens ENABLE ROW LEVEL SECURITY;

--
-- Name: grupo_mensagens grupo_mensagens_apaga; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY grupo_mensagens_apaga ON public.grupo_mensagens FOR DELETE TO authenticated USING (((criado_por = ( SELECT auth.uid() AS uid)) OR public.sou_moderador_do_grupo(grupo_id)));


--
-- Name: grupo_mensagens grupo_mensagens_insere; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY grupo_mensagens_insere ON public.grupo_mensagens FOR INSERT TO authenticated WITH CHECK (((criado_por = ( SELECT auth.uid() AS uid)) AND public.sou_do_grupo(grupo_id) AND (NOT public.usuario_sancionado(( SELECT auth.uid() AS uid)))));


--
-- Name: grupo_mensagens grupo_mensagens_leitura; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY grupo_mensagens_leitura ON public.grupo_mensagens FOR SELECT TO authenticated USING (public.sou_do_grupo(grupo_id));


--
-- Name: grupos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.grupos ENABLE ROW LEVEL SECURITY;

--
-- Name: grupos grupos_apaga; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY grupos_apaga ON public.grupos FOR DELETE TO authenticated USING (((criado_por = ( SELECT auth.uid() AS uid)) OR public.pode_administrar_pagina(sigla_casa)));


--
-- Name: grupos grupos_edita; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY grupos_edita ON public.grupos FOR UPDATE TO authenticated USING (((criado_por = ( SELECT auth.uid() AS uid)) OR public.pode_administrar_pagina(sigla_casa))) WITH CHECK (((criado_por = ( SELECT auth.uid() AS uid)) OR public.pode_administrar_pagina(sigla_casa)));


--
-- Name: grupos grupos_insere; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY grupos_insere ON public.grupos FOR INSERT TO authenticated WITH CHECK (public.pode_publicar_na_casa(sigla_casa));


--
-- Name: grupos grupos_leitura; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY grupos_leitura ON public.grupos FOR SELECT TO authenticated USING (((public.pode_ver_da_casa(sigla_casa, aberto) AND (NOT privado)) OR public.sou_do_grupo(id)));


--
-- Name: casas_espirita insercao_service_role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY insercao_service_role ON public.casas_espirita FOR INSERT WITH CHECK (false);


--
-- Name: solicitacoes_dev inserir propria solicitacao; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "inserir propria solicitacao" ON public.solicitacoes_dev FOR INSERT TO authenticated WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));


--
-- Name: jovens_membros; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.jovens_membros ENABLE ROW LEVEL SECURITY;

--
-- Name: jovens_membros jovens_membros_edita; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY jovens_membros_edita ON public.jovens_membros FOR UPDATE TO authenticated USING ((criado_por = ( SELECT auth.uid() AS uid))) WITH CHECK ((criado_por = ( SELECT auth.uid() AS uid)));


--
-- Name: jovens_membros jovens_membros_entra; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY jovens_membros_entra ON public.jovens_membros FOR INSERT TO authenticated WITH CHECK ((public.pode_publicar_na_casa(sigla_casa) AND (criado_por = ( SELECT auth.uid() AS uid))));


--
-- Name: jovens_membros jovens_membros_leitura; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY jovens_membros_leitura ON public.jovens_membros FOR SELECT TO authenticated USING (public.pode_ver_da_casa(sigla_casa, false));


--
-- Name: jovens_membros jovens_membros_sai; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY jovens_membros_sai ON public.jovens_membros FOR DELETE TO authenticated USING (((criado_por = ( SELECT auth.uid() AS uid)) OR public.pode_administrar_pagina(sigla_casa)));


--
-- Name: jovens_publicacoes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.jovens_publicacoes ENABLE ROW LEVEL SECURITY;

--
-- Name: jovens_publicacoes jovens_publicacoes_apaga; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY jovens_publicacoes_apaga ON public.jovens_publicacoes FOR DELETE TO authenticated USING (((criado_por = ( SELECT auth.uid() AS uid)) OR public.pode_administrar_pagina(sigla_casa)));


--
-- Name: jovens_publicacoes jovens_publicacoes_edita; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY jovens_publicacoes_edita ON public.jovens_publicacoes FOR UPDATE TO authenticated USING (((criado_por = ( SELECT auth.uid() AS uid)) OR public.pode_administrar_pagina(sigla_casa))) WITH CHECK (((criado_por = ( SELECT auth.uid() AS uid)) OR public.pode_administrar_pagina(sigla_casa)));


--
-- Name: jovens_publicacoes jovens_publicacoes_insere; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY jovens_publicacoes_insere ON public.jovens_publicacoes FOR INSERT TO authenticated WITH CHECK ((public.pode_publicar_na_casa(sigla_casa) AND (EXISTS ( SELECT 1
   FROM public.jovens_membros m
  WHERE (m.criado_por = ( SELECT auth.uid() AS uid))))));


--
-- Name: jovens_publicacoes jovens_publicacoes_leitura; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY jovens_publicacoes_leitura ON public.jovens_publicacoes FOR SELECT TO authenticated USING (public.pode_ver_da_casa(sigla_casa, aberto));


--
-- Name: kanban_boards; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.kanban_boards ENABLE ROW LEVEL SECURITY;

--
-- Name: kanban_boards kanban_boards_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kanban_boards_policy ON public.kanban_boards USING (public.has_kanban_access(sigla_casa)) WITH CHECK (public.has_kanban_access(sigla_casa));


--
-- Name: kanban_comentarios; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.kanban_comentarios ENABLE ROW LEVEL SECURITY;

--
-- Name: kanban_comentarios kanban_comentarios_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kanban_comentarios_policy ON public.kanban_comentarios USING ((EXISTS ( SELECT 1
   FROM public.kanban_eventos e
  WHERE ((e.id = kanban_comentarios.evento_id) AND public.has_kanban_access(e.sigla_casa))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.kanban_eventos e
  WHERE ((e.id = kanban_comentarios.evento_id) AND public.has_kanban_access(e.sigla_casa)))));


--
-- Name: kanban_config; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.kanban_config ENABLE ROW LEVEL SECURITY;

--
-- Name: kanban_config kanban_config_insert_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kanban_config_insert_delete ON public.kanban_config TO authenticated USING ((sigla_casa = ( SELECT profiles.sigla_casa
   FROM public.profiles
  WHERE (profiles.id = ( SELECT auth.uid() AS uid))))) WITH CHECK ((sigla_casa = ( SELECT profiles.sigla_casa
   FROM public.profiles
  WHERE (profiles.id = ( SELECT auth.uid() AS uid)))));


--
-- Name: kanban_config kanban_config_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kanban_config_select ON public.kanban_config FOR SELECT USING ((((auth.role() = 'authenticated'::text) AND (sigla_casa = ( SELECT profiles.sigla_casa
   FROM public.profiles
  WHERE (profiles.id = ( SELECT auth.uid() AS uid))))) OR (public.get_request_kanban_token() = (share_token)::text)));


--
-- Name: kanban_config kanban_config_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kanban_config_update ON public.kanban_config FOR UPDATE USING ((((auth.role() = 'authenticated'::text) AND (sigla_casa = ( SELECT profiles.sigla_casa
   FROM public.profiles
  WHERE (profiles.id = ( SELECT auth.uid() AS uid))))) OR (public.get_request_kanban_token() = (share_token)::text)));


--
-- Name: kanban_eventos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.kanban_eventos ENABLE ROW LEVEL SECURITY;

--
-- Name: kanban_eventos kanban_eventos_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kanban_eventos_policy ON public.kanban_eventos USING (public.has_kanban_access(sigla_casa)) WITH CHECK (public.has_kanban_access(sigla_casa));


--
-- Name: kanban_frentes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.kanban_frentes ENABLE ROW LEVEL SECURITY;

--
-- Name: kanban_frentes kanban_frentes_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kanban_frentes_policy ON public.kanban_frentes USING (public.has_kanban_access(sigla_casa)) WITH CHECK (public.has_kanban_access(sigla_casa));


--
-- Name: kanban_grupos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.kanban_grupos ENABLE ROW LEVEL SECURITY;

--
-- Name: kanban_grupos kanban_grupos_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kanban_grupos_policy ON public.kanban_grupos USING (public.has_kanban_access(sigla_casa)) WITH CHECK (public.has_kanban_access(sigla_casa));


--
-- Name: kanban_listas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.kanban_listas ENABLE ROW LEVEL SECURITY;

--
-- Name: kanban_listas kanban_listas_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kanban_listas_policy ON public.kanban_listas USING (public.has_kanban_access(sigla_casa)) WITH CHECK (public.has_kanban_access(sigla_casa));


--
-- Name: kanban_tarefas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.kanban_tarefas ENABLE ROW LEVEL SECURITY;

--
-- Name: kanban_tarefas kanban_tarefas_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kanban_tarefas_policy ON public.kanban_tarefas USING (public.has_kanban_access(sigla_casa)) WITH CHECK (public.has_kanban_access(sigla_casa));


--
-- Name: casas_espirita leitura_publica; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY leitura_publica ON public.casas_espirita FOR SELECT USING ((ativa = true));


--
-- Name: memoria_virtudes_custom mem_virt_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY mem_virt_read ON public.memoria_virtudes_custom FOR SELECT USING ((( SELECT auth.uid() AS uid) IS NOT NULL));


--
-- Name: memoria_virtudes_custom mem_virt_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY mem_virt_write ON public.memoria_virtudes_custom USING (((( SELECT auth.uid() AS uid) IS NOT NULL) AND (sigla_casa = ( SELECT profiles.sigla_casa
   FROM public.profiles
  WHERE (profiles.id = ( SELECT auth.uid() AS uid))
 LIMIT 1)))) WITH CHECK (((( SELECT auth.uid() AS uid) IS NOT NULL) AND (sigla_casa = ( SELECT profiles.sigla_casa
   FROM public.profiles
  WHERE (profiles.id = ( SELECT auth.uid() AS uid))
 LIMIT 1))));


--
-- Name: kanban_eventos membros criam eventos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "membros criam eventos" ON public.kanban_eventos FOR INSERT WITH CHECK ((sigla_casa = ( SELECT profiles.sigla_casa
   FROM public.profiles
  WHERE (profiles.id = ( SELECT auth.uid() AS uid)))));


--
-- Name: kanban_grupos membros criam grupos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "membros criam grupos" ON public.kanban_grupos FOR INSERT WITH CHECK ((sigla_casa = ( SELECT profiles.sigla_casa
   FROM public.profiles
  WHERE (profiles.id = ( SELECT auth.uid() AS uid)))));


--
-- Name: kanban_tarefas membros criam tarefas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "membros criam tarefas" ON public.kanban_tarefas FOR INSERT WITH CHECK ((sigla_casa = ( SELECT profiles.sigla_casa
   FROM public.profiles
  WHERE (profiles.id = ( SELECT auth.uid() AS uid)))));


--
-- Name: kanban_eventos membros leem eventos da casa; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "membros leem eventos da casa" ON public.kanban_eventos FOR SELECT USING ((sigla_casa = ( SELECT profiles.sigla_casa
   FROM public.profiles
  WHERE (profiles.id = ( SELECT auth.uid() AS uid)))));


--
-- Name: kanban_grupos membros leem grupos da casa; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "membros leem grupos da casa" ON public.kanban_grupos FOR SELECT USING ((sigla_casa = ( SELECT profiles.sigla_casa
   FROM public.profiles
  WHERE (profiles.id = ( SELECT auth.uid() AS uid)))));


--
-- Name: kanban_tarefas membros leem tarefas da casa; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "membros leem tarefas da casa" ON public.kanban_tarefas FOR SELECT USING ((sigla_casa = ( SELECT profiles.sigla_casa
   FROM public.profiles
  WHERE (profiles.id = ( SELECT auth.uid() AS uid)))));


--
-- Name: memoria_virtudes_custom; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.memoria_virtudes_custom ENABLE ROW LEVEL SECURITY;

--
-- Name: mensagens_do_dia mensagens_delete_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY mensagens_delete_own ON public.mensagens_do_dia FOR DELETE TO authenticated USING (((( SELECT auth.uid() AS uid) = autor_id) AND (data_exibicao IS NULL)));


--
-- Name: mensagens_do_dia; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.mensagens_do_dia ENABLE ROW LEVEL SECURITY;

--
-- Name: mensagens_do_dia mensagens_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY mensagens_insert ON public.mensagens_do_dia FOR INSERT TO authenticated WITH CHECK ((( SELECT auth.uid() AS uid) = autor_id));


--
-- Name: mensagens_do_dia mensagens_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY mensagens_read ON public.mensagens_do_dia FOR SELECT TO authenticated USING ((aprovada = true));


--
-- Name: mensagens_do_dia mensagens_update_scheduling; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY mensagens_update_scheduling ON public.mensagens_do_dia FOR UPDATE TO authenticated USING ((aprovada = true)) WITH CHECK ((aprovada = true));


--
-- Name: musicas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.musicas ENABLE ROW LEVEL SECURITY;

--
-- Name: musicas musicas_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY musicas_delete ON public.musicas FOR DELETE TO authenticated USING (((( SELECT auth.uid() AS uid) = user_id) OR (EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.cargo_principal = ANY (ARRAY['Presidente'::text, 'Vice-presidente'::text, 'DEV'::text])))))));


--
-- Name: musicas musicas_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY musicas_insert ON public.musicas FOR INSERT TO authenticated WITH CHECK (((( SELECT auth.uid() AS uid) = user_id) AND (NOT (sigla_casa IS DISTINCT FROM ( SELECT profiles.sigla_casa
   FROM public.profiles
  WHERE (profiles.id = ( SELECT auth.uid() AS uid)))))));


--
-- Name: musicas musicas_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY musicas_select ON public.musicas FOR SELECT USING (((is_exclusive = false) OR ((auth.role() = 'authenticated'::text) AND (sigla_casa = ( SELECT profiles.sigla_casa
   FROM public.profiles
  WHERE (profiles.id = ( SELECT auth.uid() AS uid)))))));


--
-- Name: musicas musicas_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY musicas_update ON public.musicas FOR UPDATE TO authenticated USING (((( SELECT auth.uid() AS uid) = user_id) OR (EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.cargo_principal = ANY (ARRAY['Presidente'::text, 'Vice-presidente'::text, 'DEV'::text]))))))) WITH CHECK (((( SELECT auth.uid() AS uid) = user_id) OR (EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.cargo_principal = ANY (ARRAY['Presidente'::text, 'Vice-presidente'::text, 'DEV'::text])))))));


--
-- Name: voluntariado_necessidades necessidades_apaga; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY necessidades_apaga ON public.voluntariado_necessidades FOR DELETE TO authenticated USING (((criado_por = ( SELECT auth.uid() AS uid)) OR public.pode_administrar_pagina(sigla_casa)));


--
-- Name: voluntariado_necessidades necessidades_edita; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY necessidades_edita ON public.voluntariado_necessidades FOR UPDATE TO authenticated USING (((criado_por = ( SELECT auth.uid() AS uid)) OR public.pode_administrar_pagina(sigla_casa))) WITH CHECK (((criado_por = ( SELECT auth.uid() AS uid)) OR public.pode_administrar_pagina(sigla_casa)));


--
-- Name: voluntariado_necessidades necessidades_insere; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY necessidades_insere ON public.voluntariado_necessidades FOR INSERT TO authenticated WITH CHECK (public.pode_publicar_na_casa(sigla_casa));


--
-- Name: voluntariado_necessidades necessidades_leitura; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY necessidades_leitura ON public.voluntariado_necessidades FOR SELECT TO authenticated USING (public.pode_ver_da_casa(sigla_casa, aberto));


--
-- Name: voluntariado_ofertas ofertas_apaga; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ofertas_apaga ON public.voluntariado_ofertas FOR DELETE TO authenticated USING (((criado_por = ( SELECT auth.uid() AS uid)) OR public.pode_administrar_pagina(sigla_casa)));


--
-- Name: voluntariado_ofertas ofertas_edita; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ofertas_edita ON public.voluntariado_ofertas FOR UPDATE TO authenticated USING ((criado_por = ( SELECT auth.uid() AS uid))) WITH CHECK ((criado_por = ( SELECT auth.uid() AS uid)));


--
-- Name: voluntariado_ofertas ofertas_insere; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ofertas_insere ON public.voluntariado_ofertas FOR INSERT TO authenticated WITH CHECK (public.pode_publicar_na_casa(sigla_casa));


--
-- Name: voluntariado_ofertas ofertas_leitura; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ofertas_leitura ON public.voluntariado_ofertas FOR SELECT TO authenticated USING (public.pode_ver_da_casa(sigla_casa, aberto));


--
-- Name: oracao_horarios; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.oracao_horarios ENABLE ROW LEVEL SECURITY;

--
-- Name: oracao_horarios oracao_horarios_apaga; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY oracao_horarios_apaga ON public.oracao_horarios FOR DELETE TO authenticated USING (((criado_por = ( SELECT auth.uid() AS uid)) OR public.pode_administrar_pagina(sigla_casa)));


--
-- Name: oracao_horarios oracao_horarios_edita; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY oracao_horarios_edita ON public.oracao_horarios FOR UPDATE TO authenticated USING (((criado_por = ( SELECT auth.uid() AS uid)) OR public.pode_administrar_pagina(sigla_casa))) WITH CHECK (((criado_por = ( SELECT auth.uid() AS uid)) OR public.pode_administrar_pagina(sigla_casa)));


--
-- Name: oracao_horarios oracao_horarios_insere; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY oracao_horarios_insere ON public.oracao_horarios FOR INSERT TO authenticated WITH CHECK (public.pode_publicar_na_casa(sigla_casa));


--
-- Name: oracao_horarios oracao_horarios_leitura; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY oracao_horarios_leitura ON public.oracao_horarios FOR SELECT TO authenticated USING (public.pode_ver_da_casa(sigla_casa, aberto));


--
-- Name: oracao_inscricoes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.oracao_inscricoes ENABLE ROW LEVEL SECURITY;

--
-- Name: oracao_inscricoes oracao_inscricoes_apaga; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY oracao_inscricoes_apaga ON public.oracao_inscricoes FOR DELETE TO authenticated USING (((criado_por = ( SELECT auth.uid() AS uid)) OR public.pode_administrar_pagina(sigla_casa)));


--
-- Name: oracao_inscricoes oracao_inscricoes_insere; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY oracao_inscricoes_insere ON public.oracao_inscricoes FOR INSERT TO authenticated WITH CHECK (((criado_por = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM public.oracao_horarios h
  WHERE ((h.id = oracao_inscricoes.horario_id) AND public.pode_ver_da_casa(h.sigla_casa, h.aberto))))));


--
-- Name: oracao_inscricoes oracao_inscricoes_leitura; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY oracao_inscricoes_leitura ON public.oracao_inscricoes FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.oracao_horarios h
  WHERE ((h.id = oracao_inscricoes.horario_id) AND public.pode_ver_da_casa(h.sigla_casa, h.aberto)))));


--
-- Name: paginas_casas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.paginas_casas ENABLE ROW LEVEL SECURITY;

--
-- Name: paginas_casas paginas_casas_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY paginas_casas_insert ON public.paginas_casas FOR INSERT TO authenticated WITH CHECK (public.pode_administrar_pagina(sigla_casa));


--
-- Name: paginas_casas paginas_casas_leitura_publica; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY paginas_casas_leitura_publica ON public.paginas_casas FOR SELECT TO anon USING ((publicada = true));


--
-- Name: paginas_casas paginas_casas_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY paginas_casas_select ON public.paginas_casas FOR SELECT TO authenticated USING (true);


--
-- Name: paginas_casas paginas_casas_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY paginas_casas_update ON public.paginas_casas FOR UPDATE TO authenticated USING (public.pode_administrar_pagina(sigla_casa)) WITH CHECK (public.pode_administrar_pagina(sigla_casa));


--
-- Name: painel_votes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.painel_votes ENABLE ROW LEVEL SECURITY;

--
-- Name: agenda_participantes participantes_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY participantes_delete ON public.agenda_participantes FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.agenda_eventos e
  WHERE ((e.id = agenda_participantes.evento_id) AND (e.criador_id = ( SELECT auth.uid() AS uid))))));


--
-- Name: agenda_participantes participantes_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY participantes_insert ON public.agenda_participantes FOR INSERT TO authenticated WITH CHECK (((EXISTS ( SELECT 1
   FROM public.agenda_eventos e
  WHERE ((e.id = agenda_participantes.evento_id) AND (e.criador_id = ( SELECT auth.uid() AS uid))))) OR ((user_id = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM public.agenda_eventos e
  WHERE ((e.id = agenda_participantes.evento_id) AND (e.tipo = 'aberto'::text)))))));


--
-- Name: agenda_participantes participantes_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY participantes_select ON public.agenda_participantes FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.agenda_eventos e
  WHERE ((e.id = agenda_participantes.evento_id) AND (e.sigla_casa = ( SELECT profiles.sigla_casa
           FROM public.profiles
          WHERE (profiles.id = ( SELECT auth.uid() AS uid))))))));


--
-- Name: agenda_participantes participantes_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY participantes_update ON public.agenda_participantes FOR UPDATE TO authenticated USING (((user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM public.agenda_eventos e
  WHERE ((e.id = agenda_participantes.evento_id) AND (e.criador_id = ( SELECT auth.uid() AS uid)))))));


--
-- Name: apresentacao_perguntas perguntas_envia; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY perguntas_envia ON public.apresentacao_perguntas FOR INSERT TO authenticated, anon WITH CHECK ((EXISTS ( SELECT 1
   FROM public.apresentacao_sessoes s
  WHERE ((s.id = apresentacao_perguntas.sessao_id) AND s.ativa AND s.aceita_perguntas))));


--
-- Name: apresentacao_perguntas perguntas_le_quem_apresenta; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY perguntas_le_quem_apresenta ON public.apresentacao_perguntas FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.apresentacao_sessoes s
  WHERE ((s.id = apresentacao_perguntas.sessao_id) AND (s.iniciada_por = ( SELECT auth.uid() AS uid))))));


--
-- Name: apresentacao_perguntas perguntas_marca_quem_apresenta; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY perguntas_marca_quem_apresenta ON public.apresentacao_perguntas FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.apresentacao_sessoes s
  WHERE ((s.id = apresentacao_perguntas.sessao_id) AND (s.iniciada_por = ( SELECT auth.uid() AS uid))))));


--
-- Name: problem_reports; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.problem_reports ENABLE ROW LEVEL SECURITY;

--
-- Name: problem_reports problem_reports_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY problem_reports_insert ON public.problem_reports FOR INSERT WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));


--
-- Name: problem_reports problem_reports_select_none; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY problem_reports_select_none ON public.problem_reports FOR SELECT USING (false);


--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles profiles_atualizacao_propria; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_atualizacao_propria ON public.profiles FOR UPDATE USING ((( SELECT auth.uid() AS uid) = id));


--
-- Name: profiles profiles_insercao_propria; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_insercao_propria ON public.profiles FOR INSERT WITH CHECK ((( SELECT auth.uid() AS uid) = id));


--
-- Name: profiles profiles_leitura_dev; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_leitura_dev ON public.profiles FOR SELECT TO authenticated USING (( SELECT public.sou_dev() AS sou_dev));


--
-- Name: profiles profiles_leitura_mesma_casa; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_leitura_mesma_casa ON public.profiles FOR SELECT TO authenticated USING (((sigla_casa IS NOT NULL) AND (sigla_casa = ( SELECT public.minha_sigla_casa() AS minha_sigla_casa))));


--
-- Name: profiles profiles_leitura_propria; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_leitura_propria ON public.profiles FOR SELECT USING ((( SELECT auth.uid() AS uid) = id));


--
-- Name: programacao_eventos prog_ev_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY prog_ev_delete ON public.programacao_eventos FOR DELETE TO authenticated USING (true);


--
-- Name: programacao_eventos prog_ev_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY prog_ev_insert ON public.programacao_eventos FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: programacao_eventos prog_ev_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY prog_ev_select ON public.programacao_eventos FOR SELECT TO authenticated USING (true);


--
-- Name: programacao_eventos prog_ev_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY prog_ev_update ON public.programacao_eventos FOR UPDATE TO authenticated USING (true);


--
-- Name: programacao_participantes prog_part_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY prog_part_delete ON public.programacao_participantes FOR DELETE TO authenticated USING (true);


--
-- Name: programacao_participantes prog_part_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY prog_part_insert ON public.programacao_participantes FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: programacao_participantes prog_part_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY prog_part_select ON public.programacao_participantes FOR SELECT TO authenticated USING (true);


--
-- Name: programacao_participantes prog_part_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY prog_part_update ON public.programacao_participantes FOR UPDATE TO authenticated USING (true);


--
-- Name: programacao_eventos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.programacao_eventos ENABLE ROW LEVEL SECURITY;

--
-- Name: programacao_participantes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.programacao_participantes ENABLE ROW LEVEL SECURITY;

--
-- Name: publicacoes_casa; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.publicacoes_casa ENABLE ROW LEVEL SECURITY;

--
-- Name: publicacoes_casa publicacoes_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY publicacoes_delete ON public.publicacoes_casa FOR DELETE TO authenticated USING (true);


--
-- Name: publicacoes_casa publicacoes_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY publicacoes_insert ON public.publicacoes_casa FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: publicacoes_casa publicacoes_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY publicacoes_select ON public.publicacoes_casa FOR SELECT TO authenticated USING (true);


--
-- Name: publicacoes_casa publicacoes_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY publicacoes_update ON public.publicacoes_casa FOR UPDATE TO authenticated USING (true);


--
-- Name: kanban_eventos qualquer membro atualiza; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "qualquer membro atualiza" ON public.kanban_eventos FOR UPDATE USING ((sigla_casa = ( SELECT profiles.sigla_casa
   FROM public.profiles
  WHERE (profiles.id = ( SELECT auth.uid() AS uid)))));


--
-- Name: kanban_grupos qualquer membro atualiza grupos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "qualquer membro atualiza grupos" ON public.kanban_grupos FOR UPDATE USING ((sigla_casa = ( SELECT profiles.sigla_casa
   FROM public.profiles
  WHERE (profiles.id = ( SELECT auth.uid() AS uid)))));


--
-- Name: kanban_tarefas qualquer membro atualiza tarefas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "qualquer membro atualiza tarefas" ON public.kanban_tarefas FOR UPDATE USING ((sigla_casa = ( SELECT profiles.sigla_casa
   FROM public.profiles
  WHERE (profiles.id = ( SELECT auth.uid() AS uid)))));


--
-- Name: kanban_grupos qualquer membro exclui grupos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "qualquer membro exclui grupos" ON public.kanban_grupos FOR DELETE USING ((sigla_casa = ( SELECT profiles.sigla_casa
   FROM public.profiles
  WHERE (profiles.id = ( SELECT auth.uid() AS uid)))));


--
-- Name: kanban_tarefas qualquer membro exclui tarefas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "qualquer membro exclui tarefas" ON public.kanban_tarefas FOR DELETE USING ((sigla_casa = ( SELECT profiles.sigla_casa
   FROM public.profiles
  WHERE (profiles.id = ( SELECT auth.uid() AS uid)))));


--
-- Name: site_suggestions qualquer um pode inserir sugestao; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "qualquer um pode inserir sugestao" ON public.site_suggestions FOR INSERT WITH CHECK (true);


--
-- Name: apresentacao_sessoes sessoes_comanda_quem_apresenta; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sessoes_comanda_quem_apresenta ON public.apresentacao_sessoes FOR UPDATE TO authenticated USING ((iniciada_por = ( SELECT auth.uid() AS uid)));


--
-- Name: apresentacao_sessoes sessoes_cria; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sessoes_cria ON public.apresentacao_sessoes FOR INSERT TO authenticated WITH CHECK (((iniciada_por = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM (public.apresentacoes a
     JOIN public.profiles p ON ((p.id = ( SELECT auth.uid() AS uid))))
  WHERE ((a.id = apresentacao_sessoes.apresentacao_id) AND (a.sigla_casa = p.sigla_casa))))));


--
-- Name: apresentacao_sessoes sessoes_leitura_do_dono; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sessoes_leitura_do_dono ON public.apresentacao_sessoes FOR SELECT TO authenticated USING ((iniciada_por = ( SELECT auth.uid() AS uid)));


--
-- Name: apresentacao_sessoes sessoes_leitura_publica; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sessoes_leitura_publica ON public.apresentacao_sessoes FOR SELECT TO authenticated, anon USING (ativa);


--
-- Name: siglas_casas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.siglas_casas ENABLE ROW LEVEL SECURITY;

--
-- Name: siglas_casas siglas_insercao_autenticado; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY siglas_insercao_autenticado ON public.siglas_casas FOR INSERT TO authenticated WITH CHECK ((sigla ~ '^[A-Z]{5}$'::text));


--
-- Name: siglas_casas siglas_leitura_publica; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY siglas_leitura_publica ON public.siglas_casas FOR SELECT USING (true);


--
-- Name: site_suggestions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.site_suggestions ENABLE ROW LEVEL SECURITY;

--
-- Name: solicitacoes_dev; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.solicitacoes_dev ENABLE ROW LEVEL SECURITY;

--
-- Name: kanban_eventos somente criador exclui; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "somente criador exclui" ON public.kanban_eventos FOR DELETE USING ((criador_id = ( SELECT auth.uid() AS uid)));


--
-- Name: tesouraria_autorizacoes tes_autoriz_modify; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tes_autoriz_modify ON public.tesouraria_autorizacoes USING (public.is_tesouraria_admin(sigla_casa)) WITH CHECK (public.is_tesouraria_admin(sigla_casa));


--
-- Name: tesouraria_autorizacoes tes_autoriz_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tes_autoriz_select ON public.tesouraria_autorizacoes FOR SELECT USING ((sigla_casa = ( SELECT profiles.sigla_casa
   FROM public.profiles
  WHERE (profiles.id = ( SELECT auth.uid() AS uid)))));


--
-- Name: tesouraria_autorizacoes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tesouraria_autorizacoes ENABLE ROW LEVEL SECURITY;

--
-- Name: tesouraria_transacoes tesouraria_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tesouraria_delete ON public.tesouraria_transacoes FOR DELETE TO authenticated USING ((criador_id = ( SELECT auth.uid() AS uid)));


--
-- Name: tesouraria_transacoes tesouraria_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tesouraria_insert ON public.tesouraria_transacoes FOR INSERT TO authenticated WITH CHECK (((sigla_casa = ( SELECT profiles.sigla_casa
   FROM public.profiles
  WHERE (profiles.id = ( SELECT auth.uid() AS uid)))) AND (criador_id = ( SELECT auth.uid() AS uid))));


--
-- Name: tesouraria_transacoes tesouraria_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tesouraria_select ON public.tesouraria_transacoes FOR SELECT TO authenticated USING ((sigla_casa = ( SELECT profiles.sigla_casa
   FROM public.profiles
  WHERE (profiles.id = ( SELECT auth.uid() AS uid)))));


--
-- Name: tesouraria_transacoes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tesouraria_transacoes ENABLE ROW LEVEL SECURITY;

--
-- Name: tesouraria_transacoes tesouraria_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tesouraria_update ON public.tesouraria_transacoes FOR UPDATE TO authenticated USING ((criador_id = ( SELECT auth.uid() AS uid)));


--
-- Name: usuarios_sancoes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.usuarios_sancoes ENABLE ROW LEVEL SECURITY;

--
-- Name: usuarios_sancoes usuarios_sancoes_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY usuarios_sancoes_insert ON public.usuarios_sancoes FOR INSERT WITH CHECK (((aplicada_por = ( SELECT auth.uid() AS uid)) AND public.pode_sancionar(user_id)));


--
-- Name: usuarios_sancoes usuarios_sancoes_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY usuarios_sancoes_select ON public.usuarios_sancoes FOR SELECT USING (((user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.cargo_principal = 'DEV'::text)))) OR (EXISTS ( SELECT 1
   FROM (public.profiles p
     JOIN public.profiles alvo ON ((alvo.id = usuarios_sancoes.user_id)))
  WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.sigla_casa = alvo.sigla_casa) AND (p.cargo_principal = ANY (ARRAY['Presidente'::text, 'Vice-presidente'::text])))))));


--
-- Name: usuarios_sancoes usuarios_sancoes_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY usuarios_sancoes_update ON public.usuarios_sancoes FOR UPDATE USING (public.pode_sancionar(user_id)) WITH CHECK (public.pode_sancionar(user_id));


--
-- Name: solicitacoes_dev ver proprias solicitacoes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "ver proprias solicitacoes" ON public.solicitacoes_dev FOR SELECT TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));


--
-- Name: solicitacoes_dev ver todas as solicitacoes autenticado; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "ver todas as solicitacoes autenticado" ON public.solicitacoes_dev FOR SELECT TO authenticated USING (true);


--
-- Name: voluntariado_candidaturas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.voluntariado_candidaturas ENABLE ROW LEVEL SECURITY;

--
-- Name: voluntariado_necessidades; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.voluntariado_necessidades ENABLE ROW LEVEL SECURITY;

--
-- Name: voluntariado_ofertas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.voluntariado_ofertas ENABLE ROW LEVEL SECURITY;

--
-- Name: painel_votes votos_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY votos_delete ON public.painel_votes FOR DELETE USING ((( SELECT auth.uid() AS uid) = user_id));


--
-- Name: painel_votes votos_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY votos_insert ON public.painel_votes FOR INSERT WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));


--
-- Name: painel_votes votos_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY votos_select ON public.painel_votes FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- PostgreSQL database dump complete
--

\unrestrict ZWDLJhmqjY5MzWRHXcfPPB2XVdebjgPWhsbRttuwyhD3mN6TU4M68OOM8WNElCW

