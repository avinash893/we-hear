import crypto from "crypto";

const CAPTCHA_SECRET =
  process.env.CAPTCHA_SECRET || process.env.NEXTAUTH_SECRET || "we-hear-captcha-secret-salt-key-987654";

export interface CaptchaChallenge {
  id: string;
  question: string;
  token: string;
  expiresAt: number;
}

/**
 * Generates a lightweight, privacy-respecting cryptographic challenge
 */
export function generateCaptchaChallenge(): CaptchaChallenge {
  const num1 = Math.floor(Math.random() * 12) + 3;
  const num2 = Math.floor(Math.random() * 9) + 2;
  const answer = String(num1 + num2);
  const id = crypto.randomBytes(8).toString("hex");
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes TTL

  // Sign the answer, id, and expiry into a tamper-proof HMAC token
  const payload = `${id}:${answer}:${expiresAt}`;
  const signature = crypto
    .createHmac("sha256", CAPTCHA_SECRET)
    .update(payload)
    .digest("hex");

  const token = Buffer.from(`${id}:${expiresAt}:${signature}`).toString("base64");

  return {
    id,
    question: `Security check: What is ${num1} + ${num2}?`,
    token,
    expiresAt,
  };
}

/**
 * Verifies a CAPTCHA solution against the cryptographic token
 */
export function verifyCaptchaSolution(userAnswer: string, token: string): boolean {
  if (!userAnswer || !token) return false;

  try {
    const decoded = Buffer.from(token, "base64").toString("utf8");
    const [id, expiresAtStr, providedSignature] = decoded.split(":");
    const expiresAt = parseInt(expiresAtStr, 10);

    // Check expiration
    if (Date.now() > expiresAt) {
      return false;
    }

    const cleanAnswer = userAnswer.trim();
    const payload = `${id}:${cleanAnswer}:${expiresAt}`;
    const expectedSignature = crypto
      .createHmac("sha256", CAPTCHA_SECRET)
      .update(payload)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(providedSignature)
    );
  } catch (err) {
    return false;
  }
}

/**
 * Validates Cloudflare Turnstile token if configured in production
 */
export async function verifyTurnstileToken(token: string, ip?: string): Promise<boolean> {
  const secretKey = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    // If turnstile secret is not set, allow fallback to internal cryptographic captcha
    return true;
  }

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
        remoteip: ip || "",
      }),
    });

    const data = await response.json();
    return Boolean(data.success);
  } catch {
    return false;
  }
}
