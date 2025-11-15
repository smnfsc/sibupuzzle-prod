-- ============================================
-- MIGRATION: Cache Intelligente per price_searches
-- Esegui questo script nel SQL Editor di Supabase
-- ============================================

-- Aggiungere colonne per tracciare lo snapshot del puzzle al momento della ricerca
ALTER TABLE public.price_searches 
ADD COLUMN IF NOT EXISTS puzzle_condition TEXT,
ADD COLUMN IF NOT EXISTS puzzle_pieces_count INTEGER,
ADD COLUMN IF NOT EXISTS puzzle_complete BOOLEAN,
ADD COLUMN IF NOT EXISTS puzzle_has_box BOOLEAN,
ADD COLUMN IF NOT EXISTS puzzle_author TEXT,
ADD COLUMN IF NOT EXISTS is_cache_hit BOOLEAN DEFAULT false;

-- Indice per ottimizzare le query di cache lookup
CREATE INDEX IF NOT EXISTS idx_price_searches_cache_lookup 
ON public.price_searches(puzzle_id, search_date DESC);

-- Commento sulla tabella
COMMENT ON COLUMN public.price_searches.puzzle_condition IS 'Snapshot della condizione del puzzle al momento della ricerca';
COMMENT ON COLUMN public.price_searches.puzzle_pieces_count IS 'Snapshot del numero di pezzi al momento della ricerca';
COMMENT ON COLUMN public.price_searches.puzzle_complete IS 'Snapshot dello stato di completezza al momento della ricerca';
COMMENT ON COLUMN public.price_searches.puzzle_has_box IS 'Snapshot della presenza della scatola al momento della ricerca';
COMMENT ON COLUMN public.price_searches.puzzle_author IS 'Snapshot dell autore/brand al momento della ricerca';
COMMENT ON COLUMN public.price_searches.is_cache_hit IS 'Indica se questo risultato è stato servito dalla cache';
