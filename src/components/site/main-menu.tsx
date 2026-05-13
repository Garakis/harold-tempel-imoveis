"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, Menu, Phone } from "lucide-react";
import { FacebookIcon, InstagramIcon } from "./social-icons";

interface Section {
  title: string;
  links: Array<{ href: string; label: string; external?: boolean }>;
}

interface MainMenuProps {
  phone: string;
  whatsappLink: string;
  facebookUrl: string | null;
  instagramUrl: string | null;
  creci: string;
  address: string;
}

const SECTIONS: Section[] = [
  {
    title: "Institucional",
    links: [
      { href: "/sobre", label: "Quem somos" },
      { href: "/politica-de-privacidade", label: "Política de privacidade" },
    ],
  },
  {
    title: "Imóveis",
    links: [
      { href: "/imoveis/a-venda", label: "Imóveis à venda" },
      { href: "/imoveis/para-alugar", label: "Imóveis para alugar" },
      { href: "/cadastre-seu-imovel", label: "Cadastre seu imóvel" },
      { href: "/encomende-seu-imovel", label: "Encomende seu imóvel" },
    ],
  },
  {
    title: "Serviços",
    links: [{ href: "/financiamento", label: "Financiamento e bancos" }],
  },
  {
    title: "Contato",
    links: [{ href: "/fale-conosco", label: "Fale conosco" }],
  },
];

export function MainMenu({
  phone,
  whatsappLink,
  facebookUrl,
  instagramUrl,
  creci,
  address,
}: MainMenuProps) {
  const [open, setOpen] = useState(false);

  // Lock body scroll while menu is open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-md text-navy-700 hover:bg-navy-50 transition-colors"
        aria-label="Abrir menu"
        aria-expanded={open}
      >
        <Menu size={24} />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-navy-900/40 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 z-50 h-svh w-full max-w-sm bg-white shadow-card-hover transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Menu principal"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-6 py-5 border-b border-border">
            <span className="font-display font-bold text-navy-800">Menu</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-navy-700 hover:bg-navy-50"
              aria-label="Fechar menu"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-6 py-6 space-y-7">
            {SECTIONS.map((section) => (
              <div key={section.title}>
                <h3 className="font-display text-xs uppercase tracking-[0.2em] text-gold-600 mb-3">
                  {section.title}
                </h3>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={() => setOpen(false)}
                        className="block text-base text-navy-800 hover:text-gold-600 transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          <footer className="border-t border-border px-6 py-5 space-y-3 text-sm">
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-navy-700 hover:text-gold-600"
            >
              <Phone size={16} className="text-gold-500" />
              <span className="font-semibold">{phone}</span>
            </a>
            <p className="text-xs text-muted-foreground leading-relaxed">{address}</p>
            <div className="flex items-center gap-3 pt-1">
              {facebookUrl && (
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="text-navy-700 hover:text-gold-600"
                >
                  <FacebookIcon size={18} />
                </a>
              )}
              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="text-navy-700 hover:text-gold-600"
                >
                  <InstagramIcon size={18} />
                </a>
              )}
              <span className="ml-auto text-xs text-muted-foreground">
                CRECI {creci}
              </span>
            </div>
          </footer>
        </div>
      </aside>
    </>
  );
}
