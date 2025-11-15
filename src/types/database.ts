export interface Database {
  public: {
    Tables: {
      puzzles: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          author: string | null;
          pieces_count: number;
          sale_platform: string;
          listed_for_sale: boolean;
          complete: boolean;
          assembled: boolean;
          has_box: boolean;
          condition: string;
          price: number | null;
          sold_price: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          author?: string | null;
          pieces_count: number;
          sale_platform?: string;
          listed_for_sale?: boolean;
          complete?: boolean;
          assembled?: boolean;
          has_box?: boolean;
          condition: string;
          price?: number | null;
          sold_price?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          author?: string | null;
          pieces_count?: number;
          sale_platform?: string;
          listed_for_sale?: boolean;
          complete?: boolean;
          assembled?: boolean;
          has_box?: boolean;
          condition?: string;
          price?: number | null;
          sold_price?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      puzzle_photos: {
        Row: {
          id: string;
          puzzle_id: string;
          storage_path: string;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          puzzle_id: string;
          storage_path: string;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          puzzle_id?: string;
          storage_path?: string;
          display_order?: number;
          created_at?: string;
        };
      };
      price_searches: {
        Row: {
          id: string;
          puzzle_id: string;
          user_id: string;
          search_date: string;
          prices_data: any;
          first_photo_url: string | null;
          model_used: string;
          total_countries: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          puzzle_id: string;
          user_id: string;
          search_date?: string;
          prices_data: any;
          first_photo_url?: string | null;
          model_used?: string;
          total_countries?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          puzzle_id?: string;
          user_id?: string;
          search_date?: string;
          prices_data?: any;
          first_photo_url?: string | null;
          model_used?: string;
          total_countries?: number;
          created_at?: string;
        };
      };
    };
  };
}
