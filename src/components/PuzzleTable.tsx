import { Link } from "react-router-dom";
import { Puzzle, SortField, SortOrder } from "@/types/puzzle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { PriceSearch } from "@/types/priceSearch";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle2, XCircle, Camera, Trash2, Eye, Image as ImageIcon, Edit, DollarSign, ArrowUpDown, ArrowUp, ArrowDown, MoreVertical, TrendingUp, Zap } from "lucide-react";
import { useRef } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TableColumn } from "@/pages/PuzzleList";

interface PuzzleTableProps {
  puzzles: Puzzle[];
  onDelete?: (id: string) => void;
  onAddPhotos?: (id: string, files: File[]) => void;
  onMarkAsSold?: (id: string) => void;
  sortField?: SortField;
  sortOrder?: SortOrder;
  onSort?: (field: SortField) => void;
  visibleColumns?: TableColumn[];
  onPriceHistoryClick?: (puzzle: Puzzle) => void;
}

export const PuzzleTable = ({ puzzles, onDelete, onAddPhotos, onMarkAsSold, sortField, sortOrder, onSort, visibleColumns = [], onPriceHistoryClick }: PuzzleTableProps) => {
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const [priceSearches, setPriceSearches] = useState<Record<string, number>>({});
  const [searchCounts, setSearchCounts] = useState<Record<string, number>>({});
  const [loadingPrice, setLoadingPrice] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const isColumnVisible = (column: TableColumn) => visibleColumns.includes(column);

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
        
        // Per ogni puzzle, prendi solo la ricerca più recente e conta le ricerche settimanali
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

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1" />;
    }
    return sortOrder === "asc" ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />;
  };

  const handleAddPhotos = (puzzleId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const files = Array.from(e.target.files || []);
    if (files.length > 0 && onAddPhotos) {
      onAddPhotos(puzzleId, files);
    }
  };

  const handleDeleteClick = (puzzleId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete) {
      onDelete(puzzleId);
    }
  };

  const handlePhotoButtonClick = (puzzleId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fileInputRefs.current[puzzleId]?.click();
  };

  const handleMarkAsSoldClick = (puzzleId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onMarkAsSold) {
      onMarkAsSold(puzzleId);
    }
  };

  const handleRequestPrice = async (puzzleId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
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

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {isColumnVisible("photo") && <TableHead className="w-[100px]">Foto</TableHead>}
            {isColumnVisible("title") && (
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 -ml-2"
                  onClick={() => onSort?.("title")}
                >
                  Titolo
                  {renderSortIcon("title")}
                </Button>
              </TableHead>
            )}
            {isColumnVisible("author") && (
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 -ml-2"
                  onClick={() => onSort?.("author")}
                >
                  Autore
                  {renderSortIcon("author")}
                </Button>
              </TableHead>
            )}
            {isColumnVisible("pieces_count") && (
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => onSort?.("pieces_count")}
                >
                  Pezzi
                  {renderSortIcon("pieces_count")}
                </Button>
              </TableHead>
            )}
            {isColumnVisible("listed_for_sale") && (
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 -ml-2"
                  onClick={() => onSort?.("listed_for_sale")}
                >
                  In Vendita
                  {renderSortIcon("listed_for_sale")}
                </Button>
              </TableHead>
            )}
            {isColumnVisible("complete") && <TableHead>Completo</TableHead>}
            {isColumnVisible("assembled") && <TableHead>Assemblato</TableHead>}
            {isColumnVisible("condition") && <TableHead>Condizione</TableHead>}
            {isColumnVisible("sale_platform") && <TableHead>Piattaforma</TableHead>}
            {isColumnVisible("purchase_price") && <TableHead className="text-right">Prezzo Acquisto</TableHead>}
            {isColumnVisible("recommended_price") && (
              <TableHead className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Prezzo Consigliato</span>
                </div>
              </TableHead>
            )}
            {isColumnVisible("price") && (
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => onSort?.("price")}
                >
                  Prezzo Vendita
                  {renderSortIcon("price")}
                </Button>
              </TableHead>
            )}
            {isColumnVisible("sold_price") && <TableHead className="text-right">Prezzo Venduto</TableHead>}
            {isColumnVisible("production_year") && <TableHead className="text-right">Anno Produzione</TableHead>}
            {isColumnVisible("purchase_year") && <TableHead className="text-right">Anno Acquisto</TableHead>}
            {isColumnVisible("actions") && <TableHead className="text-right w-[80px]">Azioni</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {puzzles.map((puzzle) => (
            <TableRow key={puzzle.id}>
              {isColumnVisible("photo") && (
                <TableCell>
                  <input
                    ref={(el) => (fileInputRefs.current[puzzle.id] = el)}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple
                    onChange={(e) => handleAddPhotos(puzzle.id, e)}
                    className="hidden"
                  />
                  {puzzle.photos[0] ? (
                    <img
                      src={puzzle.photos[0]}
                      alt={puzzle.title}
                      className="h-16 w-16 object-cover rounded"
                    />
                  ) : (
                    <div className="h-16 w-16 bg-muted rounded flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </TableCell>
              )}
              {isColumnVisible("title") && (
                <TableCell className="font-medium">
                  <Link to={`/puzzle/${puzzle.id}`} className="hover:underline">
                    {puzzle.title}
                  </Link>
                </TableCell>
              )}
              {isColumnVisible("author") && <TableCell>{puzzle.author || "-"}</TableCell>}
              {isColumnVisible("pieces_count") && <TableCell className="text-right">{puzzle.pieces_count}</TableCell>}
              {isColumnVisible("listed_for_sale") && (
                <TableCell className="whitespace-nowrap">
                  {puzzle.listed_for_sale ? (
                    <Badge variant="default" className="text-xs">
                      In Vendita
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      Non in Vendita
                    </Badge>
                  )}
                </TableCell>
              )}
              {isColumnVisible("complete") && (
                <TableCell>
                  {puzzle.complete ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-muted-foreground" />
                  )}
                </TableCell>
              )}
              {isColumnVisible("assembled") && (
                <TableCell>
                  {puzzle.assembled ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-muted-foreground" />
                  )}
                </TableCell>
              )}
              {isColumnVisible("condition") && (
                <TableCell>
                  <Badge variant="outline" className="text-xs whitespace-nowrap">
                    {puzzle.condition}
                  </Badge>
                </TableCell>
              )}
              {isColumnVisible("sale_platform") && <TableCell>{puzzle.sale_platform || "-"}</TableCell>}
              {isColumnVisible("purchase_price") && (
                <TableCell className="text-right">
                  {puzzle.purchase_price ? (
                    <span className="text-blue-600 dark:text-blue-400 font-medium">
                      €{puzzle.purchase_price.toFixed(2)}
                    </span>
                  ) : (
                    "-"
                  )}
                </TableCell>
              )}
              {isColumnVisible("recommended_price") && (
                <TableCell className="text-right">
                  {priceSearches[puzzle.id] ? (
                    <span 
                      className="text-primary font-medium cursor-pointer hover:underline"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (onPriceHistoryClick) {
                          onPriceHistoryClick(puzzle);
                        }
                      }}
                    >
                      €{priceSearches[puzzle.id].toFixed(2)}
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={(e) => handleRequestPrice(puzzle.id, e)}
                      disabled={loadingPrice[puzzle.id] || (searchCounts[puzzle.id] || 0) >= 2}
                    >
                      {loadingPrice[puzzle.id] ? (
                        "..."
                      ) : (
                        <>
                          <Zap className="h-3 w-3 mr-1" />
                          {2 - (searchCounts[puzzle.id] || 0)}/2
                        </>
                      )}
                    </Button>
                  )}
                </TableCell>
              )}
              {isColumnVisible("price") && (
                <TableCell className="text-right">
                  {puzzle.price ? `€${puzzle.price.toFixed(2)}` : "-"}
                </TableCell>
              )}
              {isColumnVisible("sold_price") && (
                <TableCell className="text-right">
                  {puzzle.sold_price ? (
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      €{puzzle.sold_price.toFixed(2)}
                    </span>
                  ) : (
                    "-"
                  )}
                </TableCell>
              )}
              {isColumnVisible("production_year") && (
                <TableCell className="text-right">
                  {puzzle.production_year || "-"}
                </TableCell>
              )}
              {isColumnVisible("purchase_year") && (
                <TableCell className="text-right">
                  {puzzle.purchase_year || "-"}
                </TableCell>
              )}
              {isColumnVisible("actions") && (
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={`/puzzle/${puzzle.id}`} className="cursor-pointer">
                          <Eye className="h-4 w-4 mr-2" />
                          Visualizza
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={`/puzzle/${puzzle.id}/edit`} className="cursor-pointer">
                          <Edit className="h-4 w-4 mr-2" />
                          Modifica
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => handlePhotoButtonClick(puzzle.id, e)}>
                        <Camera className="h-4 w-4 mr-2" />
                        Aggiungi Foto
                      </DropdownMenuItem>
                      {!puzzle.sold_price && puzzle.listed_for_sale && (
                        <DropdownMenuItem onClick={(e) => handleMarkAsSoldClick(puzzle.id, e)}>
                          <DollarSign className="h-4 w-4 mr-2" />
                          Segna come Venduto
                        </DropdownMenuItem>
                      )}
                      {onDelete && (
                        <DropdownMenuItem 
                          onClick={(e) => handleDeleteClick(puzzle.id, e)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Elimina
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
