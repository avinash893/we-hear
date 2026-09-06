import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db";
import { checkRateLimit, getClientIp } from "@/lib/security/rateLimiter";
import { sanitizeText } from "@/lib/security/sanitize";

// Standard UPI Virtual Payment Address (VPA) validation pattern
const UPI_REGEX = /^[a-zA-Z0-9.\-_]{2,100}@[a-zA-Z]{2,30}$/;

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const ipLimit = checkRateLimit(ip, "payout_ip", 10, 60 * 60);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { message: `Too many payout attempts from this network. Try again in ${ipLimit.resetSeconds}s.` },
        { status: 429 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Rate limit: Max 3 payout requests per hour per user
    const userLimit = checkRateLimit(userId, "payout_user", 3, 60 * 60);
    if (!userLimit.allowed) {
      return NextResponse.json(
        { message: `You have submitted multiple payout requests recently. Please wait ${userLimit.resetSeconds}s.` },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { listenerProfile: true },
    });

    if (!user || user.isDestroyed || !user.listenerProfile) {
      return NextResponse.json({ message: "Active listener profile required" }, { status: 403 });
    }

    const body = await req.json();
    const { upiId, amountInr } = body;

    if (!upiId || typeof upiId !== "string") {
      return NextResponse.json({ message: "Valid UPI ID is required for payout." }, { status: 400 });
    }

    const sanitizedUpi = sanitizeText(upiId.trim().toLowerCase(), 120);
    if (!UPI_REGEX.test(sanitizedUpi)) {
      return NextResponse.json(
        { message: "Invalid UPI ID format. Format must be yourname@bank (e.g. name@okhdfcbank)." },
        { status: 400 }
      );
    }

    // Check active listener subscription for threshold discount (₹50 vs ₹100)
    const activeSub = await prisma.subscription.findFirst({
      where: {
        userId,
        role: "LISTENER",
        status: "ACTIVE",
        endsAt: { gte: new Date() },
      },
    });

    const minThreshold = activeSub ? 50 : Number(process.env.MIN_PAYOUT_THRESHOLD_INR || 100);
    const requestedAmount = Number(amountInr);

    if (!requestedAmount || requestedAmount < minThreshold) {
      return NextResponse.json(
        { message: `Minimum payout request threshold is ₹${minThreshold}.` },
        { status: 400 }
      );
    }

    // Execute atomic balance check and earning lock
    const result = await prisma.$transaction(async (tx) => {
      // Fetch available earnings
      const availableEarnings = await tx.listenerEarning.findMany({
        where: {
          listenerId: userId,
          status: "AVAILABLE",
        },
        orderBy: { createdAt: "asc" },
      });

      const totalAvailable = availableEarnings.reduce((acc, e) => acc + e.amountInr, 0);

      if (totalAvailable < requestedAmount) {
        throw new Error(`Insufficient available balance. Your available balance is ₹${totalAvailable}.`);
      }

      // Collect specific earnings that fulfill the requested amount
      let accumulated = 0;
      const earningsToMarkPaid: string[] = [];

      for (const earning of availableEarnings) {
        if (accumulated >= requestedAmount) break;
        accumulated += earning.amountInr;
        earningsToMarkPaid.push(earning.id);
      }

      const now = new Date();

      // Atomically transition collected earnings to PAID_OUT
      await tx.listenerEarning.updateMany({
        where: {
          id: { in: earningsToMarkPaid },
          status: "AVAILABLE", // Guard against double-spend
        },
        data: {
          status: "PAID_OUT",
          paidAt: now,
        },
      });

      // Create official PayoutRequest record
      const payout = await tx.payoutRequest.create({
        data: {
          listenerId: userId,
          amountInr: requestedAmount,
          upiId: sanitizedUpi,
          status: "SUBMITTED",
          requestedAt: now,
        },
      });

      // Create immutable audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: "PAYOUT_REQUESTED",
          metadata: JSON.stringify({
            payoutRequestId: payout.id,
            amountInr: requestedAmount,
            upiIdMasked: sanitizedUpi.replace(/(?<=..).(?=.*@)/g, "*"),
            earningsCoveredCount: earningsToMarkPaid.length,
          }),
        },
      });

      return payout;
    });

    return NextResponse.json({
      success: true,
      payoutId: result.id,
      amountInr: result.amountInr,
      message: `Payout request for ₹${result.amountInr} submitted successfully to ${sanitizedUpi}. Processing takes 24-48 hours.`,
    });
  } catch (error: any) {
    console.error("Payout request error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to process payout request." },
      { status: 500 }
    );
  }
}
