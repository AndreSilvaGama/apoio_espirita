import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/completar-perfil")({
  component: CompletarPerfil,
});

const UFS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA",
  "MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN",
  "RS","RO","RR","SC","SP","SE","TO",
];

const CARGOS = [
  // Nível 1
  "Presidente",
  // Nível 2
  "Vice-presidente",
  // Nível 3
  "Coordenador",
  "Diretoria",
  "Dirigente",
  "Dirigente de reunião mediúnica",
  // Nível 4
  "Tesoureiro",
  // Nível 5
  "Assistido",
  "Associado",
  "Atendente fraterno",
  "Colaborador",
  "Estudante",
  "Evangelizador",
  "Expositor",
  "Facilitador",
  "Frequentador",
  "Médium",
  "Palestrante",
  "Participante de estudo",
  "Passista",
  "Sócio",
  "Tarefeiro",
  "Trabalhador",
  "Visitante",
];

function CompletarPerfil() {
  const navigate = useNavigate();
  const { user, profile, loading, refreshProfile } = useAuth();
  const [siglas, setSiglas] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("");
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [uf, setUf] = useState("");
  const [cidade, setCidade] = useState("");
  const [cidades, setCidades] = useState<string[]>([]);
  const [loadingCidades, setLoadingCidades] = useState(false);
  const [bairro, setBairro] = useState("");
  const [cargo, setCargo] = useState("");
  const [nomeCasa, setNomeCasa] = useState("");
  const [enderecoCasa, setEnderecoCasa] = useState("");
  const [casaExiste, setCasaExiste] = useState<boolean | null>(null);
  const [checkingCasa, setCheckingCasa] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
    if (!loading && user && profile?.sigla_casa && profile?.nome && profile?.cargo_principal && profile?.uf && profile?.cidade) {
      navigate({ to: "/inicio" });
    }
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    if (profile) {
      if (profile.nome) setNome(profile.nome);
      if (profile.uf) setUf(profile.uf);
      if (profile.cidade) setCidade(profile.cidade);
      if (profile.bairro) setBairro(profile.bairro);
      if (profile.sigla_casa) { setQuery(profile.sigla_casa); setSelected(profile.sigla_casa); }
      if (profile.cargo_principal) setCargo(profile.cargo_principal);
    }
  }, [profile]);

  useEffect(() => {
    supabase.from("siglas_casas").select("sigla").order("sigla").then(({ data }) => {
      if (data) setSiglas(data.map((r) => r.sigla));
    });
  }, []);

  useEffect(() => {
    if (!uf) { setCidades([]); return; }
    setLoadingCidades(true);
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`)
      .then((r) => r.json())
      .then((data: { nome: string }[]) => {
        const nomes = data.map((d) => d.nome);
        setCidades(nomes);
        setCidade((prev) => (nomes.includes(prev) ? prev : ""));
        setLoadingCidades(false);
      })
      .catch(() => setLoadingCidades(false));
  }, [uf]);

  useEffect(() => {
    if (!selected || !uf || !cidade.trim()) { setCasaExiste(null); setNomeCasa(""); return; }
    setCheckingCasa(true);
    supabase
      .from("casas_espirita")
      .select("id, nome")
      .eq("sigla", selected)
      .eq("cidade", cidade.trim())
      .eq("estado", uf)
      .maybeSingle()
      .then(({ data }) => {
        setCasaExiste(!!data);
        if (data) setNomeCasa(data.nome ?? "");
        setCheckingCasa(false);
      });
  }, [selected, uf, cidade]);

  const normalized = query.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 5);
  const filtered = siglas.filter((s) => s.includes(normalized));
  const canAdd = normalized.length === 5 && !siglas.includes(normalized);

  const choose = (sigla: string) => {
    setSelected(sigla);
    setQuery(sigla);
    setOpen(false);
  };

  const handleSave = async () => {
    if (!nome.trim()) { setError("Informe seu nome completo."); return; }
    if (!uf) { setError("Selecione seu estado (UF)."); return; }
    if (!cidade.trim()) { setError("Informe sua cidade."); return; }
    if (!bairro.trim()) { setError("Informe seu bairro."); return; }
    if (!selected || selected.length !== 5) { setError("Selecione ou cadastre uma sigla de 5 letras."); return; }
    if (!cargo) { setError("Selecione sua função na casa espírita."); return; }
    if (!user) return;

    setSaving(true);
    setError("");
    try {
      if (!siglas.includes(selected)) {
        const { error: e } = await supabase.from("siglas_casas").insert({ sigla: selected });
        if (e && e.code !== "23505") throw e;
      }
      const { error: pe } = await supabase
        .from("profiles")
        .update({
          nome: nome.trim(),
          uf,
          cidade: cidade.trim(),
          bairro: bairro.trim(),
          sigla_casa: selected,
          cargo_principal: cargo,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
      if (pe) throw pe;
      if (!casaExiste && nomeCasa.trim()) {
        if (!enderecoCasa.trim()) { setError("Informe o endereço da casa espírita para cadastrá-la no mapa."); setSaving(false); return; }
        const { error: ce } = await supabase.from("casas_espirita").insert({
          nome: nomeCasa.trim().toUpperCase(),
          endereco: enderecoCasa.trim(),
          cidade: cidade.trim(),
          estado: uf,
          sigla: selected,
          ativa: true,
          aceita_doacao_alimentos: false,
        });
        if (ce && ce.code !== "23505") throw ce;
      }
      await refreshProfile();
      navigate({ to: "/inicio" });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <main className="page-light min-h-screen flex items-center justify-center px-6 py-16">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,oklch(0.88_0.03_290/0.5)_0%,transparent_70%)]" />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-10">
          <p className="text-xs uppercase tracking-[0.4em] text-cyan-glow mb-3">Bem-vindo(a)</p>
          <h1 className="text-3xl font-light text-foreground">Complete seu perfil</h1>
          <p className="mt-2 text-sm text-muted-foreground font-light max-w-sm mx-auto">
            Precisamos de algumas informações para personalizar sua experiência.
          </p>
        </div>

        <div className="glass rounded-3xl p-8 space-y-5">
          {/* Nome */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
              Nome completo <span className="text-cyan-glow">*</span>
            </label>
            <input
              type="text"
              placeholder="Seu nome completo"
              value={nome}
              onChange={(e) => { setNome(e.target.value); setError(""); }}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-cyan-glow/40 transition-colors"
            />
          </div>

          {/* UF + Cidade */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
                Estado <span className="text-cyan-glow">*</span>
              </label>
              <select
                value={uf}
                onChange={(e) => { setUf(e.target.value); setError(""); }}
                className="w-full rounded-xl border border-white/10 px-4 py-3 text-sm focus:outline-none focus:border-cyan-glow/40 transition-colors"
              >
                <option value="">UF</option>
                {UFS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
                Cidade <span className="text-cyan-glow">*</span>
              </label>
              <select
                value={cidade}
                onChange={(e) => { setCidade(e.target.value); setError(""); }}
                disabled={!uf || loadingCidades}
                className="w-full rounded-xl border border-white/10 px-4 py-3 text-sm focus:outline-none focus:border-cyan-glow/40 transition-colors disabled:opacity-50"
              >
                <option value="">
                  {loadingCidades ? "Carregando…" : "Selecione a cidade"}
                </option>
                {cidades.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Bairro */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
              Bairro <span className="text-cyan-glow">*</span>
            </label>
            <input
              type="text"
              placeholder="Seu bairro"
              value={bairro}
              onChange={(e) => { setBairro(e.target.value); setError(""); }}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-cyan-glow/40 transition-colors"
            />
          </div>

          {/* Sigla da casa */}
          <div className="pt-2 border-t border-white/5">
            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
              Sigla da Casa Espírita <span className="text-cyan-glow">*</span>
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                placeholder="Digite para buscar ou criar…"
                value={query}
                onChange={(e) => {
                  const v = e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 5);
                  setQuery(v);
                  setSelected(v.length === 5 && (siglas.includes(v) || v === selected) ? v : "");
                  setOpen(true);
                  setError("");
                }}
                onFocus={() => setOpen(true)}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-cyan-glow/40 transition-colors uppercase tracking-widest font-medium"
              />
              {open && (filtered.length > 0 || canAdd) && (
                <div className="absolute z-20 w-full mt-1 rounded-xl bg-background/95 backdrop-blur border border-white/10 overflow-hidden shadow-xl">
                  {filtered.slice(0, 8).map((s) => (
                    <button
                      key={s}
                      onMouseDown={() => choose(s)}
                      className="w-full px-4 py-3 text-left text-sm font-medium tracking-widest hover:bg-white/5 transition-colors text-foreground"
                    >
                      {s}
                    </button>
                  ))}
                  {canAdd && (
                    <button
                      onMouseDown={() => choose(normalized)}
                      className="w-full px-4 py-3 text-left text-sm text-cyan-glow hover:bg-cyan-glow/5 transition-colors border-t border-white/5"
                    >
                      + Adicionar "<span className="font-bold tracking-widest">{normalized}</span>"
                    </button>
                  )}
                </div>
              )}
            </div>
            {selected && (
              <div className="mt-3 text-center py-2 rounded-xl bg-cyan-glow/5 border border-cyan-glow/20">
                <p className="text-xs text-muted-foreground/60">Selecionada</p>
                <p className="text-lg font-medium tracking-[0.4em] text-cyan-glow">{selected}</p>
              </div>
            )}
          </div>

          {/* Casa no mapa de busca */}
          {selected && !checkingCasa && (
            <div className="pt-2 border-t border-white/5">
              {casaExiste ? (
                <p className="text-xs text-emerald-400 text-center py-2">
                  Sua casa já está cadastrada no mapa de busca.
                </p>
              ) : (
                <>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">
                    Colocar a casa no mapa de busca
                  </label>
                  <p className="text-xs text-muted-foreground/50 mb-3 font-light">
                    Preencha para que a casa apareça nos resultados de busca do site.
                  </p>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Nome completo da casa espírita"
                      value={nomeCasa}
                      onChange={(e) => setNomeCasa(e.target.value.toUpperCase())}
                      className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-cyan-glow/40 transition-colors"
                    />
                    <input
                      type="text"
                      placeholder="Endereço — rua e número *"
                      value={enderecoCasa}
                      onChange={(e) => setEnderecoCasa(e.target.value)}
                      className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-cyan-glow/40 transition-colors"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Cargo */}
          <div className="pt-2 border-t border-white/5">
            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
              Função na Casa Espírita <span className="text-cyan-glow">*</span>
            </label>
            <select
              value={cargo}
              onChange={(e) => { setCargo(e.target.value); setError(""); }}
              className="w-full rounded-xl border border-white/10 px-4 py-3 text-sm focus:outline-none focus:border-cyan-glow/40 transition-colors"
            >
              <option value="">Selecione sua função…</option>
              {CARGOS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {error && <p className="text-xs text-red-400 text-center">{error}</p>}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 rounded-xl text-sm uppercase tracking-widest text-cyan-glow border border-cyan-glow/40 hover:bg-cyan-glow/10 disabled:opacity-40 transition-colors duration-300"
          >
            {saving ? "Salvando…" : "Confirmar e entrar"}
          </button>
        </div>
      </div>
    </main>
  );
}
