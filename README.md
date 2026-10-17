# videogames-list-front

Web de **Backlog**, una lista personal de los videojuegos que he jugado (estilo MyAnimeList).

- **Mi lista**: carátulas con el estado de cada juego, tu nota, filtros por estado, favoritos y orden.
- **Buscar**: busca cualquier juego y añádelo a tu lista.
- **Editor**: estado, nota del 1 al 10, horas, plataforma, fechas, notas y favorito.

**Stack**: React 19 + Vite + TypeScript + Tailwind CSS 4 + TanStack Query + React Router.

Necesita la API: https://github.com/Santizgt5/videogames-list-back

## Puesta en marcha

```bash
npm install
npm run dev   # http://localhost:5173
```

En desarrollo, Vite redirige las llamadas a `/api` hacia `http://localhost:3000` (ver `vite.config.ts`), así que el backend tiene que estar arrancado.

## Estructura

```
src/
  api/          Cliente HTTP y tipos de la API
  components/   Carátula, tarjeta de juego, editor lateral
  pages/        Mi lista y Buscar
  lib/          Estados (nombres y colores)
```

## Scripts

- `npm run dev`: servidor de desarrollo
- `npm run build`: compila para producción en `dist/`
- `npm run preview`: sirve el build
- `npm run lint`: revisa el código con oxlint

## Despliegue (Vercel)

Vercel detecta Vite solo. `vercel.json` hace dos cosas:

- Reenvía `/api/*` al backend (otro proyecto de Vercel). Así el navegador ve un solo dominio y la cookie de sesión y la vuelta de Steam funcionan igual que en local. Si el backend cambia de URL, actualízala ahí.
- Sirve `index.html` en cualquier otra ruta, para que recargar `/estadisticas` o `/steam` no dé 404.
