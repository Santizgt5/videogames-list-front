import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import type { SteamAchievement } from "../api/types";

/** Logros de Steam de un juego (no muestra nada si no está en tu Steam o no tiene logros) */
export function SteamAchievements({ igdbId }: { igdbId: number }) {
  const [open, setOpen] = useState(false);
  const query = useQuery({
    queryKey: ["steam-achievements", igdbId],
    queryFn: () => api.steam.achievements(igdbId),
  });

  const data = query.data;
  if (!data || data.achievementsTotal === 0) return null;

  const pct = data.achievementsUnlocked / data.achievementsTotal;
  const done = pct === 1;
  // Primero los conseguidos (el más reciente arriba), luego los que faltan (el más fácil arriba)
  const sorted = [...data.achievements].sort((a, b) => {
    if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
    if (a.unlocked) return (b.unlockedAt ?? "").localeCompare(a.unlockedAt ?? "");
    return (b.percent ?? -1) - (a.percent ?? -1);
  });

  return (
    <section className="rounded-lg bg-ink/60 ring-1 ring-line">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full px-4 py-3 text-left"
      >
        <span className="flex items-baseline justify-between">
          <span className="font-bold">Logros de Steam</span>
          <span className="text-sm tabular-nums">
            <span className={done ? "font-bold text-score" : ""}>{data.achievementsUnlocked}</span>
            <span className="text-muted">/{data.achievementsTotal}</span>
            <span className="ml-2 text-muted">{open ? "▴" : "▾"}</span>
          </span>
        </span>
        <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-panel-2">
          <span
            className={`block h-full rounded-full ${done ? "bg-score" : "bg-st-playing"}`}
            style={{ width: `${pct * 100}%` }}
          />
        </span>
        <span className="mt-1.5 block text-xs text-muted">
          {data.hours} h en Steam{done && " · ¡Todos los logros!"}
        </span>
      </button>

      {open && (
        <ul className="max-h-96 divide-y divide-line/60 overflow-y-auto border-t border-line">
          {sorted.map((a) => (
            <AchievementRow key={a.apiName} a={a} />
          ))}
        </ul>
      )}
    </section>
  );
}

function AchievementRow({ a }: { a: SteamAchievement }) {
  const secret = a.hidden && !a.unlocked;
  const rare = a.percent !== null && a.percent < 10;
  return (
    <li className={`flex items-center gap-3 px-4 py-2.5 ${a.unlocked ? "" : "opacity-60"}`}>
      <img src={a.unlocked ? a.icon : a.iconGray} alt="" loading="lazy" className="size-10 shrink-0 rounded" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">{secret ? "Logro oculto" : a.name}</p>
        <p className="line-clamp-2 text-xs text-muted">
          {secret ? "Se revela al conseguirlo" : a.description}
        </p>
      </div>
      <div className="shrink-0 text-right text-xs">
        {a.percent !== null && (
          <p className={rare ? "font-bold text-score" : "text-muted"} title="Jugadores que lo tienen">
            {a.percent.toLocaleString("es-CO", { maximumFractionDigits: 1 })} %
          </p>
        )}
        {a.unlockedAt && <p className="text-muted">{new Date(a.unlockedAt).toLocaleDateString("es")}</p>}
      </div>
    </li>
  );
}
