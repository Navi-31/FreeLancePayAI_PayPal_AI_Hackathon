import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { listClients, createClient } from "@/services/clientService";
import { z } from "zod";

const createClientSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1, "Client name is required"),
  location: z.string().min(1, "Location is required"),
  industry: z.string().min(1, "Industry is required"),
  contactName: z.string().min(1, "Contact name is required"),
  contactRole: z.string().min(1, "Contact role is required"),
  contactEmail: z.string().email("Valid contact email is required"),
  riskTier: z.string().optional(),
  reliabilityScore: z.number().min(0).max(100).optional(),
  lifetimeRevenue: z.number().min(0).optional(),
  outstandingBalance: z.number().min(0).optional(),
  avgSettlementLag: z.string().optional(),
  disputeHistory: z.string().optional(),
  preferredRails: z.string().optional(),
  notes: z.string().optional(),
  playbookWhatWorks: z.string().optional(),
  playbookWhatFails: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || undefined;
  const riskTier = searchParams.get("riskTier") || undefined;
  const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 50;
  const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!, 10) : 0;

  try {
    const data = await listClients(session.userId, { search, riskTier, limit, offset });
    return NextResponse.json(data);
  } catch (error) {
    console.error("List clients error:", error);
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = createClientSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const client = await createClient(session.userId, result.data);
    return NextResponse.json({ success: true, client }, { status: 201 });
  } catch (error) {
    console.error("Create client error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create client" },
      { status: 500 }
    );
  }
}
