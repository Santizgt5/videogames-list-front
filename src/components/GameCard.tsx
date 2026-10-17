import type { LibraryEntry } from "../api/types";
import { statusInfo, year } from "../lib/status";
import { Cover } from "./Cover";

export function GameCard({ entry, onOpen }: { entry: LibraryEntry; onOpen: () => void }) {
  const st = statusInfo(entry.status);
  const meta = [entry.platform, year(entry.game.released)].filter(Boolean).join(", ");

  return (
    <button onClick={onOpen} className="group text-left" aria-label={`Editar ${entry.game.name}`}>
      <div className="relative overflow-hidden rounded-md bg-panel shadow-[0_8px_20px_-10px_rgb(0_0_0/0.6)] ring-1 ring-line transition group-hover:-translate-y-1 group-hover:ring-muted">
        <Cover src={entry.game.coverUrl} name={entry.game.name} className="aspect-[3/4] w-full" />

        {entry.score !== null && (
          <div className="absolute top-2 right-2 grid size-10 place-items-center rounded-full bg-ink/90 font-display text-lg font-extrabold text-score ring-2 ring-score/60">
            {entry.score}
          </div>
        )}
        {entry.favorite && (
          <div className="absolute top-2 left-2 text-xl drop-shadow" title="Favorito">
            ♥
          </div>
        )}

        {/* La franja de color indica el estado, como el lomo de una caja */}
        <div className="absolute inset-x-0 bottom-0 h-1.5" style={{ background: st.color }} title={st.label} />
      </div>

      <h3 className="mt-2 line-clamp-2 font-display leading-tight font-bold">{entry.game.name}</h3>
      <p className="mt-0.5 text-sm text-muted">
        {st.label}
        {meta && <span className="text-muted/70">, {meta}</span>}
        {entry.hoursPlayed ? <span className="whitespace-nowrap text-muted/70">, {entry.hoursPlayed} h</span> : null}
      </p>
    </button>
  );
}
