"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type LeadType = Database["public"]["Enums"]["lead_type"];
type LeadSource = Database["public"]["Enums"]["lead_source"];

interface SubmitLeadInput {
  type: LeadType;
  source: LeadSource;
  property_id?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  message?: string | null;
  metadata?: Record<string, unknown>;
  redirect_to: string; // page to redirect after submit, with ?success=lead suffix
}

function clean(s: FormDataEntryValue | null): string {
  return String(s ?? "").trim();
}

async function getRequestMeta() {
  const h = await headers();
  return {
    ip:
      h.get("x-forwarded-for")?.split(",")[0].trim() ??
      h.get("x-real-ip") ??
      null,
    user_agent: h.get("user-agent") ?? null,
  };
}

async function insertLead(input: SubmitLeadInput) {
  if (!input.name || input.name.length < 2) {
    return { error: "Informe seu nome." };
  }
  if (input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    return { error: "E-mail inválido." };
  }
  if (!input.email && !input.phone) {
    return { error: "Informe e-mail ou telefone." };
  }

  const meta = await getRequestMeta();
  const supabase = await createClient();

  const { error } = await supabase.from("leads").insert({
    type: input.type,
    source: input.source,
    property_id: input.property_id ?? null,
    name: input.name,
    email: input.email ?? null,
    phone: input.phone ?? null,
    message: input.message ?? null,
    metadata: (input.metadata ?? {}) as never,
    status: "novo",
    user_agent: meta.user_agent,
    // Note: ip_address column expects inet type. We pass null and let pg default it.
  });

  if (error) {
    console.error("Lead insert error:", error);
    return { error: "Não foi possível enviar agora. Tente novamente em instantes." };
  }
  return { error: null };
}

/**
 * Generic form action used by /fale-conosco.
 */
export async function submitContactLead(formData: FormData) {
  const result = await insertLead({
    type: "contato",
    source: "form_contato",
    name: clean(formData.get("name")),
    email: clean(formData.get("email")) || null,
    phone: clean(formData.get("phone")) || null,
    message: clean(formData.get("message")) || null,
    redirect_to: "/fale-conosco",
  });
  const target = result.error
    ? `/fale-conosco?error=${encodeURIComponent(result.error)}`
    : `/fale-conosco?ok=1`;
  redirect(target);
}

/**
 * Used by /cadastre-seu-imovel.
 */
export async function submitRegisterPropertyLead(formData: FormData) {
  const description = [
    `Tipo: ${clean(formData.get("type")) || "—"}`,
    `Pretensão: ${clean(formData.get("modality")) || "—"}`,
    `Bairro: ${clean(formData.get("neighborhood")) || "—"}`,
    "",
    clean(formData.get("description")),
  ].join("\n");

  const result = await insertLead({
    type: "cadastrar_imovel",
    source: "form_cadastrar",
    name: clean(formData.get("name")),
    email: clean(formData.get("email")) || null,
    phone: clean(formData.get("phone")) || clean(formData.get("phone2")) || null,
    message: description,
    metadata: {
      type: clean(formData.get("type")),
      modality: clean(formData.get("modality")),
      neighborhood: clean(formData.get("neighborhood")),
    },
    redirect_to: "/cadastre-seu-imovel",
  });
  const target = result.error
    ? `/cadastre-seu-imovel?error=${encodeURIComponent(result.error)}`
    : `/cadastre-seu-imovel?ok=1`;
  redirect(target);
}

/**
 * Used by /encomende-seu-imovel.
 */
export async function submitOrderPropertyLead(formData: FormData) {
  const result = await insertLead({
    type: "encomendar_imovel",
    source: "form_encomendar",
    name: clean(formData.get("name")),
    email: clean(formData.get("email")) || null,
    phone: clean(formData.get("phone")) || null,
    message: clean(formData.get("description")) || null,
    redirect_to: "/encomende-seu-imovel",
  });
  const target = result.error
    ? `/encomende-seu-imovel?error=${encodeURIComponent(result.error)}`
    : `/encomende-seu-imovel?ok=1`;
  redirect(target);
}

/**
 * Used by the property detail page contact form.
 */
export async function submitPropertyInterestLead(formData: FormData) {
  const propertyId = clean(formData.get("property_id"));
  const code = clean(formData.get("code")) || "—";
  const slug = clean(formData.get("slug"));
  const subtype = clean(formData.get("subtype")); // "mensagem" | "agendar_visita"

  const isVisit = subtype === "agendar_visita";
  const result = await insertLead({
    type: isVisit ? "agendar_visita" : "interesse_imovel",
    source: "form_imovel",
    property_id: propertyId || null,
    name: clean(formData.get("name")),
    email: clean(formData.get("email")) || null,
    phone: clean(formData.get("phone")) || null,
    message: clean(formData.get("message")) || `Tenho interesse no imóvel ${code}.`,
    metadata: {
      property_code: code,
      visit_requested: isVisit,
    },
    redirect_to: `/imovel/${slug}/${code}`,
  });

  const base = `/imovel/${slug}/${code}`;
  const target = result.error
    ? `${base}?error=${encodeURIComponent(result.error)}`
    : `${base}?ok=1#contato`;
  redirect(target);
}
