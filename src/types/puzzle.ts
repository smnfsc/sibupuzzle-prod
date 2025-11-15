export type SalePlatform = string; // Allows custom platforms while suggesting common ones
export type Condition = "Nuovo" | "Come nuovo" | "Buono" | "Usato" | "Danneggiato";

export interface Puzzle {
  id: string;
  title: string;
  author?: string;
  pieces_count: number;
  sale_platform: SalePlatform;
  listed_for_sale: boolean;
  complete: boolean;
  assembled: boolean;
  has_box: boolean;
  condition: Condition;
  purchase_price?: number;
  price?: number;
  sold_price?: number;
  production_year?: number;
  purchase_year?: number;
  photos: string[]; // base64 or data URLs
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PuzzleFilters {
  search: string;
  author?: string;
  sale_platform?: SalePlatform;
  listed_for_sale?: boolean;
  complete?: boolean;
  assembled?: boolean;
  condition?: Condition;
  min_pieces?: number;
  max_pieces?: number;
  production_year?: number;
  purchase_year?: number;
}

export type SortField = "pieces_count" | "title" | "updated_at" | "author" | "listed_for_sale" | "price";
export type SortOrder = "asc" | "desc";
