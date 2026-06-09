import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export const DEV_EMAIL = "gama.andre@gmail.com";

interface Profile {
  id: string;
  sigla_casa: string | null;
  nome: string | null;
  uf: string | null;
  cidade: string | null;
  bairro: string | null;
  role: string;
  cargo_principal: string | null;
  atividades: string[];
}

export const CARGOS_DECISAO = [
  "Presidente",
  "Vice-presidente",
  "Coordenador",
  "Diretoria",
  "Dirigente",
  "Dirigente de reunião mediúnica",
] as const;

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isDev: boolean;
  isPresident: boolean;
  isTesoureiro: boolean;
  isTesourariaAutorizado: boolean;
  canTesouraria: boolean;
  isTesourariaAdmin: boolean;
  isDecisao: boolean;
  isEvangelizador: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  isDev: false,
  isPresident: false,
  isTesoureiro: false,
  isTesourariaAutorizado: false,
  canTesouraria: false,
  isTesourariaAdmin: false,
  isDecisao: false,
  isEvangelizador: false,
  refreshProfile: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [tesourariaAutorizado, setTesourariaAutorizado] = useState(false);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("id, sigla_casa, nome, uf, cidade, bairro, role, cargo_principal, atividades")
      .eq("id", userId)
      .single();
    setProfile(data ?? null);

    // Autorização explícita de acesso à Tesouraria concedida pelo Presidente
    const { data: autoriz } = await supabase
      .from("tesouraria_autorizacoes")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    setTesourariaAutorizado(!!autoriz);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setTesourariaAutorizado(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setTesourariaAutorizado(false);
  };

  const isDev = user?.email === DEV_EMAIL && profile?.cargo_principal === "DEV";
  const isPresident =
    isDev ||
    profile?.cargo_principal === "Presidente" ||
    profile?.cargo_principal === "Vice-presidente";
  const isTesoureiro =
    isDev ||
    profile?.cargo_principal === "Presidente" ||
    profile?.cargo_principal === "Tesoureiro";

  // Acesso à Tesouraria: Presidente, Vice, Tesoureiro, DEV ou autorizado pelo Presidente
  const canTesouraria =
    isDev ||
    profile?.cargo_principal === "Presidente" ||
    profile?.cargo_principal === "Vice-presidente" ||
    profile?.cargo_principal === "Tesoureiro" ||
    tesourariaAutorizado;

  // Quem pode conceder/revogar acesso à Tesouraria: Presidente da casa ou DEV
  const isTesourariaAdmin = isDev || profile?.cargo_principal === "Presidente";

  const isDecisao =
    isDev ||
    (profile?.cargo_principal != null &&
      (CARGOS_DECISAO as readonly string[]).includes(profile.cargo_principal));

  const isEvangelizador =
    isDev ||
    isDecisao ||
    profile?.cargo_principal === "Evangelizador";

  return (
    <AuthContext.Provider value={{ user, profile, loading, isDev, isPresident, isTesoureiro, isTesourariaAutorizado: tesourariaAutorizado, canTesouraria, isTesourariaAdmin, isDecisao, isEvangelizador, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
