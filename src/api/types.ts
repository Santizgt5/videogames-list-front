export type GameStatus = "PLAYING" | "COMPLETED" | "PLAN_TO_PLAY" | "ON_HOLD" | "DROPPED";

export interface EntryRef {
  id: number;
  status: GameStatus;
}

export interface Game {
  id: number; // id de IGDB
  slug: string;
  name: string;
  coverUrl: string | null;
  backgroundUrl: string | null;
  released: string | null;
  criticScore: number | null; // 0-100
  genres: string[];
  platforms: string[];
}

export interface GameSummary extends Game {
  libraryEntry: EntryRef | null;
}

export interface SearchResponse {
  hasMore: boolean;
  results: GameSummary[];
}

export interface LibraryEntry {
  id: number;
  gameId: number;
  status: GameStatus;
  score: number | null;
  hoursPlayed: number | null;
  platform: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  notes: string | null;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
  game: Game;
}

export type EntryInput = Partial<
  Pick<
    LibraryEntry,
    "status" | "score" | "hoursPlayed" | "platform" | "startedAt" | "finishedAt" | "notes" | "favorite"
  >
>;

export interface Stats {
  total: number;
  favorites: number;
  averageScore: number | null;
  totalHours: number;
  byStatus: Partial<Record<GameStatus, number>>;
}

export type SortKey = "updated" | "added" | "name" | "score" | "hours" | "released";
