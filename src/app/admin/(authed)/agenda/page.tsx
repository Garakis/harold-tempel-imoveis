import { Calendar } from "lucide-react";

export default function AgendaPage() {
  return (
    <div className="p-8">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold text-navy-800">Agenda</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Roteiros de visita aos imóveis.
        </p>
      </header>
      <div className="rounded-xl border border-dashed border-border bg-muted/30 p-12 text-center text-muted-foreground">
        <Calendar className="mx-auto mb-3" size={32} />
        Calendário de visitas será implementado na próxima sprint.
      </div>
    </div>
  );
}
