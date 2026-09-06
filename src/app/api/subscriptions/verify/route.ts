import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db";
import { paymentService } from "@/lib/payments/service";
import { checkRateLimit, getClientIp } from "@/lib/security/rateLimiter";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rateLimit = checkRateLimit(ip, "sub_verify", 15, 60);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { message: `Too many verification attempts. Please retry in ${rateLimit.resetSeconds}s.` },
        { status: 429 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { orderId, paymentId, signature } = await req.json();

    if (!orderId) {
      return NextResponse.json({ message: "Missing order ID parameter" }, { status: 400 });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { orderId },
    });

    if (!subscription) {
      return NextResponse.json({ message: "Subscription order not found" }, { status: 404 });
    }

    if (subscription.userId !== userId) {
      return NextResponse.json({ message: "Forbidden: Unauthorized access to subscription" }, { status: 403 });
    }

    // Idempotency: If already active, return success immediately
    if (subscription.status === "ACTIVE") {
      return NextResponse.json({
        success: true,
        alreadyProcessed: true,
        subscriptionId: subscription.id,
        status: "ACTIVE",
      });
    }

    // Cryptographic signature verification
    const isValid = await paymentService.verifyPayment({
      orderId,
      paymentId: paymentId || `pay_mock_${Date.now()}`,
      signature,
    });

    if (!isValid) {
      return NextResponse.json({ message: "Invalid payment signature" }, { status: 400 });
    }

    // Atomically activate subscription
    await prisma.$transaction(async (tx) => {
      await tx.subscription.updateMany({
        where: {
          orderId,
          status: { not: "ACTIVE" },
        },
        data: {
          status: "ACTIVE",
          paymentId: paymentId || `pay_mock_${Date.now()}`,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: "SUBSCRIPTION_ACTIVATED",
          metadata: JSON.stringify({
            subscriptionId: subscription.id,
            orderId,
            planDays: subscription.planDays,
            role: subscription.role,
          }),
        },
      });
    });

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      status: "ACTIVE",
      message: "Subscription successfully activated!",
    });
  } catch (error: any) {
    console.error("Subscription verification error:", error);
    return NextResponse.json({ message: "Failed to verify subscription" }, { status: 500 });
  }
}
