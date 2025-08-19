/**
 * Database type definitions for Supabase
 * This file will be generated automatically when the database schema is created
 */

export interface Database {
  public: {
    Tables: {
      items: {
        Row: {
          id: string;
          category: 'ATV' | 'Snowmobile' | 'Trailer' | 'Small Engine';
          manufacturer: string;
          model: string;
          year: number | null;
          condition: number;
          asking_price: number;
          final_price: number | null;
          sold_price: number | null;
          purchase_location: string | null;
          purchase_date: string | null;
          sale_date: string | null;
          status: 'Available' | 'Pending' | 'Sold' | 'Hold';
          description: string;
          vin_serial: string | null;
          created_at: string;
          updated_at: string;
          created_by: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          category: 'ATV' | 'Snowmobile' | 'Trailer' | 'Small Engine';
          manufacturer: string;
          model: string;
          year?: number | null;
          condition: number;
          asking_price: number;
          final_price?: number | null;
          sold_price?: number | null;
          purchase_location?: string | null;
          purchase_date?: string | null;
          sale_date?: string | null;
          status?: 'Available' | 'Pending' | 'Sold' | 'Hold';
          description: string;
          vin_serial?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          category?: 'ATV' | 'Snowmobile' | 'Trailer' | 'Small Engine';
          manufacturer?: string;
          model?: string;
          year?: number | null;
          condition?: number;
          asking_price?: number;
          final_price?: number | null;
          sold_price?: number | null;
          purchase_location?: string | null;
          purchase_date?: string | null;
          sale_date?: string | null;
          status?: 'Available' | 'Pending' | 'Sold' | 'Hold';
          description?: string;
          vin_serial?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string;
          deleted_at?: string | null;
        };
      };
      item_photos: {
        Row: {
          id: string;
          item_id: string;
          url: string;
          is_primary: boolean;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          item_id: string;
          url: string;
          is_primary?: boolean;
          order_index: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          item_id?: string;
          url?: string;
          is_primary?: boolean;
          order_index?: number;
          created_at?: string;
        };
      };
      activity_log: {
        Row: {
          id: string;
          item_id: string | null;
          user_id: string;
          action: string;
          details: Record<string, any> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          item_id?: string | null;
          user_id: string;
          action: string;
          details?: Record<string, any> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          item_id?: string | null;
          user_id?: string;
          action?: string;
          details?: Record<string, any> | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      item_category: 'ATV' | 'Snowmobile' | 'Trailer' | 'Small Engine';
      item_status: 'Available' | 'Pending' | 'Sold' | 'Hold';
    };
  };
}