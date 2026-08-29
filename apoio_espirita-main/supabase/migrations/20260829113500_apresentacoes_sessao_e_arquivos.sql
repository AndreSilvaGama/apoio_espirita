-- Abre uma sessão ao vivo e devolve o código que a plateia vai digitar.
--
-- O alfabeto não tem I, O, 0 nem 1: o código é lido em voz alta num salão e
-- digitado por gente que não enxerga bem o telão. Letra ambígua vira erro de
-- digitação, e erro de digitação vira "não consigo entrar".
--
-- Abrir uma sessão nova encerra a anterior da mesma apresentação. Duas sessões
-- vivas do mesmo material só serviriam para dividir a plateia em dois grupos
-- vendo slides diferentes.
create or replace function public.abrir_sessao_apresentacao(p_apresentacao uuid)
returns table (id uuid, codigo text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_alfabeto constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_codigo text;
  v_id uuid;
  v_tentativa int := 0;
begin
  if not exists (
    select 1 from public.apresentacoes a
    join public.profiles p on p.id = auth.uid()
    where a.id = p_apresentacao and a.sigla_casa = p.sigla_casa
  ) then
    raise exception 'Esta apresentação não é da sua casa espírita.';
  end if;

  update public.apresentacao_sessoes
     set ativa = false, encerrada_em = now()
   where apresentacao_id = p_apresentacao and ativa;

  loop
    v_tentativa := v_tentativa + 1;
    if v_tentativa > 40 then
      raise exception 'Não foi possível gerar um código livre. Tente de novo.';
    end if;
    v_codigo := '';
    for _ in 1..6 loop
      v_codigo := v_codigo || substr(v_alfabeto, 1 + floor(random() * length(v_alfabeto))::int, 1);
    end loop;
    exit when not exists (select 1 from public.apresentacao_sessoes s where s.codigo = v_codigo);
  end loop;

  insert into public.apresentacao_sessoes (apresentacao_id, codigo, iniciada_por)
  values (p_apresentacao, v_codigo, auth.uid())
  returning apresentacao_sessoes.id into v_id;

  return query select v_id, v_codigo;
end;
$$;

revoke execute on function public.abrir_sessao_apresentacao(uuid) from anon, public;

/* ── Onde os arquivos ficam ────────────────────────────────────────────── */

-- Dois depósitos, e a separação tem consequência prática. As IMAGENS dos
-- slides são públicas: é o que a plateia anônima precisa ver, e o caminho é um
-- identificador aleatório que ninguém adivinha. Já o ARQUIVO ORIGINAL é
-- privado, porque o botão de baixar a apresentação é uma escolha do
-- palestrante — e escolha que só esconde o botão não é trava nenhuma.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('apresentacoes', 'apresentacoes', true, 3145728,
        array['image/webp','image/jpeg','image/png'])
on conflict (id) do update
  set public = true, file_size_limit = 3145728,
      allowed_mime_types = array['image/webp','image/jpeg','image/png'];

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('apresentacoes-originais', 'apresentacoes-originais', false, 41943040,
        array['application/pdf'])
on conflict (id) do update
  set public = false, file_size_limit = 41943040,
      allowed_mime_types = array['application/pdf'];

drop policy if exists "slides_leitura" on storage.objects;
create policy "slides_leitura" on storage.objects
  for select to anon, authenticated using (bucket_id = 'apresentacoes');

drop policy if exists "slides_envio" on storage.objects;
create policy "slides_envio" on storage.objects
  for insert to authenticated with check (bucket_id = 'apresentacoes');

drop policy if exists "slides_apaga" on storage.objects;
create policy "slides_apaga" on storage.objects
  for delete to authenticated
  using (bucket_id = 'apresentacoes' and owner = auth.uid());

drop policy if exists "original_envio" on storage.objects;
create policy "original_envio" on storage.objects
  for insert to authenticated with check (bucket_id = 'apresentacoes-originais');

drop policy if exists "original_apaga" on storage.objects;
create policy "original_apaga" on storage.objects
  for delete to authenticated
  using (bucket_id = 'apresentacoes-originais' and owner = auth.uid());

-- A trava real do download: o arquivo original só é legível se o palestrante
-- tiver liberado, ou para quem é da casa. Sem esta política, esconder o botão
-- seria teatro — bastaria conhecer o endereço.
drop policy if exists "original_leitura" on storage.objects;
create policy "original_leitura" on storage.objects
  for select to anon, authenticated
  using (
    bucket_id = 'apresentacoes-originais'
    and exists (
      select 1 from public.apresentacoes a
      where a.id::text = (storage.foldername(name))[1]
        and (
          a.permite_download
          or a.sigla_casa = (select p.sigla_casa from public.profiles p where p.id = auth.uid())
        )
    )
  );
