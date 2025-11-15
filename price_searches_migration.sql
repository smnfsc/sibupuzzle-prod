-- ============================================
-- MIGRATION: Tabella price_searches
-- Esegui questo script nel SQL Editor di Supabase
-- ============================================

-- Tabella per salvare le ricerche di prezzo
CREATE TABLE IF NOT EXISTS public.price_searches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  puzzle_id UUID NOT NULL REFERENCES public.puzzles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  search_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Dati della ricerca
  prices_data JSONB NOT NULL, -- Array di oggetti {country, currency, avg_price, min_price, max_price, availability_notes}
  
  -- Metadata
  first_photo_url TEXT, -- URL della foto usata per la ricerca
  model_used TEXT DEFAULT 'gpt-4o-mini',
  total_countries INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_price_searches_puzzle_id ON public.price_searches(puzzle_id);
CREATE INDEX IF NOT EXISTS idx_price_searches_user_id ON public.price_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_price_searches_date ON public.price_searches(search_date DESC);

-- RLS Policies
ALTER TABLE public.price_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own price searches"
  ON public.price_searches
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own price searches"
  ON public.price_searches
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own price searches"
  ON public.price_searches
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
