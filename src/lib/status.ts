import type { GameStatus } from "../api/types";

export const STATUSES: { value: GameStatus; label: string; color: string }[] = [
  { value: "PLAYING", label: "Jugando", color: "var(--color-st-playing)" },
  { value: "COMPLETED", label: "Completado", color: "var(--color-st-completed)" },
  { value: "PLAN_TO_PLAY", label: "Pendiente", color: "var(--color-st-plan)" },
  { value: "ON_HOLD", label: "En pausa", color: "var(--color-st-hold)" },
  { value: "DROPPED", label: "Abandonado", color: "var(--color-st-dropped)" },
];

export const statusInfo = (s: GameStatus) => STATUSES.find((x) => x.value === s)!;

export const year = (date: string | null) => (date ? date.slice(0, 4) : null);
