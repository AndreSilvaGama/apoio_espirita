-- O Supabase concede EXECUTE a `anon` por privilégio padrão nas funções novas
-- do schema public. Revogar só de PUBLIC não remove essa concessão explícita —
-- é preciso revogar de `anon` também. Foi o que faltou nesta função.
-- Ela devolve false para quem não está autenticado, então não havia risco;
-- mas não há motivo para expô-la em /rest/v1/rpc a visitante anônimo.
revoke execute on function public.pode_administrar_pagina(text) from anon;
