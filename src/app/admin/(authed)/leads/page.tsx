import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/card";
import { formatDistance } from "date-fns";
import { ptBR } from "date-fns/locale";

export default async function LeadsPage() {
  const supabase = await createClient();
  const { data: leads = [] } = await supabase
    .from("leads")
    .select("id, type, source, name, email, phone, message, status, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const list = leads ?? [];

  return (
    <div className="p-8">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold text-navy-800">Leads</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Mensagens recebidas pelos formulários do site.
        </p>
      </header>

      <div className="overflow-hidden rounded-xl border border-border bg-white shadow-card">
        {list.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">
            Nenhum lead recebido ainda.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-medium">Quando</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Contato</th>
                <th className="px-4 py-3 font-medium">Mensagem</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.map((lead) => (
                <tr key={lead.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {formatDistance(new Date(lead.created_at), new Date(), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </td>
                  <td className="px-4 py-3"><Badge>{lead.type}</Badge></td>
                  <td className="px-4 py-3 font-medium text-navy-800">{lead.name}</td>
                  <td className="px-4 py-3 text-xs">
                    {lead.email && <div>{lead.email}</div>}
                    {lead.phone && <div className="text-muted-foreground">{lead.phone}</div>}
                  </td>
                  <td className="px-4 py-3 text-xs text-foreground/80 max-w-xs truncate">
                    {lead.message ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      className={
                        lead.status === "novo"
                          ? "bg-gold-50 text-gold-700 border-gold-200"
                          : lead.status === "fechado"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-muted text-muted-foreground"
                      }
                    >
                      {lead.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
