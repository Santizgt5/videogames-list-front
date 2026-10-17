import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import type { GameStatus, SortKey, Stats } from "../api/types";
import { STATUSES } from "../lib/status";
import { GameCard } from "../components/GameCard";
import { EntryEditor, type EditorTarget } from "../components/EntryEditor";

const SORTS: { value: SortKey; label: string }[] = [
  { value: "updated", label: "Última actividad" },
  { value: "added", label: "Añadido recientemente" },
  { value: "score", label: "Mejor nota" },
  { value: "hours", label: "Más horas" },
  { value: "name", label: "Nombre (A-Z)" },
  { value: "released", label: "Lanzamiento" },
];

export function LibraryPage() {
  const [params, setParams] = useSearchParams();
  const status = (params.get("status") as GameStatus | null) ?? undefined;
  const favorite = params.get("fav") === "1" || undefined;
  const sort = (params.get("sort") as SortKey | null) ?? "updated";
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<EditorTarget | null>(null);

  const stats = useQuery({ queryKey: ["stats"], queryFn: api.stats });
  const library = useQuery({
    queryKey: ["library", { status, favorite, sort, q }],
    queryFn: () => api.library({ status, favorite, sort, q }),
    placeholderData: (prev) => prev,
  });

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params);
    if (value === null) next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  }

  const s = stats.data;
  const entries = library.data ?? [];
  const isEmptyLibrary = s?.total === 0;

  return (
    <>
      <section className="mb-8">
        <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
          {s ? `${s.total} ${s.total === 1 ? "juego" : "juegos"}` : "Mi lista"}
        </h1>
        {s && s.total > 0 && (
          <>
            <p className="mt-2 text-lg text-muted">
              {s.byStatus.COMPLETED ?? 0} terminados
              {s.averageScore !== null && <>, nota media {s.averageScore}</>}
              {s.totalHours > 0 && <>, {Math.round(s.totalHours)} horas jugadas</>}.
            </p>
            <ShelfBar stats={s} />
          </>
        )}
      </section>

      {isEmptyLibrary ? (
        <div className="rounded-lg border-2 border-dashed border-line px-6 py-16 text-center">
          <p className="font-display text-2xl font-bold">Tu lista está vacía</p>
          <p className="mt-2 text-muted">Busca un juego que hayas jugado y añádelo con su nota.</p>
          <Link to="/buscar" className="mt-6 inline-block rounded-md bg-text px-5 py-2.5 font-bold text-ink">
            Buscar juegos
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-6 flex flex-col gap-4">
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0" role="tablist">
              <FilterChip active={!status && !favorite} onClick={() => setParams({ sort }, { replace: true })}>
                Todos <Count n={s?.total} />
              </FilterChip>
              {STATUSES.map((st) => (
                <FilterChip
                  key={st.value}
                  active={status === st.value}
                  color={st.color}
                  onClick={() => setParam("status", status === st.value ? null : st.value)}
                >
                  {st.label} <Count n={s?.byStatus[st.value] ?? 0} />
                </FilterChip>
              ))}
              <FilterChip active={!!favorite} onClick={() => setParam("fav", favorite ? null : "1")}>
                ♥ Favoritos <Count n={s?.favorites} />
              </FilterChip>
            </div>

            <div className="flex gap-2 md:max-w-md">
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Filtrar por nombre"
                aria-label="Filtrar por nombre"
                className="min-w-0 flex-1 rounded-md border border-line bg-panel px-3 py-2 placeholder:text-muted/70 focus:border-muted focus:outline-none"
              />
              <select
                value={sort}
                onChange={(e) => setParam("sort", e.target.value)}
                aria-label="Ordenar"
                className="rounded-md border border-line bg-panel px-3 py-2"
              >
                {SORTS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {library.isError && <p className="text-st-dropped">{library.error.message}</p>}
          {library.isSuccess && entries.length === 0 && (
            <p className="py-12 text-center text-muted">No hay juegos con estos filtros.</p>
          )}

          <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
            {entries.map((e) => (
              <GameCard key={e.id} entry={e} onOpen={() => setEditing({ kind: "entry", id: e.id })} />
            ))}
          </div>
        </>
      )}

      {editing && <EntryEditor target={editing} onClose={() => setEditing(null)} />}
    </>
  );
}

/** Barra con la proporción de cada estado, como lomos en una estantería */
function ShelfBar({ stats }: { stats: Stats }) {
  return (
    <div className="mt-4 flex h-2.5 max-w-xl overflow-hidden rounded-full bg-panel" aria-hidden>
      {STATUSES.map((st) => {
        const n = stats.byStatus[st.value] ?? 0;
        if (!n) return null;
        return (
          <div
            key={st.value}
            style={{ flexGrow: n, background: st.color }}
            title={`${st.label}: ${n}`}
            className="border-r-2 border-ink last:border-r-0"
          />
        );
      })}
    </div>
  );
}

function FilterChip({
  active,
  color,
  onClick,
  children,
}: {
  active: boolean;
  color?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition ${
        active ? "border-text bg-text font-bold text-ink" : "border-line text-text hover:border-muted"
      }`}
    >
      {color && <span className="size-2.5 rounded-full" style={{ background: color }} aria-hidden />}
      {children}
    </button>
  );
}

function Count({ n }: { n?: number }) {
  return n === undefined ? null : <span className="tabular-nums opacity-60">{n}</span>;
}
