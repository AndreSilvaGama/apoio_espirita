-- Estrutura do banco de produção, gerada automaticamente pelo Vigia diário.
-- NÃO EDITE À MÃO: este arquivo é sobrescrito todo dia pelo pg_dump.
-- Contém apenas estrutura (tabelas, RLS, políticas, funções). Nenhum dado.
--
--
-- PostgreSQL database dump
--

\restrict gawjnMbztlUddMuoY5VjYLeI8KFjPNCqnvNGwyMPH363ep2qblNHFfvJOfGRej5

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
    publicada boolean DEFAULT true NOT NULL,
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

CREATE POLICY paginas_casas_insert ON public.paginas_casas FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: paginas_casas paginas_casas_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY paginas_casas_select ON public.paginas_casas FOR SELECT TO authenticated USING (true);


--
-- Name: paginas_casas paginas_casas_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY paginas_casas_update ON public.paginas_casas FOR UPDATE TO authenticated USING (true);


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

\unrestrict gawjnMbztlUddMuoY5VjYLeI8KFjPNCqnvNGwyMPH363ep2qblNHFfvJOfGRej5

