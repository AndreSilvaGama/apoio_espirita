import { describe, it, expect } from "vitest";
import { MANUAL, GRUPOS_DO_MANUAL, filtrarManual } from "./manual";
import { PAGINAS_DO_SITE } from "@/lib/busca";

/**
 * Manual desatualiza EM SILÊNCIO: ninguém é avisado quando um recurso novo
 * entra e a instrução dele não entra junto. Estes testes são o aviso — o
 * build quebra em vez de o usuário descobrir sozinho que a tela existe e a
 * explicação não.
 */
describe("completude do manual", () => {
  it("cobre toda tela que o site anuncia na busca", () => {
    const cobertas = new Set(
      MANUAL.flatMap((m) => [m.href, ...(m.tambemCobre ?? [])]).filter(Boolean),
    );
    const faltando = PAGINAS_DO_SITE.filter((p) => !cobertas.has(p.href)).map((p) => p.href);
    expect(faltando, `sem passo a passo no manual: ${faltando.join(", ")}`).toEqual([]);
  });

  it("não anuncia um recurso sem dizer como usá-lo", () => {
    for (const m of MANUAL) {
      expect(m.tarefas.length, `"${m.titulo}" não tem nenhuma tarefa`).toBeGreaterThan(0);
      for (const t of m.tarefas) {
        expect(
          t.passos.length,
          `"${m.titulo}" › "${t.titulo}" não tem passo algum`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it("sempre diz onde o recurso fica, para quem não sabe procurar", () => {
    for (const m of MANUAL) {
      expect(m.ondeFica.trim().length, `"${m.titulo}" não diz onde fica`).toBeGreaterThan(0);
      expect(m.resumo.trim().length, `"${m.titulo}" não tem resumo`).toBeGreaterThan(0);
    }
  });
});

describe("boa forma do manual", () => {
  it("não repete identificador", () => {
    const ids = MANUAL.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("usa apenas grupos declarados, para a tela não criar seção órfã", () => {
    for (const m of MANUAL) {
      expect(GRUPOS_DO_MANUAL as readonly string[], `"${m.titulo}"`).toContain(m.grupo);
    }
  });

  it("mantém os passos curtos o bastante para serem lidos no celular", () => {
    // O defeito que originou o manual foi justamente o parágrafo de dois mil
    // caracteres. Um passo que passa de 300 já é duas instruções disfarçadas
    // de uma.
    for (const m of MANUAL) {
      for (const t of m.tarefas) {
        for (const p of t.passos) {
          expect(
            p.length,
            `passo longo demais em "${m.titulo}" › "${t.titulo}": ${p}`,
          ).toBeLessThan(300);
        }
      }
    }
  });

  it("escreve cada passo como instrução, começando com maiúscula e terminando com ponto", () => {
    for (const m of MANUAL) {
      for (const t of m.tarefas) {
        for (const p of t.passos) {
          expect(p[0], `"${m.titulo}": passo começa em minúscula — ${p}`).toBe(p[0].toUpperCase());
          expect(p.trimEnd().endsWith("."), `"${m.titulo}": passo sem ponto final — ${p}`).toBe(
            true,
          );
        }
      }
    }
  });
});

describe("busca dentro do manual", () => {
  it("devolve tudo quando o termo é curto demais para filtrar", () => {
    expect(filtrarManual("").length).toBe(MANUAL.length);
    expect(filtrarManual("a").length).toBe(MANUAL.length);
  });

  it("ignora acento e maiúscula", () => {
    const comAcento = filtrarManual("apresentação");
    const semAcento = filtrarManual("APRESENTACAO");
    expect(comAcento.length).toBeGreaterThan(0);
    expect(semAcento.map((m) => m.id)).toEqual(comAcento.map((m) => m.id));
  });

  it("encontra pelo que a pessoa quer fazer, não só pelo nome do módulo", () => {
    // Quem procura "projetor" não sabe que o módulo se chama "Apresentações".
    expect(filtrarManual("projetor").map((m) => m.id)).toContain("apresentacoes");
    expect(filtrarManual("PIX").map((m) => m.id)).toContain("bazar");
    expect(filtrarManual("senha").map((m) => m.id)).toContain("conta-e-perfil");
  });

  it("devolve lista vazia para o que não existe, em vez de inventar", () => {
    expect(filtrarManual("qwertyuiopasdfgh")).toEqual([]);
  });
});
