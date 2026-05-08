import type { Database } from "@/lib/supabase/database.types";
import { slugify } from "@/lib/utils";

export type Property = Database["public"]["Tables"]["properties"]["Row"];
export type PropertyType = Database["public"]["Tables"]["property_types"]["Row"];
export type Neighborhood = Database["public"]["Tables"]["neighborhoods"]["Row"];
export type City = Database["public"]["Tables"]["cities"]["Row"];
export type PropertyPhoto = Database["public"]["Tables"]["property_photos"]["Row"];
export type PropertyModality = Database["public"]["Enums"]["property_modality"];
export type PropertyStatus = Database["public"]["Enums"]["property_status"];

/** Property with relational data needed for cards/listings. */
export type PropertyListing = Property & {
  type: Pick<PropertyType, "slug" | "name" | "is_rural">;
  city: Pick<City, "name" | "uf" | "slug">;
  neighborhood: Pick<Neighborhood, "name" | "slug"> | null;
  cover_photo: Pick<PropertyPhoto, "public_url" | "alt_text"> | null;
  photos_count: number;
};

/** Two-letter type code prefix used in property codes (CA0034 etc.) */
const TYPE_CODE_PREFIX: Record<string, string> = {
  casa: "CA",
  apartamento: "AP",
  terreno: "TE",
  chacara: "CH",
  sitio: "SI",
  rancho: "RA",
};

export function getCodePrefix(typeSlug: string): string {
  return TYPE_CODE_PREFIX[typeSlug] ?? "IM";
}

/** Formats next sequential code given existing codes for the type prefix. */
export function generateNextCode(typeSlug: string, existingCodes: string[]): string {
  const prefix = getCodePrefix(typeSlug);
  const numbers = existingCodes
    .filter((c) => c.startsWith(prefix))
    .map((c) => parseInt(c.slice(2), 10))
    .filter((n) => !Number.isNaN(n));
  const next = numbers.length === 0 ? 1 : Math.max(...numbers) + 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

/**
 * Builds the SEO-friendly slug for a property:
 * `{tipo}-{cidade}-{quartos}-quartos-{area}-m`
 * Example: casa-mococa-4-quartos-244-m
 */
export function buildPropertySlug(p: {
  type: { slug: string };
  city: { slug: string };
  bedrooms: number;
  built_area_m2: number | null;
  total_area_m2: number | null;
}): string {
  const parts = [p.type.slug, p.city.slug];
  if (p.bedrooms > 0) {
    parts.push(`${p.bedrooms}-quartos`);
  }
  const area = p.built_area_m2 ?? p.total_area_m2;
  if (area) {
    parts.push(`${Math.round(area)}-m`);
  }
  return slugify(parts.join("-"));
}

/** Builds the URL path for a property detail page. */
export function getPropertyUrl(p: {
  slug: string;
  code: string;
}): string {
  return `/imovel/${p.slug}/${p.code}`;
}

/** Localized labels for modality. */
export const MODALITY_LABEL: Record<PropertyModality, string> = {
  venda: "Venda",
  aluguel: "Aluguel",
  temporada: "Temporada",
  venda_aluguel: "Venda e Aluguel",
};

export const MODALITY_SLUG: Record<PropertyModality, string> = {
  venda: "a-venda",
  aluguel: "para-alugar",
  temporada: "temporada",
  venda_aluguel: "a-venda",
};

export const STATUS_LABEL: Record<PropertyStatus, string> = {
  rascunho: "Rascunho",
  ativo: "Ativo",
  inativo: "Inativo",
  vendido: "Vendido",
  alugado: "Alugado",
  reservado: "Reservado",
};
