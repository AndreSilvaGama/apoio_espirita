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
