import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router";
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import type { GameStatus, SteamGame, SteamStatus } from "../api/types";
import { STATUSES } from "../lib/status";
import { Cover } from "../components/Cover";
import { StatusLabel } from "../components/StatusDot";
import { EntryEditor, type EditorTarget } from "../components/EntryEditor";
import { SteamLogo } from "../components/SteamLogo";

type Tab = "add" | "list" | "all";
type ImportStatus = GameStatus | "AUTO";

/** Recarga todo lo que puede cambiar tras sincronizar o importar */
function refreshAll(qc: QueryClient) {
  for (const key of ["steam", "steam-games", "steam-achievements", "library", "stats", "stats-page", "entry", "search"]) {
    qc.invalidateQueries({ queryKey: [key] });
  }
}

export function SteamPage() {
  const status = useQuery({ queryKey: ["steam"], queryFn: api.steam.status });

  if (status.isPending) return <p className="text-muted">Cargando…</p>;
  if (status.isError) return <p className="text-st-dropped">{status.error.message}</p>;
  if (!status.data.configured) return <NotConfigured />;
  if (!status.data.connected) return <Connect />;
  return <Connected status={status.data} />;
}

/* ---------- Mensajes de vuelta de Steam (?connected=1 / ?error=...) ---------- */

function useSteamRedirectParams() {
  const [params, setParams] = useSearchParams();
  const [message] = useState(() => ({
    connected: params.get("connected") === "1",
    error: params.get("error"),
  }));
  // Los quitamos de la URL para que no reaparezcan al recargar
  useEffect(() => {
    if (params.has("connected") || params.has("error")) setParams({}, { replace: true });
  }, [params, setParams]);
  return message;
}

function Banner({ tone, children }: { tone: "ok" | "error"; children: ReactNode }) {
  const cls = tone === "ok" ? "bg-st-completed/15 text-st-completed" : "bg-st-dropped/15 text-st-dropped";
  return (
    <p role={tone === "error" ? "alert" : "status"} className={`mb-6 rounded-md px-4 py-3 ${cls}`}>
      {children}
    </p>
  );
}

/* ---------- Sin API key ---------- */

function NotConfigured() {
  return (
    <section className="max-w-2xl">
      <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">Steam</h1>
      <div className="mt-6 rounded-lg border border-line bg-panel p-6">
        <p className="font-bold">Falta la API key de Steam en el backend.</p>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-muted">
          <li>
            Pide una gratis en{" "}
            <a href="https://steamcommunity.com/dev/apikey" target="_blank" rel="noreferrer" className="text-text underline">
              steamcommunity.com/dev/apikey
            </a>{" "}
            (dominio: <code className="text-text">localhost</code>).
          </li>
          <li>
            Ponla en <code className="text-text">backend/.env</code> como <code className="text-text">STEAM_API_KEY=…</code>
          </li>
          <li>Reinicia el backend y recarga esta página.</li>
        </ol>
      </div>
    </section>
  );
}

/* ---------- Sin conectar ---------- */

function Connect() {
  const { error } = useSteamRedirectParams();
  return (
    <section className="max-w-2xl">
      {error && <Banner tone="error">{error}</Banner>}
      <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">Conecta tu Steam</h1>
      <p className="mt-3 text-lg text-muted">
        Trae tus juegos, las horas que llevas en cada uno y tus logros. Luego eliges cuáles pasar a tu lista.
      </p>

      <a
        href={api.steam.connectUrl}
        className="mt-8 inline-flex items-center gap-3 rounded-md bg-[#171a21] px-5 py-3 font-bold text-white ring-1 ring-[#66c0f4]/40 transition hover:ring-[#66c0f4]"
      >
        <SteamLogo className="size-6" />
        Iniciar sesión con Steam
      </a>

      <ul className="mt-8 space-y-2 text-sm text-muted">
        <li>Inicias sesión en la página oficial de Steam; nunca vemos tu contraseña.</li>
        <li>
          Tu perfil debe tener <span className="text-text">Detalles de juegos</span> en Público (Steam &gt; Editar perfil &gt;
          Privacidad).
        </li>
      </ul>
    </section>
  );
}

/* ---------- Conectado ---------- */

function Connected({ status }: { status: SteamStatus }) {
  const qc = useQueryClient();
  const redirect = useSteamRedirectParams();
  const games = useQuery({ queryKey: ["steam-games"], queryFn: api.steam.games });

  const sync = useMutation({ mutationFn: api.steam.sync, onSuccess: () => refreshAll(qc) });
  const disconnect = useMutation({ mutationFn: api.steam.disconnect, onSuccess: () => refreshAll(qc) });

  // Primera sincronización automática al volver de Steam
  const autoSynced = useRef(false);
  useEffect(() => {
    if (redirect.connected && !status.syncedAt && !autoSynced.current) {
      autoSynced.current = true;
      sync.mutate();
    }
  }, [redirect.connected, status.syncedAt, sync]);

  const list = useMemo(() => games.data ?? [], [games.data]);
  const totals = useMemo(
    () => ({
      hours: list.reduce((n, g) => n + g.hours, 0),
      unlocked: list.reduce((n, g) => n + g.achievementsUnlocked, 0),
      played: list.filter((g) => g.playtimeMinutes > 0).length,
    }),
    [list],
  );

  return (
    <>
      {redirect.error && <Banner tone="error">{redirect.error}</Banner>}
      {redirect.connected && !sync.isPending && !sync.isError && (
        <Banner tone="ok">Cuenta de Steam conectada.</Banner>
      )}

      <section className="mb-8 flex flex-wrap items-center gap-x-6 gap-y-4">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          {status.avatar ? (
            <img src={status.avatar} alt="" className="size-16 shrink-0 rounded-md ring-1 ring-line" />
          ) : (
            <div className="grid size-16 shrink-0 place-items-center rounded-md bg-[#171a21]">
              <SteamLogo className="size-8 text-white" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="truncate font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              {status.name ?? "Steam"}
            </h1>
            <p className="text-muted">
              {sync.isPending
                ? "Sincronizando…"
                : status.syncedAt
                  ? `Sincronizado ${timeAgo(status.syncedAt)}`
                  : "Aún no has sincronizado"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => sync.mutate()}
            disabled={sync.isPending}
            className="flex items-center gap-2 rounded-md bg-text px-4 py-2.5 font-bold text-ink hover:bg-white disabled:opacity-60"
          >
            <SyncIcon className={`size-4 ${sync.isPending ? "animate-spin" : ""}`} />
            {sync.isPending ? "Sincronizando…" : "Sincronizar"}
          </button>
          <button
            onClick={() => confirm("¿Desconectar Steam? Se borran los datos traídos de Steam (tu lista no se toca).") && disconnect.mutate()}
            disabled={disconnect.isPending}
            className="rounded-md px-3 py-2.5 text-muted hover:bg-panel hover:text-text"
          >
            Desconectar
          </button>
        </div>
      </section>

      {sync.isPending && (
        <Banner tone="ok">
          Leyendo tus juegos y logros. La primera vez puede tardar un minuto si tienes muchos juegos.
        </Banner>
      )}
      {sync.isError && <Banner tone="error">{sync.error.message}</Banner>}
      {sync.isSuccess && (
        <Banner tone="ok">
          {sync.data.games} juegos, {sync.data.matched} reconocidos.{" "}
          {sync.data.achievementsChecked > 0 && <>Logros leídos de {sync.data.achievementsChecked}. </>}
          {sync.data.entriesUpdated > 0 && (
            <>Horas o fechas actualizadas en {sync.data.entriesUpdated} juegos de tu lista. </>
          )}
          {sync.data.achievementsFailed > 0 && <>No se pudieron leer los logros de {sync.data.achievementsFailed}.</>}
        </Banner>
      )}
      {disconnect.isError && <Banner tone="error">{disconnect.error.message}</Banner>}

      {list.length > 0 && (
        <dl className="mb-8 grid max-w-2xl grid-cols-3 gap-4">
          <Stat label="Juegos jugados" value={`${totals.played}`} sub={`de ${list.length}`} />
          <Stat label="Horas" value={Math.round(totals.hours).toLocaleString("es-CO")} />
          <Stat label="Logros" value={totals.unlocked.toLocaleString("es-CO")} />
        </dl>
      )}

      {games.isError && <p className="text-st-dropped">{games.error.message}</p>}
      {games.isSuccess && list.length === 0 && !sync.isPending && (
        <p className="rounded-lg border-2 border-dashed border-line px-6 py-12 text-center text-muted">
          Aún no hay juegos. Dale a <span className="text-text">Sincronizar</span>.
        </p>
      )}
      {list.length > 0 && <GameTable games={list} />}
    </>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg bg-panel px-4 py-3">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="font-display text-2xl font-extrabold tabular-nums">
        {value} {sub && <span className="text-base font-normal text-muted">{sub}</span>}
      </dd>
    </div>
  );
}

/* ---------- Tabla de juegos + importar ---------- */

const canImport = (g: SteamGame) => g.igdbId !== null && !g.libraryEntry;

/** Estado sugerido según lo que dice Steam */
function guessStatus(g: SteamGame): GameStatus {
  if (g.playtime2Weeks > 0) return "PLAYING";
  if (g.achievementsTotal > 0 && g.achievementsUnlocked === g.achievementsTotal) return "COMPLETED";
  if (g.playtimeMinutes === 0) return "PLAN_TO_PLAY";
  return "ON_HOLD";
}

function GameTable({ games }: { games: SteamGame[] }) {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("add");
  const [q, setQ] = useState("");
  const [hideUnplayed, setHideUnplayed] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [importAs, setImportAs] = useState<ImportStatus>("AUTO");
  const [editing, setEditing] = useState<EditorTarget | null>(null);

  const counts = {
    add: games.filter(canImport).length,
    list: games.filter((g) => g.libraryEntry).length,
    all: games.length,
  };

  const visible = games.filter((g) => {
    if (tab === "add" && !canImport(g)) return false;
    if (tab === "list" && !g.libraryEntry) return false;
    if (hideUnplayed && tab !== "list" && g.playtimeMinutes === 0) return false;
    return !q || g.name.toLowerCase().includes(q.toLowerCase());
  });
  const selectable = visible.filter(canImport);
  const allSelected = selectable.length > 0 && selectable.every((g) => selected.has(g.appId));

  const importMut = useMutation({
    mutationFn: () =>
      api.steam.import(
        games
          .filter((g) => selected.has(g.appId))
          .map((g) => ({ appId: g.appId, status: importAs === "AUTO" ? guessStatus(g) : importAs })),
      ),
    onSuccess: () => {
      setSelected(new Set());
      refreshAll(qc);
    },
  });

  function toggle(appId: number) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(appId)) next.delete(appId);
      else next.add(appId);
      return next;
    });
  }

  function toggleAll() {
    setSelected((s) => {
      const next = new Set(s);
      for (const g of selectable) {
        if (allSelected) next.delete(g.appId);
        else next.add(g.appId);
      }
      return next;
    });
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:px-0" role="tablist">
          <TabButton active={tab === "add"} onClick={() => setTab("add")}>
            Para añadir <span className="tabular-nums opacity-60">{counts.add}</span>
          </TabButton>
          <TabButton active={tab === "list"} onClick={() => setTab("list")}>
            En tu lista <span className="tabular-nums opacity-60">{counts.list}</span>
          </TabButton>
          <TabButton active={tab === "all"} onClick={() => setTab("all")}>
            Todos <span className="tabular-nums opacity-60">{counts.all}</span>
          </TabButton>
        </div>
        <div className="flex items-center gap-4">
          {tab !== "list" && (
            <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={hideUnplayed}
                onChange={(e) => setHideUnplayed(e.target.checked)}
                className="size-4 accent-st-playing"
              />
              Ocultar sin jugar
            </label>
          )}
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filtrar por nombre"
            aria-label="Filtrar por nombre"
            className="min-w-0 flex-1 rounded-md border border-line bg-panel px-3 py-2 placeholder:text-muted/70 focus:border-muted focus:outline-none md:w-64"
          />
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="py-12 text-center text-muted">
          {tab === "add" && !q ? "Ya tienes en tu lista todo lo que se puede añadir." : "No hay juegos con estos filtros."}
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-line">
          {selectable.length > 0 && (
            <label className="flex cursor-pointer items-center gap-3 border-b border-line bg-panel px-4 py-2.5 text-sm text-muted">
              <input type="checkbox" checked={allSelected} onChange={toggleAll} className="size-4 accent-st-playing" />
              Seleccionar los {selectable.length} que se pueden añadir
            </label>
          )}
          <ul className="divide-y divide-line">
            {visible.map((g) => (
              <GameRow
                key={g.appId}
                game={g}
                checked={selected.has(g.appId)}
                onToggle={() => toggle(g.appId)}
                onOpen={() => g.libraryEntry && setEditing({ kind: "entry", id: g.libraryEntry.id })}
              />
            ))}
          </ul>
        </div>
      )}

      {/* Barra fija para importar lo seleccionado */}
      {selected.size > 0 && (
        <div className="sticky bottom-4 z-30 mt-6 flex flex-wrap items-center gap-3 rounded-lg border border-line bg-panel-2 px-4 py-3 shadow-2xl">
          <span className="font-bold">
            {selected.size} {selected.size === 1 ? "juego" : "juegos"}
          </span>
          <label className="flex items-center gap-2 text-sm text-muted">
            como
            <select
              value={importAs}
              onChange={(e) => setImportAs(e.target.value as ImportStatus)}
              className="rounded-md border border-line bg-ink px-2 py-1.5 text-text"
            >
              <option value="AUTO">Automático</option>
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          {importAs === "AUTO" && (
            <span className="text-xs text-muted">
              Jugado hace poco: Jugando. Todos los logros: Completado. Sin jugar: Pendiente. El resto: En pausa.
            </span>
          )}
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setSelected(new Set())} className="rounded-md px-3 py-2 text-muted hover:text-text">
              Cancelar
            </button>
            <button
              onClick={() => importMut.mutate()}
              disabled={importMut.isPending}
              className="rounded-md bg-text px-4 py-2 font-bold text-ink hover:bg-white disabled:opacity-60"
            >
              {importMut.isPending ? "Añadiendo…" : "Añadir a mi lista"}
            </button>
          </div>
          {importMut.isError && <p className="w-full text-sm text-st-dropped">{importMut.error.message}</p>}
        </div>
      )}
      {importMut.isSuccess && selected.size === 0 && (
        <p role="status" className="mt-4 text-st-completed">
          {importMut.data.added} {importMut.data.added === 1 ? "juego añadido" : "juegos añadidos"} a tu lista.
        </p>
      )}

      {editing && <EntryEditor target={editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function GameRow({
  game: g,
  checked,
  onToggle,
  onOpen,
}: {
  game: SteamGame;
  checked: boolean;
  onToggle: () => void;
  onOpen: () => void;
}) {
  const importable = canImport(g);
  const pct = g.achievementsTotal ? g.achievementsUnlocked / g.achievementsTotal : 0;

  const body = (
    <>
      <Cover src={g.igdbCoverUrl ?? g.capsuleUrl} name={g.name} className="aspect-[3/4] w-10 shrink-0 rounded-sm text-sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">{g.name}</p>
        <p className="text-sm text-muted">
          {g.playtimeMinutes > 0 ? `${formatHours(g.hours)} h` : "Sin jugar"}
          {g.playtime2Weeks > 0 && (
            <span className="text-st-playing"> · {formatHours(g.playtime2Weeks / 60)} h estas 2 semanas</span>
          )}
          {g.igdbId === null && <span className="text-muted/70"> · No está en IGDB</span>}
        </p>
      </div>
      <div className="hidden w-40 shrink-0 sm:block">
        {g.achievementsTotal > 0 ? (
          <>
            <p className="mb-1 text-right text-sm tabular-nums">
              <span className={pct === 1 ? "font-bold text-score" : ""}>{g.achievementsUnlocked}</span>
              <span className="text-muted">/{g.achievementsTotal} logros</span>
            </p>
            <div className="h-1.5 overflow-hidden rounded-full bg-panel-2">
              <div className={`h-full rounded-full ${pct === 1 ? "bg-score" : "bg-st-playing"}`} style={{ width: `${pct * 100}%` }} />
            </div>
          </>
        ) : null}
      </div>
      <div className="hidden w-28 shrink-0 text-right md:block">
        {g.libraryEntry && <StatusLabel status={g.libraryEntry.status} />}
      </div>
    </>
  );

  if (importable) {
    return (
      <li>
        <label className={`flex cursor-pointer items-center gap-4 px-4 py-2.5 transition hover:bg-panel ${checked ? "bg-panel" : ""}`}>
          <input type="checkbox" checked={checked} onChange={onToggle} className="size-4 shrink-0 accent-st-playing" />
          {body}
        </label>
      </li>
    );
  }
  if (g.libraryEntry) {
    return (
      <li>
        <button onClick={onOpen} className="flex w-full items-center gap-4 px-4 py-2.5 text-left transition hover:bg-panel">
          <span className="size-4 shrink-0" aria-hidden />
          {body}
        </button>
      </li>
    );
  }
  return (
    <li className="flex items-center gap-4 px-4 py-2.5 opacity-70">
      <span className="size-4 shrink-0" aria-hidden />
      {body}
    </li>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition ${
        active ? "border-text bg-text font-bold text-ink" : "border-line text-text hover:border-muted"
      }`}
    >
      {children}
    </button>
  );
}

/* ---------- Utilidades ---------- */

const formatHours = (h: number) => (h < 10 ? h.toLocaleString("es-CO", { maximumFractionDigits: 1 }) : Math.round(h).toLocaleString("es-CO"));

function timeAgo(iso: string) {
  const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto" });
  const secs = (new Date(iso).getTime() - Date.now()) / 1000;
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, size] of steps) if (Math.abs(secs) >= size) return rtf.format(Math.round(secs / size), unit);
  return "ahora mismo";
}

function SyncIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden className={className}>
      <path d="M16 10a6 6 0 0 1-10.4 4.1M4 10a6 6 0 0 1 10.4-4.1" />
      <path d="M14.5 2.5v3.6h-3.6M5.5 17.5v-3.6h3.6" />
    </svg>
  );
}
