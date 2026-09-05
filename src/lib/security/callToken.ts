import crypto from "crypto";

const TOKEN_SECRET =
  process.env.NEXTAUTH_SECRET || "we-hear-call-token-secure-salt-key-123456";

export interface CallTokenPayload {
  sessionCode: string;
  userId: string;
  role: "CLIENT" | "LISTENER";
  expiresAt: number;
}

/**
 * Issues an HMAC-SHA256 signed call token for WebRTC room authorization
 */
export function generateCallToken(
  sessionCode: string,
  userId: string,
  role: "CLIENT" | "LISTENER",
  ttlSeconds = 2 * 60 * 60 // 2 hours
): string {
  const expiresAt = Date.now() + ttlSeconds * 1000;
  const payload = `${sessionCode}:${userId}:${role}:${expiresAt}`;
  const signature = crypto
    .createHmac("sha256", TOKEN_SECRET)
    .update(payload)
    .digest("hex");

  return Buffer.from(`${payload}:${signature}`).toString("base64");
}

/**
 * Verifies a call token against session code, user ID, and signature
 */
export function verifyCallToken(
  token: string,
  expectedSessionCode: string,
  expectedUserId: string
): { valid: boolean; role?: "CLIENT" | "LISTENER"; error?: string } {
  if (!token) return { valid: false, error: "Missing token" };

  try {
    const decoded = Buffer.from(token, "base64").toString("utf8");
    const [sessionCode, userId, role, expiresAtStr, signature] = decoded.split(":");

    if (!sessionCode || !userId || !role || !expiresAtStr || !signature) {
      return { valid: false, error: "Malformed token" };
    }

    // Expiry check
    const expiresAt = parseInt(expiresAtStr, 10);
    if (Date.now() > expiresAt) {
      return { valid: false, error: "Token expired" };
    }

    // Room and User matching
    if (sessionCode !== expectedSessionCode || userId !== expectedUserId) {
      return { valid: false, error: "Token mismatch for session or user" };
    }

    // Signature verification
    const payload = `${sessionCode}:${userId}:${role}:${expiresAt}`;
    const expectedSignature = crypto
      .createHmac("sha256", TOKEN_SECRET)
      .update(payload)
      .digest("hex");

    const isValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(signature)
    );

    if (!isValid) {
      return { valid: false, error: "Invalid signature" };
    }

    return { valid: true, role: role as "CLIENT" | "LISTENER" };
  } catch (err) {
    return { valid: false, error: "Token parsing exception" };
  }
}
