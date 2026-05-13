"use server";

import { revalidatePath } from "next/cache";
import sharp from "sharp";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { applyWatermark } from "@/lib/images/watermark";

const BUCKET = "property-photos";

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, userId: user.id };
}

interface UploadResult {
  ok: number;
  failed: number;
  errors: string[];
}

/**
 * Upload one or more photos to a property. Each file is:
 *  1. Loaded into memory (max 10MB enforced client-side)
 *  2. Resized to max 1920px width (preserves aspect)
 *  3. Watermarked with the gold HTI monogram
 *  4. Uploaded to Supabase Storage at `{CODE}/{NNN}.jpg`
 *  5. A property_photos row is inserted with public_url + sort_order
 */
export async function uploadPropertyPhotos(
  propertyId: string,
  formData: FormData
): Promise<UploadResult> {
  await requireAuth();
  const admin = createAdminClient();

  const { data: property } = await admin
    .from("properties")
    .select("code")
    .eq("id", propertyId)
    .single();
  if (!property) throw new Error("Imóvel não encontrado");

  // Find current max sort_order
  const { data: existingPhotos } = await admin
    .from("property_photos")
    .select("sort_order")
    .eq("property_id", propertyId)
    .order("sort_order", { ascending: false })
    .limit(1);
  let nextSort = (existingPhotos?.[0]?.sort_order ?? -1) + 1;

  const files = formData.getAll("files") as File[];
  const result: UploadResult = { ok: 0, failed: 0, errors: [] };

  for (const file of files) {
    if (!(file instanceof File) || file.size === 0) continue;
    try {
      const arrayBuffer = await file.arrayBuffer();
      const inputBuf = Buffer.from(arrayBuffer);

      // Resize to max 1920px width
      const resized = await sharp(inputBuf)
        .rotate() // honor EXIF
        .resize({ width: 1920, withoutEnlargement: true })
        .jpeg({ quality: 90, mozjpeg: true })
        .toBuffer();

      // Watermark
      const finalBuf = await applyWatermark(resized);

      const filename = `${String(nextSort).padStart(3, "0")}.jpg`;
      const storagePath = `${property.code}/${filename}`;

      const { error: upErr } = await admin.storage
        .from(BUCKET)
        .upload(storagePath, finalBuf, {
          contentType: "image/jpeg",
          cacheControl: "31536000",
          upsert: true,
        });
      if (upErr) throw upErr;

      const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(storagePath);

      const isFirstEver = nextSort === 0;
      const { error: insErr } = await admin.from("property_photos").insert({
        property_id: propertyId,
        storage_path: storagePath,
        public_url: pub.publicUrl,
        sort_order: nextSort,
        is_cover: isFirstEver, // first uploaded = cover by default
        alt_text: null,
      });
      if (insErr) throw insErr;

      nextSort += 1;
      result.ok += 1;
    } catch (err) {
      result.failed += 1;
      result.errors.push(
        `${file.name}: ${err instanceof Error ? err.message : "unknown error"}`
      );
    }
  }

  revalidatePath(`/admin/imoveis/${propertyId}`);
  revalidatePath("/admin/imoveis");
  revalidatePath("/");
  revalidatePath("/imoveis");
  return result;
}

/**
 * Delete a single photo (storage blob + db row).
 */
export async function deletePhoto(photoId: string, propertyId: string) {
  await requireAuth();
  const admin = createAdminClient();
  const { data: photo } = await admin
    .from("property_photos")
    .select("storage_path, is_cover")
    .eq("id", photoId)
    .single();
  if (!photo) return;

  if (photo.storage_path && !photo.storage_path.startsWith("kenlo:")) {
    await admin.storage.from(BUCKET).remove([photo.storage_path]);
  }
  await admin.from("property_photos").delete().eq("id", photoId);

  // If we deleted the cover, promote the next photo (lowest sort_order) to cover
  if (photo.is_cover) {
    const { data: candidate } = await admin
      .from("property_photos")
      .select("id")
      .eq("property_id", propertyId)
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (candidate) {
      await admin
        .from("property_photos")
        .update({ is_cover: true } as never)
        .eq("id", candidate.id);
    }
  }

  revalidatePath(`/admin/imoveis/${propertyId}`);
  revalidatePath("/admin/imoveis");
  revalidatePath("/");
  revalidatePath("/imoveis");
}

/**
 * Reorder photos: accepts an array of photo ids in the desired display order.
 */
export async function reorderPhotos(propertyId: string, orderedIds: string[]) {
  await requireAuth();
  const admin = createAdminClient();
  for (let i = 0; i < orderedIds.length; i++) {
    await admin
      .from("property_photos")
      .update({ sort_order: i } as never)
      .eq("id", orderedIds[i])
      .eq("property_id", propertyId);
  }
  revalidatePath(`/admin/imoveis/${propertyId}`);
  revalidatePath("/admin/imoveis");
  revalidatePath("/");
  revalidatePath("/imoveis");
}

/**
 * Set a specific photo as cover (and unset previous cover for this property).
 */
export async function setCoverPhoto(propertyId: string, photoId: string) {
  await requireAuth();
  const admin = createAdminClient();
  await admin
    .from("property_photos")
    .update({ is_cover: false } as never)
    .eq("property_id", propertyId);
  await admin
    .from("property_photos")
    .update({ is_cover: true } as never)
    .eq("id", photoId);
  revalidatePath(`/admin/imoveis/${propertyId}`);
  revalidatePath("/admin/imoveis");
  revalidatePath("/");
  revalidatePath("/imoveis");
}
