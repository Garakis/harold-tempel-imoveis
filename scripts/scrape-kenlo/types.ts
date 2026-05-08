export type Modality = "venda" | "aluguel" | "temporada";

export interface ScrapedProperty {
  /** Reference code without -HAR5 suffix (e.g. "CA0034") */
  code: string;
  /** Original SEO slug from URL */
  slug: string;
  /** Source URL where this was scraped from */
  source_url: string;

  modality: Modality;
  type_slug: string;        // casa, apartamento, terreno, chacara, sitio, rancho
  type_name: string;        // Casa, Apartamento, ...
  purpose_slug: string;     // residencial, comercial, rural

  city_name: string;
  city_uf: string;
  city_slug: string;
  neighborhood_name: string | null;
  neighborhood_slug: string | null;

  street: string | null;
  number: string | null;

  bedrooms: number;
  suites: number;
  bathrooms: number;
  parking_spaces: number;

  built_area_m2: number | null;
  total_area_m2: number | null;
  useful_area_m2: number | null;

  sale_price: number | null;
  rental_price: number | null;
  condo_fee: number | null;
  iptu_yearly: number | null;

  accepts_pet: boolean | null;
  accepts_financing: boolean | null;

  title: string | null;
  description: string | null;

  /** All recognized features as { feature_slug: true } */
  features: Record<string, boolean>;

  /** URLs of all photos in display order */
  photo_urls: string[];
}
