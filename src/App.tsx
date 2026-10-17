import { NavLink, Route, Routes } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api/client";
import { switchUser } from "./lib/session";
import { AuthPage } from "./pages/AuthPage";
import { LibraryPage } from "./pages/LibraryPage";
import { SearchPage } from "./pages/SearchPage";
import { SteamPage } from "./pages/SteamPage";
import { StatsPage } from "./pages/StatsPage";
import { UserMenu } from "./components/UserMenu";

const navCls = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-1.5 whitespace-nowrap transition ${isActive ? "bg-panel-2 font-bold text-text" : "text-muted hover:text-text"}`;

export default function App() {
  const qc = useQueryClient();
  const me = useQuery({ queryKey: ["me"], queryFn: api.me, staleTime: Infinity });

  const logout = useMutation({
    mutationFn: api.logout,
    onSettled: () => switchUser(qc, null),
  });

  if (me.isPending) return <p className="p-10 text-center text-muted">Cargando…</p>;
  if (me.isError) return <p className="p-10 text-center text-st-dropped">{me.error.message}</p>;
  if (!me.data) return <AuthPage />;

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-3 py-5">
        <NavLink to="/" className="order-1 flex items-center gap-2.5 font-display text-xl font-extrabold">
          <img src="/favicon.svg" alt="" className="size-7" />
          Backlog
        </NavLink>
        {/* En el celular la navegación baja a su propia fila */}
        <nav className="order-3 flex w-full gap-1 sm:order-2 sm:ml-auto sm:w-auto">
          <NavLink to="/" end className={navCls}>
            Mi lista
          </NavLink>
          <NavLink to="/buscar" className={navCls}>
            Buscar
          </NavLink>
          <NavLink to="/estadisticas" className={navCls}>
            Estadísticas
          </NavLink>
        </nav>
        <div className="order-2 flex items-center sm:order-3">
          <span aria-hidden="true" className="mr-2 hidden h-6 w-px bg-line sm:block" />
          <UserMenu user={me.data} onLogout={() => logout.mutate()} loggingOut={logout.isPending} />
        </div>
      </header>

      <main className="pt-6 pb-16">
        <Routes>
          <Route path="/" element={<LibraryPage />} />
          <Route path="/buscar" element={<SearchPage />} />
          <Route path="/estadisticas" element={<StatsPage />} />
          <Route path="/steam" element={<SteamPage />} />
        </Routes>
      </main>

      <footer className="border-t border-line py-6 text-sm text-muted">
        Datos e imágenes de{" "}
        <a href="https://www.igdb.com" target="_blank" rel="noreferrer" className="underline hover:text-text">
          IGDB
        </a>{" "}
        y{" "}
        <a href="https://steamcommunity.com/dev" target="_blank" rel="noreferrer" className="underline hover:text-text">
          Steam
        </a>
        .
      </footer>
    </div>
  );
}
