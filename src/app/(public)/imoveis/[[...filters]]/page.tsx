import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PropertyGrid } from "@/components/site/property-grid";
import { Button } from "@/components/ui/button";
import { listProperties } from "@/lib/domain/queries";

interface PageProps {
  params: Promise<{ filters?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const MODALITY_SLUG_TO_DB: Record<string, "venda" | "aluguel" | "temporada"> = {
  "a-venda": "venda",
  "para-alugar": "aluguel",
  temporada: "temporada",
};

const MODALITY_LABEL: Record<string, string> = {
  "a-venda": "à venda",
  "para-alugar": "para alugar",
  temporada: "temporada",
};

const TYPE_LABEL: Record<string, string> = {
  casa: "Casas",
  apartamento: "Apartamentos",
  terreno: "Terrenos",
  chacara: "Chácaras",
  sitio: "Sítios",
  rancho: "Ranchos",
};

export default async function ImoveisPage({ params, searchParams }: PageProps) {
  const { filters = [] } = await params;
  const sp = await searchParams;
  const [modalitySlug, typeSlug, neighborhoodSlug] = filters;

  // Build heading and breadcrumb
  let heading = "Imóveis";
  if (modalitySlug) {
    const modalityLabel = MODALITY_LABEL[modalitySlug] ?? modalitySlug;
    if (typeSlug) {
      heading = `${TYPE_LABEL[typeSlug] ?? typeSlug} ${modalityLabel}`;
    } else {
      heading = `Imóveis ${modalityLabel}`;
    }
    if (neighborhoodSlug) {
      heading += ` em ${neighborhoodSlug.replace(/-/g, " ")}`;
    }
  }

  const properties = await listProperties({
    modality: modalitySlug ? MODALITY_SLUG_TO_DB[modalitySlug] : undefined,
    type_slug: typeSlug,
    neighborhood_slug: neighborhoodSlug,
    query: typeof sp.q === "string" ? sp.q : undefined,
  });

  const breadcrumbs = [
    { href: "/", label: "Home" },
    { href: "/imoveis", label: "Imóveis" },
    ...(modalitySlug
      ? [{ href: `/imoveis/${modalitySlug}`, label: MODALITY_LABEL[modalitySlug] ?? modalitySlug }]
      : []),
    ...(typeSlug
      ? [{ href: `/imoveis/${modalitySlug}/${typeSlug}`, label: TYPE_LABEL[typeSlug] ?? typeSlug }]
      : []),
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumbs */}
      <nav className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        {breadcrumbs.map((b, i) => (
          <span key={b.href} className="inline-flex items-center gap-1">
            {i > 0 && <ChevronRight size={14} />}
            {i === breadcrumbs.length - 1 ? (
              <span className="text-foreground font-medium">{b.label}</span>
            ) : (
              <Link href={b.href} className="hover:text-navy-700">
                {b.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-navy-800">
            {properties.length} {heading}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            Mais filtros +
          </Button>
          <select
            className="h-9 rounded-md border border-border bg-white px-3 text-sm font-medium text-navy-700"
            aria-label="Ordenação"
          >
            <option>Menor valor</option>
            <option>Maior valor</option>
            <option>Mais recentes</option>
          </select>
        </div>
      </div>

      <PropertyGrid properties={properties} />
    </div>
  );
}
