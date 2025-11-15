import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qqulooaqqkgfxqaugajq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxdWxvb2FxcWtnZnhxYXVnYWpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxNDc3NTIsImV4cCI6MjA3ODcyMzc1Mn0.ZSXIM3xGoo2DD_fVgamatvt6P833npLHHSVbgeuhgeg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
