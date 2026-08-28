-- O Supabase concede EXECUTE a anon por privilegio padrao em toda funcao nova
-- do schema public. O `revoke ... from public` da migracao anterior nao desfaz
-- isso: PUBLIC e anon sao concessoes distintas. Sem dano observado — as duas
-- funcoes administrativas ja recusavam quem nao e DEV, e reivindicar_casa exige
-- sessao —, mas nao ha motivo para deixa-las alcancaveis sem login.
--
-- diretorio_casas e remover_casa_do_diretorio continuam abertas a anon de
-- proposito: o visitante sem conta precisa ver o diretorio, e quem e da direcao
-- de uma casa listada pode pedir a retirada sem ter conta no site.

revoke execute on function public.desfazer_reivindicacao(uuid) from anon;
revoke execute on function public.restaurar_casa_no_diretorio(uuid) from anon;
revoke execute on function public.reivindicar_casa(uuid, text) from anon;
