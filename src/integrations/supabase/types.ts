export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      crime_hotspots: {
        Row: {
          created_at: string;
          district: string;
          dominant_crime_type: string;
          id: string;
          incident_count: number;
          intensity: number;
          latitude: number;
          longitude: number;
          name: string;
          peak_window: string | null;
          station_name: string | null;
        };
        Insert: {
          created_at?: string;
          district: string;
          dominant_crime_type: string;
          id?: string;
          incident_count?: number;
          intensity?: number;
          latitude: number;
          longitude: number;
          name: string;
          peak_window?: string | null;
          station_name?: string | null;
        };
        Update: {
          created_at?: string;
          district?: string;
          dominant_crime_type?: string;
          id?: string;
          incident_count?: number;
          intensity?: number;
          latitude?: number;
          longitude?: number;
          name?: string;
          peak_window?: string | null;
          station_name?: string | null;
        };
        Relationships: [];
      };
      firs: {
        Row: {
          created_at: string;
          crime_type: string;
          district: string;
          fir_number: string;
          id: string;
          incident_date: string;
          incident_hour: number;
          investigating_officer: string | null;
          latitude: number | null;
          locality: string | null;
          longitude: number | null;
          loss_value: number;
          station_name: string;
          status: string;
          summary: string | null;
          suspect_code: string | null;
        };
        Insert: {
          created_at?: string;
          crime_type: string;
          district: string;
          fir_number: string;
          id?: string;
          incident_date: string;
          incident_hour?: number;
          investigating_officer?: string | null;
          latitude?: number | null;
          locality?: string | null;
          longitude?: number | null;
          loss_value?: number;
          station_name: string;
          status?: string;
          summary?: string | null;
          suspect_code?: string | null;
        };
        Update: {
          created_at?: string;
          crime_type?: string;
          district?: string;
          fir_number?: string;
          id?: string;
          incident_date?: string;
          incident_hour?: number;
          investigating_officer?: string | null;
          latitude?: number | null;
          locality?: string | null;
          longitude?: number | null;
          loss_value?: number;
          station_name?: string;
          status?: string;
          summary?: string | null;
          suspect_code?: string | null;
        };
        Relationships: [];
      };
      network_nodes: {
        Row: {
          created_at: string;
          district: string | null;
          id: string;
          label: string;
          linked_nodes: string[];
          node_id: string;
          node_type: string;
          pos_x: number;
          pos_y: number;
          suspect_code: string | null;
        };
        Insert: {
          created_at?: string;
          district?: string | null;
          id?: string;
          label: string;
          linked_nodes?: string[];
          node_id: string;
          node_type: string;
          pos_x?: number;
          pos_y?: number;
          suspect_code?: string | null;
        };
        Update: {
          created_at?: string;
          district?: string | null;
          id?: string;
          label?: string;
          linked_nodes?: string[];
          node_id?: string;
          node_type?: string;
          pos_x?: number;
          pos_y?: number;
          suspect_code?: string | null;
        };
        Relationships: [];
      };
      police_stations: {
        Row: {
          created_at: string;
          district: string;
          id: string;
          jurisdiction: string | null;
          latitude: number;
          longitude: number;
          name: string;
        };
        Insert: {
          created_at?: string;
          district: string;
          id?: string;
          jurisdiction?: string | null;
          latitude: number;
          longitude: number;
          name: string;
        };
        Update: {
          created_at?: string;
          district?: string;
          id?: string;
          jurisdiction?: string | null;
          latitude?: number;
          longitude?: number;
          name?: string;
        };
        Relationships: [];
      };
      suspects: {
        Row: {
          aliases: string[];
          created_at: string;
          cross_jurisdiction: string[];
          district: string;
          id: string;
          mo_description: string;
          mo_tags: string[];
          name: string;
          phone_numbers: string[];
          risk_score: number;
          station_name: string;
          status: string;
          suspect_code: string;
          vehicle: string | null;
        };
        Insert: {
          aliases?: string[];
          created_at?: string;
          cross_jurisdiction?: string[];
          district: string;
          id?: string;
          mo_description: string;
          mo_tags?: string[];
          name: string;
          phone_numbers?: string[];
          risk_score?: number;
          station_name: string;
          status?: string;
          suspect_code: string;
          vehicle?: string | null;
        };
        Update: {
          aliases?: string[];
          created_at?: string;
          cross_jurisdiction?: string[];
          district?: string;
          id?: string;
          mo_description?: string;
          mo_tags?: string[];
          name?: string;
          phone_numbers?: string[];
          risk_score?: number;
          station_name?: string;
          status?: string;
          suspect_code?: string;
          vehicle?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
