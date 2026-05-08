import Link from "next/link";
import { Logo } from "./logo";
import { FacebookIcon, InstagramIcon } from "./social-icons";
import { getSettings } from "@/lib/settings";

const FOOTER_LINKS = {
  Institucional: [
    { href: "/sobre", label: "Quem somos" },
    { href: "/politica-de-privacidade", label: "Política de privacidade" },
  ],
  Imóveis: [
    { href: "/cadastre-seu-imovel", label: "Cadastre seu imóvel" },
    { href: "/encomende-seu-imovel", label: "Encomende seu imóvel" },
  ],
  Serviços: [
    { href: "/financiamento", label: "Financiamento e bancos" },
  ],
  Contato: [
    { href: "/fale-conosco", label: "Fale conosco" },
  ],
};

const SEO_LINKS = [
  { href: "/imoveis/a-venda/casa", label: "Casas à venda" },
  { href: "/imoveis/para-alugar/casa", label: "Casas para alugar" },
  { href: "/imoveis/a-venda/apartamento", label: "Apartamentos à venda" },
  { href: "/imoveis/a-venda/terreno", label: "Terrenos à venda" },
  { href: "/imoveis/a-venda/chacara", label: "Chácaras à venda" },
  { href: "/imoveis/para-alugar/chacara", label: "Chácaras para alugar" },
  { href: "/imoveis/a-venda/sitio", label: "Sítios à venda" },
  { href: "/imoveis/a-venda/rancho", label: "Ranchos à venda" },
];

export async function SiteFooter() {
  const settings = await getSettings();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 bg-navy-900 text-white">
      {/* SEO links section */}
      <div className="border-b border-white/10 bg-navy-800">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <h3 className="font-display text-lg font-bold text-white mb-5">
            Descubra outras possibilidades de imóveis
          </h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
            {SEO_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-white/80 hover:text-gold-400 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Logo variant="light" href="/" />
            <p className="mt-4 max-w-sm text-sm text-white/70">
              {settings.company.tagline}. Imobiliária em {settings.contact.address.city}/
              {settings.contact.address.uf}, CRECI {settings.company.creci}.
            </p>
            <address className="mt-4 not-italic text-sm text-white/70 leading-relaxed">
              {settings.contact.address.street}
              {settings.contact.address.complement
                ? ` — ${settings.contact.address.complement}`
                : ""}
              <br />
              {settings.contact.address.neighborhood} — {settings.contact.address.city}/
              {settings.contact.address.uf}
              <br />
              <a
                href={`tel:${settings.contact.phone.replace(/\D/g, "")}`}
                className="hover:text-gold-400"
              >
                {settings.contact.phone}
              </a>
            </address>
          </div>

          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="font-display text-base font-bold text-gold-400 mb-3">
                {heading}
              </h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/70 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-6 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-xs text-white/50">
            © {year} {settings.company.name}. Todos os direitos reservados. CRECI{" "}
            {settings.company.creci}.
          </p>
          <div className="flex items-center gap-4">
            {settings.social.facebook && (
              <a
                href={settings.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="rounded-full border border-white/20 p-2 text-white/70 hover:text-white hover:border-white transition"
              >
                <FacebookIcon size={16} />
              </a>
            )}
            {settings.social.instagram && (
              <a
                href={settings.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="rounded-full border border-white/20 p-2 text-white/70 hover:text-white hover:border-white transition"
              >
                <InstagramIcon size={16} />
              </a>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
