import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCloudflareMetadata, applySecurityHeaders } from "@/lib/security/cloudflare";

export default withAuth(
  function middleware(req: NextRequest) {
    const meta = getCloudflareMetadata(req);
    const response = NextResponse.next();
    return applySecurityHeaders(response, meta);
  },
  {
    pages: {
      signIn: "/auth/signin",
    },
  }
);

export const config = {
  matcher: [
    "/listen/:path*",
    "/talk/:path*",
    "/account/:path*",
    "/earnings/:path*",
    "/call/:path*",
  ],
};
