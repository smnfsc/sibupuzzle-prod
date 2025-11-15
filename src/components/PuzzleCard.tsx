import { Link } from "react-router-dom";
import { Puzzle } from "@/types/puzzle";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Package, Image as ImageIcon, Camera, Trash2, Edit, DollarSign, Zap } from "lucide-react";
import { useRef } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";

interface PuzzleCardProps {
  puzzle: Puzzle;
  onDelete?: (id: string) => void;
  onAddPhotos?: (id: string, files: File[]) => void;
  onMarkAsSold?: (id: string) => void;
  recommendedPrice?: number;
  searchCount?: number;
  onRequestPrice?: (puzzleId: string) => void;
  loadingPrice?: boolean;
  onPriceHistoryClick?: (puzzle: Puzzle) => void;
}

export const PuzzleCard = ({ puzzle, onDelete, onAddPhotos, onMarkAsSold, recommendedPrice, searchCount = 0, onRequestPrice, loadingPrice = false, onPriceHistoryClick }: PuzzleCardProps) => {
  const thumbnail = puzzle.photos[0];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const files = Array.from(e.target.files || []);
    if (files.length > 0 && onAddPhotos) {
      onAddPhotos(puzzle.id, files);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete) {
      onDelete(puzzle.id);
    }
  };

  const handlePhotoButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleMarkAsSoldClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onMarkAsSold) {
      onMarkAsSold(puzzle.id);
    }
  };

  const handleRequestPriceClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onRequestPrice) {
      onRequestPrice(puzzle.id);
    }
  };

  const handlePriceHistoryClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onPriceHistoryClick) {
      onPriceHistoryClick(puzzle);
    }
  };

  return (
    <div className="relative group">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={handleAddPhotos}
        className="hidden"
      />
      
      <Link to={`/puzzle/${puzzle.id}`}>
        <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
          <div className="aspect-square bg-muted relative">
            {thumbnail ? (
              <>
                <img
                  src={thumbnail}
                  alt={puzzle.title}
                  className="w-full h-full object-cover"
                />
                <Badge className="absolute top-2 left-2 text-xs" variant="secondary">
                  Foto di copertina
                </Badge>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
            
            {/* Quick actions overlay */}
            <div className="absolute top-2 right-2 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8 shadow-lg"
                onClick={handlePhotoButtonClick}
                title="Aggiungi foto"
              >
                <Camera className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8 shadow-lg"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = `/puzzle/${puzzle.id}/edit`;
                  }}>
                    <Edit className="h-4 w-4 mr-2" />
                    Modifica
                  </DropdownMenuItem>
                  {puzzle.listed_for_sale && onMarkAsSold && (
                    <DropdownMenuItem onClick={handleMarkAsSoldClick}>
                      <DollarSign className="h-4 w-4 mr-2" />
                      Segna come Venduto
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem
                      onClick={handleDeleteClick}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Elimina
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

        <div className="p-3 space-y-2">
          <div>
            <h3 className="font-semibold text-base leading-tight line-clamp-2">
              {puzzle.title}
            </h3>
            {puzzle.author && (
              <p className="text-sm text-muted-foreground mt-1">{puzzle.author}</p>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            <span>{puzzle.pieces_count} pezzi</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs">
              {puzzle.condition}
            </Badge>
            
            {puzzle.complete && (
              <Badge variant="outline" className="text-xs gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Completo
              </Badge>
            )}
            
            {puzzle.assembled && (
              <Badge variant="outline" className="text-xs gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Assemblato
              </Badge>
            )}
            
            {!puzzle.has_box && (
              <Badge variant="outline" className="text-xs gap-1">
                <XCircle className="h-3 w-3" />
                Senza scatola
              </Badge>
            )}
            
            {puzzle.listed_for_sale && (
              <Badge className="text-xs">
                In Vendita
              </Badge>
            )}
            
            {puzzle.sale_platform !== "None" && (
              <Badge variant="outline" className="text-xs">
                {puzzle.sale_platform}
              </Badge>
            )}
          </div>

          {/* Prezzi */}
          {(puzzle.purchase_price || recommendedPrice || puzzle.price || puzzle.sold_price) && (
            <div className="pt-2 border-t flex flex-wrap gap-2">
              {puzzle.purchase_price && (
                <div className="flex-1 min-w-[80px]">
                  <p className="text-xs text-muted-foreground">Acquisto</p>
                  <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    €{puzzle.purchase_price.toFixed(2)}
                  </p>
                </div>
              )}
              
              <div className="flex-1 min-w-[80px]">
                <p className="text-xs text-muted-foreground">Consigliato</p>
                {recommendedPrice ? (
                  <p 
                    className="text-sm font-semibold text-primary cursor-pointer hover:underline"
                    onClick={handlePriceHistoryClick}
                  >
                    €{recommendedPrice.toFixed(2)}
                  </p>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs mt-1"
                    onClick={handleRequestPriceClick}
                    disabled={loadingPrice || searchCount >= 2}
                  >
                    {loadingPrice ? (
                      "..."
                    ) : (
                      <>
                        <Zap className="h-3 w-3 mr-1" />
                        {2 - searchCount}/2
                      </>
                    )}
                  </Button>
                )}
              </div>
              
              {puzzle.price && (
                <div className="flex-1 min-w-[80px]">
                  <p className="text-xs text-muted-foreground">Vendita</p>
                  <p className="text-sm font-semibold">
                    €{puzzle.price.toFixed(2)}
                  </p>
                </div>
              )}
              
              {puzzle.sold_price && (
                <div className="flex-1 min-w-[80px]">
                  <p className="text-xs text-muted-foreground">Venduto</p>
                  <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                    €{puzzle.sold_price.toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </Link>
    </div>
  );
};
