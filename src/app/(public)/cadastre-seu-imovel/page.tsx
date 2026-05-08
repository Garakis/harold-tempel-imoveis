import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import { FormFeedback } from "@/components/site/form-feedback";
import { submitRegisterPropertyLead } from "@/app/_actions/leads";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cadastre seu imóvel",
  description:
    "Cadastre seu imóvel conosco. Anuncie casas, apartamentos, terrenos, chácaras, sítios e ranchos em Mococa/SP.",
};

interface PageProps {
  searchParams: Promise<{ ok?: string; error?: string }>;
}

export default async function CadastreSeuImovelPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-display text-4xl font-extrabold text-navy-800 mb-3">
        Cadastre seu imóvel
      </h1>
      <p className="text-muted-foreground mb-10">
        Preencha os dados abaixo e nossa equipe entrará em contato para finalizar o cadastro.
      </p>

      <form
        action={submitRegisterPropertyLead}
        className="space-y-5 rounded-xl bg-white border border-border p-6 shadow-card"
      >
        <FormFeedback
          ok={params.ok === "1"}
          error={params.error}
          okMessage="Cadastro recebido! Nossa equipe entrará em contato em até 1 dia útil."
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
          <div>
            <Label htmlFor="phone">Celular *</Label>
            <Input id="phone" name="phone" type="tel" required />
          </div>
          <div>
            <Label htmlFor="phone2">Telefone</Label>
            <Input id="phone2" name="phone2" type="tel" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="type">Tipo do imóvel *</Label>
            <select
              id="type"
              name="type"
              required
              className="h-11 w-full rounded-md border border-border bg-white px-3 text-sm"
            >
              <option value="">Selecione</option>
              <option>Casa</option>
              <option>Apartamento</option>
              <option>Terreno</option>
              <option>Chácara</option>
              <option>Sítio</option>
              <option>Rancho</option>
            </select>
          </div>
          <div>
            <Label htmlFor="modality">Pretensão *</Label>
            <select
              id="modality"
              name="modality"
              required
              className="h-11 w-full rounded-md border border-border bg-white px-3 text-sm"
            >
              <option>Vender</option>
              <option>Alugar</option>
              <option>Vender ou alugar</option>
            </select>
          </div>
          <div>
            <Label htmlFor="neighborhood">Bairro *</Label>
            <Input id="neighborhood" name="neighborhood" required />
          </div>
        </div>

        <div>
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            name="description"
            rows={4}
            placeholder="Conte mais sobre o imóvel, área, características, valor pretendido..."
          />
        </div>

        <p className="text-xs text-muted-foreground">
          Ao enviar concordo com os termos de uso e política de privacidade.
        </p>
        <Button type="submit" className="w-full sm:w-auto">
          Enviar cadastro
        </Button>
      </form>
    </div>
  );
}
