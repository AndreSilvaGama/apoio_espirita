import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ArrowLeft,
  Music,
  Guitar,
  Search,
  Plus,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Shield,
  Trash2,
  FolderHeart,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Heart,
  FileMusic,
  Lock,
  Globe,
  Loader2,
} from "lucide-react";

export const Route = createFileRoute("/musicas-cifras")({
  component: MusicasCifrasPage,
});

type Tab = "musicas" | "cifras";

interface Track {
  id: string;
  title: string;
  artist: string;
  file?: Blob; // Presente para áudios locais enviados pelo usuário (IndexedDB)
  audio_url?: string; // URL do áudio remoto no Supabase
  is_exclusive?: boolean; // Se a música é exclusiva da casa espírita
  sigla_casa?: string | null;
  user_id?: string | null;
  synthesized?: boolean; // Para as faixas ambientes sintetizadas
  synthType?: "passe" | "harmonizacao";
  durationLabel: string;
}

interface Playlist {
  id: string;
  name: string;
  trackIds: string[];
}

interface CifraSong {
  id: string;
  title: string;
  artist: string;
  category: string;
  content: string; // Letras no formato bracketed [C]Letra
}

// ── BANCO DE CIFRAS PRÉ-SEDEADAS ──────────────────────────────────────────────
const CIFRAS_SONGS: CifraSong[] = [
  {
    id: "c01",
    title: "Prece de Cáritas",
    artist: "Prece Espírita Tradicional",
    category: "Preces & Harmonização",
    content: `[G]Deus, nosso Pai, que [C]sois todo poder e [G]bondade,
dai a [C]força àquele que passa pela [G]prova,
dai a [D]luz àquele que procura a ver[C]dade;
ponde no [G]coração do homem a com[D]paixão e a cari[G]dade!

[G]Deus! Dai ao [C]viajor a estrela [G]guia,
ao a[C]flito a consola[G]ção,
ao do[D]ente o repouso.
[G]Pai! Dai ao [C]culpado o arrependi[G]mento,
ao es[C]pírito a ver[G]dade,
à cri[D]ança o guia,
ao [C]órfão o [G]pai!

[G]Senhor! Que a vossa [C]bondade se es[G]tenda
sobre [C]tudo o que cri[G]astes.
Piedade, Se[D]nhor, para aqueles que não vos [C]conhecem,
espe[G]rança para aqueles que [D]sofrem.
Que a vossa [G]bondade permita aos [C]espíritos conso[G]ladores
derra[C]marem por toda a [G]parte a paz, a espe[D]rança e a cari[G]dade.

[G]Deus! Um raio, uma fa[C]ísca do vosso [G]amor
pode a[C]cender a Terra;
deixai-nos be[D]ber nas fontes dessa bondade fe[C]cunda e infi[G]nita,
e todas as [D]lágrimas secarão,
todas as [C]dores se acalmarão.
Um [G]só coração, um só [D]pensamento subirá até [G]vós,
como um [C]grito de agradeci[D]mento e de a[G]mor!`,
  },
  {
    id: "c02",
    title: "A Paz do Mundo",
    artist: "Canção Fraterna",
    category: "Harmonização",
    content: `[C]A paz do mundo co[Am]meça em você
[F]Quando você de[G]cide estender a mão.
[C]A caridade é a [Am]luz a acender
[F]O amor de Deus no [G]seu coração.

[F]Não diga que o mundo [G]não tem mais jeito,
[Em]Olhe pra dentro do [Am]seu próprio peito.
[F]Seja a semente de [G]paz a brotar,
[C]Na vinha do [C7]Pai a trabalhar!

[C]Vem, vamos [Am]juntos plantar o amor,
[F]Sendo o perfume da [G]mais linda flor,
[C]Estende os braços na [Am]direção do irmão,
[F]Fazendo a paz renas[G]cer no coração.`,
  },
  {
    id: "c03",
    title: "Vinha de Luz",
    artist: "Hino de Trabalho",
    category: "Trabalho & Seareiros",
    content: `[D]Trabalhadores da [G]última hora,
[D]Vinde sem medo ao se[A]meio do amor.
[D]A terra clama, a [G]semente chora,
[D]Pela colheita do [A]nosso Se[D]nhor.

[G]Vem semear o carinho na [D]terra,
[A]Esquecer de vez a discórdia e a [D]guerra.
[G]A vinha de luz é o nosso ca[D]minho,
[A]Onde ninguém caminhará so[D]zinho!

[D]Amai a todos na [G]vossa jornada,
[D]Mesmo na noite mais [A]fria e escura.
[D]O Cristo guiará a [G]vossa estrada,
[D]Com sua paz infi[A]nita e [D]pura.`,
  },
];

// Escala cromática para transposição de acordes
const CHROMATIC_SCALE = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const FLAT_TO_SHARP_MAP: Record<string, string> = {
  Db: "C#",
  Eb: "D#",
  Gb: "F#",
  Ab: "G#",
  Bb: "A#",
};

const transposeChord = (chord: string, steps: number): string => {
  const match = chord.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return chord;
  let root = match[1];
  const rest = match[2];

  if (FLAT_TO_SHARP_MAP[root]) {
    root = FLAT_TO_SHARP_MAP[root];
  }

  const idx = CHROMATIC_SCALE.indexOf(root);
  if (idx === -1) return chord;

  let newIdx = (idx + steps) % 12;
  if (newIdx < 0) newIdx += 12;

  return CHROMATIC_SCALE[newIdx] + rest;
};

const transposeContent = (content: string, steps: number): string => {
  if (steps === 0) return content;
  return content.replace(/\[([A-G][#b]?[^\]]*)\]/g, (match, chord) => {
    return "[" + transposeChord(chord, steps) + "]";
  });
};

// Abre banco IndexedDB para salvar áudios e playlists
const openIndexedDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("apoio_espirita_musicas_v2", 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("faixas")) {
        db.createObjectStore("faixas", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("playlists")) {
        db.createObjectStore("playlists", { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

function MusicasCifrasPage() {
  const navigate = useNavigate();
  const { user, profile, loading, isDev, isPresident } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>("musicas");
  const [db, setDb] = useState<IDBDatabase | null>(null);

  // Estados de Áudio e Playlists
  const [tracks, setTracks] = useState<Track[]>([
    { id: "t01", title: "Harmonia das Virtudes", artist: "Sintetizador Meditativo", synthesized: true, synthType: "harmonizacao", durationLabel: "Gerado ao vivo" },
    { id: "t02", title: "Prece de Luz (Passe)", artist: "Sintetizador de Passe", synthesized: true, synthType: "passe", durationLabel: "Gerado ao vivo" },
  ]);
  const [playlists, setPlaylists] = useState<Playlist[]>([
    { id: "p01", name: "Todas as Músicas", trackIds: ["t01", "t02"] },
  ]);
  const [activePlaylistId, setActivePlaylistId] = useState<string>("p01");

  // Estado do Player
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0); // 0 a 100
  const [duration, setDuration] = useState(0); // em segundos
  const [currentTime, setCurrentTime] = useState(0); // em segundos

  // Referências de Áudio (Uploads locais)
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  // Referência de Áudio Sintetizado
  const synthInstanceRef = useRef<{ ctx: AudioContext; stop: () => void } | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Estados do Formulário de Envio
  const [newTitle, setNewTitle] = useState("");
  const [newArtist, setNewArtist] = useState("");
  const [newFile, setNewFile] = useState<File | null>(null);
  const [newIsExclusive, setNewIsExclusive] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [publishingTrackId, setPublishingTrackId] = useState<string | null>(null);

  // Estados de Nova Playlist
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [showPlaylistForm, setShowPlaylistForm] = useState(false);
  const [addingToPlaylistTrack, setAddingToPlaylistTrack] = useState<Track | null>(null);

  // Estados da Aba de Cifras
  const [cifrasSearch, setCifrasSearch] = useState("");
  const [selectedCifra, setSelectedCifra] = useState<CifraSong | null>(null);
  const [transposeSteps, setTransposeSteps] = useState(0);

  // Inicialização do IndexedDB e Supabase
  useEffect(() => {
    openIndexedDB()
      .then((database) => {
        setDb(database);
        loadIndexedDBAndSupabaseData(database);
      })
      .catch((err) => {
        console.error("IndexedDB Open Error:", err);
        loadIndexedDBAndSupabaseData(null);
      });
  }, [user, profile]);

  const loadIndexedDBAndSupabaseData = async (database: IDBDatabase | null) => {
    try {
      // 1. Carrega músicas do Supabase
      const { data: dbMusicas, error: dbError } = await supabase
        .from("musicas")
        .select("*")
        .order("created_at", { ascending: false });

      if (dbError) throw dbError;

      const supabaseTracks: Track[] = (dbMusicas ?? []).map((m: any) => ({
        id: m.id,
        title: m.title,
        artist: m.artist,
        audio_url: m.audio_url,
        is_exclusive: m.is_exclusive,
        sigla_casa: m.sigla_casa,
        user_id: m.user_id,
        durationLabel: m.is_exclusive ? "Exclusiva" : "Pública"
      }));

      // 2. Carrega faixas locais do IndexedDB
      let localFaixas: any[] = [];
      if (database) {
        const tx = database.transaction(["faixas"], "readonly");
        const store = tx.objectStore("faixas");
        localFaixas = await new Promise((resolve) => {
          const req = store.getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => resolve([]);
        });
      }

      // 3. Se houver faixas locais e o usuário estiver autenticado, tenta migrar para o Supabase
      let migratedTracksCount = 0;
      if (localFaixas.length > 0 && user) {
        setIsMigrating(true);
        toast.info(`Detectamos ${localFaixas.length} música(s) local(is). Migrando para nuvem...`);

        for (const localTrack of localFaixas) {
          try {
            if (localTrack.file) {
              const ext = localTrack.file.name ? localTrack.file.name.split(".").pop() : "mp3";
              const filename = `track_${Date.now()}_${crypto.randomUUID()}.${ext}`;
              const folder = profile?.sigla_casa || "geral";
              const path = `${folder}/${filename}`;

              // Upload para o storage
              const { error: uploadError } = await supabase.storage
                .from("musicas")
                .upload(path, localTrack.file, {
                  contentType: localTrack.file.type || "audio/mpeg",
                  upsert: false
                });

              if (uploadError) throw uploadError;

              const audioUrl = `https://kitmwxfwwujygcmdjngm.supabase.co/storage/v1/object/public/musicas/${path}`;

              // Registrar no banco
              const { error: insertError } = await supabase.from("musicas").insert({
                title: localTrack.title,
                artist: localTrack.artist,
                audio_url: audioUrl,
                is_exclusive: false,
                sigla_casa: profile?.sigla_casa || null,
                user_id: user.id
              });

              if (insertError) throw insertError;

              // Deletar do IndexedDB local
              const deleteTx = database!.transaction(["faixas"], "readwrite");
              await new Promise<void>((resolveDelete, rejectDelete) => {
                const deleteReq = deleteTx.objectStore("faixas").delete(localTrack.id);
                deleteReq.onsuccess = () => resolveDelete();
                deleteReq.onerror = () => rejectDelete(deleteReq.error);
              });
              migratedTracksCount++;
            }
          } catch (migrationErr: any) {
            console.error(`Erro ao migrar faixa ${localTrack.title}:`, migrationErr);
            toast.error(`Erro ao migrar música "${localTrack.title}": ${migrationErr.message || "Erro desconhecido"}`);
          }
        }
        setIsMigrating(false);

        if (migratedTracksCount > 0) {
          toast.success(`${migratedTracksCount} música(s) migrada(s) para nuvem com sucesso!`);
          // Recarrega tudo para atualizar as listas
          return loadIndexedDBAndSupabaseData(database);
        }
      }

      // 4. Mapear faixas locais restantes (que ainda não foram migradas)
      const remainingLocalTracks: Track[] = localFaixas.map((item: any) => ({
        id: item.id,
        title: item.title,
        artist: item.artist,
        file: item.file,
        durationLabel: "Áudio local"
      }));

      // 5. Montar lista de músicas final (inclui locais que ainda não foram migradas)
      const allTracks = [
        { id: "t01", title: "Harmonia das Virtudes", artist: "Sintetizador Meditativo", synthesized: true, synthType: "harmonizacao" as const, durationLabel: "Gerado ao vivo" },
        { id: "t02", title: "Prece de Luz (Passe)", artist: "Sintetizador de Passe", synthesized: true, synthType: "passe" as const, durationLabel: "Gerado ao vivo" },
        ...supabaseTracks,
        ...remainingLocalTracks
      ];
      setTracks(allTracks);

      // 6. Carrega Playlists
      if (database) {
        const playlistTx = database.transaction(["playlists"], "readonly");
        const playlistsStore = playlistTx.objectStore("playlists");
        const playlistsRequest = playlistsStore.getAll();

        playlistsRequest.onsuccess = () => {
          const dbPlaylists: Playlist[] = playlistsRequest.result;
          const defaultPlaylist: Playlist = {
            id: "p01",
            name: "Todas as Músicas",
            trackIds: allTracks.map((t) => t.id),
          };
          setPlaylists([defaultPlaylist, ...dbPlaylists]);
        };
      } else {
        const defaultPlaylist: Playlist = {
          id: "p01",
          name: "Todas as Músicas",
          trackIds: allTracks.map((t) => t.id),
        };
        setPlaylists([defaultPlaylist]);
      }
    } catch (err: any) {
      console.error("Erro ao carregar dados:", err);
      toast.error(`Erro ao carregar dados da nuvem: ${err.message || "Erro desconhecido"}`);
      // Fallback em caso de erro na consulta ao Supabase: carrega apenas locais do IndexedDB + sintetizadas
      if (database) {
        try {
          const tx = database.transaction(["faixas"], "readonly");
          const store = tx.objectStore("faixas");
          const localFaixas = await new Promise<any[]>((resolve) => {
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => resolve([]);
          });

          const localTracksMapped = localFaixas.map((item: any) => ({
            id: item.id,
            title: item.title,
            artist: item.artist,
            file: item.file,
            durationLabel: "Áudio local"
          }));

          const fallbackTracks = [
            { id: "t01", title: "Harmonia das Virtudes", artist: "Sintetizador Meditativo", synthesized: true, synthType: "harmonizacao" as const, durationLabel: "Gerado ao vivo" },
            { id: "t02", title: "Prece de Luz (Passe)", artist: "Sintetizador de Passe", synthesized: true, synthType: "passe" as const, durationLabel: "Gerado ao vivo" },
            ...localTracksMapped
          ];
          setTracks(fallbackTracks);

          const defaultPlaylist: Playlist = {
            id: "p01",
            name: "Todas as Músicas",
            trackIds: fallbackTracks.map((t) => t.id),
          };
          setPlaylists([defaultPlaylist]);
        } catch (localErr) {
          console.error("Erro no fallback local:", localErr);
        }
      }
    }
  };

  // Enviar áudio para o Supabase
  const handleUploadAudio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFile || !newTitle.trim() || !newArtist.trim() || !acceptTerms) return;

    if (!user) {
      toast.error("Você precisa estar logado para publicar músicas.");
      return;
    }
    if (!profile?.sigla_casa) {
      toast.error("Complete seu perfil com sua casa espírita para publicar músicas.");
      return;
    }

    setIsUploading(true);
    try {
      const ext = newFile.name.split(".").pop() || "mp3";
      const filename = `track_${Date.now()}_${crypto.randomUUID()}.${ext}`;
      const path = `${profile.sigla_casa}/${filename}`;

      // Upload do arquivo
      const { error: uploadError } = await supabase.storage
        .from("musicas")
        .upload(path, newFile, {
          contentType: newFile.type,
          upsert: false
        });

      if (uploadError) throw uploadError;

      const audioUrl = `https://kitmwxfwwujygcmdjngm.supabase.co/storage/v1/object/public/musicas/${path}`;

      // Salva no banco de dados
      const { error: insertError } = await supabase.from("musicas").insert({
        title: newTitle.trim(),
        artist: newArtist.trim(),
        audio_url: audioUrl,
        is_exclusive: newIsExclusive,
        sigla_casa: profile.sigla_casa,
        user_id: user.id
      });

      if (insertError) throw insertError;

      toast.success("Música publicada com sucesso!");
      setNewTitle("");
      setNewArtist("");
      setNewFile(null);
      setNewIsExclusive(false);
      setAcceptTerms(false);
      setShowUploadForm(false);

      await loadIndexedDBAndSupabaseData(db);
    } catch (err: any) {
      console.error("Erro no upload:", err);
      toast.error(`Erro ao publicar música: ${err.message || "Erro desconhecido"}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Publicar faixa local manualmente
  const handlePublishLocalTrack = async (track: Track) => {
    if (!user) {
      toast.error("Você precisa estar autenticado para publicar músicas.");
      return;
    }
    if (!track.file) {
      toast.error("Arquivo local não encontrado.");
      return;
    }

    setPublishingTrackId(track.id);
    try {
      const file = track.file as any;
      const ext = file.name ? file.name.split(".").pop() : "mp3";
      const filename = `track_${Date.now()}_${crypto.randomUUID()}.${ext}`;
      const folder = profile?.sigla_casa || "geral";
      const path = `${folder}/${filename}`;

      // Upload para o storage
      const { error: uploadError } = await supabase.storage
        .from("musicas")
        .upload(path, file, {
          contentType: file.type || "audio/mpeg",
          upsert: false
        });

      if (uploadError) throw uploadError;

      const audioUrl = `https://kitmwxfwwujygcmdjngm.supabase.co/storage/v1/object/public/musicas/${path}`;

      // Registrar no banco
      const { error: insertError } = await supabase.from("musicas").insert({
        title: track.title,
        artist: track.artist,
        audio_url: audioUrl,
        is_exclusive: false,
        sigla_casa: profile?.sigla_casa || null,
        user_id: user.id
      });

      if (insertError) throw insertError;

      // Deletar do IndexedDB local
      if (db) {
        const deleteTx = db.transaction(["faixas"], "readwrite");
        await new Promise<void>((resolveDelete, rejectDelete) => {
          const deleteReq = deleteTx.objectStore("faixas").delete(track.id);
          deleteReq.onsuccess = () => resolveDelete();
          deleteReq.onerror = () => rejectDelete(deleteReq.error);
        });
      }

      toast.success(`Música "${track.title}" disponibilizada online com sucesso!`);
      await loadIndexedDBAndSupabaseData(db);
    } catch (err: any) {
      console.error(`Erro ao publicar faixa ${track.title}:`, err);
      toast.error(`Erro ao publicar música: ${err.message || "Erro desconhecido"}`);
    } finally {
      setPublishingTrackId(null);
    }
  };

  // Deletar áudio do Supabase ou IndexedDB local
  const handleDeleteTrack = async (trackId: string) => {
    const track = tracks.find((t) => t.id === trackId);
    if (!track) return;

    if (!confirm(`Tem certeza que deseja excluir a música "${track.title}"?`)) return;

    try {
      if (track.user_id) {
        // Exclui do banco
        const { error: deleteDbError } = await supabase
          .from("musicas")
          .delete()
          .eq("id", trackId);

        if (deleteDbError) throw deleteDbError;

        // Exclui do storage
        if (track.audio_url) {
          const path = track.audio_url.replace(
            "https://kitmwxfwwujygcmdjngm.supabase.co/storage/v1/object/public/musicas/",
            ""
          );
          await supabase.storage.from("musicas").remove([path]);
        }

        toast.success("Música excluída com sucesso.");
      } else {
        // Exclui localmente caso tenha sobrado no IndexedDB
        if (db) {
          const tx = db.transaction(["faixas"], "readwrite");
          tx.objectStore("faixas").delete(trackId);
          toast.success("Música local excluída.");
        }
      }

      if (currentTrack?.id === trackId) {
        stopAudio();
      }

      await loadIndexedDBAndSupabaseData(db);
    } catch (err: any) {
      console.error("Erro ao deletar:", err);
      toast.error(`Erro ao excluir música: ${err.message}`);
    }
  };

  // Alterar status de exclusividade
  const handleToggleExclusive = async (track: Track) => {
    if (!track.user_id) return;

    const isAdmin = isDev || isPresident;
    const isOwner = user && user.id === track.user_id;

    if (!isOwner && !isAdmin) {
      toast.error("Você não tem permissão para alterar o status desta música.");
      return;
    }

    try {
      const nextExclusiveStatus = !track.is_exclusive;
      const { error } = await supabase
        .from("musicas")
        .update({ is_exclusive: nextExclusiveStatus })
        .eq("id", track.id);

      if (error) throw error;

      toast.success(
        nextExclusiveStatus
          ? "Música marcada como exclusiva da sua Casa Espírita!"
          : "Música definida como pública para todas as pessoas."
      );

      await loadIndexedDBAndSupabaseData(db);
    } catch (err: any) {
      console.error("Erro ao alternar exclusividade:", err);
      toast.error(`Erro ao atualizar exclusividade: ${err.message}`);
    }
  };

  // Criar playlist
  const handleCreatePlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !newPlaylistName.trim()) return;

    const newPlaylistId = "playlist_" + Date.now();
    const newPlaylist: Playlist = {
      id: newPlaylistId,
      name: newPlaylistName.trim(),
      trackIds: [],
    };

    const tx = db.transaction(["playlists"], "readwrite");
    const store = tx.objectStore("playlists");
    const request = store.put(newPlaylist);

    request.onsuccess = () => {
      setNewPlaylistName("");
      setShowPlaylistForm(false);
      loadIndexedDBAndSupabaseData(db);
    };
  };

  // Adicionar música a uma playlist
  const handleAddTrackToPlaylist = (playlistId: string, trackId: string) => {
    if (!db) return;
    const playlist = playlists.find((p) => p.id === playlistId);
    if (!playlist) return;

    // Evita duplicatas
    if (playlist.trackIds.includes(trackId)) {
      setAddingToPlaylistTrack(null);
      return;
    }

    const updatedPlaylist = {
      ...playlist,
      trackIds: [...playlist.trackIds, trackId],
    };

    const tx = db.transaction(["playlists"], "readwrite");
    const store = tx.objectStore("playlists");
    const request = store.put(updatedPlaylist);

    request.onsuccess = () => {
      setAddingToPlaylistTrack(null);
      loadIndexedDBAndSupabaseData(db);
    };
  };

  // ── SÍNTESE DE ÁUDIO AMBIENTE (WEB AUDIO API) ───────────────────────────────
  const startAmbientSynth = (type: "passe" | "harmonizacao") => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return null;
      const ctx = new AudioContextClass();

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(muted ? 0 : volume * 0.15, ctx.currentTime);
      masterGain.connect(ctx.destination);

      const oscs: OscillatorNode[] = [];
      const gains: GainNode[] = [];
      let intervalId: ReturnType<typeof setInterval>;

      if (type === "passe") {
        // Acorde lento relaxante de Fá maior que oscila
        const freqs = [174.61, 220.0, 261.63, 349.23]; // F3, A3, C4, F4
        freqs.forEach((f) => {
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(f, ctx.currentTime);

          gainNode.gain.setValueAtTime(0.02, ctx.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 3);
          gainNode.gain.linearRampToValueAtTime(0.02, ctx.currentTime + 6);

          osc.connect(gainNode);
          gainNode.connect(masterGain);
          oscs.push(osc);
          gains.push(gainNode);
          osc.start();
        });

        let phase = 0;
        intervalId = setInterval(() => {
          phase = (phase + 1) % 2;
          gains.forEach((g) => {
            g.gain.linearRampToValueAtTime(phase === 0 ? 0.05 : 0.02, ctx.currentTime + 3);
          });
        }, 3000);
      } else {
        // C Major 7 pad suave
        const freqs = [130.81, 196.0, 246.94, 329.63]; // C3, G3, B3, E4
        freqs.forEach((f) => {
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(f, ctx.currentTime);
          gainNode.gain.setValueAtTime(0.02, ctx.currentTime);
          osc.connect(gainNode);
          gainNode.connect(masterGain);
          oscs.push(osc);
          osc.start();
        });

        // Sinos pentatônicos aleatórios
        const chimes = [523.25, 587.33, 659.25, 783.99, 880.0, 987.77, 1046.5];
        intervalId = setInterval(() => {
          if (ctx.state === "suspended") return;
          const freq = chimes[Math.floor(Math.random() * chimes.length)];
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          gainNode.gain.setValueAtTime(0.03, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5);
          osc.connect(gainNode);
          gainNode.connect(masterGain);
          osc.start();
          osc.stop(ctx.currentTime + 2.5);
        }, 2200);
      }

      // Simulação de tempo decorrido para a barra do player
      setDuration(600); // 10 minutos
      setCurrentTime(0);

      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = setInterval(() => {
        setCurrentTime((t) => {
          const next = t + 1;
          setProgress((next / 600) * 100);
          return next;
        });
      }, 1000);

      return {
        ctx,
        stop: () => {
          clearInterval(intervalId);
          if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
          oscs.forEach((osc) => {
            try {
              osc.stop();
            } catch (e) {}
          });
          try {
            ctx.close();
          } catch (e) {}
        },
      };
    } catch (err) {
      console.error("Synthesizer error:", err);
      return null;
    }
  };

  // ── LOGICA DE REPRODUÇÃO ────────────────────────────────────────────────────
  const playTrack = (track: Track) => {
    stopAudio();
    setCurrentTrack(track);
    setPlaying(true);

    if (track.synthesized && track.synthType) {
      // Sintetizador
      const synth = startAmbientSynth(track.synthType);
      if (synth) synthInstanceRef.current = synth;
    } else if ((track.file || track.audio_url) && audioElRef.current) {
      // Arquivo local ou URL remota
      const audioUrl = track.file ? URL.createObjectURL(track.file) : track.audio_url;
      if (audioUrl) {
        audioElRef.current.src = audioUrl;
        audioElRef.current.volume = muted ? 0 : volume;
        audioElRef.current.play().catch((err) => console.error("Playback error:", err));

        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = setInterval(() => {
          if (audioElRef.current) {
            const cur = audioElRef.current.currentTime;
            const dur = audioElRef.current.duration || 0;
            setCurrentTime(cur);
            setDuration(dur);
            setProgress(dur > 0 ? (cur / dur) * 100 : 0);
          }
        }, 250);
      }
    }
  };

  const stopAudio = () => {
    setPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);

    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    if (synthInstanceRef.current) {
      synthInstanceRef.current.stop();
      synthInstanceRef.current = null;
    }

    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.src = "";
    }
  };

  const togglePlayPause = () => {
    if (!currentTrack) return;

    if (playing) {
      // Pausa
      setPlaying(false);
      if (synthInstanceRef.current) {
        synthInstanceRef.current.ctx.suspend();
      } else if (audioElRef.current) {
        audioElRef.current.pause();
      }
    } else {
      // Resume
      setPlaying(true);
      if (synthInstanceRef.current) {
        synthInstanceRef.current.ctx.resume();
      } else if (audioElRef.current) {
        audioElRef.current.play();
      }
    }
  };

  // Avançar faixa da playlist
  const skipNext = () => {
    const playlist = playlists.find((p) => p.id === activePlaylistId);
    if (!playlist || !currentTrack) return;
    const currentIdx = playlist.trackIds.indexOf(currentTrack.id);
    if (currentIdx === -1 || currentIdx + 1 >= playlist.trackIds.length) return;

    const nextTrackId = playlist.trackIds[currentIdx + 1];
    const nextTrack = tracks.find((t) => t.id === nextTrackId);
    if (nextTrack) playTrack(nextTrack);
  };

  // Voltar faixa
  const skipPrev = () => {
    const playlist = playlists.find((p) => p.id === activePlaylistId);
    if (!playlist || !currentTrack) return;
    const currentIdx = playlist.trackIds.indexOf(currentTrack.id);
    if (currentIdx <= 0) return;

    const prevTrackId = playlist.trackIds[currentIdx - 1];
    const prevTrack = tracks.find((t) => t.id === prevTrackId);
    if (prevTrack) playTrack(prevTrack);
  };

  // Atualizar volume
  const handleVolumeChange = (v: number) => {
    setVolume(v);
    if (v > 0) setMuted(false);
    if (audioElRef.current) {
      audioElRef.current.volume = v;
    }
  };

  // Evento fim da música local
  const handleAudioEnded = () => {
    skipNext();
  };

  // Formatar tempo (segundos -> MM:SS)
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs === 0) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Limpa instâncias ao sair
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  if (loading) return null;

  // Filtrar faixas da playlist ativa
  const activePlaylist = playlists.find((p) => p.id === activePlaylistId);
  const playlistTracks = activePlaylist
    ? activePlaylist.trackIds.map((tid) => tracks.find((t) => t.id === tid)).filter(Boolean) as Track[]
    : [];

  // Filtrar cifras
  const filteredCifras = CIFRAS_SONGS.filter(
    (song) =>
      song.title.toLowerCase().includes(cifrasSearch.toLowerCase()) ||
      song.artist.toLowerCase().includes(cifrasSearch.toLowerCase())
  );

  return (
    <main className="page-light min-h-screen px-4 pt-20 pb-36">
      
      {/* Elemento oculto de áudio */}
      <audio ref={audioElRef} onEnded={handleAudioEnded} className="hidden" />

      <div className="mx-auto max-w-5xl space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            to={user ? "/inicio" : "/"}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {user ? "Início" : "Voltar"}
          </Link>
          <span className="text-muted-foreground/40">|</span>
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-indigo-600" />
            <h1 className="text-lg font-semibold tracking-wide text-foreground">
              Músicas e Cifras
            </h1>
          </div>
        </div>

        {/* Abas */}
        <div className="flex border border-gray-200/80 mb-8 p-1 bg-slate-100 rounded-2xl max-w-md mx-auto shadow-inner">
          <button
            onClick={() => setActiveTab("musicas")}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "musicas"
                ? "bg-white text-indigo-600 shadow-sm border border-gray-200/50"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <Music size={14} />
            Playlists &amp; Músicas
          </button>
          <button
            onClick={() => setActiveTab("cifras")}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "cifras"
                ? "bg-white text-indigo-600 shadow-sm border border-gray-200/50"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <Guitar size={14} />
            Letras &amp; Cifras
          </button>
        </div>

        {/* ── ABA 1: PLAYLISTS E MÚSICAS ───────────────────────────────────────── */}
        {activeTab === "musicas" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-fade-in-up">
            
            {/* Playlists e Músicas (Esquerda, 2 colunas) */}
            <div className="lg:col-span-2 space-y-4">
              
              {/* Seleção de Playlists */}
              <div className="glass-premium rounded-2xl p-5 border border-gray-100 bg-white">
                <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                  <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-2">
                    <FolderHeart size={14} className="text-indigo-600" />
                    Playlists Criadas
                  </h3>
                  <button
                    onClick={() => setShowPlaylistForm(!showPlaylistForm)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 text-indigo-600 text-[10px] font-bold hover:bg-indigo-50 transition-colors uppercase tracking-wider"
                  >
                    <Plus size={12} strokeWidth={2.5} /> Nova Playlist
                  </button>
                </div>

                {showPlaylistForm && (
                  <form onSubmit={handleCreatePlaylist} className="flex gap-2 mb-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <input
                      type="text"
                      placeholder="Nome da nova playlist"
                      value={newPlaylistName}
                      onChange={(e) => setNewPlaylistName(e.target.value)}
                      required
                      className="flex-1 px-3 py-2 text-xs rounded-lg border border-gray-200"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors"
                    >
                      Criar
                    </button>
                  </form>
                )}

                {/* Grid de Playlists */}
                <div className="flex flex-wrap gap-2">
                  {playlists.map((pl) => (
                    <button
                      key={pl.id}
                      onClick={() => setActivePlaylistId(pl.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-medium border transition-all ${
                        activePlaylistId === pl.id
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                          : "bg-white border-gray-200 text-gray-600 hover:border-indigo-300"
                      }`}
                    >
                      {pl.name} ({pl.trackIds.length})
                    </button>
                  ))}
                </div>
              </div>

              {/* Lista de Músicas da Playlist Selecionada */}
              <div className="glass-premium rounded-2xl p-5 border border-gray-100 bg-white">
                <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-bold border-b border-gray-100 pb-3 mb-4">
                  Músicas em "{playlists.find((p) => p.id === activePlaylistId)?.name}"
                </h3>

                {playlistTracks.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 font-light text-xs">
                    Esta playlist está vazia. Adicione áudios usando a coluna ao lado!
                  </div>
                ) : (
                  <div className="space-y-2">
                    {playlistTracks.map((track) => {
                      const isCurrent = currentTrack?.id === track.id;
                      return (
                        <div
                          key={track.id}
                          className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 transition-all duration-300 ${
                            isCurrent
                              ? "border-indigo-300 bg-indigo-50/20"
                              : "border-gray-100 hover:bg-gray-50/50"
                          }`}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <button
                              onClick={() => isCurrent ? togglePlayPause() : playTrack(track)}
                              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                                isCurrent && playing
                                  ? "bg-indigo-600 border-indigo-600 text-white animate-pulse"
                                  : "bg-white border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                              }`}
                            >
                              {isCurrent && playing ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
                            </button>
                            <div className="truncate">
                              <p className={`text-xs font-semibold truncate ${isCurrent ? "text-indigo-800" : "text-gray-800"}`}>
                                {track.title}
                              </p>
                              <p className="text-[10px] text-gray-400 font-light truncate">{track.artist}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Marcação Exclusiva / Pública */}
                            {track.user_id ? (
                              (isDev || isPresident || user?.id === track.user_id) ? (
                                <button
                                  onClick={() => handleToggleExclusive(track)}
                                  className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-all duration-300 shadow-sm cursor-pointer uppercase tracking-wider ${
                                    track.is_exclusive
                                      ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                                      : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                                  }`}
                                  title="Clique para alternar privacidade da música"
                                >
                                  {track.is_exclusive ? <Lock size={11} strokeWidth={2.5} /> : <Globe size={11} strokeWidth={2.5} />}
                                  {track.is_exclusive ? "Exclusiva" : "Pública"}
                                </button>
                              ) : (
                                <span
                                  className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold border uppercase tracking-wider ${
                                    track.is_exclusive
                                      ? "bg-amber-50/50 border-amber-100 text-amber-600"
                                      : "bg-gray-50/50 border-gray-100 text-gray-400"
                                  }`}
                                >
                                  {track.is_exclusive ? <Lock size={11} strokeWidth={2.5} /> : <Globe size={11} strokeWidth={2.5} />}
                                  {track.is_exclusive ? "Exclusiva" : "Pública"}
                                </span>
                              )
                            ) : (
                              <div className="flex items-center gap-2">
                                {!track.synthesized && track.file && (
                                  <button
                                    onClick={() => handlePublishLocalTrack(track)}
                                    disabled={publishingTrackId === track.id}
                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-600 hover:border-emerald-700 transition-all shadow-sm cursor-pointer uppercase tracking-wider disabled:opacity-50"
                                    title="Publicar esta música na nuvem para disponibilizar a todos os usuários"
                                  >
                                    {publishingTrackId === track.id ? (
                                      <>
                                        <Loader2 size={11} className="animate-spin" />
                                        Publicando...
                                      </>
                                    ) : (
                                      <>
                                        <Globe size={11} />
                                        Disponibilizar Online
                                      </>
                                    )}
                                  </button>
                                )}
                                <span className="text-[10px] text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-xl font-bold uppercase tracking-wider">
                                  {track.durationLabel}
                                </span>
                              </div>
                            )}
                            
                            {/* Botão de adicionar à playlist */}
                            <button
                              onClick={() => setAddingToPlaylistTrack(track)}
                              className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                              title="Adicionar à Playlist..."
                            >
                              <Plus size={14} />
                            </button>

                            {/* Botão de deletar (se for do usuário logado ou admin) */}
                            {!track.synthesized && (!track.user_id || isDev || isPresident || user?.id === track.user_id) && (
                              <button
                                onClick={() => handleDeleteTrack(track.id)}
                                className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                title="Excluir música"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Seletor de adição à playlist */}
              {addingToPlaylistTrack && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-gray-100">
                    <h4 className="text-sm font-semibold text-gray-800 border-b border-gray-100 pb-2">
                      Adicionar "{addingToPlaylistTrack.title}" a:
                    </h4>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {playlists
                        .filter((p) => p.id !== "p01")
                        .map((p) => (
                          <button
                            key={p.id}
                            onClick={() => handleAddTrackToPlaylist(p.id, addingToPlaylistTrack.id)}
                            className="w-full text-left px-4 py-2.5 rounded-xl border border-gray-100 hover:bg-indigo-50/50 hover:border-indigo-200 text-xs transition-colors"
                          >
                            {p.name}
                          </button>
                        ))}
                      {playlists.filter((p) => p.id !== "p01").length === 0 && (
                        <p className="text-xs text-gray-400 text-center py-4">Nenhuma playlist personalizada criada.</p>
                      )}
                    </div>
                    <button
                      onClick={() => setAddingToPlaylistTrack(null)}
                      className="w-full py-2.5 rounded-xl border border-gray-200 text-xs font-semibold hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Envio de Áudio e Termo (Direita, 1 coluna) */}
            <div className="space-y-4">
              
              <div className="glass-premium rounded-3xl p-6 border border-amber-100 bg-white shadow-md space-y-6">
                
                <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
                  <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-1.5">
                    <Shield size={14} className="text-amber-500" />
                    Estúdio do Tarefeiro
                  </h3>
                  <button
                    onClick={() => setShowUploadForm(!showUploadForm)}
                    className="text-[10px] font-bold text-indigo-600 hover:underline uppercase tracking-wider"
                  >
                    {showUploadForm ? "Fechar" : "Adicionar Áudio"}
                  </button>
                </div>

                {!showUploadForm ? (
                  <div className="text-center py-4 space-y-3">
                    <FileMusic size={40} className="text-gray-300 mx-auto stroke-[1.2]" />
                    <p className="text-xs text-gray-500 leading-relaxed font-light">
                      Músicos da casa espírita podem adicionar suas próprias músicas e preces em áudio de forma 100% local e ouvi-las a qualquer momento.
                    </p>
                    <button
                      onClick={() => setShowUploadForm(true)}
                      className="py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors cursor-pointer"
                    >
                      Adicionar Minha Música
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleUploadAudio} className="space-y-4 animate-fade-in-up">
                    
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-gray-400">Nome da Música *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Prece de Cáritas Cantada"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="w-full rounded-xl bg-white border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-gray-400">Cantor / Intérprete *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Coral Caminho da Luz"
                        value={newArtist}
                        onChange={(e) => setNewArtist(e.target.value)}
                        className="w-full rounded-xl bg-white border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-gray-400">Arquivo de Áudio (.mp3, .wav, .m4a) *</label>
                      <input
                        type="file"
                        required
                        accept="audio/*"
                        onChange={(e) => setNewFile(e.target.files?.[0] || null)}
                        className="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                      />
                    </div>

                    {/* Opção de Exclusividade */}
                    {profile?.sigla_casa && (
                      <div className="border border-indigo-100 bg-indigo-50/20 rounded-2xl p-4 space-y-2">
                        <label className="flex items-start gap-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newIsExclusive}
                            onChange={(e) => setNewIsExclusive(e.target.checked)}
                            className="mt-0.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <div className="space-y-0.5">
                            <span className="text-[10.5px] text-gray-800 font-bold flex items-center gap-1">
                              <Lock size={12} className="text-amber-500 shrink-0" />
                              Música exclusiva da minha Casa Espírita
                            </span>
                            <p className="text-[9.5px] text-gray-500 font-light leading-relaxed">
                              Se marcado, este áudio ficará visível apenas para os membros da casa <strong className="font-semibold text-indigo-600">{profile.sigla_casa}</strong>. Caso contrário, estará disponível para todas as pessoas.
                            </p>
                          </div>
                        </label>
                      </div>
                    )}

                    {/* Termo de autorização fraterna */}
                    <div className="border border-amber-200 bg-amber-50/30 rounded-2xl p-4 space-y-3">
                      <h4 className="text-[10px] uppercase tracking-wider font-extrabold text-amber-800 flex items-center gap-1.5">
                        <Sparkles size={12} />
                        Autorização e Direitos Fraternos
                      </h4>
                      <p className="text-[9px] text-amber-900 leading-relaxed font-light">
                        Eu, na qualidade de autor(a) e/ou intérprete legítimo(a), declaro e autorizo a veiculação, reprodução e propagação gratuita da obra musical enviada na plataforma Apoio Espírita.
                        <br />
                        <br />
                        Concordo que esta veiculação é de caráter puramente fraterno, educativo e espiritual, sendo realizada sem qualquer ônus financeiro ou cobrança de direitos autorais, taxas ou compensações de qualquer natureza, tanto no presente quanto no futuro.
                      </p>
                      
                      <label className="flex items-start gap-2 pt-1 cursor-pointer">
                        <input
                          type="checkbox"
                          required
                          checked={acceptTerms}
                          onChange={(e) => setAcceptTerms(e.target.checked)}
                          className="mt-0.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-[10px] text-amber-950 font-bold leading-normal">
                          Declaro ser o autor ou possuir os direitos desta gravação e aceito os termos de autorização fraterna.
                        </span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={isUploading || !acceptTerms || !newFile || !newTitle.trim() || !newArtist.trim()}
                      className="w-full py-3 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 transition-all shadow-sm cursor-pointer uppercase tracking-wider flex items-center justify-center gap-2"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Publicando...
                        </>
                      ) : (
                        "Publicar Música"
                      )}
                    </button>
                  </form>
                )}

              </div>

            </div>

          </div>
        )}

        {/* ── ABA 2: CIFRAS E LETRAS ───────────────────────────────────────────── */}
        {activeTab === "cifras" && (
          <div className="space-y-6 animate-fade-in-up">
            
            {/* Buscador de cifras */}
            <div className="relative">
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar cifras por título de música ou cantor..."
                value={cifrasSearch}
                onChange={(e) => setCifrasSearch(e.target.value)}
                className="w-full rounded-xl bg-white border border-gray-200 pl-10 pr-4 py-3.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Visualização Principal da Cifra Selecionada */}
            {selectedCifra ? (
              <div className="glass-premium rounded-3xl p-6 border border-indigo-100 bg-white shadow-md space-y-5 animate-fade-in-up">
                
                {/* Cabeçalho da Cifra */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                      {selectedCifra.category}
                    </span>
                    <h2 className="text-xl font-bold text-gray-800 font-serif mt-2">{selectedCifra.title}</h2>
                    <p className="text-xs text-gray-400 font-light">{selectedCifra.artist}</p>
                  </div>

                  {/* Controle de Transposição de Tom */}
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-500 px-2 font-mono">
                      Tom: {transposeSteps === 0 ? "Original" : `${transposeSteps > 0 ? "+" : ""}${transposeSteps}`}
                    </span>
                    <button
                      onClick={() => setTransposeSteps((s) => s - 1)}
                      className="p-1.5 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-gray-600 transition-colors"
                      title="Diminuir 1 tom"
                    >
                      <ChevronDown size={14} />
                    </button>
                    <button
                      onClick={() => setTransposeSteps(0)}
                      disabled={transposeSteps === 0}
                      className="px-2 py-1.5 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-[10px] font-bold text-gray-600 transition-colors disabled:opacity-50"
                      title="Restaurar tom original"
                    >
                      Reset
                    </button>
                    <button
                      onClick={() => setTransposeSteps((s) => s + 1)}
                      className="p-1.5 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-gray-600 transition-colors"
                      title="Aumentar 1 tom"
                    >
                      <ChevronUp size={14} />
                    </button>
                  </div>
                </div>

                {/* Exibição da Letra e Acordes */}
                <div className="bg-slate-900 rounded-2xl p-6 overflow-x-auto shadow-inner border border-slate-950">
                  <pre className="font-mono text-sm leading-relaxed text-cyan-400 whitespace-pre">
                    {/* Renderiza o conteúdo transposto dinamicamente */}
                    {transposeContent(selectedCifra.content, transposeSteps)}
                  </pre>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                  <button
                    onClick={() => {
                      setSelectedCifra(null);
                      setTransposeSteps(0);
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-800 transition-colors font-semibold"
                  >
                    ← Voltar para lista de cifras
                  </button>
                </div>

              </div>
            ) : (
              /* Grid de seleção de cifras */
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {filteredCifras.map((song) => (
                  <div
                    key={song.id}
                    onClick={() => setSelectedCifra(song)}
                    className="glass-premium hover-premium rounded-2xl p-5 border border-gray-100 bg-white cursor-pointer flex flex-col justify-between h-full group"
                  >
                    <div className="space-y-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                        <Guitar size={20} strokeWidth={1.5} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors leading-snug">
                          {song.title}
                        </h3>
                        <p className="text-[11px] text-gray-400 font-light mt-0.5">{song.artist}</p>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-gray-50 flex items-center justify-between mt-4">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                        {song.category}
                      </span>
                      <span className="text-[10px] font-bold text-indigo-600 hover:underline">Ver Cifra →</span>
                    </div>
                  </div>
                ))}

                {filteredCifras.length === 0 && (
                  <div className="col-span-full text-center py-12 text-gray-400 font-light text-xs bg-white rounded-2xl border border-gray-100">
                    Nenhuma cifra espírita localizada para o termo inserido.
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </div>

      {/* ── PLAYER DE ÁUDIO STICKY (SÓ SE EXIBE SE HOUVER FAIXA ATIVA) ─────────────────── */}
      {currentTrack && (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-950 text-white z-40 px-6 py-4 md:py-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xl">
          
          {/* Metadata da faixa tocando */}
          <div className="flex items-center gap-3 w-full md:w-64">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
              <Music size={20} className={playing ? "animate-spin-slow" : ""} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate text-slate-200">{currentTrack.title}</p>
              <p className="text-[10px] text-slate-400 truncate">{currentTrack.artist}</p>
            </div>
          </div>

          {/* Controles de Reprodução e Barra de Progresso */}
          <div className="flex flex-col items-center gap-1.5 flex-1 w-full max-w-xl">
            <div className="flex items-center gap-4">
              <button
                onClick={skipPrev}
                disabled={playlists.find((p) => p.id === activePlaylistId)?.trackIds.indexOf(currentTrack.id) === 0}
                className="text-slate-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Música anterior"
              >
                <ChevronDown size={22} className="rotate-90" />
              </button>

              <button
                onClick={togglePlayPause}
                className="w-10 h-10 rounded-full bg-white text-slate-900 flex items-center justify-center hover:scale-105 transition-transform font-bold"
              >
                {playing ? <Pause size={18} strokeWidth={2.5} /> : <Play size={18} strokeWidth={2.5} className="ml-0.5" />}
              </button>

              <button
                onClick={skipNext}
                disabled={
                  playlists.find((p) => p.id === activePlaylistId)?.trackIds.indexOf(currentTrack.id) ===
                  (playlists.find((p) => p.id === activePlaylistId)?.trackIds.length ?? 0) - 1
                }
                className="text-slate-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Próxima música"
              >
                <ChevronUp size={22} className="rotate-90" />
              </button>
            </div>

            {/* Timeline */}
            <div className="flex items-center gap-2.5 w-full text-[10px] text-slate-400 font-mono">
              <span className="w-8 text-right">{formatTime(currentTime)}</span>
              <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden relative group">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="w-8 text-left">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-3 w-full md:w-48 justify-end">
            <button
              onClick={() => setMuted(!muted)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              {muted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={muted ? 0 : volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-20 accent-indigo-500 h-1 rounded-full cursor-pointer bg-slate-800"
            />
          </div>

        </div>
      )}

    </main>
  );
}
