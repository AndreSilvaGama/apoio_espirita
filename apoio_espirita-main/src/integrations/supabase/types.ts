export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      administradores_pagina: {
        Row: {
          adicionado_por: string | null
          created_at: string
          sigla_casa: string
          user_id: string
        }
        Insert: {
          adicionado_por?: string | null
          created_at?: string
          sigla_casa: string
          user_id: string
        }
        Update: {
          adicionado_por?: string | null
          created_at?: string
          sigla_casa?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "administradores_pagina_adicionado_por_fkey"
            columns: ["adicionado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "administradores_pagina_adicionado_por_fkey"
            columns: ["adicionado_por"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "administradores_pagina_sigla_casa_fkey"
            columns: ["sigla_casa"]
            isOneToOne: false
            referencedRelation: "siglas_casas"
            referencedColumns: ["sigla"]
          },
          {
            foreignKeyName: "administradores_pagina_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "administradores_pagina_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      agenda_eventos: {
        Row: {
          aceita_confirmacao: boolean
          ata: string | null
          created_at: string
          criador_id: string
          criador_nome: string
          data_fim: string | null
          data_inicio: string
          descricao: string | null
          id: string
          local: string | null
          sigla_casa: string
          tipo: string
          titulo: string
        }
        Insert: {
          aceita_confirmacao?: boolean
          ata?: string | null
          created_at?: string
          criador_id: string
          criador_nome: string
          data_fim?: string | null
          data_inicio: string
          descricao?: string | null
          id?: string
          local?: string | null
          sigla_casa: string
          tipo?: string
          titulo: string
        }
        Update: {
          aceita_confirmacao?: boolean
          ata?: string | null
          created_at?: string
          criador_id?: string
          criador_nome?: string
          data_fim?: string | null
          data_inicio?: string
          descricao?: string | null
          id?: string
          local?: string | null
          sigla_casa?: string
          tipo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "agenda_eventos_criador_id_fkey"
            columns: ["criador_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_eventos_criador_id_fkey"
            columns: ["criador_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_eventos_sigla_casa_fkey"
            columns: ["sigla_casa"]
            isOneToOne: false
            referencedRelation: "siglas_casas"
            referencedColumns: ["sigla"]
          },
        ]
      }
      agenda_participantes: {
        Row: {
          confirmado: boolean | null
          created_at: string
          evento_id: string
          id: string
          presente: boolean
          user_id: string
        }
        Insert: {
          confirmado?: boolean | null
          created_at?: string
          evento_id: string
          id?: string
          presente?: boolean
          user_id: string
        }
        Update: {
          confirmado?: boolean | null
          created_at?: string
          evento_id?: string
          id?: string
          presente?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agenda_participantes_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "agenda_eventos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_participantes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_participantes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      casas_espirita: {
        Row: {
          aceita_doacao_alimentos: boolean
          ativa: boolean
          cep: string | null
          cidade: string
          created_at: string
          endereco: string | null
          estado: string
          id: string
          latitude: number | null
          longitude: number | null
          nome: string
          sigla: string | null
          telefone: string | null
        }
        Insert: {
          aceita_doacao_alimentos?: boolean
          ativa?: boolean
          cep?: string | null
          cidade: string
          created_at?: string
          endereco?: string | null
          estado: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          nome: string
          sigla?: string | null
          telefone?: string | null
        }
        Update: {
          aceita_doacao_alimentos?: boolean
          ativa?: boolean
          cep?: string | null
          cidade?: string
          created_at?: string
          endereco?: string | null
          estado?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          nome?: string
          sigla?: string | null
          telefone?: string | null
        }
        Relationships: []
      }
      mensagens_do_dia: {
        Row: {
          aprovada: boolean
          autor_id: string | null
          autor_nome: string
          created_at: string
          data_exibicao: string | null
          id: string
          referencia: string | null
          sigla_casa: string | null
          texto: string
        }
        Insert: {
          aprovada?: boolean
          autor_id?: string | null
          autor_nome: string
          created_at?: string
          data_exibicao?: string | null
          id?: string
          referencia?: string | null
          sigla_casa?: string | null
          texto: string
        }
        Update: {
          aprovada?: boolean
          autor_id?: string | null
          autor_nome?: string
          created_at?: string
          data_exibicao?: string | null
          id?: string
          referencia?: string | null
          sigla_casa?: string | null
          texto?: string
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_do_dia_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_do_dia_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      paginas_casas: {
        Row: {
          ano_fundacao: number | null
          bairro: string
          cep: string
          chave_pix: string
          cidade: string
          created_at: string
          descricao: string
          email_contato: string
          endereco: string
          horarios: Json
          missao: string
          nome_completo: string
          publicada: boolean
          sigla_casa: string
          site: string
          telefone: string
          texto_doacao: string
          uf: string
          updated_at: string
        }
        Insert: {
          ano_fundacao?: number | null
          bairro?: string
          cep?: string
          chave_pix?: string
          cidade?: string
          created_at?: string
          descricao?: string
          email_contato?: string
          endereco?: string
          horarios?: Json
          missao?: string
          nome_completo?: string
          publicada?: boolean
          sigla_casa: string
          site?: string
          telefone?: string
          texto_doacao?: string
          uf?: string
          updated_at?: string
        }
        Update: {
          ano_fundacao?: number | null
          bairro?: string
          cep?: string
          chave_pix?: string
          cidade?: string
          created_at?: string
          descricao?: string
          email_contato?: string
          endereco?: string
          horarios?: Json
          missao?: string
          nome_completo?: string
          publicada?: boolean
          sigla_casa?: string
          site?: string
          telefone?: string
          texto_doacao?: string
          uf?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "paginas_casas_sigla_casa_fkey"
            columns: ["sigla_casa"]
            isOneToOne: true
            referencedRelation: "siglas_casas"
            referencedColumns: ["sigla"]
          },
        ]
      }
      painel_votes: {
        Row: {
          created_at: string | null
          id: string
          item_key: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_key: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          item_key?: string
          user_id?: string
        }
        Relationships: []
      }
      problem_reports: {
        Row: {
          created_at: string | null
          descricao: string
          id: string
          nome: string | null
          sigla_casa: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          descricao: string
          id?: string
          nome?: string | null
          sigla_casa?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          descricao?: string
          id?: string
          nome?: string | null
          sigla_casa?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          atividades: string[] | null
          bairro: string | null
          cargo_principal: string | null
          cidade: string | null
          created_at: string
          id: string
          nome: string | null
          role: string
          sigla_casa: string | null
          uf: string | null
          updated_at: string
        }
        Insert: {
          atividades?: string[] | null
          bairro?: string | null
          cargo_principal?: string | null
          cidade?: string | null
          created_at?: string
          id: string
          nome?: string | null
          role?: string
          sigla_casa?: string | null
          uf?: string | null
          updated_at?: string
        }
        Update: {
          atividades?: string[] | null
          bairro?: string | null
          cargo_principal?: string | null
          cidade?: string | null
          created_at?: string
          id?: string
          nome?: string | null
          role?: string
          sigla_casa?: string | null
          uf?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_sigla_casa_fkey"
            columns: ["sigla_casa"]
            isOneToOne: false
            referencedRelation: "siglas_casas"
            referencedColumns: ["sigla"]
          },
        ]
      }
      musicas: {
        Row: {
          id: string
          title: string
          artist: string
          audio_url: string
          is_exclusive: boolean
          sigla_casa: string | null
          created_at: string
          user_id: string | null
        }
        Insert: {
          id?: string
          title: string
          artist: string
          audio_url: string
          is_exclusive?: boolean
          sigla_casa?: string | null
          created_at?: string
          user_id?: string | null
        }
        Update: {
          id?: string
          title?: string
          artist?: string
          audio_url?: string
          is_exclusive?: boolean
          sigla_casa?: string | null
          created_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "musicas_sigla_casa_fkey"
            columns: ["sigla_casa"]
            isOneToOne: false
            referencedRelation: "siglas_casas"
            referencedColumns: ["sigla"]
          },
          {
            foreignKeyName: "musicas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "musicas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          }
        ]
      }
      programacao_eventos: {
        Row: {
          created_at: string
          criado_por: string | null
          criado_por_nome: string
          data_evento: string
          descricao: string | null
          hora_fim: string | null
          hora_inicio: string | null
          id: string
          local_evento: string | null
          publica: boolean
          sigla_casa: string
          titulo: string
        }
        Insert: {
          created_at?: string
          criado_por?: string | null
          criado_por_nome?: string
          data_evento: string
          descricao?: string | null
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          local_evento?: string | null
          publica?: boolean
          sigla_casa: string
          titulo: string
        }
        Update: {
          created_at?: string
          criado_por?: string | null
          criado_por_nome?: string
          data_evento?: string
          descricao?: string | null
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          local_evento?: string | null
          publica?: boolean
          sigla_casa?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "programacao_eventos_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programacao_eventos_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programacao_eventos_sigla_casa_fkey"
            columns: ["sigla_casa"]
            isOneToOne: false
            referencedRelation: "siglas_casas"
            referencedColumns: ["sigla"]
          },
        ]
      }
      programacao_participantes: {
        Row: {
          adicionado_por: string | null
          created_at: string
          evento_id: string
          status: string
          user_id: string
        }
        Insert: {
          adicionado_por?: string | null
          created_at?: string
          evento_id: string
          status?: string
          user_id: string
        }
        Update: {
          adicionado_por?: string | null
          created_at?: string
          evento_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "programacao_participantes_adicionado_por_fkey"
            columns: ["adicionado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programacao_participantes_adicionado_por_fkey"
            columns: ["adicionado_por"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programacao_participantes_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "programacao_eventos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programacao_participantes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programacao_participantes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      publicacoes_casa: {
        Row: {
          autor_id: string | null
          autor_nome: string
          conteudo: string
          created_at: string
          editado_em: string | null
          fixado: boolean
          id: string
          imagem_url: string | null
          sigla_casa: string
          video_url: string | null
        }
        Insert: {
          autor_id?: string | null
          autor_nome: string
          conteudo: string
          created_at?: string
          editado_em?: string | null
          fixado?: boolean
          id?: string
          imagem_url?: string | null
          sigla_casa: string
          video_url?: string | null
        }
        Update: {
          autor_id?: string | null
          autor_nome?: string
          conteudo?: string
          created_at?: string
          editado_em?: string | null
          fixado?: boolean
          id?: string
          imagem_url?: string | null
          sigla_casa?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "publicacoes_casa_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publicacoes_casa_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publicacoes_casa_sigla_casa_fkey"
            columns: ["sigla_casa"]
            isOneToOne: false
            referencedRelation: "siglas_casas"
            referencedColumns: ["sigla"]
          },
        ]
      }
      siglas_casas: {
        Row: {
          created_at: string
          sigla: string
        }
        Insert: {
          created_at?: string
          sigla: string
        }
        Update: {
          created_at?: string
          sigla?: string
        }
        Relationships: []
      }
      site_suggestions: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string
          suggestion: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          name: string
          suggestion: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          suggestion?: string
        }
        Relationships: []
      }
      solicitacoes_dev: {
        Row: {
          created_at: string | null
          descricao: string | null
          id: string
          titulo: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          titulo: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          titulo?: string
          user_id?: string | null
        }
        Relationships: []
      }
      tesouraria_transacoes: {
        Row: {
          categoria: string
          created_at: string | null
          criador_id: string | null
          criador_nome: string | null
          data: string
          descricao: string
          id: string
          observacao: string | null
          sigla_casa: string
          tipo: string
          valor: number
        }
        Insert: {
          categoria: string
          created_at?: string | null
          criador_id?: string | null
          criador_nome?: string | null
          data?: string
          descricao: string
          id?: string
          observacao?: string | null
          sigla_casa: string
          tipo: string
          valor: number
        }
        Update: {
          categoria?: string
          created_at?: string | null
          criador_id?: string | null
          criador_nome?: string | null
          data?: string
          descricao?: string
          id?: string
          observacao?: string | null
          sigla_casa?: string
          tipo?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "tesouraria_transacoes_sigla_casa_fkey"
            columns: ["sigla_casa"]
            isOneToOne: false
            referencedRelation: "siglas_casas"
            referencedColumns: ["sigla"]
          },
        ]
      }
    }
    Views: {
      profiles_public: {
        Row: {
          cidade: string | null
          id: string | null
          nome: string | null
          sigla_casa: string | null
          uf: string | null
        }
        Insert: {
          cidade?: string | null
          id?: string | null
          nome?: string | null
          sigla_casa?: string | null
          uf?: string | null
        }
        Update: {
          cidade?: string | null
          id?: string | null
          nome?: string | null
          sigla_casa?: string | null
          uf?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_sigla_casa_fkey"
            columns: ["sigla_casa"]
            isOneToOne: false
            referencedRelation: "siglas_casas"
            referencedColumns: ["sigla"]
          },
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
