import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { formatBRL, formatArea } from "@/lib/utils";
import { MODALITY_LABEL, STATUS_LABEL } from "@/lib/domain/properties";
import type { Database } from "@/lib/supabase/database.types";

type Status = Database["public"]["Enums"]["property_status"];
type Modality = Database["public"]["Enums"]["property_modality"];

interface PageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    modality?: string;
    published?: string;
  }>;
}

export default async function AdminImoveisPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const statusFilter = (sp.status ?? "") as Status | "";
  const modalityFilter = (sp.modality ?? "") as Modality | "";
  const publishedFilter = sp.published ?? "";

  const supabase = await createClient();
  let query = supabase
    .from("properties")
    .select(
      `
      id, code, slug, status, modality, bedrooms, suites, bathrooms, parking_spaces,
      built_area_m2, total_area_m2, sale_price, rental_price, updated_at, is_published,
      title,
      type:property_types ( name, slug ),
      city:cities ( name, uf ),
      neighborhood:neighborhoods ( name )
    `
    )
    .order("updated_at", { ascending: false })
    .limit(200);

  if (statusFilter) query = query.eq("status", statusFilter);
  if (modalityFilter) query = query.eq("modality", modalityFilter);
  if (publishedFilter === "yes") query = query.eq("is_published", true);
  if (publishedFilter === "no") query = query.eq("is_published", false);

  const { data: properties = [] } = await query;
  let list = properties ?? [];

  if (q) {
    const lq = q.toLowerCase();
    list = list.filter(
      (p) =>
        p.code.toLowerCase().includes(lq) ||
        (p.title ?? "").toLowerCase().includes(lq) ||
        // @ts-expect-error - relational
        (p.neighborhood?.name ?? "").toLowerCase().includes(lq) ||
        // @ts-expect-error - relational
        (p.type?.name ?? "").toLowerCase().includes(lq)
    );
  }

  return (
    <div className="p-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-navy-800">Imóveis</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {list.length} imóv{list.length === 1 ? "el" : "eis"}
            {(q || statusFilter || modalityFilter || publishedFilter) && " (filtrado)"}.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/imoveis/novo">
            <Plus size={16} /> Novo imóvel
          </Link>
        </Button>
      </header>

      <form className="mb-4 flex flex-wrap items-center gap-3">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Buscar por código, título, bairro..."
          className="max-w-md"
        />
        <select
          name="status"
          defaultValue={statusFilter}
          className="h-11 rounded-md border border-border bg-white px-3 text-sm"
        >
          <option value="">Todos os status</option>
          <option value="ativo">Ativo</option>
          <option value="rascunho">Rascunho</option>
          <option value="reservado">Reservado</option>
          <option value="vendido">Vendido</option>
          <option value="alugado">Alugado</option>
          <option value="inativo">Inativo</option>
        </select>
        <select
          name="modality"
          defaultValue={modalityFilter}
          className="h-11 rounded-md border border-border bg-white px-3 text-sm"
        >
          <option value="">Todas as modalidades</option>
          <option value="venda">Venda</option>
          <option value="aluguel">Aluguel</option>
          <option value="venda_aluguel">Venda e Aluguel</option>
          <option value="temporada">Temporada</option>
        </select>
        <select
          name="published"
          defaultValue={publishedFilter}
          className="h-11 rounded-md border border-border bg-white px-3 text-sm"
        >
          <option value="">Publicação: todos</option>
          <option value="yes">Publicados</option>
          <option value="no">Não publicados</option>
        </select>
        <Button type="submit" variant="outline">
          Filtrar
        </Button>
        {(q || statusFilter || modalityFilter || publishedFilter) && (
          <Button asChild variant="ghost">
            <Link href="/admin/imoveis">Limpar</Link>
          </Button>
        )}
      </form>

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
                  Nenhum imóvel encontrado.{" "}
                  <Link href="/admin/imoveis/novo" className="text-navy-700 underline">
                    Cadastrar novo
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
                      <div className="flex items-center gap-2">
                        <Badge className="font-mono">{p.code}</Badge>
                        {p.is_published && (
                          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" title="Publicado" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {/* @ts-expect-error - relational */}
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
