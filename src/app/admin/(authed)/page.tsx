import Link from "next/link";
import { Building2, Inbox, Calendar, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Aggregate counts (graceful when table is empty)
  const [propertiesActive, propertiesStale, leadsNew, visitsUpcoming, users] = await Promise.all([
    supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("status", "ativo"),
    supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("status", "ativo")
      .lt("updated_at", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()),
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("status", "novo"),
    supabase
      .from("visits")
      .select("*", { count: "exact", head: true })
      .eq("status", "agendado")
      .gte("scheduled_at", new Date().toISOString()),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
  ]);

  // Build context-aware next-steps
  const userCount = users.count ?? 0;
  const activeCount = propertiesActive.count ?? 0;
  const staleCount = propertiesStale.count ?? 0;
  const nextSteps: Array<{ key: string; node: React.ReactNode }> = [];
  if (activeCount === 0) {
    nextSteps.push({
      key: "first-property",
      node: (
        <>
          Cadastrar os primeiros imóveis em{" "}
          <Link href="/admin/imoveis" className="text-navy-700 underline">
            Imóveis
          </Link>
          .
        </>
      ),
    });
  }
  if (staleCount > 0) {
    nextSteps.push({
      key: "stale",
      node: (
        <>
          Revisar <strong>{staleCount}</strong> imóv{staleCount === 1 ? "el" : "eis"} sem
          atualização há ≥90 dias em{" "}
          <Link href="/admin/imoveis" className="text-navy-700 underline">
            Imóveis
          </Link>
          .
        </>
      ),
    });
  }
  nextSteps.push({
    key: "settings",
    node: (
      <>
        Conferir{" "}
        <Link href="/admin/configuracoes" className="text-navy-700 underline">
          Configurações
        </Link>{" "}
        da imobiliária (telefones, endereço, redes sociais).
      </>
    ),
  });
  if (userCount < 2) {
    nextSteps.push({
      key: "second-user",
      node: (
        <>
          Cadastrar um segundo usuário (esposa, sócio, corretor) em{" "}
          <Link href="/admin/usuarios" className="text-navy-700 underline">
            Usuários
          </Link>
          .
        </>
      ),
    });
  }

  const cards = [
    {
      label: "Imóveis ativos",
      value: propertiesActive.count ?? 0,
      icon: Building2,
      color: "text-navy-700",
      bg: "bg-navy-50",
    },
    {
      label: "Desatualizados (≥90 dias)",
      value: propertiesStale.count ?? 0,
      icon: AlertTriangle,
      color: "text-amber-700",
      bg: "bg-amber-50",
    },
    {
      label: "Leads novos",
      value: leadsNew.count ?? 0,
      icon: Inbox,
      color: "text-gold-600",
      bg: "bg-gold-50",
    },
    {
      label: "Visitas agendadas",
      value: visitsUpcoming.count ?? 0,
      icon: Calendar,
      color: "text-emerald-700",
      bg: "bg-emerald-50",
    },
  ];

  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-bold text-navy-800">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Visão geral da operação.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="rounded-xl bg-white border border-border p-5 shadow-card"
          >
            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${bg}`}>
              <Icon className={color} size={20} />
            </div>
            <div className="mt-3 text-3xl font-bold text-navy-800">{value}</div>
            <div className="text-sm text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      {nextSteps.length > 0 && (
        <div className="mt-10 rounded-xl bg-white border border-border p-6 shadow-card">
          <h2 className="font-display text-lg font-bold text-navy-800 mb-2">
            Próximos passos
          </h2>
          <ol className="list-decimal pl-5 space-y-2 text-sm text-foreground/80">
            {nextSteps.map((step) => (
              <li key={step.key}>{step.node}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
