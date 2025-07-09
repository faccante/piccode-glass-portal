export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      download_analytics: {
        Row: {
          downloaded_at: string
          id: string
          ip_address: unknown | null
          package_id: string
          user_agent: string | null
        }
        Insert: {
          downloaded_at?: string
          id?: string
          ip_address?: unknown | null
          package_id: string
          user_agent?: string | null
        }
        Update: {
          downloaded_at?: string
          id?: string
          ip_address?: unknown | null
          package_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "download_analytics_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "package_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      file_scan_results: {
        Row: {
          created_at: string
          id: string
          package_version_id: string | null
          scan_date: string
          scan_details: Json | null
          scan_provider: string
          scan_status: string
        }
        Insert: {
          created_at?: string
          id?: string
          package_version_id?: string | null
          scan_date?: string
          scan_details?: Json | null
          scan_provider?: string
          scan_status?: string
        }
        Update: {
          created_at?: string
          id?: string
          package_version_id?: string | null
          scan_date?: string
          scan_details?: Json | null
          scan_provider?: string
          scan_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_scan_results_package_version_id_fkey"
            columns: ["package_version_id"]
            isOneToOne: false
            referencedRelation: "package_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      package_namespaces: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          approved_by_email: string | null
          author_email: string
          author_id: string
          created_at: string
          description: string
          github_repo: string
          id: string
          license: string
          name: string
          status: string
          total_downloads: number
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          approved_by_email?: string | null
          author_email: string
          author_id: string
          created_at?: string
          description: string
          github_repo: string
          id?: string
          license: string
          name: string
          status?: string
          total_downloads?: number
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          approved_by_email?: string | null
          author_email?: string
          author_id?: string
          created_at?: string
          description?: string
          github_repo?: string
          id?: string
          license?: string
          name?: string
          status?: string
          total_downloads?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "package_namespaces_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_namespaces_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      package_versions: {
        Row: {
          created_at: string
          downloads: number
          file_hash: string | null
          id: string
          jar_file_size: number | null
          jar_file_url: string | null
          malware_scan_date: string | null
          malware_scan_status: string | null
          package_namespace_id: string
          version: string
        }
        Insert: {
          created_at?: string
          downloads?: number
          file_hash?: string | null
          id?: string
          jar_file_size?: number | null
          jar_file_url?: string | null
          malware_scan_date?: string | null
          malware_scan_status?: string | null
          package_namespace_id: string
          version: string
        }
        Update: {
          created_at?: string
          downloads?: number
          file_hash?: string | null
          id?: string
          jar_file_size?: number | null
          jar_file_url?: string | null
          malware_scan_date?: string | null
          malware_scan_status?: string | null
          package_namespace_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "package_versions_package_namespace_id_fkey"
            columns: ["package_namespace_id"]
            isOneToOne: false
            referencedRelation: "package_namespaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: string
          updated_at: string
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          role?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      role_audit_log: {
        Row: {
          changed_at: string
          changed_by: string | null
          id: string
          new_role: string
          old_role: string | null
          reason: string | null
          target_user_id: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_role: string
          old_role?: string | null
          reason?: string | null
          target_user_id: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_role?: string
          old_role?: string | null
          reason?: string | null
          target_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_audit_log_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_avatar_pattern: {
        Args: { username: string }
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_manager: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_manager_or_moderator: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      search_profiles_by_email: {
        Args: { search_email: string }
        Returns: {
          id: string
          email: string
          full_name: string
          role: string
          avatar_url: string
        }[]
      }
    }
    Enums: {
      app_role: "user" | "manager" | "moderator"
      application_status: "pending" | "reviewed" | "accepted" | "rejected"
      job_status: "active" | "closed" | "draft"
      user_role: "job_seeker" | "employer"
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
      app_role: ["user", "manager", "moderator"],
      application_status: ["pending", "reviewed", "accepted", "rejected"],
      job_status: ["active", "closed", "draft"],
      user_role: ["job_seeker", "employer"],
    },
  },
} as const
