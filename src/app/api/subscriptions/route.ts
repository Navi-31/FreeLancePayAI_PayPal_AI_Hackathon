import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/backend/auth/auth";
import {
  listSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,
} from "@/backend/services/subscriptionService";
import { z } from "zod";

const createSubscriptionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  subTitle: z.string().min(1, "Subtitle is required"),
  category: z.string().min(1, "Category is required"),
  costMonthly: z.number().positive("Monthly cost must be positive"),
  lastActive: z.string().default("Recently"),
  usageScore: z.number().min(0).max(100).optional(),
  usageStatus: z.string().optional(),
  recommendation: z.string().optional(),
  nextRenewal: z.string().optional(),
  dueCategory: z.string().optional(),
  initials: z.string().optional(),
});

export async function GET() {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const subscriptions = await listSubscriptions(session.userId);
    return NextResponse.json({ subscriptions });
  } catch (error) {
    console.error("List subscriptions error:", error);
    return NextResponse.json({ error: "Failed to list subscriptions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = createSubscriptionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const sub = await createSubscription(session.userId, result.data);
    return NextResponse.json({ success: true, subscription: sub }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to record subscription" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, ...data } = body;
    if (!id) {
      return NextResponse.json({ error: "Subscription id is required" }, { status: 400 });
    }

    const updated = await updateSubscription(session.userId, id, data);
    return NextResponse.json({ success: true, subscription: updated });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update subscription" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Subscription id is required" }, { status: 400 });
    }

    await deleteSubscription(session.userId, id);
    return NextResponse.json({ success: true, message: "Subscription deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete subscription" },
      { status: 400 }
    );
  }
}
