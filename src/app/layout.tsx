import type { Metadata } from "next";
import { Red_Hat_Display, Open_Sans } from "next/font/google";
import "./globals.css";

const redHatDisplay = Red_Hat_Display({
  variable: "--font-red-hat-display",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
});

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Harold Tempel Imóveis — Intermediando sonhos",
    template: "%s · Harold Tempel Imóveis",
  },
  description:
    "Imobiliária em Mococa/SP. Casas, apartamentos, terrenos, chácaras, sítios e ranchos para venda e locação. CRECI 167881F.",
  metadataBase: new URL("https://www.haroldtempelimoveis.com.br"),
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Harold Tempel Imóveis",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${redHatDisplay.variable} ${openSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
