import { Phone } from "lucide-react";
import { Logo } from "./logo";
import { FacebookIcon, InstagramIcon } from "./social-icons";
import { MainMenu } from "./main-menu";
import { getSettings } from "@/lib/settings";

export async function SiteHeader() {
  const settings = await getSettings();
  const whatsappLink = `https://wa.me/${settings.contact.whatsapp}`;
  const phoneFormatted = settings.contact.phone;
  const addressLine = `${settings.contact.address.street}${
    settings.contact.address.complement
      ? ` — ${settings.contact.address.complement}`
      : ""
  }, ${settings.contact.address.neighborhood} — ${
    settings.contact.address.city
  }/${settings.contact.address.uf}`;

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-24">
          <Logo size="h-16 sm:h-20" />

          <nav className="flex items-center gap-2 sm:gap-6 text-navy-700">
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 hover:text-gold-600 transition-colors"
            >
              <Phone size={18} className="text-gold-500" />
              <div className="text-sm leading-tight">
                <div className="font-semibold">{phoneFormatted}</div>
                <div className="text-xs text-muted-foreground">Entre em contato</div>
              </div>
            </a>

            {settings.social.facebook && (
              <a
                href={settings.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="hidden md:flex items-center gap-2 text-sm font-medium hover:text-gold-600 transition-colors"
              >
                <FacebookIcon size={18} />
                <span className="hidden lg:inline uppercase tracking-wider text-xs">Facebook</span>
              </a>
            )}

            {settings.social.instagram && (
              <a
                href={settings.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="hidden md:flex items-center gap-2 text-sm font-medium hover:text-gold-600 transition-colors"
              >
                <InstagramIcon size={18} />
                <span className="hidden lg:inline uppercase tracking-wider text-xs">Instagram</span>
              </a>
            )}

            <MainMenu
              phone={phoneFormatted}
              whatsappLink={whatsappLink}
              facebookUrl={settings.social.facebook}
              instagramUrl={settings.social.instagram}
              creci={settings.company.creci}
              address={addressLine}
            />
          </nav>
        </div>
      </div>
    </header>
  );
}
