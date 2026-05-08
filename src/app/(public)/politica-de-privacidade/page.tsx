import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de privacidade",
  description: "Política de privacidade da Harold Tempel Imóveis.",
};

export default function PoliticaPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="font-display text-4xl font-extrabold text-navy-800 mb-8">
        Política de privacidade
      </h1>
      <div className="prose prose-lg max-w-none text-foreground/80 space-y-5 text-sm">
        <p>
          Esta política descreve como a Harold Tempel Imóveis coleta, usa e protege seus
          dados pessoais quando você utiliza nosso site ou entra em contato conosco.
          [Conteúdo placeholder — substituir pelo texto legal definitivo antes da entrada
          em produção, em conformidade com a LGPD.]
        </p>
        <h2 className="font-display text-xl font-bold text-navy-800">Dados coletados</h2>
        <p>
          Coletamos nome, e-mail, telefone e mensagem quando você preenche um dos
          formulários do site (Fale conosco, Cadastre seu imóvel, Encomende seu imóvel,
          contato em ficha de imóvel).
        </p>
        <h2 className="font-display text-xl font-bold text-navy-800">Uso dos dados</h2>
        <p>
          Utilizamos seus dados exclusivamente para responder ao contato solicitado, oferecer
          imóveis compatíveis com seu interesse e cumprir obrigações legais. Não vendemos
          nem compartilhamos seus dados com terceiros sem consentimento explícito.
        </p>
        <h2 className="font-display text-xl font-bold text-navy-800">Direitos do titular</h2>
        <p>
          Você pode solicitar a qualquer momento acesso, correção ou exclusão dos seus
          dados, bem como revogar consentimentos previamente concedidos, entrando em contato
          pelo Fale Conosco.
        </p>
      </div>
    </article>
  );
}
