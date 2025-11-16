import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Search, TrendingUp, TrendingDown, Copy, Check, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { supabasePuzzleStorage } from "@/lib/supabasePuzzleStorage";
import { toast } from "@/hooks/use-toast";
import { Puzzle } from "@/types/puzzle";
import { PriceSearch, PriceSearchData } from "@/types/priceSearch";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";

interface Props {
  puzzle: Puzzle;
  onPriceSelect?: (price: number) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const countryFlags: Record<string, string> = {
  IT: "🇮🇹",
  DE: "🇩🇪",
  FR: "🇫🇷",
  GB: "🇬🇧",
};

// Calcola il prezzo consigliato basato sullo storico ricerche
const calculateRecommendedPrice = (
  searches: PriceSearch[], 
  puzzle: Puzzle
): { price: number; reasoning: string } | null => {
  if (searches.length === 0) return null;

  const latestSearch = searches[0];
  
  // 1. Preferenza: Prezzo medio italiano
  const italianPrice = latestSearch.prices_data.find(p => p.country_code === 'IT');
  
  let basePrice: number;
  let country: string;
  
  if (italianPrice) {
    basePrice = italianPrice.avg_price;
    country = 'Italia';
  } else {
    // 2. Fallback: Media di tutti i prezzi europei (convertiti in EUR)
    const allPrices = latestSearch.prices_data.map(p => p.avg_price);
    basePrice = allPrices.reduce((sum, price) => sum + price, 0) / allPrices.length;
    country = 'media europea';
  }

  // 3. Aggiusta il prezzo in base alla condizione
  let adjustmentFactor = 1.0;
  let conditionNote = '';
  
  switch (puzzle.condition) {
    case 'Nuovo':
      adjustmentFactor = 1.0;
      conditionNote = '';
      break;
    case 'Come nuovo':
      adjustmentFactor = 0.95;
      conditionNote = ' (-5% per condizione "Come nuovo")';
      break;
    case 'Buono':
      adjustmentFactor = 0.85;
      conditionNote = ' (-15% per condizione "Buono")';
      break;
    case 'Usato':
      adjustmentFactor = 0.70;
      conditionNote = ' (-30% per condizione "Usato")';
      break;
    case 'Danneggiato':
      adjustmentFactor = 0.50;
      conditionNote = ' (-50% per condizione "Danneggiato")';
      break;
  }

  // 4. Ulteriore aggiustamento: senza scatola -15%, incompleto -20%
  if (!puzzle.has_box) {
    adjustmentFactor *= 0.85;
    conditionNote += ', -15% senza scatola';
  }
  if (!puzzle.complete) {
    adjustmentFactor *= 0.80;
    conditionNote += ', -20% incompleto';
  }

  const recommendedPrice = Math.round(basePrice * adjustmentFactor * 100) / 100;

  const reasoning = `Basato su ${country} (€${basePrice.toFixed(2)})${conditionNote}`;

  return { price: recommendedPrice, reasoning };
};

export function PriceHistoryDialog({ puzzle, onPriceSelect, open: controlledOpen, onOpenChange }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searches, setSearches] = useState<PriceSearch[]>([]);
  const [latestPrices, setLatestPrices] = useState<PriceSearchData[]>([]);
  const [copiedPrice, setCopiedPrice] = useState<number | null>(null);
  const [searchesRemaining, setSearchesRemaining] = useState<number>(2);
  const [recommendedPrice, setRecommendedPrice] = useState<{
    price: number;
    reasoning: string;
  } | null>(null);
  const [cacheInfo, setCacheInfo] = useState<{
    cached: boolean;
    cacheDate?: string;
    validUntil?: string;
  } | null>(null);

  useEffect(() => {
    if (controlledOpen !== undefined) setOpen(controlledOpen);
  }, [controlledOpen]);

  // Carica storico ricerche
  const loadSearchHistory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('price_searches')
        .select('*')
        .eq('puzzle_id', puzzle.id)
        .order('search_date', { ascending: false });

      if (error) throw error;

      setSearches(data || []);
      
      if (data && data.length > 0) {
        setLatestPrices(data[0].prices_data);
      }
    } catch (error) {
      console.error('Errore nel caricare lo storico:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare lo storico ricerche",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadSearchHistory();
    }
  }, [open, puzzle.id]);

  // Calcola ricerche rimaste e prezzo consigliato
  useEffect(() => {
    if (searches.length > 0) {
      // Calcola ricerche rimaste questa settimana
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const weekSearches = searches.filter(s => 
        new Date(s.search_date) >= oneWeekAgo
      );
      
      setSearchesRemaining(Math.max(0, 2 - weekSearches.length));
      
      // Calcola prezzo consigliato
      const recommended = calculateRecommendedPrice(searches, puzzle);
      setRecommendedPrice(recommended);
    }
  }, [searches, puzzle]);

  // Nuova ricerca prezzi
  const handleNewSearch = async (forceRefresh = false) => {
    setSearching(true);
    try {
      // Ottieni il token di autenticazione corrente
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "🔒 Autenticazione richiesta",
          description: "Devi essere autenticato per effettuare una ricerca.",
          variant: "destructive",
        });
        setSearching(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('find-puzzle-price', {
        body: { 
          puzzle_id: puzzle.id,
          force_refresh: forceRefresh 
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      // FunctionsFetchError - La funzione non è raggiungibile
      if (error && error.name === 'FunctionsFetchError') {
        console.error('FunctionsFetchError:', error);
        toast({
          title: "❌ Servizio non disponibile",
          description: "La funzione di ricerca non è raggiungibile. Riprova tra qualche minuto.",
          variant: "destructive",
          action: (
            <Button variant="outline" size="sm" onClick={() => handleNewSearch(forceRefresh)}>
              Ritenta
            </Button>
          ),
        });
        return;
      }

      // FunctionsHttpError - La funzione ha risposto con un errore
      if (error && error.name === 'FunctionsHttpError') {
        console.error('FunctionsHttpError:', error);
        
        // Gestisci status code specifici
        const status = (error as any).context?.status;
        if (status === 429) {
          toast({
            title: "⏰ Limite settimanale raggiunto",
            description: "Hai già effettuato 2 ricerche per questo puzzle questa settimana. Riprova tra qualche giorno.",
            variant: "destructive",
          });
          setSearchesRemaining(0);
          return;
        } else if (status === 401 || status === 403) {
          toast({
            title: "🔒 Accesso negato",
            description: "Non hai i permessi necessari. Verifica di essere autenticato.",
            variant: "destructive",
          });
          return;
        } else if (status === 500) {
          toast({
            title: "⚠️ Errore del server",
            description: "Si è verificato un errore interno. Riprova tra poco.",
            variant: "destructive",
            action: (
              <Button variant="outline" size="sm" onClick={() => handleNewSearch(forceRefresh)}>
                Ritenta
              </Button>
            ),
          });
          return;
        }
      }

      // Altri errori generici
      if (error) {
        console.error('Generic error:', error);
        const errorMessage = (error as any).message || 'Errore sconosciuto';
        toast({
          title: "❌ Errore",
          description: errorMessage,
          variant: "destructive",
          action: (
            <Button variant="outline" size="sm" onClick={() => handleNewSearch(forceRefresh)}>
              Ritenta
            </Button>
          ),
        });
        return;
      }

      // Gestisci risposte con success: false
      if (!data.success) {
        if (data.error === 'Limite settimanale raggiunto') {
          const nextAvailable = data.next_available ? new Date(data.next_available) : null;
          toast({
            title: "⏰ Limite settimanale raggiunto",
            description: nextAvailable 
              ? `Hai già effettuato 2 ricerche questa settimana. Prossima ricerca disponibile: ${nextAvailable.toLocaleDateString('it-IT')}`
              : "Hai già effettuato 2 ricerche questa settimana. Riprova tra qualche giorno.",
            variant: "destructive",
          });
          setSearchesRemaining(0);
          return;
        }
        throw new Error(data.error || 'Errore sconosciuto');
      }

      // Gestisci cache hit
      if (data.cached) {
        setCacheInfo({
          cached: true,
          cacheDate: data.cache_date,
          validUntil: data.cache_valid_until,
        });
        toast({
          title: "📋 Prezzi dalla cache",
          description: `Ultima ricerca: ${formatDistanceToNow(new Date(data.cache_date), { locale: it, addSuffix: true })}. Cache valida fino al ${new Date(data.cache_valid_until).toLocaleDateString('it-IT')}.`,
        });
      } else {
        setCacheInfo({ cached: false });
        toast({
          title: "✓ Prezzi aggiornati!",
          description: `Trovati prezzi per ${data.prices.length} paesi`,
        });
      }

      setSearchesRemaining(data.searches_remaining || 0);

      // Ricarica lo storico
      await loadSearchHistory();

    } catch (error: any) {
      console.error('Errore nella ricerca:', error);
      toast({
        title: "Errore imprevisto",
        description: error.message || "Impossibile trovare prezzi. Riprova tra poco.",
        variant: "destructive",
        action: (
          <Button variant="outline" size="sm" onClick={() => handleNewSearch(forceRefresh)}>
            Ritenta
          </Button>
        ),
      });
    } finally {
      setSearching(false);
    }
  };

  // Copia prezzo
  const handleCopyPrice = async (price: number) => {
    if (onPriceSelect) {
      // Se siamo nel form, usa la callback per aggiornare il form
      onPriceSelect(price);
    } else {
      // Se NON siamo nel form (es. pagina dettaglio), aggiorna direttamente il puzzle nel database
      try {
        const updatedPuzzle = { ...puzzle, price };
        await supabasePuzzleStorage.save(updatedPuzzle);
        
        toast({
          title: "✓ Prezzo aggiornato!",
          description: `Il prezzo di vendita è stato impostato a €${price.toFixed(2)}`,
        });
        
        // Ricarica la pagina dopo un breve delay per mostrare i cambiamenti
        setTimeout(() => {
          window.location.reload();
        }, 1500);
        
        setCopiedPrice(price);
        setTimeout(() => setCopiedPrice(null), 2000);
        return;
      } catch (error) {
        console.error("Errore nell'aggiornamento del prezzo:", error);
        toast({
          title: "❌ Errore",
          description: "Impossibile aggiornare il prezzo. Riprova.",
          variant: "destructive",
        });
        return;
      }
    }
    
    setCopiedPrice(price);
    setTimeout(() => setCopiedPrice(null), 2000);
    toast({
      title: "Prezzo copiato! ✓",
      description: `€${price.toFixed(2)} pronto per essere usato`,
    });
  };

  // Calcola trend prezzi (se ci sono ricerche multiple)
  const calculatePriceTrend = (countryCode: string): { trend: 'up' | 'down' | 'stable', percentage: number } | null => {
    if (searches.length < 2) return null;

    const latestSearch = searches[0];
    const previousSearch = searches[1];

    const latestPrice = latestSearch.prices_data.find(p => p.country_code === countryCode)?.avg_price;
    const previousPrice = previousSearch.prices_data.find(p => p.country_code === countryCode)?.avg_price;

    if (!latestPrice || !previousPrice) return null;

    const diff = latestPrice - previousPrice;
    const percentage = (diff / previousPrice) * 100;

    if (Math.abs(percentage) < 2) return { trend: 'stable', percentage: 0 };
    return {
      trend: diff > 0 ? 'up' : 'down',
      percentage: Math.abs(percentage),
    };
  };

  return (
    <Dialog open={controlledOpen ?? open} onOpenChange={(o) => { setOpen(o); onOpenChange?.(o); }}>
      {controlledOpen === undefined && (
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Search className="h-4 w-4" />
            Trova Prezzo
          </Button>
        </DialogTrigger>
      )}
      
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🔍 Ricerca Prezzi Europei
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {puzzle.title} - {puzzle.pieces_count} pezzi
          </p>
        </DialogHeader>

        {/* Pulsante Nuova Ricerca con Contatore */}
        <div className="flex justify-between items-center border-b pb-4">
          <div className="text-sm text-muted-foreground">
            {searching ? (
              <span className="text-blue-500 animate-pulse">⏳ Contatto il server...</span>
            ) : searches.length > 0 ? (
              `${searches.length} ricerca${searches.length > 1 ? 'he' : ''} effettuata${searches.length > 1 ? 'e' : ''}`
            ) : (
              'Nessuna ricerca effettuata'
            )}
          </div>
          <Button onClick={() => handleNewSearch()} disabled={searching || loading || searchesRemaining === 0} className="gap-2">
            {searching ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Ricerca in corso...
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                Nuova Ricerca
                {searchesRemaining < 2 && (
                  <Badge variant={searchesRemaining === 0 ? "destructive" : "secondary"} className="ml-1">
                    {searchesRemaining === 0 ? 'Limite raggiunto' : `${searchesRemaining} rimasta questa settimana`}
                  </Badge>
                )}
              </>
            )}
          </Button>
        </div>

        {/* Warning quando si avvicina al limite */}
        {!loading && searchesRemaining > 0 && searchesRemaining <= 1 && (
          <Alert className="border-yellow-500">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Attenzione</AlertTitle>
            <AlertDescription>
              Ti rimane solo {searchesRemaining} ricerca per questa settimana per questo puzzle.
              {recommendedPrice && ' Considera di usare il prezzo consigliato per risparmiare ricerche.'}
            </AlertDescription>
          </Alert>
        )}

        {/* Cache Info Alert */}
        {cacheInfo?.cached && (
          <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-600">Prezzi dalla cache</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>
                Ultima ricerca: {cacheInfo.cacheDate && formatDistanceToNow(new Date(cacheInfo.cacheDate), { locale: it, addSuffix: true })}.
                <br />
                Cache valida fino al {cacheInfo.validUntil && new Date(cacheInfo.validUntil).toLocaleDateString('it-IT')}.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => handleNewSearch(true)}
                disabled={searching || searchesRemaining === 0}
              >
                {searching ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                    Aggiornamento...
                  </>
                ) : (
                  'Forza aggiornamento prezzi'
                )}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Sezione Prezzo Consigliato */}
        {!loading && recommendedPrice && (
          <Card className="border-2 border-primary bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">💡</span>
                Prezzo Consigliato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-primary">
                  €{recommendedPrice.price.toFixed(2)}
                </span>
                <Badge variant="secondary" className="text-xs">
                  Ottimizzato per il tuo puzzle
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground">
                {recommendedPrice.reasoning}
              </p>
              
              <Button
                onClick={() => handleCopyPrice(recommendedPrice.price)}
                className="w-full gap-2"
                size="lg"
              >
                {copiedPrice === recommendedPrice.price ? (
                  <>
                    <Check className="h-5 w-5" />
                    Prezzo Copiato!
                  </>
                ) : (
                  <>
                    <Copy className="h-5 w-5" />
                    Usa Prezzo Consigliato
                  </>
                )}
              </Button>
              
              <div className="text-xs text-muted-foreground bg-background p-2 rounded">
                ℹ️ Questo prezzo tiene conto della condizione, completezza e mercato italiano/europeo
              </div>
            </CardContent>
          </Card>
        )}

        {/* Risultati Ultima Ricerca */}
        {!loading && latestPrices.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Ultima Ricerca</h3>
              <span className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(searches[0].search_date), { 
                  addSuffix: true,
                  locale: it 
                })}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {latestPrices.map((priceData) => {
                const trend = calculatePriceTrend(priceData.country_code);
                
                return (
                  <Card key={priceData.country_code} className="relative overflow-hidden">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <span className="text-2xl">{countryFlags[priceData.country_code]}</span>
                          {priceData.country}
                        </span>
                        <Badge variant={
                          priceData.availability_notes.toLowerCase().includes('comune') ? 'default' :
                          priceData.availability_notes.toLowerCase().includes('raro') ? 'destructive' :
                          'secondary'
                        }>
                          {priceData.availability_notes}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {/* Prezzo Medio */}
                        <div className="flex items-baseline justify-between">
                          <span className="text-3xl font-bold text-primary">
                            {priceData.currency === 'GBP' ? '£' : '€'}{priceData.avg_price.toFixed(2)}
                          </span>
                          {trend && (
                            <div className={`flex items-center gap-1 text-sm ${
                              trend.trend === 'up' ? 'text-red-500' :
                              trend.trend === 'down' ? 'text-green-500' :
                              'text-muted-foreground'
                            }`}>
                              {trend.trend === 'up' && <TrendingUp className="h-4 w-4" />}
                              {trend.trend === 'down' && <TrendingDown className="h-4 w-4" />}
                              {trend.trend !== 'stable' && `${trend.percentage.toFixed(1)}%`}
                            </div>
                          )}
                        </div>

                        {/* Range */}
                        <div className="text-sm text-muted-foreground">
                          Range: {priceData.currency === 'GBP' ? '£' : '€'}{priceData.min_price.toFixed(2)} - {priceData.currency === 'GBP' ? '£' : '€'}{priceData.max_price.toFixed(2)}
                        </div>

                        {/* Pulsante Usa Prezzo */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-2"
                          onClick={() => handleCopyPrice(priceData.avg_price)}
                        >
                          {copiedPrice === priceData.avg_price ? (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Copiato!
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 mr-2" />
                              Usa questo prezzo
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Storico Ricerche Precedenti */}
        {!loading && searches.length > 1 && (
          <div className="space-y-3 mt-6 pt-6 border-t">
            <h3 className="text-lg font-semibold">Storico Ricerche</h3>
            <div className="space-y-2">
              {searches.slice(1).map((search) => (
                <Card key={search.id} className="bg-muted/50">
                  <CardHeader className="py-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        {formatDistanceToNow(new Date(search.search_date), { 
                          addSuffix: true,
                          locale: it 
                        })}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {search.total_countries} paesi
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="flex flex-wrap gap-2">
                      {search.prices_data.map((price) => (
                        <Badge key={price.country_code} variant="outline">
                          {countryFlags[price.country_code]} {price.currency === 'GBP' ? '£' : '€'}{price.avg_price.toFixed(2)}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && searches.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nessuna ricerca effettuata per questo puzzle.</p>
            <p className="text-sm mt-2">Clicca su "Nuova Ricerca" per iniziare!</p>
          </div>
        )}

        {/* Disclaimer */}
        <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md mt-4">
          ℹ️ I prezzi sono stime generate da AI e potrebbero non riflettere accuratamente il mercato reale. 
          Usa questi dati come riferimento indicativo.
        </div>
      </DialogContent>
    </Dialog>
  );
}
