-- Seguranca e desempenho do banco: tres correcoes independentes.
--
-- 1. A view publica de artigos voltou a ignorar as politicas por acidente.
-- 2. Funcoes de gatilho estavam chamaveis pela API por quem nao tem conta.
-- 3. Chaves estrangeiras sem indice e politicas que reavaliam a identidade por
--    linha — nenhum dos dois doi hoje, os dois doem quando houver movimento.

-- == 1. artigos_publicos volta a respeitar quem consulta ======================
--
-- A view nasceu em 20260826100400 com `security_invoker = true`, de proposito:
-- ela mascara o conteudo do artigo retirado, mas quem decide QUAIS LINHAS a
-- pessoa enxerga continua sendo a politica da tabela `artigos`.
--
-- A migracao 20260828170000 recriou a view para acrescentar `assinatura` e
-- `indexavel` usando `create or replace view ... as`, sem repetir a clausula
-- `with (...)`. O Postgres nao preserva a opcao nesse caso: ela foi apagada em
-- silencio, e a view passou a rodar com os privilegios de quem a criou.
--
-- Efeito pratico da regressao: um visitante sem conta enxergava titulo, resumo,
-- autor e ate o motivo da retirada de artigos NAO publicados — linhas que a
-- politica `artigos_select` esconde dele. O texto seguia protegido (a propria
-- view o zera fora do estado `publicado`), e nao havia nenhum artigo no banco
-- quando isto foi corrigido, entao nao houve vazamento real.
--
-- `alter view` em vez de recriar: mexe so na opcao, sem tocar na definicao.
alter view public.artigos_publicos set (security_invoker = true);

comment on view public.artigos_publicos is
  'Leitura publica de artigos. Mascara o conteudo fora do estado publicado e roda com security_invoker: as linhas visiveis sao as que a politica artigos_select libera para quem consulta. Ao recriar esta view, REPETIR a clausula with (security_invoker = true) — create or replace view apaga a opcao sem avisar.';

-- == 2. Funcoes internas deixam de ser chamaveis pela API =====================
--
-- Toda funcao em `public` vira uma rota /rest/v1/rpc/<nome>. Funcoes de gatilho
-- e o gatilho de evento nao sao para ninguem chamar: elas rodam sozinhas.
--
-- Revogar EXECUTE nao desliga o gatilho. O Postgres confere essa permissao no
-- momento em que o gatilho e CRIADO, nao a cada disparo — constatado num teste
-- em transacao desfeita, antes de escrever esta migracao: com EXECUTE revogado,
-- a funcao de gatilho continuou alterando a linha inserida, e o gatilho de
-- evento continuou ligando RLS na tabela nova.
--
-- `handle_new_user` era a mais grave: estava aberta ate para quem nao tem conta.
revoke all on function public.handle_new_user() from anon, authenticated;
revoke all on function public.rls_auto_enable() from anon, authenticated;
revoke all on function public.carimbar_autor() from anon, authenticated;
revoke all on function public.carimbar_membro_grupo() from anon, authenticated;
revoke all on function public.carona_conferir_vagas() from anon, authenticated;
revoke all on function public.entrega_transicao_valida() from anon, authenticated;
revoke all on function public.forum_recontar() from anon, authenticated;
revoke all on function public.oracao_conferir_vagas() from anon, authenticated;

-- Ficam de fora, de proposito, funcoes que o painel de seguranca aponta mas que
-- precisam mesmo estar abertas a quem nao tem conta:
--
--   diretorio_casas / diretorio_cidades / diretorio_estados
--     o diretorio de casas e publico por decisao de produto.
--   remover_casa_do_diretorio
--     a saida do diretorio e feita pela pagina publica da cidade, sem login.
--   get_request_kanban_token / has_kanban_access
--     o quadro tem compartilhamento por link com token para convidado sem
--     conta; revogar do anon derrubaria esse compartilhamento.
--   pode_revisar_artigo / total_verificados
--     a politica de leitura de artigos e a propria view publica as chamam
--     durante a consulta de quem nao tem conta.
--
-- artigos_avisos tambem continua com security_invoker = false de proposito, e o
-- comentario abaixo registra o porque para quem ler o painel de seguranca.
comment on view public.artigos_avisos is
  'DELIBERADAMENTE security definer. Existe para o endereco de um artigo retirado continuar respondendo com um aviso em vez de nao-encontrado — o que exige enxergar linhas que as politicas escondem. Por isso e minima: so slug, estado e data. Nao le conteudo, nem titulo, nem o motivo da retirada. Nao vaza o que nao enxerga.';

-- == 3a. Indice em toda chave estrangeira =====================================
--
-- Sem indice, o Postgres varre a tabela inteira a cada juncao e a cada
-- verificacao de exclusao em cascata. Com as tabelas quase vazias isso e
-- invisivel; com trinta casas em movimento e a diferenca entre a tela abrir e a
-- tela travar. Barato agora, caro depois.
create index if not exists idx_administradores_pagina_adicionado_por on public.administradores_pagina (adicionado_por);
create index if not exists idx_administradores_pagina_user_id on public.administradores_pagina (user_id);
create index if not exists idx_agenda_eventos_criador_id on public.agenda_eventos (criador_id);
create index if not exists idx_agenda_eventos_sigla_casa on public.agenda_eventos (sigla_casa);
create index if not exists idx_agenda_participantes_user_id on public.agenda_participantes (user_id);
create index if not exists idx_apresentacao_sessoes_apresentacao_id on public.apresentacao_sessoes (apresentacao_id);
create index if not exists idx_apresentacao_sessoes_iniciada_por on public.apresentacao_sessoes (iniciada_por);
create index if not exists idx_apresentacoes_criado_por on public.apresentacoes (criado_por);
create index if not exists idx_artigo_avaliacoes_user_id on public.artigo_avaliacoes (user_id);
create index if not exists idx_artigo_revisoes_artigo_id on public.artigo_revisoes (artigo_id);
create index if not exists idx_artigo_revisoes_decidida_por on public.artigo_revisoes (decidida_por);
create index if not exists idx_artigos_retirado_por_user_id on public.artigos (retirado_por_user_id);
create index if not exists idx_casas_convites_casa_id on public.casas_convites (casa_id);
create index if not exists idx_casas_pedidos_remocao_casa_id on public.casas_pedidos_remocao (casa_id);
create index if not exists idx_casas_reivindicacoes_casa_id on public.casas_reivindicacoes (casa_id);
create index if not exists idx_entregas_item_id on public.entregas (item_id);
create index if not exists idx_entregas_reserva_id on public.entregas (reserva_id);
create index if not exists idx_evangelizacao_presencas_turma_id on public.evangelizacao_presencas (turma_id);
create index if not exists idx_kanban_comentarios_evento_id on public.kanban_comentarios (evento_id);
create index if not exists idx_kanban_comentarios_user_id on public.kanban_comentarios (user_id);
create index if not exists idx_kanban_eventos_criador_id on public.kanban_eventos (criador_id);
create index if not exists idx_kanban_eventos_lista_id on public.kanban_eventos (lista_id);
create index if not exists idx_kanban_grupos_evento_id on public.kanban_grupos (evento_id);
create index if not exists idx_kanban_listas_sigla_casa on public.kanban_listas (sigla_casa);
create index if not exists idx_kanban_tarefas_grupo_id on public.kanban_tarefas (grupo_id);
create index if not exists idx_mensagens_do_dia_autor_id on public.mensagens_do_dia (autor_id);
create index if not exists idx_musicas_sigla_casa on public.musicas (sigla_casa);
create index if not exists idx_musicas_user_id on public.musicas (user_id);
create index if not exists idx_painel_votes_user_id on public.painel_votes (user_id);
create index if not exists idx_problem_reports_user_id on public.problem_reports (user_id);
create index if not exists idx_programacao_eventos_criado_por on public.programacao_eventos (criado_por);
create index if not exists idx_programacao_eventos_sigla_casa on public.programacao_eventos (sigla_casa);
create index if not exists idx_programacao_participantes_adicionado_por on public.programacao_participantes (adicionado_por);
create index if not exists idx_programacao_participantes_user_id on public.programacao_participantes (user_id);
create index if not exists idx_publicacoes_casa_autor_id on public.publicacoes_casa (autor_id);
create index if not exists idx_publicacoes_casa_sigla_casa on public.publicacoes_casa (sigla_casa);
create index if not exists idx_solicitacoes_dev_user_id on public.solicitacoes_dev (user_id);
create index if not exists idx_tesouraria_transacoes_criador_id on public.tesouraria_transacoes (criador_id);
create index if not exists idx_tesouraria_transacoes_sigla_casa on public.tesouraria_transacoes (sigla_casa);
create index if not exists idx_usuarios_sancoes_aplicada_por on public.usuarios_sancoes (aplicada_por);

-- == 3b. Politicas param de reavaliar a identidade linha a linha ==============
--
-- `auth.uid()` solto numa politica e chamado UMA VEZ POR LINHA examinada.
-- Envolvido num subselect — `(select auth.uid())` — o planejador o promove a
-- InitPlan e o resolve uma vez so por consulta. O resultado e identico; muda
-- quantas vezes o Postgres pergunta a mesma coisa.
--
-- O mesmo vale para minha_sigla_casa(), sou_dev() e email_verificado(): as tres
-- sao STABLE, sem argumento, e cada uma consulta uma tabela. Repetir isso por
-- linha e o pior caso dos tres.
--
-- Feito com `alter policy`, nunca com drop + create: a politica nunca deixa de
-- existir, entao nao ha instante nenhum em que a tabela fique desprotegida.
do $$
declare
  p record;
  q text;
  c text;
  ajustadas int := 0;
begin
  for p in
    select tablename, policyname, qual, with_check
      from pg_policies
     where schemaname = 'public'
       and (coalesce(qual, '') || coalesce(with_check, '')) ~
           '(auth\.uid|minha_sigla_casa|sou_dev|email_verificado)\(\)'
       and (coalesce(qual, '') || coalesce(with_check, '')) !~ 'SELECT auth\.uid\(\)'
  loop
    q := p.qual;
    c := p.with_check;

    -- A alternativa exige que a chamada nao venha precedida de ponto, para o
    -- caso de o Postgres imprimir `public.sou_dev()`: trocar so o nome ali
    -- produziria `public.(select sou_dev())`, que nao compila.
    q := regexp_replace(q, 'auth\.uid\(\)', '(select auth.uid())', 'g');
    c := regexp_replace(c, 'auth\.uid\(\)', '(select auth.uid())', 'g');
    q := regexp_replace(q, '(^|[^.[:alnum:]_])(minha_sigla_casa|sou_dev|email_verificado)\(\)', '\1(select \2())', 'g');
    c := regexp_replace(c, '(^|[^.[:alnum:]_])(minha_sigla_casa|sou_dev|email_verificado)\(\)', '\1(select \2())', 'g');

    if q is not null and c is not null then
      execute format('alter policy %I on public.%I using (%s) with check (%s)', p.policyname, p.tablename, q, c);
    elsif q is not null then
      execute format('alter policy %I on public.%I using (%s)', p.policyname, p.tablename, q);
    else
      execute format('alter policy %I on public.%I with check (%s)', p.policyname, p.tablename, c);
    end if;

    ajustadas := ajustadas + 1;
  end loop;

  raise notice 'Politicas ajustadas: %', ajustadas;
end $$;
