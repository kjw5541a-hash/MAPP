import { useEffect, useState } from "react";
import { Music2 } from "lucide-react";
import { getArtUrl, releaseArtUrl } from "../lib/artCache";

interface CoverArtProps {
  artKey?: string;
  alt: string;
  className?: string;
  rounded?: string;
}

export function CoverArt({ artKey, alt, className = "", rounded = "rounded-lg" }: CoverArtProps) {
  const [url, setUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    setUrl(undefined);
    getArtUrl(artKey).then((u) => {
      if (!cancelled) setUrl(u);
    });
    return () => {
      cancelled = true;
      releaseArtUrl(artKey);
    };
  }, [artKey]);

  if (!url) {
    return (
      <div
        className={`${className} ${rounded} bg-am-fill flex items-center justify-center text-am-muted shrink-0`}
      >
        <Music2 className="w-1/3 h-1/3 opacity-50" />
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={alt}
      className={`${className} ${rounded} object-cover shrink-0`}
      draggable={false}
    />
  );
}
