/**
 * Phase 1 — scrape every public property URL and cache parsed JSON locally.
 *
 *   npx tsx scripts/scrape-kenlo/scrape-all.ts
 *
 * Output: scripts/scrape-kenlo/cache/{CODE}.json
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { listAllPropertyUrls } from "./list";
import { fetchProperty } from "./parse";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(SCRIPT_DIR, "cache");

async function ensureDir(p: string) {
  await fs.mkdir(p, { recursive: true });
}

async function main() {
  await ensureDir(CACHE_DIR);

  console.log("Discovering property URLs…");
  const urls = await listAllPropertyUrls();
  console.log(`Found ${urls.length} properties.\n`);

  const concurrency = 4;
  const queue = [...urls];
  const results: Array<{ code: string; ok: boolean; error?: string }> = [];

  async function worker() {
    while (queue.length > 0) {
      const item = queue.shift()!;
      try {
        const property = await fetchProperty(item.url, item.modality);
        const file = path.join(CACHE_DIR, `${property.code}.json`);
        await fs.writeFile(file, JSON.stringify(property, null, 2), "utf8");
        results.push({ code: property.code, ok: true });
        console.log(
          `  ✓ ${property.code} ${property.type_name} ${property.neighborhood_name ?? "—"} ${property.city_name}/${property.city_uf} (${property.photo_urls.length} fotos, ${Object.keys(property.features).length} features)`
        );
      } catch (e) {
        const err = e instanceof Error ? e.message : String(e);
        results.push({ code: item.url, ok: false, error: err });
        console.error(`  ✗ ${item.url}: ${err}`);
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));

  const ok = results.filter((r) => r.ok).length;
  const failed = results.length - ok;
  console.log(`\nDone. ${ok} ok, ${failed} failed.`);
  console.log(`JSON cache: ${CACHE_DIR}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
