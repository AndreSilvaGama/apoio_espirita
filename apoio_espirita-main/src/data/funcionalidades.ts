import {
  Cake,
  CalendarCheck,
  CalendarDays,
  CalendarRange,
  Car,
  Cast,
  CircleHelp,
  ClipboardCheck,
  Clock,
  FileHeart,
  Film,
  Flame,
  Gamepad2,
  Gavel,
  HeartHandshake,
  Library,
  Megaphone,
  MessageCircle,
  MonitorPlay,
  Music,
  PenLine,
  Radio,
  ShoppingBag,
  Sparkles,
  Sprout,
  Sunrise,
  Trello,
  Truck,
  Users,
  UsersRound,
  Video,
  Wrench,
  type LucideIcon,
} from "lucide-react";

/**
 * Catálogo único das funcionalidades exibidas em cartões.
 *
 * Lido pela tela inicial (`/inicio`) e pela página da casa espírita
 * (`/casa/$sigla`). As duas telas mantinham cópias separadas da mesma lista e
 * elas divergiram: recursos já publicados continuaram anunciados como
 * "Em breve". Alterar apenas este arquivo mantém as duas telas iguais.
 *
 * Regra para `status`: "disponivel" exige `href` de uma rota que já existe e
 * funciona em produção, ou `casaAba` de uma aba que já existe na página da
 * casa. "beta" é para o recurso que já está no ar mas ainda não faz tudo o
 * que a descrição do roadmap promete — a descrição precisa dizer o que falta.
 * Enquanto o recurso não estiver no ar, o correto é "breve" — sem `href`.
 */
export type FuncionalidadeStatus = "disponivel" | "breve" | "beta";

export interface FuncionalidadeItem {
  Icon: LucideIcon;
  title: string;
  desc: string;
  status: FuncionalidadeStatus;
  casa?: boolean;
  href?: string;
  /**
   * Recurso que vive dentro da pagina da casa espirita, na aba indicada.
   * O cartao leva para `/casa/<sigla do membro>?aba=<casaAba>` — nao existe
   * rota propria para ele.
   */
  casaAba?: "mural" | "painel" | "programacao" | "doacoes" | "tarefeiros";
}

export interface FuncionalidadeCategoria {
  label: string;
  SectionIcon: LucideIcon;
  color: string;
  iconColor: string;
  bg: string;
  border: string;
  borderB: string;
  items: FuncionalidadeItem[];
}

export const FUNCIONALIDADES: FuncionalidadeCategoria[] = [
  {
    label: "Vida Espiritual",
    SectionIcon: Flame,
    color: "text-violet-700",
    iconColor: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-200",
    borderB: "border-violet-200",
    items: [
      {
        Icon: PenLine,
        title: "Artigos e Colunistas",
        desc: "Textos escritos por membros da sua comunidade, com identificação do autor e da casa.",
        status: "disponivel",
        href: "/artigos",
      },
      {
        Icon: Music,
        title: "Músicas e Cifras",
        desc: "Playlists espíritas para passes, estudos, envio de áudios e cifras/partituras com transposição de tom.",
        status: "disponivel",
        href: "/musicas-cifras",
      },
      {
        Icon: Sprout,
        title: "Evangelização Infantil",
        desc: "Módulo escolar com recursos lúdicos, jogos e atividades para a formação das crianças.",
        status: "disponivel",
        href: "/evangelizacao",
      },
      {
        Icon: Library,
        title: "Biblioteca de Orientações",
        desc: "Documentos e orientações públicas da FEB reunidos para consulta e download pelos trabalhadores.",
        status: "disponivel",
        href: "/feb",
      },
      {
        Icon: Sunrise,
        title: "Mensagem do Dia",
        desc: "Cada membro envia uma mensagem para a fila da casa. A mensagem do dia aparece na tela inicial e a fila fica visível a todos.",
        status: "disponivel",
        href: "/mensagem-do-dia",
      },
      {
        Icon: Radio,
        title: "Rádio Espírita",
        desc: "Programação espírita para ouvir durante o trabalho, o estudo ou o passe.",
        status: "disponivel",
        href: "/radio",
      },
      {
        Icon: Sparkles,
        title: "Área de Jovens Espíritas",
        desc: "Conteúdo, eventos e comunidade exclusivos para jovens trabalhadores da vinha.",
        status: "breve",
      },
      {
        Icon: Gamepad2,
        title: "Jogos Educativos",
        desc: "Jogos sobre os livros da codificação espírita e atividades para todas as idades.",
        status: "disponivel",
        href: "/jogos",
      },
      {
        Icon: Cake,
        title: "Aniversariantes do Mês",
        desc: "Calendário de aniversários dos membros. Aparece em destaque no topo da home no mês do aniversário.",
        status: "breve",
      },
      {
        Icon: Clock,
        title: "Plantão de Orações",
        desc: "Membros se inscrevem em horários de oração coletiva à distância. Agenda semanal visível para todos.",
        status: "breve",
      },
    ],
  },
  {
    label: "Nossa Comunidade",
    SectionIcon: UsersRound,
    color: "text-cyan-700",
    iconColor: "text-cyan-700",
    bg: "bg-cyan-50",
    border: "border-cyan-200",
    borderB: "border-cyan-200",
    items: [
      {
        Icon: MessageCircle,
        title: "Fórum de Apoio",
        desc: "Espaço fraterno de perguntas, respostas e acolhimento espiritual entre membros.",
        status: "breve",
      },
      {
        Icon: Users,
        title: "Comunicação em Grupos",
        desc: "Grupos internos por tipo de atividade, semelhante a grupos de WhatsApp — dentro da plataforma.",
        status: "breve",
      },
      {
        Icon: HeartHandshake,
        title: "Localização de Voluntariado",
        desc: "Matchmaking entre as habilidades dos membros e as necessidades da comunidade.",
        status: "breve",
      },
      {
        Icon: ShoppingBag,
        title: "Bazar On-line",
        desc: "Livros, artesanatos e itens da comunidade com integração PIX para doações.",
        status: "breve",
      },
      {
        Icon: Car,
        title: "Carona Solidária",
        desc: "Membros com carro se disponibilizam para dar carona a quem precisa — da mesma casa ou de outra.",
        status: "breve",
      },
      {
        Icon: Truck,
        title: "Entrega Solidária",
        desc: "Voluntários se oferecem para entregar itens comprados no bazar — com agendamento e confirmação.",
        status: "breve",
      },
      {
        Icon: Megaphone,
        title: "Mural de Avisos",
        desc: "Quadro digital da casa: quem administra a página publica comunicados com foto e vídeo, fixa o que é importante no topo, edita e apaga. Todos os membros da casa leem — o visitante de fora, não.",
        status: "disponivel",
        casa: true,
        casaAba: "mural",
      },
      {
        Icon: FileHeart,
        title: "Ficha de Atendimento Fraterno",
        desc: "Formulário confidencial para registro de pessoas atendidas. Acessível apenas pelo coordenador de assistência.",
        status: "breve",
      },
    ],
  },
  {
    label: "Agenda & Eventos",
    SectionIcon: CalendarCheck,
    color: "text-amber-700",
    iconColor: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    borderB: "border-amber-200",
    items: [
      {
        Icon: CalendarDays,
        title: "Agenda de Eventos e Reuniões",
        desc: "Calendário completo com confirmação de presença e relatório de presenças por membro.",
        status: "disponivel",
        href: "/agenda",
      },
      {
        Icon: ClipboardCheck,
        title: "Caderno de Presença Digital",
        desc: "Membros marcam presença nas reuniões pelo celular com um toque. Coordenador vê relatório por reunião e por membro.",
        status: "disponivel",
        href: "/agenda",
      },
      {
        Icon: Trello,
        title: "Kanban de Projetos",
        desc: "Quadro de projetos da casa por frente de trabalho: listas, cartões, prazos, checklists e comentários.",
        status: "disponivel",
        href: "/kanban",
      },
      {
        Icon: Cast,
        title: "Live Streaming",
        desc: "Transmissão ao vivo das palestras pelo celular — um transmite, todos acompanham.",
        status: "breve",
      },
      {
        Icon: Video,
        title: "Google Meet",
        desc: "Videoconferências integradas à plataforma para reuniões remotas.",
        status: "breve",
      },
      {
        Icon: Film,
        title: "Integração de Vídeos",
        desc: "Palestras gravadas, arquivos em vídeo e integração com StreamYard.",
        status: "breve",
      },
      {
        Icon: CalendarRange,
        title: "Escala de Trabalho",
        desc: "Quadro de palestras e escalas da casa: dia, tema, facilitador, coordenador, passe e recepção. Quem administra a página monta, e a escala vencida se arquiva sozinha. Ainda não avisa cada tarefeiro da própria escala.",
        status: "beta",
        casa: true,
        casaAba: "painel",
      },
    ],
  },
  {
    label: "Recursos & Ferramentas",
    SectionIcon: Wrench,
    color: "text-emerald-700",
    iconColor: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    borderB: "border-emerald-200",
    items: [
      {
        Icon: Gavel,
        title: "Transparência",
        desc: "Prestação de contas aberta da plataforma: o que é mantido, como é mantido e por quem.",
        status: "disponivel",
        href: "/transparencia",
      },
      {
        Icon: MonitorPlay,
        title: "Player de PowerPoint",
        desc: "Apresente arquivos de PowerPoint diretamente na plataforma, sem instalações.",
        status: "breve",
      },
      {
        Icon: CircleHelp,
        title: "FAQ",
        desc: "Perguntas e respostas detalhadas sobre o uso do site e a doutrina espírita.",
        status: "disponivel",
        href: "/ajuda",
      },
    ],
  },
];

export const FUNCIONALIDADE_STATUS_LABEL: Record<FuncionalidadeStatus, string> = {
  disponivel: "Disponível",
  breve: "Em breve",
  beta: "Beta",
};

export const FUNCIONALIDADE_STATUS_STYLE: Record<FuncionalidadeStatus, string> = {
  disponivel: "bg-emerald-100 text-emerald-700 border-emerald-200",
  breve: "bg-amber-50 text-amber-600 border-amber-200",
  beta: "bg-blue-50 text-blue-600 border-blue-200",
};
