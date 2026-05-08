/**
 * Migration phase: download every property photo from kenlo.io and re-upload
 * to Supabase Storage so the site keeps working after the Kenlo subscription
 * is cancelled.
 *
 *   npx tsx scripts/migrate-photos/download-photos.ts
 *
 * Idempotent: only processes rows whose storage_path still begins with "kenlo:".
 * Run as many times as you want until all rows are migrated.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import type { Database } from "../../src/lib/supabase/database.types";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.join(SCRIPT_DIR, "..", "..", ".env.local");
dotenv.config({ path: ENV_PATH });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BUCKET = "property-photos";
const CONCURRENCY = 5;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

interface Job {
  id: string;
  property_id: string;
  property_code: string;
  storage_path: string;
  public_url: string;
  sort_order: number;
}

async function fetchPendingJobs(): Promise<Job[]> {
  const { data, error } = await supabase
    .from("property_photos")
    .select(
      `id, property_id, storage_path, public_url, sort_order,
       property:properties ( code )`
    )
    .like("storage_path", "kenlo:%")
    .order("property_id", { ascending: true })
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    property_id: r.property_id,
    // @ts-expect-error relational
    property_code: r.property?.code ?? "UNKNOWN",
    storage_path: r.storage_path,
    public_url: r.public_url,
    sort_order: r.sort_order,
  }));
}

async function processJob(job: Job): Promise<{ ok: boolean; error?: string }> {
  try {
    // Download original image from Kenlo
    const res = await fetch(job.public_url);
    if (!res.ok) {
      return { ok: false, error: `download ${res.status}` };
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    const ext =
      contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";

    // Upload to Supabase Storage
    const targetPath = `${job.property_code}/${String(job.sort_order).padStart(3, "0")}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(targetPath, buffer, {
        contentType,
        upsert: true,
      });
    if (uploadError) return { ok: false, error: `upload: ${uploadError.message}` };

    // Build public URL
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(targetPath);
    const publicUrl = urlData.publicUrl;

    // Update DB row
    const { error: updateError } = await supabase
      .from("property_photos")
      .update({
        storage_path: targetPath,
        public_url: publicUrl,
        size_bytes: buffer.length,
      })
      .eq("id", job.id);
    if (updateError) return { ok: false, error: `db: ${updateError.message}` };

    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

async function main() {
  console.log("Loading pending photos…");
  const jobs = await fetchPendingJobs();
  console.log(`${jobs.length} photos to migrate.\n`);
  if (jobs.length === 0) {
    console.log("Nothing to do — all photos already on Supabase Storage.");
    return;
  }

  let ok = 0;
  let failed = 0;
  const queue = [...jobs];

  async function worker(id: number) {
    while (queue.length > 0) {
      const job = queue.shift()!;
      const result = await processJob(job);
      if (result.ok) {
        ok++;
        console.log(
          `  ✓ [${ok}/${jobs.length}] ${job.property_code} #${String(job.sort_order).padStart(3, "0")}`
        );
      } else {
        failed++;
        console.error(
          `  ✗ ${job.property_code} #${job.sort_order}: ${result.error}`
        );
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, (_, i) => worker(i)));

  console.log(`\nDone. ${ok} migrated, ${failed} failed.`);
  if (failed > 0) {
    console.log("Run the script again to retry failed photos.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

void fs;
