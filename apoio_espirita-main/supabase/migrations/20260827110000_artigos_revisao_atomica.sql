-- Corrige tres falhas encontradas na revisao de artigos da comunidade:
--
-- 1. Sancionar o autor e fechar o caso eram duas escritas separadas, sem
--    transacao. Se a sancao gravasse e o fechamento do caso falhasse, a
--    pessoa ja estava punida mas o caso continuava aberto na fila — e um
--    segundo clique do revisor, tentando de novo, criava uma SEGUNDA sancao
--    para a mesma pessoa. Numa tela que existe para punir, isso e engano
--    silencioso. A correcao junta as duas escritas numa unica funcao: uma
--    chamada de funcao e sempre atomica dentro da transacao do chamador, e o
--    "for update" trava a linha da revisao para que um segundo clique
--    concorrente espere e encontre o caso ja resolvido, em vez de resolver
--    duas vezes em paralelo.
--
-- 2. A exigencia de justificativa existia so na tela: artigo_revisoes.
--    justificativa nao tinha trava nenhuma, e usuarios_sancoes.motivo era
--    NOT NULL mas aceitava um espaco em branco. Uma chamada direta a API
--    podia banir alguem sem registrar motivo algum. O proprio projeto ja
--    tem o precedente certo em artigo_avaliacoes.descricao_obrigatoria_no_erro
--    — aqui replicamos o mesmo principio.
--
-- 3. O autor recebe a promessa "voce vera esta observacao com o seu nome",
--    mas o nome de quem avalia vem de profiles, cuja politica so libera a
--    propria linha, a mesma casa, ou DEV. Um avaliador de outra casa
--    aparecia ao autor como "Um avaliador" — e a promessa ficava falsa. Como
--    o recurso existe para que artigos sejam lidos por todas as casas, esse
--    e o caso normal quando a comunidade crescer. A politica de profiles
--    fica intacta (protege dado de membro de outra casa); em vez disso,
--    desnormalizamos o nome, como o projeto ja faz em artigos.autor_nome e
--    em publicacoes_casa.autor_nome.

-- ── Problema 1: resolucao atomica ───────────────────────────────────────────
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

-- Igual ao defeito ja corrigido em 20260826100600: revogar so "from public"
-- nao restringe anon, porque o Supabase concede execucao a esse papel por
-- padrao nas funcoes do schema public. Revogar por nome.
revoke execute on function
  public.resolver_revisao_artigo(uuid, text, text, int) from anon;
grant execute on function
  public.resolver_revisao_artigo(uuid, text, text, int) to authenticated;

-- ── Problema 2: justificativa e motivo obrigatorios no banco ───────────────
-- Mesma logica de artigo_avaliacoes.descricao_obrigatoria_no_erro: a tela ja
-- exige o texto, mas uma chamada direta a API nao passava pela tela. Enquanto
-- a revisao esta 'aberta' a justificativa e nula (ninguem decidiu nada
-- ainda); a partir de 'resolvida' ela e obrigatoria.
alter table public.artigo_revisoes
  add constraint justificativa_obrigatoria_ao_resolver check (
    case
      when estado = 'resolvida'
        then justificativa is not null and length(trim(justificativa)) >= 10
      else true
    end
  );

-- motivo ja e NOT NULL, mas aceitava string vazia ou so espacos. Suspender ou
-- banir sem motivo registrado nao pode ser possivel nem por chamada direta.
alter table public.usuarios_sancoes
  add constraint motivo_obrigatorio_na_sancao check (length(trim(motivo)) >= 10);

-- ── Problema 3: nome do avaliador desnormalizado ────────────────────────────
alter table public.artigo_avaliacoes
  add column avaliador_nome text;

comment on column public.artigo_avaliacoes.avaliador_nome is
  'Nome de quem avaliou, congelado no momento do voto — mesmo padrao de '
  'artigos.autor_nome e publicacoes_casa.autor_nome. A tela promete ao autor '
  '"voce vera esta observacao com o seu nome", mas a politica de profiles so '
  'libera a propria linha, a mesma casa, ou DEV: sem esta coluna, um '
  'avaliador de OUTRA casa apareceria ao autor como "Um avaliador" e a '
  'promessa feita a ele seria falsa — o caso normal quando a comunidade '
  'cruzar casas. Congelar o nome aqui nao afrouxa a politica de profiles, '
  'que continua protegendo dado de membro de outra casa; e congelar (em vez '
  'de sempre buscar o nome atual) e o comportamento certo, nao um efeito '
  'colateral: o mesmo motivo por que autor_nome nao muda se a pessoa depois '
  'trocar de nome ou de casa. Preenchida pela tela junto com o voto, sem '
  'gatilho.';
