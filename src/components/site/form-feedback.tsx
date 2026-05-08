import { CheckCircle2, AlertCircle } from "lucide-react";

interface FormFeedbackProps {
  ok?: boolean;
  error?: string | null;
  okMessage?: string;
}

export function FormFeedback({
  ok,
  error,
  okMessage = "Mensagem enviada! Em breve entraremos em contato.",
}: FormFeedbackProps) {
  if (ok) {
    return (
      <div className="flex items-start gap-3 rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
        <p>{okMessage}</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-start gap-3 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
        <AlertCircle size={18} className="mt-0.5 shrink-0" />
        <p>{error}</p>
      </div>
    );
  }
  return null;
}
