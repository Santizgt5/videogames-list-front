import type {
  EntryInput,
  GameStatus,
  LibraryEntry,
  SearchResponse,
  SortKey,
  Stats,
  StatsPageData,
  SteamAchievements,
  SteamGame,
  SteamStatus,
  SyncResult,
  User,
} from "./types";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// Se llama cuando la sesión caduca a mitad de uso (un 401 fuera de /auth)
let onUnauthorized = () => {};
export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiError(0, "No se puede conectar con el servidor. ¿Está el backend arrancado?");
  }
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => null);
  if (res.status === 401 && !path.startsWith("/auth")) onUnauthorized();
  if (!res.ok) throw new ApiError(res.status, body?.error ?? `Error ${res.status}`);
  return body as T;
}

export interface LibraryFilters {
  status?: GameStatus;
  favorite?: boolean;
  q?: string;
  sort?: SortKey;
}

function qs(params: Record<string, string | number | boolean | undefined>) {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") s.set(k, String(v));
  const str = s.toString();
  return str ? `?${str}` : "";
}

export const api = {
  /** El usuario con sesión, o null si no hay */
  me: () =>
    request<User>("/auth/me").catch((e) => {
      if (e instanceof ApiError && e.status === 401) return null;
      throw e;
    }),
  login: (login: string, password: string) =>
    request<User>("/auth/login", { method: "POST", body: JSON.stringify({ login, password }) }),
  register: (data: { email: string; username: string; password: string }) =>
    request<User>("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  logout: () => request<void>("/auth/logout", { method: "POST" }),
  search: (q: string, page = 1) => request<SearchResponse>(`/games/search${qs({ q, page })}`),
  library: (f: LibraryFilters = {}) => request<LibraryEntry[]>(`/library${qs({ ...f })}`),
  stats: () => request<Stats>("/library/stats"),
  statsPage: () => request<StatsPageData>("/stats"),
  entry: (id: number) => request<LibraryEntry>(`/library/${id}`),
  add: (gameId: number, data: EntryInput = {}) =>
    request<LibraryEntry>("/library", { method: "POST", body: JSON.stringify({ gameId, ...data }) }),
  update: (id: number, data: EntryInput) =>
    request<LibraryEntry>(`/library/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  remove: (id: number) => request<void>(`/library/${id}`, { method: "DELETE" }),

  steam: {
    status: () => request<SteamStatus>("/steam"),
    /** Se abre como página (redirige a Steam), no con fetch */
    connectUrl: "/api/steam/connect",
    disconnect: () => request<void>("/steam", { method: "DELETE" }),
    sync: () => request<SyncResult>("/steam/sync", { method: "POST" }),
    games: () => request<SteamGame[]>("/steam/games"),
    achievements: (igdbId: number) => request<SteamAchievements | null>(`/steam/achievements/${igdbId}`),
    import: (items: { appId: number; status: GameStatus }[]) =>
      request<{ added: number }>("/steam/import", { method: "POST", body: JSON.stringify({ items }) }),
  },
};
