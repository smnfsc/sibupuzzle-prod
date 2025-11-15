import { PuzzleFilters, SortField, SortOrder, SalePlatform, Condition } from "@/types/puzzle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";

interface PuzzleFiltersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: PuzzleFilters;
  onFiltersChange: (filters: PuzzleFilters) => void;
  sortField: SortField;
  sortOrder: SortOrder;
  onSortChange: (field: SortField, order: SortOrder) => void;
}

const salePlatforms: SalePlatform[] = ["None", "Vinted", "eBay", "Wallapop", "Other"];
const conditions: Condition[] = ["Nuovo", "Come nuovo", "Buono", "Usato", "Danneggiato"];

export const PuzzleFiltersSheet = ({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  sortField,
  sortOrder,
  onSortChange,
}: PuzzleFiltersSheetProps) => {
  const clearFilters = () => {
    onFiltersChange({ search: "" });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filtri & Ordinamento</SheetTitle>
          <SheetDescription>Affina la tua lista puzzle</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Sorting */}
          <div className="space-y-3">
            <h3 className="font-medium">Ordina Per</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Campo</Label>
                <Select value={sortField} onValueChange={(v) => onSortChange(v as SortField, sortOrder)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="updated_at">Ultimo Aggiornamento</SelectItem>
                    <SelectItem value="title">Titolo</SelectItem>
                    <SelectItem value="author">Autore</SelectItem>
                    <SelectItem value="pieces_count">Pezzi</SelectItem>
                    <SelectItem value="listed_for_sale">In Vendita</SelectItem>
                    <SelectItem value="price">Prezzo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ordine</Label>
                <Select value={sortOrder} onValueChange={(v) => onSortChange(sortField, v as SortOrder)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Crescente</SelectItem>
                    <SelectItem value="desc">Decrescente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="border-t pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Filtri</h3>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Cancella Tutti
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Autore</Label>
              <Input
                placeholder="Filtra per autore..."
                value={filters.author || ""}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    author: e.target.value || undefined,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Piattaforma Vendita</Label>
              <Select
                value={filters.sale_platform || "ALL"}
                onValueChange={(v) =>
                  onFiltersChange({
                    ...filters,
                    sale_platform: v === "ALL" ? undefined : (v as SalePlatform),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Qualsiasi piattaforma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Qualsiasi piattaforma</SelectItem>
                  {salePlatforms.map((platform) => (
                    <SelectItem key={platform} value={platform}>
                      {platform}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Condizione</Label>
              <Select
                value={filters.condition || "ALL"}
                onValueChange={(v) =>
                  onFiltersChange({
                    ...filters,
                    condition: v === "ALL" ? undefined : (v as Condition),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Qualsiasi condizione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Qualsiasi condizione</SelectItem>
                  {conditions.map((condition) => (
                    <SelectItem key={condition} value={condition}>
                      {condition}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Min Pezzi</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.min_pieces || ""}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      min_pieces: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Max Pezzi</Label>
                <Input
                  type="number"
                  placeholder="10000"
                  value={filters.max_pieces || ""}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      max_pieces: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Anno Produzione</Label>
                <Input
                  type="number"
                  placeholder="es. 2020"
                  value={filters.production_year || ""}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      production_year: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  min="1900"
                  max="2100"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Anno Acquisto</Label>
                <Input
                  type="number"
                  placeholder="es. 2023"
                  value={filters.purchase_year || ""}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      purchase_year: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  min="1900"
                  max="2100"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>In Vendita</Label>
                <Switch
                  checked={filters.listed_for_sale === true}
                  onCheckedChange={(checked) =>
                    onFiltersChange({
                      ...filters,
                      listed_for_sale: checked ? true : undefined,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Completo</Label>
                <Switch
                  checked={filters.complete === true}
                  onCheckedChange={(checked) =>
                    onFiltersChange({
                      ...filters,
                      complete: checked ? true : undefined,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Assemblato</Label>
                <Switch
                  checked={filters.assembled === true}
                  onCheckedChange={(checked) =>
                    onFiltersChange({
                      ...filters,
                      assembled: checked ? true : undefined,
                    })
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-background pt-4 border-t">
          <Button className="w-full" onClick={() => onOpenChange(false)}>
            Applica Filtri
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
