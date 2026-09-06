import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Auto-settle any PENDING earnings older than 2 hours (speaker never submitted rating)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const stalePending = await prisma.listenerEarning.findMany({
      where: {
        listenerId: userId,
        status: "PENDING",
        createdAt: { lte: twoHoursAgo },
      },
    });

    if (stalePending.length > 0) {
      for (const earning of stalePending) {
        await prisma.$transaction(async (tx) => {
          const updated = await tx.listenerEarning.updateMany({
            where: { id: earning.id, status: "PENDING" },
            data: { status: "AVAILABLE" },
          });
          if (updated.count > 0) {
            await tx.listenerProfile.updateMany({
              where: { userId },
              data: { totalEarnedInr: { increment: earning.amountInr } },
            });
          }
        });
      }
    }

    // Available earnings (eligible and ready for payout)
    const availableAgg = await prisma.listenerEarning.aggregate({
      where: {
        listenerId: userId,
        status: "AVAILABLE",
      },
      _sum: { amountInr: true },
      _count: { id: true },
    });

    // Pending earnings (recently completed, under audit/settlement window)
    const pendingAgg = await prisma.listenerEarning.aggregate({
      where: {
        listenerId: userId,
        status: "PENDING",
      },
      _sum: { amountInr: true },
    });

    // Check active listener subscription for reduced payout threshold
    const activeSub = await prisma.subscription.findFirst({
      where: {
        userId,
        role: "LISTENER",
        status: "ACTIVE",
        endsAt: { gte: new Date() },
      },
    });
    const minPayoutThreshold = activeSub ? 50 : Number(process.env.MIN_PAYOUT_THRESHOLD_INR || 100);

    // Total completed eligible conversations
    const totalCalls = await prisma.callSession.count({
      where: {
        listenerId: userId,
        isEarningEligible: true,
      },
    });

    // Recent earnings history (sanitized, zero client PII)
    const earningsHistory = await prisma.listenerEarning.findMany({
      where: { listenerId: userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        amountInr: true,
        status: true,
        createdAt: true,
        eligibleAt: true,
      },
    });

    return NextResponse.json({
      availableBalanceInr: availableAgg._sum.amountInr || 0,
      pendingBalanceInr: pendingAgg._sum.amountInr || 0,
      completedCallsCount: totalCalls,
      minPayoutThresholdInr: minPayoutThreshold,
      hasReducedThreshold: Boolean(activeSub),
      history: earningsHistory,
    });
  } catch (error: any) {
    console.error("Earnings fetch error:", error);
    return NextResponse.json({ message: "Failed to fetch earnings" }, { status: 500 });
  }
}
