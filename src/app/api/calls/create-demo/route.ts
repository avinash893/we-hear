import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db";
import { attemptMatch } from "@/server/matchmaking/queue";
import { checkRateLimit, getClientIp } from "@/lib/security/rateLimiter";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    // Rate limit: Max 10 demo call sessions per 10 minutes per IP
    const rateLimit = checkRateLimit(ip, "demo_call", 10, 10 * 60);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { message: `Too many demo requests. Please retry in ${rateLimit.resetSeconds}s.` },
        { status: 429 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized. Please sign in to try the free demo." }, { status: 401 });
    }

    const userId = session.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { anonymousProfile: true },
    });

    if (!user || user.isDestroyed) {
      return NextResponse.json({ message: "Account not active" }, { status: 403 });
    }

    const sessionCode = `room_demo_${crypto.randomBytes(6).toString("hex")}`;
    const idempotencyKey = `demo_req_${crypto.randomBytes(12).toString("hex")}`;

    // Create session in WAITING_FOR_LISTENER state directly (Price = 0, no payment required)
    const callSession = await prisma.callSession.create({
      data: {
        sessionCode,
        clientId: userId,
        status: "WAITING_FOR_LISTENER",
        priceInr: 0,
        listenerEarningInr: 0,
        minListenerEarningInr: 0,
        maxListenerEarningInr: 0,
        matchStartedAt: new Date(),
      },
    });

    // Record zero-cost demo payment entry for auditing
    await prisma.payment.create({
      data: {
        userId,
        sessionId: callSession.id,
        amountInr: 0,
        provider: "MOCK",
        orderId: `demo_order_${callSession.id.substring(0, 10)}`,
        status: "SUCCESS",
        idempotencyKey,
      },
    });

    // Attempt match with any available live listener
    const matchResult = await attemptMatch(callSession.id);

    return NextResponse.json({
      success: true,
      sessionId: callSession.id,
      sessionCode: callSession.sessionCode,
      matched: matchResult.matched,
      listenerNickname: matchResult.listenerNickname,
      isDemo: true,
    });
  } catch (error: any) {
    console.error("Error creating demo session:", error);
    return NextResponse.json(
      { message: error.message || "Failed to initialize demo call." },
      { status: 500 }
    );
  }
}
