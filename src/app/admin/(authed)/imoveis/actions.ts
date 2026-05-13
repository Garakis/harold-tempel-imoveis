"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildPropertySlug,
  generateNextCode,
  getCodePrefix,
} from "@/lib/domain/properties";
import { slugify } from "@/lib/utils";
import type { Database } from "@/lib/supabase/database.types";

type Modality = Database["public"]["Enums"]["property_modality"];
type Status = Database["public"]["Enums"]["property_status"];

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, userId: user.id };
}

function clean(v: FormDataEntryValue | null): string {
  return String(v ?? "").trim();
}

function num(v: FormDataEntryValue | null): number | null {
  const s = clean(v).replace(/[^\d.,-]/g, "").replace(/\./g, "").replace(/,/g, ".");
  if (!s) return null;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

function int(v: FormDataEntryValue | null): number {
  const s = clean(v).replace(/\D/g, "");
  if (!s) return 0;
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : 0;
}

function bool(v: FormDataEntryValue | null): boolean {
  return clean(v) === "on" || clean(v) === "true";
}

/**
 * Find or create a neighborhood by name (within a city). Returns the id.
 */
async function ensureNeighborhood(
  admin: ReturnType<typeof createAdminClient>,
  cityId: string,
  name: string
): Promise<string | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const slug = slugify(trimmed);
  const { data: existing } = await admin
    .from("neighborhoods")
    .select("id")
    .eq("city_id", cityId)
    .eq("slug", slug)
    .maybeSingle();
  if (existing) return existing.id;
  const { data, error } = await admin
    .from("neighborhoods")
    .insert({ city_id: cityId, name: trimmed, slug })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

/**
 * Build the features JSONB blob from form fields prefixed with `feature_`.
 * E.g. `feature_piscina=on` → { piscina: true }
 */
function extractFeatures(formData: FormData): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("feature_")) continue;
    const slug = key.slice("feature_".length);
    if (bool(value)) out[slug] = true;
  }
  return out;
}

interface PropertyPayload {
  // taxonomy
  type_id: string;
  purpose_id: string | null;
  city_id: string;
  neighborhood_id: string | null;
  owner_id: string | null;

  // commercial
  modality: Modality;
  status: Status;
  is_published: boolean;
  is_featured: boolean;
  is_super_featured: boolean;

  sale_price: number | null;
  rental_price: number | null;
  rental_period: string | null;
  condo_fee: number | null;
  iptu_yearly: number | null;
  accepts_pet: boolean;
  accepts_financing: boolean;
  accepts_exchange: boolean;

  // metrics
  bedrooms: number;
  suites: number;
  bathrooms: number;
  parking_spaces: number;
  built_area_m2: number | null;
  total_area_m2: number | null;
  useful_area_m2: number | null;

  // address
  street: string | null;
  number: string | null;
  complement: string | null;
  cep: string | null;
  reference_point: string | null;
  hide_address: boolean;

  // listing
  title: string | null;
  description: string | null;
  internal_notes: string | null;
  features: Record<string, boolean>;
  rural_features: Record<string, boolean>;

  meta_title: string | null;
  meta_description: string | null;
}

function buildPayload(
  formData: FormData,
  resolved: { neighborhoodId: string | null }
): PropertyPayload {
  return {
    type_id: clean(formData.get("type_id")),
    purpose_id: clean(formData.get("purpose_id")) || null,
    city_id: clean(formData.get("city_id")),
    neighborhood_id: resolved.neighborhoodId,
    owner_id: clean(formData.get("owner_id")) || null,

    modality: (clean(formData.get("modality")) as Modality) || "venda",
    status: (clean(formData.get("status")) as Status) || "rascunho",
    is_published: bool(formData.get("is_published")),
    is_featured: bool(formData.get("is_featured")),
    is_super_featured: bool(formData.get("is_super_featured")),

    sale_price: num(formData.get("sale_price")),
    rental_price: num(formData.get("rental_price")),
    rental_period: clean(formData.get("rental_period")) || null,
    condo_fee: num(formData.get("condo_fee")),
    iptu_yearly: num(formData.get("iptu_yearly")),
    accepts_pet: bool(formData.get("accepts_pet")),
    accepts_financing: bool(formData.get("accepts_financing")),
    accepts_exchange: bool(formData.get("accepts_exchange")),

    bedrooms: int(formData.get("bedrooms")),
    suites: int(formData.get("suites")),
    bathrooms: int(formData.get("bathrooms")),
    parking_spaces: int(formData.get("parking_spaces")),
    built_area_m2: num(formData.get("built_area_m2")),
    total_area_m2: num(formData.get("total_area_m2")),
    useful_area_m2: num(formData.get("useful_area_m2")),

    street: clean(formData.get("street")) || null,
    number: clean(formData.get("number")) || null,
    complement: clean(formData.get("complement")) || null,
    cep: clean(formData.get("cep")) || null,
    reference_point: clean(formData.get("reference_point")) || null,
    hide_address: bool(formData.get("hide_address")),

    title: clean(formData.get("title")) || null,
    description: clean(formData.get("description")) || null,
    internal_notes: clean(formData.get("internal_notes")) || null,
    features: extractFeatures(formData),
    rural_features: {},

    meta_title: clean(formData.get("meta_title")) || null,
    meta_description: clean(formData.get("meta_description")) || null,
  };
}

interface ResolveCtxArgs {
  type_id: string;
  city_id: string;
  neighborhood_name: string;
  bedrooms: number;
  built_area_m2: number | null;
  total_area_m2: number | null;
}

async function resolveTaxonomy(
  admin: ReturnType<typeof createAdminClient>,
  args: ResolveCtxArgs
): Promise<{
  typeSlug: string;
  citySlug: string;
  neighborhoodId: string | null;
  slug: string;
}> {
  const [{ data: type }, { data: city }] = await Promise.all([
    admin.from("property_types").select("slug, name").eq("id", args.type_id).single(),
    admin.from("cities").select("slug, name").eq("id", args.city_id).single(),
  ]);
  if (!type) throw new Error("Tipo de imóvel inválido");
  if (!city) throw new Error("Cidade inválida");
  const neighborhoodId = await ensureNeighborhood(
    admin,
    args.city_id,
    args.neighborhood_name
  );
  const slug = buildPropertySlug({
    type: { slug: type.slug },
    city: { slug: city.slug },
    bedrooms: args.bedrooms,
    built_area_m2: args.built_area_m2,
    total_area_m2: args.total_area_m2,
  });
  return { typeSlug: type.slug, citySlug: city.slug, neighborhoodId, slug };
}

/**
 * Create a new property. Auto-generates code from type prefix.
 */
export async function createProperty(formData: FormData) {
  const { userId } = await requireAuth();
  const admin = createAdminClient();

  const type_id = clean(formData.get("type_id"));
  const city_id = clean(formData.get("city_id"));
  const neighborhood_name = clean(formData.get("neighborhood_name"));
  if (!type_id) throw new Error("Selecione o tipo do imóvel");
  if (!city_id) throw new Error("Selecione a cidade");

  const tax = await resolveTaxonomy(admin, {
    type_id,
    city_id,
    neighborhood_name,
    bedrooms: int(formData.get("bedrooms")),
    built_area_m2: num(formData.get("built_area_m2")),
    total_area_m2: num(formData.get("total_area_m2")),
  });

  // Generate next sequential code for this type
  const { data: existing } = await admin
    .from("properties")
    .select("code")
    .like("code", `${getCodePrefix(tax.typeSlug)}%`);
  const code = generateNextCode(
    tax.typeSlug,
    (existing ?? []).map((r) => r.code)
  );

  const payload = buildPayload(formData, { neighborhoodId: tax.neighborhoodId });

  const insertPayload: Record<string, unknown> = {
    ...payload,
    code,
    slug: tax.slug,
    features: payload.features as never,
    rural_features: payload.rural_features as never,
    created_by: userId,
    updated_by: userId,
    last_published_at: payload.is_published ? new Date().toISOString() : null,
  };

  const { data: inserted, error } = await admin
    .from("properties")
    .insert(insertPayload as never)
    .select("id")
    .single();
  if (error) throw error;

  revalidatePath("/admin/imoveis");
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/imoveis");
  redirect(`/admin/imoveis/${inserted.id}?ok=created`);
}

/**
 * Update an existing property.
 */
export async function updateProperty(id: string, formData: FormData) {
  const { userId } = await requireAuth();
  const admin = createAdminClient();

  const type_id = clean(formData.get("type_id"));
  const city_id = clean(formData.get("city_id"));
  const neighborhood_name = clean(formData.get("neighborhood_name"));
  if (!type_id) throw new Error("Selecione o tipo do imóvel");
  if (!city_id) throw new Error("Selecione a cidade");

  const tax = await resolveTaxonomy(admin, {
    type_id,
    city_id,
    neighborhood_name,
    bedrooms: int(formData.get("bedrooms")),
    built_area_m2: num(formData.get("built_area_m2")),
    total_area_m2: num(formData.get("total_area_m2")),
  });

  const payload = buildPayload(formData, { neighborhoodId: tax.neighborhoodId });

  const { data: current } = await admin
    .from("properties")
    .select("is_published, last_published_at")
    .eq("id", id)
    .single();

  const updatePayload: Record<string, unknown> = {
    ...payload,
    slug: tax.slug,
    features: payload.features as never,
    rural_features: payload.rural_features as never,
    updated_by: userId,
    last_published_at:
      payload.is_published && !current?.is_published
        ? new Date().toISOString()
        : current?.last_published_at ?? null,
  };

  const { error } = await admin
    .from("properties")
    .update(updatePayload as never)
    .eq("id", id);
  if (error) throw error;

  revalidatePath(`/admin/imoveis/${id}`);
  revalidatePath("/admin/imoveis");
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/imoveis");

  redirect(`/admin/imoveis/${id}?ok=updated`);
}

/**
 * Quick toggle for is_published from the listing page.
 */
export async function togglePublish(id: string, next: boolean) {
  const { userId } = await requireAuth();
  const admin = createAdminClient();
  await admin
    .from("properties")
    .update({
      is_published: next,
      last_published_at: next ? new Date().toISOString() : null,
      updated_by: userId,
    } as never)
    .eq("id", id);
  revalidatePath("/admin/imoveis");
  revalidatePath(`/admin/imoveis/${id}`);
  revalidatePath("/");
  revalidatePath("/imoveis");
}

/**
 * Delete a property and all its photos (storage objects + DB rows).
 */
export async function deleteProperty(id: string) {
  await requireAuth();
  const admin = createAdminClient();

  // Fetch storage paths so we can remove blobs
  const { data: photos } = await admin
    .from("property_photos")
    .select("storage_path")
    .eq("property_id", id);

  const storagePaths = (photos ?? [])
    .map((p) => p.storage_path)
    .filter((s): s is string => !!s && !s.startsWith("kenlo:"));

  if (storagePaths.length > 0) {
    await admin.storage.from("property-photos").remove(storagePaths);
  }

  const { error } = await admin.from("properties").delete().eq("id", id);
  if (error) throw error;

  revalidatePath("/admin/imoveis");
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/imoveis");
  redirect("/admin/imoveis?ok=deleted");
}
