import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

/**
 * Votos dos membros nos itens pendentes do projeto.
 *
 * A mesma lógica existia copiada em /painel, /inicio e /casa/$sigla, e as
 * três só sabiam inserir voto — embora o aviso na tela prometesse "descurtir
 * quando quiser" e a política de exclusão já existisse no banco. Aqui o voto
 * é alternado: quem já votou e clica de novo tem o voto removido.
 */

export interface VoteInfo {
  count: number;
  votedByMe: boolean;
}

export type VoteMap = Record<string, VoteInfo>;

/** Chave estável do item, derivada do título exibido no cartão. */
export function toItemKey(titulo: string): string {
  return titulo
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .slice(0, 80);
}

export function usePainelVotes(user: User | null) {
  const [votes, setVotes] = useState<VoteMap>({});
  const [votingKey, setVotingKey] = useState<string | null>(null);

  const fetchVotes = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("painel_votes").select("item_key, user_id");
    if (!data) return;
    const map: VoteMap = {};
    for (const row of data) {
      if (!map[row.item_key]) map[row.item_key] = { count: 0, votedByMe: false };
      map[row.item_key].count++;
      if (row.user_id === user.id) map[row.item_key].votedByMe = true;
    }
    setVotes(map);
  }, [user]);

  useEffect(() => {
    if (user) fetchVotes();
  }, [user, fetchVotes]);

  /** Curte o item; se o membro já tinha curtido, retira a curtida. */
  const toggleVote = useCallback(
    async (key: string) => {
      if (!user || votingKey) return;
      const jaVotou = votes[key]?.votedByMe ?? false;
      setVotingKey(key);
      try {
        if (jaVotou) {
          const { error } = await supabase
            .from("painel_votes")
            .delete()
            .eq("item_key", key)
            .eq("user_id", user.id);
          if (error) return;
          setVotes((v) => ({
            ...v,
            [key]: { count: Math.max(0, (v[key]?.count ?? 1) - 1), votedByMe: false },
          }));
        } else {
          const { error } = await supabase
            .from("painel_votes")
            .insert({ item_key: key, user_id: user.id });
          if (error) return;
          setVotes((v) => ({
            ...v,
            [key]: { count: (v[key]?.count ?? 0) + 1, votedByMe: true },
          }));
        }
      } finally {
        setVotingKey(null);
      }
    },
    [user, votes, votingKey],
  );

  /** Alterna o voto a partir do título do cartão. */
  const toggleVoteByTitle = useCallback(
    (titulo: string) => toggleVote(toItemKey(titulo)),
    [toggleVote],
  );

  return { votes, votingKey, fetchVotes, toggleVote, toggleVoteByTitle };
}
