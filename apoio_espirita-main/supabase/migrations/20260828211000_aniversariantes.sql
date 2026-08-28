-- Aniversariantes do mês.
--
-- Guardamos DIA e MÊS, nunca o ano. O calendário de aniversários não precisa da
-- idade de ninguém, e o que não é guardado não vaza. Isso também dispensa um
-- botão de "não quero aparecer" que o banco não teria como cumprir: a leitura
-- de `profiles` é por LINHA, então qualquer coluna que exista ali já é legível
-- pelos membros da mesma casa. Aqui o consentimento é o próprio preenchimento —
-- quem não quer aparecer deixa os campos em branco, e a tela diz isso.

alter table public.profiles
  add column if not exists aniversario_dia smallint,
  add column if not exists aniversario_mes smallint;

alter table public.profiles
  drop constraint if exists profiles_aniversario_dia_valido;
alter table public.profiles
  add constraint profiles_aniversario_dia_valido
  check (aniversario_dia is null or (aniversario_dia between 1 and 31));

alter table public.profiles
  drop constraint if exists profiles_aniversario_mes_valido;
alter table public.profiles
  add constraint profiles_aniversario_mes_valido
  check (aniversario_mes is null or (aniversario_mes between 1 and 12));

-- Dia e mês andam juntos: metade da data não monta calendário nenhum.
alter table public.profiles
  drop constraint if exists profiles_aniversario_completo;
alter table public.profiles
  add constraint profiles_aniversario_completo
  check (
    (aniversario_dia is null and aniversario_mes is null)
    or (aniversario_dia is not null and aniversario_mes is not null)
  );

-- 31 de fevereiro não existe. Fevereiro aceita 29 porque o ano não é guardado.
alter table public.profiles
  drop constraint if exists profiles_aniversario_dia_do_mes;
alter table public.profiles
  add constraint profiles_aniversario_dia_do_mes
  check (
    aniversario_mes is null
    or aniversario_dia <= case
         when aniversario_mes in (1, 3, 5, 7, 8, 10, 12) then 31
         when aniversario_mes = 2 then 29
         else 30
       end
  );

create index if not exists profiles_aniversario_idx
  on public.profiles (sigla_casa, aniversario_mes, aniversario_dia)
  where aniversario_mes is not null;

comment on column public.profiles.aniversario_dia is 'Dia do aniversário (1-31). Sem ano, de propósito.';
comment on column public.profiles.aniversario_mes is 'Mês do aniversário (1-12). Preencher é consentir em aparecer no calendário da casa.';
