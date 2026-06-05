import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login"
  },
  secret: process.env.NEXTAUTH_SECRET ?? "middleground-local-development-secret"
});

export const config = {
  matcher: ["/dashboard/:path*", "/plans/:path*"]
};
