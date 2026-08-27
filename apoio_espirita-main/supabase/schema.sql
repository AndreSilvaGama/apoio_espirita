-- Estrutura do banco de produção, gerada automaticamente pelo Vigia diário.
-- NÃO EDITE À MÃO: este arquivo é sobrescrito todo dia pelo pg_dump.
-- Contém apenas estrutura (tabelas, RLS, políticas, funções). Nenhum dado.
--
--
-- PostgreSQL database dump
--

\restrict ATzWYjKSE1EUjnerGbs3VUrTaFUIFIK5OMP9jXlH4avBfADjApJUVXjnfavBXR7

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
    order by c.nome
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
    order by p.nome
    limit (select n from entrada)
  )
$$;


--
-- Name: FUNCTION buscar_geral(termo text, limite integer); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.buscar_geral(termo text, limite integer) IS 'Busca artigos publicados, casas ativas e membros visíveis a quem chama.';


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
-- Name: artigos_publicos; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.artigos_publicos WITH (security_invoker='true') AS
 SELECT id,
    autor_id,
    autor_nome,
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
    public.artigo_piso_retirada(public.total_verificados()) AS piso_atual
   FROM public.artigos a;


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
    CONSTRAINT casas_espirita_estado_check CHECK ((char_length(estado) = 2)),
    CONSTRAINT casas_espirita_nome_check CHECK (((char_length(nome) >= 2) AND (char_length(nome) <= 200)))
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
    CONSTRAINT profiles_role_check CHECK ((role = ANY (ARRAY['membro'::text, 'coordenador'::text, 'presidente'::text, 'admin'::text])))
);


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
    created_at timestamp with time zone DEFAULT now()
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
-- Name: casas_espirita casas_espirita_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.casas_espirita
    ADD CONSTRAINT casas_espirita_pkey PRIMARY KEY (id);


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
-- Name: casas_espirita_nome_cidade_estado_uq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX casas_espirita_nome_cidade_estado_uq ON public.casas_espirita USING btree (lower(nome), cidade, estado);


--
-- Name: casas_espirita_sigla_cidade_estado_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX casas_espirita_sigla_cidade_estado_key ON public.casas_espirita USING btree (sigla, cidade, estado) WHERE (sigla IS NOT NULL);


--
-- Name: idx_kanban_frentes_board; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kanban_frentes_board ON public.kanban_frentes USING btree (board_id);


--
-- Name: idx_kanban_listas_board_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kanban_listas_board_id ON public.kanban_listas USING btree (board_id);


--
-- Name: idx_kanban_listas_frente; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kanban_listas_frente ON public.kanban_listas USING btree (frente_id);


--
-- Name: idx_memoria_virtudes_sigla; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_memoria_virtudes_sigla ON public.memoria_virtudes_custom USING btree (sigla_casa);


--
-- Name: idx_tes_autoriz_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tes_autoriz_user ON public.tesouraria_autorizacoes USING btree (user_id);


--
-- Name: usuarios_sancoes_vigentes_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX usuarios_sancoes_vigentes_idx ON public.usuarios_sancoes USING btree (user_id) WHERE (revogada_em IS NULL);


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
-- Name: paginas_casas paginas_casas_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER paginas_casas_updated_at BEFORE UPDATE ON public.paginas_casas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


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
-- Name: administradores_pagina; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.administradores_pagina ENABLE ROW LEVEL SECURITY;

--
-- Name: administradores_pagina admins_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admins_delete ON public.administradores_pagina FOR DELETE TO authenticated USING (true);


--
-- Name: administradores_pagina admins_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admins_insert ON public.administradores_pagina FOR INSERT TO authenticated WITH CHECK (true);


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
-- Name: artigo_avaliacoes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.artigo_avaliacoes ENABLE ROW LEVEL SECURITY;

--
-- Name: artigo_avaliacoes artigo_avaliacoes_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY artigo_avaliacoes_delete ON public.artigo_avaliacoes FOR DELETE USING ((user_id = auth.uid()));


--
-- Name: artigo_avaliacoes artigo_avaliacoes_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY artigo_avaliacoes_insert ON public.artigo_avaliacoes FOR INSERT WITH CHECK (((user_id = auth.uid()) AND public.email_verificado() AND (NOT public.usuario_sancionado(auth.uid())) AND (NOT (EXISTS ( SELECT 1
   FROM public.artigos a
  WHERE ((a.id = artigo_avaliacoes.artigo_id) AND (a.autor_id = auth.uid())))))));


--
-- Name: artigo_avaliacoes artigo_avaliacoes_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY artigo_avaliacoes_select ON public.artigo_avaliacoes FOR SELECT USING (((user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.artigos a
  WHERE ((a.id = artigo_avaliacoes.artigo_id) AND (a.autor_id = auth.uid())))) OR public.pode_revisar_artigo(artigo_id)));


--
-- Name: artigo_avaliacoes artigo_avaliacoes_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY artigo_avaliacoes_update ON public.artigo_avaliacoes FOR UPDATE USING ((user_id = auth.uid())) WITH CHECK (((user_id = auth.uid()) AND public.email_verificado() AND (NOT public.usuario_sancionado(auth.uid()))));


--
-- Name: artigo_revisoes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.artigo_revisoes ENABLE ROW LEVEL SECURITY;

--
-- Name: artigo_revisoes artigo_revisoes_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY artigo_revisoes_insert ON public.artigo_revisoes FOR INSERT WITH CHECK ((public.pode_revisar_artigo(artigo_id) OR ((origem = 'reenvio'::text) AND (EXISTS ( SELECT 1
   FROM public.artigos a
  WHERE ((a.id = artigo_revisoes.artigo_id) AND (a.autor_id = auth.uid()) AND (a.estado = 'em_correcao'::text)))))));


--
-- Name: artigo_revisoes artigo_revisoes_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY artigo_revisoes_select ON public.artigo_revisoes FOR SELECT USING ((public.pode_revisar_artigo(artigo_id) OR (EXISTS ( SELECT 1
   FROM public.artigos a
  WHERE ((a.id = artigo_revisoes.artigo_id) AND (a.autor_id = auth.uid()))))));


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

CREATE POLICY artigos_insert ON public.artigos FOR INSERT WITH CHECK (((autor_id = auth.uid()) AND public.email_verificado() AND (NOT public.usuario_sancionado(auth.uid()))));


--
-- Name: artigos artigos_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY artigos_select ON public.artigos FOR SELECT USING (((estado = 'publicado'::text) OR (autor_id = auth.uid()) OR public.pode_revisar_artigo(id)));


--
-- Name: artigos artigos_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY artigos_update ON public.artigos FOR UPDATE USING ((((autor_id = auth.uid()) AND (estado = ANY (ARRAY['publicado'::text, 'retirado'::text, 'em_correcao'::text]))) OR public.pode_revisar_artigo(id))) WITH CHECK (((autor_id = auth.uid()) OR public.pode_revisar_artigo(id)));


--
-- Name: casas_espirita authenticated_insert_casa; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY authenticated_insert_casa ON public.casas_espirita FOR INSERT TO authenticated WITH CHECK ((sigla IS NOT NULL));


--
-- Name: casas_espirita authenticated_update_own_casa; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY authenticated_update_own_casa ON public.casas_espirita FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.sigla_casa = casas_espirita.sigla) AND (profiles.cidade = casas_espirita.cidade) AND ((profiles.uf)::text = casas_espirita.estado))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.sigla_casa = casas_espirita.sigla) AND (profiles.cidade = casas_espirita.cidade) AND ((profiles.uf)::text = casas_espirita.estado)))));


--
-- Name: casas_espirita; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.casas_espirita ENABLE ROW LEVEL SECURITY;

--
-- Name: agenda_eventos eventos_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY eventos_delete ON public.agenda_eventos FOR DELETE TO authenticated USING ((criador_id = auth.uid()));


--
-- Name: agenda_eventos eventos_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY eventos_insert ON public.agenda_eventos FOR INSERT TO authenticated WITH CHECK (((criador_id = auth.uid()) AND (sigla_casa = ( SELECT profiles.sigla_casa
   FROM public.profiles
  WHERE (profiles.id = auth.uid())))));


--
-- Name: agenda_eventos eventos_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY eventos_select ON public.agenda_eventos FOR SELECT TO authenticated USING ((sigla_casa = ( SELECT profiles.sigla_casa
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: agenda_eventos eventos_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY eventos_update ON public.agenda_eventos FOR UPDATE TO authenticated USING ((criador_id = auth.uid()));


--
-- Name: casas_espirita insercao_service_role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY insercao_service_role ON public.casas_espirita FOR INSERT WITH CHECK (false);


--
-- Name: solicitacoes_dev inserir propria solicitacao; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "inserir propria solicitacao" ON public.solicitacoes_dev FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


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
  WHERE (profiles.id = auth.uid())))) WITH CHECK ((sigla_casa = ( SELECT profiles.sigla_casa
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: kanban_config kanban_config_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kanban_config_select ON public.kanban_config FOR SELECT USING ((((auth.role() = 'authenticated'::text) AND (sigla_casa = ( SELECT profiles.sigla_casa
   FROM public.profiles
  WHERE (profiles.id = auth.uid())))) OR (public.get_request_kanban_token() = (share_token)::text)));


--
-- Name: kanban_config kanban_config_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kanban_config_update ON public.kanban_config FOR UPDATE USING ((((auth.role() = 'authenticated'::text) AND (sigla_casa = ( SELECT profiles.sigla_casa
   FROM public.profiles
  WHERE (profiles.id = auth.uid())))) OR (public.get_request_kanban_token() = (share_token)::text)));


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

CREATE POLICY mem_virt_read ON public.memoria_virtudes_custom FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: memoria_virtudes_custom mem_virt_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY mem_virt_write ON public.memoria_virtudes_custom USING (((auth.uid() IS NOT NULL) AND (sigla_casa = ( SELECT profiles.sigla_casa
   FROM public.profiles
  WHERE (profiles.id = auth.uid())
 LIMIT 1)))) WITH CHECK (((auth.uid() IS NOT NULL) AND (sigla_casa = ( SELECT profiles.sigla_casa
   FROM public.profiles
  WHERE (profiles.id = auth.uid())
 LIMIT 1))));


--
-- Name: kanban_eventos membros criam eventos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "membros criam eventos" ON public.kanban_eventos FOR INSERT WITH CHECK ((sigla_casa = ( SELECT profiles.sigla_casa
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: kanban_grupos membros criam grupos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "membros criam grupos" ON public.kanban_grupos FOR INSERT WITH CHECK ((sigla_casa = ( SELECT profiles.sigla_casa
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: kanban_tarefas membros criam tarefas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "membros criam tarefas" ON public.kanban_tarefas FOR INSERT WITH CHECK ((sigla_casa = ( SELECT profiles.sigla_casa
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: kanban_eventos membros leem eventos da casa; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "membros leem eventos da casa" ON public.kanban_eventos FOR SELECT USING ((sigla_casa = ( SELECT profiles.sigla_casa
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: kanban_grupos membros leem grupos da casa; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "membros leem grupos da casa" ON public.kanban_grupos FOR SELECT USING ((sigla_casa = ( SELECT profiles.sigla_casa
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: kanban_tarefas membros leem tarefas da casa; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "membros leem tarefas da casa" ON public.kanban_tarefas FOR SELECT USING ((sigla_casa = ( SELECT profiles.sigla_casa
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: memoria_virtudes_custom; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.memoria_virtudes_custom ENABLE ROW LEVEL SECURITY;

--
-- Name: mensagens_do_dia mensagens_delete_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY mensagens_delete_own ON public.mensagens_do_dia FOR DELETE TO authenticated USING (((auth.uid() = autor_id) AND (data_exibicao IS NULL)));


--
-- Name: mensagens_do_dia; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.mensagens_do_dia ENABLE ROW LEVEL SECURITY;

--
-- Name: mensagens_do_dia mensagens_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY mensagens_insert ON public.mensagens_do_dia FOR INSERT TO authenticated WITH CHECK ((auth.uid() = autor_id));


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

CREATE POLICY musicas_delete ON public.musicas FOR DELETE TO authenticated USING (((auth.uid() = user_id) OR (EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.cargo_principal = ANY (ARRAY['Presidente'::text, 'Vice-presidente'::text, 'DEV'::text])))))));


--
-- Name: musicas musicas_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY musicas_insert ON public.musicas FOR INSERT TO authenticated WITH CHECK (((auth.uid() = user_id) AND (NOT (sigla_casa IS DISTINCT FROM ( SELECT profiles.sigla_casa
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))))));


--
-- Name: musicas musicas_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY musicas_select ON public.musicas FOR SELECT USING (((is_exclusive = false) OR ((auth.role() = 'authenticated'::text) AND (sigla_casa = ( SELECT profiles.sigla_casa
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))))));


--
-- Name: musicas musicas_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY musicas_update ON public.musicas FOR UPDATE TO authenticated USING (((auth.uid() = user_id) OR (EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.cargo_principal = ANY (ARRAY['Presidente'::text, 'Vice-presidente'::text, 'DEV'::text]))))))) WITH CHECK (((auth.uid() = user_id) OR (EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.cargo_principal = ANY (ARRAY['Presidente'::text, 'Vice-presidente'::text, 'DEV'::text])))))));


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
  WHERE ((e.id = agenda_participantes.evento_id) AND (e.criador_id = auth.uid())))));


--
-- Name: agenda_participantes participantes_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY participantes_insert ON public.agenda_participantes FOR INSERT TO authenticated WITH CHECK (((EXISTS ( SELECT 1
   FROM public.agenda_eventos e
  WHERE ((e.id = agenda_participantes.evento_id) AND (e.criador_id = auth.uid())))) OR ((user_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.agenda_eventos e
  WHERE ((e.id = agenda_participantes.evento_id) AND (e.tipo = 'aberto'::text)))))));


--
-- Name: agenda_participantes participantes_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY participantes_select ON public.agenda_participantes FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.agenda_eventos e
  WHERE ((e.id = agenda_participantes.evento_id) AND (e.sigla_casa = ( SELECT profiles.sigla_casa
           FROM public.profiles
          WHERE (profiles.id = auth.uid())))))));


--
-- Name: agenda_participantes participantes_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY participantes_update ON public.agenda_participantes FOR UPDATE TO authenticated USING (((user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.agenda_eventos e
  WHERE ((e.id = agenda_participantes.evento_id) AND (e.criador_id = auth.uid()))))));


--
-- Name: problem_reports; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.problem_reports ENABLE ROW LEVEL SECURITY;

--
-- Name: problem_reports problem_reports_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY problem_reports_insert ON public.problem_reports FOR INSERT WITH CHECK ((auth.uid() = user_id));


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

CREATE POLICY profiles_atualizacao_propria ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: profiles profiles_insercao_propria; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_insercao_propria ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: profiles profiles_leitura_dev; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_leitura_dev ON public.profiles FOR SELECT TO authenticated USING (public.sou_dev());


--
-- Name: profiles profiles_leitura_mesma_casa; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_leitura_mesma_casa ON public.profiles FOR SELECT TO authenticated USING (((sigla_casa IS NOT NULL) AND (sigla_casa = public.minha_sigla_casa())));


--
-- Name: profiles profiles_leitura_propria; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_leitura_propria ON public.profiles FOR SELECT USING ((auth.uid() = id));


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
  WHERE (profiles.id = auth.uid()))));


--
-- Name: kanban_grupos qualquer membro atualiza grupos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "qualquer membro atualiza grupos" ON public.kanban_grupos FOR UPDATE USING ((sigla_casa = ( SELECT profiles.sigla_casa
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: kanban_tarefas qualquer membro atualiza tarefas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "qualquer membro atualiza tarefas" ON public.kanban_tarefas FOR UPDATE USING ((sigla_casa = ( SELECT profiles.sigla_casa
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: kanban_grupos qualquer membro exclui grupos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "qualquer membro exclui grupos" ON public.kanban_grupos FOR DELETE USING ((sigla_casa = ( SELECT profiles.sigla_casa
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: kanban_tarefas qualquer membro exclui tarefas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "qualquer membro exclui tarefas" ON public.kanban_tarefas FOR DELETE USING ((sigla_casa = ( SELECT profiles.sigla_casa
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: site_suggestions qualquer um pode inserir sugestao; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "qualquer um pode inserir sugestao" ON public.site_suggestions FOR INSERT WITH CHECK (true);


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

CREATE POLICY "somente criador exclui" ON public.kanban_eventos FOR DELETE USING ((criador_id = auth.uid()));


--
-- Name: tesouraria_autorizacoes tes_autoriz_modify; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tes_autoriz_modify ON public.tesouraria_autorizacoes USING (public.is_tesouraria_admin(sigla_casa)) WITH CHECK (public.is_tesouraria_admin(sigla_casa));


--
-- Name: tesouraria_autorizacoes tes_autoriz_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tes_autoriz_select ON public.tesouraria_autorizacoes FOR SELECT USING ((sigla_casa = ( SELECT profiles.sigla_casa
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: tesouraria_autorizacoes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tesouraria_autorizacoes ENABLE ROW LEVEL SECURITY;

--
-- Name: tesouraria_transacoes tesouraria_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tesouraria_delete ON public.tesouraria_transacoes FOR DELETE TO authenticated USING ((criador_id = auth.uid()));


--
-- Name: tesouraria_transacoes tesouraria_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tesouraria_insert ON public.tesouraria_transacoes FOR INSERT TO authenticated WITH CHECK (((sigla_casa = ( SELECT profiles.sigla_casa
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))) AND (criador_id = auth.uid())));


--
-- Name: tesouraria_transacoes tesouraria_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tesouraria_select ON public.tesouraria_transacoes FOR SELECT TO authenticated USING ((sigla_casa = ( SELECT profiles.sigla_casa
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: tesouraria_transacoes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tesouraria_transacoes ENABLE ROW LEVEL SECURITY;

--
-- Name: tesouraria_transacoes tesouraria_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tesouraria_update ON public.tesouraria_transacoes FOR UPDATE TO authenticated USING ((criador_id = auth.uid()));


--
-- Name: usuarios_sancoes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.usuarios_sancoes ENABLE ROW LEVEL SECURITY;

--
-- Name: usuarios_sancoes usuarios_sancoes_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY usuarios_sancoes_insert ON public.usuarios_sancoes FOR INSERT WITH CHECK (((aplicada_por = auth.uid()) AND public.pode_sancionar(user_id)));


--
-- Name: usuarios_sancoes usuarios_sancoes_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY usuarios_sancoes_select ON public.usuarios_sancoes FOR SELECT USING (((user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.cargo_principal = 'DEV'::text)))) OR (EXISTS ( SELECT 1
   FROM (public.profiles p
     JOIN public.profiles alvo ON ((alvo.id = usuarios_sancoes.user_id)))
  WHERE ((p.id = auth.uid()) AND (p.sigla_casa = alvo.sigla_casa) AND (p.cargo_principal = ANY (ARRAY['Presidente'::text, 'Vice-presidente'::text])))))));


--
-- Name: usuarios_sancoes usuarios_sancoes_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY usuarios_sancoes_update ON public.usuarios_sancoes FOR UPDATE USING (public.pode_sancionar(user_id)) WITH CHECK (public.pode_sancionar(user_id));


--
-- Name: solicitacoes_dev ver proprias solicitacoes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "ver proprias solicitacoes" ON public.solicitacoes_dev FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: solicitacoes_dev ver todas as solicitacoes autenticado; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "ver todas as solicitacoes autenticado" ON public.solicitacoes_dev FOR SELECT TO authenticated USING (true);


--
-- Name: painel_votes votos_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY votos_delete ON public.painel_votes FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: painel_votes votos_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY votos_insert ON public.painel_votes FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: painel_votes votos_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY votos_select ON public.painel_votes FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- PostgreSQL database dump complete
--

\unrestrict ATzWYjKSE1EUjnerGbs3VUrTaFUIFIK5OMP9jXlH4avBfADjApJUVXjnfavBXR7

