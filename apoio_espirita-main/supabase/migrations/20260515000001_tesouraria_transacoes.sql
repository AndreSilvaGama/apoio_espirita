-- Módulo de Tesouraria: tabela de transações financeiras por casa espírita
CREATE TABLE IF NOT EXISTS tesouraria_transacoes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sigla_casa   text NOT NULL REFERENCES siglas_casas(sigla),
  tipo         text NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  categoria    text NOT NULL,
  descricao    text NOT NULL,
  valor        numeric(12,2) NOT NULL CHECK (valor > 0),
  data         date NOT NULL DEFAULT CURRENT_DATE,
  observacao   text,
  criador_id   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  criador_nome text,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE tesouraria_transacoes ENABLE ROW LEVEL SECURITY;

-- SELECT: Presidente, Vice, Tesoureiro da mesma casa
CREATE POLICY "tesouraria_select" ON tesouraria_transacoes
  FOR SELECT TO authenticated
  USING (sigla_casa = (SELECT sigla_casa FROM profiles WHERE id = auth.uid()));

-- INSERT: membros autorizados da mesma casa
CREATE POLICY "tesouraria_insert" ON tesouraria_transacoes
  FOR INSERT TO authenticated
  WITH CHECK (
    sigla_casa = (SELECT sigla_casa FROM profiles WHERE id = auth.uid())
    AND criador_id = auth.uid()
  );

-- UPDATE: somente quem registrou pode editar
CREATE POLICY "tesouraria_update" ON tesouraria_transacoes
  FOR UPDATE TO authenticated
  USING (criador_id = auth.uid());

-- DELETE: somente quem registrou pode excluir
CREATE POLICY "tesouraria_delete" ON tesouraria_transacoes
  FOR DELETE TO authenticated
  USING (criador_id = auth.uid());
