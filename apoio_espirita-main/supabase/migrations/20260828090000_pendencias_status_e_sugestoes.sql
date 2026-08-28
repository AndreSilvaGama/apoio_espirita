-- Acompanhamento real das pendencias de desenvolvimento.
--
-- Antes desta migracao:
--   * solicitacoes_dev nao tinha status: toda solicitacao aparecia como
--     "Pendente" para sempre no /painel, mesmo depois de atendida;
--   * solicitacoes_dev nao tinha politica de DELETE nem de UPDATE: o botao
--     "Remover" do /admin dizia "removida com sucesso" sem remover nada;
--   * site_suggestions nao tinha politica de SELECT nem de DELETE: o /admin
--     mostrava "Nenhuma sugestao recebida ainda" com sugestoes gravadas.

alter table public.solicitacoes_dev
  add column if not exists status text not null default 'pendente',
  add column if not exists resposta_dev text,
  add column if not exists atualizado_em timestamptz;

alter table public.solicitacoes_dev
  drop constraint if exists solicitacoes_dev_status_check;

alter table public.solicitacoes_dev
  add constraint solicitacoes_dev_status_check
  check (status in ('pendente', 'andamento', 'concluida', 'recusada'));

drop policy if exists "dev atualiza solicitacao" on public.solicitacoes_dev;
create policy "dev atualiza solicitacao"
  on public.solicitacoes_dev for update to authenticated
  using (public.sou_dev()) with check (public.sou_dev());

drop policy if exists "dev remove solicitacao" on public.solicitacoes_dev;
create policy "dev remove solicitacao"
  on public.solicitacoes_dev for delete to authenticated
  using (public.sou_dev());

-- A sugestao publica carrega nome e e-mail de quem escreveu, inclusive de quem
-- nao e membro. Fica visivel so para o DEV, nunca na listagem do /painel.
drop policy if exists "dev ve sugestoes" on public.site_suggestions;
create policy "dev ve sugestoes"
  on public.site_suggestions for select to authenticated
  using (public.sou_dev());

drop policy if exists "dev remove sugestao" on public.site_suggestions;
create policy "dev remove sugestao"
  on public.site_suggestions for delete to authenticated
  using (public.sou_dev());
