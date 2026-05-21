import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import getDb from "../../utils/db";


export async function POST(req: Request) {
  const { username, password } = await req.json();

  // Perform DB check
  if (!username || !password) {
    return NextResponse.json({ error: "Username and password required" }, { status: 400 });
  }

  try {
    const db = await getDb();

    // Assume username is mapping to CM_Phone_Number based on existing schema
    const [rows] = await db.query(
      "SELECT * FROM ccms_users WHERE CM_Phone_Number = ?",
      [username]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const user = rows[0] as any;

    // Compare password
    const isMatch = await bcrypt.compare(password, user.CM_Password);

    if (!isMatch) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Sign a JWT
    const token = jwt.sign(
      {
        id: user.CM_User_ID,
        user: user.CM_Phone_Number, // Keeping 'user' claim for consistency, though 'mobile' is used elsewhere
        mobile: user.CM_Phone_Number
      },
      process.env.JWT_SECRET!,
      { expiresIn: "1d" }
    );

    // Set JWT as cookie
    const res = NextResponse.json({
      message: "Login success",
      user: {
        id: user.CM_User_ID,
        mobile: user.CM_Phone_Number,
        companyId: user.CM_Company_ID
      }
    });

    res.cookies.set("ccms_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 // 1 day
    });

    return res;

  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
