import { escapeHtml } from "./send";

interface BaseTemplateOpts {
  preheader?: string;
  title: string;
  bodyHtml: string;
  footerHtml?: string;
}

/**
 * Minimal email shell with HTI brand colors (gold + navy).
 * Inline styles only — most clients strip <style>.
 */
function shell({ preheader, title, bodyHtml, footerHtml }: BaseTemplateOpts): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width" />
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f7f7f9;font-family:'Segoe UI',Arial,sans-serif;color:#0a121d;">
${preheader ? `<div style="display:none;font-size:1px;color:#f7f7f9;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(preheader)}</div>` : ""}
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background:#f7f7f9;">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;box-shadow:0 4px 16px rgba(10,18,29,.06);overflow:hidden;">
        <tr>
          <td style="background:#0a121d;padding:20px 28px;color:#d4a847;font-family:'Georgia',serif;font-weight:bold;font-size:18px;letter-spacing:.05em;">
            HAROLD TEMPEL <span style="color:#ffffff;font-weight:normal;">— IMÓVEIS</span>
          </td>
        </tr>
        <tr>
          <td style="padding:28px;">
            ${bodyHtml}
          </td>
        </tr>
        ${footerHtml ? `<tr><td style="padding:16px 28px;background:#f5f5f7;border-top:1px solid #eaeaee;font-size:12px;color:#666;">${footerHtml}</td></tr>` : ""}
      </table>
      <p style="font-size:11px;color:#9ca3af;margin:16px 0 0;text-align:center;">
        Harold Tempel Imóveis · CRECI 167881F · Mococa/SP
      </p>
    </td>
  </tr>
</table>
</body>
</html>`;
}

export interface LeadNotifyData {
  type: "contato" | "interesse_imovel" | "agendar_visita" | "cadastrar_imovel" | "encomendar_imovel";
  source: string;
  name: string;
  email: string | null;
  phone: string | null;
  message: string | null;
  property_code?: string | null;
  property_url?: string | null;
  property_title?: string | null;
  admin_url: string;
  metadata?: Record<string, unknown>;
}

const TYPE_LABELS: Record<LeadNotifyData["type"], string> = {
  contato: "Mensagem de contato",
  interesse_imovel: "Interesse em imóvel",
  agendar_visita: "Pedido de visita",
  cadastrar_imovel: "Cadastrar imóvel",
  encomendar_imovel: "Imóvel sob encomenda",
};

/**
 * Internal notification — goes to the realtor (Roberta).
 */
export function renderLeadNotificationEmail(data: LeadNotifyData): {
  subject: string;
  html: string;
} {
  const typeLabel = TYPE_LABELS[data.type];
  const subject = `Novo lead: ${typeLabel} — ${data.name}`;

  const rows = [
    ["Nome", data.name],
    ["E-mail", data.email ?? "—"],
    ["Telefone", data.phone ?? "—"],
    ["Origem", data.source.replace(/_/g, " ")],
    data.property_code
      ? ["Imóvel", `${data.property_code}${data.property_title ? ` — ${data.property_title}` : ""}`]
      : null,
  ].filter(Boolean) as Array<[string, string]>;

  const phoneDigits = (data.phone ?? "").replace(/\D/g, "");
  const whatsappLink =
    phoneDigits.length >= 10
      ? `https://wa.me/${phoneDigits.startsWith("55") ? phoneDigits : "55" + phoneDigits}`
      : null;

  const tableRows = rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 12px;background:#f5f5f7;font-weight:600;width:120px;border-radius:6px 0 0 6px;">${escapeHtml(k)}</td><td style="padding:8px 12px;background:#f9f9fb;border-radius:0 6px 6px 0;">${escapeHtml(v)}</td></tr>`
    )
    .join("<tr><td colspan='2' style='height:6px;'></td></tr>");

  const body = `
    <h1 style="font-family:'Georgia',serif;color:#0a121d;font-size:22px;margin:0 0 4px;">${escapeHtml(typeLabel)}</h1>
    <p style="margin:0 0 20px;color:#666;font-size:14px;">Um novo contato chegou pelo site.</p>

    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:0;font-size:14px;">
      ${tableRows}
    </table>

    ${data.message ? `<div style="margin-top:24px;padding:16px;background:#fffbeb;border-left:3px solid #d4a847;border-radius:6px;"><div style="font-size:12px;color:#8b6f1f;text-transform:uppercase;letter-spacing:.05em;font-weight:600;margin-bottom:6px;">Mensagem</div><div style="white-space:pre-line;font-size:14px;line-height:1.5;">${escapeHtml(data.message)}</div></div>` : ""}

    <div style="margin-top:24px;display:flex;gap:8px;flex-wrap:wrap;">
      ${whatsappLink ? `<a href="${whatsappLink}" style="display:inline-block;background:#25d366;color:#fff;text-decoration:none;padding:10px 18px;border-radius:999px;font-size:14px;font-weight:600;margin-right:6px;">Responder no WhatsApp</a>` : ""}
      ${data.email ? `<a href="mailto:${escapeHtml(data.email)}" style="display:inline-block;background:#0a121d;color:#fff;text-decoration:none;padding:10px 18px;border-radius:999px;font-size:14px;font-weight:600;margin-right:6px;">Responder por e-mail</a>` : ""}
      <a href="${data.admin_url}" style="display:inline-block;background:#fff;color:#0a121d;text-decoration:none;padding:10px 18px;border-radius:999px;font-size:14px;font-weight:600;border:1px solid #eaeaee;">Abrir no painel</a>
    </div>
  `;

  return {
    subject,
    html: shell({
      preheader: `${data.name} — ${data.phone ?? data.email ?? ""}`,
      title: subject,
      bodyHtml: body,
    }),
  };
}

/**
 * Auto-response sent back to the lead's email (when available).
 */
export function renderLeadAutoResponse(data: {
  name: string;
  type: LeadNotifyData["type"];
  property_code?: string | null;
  property_title?: string | null;
  property_url?: string | null;
  whatsapp_url: string;
}): { subject: string; html: string } {
  const firstName = data.name.split(/\s+/)[0] || "Olá";
  const subject = "Recebemos sua mensagem - Harold Tempel Imóveis";

  const body = `
    <h1 style="font-family:'Georgia',serif;color:#0a121d;font-size:22px;margin:0 0 12px;">Olá, ${escapeHtml(firstName)}!</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#333;">
      Recebemos sua ${data.type === "agendar_visita" ? "solicitação de visita" : "mensagem"}
      ${data.property_code ? ` referente ao imóvel <strong>${escapeHtml(data.property_code)}</strong>` : ""}
      e em breve um de nossos consultores entrará em contato.
    </p>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#333;">
      Se preferir uma resposta mais rápida, fale com a gente no WhatsApp:
    </p>

    <div style="margin:0 0 24px;">
      <a href="${data.whatsapp_url}" style="display:inline-block;background:#25d366;color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-size:15px;font-weight:600;">Falar no WhatsApp</a>
    </div>

    ${data.property_url ? `<p style="margin:24px 0 0;font-size:14px;color:#666;">Você pode revisar o imóvel <a href="${data.property_url}" style="color:#0a121d;text-decoration:underline;">aqui</a>.</p>` : ""}
  `;

  return {
    subject,
    html: shell({
      preheader: "Recebemos sua mensagem. Em breve entraremos em contato.",
      title: subject,
      bodyHtml: body,
      footerHtml:
        "Harold Tempel Imóveis · Mococa/SP · (19) 98905-6113 · CRECI 167881F",
    }),
  };
}
