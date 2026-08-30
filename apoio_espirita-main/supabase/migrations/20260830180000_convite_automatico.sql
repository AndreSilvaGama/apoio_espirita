-- Rotina automática do convite às casas espíritas.
--
-- Envia um lote por dia útil, às 9h de Brasília, até a lista acabar. Três
-- decisões moldaram isto, e nenhuma é detalhe de implementação:
--
-- 1. **A rotina nasce DESLIGADA.** O agendamento roda todo dia, mas não envia
--    nada enquanto `automatico` for falso. Só existe uma primeira impressão
--    com cada uma das 1.604 casas: um problema no texto descoberto no sexto
--    lote já teria alcançado mil e quinhentas delas. Então o primeiro lote é
--    conferido à mão, e só depois alguém liga a rotina.
--
-- 2. **O segredo que autoriza o agendamento é gerado AQUI DENTRO** e nunca sai
--    do banco: não aparece no código, não vai para o repositório e ninguém
--    precisa copiá-lo de um lugar para outro. É a razão de a função de envio
--    conferir um cabeçalho próprio em vez de exigir a chave de serviço — chave
--    que precisa ser transportada é chave vazada mais cedo ou mais tarde.
--
-- 3. **A rotina sabe parar.** Ela se desliga sozinha quando a lista termina,
--    quando o provedor fica sem crédito e quando mais de 30% de um lote falha
--    — e avisa por e-mail nos três casos. Rotina desatendida que insiste num
--    domínio bloqueado queima a lista inteira em uma semana.

create extension if not exists pg_cron;
create extension if not exists pg_net;

create table if not exists public.convite_config (
  id            int primary key default 1 check (id = 1),
  automatico    boolean not null default false,
  por_dia       int not null default 300 check (por_dia between 1 and 500),
  pausado_em    timestamptz,
  motivo        text,
  segredo       text,
  atualizado_em timestamptz not null default now()
);

insert into public.convite_config (id) values (1) on conflict (id) do nothing;

update public.convite_config
   set segredo = encode(gen_random_bytes(32), 'hex')
 where id = 1 and (segredo is null or length(segredo) < 32);

alter table public.convite_config alter column segredo set not null;

alter table public.convite_config enable row level security;
-- Sem política nenhuma: só a chave de serviço enxerga. O painel lê e escreve
-- através da função de envio, que já confere quem está chamando.

-- O lote passa a incluir quem falhou UMA vez. Falha de rede merece segunda
-- chance; endereço que não existe mais — comum num cadastro antigo — falharia
-- de novo, então a segunda tentativa é a última.
create or replace function public.convites_pendentes(p_limite int)
returns table (
  convite_id uuid,
  email      text,
  casa_nome  text,
  cidade     text,
  uf         text,
  slug       text
)
language sql
security definer
set search_path = public
as $$
  select v.id, v.email, c.nome, c.cidade, c.estado, public.diretorio_slug(c.cidade)
  from public.casas_convites v
  join public.casas_espirita c on c.id = v.casa_id
  where c.ativa and c.visivel_diretorio
    and (v.status = 'pendente' or (v.status = 'falhou' and v.tentativas < 2))
  order by (v.status = 'falhou'), v.created_at, v.id
  limit greatest(0, least(p_limite, 1000));
$$;

revoke execute on function public.convites_pendentes(int) from anon, authenticated, public;

-- Quantos ainda podem sair: pendentes mais as falhas com direito a segunda
-- tentativa. É este número que diz à rotina que ela terminou.
create or replace function public.convites_restantes()
returns int
language sql
security definer
set search_path = public
as $$
  select count(*)::int
  from public.casas_convites v
  join public.casas_espirita c on c.id = v.casa_id
  where c.ativa and c.visivel_diretorio
    and (v.status = 'pendente' or (v.status = 'falhou' and v.tentativas < 2));
$$;

revoke execute on function public.convites_restantes() from anon, authenticated, public;

-- Chama a função de envio. Fica como função do banco, e não escrita direta no
-- agendamento, para o segredo não ficar gravado na definição do cron — que é
-- legível por quem consulta a tabela de agendamentos.
create or replace function public.disparar_convites_agendados()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_segredo text;
begin
  select segredo into v_segredo from public.convite_config where id = 1;
  if v_segredo is null then
    raise warning 'Convite às casas: segredo do agendamento ausente.';
    return;
  end if;

  perform net.http_post(
    url := 'https://kitmwxfwwujygcmdjngm.supabase.co/functions/v1/convite-casas',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-segredo', v_segredo
    ),
    body := jsonb_build_object('acao', 'enviar'),
    timeout_milliseconds := 120000
  );
end;
$$;

revoke execute on function public.disparar_convites_agendados() from anon, authenticated, public;

-- Dias úteis, 12h UTC — que é 9h no horário de Brasília. E-mail institucional
-- é lido de manhã, em dia de expediente; no fim de semana a secretaria da casa
-- não está lá, e a mensagem chegaria no acúmulo de segunda.
select cron.unschedule('convite-casas-diario')
where exists (select 1 from cron.job where jobname = 'convite-casas-diario');

select cron.schedule(
  'convite-casas-diario',
  '0 12 * * 1-5',
  $cron$ select public.disparar_convites_agendados(); $cron$
);
