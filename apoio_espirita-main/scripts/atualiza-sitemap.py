"""
Atualiza o sitemap com as casas que publicaram sua página e com os artigos da
comunidade que estão publicados.

Chamado pelo workflow "Vigia diário" todo dia. Recebe no argumento 1 o caminho
do sitemap, no argumento 2 um JSON com as casas publicadas e, opcionalmente,
no argumento 3 um JSON com os artigos (ambos como devolvidos pela API do
Supabase). Sem o argumento 3, o bloco de artigos do sitemap não é tocado.

Casa com `nome_completo` em branco fica de fora de propósito: uma página vazia
indexada no Google é pior que página nenhuma.

Artigo só entra com `estado = 'publicado'` e com `slug` preenchido: um artigo
`retirado` (inclusive por conter informação falsa) ou `em_correcao` nunca pode
ser oferecido a buscadores, e nunca se inventa uma URL a partir de dado
incompleto. Como o bloco inteiro é reconstruído do zero a cada execução
(nunca só acrescentado), um artigo retirado que já estava no sitemap de uma
execução anterior sai na próxima.
"""

import datetime
import json
import re
import sys

MARCA_INICIO_CASAS = "<!-- casas -->"
MARCA_FIM_CASAS = "<!-- /casas -->"
MARCA_INICIO_ARTIGOS = "<!-- artigos -->"
MARCA_FIM_ARTIGOS = "<!-- /artigos -->"
BASE = "https://apoioespirita.com.br"


def blocos_das_casas(siglas, hoje):
    partes = []
    for sigla in siglas:
        partes.append(
            "\n  <url>"
            f"\n    <loc>{BASE}/casa/{sigla}</loc>"
            f"\n    <lastmod>{hoje}</lastmod>"
            "\n    <changefreq>weekly</changefreq>"
            "\n    <priority>0.8</priority>"
            "\n  </url>"
        )
    return "".join(partes)


def entradas_dos_artigos(artigos):
    """
    Recebe a lista de artigos como devolvida pela API (em qualquer estado) e
    devolve só as entradas que podem ir ao sitemap: `estado == 'publicado'`,
    com `slug` preenchido e com alguma data para servir de `lastmod`.

    `lastmod` vem de `editado_em` quando houver; senão, de `publicado_em`.
    Só a data (AAAA-MM-DD) é usada, sem hora.

    Função pura, sem I/O — é o que permite testar a regra sem banco.
    """
    entradas = []
    for artigo in artigos:
        if artigo.get("estado") != "publicado":
            continue
        slug = (artigo.get("slug") or "").strip()
        if not slug:
            continue
        data_hora = artigo.get("editado_em") or artigo.get("publicado_em")
        if not data_hora:
            continue
        entradas.append({"slug": slug, "lastmod": data_hora[:10]})
    entradas.sort(key=lambda e: e["slug"])
    return entradas


def blocos_dos_artigos(entradas):
    partes = []
    for entrada in entradas:
        partes.append(
            "\n  <url>"
            f"\n    <loc>{BASE}/artigos/{entrada['slug']}</loc>"
            f"\n    <lastmod>{entrada['lastmod']}</lastmod>"
            "\n    <changefreq>monthly</changefreq>"
            "\n    <priority>0.6</priority>"
            "\n  </url>"
        )
    return "".join(partes)


def _substitui_bloco(xml, marca_inicio, marca_fim, novo_conteudo):
    # Remove o bloco anterior inteiro e recria: assim casa/artigo despublicado
    # some, em vez de ficar acumulando entrada velha.
    xml = re.sub(
        rf"\s*{re.escape(marca_inicio)}.*?{re.escape(marca_fim)}", "", xml, flags=re.S
    )
    if not novo_conteudo:
        return xml
    novo = f"  {marca_inicio}{novo_conteudo}\n  {marca_fim}\n</urlset>"
    return xml.replace("</urlset>", novo)


def atualizar(xml, siglas, hoje, entradas_artigos=None):
    xml = _substitui_bloco(
        xml, MARCA_INICIO_CASAS, MARCA_FIM_CASAS, blocos_das_casas(siglas, hoje)
    )
    # entradas_artigos=None significa "sem dado de artigos nesta chamada":
    # deixa o bloco como estiver, em vez de apagar um bloco válido de uma
    # execução anterior. Uma lista vazia, ao contrário, é dado real (nenhum
    # artigo publicado agora) e por isso remove o bloco.
    if entradas_artigos is not None:
        xml = _substitui_bloco(
            xml, MARCA_INICIO_ARTIGOS, MARCA_FIM_ARTIGOS, blocos_dos_artigos(entradas_artigos)
        )
    return xml


def main():
    caminho_sitemap, caminho_json = sys.argv[1], sys.argv[2]
    caminho_json_artigos = sys.argv[3] if len(sys.argv) > 3 else None
    hoje = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d")

    # Lê e valida TODO o dado de entrada antes de escrever qualquer coisa no
    # sitemap: se a consulta ao banco falhou e devolveu algo que não é o JSON
    # esperado, json.load (ou o acesso aos campos abaixo) estoura aqui, o
    # script sai com erro, e o sitemap antigo continua no lugar, intacto.
    with open(caminho_json, encoding="utf-8") as f:
        dados = json.load(f)

    siglas = sorted(
        c["sigla_casa"] for c in dados if (c.get("nome_completo") or "").strip()
    )

    dados_artigos = None
    entradas_artigos = None
    if caminho_json_artigos:
        with open(caminho_json_artigos, encoding="utf-8") as f:
            dados_artigos = json.load(f)
        entradas_artigos = entradas_dos_artigos(dados_artigos)

    with open(caminho_sitemap, encoding="utf-8") as f:
        xml = f.read()

    novo = atualizar(xml, siglas, hoje, entradas_artigos)

    with open(caminho_sitemap, "w", encoding="utf-8", newline="") as f:
        f.write(novo)

    ignoradas = len(dados) - len(siglas)
    print(f"casas publicadas com nome preenchido: {len(siglas)}")
    if ignoradas:
        print(f"ignoradas por estarem sem nome: {ignoradas}")

    if entradas_artigos is not None:
        ignorados_artigos = len(dados_artigos) - len(entradas_artigos)
        print(f"artigos publicados: {len(entradas_artigos)}")
        if ignorados_artigos:
            print(
                f"artigos ignorados (não publicados, sem slug ou sem data): {ignorados_artigos}"
            )


if __name__ == "__main__":
    main()
