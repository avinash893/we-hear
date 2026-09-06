import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { paymentService } from "@/lib/payments/service";
import { attemptMatch } from "@/server/matchmaking/queue";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || "";

    // Webhook signature verification
    const isValid = paymentService.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      return NextResponse.json({ message: "Invalid webhook signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;

    if (eventType === "payment.captured" || eventType === "order.paid") {
      const orderId = event.payload?.payment?.entity?.order_id;
      const paymentId = event.payload?.payment?.entity?.id;

      if (orderId) {
        // 1. Check if order belongs to a CallSession payment
        const existingPayment = await prisma.payment.findUnique({
          where: { orderId },
          include: { session: true },
        });

        if (existingPayment) {
          // Atomic Compare-And-Swap: update only if not already marked SUCCESS
          await prisma.$transaction(async (tx) => {
            const paymentUpdate = await tx.payment.updateMany({
              where: {
                orderId,
                status: { not: "SUCCESS" },
              },
              data: {
                status: "SUCCESS",
                paymentId: paymentId || existingPayment.paymentId,
              },
            });

            if (paymentUpdate.count > 0 && existingPayment.sessionId) {
              // Only advance session if currently PAYMENT_PENDING
              await tx.callSession.updateMany({
                where: {
                  id: existingPayment.sessionId,
                  status: "PAYMENT_PENDING",
                },
                data: {
                  status: "WAITING_FOR_LISTENER",
                  matchStartedAt: new Date(),
                },
              });

              // Attempt match
              await attemptMatch(existingPayment.sessionId);
            }
          });
        } else {
          // 2. Check if order belongs to a Subscription
          const existingSubscription = await prisma.subscription.findUnique({
            where: { orderId },
          });

          if (existingSubscription) {
            await prisma.subscription.updateMany({
              where: {
                orderId,
                status: { not: "ACTIVE" },
              },
              data: {
                status: "ACTIVE",
                paymentId: paymentId || existingSubscription.paymentId,
              },
            });
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ message: "Webhook handler failed" }, { status: 500 });
  }
}
