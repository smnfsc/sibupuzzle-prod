import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronLeft, ChevronRight, Package } from "lucide-react";
import { Puzzle } from "@/types/puzzle";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  puzzles: Puzzle[];
}

const RESULTS_PER_PAGE = 10;

export const SearchDialog = ({ open, onOpenChange, puzzles }: SearchDialogProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  const filteredPuzzles = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    return puzzles.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.author?.toLowerCase().includes(query)
    );
  }, [puzzles, searchQuery]);

  const totalPages = Math.ceil(filteredPuzzles.length / RESULTS_PER_PAGE);
  const paginatedResults = filteredPuzzles.slice(
    (currentPage - 1) * RESULTS_PER_PAGE,
    currentPage * RESULTS_PER_PAGE
  );

  const handlePuzzleClick = (puzzleId: string) => {
    onOpenChange(false);
    setSearchQuery("");
    setCurrentPage(1);
    navigate(`/puzzle/${puzzleId}`);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl p-0 overflow-hidden max-h-[80vh] flex flex-col">
        <div className="p-6 border-b animate-fade-in">
          <div className="flex items-center gap-4">
            <Search className="h-6 w-6 text-muted-foreground shrink-0" />
            <Input
              placeholder="Cerca per titolo o autore..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="text-lg border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
              autoFocus
            />
          </div>
          {searchQuery && (
            <div className="mt-4 text-sm text-muted-foreground">
              {filteredPuzzles.length === 0 ? (
                <p>Nessun risultato trovato</p>
              ) : (
                <p>
                  {filteredPuzzles.length} {filteredPuzzles.length === 1 ? "risultato" : "risultati"} trovati
                </p>
              )}
            </div>
          )}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {!searchQuery && (
            <div className="p-8 text-center text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Inizia a digitare per cercare nei tuoi puzzle</p>
            </div>
          )}

          {searchQuery && filteredPuzzles.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              <p>Nessun puzzle trovato per "{searchQuery}"</p>
            </div>
          )}

          {searchQuery && paginatedResults.length > 0 && (
            <div className="divide-y">
              {paginatedResults.map((puzzle) => (
                <div
                  key={puzzle.id}
                  onClick={() => handlePuzzleClick(puzzle.id)}
                  className="p-4 hover:bg-accent cursor-pointer transition-colors flex gap-4 items-center"
                >
                  <div className="w-16 h-16 rounded overflow-hidden bg-muted shrink-0">
                    {puzzle.photos[0] ? (
                      <img
                        src={puzzle.photos[0]}
                        alt={puzzle.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium line-clamp-1">{puzzle.title}</h3>
                    {puzzle.author && (
                      <p className="text-sm text-muted-foreground line-clamp-1">{puzzle.author}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{puzzle.pieces_count} pezzi</span>
                      <Badge variant="secondary" className="text-xs">
                        {puzzle.condition}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {searchQuery && totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between bg-muted/20">
            <div className="text-sm text-muted-foreground">
              Pagina {currentPage} di {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Precedente
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Successiva
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
