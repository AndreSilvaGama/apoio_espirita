-- Corrige o defeito mais grave encontrado na revisao final da branch de
-- artigos da comunidade, confirmado por EXECUCAO contra o banco de producao:
-- as colunas de identidade de artigos e artigo_avaliacoes sao escritas pelo
-- cliente e nunca conferidas no servidor. A politica artigos_insert so exige
-- autor_id = auth.uid() — RLS filtra LINHA, nao COLUNA — entao qualquer
-- pessoa autenticada podia publicar um artigo assinado com o autor_nome e o
-- autor_sigla_casa de OUTRA pessoa. Provado em producao:
--   assinatura_gravada: "Barbara Ferreira de Aragao"
--   casa_gravada:       "OUTRA"
--   estado:             "publicado"
-- Isso publicava texto indexado por buscadores assinado por um membro
-- inocente, e escolhia qual Presidente modera o proprio artigo (autor_sigla_casa
-- decide isso em pode_revisar_artigo).

-- ── Problema 1 e 2: carimbo de identidade + protecao do registro de retirada ─
--
-- Um unico gatilho, porque as duas correcoes mexem nas mesmas colunas em
-- BEFORE INSERT OR UPDATE de artigos.
--
-- Carimbo (problema 1): autor_nome e autor_sigla_casa vem sempre de
-- public.profiles, nunca do que o cliente mandou. SECURITY DEFINER e
-- search_path = '' porque profiles so libera a propria linha via RLS
-- (profiles_leitura_propria) e o gatilho precisa ler o autor da linha, nao
-- quem esta autenticado.
--
-- Mas autor_nome/autor_sigla_casa sao desnormalizados DE PROPOSITO (mesmo
-- comentario da tabela): a assinatura nao deve mudar se a pessoa depois
-- trocar de casa ou de nome. Recarimbar em TODO update reescreveria a
-- assinatura historica de um artigo antigo sempre que o autor so corrigisse
-- o texto. Por isso: no INSERT, carimba sempre; no UPDATE, carimba so quando
-- autor_id muda (hoje nunca muda na pratica — nao ha reatribuicao de autor —,
-- mas a regra fica correta se um dia existir).
--
-- Protecao da retirada (problema 2): a politica artigos_update libera o
-- autor para UPDATE sem restricao de coluna enquanto o artigo esta em
-- ('publicado','retirado','em_correcao') — ou seja, o autor podia mandar
-- retirado_motivo = null e retirado_por = null no mesmo PATCH que leva o
-- proprio artigo retirado para em_correcao, apagando o texto que o revisor
-- le no cartao da fila.
--
-- A condicao NAO pode ser simplesmente "quem atualiza nao e revisor": as
-- DUAS escritas legitimas dessas colunas fora de resolver_revisao_artigo sao
-- (a) o proprio resolver_revisao_artigo, cujo autor.uid() ja passou por
-- pode_revisar_artigo antes de chegar aqui, e (b) o gatilho de retirada
-- automatica em artigo_recontar(), disparado pelo voto de um AVALIADOR — e a
-- politica artigo_avaliacoes_insert proibe avaliar o proprio artigo
-- ("Ninguem avalia o proprio artigo"), entao esse avaliador NUNCA e o
-- autor_id do artigo. Um avaliador que por acaso for Presidente/Vice da
-- mesma casa passa em pode_revisar_artigo e escreve normalmente; um
-- avaliador comum NAO passa em pode_revisar_artigo — se a condicao fosse so
-- "nao e revisor", a retirada automatica da comunidade seria desfeita pelo
-- proprio gatilho que deveria so proteger o autor. A condicao certa —
-- exatamente o defeito relatado — e "quem atualiza E o autor deste artigo E
-- nao e revisor".
create or replace function public.artigo_carimbar_identidade()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_nome text;
  v_sigla text;
begin
  if tg_op = 'INSERT' or new.autor_id is distinct from old.autor_id then
    select p.nome, p.sigla_casa into v_nome, v_sigla
      from public.profiles p
     where p.id = new.autor_id;

    -- autor_nome e NOT NULL; perfil sem nome preenchido vira algo neutro,
    -- nunca vazio.
    new.autor_nome := coalesce(nullif(trim(v_nome), ''), 'Membro da comunidade');
    new.autor_sigla_casa := v_sigla;
  end if;

  if tg_op = 'UPDATE'
     and old.autor_id = auth.uid()
     and not public.pode_revisar_artigo(new.id)
  then
    new.retirado_em := old.retirado_em;
    new.retirado_por := old.retirado_por;
    new.retirado_por_user_id := old.retirado_por_user_id;
    new.retirado_motivo := old.retirado_motivo;
  end if;

  return new;
end;
$$;

drop trigger if exists artigos_carimbo_identidade on public.artigos;
create trigger artigos_carimbo_identidade
before insert or update on public.artigos
for each row execute function public.artigo_carimbar_identidade();

-- Gatilho, nao endpoint de API: revogar de public, anon e authenticated por
-- NOME — "from public" sozinho nao restringe anon/authenticated no Supabase
-- (mesma armadilha corrigida em 20260826100600_artigos_revogar_execute.sql).
-- Chamada de gatilho nao exige EXECUTE do papel da sessao, entao revogar nao
-- quebra o disparo automatico em INSERT/UPDATE.
revoke execute on function public.artigo_carimbar_identidade()
  from public, anon, authenticated;

-- Mesmo carimbo em artigo_avaliacoes.avaliador_nome, hoje preenchido pela
-- tela sem gatilho nenhum (comentario da coluna, migration
-- 20260827110000_artigos_revisao_atomica.sql) — o mesmo defeito do
-- autor_nome, so que sobre o nome que aparece na acusacao de erro lida pelo
-- autor. user_id nunca muda na pratica (a politica artigo_avaliacoes_update
-- so libera update em que new.user_id = auth.uid() = old.user_id), mas a
-- condicao replica a mesma logica do gatilho de artigos: carimba sempre no
-- INSERT, e no UPDATE so recarimba se a identidade (user_id) mudar — editar
-- o TIPO do voto ou a descricao do erro nao deve trocar o nome congelado no
-- momento do voto original.
create or replace function public.artigo_avaliacao_carimbar_nome()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_nome text;
begin
  if tg_op = 'INSERT' or new.user_id is distinct from old.user_id then
    select p.nome into v_nome
      from public.profiles p
     where p.id = new.user_id;

    new.avaliador_nome := coalesce(nullif(trim(v_nome), ''), 'Um avaliador');
  end if;

  return new;
end;
$$;

drop trigger if exists artigo_avaliacoes_carimbo_nome on public.artigo_avaliacoes;
create trigger artigo_avaliacoes_carimbo_nome
before insert or update on public.artigo_avaliacoes
for each row execute function public.artigo_avaliacao_carimbar_nome();

revoke execute on function public.artigo_avaliacao_carimbar_nome()
  from public, anon, authenticated;

-- ── Problema 3: manter_retirado num reenvio tinha que devolver a 'retirado' ─
--
-- resolver_revisao_artigo so tratava a decisao 'restaurar'. Quando a decisao
-- e 'manter_retirado' e o artigo esta em 'em_correcao' (autor reenviou apos
-- corrigir), nada movia o estado — o artigo ficava em 'em_correcao' para
-- sempre, sem aparecer nem como publicado nem como retirado. Recriada
-- inteira via CREATE OR REPLACE, preservando tudo o que ja fazia; unica
-- adicao e o bloco do 'manter_retirado' logo apos o 'restaurar'.
create or replace function public.resolver_revisao_artigo(
  p_revisao uuid,
  p_decisao text,
  p_justificativa text,
  p_dias_suspensao int default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_revisao public.artigo_revisoes%rowtype;
  v_autor_id uuid;
  v_ja_vigente boolean;
begin
  if p_decisao not in ('restaurar', 'manter_retirado', 'suspender_autor', 'banir_autor') then
    raise exception 'Decisão inválida: %.', p_decisao;
  end if;

  -- Trava a linha da revisao. Se um segundo clique chegar enquanto este
  -- primeiro ainda processa, ele espera aqui e, ao continuar, encontra
  -- estado = 'resolvida' — sem essa trava os dois poderiam ler 'aberta' ao
  -- mesmo tempo e ambos sancionariam a mesma pessoa.
  select * into v_revisao
    from public.artigo_revisoes
   where id = p_revisao
     for update;

  if not found then
    raise exception 'Revisão não encontrada.';
  end if;

  if v_revisao.estado = 'resolvida' then
    raise exception 'Esta revisão já foi resolvida — recarregue a fila antes de tentar de novo.';
  end if;

  if p_justificativa is null or length(trim(p_justificativa)) < 10 then
    raise exception 'A justificativa precisa ter pelo menos 10 caracteres.';
  end if;

  if not public.pode_revisar_artigo(v_revisao.artigo_id) then
    raise exception 'Você não tem permissão para revisar este artigo.';
  end if;

  select autor_id into v_autor_id
    from public.artigos
   where id = v_revisao.artigo_id;

  if p_decisao in ('suspender_autor', 'banir_autor')
     and not public.pode_sancionar(v_autor_id) then
    raise exception 'Você não tem permissão para sancionar o autor deste artigo.';
  end if;

  if p_decisao = 'restaurar' then
    update public.artigos
       set estado = 'publicado',
           retirado_em = null,
           retirado_por = null,
           retirado_por_user_id = null,
           retirado_motivo = null
     where id = v_revisao.artigo_id;
  end if;

  -- Reenvio recusado: o autor corrigiu e reenviou (estado foi para
  -- 'em_correcao' pelo proprio autor), mas o revisor decide que a correcao
  -- nao resolveu o problema. Sem este bloco o artigo ficava preso em
  -- 'em_correcao' — nem publicado, nem retirado — porque so a decisao
  -- 'restaurar' movia o estado.
  if p_decisao = 'manter_retirado' then
    update public.artigos
       set estado = 'retirado'
     where id = v_revisao.artigo_id
       and estado = 'em_correcao';
  end if;

  if p_decisao = 'suspender_autor' then
    if p_dias_suspensao is null or p_dias_suspensao < 1 then
      raise exception 'Informe a quantidade de dias de suspensão (mínimo 1).';
    end if;

    select exists (
      select 1 from public.usuarios_sancoes
       where user_id = v_autor_id
         and tipo = 'suspensao'
         and revogada_em is null
         and (fim is null or fim > now())
    ) into v_ja_vigente;

    -- Nao duplicar: se a pessoa ja esta sob suspensao vigente, este caso so
    -- fecha a revisao — nao empilha uma segunda sancao por cima.
    if not v_ja_vigente then
      insert into public.usuarios_sancoes (user_id, tipo, fim, motivo, aplicada_por)
      values (v_autor_id, 'suspensao', now() + make_interval(days => p_dias_suspensao),
              p_justificativa, auth.uid());
    end if;
  end if;

  if p_decisao = 'banir_autor' then
    select exists (
      select 1 from public.usuarios_sancoes
       where user_id = v_autor_id
         and tipo = 'banimento'
         and revogada_em is null
    ) into v_ja_vigente;

    if not v_ja_vigente then
      insert into public.usuarios_sancoes (user_id, tipo, fim, motivo, aplicada_por)
      values (v_autor_id, 'banimento', null, p_justificativa, auth.uid());
    end if;
  end if;

  update public.artigo_revisoes
     set estado = 'resolvida',
         decisao = p_decisao,
         justificativa = p_justificativa,
         decidida_por = auth.uid(),
         decidida_em = now()
   where id = p_revisao;
end;
$$;

-- ── Problema 4: o revoke que faltou ─────────────────────────────────────────
--
-- A migration anterior (20260827110000_artigos_revisao_atomica.sql) revogou
-- so "from anon" — inocuo, porque o acesso vinha de PUBLIC. Conferido
-- diretamente por proacl em producao: authenticated e anon ainda executavam
-- resolver_revisao_artigo via PUBLIC. Mesma armadilha que
-- 20260826100600_artigos_revogar_execute.sql existe para corrigir: no
-- Supabase, "revoke ... from public" nao restringe os papeis anon e
-- authenticated, que recebem EXECUTE por padrao em funcoes do schema public.
-- Revogar por nome e so entao conceder a quem deve continuar podendo chamar.
revoke execute on function
  public.resolver_revisao_artigo(uuid, text, text, int) from public, anon;
grant execute on function
  public.resolver_revisao_artigo(uuid, text, text, int) to authenticated;

-- ── Problema 5: acentos no texto que o autor e o revisor leem ───────────────
--
-- artigo_recontar gravava o motivo da retirada automatica sem acento
-- ("marcacoes", "aprovacoes") — texto que aparece ao autor em "Meus artigos"
-- e ao revisor no cartao da fila. Recriada inteira via CREATE OR REPLACE,
-- identica em logica; unica mudanca e a ortografia das duas palavras no
-- format().
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
             'Retirado automaticamente: %s marcações de erro grave, piso de %s, contra %s aprovações.',
             reg.aval_erro_grave, piso,
             reg.aval_otimo + reg.aval_bom + reg.aval_gostei)
     where id = alvo;

    insert into public.artigo_revisoes (artigo_id, origem)
    values (alvo, 'comunidade');
  end if;

  return coalesce(new, old);
end;
$$;
