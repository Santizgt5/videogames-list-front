import type { GameStatus } from "../api/types";
import { statusInfo } from "../lib/status";

export function StatusLabel({ status }: { status: GameStatus }) {
  const s = statusInfo(status);
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <span className="size-2.5 rounded-full" style={{ background: s.color }} aria-hidden />
      {s.label}
    </span>
  );
}
