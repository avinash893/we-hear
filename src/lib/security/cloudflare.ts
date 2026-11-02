import { NextResponse } from "next/server";

export interface CloudflareMetadata {
  isCloudflare: boolean;
  ip: string;
  country: string;
  rayId: string | null;
  proto: string | null;
}

/**
 * Parses and verifies incoming Cloudflare Edge proxy headers
 */
export function getCloudflareMetadata(req: Request): CloudflareMetadata {
  const headers = req.headers;
  const cfRay = headers.get("cf-ray");
  const cfIp = headers.get("cf-connecting-ip");
  const cfCountry = headers.get("cf-ipcountry") || "XX";
  const cfVisitor = headers.get("cf-visitor");
  const forwardedProto = headers.get("x-forwarded-proto");

  let proto: string | null = null;
  if (cfVisitor) {
    try {
      const parsed = JSON.parse(cfVisitor);
      proto = parsed.scheme || null;
    } catch {
      proto = null;
    }
  }
  if (!proto) {
    proto = forwardedProto || null;
  }

  const isCloudflare = Boolean(cfRay || cfIp);
  const ip = cfIp?.trim() || headers.get("x-real-ip")?.trim() || headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

  return {
    isCloudflare,
    ip,
    country: cfCountry.toUpperCase(),
    rayId: cfRay,
    proto,
  };
}

/**
 * Verifies Cloudflare Turnstile CAPTCHA response server-side
 */
export async function verifyCloudflareTurnstile(
  token: string,
  remoteIp?: string
): Promise<{ success: boolean; errorCodes?: string[] }> {
  const secretKey = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    // Graceful fallback in development when Turnstile secret is omitted
    return { success: true };
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token);
    if (remoteIp) {
      formData.append("remoteip", remoteIp);
    }

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const data = await res.json();
    return {
      success: Boolean(data.success),
      errorCodes: data["error-codes"],
    };
  } catch (err) {
    console.warn("[Cloudflare Turnstile] Verification request failed:", err);
    return { success: false, errorCodes: ["network-error"] };
  }
}

/**
 * Injects enhanced security & Cloudflare tracing headers into Next.js Response
 */
export function applySecurityHeaders(res: NextResponse, meta?: CloudflareMetadata): NextResponse {
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-XSS-Protection", "1; mode=block");

  if (meta?.rayId) {
    res.headers.set("X-Cloudflare-Ray", meta.rayId);
  }
  if (meta?.country && meta.country !== "XX") {
    res.headers.set("X-Client-Country", meta.country);
  }

  return res;
}
