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
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          diff: Json | null
          entity: string
          entity_id: string | null
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          diff?: Json | null
          entity: string
          entity_id?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          diff?: Json | null
          entity?: string
          entity_id?: string | null
          id?: string
        }
        Relationships: []
      }
      client_units: {
        Row: {
          client_id: string
          created_at: string
          endereco: string | null
          geocoded_at: string | null
          id: string
          lat: number | null
          lng: number | null
          nome: string
          responsavel: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          endereco?: string | null
          geocoded_at?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          nome: string
          responsavel?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          endereco?: string | null
          geocoded_at?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          nome?: string
          responsavel?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_units_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          categoria: Database["public"]["Enums"]["client_category"]
          cep: string | null
          cidade: string | null
          created_at: string
          created_by: string | null
          documento: string | null
          email: string | null
          endereco: string | null
          estado: string | null
          id: string
          nome: string
          observacoes: string | null
          responsavel: string | null
          telefone: string | null
          tipo: Database["public"]["Enums"]["client_type"]
          updated_at: string
        }
        Insert: {
          categoria?: Database["public"]["Enums"]["client_category"]
          cep?: string | null
          cidade?: string | null
          created_at?: string
          created_by?: string | null
          documento?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          responsavel?: string | null
          telefone?: string | null
          tipo?: Database["public"]["Enums"]["client_type"]
          updated_at?: string
        }
        Update: {
          categoria?: Database["public"]["Enums"]["client_category"]
          cep?: string | null
          cidade?: string | null
          created_at?: string
          created_by?: string | null
          documento?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          responsavel?: string | null
          telefone?: string | null
          tipo?: Database["public"]["Enums"]["client_type"]
          updated_at?: string
        }
        Relationships: []
      }
      diagnostics: {
        Row: {
          area_m2: number | null
          classificacao: Database["public"]["Enums"]["client_category"]
          client_id: string | null
          created_at: string
          created_by: string | null
          id: string
          lead_id: string | null
          observacoes: string | null
          periodicidade: string | null
          praga_necessidade: string | null
          precisa_visita: boolean
          tipo_servico: Database["public"]["Enums"]["service_type"]
          urgencia: Database["public"]["Enums"]["urgency"]
          volume_l: number | null
        }
        Insert: {
          area_m2?: number | null
          classificacao?: Database["public"]["Enums"]["client_category"]
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id?: string | null
          observacoes?: string | null
          periodicidade?: string | null
          praga_necessidade?: string | null
          precisa_visita?: boolean
          tipo_servico: Database["public"]["Enums"]["service_type"]
          urgencia?: Database["public"]["Enums"]["urgency"]
          volume_l?: number | null
        }
        Update: {
          area_m2?: number | null
          classificacao?: Database["public"]["Enums"]["client_category"]
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id?: string | null
          observacoes?: string | null
          periodicidade?: string | null
          praga_necessidade?: string | null
          precisa_visita?: boolean
          tipo_servico?: Database["public"]["Enums"]["service_type"]
          urgencia?: Database["public"]["Enums"]["urgency"]
          volume_l?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "diagnostics_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostics_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      epis: {
        Row: {
          ativo: boolean
          ca: string | null
          created_at: string
          descricao: string | null
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          ca?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          ca?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          nome_contato: string
          notas: string | null
          origem: Database["public"]["Enums"]["lead_origin"]
          status: Database["public"]["Enums"]["lead_status"]
          telefone: string | null
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          nome_contato: string
          notas?: string | null
          origem?: Database["public"]["Enums"]["lead_origin"]
          status?: Database["public"]["Enums"]["lead_status"]
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          nome_contato?: string
          notas?: string | null
          origem?: Database["public"]["Enums"]["lead_origin"]
          status?: Database["public"]["Enums"]["lead_status"]
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      product_batches: {
        Row: {
          active: boolean
          batch_number: string
          created_at: string
          expiry_date: string | null
          id: string
          notes: string | null
          product_id: string
          purchase_order_id: string | null
          quantity_on_hand: number
          supplier_id: string | null
          supplier_name: string | null
          unit_cost: number | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          batch_number: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          notes?: string | null
          product_id: string
          purchase_order_id?: string | null
          quantity_on_hand?: number
          supplier_id?: string | null
          supplier_name?: string | null
          unit_cost?: number | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          batch_number?: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          notes?: string | null
          product_id?: string
          purchase_order_id?: string | null
          quantity_on_hand?: number
          supplier_id?: string | null
          supplier_name?: string | null
          unit_cost?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_batches_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_batches_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_batches_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      product_suppliers: {
        Row: {
          codigo_fornecedor: string | null
          created_at: string
          custo_referencia: number | null
          id: string
          lead_time_dias: number | null
          preferencial: boolean
          product_id: string
          supplier_id: string
          updated_at: string
        }
        Insert: {
          codigo_fornecedor?: string | null
          created_at?: string
          custo_referencia?: number | null
          id?: string
          lead_time_dias?: number | null
          preferencial?: boolean
          product_id: string
          supplier_id: string
          updated_at?: string
        }
        Update: {
          codigo_fornecedor?: string | null
          created_at?: string
          custo_referencia?: number | null
          id?: string
          lead_time_dias?: number | null
          preferencial?: boolean
          product_id?: string
          supplier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_suppliers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_suppliers_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          min_stock: number
          nome: string
          principio_ativo: string | null
          registro_ms: string | null
          unidade: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          min_stock?: number
          nome: string
          principio_ativo?: string | null
          registro_ms?: string | null
          unidade?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          min_stock?: number
          nome?: string
          principio_ativo?: string | null
          registro_ms?: string | null
          unidade?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      proposals: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          diagnostic_id: string | null
          id: string
          itens: Json
          lgpd_aceite: boolean
          margem_pct: number
          numero: number
          observacoes: string | null
          sent_at: string | null
          signature_doc_id: string | null
          signature_provider: string | null
          signature_url: string | null
          signed_at: string | null
          status: Database["public"]["Enums"]["proposal_status"]
          subtotal: number
          total: number
          updated_at: string
          validade_dias: number
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          diagnostic_id?: string | null
          id?: string
          itens?: Json
          lgpd_aceite?: boolean
          margem_pct?: number
          numero?: number
          observacoes?: string | null
          sent_at?: string | null
          signature_doc_id?: string | null
          signature_provider?: string | null
          signature_url?: string | null
          signed_at?: string | null
          status?: Database["public"]["Enums"]["proposal_status"]
          subtotal?: number
          total?: number
          updated_at?: string
          validade_dias?: number
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          diagnostic_id?: string | null
          id?: string
          itens?: Json
          lgpd_aceite?: boolean
          margem_pct?: number
          numero?: number
          observacoes?: string | null
          sent_at?: string | null
          signature_doc_id?: string | null
          signature_provider?: string | null
          signature_url?: string | null
          signed_at?: string | null
          status?: Database["public"]["Enums"]["proposal_status"]
          subtotal?: number
          total?: number
          updated_at?: string
          validade_dias?: number
        }
        Relationships: [
          {
            foreignKeyName: "proposals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_diagnostic_id_fkey"
            columns: ["diagnostic_id"]
            isOneToOne: false
            referencedRelation: "diagnostics"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          created_at: string
          custo_unitario: number
          id: string
          observacoes: string | null
          product_id: string
          purchase_order_id: string
          quantidade: number
          quantidade_recebida: number
          subtotal: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          custo_unitario?: number
          id?: string
          observacoes?: string | null
          product_id: string
          purchase_order_id: string
          quantidade: number
          quantidade_recebida?: number
          subtotal?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          custo_unitario?: number
          id?: string
          observacoes?: string | null
          product_id?: string
          purchase_order_id?: string
          quantidade?: number
          quantidade_recebida?: number
          subtotal?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          condicao_pagamento: string | null
          created_at: string
          created_by: string | null
          data_pedido: string
          data_prevista: string | null
          data_recebimento: string | null
          id: string
          numero: string
          observacoes: string | null
          status: Database["public"]["Enums"]["purchase_order_status"]
          subtotal: number
          supplier_id: string
          total: number
          updated_at: string
        }
        Insert: {
          condicao_pagamento?: string | null
          created_at?: string
          created_by?: string | null
          data_pedido?: string
          data_prevista?: string | null
          data_recebimento?: string | null
          id?: string
          numero?: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["purchase_order_status"]
          subtotal?: number
          supplier_id: string
          total?: number
          updated_at?: string
        }
        Update: {
          condicao_pagamento?: string | null
          created_at?: string
          created_by?: string | null
          data_pedido?: string
          data_prevista?: string | null
          data_recebimento?: string | null
          id?: string
          numero?: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["purchase_order_status"]
          subtotal?: number
          supplier_id?: string
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_blocks: {
        Row: {
          created_at: string
          created_by: string | null
          ends_at: string
          id: string
          notes: string | null
          reason: string
          starts_at: string
          team_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          ends_at: string
          id?: string
          notes?: string | null
          reason: string
          starts_at: string
          team_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          ends_at?: string
          id?: string
          notes?: string | null
          reason?: string
          starts_at?: string
          team_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedule_blocks_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      service_catalog: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          id: string
          nome: string
          preco_base: number
          tipo: Database["public"]["Enums"]["service_type"]
          unidade: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          preco_base?: number
          tipo: Database["public"]["Enums"]["service_type"]
          unidade?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          preco_base?: number
          tipo?: Database["public"]["Enums"]["service_type"]
          unidade?: string
        }
        Relationships: []
      }
      service_order_events: {
        Row: {
          actor_id: string | null
          at: string
          id: string
          payload: Json
          service_order_id: string
          tipo: string
        }
        Insert: {
          actor_id?: string | null
          at?: string
          id?: string
          payload?: Json
          service_order_id: string
          tipo: string
        }
        Update: {
          actor_id?: string | null
          at?: string
          id?: string
          payload?: Json
          service_order_id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_order_events_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      service_order_photos: {
        Row: {
          id: string
          legenda: string | null
          service_order_id: string
          storage_path: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          id?: string
          legenda?: string | null
          service_order_id: string
          storage_path: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          id?: string
          legenda?: string | null
          service_order_id?: string
          storage_path?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_order_photos_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      service_order_products: {
        Row: {
          created_at: string
          id: string
          is_extra: boolean
          lote: string | null
          nome: string
          observacao: string | null
          product_id: string | null
          quantidade_aplicada: number | null
          quantidade_prevista: number | null
          service_order_id: string
          unidade: string | null
          updated_at: string
          validade: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_extra?: boolean
          lote?: string | null
          nome: string
          observacao?: string | null
          product_id?: string | null
          quantidade_aplicada?: number | null
          quantidade_prevista?: number | null
          service_order_id: string
          unidade?: string | null
          updated_at?: string
          validade?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_extra?: boolean
          lote?: string | null
          nome?: string
          observacao?: string | null
          product_id?: string | null
          quantidade_aplicada?: number | null
          quantidade_prevista?: number | null
          service_order_id?: string
          unidade?: string | null
          updated_at?: string
          validade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_order_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_order_products_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      service_orders: {
        Row: {
          assinatura_responsavel: Json | null
          checkin_at: string | null
          checkin_by: string | null
          checkin_lat: number | null
          checkin_lng: number | null
          checklist: Json
          checkout_at: string | null
          checkout_by: string | null
          client_confirmation_status: string | null
          client_confirmed_at: string | null
          client_id: string
          confirmation_token: string | null
          created_at: string
          created_by: string | null
          data_prevista: string | null
          diagnostic_id: string | null
          epis: Json
          equipamentos: Json
          id: string
          instrucoes: string | null
          motivo_cancelamento: string | null
          numero: number
          observacoes: string | null
          observacoes_campo: string | null
          produtos_previstos: Json
          proposal_id: string | null
          public_token: string
          report_first_sent_at: string | null
          report_last_sent_at: string | null
          responsavel: string | null
          status: Database["public"]["Enums"]["os_status"]
          team_id: string | null
          updated_at: string
        }
        Insert: {
          assinatura_responsavel?: Json | null
          checkin_at?: string | null
          checkin_by?: string | null
          checkin_lat?: number | null
          checkin_lng?: number | null
          checklist?: Json
          checkout_at?: string | null
          checkout_by?: string | null
          client_confirmation_status?: string | null
          client_confirmed_at?: string | null
          client_id: string
          confirmation_token?: string | null
          created_at?: string
          created_by?: string | null
          data_prevista?: string | null
          diagnostic_id?: string | null
          epis?: Json
          equipamentos?: Json
          id?: string
          instrucoes?: string | null
          motivo_cancelamento?: string | null
          numero?: number
          observacoes?: string | null
          observacoes_campo?: string | null
          produtos_previstos?: Json
          proposal_id?: string | null
          public_token?: string
          report_first_sent_at?: string | null
          report_last_sent_at?: string | null
          responsavel?: string | null
          status?: Database["public"]["Enums"]["os_status"]
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          assinatura_responsavel?: Json | null
          checkin_at?: string | null
          checkin_by?: string | null
          checkin_lat?: number | null
          checkin_lng?: number | null
          checklist?: Json
          checkout_at?: string | null
          checkout_by?: string | null
          client_confirmation_status?: string | null
          client_confirmed_at?: string | null
          client_id?: string
          confirmation_token?: string | null
          created_at?: string
          created_by?: string | null
          data_prevista?: string | null
          diagnostic_id?: string | null
          epis?: Json
          equipamentos?: Json
          id?: string
          instrucoes?: string | null
          motivo_cancelamento?: string | null
          numero?: number
          observacoes?: string | null
          observacoes_campo?: string | null
          produtos_previstos?: Json
          proposal_id?: string | null
          public_token?: string
          report_first_sent_at?: string | null
          report_last_sent_at?: string | null
          responsavel?: string | null
          status?: Database["public"]["Enums"]["os_status"]
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_diagnostic_id_fkey"
            columns: ["diagnostic_id"]
            isOneToOne: false
            referencedRelation: "diagnostics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          batch_id: string | null
          created_at: string
          id: string
          movement_type: Database["public"]["Enums"]["stock_movement_type"]
          product_id: string
          purchase_order_id: string | null
          quantity: number
          reason: string | null
          service_order_id: string | null
          user_id: string | null
        }
        Insert: {
          batch_id?: string | null
          created_at?: string
          id?: string
          movement_type: Database["public"]["Enums"]["stock_movement_type"]
          product_id: string
          purchase_order_id?: string | null
          quantity: number
          reason?: string | null
          service_order_id?: string | null
          user_id?: string | null
        }
        Update: {
          batch_id?: string | null
          created_at?: string
          id?: string
          movement_type?: Database["public"]["Enums"]["stock_movement_type"]
          product_id?: string
          purchase_order_id?: string | null
          quantity?: number
          reason?: string | null
          service_order_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "product_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          ativo: boolean
          categorias: string[]
          cep: string | null
          cidade: string | null
          cnpj: string | null
          contato_nome: string | null
          created_at: string
          email: string | null
          endereco: string | null
          forma_pagamento: string | null
          id: string
          nome_fantasia: string | null
          observacoes: string | null
          prazo_pagamento: string | null
          razao_social: string
          telefone: string | null
          uf: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          categorias?: string[]
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          contato_nome?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          forma_pagamento?: string | null
          id?: string
          nome_fantasia?: string | null
          observacoes?: string | null
          prazo_pagamento?: string | null
          razao_social: string
          telefone?: string | null
          uf?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          categorias?: string[]
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          contato_nome?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          forma_pagamento?: string | null
          id?: string
          nome_fantasia?: string | null
          observacoes?: string | null
          prazo_pagamento?: string | null
          razao_social?: string
          telefone?: string | null
          uf?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      teams: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          id: string
          membros: Json
          nome: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          membros?: Json
          nome: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          membros?: Json
          nome?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_os_stock_deduction: { Args: { _os_id: string }; Returns: undefined }
      has_any_role: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      receive_purchase_order_item: {
        Args: {
          _batch_number: string
          _expiry_date: string
          _item_id: string
          _quantity: number
          _reason?: string
          _unit_cost: number
        }
        Returns: string
      }
      reverse_os_stock_deduction: {
        Args: { _os_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "comercial"
      client_category: "residencial" | "comercial" | "industrial" | "condominio"
      client_type: "PF" | "PJ"
      lead_origin:
        | "telefone"
        | "whatsapp"
        | "site"
        | "email"
        | "indicacao"
        | "retorno"
      lead_status:
        | "novo"
        | "em_diagnostico"
        | "proposta_enviada"
        | "ganho"
        | "perdido"
      os_status:
        | "aguardando_execucao"
        | "em_deslocamento"
        | "em_execucao"
        | "concluida"
        | "cancelada"
      proposal_status:
        | "rascunho"
        | "enviada"
        | "em_assinatura"
        | "aprovada"
        | "recusada"
        | "expirada"
      purchase_order_status:
        | "rascunho"
        | "enviado"
        | "confirmado"
        | "recebido_parcial"
        | "recebido"
        | "cancelado"
      service_type: "controle_pragas" | "higienizacao_reservatorio"
      stock_movement_type: "entrada" | "saida_os" | "ajuste" | "transferencia"
      urgency: "baixa" | "media" | "alta"
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
    Enums: {
      app_role: ["admin", "comercial"],
      client_category: ["residencial", "comercial", "industrial", "condominio"],
      client_type: ["PF", "PJ"],
      lead_origin: [
        "telefone",
        "whatsapp",
        "site",
        "email",
        "indicacao",
        "retorno",
      ],
      lead_status: [
        "novo",
        "em_diagnostico",
        "proposta_enviada",
        "ganho",
        "perdido",
      ],
      os_status: [
        "aguardando_execucao",
        "em_deslocamento",
        "em_execucao",
        "concluida",
        "cancelada",
      ],
      proposal_status: [
        "rascunho",
        "enviada",
        "em_assinatura",
        "aprovada",
        "recusada",
        "expirada",
      ],
      purchase_order_status: [
        "rascunho",
        "enviado",
        "confirmado",
        "recebido_parcial",
        "recebido",
        "cancelado",
      ],
      service_type: ["controle_pragas", "higienizacao_reservatorio"],
      stock_movement_type: ["entrada", "saida_os", "ajuste", "transferencia"],
      urgency: ["baixa", "media", "alta"],
    },
  },
} as const
