import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  const { username, password } = await req.json();

  // Replace with DB check later
  if (username !== "admin" || password !== "1234") {
    const res = NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }

  // Sign a JWT
  const token = jwt.sign(
    { user: username },
    process.env.JWT_SECRET!,
    { expiresIn: "1h" }
  );

  // Set JWT as cookie
  const res = NextResponse.json({ message: "Login success" });
  res.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });

  return res;
}
