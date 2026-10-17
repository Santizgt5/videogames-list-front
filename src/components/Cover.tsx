interface Props {
  src: string | null;
  name: string;
  className?: string;
}

// Las imágenes de RAWG son enormes; RAWG sirve una versión más pequeña si cambias la URL
export function thumb(url: string | null, width = 640) {
  if (!url) return null;
  return url.replace("/media/games/", `/media/resize/${width}/-/games/`);
}

export function Cover({ src, name, className = "" }: Props) {
  const url = thumb(src);
  if (!url) {
    const initials = name
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join("");
    return (
      <div
        className={`flex items-center justify-center bg-panel-2 font-display text-3xl font-bold text-muted ${className}`}
        aria-hidden
      >
        {initials}
      </div>
    );
  }
  return <img src={url} alt="" loading="lazy" className={`object-cover ${className}`} />;
}
