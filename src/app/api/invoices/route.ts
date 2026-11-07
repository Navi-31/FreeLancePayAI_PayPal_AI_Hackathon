import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/backend/auth/auth";
import { listInvoices, createInvoice } from "@/backend/services/invoiceService";
import { z } from "zod";

const createInvoiceSchema = z.object({
  code: z.string().optional(),
  clientId: z.string().optional(),
  clientName: z.string().min(1, "Client name is required"),
  clientEmail: z.string().email("Valid client email is required"),
  clientAddress: z.string().optional(),
  projectTitle: z.string().min(1, "Project title is required"),
  issueDate: z.string(),
  dueDate: z.string(),
  poReference: z.string().optional(),
  paymentChannel: z.string().optional(),
  currency: z.string().optional(),
  taxRatePercent: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
  lineItems: z.array(
    z.object({
      description: z.string().min(1, "Item description required"),
      quantity: z.number().positive("Quantity must be positive"),
      rate: z.number().min(0, "Rate must be non-negative"),
    })
  ).min(1, "At least one line item is required"),
});

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || undefined;
  const search = searchParams.get("search") || undefined;
  const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 50;
  const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!, 10) : 0;

  try {
    const data = await listInvoices(session.userId, { status, search, limit, offset });
    return NextResponse.json(data);
  } catch (error) {
    console.error("List invoices error:", error);
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = createInvoiceSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const invoice = await createInvoice(session.userId, result.data);
    return NextResponse.json({ success: true, invoice }, { status: 201 });
  } catch (error) {
    console.error("Create invoice error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create invoice" },
      { status: 500 }
    );
  }
}
