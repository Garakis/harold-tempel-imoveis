"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ImageIcon, X } from "lucide-react";

interface Photo {
  id: string;
  public_url: string;
  alt_text: string | null;
}

interface Props {
  photos: Photo[];
  title: string;
  contactHref?: string;
}

/**
 * Horizontal photo carousel for the property detail page.
 * Shows ~1.5 photos per viewport (like Kenlo). Includes:
 *  - left/right arrows
 *  - "X Fotos" badge on the first slide that opens a fullscreen lightbox grid
 *  - lightbox: 3-column scrollable grid + close + "Gostou? Entre em contato" CTA
 */
export function PropertyGallery({ photos, title, contactHref = "#contato" }: Props) {
  const [open, setOpen] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  // Lock body scroll while lightbox open + ESC to close
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (photos.length === 0) {
    return (
      <div className="flex aspect-[16/9] items-center justify-center rounded-xl bg-muted text-muted-foreground text-sm">
        Sem fotos
      </div>
    );
  }

  function scroll(dir: "left" | "right") {
    const el = trackRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.6;
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  }

  return (
    <>
      <div className="relative">
        <div
          ref={trackRef}
          className="flex gap-2 overflow-x-auto scroll-smooth snap-x snap-mandatory rounded-xl"
          style={{ scrollbarWidth: "none" }}
        >
          {photos.map((photo, i) => (
            <div
              key={photo.id}
              className="relative flex-shrink-0 snap-start aspect-[4/3] w-[80%] sm:w-[55%] lg:w-[48%] overflow-hidden rounded-xl bg-muted group/slide"
            >
              <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label="Ver todas as fotos"
                className="absolute inset-0 z-0 cursor-zoom-in"
              />
              <Image
                src={photo.public_url}
                alt={photo.alt_text ?? title}
                fill
                sizes="(min-width: 1024px) 50vw, (min-width: 640px) 55vw, 80vw"
                className="object-cover pointer-events-none transition-transform duration-500 group-hover/slide:scale-[1.02]"
                priority={i < 2}
              />
              {i === 0 && (
                <span className="pointer-events-none absolute left-4 bottom-4 inline-flex items-center gap-2 rounded-pill bg-white/95 backdrop-blur-sm px-4 py-2 text-sm font-semibold text-navy-800 shadow-card">
                  <ImageIcon size={16} /> {photos.length} Fotos
                </span>
              )}
            </div>
          ))}
        </div>

        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => scroll("left")}
              aria-label="Foto anterior"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-navy-700 shadow-card hover:bg-white transition-colors"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              aria-label="Próxima foto"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-navy-700 shadow-card hover:bg-white transition-colors"
            >
              <ChevronRight size={22} />
            </button>
          </>
        )}
      </div>

      {/* Lightbox */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-white overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Galeria de fotos"
        >
          <header className="sticky top-0 z-10 flex items-center justify-between gap-4 bg-white/95 backdrop-blur-sm border-b border-border px-4 sm:px-8 py-4">
            <div>
              <h2 className="font-display text-xl font-bold text-navy-800">{title}</h2>
              <p className="text-xs text-muted-foreground">{photos.length} fotos</p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={contactHref}
                onClick={() => setOpen(false)}
                className="hidden sm:inline-flex items-center rounded-pill bg-navy-700 text-white px-5 py-2 text-sm font-medium hover:bg-navy-800 transition-colors"
              >
                Gostou? Entre em contato
              </a>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-navy-700 hover:bg-navy-50 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </header>

          <div className="mx-auto max-w-6xl px-4 sm:px-8 py-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted"
                >
                  <Image
                    src={photo.public_url}
                    alt={photo.alt_text ?? title}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
