/**
 * One-off script: for properties whose title doesn't carry the price,
 * fetch the original Kenlo page and extract the price from the page meta
 * or visible price card.
 *
 * Usage:  npx tsx scripts/update-prices/fetch-missing-prices.ts
 *
 * Reads target list from a hardcoded array (codes obtained via Supabase
 * query against rows where sale_price/rental_price are NULL and the title
 * doesn't match `R\$ \d+`).
 */
import { load } from "cheerio";
import { createClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(__dirname, "../../.env.local") });

const TARGETS: Array<{ code: string; slug: string; modality: "venda" | "aluguel" }> = [
  { code: "CA0007", slug: "casa-mococa-4-quartos-234-m", modality: "venda" },
  { code: "CA0009", slug: "casa-mococa-2-quartos-148-m", modality: "venda" },
  { code: "CA0015", slug: "casa-mococa-3-quartos-172-m", modality: "venda" },
  { code: "CA0019", slug: "casa-mococa-3-quartos-420-m", modality: "venda" },
  { code: "CA0026", slug: "casa-mococa-3-quartos-240-m", modality: "venda" },
  { code: "CA0031", slug: "casa-mococa-2-quartos-170-m", modality: "venda" },
  { code: "CA0032", slug: "casa-mococa-4-quartos-344-m", modality: "venda" },
  { code: "CA0033", slug: "casa-mococa-4-quartos-265-m", modality: "venda" },
  { code: "CA0034", slug: "casa-mococa-4-quartos-244-m", modality: "venda" },
  { code: "CA0037", slug: "casa-mococa-3-quartos-250-m", modality: "venda" },
  { code: "CA0038", slug: "casa-mococa-2-quartos-182-m", modality: "venda" },
  { code: "CA0039", slug: "casa-mococa-3-quartos-425-m", modality: "venda" },
  { code: "CH0002", slug: "chacara-mococa-3-quartos-5000-m", modality: "aluguel" },
  { code: "CH0004", slug: "chacara-mococa-3-quartos-4500-m", modality: "aluguel" },
  { code: "TE0001", slug: "terreno-mococa", modality: "venda" },
  { code: "TE0003", slug: "terreno-mococa", modality: "venda" },
  { code: "TE0004", slug: "terreno-mococa", modality: "venda" },
  { code: "TE0005", slug: "terreno-mococa", modality: "venda" },
];

const BASE = "https://www.haroldtempelimoveis.com.br";

interface Extracted {
  code: string;
  modality: "venda" | "aluguel";
  sale_price: number | null;
  rental_price: number | null;
  rental_period: "mensal" | "diaria" | "fim_semana" | null;
  source_text: string | null;
  raw_url: string;
}

function parseBRL(s: string): number | null {
  // "1.500.000" -> 1500000, "1.500,00" -> 1500
  const cleaned = s.replace(/\./g, "").replace(/,\d+$/, "");
  const n = parseInt(cleaned, 10);
  return Number.isFinite(n) ? n : null;
}

function extractFromHtml(html: string, modality: "venda" | "aluguel"): Pick<Extracted, "sale_price" | "rental_price" | "rental_period" | "source_text"> {
  const $ = load(html);
  const text = $("body").text().replace(/\s+/g, " ");

  // Look for "R$ N" optionally followed by ",NN" then a context word
  // We try labelled patterns first.
  const patterns: Array<{
    re: RegExp;
    bucket: "sale" | "rent_mes" | "rent_dia" | "rent_fds";
  }> = [
    { re: /Venda[^R]*R\$\s*([\d.]+)(?:,\d+)?/i, bucket: "sale" },
    { re: /[àa] venda por R\$\s*([\d.]+)(?:,\d+)?/i, bucket: "sale" },
    { re: /R\$\s*([\d.]+)(?:,\d+)?\s*\/m[êe]s/i, bucket: "rent_mes" },
    { re: /R\$\s*([\d.]+)(?:,\d+)?\s*\/dia/i, bucket: "rent_dia" },
    { re: /R\$\s*([\d.]+)(?:,\d+)?\s*\/fds/i, bucket: "rent_fds" },
    { re: /R\$\s*([\d.]+)(?:,\d+)?\s*\/fim de semana/i, bucket: "rent_fds" },
  ];

  let sale_price: number | null = null;
  let rental_price: number | null = null;
  let rental_period: "mensal" | "diaria" | "fim_semana" | null = null;
  let source: string | null = null;

  for (const { re, bucket } of patterns) {
    const m = text.match(re);
    if (!m) continue;
    const n = parseBRL(m[1]);
    if (n == null) continue;
    if (bucket === "sale" && sale_price == null) {
      sale_price = n;
      source = m[0];
    }
    if (bucket === "rent_mes" && rental_price == null) {
      rental_price = n;
      rental_period = "mensal";
      source = m[0];
    }
    if (bucket === "rent_dia" && rental_price == null) {
      rental_price = n;
      rental_period = "diaria";
      source = m[0];
    }
    if (bucket === "rent_fds" && rental_price == null) {
      rental_price = n;
      rental_period = "fim_semana";
      source = m[0];
    }
  }

  // Fallback: largest R$ value in text (for sales only)
  if (modality === "venda" && sale_price == null) {
    const allMatches = Array.from(text.matchAll(/R\$\s*([\d.]+)(?:,\d+)?/gi));
    const numbers = allMatches.map((m) => parseBRL(m[1])).filter((n): n is number => n != null);
    if (numbers.length > 0) {
      sale_price = Math.max(...numbers);
      source = "fallback:max R$";
    }
  }

  return { sale_price, rental_price, rental_period, source_text: source };
}

async function fetchOne(target: (typeof TARGETS)[number]): Promise<Extracted> {
  // The Kenlo URL appends -HAR5 suffix
  const url = `${BASE}/imovel/${target.slug}/${target.code}-HAR5?from=${target.modality === "venda" ? "sale" : "rent"}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36",
    },
  });
  if (!res.ok) {
    console.warn(`  ${target.code}: HTTP ${res.status} on ${url}`);
    return {
      code: target.code,
      modality: target.modality,
      sale_price: null,
      rental_price: null,
      rental_period: null,
      source_text: null,
      raw_url: url,
    };
  }
  const html = await res.text();
  const ex = extractFromHtml(html, target.modality);
  return {
    code: target.code,
    modality: target.modality,
    sale_price: ex.sale_price,
    rental_price: ex.rental_price,
    rental_period: ex.rental_period,
    source_text: ex.source_text,
    raw_url: url,
  };
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const results: Extracted[] = [];
  for (const t of TARGETS) {
    process.stdout.write(`  Scraping ${t.code}... `);
    try {
      const r = await fetchOne(t);
      results.push(r);
      console.log(
        r.sale_price
          ? `sale=${r.sale_price}`
          : r.rental_price
            ? `rental=${r.rental_price}/${r.rental_period}`
            : "MISSING"
      );
    } catch (err) {
      console.log(`ERROR: ${(err as Error).message}`);
    }
    // be nice to the origin
    await new Promise((r) => setTimeout(r, 400));
  }

  // Persist results
  console.log("\nApplying updates...");
  let applied = 0;
  for (const r of results) {
    if (!r.sale_price && !r.rental_price) continue;
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (r.sale_price) patch.sale_price = r.sale_price;
    if (r.rental_price) {
      patch.rental_price = r.rental_price;
      patch.rental_period = r.rental_period;
    }
    const { error } = await supabase.from("properties").update(patch).eq("code", r.code);
    if (error) {
      console.error(`  ${r.code}: update failed: ${error.message}`);
    } else {
      console.log(`  ${r.code}: ✓ ${JSON.stringify(patch)}`);
      applied += 1;
    }
  }

  // Report
  console.log(`\nDone. ${applied} / ${results.length} updated.`);
  const missing = results.filter((r) => !r.sale_price && !r.rental_price);
  if (missing.length > 0) {
    console.log(
      `\nStill missing prices for ${missing.length} properties (need manual entry):`
    );
    for (const m of missing) {
      console.log(`  ${m.code}  ${m.raw_url}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
