import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  href?: string | null;
  /** "onLight" uses the full color logo; "onDark" uses the gold-only logo. */
  variant?: "onLight" | "onDark";
  /** Display height in Tailwind units (e.g. "h-12"). Width auto-scales. */
  size?: string;
}

const SOURCES = {
  onLight: { src: "/brand/logo-full.png", width: 628, height: 314 },
  onDark: { src: "/brand/logo-mini.png", width: 300, height: 167 },
};

export function Logo({
  className,
  href = "/",
  variant = "onLight",
  size = "h-12 sm:h-14",
}: LogoProps) {
  const src = SOURCES[variant];

  const image = (
    <Image
      src={src.src}
      alt="Harold Tempel Imóveis"
      width={src.width}
      height={src.height}
      priority
      className={cn("w-auto block", size, className)}
    />
  );

  if (!href) return image;
  return (
    <Link href={href} className="inline-block">
      {image}
    </Link>
  );
}
