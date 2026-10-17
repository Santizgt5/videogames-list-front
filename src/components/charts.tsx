import { useState, type ReactNode } from "react";

/* ---------- Contenedor con alternar gráfica / tabla ---------- */

export interface TableView {
  columns: string[];
  rows: (string | number)[][];
}

export function ChartCard({
  title,
  subtitle,
  table,
  className = "",
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  table?: TableView;
  className?: string;
  children: ReactNode;
}) {
  const [showTable, setShowTable] = useState(false);
  return (
    <figure className={`rounded-lg bg-panel p-5 ${className}`}>
      <figcaption className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-bold">{title}</h2>
          {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
        </div>
        {table && (
          <button
            onClick={() => setShowTable((t) => !t)}
            aria-pressed={showTable}
            className="shrink-0 rounded-md px-2 py-1 text-sm text-muted hover:bg-panel-2 hover:text-text"
          >
            {showTable ? "Ver gráfica" : "Ver tabla"}
          </button>
        )}
      </figcaption>
      {showTable && table ? <DataTable {...table} /> : children}
    </figure>
  );
}

function DataTable({ columns, rows }: TableView) {
  return (
    <div className="max-h-80 overflow-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-panel text-left text-muted">
          <tr>
            {columns.map((c, i) => (
              <th key={c} className={`pb-2 font-normal ${i > 0 ? "text-right" : ""}`}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line/60">
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((cell, j) => (
                <td key={j} className={`py-1.5 ${j > 0 ? "text-right tabular-nums" : ""}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- Tooltip (se muestra al pasar el ratón o con el foco del teclado) ---------- */

function Tooltip({ children, align = "center" }: { children: ReactNode; align?: "start" | "center" | "end" }) {
  const pos = { start: "left-0", center: "left-1/2 -translate-x-1/2", end: "right-0" }[align];
  return (
    <div
      role="tooltip"
      className={`pointer-events-none absolute bottom-full z-20 mb-2 hidden w-max max-w-60 rounded-md bg-ink px-3 py-2 text-left text-sm shadow-xl ring-1 ring-line group-hover:block group-focus:block ${pos}`}
    >
      {children}
    </div>
  );
}

/** Valor fuerte arriba, etiqueta discreta debajo */
export function TipBody({ value, label, extra }: { value: ReactNode; label: ReactNode; extra?: ReactNode }) {
  return (
    <>
      <p className="font-bold">{value}</p>
      <p className="text-muted">{label}</p>
      {extra && <div className="mt-1.5 text-xs text-muted">{extra}</div>}
    </>
  );
}

/* ---------- Escala ---------- */

/** Máximo "redondo" (1, 2, 2.5, 5 × 10^n) para el eje */
function niceMax(max: number) {
  if (max <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(max));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * pow >= max) return m * pow;
  return 10 * pow;
}

const fmt = (n: number) => n.toLocaleString("es-CO", { maximumFractionDigits: 1 });

/* ---------- Columnas (una serie) ---------- */

export interface ColumnDatum {
  key: string | number;
  label: string; // etiqueta del eje X
  value: number;
  tooltip: ReactNode;
}

export function ColumnChart({
  data,
  height = 160,
  labelEvery = 1,
  labelEveryMobile = labelEvery,
  ariaLabel,
}: {
  data: ColumnDatum[];
  height?: number;
  labelEvery?: number;
  /** Cada cuántas columnas se pone etiqueta en pantallas estrechas */
  labelEveryMobile?: number;
  ariaLabel: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 0);
  let top = niceMax(max);
  // En conteos (todo enteros) la línea del medio también debe ser entera: 5 -> 6 (0, 3, 6)
  if (data.every((d) => Number.isInteger(d.value)) && !Number.isInteger(top / 2)) top = Math.ceil(top / 2) * 2;
  const ticks = [top, top / 2, 0];
  const maxIndex = data.findIndex((d) => d.value === max);

  return (
    <div className="flex gap-2" role="group" aria-label={ariaLabel}>
      {/* Eje Y */}
      <div className="relative w-8 shrink-0 text-right text-xs text-muted tabular-nums" style={{ height }}>
        {ticks.map((t) => (
          <span key={t} className="absolute right-0 -translate-y-1/2" style={{ top: `${(1 - t / top) * 100}%` }}>
            {fmt(t)}
          </span>
        ))}
      </div>

      <div className="min-w-0 flex-1">
        <div className="relative" style={{ height }}>
          {/* Rejilla: líneas finas y discretas */}
          {ticks.map((t) => (
            <div
              key={t}
              className={`absolute inset-x-0 h-px ${t === 0 ? "bg-muted/40" : "bg-line/70"}`}
              style={{ top: `${(1 - t / top) * 100}%` }}
            />
          ))}
          <div className="absolute inset-0 flex">
            {data.map((d, i) => {
              const h = (d.value / top) * 100;
              const align = i < data.length * 0.2 ? "start" : i > data.length * 0.8 ? "end" : "center";
              return (
                <div
                  key={d.key}
                  tabIndex={0}
                  aria-label={`${d.label}: ${fmt(d.value)}`}
                  className="group relative flex h-full flex-1 items-end justify-center outline-none"
                >
                  {d.value > 0 && (
                    <div
                      className="relative w-[70%] max-w-6 rounded-t-[4px] bg-chart transition group-hover:brightness-125 group-focus:brightness-125"
                      style={{ height: `${h}%` }}
                    >
                      {/* Solo etiquetamos el máximo */}
                      {i === maxIndex && (
                        <span className="absolute bottom-full left-1/2 mb-1 -translate-x-1/2 text-xs font-bold">
                          {fmt(d.value)}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0" style={{ height: `${Math.max(h, 0)}%` }}>
                    <Tooltip align={align}>{d.tooltip}</Tooltip>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {/* Eje X */}
        <div className="mt-1.5 flex text-xs text-muted">
          {data.map((d, i) => (
            <span key={d.key} className="flex-1 overflow-visible text-center whitespace-nowrap">
              {i % labelEvery === 0 && (
                <span className={i % labelEveryMobile === 0 ? "" : "hidden sm:inline"}>{d.label}</span>
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Barras horizontales (una serie) ---------- */

export interface BarDatum {
  key: string | number;
  label: string;
  value: number;
  display: string; // valor formateado al final de la barra
  tooltip: ReactNode;
  leading?: ReactNode; // p. ej. una portada
  onClick?: () => void;
}

export function BarList({ data, ariaLabel }: { data: BarDatum[]; ariaLabel: string }) {
  const max = Math.max(...data.map((d) => d.value), 0) || 1;
  return (
    <ul className="flex flex-col gap-1" aria-label={ariaLabel}>
      {data.map((d) => {
        const content = (
          <>
            {d.leading}
            <span className="w-28 shrink-0 truncate text-sm sm:w-40" title={d.label}>
              {d.label}
            </span>
            <span className="relative flex min-w-0 flex-1 items-center gap-2">
              <span
                className="h-3 rounded-r-[4px] bg-chart transition group-hover:brightness-125 group-focus:brightness-125"
                style={{ width: `${(d.value / max) * 85}%`, minWidth: d.value > 0 ? 2 : 0 }}
              />
              <span className="shrink-0 text-sm text-muted tabular-nums">{d.display}</span>
              <Tooltip align="start">{d.tooltip}</Tooltip>
            </span>
          </>
        );
        const cls = "group relative flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left outline-none hover:bg-panel-2/60 focus-visible:bg-panel-2/60";
        return (
          <li key={d.key}>
            {d.onClick ? (
              <button onClick={d.onClick} className={cls}>
                {content}
              </button>
            ) : (
              <div tabIndex={0} className={cls}>
                {content}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/* ---------- Cifras ---------- */

export function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg bg-panel px-4 py-3">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="mt-0.5 text-3xl font-bold">
        {value}
        {sub && <span className="ml-1.5 text-base font-normal text-muted">{sub}</span>}
      </dd>
    </div>
  );
}

/** Progreso: el fondo es el mismo color, más tenue */
export function Meter({ value, max, label }: { value: number; max: number; label: string }) {
  return (
    <div
      role="meter"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-label={label}
      className="h-1.5 overflow-hidden rounded-full bg-chart/25"
    >
      <div className="h-full rounded-full bg-chart" style={{ width: `${(value / max) * 100}%` }} />
    </div>
  );
}
