import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export interface SiteSettings {
  company: {
    name: string;
    tagline: string;
    creci: string;
  };
  contact: {
    phone: string;
    whatsapp: string;
    email: string | null;
    address: {
      street: string;
      complement: string | null;
      neighborhood: string;
      city: string;
      uf: string;
      cep: string | null;
    };
  };
  social: {
    facebook: string | null;
    instagram: string | null;
    youtube: string | null;
    tiktok: string | null;
  };
  seo: {
    default_title: string;
    default_description: string;
  };
}

const FALLBACK: SiteSettings = {
  company: {
    name: "Harold Tempel Imóveis",
    tagline: "Intermediando sonhos",
    creci: "167881F",
  },
  contact: {
    phone: "(19) 98905-6113",
    whatsapp: "5519989056113",
    email: null,
    address: {
      street: "Rua Antônio Teófilo, 10",
      complement: "AP 82",
      neighborhood: "Centro",
      city: "Mococa",
      uf: "SP",
      cep: null,
    },
  },
  social: {
    facebook: "https://www.facebook.com/HaroldTempelImoveis",
    instagram: "https://www.instagram.com/harolderobertatempel/",
    youtube: null,
    tiktok: null,
  },
  seo: {
    default_title: "Harold Tempel Imóveis — Imobiliária em Mococa/SP",
    default_description:
      "Imobiliária em Mococa/SP. Casas, apartamentos, terrenos, chácaras, sítios e ranchos para venda e locação. CRECI 167881F.",
  },
};

/**
 * Loads site settings from Supabase. Cached per-request via React `cache()`.
 * Returns fallback if DB is unavailable so the site never breaks.
 */
export const getSettings = cache(async (): Promise<SiteSettings> => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("key, value");

    if (error || !data) return FALLBACK;

    const map: Record<string, unknown> = {};
    for (const row of data) {
      map[row.key] = row.value;
    }

    return {
      company: { ...FALLBACK.company, ...((map.company as object) ?? {}) },
      contact: { ...FALLBACK.contact, ...((map.contact as object) ?? {}) },
      social: { ...FALLBACK.social, ...((map.social as object) ?? {}) },
      seo: { ...FALLBACK.seo, ...((map.seo as object) ?? {}) },
    } as SiteSettings;
  } catch {
    return FALLBACK;
  }
});
