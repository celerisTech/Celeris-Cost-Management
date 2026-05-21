import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { mobile, otp } = await request.json();

  if (!mobile || !otp) {
    const res = NextResponse.json({ error: "Mobile and OTP required" }, { status: 400 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }

  try {
    const res = await fetch("https://control.msg91.com/api/v5/otp/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authkey: process.env.MSG91_AUTH_KEY!,
      },
      body: JSON.stringify({ mobile: `91${mobile}`, otp }),
    });

    const data = await res.json();

    if (data.type === "success") {
      const res = NextResponse.json({ success: true, message: "OTP verified successfully" });
      res.headers.set('Cache-Control', 'no-store');
      return res;
    } else {
      const res = NextResponse.json({ success: false, error: data.message || "Invalid OTP" }, { status: 400 });
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }
  } catch {
    const res = NextResponse.json({ error: "Verification failed" }, { status: 500 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}
