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
      } else {
        navigate({ to: "/completar-perfil" });
      }
    }
  }, [user, loading, navigate]);

  return null;
}
