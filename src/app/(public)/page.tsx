import Link from "next/link";
import { ArrowRight, Building2, DollarSign, FileText } from "lucide-react";
import { HeroSearch } from "@/components/site/hero-search";
import { PropertyGrid } from "@/components/site/property-grid";
import { MostSearchedCarousel } from "@/components/site/most-searched-carousel";
import {
  getFeaturedProperties,
  getTopNeighborhoodCards,
} from "@/lib/domain/queries";
import { getSettings } from "@/lib/settings";

export default async function HomePage() {
  const [settings, featured, topCards] = await Promise.all([
    getSettings(),
    getFeaturedProperties(),
    getTopNeighborhoodCards(10),
  ]);

  return (
    <>
      {/* HERO */}
      <section className="relative isolate min-h-[600px] flex items-center">
        <div
          className="absolute inset-0 -z-10 bg-cover bg-center"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(10,18,29,0.55) 0%, rgba(10,18,29,0.65) 100%), url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&h=1080&fit=crop')",
          }}
        />
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center text-white mb-10">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold drop-shadow">
              {settings.company.name}
            </h1>
            <p className="mt-3 text-lg sm:text-xl text-white/90 font-display tracking-wide">
              {settings.company.tagline}
            </p>
          </div>
          <div className="mx-auto max-w-5xl">
            <HeroSearch />
            <p className="mt-3 text-center">
              <Link
                href="/imoveis?codigo"
                className="inline-block text-white/90 underline-offset-4 hover:underline text-sm bg-black/30 px-4 py-1 rounded-pill"
              >
                Busca por código
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* IMÓVEIS À VENDA — Destaques */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-navy-800">
            Imóveis a venda
          </h2>
          <div className="mt-4 inline-flex rounded-pill border border-border bg-white p-1 text-sm">
            <button className="rounded-pill bg-navy-700 text-white px-5 py-1.5 font-medium">
              Destaques
            </button>
            <Link
              href="/imoveis/a-venda"
              className="rounded-pill px-5 py-1.5 font-medium text-navy-700 hover:bg-navy-50 inline-flex items-center gap-1"
            >
              Ver mais <ArrowRight size={14} />
            </Link>
          </div>
        </div>
        <PropertyGrid properties={featured} />
      </section>

      {/* 3-COL ACTIONS */}
      <section className="bg-muted/30 border-y border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid gap-8 sm:grid-cols-3">
            <ActionCard
              href="/encomende-seu-imovel"
              icon={<FileText className="text-navy-700" size={28} />}
              title="Imóvel sob encomenda"
              description="Descreva o imóvel que você procura e nós avisaremos quando encontrarmos."
              cta="Encomende seu imóvel"
            />
            <ActionCard
              href="/financiamento"
              icon={<DollarSign className="text-navy-700" size={28} />}
              title="Financiamento"
              description="As melhores ofertas de crédito para você financiar seu imóvel."
              cta="Faça uma simulação"
            />
            <ActionCard
              href="/cadastre-seu-imovel"
              icon={<Building2 className="text-navy-700" size={28} />}
              title="Cadastre seu imóvel"
              description="Anuncie conosco! Nós encontraremos o melhor negócio para você."
              cta="Cadastre seu imóvel"
            />
          </div>
        </div>
      </section>

      {/* IMÓVEIS MAIS BUSCADOS */}
      {topCards.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-center font-display text-3xl font-bold text-navy-800 mb-10">
            Imóveis mais buscados
          </h2>
          <MostSearchedCarousel cards={topCards} />
        </section>
      )}

      {/* CONTACT CARD */}
      <section className="bg-muted/30 border-t border-border">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="rounded-2xl bg-white shadow-card p-8 text-center">
            <div className="font-display text-2xl font-extrabold text-gold-500 tracking-wider">
              HAROLD TEMPEL
            </div>
            <div className="font-display text-xs tracking-[0.4em] text-navy-700 mt-1">
              IMÓVEIS
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              CRECI: {settings.company.creci}
            </p>
            <p className="mt-6 text-lg font-semibold text-navy-800">
              {settings.contact.phone}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

function ActionCard({
  href,
  icon,
  title,
  description,
  cta,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-border bg-white p-6 shadow-card hover:shadow-card-hover transition-shadow"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-navy-50">
        {icon}
      </div>
      <h3 className="mt-4 font-display text-xl font-bold text-navy-800">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-navy-700 group-hover:text-gold-600 border-b border-navy-700 group-hover:border-gold-600 pb-1 transition">
        {cta} <ArrowRight size={14} />
      </span>
    </Link>
  );
}
