import { notFound, redirect } from "next/navigation";
import { Logo } from "@/components/site/logo";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { createAdminClient } from "@/lib/supabase/admin";
import { bootstrapAction } from "./actions";

interface PageProps {
  searchParams: Promise<{ error?: string }>;
}

/**
 * One-time bootstrap route. Visible ONLY when:
 *  - SUPABASE_SERVICE_ROLE_KEY and BOOTSTRAP_SECRET env vars are set, AND
 *  - the `profiles` table is empty.
 *
 * After the first user is created, this route returns 404.
 */
export default async function BootstrapPage({ searchParams }: PageProps) {
  if (
    !process.env.SUPABASE_SERVICE_ROLE_KEY ||
    !process.env.BOOTSTRAP_SECRET
  ) {
    notFound();
  }

  const params = await searchParams;
  const admin = createAdminClient();
  const { count } = await admin
    .from("profiles")
    .select("*", { count: "exact", head: true });

  if ((count ?? 0) > 0) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-svh flex items-center justify-center bg-navy-900 p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-card-hover">
        <div className="mb-8 flex justify-center">
          <Logo href={null} size="h-16" />
        </div>

        <h1 className="font-display text-2xl font-bold text-navy-800 text-center">
          Configuração inicial
        </h1>
        <p className="mt-2 text-sm text-muted-foreground text-center">
          Cadastre o primeiro usuário administrador. Esta tela some após o primeiro acesso.
        </p>

        {params.error && (
          <div className="mt-4 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {params.error}
          </div>
        )}

        <form action={bootstrapAction} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="full_name">Nome completo</Label>
            <Input id="full_name" name="full_name" required autoComplete="name" />
          </div>
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
            />
          </div>
          <div>
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Mínimo 8 caracteres.
            </p>
          </div>
          <div>
            <Label htmlFor="bootstrap_secret">Bootstrap secret</Label>
            <Input
              id="bootstrap_secret"
              name="bootstrap_secret"
              type="password"
              required
              autoComplete="off"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Valor da variável de ambiente <code className="font-mono">BOOTSTRAP_SECRET</code>.
            </p>
          </div>

          <Button type="submit" className="w-full">
            Criar usuário administrador
          </Button>
        </form>
      </div>
    </div>
  );
}
