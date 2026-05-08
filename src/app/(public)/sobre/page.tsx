import { getSettings } from "@/lib/settings";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quem somos",
  description:
    "Conheça a Harold Tempel Imóveis, imobiliária de tradição em Mococa/SP. CRECI 167881F.",
};

export default async function SobrePage() {
  const settings = await getSettings();

  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="font-display text-4xl font-extrabold text-navy-800 mb-6">
        Quem somos
      </h1>
      <div className="prose prose-lg max-w-none text-foreground/80 space-y-5">
        <p className="text-xl leading-relaxed text-navy-700">
          A {settings.company.name} intermedia sonhos em {settings.contact.address.city}/
          {settings.contact.address.uf} há anos.
        </p>
        <p>
          Nosso trabalho começa antes da chave: ouvir o que cada cliente realmente precisa,
          pesquisar o mercado com cuidado e oferecer apenas o imóvel que faz sentido pro
          momento dele. Compra ou venda, residência ou negócio, primeira casa ou ampliação
          do patrimônio — cada operação tem o nosso compromisso pessoal de transparência e
          atenção aos detalhes.
        </p>
        <p>
          Atuamos com casas, apartamentos, terrenos, chácaras, sítios e ranchos em Mococa
          e região, sempre com documentação revisada, fotografia profissional e proximidade
          real com proprietários e compradores.
        </p>
        <p className="text-sm text-muted-foreground">
          CRECI: {settings.company.creci}
        </p>
      </div>
    </article>
  );
}
