import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Check, Copy, ImagePlus, Package, Plus, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { mensagemDeErro } from "@/lib/erros";
import { validarLinguagem } from "@/lib/linguagem";
import { gerarCodigoPix } from "@/lib/pix";
import {
  Abas,
  Aviso,
  BotaoDiscreto,
  BotaoPrimario,
  CampoArea,
  CampoSelecao,
  CampoTexto,
  Cartao,
  Etiqueta,
  MarcaAlcance,
  PaginaComunidade,
  Rotulo,
  Vazio,
  quandoFoi,
} from "@/components/Comunidade";

export const Route = createFileRoute("/bazar")({
  component: Bazar,
});

const CATEGORIAS = [
  { id: "livro", rotulo: "Livro" },
  { id: "artesanato", rotulo: "Artesanato" },
  { id: "roupa", rotulo: "Roupa" },
  { id: "alimento", rotulo: "Alimento" },
  { id: "decoracao", rotulo: "Decoração" },
  { id: "outro", rotulo: "Outro" },
];

interface Item {
  id: string;
  sigla_casa: string;
  titulo: string;
  descricao: string;
  categoria: string;
  estado: string;
  valor: number | null;
  doacao: boolean;
  foto_url: string | null;
  chave_pix: string | null;
  pix_nome: string | null;
  pix_cidade: string | null;
  disponivel: boolean;
  aberto: boolean;
  criado_por: string;
  autor_nome: string;
  created_at: string;
}

interface Reserva {
  id: string;
  item_id: string;
  mensagem: string | null;
  contato: string;
  status: string;
  criado_por: string;
  autor_nome: string;
  created_at: string;
}

function moeda(valor: number | null): string {
  if (valor == null) return "";
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/**
 * Cartão de um item do bazar.
 *
 * Mora no módulo, e não dentro de `Bazar`, de propósito: um componente
 * declarado dentro de outro é recriado a cada render, o que faria o React
 * remontar o cartão inteiro a cada tecla digitada no campo de contato da
 * reserva — e o cursor sairia do campo.
 */
interface CartaoItemProps {
  item: Item;
  dono: boolean;
  reservas: Reserva[];
  contatos: Record<string, string>;
  usuarioId: string | undefined;
  ehDirecao: boolean;
  ocupado: string | null;
  copiado: string | null;
  reservando: string | null;
  formReserva: { mensagem: string; contato: string };
  aoMudarReserva: (v: { mensagem: string; contato: string }) => void;
  aoAbrirReserva: (id: string | null) => void;
  aoReservar: (id: string) => void;
  aoResponderReserva: (id: string, status: "aceita" | "recusada" | "concluida") => void;
  aoAlternarDisponivel: (item: Item) => void;
  aoApagar: (id: string) => void;
  aoCopiarPix: (item: Item) => void;
}

function CartaoItem({
  item,
  dono,
  reservas,
  contatos,
  usuarioId,
  ehDirecao,
  ocupado,
  copiado,
  reservando,
  formReserva,
  aoMudarReserva,
  aoAbrirReserva,
  aoReservar,
  aoResponderReserva,
  aoAlternarDisponivel,
  aoApagar,
  aoCopiarPix,
}: CartaoItemProps) {
  const minha = reservas.find((r) => r.item_id === item.id && r.criado_por === usuarioId);
  const doItem = reservas.filter((r) => r.item_id === item.id);
  const codigoPix = gerarCodigoPix({
    chave: item.chave_pix ?? "",
    nome: item.pix_nome ?? "",
    cidade: item.pix_cidade ?? "",
    valor: item.valor,
  });
  const contatoLiberado = contatos[item.id];

  return (
    <article className={`glass rounded-2xl overflow-hidden ${item.disponivel ? "" : "opacity-60"}`}>
      {item.foto_url && (
        <img
          src={item.foto_url}
          alt={item.titulo}
          loading="lazy"
          className="w-full h-44 object-cover"
        />
      )}
      <div className="p-5">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <Etiqueta tom="ciano">
            {CATEGORIAS.find((c) => c.id === item.categoria)?.rotulo ?? "Outro"}
          </Etiqueta>
          <Etiqueta>{item.estado === "novo" ? "Novo" : "Usado"}</Etiqueta>
          <MarcaAlcance aberto={item.aberto} />
          {!item.disponivel && <Etiqueta tom="neutro">Indisponível</Etiqueta>}
        </div>

        <h3 className="text-foreground">{item.titulo}</h3>
        <p className="mt-1 text-sm text-muted-foreground font-light whitespace-pre-wrap">
          {item.descricao}
        </p>

        <p className="mt-3 text-lg font-light text-foreground">
          {item.doacao ? (
            <span className="text-emerald-600">Contribuição livre</span>
          ) : item.valor != null ? (
            moeda(item.valor)
          ) : (
            <span className="text-muted-foreground/60 text-sm">A combinar</span>
          )}
        </p>

        {codigoPix && (
          <div className="mt-3 rounded-xl border border-border/60 p-3">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground/60 mb-2">
              Pagamento por PIX
            </p>
            <p className="text-xs text-muted-foreground font-light break-all line-clamp-2">
              {codigoPix}
            </p>
            <button
              type="button"
              onClick={() => aoCopiarPix(item)}
              className="mt-2 inline-flex items-center gap-1.5 text-xs text-cyan-glow hover:underline"
            >
              {copiado === item.id ? (
                <>
                  <Check size={12} strokeWidth={2} /> Código copiado
                </>
              ) : (
                <>
                  <Copy size={12} strokeWidth={2} /> Copiar código PIX
                </>
              )}
            </button>
            <p className="mt-2 text-[11px] text-muted-foreground/60 font-light">
              O pagamento vai direto para a chave de quem anunciou. A plataforma não recebe nem
              retém valor nenhum.
            </p>
          </div>
        )}

        {contatoLiberado && (
          <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
            <p className="text-[11px] uppercase tracking-widest text-emerald-700">Contato</p>
            <p className="text-sm text-emerald-800">{contatoLiberado}</p>
          </div>
        )}

        {/* Reservas recebidas */}
        {dono && doItem.length > 0 && (
          <div className="mt-4 pt-3 border-t border-border/40 space-y-2">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground/60">
              Interessados
            </p>
            {doItem.map((r) => (
              <div key={r.id} className="text-sm">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="text-foreground">
                    {r.autor_nome}
                    {r.status !== "pendente" && (
                      <span className="ml-2">
                        <Etiqueta
                          tom={
                            r.status === "aceita"
                              ? "verde"
                              : r.status === "concluida"
                                ? "ciano"
                                : "neutro"
                          }
                        >
                          {r.status === "aceita"
                            ? "Aceito"
                            : r.status === "concluida"
                              ? "Entregue"
                              : "Recusado"}
                        </Etiqueta>
                      </span>
                    )}
                  </p>
                  <div className="flex gap-2">
                    {r.status === "pendente" && (
                      <>
                        <BotaoDiscreto
                          onClick={() => aoResponderReserva(r.id, "aceita")}
                          disabled={ocupado === r.id}
                        >
                          <Check size={13} strokeWidth={2} />
                        </BotaoDiscreto>
                        <BotaoDiscreto
                          onClick={() => aoResponderReserva(r.id, "recusada")}
                          disabled={ocupado === r.id}
                        >
                          <X size={13} strokeWidth={2} />
                        </BotaoDiscreto>
                      </>
                    )}
                    {r.status === "aceita" && (
                      <BotaoDiscreto
                        onClick={() => aoResponderReserva(r.id, "concluida")}
                        disabled={ocupado === r.id}
                      >
                        Concluir
                      </BotaoDiscreto>
                    )}
                  </div>
                </div>
                {r.mensagem && (
                  <p className="text-xs text-muted-foreground font-light">{r.mensagem}</p>
                )}
                {r.status !== "recusada" && (
                  <p className="text-xs text-cyan-700">Contato: {r.contato}</p>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between gap-2 flex-wrap">
          <p className="text-xs text-muted-foreground/60">
            {item.autor_nome} · {item.sigla_casa} · {quandoFoi(item.created_at)}
          </p>
          <div className="flex gap-2">
            {dono ? (
              <>
                <BotaoDiscreto
                  onClick={() => aoAlternarDisponivel(item)}
                  disabled={ocupado === item.id}
                >
                  {item.disponivel ? "Marcar indisponível" : "Disponibilizar"}
                </BotaoDiscreto>
                <BotaoDiscreto onClick={() => aoApagar(item.id)} disabled={ocupado === item.id}>
                  <Trash2 size={13} strokeWidth={1.8} />
                </BotaoDiscreto>
              </>
            ) : minha ? (
              <Etiqueta
                tom={minha.status === "aceita" || minha.status === "concluida" ? "verde" : "neutro"}
              >
                {minha.status === "pendente"
                  ? "Reserva enviada"
                  : minha.status === "aceita"
                    ? "Reserva aceita"
                    : minha.status === "concluida"
                      ? "Concluída"
                      : "Não foi desta vez"}
              </Etiqueta>
            ) : (
              item.disponivel && (
                <BotaoPrimario onClick={() => aoAbrirReserva(item.id)}>
                  Tenho interesse
                </BotaoPrimario>
              )
            )}
            {ehDirecao && !dono && (
              <BotaoDiscreto onClick={() => aoApagar(item.id)} disabled={ocupado === item.id}>
                <Trash2 size={13} strokeWidth={1.8} />
              </BotaoDiscreto>
            )}
          </div>
        </div>

        {reservando === item.id && (
          <div className="mt-4 pt-4 border-t border-border/40 space-y-3">
            <Rotulo obrigatorio ajuda="telefone ou e-mail — visível só para quem anunciou">
              Seu contato
            </Rotulo>
            <CampoTexto
              value={formReserva.contato}
              onChange={(e) => aoMudarReserva({ ...formReserva, contato: e.target.value })}
              maxLength={120}
              placeholder="(21) 90000-0000"
            />
            <Rotulo ajuda="opcional">Mensagem</Rotulo>
            <CampoArea
              rows={2}
              value={formReserva.mensagem}
              onChange={(e) => aoMudarReserva({ ...formReserva, mensagem: e.target.value })}
              maxLength={600}
              placeholder="Ex.: posso buscar no sábado depois da palestra."
            />
            <div className="flex gap-2">
              <BotaoPrimario onClick={() => aoReservar(item.id)} disabled={ocupado === item.id}>
                {ocupado === item.id ? "Enviando…" : "Enviar interesse"}
              </BotaoPrimario>
              <BotaoDiscreto onClick={() => aoAbrirReserva(null)}>Cancelar</BotaoDiscreto>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

function Bazar() {
  const { user, profile, isPresident } = useAuth();
  const [aba, setAba] = useState<"vitrine" | "meus" | "reservas">("vitrine");
  const [itens, setItens] = useState<Item[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [contatos, setContatos] = useState<Record<string, string>>({});
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);

  const [criando, setCriando] = useState(false);
  const [form, setForm] = useState({
    titulo: "",
    descricao: "",
    categoria: "livro",
    estado: "usado",
    valor: "",
    doacao: false,
    chave_pix: "",
    pix_nome: "",
    pix_cidade: "",
    contato: "",
    aberto: false,
  });
  const [foto, setFoto] = useState<File | null>(null);

  const [reservando, setReservando] = useState<string | null>(null);
  const [formReserva, setFormReserva] = useState({ mensagem: "", contato: "" });

  const carregar = useCallback(async () => {
    setCarregando(true);
    const [i, r, c] = await Promise.all([
      supabase
        .from("bazar_itens")
        .select(
          "id, sigla_casa, titulo, descricao, categoria, estado, valor, doacao, foto_url, chave_pix, pix_nome, pix_cidade, disponivel, aberto, criado_por, autor_nome, created_at",
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("bazar_reservas")
        .select("id, item_id, mensagem, contato, status, criado_por, autor_nome, created_at"),
      supabase.from("bazar_contatos").select("item_id, contato"),
    ]);
    if (i.error) setErro(mensagemDeErro(i.error));
    setItens((i.data as Item[]) ?? []);
    setReservas((r.data as Reserva[]) ?? []);
    setContatos(Object.fromEntries((c.data ?? []).map((x) => [x.item_id, x.contato])));
    setCarregando(false);
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function publicar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (form.titulo.trim().length < 3 || form.descricao.trim().length < 5) {
      setErro("Preencha o nome e a descrição do item.");
      return;
    }
    if (form.contato.trim().length < 5) {
      setErro("Informe um contato — ele só será mostrado a quem você aceitar.");
      return;
    }
    const problema = validarLinguagem(form.titulo, form.descricao);
    if (problema) {
      setErro(problema);
      return;
    }
    setOcupado("publicar");

    let fotoUrl: string | null = null;
    if (foto) {
      const caminho = `${user?.id}/${Date.now()}-${foto.name.replace(/[^\w.-]/g, "_")}`;
      const { error: falhaUpload } = await supabase.storage.from("bazar").upload(caminho, foto, {
        upsert: false,
        contentType: foto.type,
      });
      if (falhaUpload) {
        setOcupado(null);
        setErro(`Não foi possível enviar a foto. ${mensagemDeErro(falhaUpload)}`);
        return;
      }
      fotoUrl = supabase.storage.from("bazar").getPublicUrl(caminho).data.publicUrl;
    }

    const { data, error } = await supabase
      .from("bazar_itens")
      .insert({
        sigla_casa: profile?.sigla_casa ?? "",
        titulo: form.titulo.trim(),
        descricao: form.descricao.trim(),
        categoria: form.categoria,
        estado: form.estado,
        valor: form.doacao || !form.valor ? null : Number(form.valor.replace(",", ".")),
        doacao: form.doacao,
        foto_url: fotoUrl,
        chave_pix: form.chave_pix.trim() || null,
        pix_nome: form.pix_nome.trim() || null,
        pix_cidade: form.pix_cidade.trim() || null,
        aberto: form.aberto,
        criado_por: user?.id ?? "",
        autor_nome: profile?.nome ?? "",
      })
      .select("id")
      .single();

    if (error || !data) {
      setOcupado(null);
      setErro(mensagemDeErro(error));
      return;
    }

    // O contato vai para a tabela irmã: quem vê o anúncio não vê o telefone.
    const { error: falhaContato } = await supabase
      .from("bazar_contatos")
      .insert({ item_id: data.id, contato: form.contato.trim() });
    setOcupado(null);
    if (falhaContato) {
      setErro(mensagemDeErro(falhaContato));
      return;
    }

    setForm({
      titulo: "",
      descricao: "",
      categoria: "livro",
      estado: "usado",
      valor: "",
      doacao: false,
      chave_pix: form.chave_pix,
      pix_nome: form.pix_nome,
      pix_cidade: form.pix_cidade,
      contato: form.contato,
      aberto: false,
    });
    setFoto(null);
    setCriando(false);
    await carregar();
  }

  async function reservar(itemId: string) {
    setErro(null);
    if (formReserva.contato.trim().length < 5) {
      setErro("Informe um contato para quem anunciou falar com você.");
      return;
    }
    setOcupado(itemId);
    const { error } = await supabase.from("bazar_reservas").insert({
      item_id: itemId,
      sigla_casa: profile?.sigla_casa ?? "",
      mensagem: formReserva.mensagem.trim() || null,
      contato: formReserva.contato.trim(),
      criado_por: user?.id ?? "",
      autor_nome: profile?.nome ?? "",
    });
    setOcupado(null);
    if (error) {
      setErro(mensagemDeErro(error));
      return;
    }
    setReservando(null);
    setFormReserva({ mensagem: "", contato: formReserva.contato });
    await carregar();
  }

  async function responderReserva(id: string, status: "aceita" | "recusada" | "concluida") {
    setOcupado(id);
    const { error } = await supabase.from("bazar_reservas").update({ status }).eq("id", id);
    setOcupado(null);
    if (error) {
      setErro(mensagemDeErro(error));
      return;
    }
    await carregar();
  }

  async function alternarDisponivel(item: Item) {
    setOcupado(item.id);
    const { error } = await supabase
      .from("bazar_itens")
      .update({ disponivel: !item.disponivel })
      .eq("id", item.id);
    setOcupado(null);
    if (error) {
      setErro(mensagemDeErro(error));
      return;
    }
    await carregar();
  }

  async function apagar(id: string) {
    setOcupado(id);
    const { error } = await supabase.from("bazar_itens").delete().eq("id", id);
    setOcupado(null);
    if (error) {
      setErro(mensagemDeErro(error));
      return;
    }
    await carregar();
  }

  async function copiarPix(item: Item) {
    const codigo = gerarCodigoPix({
      chave: item.chave_pix ?? "",
      nome: item.pix_nome ?? "",
      cidade: item.pix_cidade ?? "",
      valor: item.valor,
    });
    if (!codigo) return;
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiado(item.id);
      window.setTimeout(() => setCopiado(null), 2500);
    } catch {
      setErro("O navegador não permitiu copiar. Selecione o código e copie à mão.");
    }
  }

  const meusItens = itens.filter((i) => i.criado_por === user?.id);
  const minhasReservas = reservas.filter((r) => r.criado_por === user?.id);
  const vitrine = itens.filter((i) => i.disponivel);

  return (
    <PaginaComunidade
      secao="Nossa comunidade"
      titulo="Bazar"
      destaque="On-line"
      descricao="Livros, artesanatos e itens da comunidade. O pagamento por PIX vai direto para a chave de quem anuncia — a plataforma não recebe, não retém e não cobra nada."
    >
      <div className="space-y-6">
        {erro && <Aviso tipo="erro">{erro}</Aviso>}

        <Abas
          abas={[
            { id: "vitrine", rotulo: `Vitrine (${vitrine.length})` },
            { id: "meus", rotulo: `Meus itens (${meusItens.length})` },
            { id: "reservas", rotulo: `Minhas reservas (${minhasReservas.length})` },
          ]}
          atual={aba}
          aoTrocar={setAba}
        />

        <div className="flex justify-end">
          <BotaoPrimario onClick={() => setCriando((v) => !v)}>
            <span className="inline-flex items-center gap-2">
              <Plus size={13} strokeWidth={2} /> {criando ? "Fechar" : "Anunciar item"}
            </span>
          </BotaoPrimario>
        </div>

        {criando && (
          <Cartao>
            <form onSubmit={publicar} className="space-y-5">
              <div>
                <Rotulo obrigatorio>Item</Rotulo>
                <CampoTexto
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  maxLength={120}
                  placeholder="Ex.: O Livro dos Espíritos — edição de bolso"
                />
              </div>
              <div>
                <Rotulo obrigatorio>Descrição</Rotulo>
                <CampoArea
                  rows={3}
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  maxLength={2000}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Rotulo>Categoria</Rotulo>
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
                  <Rotulo>Estado</Rotulo>
                  <CampoSelecao
                    value={form.estado}
                    onChange={(e) => setForm({ ...form, estado: e.target.value })}
                  >
                    <option value="usado">Usado</option>
                    <option value="novo">Novo</option>
                  </CampoSelecao>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 sm:items-end">
                <div>
                  <Rotulo ajuda="em reais">Valor</Rotulo>
                  <CampoTexto
                    value={form.valor}
                    disabled={form.doacao}
                    onChange={(e) => setForm({ ...form, valor: e.target.value })}
                    placeholder="35,00"
                  />
                </div>
                <label className="flex items-start gap-2 text-sm text-foreground cursor-pointer pb-2">
                  <input
                    type="checkbox"
                    checked={form.doacao}
                    onChange={(e) => setForm({ ...form, doacao: e.target.checked })}
                    className="mt-1"
                  />
                  <span>
                    Contribuição livre
                    <span className="block text-xs text-muted-foreground font-light">
                      Sem preço fixo — cada um contribui com o que puder.
                    </span>
                  </span>
                </label>
              </div>

              <div>
                <Rotulo ajuda="opcional — até 5 MB">Foto</Rotulo>
                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                  <ImagePlus size={16} strokeWidth={1.6} className="text-cyan-glow" />
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => setFoto(e.target.files?.[0] ?? null)}
                    className="text-xs"
                  />
                </label>
                {foto && <p className="mt-1 text-xs text-muted-foreground/60">{foto.name}</p>}
              </div>

              <div className="rounded-2xl border border-border/60 p-4 space-y-4">
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-glow">
                  PIX de quem recebe
                </p>
                <p className="text-xs text-muted-foreground font-light">
                  Preencha para que apareça o código copia e cola. O nome tem limite de 25
                  caracteres e a cidade, 15 — é exigência do padrão do Banco Central, e passar disso
                  gera um código que o banco recusa.
                </p>
                <div>
                  <Rotulo>Chave PIX</Rotulo>
                  <CampoTexto
                    value={form.chave_pix}
                    onChange={(e) => setForm({ ...form, chave_pix: e.target.value })}
                    maxLength={77}
                    placeholder="CPF/CNPJ, telefone, e-mail ou chave aleatória"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Rotulo>Nome de quem recebe</Rotulo>
                    <CampoTexto
                      value={form.pix_nome}
                      onChange={(e) => setForm({ ...form, pix_nome: e.target.value })}
                      maxLength={25}
                    />
                  </div>
                  <div>
                    <Rotulo>Cidade</Rotulo>
                    <CampoTexto
                      value={form.pix_cidade}
                      onChange={(e) => setForm({ ...form, pix_cidade: e.target.value })}
                      maxLength={15}
                    />
                  </div>
                </div>
              </div>

              <div>
                <Rotulo obrigatorio ajuda="mostrado apenas a quem você aceitar">
                  Seu contato
                </Rotulo>
                <CampoTexto
                  value={form.contato}
                  onChange={(e) => setForm({ ...form, contato: e.target.value })}
                  maxLength={120}
                  placeholder="(21) 90000-0000"
                />
              </div>

              <div className="rounded-2xl border border-border/60 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-glow mb-3">
                  Quem enxerga
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, aberto: false })}
                    className={`flex-1 rounded-xl border px-3 py-2 text-sm transition-colors ${
                      !form.aberto
                        ? "border-cyan-glow/50 bg-cyan-glow/5 text-foreground"
                        : "border-border/60 text-muted-foreground"
                    }`}
                  >
                    Somente a minha casa
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, aberto: true })}
                    className={`flex-1 rounded-xl border px-3 py-2 text-sm transition-colors ${
                      form.aberto
                        ? "border-cyan-glow/50 bg-cyan-glow/5 text-foreground"
                        : "border-border/60 text-muted-foreground"
                    }`}
                  >
                    Todas as casas
                  </button>
                </div>
              </div>

              <BotaoPrimario type="submit" disabled={ocupado === "publicar"}>
                {ocupado === "publicar" ? "Publicando…" : "Publicar item"}
              </BotaoPrimario>
            </form>
          </Cartao>
        )}

        {carregando ? (
          <p className="text-center text-muted-foreground/50 py-12 font-light">Carregando…</p>
        ) : aba === "vitrine" ? (
          vitrine.length === 0 ? (
            <Vazio texto="Nenhum item à venda no momento." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {vitrine.map((i) => (
                <CartaoItem
                  key={i.id}
                  item={i}
                  dono={i.criado_por === user?.id}
                  reservas={reservas}
                  contatos={contatos}
                  usuarioId={user?.id}
                  ehDirecao={isPresident}
                  ocupado={ocupado}
                  copiado={copiado}
                  reservando={reservando}
                  formReserva={formReserva}
                  aoMudarReserva={setFormReserva}
                  aoAbrirReserva={setReservando}
                  aoReservar={reservar}
                  aoResponderReserva={responderReserva}
                  aoAlternarDisponivel={alternarDisponivel}
                  aoApagar={apagar}
                  aoCopiarPix={copiarPix}
                />
              ))}
            </div>
          )
        ) : aba === "meus" ? (
          meusItens.length === 0 ? (
            <Vazio texto="Você ainda não anunciou nada." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {meusItens.map((i) => (
                <CartaoItem
                  key={i.id}
                  item={i}
                  dono
                  reservas={reservas}
                  contatos={contatos}
                  usuarioId={user?.id}
                  ehDirecao={isPresident}
                  ocupado={ocupado}
                  copiado={copiado}
                  reservando={reservando}
                  formReserva={formReserva}
                  aoMudarReserva={setFormReserva}
                  aoAbrirReserva={setReservando}
                  aoReservar={reservar}
                  aoResponderReserva={responderReserva}
                  aoAlternarDisponivel={alternarDisponivel}
                  aoApagar={apagar}
                  aoCopiarPix={copiarPix}
                />
              ))}
            </div>
          )
        ) : minhasReservas.length === 0 ? (
          <Vazio texto="Você não demonstrou interesse em nenhum item ainda." />
        ) : (
          <div className="space-y-3">
            {minhasReservas.map((r) => {
              const item = itens.find((i) => i.id === r.item_id);
              return (
                <div key={r.id} className="glass rounded-2xl p-5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="text-foreground inline-flex items-center gap-2">
                      <Package size={14} strokeWidth={1.6} className="text-cyan-glow" />
                      {item?.titulo ?? "Item removido"}
                    </p>
                    <Etiqueta
                      tom={
                        r.status === "aceita" || r.status === "concluida"
                          ? "verde"
                          : r.status === "recusada"
                            ? "neutro"
                            : "ambar"
                      }
                    >
                      {r.status === "pendente"
                        ? "Aguardando resposta"
                        : r.status === "aceita"
                          ? "Aceita"
                          : r.status === "concluida"
                            ? "Concluída"
                            : "Recusada"}
                    </Etiqueta>
                  </div>
                  {item && contatos[item.id] && (
                    <p className="mt-2 text-sm text-emerald-700">
                      Contato de quem anunciou: {contatos[item.id]}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground/60">{quandoFoi(r.created_at)}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PaginaComunidade>
  );
}
