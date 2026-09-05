import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { sessionCode, endedByRole } = await req.json();

    if (!sessionCode) {
      return NextResponse.json({ message: "Missing session code" }, { status: 400 });
    }

    const callSession = await prisma.callSession.findUnique({
      where: { sessionCode },
      include: {
        client: true,
        listener: true,
        earning: true,
      },
    });

    if (!callSession) {
      return NextResponse.json({ message: "Call session not found" }, { status: 404 });
    }

    // Verify caller is either client or listener
    const isClient = callSession.clientId === userId;
    const isListener = callSession.listenerId === userId;

    if (!isClient && !isListener) {
      return NextResponse.json({ message: "Forbidden: not a participant" }, { status: 403 });
    }

    // Determine actual authoritative terminator
    const actualEndedBy = isClient ? "CLIENT" : "LISTENER";
    const now = new Date();

    // Idempotency: If already completed or ended, return existing status
    if (
      callSession.status === "CALL_COMPLETED" ||
      callSession.status === "CALL_ENDED_BY_CLIENT" ||
      callSession.status === "CALL_ENDED_BY_LISTENER"
    ) {
      return NextResponse.json({
        success: true,
        status: callSession.status,
        isEarningEligible: callSession.isEarningEligible,
      });
    }

    // Section 12 Rule:
    // If client ends call -> Listener receives ₹15
    // If listener ends call -> Listener does NOT receive ₹15
    const isEarningEligible = actualEndedBy === "CLIENT" || endedByRole === "TIMEOUT";

    await prisma.$transaction(async (tx) => {
      // 1. Update session state
      await tx.callSession.update({
        where: { id: callSession.id },
        data: {
          status: isEarningEligible ? "CALL_ENDED_BY_CLIENT" : "CALL_ENDED_BY_LISTENER",
          callEndedAt: now,
          callEndedBy: actualEndedBy,
          isEarningEligible,
        },
      });

      // 2. If eligible and listener exists and no earning yet recorded
      if (isEarningEligible && callSession.listenerId && !callSession.earning) {
        await tx.listenerEarning.create({
          data: {
            listenerId: callSession.listenerId,
            sessionId: callSession.id,
            amountInr: callSession.listenerEarningInr,
            status: "AVAILABLE",
          },
        });

        // Update listener profile totals
        await tx.listenerProfile.updateMany({
          where: { userId: callSession.listenerId },
          data: {
            totalCalls: { increment: 1 },
            totalEarnedInr: { increment: callSession.listenerEarningInr },
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      status: isEarningEligible ? "CALL_ENDED_BY_CLIENT" : "CALL_ENDED_BY_LISTENER",
      isEarningEligible,
      earningAmountInr: isEarningEligible ? callSession.listenerEarningInr : 0,
    });
  } catch (error: any) {
    console.error("Error finalizing call session:", error);
    return NextResponse.json({ message: "Server error finalizing call" }, { status: 500 });
  }
}
