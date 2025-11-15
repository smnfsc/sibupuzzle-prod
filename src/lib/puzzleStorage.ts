import { Puzzle } from "@/types/puzzle";

const STORAGE_KEY = "puzzles";

export const puzzleStorage = {
  getAll: (): Puzzle[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error reading puzzles:", error);
      return [];
    }
  },

  getById: (id: string): Puzzle | null => {
    const puzzles = puzzleStorage.getAll();
    return puzzles.find((p) => p.id === id) || null;
  },

  save: (puzzle: Puzzle): void => {
    const puzzles = puzzleStorage.getAll();
    const index = puzzles.findIndex((p) => p.id === puzzle.id);
    
    if (index >= 0) {
      puzzles[index] = { ...puzzle, updated_at: new Date().toISOString() };
    } else {
      puzzles.push({
        ...puzzle,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(puzzles));
  },

  delete: (id: string): void => {
    const puzzles = puzzleStorage.getAll();
    const filtered = puzzles.filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  },
};
