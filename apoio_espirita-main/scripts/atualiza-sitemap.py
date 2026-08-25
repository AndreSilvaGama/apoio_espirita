"""
Atualiza o sitemap com as casas que publicaram sua página.

Chamado pelo workflow "Vigia diário" todo dia. Recebe no argumento 1 o caminho
do sitemap e no argumento 2 um JSON com as casas publicadas (como devolvido
pela API do Supabase).

Casa com `nome_completo` em branco fica de fora de propósito: uma página vazia
indexada no Google é pior que página nenhuma.
"""

import datetime
import json
import re
import sys

MARCA_INICIO = "<!-- casas -->"
MARCA_FIM = "<!-- /casas -->"
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


def atualizar(xml, siglas, hoje):
    # Remove o bloco anterior inteiro e recria: assim casa despublicada some.
    xml = re.sub(
        rf"\s*{re.escape(MARCA_INICIO)}.*?{re.escape(MARCA_FIM)}", "", xml, flags=re.S
    )
    if not siglas:
        return xml
    novo = f"  {MARCA_INICIO}{blocos_das_casas(siglas, hoje)}\n  {MARCA_FIM}\n</urlset>"
    return xml.replace("</urlset>", novo)


def main():
    caminho_sitemap, caminho_json = sys.argv[1], sys.argv[2]
    hoje = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d")

    with open(caminho_json, encoding="utf-8") as f:
        dados = json.load(f)

    siglas = sorted(
        c["sigla_casa"] for c in dados if (c.get("nome_completo") or "").strip()
    )

    with open(caminho_sitemap, encoding="utf-8") as f:
        xml = f.read()

    novo = atualizar(xml, siglas, hoje)

    with open(caminho_sitemap, "w", encoding="utf-8", newline="") as f:
        f.write(novo)

    ignoradas = len(dados) - len(siglas)
    print(f"casas publicadas com nome preenchido: {len(siglas)}")
    if ignoradas:
        print(f"ignoradas por estarem sem nome: {ignoradas}")


if __name__ == "__main__":
    main()
