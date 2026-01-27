import { NextResponse } from "next/server";

export async function GET() {
  // Expire the ccms_token cookie
  const response = NextResponse.json({ success: true });
  response.cookies.set("ccms_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0), // expire immediately
  });
  return response;
}
