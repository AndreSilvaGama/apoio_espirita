import {
  Heart,
  HeartHandshake,
  UserRound,
  Clock,
  RotateCcw,
  Star,
  Shield,
  CircleCheck,
  Smile,
  Gift,
  type LucideIcon,
} from "lucide-react";

export type ModoJogo = "virtudes" | "evangelho";
export type Dificuldade = "facil" | "medio" | "dificil";

export const PARES_POR_DIFICULDADE: Record<Dificuldade, number> = {
  facil: 6,
  medio: 8,
  dificil: 10,
};

export interface ParVirtude {
  id: string;
  virtude: string;
  Icone: LucideIcon;
  cor: string;
  corIcone: string;
}

export interface ParEvangelho {
  id: string;
  palavra: string;
  significado: string;
  cor: string;
}

export const VIRTUDES: ParVirtude[] = [
  { id: "amor",          virtude: "Amor",          Icone: Heart,         cor: "bg-rose-100",   corIcone: "text-rose-500"   },
  { id: "caridade",      virtude: "Caridade",      Icone: HeartHandshake,cor: "bg-pink-100",   corIcone: "text-pink-500"   },
  { id: "humildade",     virtude: "Humildade",     Icone: UserRound,     cor: "bg-violet-100", corIcone: "text-violet-500" },
  { id: "paciencia",     virtude: "Paciência",     Icone: Clock,         cor: "bg-blue-100",   corIcone: "text-blue-500"   },
  { id: "perdao",        virtude: "Perdão",        Icone: RotateCcw,     cor: "bg-teal-100",   corIcone: "text-teal-500"   },
  { id: "gratidao",      virtude: "Gratidão",      Icone: Star,          cor: "bg-yellow-100", corIcone: "text-yellow-500" },
  { id: "respeito",      virtude: "Respeito",      Icone: Shield,        cor: "bg-indigo-100", corIcone: "text-indigo-500" },
  { id: "honestidade",   virtude: "Honestidade",   Icone: CircleCheck,   cor: "bg-green-100",  corIcone: "text-green-500"  },
  { id: "bondade",       virtude: "Bondade",       Icone: Smile,         cor: "bg-orange-100", corIcone: "text-orange-500" },
  { id: "generosidade",  virtude: "Generosidade",  Icone: Gift,          cor: "bg-cyan-100",   corIcone: "text-cyan-500"   },
];

export const PALAVRAS_EVANGELHO: ParEvangelho[] = [
  { id: "amor",       palavra: "Amor",       significado: "Gostar de todos, até de quem nos faz mal",         cor: "bg-rose-100"   },
  { id: "paz",        palavra: "Paz",        significado: "Viver bem com todos, sem brigas ou mágoas",         cor: "bg-sky-100"    },
  { id: "perdao",     palavra: "Perdão",     significado: "Deixar a mágoa ir embora e continuar amigo",        cor: "bg-teal-100"   },
  { id: "esperanca",  palavra: "Esperança",  significado: "Acreditar que coisas boas vão acontecer",           cor: "bg-yellow-100" },
  { id: "oracao",     palavra: "Oração",     significado: "Conversar com Deus de coração aberto",              cor: "bg-purple-100" },
  { id: "bondade",    palavra: "Bondade",    significado: "Ser gentil e legal com todos ao redor",             cor: "bg-orange-100" },
  { id: "verdade",    palavra: "Verdade",    significado: "Falar sempre o que aconteceu de verdade",           cor: "bg-green-100"  },
  { id: "humildade",  palavra: "Humildade",  significado: "Saber que sempre podemos aprender mais",            cor: "bg-indigo-100" },
  { id: "gratidao",   palavra: "Gratidão",   significado: "Agradecer pelas coisas boas que recebemos",        cor: "bg-amber-100"  },
  { id: "caridade",   palavra: "Caridade",   significado: "Ajudar quem precisa com alegria no coração",        cor: "bg-pink-100"   },
];
