"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import {
  renderLeadNotificationEmail,
  renderLeadAutoResponse,
  type LeadNotifyData,
} from "@/lib/email/templates";
import { getSettings } from "@/lib/settings";
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

  const { data: insertedRows, error } = await supabase
    .from("leads")
    .insert({
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
    })
    .select("id");

  if (error) {
    console.error("Lead insert error:", error);
    return { error: "Não foi possível enviar agora. Tente novamente em instantes." };
  }

  // Fire-and-forget email notifications. Failures must NOT block the user.
  const leadId = insertedRows?.[0]?.id ?? null;
  notifyLead(input, leadId).catch((e) =>
    console.error("Email notification failed:", e)
  );

  return { error: null };
}

async function notifyLead(input: SubmitLeadInput, leadId: string | null) {
  const settings = await getSettings();
  const supabase = await createClient();

  // Look up property details if attached
  let property_code: string | null = null;
  let property_title: string | null = null;
  let property_slug: string | null = null;
  if (input.property_id) {
    const { data } = await supabase
      .from("properties")
      .select("code, title, slug")
      .eq("id", input.property_id)
      .maybeSingle();
    property_code = data?.code ?? null;
    property_title = data?.title ?? null;
    property_slug = data?.slug ?? null;
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://harold-tempel-imoveis.vercel.app";
  const adminUrl = leadId
    ? `${siteUrl}/admin/leads/${leadId}`
    : `${siteUrl}/admin/leads`;
  const propertyUrl =
    property_slug && property_code
      ? `${siteUrl}/imovel/${property_slug}/${property_code}`
      : null;
  const whatsappUrl = `https://wa.me/${settings.contact.whatsapp}`;

  const notifyTo =
    process.env.LEAD_NOTIFY_TO ?? "robertaperetotempel@gmail.com";

  // 1) Internal notification
  const notify = renderLeadNotificationEmail({
    type: input.type as LeadNotifyData["type"],
    source: input.source,
    name: input.name,
    email: input.email ?? null,
    phone: input.phone ?? null,
    message: input.message ?? null,
    property_code,
    property_title,
    property_url: propertyUrl,
    admin_url: adminUrl,
    metadata: input.metadata,
  });
  await sendEmail({
    to: notifyTo,
    subject: notify.subject,
    html: notify.html,
    replyTo: input.email ?? undefined,
  });

  // 2) Auto-response back to the lead (only if email provided)
  if (input.email) {
    const auto = renderLeadAutoResponse({
      name: input.name,
      type: input.type as LeadNotifyData["type"],
      property_code,
      property_title,
      property_url: propertyUrl,
      whatsapp_url: whatsappUrl,
    });
    await sendEmail({
      to: input.email,
      subject: auto.subject,
      html: auto.html,
    });
  }
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
 * Used by the homepage search chat widget. Captures lead + search context.
 * `next` is the listing URL the chat decided to redirect to.
 */
export async function submitSearchChatLead(formData: FormData) {
  const name = clean(formData.get("name"));
  const phone = clean(formData.get("phone"));
  const next = clean(formData.get("next")) || "/imoveis";
  const objective = clean(formData.get("objective"));
  const purpose = clean(formData.get("purpose"));
  const property_type = clean(formData.get("property_type"));
  const bedrooms = clean(formData.get("bedrooms"));
  const price_range = clean(formData.get("price_range"));
  const city = clean(formData.get("city"));

  if (!name || !phone) {
    // Lead capture step was skipped; just go to results.
    redirect(next);
  }

  const messageLines = [
    `Veio do chat de busca da home.`,
    objective ? `Objetivo: ${objective}` : null,
    purpose ? `Finalidade: ${purpose}` : null,
    property_type ? `Tipo: ${property_type}` : null,
    bedrooms ? `Quartos: ${bedrooms}+` : null,
    price_range ? `Faixa de preço: ${price_range}` : null,
    city ? `Cidade: ${city}` : null,
  ].filter(Boolean);

  await insertLead({
    type: "contato",
    source: "form_contato",
    name,
    phone,
    message: messageLines.join("\n"),
    metadata: {
      from: "search_chat",
      objective,
      purpose,
      property_type,
      bedrooms,
      price_range,
      city,
      search_url: next,
    },
    redirect_to: next,
  });

  redirect(next);
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
