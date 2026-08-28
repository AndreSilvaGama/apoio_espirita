import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { CalendarDays, ExternalLink, Plus, Sparkles, Trash2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { mensagemDeErro } from "@/lib/erros";
import { validarLinguagem } from "@/lib/linguagem";
import {
  Abas,
  Aviso,
  BotaoDiscreto,
  BotaoPrimario,
  CampoArea,
  CampoSelecao,
  CampoTexto,
  Cartao,
  EscolhaVisibilidade,
  Etiqueta,
  MarcaAlcance,
  PaginaComunidade,
  Rotulo,
  Vazio,
  dataPorExtenso,
  iniciais,
  quandoFoi,
} from "@/components/Comunidade";

export const Route = createFileRoute("/jovens")({
  component: AreaDeJovens,
});

const CATEGORIAS = [
  { id: "conteudo", rotulo: "Conteúdo", tom: "ciano" as const },
  { id: "evento", rotulo: "Evento", tom: "ambar" as const },
  { id: "convite", rotulo: "Convite", tom: "violeta" as const },
];

interface MembroJovem {
  id: string;
  sigla_casa: string;
  criado_por: string;
  autor_nome: string;
  apresentacao: string | null;
  created_at: string;
}

interface Publicacao {
  id: string;
  sigla_casa: string;
  titulo: string;
  texto: string;
  categoria: string;
  link: string | null;
  data_evento: string | null;
  aberto: boolean;
  criado_por: string;
  autor_nome: string;
  created_at: string;
}

function AreaDeJovens() {
  const { user, profile, isPresident } = useAuth();
  const [aba, setAba] = useState<"mural" | "juventude">("mural");
  const [membros, setMembros] = useState<MembroJovem[]>([]);
  const [publicacoes, setPublicacoes] = useState<Publicacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);

  const [entrando, setEntrando] = useState(false);
  const [apresentacao, setApresentacao] = useState("");

  const [criando, setCriando] = useState(false);
  const [form, setForm] = useState({
    titulo: "",
    texto: "",
    categoria: "conteudo",
    link: "",
    data_evento: "",
    aberto: false,
  });

  const carregar = useCallback(async () => {
    setCarregando(true);
    const [m, p] = await Promise.all([
      supabase
        .from("jovens_membros")
        .select("id, sigla_casa, criado_por, autor_nome, apresentacao, created_at")
        .order("created_at"),
      supabase
        .from("jovens_publicacoes")
        .select(
          "id, sigla_casa, titulo, texto, categoria, link, data_evento, aberto, criado_por, autor_nome, created_at",
        )
        .order("created_at", { ascending: false }),
    ]);
    if (m.error) setErro(mensagemDeErro(m.error));
    setMembros((m.data as MembroJovem[]) ?? []);
    setPublicacoes((p.data as Publicacao[]) ?? []);
    setCarregando(false);
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const souDaJuventude = membros.some((m) => m.criado_por === user?.id);

  async function entrar() {
    setErro(null);
    const problema = validarLinguagem(apresentacao);
    if (problema) {
      setErro(problema);
      return;
    }
    setOcupado("entrar");
    const { error } = await supabase.from("jovens_membros").insert({
      sigla_casa: profile?.sigla_casa ?? "",
      criado_por: user?.id ?? "",
      autor_nome: profile?.nome ?? "",
      apresentacao: apresentacao.trim() || null,
    });
    setOcupado(null);
    if (error) {
      setErro(mensagemDeErro(error));
      return;
    }
    setEntrando(false);
    setApresentacao("");
    await carregar();
  }

  async function sair() {
    const meu = membros.find((m) => m.criado_por === user?.id);
    if (!meu) return;
    setOcupado(meu.id);
    const { error } = await supabase.from("jovens_membros").delete().eq("id", meu.id);
    setOcupado(null);
    if (error) {
      setErro(mensagemDeErro(error));
      return;
    }
    await carregar();
  }

  async function publicar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (form.titulo.trim().length < 3 || form.texto.trim().length < 10) {
      setErro("Escreva um título e um texto um pouco maiores.");
      return;
    }
    const problema = validarLinguagem(form.titulo, form.texto);
    if (problema) {
      setErro(problema);
      return;
    }
    if (form.link && !/^https?:\/\//i.test(form.link.trim())) {
      setErro("O endereço precisa começar com http:// ou https://");
      return;
    }
    setOcupado("publicar");
    const { error } = await supabase.from("jovens_publicacoes").insert({
      sigla_casa: profile?.sigla_casa ?? "",
      titulo: form.titulo.trim(),
      texto: form.texto.trim(),
      categoria: form.categoria,
      link: form.link.trim() || null,
      data_evento: form.data_evento || null,
      aberto: form.aberto,
      criado_por: user?.id ?? "",
      autor_nome: profile?.nome ?? "",
    });
    setOcupado(null);
    if (error) {
      setErro(mensagemDeErro(error));
      return;
    }
    setForm({
      titulo: "",
      texto: "",
      categoria: "conteudo",
      link: "",
      data_evento: "",
      aberto: false,
    });
    setCriando(false);
    await carregar();
  }

  async function apagar(id: string) {
    setOcupado(id);
    const { error } = await supabase.from("jovens_publicacoes").delete().eq("id", id);
    setOcupado(null);
    if (error) {
      setErro(mensagemDeErro(error));
      return;
    }
    await carregar();
  }

  return (
    <PaginaComunidade
      secao="Vida espiritual"
      titulo="Área de Jovens"
      destaque="Espíritas"
      descricao="O espaço da juventude da casa: o que os jovens estudam, criam e organizam. Fazer parte é decisão de cada um — a plataforma não pergunta a idade de ninguém."
    >
      <div className="space-y-6">
        {erro && <Aviso tipo="erro">{erro}</Aviso>}

        {!souDaJuventude ? (
          <Cartao>
            <div className="flex items-start gap-4">
              <Sparkles size={22} strokeWidth={1.5} className="text-cyan-glow mt-1 shrink-0" />
              <div className="flex-1">
                <h2 className="text-lg font-medium text-foreground">Faça parte da juventude</h2>
                <p className="mt-1 text-sm text-muted-foreground font-light">
                  Você pode ler tudo o que está aqui. Para publicar, entre na área — assim a casa
                  sabe com quem contar nas atividades dos jovens.
                </p>
                {entrando ? (
                  <div className="mt-4 space-y-3">
                    <Rotulo ajuda="opcional">Uma linha sobre você</Rotulo>
                    <CampoTexto
                      value={apresentacao}
                      maxLength={300}
                      onChange={(e) => setApresentacao(e.target.value)}
                      placeholder="Ex.: estudo na mocidade às sextas e ajudo na sonoplastia."
                    />
                    <div className="flex gap-2">
                      <BotaoPrimario onClick={entrar} disabled={ocupado === "entrar"}>
                        {ocupado === "entrar" ? "Entrando…" : "Confirmar"}
                      </BotaoPrimario>
                      <BotaoDiscreto onClick={() => setEntrando(false)}>Cancelar</BotaoDiscreto>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4">
                    <BotaoPrimario onClick={() => setEntrando(true)}>
                      Quero fazer parte
                    </BotaoPrimario>
                  </div>
                )}
              </div>
            </div>
          </Cartao>
        ) : (
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm text-muted-foreground font-light">
              Você faz parte da juventude desta casa.
            </p>
            <div className="flex gap-2">
              <BotaoPrimario onClick={() => setCriando((v) => !v)}>
                <span className="inline-flex items-center gap-2">
                  <Plus size={13} strokeWidth={2} /> {criando ? "Fechar" : "Publicar"}
                </span>
              </BotaoPrimario>
              <BotaoDiscreto onClick={sair}>Sair da área</BotaoDiscreto>
            </div>
          </div>
        )}

        {criando && souDaJuventude && (
          <Cartao>
            <form onSubmit={publicar} className="space-y-5">
              <div>
                <Rotulo obrigatorio>Título</Rotulo>
                <CampoTexto
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  maxLength={160}
                  placeholder="Ex.: Encontro de mocidades no próximo sábado"
                />
              </div>
              <div>
                <Rotulo obrigatorio>Texto</Rotulo>
                <CampoArea
                  rows={5}
                  value={form.texto}
                  onChange={(e) => setForm({ ...form, texto: e.target.value })}
                  maxLength={5000}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Rotulo>Tipo</Rotulo>
                  <CampoSelecao
                    value={form.categoria}
                    onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                  >
                    {CATEGORIAS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.rotulo}
                      </option>
                    ))}
                  </CampoSelecao>
                </div>
                <div>
                  <Rotulo ajuda="quando for evento">Data</Rotulo>
                  <CampoTexto
                    type="date"
                    value={form.data_evento}
                    onChange={(e) => setForm({ ...form, data_evento: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Rotulo ajuda="opcional — vídeo, inscrição, material">Endereço na internet</Rotulo>
                <CampoTexto
                  value={form.link}
                  onChange={(e) => setForm({ ...form, link: e.target.value })}
                  placeholder="https://"
                />
              </div>
              <EscolhaVisibilidade
                aberto={form.aberto}
                aoMudar={(v) => setForm({ ...form, aberto: v })}
                substantivo="esta publicação"
              />
              <BotaoPrimario type="submit" disabled={ocupado === "publicar"}>
                {ocupado === "publicar" ? "Publicando…" : "Publicar"}
              </BotaoPrimario>
            </form>
          </Cartao>
        )}

        <Abas
          abas={[
            { id: "mural", rotulo: `Mural (${publicacoes.length})` },
            { id: "juventude", rotulo: `A juventude (${membros.length})` },
          ]}
          atual={aba}
          aoTrocar={setAba}
        />

        {carregando ? (
          <p className="text-center text-muted-foreground/50 py-12 font-light">Carregando…</p>
        ) : aba === "mural" ? (
          publicacoes.length === 0 ? (
            <Vazio texto="A juventude ainda não publicou nada." />
          ) : (
            <div className="space-y-3">
              {publicacoes.map((p) => {
                const cat = CATEGORIAS.find((c) => c.id === p.categoria) ?? CATEGORIAS[0];
                return (
                  <article key={p.id} className="glass rounded-2xl p-5">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <Etiqueta tom={cat.tom}>{cat.rotulo}</Etiqueta>
                      <MarcaAlcance aberto={p.aberto} />
                      {p.data_evento && (
                        <span className="text-xs text-muted-foreground/70 inline-flex items-center gap-1">
                          <CalendarDays size={11} strokeWidth={1.8} />
                          {dataPorExtenso(p.data_evento)}
                        </span>
                      )}
                    </div>
                    <h3 className="text-foreground">{p.titulo}</h3>
                    <p className="mt-2 text-sm text-foreground/90 font-light whitespace-pre-wrap leading-relaxed">
                      {p.texto}
                    </p>
                    {p.link && (
                      <a
                        href={p.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1.5 text-xs text-cyan-glow hover:underline"
                      >
                        <ExternalLink size={12} strokeWidth={1.8} /> Abrir link
                      </a>
                    )}
                    <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground/60">
                        {p.autor_nome} · {quandoFoi(p.created_at)}
                      </p>
                      {(p.criado_por === user?.id || isPresident) && (
                        <button
                          type="button"
                          onClick={() => apagar(p.id)}
                          disabled={ocupado === p.id}
                          className="text-muted-foreground/40 hover:text-red-500 transition-colors"
                          title="Apagar publicação"
                        >
                          <Trash2 size={13} strokeWidth={1.8} />
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )
        ) : membros.length === 0 ? (
          <Vazio texto="Ninguém entrou na área de jovens ainda." />
        ) : (
          <div className="space-y-2">
            {membros.map((m) => (
              <div key={m.id} className="glass rounded-2xl p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-violet-100 border border-violet-200 flex items-center justify-center text-xs font-medium text-violet-600 shrink-0">
                  {iniciais(m.autor_nome)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-foreground">{m.autor_nome}</p>
                  {m.apresentacao && (
                    <p className="text-xs text-muted-foreground font-light mt-0.5">
                      {m.apresentacao}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground/50 font-light flex items-center justify-center gap-2">
          <Users size={13} strokeWidth={1.5} />
          {membros.length} {membros.length === 1 ? "jovem" : "jovens"} na área desta casa.
        </p>
      </div>
    </PaginaComunidade>
  );
}
