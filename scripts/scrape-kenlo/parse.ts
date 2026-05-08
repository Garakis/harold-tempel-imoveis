import { load, type CheerioAPI, type Cheerio } from "cheerio";
import type { Element } from "domhandler";
import type { ScrapedProperty, Modality } from "./types";

const TYPE_SLUG_MAP: Record<string, { slug: string; name: string }> = {
  casa: { slug: "casa", name: "Casa" },
  apartamento: { slug: "apartamento", name: "Apartamento" },
  terreno: { slug: "terreno", name: "Terreno" },
  chacara: { slug: "chacara", name: "Chácara" },
  sitio: { slug: "sitio", name: "Sítio" },
  rancho: { slug: "rancho", name: "Rancho" },
};

const FEATURE_SLUG_MAP: Record<string, string> = {
  "agua": "agua",
  "alarme": "alarme",
  "aquecimento solar": "aquecimento_solar",
  "ar condicionado": "ar_condicionado",
  "area de servico": "area_de_servico",
  "armario banheiro": "armario_banheiro",
  "armario cozinha": "armario_cozinha",
  "armario escritorio": "armario_escritorio",
  "armario quarto": "armario_quarto",
  "armario sala": "armario_sala",
  "armario closet": "armario_closet",
  "armario corredor": "armario_corredor",
  "armario dormitorio de empregada": "armario_dormitorio_empregada",
  "armario area de servico": "armario_area_de_servico",
  "banheiro de empregada": "banheiro_empregada",
  "churrasqueira": "churrasqueira",
  "copa": "copa",
  "cozinha": "cozinha",
  "despensa": "despensa",
  "edicula": "edicula",
  "elevador": "elevador",
  "energia eletrica": "energia_eletrica",
  "energia": "energia_eletrica",
  "escritorio": "escritorio",
  "esgoto": "esgoto",
  "hidromassagem": "hidromassagem",
  "interfone": "interfone",
  "lavabo": "lavabo",
  "lavanderia": "lavanderia",
  "mezanino": "mezanino",
  "mobiliado": "mobiliado",
  "piscina": "piscina",
  "piso ceramico": "piso_ceramico",
  "piso de granito": "piso_granito",
  "piso de marmore": "piso_marmore",
  "piso de ardosia": "piso_ardosia",
  "porcelanato": "porcelanato",
  "taco de madeira": "taco_madeira",
  "portao eletronico": "portao_eletronico",
  "quintal": "quintal",
  "sacada": "sacada",
  "solarium": "solarium",
  "varanda": "varanda",
  "varanda gourmet": "varanda_gourmet",
  "acude": "acude",
  "aceita financiamento": "aceita_financiamento",
  "aceita permuta": "aceita_permuta",
  "campo de futebol": "campo_futebol",
  "caseiro": "caseiro",
  "cerca": "cerca",
  "curral": "curral",
  "dormitorio de empregada": "dormitorio_empregada",
  "granja": "granja",
  "lago": "lago",
  "maquinario": "maquinario",
  "pastagem": "pastagem",
  "pecuaria": "pecuaria",
  "poco artesiano": "poco_artesiano",
  "pomar": "pomar",
  "quadra poliesportiva": "quadra_poliesportiva",
  "reserva local": "reserva_legal",
  "rio": "rio",
  "sem condominio": "sem_condominio",
  "tanque de peixe": "tanque_peixe",
};

function parseNumber(s: string | undefined | null): number | null {
  if (!s) return null;
  const cleaned = s
    .replace(/[^\d,.\-]/g, "")
    .replace(/\./g, "")
    .replace(/,/g, ".")
    .trim();
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

function featureToSlug(label: string): string | null {
  const normalized = normalize(label);
  if (FEATURE_SLUG_MAP[normalized]) return FEATURE_SLUG_MAP[normalized];
  // Fallback: slugify directly
  const slug = normalized.replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  return slug || null;
}

function slugify(s: string): string {
  return normalize(s)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Find the element with the given exact heading text inside `$`,
 * then return that heading and its parent block.
 */
function findHeading(
  $: CheerioAPI,
  text: string
): { heading: Cheerio<Element>; parent: Cheerio<Element> } | null {
  const heading = $("*")
    .filter((_, el) => $(el).children().length === 0 && $(el).text().trim() === text)
    .first() as Cheerio<Element>;
  if (heading.length === 0) return null;
  return { heading, parent: heading.parent() as unknown as Cheerio<Element> };
}

/**
 * For data rows like:
 *   <p>Quartos</p>
 *   <p>4</p>
 * find the value paragraph immediately following a label paragraph.
 */
function findValueAfterLabel($: CheerioAPI, label: string): string | null {
  let result: string | null = null;
  $("p, span, dt, div, h3, h4, label").each((_, el) => {
    if (result) return false;
    const $el = $(el);
    const t = $el.clone().children().remove().end().text().trim();
    if (t === label) {
      // Find first non-label sibling text
      let sibling = $el[0]?.nextSibling;
      while (sibling) {
        const $s = $(sibling);
        if (sibling.type === "tag") {
          const v = $s.text().trim();
          if (v && v !== label) {
            result = v;
            return false;
          }
        } else if (sibling.type === "text") {
          const v = (sibling as any).data.trim();
          if (v && v !== label) {
            result = v;
            return false;
          }
        }
        sibling = (sibling as any).nextSibling;
      }
    }
  });
  return result;
}

export function parsePropertyHtml(
  html: string,
  sourceUrl: string,
  modality: Modality
): ScrapedProperty {
  const $ = load(html);

  // Title from h1
  const title = $("h1").first().text().trim() || null;

  // Code from breadcrumb badge or title — look for pattern XX0000-XXX
  const codeMatch = $("body")
    .text()
    .match(/\b([A-Z]{2}\d{3,4})(-[A-Z0-9]+)?/);
  const code = codeMatch ? codeMatch[1] : "";

  // Type — use the code prefix as the source of truth (CA=casa, CH=chacara, …)
  const CODE_PREFIX_TO_TYPE: Record<string, string> = {
    CA: "casa",
    AP: "apartamento",
    TE: "terreno",
    CH: "chacara",
    SI: "sitio",
    RA: "rancho",
  };
  const codePrefix = code.slice(0, 2);
  let typeSlug = CODE_PREFIX_TO_TYPE[codePrefix] ?? "casa";
  // Fallback to title if code prefix is unknown
  if (!CODE_PREFIX_TO_TYPE[codePrefix]) {
    const titleLower = (title ?? "").toLowerCase();
    for (const k of Object.keys(TYPE_SLUG_MAP)) {
      if (titleLower.includes(k)) {
        typeSlug = k;
        break;
      }
    }
  }
  const typeInfo = TYPE_SLUG_MAP[typeSlug];

  // Location parsed from title: "Casa com 4 dormitórios à venda - Centro - Mococa/SP"
  // Sometimes the neighborhood is missing: "Casa com 3 dormitórios à venda - Mococa/SP"
  let neighborhoodName: string | null = null;
  let cityName = "Mococa";
  let cityUf = "SP";

  if (title) {
    // Try with neighborhood: "... - {neighborhood} - {city}/{UF}"
    const withNbhd = title.match(/-\s*([^-/\n]+?)\s*-\s*([^/\n]+?)\/(\w{2})\s*$/);
    if (withNbhd) {
      neighborhoodName = withNbhd[1].trim();
      cityName = withNbhd[2].trim();
      cityUf = withNbhd[3].trim().toUpperCase();
    } else {
      // No neighborhood: "... - {city}/{UF}"
      const cityOnly = title.match(/-\s*([^-/\n]+?)\/(\w{2})\s*$/);
      if (cityOnly) {
        cityName = cityOnly[1].trim();
        cityUf = cityOnly[2].trim().toUpperCase();
      }
    }
  }

  // Slug from URL path
  const urlMatch = sourceUrl.match(/\/imovel\/([^/]+)\/([^/?]+)/);
  const slug = urlMatch ? urlMatch[1] : "";

  // Metrics — found via label-then-value pairs
  const bedrooms = parseInt(findValueAfterLabel($, "Quartos") ?? "0", 10) || 0;
  const suites = parseInt(findValueAfterLabel($, "Suítes") ?? "0", 10) || 0;
  const bathrooms = parseInt(findValueAfterLabel($, "Banheiros") ?? "0", 10) || 0;
  const parkingSpaces = parseInt(findValueAfterLabel($, "Vagas") ?? "0", 10) || 0;
  const builtArea = parseNumber(findValueAfterLabel($, "Área construída"));
  const totalArea = parseNumber(findValueAfterLabel($, "Área do terreno"));
  const usefulArea = parseNumber(findValueAfterLabel($, "Área útil"));

  const petText = findValueAfterLabel($, "Aceita pet");
  const acceptsPet =
    petText == null
      ? null
      : /^sim/i.test(petText)
      ? true
      : /^n[ãa]o/i.test(petText)
      ? false
      : null;

  // Price: scan for "R$ " followed by number; correlate with "Venda" / "Aluguel" labels
  let salePrice: number | null = null;
  let rentalPrice: number | null = null;
  $("body *").each((_, el) => {
    const $el = $(el);
    if ($el.children().length > 0) return; // leaves only
    const t = $el.text().trim();
    const m = t.match(/^R\$\s*([\d\.,]+)/);
    if (!m) return;
    const value = parseNumber(m[1]);
    if (value == null) return;
    // Find label by walking up to a parent that contains "Venda" or "Aluguel"
    const ancestorText = $el.parent().text();
    if (/Venda/i.test(ancestorText) && salePrice == null) salePrice = value;
    else if (/Aluguel|Loca[çc][ãa]o/i.test(ancestorText) && rentalPrice == null) rentalPrice = value;
  });

  // Description: look for h2/h3 "Descrição" → next paragraph
  let description: string | null = null;
  const descHeading = findHeading($, "Descrição");
  if (descHeading) {
    // Look at parent's children, find paragraphs after the heading
    const parts: string[] = [];
    let started = false;
    descHeading.parent.children().each((_, el) => {
      if (el === descHeading.heading[0]) {
        started = true;
        return;
      }
      if (!started) return;
      const $el = $(el);
      const t = $el.text().trim();
      if (!t || t === "Ver mais" || t === "Ver menos") return;
      parts.push(t);
    });
    description = parts.join(" ").trim() || null;
    if (description) {
      description = description.replace(/\s*Ver (?:mais|menos)\s*$/i, "").trim();
    }
  }

  // Features: <h2>Características</h2> followed by <p>feature name</p> entries
  const features: Record<string, boolean> = {};
  const featuresHeading = findHeading($, "Características");
  if (featuresHeading) {
    featuresHeading.parent.find("p, li, span").each((_, el) => {
      const t = $(el).clone().children().remove().end().text().trim();
      if (!t || t.length > 60) return;
      if (t === "Características" || t === "Ver mais" || t === "Ver menos") return;
      const slug = featureToSlug(t);
      if (slug) features[slug] = true;
    });
  }

  // Photos: find images from kenlo image domain inside the gallery
  // Dedupe by URL prefix without query params, and prefer the higher-resolution variant.
  const photoSet = new Map<string, string>(); // key: URL stem, value: full URL
  $("img").each((_, el) => {
    const src = $(el).attr("src") ?? $(el).attr("data-src");
    if (!src) return;
    if (!/(?:imgs?|img)\.kenlo\.io/i.test(src)) return;
    if (src.endsWith(".png")) return; // skip logo overlays
    // Use stem as dedupe key (first 60 chars of path)
    const stem = src.replace(/^https?:\/\/[^/]+\//, "").slice(0, 80);
    if (!photoSet.has(stem)) {
      photoSet.set(stem, src);
    }
  });
  const photoUrls = Array.from(photoSet.values());

  return {
    code,
    slug,
    source_url: sourceUrl,
    modality,
    type_slug: typeInfo.slug,
    type_name: typeInfo.name,
    purpose_slug: ["chacara", "sitio", "rancho"].includes(typeSlug) ? "rural" : "residencial",
    city_name: cityName,
    city_uf: cityUf,
    city_slug: slugify(cityName),
    neighborhood_name: neighborhoodName,
    neighborhood_slug: neighborhoodName ? slugify(neighborhoodName) : null,
    street: null, // public site rarely shows street; admin scraping would
    number: null,
    bedrooms,
    suites,
    bathrooms,
    parking_spaces: parkingSpaces,
    built_area_m2: builtArea,
    total_area_m2: totalArea,
    useful_area_m2: usefulArea,
    sale_price: salePrice,
    rental_price: rentalPrice,
    condo_fee: null,
    iptu_yearly: null,
    accepts_pet: acceptsPet,
    accepts_financing: features["aceita_financiamento"] ?? null,
    title,
    description,
    features,
    photo_urls: photoUrls,
  };
}

export async function fetchProperty(
  url: string,
  modality: Modality
): Promise<ScrapedProperty> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    },
  });
  if (!res.ok) throw new Error(`Fetch ${url} → ${res.status}`);
  const html = await res.text();
  return parsePropertyHtml(html, url, modality);
}
