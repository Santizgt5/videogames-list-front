export type GameStatus = "PLAYING" | "COMPLETED" | "PLAN_TO_PLAY" | "ON_HOLD" | "DROPPED";

export interface EntryRef {
  id: number;
  status: GameStatus;
}

export interface GameSummary {
  id: number;
  slug: string;
  name: string;
  coverUrl: string | null;
  released: string | null;
  metacritic: number | null;
  rating: number;
  genres: string[];
  platforms: string[];
  libraryEntry: EntryRef | null;
}

export interface SearchResponse {
  count: number;
  hasMore: boolean;
  results: GameSummary[];
}

export interface Game {
  id: number;
  slug: string;
  name: string;
  coverUrl: string | null;
  released: string | null;
  metacritic: number | null;
  genres: string[];
  platforms: string[];
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
