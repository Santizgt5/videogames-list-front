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

export interface User {
  id: number;
  email: string;
  username: string;
  createdAt: string;
}

export interface SteamStatus {
  configured: boolean; // hay STEAM_API_KEY en el backend
  connected: boolean;
  steamId: string | null;
  name: string | null;
  avatar: string | null;
  syncedAt: string | null;
}

export interface SteamGame {
  appId: number;
  name: string;
  playtimeMinutes: number;
  playtime2Weeks: number;
  hours: number;
  lastPlayedAt: string | null;
  igdbId: number | null;
  igdbCoverUrl: string | null;
  capsuleUrl: string;
  achievementsTotal: number;
  achievementsUnlocked: number;
  libraryEntry: EntryRef | null;
}

export interface SteamAchievement {
  apiName: string;
  name: string;
  description: string;
  icon: string;
  iconGray: string;
  hidden: boolean;
  unlocked: boolean;
  unlockedAt: string | null;
  percent: number | null;
}

export interface SteamAchievements {
  appId: number;
  name: string;
  hours: number;
  achievementsTotal: number;
  achievementsUnlocked: number;
  achievements: SteamAchievement[];
}

export interface SyncResult {
  games: number;
  played: number;
  matched: number;
  achievementsChecked: number;
  achievementsFailed: number;
  entriesUpdated: number; // entradas de tu lista con horas o fechas actualizadas
}

export interface StatsPageData {
  totals: {
    games: number;
    completed: number;
    playing: number;
    favorites: number;
    hours: number;
    averageScore: number | null;
  };
  completedByYear: { year: number; count: number; hours: number; games: string[] }[];
  completedWithoutDate: number;
  genres: { genre: string; games: number; hours: number; averageScore: number | null }[];
  scores: { score: number; count: number }[];
  topHours: { entryId: number; name: string; coverUrl: string | null; hours: number; status: GameStatus }[];
  steam: {
    achievements: number;
    perfectGames: number;
    gamesWithAchievements: number;
    achievementsByMonth: { month: string; count: number }[]; // "YYYY-MM"
    rarest: { game: string; name: string; description: string; icon: string; percent: number; unlockedAt: string | null }[];
    closest: { appId: number; name: string; coverUrl: string | null; unlocked: number; total: number }[];
  } | null;
}
