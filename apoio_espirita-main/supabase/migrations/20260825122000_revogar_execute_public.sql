-- Funções nascem com EXECUTE para PUBLIC: revogar só de `anon` não surte efeito.
-- is_tesouraria_admin devolve false para quem não está autenticado, então não há
-- motivo para expô-la em /rest/v1/rpc a visitante anônimo.
revoke execute on function public.is_tesouraria_admin(text) from public;
grant execute on function public.is_tesouraria_admin(text) to authenticated, service_role;

-- Idem para as funções criadas na migração anterior.
revoke execute on function public.minha_sigla_casa() from public;
revoke execute on function public.sou_dev() from public;
grant execute on function public.minha_sigla_casa() to authenticated, service_role;
grant execute on function public.sou_dev() to authenticated, service_role;
