import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { paymentService } from "@/lib/payments/service";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET || "cron_dev_secret";

    // Protect cron endpoint in production
    if (process.env.NODE_ENV === "production" && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ message: "Unauthorized cron execution" }, { status: 401 });
    }

    const expirationHours = Number(process.env.MATCH_EXPIRATION_HOURS || 24);
    const expirationThreshold = new Date(Date.now() - expirationHours * 60 * 60 * 1000);

    // Find sessions in WAITING_FOR_LISTENER that have exceeded 24 hours
    const expiredSessions = await prisma.callSession.findMany({
      where: {
        status: "WAITING_FOR_LISTENER",
        matchStartedAt: { lte: expirationThreshold },
      },
      include: {
        payment: true,
      },
    });

    const refundResults = [];

    for (const session of expiredSessions) {
      if (!session.payment || session.payment.status !== "SUCCESS") continue;

      try {
        // Execute refund through isolated PaymentService
        const refund = await paymentService.refundPayment({
          paymentId: session.payment.paymentId || session.payment.orderId,
          amountInr: session.priceInr,
          reason: "UNMATCHED_24H",
        });

        // Record refund in DB
        await prisma.$transaction([
          prisma.refund.create({
            data: {
              paymentId: session.payment.id,
              sessionId: session.id,
              amountInr: session.priceInr,
              reason: "UNMATCHED_24H",
              providerRefundId: refund.refundId,
              status: refund.success ? "COMPLETED" : "FAILED",
            },
          }),
          prisma.callSession.update({
            where: { id: session.id },
            data: { status: "REFUNDED" },
          }),
          prisma.payment.update({
            where: { id: session.payment.id },
            data: { status: "REFUNDED" },
          }),
        ]);

        refundResults.push({
          sessionId: session.id,
          refundId: refund.refundId,
          status: "REFUNDED",
        });
      } catch (err: any) {
        console.error(`Failed to refund session ${session.id}:`, err);
        refundResults.push({
          sessionId: session.id,
          status: "ERROR",
          error: err.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      processedCount: expiredSessions.length,
      refunds: refundResults,
    });
  } catch (error: any) {
    console.error("Cron expire matches error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
