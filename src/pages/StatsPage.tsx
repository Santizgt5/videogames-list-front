import { useState } from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import type { StatsPageData } from "../api/types";
import { genreName } from "../lib/genres";
import { statusInfo } from "../lib/status";
import { Cover } from "../components/Cover";
import { EntryEditor, type EditorTarget } from "../components/EntryEditor";
import { BarList, ChartCard, ColumnChart, Meter, StatTile, TipBody } from "../components/charts";

const fmt = (n: number) => n.toLocaleString("es-CO", { maximumFractionDigits: 1 });
const plural = (n: number, one: string, many: string) => `${fmt(n)} ${n === 1 ? one : many}`;

export function StatsPage() {
  const stats = useQuery({ queryKey: ["stats-page"], queryFn: api.statsPage });
  const [editing, setEditing] = useState<EditorTarget | null>(null);

  if (stats.isPending) return <p className="text-muted">Cargando…</p>;
  if (stats.isError) return <p className="text-st-dropped">{stats.error.message}</p>;
  const s = stats.data;

  if (s.totals.games === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-line px-6 py-16 text-center">
        <p className="font-display text-2xl font-bold">Aún no hay nada que contar</p>
        <p className="mt-2 text-muted">Añade juegos a tu lista y aquí verás tus horas, notas y géneros.</p>
        <Link to="/buscar" className="mt-6 inline-block rounded-md bg-text px-5 py-2.5 font-bold text-ink">
          Buscar juegos
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">Estadísticas</h1>
      <p className="mt-2 text-lg text-muted">
        {plural(s.totals.games, "juego", "juegos")} en tu lista y {plural(Math.round(s.totals.hours), "hora", "horas")} jugadas.
      </p>

      <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Juegos" value={fmt(s.totals.games)} />
        <StatTile label="Completados" value={fmt(s.totals.completed)} sub={`${Math.round((s.totals.completed / s.totals.games) * 100)} %`} />
        <StatTile label="Horas jugadas" value={fmt(Math.round(s.totals.hours))} />
        <StatTile label="Nota media" value={s.totals.averageScore !== null ? fmt(s.totals.averageScore) : "–"} sub="/10" />
      </dl>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <CompletedByYear data={s} />
        <Scores data={s} />
        <Genres data={s} />
        <TopHours data={s} onOpen={(id) => setEditing({ kind: "entry", id })} />
      </div>

      {s.steam && <SteamSection steam={s.steam} />}

      {editing && <EntryEditor target={editing} onClose={() => setEditing(null)} />}
    </>
  );
}

/* ---------- Terminados por año ---------- */

function CompletedByYear({ data }: { data: StatsPageData }) {
  const rows = data.completedByYear;
  return (
    <ChartCard
      title="Terminados por año"
      subtitle={
        data.completedWithoutDate > 0
          ? `Según la fecha de terminado. ${plural(data.completedWithoutDate, "completado no tiene", "completados no tienen")} fecha.`
          : "Según la fecha de terminado"
      }
      table={{
        columns: ["Año", "Juegos", "Horas"],
        rows: rows.map((r) => [r.year, r.count, fmt(r.hours)]),
      }}
    >
      {rows.length === 0 ? (
        <p className="py-10 text-center text-muted">Ponle fecha de terminado a tus juegos completados para verlos aquí.</p>
      ) : (
        <ColumnChart
          ariaLabel="Juegos terminados por año"
          labelEvery={rows.length > 8 ? 2 : 1}
          labelEveryMobile={rows.length > 6 ? 2 : 1}
          data={rows.map((r) => ({
            key: r.year,
            label: String(r.year),
            value: r.count,
            tooltip: (
              <TipBody
                value={plural(r.count, "juego", "juegos")}
                label={`${r.year} · ${fmt(r.hours)} h`}
                extra={r.games.length > 0 && <ul>{r.games.map((g) => <li key={g}>{g}</li>)}</ul>}
              />
            ),
          }))}
        />
      )}
    </ChartCard>
  );
}

/* ---------- Notas ---------- */

function Scores({ data }: { data: StatsPageData }) {
  const total = data.scores.reduce((n, s) => n + s.count, 0);
  return (
    <ChartCard
      title="Tus notas"
      subtitle={
        total > 0
          ? `${plural(total, "juego puntuado", "juegos puntuados")}, media ${fmt(data.totals.averageScore ?? 0)}`
          : "Aún no has puesto notas"
      }
      table={{ columns: ["Nota", "Juegos"], rows: data.scores.map((s) => [s.score, s.count]) }}
    >
      <ColumnChart
        ariaLabel="Cuántos juegos tienen cada nota"
        data={data.scores.map((s) => ({
          key: s.score,
          label: String(s.score),
          value: s.count,
          tooltip: <TipBody value={plural(s.count, "juego", "juegos")} label={`con un ${s.score}`} />,
        }))}
      />
    </ChartCard>
  );
}

/* ---------- Géneros ---------- */

function Genres({ data }: { data: StatsPageData }) {
  return (
    <ChartCard
      title="Horas por género"
      subtitle="Un juego suma en cada uno de sus géneros"
      table={{
        columns: ["Género", "Horas", "Juegos", "Nota media"],
        rows: data.genres.map((g) => [genreName(g.genre), fmt(g.hours), g.games, g.averageScore !== null ? fmt(g.averageScore) : "–"]),
      }}
    >
      <BarList
        ariaLabel="Horas por género"
        data={data.genres.map((g) => ({
          key: g.genre,
          label: genreName(g.genre),
          value: g.hours,
          display: `${fmt(Math.round(g.hours))} h`,
          tooltip: (
            <TipBody
              value={`${fmt(g.hours)} h`}
              label={genreName(g.genre)}
              extra={
                <>
                  {plural(g.games, "juego", "juegos")}
                  {g.averageScore !== null && <> · nota media {fmt(g.averageScore)}</>}
                </>
              }
            />
          ),
        }))}
      />
    </ChartCard>
  );
}

/* ---------- Más jugados ---------- */

function TopHours({ data, onOpen }: { data: StatsPageData; onOpen: (entryId: number) => void }) {
  return (
    <ChartCard
      title="Los más jugados"
      table={{
        columns: ["Juego", "Horas", "Estado"],
        rows: data.topHours.map((g) => [g.name, fmt(g.hours), statusInfo(g.status).label]),
      }}
    >
      <BarList
        ariaLabel="Juegos con más horas"
        data={data.topHours.map((g) => ({
          key: g.entryId,
          label: g.name,
          value: g.hours,
          display: `${fmt(Math.round(g.hours))} h`,
          leading: <Cover src={g.coverUrl} name={g.name} className="aspect-[3/4] w-6 shrink-0 rounded-sm text-[8px]" />,
          onClick: () => onOpen(g.entryId),
          tooltip: <TipBody value={`${fmt(g.hours)} h`} label={g.name} extra={statusInfo(g.status).label} />,
        }))}
      />
    </ChartCard>
  );
}

/* ---------- Steam ---------- */

const monthLabel = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y!, m! - 1).toLocaleDateString("es", { month: "short", year: "2-digit" }).replace(".", "");
};
const monthLong = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y!, m! - 1).toLocaleDateString("es", { month: "long", year: "numeric" });
};

function SteamSection({ steam }: { steam: NonNullable<StatsPageData["steam"]> }) {
  const lastYear = steam.achievementsByMonth.slice(-12).reduce((n, m) => n + m.count, 0);

  return (
    <section className="mt-12">
      <h2 className="font-display text-2xl font-extrabold tracking-tight">Logros de Steam</h2>
      <p className="mt-1 text-muted">
        {plural(steam.achievements, "logro", "logros")} en {plural(steam.gamesWithAchievements, "juego", "juegos")}.{" "}
        <Link to="/steam" className="underline hover:text-text">
          Sincronizar
        </Link>
      </p>

      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Logros" value={fmt(steam.achievements)} />
        <StatTile label="Últimos 12 meses" value={fmt(lastYear)} />
        <StatTile label="Juegos al 100 %" value={fmt(steam.perfectGames)} />
        <StatTile label="Logro más raro" value={steam.rarest[0] ? `${fmt(steam.rarest[0].percent)} %` : "–"} />
      </dl>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Logros por mes"
          subtitle="Últimos 24 meses"
          className="lg:col-span-2"
          table={{
            columns: ["Mes", "Logros"],
            rows: steam.achievementsByMonth.map((m) => [monthLong(m.month), m.count]),
          }}
        >
          <ColumnChart
            ariaLabel="Logros conseguidos por mes"
            labelEvery={3}
            labelEveryMobile={6}
            data={steam.achievementsByMonth.map((m) => ({
              key: m.month,
              label: monthLabel(m.month),
              value: m.count,
              tooltip: <TipBody value={plural(m.count, "logro", "logros")} label={monthLong(m.month)} />,
            }))}
          />
        </ChartCard>

        <ChartCard title="Tus logros más raros" subtitle="Los que menos jugadores tienen">
          {steam.rarest.length === 0 ? (
            <p className="py-6 text-center text-muted">Sin datos de rareza todavía.</p>
          ) : (
            <ul className="divide-y divide-line/60">
              {steam.rarest.map((a) => (
                <li key={`${a.game}-${a.name}`} className="flex items-center gap-3 py-2">
                  <img src={a.icon} alt="" loading="lazy" className="size-10 shrink-0 rounded" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{a.name}</p>
                    <p className="truncate text-xs text-muted">{a.game}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold">{fmt(a.percent)} %</p>
                    {a.unlockedAt && (
                      <p className="text-xs text-muted">{new Date(a.unlockedAt).toLocaleDateString("es")}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ChartCard>

        <ChartCard title="A punto del 100 %" subtitle="Los que tienes más avanzados">
          {steam.closest.length === 0 ? (
            <p className="py-6 text-center text-muted">Nada a medias por ahora.</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {steam.closest.map((g) => (
                <li key={g.appId} className="flex items-center gap-3">
                  <Cover src={g.coverUrl} name={g.name} className="aspect-[3/4] w-9 shrink-0 rounded-sm text-xs" />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex items-baseline justify-between gap-3">
                      <p className="truncate text-sm font-bold">{g.name}</p>
                      <p className="shrink-0 text-sm text-muted tabular-nums">
                        {g.unlocked}/{g.total}
                      </p>
                    </div>
                    <Meter value={g.unlocked} max={g.total} label={`Logros de ${g.name}`} />
                    <p className="mt-1 text-xs text-muted">
                      {g.total - g.unlocked === 1 ? "Te falta 1" : `Te faltan ${g.total - g.unlocked}`}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ChartCard>
      </div>
    </section>
  );
}
