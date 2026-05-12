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

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isDev: boolean;
  isPresident: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  isDev: false,
  isPresident: false,
  refreshProfile: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("id, sigla_casa, nome, uf, cidade, bairro, role, cargo_principal, atividades")
      .eq("id", userId)
      .single();
    setProfile(data ?? null);
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
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const isDev = user?.email === DEV_EMAIL && profile?.cargo_principal === "DEV";
  const isPresident =
    isDev ||
    profile?.cargo_principal === "Presidente" ||
    profile?.cargo_principal === "Vice-presidente";

  return (
    <AuthContext.Provider value={{ user, profile, loading, isDev, isPresident, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
