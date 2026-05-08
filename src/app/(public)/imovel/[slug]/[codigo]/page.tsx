import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ChevronRight, MapPin, Bed, Bath, Car, Maximize, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import { formatBRL, formatArea } from "@/lib/utils";
import { MODALITY_LABEL } from "@/lib/domain/properties";
import { getPropertyByCode, getPropertyPhotos } from "@/lib/domain/queries";

interface PageProps {
  params: Promise<{ slug: string; codigo: string }>;
}

export default async function PropertyDetailPage({ params }: PageProps) {
  const { codigo } = await params;
  // Strip optional -HAR5 suffix if user lands on legacy URL
  const cleanCode = codigo.replace(/-HAR5$/i, "");
  const property = await getPropertyByCode(cleanCode);
  if (!property) notFound();
  const allPhotos = await getPropertyPhotos(property.id);

  const price =
    property.modality === "aluguel" ? property.rental_price : property.sale_price;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumbs */}
      <nav className="mb-4 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-navy-700">Home</Link>
        <ChevronRight size={14} />
        <Link href="/imoveis" className="hover:text-navy-700">Imóveis</Link>
        <ChevronRight size={14} />
        <Link href={`/imoveis/a-venda`} className="hover:text-navy-700">
          {MODALITY_LABEL[property.modality]}
        </Link>
        <ChevronRight size={14} />
        <span className="text-foreground">{property.type.name}</span>
      </nav>

      <div className="mb-2 flex items-center gap-3">
        <Badge className="font-mono">{property.code}</Badge>
      </div>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-navy-800 leading-tight">
          {property.title ?? `${property.type.name} ${MODALITY_LABEL[property.modality].toLowerCase()} - ${property.neighborhood?.name} - ${property.city.name}/${property.city.uf}`}
        </h1>
        <Button variant="ghost" size="sm">
          <Share2 size={16} /> Compartilhar
        </Button>
      </div>

      {/* Gallery */}
      <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-2">
        {allPhotos[0] && (
          <div className="relative aspect-[4/3] sm:col-span-2 sm:row-span-2 sm:aspect-[16/12] overflow-hidden rounded-xl bg-muted">
            <Image
              src={allPhotos[0].public_url}
              alt={allPhotos[0].alt_text ?? property.code}
              fill
              sizes="(min-width: 640px) 66vw, 100vw"
              className="object-cover"
              priority
            />
          </div>
        )}
        {allPhotos.slice(1, 5).map((photo) => (
          <div
            key={photo.id}
            className="relative hidden aspect-[4/3] overflow-hidden rounded-xl bg-muted sm:block"
          >
            <Image
              src={photo.public_url}
              alt={photo.alt_text ?? property.code}
              fill
              sizes="33vw"
              className="object-cover"
            />
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Main content */}
        <div className="space-y-8">
          <div className="rounded-xl bg-white border border-border p-6 shadow-card">
            <div className="mb-4 flex items-center gap-3 text-sm text-muted-foreground">
              <Badge className="bg-navy-700 text-white border-transparent">
                {MODALITY_LABEL[property.modality]}
              </Badge>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <MapPin size={14} /> {property.neighborhood?.name} - {property.city.name}/
                {property.city.uf}
              </span>
            </div>

            <div className="text-3xl font-bold text-navy-800 mb-6">{formatBRL(price)}</div>

            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <DataRow label="Área construída" value={formatArea(property.built_area_m2)} icon={<Maximize size={14} />} />
              <DataRow label="Área do terreno" value={formatArea(property.total_area_m2)} icon={<Maximize size={14} />} />
              <DataRow label="Quartos" value={String(property.bedrooms)} icon={<Bed size={14} />} />
              <DataRow label="Suítes" value={String(property.suites)} icon={<Bed size={14} />} />
              <DataRow label="Banheiros" value={String(property.bathrooms)} icon={<Bath size={14} />} />
              <DataRow label="Vagas" value={String(property.parking_spaces)} icon={<Car size={14} />} />
              <DataRow label="Aceita pet" value={property.accepts_pet ? "Sim" : "Não"} />
              <DataRow label="Financiamento" value={property.accepts_financing ? "Sim" : "Não"} />
            </dl>
          </div>

          {property.description && (
            <section className="rounded-xl bg-white border border-border p-6 shadow-card">
              <h2 className="font-display text-xl font-bold text-navy-800 mb-3">Descrição</h2>
              <p className="text-sm text-foreground/80 whitespace-pre-line">
                {property.description}
              </p>
            </section>
          )}

          {/* Características */}
          <section className="rounded-xl bg-white border border-border p-6 shadow-card">
            <h2 className="font-display text-xl font-bold text-navy-800 mb-4">Características</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
              {Object.keys(property.features as Record<string, boolean>)
                .filter((k) => (property.features as Record<string, boolean>)[k])
                .map((k) => (
                  <span key={k} className="inline-flex items-center gap-2 text-foreground/80">
                    <span className="h-1.5 w-1.5 rounded-full bg-gold-500" />
                    {k.replace(/_/g, " ")}
                  </span>
                ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="lg:sticky lg:top-28 h-max">
          <div className="rounded-xl bg-white border border-border p-6 shadow-card">
            <h3 className="font-display text-lg font-bold text-navy-800 mb-1">
              Entrar em contato
            </h3>
            <div className="mb-4 flex gap-2 text-sm">
              <button className="flex-1 rounded-pill bg-navy-700 text-white py-2 font-medium">
                Mensagem
              </button>
              <button className="flex-1 rounded-pill border border-border py-2 font-medium text-navy-700">
                Agendar visita
              </button>
            </div>
            <form className="space-y-3">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input id="name" name="name" required />
              </div>
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" name="phone" />
              </div>
              <div>
                <Label htmlFor="message">Mensagem</Label>
                <Textarea
                  id="message"
                  name="message"
                  defaultValue={`Olá, tenho interesse no imóvel ${property.code}.`}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Ao enviar concordo com os termos de uso e política de privacidade.
              </p>
              <Button type="submit" className="w-full">Enviar mensagem</Button>
            </form>
          </div>
        </aside>
      </div>
    </div>
  );
}

function DataRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground inline-flex items-center gap-1">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 font-medium text-navy-800">{value}</dd>
    </div>
  );
}
