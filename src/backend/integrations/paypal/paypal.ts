import { env } from "@/backend/validation/env";

export interface PayPalTokenResponse {
  access_token: string;
  token_type: string;
  app_id: string;
  expires_in: number;
}

export interface PayPalAmount {
  currency_code: string;
  value: string;
}

export interface CreateOrderParams {
  referenceId: string;
  amount: number;
  currency: string;
  description: string;
  intent: "CAPTURE" | "AUTHORIZE";
  customId?: string;
  returnUrl?: string;
  cancelUrl?: string;
}

export interface PayPalOrderResponse {
  id: string;
  status: "CREATED" | "SAVED" | "APPROVED" | "VOIDED" | "COMPLETED" | "PAYER_ACTION_REQUIRED";
  intent: "CAPTURE" | "AUTHORIZE";
  approveUrl?: string;
  links: Array<{ href: string; rel: string; method: string }>;
}

export interface PayPalCaptureResponse {
  id: string;
  status: "COMPLETED" | "DECLINED" | "PARTIALLY_REFUNDED" | "PENDING" | "REFUNDED" | "FAILED";
  amount: PayPalAmount;
  final_capture?: boolean;
  seller_receivable_breakdown?: {
    gross_amount: PayPalAmount;
    paypal_fee: PayPalAmount;
    net_amount: PayPalAmount;
  };
  create_time?: string;
  update_time?: string;
}

export interface PayPalAuthorizationResponse {
  id: string;
  status: "CREATED" | "CAPTURED" | "DENIED" | "EXPIRED" | "PARTIALLY_CAPTURED" | "VOIDED" | "PENDING";
  amount: PayPalAmount;
  create_time?: string;
  expiration_time?: string;
  links?: Array<{ href: string; rel: string; method: string }>;
}

export interface PayPalRefundResponse {
  id: string;
  status: "COMPLETED" | "CANCELLED" | "PENDING" | "FAILED";
  amount: PayPalAmount;
  note_to_payer?: string;
  create_time?: string;
}

export interface PayPalInvoiceResponse {
  id: string;
  status: "DRAFT" | "SENT" | "SCHEDULED" | "PAID" | "MARKED_AS_PAID" | "CANCELLED" | "REFUNDED" | "PARTIALLY_PAID" | "PAYMENT_PENDING";
  invoice_number?: string;
  amount?: {
    currency_code: string;
    value: string;
  };
  primary_recipients?: Array<{
    billing_info?: {
      email_address?: string;
      name?: { given_name?: string; surname?: string };
    };
  }>;
  links?: Array<{ href: string; rel: string; method: string }>;
}

export interface VerifyWebhookParams {
  authAlgo: string;
  certUrl: string;
  transmissionId: string;
  transmissionSig: string;
  transmissionTime: string;
  webhookId: string;
  eventBody: Record<string, unknown> | string;
}

// In-memory token and mock store caching
let cachedToken: string | null = null;
let tokenExpiryTimestamp = 0;
const mockOrderStore = new Map<string, { amount: number; currency: string }>();

export function isPayPalConfigured(): boolean {
  const id = env.PAYPAL_CLIENT_ID;
  const secret = env.PAYPAL_CLIENT_SECRET;
  return Boolean(
    id &&
      secret &&
      id !== "placeholder_paypal_client_id" &&
      secret !== "placeholder_paypal_client_secret" &&
      !id.startsWith("placeholder")
  );
}

export function getPayPalBaseUrl(): string {
  return env.PAYPAL_BASE_URL || "https://api-m.sandbox.paypal.com";
}

/**
 * Retrieve a server-side OAuth 2.0 access token from PayPal.
 * Tokens are cached in-memory until 60 seconds before expiration.
 */
export async function getPayPalAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && now < tokenExpiryTimestamp) {
    return cachedToken;
  }

  if (!isPayPalConfigured()) {
    // Return mock token for sandbox simulation / testing
    cachedToken = `mock_paypal_token_${now}`;
    tokenExpiryTimestamp = now + 3600 * 1000;
    return cachedToken;
  }

  const clientId = env.PAYPAL_CLIENT_ID!;
  const clientSecret = env.PAYPAL_CLIENT_SECRET!;
  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const baseUrl = getPayPalBaseUrl();

  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${authHeader}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PayPal OAuth authentication failed (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as PayPalTokenResponse;
  cachedToken = data.access_token;
  // Cache with 60 second safety buffer
  tokenExpiryTimestamp = now + (data.expires_in - 60) * 1000;
  return cachedToken;
}

/**
 * Create a PayPal Checkout Order (intent = CAPTURE or AUTHORIZE).
 */
export async function createPayPalOrder(params: CreateOrderParams): Promise<PayPalOrderResponse> {
  const formattedAmount = Number(params.amount).toFixed(2);
  const appUrl = env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!isPayPalConfigured()) {
    // Deterministic Sandbox Mock Response
    const mockOrderId = `ORD-SANDBOX-${Math.floor(100000 + Math.random() * 900000)}`;
    mockOrderStore.set(mockOrderId, { amount: params.amount, currency: params.currency });
    const approveUrl = `${appUrl}/api/paypal/mock-approve?orderId=${mockOrderId}&customId=${params.customId || ""}`;
    return {
      id: mockOrderId,
      status: "CREATED",
      intent: params.intent,
      approveUrl,
      links: [
        { href: approveUrl, rel: "approve", method: "GET" },
        { href: `${getPayPalBaseUrl()}/v2/checkout/orders/${mockOrderId}`, rel: "self", method: "GET" },
        { href: `${getPayPalBaseUrl()}/v2/checkout/orders/${mockOrderId}/capture`, rel: "capture", method: "POST" },
      ],
    };
  }

  const token = await getPayPalAccessToken();
  const baseUrl = getPayPalBaseUrl();

  const body = {
    intent: params.intent,
    purchase_units: [
      {
        reference_id: params.referenceId,
        custom_id: params.customId,
        description: params.description.slice(0, 127),
        amount: {
          currency_code: params.currency,
          value: formattedAmount,
        },
      },
    ],
    application_context: {
      brand_name: "FreelancePay AI",
      user_action: "PAY_NOW",
      return_url: params.returnUrl || `${appUrl}/invoices?paypal_success=true`,
      cancel_url: params.cancelUrl || `${appUrl}/invoices?paypal_cancel=true`,
    },
  };

  const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PayPal order creation failed (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as PayPalOrderResponse;
  const approveLink = data.links?.find((l) => l.rel === "approve");
  data.approveUrl = approveLink?.href;
  return data;
}

/**
 * Capture an approved PayPal Checkout Order (intent = CAPTURE).
 */
export async function capturePayPalOrder(
  orderId: string,
  expectedAmount?: { value: number; currency: string }
): Promise<PayPalCaptureResponse> {
  if (!isPayPalConfigured() || orderId.startsWith("ORD-SANDBOX-")) {
    const captureId = `CAP-${Math.floor(100000 + Math.random() * 900000)}`;
    const stored = mockOrderStore.get(orderId);
    const grossVal = expectedAmount?.value || stored?.amount || 100.0;
    const currency = expectedAmount?.currency || stored?.currency || "USD";
    const feeVal = Number((grossVal * 0.029 + 0.3).toFixed(2));
    const netVal = (grossVal - feeVal).toFixed(2);

    return {
      id: captureId,
      status: "COMPLETED",
      amount: { currency_code: currency, value: grossVal.toFixed(2) },
      final_capture: true,
      seller_receivable_breakdown: {
        gross_amount: { currency_code: currency, value: grossVal.toFixed(2) },
        paypal_fee: { currency_code: currency, value: feeVal.toFixed(2) },
        net_amount: { currency_code: currency, value: netVal },
      },
    };
  }

  const token = await getPayPalAccessToken();
  const baseUrl = getPayPalBaseUrl();

  const response = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PayPal order capture failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const capture = data.purchase_units?.[0]?.payments?.captures?.[0];
  if (!capture) {
    throw new Error("PayPal capture response missing payment capture entity");
  }

  return capture as PayPalCaptureResponse;
}

/**
 * Authorize an approved PayPal Checkout Order (intent = AUTHORIZE).
 */
export async function authorizePayPalOrder(orderId: string): Promise<PayPalAuthorizationResponse> {
  if (!isPayPalConfigured() || orderId.startsWith("ORD-SANDBOX-")) {
    const authId = `AUTH-${Math.floor(100000 + Math.random() * 900000)}`;
    const stored = mockOrderStore.get(orderId);
    const grossVal = stored?.amount || 1000.0;
    const currency = stored?.currency || "USD";
    return {
      id: authId,
      status: "CREATED",
      amount: { currency_code: currency, value: grossVal.toFixed(2) },
    };
  }

  const token = await getPayPalAccessToken();
  const baseUrl = getPayPalBaseUrl();

  const response = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/authorize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PayPal order authorization failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const authorization = data.purchase_units?.[0]?.payments?.authorizations?.[0];
  if (!authorization) {
    throw new Error("PayPal authorization response missing payment entity");
  }

  return authorization as PayPalAuthorizationResponse;
}

/**
 * Capture an authorized payment (Milestone-based release).
 */
export async function capturePayPalAuthorization(
  authorizationId: string,
  amount?: { value: number; currency: string }
): Promise<PayPalCaptureResponse> {
  if (!isPayPalConfigured() || authorizationId.startsWith("AUTH-")) {
    const captureId = `CAP-${Math.floor(100000 + Math.random() * 900000)}`;
    const val = amount ? amount.value.toFixed(2) : "1000.00";
    const gross = Number(val);
    const fee = Number((gross * 0.029).toFixed(2));
    const net = (gross - fee).toFixed(2);

    return {
      id: captureId,
      status: "COMPLETED",
      amount: { currency_code: amount?.currency || "USD", value: val },
      final_capture: true,
      seller_receivable_breakdown: {
        gross_amount: { currency_code: amount?.currency || "USD", value: val },
        paypal_fee: { currency_code: amount?.currency || "USD", value: fee.toFixed(2) },
        net_amount: { currency_code: amount?.currency || "USD", value: net },
      },
    };
  }

  const token = await getPayPalAccessToken();
  const baseUrl = getPayPalBaseUrl();

  const body = amount
    ? {
        amount: {
          currency_code: amount.currency,
          value: amount.value.toFixed(2),
        },
        final_capture: true,
      }
    : { final_capture: true };

  const response = await fetch(`${baseUrl}/v2/payments/authorizations/${authorizationId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PayPal authorization capture failed (${response.status}): ${errorText}`);
  }

  return (await response.json()) as PayPalCaptureResponse;
}

/**
 * Void an authorized payment (Milestone cancelled).
 */
export async function voidPayPalAuthorization(authorizationId: string): Promise<boolean> {
  if (!isPayPalConfigured() || authorizationId.startsWith("AUTH-")) {
    return true;
  }

  const token = await getPayPalAccessToken();
  const baseUrl = getPayPalBaseUrl();

  const response = await fetch(`${baseUrl}/v2/payments/authorizations/${authorizationId}/void`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  return response.status === 204 || response.ok;
}

/**
 * Refund a captured PayPal payment (Supports full or partial refunds).
 */
export async function refundPayPalCapture(
  captureId: string,
  params: { amount?: number; currency?: string; noteToPayer?: string }
): Promise<PayPalRefundResponse> {
  if (!isPayPalConfigured() || captureId.startsWith("CAP-")) {
    const refundId = `REF-${Math.floor(100000 + Math.random() * 900000)}`;
    return {
      id: refundId,
      status: "COMPLETED",
      amount: {
        currency_code: params.currency || "USD",
        value: params.amount ? params.amount.toFixed(2) : "0.00",
      },
      note_to_payer: params.noteToPayer,
    };
  }

  const token = await getPayPalAccessToken();
  const baseUrl = getPayPalBaseUrl();

  const body: Record<string, unknown> = {};
  if (params.amount && params.currency) {
    body.amount = {
      currency_code: params.currency,
      value: params.amount.toFixed(2),
    };
  }
  if (params.noteToPayer) {
    body.note_to_payer = params.noteToPayer.slice(0, 255);
  }

  const response = await fetch(`${baseUrl}/v2/payments/captures/${captureId}/refund`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PayPal refund failed (${response.status}): ${errorText}`);
  }

  return (await response.json()) as PayPalRefundResponse;
}

/**
 * Create a PayPal Invoice via Invoicing v2 API.
 */
export async function createPayPalInvoice(invoiceData: {
  invoiceNumber: string;
  currency: string;
  issueDate: string;
  dueDate: string;
  recipientEmail: string;
  recipientName: string;
  items: Array<{ name: string; quantity: number; unitAmount: number }>;
  note?: string;
}): Promise<PayPalInvoiceResponse> {
  if (!isPayPalConfigured()) {
    const mockId = `INV2-SANDBOX-${Math.floor(100000 + Math.random() * 900000)}`;
    return {
      id: mockId,
      status: "DRAFT",
      invoice_number: invoiceData.invoiceNumber,
      links: [
        { href: `${getPayPalBaseUrl()}/v2/invoicing/invoices/${mockId}`, rel: "self", method: "GET" },
        { href: `${getPayPalBaseUrl()}/v2/invoicing/invoices/${mockId}/send`, rel: "send", method: "POST" },
      ],
    };
  }

  const token = await getPayPalAccessToken();
  const baseUrl = getPayPalBaseUrl();

  const body = {
    detail: {
      invoice_number: invoiceData.invoiceNumber,
      invoice_date: invoiceData.issueDate,
      currency_code: invoiceData.currency,
      note: invoiceData.note || "Created via FreelancePay AI verified invoice rail",
      payment_term: {
        term_type: "DUE_ON_DATE_SPECIFIED",
        due_date: invoiceData.dueDate,
      },
    },
    primary_recipients: [
      {
        billing_info: {
          email_address: invoiceData.recipientEmail,
          name: { given_name: invoiceData.recipientName },
        },
      },
    ],
    items: invoiceData.items.map((it) => ({
      name: it.name.slice(0, 100),
      quantity: String(it.quantity),
      unit_amount: {
        currency_code: invoiceData.currency,
        value: it.unitAmount.toFixed(2),
      },
    })),
  };

  const response = await fetch(`${baseUrl}/v2/invoicing/invoices`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PayPal invoice creation failed (${response.status}): ${errorText}`);
  }

  return (await response.json()) as PayPalInvoiceResponse;
}

/**
 * Send a PayPal Invoice to recipient.
 */
export async function sendPayPalInvoice(paypalInvoiceId: string): Promise<boolean> {
  if (!isPayPalConfigured() || paypalInvoiceId.startsWith("INV2-SANDBOX-")) {
    return true;
  }

  const token = await getPayPalAccessToken();
  const baseUrl = getPayPalBaseUrl();

  const response = await fetch(`${baseUrl}/v2/invoicing/invoices/${paypalInvoiceId}/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ send_to_recipient: true }),
  });

  return response.status === 200 || response.status === 202;
}

/**
 * Get details/status of a PayPal Invoice.
 */
export async function getPayPalInvoice(paypalInvoiceId: string): Promise<PayPalInvoiceResponse> {
  if (!isPayPalConfigured() || paypalInvoiceId.startsWith("INV2-SANDBOX-")) {
    return {
      id: paypalInvoiceId,
      status: "SENT",
    };
  }

  const token = await getPayPalAccessToken();
  const baseUrl = getPayPalBaseUrl();

  const response = await fetch(`${baseUrl}/v2/invoicing/invoices/${paypalInvoiceId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PayPal get invoice failed (${response.status}): ${errorText}`);
  }

  return (await response.json()) as PayPalInvoiceResponse;
}

/**
 * Verify PayPal Webhook Signature using official PayPal verification endpoint.
 */
export async function verifyPayPalWebhookSignature(params: VerifyWebhookParams): Promise<boolean> {
  if (!isPayPalConfigured()) {
    // In test/mock mode without live credentials, verify non-empty headers
    return Boolean(params.transmissionId && params.transmissionSig);
  }

  const webhookId = params.webhookId || env.PAYPAL_WEBHOOK_ID;
  if (!webhookId || webhookId === "placeholder_paypal_webhook_id") {
    // If webhook ID is not yet configured, fail closed in production, allow in test
    return process.env.NODE_ENV === "test";
  }

  const token = await getPayPalAccessToken();
  const baseUrl = getPayPalBaseUrl();

  const body = {
    auth_algo: params.authAlgo,
    cert_url: params.certUrl,
    transmission_id: params.transmissionId,
    transmission_sig: params.transmissionSig,
    transmission_time: params.transmissionTime,
    webhook_id: webhookId,
    webhook_event: typeof params.eventBody === "string" ? JSON.parse(params.eventBody) : params.eventBody,
  };

  const response = await fetch(`${baseUrl}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    return false;
  }

  const data = await response.json();
  return data.verification_status === "SUCCESS";
}
