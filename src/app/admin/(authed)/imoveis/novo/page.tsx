import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PropertyForm } from "@/components/admin/property-form";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function NovoImovelPage() {
  const admin = createAdminClient();
  const [{ data: types }, { data: cities }, { data: purposes }] = await Promise.all([
    admin.from("property_types").select("id, name, slug").order("sort_order"),
    admin.from("cities").select("id, name, slug").order("name"),
    admin.from("property_purposes").select("id, name, slug").order("sort_order"),
  ]);

  return (
    <div className="p-8">
      <Link
        href="/admin/imoveis"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-navy-700 mb-4"
      >
        <ChevronLeft size={14} /> Imóveis
      </Link>
      <h1 className="font-display text-3xl font-bold text-navy-800 mb-2">Novo imóvel</h1>
      <p className="text-muted-foreground mb-8 text-sm">
        Preencha as informações abaixo. O código será gerado automaticamente baseado no tipo (ex: CA0040).
        As fotos podem ser adicionadas após criar o imóvel.
      </p>

      <PropertyForm
        mode="create"
        types={types ?? []}
        cities={cities ?? []}
        purposes={purposes ?? []}
      />
    </div>
  );
}
