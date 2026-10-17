import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import type { EntryInput, Game, GameStatus, LibraryEntry } from "../api/types";
import { STATUSES, year } from "../lib/status";
import { igdbImage } from "../lib/images";
import { genreName } from "../lib/genres";
import { Cover } from "./Cover";
import { SteamAchievements } from "./SteamAchievements";

export type EditorTarget = { kind: "entry"; id: number } | { kind: "new"; game: Game };

export function EntryEditor({ target, onClose }: { target: EditorTarget; onClose: () => void }) {
  const entryQuery = useQuery({
    queryKey: ["entry", target.kind === "entry" ? target.id : null],
    queryFn: () => api.entry((target as { id: number }).id),
    enabled: target.kind === "entry",
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const entry = entryQuery.data;
  const game = target.kind === "new" ? target.game : entry?.game;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Editar juego">
      <div className="absolute inset-0 bg-black/60 animate-[fade-in_150ms_ease-out]" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-md flex-col overflow-y-auto bg-panel shadow-2xl animate-[drawer-in_220ms_cubic-bezier(.2,.8,.2,1)]">
        {entryQuery.isError && <p className="p-6 text-st-dropped">{entryQuery.error.message}</p>}
        {game ? (
          <EditorForm key={entry?.id ?? `new-${game.id}`} game={game} entry={entry} onClose={onClose} />
        ) : (
          !entryQuery.isError && <p className="p-6 text-muted">Cargando…</p>
        )}
      </aside>
    </div>
  );
}

const today = () => new Date().toISOString().slice(0, 10);
const dateOnly = (d: string | null) => (d ? d.slice(0, 10) : "");

function EditorForm({ game, entry, onClose }: { game: Game; entry?: LibraryEntry; onClose: () => void }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState<GameStatus>(entry?.status ?? "PLAN_TO_PLAY");
  const [score, setScore] = useState<number | null>(entry?.score ?? null);
  const [hours, setHours] = useState(entry?.hoursPlayed?.toString() ?? "");
  const [platform, setPlatform] = useState(entry?.platform ?? "");
  const [startedAt, setStartedAt] = useState(dateOnly(entry?.startedAt ?? null));
  const [finishedAt, setFinishedAt] = useState(dateOnly(entry?.finishedAt ?? null));
  const [notes, setNotes] = useState(entry?.notes ?? "");
  const [favorite, setFavorite] = useState(entry?.favorite ?? false);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["library"] });
    qc.invalidateQueries({ queryKey: ["stats"] });
    qc.invalidateQueries({ queryKey: ["stats-page"] });
    qc.invalidateQueries({ queryKey: ["search"] });
    qc.invalidateQueries({ queryKey: ["entry"] });
  };

  const save = useMutation({
    mutationFn: (data: EntryInput) => (entry ? api.update(entry.id, data) : api.add(game.id, data)),
    onSuccess: () => {
      refresh();
      onClose();
    },
  });

  const remove = useMutation({
    mutationFn: () => api.remove(entry!.id),
    onSuccess: () => {
      refresh();
      onClose();
    },
  });

  function pickStatus(s: GameStatus) {
    setStatus(s);
    if (s === "COMPLETED" && !finishedAt) setFinishedAt(today());
    if (s === "PLAYING" && !startedAt) setStartedAt(today());
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const h = hours.trim() === "" ? null : Number(hours.replace(",", "."));
    save.mutate({
      status,
      score,
      hoursPlayed: h !== null && Number.isFinite(h) ? h : null,
      platform: platform.trim() || null,
      startedAt: startedAt || null,
      finishedAt: finishedAt || null,
      notes: notes.trim() || null,
      favorite,
    });
  }

  const background = igdbImage(game.backgroundUrl ?? game.coverUrl, "screenshot_big");
  const error = save.error ?? remove.error;

  return (
    <form onSubmit={submit} className="flex flex-1 flex-col">
      <header className="relative">
        {background ? (
          <img src={background} alt="" className="h-40 w-full object-cover" />
        ) : (
          <div className="h-24 bg-panel-2" />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-panel to-transparent to-70%" />
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 grid size-9 place-items-center rounded-full bg-ink/80 text-xl leading-none hover:bg-ink"
          aria-label="Cerrar"
        >
          ×
        </button>

        <div className="relative -mt-14 flex items-end gap-4 px-6">
          <Cover
            src={game.coverUrl}
            name={game.name}
            className="aspect-[3/4] w-24 shrink-0 rounded-md shadow-lg ring-1 ring-line"
          />
          <div className="min-w-0 pb-1">
            <h2 className="font-display text-2xl leading-tight font-extrabold text-balance">{game.name}</h2>
            <p className="mt-1 text-sm text-muted">
              {[year(game.released), game.genres.slice(0, 2).map(genreName).join(", ")].filter(Boolean).join(". ")}
            </p>
            {game.criticScore !== null && (
              <p className="mt-1 text-sm text-muted">
                Crítica: <span className="font-bold text-text">{game.criticScore}</span>/100
              </p>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 px-6 pt-6 pb-6">
        <SteamAchievements igdbId={game.id} />

        <fieldset>
          <legend className="mb-2 font-bold">Estado</legend>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => {
              const active = s.value === status;
              return (
                <button
                  type="button"
                  key={s.value}
                  onClick={() => pickStatus(s.value)}
                  aria-pressed={active}
                  className="rounded-full border-2 px-3 py-1.5 text-sm font-bold transition"
                  style={
                    active
                      ? { background: s.color, borderColor: s.color, color: "var(--color-ink)" }
                      : { borderColor: "var(--color-line)" }
                  }
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 flex w-full items-baseline justify-between font-bold">
            Tu nota
            {score !== null && (
              <button type="button" onClick={() => setScore(null)} className="text-sm font-normal text-muted underline">
                Quitar nota
              </button>
            )}
          </legend>
          <div className="grid grid-cols-10 gap-1">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
              const filled = score !== null && n <= score;
              return (
                <button
                  type="button"
                  key={n}
                  onClick={() => setScore(n)}
                  aria-pressed={score === n}
                  aria-label={`Nota ${n}`}
                  className={`h-10 rounded font-display font-bold transition ${
                    filled ? "bg-score text-ink" : "bg-panel-2 text-muted hover:text-text"
                  }`}
                >
                  {n}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Horas jugadas">
            <input
              inputMode="decimal"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="0"
              className={inputCls}
            />
          </Field>
          <Field label="Plataforma">
            <input
              list="platforms"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              placeholder="PC, PS5…"
              className={inputCls}
            />
            <datalist id="platforms">
              {game.platforms.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </Field>
          <Field label="Empezado">
            <input type="date" value={startedAt} onChange={(e) => setStartedAt(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Terminado">
            <input type="date" value={finishedAt} onChange={(e) => setFinishedAt(e.target.value)} className={inputCls} />
          </Field>
        </div>

        <Field label="Notas">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Qué te pareció, en qué parte vas…"
            className={`${inputCls} resize-y`}
          />
        </Field>

        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={favorite}
            onChange={(e) => setFavorite(e.target.checked)}
            className="size-5 accent-st-hold"
          />
          Marcar como favorito
        </label>

        {error && <p className="rounded bg-st-dropped/15 px-3 py-2 text-sm text-st-dropped">{error.message}</p>}

        <div className="mt-auto flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={save.isPending}
            className="flex-1 rounded-md bg-text py-3 font-bold text-ink hover:bg-white disabled:opacity-60"
          >
            {save.isPending ? "Guardando…" : entry ? "Guardar cambios" : "Añadir a mi lista"}
          </button>
          {entry && (
            <button
              type="button"
              disabled={remove.isPending}
              onClick={() => confirm(`¿Quitar ${game.name} de tu lista?`) && remove.mutate()}
              className="rounded-md px-4 py-3 text-st-dropped hover:bg-st-dropped/10"
            >
              Quitar
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

const inputCls =
  "w-full rounded-md border border-line bg-ink px-3 py-2 text-text placeholder:text-muted/60 focus:border-muted focus:outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-muted">{label}</span>
      {children}
    </label>
  );
}
