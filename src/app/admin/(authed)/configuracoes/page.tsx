import { getSettings } from "@/lib/settings";

export default async function ConfiguracoesPage() {
  const settings = await getSettings();
  return (
    <div className="p-8 max-w-3xl">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold text-navy-800">Configurações</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Dados da imobiliária exibidos no site público.
        </p>
      </header>

      <div className="space-y-4">
        <Section title="Empresa">
          <Field label="Nome" value={settings.company.name} />
          <Field label="Slogan" value={settings.company.tagline} />
          <Field label="CRECI" value={settings.company.creci} />
        </Section>

        <Section title="Contato">
          <Field label="Telefone" value={settings.contact.phone} />
          <Field label="WhatsApp" value={settings.contact.whatsapp} />
          <Field label="Endereço" value={`${settings.contact.address.street} — ${settings.contact.address.neighborhood}, ${settings.contact.address.city}/${settings.contact.address.uf}`} />
        </Section>

        <Section title="Redes sociais">
          <Field label="Facebook" value={settings.social.facebook ?? "—"} />
          <Field label="Instagram" value={settings.social.instagram ?? "—"} />
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl bg-white border border-border p-6 shadow-card">
      <h2 className="font-display text-lg font-bold text-navy-800 mb-4">{title}</h2>
      <dl className="space-y-3">{children}</dl>
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-navy-800 text-right break-all">{value}</dd>
    </div>
  );
}
