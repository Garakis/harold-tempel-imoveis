import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  href?: string | null;
  variant?: "default" | "light";
}

/**
 * Harold Tempel Imóveis logo — typographic mark with house glyph.
 * Pure CSS/SVG so it scales crisply at any size.
 */
export function Logo({ className, href = "/", variant = "default" }: LogoProps) {
  const goldClass = variant === "light" ? "text-white" : "text-gold-500";
  const bodyClass = variant === "light" ? "text-white/90" : "text-navy-800";

  const content = (
    <div className={cn("flex items-center gap-3", className)}>
      <svg
        viewBox="0 0 64 56"
        className={cn("h-10 w-12 shrink-0", goldClass)}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Roof */}
        <path d="M4 22 L32 4 L60 22" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
        {/* Pediment */}
        <path d="M14 22 L14 38 M50 22 L50 38" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        {/* Center pillar */}
        <path d="M32 14 L32 42" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        {/* Crossbeam */}
        <path d="M10 38 L54 38" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        {/* HTI letters compressed */}
        <text
          x="32"
          y="34"
          textAnchor="middle"
          fontFamily="serif"
          fontSize="10"
          fontWeight="700"
          fill="currentColor"
        >
          HTI
        </text>
        {/* Base */}
        <path d="M6 50 L58 50" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <div className="leading-tight">
        <div
          className={cn(
            "font-display font-extrabold tracking-wide text-base sm:text-lg",
            goldClass
          )}
          style={{ letterSpacing: "0.08em" }}
        >
          HAROLD TEMPEL
        </div>
        <div
          className={cn(
            "font-display text-[10px] sm:text-xs tracking-[0.4em]",
            bodyClass
          )}
        >
          IMÓVEIS
        </div>
      </div>
    </div>
  );

  if (!href) return content;
  return <Link href={href} className="block">{content}</Link>;
}
