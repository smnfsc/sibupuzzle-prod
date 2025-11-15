import { supabase } from "./supabase";
import { Puzzle } from "@/types/puzzle";
import { Database } from "@/types/database";

type PuzzleRow = Database["public"]["Tables"]["puzzles"]["Row"];
type PhotoRow = Database["public"]["Tables"]["puzzle_photos"]["Row"];

const mapRowToPuzzle = async (row: PuzzleRow, photos: PhotoRow[]): Promise<Puzzle> => {
  const photoUrls = await Promise.all(
    photos.map(async (photo) => {
      const { data } = supabase.storage
        .from("puzzle-photos")
        .getPublicUrl(photo.storage_path);
      return data.publicUrl;
    })
  );

  return {
    id: row.id,
    title: row.title,
    author: row.author || undefined,
    pieces_count: row.pieces_count,
    sale_platform: row.sale_platform as any,
    listed_for_sale: row.listed_for_sale,
    complete: row.complete,
    assembled: row.assembled,
    has_box: row.has_box,
    condition: row.condition as any,
    purchase_price: (row as any).purchase_price || undefined,
    price: row.price || undefined,
    sold_price: row.sold_price || undefined,
    photos: photoUrls,
    notes: row.notes || undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

export const supabasePuzzleStorage = {
  getAll: async (): Promise<Puzzle[]> => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return [];

    const { data: puzzles, error } = await supabase
      .from("puzzles")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching puzzles:", error);
      return [];
    }

    const puzzlesWithPhotos = await Promise.all(
      puzzles.map(async (puzzle) => {
        const { data: photos } = await supabase
          .from("puzzle_photos")
          .select("*")
          .eq("puzzle_id", puzzle.id)
          .order("display_order");

        return mapRowToPuzzle(puzzle, photos || []);
      })
    );

    return puzzlesWithPhotos;
  },

  getById: async (id: string): Promise<Puzzle | null> => {
    const { data: puzzle, error } = await supabase
      .from("puzzles")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !puzzle) {
      console.error("Error fetching puzzle:", error);
      return null;
    }

    const { data: photos } = await supabase
      .from("puzzle_photos")
      .select("*")
      .eq("puzzle_id", id)
      .order("display_order");

    return mapRowToPuzzle(puzzle, photos || []);
  },

  save: async (puzzle: Puzzle): Promise<void> => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error("User not authenticated");

    const puzzleData = {
      id: puzzle.id,
      user_id: user.user.id,
      title: puzzle.title,
      author: puzzle.author || null,
      pieces_count: puzzle.pieces_count,
      sale_platform: puzzle.sale_platform,
      listed_for_sale: puzzle.listed_for_sale,
      complete: puzzle.complete,
      assembled: puzzle.assembled,
      has_box: puzzle.has_box,
      condition: puzzle.condition,
      purchase_price: puzzle.purchase_price || null,
      price: puzzle.price || null,
      sold_price: puzzle.sold_price || null,
      notes: puzzle.notes || null,
    };

    const { error: upsertError } = await supabase
      .from("puzzles")
      .upsert(puzzleData);

    if (upsertError) {
      console.error("Error saving puzzle:", upsertError);
      throw upsertError;
    }

    // Get existing photos
    const { data: existingPhotos } = await supabase
      .from("puzzle_photos")
      .select("storage_path")
      .eq("puzzle_id", puzzle.id);

    const existingPaths = existingPhotos?.map(p => p.storage_path) || [];
    const currentPhotos = puzzle.photos || [];
    
    // Extract storage paths from current Supabase URLs
    const currentSupabasePaths = currentPhotos
      .filter(url => url.includes('supabase.co'))
      .map(url => {
        // Extract the path after puzzle-photos/
        const match = url.match(/puzzle-photos\/(.+)$/);
        return match ? match[1] : null;
      })
      .filter(Boolean) as string[];

    // Find photos to delete (existing but not in current list)
    const photosToDelete = existingPaths.filter(path => !currentSupabasePaths.includes(path));
    
    if (photosToDelete.length > 0) {
      await supabase.storage.from("puzzle-photos").remove(photosToDelete);
      await supabase
        .from("puzzle_photos")
        .delete()
        .in("storage_path", photosToDelete);
    }

    // Process photos: keep existing ones and upload new ones
    for (let i = 0; i < currentPhotos.length; i++) {
      const photoUrl = currentPhotos[i];
      
      // If it's already a Supabase URL, update its display_order
      if (photoUrl.includes('supabase.co')) {
        const match = photoUrl.match(/puzzle-photos\/(.+)$/);
        if (match) {
          const storagePath = match[1];
          // Update display order for existing photo
          await supabase
            .from("puzzle_photos")
            .update({ display_order: i })
            .eq("puzzle_id", puzzle.id)
            .eq("storage_path", storagePath);
        }
        continue;
      }

      // Upload new photo
      const fileName = `${user.user.id}/${puzzle.id}/${Date.now()}-${i}.jpg`;
      
      // Convert base64 to blob
      const base64Response = await fetch(photoUrl);
      const blob = await base64Response.blob();

      const { error: uploadError } = await supabase.storage
        .from("puzzle-photos")
        .upload(fileName, blob);

      if (uploadError) {
        console.error("Error uploading photo:", uploadError);
        continue;
      }

      await supabase.from("puzzle_photos").insert({
        puzzle_id: puzzle.id,
        storage_path: fileName,
        display_order: i,
      });
    }
  },

  delete: async (id: string): Promise<void> => {
    const { data: photos } = await supabase
      .from("puzzle_photos")
      .select("storage_path")
      .eq("puzzle_id", id);

    if (photos && photos.length > 0) {
      const paths = photos.map((p) => p.storage_path);
      await supabase.storage.from("puzzle-photos").remove(paths);
    }

    const { error } = await supabase.from("puzzles").delete().eq("id", id);

    if (error) {
      console.error("Error deleting puzzle:", error);
      throw error;
    }
  },

  addPhotos: async (puzzleId: string, photoFiles: File[]): Promise<void> => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error("User not authenticated");

    // Get current max display order
    const { data: existingPhotos } = await supabase
      .from("puzzle_photos")
      .select("display_order")
      .eq("puzzle_id", puzzleId)
      .order("display_order", { ascending: false })
      .limit(1);

    let displayOrder = existingPhotos && existingPhotos.length > 0 
      ? existingPhotos[0].display_order + 1 
      : 0;

    for (const file of photoFiles) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.user.id}/${puzzleId}/${Date.now()}_${displayOrder}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("puzzle-photos")
        .upload(fileName, file);

      if (uploadError) {
        console.error("Error uploading photo:", uploadError);
        continue;
      }

      await supabase.from("puzzle_photos").insert({
        puzzle_id: puzzleId,
        storage_path: fileName,
        display_order: displayOrder,
      });

      displayOrder++;
    }

    // Update puzzle updated_at
    await supabase
      .from("puzzles")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", puzzleId);
  },
};
