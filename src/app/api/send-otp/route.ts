import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { mobile } = await request.json();

  if (!mobile) {
    const res = NextResponse.json({ error: "Mobile number required" }, { status: 400 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }

  try {
    const res = await fetch("https://control.msg91.com/api/v5/otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authkey: process.env.MSG91_AUTH_KEY!,
      },
      body: JSON.stringify({
        template_id: process.env.MSG91_TEMPLATE_ID!,
        mobile: `91${mobile}`,
      }),
    });

    const data = await res.json();

    if (data.type === "success") {
      const res = NextResponse.json({ success: true, message: "OTP sent successfully" });
      res.headers.set('Cache-Control', 'no-store');
      return res;
    } else {
      const res = NextResponse.json({ success: false, error: data.message || "Failed to send OTP" }, { status: 400 });
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }
  } catch (err) {
    const res = NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}
