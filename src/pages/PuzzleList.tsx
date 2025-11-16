import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search, SlidersHorizontal, LogOut, Zap, LayoutGrid, Table as TableIcon, Settings, Menu, BarChart3 } from "lucide-react";
import { Puzzle, PuzzleFilters, SortField, SortOrder } from "@/types/puzzle";
import { supabasePuzzleStorage } from "@/lib/supabasePuzzleStorage";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { PuzzleCard } from "@/components/PuzzleCard";
import { PuzzleFiltersSheet } from "@/components/PuzzleFiltersSheet";
import { QuickAddDialog } from "@/components/QuickAddDialog";
import { PuzzleTable } from "@/components/PuzzleTable";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { SearchDialog } from "@/components/SearchDialog";
import { PriceHistoryDialog } from "@/components/PriceHistoryDialog";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/lib/supabase";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type TableColumn = 
  | "photo"
  | "title"
  | "author"
  | "pieces_count"
  | "listed_for_sale"
  | "complete"
  | "assembled"
  | "condition"
  | "sale_platform"
  | "purchase_price"
  | "recommended_price"
  | "price"
  | "sold_price"
  | "production_year"
  | "purchase_year"
  | "actions";

const defaultVisibleColumns: TableColumn[] = [
  "title",
  "author",
  "pieces_count",
  "listed_for_sale",
  "condition",
  "sale_platform",
  "recommended_price",
  "price",
  "sold_price",
  "actions"
];

const columnLabels: Record<TableColumn, string> = {
  photo: "Foto",
  title: "Titolo",
  author: "Autore",
  pieces_count: "Pezzi",
  listed_for_sale: "In Vendita",
  complete: "Completo",
  assembled: "Assemblato",
  condition: "Condizione",
  sale_platform: "Piattaforma",
  purchase_price: "Prezzo Acquisto",
  recommended_price: "Prezzo Consigliato",
  price: "Prezzo Vendita",
  sold_price: "Prezzo Venduto",
  production_year: "Anno Produzione",
  purchase_year: "Anno Acquisto",
  actions: "Azioni"
};

const PuzzleList = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const isMobile = useIsMobile();
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<PuzzleFilters>({ search: "" });
  const [sortField, setSortField] = useState<SortField>(() => {
    const saved = localStorage.getItem("puzzleListSortField");
    return (saved as SortField) || "title";
  });
  const [sortOrder, setSortOrder] = useState<SortOrder>(() => {
    const saved = localStorage.getItem("puzzleListSortOrder");
    return (saved as SortOrder) || "asc";
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  
  // Inizializza viewMode in base al device: table su desktop, grid su mobile/tablet
  const [viewMode, setViewMode] = useState<"grid" | "table">(() => {
    const saved = localStorage.getItem("puzzleListViewMode");
    if (saved) return saved as "grid" | "table";
    // Default: table per desktop (>= 768px), grid per mobile/tablet
    return isMobile === false ? "table" : "grid";
  });
  
  const [visibleColumns, setVisibleColumns] = useState<TableColumn[]>(() => {
    const saved = localStorage.getItem("puzzleTableVisibleColumns");
    return saved ? JSON.parse(saved) : defaultVisibleColumns;
  });
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePuzzleId, setDeletePuzzleId] = useState<string | null>(null);
  const [priceSearches, setPriceSearches] = useState<Record<string, number>>({});
  const [searchCounts, setSearchCounts] = useState<Record<string, number>>({});
  const [loadingPrice, setLoadingPrice] = useState<Record<string, boolean>>({});
  const [showPriceHistory, setShowPriceHistory] = useState(false);
  const [selectedPuzzleForHistory, setSelectedPuzzleForHistory] = useState<Puzzle | null>(null);
  const { toast } = useToast();

  // Aggiorna viewMode quando cambia il device size (solo se non è stato salvato manualmente)
  useEffect(() => {
    const saved = localStorage.getItem("puzzleListViewMode");
    if (!saved && isMobile !== undefined) {
      setViewMode(isMobile ? "grid" : "table");
    }
  }, [isMobile]);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate("/auth");
      return;
    }

    const loadPuzzles = async () => {
      setLoading(true);
      const data = await supabasePuzzleStorage.getAll();
      setPuzzles(data);
      setLoading(false);
    };

    loadPuzzles();
  }, [user, authLoading, navigate]);

  // Carica prezzi consigliati
  useEffect(() => {
    const fetchLatestPrices = async () => {
      if (puzzles.length === 0) return;

      const puzzleIds = puzzles.map(p => p.id);
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const { data, error } = await supabase
        .from("price_searches")
        .select("puzzle_id, prices_data, created_at, search_date")
        .in("puzzle_id", puzzleIds)
        .order("created_at", { ascending: false });

      if (!error && data) {
        const latestPrices: Record<string, number> = {};
        const counts: Record<string, number> = {};
        
        data.forEach((search: any) => {
          // Conteggio ricerche settimanali
          const searchDate = new Date(search.search_date);
          if (searchDate >= oneWeekAgo) {
            counts[search.puzzle_id] = (counts[search.puzzle_id] || 0) + 1;
          }
          
          // Prezzo più recente
          if (!latestPrices[search.puzzle_id]) {
            const pricesData = search.prices_data as any[];
            if (pricesData && pricesData.length > 0) {
              const sum = pricesData.reduce((acc, p) => acc + p.avg_price, 0);
              latestPrices[search.puzzle_id] = sum / pricesData.length;
            }
          }
        });

        setPriceSearches(latestPrices);
        setSearchCounts(counts);
      }
    };

    fetchLatestPrices();
  }, [puzzles]);

  const refreshPuzzles = async () => {
    const data = await supabasePuzzleStorage.getAll();
    setPuzzles(data);
  };

  const filteredAndSortedPuzzles = useMemo(() => {
    let result = [...puzzles];

    // Apply filters
    if (filters.sale_platform && filters.sale_platform !== "None") {
      result = result.filter((p) => p.sale_platform === filters.sale_platform);
    }
    if (filters.listed_for_sale !== undefined) {
      result = result.filter((p) => p.listed_for_sale === filters.listed_for_sale);
    }
    if (filters.complete !== undefined) {
      result = result.filter((p) => p.complete === filters.complete);
    }
    if (filters.assembled !== undefined) {
      result = result.filter((p) => p.assembled === filters.assembled);
    }
    if (filters.condition) {
      result = result.filter((p) => p.condition === filters.condition);
    }
    if (filters.min_pieces) {
      result = result.filter((p) => p.pieces_count >= filters.min_pieces!);
    }
    if (filters.max_pieces) {
      result = result.filter((p) => p.pieces_count <= filters.max_pieces!);
    }
    if (filters.author) {
      result = result.filter((p) => 
        p.author?.toLowerCase().includes(filters.author!.toLowerCase())
      );
    }
    if (filters.production_year) {
      result = result.filter((p) => p.production_year === filters.production_year);
    }
    if (filters.purchase_year) {
      result = result.filter((p) => p.purchase_year === filters.purchase_year);
    }

    // Apply sorting
    result.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === "title" || sortField === "author") {
        aValue = (aValue || "").toLowerCase();
        bValue = (bValue || "").toLowerCase();
      }

      // Handle undefined/null values
      if (aValue == null) aValue = sortField === "price" ? 0 : "";
      if (bValue == null) bValue = sortField === "price" ? 0 : "";

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [puzzles, filters, sortField, sortOrder]);

  const handleDelete = async (id: string) => {
    setDeletePuzzleId(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (deletePuzzleId) {
      await supabasePuzzleStorage.delete(deletePuzzleId);
      const data = await supabasePuzzleStorage.getAll();
      setPuzzles(data);
      setShowDeleteDialog(false);
      setDeletePuzzleId(null);
      toast({
        title: "Puzzle eliminato",
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleAddPhotos = async (puzzleId: string, files: File[]) => {
    try {
      await supabasePuzzleStorage.addPhotos(puzzleId, files);
      await refreshPuzzles();
      toast({
        title: "Foto aggiunte",
        description: `${files.length} foto aggiunte con successo`,
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile aggiungere le foto",
        variant: "destructive",
      });
    }
  };

  const handleMarkAsSold = (puzzleId: string) => {
    // Navigate to puzzle detail where sold dialog can be opened
    navigate(`/puzzle/${puzzleId}?action=markAsSold`);
  };

  const handleRequestPrice = async (puzzleId: string) => {
    const searchCount = searchCounts[puzzleId] || 0;
    if (searchCount >= 2) {
      toast({
        title: "Limite raggiunto",
        description: "Hai già effettuato 2 ricerche questa settimana per questo puzzle.",
        variant: "destructive",
      });
      return;
    }

    setLoadingPrice(prev => ({ ...prev, [puzzleId]: true }));

    try {
      const { data: result, error: invokeError } = await supabase.functions.invoke('find-puzzle-price', {
        body: { puzzle_id: puzzleId }
      });

      if (invokeError) throw invokeError;

      if (result?.success) {
        toast({
          title: "Prezzo trovato!",
          description: result.cached ? "Risultati dalla cache" : "Nuova ricerca completata",
        });

        // Ricarica i prezzi
        const { data } = await supabase
          .from("price_searches")
          .select("puzzle_id, prices_data")
          .eq("puzzle_id", puzzleId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (data?.prices_data) {
          const pricesData = data.prices_data as any[];
          const avgPrice = pricesData.reduce((sum, p) => sum + p.avg_price, 0) / pricesData.length;
          setPriceSearches(prev => ({ ...prev, [puzzleId]: avgPrice }));
          setSearchCounts(prev => ({ ...prev, [puzzleId]: (prev[puzzleId] || 0) + 1 }));
        }
      } else {
        throw new Error(result.error || "Errore nella ricerca");
      }
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message || "Impossibile recuperare il prezzo",
        variant: "destructive",
      });
    } finally {
      setLoadingPrice(prev => ({ ...prev, [puzzleId]: false }));
    }
  };

  const handlePriceHistoryClick = (puzzle: Puzzle) => {
    setSelectedPuzzleForHistory(puzzle);
    setShowPriceHistory(true);
  };

  const handleSort = (field: SortField) => {
    const newOrder = sortField === field && sortOrder === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortOrder(newOrder);
    localStorage.setItem("puzzleListSortField", field);
    localStorage.setItem("puzzleListSortOrder", newOrder);
  };

  const handleViewModeChange = (mode: "grid" | "table") => {
    setViewMode(mode);
    localStorage.setItem("puzzleListViewMode", mode);
  };

  const handleColumnToggle = (column: TableColumn) => {
    setVisibleColumns(prev => {
      const newColumns = prev.includes(column)
        ? prev.filter(c => c !== column)
        : [...prev, column];
      localStorage.setItem("puzzleTableVisibleColumns", JSON.stringify(newColumns));
      return newColumns;
    });
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.sale_platform && filters.sale_platform !== "None") count++;
    if (filters.listed_for_sale !== undefined) count++;
    if (filters.complete !== undefined) count++;
    if (filters.assembled !== undefined) count++;
    if (filters.condition) count++;
    if (filters.min_pieces) count++;
    if (filters.max_pieces) count++;
    if (filters.production_year) count++;
    if (filters.purchase_year) count++;
    return count;
  }, [filters]);

  if (authLoading || loading) {
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
          <div className="flex flex-col gap-3 mb-4">
            {/* Prima riga: Titolo + Azioni navbar */}
            <div className="flex items-center justify-between gap-2">
              <h1 className="text-2xl font-bold text-foreground">I Miei Puzzle</h1>
              
              {/* Desktop: azioni inline */}
              <div className="hidden md:flex gap-2">
                <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate("/dashboard")}>
                  <BarChart3 className="h-4 w-4" />
                  Dashboard
                </Button>
                <Button variant="ghost" size="icon" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-2"
                  onClick={() => setShowQuickAdd(true)}
                >
                  <Plus className="h-4 w-4" />
                  Aggiungi Rapido
                </Button>
                <Link to="/puzzle/new">
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Aggiungi
                  </Button>
                </Link>
              </div>

              {/* Mobile: menu dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild className="md:hidden">
                  <Button variant="outline" size="icon">
                    <Menu className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 z-50 bg-card">
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="flex items-center">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowQuickAdd(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Aggiungi Rapido
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/puzzle/new" className="flex items-center">
                      <Plus className="h-4 w-4 mr-2" />
                      Aggiungi
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Esci
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Seconda riga: Campo ricerca + Toolbar */}
            <div className="flex flex-col md:flex-row gap-2">
              {/* Campo ricerca */}
              <Button
                variant="outline"
                className="flex-1 justify-start gap-2 text-muted-foreground"
                onClick={() => setShowSearchDialog(true)}
              >
                <Search className="h-4 w-4" />
                <span>Cerca per titolo o autore...</span>
              </Button>

              {/* Toolbar - allineato a destra su mobile */}
              <div className="flex gap-2 items-center justify-end md:justify-start">
                <div className="flex gap-1 border border-input rounded-md p-1 shrink-0">
                  <Button
                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleViewModeChange("grid")}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "table" ? "secondary" : "ghost"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleViewModeChange("table")}
                  >
                    <TableIcon className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Selezione colonne visibili (solo in vista tabella) */}
                {viewMode === "table" && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="shrink-0">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 z-50 bg-card">
                      <DropdownMenuLabel>Colonne Visibili</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {(Object.keys(columnLabels) as TableColumn[]).map((column) => (
                        <DropdownMenuCheckboxItem
                          key={column}
                          checked={visibleColumns.includes(column)}
                          onCheckedChange={() => handleColumnToggle(column)}
                          disabled={column === "title" || column === "actions"}
                        >
                          {columnLabels[column]}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowFilters(true)}
                  className="relative shrink-0"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {filteredAndSortedPuzzles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              {puzzles.length === 0
                ? "Nessun puzzle ancora. Aggiungi il tuo primo puzzle!"
                : "Nessun puzzle corrisponde ai filtri."}
            </p>
            {puzzles.length === 0 && (
              <Link to="/puzzle/new">
                <Button>Aggiungi il Tuo Primo Puzzle</Button>
              </Link>
            )}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredAndSortedPuzzles.map((puzzle) => (
              <PuzzleCard 
                key={puzzle.id} 
                puzzle={puzzle} 
                onDelete={handleDelete}
                onAddPhotos={handleAddPhotos}
                onMarkAsSold={handleMarkAsSold}
                recommendedPrice={priceSearches[puzzle.id]}
                searchCount={searchCounts[puzzle.id] || 0}
                onRequestPrice={handleRequestPrice}
                loadingPrice={loadingPrice[puzzle.id] || false}
                onPriceHistoryClick={handlePriceHistoryClick}
              />
            ))}
          </div>
        ) : (
          <PuzzleTable
            puzzles={filteredAndSortedPuzzles}
            onDelete={handleDelete}
            onAddPhotos={handleAddPhotos}
            onMarkAsSold={handleMarkAsSold}
            sortField={sortField}
            sortOrder={sortOrder}
            onSort={handleSort}
            visibleColumns={visibleColumns}
            onPriceHistoryClick={handlePriceHistoryClick}
          />
        )}
      </main>

      <PuzzleFiltersSheet
        open={showFilters}
        onOpenChange={setShowFilters}
        filters={filters}
        onFiltersChange={setFilters}
        sortField={sortField}
        sortOrder={sortOrder}
        onSortChange={(field, order) => {
          setSortField(field);
          setSortOrder(order);
          localStorage.setItem("puzzleListSortField", field);
          localStorage.setItem("puzzleListSortOrder", order);
        }}
      />

      <QuickAddDialog
        open={showQuickAdd}
        onOpenChange={setShowQuickAdd}
        onSuccess={refreshPuzzles}
      />

      <SearchDialog
        open={showSearchDialog}
        onOpenChange={setShowSearchDialog}
        puzzles={puzzles}
      />

      <DeleteConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={confirmDelete}
        title="Eliminare questo puzzle?"
        description="Questa azione non può essere annullata. Il puzzle verrà eliminato definitivamente."
      />

      {selectedPuzzleForHistory && (
        <PriceHistoryDialog
          puzzle={selectedPuzzleForHistory}
          open={showPriceHistory}
          onOpenChange={(o) => {
            setShowPriceHistory(o);
            if (!o) setSelectedPuzzleForHistory(null);
          }}
        />
      )}
    </div>
  );
};

export default PuzzleList;
