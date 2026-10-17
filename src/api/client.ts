import type { EntryInput, GameStatus, LibraryEntry, SearchResponse, SortKey, Stats } from "./types";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
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
  search: (q: string, page = 1) => request<SearchResponse>(`/games/search${qs({ q, page })}`),
  library: (f: LibraryFilters = {}) => request<LibraryEntry[]>(`/library${qs({ ...f })}`),
  stats: () => request<Stats>("/library/stats"),
  entry: (id: number) => request<LibraryEntry>(`/library/${id}`),
  add: (gameId: number, data: EntryInput = {}) =>
    request<LibraryEntry>("/library", { method: "POST", body: JSON.stringify({ gameId, ...data }) }),
  update: (id: number, data: EntryInput) =>
    request<LibraryEntry>(`/library/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  remove: (id: number) => request<void>(`/library/${id}`, { method: "DELETE" }),
};
