/**
 * Optional batch script: re-apply the NEW Harold Tempel Imóveis watermark to
 * every photo in Supabase Storage.
 *
 *   npx tsx scripts/apply-watermark/apply-watermark-batch.ts          # process all
 *   npx tsx scripts/apply-watermark/apply-watermark-batch.ts CA0034   # one property
 *
 * Warning: photos imported from Kenlo already have a watermark baked in. Running
 * this will composite OUR new watermark ON TOP, producing two watermarks. Use
 * only after you have replaced the underlying photos with unwatermarked originals.
 *
 * For the recommended workflow, just call `applyWatermark()` from
 * `src/lib/images/watermark.ts` inside the admin's photo upload server action.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import type { Database } from "../../src/lib/supabase/database.types";
import { applyWatermark } from "../../src/lib/images/watermark";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.join(SCRIPT_DIR, "..", "..", ".env.local");
dotenv.config({ path: ENV_PATH });

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const BUCKET = "property-photos";
const CONCURRENCY = 4;

async function processOne(
  photoId: string,
  storagePath: string,
  publicUrl: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    // Download
    const res = await fetch(publicUrl);
    if (!res.ok) return { ok: false, error: `download ${res.status}` };
    const buf = Buffer.from(await res.arrayBuffer());

    // Apply watermark
    const watermarked = await applyWatermark(buf);

    // Re-upload (overwrite)
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, watermarked, {
        contentType: "image/jpeg",
        upsert: true,
      });
    if (uploadError) return { ok: false, error: `upload: ${uploadError.message}` };

    // Update DB row
    await supabase
      .from("property_photos")
      .update({ size_bytes: watermarked.length, watermarked: true })
      .eq("id", photoId);

    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

async function main() {
  const filterCode = process.argv[2];

  let query = supabase
    .from("property_photos")
    .select(
      `id, storage_path, public_url, property:properties ( code )`
    )
    .not("storage_path", "like", "kenlo:%");
  // Filter to a specific property code if provided
  if (filterCode) {
    const { data: prop } = await supabase
      .from("properties")
      .select("id")
      .eq("code", filterCode)
      .maybeSingle();
    if (!prop) throw new Error(`Property ${filterCode} not found`);
    query = query.eq("property_id", prop.id);
  }

  const { data, error } = await query;
  if (error) throw error;
  const jobs = data ?? [];
  console.log(`${jobs.length} photos to watermark.\n`);

  let ok = 0;
  let failed = 0;
  const queue = [...jobs];

  async function worker() {
    while (queue.length > 0) {
      const job = queue.shift()!;
      const result = await processOne(job.id, job.storage_path, job.public_url);
      if (result.ok) {
        ok++;
        // @ts-expect-error - relational
        const code = job.property?.code ?? "—";
        console.log(`  ✓ [${ok}/${jobs.length}] ${code} ${job.storage_path}`);
      } else {
        failed++;
        console.error(`  ✗ ${job.storage_path}: ${result.error}`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log(`\nDone. ${ok} watermarked, ${failed} failed.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
