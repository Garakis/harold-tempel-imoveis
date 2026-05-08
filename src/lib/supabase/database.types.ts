export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      cities: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          uf: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          uf: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          uf?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          assigned_to: string | null
          created_at: string
          email: string | null
          id: string
          ip_address: unknown
          message: string | null
          metadata: Json
          name: string
          notes: string | null
          phone: string | null
          property_id: string | null
          source: Database["public"]["Enums"]["lead_source"]
          status: Database["public"]["Enums"]["lead_status"]
          type: Database["public"]["Enums"]["lead_type"]
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          email?: string | null
          id?: string
          ip_address?: unknown
          message?: string | null
          metadata?: Json
          name: string
          notes?: string | null
          phone?: string | null
          property_id?: string | null
          source: Database["public"]["Enums"]["lead_source"]
          status?: Database["public"]["Enums"]["lead_status"]
          type: Database["public"]["Enums"]["lead_type"]
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          email?: string | null
          id?: string
          ip_address?: unknown
          message?: string | null
          metadata?: Json
          name?: string
          notes?: string | null
          phone?: string | null
          property_id?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          status?: Database["public"]["Enums"]["lead_status"]
          type?: Database["public"]["Enums"]["lead_type"]
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      neighborhoods: {
        Row: {
          city_id: string
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          city_id: string
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          city_id?: string
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      owners: {
        Row: {
          approved_environmental_agency: boolean
          approved_project: boolean
          created_at: string
          created_by: string | null
          doc_agua: string | null
          doc_eletricidade: string | null
          doc_iptu: string | null
          doc_matricula: string | null
          doc_observations: string | null
          email: string | null
          id: string
          name: string
          observations: string | null
          phone: string | null
          reference: string | null
          rights_titles: string | null
          spouse_email: string | null
          spouse_name: string | null
          spouse_phone: string | null
          updated_at: string
        }
        Insert: Partial<Database["public"]["Tables"]["owners"]["Row"]> & { name: string }
        Update: Partial<Database["public"]["Tables"]["owners"]["Row"]>
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          role: string
          updated_at: string
        }
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          id: string
          full_name: string
          email: string
        }
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>
        Relationships: []
      }
      properties: {
        Row: {
          accepts_exchange: boolean
          accepts_financing: boolean
          accepts_pet: boolean | null
          appraisal_rental: number | null
          appraisal_sale: number | null
          authorization_signed: boolean
          authorization_until: string | null
          bathrooms: number
          bedrooms: number
          building_position: string | null
          built_area_m2: number | null
          cep: string | null
          city_id: string
          code: string
          common_area_m2: number | null
          complement: string | null
          condo_administrator: string | null
          condo_block: string | null
          condo_fee: number | null
          condo_name: string | null
          created_at: string
          created_by: string | null
          description: string | null
          exclusive: boolean
          exclusive_until: string | null
          facade_position: string | null
          features: Json
          floors_count: number | null
          hide_address: boolean
          id: string
          internal_notes: string | null
          iptu_yearly: number | null
          is_featured: boolean
          is_published: boolean
          is_super_featured: boolean
          last_published_at: string | null
          latitude: number | null
          longitude: number | null
          meta_description: string | null
          meta_title: string | null
          modality: Database["public"]["Enums"]["property_modality"]
          neighborhood_id: string | null
          number: string | null
          owner_id: string | null
          parking_spaces: number
          private_area_m2: number | null
          purpose_id: string
          reference_point: string | null
          rental_period: string | null
          rental_price: number | null
          rural_features: Json
          sale_price: number | null
          slug: string
          status: Database["public"]["Enums"]["property_status"]
          street: string | null
          suites: number
          title: string | null
          topography: string | null
          total_area_m2: number | null
          type_id: string
          units_per_floor: number | null
          updated_at: string
          updated_by: string | null
          used_fgts_recently: boolean
          useful_area_m2: number | null
          year_built: number | null
          year_renovated: number | null
        }
        Insert: Partial<Database["public"]["Tables"]["properties"]["Row"]> & {
          code: string
          slug: string
          type_id: string
          purpose_id: string
          city_id: string
          modality: Database["public"]["Enums"]["property_modality"]
        }
        Update: Partial<Database["public"]["Tables"]["properties"]["Row"]>
        Relationships: []
      }
      property_photos: {
        Row: {
          alt_text: string | null
          created_at: string
          height: number | null
          id: string
          is_cover: boolean
          property_id: string
          public_url: string
          size_bytes: number | null
          sort_order: number
          storage_path: string
          watermarked: boolean
          width: number | null
        }
        Insert: Partial<Database["public"]["Tables"]["property_photos"]["Row"]> & {
          property_id: string
          storage_path: string
          public_url: string
        }
        Update: Partial<Database["public"]["Tables"]["property_photos"]["Row"]>
        Relationships: []
      }
      property_purposes: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: Partial<Database["public"]["Tables"]["property_purposes"]["Row"]> & {
          name: string
          slug: string
        }
        Update: Partial<Database["public"]["Tables"]["property_purposes"]["Row"]>
        Relationships: []
      }
      property_types: {
        Row: {
          created_at: string
          id: string
          is_rural: boolean
          name: string
          slug: string
          sort_order: number
        }
        Insert: Partial<Database["public"]["Tables"]["property_types"]["Row"]> & {
          name: string
          slug: string
        }
        Update: Partial<Database["public"]["Tables"]["property_types"]["Row"]>
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: Partial<Database["public"]["Tables"]["site_settings"]["Row"]> & {
          key: string
          value: Json
        }
        Update: Partial<Database["public"]["Tables"]["site_settings"]["Row"]>
        Relationships: []
      }
      visits: {
        Row: {
          created_at: string
          created_by: string | null
          duration_minutes: number
          id: string
          lead_id: string | null
          notes: string | null
          property_id: string
          scheduled_at: string
          status: Database["public"]["Enums"]["visit_status"]
          updated_at: string
          visitor_email: string | null
          visitor_name: string
          visitor_phone: string | null
        }
        Insert: Partial<Database["public"]["Tables"]["visits"]["Row"]> & {
          property_id: string
          scheduled_at: string
          visitor_name: string
        }
        Update: Partial<Database["public"]["Tables"]["visits"]["Row"]>
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: {
      lead_source:
        | "form_contato"
        | "form_imovel"
        | "form_cadastrar"
        | "form_encomendar"
        | "whatsapp"
        | "manual"
      lead_status: "novo" | "em_atendimento" | "fechado" | "perdido"
      lead_type:
        | "contato"
        | "cadastrar_imovel"
        | "encomendar_imovel"
        | "interesse_imovel"
        | "agendar_visita"
      property_modality: "venda" | "aluguel" | "temporada" | "venda_aluguel"
      property_status:
        | "rascunho"
        | "ativo"
        | "inativo"
        | "vendido"
        | "alugado"
        | "reservado"
      visit_status:
        | "agendado"
        | "confirmado"
        | "realizado"
        | "cancelado"
        | "nao_compareceu"
    }
    CompositeTypes: { [_ in never]: never }
  }
}
