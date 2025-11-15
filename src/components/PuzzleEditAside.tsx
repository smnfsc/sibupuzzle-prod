import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, TrendingUp, Euro, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { PriceSearch } from "@/types/priceSearch";
import { Puzzle } from "@/types/puzzle";

interface PuzzleEditAsideProps {
  puzzle: Partial<Puzzle>;
  puzzleId?: string;
}

export const PuzzleEditAside = ({ puzzle, puzzleId }: PuzzleEditAsideProps) => {
  const [latestPriceSearch, setLatestPriceSearch] = useState<PriceSearch | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!puzzleId) return;

    const fetchLatestPriceSearch = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("price_searches")
        .select("*")
        .eq("puzzle_id", puzzleId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        setLatestPriceSearch(data as PriceSearch);
      }
      setLoading(false);
    };

    fetchLatestPriceSearch();
  }, [puzzleId]);

  const formatDate = (date: string | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateAvgPrice = () => {
    if (!latestPriceSearch?.prices_data) return null;
    const sum = latestPriceSearch.prices_data.reduce((acc, p) => acc + p.avg_price, 0);
    return (sum / latestPriceSearch.prices_data.length).toFixed(2);
  };

  return (
    <aside className="space-y-4">
      {/* Prezzi */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Euro className="h-5 w-5" />
            Prezzi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Prezzo di vendita */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Prezzo di vendita</span>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            {puzzle.price ? (
              <div className="text-2xl font-bold">€{puzzle.price.toFixed(2)}</div>
            ) : (
              <div className="text-sm text-muted-foreground italic">Non impostato</div>
            )}
          </div>

          <Separator />

          {/* Ultimo prezzo ricerca */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Ultimo prezzo consigliato</span>
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
            {loading ? (
              <div className="text-sm text-muted-foreground">Caricamento...</div>
            ) : latestPriceSearch ? (
              <div className="space-y-2">
                <div className="text-xl font-semibold">€{calculateAvgPrice()}</div>
                <div className="text-xs text-muted-foreground">
                  Media di {latestPriceSearch.total_countries} paesi
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDate(latestPriceSearch.created_at)}
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground italic">Nessuna ricerca disponibile</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Storico Modifiche */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Storico
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {puzzle.created_at && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">Creato</Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {formatDate(puzzle.created_at)}
              </div>
            </div>
          )}

          {puzzle.updated_at && puzzle.created_at !== puzzle.updated_at && (
            <>
              <Separator />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">Ultima modifica</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatDate(puzzle.updated_at)}
                </div>
              </div>
            </>
          )}

          {puzzle.listed_for_sale && (
            <>
              <Separator />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">In vendita</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  su {puzzle.sale_platform}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </aside>
  );
};
