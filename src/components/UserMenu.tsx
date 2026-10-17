import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import type { User } from "../api/types";
import { SteamLogo } from "./SteamLogo";

export function UserMenu({ user, onLogout, loggingOut }: { user: User; onLogout: () => void; loggingOut: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Se cierra al hacer clic fuera o con Escape
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`flex items-center gap-2 rounded-md px-3 py-1.5 font-bold transition hover:bg-panel-2 ${open ? "bg-panel-2" : ""}`}
      >
        <span className="grid size-6 place-items-center rounded-full bg-score font-display text-xs text-ink uppercase">
          {user.username[0]}
        </span>
        @{user.username}
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
          className={`size-4 text-muted transition ${open ? "rotate-180" : ""}`}
        >
          <path d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4Z" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-60 overflow-hidden rounded-lg border border-line bg-panel shadow-2xl animate-[fade-in_120ms_ease-out]"
        >
          <div className="border-b border-line px-4 py-3">
            <p className="font-bold">@{user.username}</p>
            <p className="truncate text-sm text-muted">{user.email}</p>
          </div>
          <Link
            to="/steam"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 transition hover:bg-panel-2"
          >
            <SteamLogo className="size-4 text-muted" />
            Conexión con Steam
          </Link>
          <button
            role="menuitem"
            onClick={onLogout}
            disabled={loggingOut}
            className="w-full border-t border-line px-4 py-2.5 text-left text-st-dropped transition hover:bg-panel-2 disabled:opacity-60"
          >
            {loggingOut ? "Cerrando sesión…" : "Cerrar sesión"}
          </button>
        </div>
      )}
    </div>
  );
}
