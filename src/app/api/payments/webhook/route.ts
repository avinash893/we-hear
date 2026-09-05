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
        const existingPayment = await prisma.payment.findUnique({
          where: { orderId },
          include: { session: true },
        });

        // Idempotency: If already marked success, safely acknowledge without re-running
        if (existingPayment && existingPayment.status !== "SUCCESS") {
          await prisma.payment.update({
            where: { orderId },
            data: {
              status: "SUCCESS",
              paymentId: paymentId || existingPayment.paymentId,
            },
          });

          if (existingPayment.sessionId) {
            await prisma.callSession.update({
              where: { id: existingPayment.sessionId },
              data: {
                status: "WAITING_FOR_LISTENER",
                matchStartedAt: new Date(),
              },
            });

            // Attempt match
            await attemptMatch(existingPayment.sessionId);
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
