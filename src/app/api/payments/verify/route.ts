import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db";
import { paymentService } from "@/lib/payments/service";
import { attemptMatch } from "@/server/matchmaking/queue";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { orderId, paymentId, signature, sessionId } = await req.json();

    if (!orderId || !sessionId) {
      return NextResponse.json({ message: "Missing required payment parameters" }, { status: 400 });
    }

    // Server-side payment verification (Never trust the frontend alone!)
    const isValid = await paymentService.verifyPayment({
      orderId,
      paymentId: paymentId || `pay_mock_${Date.now()}`,
      signature,
      sessionId,
    });

    if (!isValid) {
      return NextResponse.json({ message: "Invalid payment signature" }, { status: 400 });
    }

    // Update payment and session in database transaction
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { orderId },
        data: {
          status: "SUCCESS",
          paymentId: paymentId || `pay_mock_${Date.now()}`,
          signature: signature || "mock_signature",
        },
      });

      await tx.callSession.update({
        where: { id: sessionId },
        data: {
          status: "WAITING_FOR_LISTENER",
          matchStartedAt: new Date(),
        },
      });
    });

    // Try matching immediately
    const matchResult = await attemptMatch(sessionId);

    return NextResponse.json({
      success: true,
      matched: matchResult.matched,
      sessionId: matchResult.sessionId,
      sessionCode: matchResult.sessionCode,
    });
  } catch (error: any) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      { message: error.message || "Failed to verify payment." },
      { status: 500 }
    );
  }
}
