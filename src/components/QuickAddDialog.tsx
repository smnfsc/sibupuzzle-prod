import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabasePuzzleStorage } from "@/lib/supabasePuzzleStorage";
import { Puzzle } from "@/types/puzzle";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Camera, Check, ChevronsUpDown } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

const suggestedPlatforms = [
  "Nessuna",
  "Vinted", 
  "eBay", 
  "Subito.it",
  "Facebook Marketplace",
  "Wallapop",
  "Catawiki",
  "Etsy",
  "Amazon",
  "Altro"
];

interface QuickAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const QuickAddDialog = ({ open, onOpenChange, onSuccess }: QuickAddDialogProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [pieces, setPieces] = useState("");
  const [price, setPrice] = useState("");
  const [soldPrice, setSoldPrice] = useState("");
  const [platform, setPlatform] = useState("Nessuna");
  const [platformOpen, setPlatformOpen] = useState(false);
  const [authorOpen, setAuthorOpen] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [existingAuthors, setExistingAuthors] = useState<string[]>([]);

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
    
    if (open) {
      loadAuthors();
    }
  }, [user, open]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPhotos = [...photos];
    Array.from(files).forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            newPhotos.push(e.target.result as string);
            setPhotos(newPhotos);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...photos];
    newPhotos.splice(index, 1);
    setPhotos(newPhotos);
  };

  const handleQuickAdd = async () => {
    if (!title.trim() || !pieces) {
      toast({
        title: "Compila i campi richiesti",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const puzzle: Puzzle = {
        id: crypto.randomUUID(),
        title: title.trim(),
        author: author.trim() || undefined,
        pieces_count: parseInt(pieces),
        sale_platform: platform,
        listed_for_sale: false,
        complete: true,
        assembled: false,
        has_box: true,
        condition: "Buono",
        price: price ? parseFloat(price) : undefined,
        sold_price: soldPrice ? parseFloat(soldPrice) : undefined,
        photos: photos,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await supabasePuzzleStorage.save(puzzle);
      toast({ title: "Puzzle aggiunto!" });
      setTitle("");
      setAuthor("");
      setPieces("");
      setPrice("");
      setSoldPrice("");
      setPlatform("Nessuna");
      setPhotos([]);
      onOpenChange(false);
      onSuccess();
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

  const handleFullForm = () => {
    onOpenChange(false);
    navigate("/puzzle/new");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aggiungi Puzzle Rapido</DialogTitle>
          <DialogDescription>
            Inserisci solo le informazioni base. Potrai completare i dettagli dopo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="quick-title">Titolo *</Label>
            <Input
              id="quick-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome del puzzle"
            />
          </div>

          <div className="space-y-2">
            <Label>Autore</Label>
            <Popover open={authorOpen} onOpenChange={setAuthorOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={authorOpen}
                  className="w-full justify-between font-normal"
                >
                  {author || "Seleziona o inserisci autore"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput 
                    placeholder="Cerca o scrivi autore..." 
                    value={author}
                    onValueChange={setAuthor}
                  />
                  <CommandList>
                    <CommandEmpty>
                      <div className="p-2 text-sm">
                        Nessun autore trovato. Premi Invio per aggiungere "{author}"
                      </div>
                    </CommandEmpty>
                    {existingAuthors.length > 0 && (
                      <CommandGroup heading="Autori esistenti">
                        {existingAuthors
                          .filter((a) => 
                            a.toLowerCase().includes((author || '').toLowerCase())
                          )
                          .map((a) => (
                            <CommandItem
                              key={a}
                              value={a}
                              onSelect={() => {
                                setAuthor(a);
                                setAuthorOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  author === a ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {a}
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
            <Label htmlFor="quick-pieces">Numero di pezzi *</Label>
            <Input
              id="quick-pieces"
              type="number"
              value={pieces}
              onChange={(e) => setPieces(e.target.value)}
              placeholder="500"
            />
          </div>

          <div className="space-y-2">
            <Label>Piattaforma di vendita</Label>
            <Popover open={platformOpen} onOpenChange={setPlatformOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={platformOpen}
                  className="w-full justify-between"
                >
                  {platform}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput 
                    placeholder="Cerca o scrivi piattaforma..." 
                    value={platform}
                    onValueChange={setPlatform}
                  />
                  <CommandList>
                    <CommandEmpty>
                      Premi Invio per usare "{platform}"
                    </CommandEmpty>
                    <CommandGroup>
                      {suggestedPlatforms.map((p) => (
                        <CommandItem
                          key={p}
                          value={p}
                          onSelect={(value) => {
                            setPlatform(value);
                            setPlatformOpen(false);
                          }}
                        >
                          {p}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quick-price">Prezzo (€)</Label>
              <Input
                id="quick-price"
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quick-sold-price">Prezzo di vendita (€)</Label>
              <Input
                id="quick-sold-price"
                type="number"
                step="0.01"
                value={soldPrice}
                onChange={(e) => setSoldPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Foto</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => document.getElementById("quick-photo-upload")?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Carica
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => document.getElementById("quick-camera-capture")?.click()}
              >
                <Camera className="mr-2 h-4 w-4" />
                Scatta
              </Button>
            </div>
            <input
              id="quick-photo-upload"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageUpload}
            />
            <input
              id="quick-camera-capture"
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleImageUpload}
            />
            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photo}
                      alt={`Foto ${index + 1}`}
                      className="w-full h-20 object-cover rounded"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleFullForm} className="flex-1">
            Form Completo
          </Button>
          <Button onClick={handleQuickAdd} disabled={loading} className="flex-1">
            {loading ? "Salvataggio..." : "Salva"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
