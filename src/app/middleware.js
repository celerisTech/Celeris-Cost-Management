import { NextResponse } from "next/server";

export function middleware(req) {
  const token = req.cookies.get("ccms_token")?.value;

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

  const path = req.nextUrl.pathname;
  const isProtected = protectedRoutes.some((route) =>
    path.startsWith(route)
  );

  if (isProtected && !token) {
    return NextResponse.redirect(new URL("/", req.url)); // send to login
  }

  return NextResponse.next();
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
  ],
};