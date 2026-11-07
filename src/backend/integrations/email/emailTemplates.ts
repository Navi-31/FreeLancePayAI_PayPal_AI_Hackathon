/**
 * Executive luxury HTML email templates for FreelancePay AI.
 * Mobile-responsive, high-contrast, accessible HTML with plain text fallbacks.
 */

export interface InvoiceEmailOptions {
  invoiceCode: string;
  clientName: string;
  senderName: string;
  totalFormatted: string;
  dueDateFormatted: string;
  paymentUrl: string;
  lineItems: Array<{ description: string; quantity: number | string; rate: number | string; amount: number | string }>;
  notes?: string;
}

export function renderInvoiceEmail(opts: InvoiceEmailOptions): { text: string; html: string } {
  const lineItemsHtml = opts.lineItems
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #27272a; color: #e4e4e7; font-size: 13px;">${item.description}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #27272a; color: #a1a1aa; font-size: 13px; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #27272a; color: #a1a1aa; font-size: 13px; text-align: right;">${item.rate}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #27272a; color: #fbbf24; font-size: 13px; text-align: right; font-weight: 600;">${item.amount}</td>
      </tr>`
    )
    .join("");

  const lineItemsText = opts.lineItems
    .map((item) => `- ${item.description} (Qty: ${item.quantity}, Rate: ${item.rate}) -> ${item.amount}`)
    .join("\n");

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice #${opts.invoiceCode}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f4f4f5;">
  <div style="max-width: 600px; margin: 40px auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
    <div style="padding: 32px 32px 24px; border-bottom: 1px solid #27272a; background: linear-gradient(135deg, #18181b 0%, #27272a 100%);">
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #fbbf24; font-weight: 700; margin-bottom: 8px;">FreelancePay AI &bull; Autonomous Settlement</div>
      <h1 style="margin: 0; font-size: 24px; color: #ffffff; font-weight: 700;">Invoice #${opts.invoiceCode}</h1>
      <p style="margin: 6px 0 0; color: #a1a1aa; font-size: 14px;">Issued by ${opts.senderName} for ${opts.clientName}</p>
    </div>

    <div style="padding: 32px;">
      <div style="background-color: #09090b; border: 1px solid #27272a; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="color: #a1a1aa; font-size: 13px;">Total Amount Due:</td>
            <td style="text-align: right; color: #fbbf24; font-size: 22px; font-weight: 700;">${opts.totalFormatted}</td>
          </tr>
          <tr>
            <td style="color: #a1a1aa; font-size: 13px; padding-top: 8px;">Due Date:</td>
            <td style="text-align: right; color: #ffffff; font-size: 13px; padding-top: 8px; font-weight: 500;">${opts.dueDateFormatted}</td>
          </tr>
        </table>
      </div>

      <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #a1a1aa; margin: 0 0 12px;">Deliverables Summary</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 28px;">
        <thead>
          <tr style="border-bottom: 1px solid #3f3f46; text-align: left;">
            <th style="padding: 8px 12px; color: #a1a1aa; font-size: 11px; text-transform: uppercase;">Description</th>
            <th style="padding: 8px 12px; color: #a1a1aa; font-size: 11px; text-transform: uppercase; text-align: center;">Qty</th>
            <th style="padding: 8px 12px; color: #a1a1aa; font-size: 11px; text-transform: uppercase; text-align: right;">Rate</th>
            <th style="padding: 8px 12px; color: #a1a1aa; font-size: 11px; text-transform: uppercase; text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${lineItemsHtml}
        </tbody>
      </table>

      ${opts.notes ? `<div style="font-size: 12px; color: #a1a1aa; background-color: #27272a/40; border-left: 3px solid #fbbf24; padding: 12px; margin-bottom: 28px;">${opts.notes}</div>` : ""}

      <div style="text-align: center; margin: 32px 0 16px;">
        <a href="${opts.paymentUrl}" style="display: inline-block; background-color: #fbbf24; color: #09090b; font-weight: 700; font-size: 14px; padding: 14px 32px; border-radius: 10px; text-decoration: none; box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);">
          Pay Now with PayPal Direct
        </a>
      </div>
      <p style="text-align: center; color: #71717a; font-size: 11px; margin: 0;">Instant settlement &bull; SSL encrypted &bull; Verified ledger receipt</p>
    </div>

    <div style="padding: 16px 32px; background-color: #09090b; border-top: 1px solid #27272a; text-align: center; font-size: 11px; color: #71717a;">
      Protected by FreelancePay AI Autonomous Fiscal Engine.
    </div>
  </div>
</body>
</html>`;

  const text = `
INVOICE #${opts.invoiceCode}
Issued by: ${opts.senderName}
Client: ${opts.clientName}
Due Date: ${opts.dueDateFormatted}
Total Due: ${opts.totalFormatted}

DELIVERABLES:
${lineItemsText}

${opts.notes ? `Notes: ${opts.notes}\n` : ""}
To pay this invoice securely via PayPal, visit:
${opts.paymentUrl}
`.trim();

  return { text, html };
}

export interface ReminderEmailOptions {
  clientName: string;
  invoiceCode: string;
  amountFormatted: string;
  dueDateFormatted: string;
  paymentUrl: string;
  tone: "polite" | "firm" | "final";
  bodyText: string;
}

export function renderReminderEmail(opts: ReminderEmailOptions): { text: string; html: string } {
  const toneColor =
    opts.tone === "final" ? "#ef4444" : opts.tone === "firm" ? "#f59e0b" : "#3b82f6";
  const toneLabel =
    opts.tone === "final"
      ? "Final Escalation Notice"
      : opts.tone === "firm"
      ? "Overdue Account Follow-Up"
      : "Friendly Payment Reminder";

  const formattedBody = opts.bodyText
    .split("\n\n")
    .map((p) => `<p style="margin: 0 0 14px; line-height: 1.6; color: #d4d4d8; font-size: 14px;">${p.replace(/\n/g, "<br/>")}</p>`)
    .join("");

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${toneLabel} &bull; #${opts.invoiceCode}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f4f4f5;">
  <div style="max-width: 600px; margin: 40px auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
    <div style="padding: 24px 32px; border-bottom: 1px solid #27272a; border-left: 6px solid ${toneColor};">
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: ${toneColor}; font-weight: 700; margin-bottom: 4px;">${toneLabel}</div>
      <h1 style="margin: 0; font-size: 20px; color: #ffffff; font-weight: 700;">Invoice #${opts.invoiceCode}</h1>
    </div>

    <div style="padding: 32px;">
      <div style="background-color: #09090b; border: 1px solid #27272a; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px; display: flex; justify-content: space-between;">
        <div>
          <span style="font-size: 12px; color: #a1a1aa;">Outstanding Balance</span><br/>
          <strong style="font-size: 20px; color: #fbbf24;">${opts.amountFormatted}</strong>
        </div>
        <div style="text-align: right;">
          <span style="font-size: 12px; color: #a1a1aa;">Original Due Date</span><br/>
          <strong style="font-size: 14px; color: #e4e4e7;">${opts.dueDateFormatted}</strong>
        </div>
      </div>

      <div style="margin-bottom: 28px;">
        ${formattedBody}
      </div>

      <div style="text-align: center; margin: 32px 0 16px;">
        <a href="${opts.paymentUrl}" style="display: inline-block; background-color: #fbbf24; color: #09090b; font-weight: 700; font-size: 14px; padding: 14px 32px; border-radius: 10px; text-decoration: none; box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);">
          Settle Balance Online
        </a>
      </div>
      <p style="text-align: center; color: #71717a; font-size: 11px; margin: 0;">Immediate payment settlement via PayPal Business Rail.</p>
    </div>

    <div style="padding: 16px 32px; background-color: #09090b; border-top: 1px solid #27272a; text-align: center; font-size: 11px; color: #71717a;">
      Sent on behalf of the freelancer with explicit human verification.
    </div>
  </div>
</body>
</html>`;

  const text = `
${toneLabel.toUpperCase()}: INVOICE #${opts.invoiceCode}

Client: ${opts.clientName}
Outstanding: ${opts.amountFormatted}
Due Date: ${opts.dueDateFormatted}

${opts.bodyText}

To settle this invoice online, visit:
${opts.paymentUrl}
`.trim();

  return { text, html };
}

export interface PaymentReceiptEmailOptions {
  clientName: string;
  invoiceCode: string;
  amountFormatted: string;
  paymentChannel: string;
  transactionCode: string;
  settledAtFormatted: string;
}

export function renderPaymentReceiptEmail(opts: PaymentReceiptEmailOptions): { text: string; html: string } {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Payment Received &bull; #${opts.invoiceCode}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f4f4f5;">
  <div style="max-width: 600px; margin: 40px auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 16px; overflow: hidden;">
    <div style="padding: 32px 32px 20px; border-bottom: 1px solid #27272a; text-align: center;">
      <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; border-radius: 50%; background-color: rgba(16, 185, 129, 0.2); color: #10b981; font-size: 24px; font-weight: 700; margin-bottom: 12px;">&check;</div>
      <h1 style="margin: 0; font-size: 22px; color: #ffffff; font-weight: 700;">Payment Confirmed</h1>
      <p style="margin: 6px 0 0; color: #a1a1aa; font-size: 14px;">Invoice #${opts.invoiceCode} is settled in full.</p>
    </div>

    <div style="padding: 32px;">
      <div style="background-color: #09090b; border: 1px solid #27272a; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="color: #a1a1aa; font-size: 13px; padding-bottom: 10px;">Amount Settled:</td>
            <td style="text-align: right; color: #10b981; font-size: 20px; font-weight: 700; padding-bottom: 10px;">${opts.amountFormatted}</td>
          </tr>
          <tr>
            <td style="color: #a1a1aa; font-size: 13px; padding-bottom: 10px;">Settlement Rail:</td>
            <td style="text-align: right; color: #ffffff; font-size: 13px; padding-bottom: 10px;">${opts.paymentChannel}</td>
          </tr>
          <tr>
            <td style="color: #a1a1aa; font-size: 13px; padding-bottom: 10px;">Transaction ID:</td>
            <td style="text-align: right; color: #fbbf24; font-size: 13px; font-family: monospace; padding-bottom: 10px;">${opts.transactionCode}</td>
          </tr>
          <tr>
            <td style="color: #a1a1aa; font-size: 13px;">Date & Time:</td>
            <td style="text-align: right; color: #a1a1aa; font-size: 13px;">${opts.settledAtFormatted}</td>
          </tr>
        </table>
      </div>

      <p style="font-size: 13px; color: #a1a1aa; line-height: 1.6; text-align: center; margin: 0;">
        Thank you for your prompt payment! A copy of this record is preserved in your client dossier.
      </p>
    </div>
  </div>
</body>
</html>`;

  const text = `
PAYMENT CONFIRMATION
Invoice: #${opts.invoiceCode}
Client: ${opts.clientName}
Amount Settled: ${opts.amountFormatted}
Payment Rail: ${opts.paymentChannel}
Transaction ID: ${opts.transactionCode}
Timestamp: ${opts.settledAtFormatted}

Invoice #${opts.invoiceCode} has been settled in full. Thank you!
`.trim();

  return { text, html };
}

export interface AccountAlertEmailOptions {
  userName: string;
  alertTitle: string;
  alertMessage: string;
  actionUrl?: string;
}

export function renderAccountAlertEmail(opts: AccountAlertEmailOptions): { text: string; html: string } {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${opts.alertTitle}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f4f4f5;">
  <div style="max-width: 600px; margin: 40px auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 16px; overflow: hidden;">
    <div style="padding: 28px 32px; border-bottom: 1px solid #27272a;">
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #fbbf24; font-weight: 700; margin-bottom: 4px;">Account Security & Guardrail Alert</div>
      <h1 style="margin: 0; font-size: 20px; color: #ffffff; font-weight: 700;">${opts.alertTitle}</h1>
    </div>
    <div style="padding: 32px;">
      <p style="margin: 0 0 16px; line-height: 1.6; color: #e4e4e7; font-size: 14px;">Hi ${opts.userName},</p>
      <p style="margin: 0 0 24px; line-height: 1.6; color: #d4d4d8; font-size: 14px;">${opts.alertMessage}</p>
      ${
        opts.actionUrl
          ? `<div style="text-align: center; margin: 24px 0;">
        <a href="${opts.actionUrl}" style="display: inline-block; background-color: #fbbf24; color: #09090b; font-weight: 700; font-size: 13px; padding: 12px 28px; border-radius: 8px; text-decoration: none;">
          Review in Command Center
        </a>
      </div>`
          : ""
      }
    </div>
  </div>
</body>
</html>`;

  const text = `
ACCOUNT ALERT: ${opts.alertTitle}

Hi ${opts.userName},

${opts.alertMessage}

${opts.actionUrl ? `Review here: ${opts.actionUrl}` : ""}
`.trim();

  return { text, html };
}
