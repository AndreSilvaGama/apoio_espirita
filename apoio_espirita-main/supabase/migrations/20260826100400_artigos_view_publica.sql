-- Esconder o texto retirado na tela nao bastaria: quem abrisse as ferramentas
-- do navegador leria o conteudo na resposta da API. A view zera o texto na
-- origem, no servidor.
--
-- Traz tambem piso_atual, para a tela mostrar quantas marcacoes faltam sem
-- recalcular a regra por conta propria. Uma regra, um lugar.
create or replace view public.artigos_publicos
with (security_invoker = true)
as
select
  a.id, a.autor_id, a.autor_nome, a.autor_sigla_casa,
  a.titulo, a.slug, a.resumo,
  case when a.estado = 'publicado' then a.conteudo else null end as conteudo,
  a.estado,
  a.aval_otimo, a.aval_bom, a.aval_gostei,
  a.aval_nao_gostei, a.aval_erro, a.aval_erro_grave,
  (a.aval_otimo + a.aval_bom + a.aval_gostei) as aprovacoes,
  a.retirado_em, a.retirado_por, a.retirado_motivo,
  a.created_at, a.editado_em, a.publicado_em,
  public.artigo_piso_retirada(public.total_verificados()) as piso_atual
from public.artigos a;

grant select on public.artigos_publicos to anon, authenticated;

-- A especificacao promete que o endereco de um artigo retirado continua no ar
-- com um aviso. As politicas, porem, so mostram artigos publicados a quem nao
-- tem conta — entao o visitante receberia "nao encontrado" e a promessa nao se
-- cumpriria.
--
-- Esta view existe so para o aviso. Ela nao respeita as politicas de propósito,
-- e por isso e deliberadamente minima: NAO seleciona conteudo, NAO seleciona
-- titulo e NAO seleciona o motivo da retirada. Nao da para vazar o que a view
-- nem enxerga.
--
-- O titulo fica de fora porque ele mesmo pode carregar a informacao falsa que
-- causou a retirada; repeti-lo na tela seria republicar o problema em miniatura.
-- O motivo fica de fora porque expor a contagem de denuncias em publico convida
-- a brigada.
create or replace view public.artigos_avisos
with (security_invoker = false)
as
select a.slug, a.estado, a.retirado_em
  from public.artigos a
 where a.estado in ('retirado', 'em_correcao');

grant select on public.artigos_avisos to anon, authenticated;
