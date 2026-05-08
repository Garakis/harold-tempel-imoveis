import { PropertyCard } from "./property-card";
import type { PropertyListing } from "@/lib/domain/properties";

interface PropertyGridProps {
  properties: PropertyListing[];
}

export function PropertyGrid({ properties }: PropertyGridProps) {
  if (properties.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-12 text-center text-muted-foreground">
        Nenhum imóvel encontrado com esses filtros.
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {properties.map((property) => (
        <PropertyCard key={property.id} property={property} />
      ))}
    </div>
  );
}
