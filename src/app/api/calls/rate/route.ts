import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { sanitizeText } from "@/lib/security/sanitize";
import { calculateListenerPayout } from "@/lib/payments/pricing";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Rate limit: max 10 ratings per 10 minutes
    const limit = checkRateLimit(userId, "rate_call", 10, 10 * 60);
    if (!limit.allowed) {
      return NextResponse.json(
        { message: `Too many rating attempts. Please retry in ${limit.resetSeconds}s.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { sessionCode, rating, feedback } = body;

    if (!sessionCode || typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json(
        { message: "Valid session code and star rating (1 to 5) are required." },
        { status: 400 }
      );
    }

    const callSession = await prisma.callSession.findUnique({
      where: { sessionCode },
      include: {
        earning: true,
      },
    });

    if (!callSession) {
      return NextResponse.json({ message: "Call session not found." }, { status: 404 });
    }

    // Only the speaker (client) is authorized to rate the listener
    if (callSession.clientId !== userId) {
      return NextResponse.json(
        { message: "Forbidden: Only the speaker can evaluate this call session." },
        { status: 403 }
      );
    }

    // Idempotency: Prevent duplicate score manipulation
    if (callSession.speakerRating !== null) {
      return NextResponse.json({
        success: true,
        alreadyRated: true,
        rating: callSession.speakerRating,
        message: "Rating has already been recorded for this session.",
      });
    }

    const roundedRating = Math.round(rating);
    const minEarning = callSession.minListenerEarningInr || 8;
    const maxEarning = callSession.maxListenerEarningInr || 14;
    const baseEarning = callSession.listenerEarningInr || 10;

    // Authoritative calculation of listener payout
    const finalEarningInr = Math.round(
      calculateListenerPayout(roundedRating, minEarning, maxEarning, baseEarning)
    );

    const cleanFeedback = feedback ? sanitizeText(feedback, 500) : null;

    await prisma.$transaction(async (tx) => {
      // 1. Record rating on CallSession
      await tx.callSession.update({
        where: { id: callSession.id },
        data: {
          speakerRating: roundedRating,
          speakerFeedback: cleanFeedback,
          ratedAt: new Date(),
        },
      });

      // 2. Adjust or create listener earning
      if (callSession.earning) {
        const previousAmount = callSession.earning.amountInr;
        const delta = finalEarningInr - previousAmount;

        await tx.listenerEarning.update({
          where: { id: callSession.earning.id },
          data: {
            amountInr: finalEarningInr,
            ratingApplied: roundedRating,
          },
        });

        // Update listener profile totals if there's a difference
        if (delta !== 0 && callSession.listenerId) {
          await tx.listenerProfile.updateMany({
            where: { userId: callSession.listenerId },
            data: {
              totalEarnedInr: { increment: delta },
            },
          });
        }
      } else if (callSession.listenerId && callSession.isEarningEligible) {
        // If earning wasn't created yet, create it with the final rated amount
        await tx.listenerEarning.create({
          data: {
            listenerId: callSession.listenerId,
            sessionId: callSession.id,
            amountInr: finalEarningInr,
            ratingApplied: roundedRating,
            status: "AVAILABLE",
          },
        });

        await tx.listenerProfile.updateMany({
          where: { userId: callSession.listenerId },
          data: {
            totalCalls: { increment: 1 },
            totalEarnedInr: { increment: finalEarningInr },
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      rating: roundedRating,
      calculatedEarningInr: finalEarningInr,
      message: "Thank you for evaluating your listener! Your feedback directly supports genuine, caring peers.",
    });
  } catch (error: any) {
    console.error("Error rating call session:", error);
    return NextResponse.json(
      { message: error.message || "Failed to submit rating." },
      { status: 500 }
    );
  }
}
