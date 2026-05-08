import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/site/logo";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { loginAction } from "./actions";

interface PageProps {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect(params.redirect ?? "/admin");

  return (
    <div className="min-h-svh grid lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="hidden lg:flex flex-col items-center justify-center bg-navy-900 text-white p-10 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_20%,rgba(201,169,97,0.5),transparent_50%)]" />
        <div className="relative z-10 max-w-md text-center">
          <Logo variant="light" href={null} className="justify-center" />
          <h1 className="mt-10 font-display text-3xl font-bold leading-tight">
            Painel administrativo
          </h1>
          <p className="mt-3 text-white/70 text-sm">
            Gerencie seus imóveis, leads e agenda em um só lugar.
          </p>
        </div>
      </aside>

      {/* Form */}
      <main className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden flex justify-center">
            <Logo href={null} />
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold text-navy-800">
              Entrar
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Acesse o painel administrativo da Harold Tempel Imóveis.
            </p>
          </div>

          {params.error && (
            <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
              {params.error}
            </div>
          )}

          <form action={loginAction} className="space-y-4">
            <input type="hidden" name="redirect" value={params.redirect ?? ""} />
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Entrar
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            <Link href="/" className="hover:text-navy-700 underline-offset-4 hover:underline">
              ← Voltar para o site
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
