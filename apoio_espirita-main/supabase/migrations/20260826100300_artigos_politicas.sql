-- Quem revisa: o DEV do site, e o Presidente ou Vice da casa do autor.
-- Banir alguem atravessa as casas, entao o DEV enxerga tudo; o Presidente
-- enxerga apenas os autores da propria casa.
create or replace function public.pode_revisar_artigo(alvo uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.artigos a
      join public.profiles p on p.id = auth.uid()
     where a.id = alvo
       and (
         p.cargo_principal = 'DEV'
         or (p.sigla_casa = a.autor_sigla_casa
             and p.cargo_principal in ('Presidente', 'Vice-presidente'))
       )
  );
$$;

revoke execute on function public.pode_revisar_artigo(uuid) from public;
grant execute on function public.pode_revisar_artigo(uuid) to authenticated;

-- ── artigos ────────────────────────────────────────────────────────────────
-- Qualquer pessoa, com ou sem conta, le os publicados. O autor ve os seus em
-- qualquer estado. Quem revisa ve tudo.
create policy artigos_select on public.artigos for select
  using (
    estado = 'publicado'
    or autor_id = auth.uid()
    or public.pode_revisar_artigo(id)
  );

create policy artigos_insert on public.artigos for insert
  with check (
    autor_id = auth.uid()
    and public.email_verificado()
    and not public.usuario_sancionado(auth.uid())
  );

-- O autor corrige enquanto o texto nao esta sob decisao; o revisor mexe sempre.
create policy artigos_update on public.artigos for update
  using (
    (autor_id = auth.uid() and estado in ('publicado', 'retirado', 'em_correcao'))
    or public.pode_revisar_artigo(id)
  )
  with check (
    autor_id = auth.uid() or public.pode_revisar_artigo(id)
  );

create policy artigos_delete on public.artigos for delete
  using (public.pode_revisar_artigo(id));

-- ── artigo_avaliacoes ──────────────────────────────────────────────────────
-- O publico NAO le esta tabela. Politica no Postgres filtra linha, nao coluna:
-- nao ha como liberar a contagem e esconder a descricao do erro na mesma
-- consulta. As contagens ja estao em artigos; as descricoes, que sao acusacoes
-- escritas sobre pessoa identificada, ficam com quem tem o que fazer com elas.
create policy artigo_avaliacoes_select on public.artigo_avaliacoes for select
  using (
    user_id = auth.uid()
    or exists (select 1 from public.artigos a
                where a.id = artigo_id and a.autor_id = auth.uid())
    or public.pode_revisar_artigo(artigo_id)
  );

create policy artigo_avaliacoes_insert on public.artigo_avaliacoes for insert
  with check (
    user_id = auth.uid()
    and public.email_verificado()
    and not public.usuario_sancionado(auth.uid())
    -- Ninguem avalia o proprio artigo.
    and not exists (select 1 from public.artigos a
                     where a.id = artigo_id and a.autor_id = auth.uid())
  );

create policy artigo_avaliacoes_update on public.artigo_avaliacoes for update
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and public.email_verificado()
    and not public.usuario_sancionado(auth.uid())
  );

create policy artigo_avaliacoes_delete on public.artigo_avaliacoes for delete
  using (user_id = auth.uid());

-- ── artigo_revisoes ────────────────────────────────────────────────────────
create policy artigo_revisoes_select on public.artigo_revisoes for select
  using (
    public.pode_revisar_artigo(artigo_id)
    or exists (select 1 from public.artigos a
                where a.id = artigo_id and a.autor_id = auth.uid())
  );

create policy artigo_revisoes_update on public.artigo_revisoes for update
  using (public.pode_revisar_artigo(artigo_id))
  with check (public.pode_revisar_artigo(artigo_id));

-- Abrir revisao: o gatilho (SECURITY DEFINER, passa por cima da politica),
-- quem revisa, e o AUTOR quando reenvia o proprio artigo corrigido. Sem o
-- ultimo caso o reenvio da Task 10 seria bloqueado pela politica.
create policy artigo_revisoes_insert on public.artigo_revisoes for insert
  with check (
    public.pode_revisar_artigo(artigo_id)
    or (
      origem = 'reenvio'
      and exists (select 1 from public.artigos a
                   where a.id = artigo_id
                     and a.autor_id = auth.uid()
                     and a.estado = 'em_correcao')
    )
  );

-- ── usuarios_sancoes ───────────────────────────────────────────────────────
create policy usuarios_sancoes_select on public.usuarios_sancoes for select
  using (
    user_id = auth.uid()
    or exists (select 1 from public.profiles p
                where p.id = auth.uid() and p.cargo_principal = 'DEV')
    or exists (select 1 from public.profiles p
               join public.profiles alvo on alvo.id = public.usuarios_sancoes.user_id
                where p.id = auth.uid()
                  and p.sigla_casa = alvo.sigla_casa
                  and p.cargo_principal in ('Presidente', 'Vice-presidente'))
  );

create policy usuarios_sancoes_insert on public.usuarios_sancoes for insert
  with check (
    aplicada_por = auth.uid()
    and exists (select 1 from public.profiles p
                 where p.id = auth.uid()
                   and p.cargo_principal in ('DEV', 'Presidente', 'Vice-presidente'))
  );

create policy usuarios_sancoes_update on public.usuarios_sancoes for update
  using (exists (select 1 from public.profiles p
                  where p.id = auth.uid()
                    and p.cargo_principal in ('DEV', 'Presidente', 'Vice-presidente')));
