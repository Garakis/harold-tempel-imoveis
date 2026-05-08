import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { formatBRL, formatArea } from "@/lib/utils";
import { MODALITY_LABEL, STATUS_LABEL } from "@/lib/domain/properties";

export default async function AdminImoveisPage() {
  const supabase = await createClient();
  const { data: properties = [] } = await supabase
    .from("properties")
    .select(
      `
      id, code, slug, status, modality, bedrooms, suites, bathrooms, parking_spaces,
      built_area_m2, total_area_m2, sale_price, rental_price, updated_at, is_published,
      type:property_types ( name, slug ),
      city:cities ( name, uf ),
      neighborhood:neighborhoods ( name )
    `
    )
    .order("updated_at", { ascending: false })
    .limit(100);

  const list = properties ?? [];

  return (
    <div className="p-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-navy-800">Imóveis</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {list.length} imóv{list.length === 1 ? "el" : "eis"} cadastrad{list.length === 1 ? "o" : "os"}.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/imoveis/novo">
            <Plus size={16} /> Novo imóvel
          </Link>
        </Button>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input
          placeholder="Buscar por código, bairro, endereço..."
          className="max-w-md"
        />
        <select className="h-11 rounded-md border border-border bg-white px-3 text-sm">
          <option>Todos os status</option>
          <option>Ativo</option>
          <option>Rascunho</option>
          <option>Vendido</option>
          <option>Alugado</option>
          <option>Inativo</option>
        </select>
        <select className="h-11 rounded-md border border-border bg-white px-3 text-sm">
          <option>Todas as modalidades</option>
          <option>Venda</option>
          <option>Aluguel</option>
          <option>Temporada</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-white shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3 font-medium">Código</th>
              <th className="px-4 py-3 font-medium">Tipo / Localização</th>
              <th className="px-4 py-3 font-medium">Métricas</th>
              <th className="px-4 py-3 font-medium">Modalidade</th>
              <th className="px-4 py-3 font-medium">Valor</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Atualizado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {list.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                  Nenhum imóvel cadastrado ainda.{" "}
                  <Link href="/admin/imoveis/novo" className="text-navy-700 underline">
                    Cadastrar o primeiro
                  </Link>
                  .
                </td>
              </tr>
            ) : (
              list.map((p) => {
                const price =
                  p.modality === "aluguel" ? p.rental_price : p.sale_price;
                const area = p.built_area_m2 ?? p.total_area_m2;
                return (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Badge className="font-mono">{p.code}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {/* @ts-expect-error - relational shape from select */}
                      <div className="font-medium text-navy-800">{p.type?.name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">
                        {/* @ts-expect-error - relational */}
                        {p.neighborhood?.name ?? "—"} · {p.city?.name}/{p.city?.uf}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {area ? formatArea(area) : "—"}
                      {p.bedrooms ? ` · ${p.bedrooms}d` : ""}
                      {p.suites ? ` · ${p.suites}st` : ""}
                      {p.parking_spaces ? ` · ${p.parking_spaces}v` : ""}
                    </td>
                    <td className="px-4 py-3">{MODALITY_LABEL[p.modality]}</td>
                    <td className="px-4 py-3">{formatBRL(price ?? null)}</td>
                    <td className="px-4 py-3">
                      <Badge
                        className={
                          p.status === "ativo"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : p.status === "rascunho"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {STATUS_LABEL[p.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(p.updated_at).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/imoveis/${p.id}`}
                        className="text-sm text-navy-700 hover:text-gold-600 underline-offset-4 hover:underline"
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
