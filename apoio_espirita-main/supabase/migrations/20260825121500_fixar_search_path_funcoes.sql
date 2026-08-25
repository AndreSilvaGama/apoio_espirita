-- Fixa o search_path das funções (alerta "Function Search Path Mutable" do linter).
-- Sem search_path fixo, uma função SECURITY DEFINER pode ser induzida a resolver
-- um nome para um objeto plantado por outro schema. Os corpos já qualificam
-- public./auth., então declarar o caminho não altera comportamento.
alter function public.set_updated_at() set search_path = public;
alter function public.get_request_kanban_token() set search_path = public;
alter function public.has_kanban_access(text) set search_path = public, auth;
alter function public.is_tesouraria_admin(text) set search_path = public, auth;

-- is_tesouraria_admin só responde a usuário autenticado; anon não precisa executá-la.
-- has_kanban_access e get_request_kanban_token CONTINUAM acessíveis a anon de
-- propósito: são elas que liberam o quadro compartilhado por token de convidado.
revoke execute on function public.is_tesouraria_admin(text) from anon;
