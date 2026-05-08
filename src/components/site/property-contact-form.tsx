"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import { FormFeedback } from "@/components/site/form-feedback";
import { submitPropertyInterestLead } from "@/app/_actions/leads";

interface Props {
  propertyId: string;
  code: string;
  slug: string;
  ok?: boolean;
  error?: string;
}

export function PropertyContactForm({ propertyId, code, slug, ok, error }: Props) {
  const [tab, setTab] = useState<"mensagem" | "agendar_visita">("mensagem");

  const isVisit = tab === "agendar_visita";
  const defaultMessage = isVisit
    ? `Olá, gostaria de agendar uma visita ao imóvel ${code}.`
    : `Olá, tenho interesse no imóvel ${code}.`;

  return (
    <div className="rounded-xl bg-white border border-border p-6 shadow-card">
      <h3 className="font-display text-lg font-bold text-navy-800 mb-1">
        Entrar em contato
      </h3>
      <div className="mb-4 flex gap-2 text-sm">
        <button
          type="button"
          onClick={() => setTab("mensagem")}
          className={`flex-1 rounded-pill py-2 font-medium transition-colors ${
            tab === "mensagem"
              ? "bg-navy-700 text-white"
              : "border border-border text-navy-700 hover:bg-navy-50"
          }`}
        >
          Mensagem
        </button>
        <button
          type="button"
          onClick={() => setTab("agendar_visita")}
          className={`flex-1 rounded-pill py-2 font-medium transition-colors ${
            tab === "agendar_visita"
              ? "bg-navy-700 text-white"
              : "border border-border text-navy-700 hover:bg-navy-50"
          }`}
        >
          Agendar visita
        </button>
      </div>

      <form action={submitPropertyInterestLead} className="space-y-3">
        <FormFeedback
          ok={ok}
          error={error}
          okMessage={
            isVisit
              ? "Pedido de visita enviado! Em breve confirmamos data e horário."
              : "Mensagem enviada! Em breve entraremos em contato."
          }
        />

        <input type="hidden" name="property_id" value={propertyId} />
        <input type="hidden" name="code" value={code} />
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="subtype" value={tab} />

        <div>
          <Label htmlFor="contact-name">Nome *</Label>
          <Input id="contact-name" name="name" required minLength={2} />
        </div>
        <div>
          <Label htmlFor="contact-email">E-mail *</Label>
          <Input id="contact-email" name="email" type="email" required />
        </div>
        <div>
          <Label htmlFor="contact-phone">Telefone</Label>
          <Input id="contact-phone" name="phone" type="tel" />
        </div>
        <div>
          <Label htmlFor="contact-message">Mensagem</Label>
          <Textarea
            id="contact-message"
            name="message"
            defaultValue={defaultMessage}
            key={tab} /* re-render textarea so defaultValue reflects current tab */
          />
        </div>

        <p className="text-[11px] text-muted-foreground">
          Ao enviar concordo com os termos de uso e política de privacidade.
        </p>
        <Button type="submit" className="w-full">
          {isVisit ? "Solicitar visita" : "Enviar mensagem"}
        </Button>
      </form>
    </div>
  );
}
