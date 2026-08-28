-- Como o autor assina o artigo, agora que os artigos passaram a ser
-- encontrados nos buscadores.
--
-- Um artigo publicado leva o nome completo de quem escreveu e a casa dele.
-- Enquanto o site nao era indexado isso ficava entre membros; indexado, o nome
-- da pessoa passa a ser pesquisavel para sempre. Quem escreve sobre um assunto
-- pessoal — luto, doenca, obsessao — precisa poder decidir.
--
-- O padrao continua sendo o de hoje: assinado com nome completo e casa,
-- encontravel. As duas colunas so dao ao autor a chance de escolher diferente.

alter table public.artigos
  add column if not exists assinatura text not null default 'completa',
  add column if not exists indexavel boolean not null default true;

alter table public.artigos
  drop constraint if exists artigos_assinatura_check;

alter table public.artigos
  add constraint artigos_assinatura_check
  check (assinatura in ('completa', 'primeiro_nome'));

-- A view entrega o nome ja como ele deve aparecer. Assim nenhuma tela precisa
-- lembrar da regra — e nenhuma tela nova pode esquece-la.
create or replace view public.artigos_publicos as
  select
    id,
    autor_id,
    case
      when assinatura = 'primeiro_nome' then split_part(btrim(autor_nome), ' ', 1)
      else autor_nome
    end as autor_nome,
    autor_sigla_casa,
    titulo,
    slug,
    resumo,
    case
      when estado = 'publicado' then conteudo
      else null::text
    end as conteudo,
    estado,
    aval_otimo,
    aval_bom,
    aval_gostei,
    aval_nao_gostei,
    aval_otimo + aval_bom + aval_gostei as aprovacoes,
    retirado_em,
    retirado_por,
    retirado_motivo,
    created_at,
    editado_em,
    publicado_em,
    public.artigo_piso_retirada(public.total_verificados()) as piso_atual,
    -- Colunas novas entram no fim: `create or replace view` nao aceita
    -- inserir coluna no meio da lista, so acrescentar ao final.
    assinatura,
    indexavel
  from public.artigos a;
