/**
 * Phase 2 — read JSON cache and upsert into Supabase.
 *
 *   npx tsx scripts/scrape-kenlo/import.ts
 *
 * Photos are stored as remote Kenlo URLs (no download). Migrate to Supabase
 * Storage with `download-photos.ts` before cancelling the Kenlo subscription.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import type { Database } from "../../src/lib/supabase/database.types";
import type { ScrapedProperty } from "./types";
import { buildPropertySlug } from "../../src/lib/domain/properties";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(SCRIPT_DIR, "cache");
const ENV_PATH = path.join(SCRIPT_DIR, "..", "..", ".env.local");

dotenv.config({ path: ENV_PATH });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
}

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function loadCache(): Promise<ScrapedProperty[]> {
  const files = await fs.readdir(CACHE_DIR);
  const jsons = files.filter((f) => f.endsWith(".json"));
  const out: ScrapedProperty[] = [];
  for (const f of jsons) {
    const content = await fs.readFile(path.join(CACHE_DIR, f), "utf8");
    out.push(JSON.parse(content));
  }
  return out;
}

async function getOrCreateCity(cityName: string, uf: string, slug: string) {
  const { data: existing } = await supabase
    .from("cities")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (existing) return existing.id;
  const { data, error } = await supabase
    .from("cities")
    .insert({ name: cityName, uf, slug })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

async function getOrCreateNeighborhood(
  cityId: string,
  name: string,
  slug: string
) {
  const { data: existing } = await supabase
    .from("neighborhoods")
    .select("id")
    .eq("city_id", cityId)
    .eq("slug", slug)
    .maybeSingle();
  if (existing) return existing.id;
  const { data, error } = await supabase
    .from("neighborhoods")
    .insert({ city_id: cityId, name, slug })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

async function getTypeId(slug: string): Promise<string> {
  const { data, error } = await supabase
    .from("property_types")
    .select("id")
    .eq("slug", slug)
    .single();
  if (error || !data) throw new Error(`Property type not found: ${slug}`);
  return data.id;
}

async function getPurposeId(slug: string): Promise<string> {
  const { data, error } = await supabase
    .from("property_purposes")
    .select("id")
    .eq("slug", slug)
    .single();
  if (error || !data) throw new Error(`Property purpose not found: ${slug}`);
  return data.id;
}

async function importProperty(p: ScrapedProperty) {
  // Resolve foreign keys
  const cityId = await getOrCreateCity(p.city_name, p.city_uf, p.city_slug);
  const neighborhoodId = p.neighborhood_name && p.neighborhood_slug
    ? await getOrCreateNeighborhood(cityId, p.neighborhood_name, p.neighborhood_slug)
    : null;
  const typeId = await getTypeId(p.type_slug);
  const purposeId = await getPurposeId(p.purpose_slug);

  // Build canonical slug for routing
  const canonicalSlug = buildPropertySlug({
    type: { slug: p.type_slug },
    city: { slug: p.city_slug },
    bedrooms: p.bedrooms,
    built_area_m2: p.built_area_m2,
    total_area_m2: p.total_area_m2,
  });

  // Upsert by code
  const { data: existing } = await supabase
    .from("properties")
    .select("id")
    .eq("code", p.code)
    .maybeSingle();

  const propertyData = {
    code: p.code,
    slug: canonicalSlug || p.slug || p.code.toLowerCase(),
    type_id: typeId,
    purpose_id: purposeId,
    modality: p.modality === "venda" ? ("venda" as const) : ("aluguel" as const),
    status: "ativo" as const,
    city_id: cityId,
    neighborhood_id: neighborhoodId,
    street: p.street,
    number: p.number,
    bedrooms: p.bedrooms,
    suites: p.suites,
    bathrooms: p.bathrooms,
    parking_spaces: p.parking_spaces,
    built_area_m2: p.built_area_m2,
    total_area_m2: p.total_area_m2,
    useful_area_m2: p.useful_area_m2,
    sale_price: p.sale_price,
    rental_price: p.rental_price,
    accepts_pet: p.accepts_pet,
    accepts_financing: p.accepts_financing ?? false,
    title: p.title,
    description: p.description,
    features: p.features,
    is_published: true,
    last_published_at: new Date().toISOString(),
  };

  let propertyId: string;
  if (existing) {
    const { data, error } = await supabase
      .from("properties")
      .update(propertyData)
      .eq("id", existing.id)
      .select("id")
      .single();
    if (error) throw error;
    propertyId = data.id;
    // Wipe old photos to re-import clean
    await supabase.from("property_photos").delete().eq("property_id", propertyId);
  } else {
    const { data, error } = await supabase
      .from("properties")
      .insert(propertyData)
      .select("id")
      .single();
    if (error) throw error;
    propertyId = data.id;
  }

  // Insert photos
  const photoRows = p.photo_urls.map((url, idx) => ({
    property_id: propertyId,
    storage_path: `kenlo:${p.code}:${idx}`, // marker so we know it's still on Kenlo
    public_url: url,
    sort_order: idx,
    is_cover: idx === 0,
    alt_text: p.title,
    watermarked: true, // Kenlo's photos already have watermark baked in
  }));
  if (photoRows.length > 0) {
    const { error } = await supabase.from("property_photos").insert(photoRows);
    if (error) throw error;
  }
}

async function main() {
  console.log("Loading cache…");
  const properties = await loadCache();
  console.log(`Loaded ${properties.length} properties from cache.\n`);

  let ok = 0;
  let failed = 0;
  for (const p of properties) {
    try {
      await importProperty(p);
      console.log(
        `  ✓ ${p.code} ${p.type_name} — ${p.neighborhood_name ?? "—"} (${p.photo_urls.length} fotos)`
      );
      ok++;
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e);
      console.error(`  ✗ ${p.code}: ${err}`);
      failed++;
    }
  }

  console.log(`\nDone. ${ok} imported, ${failed} failed.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
