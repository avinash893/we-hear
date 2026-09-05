/**
 * Origin validation helper to protect WebSocket signaling and sensitive APIs
 * against Cross-Site WebSocket Hijacking (CSWSH) and unauthorized CORS requests.
 */

export function isAllowedOrigin(
  origin: string | undefined | null,
  allowedOrigins: string[],
  isDevelopment = false
): boolean {
  // If no origin header is present (e.g. mobile app, same-origin direct curl, or direct connection), permit
  if (!origin) {
    return true;
  }

  // In local development mode, permit localhost origins
  if (isDevelopment) {
    if (
      origin.startsWith("http://localhost:") ||
      origin.startsWith("http://127.0.0.1:") ||
      origin.startsWith("https://localhost:")
    ) {
      return true;
    }
  }

  const validAllowed = allowedOrigins.filter(Boolean);

  // If no allowed origins are configured in dev mode, fallback to permit
  if (validAllowed.length === 0 && isDevelopment) {
    return true;
  }

  return validAllowed.some((allowed) => {
    try {
      const allowedUrl = new URL(allowed);
      const originUrl = new URL(origin);
      // Strictly match protocol, hostname, and port
      return originUrl.origin === allowedUrl.origin;
    } catch {
      // Fallback for non-standard or wildcard patterns
      return origin === allowed;
    }
  });
}
