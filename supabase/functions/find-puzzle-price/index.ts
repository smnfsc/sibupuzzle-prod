// Edge Function: find-puzzle-price v1.0
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

interface PriceData {
  country: string;
  country_code: string;
  currency: string;
  avg_price: number;
  min_price: number;
  max_price: number;
  availability_notes: string;
}

serve(async (req) => {
  const requestId = crypto.randomUUID().substring(0, 8);
  console.log(`[${requestId}] ${req.method} request received`);

  // Handle health check
  if (req.method === 'GET') {
    console.log(`[${requestId}] Health check - OK`);
    return new Response(
      JSON.stringify({ ok: true, status: 'online' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log(`[${requestId}] CORS preflight - OK`);
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { puzzle_id, force_refresh } = await req.json();
    console.log(`[${requestId}] Processing puzzle_id: ${puzzle_id}, force_refresh: ${force_refresh || false}`);
    
    if (!puzzle_id) {
      throw new Error("puzzle_id è richiesto");
    }

    // Inizializza Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // 1. Recupera i dati del puzzle
    const { data: puzzle, error: puzzleError } = await supabaseClient
      .from('puzzles')
      .select('*')
      .eq('id', puzzle_id)
      .single();

    if (puzzleError || !puzzle) {
      throw new Error("Puzzle non trovato");
    }

    // 2. CONTROLLO CACHE E RATE LIMITING SETTIMANALE
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const { data: weekSearches, error: countError } = await supabaseClient
      .from('price_searches')
      .select('*')
      .eq('puzzle_id', puzzle_id)
      .gte('search_date', oneWeekAgo.toISOString())
      .order('search_date', { ascending: false });

    if (countError) {
      console.error('Errore nel recuperare le ricerche:', countError);
    }

    const searchCount = weekSearches?.length || 0;
    const recentSearch = weekSearches?.[0]; // La più recente

    // 2a. CACHE INTELLIGENTE: Controlla se possiamo usare la cache
    if (recentSearch && !force_refresh) {
      // Confronta i dati del puzzle per vedere se è cambiato
      const puzzleChanged = 
        recentSearch.puzzle_condition !== puzzle.condition ||
        recentSearch.puzzle_pieces_count !== puzzle.pieces_count ||
        recentSearch.puzzle_complete !== puzzle.complete ||
        recentSearch.puzzle_has_box !== puzzle.has_box ||
        recentSearch.puzzle_author !== puzzle.author;

      // Se il puzzle non è cambiato → usa cache
      if (!puzzleChanged) {
        console.log(`[${requestId}] CACHE HIT - Restituisco risultati salvati`);
        
        const cacheValidUntil = new Date(recentSearch.search_date);
        cacheValidUntil.setDate(cacheValidUntil.getDate() + 7);
        
        return new Response(
          JSON.stringify({
            success: true,
            cached: true,
            cache_date: recentSearch.search_date,
            search_id: recentSearch.id,
            prices: recentSearch.prices_data,
            puzzle_title: puzzle.title,
            searches_this_week: searchCount,
            searches_remaining: Math.max(0, 2 - searchCount),
            cache_valid_until: cacheValidUntil.toISOString(),
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        console.log(`[${requestId}] Puzzle modificato - cache invalidata`);
      }
    }

    // 2b. RATE LIMITING: Limite di 2 ricerche per settimana
    if (searchCount >= 2 && weekSearches) {
      const oldestSearch = weekSearches[weekSearches.length - 1];
      const nextAvailable = new Date(oldestSearch.search_date);
      nextAvailable.setDate(nextAvailable.getDate() + 7);

      console.log(`[${requestId}] Rate limit raggiunto: ${searchCount}/2 ricerche questa settimana`);

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Limite settimanale raggiunto',
          message: 'Hai già effettuato 2 ricerche per questo puzzle questa settimana.',
          searches_this_week: searchCount,
          limit: 2,
          next_available: nextAvailable.toISOString(),
        }),
        {
          status: 429, // Too Many Requests
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`[${requestId}] Ricerca ${searchCount + 1}/2 per questa settimana`);

    // 3. Recupera la prima foto (display_order minimo)
    const { data: photos, error: photoError } = await supabaseClient
      .from('puzzle_photos')
      .select('storage_path')
      .eq('puzzle_id', puzzle_id)
      .order('display_order', { ascending: true })
      .limit(1);

    let firstPhotoUrl: string | null = null;
    
    if (photos && photos.length > 0) {
      const { data: urlData } = supabaseClient.storage
        .from('puzzle-photos')
        .getPublicUrl(photos[0].storage_path);
      
      firstPhotoUrl = urlData.publicUrl;
    }

    console.log(`[${requestId}] Puzzle trovato: ${puzzle.title}`);
    console.log(`[${requestId}] Prima foto URL: ${firstPhotoUrl || 'nessuna foto'}`);

    // 4. Prepara il prompt per OpenAI
    const systemPrompt = `Sei un esperto del mercato europeo di puzzle e giochi da tavolo. 
Analizza il puzzle fornito e fornisci stime di prezzo realistiche per 3-4 mercati europei principali.
Considera: reputazione del brand, numero di pezzi, condizione, rarità tipica del puzzle.`;

    const userPrompt = `Analizza questo puzzle e fornisci stime di prezzo per mercati europei:

**Dettagli Puzzle:**
- Titolo: ${puzzle.title}
- Autore/Brand: ${puzzle.author || 'Non specificato'}
- Numero di pezzi: ${puzzle.pieces_count}
- Condizione: ${puzzle.condition}
- Ha la scatola: ${puzzle.has_box ? 'Sì' : 'No'}
- Completo: ${puzzle.complete ? 'Sì' : 'No'}
${puzzle.notes ? `- Note aggiuntive: ${puzzle.notes}` : ''}

Fornisci prezzi stimati per Italia, Germania, Francia e Regno Unito.
Per ogni paese indica: prezzo medio, range (min-max), disponibilità (Comune/Medio/Raro).`;

    // 5. Prepara la chiamata a OpenAI con function calling
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error("OPENAI_API_KEY non configurata");
    }

    const messages: any[] = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: firstPhotoUrl 
          ? [
              { type: "text", text: userPrompt },
              { type: "image_url", image_url: { url: firstPhotoUrl } }
            ]
          : userPrompt
      }
    ];

    const tools = [
      {
        type: "function",
        function: {
          name: "return_puzzle_prices",
          description: "Restituisce i prezzi stimati del puzzle per diversi paesi europei",
          parameters: {
            type: "object",
            properties: {
              prices: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    country: { type: "string", description: "Nome del paese (es. Italia)" },
                    country_code: { type: "string", description: "Codice ISO paese (es. IT, DE, FR, GB)" },
                    currency: { type: "string", description: "Valuta (EUR o GBP)" },
                    avg_price: { type: "number", description: "Prezzo medio stimato" },
                    min_price: { type: "number", description: "Prezzo minimo del range" },
                    max_price: { type: "number", description: "Prezzo massimo del range" },
                    availability_notes: { type: "string", description: "Note sulla disponibilità (Comune/Medio/Raro)" }
                  },
                  required: ["country", "country_code", "currency", "avg_price", "min_price", "max_price", "availability_notes"]
                }
              }
            },
            required: ["prices"]
          }
        }
      }
    ];

    console.log('Chiamata a OpenAI in corso...');

    console.log(`[${requestId}] Calling OpenAI API...`);
    
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        tools: tools,
        tool_choice: { type: "function", function: { name: "return_puzzle_prices" } },
        max_tokens: 1000,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error(`[${requestId}] OpenAI API Error:`, openaiResponse.status, errorText);
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const openaiData = await openaiResponse.json();
    console.log(`[${requestId}] OpenAI response received successfully`);

    // 6. Estrai i dati dalla function call
    const toolCall = openaiData.choices[0].message.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("OpenAI non ha restituito dati validi");
    }

    const pricesData: PriceData[] = JSON.parse(toolCall.function.arguments).prices;
    console.log(`[${requestId}] Prices extracted: ${pricesData.length} countries`);

    // 7. Salva la ricerca nel database
    const authHeader = req.headers.get('Authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      console.error(`[${requestId}] Missing or invalid Authorization header`);
      throw new Error('Utente non autenticato');
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData?.user) {
      console.error(`[${requestId}] User authentication error:`, userError);
      throw new Error("Utente non autenticato");
    }
    
    const { data: savedSearch, error: saveError } = await supabaseClient
      .from('price_searches')
      .insert({
        puzzle_id: puzzle_id,
        user_id: userData.user.id,
        prices_data: pricesData,
        first_photo_url: firstPhotoUrl,
        model_used: 'gpt-4o-mini',
        total_countries: pricesData.length,
        // Snapshot del puzzle per cache intelligente
        puzzle_condition: puzzle.condition,
        puzzle_pieces_count: puzzle.pieces_count,
        puzzle_complete: puzzle.complete,
        puzzle_has_box: puzzle.has_box,
        puzzle_author: puzzle.author,
        is_cache_hit: false,
      })
      .select()
      .single();

    if (saveError) {
      console.error(`[${requestId}] Error saving search:`, saveError);
    } else {
      console.log(`[${requestId}] Search saved successfully, ID: ${savedSearch?.id}`);
    }

    // 8. Ritorna i risultati con contatore
    return new Response(
      JSON.stringify({
        success: true,
        cached: false,
        search_id: savedSearch?.id,
        prices: pricesData,
        puzzle_title: puzzle.title,
        search_date: new Date().toISOString(),
        searches_this_week: searchCount + 1,
        searches_remaining: Math.max(0, 2 - (searchCount + 1)),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error(`[${requestId}] Error in find-puzzle-price:`, error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Errore sconosciuto',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
