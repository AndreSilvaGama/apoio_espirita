"""
Testes de `atualiza-sitemap.py`, sem banco de dados.

Não há convenção de teste em Python neste repositório (o único teste
automatizado do projeto é em TypeScript, com Vitest). Por isso usa-se
`unittest` da biblioteca padrão, que não exige dependência nova.

Roda com: python -m unittest scripts/test_atualiza_sitemap.py -v
       ou: python scripts/test_atualiza_sitemap.py
"""

import importlib.util
import pathlib
import unittest

# O nome do arquivo tem hífen, então não dá para usar "import atualiza-sitemap"
# — carrega o módulo pelo caminho.
_CAMINHO = pathlib.Path(__file__).resolve().parent / "atualiza-sitemap.py"
_SPEC = importlib.util.spec_from_file_location("atualiza_sitemap", _CAMINHO)
atualiza_sitemap = importlib.util.module_from_spec(_SPEC)
_SPEC.loader.exec_module(atualiza_sitemap)

entradas_dos_artigos = atualiza_sitemap.entradas_dos_artigos
blocos_dos_artigos = atualiza_sitemap.blocos_dos_artigos
atualizar = atualiza_sitemap.atualizar

XML_BASE = (
    '<?xml version="1.0" encoding="UTF-8"?>\n'
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    "  <url>\n"
    "    <loc>https://apoioespirita.com.br/</loc>\n"
    "    <lastmod>2026-07-06</lastmod>\n"
    "    <changefreq>weekly</changefreq>\n"
    "    <priority>1.0</priority>\n"
    "  </url>\n"
    "</urlset>\n"
)


class EntradasDosArtigosTest(unittest.TestCase):
    def test_artigo_publicado_entra(self):
        artigos = [
            {
                "slug": "a-caridade",
                "estado": "publicado",
                "editado_em": None,
                "publicado_em": "2026-08-20T10:00:00+00:00",
            }
        ]
        self.assertEqual(
            entradas_dos_artigos(artigos),
            [{"slug": "a-caridade", "lastmod": "2026-08-20"}],
        )

    def test_artigo_retirado_nao_entra(self):
        artigos = [
            {
                "slug": "artigo-falso",
                "estado": "retirado",
                "editado_em": None,
                "publicado_em": "2026-08-20T10:00:00+00:00",
            }
        ]
        self.assertEqual(entradas_dos_artigos(artigos), [])

    def test_artigo_em_correcao_nao_entra(self):
        artigos = [
            {
                "slug": "em-revisao",
                "estado": "em_correcao",
                "editado_em": None,
                "publicado_em": "2026-08-20T10:00:00+00:00",
            }
        ]
        self.assertEqual(entradas_dos_artigos(artigos), [])

    def test_lista_vazia(self):
        self.assertEqual(entradas_dos_artigos([]), [])

    def test_usa_editado_em_quando_presente(self):
        artigos = [
            {
                "slug": "atualizado",
                "estado": "publicado",
                "editado_em": "2026-08-25T18:45:00+00:00",
                "publicado_em": "2026-08-01T09:00:00+00:00",
            }
        ]
        self.assertEqual(
            entradas_dos_artigos(artigos),
            [{"slug": "atualizado", "lastmod": "2026-08-25"}],
        )

    def test_usa_publicado_em_quando_sem_editado_em(self):
        artigos = [
            {
                "slug": "nunca-editado",
                "estado": "publicado",
                "editado_em": None,
                "publicado_em": "2026-08-01T09:00:00+00:00",
            }
        ]
        self.assertEqual(
            entradas_dos_artigos(artigos),
            [{"slug": "nunca-editado", "lastmod": "2026-08-01"}],
        )

    def test_ignora_artigo_publicado_sem_slug(self):
        artigos = [
            {
                "slug": "",
                "estado": "publicado",
                "editado_em": None,
                "publicado_em": "2026-08-01T09:00:00+00:00",
            }
        ]
        self.assertEqual(entradas_dos_artigos(artigos), [])

    def test_artigo_sem_campo_estado_e_ignorado(self):
        # Este caso existe porque o workflow ja esqueceu de pedir a coluna
        # `estado` ao Supabase (o curl so buscava slug/publicado_em/editado_em).
        # Sem `estado` no registro, artigo.get("estado") devolve None, que e
        # diferente de "publicado" -- o artigo tem que ser descartado, nunca
        # tratado como se fosse publicado por omissao do campo. Reproduz
        # exatamente o formato que a API devolve quando a coluna nao e pedida
        # no `select`.
        artigos = [
            {
                "slug": "sem-estado-no-select",
                "editado_em": None,
                "publicado_em": "2026-08-01T09:00:00+00:00",
            }
        ]
        self.assertEqual(entradas_dos_artigos(artigos), [])

    def test_ordena_por_slug(self):
        artigos = [
            {
                "slug": "zebra",
                "estado": "publicado",
                "editado_em": None,
                "publicado_em": "2026-08-01T09:00:00+00:00",
            },
            {
                "slug": "abelha",
                "estado": "publicado",
                "editado_em": None,
                "publicado_em": "2026-08-01T09:00:00+00:00",
            },
        ]
        self.assertEqual(
            [e["slug"] for e in entradas_dos_artigos(artigos)], ["abelha", "zebra"]
        )


class BlocosDosArtigosTest(unittest.TestCase):
    def test_formato_da_entrada(self):
        bloco = blocos_dos_artigos([{"slug": "a-caridade", "lastmod": "2026-08-20"}])
        self.assertIn(
            "<loc>https://apoioespirita.com.br/artigos/a-caridade</loc>", bloco
        )
        self.assertIn("<lastmod>2026-08-20</lastmod>", bloco)

    def test_lista_vazia_devolve_vazio(self):
        self.assertEqual(blocos_dos_artigos([]), "")


class AtualizarTest(unittest.TestCase):
    def test_insere_bloco_de_artigos(self):
        novo = atualizar(
            XML_BASE,
            siglas=[],
            hoje="2026-08-27",
            entradas_artigos=[{"slug": "a-caridade", "lastmod": "2026-08-20"}],
        )
        self.assertIn("<!-- artigos -->", novo)
        self.assertIn(
            "<loc>https://apoioespirita.com.br/artigos/a-caridade</loc>", novo
        )
        self.assertTrue(novo.rstrip().endswith("</urlset>"))

    def test_sem_entradas_artigos_nao_mexe_no_bloco_existente(self):
        # entradas_artigos=None simula a chamada sem o argumento 3 (workflow
        # que ainda não manda dado de artigos): o bloco anterior sobrevive.
        com_bloco = atualizar(
            XML_BASE,
            siglas=[],
            hoje="2026-08-27",
            entradas_artigos=[{"slug": "a-caridade", "lastmod": "2026-08-20"}],
        )
        resultado = atualizar(com_bloco, siglas=[], hoje="2026-08-27", entradas_artigos=None)
        self.assertIn(
            "<loc>https://apoioespirita.com.br/artigos/a-caridade</loc>", resultado
        )

    def test_lista_vazia_de_artigos_remove_bloco_existente(self):
        com_bloco = atualizar(
            XML_BASE,
            siglas=[],
            hoje="2026-08-27",
            entradas_artigos=[{"slug": "a-caridade", "lastmod": "2026-08-20"}],
        )
        resultado = atualizar(com_bloco, siglas=[], hoje="2026-08-27", entradas_artigos=[])
        self.assertNotIn("<!-- artigos -->", resultado)
        self.assertNotIn("a-caridade", resultado)

    def test_artigo_retirado_depois_de_publicado_sai_do_sitemap(self):
        # Simula duas execuções do vigia: na primeira o artigo está
        # publicado e entra; na segunda ele foi retirado (ex.: por conter
        # informação falsa) e não pode sobrar no sitemap da execução anterior.
        artigo_publicado = [
            {
                "slug": "informacao-falsa",
                "estado": "publicado",
                "editado_em": None,
                "publicado_em": "2026-08-20T10:00:00+00:00",
            }
        ]
        artigo_retirado = [
            {
                "slug": "informacao-falsa",
                "estado": "retirado",
                "editado_em": None,
                "publicado_em": "2026-08-20T10:00:00+00:00",
            }
        ]

        primeira_execucao = atualizar(
            XML_BASE,
            siglas=[],
            hoje="2026-08-20",
            entradas_artigos=entradas_dos_artigos(artigo_publicado),
        )
        self.assertIn("informacao-falsa", primeira_execucao)

        segunda_execucao = atualizar(
            primeira_execucao,
            siglas=[],
            hoje="2026-08-27",
            entradas_artigos=entradas_dos_artigos(artigo_retirado),
        )
        self.assertNotIn("informacao-falsa", segunda_execucao)

    def test_casas_e_artigos_coexistem(self):
        resultado = atualizar(
            XML_BASE,
            siglas=["GECAL"],
            hoje="2026-08-27",
            entradas_artigos=[{"slug": "a-caridade", "lastmod": "2026-08-20"}],
        )
        self.assertIn("<loc>https://apoioespirita.com.br/casa/GECAL</loc>", resultado)
        self.assertIn(
            "<loc>https://apoioespirita.com.br/artigos/a-caridade</loc>", resultado
        )
        self.assertTrue(resultado.rstrip().endswith("</urlset>"))


if __name__ == "__main__":
    unittest.main()
