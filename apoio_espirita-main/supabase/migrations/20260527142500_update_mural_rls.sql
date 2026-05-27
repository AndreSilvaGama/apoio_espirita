-- Migration: Atualizar RLS para publicacoes_casa (Mural)
-- Data: 2026-05-27
-- Objetivo: Permitir que administradores da casa espírita possam excluir publicações de outros membros.

DROP POLICY IF EXISTS "pub_delete" ON public.publicacoes_casa;

CREATE POLICY "pub_delete" ON public.publicacoes_casa
  FOR DELETE TO authenticated
  USING (
    -- O próprio autor
    (
      autor_id = auth.uid()
      AND sigla_casa = (SELECT sigla_casa FROM public.profiles WHERE id = auth.uid())
    )
    -- Administradores autorizados da mesma casa
    OR EXISTS (
      SELECT 1 FROM public.administradores_pagina a
      WHERE a.sigla_casa = publicacoes_casa.sigla_casa AND a.user_id = auth.uid()
    )
    -- Presidentes, Vice-presidentes ou DEV da mesma casa
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.sigla_casa = publicacoes_casa.sigla_casa
        AND p.cargo_principal IN ('Presidente', 'Vice-presidente', 'DEV')
    )
  );
