-- Contatos institucionais das casas espíritas.
--
-- O cadastro público trazia e-mail, site e redes sociais de boa parte das
-- casas, e a tabela não tinha onde guardar isso. As colunas abaixo são apenas
-- somadas: nenhum dado existente é alterado ou removido.
--
-- Guardar não é publicar. Nenhuma tela exibe estes campos: mostrar e-mail de
-- casa em página aberta ao público expõe o endereço a coleta automática de
-- spam, e essa decisão é do dono do produto, não minha.

alter table public.casas_espirita
  add column if not exists email     text,
  add column if not exists site      text,
  add column if not exists instagram text,
  add column if not exists facebook  text;

comment on column public.casas_espirita.email is
  'E-mail institucional da casa. Guardado, mas ainda não exibido em nenhuma tela.';
