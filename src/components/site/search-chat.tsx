"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { submitSearchChatLead } from "@/app/_actions/leads";

/**
 * Guided property-search chat widget (bottom-left).
 * Replicates the original Kenlo bot flow:
 *   nome → objetivo → finalidade → tipo → cidade? → quartos → preço →
 *   (oferta de falar com corretor) → redireciona pra listagem filtrada
 */

type BotMessage =
  | { kind: "bot"; text: string }
  | { kind: "user"; text: string };

interface State {
  name: string;
  objective: string; // Comprar | Alugar | Indiferente
  purpose: string; // Residencial | Rural | Temporada
  propertyType: string; // apartamento | casa | chacara | rancho | terreno
  bedrooms: string; // 1 | 2 | 3 | 4 | 5
  priceRange: string; // até-150k | 150-300k | ...
}

type Step =
  | "ask_name"
  | "ask_objective"
  | "ask_purpose"
  | "ask_property_type"
  | "ask_bedrooms"
  | "ask_price"
  | "offer_lead"
  | "ask_phone"
  | "show_results";

const OBJECTIVE_BUTTONS = [
  { label: "Comprar", value: "Comprar" },
  { label: "Alugar", value: "Alugar" },
  { label: "Indiferente", value: "Indiferente" },
];

const PURPOSE_BUTTONS = [
  { label: "Residencial", value: "Residencial" },
  { label: "Rural", value: "Rural" },
  { label: "Temporada", value: "Temporada" },
];

const TYPE_BUTTONS = [
  { label: "Apartamento", value: "apartamento" },
  { label: "Casa", value: "casa" },
  { label: "Chácara", value: "chacara" },
  { label: "Rancho", value: "rancho" },
  { label: "Terreno", value: "terreno" },
];

const BEDROOMS_BUTTONS = [
  { label: "1+", value: "1" },
  { label: "2+", value: "2" },
  { label: "3+", value: "3" },
  { label: "4+", value: "4" },
  { label: "5+", value: "5" },
];

const PRICE_BUTTONS = [
  { label: "Até 150.000", value: "0-150000" },
  { label: "De 150.000 até 300.000", value: "150000-300000" },
  { label: "De 300.000 até 500.000", value: "300000-500000" },
  { label: "De 500.000 até 700.000", value: "500000-700000" },
  { label: "Acima de 700.000", value: "700000-" },
];

function buildSearchUrl(state: State): string {
  const objMap: Record<string, string> = {
    Comprar: "a-venda",
    Alugar: "para-alugar",
    Indiferente: "a-venda",
  };
  if (state.purpose === "Temporada") {
    // temporada is its own modality
    return `/imoveis/temporada${state.propertyType ? `/${state.propertyType}` : ""}`;
  }
  const segments = ["/imoveis"];
  segments.push(objMap[state.objective] ?? "a-venda");
  if (state.propertyType) segments.push(state.propertyType);
  const path = segments.join("/");

  const params = new URLSearchParams();
  if (state.bedrooms) params.set("quartos", state.bedrooms);
  if (state.priceRange) {
    const [min, max] = state.priceRange.split("-");
    if (min) params.set("preco_min", min);
    if (max) params.set("preco_max", max);
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export function SearchChat() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("ask_name");
  const [state, setState] = useState<State>({
    name: "",
    objective: "",
    purpose: "",
    propertyType: "",
    bedrooms: "",
    priceRange: "",
  });
  const [messages, setMessages] = useState<BotMessage[]>([
    {
      kind: "bot",
      text:
        "Olá, tudo bem? Meu nome é Harold Tempel. Vou te ajudar a encontrar o imóvel ideal — só preciso de algumas informações.",
    },
    { kind: "bot", text: "Qual seu nome?" },
  ]);
  const [nameInput, setNameInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const searchUrl = useMemo(() => buildSearchUrl(state), [state]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, step]);

  function pushBot(...texts: string[]) {
    setMessages((m) => [...m, ...texts.map((text) => ({ kind: "bot" as const, text }))]);
  }
  function pushUser(text: string) {
    setMessages((m) => [...m, { kind: "user" as const, text }]);
  }

  function submitName(name: string) {
    const trimmed = name.trim();
    if (trimmed.length < 2) return;
    pushUser(trimmed);
    setState((s) => ({ ...s, name: trimmed }));
    setNameInput("");
    setTimeout(() => {
      pushBot(`Certo, ${trimmed}. Qual é o seu objetivo?`);
      setStep("ask_objective");
    }, 200);
  }

  function pickObjective(value: string) {
    pushUser(value);
    setState((s) => ({ ...s, objective: value }));
    setTimeout(() => {
      pushBot("E para qual finalidade seria o imóvel?");
      setStep("ask_purpose");
    }, 200);
  }

  function pickPurpose(value: string) {
    pushUser(value);
    setState((s) => ({ ...s, purpose: value }));
    setTimeout(() => {
      pushBot("Vou te apresentar alguns tipos de imóveis que temos disponíveis:");
      setStep("ask_property_type");
    }, 200);
  }

  function pickType(value: string, label: string) {
    pushUser(label);
    setState((s) => ({ ...s, propertyType: value }));
    setTimeout(() => {
      if (value === "terreno") {
        pushBot("Qual a faixa de preço que você procura?");
        setStep("ask_price");
      } else {
        pushBot("Quantos quartos você gostaria?");
        setStep("ask_bedrooms");
      }
    }, 200);
  }

  function pickBedrooms(value: string, label: string) {
    pushUser(label);
    setState((s) => ({ ...s, bedrooms: value }));
    setTimeout(() => {
      pushBot("Para deixar sua busca ainda melhor, qual o valor do imóvel?");
      setStep("ask_price");
    }, 200);
  }

  function pickPrice(value: string, label: string) {
    pushUser(label);
    setState((s) => ({ ...s, priceRange: value }));
    setTimeout(() => {
      pushBot(
        "Achei alguns imóveis que combinam com sua busca! Quer falar com um corretor agora? Posso te transferir."
      );
      setStep("offer_lead");
    }, 200);
  }

  function declineLead() {
    pushUser("Agora não, obrigado");
    setTimeout(() => {
      pushBot("Tudo bem! Te levo direto para os imóveis 👌");
      setStep("show_results");
      setTimeout(() => {
        window.location.href = searchUrl;
      }, 800);
    }, 200);
  }

  function acceptLead() {
    pushUser("Sim, quero falar");
    setTimeout(() => {
      pushBot("Ótimo! Me passa seu telefone com DDD pra eu te conectar com a Roberta.");
      setStep("ask_phone");
    }, 200);
  }

  return (
    <>
      {/* Floating launcher */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Fechar chat" : "Abrir chat de busca"}
        className="fixed bottom-4 left-4 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-gold-500 text-white shadow-card-hover hover:bg-gold-600 transition-colors"
      >
        {open ? <X size={22} /> : <MessageCircle size={24} />}
      </button>

      {/* Panel */}
      {open && (
        <div
          className="fixed bottom-24 left-4 z-40 w-[calc(100vw-2rem)] max-w-sm rounded-2xl bg-white shadow-card-hover border border-border flex flex-col overflow-hidden"
          style={{ maxHeight: "min(80vh, 600px)" }}
          role="dialog"
          aria-label="Chat de busca"
        >
          <header className="px-4 py-3 border-b border-border bg-navy-700 text-white flex items-center justify-between">
            <div>
              <div className="font-display font-bold text-sm">Harold Tempel</div>
              <div className="text-xs text-white/70">Corretor virtual</div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fechar"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-navy-800 transition-colors"
            >
              <X size={16} />
            </button>
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-snug ${
                  m.kind === "bot"
                    ? "bg-muted/60 text-foreground"
                    : "ml-auto bg-navy-700 text-white"
                }`}
              >
                {m.text}
              </div>
            ))}

            {/* Option buttons depending on step */}
            {step === "ask_objective" && (
              <OptionRow>
                {OBJECTIVE_BUTTONS.map((b) => (
                  <OptionButton key={b.value} onClick={() => pickObjective(b.value)}>
                    {b.label}
                  </OptionButton>
                ))}
              </OptionRow>
            )}

            {step === "ask_purpose" && (
              <OptionRow>
                {PURPOSE_BUTTONS.map((b) => (
                  <OptionButton key={b.value} onClick={() => pickPurpose(b.value)}>
                    {b.label}
                  </OptionButton>
                ))}
              </OptionRow>
            )}

            {step === "ask_property_type" && (
              <OptionRow>
                {TYPE_BUTTONS.map((b) => (
                  <OptionButton key={b.value} onClick={() => pickType(b.value, b.label)}>
                    {b.label}
                  </OptionButton>
                ))}
              </OptionRow>
            )}

            {step === "ask_bedrooms" && (
              <OptionRow>
                {BEDROOMS_BUTTONS.map((b) => (
                  <OptionButton key={b.value} onClick={() => pickBedrooms(b.value, b.label)}>
                    {b.label}
                  </OptionButton>
                ))}
              </OptionRow>
            )}

            {step === "ask_price" && (
              <OptionRow>
                {PRICE_BUTTONS.map((b) => (
                  <OptionButton key={b.value} onClick={() => pickPrice(b.value, b.label)}>
                    {b.label}
                  </OptionButton>
                ))}
              </OptionRow>
            )}

            {step === "offer_lead" && (
              <OptionRow>
                <OptionButton onClick={acceptLead}>Sim, quero falar</OptionButton>
                <OptionButton onClick={declineLead}>Agora não</OptionButton>
              </OptionRow>
            )}

            {step === "show_results" && (
              <a
                href={searchUrl}
                className="inline-block rounded-pill bg-navy-700 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800 transition-colors"
              >
                Ver imóveis →
              </a>
            )}
          </div>

          {/* Footer / inputs */}
          {step === "ask_name" && (
            <form
              className="border-t border-border p-3 flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                submitName(nameInput);
              }}
            >
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Digite seu nome…"
                className="flex-1 h-10 rounded-md border border-border px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                autoFocus
              />
              <button
                type="submit"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-navy-700 text-white hover:bg-navy-800 transition-colors disabled:opacity-50"
                disabled={nameInput.trim().length < 2}
                aria-label="Enviar"
              >
                <Send size={16} />
              </button>
            </form>
          )}

          {step === "ask_phone" && (
            <form
              action={submitSearchChatLead}
              className="border-t border-border p-3 space-y-2"
            >
              <input type="hidden" name="name" value={state.name} />
              <input type="hidden" name="next" value={searchUrl} />
              <input type="hidden" name="objective" value={state.objective} />
              <input type="hidden" name="purpose" value={state.purpose} />
              <input type="hidden" name="property_type" value={state.propertyType} />
              <input type="hidden" name="bedrooms" value={state.bedrooms} />
              <input type="hidden" name="price_range" value={state.priceRange} />
              <div className="flex items-center gap-2">
                <input
                  type="tel"
                  name="phone"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="(19) 99999-9999"
                  className="flex-1 h-10 rounded-md border border-border px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                  required
                  autoFocus
                />
                <button
                  type="submit"
                  className="inline-flex h-10 px-3 items-center justify-center rounded-md bg-navy-700 text-white text-sm font-medium hover:bg-navy-800 transition-colors disabled:opacity-50"
                  disabled={phoneInput.replace(/\D/g, "").length < 10}
                >
                  Enviar
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Você será redirecionado para a lista de imóveis após enviar.
              </p>
            </form>
          )}
        </div>
      )}
    </>
  );
}

function OptionRow({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-2 pt-1">{children}</div>;
}

function OptionButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-pill border border-border bg-white px-3 py-1.5 text-sm font-medium text-navy-700 hover:bg-navy-50 hover:border-navy-300 transition-colors"
    >
      {children}
    </button>
  );
}
