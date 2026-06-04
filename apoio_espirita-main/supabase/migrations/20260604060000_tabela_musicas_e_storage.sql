-- Criar tabela de músicas
CREATE TABLE IF NOT EXISTS public.musicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  is_exclusive BOOLEAN DEFAULT FALSE NOT NULL,
  sigla_casa TEXT REFERENCES public.siglas_casas(sigla) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Habilitar RLS
ALTER TABLE public.musicas ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para public.musicas
DROP POLICY IF EXISTS "musicas_select" ON public.musicas;
CREATE POLICY "musicas_select" ON public.musicas
  FOR SELECT
  USING (
    is_exclusive = false
    OR (
      auth.role() = 'authenticated'
      AND sigla_casa = (SELECT sigla_casa FROM public.profiles WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "musicas_insert" ON public.musicas;
CREATE POLICY "musicas_insert" ON public.musicas
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND sigla_casa = (SELECT sigla_casa FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "musicas_update" ON public.musicas;
CREATE POLICY "musicas_update" ON public.musicas
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND (p.cargo_principal IN ('Presidente', 'Vice-presidente', 'DEV'))
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND (p.cargo_principal IN ('Presidente', 'Vice-presidente', 'DEV'))
    )
  );

DROP POLICY IF EXISTS "musicas_delete" ON public.musicas;
CREATE POLICY "musicas_delete" ON public.musicas
  FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND (p.cargo_principal IN ('Presidente', 'Vice-presidente', 'DEV'))
    )
  );

-- Garantir que o bucket de músicas existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('musicas', 'musicas', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas para o bucket de músicas em storage.objects
DROP POLICY IF EXISTS "Leitura pública de músicas" ON storage.objects;
CREATE POLICY "Leitura pública de músicas" ON storage.objects
  FOR SELECT USING (bucket_id = 'musicas');

DROP POLICY IF EXISTS "Upload de músicas por usuários autenticados" ON storage.objects;
CREATE POLICY "Upload de músicas por usuários autenticados" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'musicas');

DROP POLICY IF EXISTS "Exclusão de músicas pelo proprietário ou admin" ON storage.objects;
CREATE POLICY "Exclusão de músicas pelo proprietário ou admin" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'musicas'
    AND (
      owner = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
        AND (p.cargo_principal IN ('Presidente', 'Vice-presidente', 'DEV'))
      )
    )
  );
