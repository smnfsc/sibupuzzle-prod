-- Add production_year and purchase_year fields to puzzles table
ALTER TABLE puzzles 
ADD COLUMN IF NOT EXISTS production_year INTEGER,
ADD COLUMN IF NOT EXISTS purchase_year INTEGER;

-- Add indexes for filtering
CREATE INDEX IF NOT EXISTS idx_puzzles_production_year ON puzzles(production_year);
CREATE INDEX IF NOT EXISTS idx_puzzles_purchase_year ON puzzles(purchase_year);

-- Add constraints to ensure reasonable years
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_production_year'
  ) THEN
    ALTER TABLE puzzles 
    ADD CONSTRAINT check_production_year CHECK (production_year IS NULL OR (production_year >= 1900 AND production_year <= 2100));
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_purchase_year'
  ) THEN
    ALTER TABLE puzzles 
    ADD CONSTRAINT check_purchase_year CHECK (purchase_year IS NULL OR (purchase_year >= 1900 AND purchase_year <= 2100));
  END IF;
END $$;
