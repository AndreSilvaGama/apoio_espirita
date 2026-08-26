-- Recontagem e retirada automatica, na MESMA transacao do voto.
--
-- Fica no banco, e nao no aplicativo, por tres motivos: nao depende de ninguem
-- abrir tela nenhuma, nao tem janela de atraso (o conteudo e publico e
-- indexado) e nao da para burlar pelo navegador.
create or replace function public.artigo_recontar()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  alvo uuid := coalesce(new.artigo_id, old.artigo_id);
  reg record;
  piso int;
begin
  update public.artigos a
     set aval_otimo      = c.otimo,
         aval_bom        = c.bom,
         aval_gostei     = c.gostei,
         aval_nao_gostei = c.nao_gostei,
         aval_erro       = c.erro,
         aval_erro_grave = c.erro_grave
    from (
      select
        count(*) filter (where tipo = 'otimo')      as otimo,
        count(*) filter (where tipo = 'bom')        as bom,
        count(*) filter (where tipo = 'gostei')     as gostei,
        count(*) filter (where tipo = 'nao_gostei') as nao_gostei,
        count(*) filter (where tipo = 'erro')       as erro,
        count(*) filter (where tipo = 'erro_grave') as erro_grave
      from public.artigo_avaliacoes where artigo_id = alvo
    ) c
   where a.id = alvo
   returning a.* into reg;

  if reg is null then
    return coalesce(new, old);
  end if;

  piso := public.artigo_piso_retirada(public.total_verificados());

  -- So retira o que esta no ar. O gatilho NUNCA restaura sozinho: se as
  -- avaliacoes mudarem depois, o artigo continua retirado ate decisao humana.
  -- Retirar e reversivel por gente; oscilar sozinho, nao.
  if reg.estado = 'publicado'
     and public.artigo_deve_cair(
           reg.aval_erro_grave,
           reg.aval_otimo + reg.aval_bom + reg.aval_gostei,
           piso
         )
  then
    update public.artigos
       set estado = 'retirado',
           retirado_em = now(),
           retirado_por = 'comunidade',
           retirado_motivo = format(
             'Retirado automaticamente: %s marcacoes de erro grave, piso de %s, contra %s aprovacoes.',
             reg.aval_erro_grave, piso,
             reg.aval_otimo + reg.aval_bom + reg.aval_gostei)
     where id = alvo;

    insert into public.artigo_revisoes (artigo_id, origem)
    values (alvo, 'comunidade');
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists artigo_avaliacoes_reconta on public.artigo_avaliacoes;
create trigger artigo_avaliacoes_reconta
after insert or update or delete on public.artigo_avaliacoes
for each row execute function public.artigo_recontar();

revoke execute on function public.artigo_recontar() from public;
