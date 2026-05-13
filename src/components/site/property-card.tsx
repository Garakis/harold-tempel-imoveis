import Link from "next/link";
import { Bed, Bath, Car, Maximize, Crown } from "lucide-react";
import { Card, Badge } from "@/components/ui/card";
import { PropertyCardGallery } from "@/components/site/property-card-gallery";
import { formatBRL, formatArea, cn } from "@/lib/utils";
import {
  type PropertyListing,
  getPropertyUrl,
  MODALITY_LABEL,
} from "@/lib/domain/properties";

interface PropertyCardProps {
  property: PropertyListing;
  className?: string;
}

export function PropertyCard({ property, className }: PropertyCardProps) {
  const url = getPropertyUrl(property);
  const price =
    property.modality === "aluguel"
      ? property.rental_price
      : property.sale_price;
  const priceLabel =
    property.modality === "aluguel"
      ? `${formatBRL(price)}${price ? "/mês" : ""}`
      : formatBRL(price);

  const area = property.built_area_m2 ?? property.total_area_m2;
  const fallbackAlt = property.title ?? property.code;
  const photos =
    property.preview_photos && property.preview_photos.length > 0
      ? property.preview_photos
      : property.cover_photo
        ? [property.cover_photo]
        : [];

  return (
    <Card className={cn("group overflow-hidden hover:shadow-card-hover transition-shadow", className)}>
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <Link href={url} className="absolute inset-0 z-0" aria-label={fallbackAlt} />
        <PropertyCardGallery
          photos={photos}
          fallbackAlt={fallbackAlt}
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
        />
        {/* Photo count badge */}
        {property.photos_count > 1 && (
          <Badge className="absolute right-3 bottom-3 z-10 bg-black/70 text-white border-transparent pointer-events-none">
            {property.photos_count} fotos
          </Badge>
        )}
        {/* Featured */}
        {property.is_super_featured ? (
          <Badge className="absolute left-3 top-3 z-10 bg-gold-500 text-white border-transparent gap-1 pointer-events-none">
            <Crown size={12} /> Super destaque
          </Badge>
        ) : property.is_featured ? (
          <Badge className="absolute left-3 top-3 z-10 bg-gold-500/90 text-white border-transparent pointer-events-none">
            Destaque
          </Badge>
        ) : null}
      </div>

      <Link href={url} className="block">
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge className="font-mono">{property.code}</Badge>
            <span>·</span>
            <span>{property.type.name}</span>
            <span className="ml-auto font-medium text-navy-700">
              {MODALITY_LABEL[property.modality]}
            </span>
          </div>

          <div>
            <h3 className="font-display text-base font-bold text-navy-800 leading-tight line-clamp-2">
              {property.neighborhood?.name ?? "—"} — {property.city.name}/{property.city.uf}
            </h3>
            {property.title && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                {property.title}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {area && (
              <span className="inline-flex items-center gap-1">
                <Maximize size={14} /> {formatArea(area)}
              </span>
            )}
            {property.bedrooms > 0 && (
              <span className="inline-flex items-center gap-1">
                <Bed size={14} /> {property.bedrooms}
                {property.suites > 0 ? ` (${property.suites} suíte${property.suites > 1 ? "s" : ""})` : ""}
              </span>
            )}
            {property.bathrooms > 0 && (
              <span className="inline-flex items-center gap-1">
                <Bath size={14} /> {property.bathrooms}
              </span>
            )}
            {property.parking_spaces > 0 && (
              <span className="inline-flex items-center gap-1">
                <Car size={14} /> {property.parking_spaces}
              </span>
            )}
          </div>

          <div className="border-t border-border pt-3">
            <div className="text-lg font-bold text-navy-800">{priceLabel}</div>
            {property.condo_fee && property.modality === "aluguel" && (
              <div className="text-xs text-muted-foreground">
                + {formatBRL(property.condo_fee)} de condomínio
              </div>
            )}
          </div>
        </div>
      </Link>
    </Card>
  );
}
