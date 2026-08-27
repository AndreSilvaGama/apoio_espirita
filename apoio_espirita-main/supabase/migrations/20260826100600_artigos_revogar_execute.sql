-- Os revokes das migrations anteriores usaram "from public", que NAO restringe
-- os papeis anon e authenticated: o Supabase concede execucao a eles por padrao
-- nas funcoes do schema public. Conferido por has_function_privilege em
-- producao — anon executava todas. Aqui os papeis sao revogados por nome.

-- Funcoes de GATILHO. Nao existem para ser chamadas por ninguem; estavam
-- expostas como endpoint de API.
revoke execute on function public.artigo_recontar() from anon, authenticated;
revoke execute on function public.artigo_transicao_valida() from anon, authenticated;

-- Sondar se uma pessoa esta suspensa ou banida nao e assunto de visitante.
revoke execute on function public.usuario_sancionado(uuid) from anon;
revoke execute on function public.pode_sancionar(uuid) from anon;
revoke execute on function public.email_verificado() from anon;

-- Estas TEM de continuar disponiveis ao anonimo, e o motivo importa:
--   pode_revisar_artigo  e avaliada dentro da politica de leitura de artigos,
--                        que o visitante sem conta precisa executar;
--   total_verificados,
--   artigo_piso_retirada e artigo_deve_cair alimentam a coluna piso_atual da
--                        view publica, lida por quem nao tem conta.
-- Nenhuma delas devolve dado de pessoa: sao booleano e contagem agregada.
grant execute on function public.pode_revisar_artigo(uuid) to anon, authenticated;
grant execute on function public.total_verificados() to anon, authenticated;
grant execute on function public.artigo_piso_retirada(int) to anon, authenticated;
grant execute on function public.artigo_deve_cair(int, int, int) to anon, authenticated;
