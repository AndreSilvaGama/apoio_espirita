-- Helper functions to get request token and check access
CREATE OR REPLACE FUNCTION public.get_request_kanban_token()
RETURNS text AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Create kanban_config table
CREATE TABLE IF NOT EXISTS public.kanban_config (
  sigla_casa text PRIMARY KEY REFERENCES public.siglas_casas(sigla) ON DELETE CASCADE,
  board_background text NOT NULL DEFAULT 'bg-slate-50',
  share_token uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Create kanban_listas table (dynamic columns)
CREATE TABLE IF NOT EXISTS public.kanban_listas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sigla_casa text NOT NULL REFERENCES public.siglas_casas(sigla) ON DELETE CASCADE,
  nome text NOT NULL,
  ordem integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Modify kanban_eventos (add columns for Trello features)
ALTER TABLE public.kanban_eventos ADD COLUMN IF NOT EXISTS lista_id uuid REFERENCES public.kanban_listas(id) ON DELETE SET NULL;
ALTER TABLE public.kanban_eventos ADD COLUMN IF NOT EXISTS labels text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.kanban_eventos ADD COLUMN IF NOT EXISTS membros_atribuidos text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.kanban_eventos ADD COLUMN IF NOT EXISTS prazo_concluido boolean NOT NULL DEFAULT false;
ALTER TABLE public.kanban_eventos ADD COLUMN IF NOT EXISTS anexos jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.kanban_eventos ADD COLUMN IF NOT EXISTS arquivado boolean NOT NULL DEFAULT false;
ALTER TABLE public.kanban_eventos ADD COLUMN IF NOT EXISTS ordem integer NOT NULL DEFAULT 0;

-- 4. Create kanban_comentarios table
CREATE TABLE IF NOT EXISTS public.kanban_comentarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id uuid NOT NULL REFERENCES public.kanban_eventos(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  autor_nome text NOT NULL,
  comentario text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Access check function
CREATE OR REPLACE FUNCTION public.has_kanban_access(p_sigla_casa text)
RETURNS boolean AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on all tables
ALTER TABLE public.kanban_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_listas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_comentarios ENABLE ROW LEVEL SECURITY;

-- Re-enable RLS on kanban tables to be safe
ALTER TABLE public.kanban_eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_tarefas ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "kanban_config_select" ON public.kanban_config;
DROP POLICY IF EXISTS "kanban_config_update" ON public.kanban_config;
DROP POLICY IF EXISTS "kanban_config_insert_delete" ON public.kanban_config;
DROP POLICY IF EXISTS "kanban_listas_policy" ON public.kanban_listas;
DROP POLICY IF EXISTS "kanban_eventos_policy" ON public.kanban_eventos;
DROP POLICY IF EXISTS "kanban_grupos_policy" ON public.kanban_grupos;
DROP POLICY IF EXISTS "kanban_tarefas_policy" ON public.kanban_tarefas;
DROP POLICY IF EXISTS "kanban_comentarios_policy" ON public.kanban_comentarios;

-- Policies for kanban_config
CREATE POLICY "kanban_config_select" ON public.kanban_config
  FOR SELECT TO public
  USING (
    (auth.role() = 'authenticated' AND sigla_casa = (SELECT sigla_casa FROM public.profiles WHERE id = auth.uid()))
    OR
    (public.get_request_kanban_token() = share_token::text)
  );

CREATE POLICY "kanban_config_update" ON public.kanban_config
  FOR UPDATE TO public
  USING (
    (auth.role() = 'authenticated' AND sigla_casa = (SELECT sigla_casa FROM public.profiles WHERE id = auth.uid()))
    OR
    (public.get_request_kanban_token() = share_token::text)
  );

CREATE POLICY "kanban_config_insert_delete" ON public.kanban_config
  FOR ALL TO authenticated
  USING (sigla_casa = (SELECT sigla_casa FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (sigla_casa = (SELECT sigla_casa FROM public.profiles WHERE id = auth.uid()));

-- Policies for kanban_listas
CREATE POLICY "kanban_listas_policy" ON public.kanban_listas
  AS PERMISSIVE FOR ALL TO public
  USING (public.has_kanban_access(sigla_casa))
  WITH CHECK (public.has_kanban_access(sigla_casa));

-- Policies for kanban_eventos
CREATE POLICY "kanban_eventos_policy" ON public.kanban_eventos
  AS PERMISSIVE FOR ALL TO public
  USING (public.has_kanban_access(sigla_casa))
  WITH CHECK (public.has_kanban_access(sigla_casa));

-- Policies for kanban_grupos
CREATE POLICY "kanban_grupos_policy" ON public.kanban_grupos
  AS PERMISSIVE FOR ALL TO public
  USING (public.has_kanban_access(sigla_casa))
  WITH CHECK (public.has_kanban_access(sigla_casa));

-- Policies for kanban_tarefas
CREATE POLICY "kanban_tarefas_policy" ON public.kanban_tarefas
  AS PERMISSIVE FOR ALL TO public
  USING (public.has_kanban_access(sigla_casa))
  WITH CHECK (public.has_kanban_access(sigla_casa));

-- Policies for kanban_comentarios
CREATE POLICY "kanban_comentarios_policy" ON public.kanban_comentarios
  AS PERMISSIVE FOR ALL TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.kanban_eventos e
      WHERE e.id = kanban_comentarios.evento_id
      AND public.has_kanban_access(e.sigla_casa)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.kanban_eventos e
      WHERE e.id = kanban_comentarios.evento_id
      AND public.has_kanban_access(e.sigla_casa)
    )
  );
