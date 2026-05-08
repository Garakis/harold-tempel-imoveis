import type { MetadataRoute } from "next";
import { listProperties } from "@/lib/domain/queries";
import { getPropertyUrl, MODALITY_SLUG } from "@/lib/domain/properties";

const PROPERTY_TYPES = ["casa", "apartamento", "terreno", "chacara", "sitio", "rancho"];
const MODALITIES = ["a-venda", "para-alugar"] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://harold-tempel-imoveis.vercel.app";
  const properties = await listProperties();
  const now = new Date();

  // Static institutional pages
  const staticUrls: MetadataRoute.Sitemap = [
    "",
    "/imoveis",
    "/imoveis/a-venda",
    "/imoveis/para-alugar",
    "/sobre",
    "/financiamento",
    "/fale-conosco",
    "/cadastre-seu-imovel",
    "/encomende-seu-imovel",
    "/politica-de-privacidade",
  ].map((p) => ({
    url: `${baseUrl}${p}`,
    lastModified: now,
    changeFrequency: p === "" ? ("daily" as const) : ("weekly" as const),
    priority: p === "" ? 1 : 0.8,
  }));

  // Type-level URLs (e.g. /imoveis/a-venda/casa)
  const typeUrls: MetadataRoute.Sitemap = [];
  for (const modality of MODALITIES) {
    for (const t of PROPERTY_TYPES) {
      typeUrls.push({
        url: `${baseUrl}/imoveis/${modality}/${t}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  }

  // Neighborhoods that have at least one published property
  const neighborhoodUrls: MetadataRoute.Sitemap = [];
  const seenNeighborhoods = new Set<string>();
  for (const p of properties) {
    if (!p.neighborhood?.slug) continue;
    const modality = MODALITY_SLUG[p.modality];
    const typeSlug = p.type.slug;
    const key = `${modality}/${typeSlug}/${p.neighborhood.slug}`;
    if (seenNeighborhoods.has(key)) continue;
    seenNeighborhoods.add(key);
    neighborhoodUrls.push({
      url: `${baseUrl}/imoveis/${key}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    });
  }

  // Individual property URLs
  const propertyUrls: MetadataRoute.Sitemap = properties.map((p) => ({
    url: `${baseUrl}${getPropertyUrl(p)}`,
    lastModified: p.last_published_at ? new Date(p.last_published_at) : now,
    changeFrequency: "weekly",
    priority: p.is_super_featured ? 0.9 : p.is_featured ? 0.8 : 0.7,
  }));

  return [...staticUrls, ...typeUrls, ...neighborhoodUrls, ...propertyUrls];
}
