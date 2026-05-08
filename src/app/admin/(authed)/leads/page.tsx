import Link from "next/link";
import { Inbox } from "lucide-react";
import { formatDistance } from "date-fns";
import { ptBR } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/card";
import type { Database } from "@/lib/supabase/database.types";

type LeadStatus = Database["public"]["Enums"]["lead_status"];

const STATUS_LABEL: Record<LeadStatus, string> = {
  novo: "Novos",
  em_atendimento: "Em atendimento",
  fechado: "Fechados",
  perdido: "Perdidos",
};

const STATUS_FILTER_VALUES: Array<"todos" | LeadStatus> = [
  "todos",
  "novo",
  "em_atendimento",
  "fechado",
  "perdido",
];

const TYPE_LABEL: Record<string, string> = {
  contato: "Contato",
  interesse_imovel: "Interesse",
  agendar_visita: "Agendar visita",
  cadastrar_imovel: "Cadastrar imóvel",
  encomendar_imovel: "Encomendar",
};

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function LeadsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filter = (params.status ?? "todos") as "todos" | LeadStatus;
  const supabase = await createClient();

  // Fetch counts per status for tabs
  const { data: counts } = await supabase
    .from("leads")
    .select("status");
  const statusCounts: Record<string, number> = {};
  for (const row of counts ?? []) {
    statusCounts[row.status] = (statusCounts[row.status] ?? 0) + 1;
  }
  statusCounts.todos = counts?.length ?? 0;

  let query = supabase
    .from("leads")
    .select("id, type, source, name, email, phone, message, status, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (filter !== "todos") {
    query = query.eq("status", filter);
  }
  const { data: leads = [] } = await query;
  const list = leads ?? [];

  return (
    <div className="p-8">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold text-navy-800">Leads</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Mensagens recebidas pelos formulários do site.
        </p>
      </header>

      {/* Status tabs */}
      <div className="mb-6 flex flex-wrap gap-1 p-1 bg-muted/40 rounded-lg w-fit">
        {STATUS_FILTER_VALUES.map((s) => {
          const count = statusCounts[s] ?? 0;
          const active = s === filter;
          const label = s === "todos" ? "Todos" : STATUS_LABEL[s as LeadStatus];
          return (
            <Link
              key={s}
              href={s === "todos" ? "/admin/leads" : `/admin/leads?status=${s}`}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                active
                  ? "bg-white text-navy-800 shadow-card"
                  : "text-muted-foreground hover:text-navy-700"
              }`}
            >
              {label}
              <span className={`ml-2 text-xs ${active ? "text-gold-600" : ""}`}>
                {count}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-white shadow-card">
        {list.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            <Inbox className="mx-auto mb-3" size={32} />
            Nenhum lead {filter === "todos" ? "ainda" : `com status "${STATUS_LABEL[filter as LeadStatus]?.toLowerCase()}"`}.
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
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    <Link
                      href={`/admin/leads/${lead.id}`}
                      className="hover:text-navy-700"
                    >
                      {formatDistance(new Date(lead.created_at), new Date(), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Badge>{TYPE_LABEL[lead.type] ?? lead.type}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/leads/${lead.id}`}
                      className="font-medium text-navy-800 hover:text-gold-600 underline-offset-4 hover:underline"
                    >
                      {lead.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {lead.email && <div className="truncate max-w-48">{lead.email}</div>}
                    {lead.phone && (
                      <div className="text-muted-foreground">{lead.phone}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-foreground/80 max-w-xs truncate">
                    {lead.message ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      className={
                        lead.status === "novo"
                          ? "bg-gold-50 text-gold-700 border-gold-300"
                          : lead.status === "em_atendimento"
                          ? "bg-blue-50 text-blue-700 border-blue-300"
                          : lead.status === "fechado"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                          : "bg-muted text-muted-foreground"
                      }
                    >
                      {STATUS_LABEL[lead.status]}
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
