import { auth } from "@/app/lib/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const isAdmin = pathname.startsWith("/admin");
  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/resume-analysis");

  // Admin routes require admin role
  if (isAdmin && req.auth?.user?.role !== "admin") {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return Response.redirect(loginUrl);
  }

  // Protected routes require authentication
  if (isProtected && !req.auth) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return Response.redirect(loginUrl);
  }
});

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/resume-analysis/:path*"],
};
