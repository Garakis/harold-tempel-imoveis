export default function ProprietariosPage() {
  return (
    <div className="p-8">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold text-navy-800">
          Proprietários
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Cadastro de proprietários (dados confidenciais — PII).
        </p>
      </header>
      <div className="rounded-xl border border-dashed border-border bg-muted/30 p-12 text-center text-muted-foreground">
        Lista de proprietários e cadastro vinculado a imóveis.
      </div>
    </div>
  );
}
