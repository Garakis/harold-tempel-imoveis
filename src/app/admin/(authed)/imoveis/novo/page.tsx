export default function NovoImovelPage() {
  return (
    <div className="p-8 max-w-4xl">
      <h1 className="font-display text-3xl font-bold text-navy-800 mb-2">
        Novo imóvel
      </h1>
      <p className="text-muted-foreground mb-8">
        Wizard de cadastro em 4 etapas: Básico → Características → Anúncio → Fotos.
      </p>

      <div className="rounded-xl border border-dashed border-border bg-muted/30 p-12 text-center text-muted-foreground">
        <p className="text-sm">
          Implementação do wizard será detalhada na próxima sprint.
        </p>
      </div>
    </div>
  );
}
