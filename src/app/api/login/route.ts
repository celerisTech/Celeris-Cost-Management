import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import getDb from "../../utils/db";
import { LoginSchema } from "../../utils/schemas";
import { rateLimit } from "../../utils/rateLimit";

export async function POST(req: Request) {
  // Apply rate limiting (5 login attempts per minute per IP)
  const limitResult = rateLimit(req, { limit: 5, windowMs: 60 * 1000 });
  if (limitResult.isRateLimited && limitResult.errorResponse) {
    return limitResult.errorResponse;
  }

  try {
    const body = await req.json();
    const validationResult = LoginSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation Error", details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { username, password } = validationResult.data;
    const db = await getDb();

    // Query user by phone number
    const [rows] = await db.query(
      "SELECT * FROM ccms_users WHERE CM_Phone_Number = ?",
      [username]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const user = rows[0] as any;

    // Check active status: only active users can log in
    const statusStr = String(user.CM_Is_Active || "").toLowerCase();
    if (statusStr !== "active" && statusStr !== "1" && statusStr !== "true") {
      return NextResponse.json(
        { error: "Your account is inactive. Please contact your administrator." },
        { status: 403 }
      );
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.CM_Password);

    if (!isMatch) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const secret = process.env.JWT_SECRET || "default_ccms_secret_key_change_in_prod";

    // Sign JWT
    const token = jwt.sign(
      {
        id: user.CM_User_ID,
        user: user.CM_Phone_Number,
        mobile: user.CM_Phone_Number,
        companyId: user.CM_Company_ID,
      },
      secret,
      { expiresIn: "1d" }
    );

    const res = NextResponse.json({
      message: "Login success",
      user: {
        id: user.CM_User_ID,
        mobile: user.CM_Phone_Number,
        companyId: user.CM_Company_ID,
      },
    });

    res.cookies.set("ccms_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
    });

    return res;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
