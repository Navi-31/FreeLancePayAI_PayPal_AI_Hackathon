import { env } from "@/backend/validation/env";
import nodemailer, { type Transporter } from "nodemailer";

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
  workflow: "invoice_delivery" | "payment_reminder" | "payment_receipt" | "account_alert" | "signup_verification" | "login_otp" | "password_reset";
  entityType?: "Invoice" | "PaymentReminder" | "Transaction" | "EmailOtp" | "PasswordResetToken";
  entityId?: string;
  idempotencyKey?: string;
  userApproved?: boolean;
}

export interface EmailSendResult {
  success: boolean;
  status: "sent" | "delivered" | "failed" | "simulated" | "awaiting_approval";
  provider: "smtp" | "resend" | "mock";
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
 * Priority: SMTP (Gmail or custom) -> Resend -> Mock.
 */
export function getActiveEmailProvider(): {
  provider: "smtp" | "resend" | "mock";
  isConfigured: boolean;
} {
  const providerChoice = env.EMAIL_PROVIDER;

  // Check SMTP credentials first if explicitly selected or auto
  if (
    (providerChoice === "smtp" || providerChoice === "auto") &&
    env.SMTP_USER &&
    env.SMTP_PASS &&
    env.SMTP_PASS.trim().length > 0
  ) {
    return { provider: "smtp", isConfigured: true };
  }

  // Check Resend
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
 * Creates a nodemailer transporter instance when SMTP is active.
 * Uses direct connection without persistent idle pooling to avoid stale socket resets with Gmail.
 */
let smtpTransporter: Transporter | null = null;

function getSmtpTransporter(): Transporter {
  if (!smtpTransporter) {
    const isGmail = (env.SMTP_HOST || "").toLowerCase().includes("gmail.com");
    const cleanUser = env.SMTP_USER?.trim();
    const cleanPass = env.SMTP_PASS?.replace(/\s+/g, "");

    smtpTransporter = nodemailer.createTransport(
      isGmail
        ? {
            service: "gmail",
            auth: {
              user: cleanUser,
              pass: cleanPass,
            },
            connectionTimeout: 15000,
            greetingTimeout: 15000,
            socketTimeout: 30000,
          }
        : {
            host: env.SMTP_HOST,
            port: env.SMTP_PORT,
            secure: env.SMTP_SECURE,
            auth: {
              user: cleanUser,
              pass: cleanPass,
            },
            connectionTimeout: 15000,
            greetingTimeout: 15000,
            socketTimeout: 30000,
          }
    );
  }
  return smtpTransporter;
}

/**
 * Dispatches an email via SMTP (Nodemailer), Resend API, or fails if not configured.
 * Never silently reports simulated delivery as success when live delivery fails.
 */
export async function dispatchEmailThroughProvider(
  payload: EmailPayload
): Promise<EmailSendResult> {
  const recipient = payload.to.trim();
  if (!validateEmailAddress(recipient)) {
    return {
      success: false,
      status: "failed",
      provider: "smtp",
      error: `Invalid recipient email address: "${recipient}"`,
      isConfigured: false,
      timestamp: new Date().toISOString(),
    };
  }

  const fromAddress = sanitizeHeaderValue(payload.from || env.EMAIL_FROM);
  const safeSubject = sanitizeHeaderValue(payload.subject);
  const active = getActiveEmailProvider();

  // 1. Dispatch via SMTP (e.g. Gmail SSL)
  if (active.provider === "smtp" && active.isConfigured) {
    try {
      const transporter = getSmtpTransporter();
      const info = await transporter.sendMail({
        from: fromAddress,
        to: recipient,
        subject: safeSubject,
        text: payload.text,
        html: payload.html || payload.text,
      });

      return {
        success: true,
        status: "sent",
        provider: "smtp",
        providerMessageId: info.messageId || `smtp_${Date.now()}`,
        isConfigured: true,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Unknown SMTP transmission error";
      console.error(`[EmailProvider] SMTP delivery failure to ${recipient}:`, errMsg);
      return {
        success: false,
        status: "failed",
        provider: "smtp",
        error: errMsg,
        isConfigured: true,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // 2. Dispatch via Resend API
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
        const resendErr = data?.message || `Resend HTTP error ${response.status}`;
        console.error(`[EmailProvider] Resend delivery failure:`, resendErr);
        return {
          success: false,
          status: "failed",
          provider: "resend",
          error: resendErr,
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
      const errMsg = err instanceof Error ? err.message : "Unknown network error contacting Resend API";
      console.error(`[EmailProvider] Resend network error:`, errMsg);
      return {
        success: false,
        status: "failed",
        provider: "resend",
        error: errMsg,
        isConfigured: true,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // 3. Fallback when no live email provider is configured
  console.warn(`[EmailProvider] No active email provider configured for ${recipient}`);
  return {
    success: false,
    status: "failed",
    provider: "mock",
    error: "No live email provider configured. Please configure SMTP_USER and SMTP_PASS.",
    providerMessageId: `sim_msg_${Date.now()}`,
    isConfigured: false,
    timestamp: new Date().toISOString(),
  };
}
