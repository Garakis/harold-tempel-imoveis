import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/card";
import { PropertyForm } from "@/components/admin/property-form";
import { PhotosManager } from "@/components/admin/photos-manager";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPropertyUrl } from "@/lib/domain/properties";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string }>;
}

export default async function EditarImovelPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = await searchParams;

  const admin = createAdminClient();

  const [propertyRes, typesRes, citiesRes, purposesRes, photosRes] = await Promise.all([
    admin
      .from("properties")
      .select("*, neighborhood:neighborhoods(id, name)")
      .eq("id", id)
      .single(),
    admin.from("property_types").select("id, name, slug").order("sort_order"),
    admin.from("cities").select("id, name, slug").order("name"),
    admin.from("property_purposes").select("id, name, slug").order("sort_order"),
    admin
      .from("property_photos")
      .select("id, public_url, is_cover, sort_order, alt_text")
      .eq("property_id", id)
      .order("sort_order"),
  ]);

  if (propertyRes.error || !propertyRes.data) {
    notFound();
  }
  const property = propertyRes.data as typeof propertyRes.data & {
    neighborhood: { id: string; name: string } | null;
  };

  const successMsg =
    sp.ok === "created"
      ? "Imóvel criado com sucesso!"
      : sp.ok === "updated"
        ? "Alterações salvas!"
        : null;

  return (
    <div className="p-8">
      <Link
        href="/admin/imoveis"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-navy-700 mb-4"
      >
        <ChevronLeft size={14} /> Imóveis
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Badge className="font-mono">{property.code}</Badge>
            {property.is_published && (
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                Publicado
              </Badge>
            )}
          </div>
          <h1 className="font-display text-3xl font-bold text-navy-800">
            {property.title ?? "Imóvel sem título"}
          </h1>
        </div>
        {property.is_published && (
          <Link
            href={getPropertyUrl({ slug: property.slug, code: property.code })}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-pill border border-border bg-white px-4 py-2 text-sm font-medium text-navy-700 hover:bg-navy-50"
          >
            <ExternalLink size={14} /> Ver no site
          </Link>
        )}
      </div>

      {successMsg && (
        <div className="mb-6 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {successMsg}
        </div>
      )}

      {/* Photos section first (most actionable) */}
      <section className="mb-8">
        <h2 className="font-display text-xl font-bold text-navy-800 mb-4">Fotos</h2>
        <PhotosManager propertyId={property.id} initialPhotos={photosRes.data ?? []} />
      </section>

      {/* Property data form */}
      <section>
        <h2 className="font-display text-xl font-bold text-navy-800 mb-4">Dados do imóvel</h2>
        <PropertyForm
          mode="edit"
          types={typesRes.data ?? []}
          cities={citiesRes.data ?? []}
          purposes={purposesRes.data ?? []}
          defaults={{
            id: property.id,
            code: property.code,
            type_id: property.type_id,
            purpose_id: property.purpose_id ?? undefined,
            city_id: property.city_id,
            neighborhood_name: property.neighborhood?.name ?? "",
            modality: property.modality,
            status: property.status,
            is_published: property.is_published ?? false,
            is_featured: property.is_featured ?? false,
            is_super_featured: property.is_super_featured ?? false,
            sale_price: property.sale_price,
            rental_price: property.rental_price,
            rental_period: property.rental_period,
            condo_fee: property.condo_fee,
            iptu_yearly: property.iptu_yearly,
            accepts_pet: property.accepts_pet ?? false,
            accepts_financing: property.accepts_financing ?? false,
            accepts_exchange: property.accepts_exchange ?? false,
            bedrooms: property.bedrooms,
            suites: property.suites,
            bathrooms: property.bathrooms,
            parking_spaces: property.parking_spaces,
            built_area_m2: property.built_area_m2,
            total_area_m2: property.total_area_m2,
            useful_area_m2: property.useful_area_m2,
            street: property.street,
            number: property.number,
            complement: property.complement,
            cep: property.cep,
            reference_point: property.reference_point,
            hide_address: property.hide_address ?? false,
            title: property.title,
            description: property.description,
            internal_notes: property.internal_notes,
            meta_title: property.meta_title,
            meta_description: property.meta_description,
            features: (property.features as Record<string, boolean>) ?? {},
          }}
        />
      </section>
    </div>
  );
}
