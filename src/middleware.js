import { NextResponse } from "next/server";

export function middleware(req) {
  // Check for 'token' (set by login) or 'ccms_token' (legacy)
  const token = req.cookies.get("token")?.value || req.cookies.get("ccms_token")?.value;

  const { pathname } = req.nextUrl;

  // Define paths that require authentication
  // We protect /api routes, but must exclude public APIs like login
  const isApiRoute = pathname.startsWith("/api");
  const isPublicApi =
    pathname.startsWith("/api/login") ||
    pathname.startsWith("/api/register") ||
    pathname.startsWith("/api/public") ||
    pathname.startsWith("/api/get-user"); // 🔓 allow login / signup helper

  // UI Routes that definitely need protection
  const protectedRoutes = [
    "/dashboard",
    "/projects",
    "/expenses",
    "/labors",
    "/supplier",
    "/teams",
    "/settings",
    "/usage",
    "/warehouse",
  ];

  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  // 1. (Disabled) API auth via middleware
  // NOTE: Individual API routes should handle their own auth.
  // if (isApiRoute && !isPublicApi) {
  //   if (!token) {
  //     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  //   }
  // }

  // 2. Protect UI Routes
  if (isProtectedRoute) {
    if (!token) {
      // Redirect to login page
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Protect these UI paths
    "/dashboard/:path*",
    "/projects/:path*",
    "/expenses/:path*",
    "/labors/:path*",
    "/supplier/:path*",
    "/teams/:path*",
    "/settings/:path*",
    "/usage/:path*",
    "/warehouse/:path*",
    // Also run middleware on all API routes to check auth
    "/api/:path*",
  ],
};