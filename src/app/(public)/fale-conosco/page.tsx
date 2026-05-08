import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import { FormFeedback } from "@/components/site/form-feedback";
import { submitContactLead } from "@/app/_actions/leads";
import { getSettings } from "@/lib/settings";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fale conosco",
  description:
    "Entre em contato com a Harold Tempel Imóveis. Tire suas dúvidas, agende uma visita ou solicite um atendimento.",
};

interface PageProps {
  searchParams: Promise<{ ok?: string; error?: string }>;
}

export default async function FaleConoscoPage({ searchParams }: PageProps) {
  const settings = await getSettings();
  const params = await searchParams;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-display text-4xl font-extrabold text-navy-800 mb-8">
        Fale conosco
      </h1>
      <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
        <form action={submitContactLead} className="space-y-4">
          <FormFeedback ok={params.ok === "1"} error={params.error} />

          <div>
            <Label htmlFor="name">Nome *</Label>
            <Input id="name" name="name" required minLength={2} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" name="phone" type="tel" />
            </div>
            <div>
              <Label htmlFor="email">E-mail *</Label>
              <Input id="email" name="email" type="email" required />
            </div>
          </div>
          <div>
            <Label htmlFor="message">Mensagem *</Label>
            <Textarea id="message" name="message" required rows={6} minLength={10} />
          </div>
          <p className="text-xs text-muted-foreground">
            Ao enviar concordo com os termos de uso e política de privacidade.
          </p>
          <Button type="submit">Enviar</Button>
        </form>

        <aside className="space-y-4 text-sm">
          <div>
            <h3 className="font-display font-bold text-navy-800 mb-1">Localização</h3>
            <p className="text-muted-foreground">Matriz</p>
            <address className="not-italic text-foreground/80 leading-relaxed mt-1">
              {settings.contact.address.street}
              {settings.contact.address.complement
                ? ` — ${settings.contact.address.complement}`
                : ""}
              <br />
              {settings.contact.address.neighborhood} —{" "}
              {settings.contact.address.city}/{settings.contact.address.uf}
            </address>
          </div>
          <div>
            <h3 className="font-display font-bold text-navy-800 mb-1">Contato</h3>
            <a
              href={`tel:${settings.contact.phone.replace(/\D/g, "")}`}
              className="block text-foreground/80 hover:text-gold-600"
            >
              {settings.contact.phone}
            </a>
          </div>
          <p className="text-xs text-muted-foreground">CRECI: {settings.company.creci}</p>
        </aside>
      </div>
    </div>
  );
}
