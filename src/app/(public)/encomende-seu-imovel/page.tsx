import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import { FormFeedback } from "@/components/site/form-feedback";
import { submitOrderPropertyLead } from "@/app/_actions/leads";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Encomende seu imóvel",
  description:
    "Descreva o imóvel que você procura e nossa equipe avisará quando encontrarmos a opção ideal.",
};

interface PageProps {
  searchParams: Promise<{ ok?: string; error?: string }>;
}

export default async function EncomendeSeuImovelPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-display text-4xl font-extrabold text-navy-800 mb-3">
        Encomende seu imóvel
      </h1>
      <p className="text-muted-foreground mb-10">
        Descreva as características abaixo e nós avisaremos quando encontrarmos um imóvel
        que atenda seu perfil.
      </p>

      <form
        action={submitOrderPropertyLead}
        className="space-y-5 rounded-xl bg-white border border-border p-6 shadow-card"
      >
        <FormFeedback
          ok={params.ok === "1"}
          error={params.error}
          okMessage="Encomenda registrada! Avisaremos quando encontrarmos algo que se encaixe."
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="name">Nome *</Label>
            <Input id="name" name="name" required minLength={2} />
          </div>
          <div>
            <Label htmlFor="email">E-mail *</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="phone">Telefone *</Label>
            <Input id="phone" name="phone" type="tel" required />
          </div>
        </div>

        <div>
          <Label htmlFor="description">O que você procura? *</Label>
          <Textarea
            id="description"
            name="description"
            rows={6}
            required
            minLength={10}
            placeholder="Ex.: Casa em Mococa, Centro, com 3 quartos, garagem para 2 carros, valor até R$ 600.000."
          />
        </div>

        <p className="text-xs text-muted-foreground">
          Ao enviar concordo com os termos de uso e política de privacidade.
        </p>
        <Button type="submit">Enviar encomenda</Button>
      </form>
    </div>
  );
}
