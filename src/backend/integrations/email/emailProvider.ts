import { env } from "@/backend/validation/env";

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailPayload {
  to: string;
  from?: string;
  subject: string;
  text: string;
  html?: string;
  workflow: "invoice_delivery" | "payment_reminder" | "payment_receipt" | "account_alert";
  entityType?: "Invoice" | "PaymentReminder" | "Transaction";
  entityId?: string;
  idempotencyKey?: string;
  userApproved?: boolean;
}

export interface EmailSendResult {
  success: boolean;
  status: "sent" | "delivered" | "failed" | "simulated" | "awaiting_approval";
  provider: "resend" | "mock";
  providerMessageId?: string;
  error?: string;
  isConfigured: boolean;
  timestamp: string;
}

// RFC 5322 compliant regex for safe email validation
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function validateEmailAddress(email: string): boolean {
  if (!email || typeof email !== "string" || email.length > 254) {
    return false;
  }
  return EMAIL_REGEX.test(email.trim());
}

export function sanitizeHeaderValue(value: string): string {
  // Prevent CRLF header injection
  return value.replace(/[\r\n\t]/g, " ").trim();
}

/**
 * Determines whether the email provider is configured with live credentials.
 */
export function getActiveEmailProvider(): {
  provider: "resend" | "mock";
  isConfigured: boolean;
} {
  const providerChoice = env.EMAIL_PROVIDER;
  const resendKey = env.RESEND_API_KEY;

  if (
    (providerChoice === "resend" || providerChoice === "auto") &&
    resendKey &&
    resendKey.trim().startsWith("re_")
  ) {
    return { provider: "resend", isConfigured: true };
  }

  return { provider: "mock", isConfigured: false };
}

/**
 * Dispatches an email via Resend API or safe mock provider.
 * Never throws unhandled network errors; returns structured result.
 */
export async function dispatchEmailThroughProvider(
  payload: EmailPayload
): Promise<EmailSendResult> {
  const recipient = payload.to.trim();
  if (!validateEmailAddress(recipient)) {
    return {
      success: false,
      status: "failed",
      provider: "mock",
      error: `Invalid recipient email address: "${recipient}"`,
      isConfigured: false,
      timestamp: new Date().toISOString(),
    };
  }

  const fromAddress = sanitizeHeaderValue(payload.from || env.EMAIL_FROM);
  const safeSubject = sanitizeHeaderValue(payload.subject);
  const active = getActiveEmailProvider();

  // If Resend API credentials are valid, execute HTTP call
  if (active.provider === "resend" && active.isConfigured) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [recipient],
          subject: safeSubject,
          text: payload.text,
          html: payload.html || payload.text,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        return {
          success: false,
          status: "failed",
          provider: "resend",
          error: data?.message || `Resend HTTP error ${response.status}`,
          isConfigured: true,
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: true,
        status: "sent",
        provider: "resend",
        providerMessageId: data?.id || `resend_${Date.now()}`,
        isConfigured: true,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      return {
        success: false,
        status: "failed",
        provider: "resend",
        error: err instanceof Error ? err.message : "Unknown network error contacting Resend API",
        isConfigured: true,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Safe Mock / Simulated Provider Fallback
  // Clearly states "simulated" so UI and audit logs never pretend a live email was dispatched.
  return {
    success: true,
    status: "simulated",
    provider: "mock",
    providerMessageId: `sim_msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    isConfigured: false,
    timestamp: new Date().toISOString(),
  };
}
