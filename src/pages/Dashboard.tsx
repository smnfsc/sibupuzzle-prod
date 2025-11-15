import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabasePuzzleStorage } from "@/lib/supabasePuzzleStorage";
import { supabase } from "@/lib/supabase";
import { Puzzle } from "@/types/puzzle";
import { PriceSearch } from "@/types/priceSearch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, TrendingDown, Package, ShoppingCart, CheckCircle2, Euro, PieChart as PieChartIcon, AlertCircle, MapPin, Clock } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line, CartesianGrid, ComposedChart } from "recharts";

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [priceSearches, setPriceSearches] = useState<Record<string, PriceSearch>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    const loadPuzzles = async () => {
      setLoading(true);
      const data = await supabasePuzzleStorage.getAll();
      setPuzzles(data);
      
      // Carica le ricerche di prezzo più recenti per ogni puzzle
      if (data.length > 0) {
        const { data: searches } = await supabase
          .from('price_searches')
          .select('*')
          .in('puzzle_id', data.map(p => p.id))
          .order('search_date', { ascending: false });
        
        if (searches) {
          const searchMap: Record<string, PriceSearch> = {};
          searches.forEach(search => {
            if (!searchMap[search.puzzle_id]) {
              searchMap[search.puzzle_id] = search;
            }
          });
          setPriceSearches(searchMap);
        }
      }
      
      setLoading(false);
    };

    if (user) {
      loadPuzzles();
    }
  }, [user, authLoading, navigate]);

  // Calcoli statistiche
  const stats = useMemo(() => {
    const total = puzzles.length;
    const forSale = puzzles.filter(p => p.listed_for_sale).length;
    const complete = puzzles.filter(p => p.complete).length;
    const assembled = puzzles.filter(p => p.assembled).length;

    const totalPurchaseValue = puzzles.reduce((sum, p) => sum + (p.purchase_price || 0), 0);
    const totalSaleValue = puzzles.filter(p => p.listed_for_sale).reduce((sum, p) => sum + (p.price || 0), 0);
    const potentialProfit = totalSaleValue - puzzles.filter(p => p.listed_for_sale).reduce((sum, p) => sum + (p.purchase_price || 0), 0);

    // Distribuzione per numero di pezzi
    const pieceRanges = [
      { name: '0-500', count: 0 },
      { name: '501-1000', count: 0 },
      { name: '1001-2000', count: 0 },
      { name: '2000+', count: 0 },
    ];

    puzzles.forEach(p => {
      if (p.pieces_count <= 500) pieceRanges[0].count++;
      else if (p.pieces_count <= 1000) pieceRanges[1].count++;
      else if (p.pieces_count <= 2000) pieceRanges[2].count++;
      else pieceRanges[3].count++;
    });

    // Distribuzione per condizione
    const conditionData = Object.entries(
      puzzles.reduce((acc, p) => {
        acc[p.condition] = (acc[p.condition] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([name, value]) => ({ name, value }));

    // Top autori
    const authorData = Object.entries(
      puzzles.reduce((acc, p) => {
        if (p.author) {
          acc[p.author] = (acc[p.author] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>)
    )
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Puzzle con maggior margine
    const topMargins = puzzles
      .filter(p => p.price && p.purchase_price)
      .map(p => ({
        ...p,
        margin: (p.price || 0) - (p.purchase_price || 0),
        marginPercent: p.purchase_price ? (((p.price || 0) - p.purchase_price) / p.purchase_price) * 100 : 0
      }))
      .sort((a, b) => b.margin - a.margin)
      .slice(0, 5);

    // Ultimi puzzle aggiunti
    const recentPuzzles = [...puzzles]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    // ROI per autore
    const authorROI = Object.entries(
      puzzles.reduce((acc, p) => {
        if (!p.author) return acc;
        if (!acc[p.author]) {
          acc[p.author] = { invested: 0, saleValue: 0, count: 0 };
        }
        acc[p.author].invested += p.purchase_price || 0;
        acc[p.author].saleValue += p.price || 0;
        acc[p.author].count += 1;
        return acc;
      }, {} as Record<string, { invested: number; saleValue: number; count: number }>)
    )
      .map(([name, data]) => ({
        name,
        roi: data.invested > 0 ? ((data.saleValue - data.invested) / data.invested) * 100 : 0,
        profit: data.saleValue - data.invested,
        count: data.count
      }))
      .filter(a => a.count >= 2) // Solo autori con almeno 2 puzzle
      .sort((a, b) => b.roi - a.roi)
      .slice(0, 5);

    // Confronto prezzi (acquisto vs consigliato vs vendita)
    const priceComparison = puzzles
      .filter(p => p.purchase_price && p.price)
      .map(p => {
        const search = priceSearches[p.id];
        const recommendedPrice = search?.prices_data?.length
          ? search.prices_data.reduce((sum, pd) => sum + pd.avg_price, 0) / search.prices_data.length
          : null;
        
        return {
          id: p.id,
          title: p.title.length > 20 ? p.title.substring(0, 20) + '...' : p.title,
          acquisto: p.purchase_price || 0,
          consigliato: recommendedPrice || 0,
          vendita: p.price || 0
        };
      })
      .filter(p => p.consigliato > 0)
      .slice(0, 10);

    // Opportunità perse (prezzo vendita < prezzo consigliato)
    const lostOpportunities = puzzles
      .filter(p => {
        const search = priceSearches[p.id];
        if (!search?.prices_data?.length || !p.price) return false;
        const recommendedPrice = search.prices_data.reduce((sum, pd) => sum + pd.avg_price, 0) / search.prices_data.length;
        return p.price < recommendedPrice;
      })
      .map(p => {
        const search = priceSearches[p.id]!;
        const recommendedPrice = search.prices_data.reduce((sum, pd) => sum + pd.avg_price, 0) / search.prices_data.length;
        return {
          ...p,
          recommendedPrice,
          lostProfit: recommendedPrice - (p.price || 0)
        };
      })
      .sort((a, b) => b.lostProfit - a.lostProfit)
      .slice(0, 5);

    // Puzzle fermi (in vendita da più di 30 giorni)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const stalePuzzles = puzzles
      .filter(p => p.listed_for_sale && new Date(p.updated_at) < thirtyDaysAgo)
      .map(p => ({
        ...p,
        daysListed: Math.floor((now.getTime() - new Date(p.updated_at).getTime()) / (24 * 60 * 60 * 1000))
      }))
      .sort((a, b) => b.daysListed - a.daysListed)
      .slice(0, 5);

    // Mappa disponibilità Europa (aggregate data)
    const europeanMarkets = Object.entries(
      Object.values(priceSearches).reduce((acc, search) => {
        search.prices_data?.forEach(pd => {
          if (!acc[pd.country]) {
            acc[pd.country] = {
              country: pd.country,
              country_code: pd.country_code,
              totalValue: 0,
              count: 0,
              avgPrice: 0
            };
          }
          acc[pd.country].totalValue += pd.avg_price;
          acc[pd.country].count += 1;
        });
        return acc;
      }, {} as Record<string, { country: string; country_code: string; totalValue: number; count: number; avgPrice: number }>)
    )
      .map(([_, data]) => ({
        ...data,
        avgPrice: data.totalValue / data.count
      }))
      .sort((a, b) => b.avgPrice - a.avgPrice);

    return {
      total,
      forSale,
      complete,
      assembled,
      totalPurchaseValue,
      totalSaleValue,
      potentialProfit,
      pieceRanges: pieceRanges.filter(r => r.count > 0),
      conditionData,
      authorData,
      topMargins,
      recentPuzzles,
      authorROI,
      priceComparison,
      lostOpportunities,
      stalePuzzles,
      europeanMarkets
    };
  }, [puzzles, priceSearches]);

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
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
              <p className="text-sm text-muted-foreground">Analisi della tua collezione</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Totale Puzzle</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.complete} completi • {stats.assembled} assemblati
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Vendita</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.forSale}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total > 0 ? Math.round((stats.forSale / stats.total) * 100) : 0}% della collezione
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valore Acquisto</CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{stats.totalPurchaseValue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Investimento totale
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Margine Potenziale</CardTitle>
              {stats.potentialProfit >= 0 ? (
                <TrendingUp className="h-4 w-4 text-success" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.potentialProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                €{stats.potentialProfit.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Su puzzle in vendita
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Grafici */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distribuzione per pezzi */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5" />
                Distribuzione per Numero di Pezzi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.pieceRanges}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {stats.pieceRanges.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Distribuzione per condizione */}
          <Card>
            <CardHeader>
              <CardTitle>Condizione Puzzle</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.conditionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Autori */}
          {stats.authorData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top 5 Autori</CardTitle>
                <CardDescription>Gli autori più presenti nella collezione</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.authorData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Top Margini */}
          {stats.topMargins.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top 5 Margini di Guadagno</CardTitle>
                <CardDescription>Puzzle con maggior potenziale di profitto</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.topMargins.map((puzzle) => (
                    <div
                      key={puzzle.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                      onClick={() => navigate(`/puzzle/${puzzle.id}`)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{puzzle.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Acquisto: €{puzzle.purchase_price?.toFixed(2)} → Vendita: €{puzzle.price?.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-bold text-success">+€{puzzle.margin.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">+{puzzle.marginPercent.toFixed(0)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ROI per Autore */}
          {stats.authorROI.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>ROI per Autore</CardTitle>
                <CardDescription>Autori con il miglior ritorno sull'investimento</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.authorROI} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} />
                    <Tooltip 
                      formatter={(value: number, name: string) => {
                        if (name === 'roi') return [`${value.toFixed(1)}%`, 'ROI'];
                        return [value, name];
                      }}
                    />
                    <Bar dataKey="roi" fill="hsl(var(--primary))" name="ROI %" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {stats.authorROI.map((author) => (
                    <div key={author.name} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{author.name}</span>
                      <span className={`font-medium ${author.roi >= 0 ? 'text-primary' : 'text-destructive'}`}>
                        {author.roi >= 0 ? '+' : ''}{author.roi.toFixed(1)}% (€{author.profit.toFixed(2)})
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Confronto Prezzi */}
          {stats.priceComparison.length > 0 && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Confronto Prezzi</CardTitle>
                <CardDescription>Prezzo di acquisto vs consigliato vs vendita</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={stats.priceComparison}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="title" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="acquisto" fill="hsl(var(--muted))" name="Acquisto" />
                    <Bar dataKey="consigliato" fill="hsl(var(--primary))" name="Consigliato" />
                    <Bar dataKey="vendita" fill="hsl(var(--accent))" name="Vendita" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Alert Sezioni */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Opportunità Perse */}
          {stats.lostOpportunities.length > 0 && (
            <Card className="border-destructive">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <CardTitle className="text-destructive">Opportunità Perse</CardTitle>
                </div>
                <CardDescription>Puzzle con prezzo di vendita inferiore al consigliato</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.lostOpportunities.map((puzzle) => (
                    <div
                      key={puzzle.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-destructive/10 hover:bg-destructive/20 cursor-pointer transition-colors"
                      onClick={() => navigate(`/puzzle/${puzzle.id}`)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{puzzle.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Vendita: €{puzzle.price?.toFixed(2)} • Consigliato: €{puzzle.recommendedPrice.toFixed(2)}
                        </p>
                      </div>
                      <Badge variant="destructive" className="ml-2">
                        -€{puzzle.lostProfit.toFixed(2)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Puzzle Fermi */}
          {stats.stalePuzzles.length > 0 && (
            <Card className="border-muted-foreground">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Puzzle Fermi</CardTitle>
                </div>
                <CardDescription>Puzzle in vendita da oltre 30 giorni</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.stalePuzzles.map((puzzle) => (
                    <div
                      key={puzzle.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                      onClick={() => navigate(`/puzzle/${puzzle.id}`)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{puzzle.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Prezzo: €{puzzle.price?.toFixed(2)}
                        </p>
                      </div>
                      <Badge variant="outline" className="ml-2">
                        {puzzle.daysListed} giorni
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Mappa Disponibilità Europa */}
        {stats.europeanMarkets.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <CardTitle>Mercati Europei</CardTitle>
              </div>
              <CardDescription>Dove i tuoi puzzle hanno più valore</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.europeanMarkets.map((market) => (
                  <div
                    key={market.country_code}
                    className="p-4 rounded-lg border border-border bg-card hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{market.country_code === 'IT' ? '🇮🇹' : market.country_code === 'DE' ? '🇩🇪' : market.country_code === 'FR' ? '🇫🇷' : market.country_code === 'GB' ? '🇬🇧' : market.country_code === 'ES' ? '🇪🇸' : market.country_code === 'NL' ? '🇳🇱' : '🇪🇺'}</span>
                        <span className="font-medium">{market.country}</span>
                      </div>
                      <Badge variant="secondary">{market.count}</Badge>
                    </div>
                    <div className="text-2xl font-bold text-primary">
                      €{market.avgPrice.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Prezzo medio</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ultimi Puzzle Aggiunti */}
        <Card>
          <CardHeader>
            <CardTitle>Ultimi Puzzle Aggiunti</CardTitle>
            <CardDescription>Gli ultimi 5 puzzle aggiunti alla collezione</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentPuzzles.map((puzzle) => (
                <div
                  key={puzzle.id}
                  className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                  onClick={() => navigate(`/puzzle/${puzzle.id}`)}
                >
                  {puzzle.photos[0] ? (
                    <img
                      src={puzzle.photos[0]}
                      alt={puzzle.title}
                      className="h-16 w-16 object-cover rounded"
                    />
                  ) : (
                    <div className="h-16 w-16 bg-muted rounded flex items-center justify-center">
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{puzzle.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {puzzle.author} • {puzzle.pieces_count} pezzi
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={puzzle.listed_for_sale ? "default" : "secondary"}>
                      {puzzle.listed_for_sale ? "In vendita" : "Non in vendita"}
                    </Badge>
                    {puzzle.complete && (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
