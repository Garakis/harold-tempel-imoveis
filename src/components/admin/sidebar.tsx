"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Building2, Inbox, Calendar, Settings, LogOut, Users } from "lucide-react";
import { Logo } from "@/components/site/logo";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/app/admin/login/actions";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/imoveis", label: "Imóveis", icon: Building2 },
  { href: "/admin/leads", label: "Leads", icon: Inbox },
  { href: "/admin/agenda", label: "Agenda", icon: Calendar },
  { href: "/admin/proprietarios", label: "Proprietários", icon: Users },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col w-64 shrink-0 border-r border-border bg-white min-h-svh">
      <div className="px-5 py-5 border-b border-border flex justify-center">
        <Logo href="/admin" size="h-14" />
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {NAV.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-navy-700 text-white"
                  : "text-navy-700 hover:bg-navy-50"
              )}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <form action={logoutAction} className="p-3 border-t border-border">
        <button
          type="submit"
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-navy-700 hover:bg-navy-50 transition-colors"
        >
          <LogOut size={18} />
          Sair
        </button>
      </form>
    </aside>
  );
}
