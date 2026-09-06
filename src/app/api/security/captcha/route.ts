import { NextResponse } from "next/server";
import { generateCaptchaChallenge } from "@/lib/security/captcha";

import { checkRateLimit, getClientIp } from "@/lib/security/rateLimiter";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const ip = getClientIp(req);
    const limit = checkRateLimit(ip, "captcha", 30, 60);
    if (!limit.allowed) {
      return NextResponse.json(
        { message: `Too many captcha requests. Please retry in ${limit.resetSeconds}s.` },
        { status: 429 }
      );
    }

    const challenge = generateCaptchaChallenge();
    return NextResponse.json({
      success: true,
      question: challenge.question,
      token: challenge.token,
      expiresAt: challenge.expiresAt,
    });
  } catch (error) {
    return NextResponse.json({ message: "Failed to generate captcha" }, { status: 500 });
  }
}
