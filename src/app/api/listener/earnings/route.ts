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
      minPayoutThresholdInr: Number(process.env.MIN_PAYOUT_THRESHOLD_INR || 100),
      history: earningsHistory,
    });
  } catch (error: any) {
    console.error("Earnings fetch error:", error);
    return NextResponse.json({ message: "Failed to fetch earnings" }, { status: 500 });
  }
}
