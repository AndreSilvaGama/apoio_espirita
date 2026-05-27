import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/perfil")({
  component: Perfil,
});

function Perfil() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate({ to: "/login" });
      } else if (profile?.sigla_casa) {
        navigate({ to: "/casa/$sigla", params: { sigla: profile.sigla_casa } });
      } else {
        navigate({ to: "/inicio" });
      }
    }
  }, [user, profile, loading, navigate]);

  return null;
}
