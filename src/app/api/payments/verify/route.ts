import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db";
import { paymentService } from "@/lib/payments/service";
import { attemptMatch } from "@/server/matchmaking/queue";

import { checkRateLimit, getClientIp } from "@/lib/security/rateLimiter";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rateLimit = checkRateLimit(ip, "payment_verify", 20, 60);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { message: `Too many payment verification attempts. Please retry in ${rateLimit.resetSeconds}s.` },
        { status: 429 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { orderId, paymentId, signature, sessionId } = await req.json();

    if (!orderId || !sessionId) {
      return NextResponse.json({ message: "Missing required payment parameters" }, { status: 400 });
    }

    // Verify order exists and belongs to current authenticated user & target session
    const existingPayment = await prisma.payment.findUnique({
      where: { orderId },
      include: { session: true },
    });

    if (!existingPayment) {
      return NextResponse.json({ message: "Payment order not found" }, { status: 404 });
    }

    if (existingPayment.userId !== session.user.id || existingPayment.sessionId !== sessionId) {
      return NextResponse.json({ message: "Forbidden: Unauthorized payment verification" }, { status: 403 });
    }

    // Idempotency: If already confirmed, safely return status without re-running transaction
    if (existingPayment.status === "SUCCESS") {
      const matchResult = await attemptMatch(sessionId);
      return NextResponse.json({
        success: true,
        alreadyProcessed: true,
        matched: matchResult.matched,
        sessionId: matchResult.sessionId,
        sessionCode: matchResult.sessionCode,
      });
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

    // Update payment and session in database transaction with atomic Compare-And-Swap (CAS)
    let newlyProcessed = false;
    await prisma.$transaction(async (tx) => {
      const paymentUpdate = await tx.payment.updateMany({
        where: {
          orderId,
          status: { not: "SUCCESS" },
        },
        data: {
          status: "SUCCESS",
          paymentId: paymentId || `pay_mock_${Date.now()}`,
          signature: signature || "mock_signature",
        },
      });

      if (paymentUpdate.count > 0) {
        newlyProcessed = true;
        // Only advance session if it is still PAYMENT_PENDING to prevent overwriting MATCHED state
        await tx.callSession.updateMany({
          where: {
            id: sessionId,
            status: "PAYMENT_PENDING",
          },
          data: {
            status: "WAITING_FOR_LISTENER",
            matchStartedAt: new Date(),
          },
        });
      }
    });

    // Try matching immediately
    const matchResult = await attemptMatch(sessionId);

    return NextResponse.json({
      success: true,
      alreadyProcessed: !newlyProcessed,
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
