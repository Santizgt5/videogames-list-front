// Las imágenes de RAWG son enormes; RAWG sirve una versión más pequeña si cambias la URL
export function thumb(url: string | null, width = 640) {
  if (!url) return null;
  return url.replace("/media/games/", `/media/resize/${width}/-/games/`);
}
