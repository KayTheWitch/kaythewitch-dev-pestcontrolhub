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
      accounts_payable: {
        Row: {
          categoria_id: string | null
          created_at: string
          created_by: string | null
          data_emissao: string
          data_pagamento: string | null
          data_vencimento: string
          descricao: string
          forma_pagamento: Database["public"]["Enums"]["payment_method"] | null
          id: string
          numero: string
          observacoes: string | null
          purchase_order_id: string | null
          status: Database["public"]["Enums"]["financial_account_status"]
          supplier_id: string | null
          updated_at: string
          valor_original: number
          valor_pago: number
        }
        Insert: {
          categoria_id?: string | null
          created_at?: string
          created_by?: string | null
          data_emissao?: string
          data_pagamento?: string | null
          data_vencimento: string
          descricao: string
          forma_pagamento?: Database["public"]["Enums"]["payment_method"] | null
          id?: string
          numero: string
          observacoes?: string | null
          purchase_order_id?: string | null
          status?: Database["public"]["Enums"]["financial_account_status"]
          supplier_id?: string | null
          updated_at?: string
          valor_original: number
          valor_pago?: number
        }
        Update: {
          categoria_id?: string | null
          created_at?: string
          created_by?: string | null
          data_emissao?: string
          data_pagamento?: string | null
          data_vencimento?: string
          descricao?: string
          forma_pagamento?: Database["public"]["Enums"]["payment_method"] | null
          id?: string
          numero?: string
          observacoes?: string | null
          purchase_order_id?: string | null
          status?: Database["public"]["Enums"]["financial_account_status"]
          supplier_id?: string | null
          updated_at?: string
          valor_original?: number
          valor_pago?: number
        }
        Relationships: [
          {
            foreignKeyName: "accounts_payable_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "financial_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_payable_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_payable_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      accounts_receivable: {
        Row: {
          categoria_id: string | null
          client_id: string | null
          created_at: string
          created_by: string | null
          data_emissao: string
          data_pagamento: string | null
          data_vencimento: string
          descricao: string
          forma_pagamento: Database["public"]["Enums"]["payment_method"] | null
          id: string
          numero: string
          observacoes: string | null
          proposal_id: string | null
          service_order_id: string | null
          status: Database["public"]["Enums"]["financial_account_status"]
          updated_at: string
          valor_original: number
          valor_pago: number
        }
        Insert: {
          categoria_id?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          data_emissao?: string
          data_pagamento?: string | null
          data_vencimento: string
          descricao: string
          forma_pagamento?: Database["public"]["Enums"]["payment_method"] | null
          id?: string
          numero: string
          observacoes?: string | null
          proposal_id?: string | null
          service_order_id?: string | null
          status?: Database["public"]["Enums"]["financial_account_status"]
          updated_at?: string
          valor_original: number
          valor_pago?: number
        }
        Update: {
          categoria_id?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          data_emissao?: string
          data_pagamento?: string | null
          data_vencimento?: string
          descricao?: string
          forma_pagamento?: Database["public"]["Enums"]["payment_method"] | null
          id?: string
          numero?: string
          observacoes?: string | null
          proposal_id?: string | null
          service_order_id?: string | null
          status?: Database["public"]["Enums"]["financial_account_status"]
          updated_at?: string
          valor_original?: number
          valor_pago?: number
        }
        Relationships: [
          {
            foreignKeyName: "accounts_receivable_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "financial_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_receivable_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_receivable_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_receivable_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: true
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
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
      client_invitations: {
        Row: {
          accepted_at: string | null
          client_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          client_id: string
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          status?: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          client_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_invitations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
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
      epi_deliveries: {
        Row: {
          ca: string | null
          created_at: string
          created_by: string | null
          entregue_em: string
          epi_id: string
          ficha_pdf_path: string | null
          id: string
          observacoes: string | null
          quantidade: number
          updated_at: string
          user_id: string
          validade: string | null
        }
        Insert: {
          ca?: string | null
          created_at?: string
          created_by?: string | null
          entregue_em?: string
          epi_id: string
          ficha_pdf_path?: string | null
          id?: string
          observacoes?: string | null
          quantidade?: number
          updated_at?: string
          user_id: string
          validade?: string | null
        }
        Update: {
          ca?: string | null
          created_at?: string
          created_by?: string | null
          entregue_em?: string
          epi_id?: string
          ficha_pdf_path?: string | null
          id?: string
          observacoes?: string | null
          quantidade?: number
          updated_at?: string
          user_id?: string
          validade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "epi_deliveries_epi_id_fkey"
            columns: ["epi_id"]
            isOneToOne: false
            referencedRelation: "epis"
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
      financial_categories: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
          slug: string
          tipo: Database["public"]["Enums"]["financial_category_type"]
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
          slug: string
          tipo: Database["public"]["Enums"]["financial_category_type"]
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          slug?: string
          tipo?: Database["public"]["Enums"]["financial_category_type"]
          updated_at?: string
        }
        Relationships: []
      }
      financial_payments: {
        Row: {
          created_at: string
          data_pagamento: string
          forma_pagamento: Database["public"]["Enums"]["payment_method"]
          id: string
          observacoes: string | null
          payable_id: string | null
          receivable_id: string | null
          tipo: Database["public"]["Enums"]["financial_account_kind"]
          user_id: string | null
          valor: number
        }
        Insert: {
          created_at?: string
          data_pagamento?: string
          forma_pagamento: Database["public"]["Enums"]["payment_method"]
          id?: string
          observacoes?: string | null
          payable_id?: string | null
          receivable_id?: string | null
          tipo: Database["public"]["Enums"]["financial_account_kind"]
          user_id?: string | null
          valor: number
        }
        Update: {
          created_at?: string
          data_pagamento?: string
          forma_pagamento?: Database["public"]["Enums"]["payment_method"]
          id?: string
          observacoes?: string | null
          payable_id?: string | null
          receivable_id?: string | null
          tipo?: Database["public"]["Enums"]["financial_account_kind"]
          user_id?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "financial_payments_payable_id_fkey"
            columns: ["payable_id"]
            isOneToOne: false
            referencedRelation: "accounts_payable"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_payments_receivable_id_fkey"
            columns: ["receivable_id"]
            isOneToOne: false
            referencedRelation: "accounts_receivable"
            referencedColumns: ["id"]
          },
        ]
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
      os_technical_responsible: {
        Row: {
          art_numero: string | null
          art_validade: string | null
          created_at: string
          os_id: string
          rt_conselho: string
          rt_id: string
          rt_nome: string
          rt_registro: string
        }
        Insert: {
          art_numero?: string | null
          art_validade?: string | null
          created_at?: string
          os_id: string
          rt_conselho: string
          rt_id: string
          rt_nome: string
          rt_registro: string
        }
        Update: {
          art_numero?: string | null
          art_validade?: string | null
          created_at?: string
          os_id?: string
          rt_conselho?: string
          rt_id?: string
          rt_nome?: string
          rt_registro?: string
        }
        Relationships: [
          {
            foreignKeyName: "os_technical_responsible_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: true
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_technical_responsible_rt_id_fkey"
            columns: ["rt_id"]
            isOneToOne: false
            referencedRelation: "technical_responsibles"
            referencedColumns: ["id"]
          },
        ]
      }
      packaging_returns: {
        Row: {
          comprovante_path: string | null
          created_at: string
          created_by: string | null
          devolvido_em: string
          id: string
          observacoes: string | null
          product_id: string
          quantidade: number
          supplier_id: string | null
          updated_at: string
        }
        Insert: {
          comprovante_path?: string | null
          created_at?: string
          created_by?: string | null
          devolvido_em?: string
          id?: string
          observacoes?: string | null
          product_id: string
          quantidade: number
          supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          comprovante_path?: string | null
          created_at?: string
          created_by?: string | null
          devolvido_em?: string
          id?: string
          observacoes?: string | null
          product_id?: string
          quantidade?: number
          supplier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "packaging_returns_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "packaging_returns_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
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
          antidoto: string | null
          ativo: boolean
          classe_toxicologica: string | null
          created_at: string
          grupo_quimico: string | null
          id: string
          min_stock: number
          nome: string
          principio_ativo: string | null
          registro_ms: string | null
          telefone_cit: string | null
          unidade: string
        }
        Insert: {
          antidoto?: string | null
          ativo?: boolean
          classe_toxicologica?: string | null
          created_at?: string
          grupo_quimico?: string | null
          id?: string
          min_stock?: number
          nome: string
          principio_ativo?: string | null
          registro_ms?: string | null
          telefone_cit?: string | null
          unidade?: string
        }
        Update: {
          antidoto?: string | null
          ativo?: boolean
          classe_toxicologica?: string | null
          created_at?: string
          grupo_quimico?: string | null
          id?: string
          min_stock?: number
          nome?: string
          principio_ativo?: string | null
          registro_ms?: string | null
          telefone_cit?: string | null
          unidade?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          client_id: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
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
      regulatory_documents: {
        Row: {
          arquivo_path: string | null
          created_at: string
          created_by: string | null
          id: string
          numero: string | null
          observacoes: string | null
          product_id: string
          tipo: string
          updated_at: string
          validade: string | null
        }
        Insert: {
          arquivo_path?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          numero?: string | null
          observacoes?: string | null
          product_id: string
          tipo: string
          updated_at?: string
          validade?: string | null
        }
        Update: {
          arquivo_path?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          numero?: string | null
          observacoes?: string | null
          product_id?: string
          tipo?: string
          updated_at?: string
          validade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "regulatory_documents_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
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
      service_certificates: {
        Row: {
          ano: number
          created_at: string
          emitido_em: string
          id: string
          numero_ces: string
          seq: number
          service_order_id: string
          snapshot_json: Json
          token_publico: string
        }
        Insert: {
          ano: number
          created_at?: string
          emitido_em?: string
          id?: string
          numero_ces: string
          seq: number
          service_order_id: string
          snapshot_json?: Json
          token_publico: string
        }
        Update: {
          ano?: number
          created_at?: string
          emitido_em?: string
          id?: string
          numero_ces?: string
          seq?: number
          service_order_id?: string
          snapshot_json?: Json
          token_publico?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_certificates_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: true
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
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
      technical_responsibles: {
        Row: {
          art_numero: string | null
          art_pdf_path: string | null
          art_validade: string | null
          ativo: boolean
          conselho: string
          created_at: string
          id: string
          nome: string
          observacoes: string | null
          registro: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          art_numero?: string | null
          art_pdf_path?: string | null
          art_validade?: string | null
          ativo?: boolean
          conselho: string
          created_at?: string
          id?: string
          nome: string
          observacoes?: string | null
          registro: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          art_numero?: string | null
          art_pdf_path?: string | null
          art_validade?: string | null
          ativo?: boolean
          conselho?: string
          created_at?: string
          id?: string
          nome?: string
          observacoes?: string | null
          registro?: string
          updated_at?: string
          user_id?: string | null
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
      _bi_assert_role: { Args: never; Returns: undefined }
      accept_client_invitation: { Args: { _token: string }; Returns: string }
      apply_os_stock_deduction: { Args: { _os_id: string }; Returns: undefined }
      bi_financial_dre: {
        Args: { _from: string; _to: string }
        Returns: {
          despesa: number
          mes: string
          receita: number
          resultado: number
        }[]
      }
      bi_lead_funnel: {
        Args: { _from: string; _to: string }
        Returns: {
          status: string
          total: number
        }[]
      }
      bi_os_throughput: {
        Args: { _from: string; _to: string }
        Returns: {
          avg_execution_hours: number
          status: string
          total: number
        }[]
      }
      bi_payables_aging: {
        Args: never
        Returns: {
          bucket: string
          total: number
          valor: number
        }[]
      }
      bi_proposal_metrics: {
        Args: { _from: string; _to: string }
        Returns: {
          status: string
          ticket_medio: number
          total: number
          valor_total: number
        }[]
      }
      bi_receivables_aging: {
        Args: never
        Returns: {
          bucket: string
          total: number
          valor: number
        }[]
      }
      bi_stock_critical: {
        Args: never
        Returns: {
          min_stock: number
          product_id: string
          produto: string
          saldo: number
          vencendo_30: number
          vencendo_60: number
          vencendo_90: number
        }[]
      }
      bi_supplier_performance: {
        Args: { _from: string; _to: string }
        Returns: {
          fornecedor: string
          lead_time_medio_dias: number
          pedidos: number
          supplier_id: string
          total_comprado: number
        }[]
      }
      bi_team_productivity: {
        Args: { _from: string; _to: string }
        Returns: {
          avg_field_hours: number
          os_concluidas: number
          team_id: string
          team_nome: string
        }[]
      }
      cancel_receivable_from_os: {
        Args: { _os_id: string }
        Returns: undefined
      }
      create_receivable_from_os: { Args: { _os_id: string }; Returns: string }
      current_portal_client_id: { Args: never; Returns: string }
      has_any_role: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      issue_service_certificate: { Args: { _os_id: string }; Returns: string }
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
      refresh_overdue_accounts: { Args: never; Returns: undefined }
      register_financial_payment: {
        Args: {
          _account_id: string
          _data_pagamento: string
          _forma: Database["public"]["Enums"]["payment_method"]
          _obs?: string
          _tipo: Database["public"]["Enums"]["financial_account_kind"]
          _valor: number
        }
        Returns: string
      }
      reverse_os_stock_deduction: {
        Args: { _os_id: string }
        Returns: undefined
      }
      upsert_payable_from_po: { Args: { _po_id: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "comercial" | "cliente"
      client_category: "residencial" | "comercial" | "industrial" | "condominio"
      client_type: "PF" | "PJ"
      financial_account_kind: "receber" | "pagar"
      financial_account_status:
        | "aberto"
        | "parcialmente_pago"
        | "pago"
        | "vencido"
        | "cancelado"
      financial_category_type: "receita" | "despesa"
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
      payment_method:
        | "pix"
        | "boleto"
        | "dinheiro"
        | "cartao"
        | "transferencia"
        | "outro"
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
      app_role: ["admin", "comercial", "cliente"],
      client_category: ["residencial", "comercial", "industrial", "condominio"],
      client_type: ["PF", "PJ"],
      financial_account_kind: ["receber", "pagar"],
      financial_account_status: [
        "aberto",
        "parcialmente_pago",
        "pago",
        "vencido",
        "cancelado",
      ],
      financial_category_type: ["receita", "despesa"],
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
      payment_method: [
        "pix",
        "boleto",
        "dinheiro",
        "cartao",
        "transferencia",
        "outro",
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
