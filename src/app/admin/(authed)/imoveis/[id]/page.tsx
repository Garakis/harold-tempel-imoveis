interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditarImovelPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <div className="p-8 max-w-4xl">
      <h1 className="font-display text-3xl font-bold text-navy-800 mb-2">
        Editar imóvel
      </h1>
      <p className="text-muted-foreground mb-8 text-sm font-mono">{id}</p>
      <div className="rounded-xl border border-dashed border-border bg-muted/30 p-12 text-center text-muted-foreground">
        Edição em abas (Resumo · Detalhes · Empreendimento · Anúncio · Fotos · Proprietário ·
        Histórico).
      </div>
    </div>
  );
}
