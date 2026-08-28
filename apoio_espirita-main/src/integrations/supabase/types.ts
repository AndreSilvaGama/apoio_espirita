export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
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
          assinatura: string;
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
          indexavel: boolean;
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
          assinatura?: string;
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
          indexavel?: boolean;
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
          assinatura?: string;
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
          indexavel?: boolean;
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
      atendimento_acessos: {
        Row: {
          created_at: string;
          ficha_id: string;
          id: string;
          sigla_casa: string;
          user_id: string;
          user_nome: string | null;
        };
        Insert: {
          created_at?: string;
          ficha_id: string;
          id?: string;
          sigla_casa: string;
          user_id?: string;
          user_nome?: string | null;
        };
        Update: {
          created_at?: string;
          ficha_id?: string;
          id?: string;
          sigla_casa?: string;
          user_id?: string;
          user_nome?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "atendimento_acessos_ficha_id_fkey";
            columns: ["ficha_id"];
            isOneToOne: false;
            referencedRelation: "atendimento_fichas";
            referencedColumns: ["id"];
          },
        ];
      };
      atendimento_autorizados: {
        Row: {
          created_at: string;
          criado_por: string;
          id: string;
          nome: string | null;
          sigla_casa: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          criado_por?: string;
          id?: string;
          nome?: string | null;
          sigla_casa: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          criado_por?: string;
          id?: string;
          nome?: string | null;
          sigla_casa?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      atendimento_fichas: {
        Row: {
          atendido_contato: string | null;
          atendido_nome: string;
          autor_nome: string;
          concluida: boolean;
          created_at: string;
          criado_por: string;
          data_atendimento: string;
          encaminhamento: string | null;
          id: string;
          relato: string;
          retorno_em: string | null;
          sigla_casa: string;
          tipo: string;
          updated_at: string;
        };
        Insert: {
          atendido_contato?: string | null;
          atendido_nome: string;
          autor_nome: string;
          concluida?: boolean;
          created_at?: string;
          criado_por: string;
          data_atendimento?: string;
          encaminhamento?: string | null;
          id?: string;
          relato: string;
          retorno_em?: string | null;
          sigla_casa: string;
          tipo?: string;
          updated_at?: string;
        };
        Update: {
          atendido_contato?: string | null;
          atendido_nome?: string;
          autor_nome?: string;
          concluida?: boolean;
          created_at?: string;
          criado_por?: string;
          data_atendimento?: string;
          encaminhamento?: string | null;
          id?: string;
          relato?: string;
          retorno_em?: string | null;
          sigla_casa?: string;
          tipo?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      bazar_contatos: {
        Row: {
          contato: string;
          item_id: string;
        };
        Insert: {
          contato: string;
          item_id: string;
        };
        Update: {
          contato?: string;
          item_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bazar_contatos_item_id_fkey";
            columns: ["item_id"];
            isOneToOne: true;
            referencedRelation: "bazar_itens";
            referencedColumns: ["id"];
          },
        ];
      };
      bazar_itens: {
        Row: {
          aberto: boolean;
          autor_nome: string;
          categoria: string;
          chave_pix: string | null;
          created_at: string;
          criado_por: string;
          descricao: string;
          disponivel: boolean;
          doacao: boolean;
          estado: string;
          foto_url: string | null;
          id: string;
          pix_cidade: string | null;
          pix_nome: string | null;
          sigla_casa: string;
          titulo: string;
          updated_at: string;
          valor: number | null;
        };
        Insert: {
          aberto?: boolean;
          autor_nome: string;
          categoria?: string;
          chave_pix?: string | null;
          created_at?: string;
          criado_por: string;
          descricao: string;
          disponivel?: boolean;
          doacao?: boolean;
          estado?: string;
          foto_url?: string | null;
          id?: string;
          pix_cidade?: string | null;
          pix_nome?: string | null;
          sigla_casa: string;
          titulo: string;
          updated_at?: string;
          valor?: number | null;
        };
        Update: {
          aberto?: boolean;
          autor_nome?: string;
          categoria?: string;
          chave_pix?: string | null;
          created_at?: string;
          criado_por?: string;
          descricao?: string;
          disponivel?: boolean;
          doacao?: boolean;
          estado?: string;
          foto_url?: string | null;
          id?: string;
          pix_cidade?: string | null;
          pix_nome?: string | null;
          sigla_casa?: string;
          titulo?: string;
          updated_at?: string;
          valor?: number | null;
        };
        Relationships: [];
      };
      bazar_reservas: {
        Row: {
          autor_nome: string;
          contato: string;
          created_at: string;
          criado_por: string;
          id: string;
          item_id: string;
          mensagem: string | null;
          sigla_casa: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          autor_nome: string;
          contato: string;
          created_at?: string;
          criado_por: string;
          id?: string;
          item_id: string;
          mensagem?: string | null;
          sigla_casa: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          autor_nome?: string;
          contato?: string;
          created_at?: string;
          criado_por?: string;
          id?: string;
          item_id?: string;
          mensagem?: string | null;
          sigla_casa?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bazar_reservas_item_id_fkey";
            columns: ["item_id"];
            isOneToOne: false;
            referencedRelation: "bazar_itens";
            referencedColumns: ["id"];
          },
        ];
      };
      carona_contatos: {
        Row: {
          carona_id: string;
          contato: string;
        };
        Insert: {
          carona_id: string;
          contato: string;
        };
        Update: {
          carona_id?: string;
          contato?: string;
        };
        Relationships: [
          {
            foreignKeyName: "carona_contatos_carona_id_fkey";
            columns: ["carona_id"];
            isOneToOne: true;
            referencedRelation: "caronas";
            referencedColumns: ["id"];
          },
        ];
      };
      carona_pedidos: {
        Row: {
          autor_nome: string;
          carona_id: string;
          contato: string;
          created_at: string;
          criado_por: string;
          id: string;
          mensagem: string | null;
          ponto_encontro: string | null;
          sigla_casa: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          autor_nome: string;
          carona_id: string;
          contato: string;
          created_at?: string;
          criado_por: string;
          id?: string;
          mensagem?: string | null;
          ponto_encontro?: string | null;
          sigla_casa: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          autor_nome?: string;
          carona_id?: string;
          contato?: string;
          created_at?: string;
          criado_por?: string;
          id?: string;
          mensagem?: string | null;
          ponto_encontro?: string | null;
          sigla_casa?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "carona_pedidos_carona_id_fkey";
            columns: ["carona_id"];
            isOneToOne: false;
            referencedRelation: "caronas";
            referencedColumns: ["id"];
          },
        ];
      };
      caronas: {
        Row: {
          aberto: boolean;
          ativa: boolean;
          autor_nome: string;
          created_at: string;
          criado_por: string;
          data: string;
          destino: string;
          hora: string;
          id: string;
          observacao: string | null;
          origem: string;
          sigla_casa: string;
          updated_at: string;
          vagas: number;
          veiculo: string | null;
          volta: boolean;
        };
        Insert: {
          aberto?: boolean;
          ativa?: boolean;
          autor_nome: string;
          created_at?: string;
          criado_por: string;
          data: string;
          destino: string;
          hora: string;
          id?: string;
          observacao?: string | null;
          origem: string;
          sigla_casa: string;
          updated_at?: string;
          vagas?: number;
          veiculo?: string | null;
          volta?: boolean;
        };
        Update: {
          aberto?: boolean;
          ativa?: boolean;
          autor_nome?: string;
          created_at?: string;
          criado_por?: string;
          data?: string;
          destino?: string;
          hora?: string;
          id?: string;
          observacao?: string | null;
          origem?: string;
          sigla_casa?: string;
          updated_at?: string;
          vagas?: number;
          veiculo?: string | null;
          volta?: boolean;
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
          visivel_diretorio: boolean;
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
          visivel_diretorio?: boolean;
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
          visivel_diretorio?: boolean;
        };
        Relationships: [];
      };
      casas_pedidos_remocao: {
        Row: {
          casa_id: string;
          casa_nome: string;
          contato: string;
          created_at: string;
          id: string;
          nome_solicitante: string;
          restaurada_em: string | null;
        };
        Insert: {
          casa_id: string;
          casa_nome: string;
          contato: string;
          created_at?: string;
          id?: string;
          nome_solicitante: string;
          restaurada_em?: string | null;
        };
        Update: {
          casa_id?: string;
          casa_nome?: string;
          contato?: string;
          created_at?: string;
          id?: string;
          nome_solicitante?: string;
          restaurada_em?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "casas_pedidos_remocao_casa_id_fkey";
            columns: ["casa_id"];
            isOneToOne: false;
            referencedRelation: "casas_espirita";
            referencedColumns: ["id"];
          },
        ];
      };
      casas_reivindicacoes: {
        Row: {
          casa_id: string;
          casa_nome: string;
          created_at: string;
          desfeita_em: string | null;
          id: string;
          sigla: string;
          user_id: string;
          user_nome: string | null;
        };
        Insert: {
          casa_id: string;
          casa_nome: string;
          created_at?: string;
          desfeita_em?: string | null;
          id?: string;
          sigla: string;
          user_id: string;
          user_nome?: string | null;
        };
        Update: {
          casa_id?: string;
          casa_nome?: string;
          created_at?: string;
          desfeita_em?: string | null;
          id?: string;
          sigla?: string;
          user_id?: string;
          user_nome?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "casas_reivindicacoes_casa_id_fkey";
            columns: ["casa_id"];
            isOneToOne: false;
            referencedRelation: "casas_espirita";
            referencedColumns: ["id"];
          },
        ];
      };
      entrega_contatos: {
        Row: {
          contato_pedinte: string;
          contato_voluntario: string | null;
          entrega_id: string;
        };
        Insert: {
          contato_pedinte: string;
          contato_voluntario?: string | null;
          entrega_id: string;
        };
        Update: {
          contato_pedinte?: string;
          contato_voluntario?: string | null;
          entrega_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "entrega_contatos_entrega_id_fkey";
            columns: ["entrega_id"];
            isOneToOne: true;
            referencedRelation: "entregas";
            referencedColumns: ["id"];
          },
        ];
      };
      entregas: {
        Row: {
          aberto: boolean;
          agendada_para: string | null;
          autor_nome: string;
          bairro: string | null;
          created_at: string;
          criado_por: string;
          descricao: string;
          id: string;
          item_id: string | null;
          referencia: string | null;
          reserva_id: string | null;
          sigla_casa: string;
          status: string;
          updated_at: string;
          voluntario: string | null;
          voluntario_nome: string | null;
        };
        Insert: {
          aberto?: boolean;
          agendada_para?: string | null;
          autor_nome: string;
          bairro?: string | null;
          created_at?: string;
          criado_por: string;
          descricao: string;
          id?: string;
          item_id?: string | null;
          referencia?: string | null;
          reserva_id?: string | null;
          sigla_casa: string;
          status?: string;
          updated_at?: string;
          voluntario?: string | null;
          voluntario_nome?: string | null;
        };
        Update: {
          aberto?: boolean;
          agendada_para?: string | null;
          autor_nome?: string;
          bairro?: string | null;
          created_at?: string;
          criado_por?: string;
          descricao?: string;
          id?: string;
          item_id?: string | null;
          referencia?: string | null;
          reserva_id?: string | null;
          sigla_casa?: string;
          status?: string;
          updated_at?: string;
          voluntario?: string | null;
          voluntario_nome?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "entregas_item_id_fkey";
            columns: ["item_id"];
            isOneToOne: false;
            referencedRelation: "bazar_itens";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "entregas_reserva_id_fkey";
            columns: ["reserva_id"];
            isOneToOne: false;
            referencedRelation: "bazar_reservas";
            referencedColumns: ["id"];
          },
        ];
      };
      forum_respostas: {
        Row: {
          autor_nome: string;
          created_at: string;
          criado_por: string;
          id: string;
          sigla_casa: string;
          texto: string;
          topico_id: string;
          updated_at: string;
        };
        Insert: {
          autor_nome: string;
          created_at?: string;
          criado_por: string;
          id?: string;
          sigla_casa: string;
          texto: string;
          topico_id: string;
          updated_at?: string;
        };
        Update: {
          autor_nome?: string;
          created_at?: string;
          criado_por?: string;
          id?: string;
          sigla_casa?: string;
          texto?: string;
          topico_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "forum_respostas_topico_id_fkey";
            columns: ["topico_id"];
            isOneToOne: false;
            referencedRelation: "forum_topicos";
            referencedColumns: ["id"];
          },
        ];
      };
      forum_topicos: {
        Row: {
          aberto: boolean;
          autor_nome: string;
          categoria: string;
          created_at: string;
          criado_por: string;
          fixado: boolean;
          id: string;
          resolvido: boolean;
          respostas: number;
          sigla_casa: string;
          texto: string;
          titulo: string;
          ultima_resposta_em: string | null;
          updated_at: string;
        };
        Insert: {
          aberto?: boolean;
          autor_nome: string;
          categoria?: string;
          created_at?: string;
          criado_por: string;
          fixado?: boolean;
          id?: string;
          resolvido?: boolean;
          respostas?: number;
          sigla_casa: string;
          texto: string;
          titulo: string;
          ultima_resposta_em?: string | null;
          updated_at?: string;
        };
        Update: {
          aberto?: boolean;
          autor_nome?: string;
          categoria?: string;
          created_at?: string;
          criado_por?: string;
          fixado?: boolean;
          id?: string;
          resolvido?: boolean;
          respostas?: number;
          sigla_casa?: string;
          texto?: string;
          titulo?: string;
          ultima_resposta_em?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      grupo_membros: {
        Row: {
          adicionado_por: string;
          created_at: string;
          grupo_id: string;
          id: string;
          nome: string;
          papel: string;
          sigla_casa: string;
          user_id: string;
        };
        Insert: {
          adicionado_por: string;
          created_at?: string;
          grupo_id: string;
          id?: string;
          nome: string;
          papel?: string;
          sigla_casa: string;
          user_id: string;
        };
        Update: {
          adicionado_por?: string;
          created_at?: string;
          grupo_id?: string;
          id?: string;
          nome?: string;
          papel?: string;
          sigla_casa?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "grupo_membros_grupo_id_fkey";
            columns: ["grupo_id"];
            isOneToOne: false;
            referencedRelation: "grupos";
            referencedColumns: ["id"];
          },
        ];
      };
      grupo_mensagens: {
        Row: {
          autor_nome: string;
          created_at: string;
          criado_por: string;
          grupo_id: string;
          id: string;
          sigla_casa: string;
          texto: string;
        };
        Insert: {
          autor_nome: string;
          created_at?: string;
          criado_por: string;
          grupo_id: string;
          id?: string;
          sigla_casa: string;
          texto: string;
        };
        Update: {
          autor_nome?: string;
          created_at?: string;
          criado_por?: string;
          grupo_id?: string;
          id?: string;
          sigla_casa?: string;
          texto?: string;
        };
        Relationships: [
          {
            foreignKeyName: "grupo_mensagens_grupo_id_fkey";
            columns: ["grupo_id"];
            isOneToOne: false;
            referencedRelation: "grupos";
            referencedColumns: ["id"];
          },
        ];
      };
      grupos: {
        Row: {
          aberto: boolean;
          atividade: string | null;
          autor_nome: string;
          created_at: string;
          criado_por: string;
          descricao: string | null;
          id: string;
          nome: string;
          privado: boolean;
          sigla_casa: string;
          updated_at: string;
        };
        Insert: {
          aberto?: boolean;
          atividade?: string | null;
          autor_nome: string;
          created_at?: string;
          criado_por: string;
          descricao?: string | null;
          id?: string;
          nome: string;
          privado?: boolean;
          sigla_casa: string;
          updated_at?: string;
        };
        Update: {
          aberto?: boolean;
          atividade?: string | null;
          autor_nome?: string;
          created_at?: string;
          criado_por?: string;
          descricao?: string | null;
          id?: string;
          nome?: string;
          privado?: boolean;
          sigla_casa?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      jovens_membros: {
        Row: {
          apresentacao: string | null;
          autor_nome: string;
          created_at: string;
          criado_por: string;
          id: string;
          sigla_casa: string;
        };
        Insert: {
          apresentacao?: string | null;
          autor_nome: string;
          created_at?: string;
          criado_por: string;
          id?: string;
          sigla_casa: string;
        };
        Update: {
          apresentacao?: string | null;
          autor_nome?: string;
          created_at?: string;
          criado_por?: string;
          id?: string;
          sigla_casa?: string;
        };
        Relationships: [];
      };
      jovens_publicacoes: {
        Row: {
          aberto: boolean;
          autor_nome: string;
          categoria: string;
          created_at: string;
          criado_por: string;
          data_evento: string | null;
          id: string;
          link: string | null;
          sigla_casa: string;
          texto: string;
          titulo: string;
          updated_at: string;
        };
        Insert: {
          aberto?: boolean;
          autor_nome: string;
          categoria?: string;
          created_at?: string;
          criado_por: string;
          data_evento?: string | null;
          id?: string;
          link?: string | null;
          sigla_casa: string;
          texto: string;
          titulo: string;
          updated_at?: string;
        };
        Update: {
          aberto?: boolean;
          autor_nome?: string;
          categoria?: string;
          created_at?: string;
          criado_por?: string;
          data_evento?: string | null;
          id?: string;
          link?: string | null;
          sigla_casa?: string;
          texto?: string;
          titulo?: string;
          updated_at?: string;
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
      oracao_horarios: {
        Row: {
          aberto: boolean;
          autor_nome: string;
          created_at: string;
          criado_por: string;
          dia_semana: number;
          hora: number;
          id: string;
          intencao: string | null;
          minuto: number;
          sigla_casa: string;
          vagas: number;
        };
        Insert: {
          aberto?: boolean;
          autor_nome: string;
          created_at?: string;
          criado_por: string;
          dia_semana: number;
          hora: number;
          id?: string;
          intencao?: string | null;
          minuto?: number;
          sigla_casa: string;
          vagas?: number;
        };
        Update: {
          aberto?: boolean;
          autor_nome?: string;
          created_at?: string;
          criado_por?: string;
          dia_semana?: number;
          hora?: number;
          id?: string;
          intencao?: string | null;
          minuto?: number;
          sigla_casa?: string;
          vagas?: number;
        };
        Relationships: [];
      };
      oracao_inscricoes: {
        Row: {
          autor_nome: string;
          created_at: string;
          criado_por: string;
          horario_id: string;
          id: string;
          sigla_casa: string;
        };
        Insert: {
          autor_nome: string;
          created_at?: string;
          criado_por: string;
          horario_id: string;
          id?: string;
          sigla_casa: string;
        };
        Update: {
          autor_nome?: string;
          created_at?: string;
          criado_por?: string;
          horario_id?: string;
          id?: string;
          sigla_casa?: string;
        };
        Relationships: [
          {
            foreignKeyName: "oracao_inscricoes_horario_id_fkey";
            columns: ["horario_id"];
            isOneToOne: false;
            referencedRelation: "oracao_horarios";
            referencedColumns: ["id"];
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
          aniversario_dia: number | null;
          aniversario_mes: number | null;
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
          aniversario_dia?: number | null;
          aniversario_mes?: number | null;
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
          aniversario_dia?: number | null;
          aniversario_mes?: number | null;
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
          atualizado_em: string | null;
          created_at: string | null;
          descricao: string | null;
          id: string;
          resposta_dev: string | null;
          status: string;
          titulo: string;
          user_id: string | null;
        };
        Insert: {
          atualizado_em?: string | null;
          created_at?: string | null;
          descricao?: string | null;
          id?: string;
          resposta_dev?: string | null;
          status?: string;
          titulo: string;
          user_id?: string | null;
        };
        Update: {
          atualizado_em?: string | null;
          created_at?: string | null;
          descricao?: string | null;
          id?: string;
          resposta_dev?: string | null;
          status?: string;
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
      voluntariado_candidaturas: {
        Row: {
          autor_nome: string;
          created_at: string;
          criado_por: string;
          id: string;
          mensagem: string | null;
          necessidade_id: string;
          sigla_casa: string;
          status: string;
        };
        Insert: {
          autor_nome: string;
          created_at?: string;
          criado_por: string;
          id?: string;
          mensagem?: string | null;
          necessidade_id: string;
          sigla_casa: string;
          status?: string;
        };
        Update: {
          autor_nome?: string;
          created_at?: string;
          criado_por?: string;
          id?: string;
          mensagem?: string | null;
          necessidade_id?: string;
          sigla_casa?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "voluntariado_candidaturas_necessidade_id_fkey";
            columns: ["necessidade_id"];
            isOneToOne: false;
            referencedRelation: "voluntariado_necessidades";
            referencedColumns: ["id"];
          },
        ];
      };
      voluntariado_necessidades: {
        Row: {
          aberto: boolean;
          atendida: boolean;
          autor_nome: string;
          created_at: string;
          criado_por: string;
          descricao: string;
          habilidades: string[];
          id: string;
          prazo: string | null;
          sigla_casa: string;
          titulo: string;
          updated_at: string;
          urgencia: string;
        };
        Insert: {
          aberto?: boolean;
          atendida?: boolean;
          autor_nome: string;
          created_at?: string;
          criado_por: string;
          descricao: string;
          habilidades?: string[];
          id?: string;
          prazo?: string | null;
          sigla_casa: string;
          titulo: string;
          updated_at?: string;
          urgencia?: string;
        };
        Update: {
          aberto?: boolean;
          atendida?: boolean;
          autor_nome?: string;
          created_at?: string;
          criado_por?: string;
          descricao?: string;
          habilidades?: string[];
          id?: string;
          prazo?: string | null;
          sigla_casa?: string;
          titulo?: string;
          updated_at?: string;
          urgencia?: string;
        };
        Relationships: [];
      };
      voluntariado_ofertas: {
        Row: {
          aberto: boolean;
          ativa: boolean;
          autor_nome: string;
          created_at: string;
          criado_por: string;
          disponibilidade: string | null;
          habilidades: string[];
          id: string;
          observacao: string | null;
          sigla_casa: string;
          updated_at: string;
        };
        Insert: {
          aberto?: boolean;
          ativa?: boolean;
          autor_nome: string;
          created_at?: string;
          criado_por: string;
          disponibilidade?: string | null;
          habilidades?: string[];
          id?: string;
          observacao?: string | null;
          sigla_casa: string;
          updated_at?: string;
        };
        Update: {
          aberto?: boolean;
          ativa?: boolean;
          autor_nome?: string;
          created_at?: string;
          criado_por?: string;
          disponibilidade?: string | null;
          habilidades?: string[];
          id?: string;
          observacao?: string | null;
          sigla_casa?: string;
          updated_at?: string;
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
          assinatura: string | null;
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
          indexavel: boolean | null;
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
          assinatura?: string | null;
          autor_id?: string | null;
          autor_nome?: never;
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
          indexavel?: boolean | null;
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
          assinatura?: string | null;
          autor_id?: string | null;
          autor_nome?: never;
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
          indexavel?: boolean | null;
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
      buscar_geral: {
        Args: { limite?: number; termo: string };
        Returns: {
          referencia: string;
          subtitulo: string;
          tipo: string;
          titulo: string;
        }[];
      };
      desfazer_reivindicacao: {
        Args: { p_reivindicacao: string };
        Returns: undefined;
      };
      diretorio_casas: {
        Args: { p_cidade_slug: string; p_uf: string };
        Returns: {
          cep: string;
          cidade: string;
          endereco: string;
          estado: string;
          id: string;
          nome: string;
          sigla: string;
          telefone: string;
          tem_pagina: boolean;
        }[];
      };
      diretorio_cidades: {
        Args: { p_uf: string };
        Returns: {
          casas: number;
          cidade: string;
          slug: string;
        }[];
      };
      diretorio_estados: {
        Args: never;
        Returns: {
          casas: number;
          cidades: number;
          estado: string;
        }[];
      };
      diretorio_slug: { Args: { texto: string }; Returns: string };
      email_verificado: { Args: never; Returns: boolean };
      get_request_kanban_token: { Args: never; Returns: string };
      has_kanban_access: { Args: { p_sigla_casa: string }; Returns: boolean };
      is_tesouraria_admin: { Args: { p_sigla_casa: string }; Returns: boolean };
      minha_sigla_casa: { Args: never; Returns: string };
      pode_administrar_pagina: { Args: { p_sigla: string }; Returns: boolean };
      pode_atendimento_fraterno: { Args: { p_sigla: string }; Returns: boolean };
      pode_publicar_na_casa: { Args: { p_sigla: string }; Returns: boolean };
      pode_revisar_artigo: { Args: { alvo: string }; Returns: boolean };
      pode_sancionar: { Args: { alvo_user: string }; Returns: boolean };
      pode_ver_da_casa: {
        Args: { p_aberto: boolean; p_sigla: string };
        Returns: boolean;
      };
      reivindicar_casa: {
        Args: { p_casa: string; p_sigla: string };
        Returns: string;
      };
      remover_casa_do_diretorio: {
        Args: { p_casa: string; p_contato: string; p_nome: string };
        Returns: undefined;
      };
      resolver_revisao_artigo: {
        Args: {
          p_decisao: string;
          p_dias_suspensao?: number;
          p_justificativa: string;
          p_revisao: string;
        };
        Returns: undefined;
      };
      restaurar_casa_no_diretorio: {
        Args: { p_pedido: string };
        Returns: undefined;
      };
      sem_acento: { Args: { texto: string }; Returns: string };
      sou_dev: { Args: never; Returns: boolean };
      sou_do_grupo: { Args: { p_grupo: string }; Returns: boolean };
      sou_moderador_do_grupo: { Args: { p_grupo: string }; Returns: boolean };
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
