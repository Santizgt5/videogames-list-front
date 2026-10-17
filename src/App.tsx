import { NavLink, Route, Routes } from "react-router";
import { LibraryPage } from "./pages/LibraryPage";
import { SearchPage } from "./pages/SearchPage";

const navCls = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-1.5 transition ${isActive ? "bg-panel-2 font-bold text-text" : "text-muted hover:text-text"}`;

export default function App() {
  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 sm:px-6">
      <header className="flex items-center justify-between py-5">
        <NavLink to="/" className="flex items-center gap-2.5 font-display text-xl font-extrabold">
          <img src="/favicon.svg" alt="" className="size-7" />
          Backlog
        </NavLink>
        <nav className="flex gap-1">
          <NavLink to="/" end className={navCls}>
            Mi lista
          </NavLink>
          <NavLink to="/buscar" className={navCls}>
            Buscar
          </NavLink>
        </nav>
      </header>

      <main className="pt-6 pb-16">
        <Routes>
          <Route path="/" element={<LibraryPage />} />
          <Route path="/buscar" element={<SearchPage />} />
        </Routes>
      </main>

      <footer className="border-t border-line py-6 text-sm text-muted">
        Datos e imágenes de{" "}
        <a href="https://rawg.io" target="_blank" rel="noreferrer" className="underline hover:text-text">
          RAWG
        </a>
        .
      </footer>
    </div>
  );
}
