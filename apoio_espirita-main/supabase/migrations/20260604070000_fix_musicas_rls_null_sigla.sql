-- Corrigir política de RLS para inserção na tabela de músicas
-- Permite que usuários com sigla_casa nula (ou não associados) insiram registros
DROP POLICY IF EXISTS "musicas_insert" ON public.musicas;
CREATE POLICY "musicas_insert" ON public.musicas
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      sigla_casa IS NOT DISTINCT FROM (SELECT sigla_casa FROM public.profiles WHERE id = auth.uid())
    )
  );
