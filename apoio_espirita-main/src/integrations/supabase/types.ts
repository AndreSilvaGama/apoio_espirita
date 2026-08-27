export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.17";
  };
  public: {
    Tables: {
      administradores_pagina: {
        Row: {
          adicionado_por: string | null;
          created_at: string;
          sigla_casa: string;
          user_id: string;
        };
        Insert: {
          adicionado_por?: string | null;
          created_at?: string;
          sigla_casa: string;
          user_id: string;
        };
        Update: {
          adicionado_por?: string | null;
          created_at?: string;
          sigla_casa?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "administradores_pagina_adicionado_por_fkey";
            columns: ["adicionado_por"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "administradores_pagina_adicionado_por_fkey";
            columns: ["adicionado_por"];
            isOneToOne: false;
            referencedRelation: "profiles_public";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "administradores_pagina_sigla_casa_fkey";
            columns: ["sigla_casa"];
            isOneToOne: false;
            referencedRelation: "siglas_casas";
            referencedColumns: ["sigla"];
          },
          {
            foreignKeyName: "administradores_pagina_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "administradores_pagina_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles_public";
            referencedColumns: ["id"];
          },
        ];
      };
      agenda_eventos: {
        Row: {
          aceita_confirmacao: boolean;
          ata: string | null;
          created_at: string;
          criador_id: string;
          criador_nome: string;
          data_fim: string | null;
          data_inicio: string;
          descricao: string | null;
          id: string;
          local: string | null;
          sigla_casa: string;
          tipo: string;
          titulo: string;
        };
        Insert: {
          aceita_confirmacao?: boolean;
          ata?: string | null;
          created_at?: string;
          criador_id: string;
          criador_nome: string;
          data_fim?: string | null;
          data_inicio: string;
          descricao?: string | null;
          id?: string;
          local?: string | null;
          sigla_casa: string;
          tipo?: string;
          titulo: string;
        };
        Update: {
          aceita_confirmacao?: boolean;
          ata?: string | null;
          created_at?: string;
          criador_id?: string;
          criador_nome?: string;
          data_fim?: string | null;
          data_inicio?: string;
          descricao?: string | null;
          id?: string;
          local?: string | null;
          sigla_casa?: string;
          tipo?: string;
          titulo?: string;
        };
        Relationships: [
          {
            foreignKeyName: "agenda_eventos_criador_id_fkey";
            columns: ["criador_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "agenda_eventos_criador_id_fkey";
            columns: ["criador_id"];
            isOneToOne: false;
            referencedRelation: "profiles_public";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "agenda_eventos_sigla_casa_fkey";
            columns: ["sigla_casa"];
            isOneToOne: false;
            referencedRelation: "siglas_casas";
            referencedColumns: ["sigla"];
          },
        ];
      };
      agenda_participantes: {
        Row: {
          confirmado: boolean | null;
          created_at: string;
          evento_id: string;
          id: string;
          presente: boolean;
          user_id: string;
        };
        Insert: {
          confirmado?: boolean | null;
          created_at?: string;
          evento_id: string;
          id?: string;
          presente?: boolean;
          user_id: string;
        };
        Update: {
          confirmado?: boolean | null;
          created_at?: string;
          evento_id?: string;
          id?: string;
          presente?: boolean;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "agenda_participantes_evento_id_fkey";
            columns: ["evento_id"];
            isOneToOne: false;
            referencedRelation: "agenda_eventos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "agenda_participantes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "agenda_participantes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles_public";
            referencedColumns: ["id"];
          },
        ];
      };
      artigo_avaliacoes: {
        Row: {
          artigo_id: string;
          avaliador_nome: string | null;
          created_at: string;
          descricao_erro: string | null;
          editado_em: string | null;
          id: string;
          tipo: string;
          user_id: string;
        };
        Insert: {
          artigo_id: string;
          avaliador_nome?: string | null;
          created_at?: string;
          descricao_erro?: string | null;
          editado_em?: string | null;
          id?: string;
          tipo: string;
          user_id: string;
        };
        Update: {
          artigo_id?: string;
          avaliador_nome?: string | null;
          created_at?: string;
          descricao_erro?: string | null;
          editado_em?: string | null;
          id?: string;
          tipo?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "artigo_avaliacoes_artigo_id_fkey";
            columns: ["artigo_id"];
            isOneToOne: false;
            referencedRelation: "artigos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "artigo_avaliacoes_artigo_id_fkey";
            columns: ["artigo_id"];
            isOneToOne: false;
            referencedRelation: "artigos_publicos";
            referencedColumns: ["id"];
          },
        ];
      };
      artigo_revisoes: {
        Row: {
          aberta_em: string;
          artigo_id: string;
          decidida_em: string | null;
          decidida_por: string | null;
          decisao: string | null;
          estado: string;
          id: string;
          justificativa: string | null;
          origem: string;
        };
        Insert: {
          aberta_em?: string;
          artigo_id: string;
          decidida_em?: string | null;
          decidida_por?: string | null;
          decisao?: string | null;
          estado?: string;
          id?: string;
          justificativa?: string | null;
          origem: string;
        };
        Update: {
          aberta_em?: string;
          artigo_id?: string;
          decidida_em?: string | null;
          decidida_por?: string | null;
          decisao?: string | null;
          estado?: string;
          id?: string;
          justificativa?: string | null;
          origem?: string;
        };
        Relationships: [
          {
            foreignKeyName: "artigo_revisoes_artigo_id_fkey";
            columns: ["artigo_id"];
            isOneToOne: false;
            referencedRelation: "artigos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "artigo_revisoes_artigo_id_fkey";
            columns: ["artigo_id"];
            isOneToOne: false;
            referencedRelation: "artigos_publicos";
            referencedColumns: ["id"];
          },
        ];
      };
      artigos: {
        Row: {
          autor_id: string;
          autor_nome: string;
          autor_sigla_casa: string | null;
          aval_bom: number;
          aval_erro: number;
          aval_erro_grave: number;
          aval_gostei: number;
          aval_nao_gostei: number;
          aval_otimo: number;
          conteudo: string;
          created_at: string;
          editado_em: string | null;
          estado: string;
          id: string;
          publicado_em: string;
          resumo: string | null;
          retirado_em: string | null;
          retirado_motivo: string | null;
          retirado_por: string | null;
          retirado_por_user_id: string | null;
          slug: string;
          titulo: string;
        };
        Insert: {
          autor_id: string;
          autor_nome: string;
          autor_sigla_casa?: string | null;
          aval_bom?: number;
          aval_erro?: number;
          aval_erro_grave?: number;
          aval_gostei?: number;
          aval_nao_gostei?: number;
          aval_otimo?: number;
          conteudo: string;
          created_at?: string;
          editado_em?: string | null;
          estado?: string;
          id?: string;
          publicado_em?: string;
          resumo?: string | null;
          retirado_em?: string | null;
          retirado_motivo?: string | null;
          retirado_por?: string | null;
          retirado_por_user_id?: string | null;
          slug: string;
          titulo: string;
        };
        Update: {
          autor_id?: string;
          autor_nome?: string;
          autor_sigla_casa?: string | null;
          aval_bom?: number;
          aval_erro?: number;
          aval_erro_grave?: number;
          aval_gostei?: number;
          aval_nao_gostei?: number;
          aval_otimo?: number;
          conteudo?: string;
          created_at?: string;
          editado_em?: string | null;
          estado?: string;
          id?: string;
          publicado_em?: string;
          resumo?: string | null;
          retirado_em?: string | null;
          retirado_motivo?: string | null;
          retirado_por?: string | null;
          retirado_por_user_id?: string | null;
          slug?: string;
          titulo?: string;
        };
        Relationships: [];
      };
      casas_espirita: {
        Row: {
          aceita_doacao_alimentos: boolean;
          ativa: boolean;
          cep: string | null;
          cidade: string;
          created_at: string;
          endereco: string | null;
          estado: string;
          id: string;
          latitude: number | null;
          longitude: number | null;
          nome: string;
          sigla: string | null;
          telefone: string | null;
        };
        Insert: {
          aceita_doacao_alimentos?: boolean;
          ativa?: boolean;
          cep?: string | null;
          cidade: string;
          created_at?: string;
          endereco?: string | null;
          estado: string;
          id?: string;
          latitude?: number | null;
          longitude?: number | null;
          nome: string;
          sigla?: string | null;
          telefone?: string | null;
        };
        Update: {
          aceita_doacao_alimentos?: boolean;
          ativa?: boolean;
          cep?: string | null;
          cidade?: string;
          created_at?: string;
          endereco?: string | null;
          estado?: string;
          id?: string;
          latitude?: number | null;
          longitude?: number | null;
          nome?: string;
          sigla?: string | null;
          telefone?: string | null;
        };
        Relationships: [];
      };
      kanban_boards: {
        Row: {
          created_at: string;
          id: string;
          nome: string;
          ordem: number;
          sigla_casa: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          nome: string;
          ordem?: number;
          sigla_casa: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          nome?: string;
          ordem?: number;
          sigla_casa?: string;
        };
        Relationships: [];
      };
      kanban_comentarios: {
        Row: {
          autor_nome: string;
          comentario: string;
          created_at: string;
          evento_id: string;
          id: string;
          user_id: string | null;
        };
        Insert: {
          autor_nome: string;
          comentario: string;
          created_at?: string;
          evento_id: string;
          id?: string;
          user_id?: string | null;
        };
        Update: {
          autor_nome?: string;
          comentario?: string;
          created_at?: string;
          evento_id?: string;
          id?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "kanban_comentarios_evento_id_fkey";
            columns: ["evento_id"];
            isOneToOne: false;
            referencedRelation: "kanban_eventos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "kanban_comentarios_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "kanban_comentarios_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles_public";
            referencedColumns: ["id"];
          },
        ];
      };
      kanban_config: {
        Row: {
          board_background: string;
          created_at: string;
          share_token: string;
          sigla_casa: string;
        };
        Insert: {
          board_background?: string;
          created_at?: string;
          share_token?: string;
          sigla_casa: string;
        };
        Update: {
          board_background?: string;
          created_at?: string;
          share_token?: string;
          sigla_casa?: string;
        };
        Relationships: [
          {
            foreignKeyName: "kanban_config_sigla_casa_fkey";
            columns: ["sigla_casa"];
            isOneToOne: true;
            referencedRelation: "siglas_casas";
            referencedColumns: ["sigla"];
          },
        ];
      };
      kanban_eventos: {
        Row: {
          anexos: Json;
          arquivado: boolean;
          cover: string | null;
          created_at: string | null;
          criador_id: string | null;
          criador_nome: string | null;
          data: string | null;
          descricao: string | null;
          id: string;
          labels: string[];
          lista_id: string | null;
          membros_atribuidos: string[];
          ordem: number;
          prazo_concluido: boolean;
          responsavel: string | null;
          sigla_casa: string;
          status: string;
          titulo: string;
        };
        Insert: {
          anexos?: Json;
          arquivado?: boolean;
          cover?: string | null;
          created_at?: string | null;
          criador_id?: string | null;
          criador_nome?: string | null;
          data?: string | null;
          descricao?: string | null;
          id?: string;
          labels?: string[];
          lista_id?: string | null;
          membros_atribuidos?: string[];
          ordem?: number;
          prazo_concluido?: boolean;
          responsavel?: string | null;
          sigla_casa: string;
          status?: string;
          titulo: string;
        };
        Update: {
          anexos?: Json;
          arquivado?: boolean;
          cover?: string | null;
          created_at?: string | null;
          criador_id?: string | null;
          criador_nome?: string | null;
          data?: string | null;
          descricao?: string | null;
          id?: string;
          labels?: string[];
          lista_id?: string | null;
          membros_atribuidos?: string[];
          ordem?: number;
          prazo_concluido?: boolean;
          responsavel?: string | null;
          sigla_casa?: string;
          status?: string;
          titulo?: string;
        };
        Relationships: [
          {
            foreignKeyName: "kanban_eventos_criador_id_fkey";
            columns: ["criador_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "kanban_eventos_criador_id_fkey";
            columns: ["criador_id"];
            isOneToOne: false;
            referencedRelation: "profiles_public";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "kanban_eventos_lista_id_fkey";
            columns: ["lista_id"];
            isOneToOne: false;
            referencedRelation: "kanban_listas";
            referencedColumns: ["id"];
          },
        ];
      };
      kanban_frentes: {
        Row: {
          board_id: string;
          created_at: string;
          id: string;
          membros: string[];
          nome: string;
          ordem: number;
          sigla_casa: string;
        };
        Insert: {
          board_id: string;
          created_at?: string;
          id?: string;
          membros?: string[];
          nome: string;
          ordem?: number;
          sigla_casa: string;
        };
        Update: {
          board_id?: string;
          created_at?: string;
          id?: string;
          membros?: string[];
          nome?: string;
          ordem?: number;
          sigla_casa?: string;
        };
        Relationships: [
          {
            foreignKeyName: "kanban_frentes_board_id_fkey";
            columns: ["board_id"];
            isOneToOne: false;
            referencedRelation: "kanban_boards";
            referencedColumns: ["id"];
          },
        ];
      };
      kanban_grupos: {
        Row: {
          created_at: string | null;
          evento_id: string;
          id: string;
          membros: string[] | null;
          nome: string;
          ordem: number;
          responsavel: string | null;
          sigla_casa: string;
        };
        Insert: {
          created_at?: string | null;
          evento_id: string;
          id?: string;
          membros?: string[] | null;
          nome: string;
          ordem?: number;
          responsavel?: string | null;
          sigla_casa: string;
        };
        Update: {
          created_at?: string | null;
          evento_id?: string;
          id?: string;
          membros?: string[] | null;
          nome?: string;
          ordem?: number;
          responsavel?: string | null;
          sigla_casa?: string;
        };
        Relationships: [
          {
            foreignKeyName: "kanban_grupos_evento_id_fkey";
            columns: ["evento_id"];
            isOneToOne: false;
            referencedRelation: "kanban_eventos";
            referencedColumns: ["id"];
          },
        ];
      };
      kanban_listas: {
        Row: {
          board_id: string | null;
          created_at: string;
          frente_id: string | null;
          id: string;
          nome: string;
          ordem: number;
          sigla_casa: string;
        };
        Insert: {
          board_id?: string | null;
          created_at?: string;
          frente_id?: string | null;
          id?: string;
          nome: string;
          ordem: number;
          sigla_casa: string;
        };
        Update: {
          board_id?: string | null;
          created_at?: string;
          frente_id?: string | null;
          id?: string;
          nome?: string;
          ordem?: number;
          sigla_casa?: string;
        };
        Relationships: [
          {
            foreignKeyName: "kanban_listas_board_id_fkey";
            columns: ["board_id"];
            isOneToOne: false;
            referencedRelation: "kanban_boards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "kanban_listas_frente_id_fkey";
            columns: ["frente_id"];
            isOneToOne: false;
            referencedRelation: "kanban_frentes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "kanban_listas_sigla_casa_fkey";
            columns: ["sigla_casa"];
            isOneToOne: false;
            referencedRelation: "siglas_casas";
            referencedColumns: ["sigla"];
          },
        ];
      };
      kanban_tarefas: {
        Row: {
          created_at: string | null;
          feito: boolean;
          grupo_id: string;
          id: string;
          ordem: number;
          prazo: string | null;
          responsavel: string | null;
          sigla_casa: string;
          titulo: string;
        };
        Insert: {
          created_at?: string | null;
          feito?: boolean;
          grupo_id: string;
          id?: string;
          ordem?: number;
          prazo?: string | null;
          responsavel?: string | null;
          sigla_casa: string;
          titulo: string;
        };
        Update: {
          created_at?: string | null;
          feito?: boolean;
          grupo_id?: string;
          id?: string;
          ordem?: number;
          prazo?: string | null;
          responsavel?: string | null;
          sigla_casa?: string;
          titulo?: string;
        };
        Relationships: [
          {
            foreignKeyName: "kanban_tarefas_grupo_id_fkey";
            columns: ["grupo_id"];
            isOneToOne: false;
            referencedRelation: "kanban_grupos";
            referencedColumns: ["id"];
          },
        ];
      };
      memoria_virtudes_custom: {
        Row: {
          ativo: boolean;
          cor: string;
          created_at: string;
          id: string;
          imagem_url: string | null;
          nome: string;
          ordem: number;
          sigla_casa: string;
          updated_at: string;
        };
        Insert: {
          ativo?: boolean;
          cor?: string;
          created_at?: string;
          id?: string;
          imagem_url?: string | null;
          nome: string;
          ordem?: number;
          sigla_casa: string;
          updated_at?: string;
        };
        Update: {
          ativo?: boolean;
          cor?: string;
          created_at?: string;
          id?: string;
          imagem_url?: string | null;
          nome?: string;
          ordem?: number;
          sigla_casa?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "memoria_virtudes_custom_sigla_casa_fkey";
            columns: ["sigla_casa"];
            isOneToOne: false;
            referencedRelation: "siglas_casas";
            referencedColumns: ["sigla"];
          },
        ];
      };
      mensagens_do_dia: {
        Row: {
          aprovada: boolean;
          autor_id: string | null;
          autor_nome: string;
          created_at: string;
          data_exibicao: string | null;
          id: string;
          referencia: string | null;
          sigla_casa: string | null;
          texto: string;
        };
        Insert: {
          aprovada?: boolean;
          autor_id?: string | null;
          autor_nome: string;
          created_at?: string;
          data_exibicao?: string | null;
          id?: string;
          referencia?: string | null;
          sigla_casa?: string | null;
          texto: string;
        };
        Update: {
          aprovada?: boolean;
          autor_id?: string | null;
          autor_nome?: string;
          created_at?: string;
          data_exibicao?: string | null;
          id?: string;
          referencia?: string | null;
          sigla_casa?: string | null;
          texto?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mensagens_do_dia_autor_id_fkey";
            columns: ["autor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mensagens_do_dia_autor_id_fkey";
            columns: ["autor_id"];
            isOneToOne: false;
            referencedRelation: "profiles_public";
            referencedColumns: ["id"];
          },
        ];
      };
      musicas: {
        Row: {
          artist: string;
          audio_url: string;
          created_at: string;
          id: string;
          is_exclusive: boolean;
          sigla_casa: string | null;
          title: string;
          user_id: string | null;
        };
        Insert: {
          artist: string;
          audio_url: string;
          created_at?: string;
          id?: string;
          is_exclusive?: boolean;
          sigla_casa?: string | null;
          title: string;
          user_id?: string | null;
        };
        Update: {
          artist?: string;
          audio_url?: string;
          created_at?: string;
          id?: string;
          is_exclusive?: boolean;
          sigla_casa?: string | null;
          title?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "musicas_sigla_casa_fkey";
            columns: ["sigla_casa"];
            isOneToOne: false;
            referencedRelation: "siglas_casas";
            referencedColumns: ["sigla"];
          },
        ];
      };
      paginas_casas: {
        Row: {
          ano_fundacao: number | null;
          bairro: string;
          cep: string;
          chave_pix: string;
          cidade: string;
          created_at: string;
          descricao: string;
          email_contato: string;
          endereco: string;
          horarios: Json;
          missao: string;
          nome_completo: string;
          publicada: boolean;
          sigla_casa: string;
          site: string;
          telefone: string;
          texto_doacao: string;
          uf: string;
          updated_at: string;
        };
        Insert: {
          ano_fundacao?: number | null;
          bairro?: string;
          cep?: string;
          chave_pix?: string;
          cidade?: string;
          created_at?: string;
          descricao?: string;
          email_contato?: string;
          endereco?: string;
          horarios?: Json;
          missao?: string;
          nome_completo?: string;
          publicada?: boolean;
          sigla_casa: string;
          site?: string;
          telefone?: string;
          texto_doacao?: string;
          uf?: string;
          updated_at?: string;
        };
        Update: {
          ano_fundacao?: number | null;
          bairro?: string;
          cep?: string;
          chave_pix?: string;
          cidade?: string;
          created_at?: string;
          descricao?: string;
          email_contato?: string;
          endereco?: string;
          horarios?: Json;
          missao?: string;
          nome_completo?: string;
          publicada?: boolean;
          sigla_casa?: string;
          site?: string;
          telefone?: string;
          texto_doacao?: string;
          uf?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "paginas_casas_sigla_casa_fkey";
            columns: ["sigla_casa"];
            isOneToOne: true;
            referencedRelation: "siglas_casas";
            referencedColumns: ["sigla"];
          },
        ];
      };
      painel_votes: {
        Row: {
          created_at: string | null;
          id: string;
          item_key: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          item_key: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          item_key?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      problem_reports: {
        Row: {
          created_at: string | null;
          descricao: string;
          id: string;
          nome: string | null;
          sigla_casa: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          descricao: string;
          id?: string;
          nome?: string | null;
          sigla_casa?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          descricao?: string;
          id?: string;
          nome?: string | null;
          sigla_casa?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          atividades: string[] | null;
          bairro: string | null;
          cargo_principal: string | null;
          cidade: string | null;
          created_at: string;
          id: string;
          nome: string | null;
          role: string;
          sigla_casa: string | null;
          uf: string | null;
          updated_at: string;
        };
        Insert: {
          atividades?: string[] | null;
          bairro?: string | null;
          cargo_principal?: string | null;
          cidade?: string | null;
          created_at?: string;
          id: string;
          nome?: string | null;
          role?: string;
          sigla_casa?: string | null;
          uf?: string | null;
          updated_at?: string;
        };
        Update: {
          atividades?: string[] | null;
          bairro?: string | null;
          cargo_principal?: string | null;
          cidade?: string | null;
          created_at?: string;
          id?: string;
          nome?: string | null;
          role?: string;
          sigla_casa?: string | null;
          uf?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_sigla_casa_fkey";
            columns: ["sigla_casa"];
            isOneToOne: false;
            referencedRelation: "siglas_casas";
            referencedColumns: ["sigla"];
          },
        ];
      };
      programacao_eventos: {
        Row: {
          created_at: string;
          criado_por: string | null;
          criado_por_nome: string;
          data_evento: string;
          descricao: string | null;
          hora_fim: string | null;
          hora_inicio: string | null;
          id: string;
          local_evento: string | null;
          publica: boolean;
          sigla_casa: string;
          titulo: string;
        };
        Insert: {
          created_at?: string;
          criado_por?: string | null;
          criado_por_nome?: string;
          data_evento: string;
          descricao?: string | null;
          hora_fim?: string | null;
          hora_inicio?: string | null;
          id?: string;
          local_evento?: string | null;
          publica?: boolean;
          sigla_casa: string;
          titulo: string;
        };
        Update: {
          created_at?: string;
          criado_por?: string | null;
          criado_por_nome?: string;
          data_evento?: string;
          descricao?: string | null;
          hora_fim?: string | null;
          hora_inicio?: string | null;
          id?: string;
          local_evento?: string | null;
          publica?: boolean;
          sigla_casa?: string;
          titulo?: string;
        };
        Relationships: [
          {
            foreignKeyName: "programacao_eventos_criado_por_fkey";
            columns: ["criado_por"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "programacao_eventos_criado_por_fkey";
            columns: ["criado_por"];
            isOneToOne: false;
            referencedRelation: "profiles_public";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "programacao_eventos_sigla_casa_fkey";
            columns: ["sigla_casa"];
            isOneToOne: false;
            referencedRelation: "siglas_casas";
            referencedColumns: ["sigla"];
          },
        ];
      };
      programacao_participantes: {
        Row: {
          adicionado_por: string | null;
          created_at: string;
          evento_id: string;
          status: string;
          user_id: string;
        };
        Insert: {
          adicionado_por?: string | null;
          created_at?: string;
          evento_id: string;
          status?: string;
          user_id: string;
        };
        Update: {
          adicionado_por?: string | null;
          created_at?: string;
          evento_id?: string;
          status?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "programacao_participantes_adicionado_por_fkey";
            columns: ["adicionado_por"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "programacao_participantes_adicionado_por_fkey";
            columns: ["adicionado_por"];
            isOneToOne: false;
            referencedRelation: "profiles_public";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "programacao_participantes_evento_id_fkey";
            columns: ["evento_id"];
            isOneToOne: false;
            referencedRelation: "programacao_eventos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "programacao_participantes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "programacao_participantes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles_public";
            referencedColumns: ["id"];
          },
        ];
      };
      publicacoes_casa: {
        Row: {
          autor_id: string | null;
          autor_nome: string;
          conteudo: string;
          created_at: string;
          editado_em: string | null;
          fixado: boolean;
          id: string;
          imagem_url: string | null;
          sigla_casa: string;
          video_url: string | null;
        };
        Insert: {
          autor_id?: string | null;
          autor_nome: string;
          conteudo: string;
          created_at?: string;
          editado_em?: string | null;
          fixado?: boolean;
          id?: string;
          imagem_url?: string | null;
          sigla_casa: string;
          video_url?: string | null;
        };
        Update: {
          autor_id?: string | null;
          autor_nome?: string;
          conteudo?: string;
          created_at?: string;
          editado_em?: string | null;
          fixado?: boolean;
          id?: string;
          imagem_url?: string | null;
          sigla_casa?: string;
          video_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "publicacoes_casa_autor_id_fkey";
            columns: ["autor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "publicacoes_casa_autor_id_fkey";
            columns: ["autor_id"];
            isOneToOne: false;
            referencedRelation: "profiles_public";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "publicacoes_casa_sigla_casa_fkey";
            columns: ["sigla_casa"];
            isOneToOne: false;
            referencedRelation: "siglas_casas";
            referencedColumns: ["sigla"];
          },
        ];
      };
      siglas_casas: {
        Row: {
          created_at: string;
          sigla: string;
        };
        Insert: {
          created_at?: string;
          sigla: string;
        };
        Update: {
          created_at?: string;
          sigla?: string;
        };
        Relationships: [];
      };
      site_suggestions: {
        Row: {
          created_at: string | null;
          email: string;
          id: string;
          name: string;
          suggestion: string;
        };
        Insert: {
          created_at?: string | null;
          email: string;
          id?: string;
          name: string;
          suggestion: string;
        };
        Update: {
          created_at?: string | null;
          email?: string;
          id?: string;
          name?: string;
          suggestion?: string;
        };
        Relationships: [];
      };
      solicitacoes_dev: {
        Row: {
          created_at: string | null;
          descricao: string | null;
          id: string;
          titulo: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          descricao?: string | null;
          id?: string;
          titulo: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          descricao?: string | null;
          id?: string;
          titulo?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      tesouraria_autorizacoes: {
        Row: {
          autorizado_por: string | null;
          created_at: string;
          id: string;
          sigla_casa: string;
          user_id: string;
        };
        Insert: {
          autorizado_por?: string | null;
          created_at?: string;
          id?: string;
          sigla_casa: string;
          user_id: string;
        };
        Update: {
          autorizado_por?: string | null;
          created_at?: string;
          id?: string;
          sigla_casa?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      tesouraria_transacoes: {
        Row: {
          categoria: string;
          created_at: string | null;
          criador_id: string | null;
          criador_nome: string | null;
          data: string;
          descricao: string;
          id: string;
          observacao: string | null;
          sigla_casa: string;
          tipo: string;
          valor: number;
        };
        Insert: {
          categoria: string;
          created_at?: string | null;
          criador_id?: string | null;
          criador_nome?: string | null;
          data?: string;
          descricao: string;
          id?: string;
          observacao?: string | null;
          sigla_casa: string;
          tipo: string;
          valor: number;
        };
        Update: {
          categoria?: string;
          created_at?: string | null;
          criador_id?: string | null;
          criador_nome?: string | null;
          data?: string;
          descricao?: string;
          id?: string;
          observacao?: string | null;
          sigla_casa?: string;
          tipo?: string;
          valor?: number;
        };
        Relationships: [
          {
            foreignKeyName: "tesouraria_transacoes_sigla_casa_fkey";
            columns: ["sigla_casa"];
            isOneToOne: false;
            referencedRelation: "siglas_casas";
            referencedColumns: ["sigla"];
          },
        ];
      };
      usuarios_sancoes: {
        Row: {
          aplicada_por: string;
          created_at: string;
          fim: string | null;
          id: string;
          inicio: string;
          motivo: string;
          revogada_em: string | null;
          tipo: string;
          user_id: string;
        };
        Insert: {
          aplicada_por: string;
          created_at?: string;
          fim?: string | null;
          id?: string;
          inicio?: string;
          motivo: string;
          revogada_em?: string | null;
          tipo: string;
          user_id: string;
        };
        Update: {
          aplicada_por?: string;
          created_at?: string;
          fim?: string | null;
          id?: string;
          inicio?: string;
          motivo?: string;
          revogada_em?: string | null;
          tipo?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      artigos_avisos: {
        Row: {
          estado: string | null;
          retirado_em: string | null;
          slug: string | null;
        };
        Insert: {
          estado?: string | null;
          retirado_em?: string | null;
          slug?: string | null;
        };
        Update: {
          estado?: string | null;
          retirado_em?: string | null;
          slug?: string | null;
        };
        Relationships: [];
      };
      artigos_publicos: {
        Row: {
          aprovacoes: number | null;
          autor_id: string | null;
          autor_nome: string | null;
          autor_sigla_casa: string | null;
          aval_bom: number | null;
          aval_gostei: number | null;
          aval_nao_gostei: number | null;
          aval_otimo: number | null;
          conteudo: string | null;
          created_at: string | null;
          editado_em: string | null;
          estado: string | null;
          id: string | null;
          piso_atual: number | null;
          publicado_em: string | null;
          resumo: string | null;
          retirado_em: string | null;
          retirado_motivo: string | null;
          retirado_por: string | null;
          slug: string | null;
          titulo: string | null;
        };
        Insert: {
          aprovacoes?: never;
          autor_id?: string | null;
          autor_nome?: string | null;
          autor_sigla_casa?: string | null;
          aval_bom?: number | null;
          aval_gostei?: number | null;
          aval_nao_gostei?: number | null;
          aval_otimo?: number | null;
          conteudo?: never;
          created_at?: string | null;
          editado_em?: string | null;
          estado?: string | null;
          id?: string | null;
          piso_atual?: never;
          publicado_em?: string | null;
          resumo?: string | null;
          retirado_em?: string | null;
          retirado_motivo?: string | null;
          retirado_por?: string | null;
          slug?: string | null;
          titulo?: string | null;
        };
        Update: {
          aprovacoes?: never;
          autor_id?: string | null;
          autor_nome?: string | null;
          autor_sigla_casa?: string | null;
          aval_bom?: number | null;
          aval_gostei?: number | null;
          aval_nao_gostei?: number | null;
          aval_otimo?: number | null;
          conteudo?: never;
          created_at?: string | null;
          editado_em?: string | null;
          estado?: string | null;
          id?: string | null;
          piso_atual?: never;
          publicado_em?: string | null;
          resumo?: string | null;
          retirado_em?: string | null;
          retirado_motivo?: string | null;
          retirado_por?: string | null;
          slug?: string | null;
          titulo?: string | null;
        };
        Relationships: [];
      };
      profiles_public: {
        Row: {
          cidade: string | null;
          id: string | null;
          nome: string | null;
          sigla_casa: string | null;
          uf: string | null;
        };
        Insert: {
          cidade?: string | null;
          id?: string | null;
          nome?: string | null;
          sigla_casa?: string | null;
          uf?: string | null;
        };
        Update: {
          cidade?: string | null;
          id?: string | null;
          nome?: string | null;
          sigla_casa?: string | null;
          uf?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_sigla_casa_fkey";
            columns: ["sigla_casa"];
            isOneToOne: false;
            referencedRelation: "siglas_casas";
            referencedColumns: ["sigla"];
          },
        ];
      };
    };
    Functions: {
      artigo_deve_cair: {
        Args: { elogios: number; erro_grave: number; piso: number };
        Returns: boolean;
      };
      artigo_piso_retirada: { Args: { verificados: number }; Returns: number };
      email_verificado: { Args: never; Returns: boolean };
      get_request_kanban_token: { Args: never; Returns: string };
      has_kanban_access: { Args: { p_sigla_casa: string }; Returns: boolean };
      is_tesouraria_admin: { Args: { p_sigla_casa: string }; Returns: boolean };
      minha_sigla_casa: { Args: never; Returns: string };
      pode_administrar_pagina: { Args: { p_sigla: string }; Returns: boolean };
      pode_revisar_artigo: { Args: { alvo: string }; Returns: boolean };
      pode_sancionar: { Args: { alvo_user: string }; Returns: boolean };
      resolver_revisao_artigo: {
        Args: {
          p_decisao: string;
          p_dias_suspensao?: number;
          p_justificativa: string;
          p_revisao: string;
        };
        Returns: undefined;
      };
      sou_dev: { Args: never; Returns: boolean };
      total_verificados: { Args: never; Returns: number };
      usuario_sancionado: { Args: { uid: string }; Returns: boolean };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
