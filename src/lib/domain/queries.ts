import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { PropertyListing } from "./properties";

/**
 * Server-side query helpers for fetching property listings from Supabase.
 * Cached per-request via React `cache()`.
 */

const PROPERTY_SELECT = `
  id, code, slug, status, modality,
  bedrooms, suites, bathrooms, parking_spaces,
  built_area_m2, total_area_m2, useful_area_m2, common_area_m2, private_area_m2,
  sale_price, rental_price, rental_period, condo_fee, iptu_yearly,
  appraisal_sale, appraisal_rental,
  accepts_pet, accepts_financing, accepts_exchange, used_fgts_recently,
  exclusive, exclusive_until, authorization_signed, authorization_until,
  condo_name, condo_block, condo_administrator, year_built, year_renovated,
  floors_count, units_per_floor,
  title, description, internal_notes,
  is_published, is_featured, is_super_featured,
  meta_title, meta_description, features, rural_features,
  topography, facade_position, building_position,
  street, number, complement, cep, latitude, longitude, hide_address,
  reference_point,
  city_id, neighborhood_id, type_id, purpose_id, owner_id,
  created_at, updated_at, last_published_at, created_by, updated_by,
  type:property_types ( slug, name, is_rural ),
  city:cities ( name, uf, slug ),
  neighborhood:neighborhoods ( name, slug ),
  photos:property_photos ( public_url, alt_text, is_cover, sort_order )
`;

interface PropertyRowWithRelations {
  [key: string]: unknown;
  type: { slug: string; name: string; is_rural: boolean } | null;
  city: { name: string; uf: string; slug: string } | null;
  neighborhood: { name: string; slug: string } | null;
  photos: Array<{
    public_url: string;
    alt_text: string | null;
    is_cover: boolean;
    sort_order: number;
  }> | null;
}

function rowToListing(row: unknown): PropertyListing {
  const r = row as PropertyRowWithRelations;
  const photos = r.photos ?? [];
  const sorted = [...photos].sort((a, b) => {
    if (a.is_cover && !b.is_cover) return -1;
    if (!a.is_cover && b.is_cover) return 1;
    return a.sort_order - b.sort_order;
  });
  const cover = sorted[0] ?? null;
  const previewPhotos = sorted.slice(0, 5).map((p) => ({
    public_url: p.public_url,
    alt_text: p.alt_text,
  }));

  return {
    ...(row as object),
    type: r.type ?? { slug: "casa", name: "Casa", is_rural: false },
    city: r.city ?? { name: "Mococa", uf: "SP", slug: "mococa" },
    neighborhood: r.neighborhood ?? null,
    cover_photo: cover ? { public_url: cover.public_url, alt_text: cover.alt_text } : null,
    preview_photos: previewPhotos,
    photos_count: photos.length,
  } as PropertyListing;
}

export const getFeaturedProperties = cache(async (): Promise<PropertyListing[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("properties")
    .select(PROPERTY_SELECT)
    .eq("is_published", true)
    .eq("status", "ativo")
    .order("is_super_featured", { ascending: false })
    .order("is_featured", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(8);
  return (data ?? []).map((r) => rowToListing(r));
});

export interface PropertyFilters {
  modality?: "venda" | "aluguel" | "temporada";
  type_slug?: string;
  neighborhood_slug?: string;
  query?: string;
  bedrooms_min?: number;
  price_min?: number;
  price_max?: number;
}

export const listProperties = cache(
  async (filters: PropertyFilters = {}): Promise<PropertyListing[]> => {
    const supabase = await createClient();
    let q = supabase
      .from("properties")
      .select(PROPERTY_SELECT)
      .eq("is_published", true)
      .eq("status", "ativo");

    if (filters.modality === "venda") {
      q = q.in("modality", ["venda", "venda_aluguel"]);
    } else if (filters.modality === "aluguel") {
      q = q.in("modality", ["aluguel", "venda_aluguel"]);
    } else if (filters.modality === "temporada") {
      q = q.eq("modality", "temporada");
    }

    if (filters.bedrooms_min) {
      q = q.gte("bedrooms", filters.bedrooms_min);
    }
    if (filters.price_min) {
      q = q.gte("sale_price", filters.price_min);
    }
    if (filters.price_max) {
      q = q.lte("sale_price", filters.price_max);
    }

    q = q.order("sale_price", { ascending: true, nullsFirst: false });

    const { data } = await q;
    let results = (data ?? []).map((r) => rowToListing(r));

    // Filter by type/neighborhood at the JS level since they're relations
    if (filters.type_slug) {
      results = results.filter((p) => p.type.slug === filters.type_slug);
    }
    if (filters.neighborhood_slug) {
      results = results.filter((p) => p.neighborhood?.slug === filters.neighborhood_slug);
    }
    if (filters.query) {
      const q = filters.query.toLowerCase();
      results = results.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.neighborhood?.name.toLowerCase().includes(q) ||
          p.city.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q)
      );
    }

    return results;
  }
);

export const getPropertyByCode = cache(
  async (code: string): Promise<PropertyListing | null> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("properties")
      .select(PROPERTY_SELECT)
      .eq("code", code)
      .eq("is_published", true)
      .eq("status", "ativo")
      .maybeSingle();
    return data ? rowToListing(data) : null;
  }
);

export const getPropertyPhotos = cache(async (propertyId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("property_photos")
    .select("id, public_url, alt_text, is_cover, sort_order")
    .eq("property_id", propertyId)
    .order("is_cover", { ascending: false })
    .order("sort_order", { ascending: true });
  return data ?? [];
});

export interface NeighborhoodCard {
  neighborhood_slug: string;
  neighborhood_name: string;
  city_slug: string;
  city_name: string;
  city_uf: string;
  type_slug: string; // dominant type for SEO label
  type_label: string; // pluralized ("Casas", "Apartamentos", ...)
  count: number;
  cover_url: string | null;
}

const TYPE_PLURAL_LABEL: Record<string, string> = {
  casa: "Casas",
  apartamento: "Apartamentos",
  terreno: "Terrenos",
  chacara: "Chácaras",
  sitio: "Sítios",
  rancho: "Ranchos",
};

/**
 * Top neighborhoods by published-property count, with a representative photo.
 * Used by the "Imóveis mais buscados" carousel on the home.
 */
export const getTopNeighborhoodCards = cache(
  async (limit = 10): Promise<NeighborhoodCard[]> => {
    const properties = await listProperties();
    const map = new Map<string, NeighborhoodCard>();
    for (const p of properties) {
      if (!p.neighborhood) continue;
      const key = `${p.neighborhood.slug}__${p.type.slug}`;
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
        if (!existing.cover_url && p.cover_photo) {
          existing.cover_url = p.cover_photo.public_url;
        }
      } else {
        map.set(key, {
          neighborhood_slug: p.neighborhood.slug,
          neighborhood_name: p.neighborhood.name,
          city_slug: p.city.slug,
          city_name: p.city.name,
          city_uf: p.city.uf,
          type_slug: p.type.slug,
          type_label: TYPE_PLURAL_LABEL[p.type.slug] ?? "Imóveis",
          count: 1,
          cover_url: p.cover_photo?.public_url ?? null,
        });
      }
    }
    return Array.from(map.values())
      .filter((c) => c.cover_url)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }
);
