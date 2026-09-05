import { NextResponse } from "next/server";
import { generateCaptchaChallenge } from "@/lib/security/captcha";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
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
