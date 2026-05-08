import { load } from "cheerio";

const BASE = "https://www.haroldtempelimoveis.com.br";

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    },
  });
  if (!res.ok) throw new Error(`Fetch ${url} failed: ${res.status}`);
  return await res.text();
}

/**
 * Parses the sitemap index and child sitemaps to enumerate every property URL.
 */
export async function listAllPropertyUrls(): Promise<
  Array<{ url: string; modality: "venda" | "aluguel" }>
> {
  const indexXml = await fetchHtml(`${BASE}/sitemap.xml`);
  const $ = load(indexXml, { xmlMode: true });
  const childSitemaps = $("sitemap > loc")
    .map((_, el) => $(el).text().trim())
    .get()
    .filter((u) => u.includes("/imoveis/"));

  const urls: Array<{ url: string; modality: "venda" | "aluguel" }> = [];

  for (const childUrl of childSitemaps) {
    const xml = await fetchHtml(childUrl);
    const $$ = load(xml, { xmlMode: true });
    const modality: "venda" | "aluguel" = childUrl.includes("/a-venda/")
      ? "venda"
      : "aluguel";
    $$("url > loc").each((_, el) => {
      const u = $$(el).text().trim();
      // The sitemap entries are listing URLs, but we need /imovel/{slug}/{code} URLs.
      // Some sitemaps may contain individual property URLs; collect all.
      if (u.includes("/imovel/")) {
        urls.push({ url: u, modality });
      }
    });
  }

  // Fallback: if the property URLs aren't in sitemaps, scrape the listing pages.
  if (urls.length === 0) {
    for (const m of [
      { path: "/imoveis/a-venda", modality: "venda" as const },
      { path: "/imoveis/para-alugar", modality: "aluguel" as const },
    ]) {
      const html = await fetchHtml(`${BASE}${m.path}`);
      const $$ = load(html);
      $$("a[href*='/imovel/']").each((_, el) => {
        const href = $$(el).attr("href");
        if (href) {
          const url = href.startsWith("http") ? href : `${BASE}${href}`;
          urls.push({ url, modality: m.modality });
        }
      });
    }
  }

  // Deduplicate by URL (without query string).
  const seen = new Set<string>();
  const out: Array<{ url: string; modality: "venda" | "aluguel" }> = [];
  for (const item of urls) {
    const key = item.url.split("?")[0];
    if (!seen.has(key)) {
      seen.add(key);
      out.push({ ...item, url: key });
    }
  }
  return out;
}
