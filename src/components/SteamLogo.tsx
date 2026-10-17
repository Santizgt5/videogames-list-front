export function SteamLogo({ className = "" }: { className?: string }) {
  // Logo simplificado de Steam (rueda + biela)
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M12 2a10 10 0 0 0-9.96 9.2l5.36 2.22a2.83 2.83 0 0 1 1.6-.5h.16l2.39-3.46v-.05a3.78 3.78 0 1 1 3.78 3.78h-.09l-3.4 2.43v.13a2.84 2.84 0 0 1-5.62.57L2.4 14.8A10 10 0 1 0 12 2Zm-4.29 15.17-1.23-.51a2.13 2.13 0 1 0 1.17-2.9l1.27.53a1.57 1.57 0 1 1-1.2 2.89Zm9.56-7.76a2.52 2.52 0 1 0-2.52 2.52 2.52 2.52 0 0 0 2.52-2.52Zm-4.4 0a1.89 1.89 0 1 1 1.88 1.9 1.89 1.89 0 0 1-1.88-1.9Z" />
    </svg>
  );
}
