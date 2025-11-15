-- ============================================
-- MIGRATION: Aggiungi campo purchase_price
-- Esegui questo script nel SQL Editor di Supabase
-- ============================================

-- Aggiungi colonna purchase_price alla tabella puzzles
ALTER TABLE public.puzzles 
ADD COLUMN IF NOT EXISTS purchase_price NUMERIC(10, 2);

-- Commento sulla colonna
COMMENT ON COLUMN public.puzzles.purchase_price IS 'Prezzo di acquisto del puzzle';
