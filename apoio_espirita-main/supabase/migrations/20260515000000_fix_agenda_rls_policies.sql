-- Recriar políticas RLS das tabelas de agenda (corrige erro ao criar evento)
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'agenda_eventos' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON agenda_eventos', pol.policyname);
  END LOOP;
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'agenda_participantes' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON agenda_participantes', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE agenda_eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE agenda_participantes ENABLE ROW LEVEL SECURITY;

-- agenda_eventos
CREATE POLICY "eventos_select" ON agenda_eventos FOR SELECT TO authenticated
  USING (sigla_casa = (SELECT sigla_casa FROM profiles WHERE id = auth.uid()));

CREATE POLICY "eventos_insert" ON agenda_eventos FOR INSERT TO authenticated
  WITH CHECK (
    criador_id = auth.uid()
    AND sigla_casa = (SELECT sigla_casa FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "eventos_update" ON agenda_eventos FOR UPDATE TO authenticated
  USING (criador_id = auth.uid());

CREATE POLICY "eventos_delete" ON agenda_eventos FOR DELETE TO authenticated
  USING (criador_id = auth.uid());

-- agenda_participantes
CREATE POLICY "participantes_select" ON agenda_participantes FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agenda_eventos e
      WHERE e.id = evento_id
        AND e.sigla_casa = (SELECT sigla_casa FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "participantes_insert" ON agenda_participantes FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM agenda_eventos e WHERE e.id = evento_id AND e.criador_id = auth.uid())
    OR (
      user_id = auth.uid()
      AND EXISTS (SELECT 1 FROM agenda_eventos e WHERE e.id = evento_id AND e.tipo = 'aberto')
    )
  );

CREATE POLICY "participantes_update" ON agenda_participantes FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM agenda_eventos e WHERE e.id = evento_id AND e.criador_id = auth.uid())
  );

CREATE POLICY "participantes_delete" ON agenda_participantes FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM agenda_eventos e WHERE e.id = evento_id AND e.criador_id = auth.uid())
  );
