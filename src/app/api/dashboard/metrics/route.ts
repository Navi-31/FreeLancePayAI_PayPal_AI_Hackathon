import { NextResponse } from "next/server";
import { getServerSession } from "@/backend/auth/auth";
import { getDashboardMetrics } from "@/backend/services/dashboardService";

export async function GET() {
  const session = await getServerSession();

  // If unauthenticated, return baseline demo metrics so landing view still works beautifully
  const userId = session?.userId;
  if (!userId) {
    return NextResponse.json({
      authenticated: false,
      metrics: {
        totalGrossRevenue: 128450.0,
        outstandingInvoicesAmount: 14200.0,
        outstandingInvoicesCount: 3,
        overdueInvoicesAmount: 1500.0,
        overdueInvoicesCount: 1,
        availableLiquidity: 42880.5,
        taxVaultAmount: 28500.0,
        institutionalHealthScore: 94,
        runwayMonths: 8.4,
        activeClientsCount: 6,
        activeMilestonesCount: 2,
      },
    });
  }

  try {
    const metrics = await getDashboardMetrics(userId);
    return NextResponse.json({
      authenticated: true,
      metrics,
    });
  } catch (error) {
    console.error("Dashboard metrics error:", error);
    return NextResponse.json(
      { error: "Failed to compute dashboard metrics" },
      { status: 500 }
    );
  }
}
