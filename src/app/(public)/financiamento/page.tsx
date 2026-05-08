import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Financiamento e bancos",
  description:
    "Simule o financiamento do seu imóvel nos principais bancos: Itaú, Santander, Banco do Brasil, Bradesco e Caixa.",
};

const BANKS = [
  {
    name: "Itaú",
    href: "https://www.itau.com.br/financiamento-imobiliario",
    color: "bg-orange-500",
    initials: "ITAÚ",
  },
  {
    name: "Santander",
    href: "https://www.santander.com.br/financiamentos/imobiliario",
    color: "bg-red-600",
    initials: "ST",
  },
  {
    name: "Banco do Brasil",
    href: "https://www.bb.com.br/site/financiamento-imobiliario",
    color: "bg-yellow-400 text-navy-900",
    initials: "BB",
  },
  {
    name: "Bradesco",
    href: "https://banco.bradesco/html/classic/produtos-servicos/emprestimo-financiamento/encontre-seu-credito/financiamento-imobiliario.shtm",
    color: "bg-red-700",
    initials: "BR",
  },
  {
    name: "Caixa",
    href: "https://www.caixa.gov.br/voce/habitacao",
    color: "bg-blue-600",
    initials: "CAIXA",
  },
];

export default function FinanciamentoPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="font-display text-4xl font-extrabold text-navy-800 mb-3">
        Financiamento e bancos
      </h1>
      <p className="text-muted-foreground mb-10">
        Escolha um banco e faça a sua simulação de financiamento imobiliário.
      </p>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-5">
        {BANKS.map((bank) => (
          <a
            key={bank.name}
            href={bank.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-xl border border-border bg-white p-5 text-center shadow-card hover:shadow-card-hover transition"
          >
            <div
              className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full text-white font-bold text-sm ${bank.color}`}
            >
              {bank.initials}
            </div>
            <div className="mt-3 text-sm font-medium text-navy-800 group-hover:text-gold-600">
              {bank.name}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
