import { NextResponse } from "next/server";

export function middleware(req) {
  // Check for 'token' or 'ccms_token'
  const token = req.cookies.get("token")?.value || req.cookies.get("ccms_token")?.value;
  const { pathname } = req.nextUrl;

  // Protected UI Routes
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
    "/stock-management",
    "/purchase-summary",
    "/salary-report",
  ];

  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  // Protect UI Routes
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Create response
  const response = NextResponse.next();

  // Inject OWASP Security Headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(self)"
  );
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' https:;"
  );

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/projects/:path*",
    "/expenses/:path*",
    "/labors/:path*",
    "/supplier/:path*",
    "/teams/:path*",
    "/settings/:path*",
    "/usage/:path*",
    "/warehouse/:path*",
    "/stock-management/:path*",
    "/purchase-summary/:path*",
    "/salary-report/:path*",
    "/api/:path*",
  ],
};