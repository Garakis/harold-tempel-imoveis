import { Resend } from "resend";

/**
 * Lazy-init Resend client. Returns null if RESEND_API_KEY is missing,
 * so the app keeps working in dev/preview without email configured.
 */
function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

interface SendArgs {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

/**
 * Send an email via Resend. Throws on hard errors; returns { ok: false } if
 * Resend isn't configured so callers can decide whether to ignore.
 */
export async function sendEmail(args: SendArgs): Promise<
  | { ok: true; id: string }
  | { ok: false; reason: string }
> {
  const resend = getResend();
  if (!resend) {
    return { ok: false, reason: "RESEND_API_KEY not set" };
  }
  const from =
    process.env.LEAD_EMAIL_FROM ??
    "Harold Tempel Imóveis <onboarding@resend.dev>";

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: Array.isArray(args.to) ? args.to : [args.to],
      subject: args.subject,
      html: args.html,
      replyTo: args.replyTo,
    });
    if (error) {
      console.error("Resend error:", error);
      return { ok: false, reason: error.message ?? "unknown resend error" };
    }
    return { ok: true, id: data?.id ?? "" };
  } catch (err) {
    console.error("sendEmail threw:", err);
    return {
      ok: false,
      reason: err instanceof Error ? err.message : "unknown error",
    };
  }
}

/**
 * Escape HTML special characters for safe interpolation in templates.
 */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
