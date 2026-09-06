import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db";
import { paymentService } from "@/lib/payments/service";
import { checkRateLimit, getClientIp } from "@/lib/security/rateLimiter";
import { verifyCaptchaSolution } from "@/lib/security/captcha";
import { detectCountry, getRegionalPricing } from "@/lib/payments/pricing";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rateLimit = checkRateLimit(ip, "payment", 10, 15 * 60);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { message: `Rate limit exceeded. Please try again in ${rateLimit.resetSeconds} seconds.` },
        { status: 429 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Optional CAPTCHA verification if provided
    try {
      const body = await req.clone().json();
      if (body.captchaToken && body.captchaAnswer) {
        const isValid = verifyCaptchaSolution(body.captchaAnswer, body.captchaToken);
        if (!isValid) {
          return NextResponse.json({ message: "Security verification failed. Please check the answer." }, { status: 400 });
        }
      }
    } catch {
      // Body may be empty if no captcha payload sent
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { anonymousProfile: true },
    });

    if (!user || user.isDestroyed) {
      return NextResponse.json({ message: "Account not active" }, { status: 403 });
    }

    // Dynamic Regional PPP Pricing
    const country = detectCountry(req);
    const regional = getRegionalPricing(country);

    const priceInr = regional.currency === "INR" 
      ? regional.speakerPrice 
      : Math.round(regional.speakerPrice * 84);

    const listenerEarningInr = regional.currency === "INR"
      ? regional.listenerEarning
      : Math.round(regional.listenerEarning * 84);

    const minListenerEarningInr = regional.currency === "INR"
      ? regional.minListenerEarning
      : Math.round(regional.minListenerEarning * 84);

    const maxListenerEarningInr = regional.currency === "INR"
      ? regional.maxListenerEarning
      : Math.round(regional.maxListenerEarning * 84);

    const sessionCode = `room_${crypto.randomBytes(8).toString("hex")}`;
    const idempotencyKey = `pay_req_${crypto.randomBytes(12).toString("hex")}`;

    // Create session in PAYMENT_PENDING state
    const callSession = await prisma.callSession.create({
      data: {
        sessionCode,
        clientId: userId,
        status: "PAYMENT_PENDING",
        priceInr,
        listenerEarningInr,
        minListenerEarningInr,
        maxListenerEarningInr,
      },
    });

    // Create payment order via isolated payment service
    const order = await paymentService.createPayment({
      amountInr: priceInr,
      currency: regional.currency,
      amountInSmallestUnit: regional.amountInSmallestUnit,
      userId,
      sessionId: callSession.id,
      receipt: `rcpt_${callSession.id.substring(0, 10)}`,
      notes: {
        sessionId: callSession.id,
        sessionCode: callSession.sessionCode,
        tier: regional.tier,
        country: regional.countryCode,
      },
    });

    // Record payment order in database
    await prisma.payment.create({
      data: {
        userId,
        sessionId: callSession.id,
        amountInr: priceInr,
        provider: order.isMock ? "MOCK" : "RAZORPAY",
        orderId: order.orderId,
        status: "PENDING",
        idempotencyKey,
      },
    });

    return NextResponse.json({
      success: true,
      orderId: order.orderId,
      amountInr: order.amountInr,
      amount: regional.amountInSmallestUnit,
      currency: order.currency,
      displayPrice: regional.displaySpeakerPrice,
      keyId: order.keyId,
      sessionId: callSession.id,
      sessionCode: callSession.sessionCode,
      isMock: order.isMock,
    });
  } catch (error: any) {
    console.error("Error creating payment order:", error);
    return NextResponse.json(
      { message: error.message || "Failed to initialize payment." },
      { status: 500 }
    );
  }
}
