-- ============================================================
-- Migration: RLS para tabelas sem políticas de isolamento
-- Data: 2026-05-27
-- Objetivo: Garantir que absolutamente nada de uma casa
--           possa ser visto ou alterado por outra.
-- ============================================================

-- Helper: retorna a sigla_casa do usuário autenticado atual
-- Usado em todos os policies como (SELECT sigla_casa FROM profiles WHERE id = auth.uid())


-- ============================================================
-- 1. PROFILES — Impedir troca livre de casa
-- ============================================================
-- Problema: o policy antigo permitia qualquer UPDATE incluindo sigla_casa,
-- possibilitando que um usuário se auto-atribuísse a outra casa.

DROP POLICY IF EXISTS "profiles_atualizacao_propria" ON public.profiles;

CREATE POLICY "profiles_atualizacao_propria" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND (
      -- Permite mudança de sigla_casa apenas se ainda não foi definida (NULL)
      -- Uma vez definida, só pode ser alterada por service role (admin)
      (SELECT sigla_casa FROM public.profiles WHERE id = auth.uid()) IS NULL
      OR sigla_casa = (SELECT sigla_casa FROM public.profiles WHERE id = auth.uid())
    )
  );


-- ============================================================
-- 2. ADMINISTRADORES_PAGINA
-- ============================================================
ALTER TABLE IF EXISTS public.administradores_pagina ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "adm_select" ON public.administradores_pagina;
DROP POLICY IF EXISTS "adm_insert" ON public.administradores_pagina;
DROP POLICY IF EXISTS "adm_delete" ON public.administradores_pagina;

-- Usuários autenticados veem apenas os admins da sua própria casa
CREATE POLICY "adm_select" ON public.administradores_pagina
  FOR SELECT TO authenticated
  USING (sigla_casa = (SELECT sigla_casa FROM public.profiles WHERE id = auth.uid()));

-- Apenas usuários da mesma casa podem adicionar novos admins
CREATE POLICY "adm_insert" ON public.administradores_pagina
  FOR INSERT TO authenticated
  WITH CHECK (
    sigla_casa = (SELECT sigla_casa FROM public.profiles WHERE id = auth.uid())
    AND (
      -- Primeiro admin (tabela vazia para essa casa) ou
      -- o inseridor já é admin da casa
      NOT EXISTS (
        SELECT 1 FROM public.administradores_pagina a
        WHERE a.sigla_casa = sigla_casa
      )
      OR EXISTS (
        SELECT 1 FROM public.administradores_pagina a
        WHERE a.sigla_casa = sigla_casa AND a.user_id = auth.uid()
      )
    )
  );

-- Apenas admins da mesma casa podem remover outros admins
CREATE POLICY "adm_delete" ON public.administradores_pagina
  FOR DELETE TO authenticated
  USING (
    sigla_casa = (SELECT sigla_casa FROM public.profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.administradores_pagina a
      WHERE a.sigla_casa = sigla_casa AND a.user_id = auth.uid()
    )
  );


-- ============================================================
-- 3. MENSAGENS_DO_DIA
-- ============================================================
ALTER TABLE IF EXISTS public.mensagens_do_dia ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "msg_select" ON public.mensagens_do_dia;
DROP POLICY IF EXISTS "msg_insert" ON public.mensagens_do_dia;
DROP POLICY IF EXISTS "msg_update" ON public.mensagens_do_dia;
DROP POLICY IF EXISTS "msg_delete" ON public.mensagens_do_dia;

-- Usuários autenticados veem mensagens aprovadas da sua casa
-- (não aprovadas só o autor vê)
CREATE POLICY "msg_select" ON public.mensagens_do_dia
  FOR SELECT TO authenticated
  USING (
    sigla_casa = (SELECT sigla_casa FROM public.profiles WHERE id = auth.uid())
    AND (aprovada = true OR autor_id = auth.uid())
  );

-- Usuários autenticados inserem mensagens para a sua própria casa
CREATE POLICY "msg_insert" ON public.mensagens_do_dia
  FOR INSERT TO authenticated
  WITH CHECK (
    sigla_casa = (SELECT sigla_casa FROM public.profiles WHERE id = auth.uid())
    AND autor_id = auth.uid()
  );

-- Apenas o autor pode editar sua mensagem
CREATE POLICY "msg_update" ON public.mensagens_do_dia
  FOR UPDATE TO authenticated
  USING (autor_id = auth.uid())
  WITH CHECK (
    sigla_casa = (SELECT sigla_casa FROM public.profiles WHERE id = auth.uid())
    AND autor_id = auth.uid()
  );

-- Apenas o autor pode deletar sua mensagem
CREATE POLICY "msg_delete" ON public.mensagens_do_dia
  FOR DELETE TO authenticated
  USING (autor_id = auth.uid());


-- ============================================================
-- 4. PAGINAS_CASAS
-- ============================================================
ALTER TABLE IF EXISTS public.paginas_casas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "paginas_select_publica" ON public.paginas_casas;
DROP POLICY IF EXISTS "paginas_select_propria" ON public.paginas_casas;
DROP POLICY IF EXISTS "paginas_insert" ON public.paginas_casas;
DROP POLICY IF EXISTS "paginas_update" ON public.paginas_casas;

-- Leitura pública de páginas publicadas (qualquer visitante)
CREATE POLICY "paginas_select_publica" ON public.paginas_casas
  FOR SELECT
  USING (publicada = true);

-- Usuários autenticados podem ler a sua própria página mesmo se não publicada
CREATE POLICY "paginas_select_propria" ON public.paginas_casas
  FOR SELECT TO authenticated
  USING (sigla_casa = (SELECT sigla_casa FROM public.profiles WHERE id = auth.uid()));

-- Criação da página: apenas para a sua própria casa
CREATE POLICY "paginas_insert" ON public.paginas_casas
  FOR INSERT TO authenticated
  WITH CHECK (sigla_casa = (SELECT sigla_casa FROM public.profiles WHERE id = auth.uid()));

-- Edição: apenas usuários da mesma casa
CREATE POLICY "paginas_update" ON public.paginas_casas
  FOR UPDATE TO authenticated
  USING (sigla_casa = (SELECT sigla_casa FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (sigla_casa = (SELECT sigla_casa FROM public.profiles WHERE id = auth.uid()));


-- ============================================================
-- 5. PUBLICACOES_CASA (Mural)
-- ============================================================
ALTER TABLE IF EXISTS public.publicacoes_casa ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pub_select" ON public.publicacoes_casa;
DROP POLICY IF EXISTS "pub_insert" ON public.publicacoes_casa;
DROP POLICY IF EXISTS "pub_update" ON public.publicacoes_casa;
DROP POLICY IF EXISTS "pub_delete" ON public.publicacoes_casa;

-- Qualquer visitante pode ler publicações de qualquer casa (mural público)
CREATE POLICY "pub_select" ON public.publicacoes_casa
  FOR SELECT
  USING (true);

-- Inserção apenas para a própria casa do usuário
CREATE POLICY "pub_insert" ON public.publicacoes_casa
  FOR INSERT TO authenticated
  WITH CHECK (
    sigla_casa = (SELECT sigla_casa FROM public.profiles WHERE id = auth.uid())
    AND autor_id = auth.uid()
  );

-- Edição apenas pelo autor
CREATE POLICY "pub_update" ON public.publicacoes_casa
  FOR UPDATE TO authenticated
  USING (autor_id = auth.uid())
  WITH CHECK (
    sigla_casa = (SELECT sigla_casa FROM public.profiles WHERE id = auth.uid())
    AND autor_id = auth.uid()
  );

-- Remoção apenas pelo autor
CREATE POLICY "pub_delete" ON public.publicacoes_casa
  FOR DELETE TO authenticated
  USING (
    autor_id = auth.uid()
    AND sigla_casa = (SELECT sigla_casa FROM public.profiles WHERE id = auth.uid())
  );


-- ============================================================
-- 6. PROGRAMACAO_EVENTOS (Programação pública)
-- ============================================================
ALTER TABLE IF EXISTS public.programacao_eventos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "prog_select_publica" ON public.programacao_eventos;
DROP POLICY IF EXISTS "prog_select_propria" ON public.programacao_eventos;
DROP POLICY IF EXISTS "prog_insert" ON public.programacao_eventos;
DROP POLICY IF EXISTS "prog_update" ON public.programacao_eventos;
DROP POLICY IF EXISTS "prog_delete" ON public.programacao_eventos;

-- Eventos públicos visíveis a qualquer visitante
CREATE POLICY "prog_select_publica" ON public.programacao_eventos
  FOR SELECT
  USING (publica = true);

-- Usuários autenticados veem todos os eventos (públicos e privados) da sua casa
CREATE POLICY "prog_select_propria" ON public.programacao_eventos
  FOR SELECT TO authenticated
  USING (sigla_casa = (SELECT sigla_casa FROM public.profiles WHERE id = auth.uid()));

-- Inserção: apenas para a própria casa
CREATE POLICY "prog_insert" ON public.programacao_eventos
  FOR INSERT TO authenticated
  WITH CHECK (
    sigla_casa = (SELECT sigla_casa FROM public.profiles WHERE id = auth.uid())
    AND criado_por = auth.uid()
  );

-- Edição: apenas o criador do evento da própria casa
CREATE POLICY "prog_update" ON public.programacao_eventos
  FOR UPDATE TO authenticated
  USING (
    criado_por = auth.uid()
    AND sigla_casa = (SELECT sigla_casa FROM public.profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    sigla_casa = (SELECT sigla_casa FROM public.profiles WHERE id = auth.uid())
  );

-- Remoção: apenas o criador
CREATE POLICY "prog_delete" ON public.programacao_eventos
  FOR DELETE TO authenticated
  USING (
    criado_por = auth.uid()
    AND sigla_casa = (SELECT sigla_casa FROM public.profiles WHERE id = auth.uid())
  );


-- ============================================================
-- 7. PROGRAMACAO_PARTICIPANTES
-- ============================================================
ALTER TABLE IF EXISTS public.programacao_participantes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "progpart_select" ON public.programacao_participantes;
DROP POLICY IF EXISTS "progpart_insert" ON public.programacao_participantes;
DROP POLICY IF EXISTS "progpart_update" ON public.programacao_participantes;
DROP POLICY IF EXISTS "progpart_delete" ON public.programacao_participantes;

-- SELECT: apenas participantes de eventos da própria casa
CREATE POLICY "progpart_select" ON public.programacao_participantes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.programacao_eventos e
      WHERE e.id = evento_id
        AND e.sigla_casa = (SELECT sigla_casa FROM public.profiles WHERE id = auth.uid())
    )
  );

-- INSERT: usuário se inscreve em evento da sua casa
CREATE POLICY "progpart_insert" ON public.programacao_participantes
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.programacao_eventos e
      WHERE e.id = evento_id
        AND e.sigla_casa = (SELECT sigla_casa FROM public.profiles WHERE id = auth.uid())
    )
  );

-- UPDATE: o próprio usuário ou criador do evento
CREATE POLICY "progpart_update" ON public.programacao_participantes
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.programacao_eventos e
      WHERE e.id = evento_id AND e.criado_por = auth.uid()
    )
  );

-- DELETE: o próprio usuário ou criador do evento
CREATE POLICY "progpart_delete" ON public.programacao_participantes
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.programacao_eventos e
      WHERE e.id = evento_id AND e.criado_por = auth.uid()
    )
  );


-- ============================================================
-- 8. PAINEL_VOTES (Votação global — sem isolamento por casa)
-- ============================================================
ALTER TABLE IF EXISTS public.painel_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "votes_select" ON public.painel_votes;
DROP POLICY IF EXISTS "votes_insert" ON public.painel_votes;

-- Qualquer usuário autenticado pode ver os votos (feature global da plataforma)
CREATE POLICY "votes_select" ON public.painel_votes
  FOR SELECT TO authenticated
  USING (true);

-- Qualquer usuário autenticado pode votar (somente com seu user_id)
CREATE POLICY "votes_insert" ON public.painel_votes
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());


-- ============================================================
-- 9. PROBLEM_REPORTS
-- ============================================================
ALTER TABLE IF EXISTS public.problem_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "report_insert" ON public.problem_reports;
DROP POLICY IF EXISTS "report_select_own" ON public.problem_reports;

-- Qualquer usuário autenticado pode registrar um problema
CREATE POLICY "report_insert" ON public.problem_reports
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Usuário pode ver apenas seus próprios reports
CREATE POLICY "report_select_own" ON public.problem_reports
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());


-- ============================================================
-- 10. SOLICITACOES_DEV
-- ============================================================
ALTER TABLE IF EXISTS public.solicitacoes_dev ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "soldev_insert" ON public.solicitacoes_dev;
DROP POLICY IF EXISTS "soldev_select_own" ON public.solicitacoes_dev;

-- Qualquer usuário autenticado pode enviar solicitação
CREATE POLICY "soldev_insert" ON public.solicitacoes_dev
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Usuário vê apenas as suas próprias solicitações
CREATE POLICY "soldev_select_own" ON public.solicitacoes_dev
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());


-- ============================================================
-- 11. AGENDA_EVENTOS — Reforçar UPDATE/DELETE com sigla_casa
-- ============================================================
DROP POLICY IF EXISTS "eventos_update" ON public.agenda_eventos;
DROP POLICY IF EXISTS "eventos_delete" ON public.agenda_eventos;

CREATE POLICY "eventos_update" ON public.agenda_eventos
  FOR UPDATE TO authenticated
  USING (
    criador_id = auth.uid()
    AND sigla_casa = (SELECT sigla_casa FROM public.profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    sigla_casa = (SELECT sigla_casa FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "eventos_delete" ON public.agenda_eventos
  FOR DELETE TO authenticated
  USING (
    criador_id = auth.uid()
    AND sigla_casa = (SELECT sigla_casa FROM public.profiles WHERE id = auth.uid())
  );


-- ============================================================
-- 12. TESOURARIA_TRANSACOES — Reforçar UPDATE/DELETE com sigla_casa
-- ============================================================
DROP POLICY IF EXISTS "tesouraria_update" ON public.tesouraria_transacoes;
DROP POLICY IF EXISTS "tesouraria_delete" ON public.tesouraria_transacoes;

CREATE POLICY "tesouraria_update" ON public.tesouraria_transacoes
  FOR UPDATE TO authenticated
  USING (
    criador_id = auth.uid()
    AND sigla_casa = (SELECT sigla_casa FROM public.profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    sigla_casa = (SELECT sigla_casa FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "tesouraria_delete" ON public.tesouraria_transacoes
  FOR DELETE TO authenticated
  USING (
    criador_id = auth.uid()
    AND sigla_casa = (SELECT sigla_casa FROM public.profiles WHERE id = auth.uid())
  );
