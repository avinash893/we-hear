import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/auth/signin",
  },
});

export const config = {
  matcher: [
    "/listen/:path*",
    "/talk/:path*",
    "/account/:path*",
    "/earnings/:path*",
    "/call/:path*",
  ],
};
