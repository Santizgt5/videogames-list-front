// IGDB sirve cada imagen en varios tamaños cambiando el "t_xxx" de la URL.
// Tamaños: https://api-docs.igdb.com/#images
export type ImageSize = "cover_small" | "cover_big" | "cover_big_2x" | "screenshot_big" | "screenshot_huge" | "720p" | "1080p";

export function igdbImage(url: string | null, size: ImageSize) {
  if (!url) return null;
  return url.replace(/\/t_[a-z0-9_]+\//, `/t_${size}/`);
}
