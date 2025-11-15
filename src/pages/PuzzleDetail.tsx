import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Edit, Trash2, Copy, DollarSign, Package, Box, TrendingUp, Camera, Upload } from "lucide-react";
import { Puzzle } from "@/types/puzzle";
import { supabasePuzzleStorage } from "@/lib/supabasePuzzleStorage";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { CheckCircle2, XCircle, Image as ImageIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { PriceHistoryDialog } from "@/components/PriceHistoryDialog";
import { supabase } from "@/lib/supabase";
import { PriceSearchData } from "@/types/priceSearch";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useIsMobile } from "@/hooks/use-mobile";

const PuzzleDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const isMobile = useIsMobile();
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showSoldDialog, setShowSoldDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [soldPrice, setSoldPrice] = useState("");
  const [loading, setLoading] = useState(true);
  const [latestPrices, setLatestPrices] = useState<PriceSearchData[]>([]);
  const [lastSearchDate, setLastSearchDate] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Check for action parameter in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'markAsSold') {
      setShowSoldDialog(true);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate("/auth");
      return;
    }

    const loadPuzzle = async () => {
      if (id) {
        setLoading(true);
        const foundPuzzle = await supabasePuzzleStorage.getById(id);
        if (foundPuzzle) {
          setPuzzle(foundPuzzle);
          
          // Carica gli ultimi prezzi trovati
          try {
            const { data: latestSearch } = await supabase
              .from('price_searches')
              .select('prices_data, search_date')
              .eq('puzzle_id', id)
              .order('search_date', { ascending: false })
              .limit(1)
              .single();
            
            if (latestSearch) {
              setLatestPrices(latestSearch.prices_data);
              setLastSearchDate(latestSearch.search_date);
            }
          } catch (error) {
            console.log('Nessun prezzo trovato ancora');
          }
        } else {
          toast({
            title: "Puzzle non trovato",
            variant: "destructive",
          });
          navigate("/");
        }
        setLoading(false);
      }
    };

    loadPuzzle();
  }, [id, user, authLoading, navigate, toast]);

  const handleDelete = async () => {
    if (puzzle) {
      await supabasePuzzleStorage.delete(puzzle.id);
      toast({
        title: "Puzzle eliminato",
      });
      navigate("/");
    }
  };

  const handleDuplicate = async () => {
    if (puzzle) {
      const newPuzzle: Puzzle = {
        ...puzzle,
        id: crypto.randomUUID(),
        title: `${puzzle.title} (Copia)`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await supabasePuzzleStorage.save(newPuzzle);
      toast({
        title: "Puzzle duplicato",
      });
      navigate(`/puzzle/${newPuzzle.id}`);
    }
  };

  const handleMarkAsSold = async () => {
    if (puzzle && soldPrice) {
      const updatedPuzzle: Puzzle = {
        ...puzzle,
        listed_for_sale: false,
        sold_price: parseFloat(soldPrice),
        updated_at: new Date().toISOString(),
      };
      await supabasePuzzleStorage.save(updatedPuzzle);
      setPuzzle(updatedPuzzle);
      setShowSoldDialog(false);
      setSoldPrice("");
      toast({
        title: "Puzzle segnato come venduto",
      });
    }
  };

  const handleAddPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0 && puzzle) {
      try {
        await supabasePuzzleStorage.addPhotos(puzzle.id, files);
        const updatedPuzzle = await supabasePuzzleStorage.getById(puzzle.id);
        if (updatedPuzzle) {
          setPuzzle(updatedPuzzle);
          toast({
            title: "Foto aggiunte con successo",
          });
        }
      } catch (error) {
        toast({
          title: "Errore durante il caricamento delle foto",
          variant: "destructive",
        });
      }
    }
    // Reset input
    if (e.target) e.target.value = "";
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Caricamento...</p>
      </div>
    );
  }

  if (!puzzle) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Link to="/">
                <Button variant="ghost" size="icon" className="shrink-0">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <h1 className="text-lg font-bold truncate">{puzzle.title}</h1>
            </div>
            <div className="flex gap-1 shrink-0">
              <Link to={`/puzzle/${puzzle.id}/edit`}>
                <Button variant="ghost" size="icon">
                  <Edit className="h-4 w-4" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => setShowDeleteDialog(true)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {isMobile ? (
          /* Mobile Layout - Accordion collassabile */
          <Accordion type="multiple" defaultValue={["details", "prices"]} className="space-y-4">
            {/* Dettagli Puzzle */}
            <AccordionItem value="details" className="border rounded-lg bg-card">
              <AccordionTrigger className="px-6 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  <span className="font-semibold">Dettagli Puzzle</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-2xl font-bold">{puzzle.title}</h2>
                      {puzzle.author && (
                        <p className="text-lg text-muted-foreground">di {puzzle.author}</p>
                      )}
                    </div>
                    
                    {/* Quick Actions */}
                    <div className="flex flex-wrap gap-2">
                      <PriceHistoryDialog puzzle={puzzle} />
                      {puzzle.listed_for_sale && (
                        <Button
                          variant="default"
                          size="sm"
                          className="gap-2"
                          onClick={() => setShowSoldDialog(true)}
                        >
                          <DollarSign className="h-4 w-4" />
                          Segna come Venduto
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={handleDuplicate}
                      >
                        <Copy className="h-4 w-4" />
                        Duplica
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Pieces Count */}
                  <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <Package className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Numero Pezzi</p>
                      <p className="text-2xl font-bold">{puzzle.pieces_count}</p>
                    </div>
                  </div>

                  {/* Condizione */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Condizione</h3>
                    <Badge variant="secondary" className="text-sm px-3 py-1.5">
                      {puzzle.condition}
                    </Badge>
                  </div>

                  {/* Dettagli Completezza */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Dettagli</h3>
                    <div className="flex flex-wrap gap-2">
                      {puzzle.complete ? (
                        <Badge variant="outline" className="gap-1.5 text-sm px-3 py-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Completo
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1.5 text-sm px-3 py-1 border-destructive/50 text-destructive">
                          <XCircle className="h-3.5 w-3.5" />
                          Incompleto
                        </Badge>
                      )}
                      
                      {puzzle.assembled && (
                        <Badge variant="outline" className="gap-1.5 text-sm px-3 py-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Assemblato
                        </Badge>
                      )}
                      
                      {puzzle.has_box ? (
                        <Badge variant="outline" className="gap-1.5 text-sm px-3 py-1">
                          <Box className="h-3.5 w-3.5" />
                          Con Scatola
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1.5 text-sm px-3 py-1 border-destructive/50 text-destructive">
                          <XCircle className="h-3.5 w-3.5" />
                          Senza Scatola
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Sale Info */}
                  {(puzzle.listed_for_sale || puzzle.sale_platform !== "None" || puzzle.purchase_price || puzzle.price || puzzle.sold_price) && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Vendita</h3>
                        
                        {puzzle.listed_for_sale && (
                          <Badge className="gap-1.5">
                            <DollarSign className="h-3.5 w-3.5" />
                            In Vendita
                          </Badge>
                        )}
                        
                        {puzzle.sale_platform !== "None" && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Piattaforma:</span>
                            <Badge variant="outline">{puzzle.sale_platform}</Badge>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {puzzle.purchase_price && (
                            <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                              <p className="text-xs text-muted-foreground mb-1">Prezzo di Acquisto</p>
                              <p className="text-xl font-bold text-blue-700 dark:text-blue-400">€{puzzle.purchase_price.toFixed(2)}</p>
                            </div>
                          )}
                          
                          {puzzle.price && (
                            <div className="p-3 bg-muted/50 rounded-lg">
                              <p className="text-xs text-muted-foreground mb-1">Prezzo di Vendita</p>
                              <p className="text-xl font-bold">€{puzzle.price.toFixed(2)}</p>
                            </div>
                          )}
                          
                          {puzzle.sold_price && (
                            <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                              <p className="text-xs text-muted-foreground mb-1">Prezzo Venduto</p>
                              <p className="text-xl font-bold text-green-700 dark:text-green-400">€{puzzle.sold_price.toFixed(2)}</p>
                            </div>
                          )}
                          
                          {latestPrices && latestPrices.length > 0 && (
                            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                              <p className="text-xs text-muted-foreground mb-1">Prezzo Consigliato</p>
                              <p className="text-xl font-bold text-primary">
                                €{(latestPrices.reduce((acc, p) => acc + p.avg_price, 0) / latestPrices.length).toFixed(2)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Notes */}
                  {puzzle.notes && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Note</h3>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap bg-muted/30 p-4 rounded-lg">
                          {puzzle.notes}
                        </p>
                      </div>
                    </>
                  )}

                  {/* Metadata */}
                  <Separator />
                  <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                    <div>
                      <p className="mb-1">Creato</p>
                      <p className="font-medium">{new Date(puzzle.created_at).toLocaleDateString('it-IT')}</p>
                    </div>
                    <div>
                      <p className="mb-1">Aggiornato</p>
                      <p className="font-medium">{new Date(puzzle.updated_at).toLocaleDateString('it-IT')}</p>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Prezzi Europei */}
            {latestPrices.length > 0 && (
              <AccordionItem value="prices" className="border rounded-lg bg-card">
                <AccordionTrigger className="px-6 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Prezzi Europei</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6">
                  <div className="space-y-4">
                    {lastSearchDate && (
                      <p className="text-xs text-muted-foreground">
                        Ultima ricerca {formatDistanceToNow(new Date(lastSearchDate), { addSuffix: true, locale: it })}
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      {latestPrices.slice(0, 4).map((priceData) => (
                        <div key={priceData.country_code} className="p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xl">{priceData.country_code === 'IT' ? '🇮🇹' : priceData.country_code === 'DE' ? '🇩🇪' : priceData.country_code === 'FR' ? '🇫🇷' : '🇬🇧'}</span>
                            <Badge variant={priceData.availability_notes.toLowerCase().includes('comune') ? 'default' : 'secondary'} className="text-xs">
                              {priceData.availability_notes}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{priceData.country}</p>
                          <p className="text-2xl font-bold text-primary">
                            {priceData.currency === 'GBP' ? '£' : '€'}{priceData.avg_price.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {priceData.currency === 'GBP' ? '£' : '€'}{priceData.min_price.toFixed(2)} - {priceData.currency === 'GBP' ? '£' : '€'}{priceData.max_price.toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                    <PriceHistoryDialog puzzle={puzzle} />
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Foto */}
            <AccordionItem value="photos" className="border rounded-lg bg-card">
              <AccordionTrigger className="px-6 hover:no-underline">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  <span className="font-semibold">Galleria Foto ({puzzle.photos.length})</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="space-y-3">
                  {/* Pulsanti per aggiungere foto */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4" />
                      Scegli foto
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => cameraInputRef.current?.click()}
                    >
                      <Camera className="h-4 w-4" />
                      Scatta foto
                    </Button>
                  </div>

                  {puzzle.photos.length > 0 && (
                    <>
                      <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                        <img
                          src={puzzle.photos[0]}
                          alt={puzzle.title}
                          className="w-full h-full object-cover cursor-pointer transition-transform hover:scale-105"
                          onClick={() => setSelectedImage(puzzle.photos[0])}
                        />
                      </div>
                      {puzzle.photos.length > 1 && (
                        <div className="grid grid-cols-4 gap-2">
                          {puzzle.photos.slice(1).map((photo, index) => (
                            <div
                              key={index}
                              className="aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer transition-all hover:scale-105"
                              onClick={() => setSelectedImage(photo)}
                            >
                              <img
                                src={photo}
                                alt={`${puzzle.title} ${index + 2}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {puzzle.photos.length === 0 && (
                    <div className="aspect-video rounded-xl bg-muted/50 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border">
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Nessuna foto disponibile</p>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ) : (
          /* Desktop Layout - Due colonne */
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Colonna Sinistra - Dettagli */}
            <div className="space-y-6">
              <Card className="p-6 space-y-6 animate-fade-in shadow-lg">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-3xl font-bold">{puzzle.title}</h2>
                    {puzzle.author && (
                      <p className="text-lg text-muted-foreground">di {puzzle.author}</p>
                    )}
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="flex flex-wrap gap-2">
                    <PriceHistoryDialog puzzle={puzzle} />
                    {puzzle.listed_for_sale && (
                      <Button
                        variant="default"
                        size="sm"
                        className="gap-2"
                        onClick={() => setShowSoldDialog(true)}
                      >
                        <DollarSign className="h-4 w-4" />
                        Segna come Venduto
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={handleDuplicate}
                    >
                      <Copy className="h-4 w-4" />
                      Duplica
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Pieces Count */}
                <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Numero Pezzi</p>
                    <p className="text-2xl font-bold">{puzzle.pieces_count}</p>
                  </div>
                </div>

                {/* Condizione */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Condizione</h3>
                  <Badge variant="secondary" className="text-sm px-3 py-1.5">
                    {puzzle.condition}
                  </Badge>
                </div>

                {/* Dettagli Completezza */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Dettagli</h3>
                  <div className="flex flex-wrap gap-2">
                    {puzzle.complete ? (
                      <Badge variant="outline" className="gap-1.5 text-sm px-3 py-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Completo
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1.5 text-sm px-3 py-1 border-destructive/50 text-destructive">
                        <XCircle className="h-3.5 w-3.5" />
                        Incompleto
                      </Badge>
                    )}
                    
                    {puzzle.assembled && (
                      <Badge variant="outline" className="gap-1.5 text-sm px-3 py-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Assemblato
                      </Badge>
                    )}
                    
                    {puzzle.has_box ? (
                      <Badge variant="outline" className="gap-1.5 text-sm px-3 py-1">
                        <Box className="h-3.5 w-3.5" />
                        Con Scatola
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1.5 text-sm px-3 py-1 border-destructive/50 text-destructive">
                        <XCircle className="h-3.5 w-3.5" />
                        Senza Scatola
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Sale Info */}
                {(puzzle.listed_for_sale || puzzle.sale_platform !== "None" || puzzle.purchase_price || puzzle.price || puzzle.sold_price) && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Vendita</h3>
                      
                      {puzzle.listed_for_sale && (
                        <Badge className="gap-1.5">
                          <DollarSign className="h-3.5 w-3.5" />
                          In Vendita
                        </Badge>
                      )}
                      
                      {puzzle.sale_platform !== "None" && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Piattaforma:</span>
                          <Badge variant="outline">{puzzle.sale_platform}</Badge>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {puzzle.purchase_price && (
                          <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                            <p className="text-xs text-muted-foreground mb-1">Prezzo di Acquisto</p>
                            <p className="text-xl font-bold text-blue-700 dark:text-blue-400">€{puzzle.purchase_price.toFixed(2)}</p>
                          </div>
                        )}
                        
                        {puzzle.price && (
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Prezzo di Vendita</p>
                            <p className="text-xl font-bold">€{puzzle.price.toFixed(2)}</p>
                          </div>
                        )}
                        
                        {puzzle.sold_price && (
                          <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                            <p className="text-xs text-muted-foreground mb-1">Prezzo Venduto</p>
                            <p className="text-xl font-bold text-green-700 dark:text-green-400">€{puzzle.sold_price.toFixed(2)}</p>
                          </div>
                        )}
                        
                        {latestPrices && latestPrices.length > 0 && (
                          <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                            <p className="text-xs text-muted-foreground mb-1">Prezzo Consigliato</p>
                            <p className="text-xl font-bold text-primary">
                              €{(latestPrices.reduce((acc, p) => acc + p.avg_price, 0) / latestPrices.length).toFixed(2)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Notes */}
                {puzzle.notes && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Note</h3>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap bg-muted/30 p-4 rounded-lg">
                        {puzzle.notes}
                      </p>
                    </div>
                  </>
                )}

                {/* Metadata */}
                <Separator />
                <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                  <div>
                    <p className="mb-1">Creato</p>
                    <p className="font-medium">{new Date(puzzle.created_at).toLocaleDateString('it-IT')}</p>
                  </div>
                  <div>
                    <p className="mb-1">Aggiornato</p>
                    <p className="font-medium">{new Date(puzzle.updated_at).toLocaleDateString('it-IT')}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Colonna Destra - Prezzi e Foto */}
            <div className="space-y-6">
              {/* Latest Price Search */}
              {latestPrices.length > 0 && (
                <Card className="overflow-hidden border-primary/20">
                  <CardHeader className="bg-primary/5 pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Prezzi Europei Trovati
                    </CardTitle>
                    {lastSearchDate && (
                      <p className="text-xs text-muted-foreground">
                        Ultima ricerca {formatDistanceToNow(new Date(lastSearchDate), { addSuffix: true, locale: it })}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      {latestPrices.slice(0, 4).map((priceData) => (
                        <div key={priceData.country_code} className="p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xl">{priceData.country_code === 'IT' ? '🇮🇹' : priceData.country_code === 'DE' ? '🇩🇪' : priceData.country_code === 'FR' ? '🇫🇷' : '🇬🇧'}</span>
                            <Badge variant={priceData.availability_notes.toLowerCase().includes('comune') ? 'default' : 'secondary'} className="text-xs">
                              {priceData.availability_notes}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{priceData.country}</p>
                          <p className="text-2xl font-bold text-primary">
                            {priceData.currency === 'GBP' ? '£' : '€'}{priceData.avg_price.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {priceData.currency === 'GBP' ? '£' : '€'}{priceData.min_price.toFixed(2)} - {priceData.currency === 'GBP' ? '£' : '€'}{priceData.max_price.toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                    <PriceHistoryDialog puzzle={puzzle} />
                  </CardContent>
                </Card>
              )}

              {/* Photo Gallery */}
              <Card className="overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Galleria Foto</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {/* Pulsanti per aggiungere foto */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4" />
                      Scegli foto
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => cameraInputRef.current?.click()}
                    >
                      <Camera className="h-4 w-4" />
                      Scatta foto
                    </Button>
                  </div>

                  {puzzle.photos.length > 0 ? (
                    <>
                      <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                        <img
                          src={puzzle.photos[0]}
                          alt={puzzle.title}
                          className="w-full h-full object-cover cursor-pointer transition-transform hover:scale-105"
                          onClick={() => setSelectedImage(puzzle.photos[0])}
                        />
                      </div>
                      {puzzle.photos.length > 1 && (
                        <div className="grid grid-cols-4 gap-2">
                          {puzzle.photos.slice(1).map((photo, index) => (
                            <div
                              key={index}
                              className="aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer transition-all hover:scale-105 hover:shadow-md"
                              onClick={() => setSelectedImage(photo)}
                            >
                              <img
                                src={photo}
                                alt={`${puzzle.title} ${index + 2}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="aspect-video rounded-xl bg-muted/50 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border">
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Nessuna foto disponibile</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>

      {/* Image Viewer Dialog */}
      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl p-0">
            <img src={selectedImage} alt="Preview" className="w-full h-auto" />
          </DialogContent>
        </Dialog>
      )}

      {/* Sold Price Dialog */}
      <Dialog open={showSoldDialog} onOpenChange={setShowSoldDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Segna come Venduto</DialogTitle>
            <DialogDescription>
              Inserisci il prezzo di vendita del puzzle
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="sold-price">Prezzo di Vendita (€)</Label>
              <Input
                id="sold-price"
                type="number"
                step="0.01"
                placeholder="10.00"
                value={soldPrice}
                onChange={(e) => setSoldPrice(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSoldDialog(false)}>
              Annulla
            </Button>
            <Button onClick={handleMarkAsSold} disabled={!soldPrice}>
              Conferma
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        title="Eliminare questo puzzle?"
        description="Questa azione non può essere annullata. Il puzzle e tutte le sue foto verranno eliminate definitivamente."
      />

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleAddPhotos}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={handleAddPhotos}
        className="hidden"
      />
    </div>
  );
};

export default PuzzleDetail;
