"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { NeighborhoodCard } from "@/lib/domain/queries";

interface Props {
  cards: NeighborhoodCard[];
}

/**
 * Horizontal carousel for "Imóveis mais buscados".
 * Mirrors the original Kenlo layout: each "slide" is a vertical pair
 * (one tall card + two stacked cards), then repeats.
 */
export function MostSearchedCarousel({ cards }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);

  if (cards.length === 0) return null;

  // Group cards into alternating columns: tall (1 card), stacked (2 cards)
  type Column =
    | { kind: "tall"; card: NeighborhoodCard }
    | { kind: "stacked"; top: NeighborhoodCard; bottom: NeighborhoodCard | null };

  const columns: Column[] = [];
  let i = 0;
  let toggle = true;
  while (i < cards.length) {
    if (toggle) {
      columns.push({ kind: "tall", card: cards[i] });
      i += 1;
    } else {
      columns.push({
        kind: "stacked",
        top: cards[i],
        bottom: cards[i + 1] ?? null,
      });
      i += 2;
    }
    toggle = !toggle;
  }

  function scroll(dir: "left" | "right") {
    const el = trackRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  }

  return (
    <div className="relative">
      {/* Track */}
      <div
        ref={trackRef}
        className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4"
        style={{ scrollbarWidth: "none" }}
      >
        {columns.map((col, idx) => (
          <div
            key={idx}
            className="flex-shrink-0 snap-start w-[260px] sm:w-[280px]"
          >
            {col.kind === "tall" ? (
              <NeighborhoodTile card={col.card} variant="tall" />
            ) : (
              <div className="flex flex-col gap-4 h-[520px]">
                <NeighborhoodTile card={col.top} variant="short" />
                {col.bottom && <NeighborhoodTile card={col.bottom} variant="short" />}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Arrows */}
      <button
        type="button"
        onClick={() => scroll("left")}
        aria-label="Anterior"
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 hidden sm:inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-navy-700 shadow-card hover:bg-navy-50 transition-colors"
      >
        <ChevronLeft size={22} />
      </button>
      <button
        type="button"
        onClick={() => scroll("right")}
        aria-label="Próximo"
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 hidden sm:inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-navy-700 shadow-card hover:bg-navy-50 transition-colors"
      >
        <ChevronRight size={22} />
      </button>
    </div>
  );
}

function NeighborhoodTile({
  card,
  variant,
}: {
  card: NeighborhoodCard;
  variant: "tall" | "short";
}) {
  const href = `/imoveis/a-venda/${card.type_slug}/${card.neighborhood_slug}`;
  const label = `${card.type_label} à venda ${card.neighborhood_name}`;
  const height = variant === "tall" ? "h-[520px]" : "h-[250px]";

  return (
    <Link
      href={href}
      className={`group relative block overflow-hidden rounded-2xl bg-muted shadow-card hover:shadow-card-hover transition-shadow ${height}`}
    >
      {card.cover_url && (
        <Image
          src={card.cover_url}
          alt={label}
          fill
          sizes="(min-width: 640px) 280px, 260px"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
      )}
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-navy-900/40 via-transparent to-transparent" />
      {/* Floating label */}
      <span className="absolute left-4 top-4 max-w-[85%] rounded-xl bg-white/95 backdrop-blur-sm px-3 py-2 text-sm font-semibold text-navy-800 shadow-sm">
        {label}
      </span>
      {/* Count badge */}
      <span className="absolute right-4 bottom-4 rounded-pill bg-navy-700/90 text-white text-xs font-medium px-3 py-1">
        {card.count} {card.count === 1 ? "imóvel" : "imóveis"}
      </span>
    </Link>
  );
}
