-- Fila do convite às casas espíritas do diretório.
--
-- Por que uma tabela e não um script: são milhares de endereços, enviados em
-- lotes ao longo de dias. Sem registro do que já saiu, uma segunda rodada
-- mandaria o mesmo convite de novo para quem já recebeu — e nada irrita mais
-- uma instituição do que a mesma mensagem repetida. A chave única em `email`
-- torna a repetição impossível, não apenas improvável.
--
-- Sem política de RLS nenhuma, de propósito: só a chave de serviço enxerga
-- esta tabela. A lista de e-mails das casas não é dado para o navegador.

create table if not exists public.casas_convites (
  id         uuid primary key default gen_random_uuid(),
  casa_id    uuid not null references public.casas_espirita(id) on delete cascade,
  email      text not null unique,
  status     text not null default 'pendente'
             check (status in ('pendente', 'enviado', 'falhou')),
  enviado_em timestamptz,
  erro       text,
  tentativas int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists casas_convites_pendentes
  on public.casas_convites (status) where status = 'pendente';

alter table public.casas_convites enable row level security;

-- Carga da fila: um endereço por linha, minúsculo, sem repetição e só o que
-- tem forma de e-mail. Casa com dois endereços entra duas vezes — são pessoas
-- diferentes da mesma direção. Endereço repetido entre casas entra uma vez só.
insert into public.casas_convites (casa_id, email)
select distinct on (endereco) id, endereco
from (
  select c.id, lower(trim(unnest(string_to_array(c.email, ',')))) as endereco
  from public.casas_espirita c
  where c.email is not null and c.ativa and c.visivel_diretorio
) t
where endereco ~ '^[^@[:space:],]+@[^@[:space:],]+\.[a-z]{2,}$'
order by endereco, id
on conflict (email) do nothing;

-- Entrega o próximo lote do convite já montado: endereço, nome da casa, cidade
-- e o caminho da página dela. O slug sai da MESMA função que o site usa para
-- montar os links, senão o convite mandaria a casa para uma página que não
-- existe.
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
  where v.status = 'pendente' and c.ativa and c.visivel_diretorio
  order by v.created_at, v.id
  limit greatest(0, least(p_limite, 1000));
$$;

-- Ninguém além da chave de serviço pode ler a lista de e-mails das casas.
revoke execute on function public.convites_pendentes(int) from anon, authenticated, public;
