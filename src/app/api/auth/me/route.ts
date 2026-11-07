import { NextResponse } from "next/server";
import { getServerSession } from "@/backend/auth/auth";
import { prisma } from "@/backend/db/db";

export async function GET() {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      badge: true,
      emailVerified: true,
      mobile: true,
      profile: true,
      financialSettings: true,
    },
  });

  if (!user) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user,
  });
}
