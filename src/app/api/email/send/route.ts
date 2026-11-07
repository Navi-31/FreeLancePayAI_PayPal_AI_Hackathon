import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/backend/auth/auth";
import {
  sendInvoiceEmailWorkflow,
  sendReminderEmailWorkflow,
  sendEmail,
} from "@/backend/services/emailService";
import { z } from "zod";

const sendEmailSchema = z.object({
  workflow: z.enum(["invoice_delivery", "payment_reminder", "account_alert", "custom"]),
  invoiceId: z.string().optional(),
  reminderId: z.string().optional(),
  to: z.string().email().optional(),
  subject: z.string().optional(),
  text: z.string().optional(),
  html: z.string().optional(),
  userApproved: z.boolean(),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = sendEmailSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { workflow, invoiceId, reminderId, to, subject, text, html, userApproved } =
      parsed.data;

    // APPROVAL GUARDRAIL
    if (!userApproved) {
      return NextResponse.json(
        {
          error: "Explicit human approval is required before sending client communications.",
          status: "awaiting_approval",
          requiresUserApproval: true,
        },
        { status: 400 }
      );
    }

    if (workflow === "invoice_delivery") {
      if (!invoiceId) {
        return NextResponse.json({ error: "invoiceId is required for invoice_delivery" }, { status: 400 });
      }
      const result = await sendInvoiceEmailWorkflow(session.userId, invoiceId, userApproved);
      return NextResponse.json({ success: result.success, delivery: result });
    }

    if (workflow === "payment_reminder") {
      const result = await sendReminderEmailWorkflow(
        session.userId,
        reminderId || "custom_draft",
        userApproved,
        { to, subject, text }
      );
      return NextResponse.json({ success: result.success, delivery: result });
    }

    // Custom or account alert workflow
    if (!to || !subject || !text) {
      return NextResponse.json(
        { error: "to, subject, and text are required for custom email dispatches" },
        { status: 400 }
      );
    }

    const result = await sendEmail(session.userId, {
      to,
      subject,
      text,
      html,
      workflow: workflow === "account_alert" ? "account_alert" : "account_alert",
      userApproved,
    });

    return NextResponse.json({ success: result.success, delivery: result });
  } catch (error) {
    console.error("Email send error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send email" },
      { status: 500 }
    );
  }
}
