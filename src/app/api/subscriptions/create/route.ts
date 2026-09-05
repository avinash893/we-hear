import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db";
import { SUBSCRIPTION_PLANS } from "@/lib/subscriptions/config";
import { paymentService } from "@/lib/payments/service";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === body.planId);

    if (!plan) {
      return NextResponse.json({ message: "Invalid subscription plan selected" }, { status: 400 });
    }

    // Initialize payment order
    const order = await paymentService.createPayment({
      amountInr: plan.priceInr,
      userId,
      receipt: `sub_${userId.substring(0, 8)}_${plan.durationDays}d`,
      notes: {
        planId: plan.id,
        role: plan.role,
        durationDays: String(plan.durationDays),
      },
    });

    const startsAt = new Date();
    const endsAt = new Date(startsAt.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    // Record subscription in database
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        role: plan.role,
        planDays: plan.durationDays,
        amountInr: plan.priceInr,
        status: order.isMock ? "ACTIVE" : "PENDING",
        startsAt,
        endsAt,
      },
    });

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      orderId: order.orderId,
      amountInr: order.amountInr,
      currency: order.currency,
      keyId: order.keyId,
      isMock: order.isMock,
    });
  } catch (error: any) {
    console.error("Subscription creation error:", error);
    return NextResponse.json({ message: "Failed to create subscription" }, { status: 500 });
  }
}
