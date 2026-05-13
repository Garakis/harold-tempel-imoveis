"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Photo {
  public_url: string;
  alt_text: string | null;
}

interface Props {
  photos: Photo[];
  fallbackAlt: string;
  sizes?: string;
}

/**
 * Inline mini-carousel used inside property cards on listings/home.
 * Renders the first photo via next/image (eager-priorityable) and additional
 * photos lazily on demand. Arrows + dot pagination, all client-side.
 */
export function PropertyCardGallery({ photos, fallbackAlt, sizes }: Props) {
  const [index, setIndex] = useState(0);
  const safePhotos = photos.length > 0 ? photos : [];
  const count = safePhotos.length;

  if (count === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
        Sem foto
      </div>
    );
  }

  const goPrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIndex((i) => (i - 1 + count) % count);
  };

  const goNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIndex((i) => (i + 1) % count);
  };

  return (
    <>
      {safePhotos.map((photo, i) => (
        <Image
          key={photo.public_url}
          src={photo.public_url}
          alt={photo.alt_text ?? fallbackAlt}
          fill
          sizes={sizes}
          className={cn(
            "object-cover transition-opacity duration-300",
            i === index ? "opacity-100" : "opacity-0"
          )}
          priority={i === 0}
        />
      ))}

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={goPrev}
            aria-label="Foto anterior"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-navy-700 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Próxima foto"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-navy-700 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
          >
            <ChevronRight size={18} />
          </button>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex gap-1">
            {safePhotos.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 w-1.5 rounded-full transition-colors",
                  i === index ? "bg-white" : "bg-white/50"
                )}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}
