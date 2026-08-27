-- A view publica trazia aval_erro e aval_erro_grave. Como ela e concedida a
-- anon, qualquer pessoa com a chave publica do site — que esta no bundle —
-- conseguia ler quantas denuncias um artigo tem, mesmo a tela nao mostrando.
-- Constatado por chamada real a API: {"aval_erro":1,"aval_erro_grave":2}.
--
-- Placar de denuncia em publico convida brigada: da para orquestrar em cima do
-- numero, e o autor fica exposto a uma contagem de acusacoes que qualquer um le.
-- Esconder na tela nao bastava; a regra precisa estar no dado.
--
-- Quem tem o que fazer com essas contagens continua alcancando-as: o autor e
-- quem revisa leem public.artigos diretamente, onde as colunas permanecem, e a
-- politica artigos_select ja libera esse caminho para os dois.
create or replace view public.artigos_publicos
with (security_invoker = true)
as
select
  a.id, a.autor_id, a.autor_nome, a.autor_sigla_casa,
  a.titulo, a.slug, a.resumo,
  case when a.estado = 'publicado' then a.conteudo else null end as conteudo,
  a.estado,
  a.aval_otimo, a.aval_bom, a.aval_gostei, a.aval_nao_gostei,
  (a.aval_otimo + a.aval_bom + a.aval_gostei) as aprovacoes,
  a.retirado_em, a.retirado_por, a.retirado_motivo,
  a.created_at, a.editado_em, a.publicado_em,
  public.artigo_piso_retirada(public.total_verificados()) as piso_atual
from public.artigos a;

grant select on public.artigos_publicos to anon, authenticated;
