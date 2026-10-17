import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import type { GameSummary } from "../api/types";
import { year } from "../lib/status";
import { Cover } from "../components/Cover";
import { genreName } from "../lib/genres";
import { StatusLabel } from "../components/StatusDot";
import { EntryEditor, type EditorTarget } from "../components/EntryEditor";

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const [text, setText] = useState(q);
  const [editing, setEditing] = useState<EditorTarget | null>(null);

  // Espera a que dejes de escribir antes de buscar
  useEffect(() => {
    const t = setTimeout(() => {
      const value = text.trim();
      if (value !== q) setParams(value ? { q: value } : {}, { replace: true });
    }, 400);
    return () => clearTimeout(t);
  }, [text, q, setParams]);

  const search = useInfiniteQuery({
    queryKey: ["search", q],
    queryFn: ({ pageParam }) => api.search(q, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last, pages) => (last.hasMore ? pages.length + 1 : undefined),
    enabled: q.length > 0,
    staleTime: 5 * 60_000,
  });

  const results = search.data?.pages.flatMap((p) => p.results) ?? [];

  function open(g: GameSummary) {
    setEditing(g.libraryEntry ? { kind: "entry", id: g.libraryEntry.id } : { kind: "new", game: g });
  }

  return (
    <>
      <form onSubmit={(e) => e.preventDefault()} className="mb-10">
        <label htmlFor="search" className="mb-3 block font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
          ¿Qué has jugado?
        </label>
        <input
          id="search"
          type="search"
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Hollow Knight, Zelda, Hades…"
          className="w-full rounded-lg border-2 border-line bg-panel px-5 py-4 text-xl placeholder:text-muted/60 focus:border-score focus:outline-none"
        />
      </form>

      {search.isError && (
        <p className="rounded bg-st-dropped/15 px-4 py-3 text-st-dropped">{search.error.message}</p>
      )}
      {search.isLoading && <p className="text-muted">Buscando…</p>}
      {search.isSuccess && results.length === 0 && (
        <p className="text-muted">No hay resultados para “{q}”. Prueba con otro nombre.</p>
      )}

      <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
        {results.map((g) => (
          <button key={g.id} onClick={() => open(g)} className="group text-left">
            <div className="relative overflow-hidden rounded-md ring-1 ring-line transition group-hover:ring-muted">
              <Cover src={g.coverUrl} name={g.name} className="aspect-[3/4] w-full" />
            </div>
            <h3 className="mt-2 line-clamp-2 font-display leading-tight font-bold">{g.name}</h3>
            <p className="text-sm text-muted">{[year(g.released), g.genres[0] && genreName(g.genres[0])].filter(Boolean).join(", ")}</p>
            <div className="mt-2">
              {g.libraryEntry ? (
                <StatusLabel status={g.libraryEntry.status} />
              ) : (
                <span className="text-sm font-bold text-score group-hover:underline">+ Añadir</span>
              )}
            </div>
          </button>
        ))}
      </div>

      {search.hasNextPage && (
        <div className="mt-10 text-center">
          <button
            onClick={() => search.fetchNextPage()}
            disabled={search.isFetchingNextPage}
            className="rounded-md border border-line px-5 py-2.5 hover:border-muted disabled:opacity-60"
          >
            {search.isFetchingNextPage ? "Cargando…" : "Ver más resultados"}
          </button>
        </div>
      )}

      {editing && <EntryEditor target={editing} onClose={() => setEditing(null)} />}
    </>
  );
}
