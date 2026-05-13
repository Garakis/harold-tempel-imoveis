"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Save, Trash2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { FEATURE_GROUPS } from "@/lib/domain/features";
import {
  createProperty,
  updateProperty,
  deleteProperty,
} from "@/app/admin/(authed)/imoveis/actions";
import type { Database } from "@/lib/supabase/database.types";

type Modality = Database["public"]["Enums"]["property_modality"];
type Status = Database["public"]["Enums"]["property_status"];

interface Option {
  id: string;
  name: string;
  slug?: string;
}

interface PropertyDefaults {
  id?: string;
  code?: string;
  type_id?: string;
  purpose_id?: string;
  city_id?: string;
  neighborhood_name?: string;
  modality?: Modality;
  status?: Status;
  is_published?: boolean;
  is_featured?: boolean;
  is_super_featured?: boolean;
  sale_price?: number | null;
  rental_price?: number | null;
  rental_period?: string | null;
  condo_fee?: number | null;
  iptu_yearly?: number | null;
  accepts_pet?: boolean;
  accepts_financing?: boolean;
  accepts_exchange?: boolean;
  bedrooms?: number;
  suites?: number;
  bathrooms?: number;
  parking_spaces?: number;
  built_area_m2?: number | null;
  total_area_m2?: number | null;
  useful_area_m2?: number | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  cep?: string | null;
  reference_point?: string | null;
  hide_address?: boolean;
  title?: string | null;
  description?: string | null;
  internal_notes?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  features?: Record<string, boolean>;
}

interface Props {
  mode: "create" | "edit";
  types: Option[];
  cities: Option[];
  purposes: Option[];
  defaults?: PropertyDefaults;
}

export function PropertyForm({ mode, types, cities, purposes, defaults = {} }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        if (mode === "create") {
          await createProperty(formData);
        } else if (mode === "edit" && defaults.id) {
          await updateProperty(defaults.id, formData);
        }
      } catch (e) {
        if ((e as Error & { digest?: string }).digest?.toString().startsWith("NEXT_REDIRECT")) {
          // Server action redirected — let Next handle it
          throw e;
        }
        setError((e as Error).message ?? "Erro ao salvar.");
      }
    });
  }

  async function onDelete() {
    if (!defaults.id) return;
    if (!confirm("Tem certeza? Esta ação não pode ser desfeita e remove todas as fotos.")) {
      return;
    }
    startTransition(async () => {
      try {
        await deleteProperty(defaults.id!);
      } catch (e) {
        if ((e as Error & { digest?: string }).digest?.toString().startsWith("NEXT_REDIRECT")) {
          throw e;
        }
        setError((e as Error).message ?? "Erro ao apagar.");
      }
    });
  }

  return (
    <form action={onSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Section: Basics */}
      <Section title="Básico" defaultOpen>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Tipo *">
            <select
              name="type_id"
              required
              defaultValue={defaults.type_id ?? ""}
              className="h-11 w-full rounded-md border border-border bg-white px-3 text-sm"
            >
              <option value="">Selecione...</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Modalidade *">
            <select
              name="modality"
              required
              defaultValue={defaults.modality ?? "venda"}
              className="h-11 w-full rounded-md border border-border bg-white px-3 text-sm"
            >
              <option value="venda">Venda</option>
              <option value="aluguel">Aluguel</option>
              <option value="venda_aluguel">Venda e Aluguel</option>
              <option value="temporada">Temporada</option>
            </select>
          </Field>
          <Field label="Status">
            <select
              name="status"
              defaultValue={defaults.status ?? "rascunho"}
              className="h-11 w-full rounded-md border border-border bg-white px-3 text-sm"
            >
              <option value="rascunho">Rascunho</option>
              <option value="ativo">Ativo</option>
              <option value="reservado">Reservado</option>
              <option value="vendido">Vendido</option>
              <option value="alugado">Alugado</option>
              <option value="inativo">Inativo</option>
            </select>
          </Field>
          <Field label="Finalidade">
            <select
              name="purpose_id"
              defaultValue={defaults.purpose_id ?? ""}
              className="h-11 w-full rounded-md border border-border bg-white px-3 text-sm"
            >
              <option value="">—</option>
              {purposes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Cidade *">
            <select
              name="city_id"
              required
              defaultValue={defaults.city_id ?? cities[0]?.id ?? ""}
              className="h-11 w-full rounded-md border border-border bg-white px-3 text-sm"
            >
              <option value="">Selecione...</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Bairro">
            <Input
              name="neighborhood_name"
              defaultValue={defaults.neighborhood_name ?? ""}
              placeholder="Ex: Jardim da Paineira"
            />
          </Field>
        </div>

        {mode === "edit" && defaults.code && (
          <p className="mt-2 text-xs text-muted-foreground">
            Código: <span className="font-mono font-medium">{defaults.code}</span> (não editável)
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <Checkbox name="is_published" defaultChecked={defaults.is_published} label="Publicar no site" />
          <Checkbox name="is_featured" defaultChecked={defaults.is_featured} label="Destaque" />
          <Checkbox name="is_super_featured" defaultChecked={defaults.is_super_featured} label="Super destaque" />
        </div>
      </Section>

      {/* Section: Address */}
      <Section title="Endereço">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Rua">
            <Input name="street" defaultValue={defaults.street ?? ""} />
          </Field>
          <Field label="Número">
            <Input name="number" defaultValue={defaults.number ?? ""} />
          </Field>
          <Field label="Complemento">
            <Input name="complement" defaultValue={defaults.complement ?? ""} />
          </Field>
          <Field label="CEP">
            <Input name="cep" defaultValue={defaults.cep ?? ""} placeholder="00000-000" />
          </Field>
          <Field label="Ponto de referência" className="sm:col-span-2">
            <Input name="reference_point" defaultValue={defaults.reference_point ?? ""} />
          </Field>
        </div>
        <div className="mt-3">
          <Checkbox
            name="hide_address"
            defaultChecked={defaults.hide_address}
            label="Esconder endereço completo no site público"
          />
        </div>
      </Section>

      {/* Section: Metrics */}
      <Section title="Métricas">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Quartos">
            <Input type="number" min={0} name="bedrooms" defaultValue={defaults.bedrooms ?? 0} />
          </Field>
          <Field label="Suítes">
            <Input type="number" min={0} name="suites" defaultValue={defaults.suites ?? 0} />
          </Field>
          <Field label="Banheiros">
            <Input type="number" min={0} name="bathrooms" defaultValue={defaults.bathrooms ?? 0} />
          </Field>
          <Field label="Vagas">
            <Input
              type="number"
              min={0}
              name="parking_spaces"
              defaultValue={defaults.parking_spaces ?? 0}
            />
          </Field>
          <Field label="Área construída (m²)">
            <Input
              type="number"
              min={0}
              step="0.01"
              name="built_area_m2"
              defaultValue={defaults.built_area_m2 ?? ""}
            />
          </Field>
          <Field label="Área total (m²)">
            <Input
              type="number"
              min={0}
              step="0.01"
              name="total_area_m2"
              defaultValue={defaults.total_area_m2 ?? ""}
            />
          </Field>
          <Field label="Área útil (m²)">
            <Input
              type="number"
              min={0}
              step="0.01"
              name="useful_area_m2"
              defaultValue={defaults.useful_area_m2 ?? ""}
            />
          </Field>
        </div>
      </Section>

      {/* Section: Pricing */}
      <Section title="Valores">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Valor de venda (R$)">
            <Input
              type="number"
              min={0}
              step="0.01"
              name="sale_price"
              defaultValue={defaults.sale_price ?? ""}
            />
          </Field>
          <Field label="Valor de aluguel (R$)">
            <Input
              type="number"
              min={0}
              step="0.01"
              name="rental_price"
              defaultValue={defaults.rental_price ?? ""}
            />
          </Field>
          <Field label="Periodicidade do aluguel">
            <select
              name="rental_period"
              defaultValue={defaults.rental_period ?? ""}
              className="h-11 w-full rounded-md border border-border bg-white px-3 text-sm"
            >
              <option value="">—</option>
              <option value="mensal">Mensal</option>
              <option value="diaria">Diária</option>
              <option value="fim_semana">Fim de semana</option>
            </select>
          </Field>
          <Field label="Condomínio (R$)">
            <Input
              type="number"
              min={0}
              step="0.01"
              name="condo_fee"
              defaultValue={defaults.condo_fee ?? ""}
            />
          </Field>
          <Field label="IPTU anual (R$)">
            <Input
              type="number"
              min={0}
              step="0.01"
              name="iptu_yearly"
              defaultValue={defaults.iptu_yearly ?? ""}
            />
          </Field>
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <Checkbox name="accepts_pet" defaultChecked={defaults.accepts_pet} label="Aceita pet" />
          <Checkbox
            name="accepts_financing"
            defaultChecked={defaults.accepts_financing}
            label="Aceita financiamento"
          />
          <Checkbox
            name="accepts_exchange"
            defaultChecked={defaults.accepts_exchange}
            label="Aceita permuta"
          />
        </div>
      </Section>

      {/* Section: Listing */}
      <Section title="Anúncio">
        <div className="space-y-4">
          <Field label="Título do anúncio">
            <Input
              name="title"
              defaultValue={defaults.title ?? ""}
              maxLength={200}
              placeholder="Ex: Casa com 3 quartos, 220 m², à venda por R$ 1.500.000 - Jardim Lavínia"
            />
          </Field>
          <Field label="Descrição">
            <Textarea
              name="description"
              defaultValue={defaults.description ?? ""}
              rows={6}
              placeholder="Descreva o imóvel..."
            />
          </Field>
          <Field label="Anotações internas (não aparecem no site)">
            <Textarea
              name="internal_notes"
              defaultValue={defaults.internal_notes ?? ""}
              rows={3}
            />
          </Field>
        </div>
      </Section>

      {/* Section: Features */}
      <Section title="Características">
        <div className="space-y-6">
          {FEATURE_GROUPS.map((g) => (
            <div key={g.group}>
              <h4 className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                {g.group}
              </h4>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {g.items.map((f) => (
                  <Checkbox
                    key={f.slug}
                    name={`feature_${f.slug}`}
                    label={f.label}
                    defaultChecked={defaults.features?.[f.slug]}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Section: SEO */}
      <Section title="SEO (opcional)">
        <div className="space-y-4">
          <Field label="Meta título (≤ 60 chars)">
            <Input name="meta_title" defaultValue={defaults.meta_title ?? ""} maxLength={60} />
          </Field>
          <Field label="Meta descrição (≤ 160 chars)">
            <Textarea
              name="meta_description"
              defaultValue={defaults.meta_description ?? ""}
              maxLength={160}
              rows={2}
            />
          </Field>
        </div>
      </Section>

      {/* Footer actions */}
      <div className="sticky bottom-0 -mx-8 mt-8 flex items-center justify-between border-t border-border bg-white/95 backdrop-blur-md px-8 py-4 shadow-card-hover">
        <div className="flex gap-2">
          {mode === "edit" && (
            <Button
              type="button"
              variant="ghost"
              onClick={onDelete}
              disabled={pending}
              className="text-red-700 hover:text-red-800 hover:bg-red-50"
            >
              <Trash2 size={16} /> Apagar
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button asChild variant="ghost" type="button">
            <Link href="/admin/imoveis">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={pending}>
            <Save size={16} /> {pending ? "Salvando..." : mode === "create" ? "Criar imóvel" : "Salvar alterações"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Checkbox({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer text-sm">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="h-4 w-4 rounded border-border text-navy-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500"
      />
      <span>{label}</span>
    </label>
  );
}

function Section({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <details
      open={open}
      onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
      className="rounded-xl border border-border bg-white shadow-card"
    >
      <summary className="flex cursor-pointer items-center justify-between px-6 py-4 select-none">
        <h3 className="font-display text-lg font-bold text-navy-800">{title}</h3>
        <ChevronDown
          size={18}
          className={cn("text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </summary>
      <div className="border-t border-border px-6 py-5">{children}</div>
    </details>
  );
}
