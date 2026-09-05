import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db";
import { attemptMatch } from "@/server/matchmaking/queue";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    let profile = await prisma.listenerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      profile = await prisma.listenerProfile.create({
        data: { userId, isAvailable: false },
      });
    }

    // Calculate today's earnings
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayEarnings = await prisma.listenerEarning.aggregate({
      where: {
        listenerId: userId,
        createdAt: { gte: today },
      },
      _sum: { amountInr: true },
      _count: { id: true },
    });

    // Check if listener currently has an active matched session
    const activeSession = await prisma.callSession.findFirst({
      where: {
        listenerId: userId,
        status: { in: ["MATCHED", "CALL_STARTED"] },
      },
    });

    return NextResponse.json({
      isAvailable: profile.isAvailable,
      todayEarningsInr: todayEarnings._sum.amountInr || 0,
      todayCallsCount: todayEarnings._count.id || 0,
      activeSessionCode: activeSession?.sessionCode || null,
    });
  } catch (error: any) {
    console.error("Error fetching listener availability:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const isAvailable = Boolean(body.isAvailable);

    const updated = await prisma.listenerProfile.upsert({
      where: { userId },
      update: {
        isAvailable,
        lastActiveAt: new Date(),
      },
      create: {
        userId,
        isAvailable,
      },
    });

    // If listener became available, check if there's any waiting client in queue
    let matchedSessionCode: string | null = null;
    if (isAvailable) {
      const waitingSession = await prisma.callSession.findFirst({
        where: { status: "WAITING_FOR_LISTENER" },
        orderBy: { createdAt: "asc" },
      });

      if (waitingSession) {
        const result = await attemptMatch(waitingSession.id);
        if (result.matched && result.listenerId === userId) {
          matchedSessionCode = result.sessionCode;
        }
      }
    }

    return NextResponse.json({
      success: true,
      isAvailable: updated.isAvailable,
      matchedSessionCode,
    });
  } catch (error: any) {
    console.error("Error updating listener availability:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
