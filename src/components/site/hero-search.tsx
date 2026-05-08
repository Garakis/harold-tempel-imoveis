"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Sliders } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PRETENSAO_OPTIONS = [
  { value: "a-venda", label: "Comprar" },
  { value: "para-alugar", label: "Alugar" },
  { value: "temporada", label: "Temporada" },
];

const TIPO_OPTIONS = [
  { value: "", label: "Todos os tipos" },
  { value: "casa", label: "Casa" },
  { value: "apartamento", label: "Apartamento" },
  { value: "terreno", label: "Terreno" },
  { value: "chacara", label: "Chácara" },
  { value: "sitio", label: "Sítio" },
  { value: "rancho", label: "Rancho" },
];

export function HeroSearch() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [pretensao, setPretensao] = useState("a-venda");
  const [tipo, setTipo] = useState("");
  const [busca, setBusca] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parts = ["/imoveis", pretensao];
    if (tipo) parts.push(tipo);
    const path = parts.join("/");
    const query = busca ? `?q=${encodeURIComponent(busca)}` : "";
    startTransition(() => router.push(`${path}${query}`));
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl bg-white shadow-card-hover p-3 grid gap-2 md:grid-cols-[auto_auto_1fr_auto_auto] md:items-center md:gap-2"
    >
      <select
        value={pretensao}
        onChange={(e) => setPretensao(e.target.value)}
        className="h-12 rounded-md border border-border bg-white px-4 text-sm font-medium text-navy-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500"
        aria-label="Pretensão"
      >
        {PRETENSAO_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <select
        value={tipo}
        onChange={(e) => setTipo(e.target.value)}
        className="h-12 rounded-md border border-border bg-white px-4 text-sm font-medium text-navy-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500"
        aria-label="Tipo de imóvel"
      >
        {TIPO_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <div className="relative">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={18}
        />
        <Input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Digite condomínio, região, bairro ou cidade"
          className="h-12 pl-11"
        />
      </div>

      <Button type="button" variant="outline" size="md" className="h-12">
        <Sliders size={16} /> Mais filtros
      </Button>

      <Button type="submit" size="md" className="h-12 px-8" disabled={pending}>
        {pending ? "Buscando…" : "Encontrar imóvel"}
      </Button>
    </form>
  );
}
