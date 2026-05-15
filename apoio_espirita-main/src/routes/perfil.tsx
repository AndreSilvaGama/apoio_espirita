import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, DEV_EMAIL } from "@/contexts/AuthContext";

export const Route = createFileRoute("/perfil")({
  component: Perfil,
});

const UFS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA",
  "MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN",
  "RS","RO","RR","SC","SP","SE","TO",
];

const CARGOS_BASE = [
  "Presidente",
  "Vice-presidente",
  "Coordenador",
  "Diretoria",
  "Dirigente",
  "Dirigente de reunião mediúnica",
  "Tesoureiro",
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

const ATIVIDADES = [
  "Trabalhador","Expositor","Palestrante","Facilitador",
  "Dirigente de reunião mediúnica","Médium","Passista",
  "Evangelizador","Estudante","Participante de estudo",
  "Assistido","Atendente fraterno","Colaborador","Sócio","Associado",
];

function Perfil() {
  const navigate = useNavigate();
  const { user, profile, loading, refreshProfile, signOut } = useAuth();

  const isDevUser = user?.email === DEV_EMAIL;
  const CARGOS = isDevUser ? ["DEV", ...CARGOS_BASE] : CARGOS_BASE;

  // Perfil
  const [siglas, setSiglas] = useState<string[]>([]);
  const [nome, setNome] = useState("");
  const [uf, setUf] = useState("");
  const [cidade, setCidade] = useState("");
  const [bairro, setBairro] = useState("");
  const [cargo, setCargo] = useState("");
  const [atividades, setAtividades] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("");
  const [open, setOpen] = useState(false);
  const [savingPerfil, setSavingPerfil] = useState(false);
  const [perfilOk, setPerfilOk] = useState(false);
  const [perfilError, setPerfilError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Casa espírita
  const [nomeCasa, setNomeCasa] = useState("");
  const [enderecoCasa, setEnderecoCasa] = useState("");
  const [casaId, setCasaId] = useState<string | null>(null);
  const [savingCasa, setSavingCasa] = useState(false);
  const [casaOk, setCasaOk] = useState(false);
  const [casaError, setCasaError] = useState("");

  // Senha
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmSenha, setConfirmSenha] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdOk, setPwdOk] = useState(false);
  const [pwdError, setPwdError] = useState("");

  // Exclusão
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (profile) {
      setNome(profile.nome ?? "");
      setUf(profile.uf ?? "");
      setCidade(profile.cidade ?? "");
      setBairro(profile.bairro ?? "");
      setQuery(profile.sigla_casa ?? "");
      setSelected(profile.sigla_casa ?? "");
      setCargo(profile.cargo_principal ?? "");
      setAtividades(profile.atividades ?? []);
    }
  }, [profile]);

  useEffect(() => {
    supabase.from("siglas_casas").select("sigla").order("sigla").then(({ data }) => {
      if (data) setSiglas(data.map((r) => r.sigla));
    });
  }, []);

  useEffect(() => {
    if (!profile?.sigla_casa) return;
    supabase
      .from("casas_espirita")
      .select("id, nome, endereco")
      .eq("sigla", profile.sigla_casa)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setCasaId(data.id);
          setNomeCasa(data.nome ?? "");
          setEnderecoCasa(data.endereco ?? "");
        } else {
          setCasaId(null);
          setNomeCasa("");
          setEnderecoCasa("");
        }
      });
  }, [profile?.sigla_casa]);

  const normalized = query.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 5);
  const filtered = siglas.filter((s) => s.includes(normalized));
  const canAdd = normalized.length === 5 && !siglas.includes(normalized);

  const choose = (sigla: string) => {
    setSelected(sigla);
    setQuery(sigla);
    setOpen(false);
  };

  const handleSavePerfil = async () => {
    if (!nome.trim()) { setPerfilError("Informe seu nome."); return; }
    if (!uf) { setPerfilError("Selecione o estado."); return; }
    if (!cidade.trim()) { setPerfilError("Informe a cidade."); return; }
    if (!bairro.trim()) { setPerfilError("Informe o bairro."); return; }
    if (!selected || selected.length !== 5) { setPerfilError("Selecione ou cadastre uma sigla de 5 letras."); return; }
    if (!cargo) { setPerfilError("Selecione sua função na casa espírita."); return; }
    if (cargo === "DEV" && !isDevUser) { setPerfilError("Cargo inválido."); return; }
    if (!user) return;

    setSavingPerfil(true);
    setPerfilError("");
    setPerfilOk(false);
    try {
      if (!siglas.includes(selected)) {
        const { error: e } = await supabase.from("siglas_casas").insert({ sigla: selected });
        if (e && e.code !== "23505") throw e;
      }
      const { error: pe } = await supabase
        .from("profiles")
        .update({ nome: nome.trim(), uf, cidade: cidade.trim(), bairro: bairro.trim(), sigla_casa: selected, cargo_principal: cargo, atividades, updated_at: new Date().toISOString() })
        .eq("id", user.id);
      if (pe) throw pe;
      await refreshProfile();
      setPerfilOk(true);
    } catch (e: unknown) {
      setPerfilError(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSavingPerfil(false);
    }
  };

  const handleSaveCasa = async () => {
    if (!nomeCasa.trim()) { setCasaError("Informe o nome completo da casa."); return; }
    if (!selected) { setCasaError("Selecione primeiro a sigla da sua casa."); return; }
    if (!uf || !cidade.trim()) { setCasaError("Complete primeiro seus dados pessoais (UF e cidade)."); return; }
    setSavingCasa(true);
    setCasaError("");
    setCasaOk(false);
    try {
      if (casaId) {
        const { error } = await supabase
          .from("casas_espirita")
          .update({ nome: nomeCasa.trim(), endereco: enderecoCasa.trim() || null })
          .eq("id", casaId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("casas_espirita")
          .insert({
            nome: nomeCasa.trim(),
            endereco: enderecoCasa.trim() || null,
            cidade: cidade.trim(),
            estado: uf,
            sigla: selected,
            ativa: true,
            aceita_doacao_alimentos: false,
          })
          .select("id")
          .single();
        if (error) throw error;
        if (data) setCasaId(data.id);
      }
      setCasaOk(true);
    } catch (e: unknown) {
      setCasaError(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSavingCasa(false);
    }
  };

  const handleSaveSenha = async () => {
    if (novaSenha.length < 6) { setPwdError("A senha deve ter pelo menos 6 caracteres."); return; }
    if (novaSenha !== confirmSenha) { setPwdError("As senhas não coincidem."); return; }
    setSavingPwd(true);
    setPwdError("");
    setPwdOk(false);
    try {
      const { error } = await supabase.auth.updateUser({ password: novaSenha });
      if (error) throw error;
      setNovaSenha("");
      setConfirmSenha("");
      setPwdOk(true);
    } catch (e: unknown) {
      setPwdError(e instanceof Error ? e.message : "Erro ao alterar senha.");
    } finally {
      setSavingPwd(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError("");
    try {
      const { error } = await supabase.rpc("delete_user");
      if (error) throw error;
      await signOut();
      window.location.replace("/");
    } catch (e: unknown) {
      setDeleteError(e instanceof Error ? e.message : "Erro ao excluir conta.");
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  if (loading || !user) return null;

  return (
    <main className="page-light min-h-screen px-6 py-16">
      <div className="mx-auto max-w-lg">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-[0.4em] text-cyan-glow mb-2">Configurações</p>
          <h1 className="text-3xl font-light text-foreground">Meu Perfil</h1>
          <p className="mt-1 text-sm text-muted-foreground font-light">{user.email}</p>
        </div>

        {/* Dados pessoais */}
        <section className="glass rounded-3xl p-8 space-y-5 mb-6">
          <h2 className="text-sm uppercase tracking-widest text-muted-foreground/60">Dados pessoais</h2>

          <div>
            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
              Nome completo <span className="text-cyan-glow">*</span>
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => { setNome(e.target.value); setPerfilError(""); setPerfilOk(false); }}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-cyan-glow/40 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
                Estado <span className="text-cyan-glow">*</span>
              </label>
              <select
                value={uf}
                onChange={(e) => { setUf(e.target.value); setPerfilError(""); setPerfilOk(false); }}
                className="w-full rounded-xl border border-white/10 px-4 py-3 text-sm focus:outline-none focus:border-cyan-glow/40 transition-colors"
              >
                <option value="">UF</option>
                {UFS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
                Cidade <span className="text-cyan-glow">*</span>
              </label>
              <input
                type="text"
                value={cidade}
                onChange={(e) => { setCidade(e.target.value); setPerfilError(""); setPerfilOk(false); }}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-cyan-glow/40 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
              Bairro <span className="text-cyan-glow">*</span>
            </label>
            <input
              type="text"
              value={bairro}
              onChange={(e) => { setBairro(e.target.value); setPerfilError(""); setPerfilOk(false); }}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-cyan-glow/40 transition-colors"
            />
          </div>

          {/* Cargo */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
              Função na Casa Espírita <span className="text-cyan-glow">*</span>
            </label>
            <select
              value={cargo}
              onChange={(e) => { setCargo(e.target.value); setPerfilError(""); setPerfilOk(false); }}
              className="w-full rounded-xl border border-white/10 px-4 py-3 text-sm focus:outline-none focus:border-cyan-glow/40 transition-colors"
            >
              <option value="">Selecione…</option>
              {CARGOS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Atividades */}
          <div className="pt-2 border-t border-white/5">
            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-3">
              Atividades que participa <span className="text-muted-foreground/40 normal-case tracking-normal text-[10px]">(selecione quantas quiser)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ATIVIDADES.map((a) => (
                <label key={a} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={atividades.includes(a)}
                    onChange={(e) => {
                      setAtividades(e.target.checked ? [...atividades, a] : atividades.filter((x) => x !== a));
                      setPerfilError(""); setPerfilOk(false);
                    }}
                    className="accent-cyan-500 w-4 h-4 rounded"
                  />
                  <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">{a}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Sigla */}
          <div className="pt-2 border-t border-white/5">
            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
              Sigla da Casa Espírita <span className="text-cyan-glow">*</span>
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  const v = e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 5);
                  setQuery(v);
                  setSelected(v.length === 5 && (siglas.includes(v) || v === selected) ? v : "");
                  setOpen(true);
                  setPerfilError("");
                  setPerfilOk(false);
                }}
                onFocus={() => setOpen(true)}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-cyan-glow/40 transition-colors uppercase tracking-widest font-medium"
              />
              {open && (filtered.length > 0 || canAdd) && (
                <div className="absolute z-20 w-full mt-1 rounded-xl bg-background/95 backdrop-blur border border-white/10 overflow-hidden shadow-xl">
                  {filtered.slice(0, 8).map((s) => (
                    <button key={s} onMouseDown={() => choose(s)} className="w-full px-4 py-3 text-left text-sm font-medium tracking-widest hover:bg-white/5 transition-colors text-foreground">
                      {s}
                    </button>
                  ))}
                  {canAdd && (
                    <button onMouseDown={() => choose(normalized)} className="w-full px-4 py-3 text-left text-sm text-cyan-glow hover:bg-cyan-glow/5 transition-colors border-t border-white/5">
                      + Adicionar "<span className="font-bold tracking-widest">{normalized}</span>"
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {perfilError && <p className="text-xs text-red-400 text-center">{perfilError}</p>}
          {perfilOk && <p className="text-xs text-emerald-400 text-center">Perfil atualizado com sucesso.</p>}

          <button
            onClick={handleSavePerfil}
            disabled={savingPerfil}
            className="w-full py-3 rounded-xl text-sm uppercase tracking-widest text-cyan-glow border border-cyan-glow/40 hover:bg-cyan-glow/10 disabled:opacity-40 transition-colors"
          >
            {savingPerfil ? "Salvando…" : "Salvar alterações"}
          </button>
        </section>

        {/* Minha Casa Espírita */}
        <section className="glass rounded-3xl p-8 space-y-5 mb-6">
          <h2 className="text-sm uppercase tracking-widest text-muted-foreground/60">Minha Casa Espírita</h2>
          <p className="text-xs text-muted-foreground/50 font-light">
            Dados que aparecem no mapa de busca público do site.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">Estado</label>
              <div className="rounded-xl bg-white/5 border border-white/5 px-4 py-3 text-sm text-muted-foreground">{uf || "—"}</div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">Cidade</label>
              <div className="rounded-xl bg-white/5 border border-white/5 px-4 py-3 text-sm text-muted-foreground">{cidade || "—"}</div>
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
              Nome completo da casa <span className="text-cyan-glow">*</span>
            </label>
            <input
              type="text"
              placeholder="Nome completo da casa espírita"
              value={nomeCasa}
              onChange={(e) => { setNomeCasa(e.target.value); setCasaError(""); setCasaOk(false); }}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-cyan-glow/40 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">Endereço</label>
            <input
              type="text"
              placeholder="Rua e número (opcional)"
              value={enderecoCasa}
              onChange={(e) => { setEnderecoCasa(e.target.value); setCasaError(""); setCasaOk(false); }}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-cyan-glow/40 transition-colors"
            />
          </div>

          {casaError && <p className="text-xs text-red-400 text-center">{casaError}</p>}
          {casaOk && <p className="text-xs text-emerald-400 text-center">Dados da casa atualizados.</p>}

          <button
            onClick={handleSaveCasa}
            disabled={savingCasa || !selected}
            className="w-full py-3 rounded-xl text-sm uppercase tracking-widest text-cyan-glow border border-cyan-glow/40 hover:bg-cyan-glow/10 disabled:opacity-40 transition-colors"
          >
            {savingCasa ? "Salvando…" : casaId ? "Atualizar dados da casa" : "Cadastrar casa no mapa"}
          </button>
        </section>

        {/* Alterar senha */}
        <section className="glass rounded-3xl p-8 space-y-5 mb-6">
          <h2 className="text-sm uppercase tracking-widest text-muted-foreground/60">Alterar senha</h2>
          <p className="text-xs text-muted-foreground/50 font-light">Disponível apenas para contas criadas por e-mail e senha.</p>

          <input
            type="password"
            placeholder="Nova senha (mínimo 6 caracteres)"
            value={novaSenha}
            onChange={(e) => { setNovaSenha(e.target.value); setPwdError(""); setPwdOk(false); }}
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-cyan-glow/40 transition-colors"
          />
          <input
            type="password"
            placeholder="Confirmar nova senha"
            value={confirmSenha}
            onChange={(e) => { setConfirmSenha(e.target.value); setPwdError(""); setPwdOk(false); }}
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-cyan-glow/40 transition-colors"
          />

          {pwdError && <p className="text-xs text-red-400 text-center">{pwdError}</p>}
          {pwdOk && <p className="text-xs text-emerald-400 text-center">Senha alterada com sucesso.</p>}

          <button
            onClick={handleSaveSenha}
            disabled={savingPwd || !novaSenha}
            className="w-full py-3 rounded-xl text-sm uppercase tracking-widest text-cyan-glow border border-cyan-glow/40 hover:bg-cyan-glow/10 disabled:opacity-40 transition-colors"
          >
            {savingPwd ? "Alterando…" : "Alterar senha"}
          </button>
        </section>

        {/* Voltar */}
        <div className="text-center mb-8">
          <Link to="/painel" className="text-xs text-cyan-glow/60 hover:text-cyan-glow transition-colors">
            ← Voltar ao painel
          </Link>
        </div>

        {/* Excluir conta */}
        <section className="pt-8 border-t border-white/5 text-center space-y-3">
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-xs text-muted-foreground/30 hover:text-red-400/60 transition-colors"
            >
              Excluir minha conta
            </button>
          ) : (
            <div className="glass rounded-2xl p-6 space-y-4">
              <p className="text-sm text-foreground font-light">
                Tem certeza? Esta ação é <span className="text-red-400">irreversível</span> e todos os seus dados serão apagados.
              </p>
              {deleteError && <p className="text-xs text-red-400">{deleteError}</p>}
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-5 py-2 rounded-xl text-xs uppercase tracking-widest text-muted-foreground border border-white/10 hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-5 py-2 rounded-xl text-xs uppercase tracking-widest text-red-400 border border-red-400/30 hover:bg-red-400/10 disabled:opacity-40 transition-colors"
                >
                  {deleting ? "Excluindo…" : "Confirmar exclusão"}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
