/**
 * Sanitizes text inputs to prevent XSS, HTML injection, and control character attacks
 */
export function sanitizeText(input: unknown, maxLength = 1000): string {
  if (typeof input !== "string") return "";

  let sanitized = input.trim();

  // Strip null bytes and non-printable control characters (except newline / tab)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // Escape HTML entities: &, <, >, ", '
  sanitized = sanitized
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");

  // Prevent javascript: and data: pseudo-protocols
  sanitized = sanitized.replace(/(javascript|vbscript|data):/gi, "$1_blocked:");

  return sanitized.substring(0, maxLength);
}

/**
 * Validates alphanumeric identifiers (IDs, session codes, tokens)
 */
export function isValidCode(code: string, maxLen = 64): boolean {
  if (!code || typeof code !== "string" || code.length > maxLen) return false;
  return /^[a-zA-Z0-9_-]+$/.test(code);
}
