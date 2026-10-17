import { thumb } from "../lib/images";

interface Props {
  src: string | null;
  name: string;
  className?: string;
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
