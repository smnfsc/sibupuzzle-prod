-- ============================================
-- INSERIMENTO BULK PUZZLE DA FOGLI CARTACEI
-- ============================================
-- IMPORTANTE: Verifica e correggi i dati prima di eseguire!
-- I campi contrassegnati con -- TODO: necessitano verifica
-- ============================================

-- Note sulla mappatura:
-- - Vinted "Sì" = listed_for_sale: true, sale_platform: 'Vinted'
-- - Vinted "No" = listed_for_sale: false, sale_platform: 'Nessuna'
-- - Completo: "OK"/"Sì" = complete: true
-- - Fatto: "OK"/"Sì" = assembled: true  
-- - Scatola: "OK"/"Sì" = has_box: true
-- - Condition: impostato di default a 'Buono' (modificare se necessario)
-- - I campi "?" indicano dati non chiari dal foglio

-- ============================================
-- FOGLIO 1 - Circa 19 puzzle
-- ============================================

-- 1. Jig Saw Puzzle
INSERT INTO public.puzzles (title, author, pieces_count, sale_platform, listed_for_sale, complete, assembled, has_box, condition, price, user_id)
VALUES (
  'Jig Saw Puzzle', 
  'Ravensburger', 
  1000, 
  'Nessuna',
  false, 
  false, -- TODO: Verificare "?" su foglio
  false, 
  true, 
  'Buono', 
  2.80,
  '4576d406-7b3e-4bed-9e05-33dcab9af8e1'
);

-- 2. The Kiss
INSERT INTO public.puzzles (title, author, pieces_count, sale_platform, listed_for_sale, complete, assembled, has_box, condition, price, user_id)
VALUES (
  'The Kiss', 
  'Trefl', 
  1000, 
  'Vinted', 
  true, 
  true, 
  true, 
  true, 
  'Buono', -- TODO: Verificare "ok guinnes" - possibile condizione diversa
  4.90,
  '4576d406-7b3e-4bed-9e05-33dcab9af8e1'
);

-- 3. Schlump Down
INSERT INTO public.puzzles (title, author, pieces_count, sale_platform, listed_for_sale, complete, assembled, has_box, condition, price, user_id)
VALUES (
  'Schlump Down', 
  'Ravensburger', 
  1000, 
  'Vinted', 
  true, 
  false, -- TODO: Verificare "?" su foglio
  false, 
  true, 
  'Buono', 
  4.00,
  '4576d406-7b3e-4bed-9e05-33dcab9af8e1'
);

-- 4. Oliver Truck
INSERT INTO public.puzzles (title, author, pieces_count, sale_platform, listed_for_sale, complete, assembled, has_box, condition, price, user_id)
VALUES (
  'Oliver Truck', 
  'Trefl', 
  1000, 
  'Vinted', 
  true, 
  false, -- TODO: Verificare "?" su foglio
  false, 
  true, 
  'Buono', 
  4.00,
  '4576d406-7b3e-4bed-9e05-33dcab9af8e1'
);

-- 5. Big Surprise
INSERT INTO public.puzzles (title, author, pieces_count, sale_platform, listed_for_sale, complete, assembled, has_box, condition, price, user_id)
VALUES (
  'Big Surprise', 
  'Trefl', 
  1000, 
  'Nessuna',
  false, 
  true, 
  false, 
  true, 
  'Buono', 
  5.90,
  '4576d406-7b3e-4bed-9e05-33dcab9af8e1'
);

-- 6. The 3 Day Collection
INSERT INTO public.puzzles (title, author, pieces_count, sale_platform, listed_for_sale, complete, assembled, has_box, condition, price, user_id)
VALUES (
  'The 3 Day Collection', 
  'Ravensburger', 
  1000, 
  'Nessuna',
  false, 
  false, -- TODO: Verificare "?" su foglio
  false, 
  true, -- TODO: Verificare "sì Damn"
  'Buono', 
  3.00,
  '4576d406-7b3e-4bed-9e05-33dcab9af8e1'
);

-- 7. Meraviglioso
INSERT INTO public.puzzles (title, author, pieces_count, sale_platform, listed_for_sale, complete, assembled, has_box, condition, price, user_id)
VALUES (
  'Meraviglioso', 
  'Educa', 
  1000, 
  'Vinted', 
  true, 
  false, -- TODO: Verificare "?" su foglio
  false, 
  true, 
  'Buono', 
  3.50,
  '4576d406-7b3e-4bed-9e05-33dcab9af8e1'
);

-- 8. Memory il Puzzle
INSERT INTO public.puzzles (title, author, pieces_count, sale_platform, listed_for_sale, complete, assembled, has_box, condition, price, user_id)
VALUES (
  'Memory il Puzzle', 
  'Trefl', 
  750, 
  'Vinted', 
  true, 
  false, -- TODO: Verificare "?" su foglio
  false, 
  true, 
  'Buono', 
  4.90,
  '4576d406-7b3e-4bed-9e05-33dcab9af8e1'
);

-- 9. Clips Animali
INSERT INTO public.puzzles (title, author, pieces_count, sale_platform, listed_for_sale, complete, assembled, has_box, condition, price, user_id)
VALUES (
  'Clips Animali', 
  'Educa', 
  1500, 
  'Vinted', 
  true, 
  false, -- TODO: Verificare "?" su foglio
  false, 
  true, 
  'Buono', 
  4.00, -- TODO: Prezzo non visibile, verificare
  '4576d406-7b3e-4bed-9e05-33dcab9af8e1'
);

-- 10. Bibliografia
INSERT INTO public.puzzles (title, author, pieces_count, sale_platform, listed_for_sale, complete, assembled, has_box, condition, price, user_id)
VALUES (
  'Bibliografia', 
  'Clementoni', 
  1200, 
  'Vinted', 
  true, 
  false, -- TODO: Verificare "?" su foglio
  false, 
  true, -- TODO: Verificare "OK Pinna"
  'Buono', 
  5.50,
  '4576d406-7b3e-4bed-9e05-33dcab9af8e1'
);

-- 11. Editorial Faber
INSERT INTO public.puzzles (title, author, pieces_count, sale_platform, listed_for_sale, complete, assembled, has_box, condition, price, user_id)
VALUES (
  'Editorial Faber', 
  'Clementoni', 
  2000, 
  'Vinted', 
  true, 
  false, -- TODO: Verificare "?" su foglio
  false, 
  true, 
  'Buono', 
  4.50,
  '4576d406-7b3e-4bed-9e05-33dcab9af8e1'
);

-- 12. J.W.L.
INSERT INTO public.puzzles (title, author, pieces_count, sale_platform, listed_for_sale, complete, assembled, has_box, condition, price, user_id)
VALUES (
  'J.W.L.', 
  'Trefl', 
  2000, 
  'Vinted', 
  true, 
  false, -- TODO: Verificare "?" su foglio
  false, 
  true, 
  'Buono', 
  4.50,
  '4576d406-7b3e-4bed-9e05-33dcab9af8e1'
);

-- 13. Dance Jimi Arras (Dance of Jimi Arras?)
INSERT INTO public.puzzles (title, author, pieces_count, sale_platform, listed_for_sale, complete, assembled, has_box, condition, price, user_id)
VALUES (
  'Dance of Jimi Arras', -- TODO: Verificare titolo esatto
  'Trefl', 
  1500, 
  'Vinted', 
  true, 
  true, -- TODO: Verificare "Suddato" - sembra "Sudato"?
  false, 
  true, 
  'Buono', 
  2.80,
  '4576d406-7b3e-4bed-9e05-33dcab9af8e1'
);

-- 14. Vicenda Royal
INSERT INTO public.puzzles (title, author, pieces_count, sale_platform, listed_for_sale, complete, assembled, has_box, condition, price, user_id)
VALUES (
  'Vicenda Royal', -- TODO: Verificare titolo
  'Educa', 
  1000, 
  'Vinted', 
  true, 
  true, -- TODO: Verificare "Similiano"
  false, 
  true, 
  'Buono', 
  3.50,
  '4576d406-7b3e-4bed-9e05-33dcab9af8e1'
);

-- 15. In Lotus
INSERT INTO public.puzzles (title, author, pieces_count, sale_platform, listed_for_sale, complete, assembled, has_box, condition, price, user_id)
VALUES (
  'In Lotus', -- TODO: Verificare titolo
  'Ravensburger', 
  1000, 
  'Vinted', 
  true, 
  true, -- TODO: Verificare "Similiano"
  false, 
  true, 
  'Buono', 
  6.80,
  '4576d406-7b3e-4bed-9e05-33dcab9af8e1'
);

-- 16. L'Ambrutto
INSERT INTO public.puzzles (title, author, pieces_count, sale_platform, listed_for_sale, complete, assembled, has_box, condition, price, user_id)
VALUES (
  'L''Ambrutto', -- TODO: Verificare titolo
  'Educa', 
  1000, 
  'Nessuna',
  false, 
  false, -- TODO: Verificare "?" su foglio
  false, 
  true, 
  'Buono', 
  4.50,
  '4576d406-7b3e-4bed-9e05-33dcab9af8e1'
);

-- 17. Jungle Walks
INSERT INTO public.puzzles (title, author, pieces_count, sale_platform, listed_for_sale, complete, assembled, has_box, condition, price, user_id)
VALUES (
  'Jungle Walks', -- TODO: Verificare titolo
  'Ravensburger', 
  1000, 
  'Vinted', 
  true, 
  false, -- TODO: Verificare "?" su foglio
  false, 
  true, 
  'Buono', 
  3.80,
  '4576d406-7b3e-4bed-9e05-33dcab9af8e1'
);

-- 18. Partenon
INSERT INTO public.puzzles (title, author, pieces_count, sale_platform, listed_for_sale, complete, assembled, has_box, condition, price, user_id)
VALUES (
  'Partenon', 
  'Trefl', 
  1000, 
  'Vinted', 
  true, 
  false, -- TODO: Verificare "?" su foglio
  false, 
  true, 
  'Buono', 
  6.50,
  '4576d406-7b3e-4bed-9e05-33dcab9af8e1'
);

-- 19. Puzzle senza titolo chiaro
INSERT INTO public.puzzles (title, author, pieces_count, sale_platform, listed_for_sale, complete, assembled, has_box, condition, price, user_id)
VALUES (
  'Puzzle da identificare', -- TODO: TITOLO E AUTORE NON LEGGIBILI
  'Da verificare', 
  1000, 
  'Vinted', 
  true, 
  true, 
  false, 
  true, 
  'Buono', 
  2.30,
  '4576d406-7b3e-4bed-9e05-33dcab9af8e1'
);

-- ============================================
-- FOGLIO 2 - Circa 24 puzzle
-- ============================================

-- 1. Importantissimi
INSERT INTO public.puzzles (title, author, pieces_count, sale_platform, listed_for_sale, complete, assembled, has_box, condition, price, user_id)
VALUES (
  'Importantissimi', 
  'Trefl', 
  750, 
  'Vinted', 
  true, 
  false, -- TODO: Verificare "?" su foglio
  false, 
  true, 
  'Buono', 
  6.50,
  '4576d406-7b3e-4bed-9e05-33dcab9af8e1'
);

-- 2. Lost Art
INSERT INTO public.puzzles (title, author, pieces_count, sale_platform, listed_for_sale, complete, assembled, has_box, condition, price, user_id)
VALUES (
  'Lost Art', 
  'Trefl', 
  1500, 
  'Vinted', 
  true, 
  false, -- TODO: Verificare "?" su foglio
  false, 
  true, 
  'Buono', 
  5.00,
  '4576d406-7b3e-4bed-9e05-33dcab9af8e1'
);

-- 3. Zero Cruise
INSERT INTO public.puzzles (title, author, pieces_count, sale_platform, listed_for_sale, complete, assembled, has_box, condition, price, user_id)
VALUES (
  'Zero Cruise', 
  'Ravensburger', 
  1000, 
  'Vinted', 
  true, 
  true, 
  false, 
  true, 
  'Buono', 
  4.50,
  '4576d406-7b3e-4bed-9e05-33dcab9af8e1'
);

-- 4. Stattadtree
INSERT INTO public.puzzles (title, author, pieces_count, sale_platform, listed_for_sale, complete, assembled, has_box, condition, price, user_id)
VALUES (
  'Stattadtree', -- TODO: Verificare titolo
  'Trefl', 
  1000, 
  'Vinted', 
  true, 
  true, 
  false, 
  true, 
  'Buono', 
  5.00,
  '4576d406-7b3e-4bed-9e05-33dcab9af8e1'
);

-- 5. Speedi
INSERT INTO public.puzzles (title, author, pieces_count, sale_platform, listed_for_sale, complete, assembled, has_box, condition, price, user_id)
VALUES (
  'Speedi', -- TODO: Verificare titolo
  'Ravensburger', 
  1000, 
  'Vinted', 
  true, 
  false, -- TODO: Verificare "?" su foglio
  true, 
  true, 
  'Buono', 
  5.00,
  '4576d406-7b3e-4bed-9e05-33dcab9af8e1'
);

-- 6. Cherry Break
INSERT INTO public.puzzles (title, author, pieces_count, sale_platform, listed_for_sale, complete, assembled, has_box, condition, price, user_id)
VALUES (
  'Cherry Break', -- TODO: Verificare titolo
  'Da verificare', -- TODO: Autore non leggibile
  1000, -- TODO: Pezzi non chiari
  'Vinted', 
  true, 
  false, -- TODO: Verificare "?" su foglio
  false, 
  false, 
  'Buono', 
  2.50,
  '4576d406-7b3e-4bed-9e05-33dcab9af8e1'
);

-- 7. Dorne Art
INSERT INTO public.puzzles (title, author, pieces_count, sale_platform, listed_for_sale, complete, assembled, has_box, condition, price, user_id)
VALUES (
  'Dorne Art', -- TODO: Verificare titolo
  'Ravensburger', 
  300, 
  'Vinted', 
  true, 
  false, -- TODO: Verificare "?" su foglio
  false, 
  false, 
  'Buono', 
  4.00,
  '4576d406-7b3e-4bed-9e05-33dcab9af8e1'
);

-- 8. Clink Royal
INSERT INTO public.puzzles (title, author, pieces_count, sale_platform, listed_for_sale, complete, assembled, has_box, condition, price, user_id)
VALUES (
  'Clink Royal', -- TODO: Verificare titolo
  'Clementoni', 
  2000, 
  'Vinted', 
  true, 
  false, -- TODO: Verificare "?" su foglio
  false, 
  true, 
  'Buono', 
  8.00,
  '4576d406-7b3e-4bed-9e05-33dcab9af8e1'
);

-- 9. L'Anno Mitchelgree
INSERT INTO public.puzzles (title, author, pieces_count, sale_platform, listed_for_sale, complete, assembled, has_box, condition, price, user_id)
VALUES (
  'L''Anno Mitchelgree', -- TODO: Verificare titolo
  'Ravensburger', -- TODO: Sembra "Roussi"?
  2000, 
  'Vinted', 
  true, 
  true, 
  false, 
  true, 
  'Buono', 
  10.90,
  '4576d406-7b3e-4bed-9e05-33dcab9af8e1'
);

-- 10. L'Autre de Franz
INSERT INTO public.puzzles (title, author, pieces_count, sale_platform, listed_for_sale, complete, assembled, has_box, condition, price, user_id)
VALUES (
  'L''Autre de Franz', -- TODO: Verificare titolo
  'Trefl', 
  1500, 
  'Vinted', 
  true, 
  false, -- TODO: Verificare "?" su foglio
  true, 
  true, 
  'Buono', 
  6.00,
  '4576d406-7b3e-4bed-9e05-33dcab9af8e1'
);

-- 11. Bouching
INSERT INTO public.puzzles (title, author, pieces_count, sale_platform, listed_for_sale, complete, assembled, has_box, condition, price, user_id)
VALUES (
  'Bouching', -- TODO: Verificare titolo
  'D-Toys', -- TODO: Sembra "Dtfondo"?
  1500, 
  'Vinted', 
  true, 
  false, -- TODO: Verificare "?" su foglio
  false, 
  true, 
  'Buono', 
  3.00,
  '4576d406-7b3e-4bed-9e05-33dcab9af8e1'
);

-- 12. Clean Ale
INSERT INTO public.puzzles (title, author, pieces_count, sale_platform, listed_for_sale, complete, assembled, has_box, condition, price, user_id)
VALUES (
  'Clean Ale', -- TODO: Verificare titolo
  'Trefl', 
  1500, 
  'Vinted', 
  true, 
  false, -- TODO: Verificare "?" su foglio
  false, 
  true, 
  'Buono', 
  2.50,
  '4576d406-7b3e-4bed-9e05-33dcab9af8e1'
);

-- 13. Milar RUT
INSERT INTO public.puzzles (title, author, pieces_count, sale_platform, listed_for_sale, complete, assembled, has_box, condition, price, user_id)
VALUES (
  'Milar RUT', -- TODO: Verificare titolo
  'Trefl', 
  2000, 
  'Vinted', 
  true, 
  false, -- TODO: Verificare "?" su foglio
  false, 
  true, 
  'Buono', 
  8.00,
  '4576d406-7b3e-4bed-9e05-33dcab9af8e1'
);

-- 14. Salmon de Cities
INSERT INTO public.puzzles (title, author, pieces_count, sale_platform, listed_for_sale, complete, assembled, has_box, condition, price, user_id)
VALUES (
  'Salmon de Cities', -- TODO: Verificare titolo
  'Trefl', 
  750, 
  'Vinted', 
  true, 
  false, -- TODO: Verificare "?" su foglio
  false, 
  true, 
  'Buono', 
  4.00,
  '4576d406-7b3e-4bed-9e05-33dcab9af8e1'
);

-- 15. The Waterss
INSERT INTO public.puzzles (title, author, pieces_count, sale_platform, listed_for_sale, complete, assembled, has_box, condition, price, user_id)
VALUES (
  'The Waterss', -- TODO: Verificare titolo
  'Ravensburger', -- TODO: Sembra "Micosola"?
  1300, 
  'Vinted', 
  true, 
  false, -- TODO: Verificare "?" su foglio
  false, 
  true, 
  'Buono', 
  4.50,
  '4576d406-7b3e-4bed-9e05-33dcab9af8e1'
);

-- 16. Fairy World Day
INSERT INTO public.puzzles (title, author, pieces_count, sale_platform, listed_for_sale, complete, assembled, has_box, condition, price, user_id)
VALUES (
  'Fairy World Day', -- TODO: Verificare titolo
  'Ravensburger', -- TODO: Sembra "Micosola"?
  3000, 
  'Nessuna', -- TODO: Vinted non chiaro
  false, 
  false, -- TODO: Verificare "?" su foglio
  false, 
  false, 
  'Buono', 
  35.00,
  '4576d406-7b3e-4bed-9e05-33dcab9af8e1'
);

-- 17. Wind It's Key
INSERT INTO public.puzzles (title, author, pieces_count, sale_platform, listed_for_sale, complete, assembled, has_box, condition, price, user_id)
VALUES (
  'Wind It''s Key', -- TODO: Verificare titolo
  'Clementoni', 
  1000, 
  'Vinted', 
  true, 
  true, -- TODO: Verificare "Kapusto"
  false, 
  true, 
  'Buono', 
  4.00,
  '4576d406-7b3e-4bed-9e05-33dcab9af8e1'
);

-- 18. Ruen Epsom
INSERT INTO public.puzzles (title, author, pieces_count, sale_platform, listed_for_sale, complete, assembled, has_box, condition, price, user_id)
VALUES (
  'Ruen Epsom', -- TODO: Verificare titolo
  'Trefl', 
  1000, 
  'Nessuna',
  false, 
  false, -- TODO: Verificare "?" su foglio
  false, 
  true, 
  'Buono', 
  2.50,
  '4576d406-7b3e-4bed-9e05-33dcab9af8e1'
);

-- 19. Sance Boulevard
INSERT INTO public.puzzles (title, author, pieces_count, sale_platform, listed_for_sale, complete, assembled, has_box, condition, price, user_id)
VALUES (
  'Sance Boulevard', -- TODO: Verificare titolo
  'Trefl', 
  1000, 
  'Nessuna',
  false, 
  false, -- TODO: Verificare "?" su foglio
  false, 
  true, 
  'Buono', 
  7.00,
  '4576d406-7b3e-4bed-9e05-33dcab9af8e1'
);

-- 20. Grunstein
INSERT INTO public.puzzles (title, author, pieces_count, sale_platform, listed_for_sale, complete, assembled, has_box, condition, price, user_id)
VALUES (
  'Grunstein', -- TODO: Verificare titolo
  'Nathan', -- TODO: Sembra "Northern"?
  1000, 
  'Nessuna',
  false, 
  true, -- TODO: Verificare "Avidso"
  false, 
  false, -- TODO: Scatola non chiara
  'Buono', 
  4.50,
  '4576d406-7b3e-4bed-9e05-33dcab9af8e1'
);

-- 21. Calle Verdelli
INSERT INTO public.puzzles (title, author, pieces_count, sale_platform, listed_for_sale, complete, assembled, has_box, condition, price, user_id)
VALUES (
  'Calle Verdelli', -- TODO: Verificare titolo
  'Clementoni', -- TODO: Sembra "Legni"?
  1000, 
  'Nessuna',
  false, 
  true, -- TODO: Verificare "Da Capusto"
  false, 
  true, 
  'Buono', 
  4.00,
  '4576d406-7b3e-4bed-9e05-33dcab9af8e1'
);

-- 22. Cureden
INSERT INTO public.puzzles (title, author, pieces_count, sale_platform, listed_for_sale, complete, assembled, has_box, condition, price, user_id)
VALUES (
  'Cureden', -- TODO: Verificare titolo
  'Clementoni', 
  1500, 
  'Nessuna',
  false, 
  false, -- TODO: Verificare "?" su foglio
  false, 
  true, 
  'Buono', 
  3.00,
  '4576d406-7b3e-4bed-9e05-33dcab9af8e1'
);

-- 23. Old Truck
INSERT INTO public.puzzles (title, author, pieces_count, sale_platform, listed_for_sale, complete, assembled, has_box, condition, price, user_id)
VALUES (
  'Old Truck', 
  'Clementoni', 
  500, 
  'Vinted', 
  true, 
  false, -- TODO: Verificare "?" su foglio
  false, 
  true, 
  'Buono', 
  3.50,
  '4576d406-7b3e-4bed-9e05-33dcab9af8e1'
);

-- 24. Cherry Rail
INSERT INTO public.puzzles (title, author, pieces_count, sale_platform, listed_for_sale, complete, assembled, has_box, condition, price, user_id)
VALUES (
  'Cherry Rail', -- TODO: Verificare titolo
  'Trefl', 
  1500, 
  'Vinted', 
  true, 
  false, -- TODO: Verificare "?" su foglio
  false, 
  true, 
  'Buono', 
  3.00,
  '4576d406-7b3e-4bed-9e05-33dcab9af8e1'
);

-- ============================================
-- FOGLIO 3 - Circa 21 puzzle
-- ============================================

-- 1. We are David (Geni)
INSERT INTO public.puzzles (title, author, pieces_count, sale_platform, listed_for_sale, complete, assembled, has_box, condition, price, user_id)
VALUES (
  'We are David (Geni)', -- TODO: Verificare titolo
  'Ravensburger', -- TODO: Sembra "Hoendella"?
  1000, 
  'Vinted', 
  true, 
  true, -- TODO: Verificare "Grandis?"
  false, 
  true, 
  'Buono', 
  9.00,
  '4576d406-7b3e-4bed-9e05-33dcab9af8e1'
);

-- 2. We are Realti (Realto)
INSERT INTO public.puzzles (title, author, pieces_count, sale_platform, listed_for_sale, complete, assembled, has_box, condition, price, user_id)
VALUES (
  'We are Realti (Realto)', -- TODO: Verificare titolo
  'Ravensburger', -- TODO: Sembra "Hoendella"?
  1000, 
  'Nessuna',
  false, 
  true, -- TODO: Verificare "Similiano?"
  false, 
  true, 
  'Buono', 
  12.00,
  '4576d406-7b3e-4bed-9e05-33dcab9af8e1'
);

-- 3. Le Grandetti
INSERT INTO public.puzzles (title, author, pieces_count, sale_platform, listed_for_sale, complete, assembled, has_box, condition, price, user_id)
VALUES (
  'Le Grandetti', -- TODO: Verificare titolo
  'Ravensburger', -- TODO: Sembra "Hoendella"?
  1000, 
  'Vinted', -- TODO: Sembra "No-Sì"?
  true, 
  false, -- TODO: Verificare "?" su foglio
  false, 
  false, 
  'Buono', 
  6.00,
  '4576d406-7b3e-4bed-9e05-33dcab9af8e1'
);

-- 4. Linda on Beach
INSERT INTO public.puzzles (title, author, pieces_count, sale_platform, listed_for_sale, complete, assembled, has_box, condition, price, user_id)
VALUES (
  'Linda on Beach', -- TODO: Verificare titolo
  'Ravensburger', -- TODO: Sembra "Hoendella"?
  1000, 
  'Vinted', 
  true, 
  true, 
  true, 
  true, 
  'Buono', 
  2.50,
  '4576d406-7b3e-4bed-9e05-33dcab9af8e1'
);

-- 5. City in Avelcco
INSERT INTO public.puzzles (title, author, pieces_count, sale_platform, listed_for_sale, complete, assembled, has_box, condition, price, user_id)
VALUES (
  'City in Avelcco', -- TODO: Verificare titolo
  'Ravensburger', -- TODO: Sembra "Hoendella"?
  1000, 
  'Vinted', 
  true, 
  true, 
  true, 
  true, 
  'Buono', 
  6.00,
  '4576d406-7b3e-4bed-9e05-33dcab9af8e1'
);

-- 6. L.S. Antemondo
INSERT INTO public.puzzles (title, author, pieces_count, sale_platform, listed_for_sale, complete, assembled, has_box, condition, price, user_id)
VALUES (
  'L.S. Antemondo', -- TODO: Verificare titolo
  'Educa', -- TODO: Sembra "Bellarossa"?
  1000, 
  'Vinted', 
  true, 
  true, 
  true, 
  true, 
  'Buono', 
  5.00,
  '4576d406-7b3e-4bed-9e05-33dcab9af8e1'
);

-- 7. L.S. Nichols
INSERT INTO public.puzzles (title, author, pieces_count, sale_platform, listed_for_sale, complete, assembled, has_box, condition, price, user_id)
VALUES (
  'L.S. Nichols', -- TODO: Verificare titolo
  'Educa', -- TODO: Sembra "Bellarossa"?
  1000, 
  'Vinted', 
  true, 
  true, 
  true, 
  true, 
  'Buono', 
  6.00,
  '4576d406-7b3e-4bed-9e05-33dcab9af8e1'
);

-- 8. L.S. Bentes
INSERT INTO public.puzzles (title, author, pieces_count, sale_platform, listed_for_sale, complete, assembled, has_box, condition, price, user_id)
VALUES (
  'L.S. Bentes', -- TODO: Verificare titolo
  'Educa', -- TODO: Sembra "Bellarossa"?
  1000, 
  'Vinted', 
  true, 
  true, 
  true, 
  true, 
  'Buono', 
  3.00,
  '4576d406-7b3e-4bed-9e05-33dcab9af8e1'
);

-- 9. 4677
INSERT INTO public.puzzles (title, author, pieces_count, sale_platform, listed_for_sale, complete, assembled, has_box, condition, price, user_id)
VALUES (
  '4677', -- TODO: Verificare titolo - potrebbe essere un codice
  'H.F.T.', -- TODO: Verificare autore
  1000, 
  'Vinted', 
  true, 
  true, 
  false, 
  true, 
  'Buono', 
  5.50,
  '4576d406-7b3e-4bed-9e05-33dcab9af8e1'
);

-- 10. Water's Love 2
INSERT INTO public.puzzles (title, author, pieces_count, sale_platform, listed_for_sale, complete, assembled, has_box, condition, price, user_id)
VALUES (
  'Water''s Love 2', -- TODO: Verificare titolo
  'Educa', -- TODO: Sembra "Bellarossa"?
  1000, 
  'Vinted', 
  true, 
  true, 
  true, 
  true, 
  'Buono', 
  8.00,
  '4576d406-7b3e-4bed-9e05-33dcab9af8e1'
);

-- 11. Rillig' Children
INSERT INTO public.puzzles (title, author, pieces_count, sale_platform, listed_for_sale, complete, assembled, has_box, condition, price, user_id)
VALUES (
  'Rillig'' Children', -- TODO: Verificare titolo
  'Clementoni', -- TODO: Sembra "Marty"?
  150, 
  'Vinted', 
  true, 
  true, 
  true, 
  true, 
  'Buono', 
  5.50,
  '4576d406-7b3e-4bed-9e05-33dcab9af8e1'
);

-- 12. Old Avenue
INSERT INTO public.puzzles (title, author, pieces_count, sale_platform, listed_for_sale, complete, assembled, has_box, condition, price, user_id)
VALUES (
  'Old Avenue', -- TODO: Verificare titolo
  'Educa', -- TODO: Sembra "Bellarossa"?
  1000, 
  'Vinted', 
  true, 
  true, 
  false, 
  true, 
  'Buono', 
  6.00,
  '4576d406-7b3e-4bed-9e05-33dcab9af8e1'
);

-- 13. Olazy U
INSERT INTO public.puzzles (title, author, pieces_count, sale_platform, listed_for_sale, complete, assembled, has_box, condition, price, user_id)
VALUES (
  'Olazy U', -- TODO: Verificare titolo
  'Trefl', 
  1000, 
  'Vinted', 
  true, 
  false, -- TODO: Verificare "?" su foglio
  false, 
  false, 
  'Buono', 
  2.80,
  '4576d406-7b3e-4bed-9e05-33dcab9af8e1'
);

-- 14. Bergata Hotel
INSERT INTO public.puzzles (title, author, pieces_count, sale_platform, listed_for_sale, complete, assembled, has_box, condition, price, user_id)
VALUES (
  'Bergata Hotel', -- TODO: Verificare titolo
  'Trefl', 
  1000, 
  'Vinted', 
  true, 
  true, 
  false, 
  true, 
  'Buono', 
  3.80,
  '4576d406-7b3e-4bed-9e05-33dcab9af8e1'
);

-- 15. Castellano A
INSERT INTO public.puzzles (title, author, pieces_count, sale_platform, listed_for_sale, complete, assembled, has_box, condition, price, user_id)
VALUES (
  'Castellano A', -- TODO: Verificare titolo
  'Trefl', 
  1500, 
  'Vinted', 
  true, 
  false, -- TODO: Verificare "?" su foglio
  true, 
  true, 
  'Buono', 
  6.00,
  '4576d406-7b3e-4bed-9e05-33dcab9af8e1'
);

-- 16. Praha Rivius
INSERT INTO public.puzzles (title, author, pieces_count, sale_platform, listed_for_sale, complete, assembled, has_box, condition, price, user_id)
VALUES (
  'Praha Rivius', -- TODO: Verificare titolo
  'Clementoni', 
  1000, 
  'Vinted', 
  true, 
  true, 
  true, 
  true, 
  'Buono', 
  5.00,
  '4576d406-7b3e-4bed-9e05-33dcab9af8e1'
);

-- 17. The Up
INSERT INTO public.puzzles (title, author, pieces_count, sale_platform, listed_for_sale, complete, assembled, has_box, condition, price, user_id)
VALUES (
  'The Up', -- TODO: Verificare titolo
  'Trefl', 
  150, 
  'Vinted', 
  true, 
  false, 
  false, 
  true, 
  'Buono', 
  1.00,
  '4576d406-7b3e-4bed-9e05-33dcab9af8e1'
);

-- 18. Famous Of Love
INSERT INTO public.puzzles (title, author, pieces_count, sale_platform, listed_for_sale, complete, assembled, has_box, condition, price, user_id)
VALUES (
  'Famous Of Love', -- TODO: Verificare titolo
  'Trefl', 
  750, 
  'Vinted', 
  true, 
  true, 
  false, 
  true, 
  'Buono', 
  9.00,
  '4576d406-7b3e-4bed-9e05-33dcab9af8e1'
);

-- 19. Candy Plinking
INSERT INTO public.puzzles (title, author, pieces_count, sale_platform, listed_for_sale, complete, assembled, has_box, condition, price, user_id)
VALUES (
  'Candy Plinking', -- TODO: Verificare titolo
  'Trefl', 
  500, 
  'Vinted', 
  true, 
  true, 
  false, 
  true, 
  'Buono', 
  9.00,
  '4576d406-7b3e-4bed-9e05-33dcab9af8e1'
);

-- 20. Ologue Truck
INSERT INTO public.puzzles (title, author, pieces_count, sale_platform, listed_for_sale, complete, assembled, has_box, condition, price, user_id)
VALUES (
  'Ologue Truck', -- TODO: Verificare titolo
  'Trefl', 
  500, 
  'Vinted', 
  true, 
  true, 
  true, 
  false, -- TODO: Verificare scatola non chiara
  'Buono', 
  4.00,
  '4576d406-7b3e-4bed-9e05-33dcab9af8e1'
);

-- 21. Pool Dairy
INSERT INTO public.puzzles (title, author, pieces_count, sale_platform, listed_for_sale, complete, assembled, has_box, condition, price, user_id)
VALUES (
  'Pool Dairy', -- TODO: Verificare titolo
  'Trefl', 
  500, 
  'Vinted', 
  true, 
  false, -- TODO: Verificare "?" su foglio
  true, 
  true, 
  'Buono', 
  9.80,
  '4576d406-7b3e-4bed-9e05-33dcab9af8e1'
);

-- ============================================
-- FINE INSERIMENTI
-- ============================================
-- TOTALE: circa 64 puzzle estratti dai 3 fogli
-- 
-- PROSSIMI PASSI:
-- 1. Rivedi tutti i campi contrassegnati con "TODO:"
-- 2. Correggi titoli, autori e valori non chiari
-- 3. Esegui questo script nel SQL Editor di Supabase
-- ============================================
