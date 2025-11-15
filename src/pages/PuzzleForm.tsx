import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Upload, Sparkles, Star, ThumbsUp, Package, AlertTriangle, Check, ChevronsUpDown } from "lucide-react";
import { Puzzle, SalePlatform, Condition } from "@/types/puzzle";
import { supabasePuzzleStorage } from "@/lib/supabasePuzzleStorage";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { PhotoManager } from "@/components/PhotoManager";
import { useToast } from "@/hooks/use-toast";
import { PriceHistoryDialog } from "@/components/PriceHistoryDialog";
import { PuzzleEditAside } from "@/components/PuzzleEditAside";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

const salePlatforms: SalePlatform[] = ["None", "Vinted", "eBay", "Wallapop", "Other"];
const conditions: Condition[] = ["Nuovo", "Come nuovo", "Buono", "Usato", "Danneggiato"];

const PuzzleForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const isEdit = id && id !== "new";
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState<Partial<Puzzle>>({
    title: "",
    author: "",
    pieces_count: 0,
    sale_platform: "None",
    listed_for_sale: false,
    complete: true,
    assembled: false,
    has_box: true,
    condition: "Buono",
    purchase_price: undefined,
    price: undefined,
    sold_price: undefined,
    photos: [],
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [existingAuthors, setExistingAuthors] = useState<string[]>([]);
  const [authorOpen, setAuthorOpen] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate("/auth");
      return;
    }

    const loadPuzzle = async () => {
      if (isEdit) {
        setLoading(true);
        const puzzle = await supabasePuzzleStorage.getById(id);
        if (puzzle) {
          setFormData(puzzle);
        } else {
          toast({
            title: "Puzzle non trovato",
            variant: "destructive",
          });
          navigate("/");
        }
        setLoading(false);
      } else {
        setLoading(false);
      }
    };

    loadPuzzle();
  }, [id, isEdit, user, authLoading, navigate, toast]);

  // Carica autori esistenti
  useEffect(() => {
    const loadAuthors = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('puzzles')
        .select('author')
        .not('author', 'is', null)
        .eq('user_id', user.id);
      
      if (!error && data) {
        const uniqueAuthors = Array.from(new Set(data.map(p => p.author).filter(Boolean))) as string[];
        setExistingAuthors(uniqueAuthors.sort());
      }
    };
    
    loadAuthors();
  }, [user]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPhotos = [...(formData.photos || [])];

    Array.from(files).forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            newPhotos.push(e.target.result as string);
            setFormData((prev) => ({ ...prev, photos: newPhotos }));
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleImageUpload(e);
  };

  const handlePhotosReorder = (newPhotos: string[]) => {
    setFormData((prev) => ({ ...prev, photos: newPhotos }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title?.trim()) {
      newErrors.title = "Il titolo è obbligatorio";
    }

    if (!formData.pieces_count || formData.pieces_count <= 0) {
      newErrors.pieces_count = "Il numero di pezzi deve essere maggiore di 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast({
        title: "Correggi gli errori",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const puzzle: Puzzle = {
        id: isEdit ? id : crypto.randomUUID(),
        title: formData.title!,
        author: formData.author,
        pieces_count: formData.pieces_count!,
        sale_platform: formData.sale_platform!,
        listed_for_sale: formData.listed_for_sale!,
        complete: formData.complete!,
        assembled: formData.assembled!,
        has_box: formData.has_box!,
        condition: formData.condition!,
        purchase_price: formData.purchase_price,
        price: formData.price,
        sold_price: formData.sold_price,
        production_year: formData.production_year,
        purchase_year: formData.purchase_year,
        photos: formData.photos || [],
        notes: formData.notes,
        created_at: isEdit ? (formData as Puzzle).created_at : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await supabasePuzzleStorage.save(puzzle);
      toast({
        title: isEdit ? "Puzzle aggiornato" : "Puzzle aggiunto",
      });
      navigate(`/puzzle/${puzzle.id}`);
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile salvare il puzzle",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || (isEdit && loading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Caricamento...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-lg sm:text-xl font-bold truncate">
              {isEdit ? "Modifica Puzzle" : "Nuovo Puzzle"}
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 max-w-7xl mx-auto w-full">
          <form onSubmit={handleSubmit} className="space-y-6 w-full min-w-0">
          {/* Photos */}
          <Card className="p-6">
            <Label className="mb-3 block">Foto</Label>
            <p className="text-sm text-muted-foreground mb-4">
              Carica le foto del puzzle. Puoi riordinarle trascinandole - la prima sarà quella di copertina.
            </p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <input
                    type="file"
                    id="photos"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Label htmlFor="photos">
                    <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors">
                      <Upload className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        Scegli foto
                      </p>
                    </div>
                  </Label>
                </div>
                <div>
                  <input
                    type="file"
                    id="camera"
                    accept="image/*"
                    capture="environment"
                    multiple
                    onChange={handleCameraCapture}
                    className="hidden"
                  />
                  <Label htmlFor="camera">
                    <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors">
                      <Upload className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        Scatta foto
                      </p>
                    </div>
                  </Label>
                </div>
              </div>
              
              <PhotoManager
                photos={formData.photos || []}
                onChange={handlePhotosReorder}
              />
            </div>
          </Card>

          {/* Basic Info */}
          <Card className="p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titolo *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Inserisci titolo puzzle"
              />
              {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="author">Autore</Label>
              <Popover open={authorOpen} onOpenChange={setAuthorOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={authorOpen}
                    className="w-full justify-between font-normal"
                  >
                    {formData.author || "Seleziona o inserisci autore"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput 
                      placeholder="Cerca o scrivi autore..." 
                      value={formData.author}
                      onValueChange={(value) => setFormData({ ...formData, author: value })}
                    />
                    <CommandList>
                      <CommandEmpty>
                        <div className="p-2 text-sm">
                          Nessun autore trovato. Premi Invio per aggiungere "{formData.author}"
                        </div>
                      </CommandEmpty>
                      {existingAuthors.length > 0 && (
                        <CommandGroup heading="Autori esistenti">
                          {existingAuthors
                            .filter((author) => 
                              author.toLowerCase().includes((formData.author || '').toLowerCase())
                            )
                            .map((author) => (
                              <CommandItem
                                key={author}
                                value={author}
                                onSelect={() => {
                                  setFormData({ ...formData, author });
                                  setAuthorOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.author === author ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {author}
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pieces_count">Numero Pezzi *</Label>
              <Input
                id="pieces_count"
                type="number"
                value={formData.pieces_count || ""}
                onChange={(e) =>
                  setFormData({ ...formData, pieces_count: parseInt(e.target.value) || 0 })
                }
                placeholder="500"
              />
              {errors.pieces_count && (
                <p className="text-sm text-destructive">{errors.pieces_count}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="production_year">Anno Produzione</Label>
                <Input
                  id="production_year"
                  type="number"
                  value={formData.production_year || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, production_year: e.target.value ? parseInt(e.target.value) : undefined })
                  }
                  placeholder="es. 2020"
                  min="1900"
                  max="2100"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="purchase_year">Anno Acquisto</Label>
                <Input
                  id="purchase_year"
                  type="number"
                  value={formData.purchase_year || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, purchase_year: e.target.value ? parseInt(e.target.value) : undefined })
                  }
                  placeholder="es. 2023"
                  min="1900"
                  max="2100"
                />
              </div>
            </div>
          </Card>

          {/* Status */}
          <Card className="p-4 space-y-4">
            <div className="space-y-3">
              <Label>Condizione</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {[
                  { value: "Nuovo", icon: Sparkles, color: "text-green-500" },
                  { value: "Come nuovo", icon: Star, color: "text-blue-500" },
                  { value: "Buono", icon: ThumbsUp, color: "text-cyan-500" },
                  { value: "Usato", icon: Package, color: "text-orange-500" },
                  { value: "Danneggiato", icon: AlertTriangle, color: "text-red-500" },
                ].map(({ value, icon: Icon, color }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFormData({ ...formData, condition: value as Condition })}
                    className={`relative flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border-2 transition-all hover:border-primary/50 ${
                      formData.condition === value
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card"
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${formData.condition === value ? "text-primary" : color}`} />
                    <span className={`text-xs font-medium ${formData.condition === value ? "text-primary" : "text-muted-foreground"}`}>
                      {value}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="complete">Completo (tutti i pezzi)</Label>
              <Switch
                id="complete"
                checked={formData.complete}
                onCheckedChange={(checked) => setFormData({ ...formData, complete: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="assembled">Assemblato</Label>
              <Switch
                id="assembled"
                checked={formData.assembled}
                onCheckedChange={(checked) => setFormData({ ...formData, assembled: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="has_box">Ha Scatola Originale</Label>
              <Switch
                id="has_box"
                checked={formData.has_box}
                onCheckedChange={(checked) => setFormData({ ...formData, has_box: checked })}
              />
            </div>
          </Card>

          {/* Sale Info */}
          <Card className="p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sale_platform">Piattaforma Vendita</Label>
              <Select
                value={formData.sale_platform}
                onValueChange={(v) => setFormData({ ...formData, sale_platform: v as SalePlatform })}
              >
                <SelectTrigger id="sale_platform">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {salePlatforms.map((platform) => (
                    <SelectItem key={platform} value={platform}>
                      {platform}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="listed_for_sale">In Vendita</Label>
              <Switch
                id="listed_for_sale"
                checked={formData.listed_for_sale}
                onCheckedChange={(checked) => setFormData({ ...formData, listed_for_sale: checked })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchase_price">Prezzo di Acquisto (€)</Label>
              <Input
                id="purchase_price"
                type="number"
                step="0.01"
                value={formData.purchase_price || ""}
                onChange={(e) =>
                  setFormData({ ...formData, purchase_price: e.target.value ? parseFloat(e.target.value) : undefined })
                }
                placeholder="5.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Prezzo di Vendita (€)</Label>
              <div className="flex gap-2">
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value ? parseFloat(e.target.value) : undefined })
                  }
                  placeholder="10.00"
                />
                
                {/* Pulsante inline per ricerca prezzo */}
                {isEdit && formData.id && (
                  <PriceHistoryDialog 
                    puzzle={{
                      ...formData,
                      id: formData.id,
                      created_at: formData.created_at || new Date().toISOString(),
                      updated_at: formData.updated_at || new Date().toISOString(),
                    } as Puzzle}
                    onPriceSelect={(price) => {
                      setFormData({ ...formData, price });
                    }}
                  />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sold_price">Prezzo Venduto (€)</Label>
              <Input
                id="sold_price"
                type="number"
                step="0.01"
                value={formData.sold_price || ""}
                onChange={(e) =>
                  setFormData({ ...formData, sold_price: e.target.value ? parseFloat(e.target.value) : undefined })
                }
                placeholder="8.00"
              />
            </div>
          </Card>

          {/* Notes */}
          <Card className="p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Note</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Note aggiuntive sul puzzle..."
                rows={4}
              />
            </div>
          </Card>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Salvataggio..." : isEdit ? "Aggiorna Puzzle" : "Aggiungi Puzzle"}
          </Button>
        </form>

        {/* Aside - mostrato solo in edit mode e desktop */}
        {isEdit && (
          <div className="hidden lg:block">
            <PuzzleEditAside puzzle={formData} puzzleId={id} />
          </div>
        )}
      </div>
      </main>
    </div>
  );
};

export default PuzzleForm;
