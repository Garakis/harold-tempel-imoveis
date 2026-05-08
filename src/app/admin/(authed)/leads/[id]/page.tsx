import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  MessageSquare,
  Building2,
  Calendar,
  Trash2,
} from "lucide-react";
import { formatDistance } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Textarea, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { updateLeadStatus, appendLeadNote, deleteLead } from "../actions";
import { getPropertyUrl } from "@/lib/domain/properties";

interface PageProps {
  params: Promise<{ id: string }>;
}

const STATUS_LABEL = {
  novo: "Novo",
  em_atendimento: "Em atendimento",
  fechado: "Fechado",
  perdido: "Perdido",
} as const;

const TYPE_LABEL = {
  contato: "Contato",
  interesse_imovel: "Interesse em imóvel",
  agendar_visita: "Agendar visita",
  cadastrar_imovel: "Cadastrar imóvel",
  encomendar_imovel: "Encomendar imóvel",
} as const;

const SOURCE_LABEL = {
  form_contato: "Form Fale Conosco",
  form_imovel: "Form ficha de imóvel",
  form_cadastrar: "Form Cadastrar imóvel",
  form_encomendar: "Form Encomendar",
  whatsapp: "WhatsApp",
  manual: "Manual",
} as const;

export default async function LeadDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: lead } = await supabase
    .from("leads")
    .select(
      `
      id, type, source, status, name, email, phone, message, metadata, notes,
      created_at, updated_at, property_id,
      property:properties ( id, code, slug, title, modality,
        type:property_types ( name, slug ),
        city:cities ( name, uf ),
        neighborhood:neighborhoods ( name )
      )
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (!lead) notFound();

  const property = (lead as unknown as {
    property: {
      id: string;
      code: string;
      slug: string;
      title: string | null;
      modality: string;
      type: { name: string; slug: string } | null;
      city: { name: string; uf: string } | null;
      neighborhood: { name: string } | null;
    } | null;
  }).property;

  const phoneDigits = lead.phone?.replace(/\D/g, "") ?? "";
  const whatsappLink = phoneDigits
    ? `https://wa.me/55${phoneDigits.startsWith("55") ? phoneDigits.slice(2) : phoneDigits}?text=${encodeURIComponent(
        `Olá ${lead.name}, recebemos sua mensagem pela Harold Tempel Imóveis.`
      )}`
    : null;

  const statusActions: Array<{
    status: typeof STATUS_LABEL extends Record<infer K, string> ? K : never;
    label: string;
    variant: "primary" | "outline" | "destructive" | "ghost";
  }> = [
    { status: "em_atendimento", label: "Em atendimento", variant: "primary" },
    { status: "fechado", label: "Fechado", variant: "outline" },
    { status: "perdido", label: "Perdido", variant: "outline" },
    { status: "novo", label: "Reabrir como novo", variant: "ghost" },
  ];

  return (
    <div className="p-8 max-w-5xl">
      <Link
        href="/admin/leads"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-navy-700 mb-4"
      >
        <ArrowLeft size={14} /> Voltar para inbox
      </Link>

      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Badge>{TYPE_LABEL[lead.type] ?? lead.type}</Badge>
            <span>·</span>
            <span>{SOURCE_LABEL[lead.source] ?? lead.source}</span>
            <span>·</span>
            <span>
              {formatDistance(new Date(lead.created_at), new Date(), {
                addSuffix: true,
                locale: ptBR,
              })}
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold text-navy-800">{lead.name}</h1>
        </div>
        <Badge
          className={
            lead.status === "novo"
              ? "bg-gold-50 text-gold-700 border-gold-300"
              : lead.status === "em_atendimento"
              ? "bg-blue-50 text-blue-700 border-blue-300"
              : lead.status === "fechado"
              ? "bg-emerald-50 text-emerald-700 border-emerald-300"
              : "bg-muted text-muted-foreground"
          }
        >
          {STATUS_LABEL[lead.status]}
        </Badge>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main */}
        <div className="space-y-6">
          {/* Contact */}
          <section className="rounded-xl bg-white border border-border p-6 shadow-card space-y-3">
            <h2 className="font-display text-base font-bold text-navy-800 mb-2">
              Dados de contato
            </h2>
            {lead.email && (
              <div className="flex items-center gap-3 text-sm">
                <Mail size={16} className="text-muted-foreground" />
                <a
                  href={`mailto:${lead.email}`}
                  className="text-navy-700 hover:text-gold-600 underline-offset-4 hover:underline"
                >
                  {lead.email}
                </a>
              </div>
            )}
            {lead.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone size={16} className="text-muted-foreground" />
                <a
                  href={`tel:${phoneDigits}`}
                  className="text-navy-700 hover:text-gold-600 underline-offset-4 hover:underline"
                >
                  {lead.phone}
                </a>
                {whatsappLink && (
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-xs font-medium text-emerald-700 hover:text-emerald-900 underline-offset-4 hover:underline"
                  >
                    WhatsApp →
                  </a>
                )}
              </div>
            )}
          </section>

          {/* Message */}
          {lead.message && (
            <section className="rounded-xl bg-white border border-border p-6 shadow-card">
              <h2 className="font-display text-base font-bold text-navy-800 mb-2 inline-flex items-center gap-2">
                <MessageSquare size={16} /> Mensagem
              </h2>
              <p className="text-sm text-foreground/80 whitespace-pre-line">
                {lead.message}
              </p>
            </section>
          )}

          {/* Linked property */}
          {property && (
            <section className="rounded-xl bg-white border border-border p-6 shadow-card">
              <h2 className="font-display text-base font-bold text-navy-800 mb-2 inline-flex items-center gap-2">
                <Building2 size={16} /> Imóvel relacionado
              </h2>
              <div className="text-sm space-y-1">
                <div className="flex items-center gap-2">
                  <Badge className="font-mono">{property.code}</Badge>
                  <span className="text-muted-foreground">{property.type?.name}</span>
                </div>
                {property.title && <div>{property.title}</div>}
                <div className="text-muted-foreground">
                  {property.neighborhood?.name ?? "—"}, {property.city?.name}/
                  {property.city?.uf}
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Link
                    href={getPropertyUrl({ slug: property.slug, code: property.code })}
                    target="_blank"
                    className="text-xs font-medium text-navy-700 hover:text-gold-600 underline-offset-4 hover:underline"
                  >
                    Ver no site público →
                  </Link>
                  <Link
                    href={`/admin/imoveis/${property.id}`}
                    className="text-xs font-medium text-navy-700 hover:text-gold-600 underline-offset-4 hover:underline"
                  >
                    Editar no admin →
                  </Link>
                </div>
              </div>
            </section>
          )}

          {/* Notes */}
          <section className="rounded-xl bg-white border border-border p-6 shadow-card">
            <h2 className="font-display text-base font-bold text-navy-800 mb-3">
              Anotações internas
            </h2>
            {lead.notes ? (
              <pre className="text-xs text-foreground/80 whitespace-pre-wrap font-sans bg-muted/40 rounded-md p-3 mb-3">
                {lead.notes}
              </pre>
            ) : (
              <p className="text-sm text-muted-foreground mb-3">
                Nenhuma anotação ainda.
              </p>
            )}
            <form
              action={async (formData) => {
                "use server";
                const note = String(formData.get("note") ?? "");
                if (note.trim()) await appendLeadNote(id, note);
              }}
              className="space-y-3"
            >
              <Label htmlFor="note">Adicionar anotação</Label>
              <Textarea id="note" name="note" rows={3} />
              <Button type="submit" size="sm">
                Salvar anotação
              </Button>
            </form>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <section className="rounded-xl bg-white border border-border p-6 shadow-card">
            <h2 className="font-display text-base font-bold text-navy-800 mb-3">
              Atualizar status
            </h2>
            <div className="space-y-2">
              {statusActions
                .filter((a) => a.status !== lead.status)
                .map((a) => (
                  <form
                    key={a.status}
                    action={async () => {
                      "use server";
                      await updateLeadStatus(id, a.status);
                    }}
                  >
                    <Button type="submit" variant={a.variant} size="sm" className="w-full">
                      {a.label}
                    </Button>
                  </form>
                ))}
            </div>
          </section>

          {property && (
            <section className="rounded-xl bg-white border border-border p-6 shadow-card">
              <h2 className="font-display text-base font-bold text-navy-800 mb-3 inline-flex items-center gap-2">
                <Calendar size={16} /> Visita
              </h2>
              <Link
                href={`/admin/agenda?lead_id=${id}&property_id=${property.id}`}
                className="text-sm text-navy-700 underline-offset-4 hover:underline"
              >
                Agendar visita ao imóvel →
              </Link>
            </section>
          )}

          <section className="rounded-xl bg-white border border-border p-6 shadow-card">
            <form
              action={async () => {
                "use server";
                await deleteLead(id);
              }}
            >
              <Button
                type="submit"
                variant="destructive"
                size="sm"
                className="w-full"
              >
                <Trash2 size={14} /> Deletar lead
              </Button>
            </form>
          </section>
        </aside>
      </div>
    </div>
  );
}
