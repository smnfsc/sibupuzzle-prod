export interface PriceSearchData {
  country: string;
  country_code: string; // IT, DE, FR, GB
  currency: string; // EUR, GBP
  avg_price: number;
  min_price: number;
  max_price: number;
  availability_notes: string; // "Comune", "Raro", "Difficile da trovare"
}

export interface PriceSearch {
  id: string;
  puzzle_id: string;
  user_id: string;
  search_date: string;
  prices_data: PriceSearchData[];
  first_photo_url: string | null;
  model_used: string;
  total_countries: number;
  created_at: string;
}
