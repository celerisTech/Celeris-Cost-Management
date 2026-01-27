import { NextRequest, NextResponse } from "next/server";
import getDb from "../../utils/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { RowDataPacket } from "mysql2";

interface UserRow extends RowDataPacket {
  CM_User_ID: string;
  CM_Phone_Number: string;
  CM_Password: string;
  CM_Company_ID: string;
}

export async function POST(request: NextRequest) {
  const { mobile, action, password } = await request.json();
  const db = await getDb();

  try {
    if (action === "check_mobile") {
      const [existing] = await db.query<UserRow[]>(
        "SELECT * FROM ccms_users WHERE CM_Phone_Number = ?",
        [mobile]
      );

      if (!Array.isArray(existing) || existing.length === 0) {
        const res = NextResponse.json(
          { error: "Your Mobile Number Not Registered" },
          { status: 400 }
        );
        res.headers.set('Cache-Control', 'no-store');
        return res;
      }
      const res = NextResponse.json({ success: true, user: existing[0] });
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    else if (action === "set_password") {
      const hash = await bcrypt.hash(password, 12);
      await db.query(
        "UPDATE ccms_users SET CM_Password = ? WHERE CM_Phone_Number = ?",
        [hash, mobile]
      );
      const res = NextResponse.json({ success: true });
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    else if (action === "login") {
      // 1. Find user
      const [existing] = await db.query<UserRow[]>(
        "SELECT * FROM ccms_users WHERE CM_Phone_Number = ?",
        [mobile]
      );

      if (!Array.isArray(existing) || existing.length === 0) {
        return NextResponse.json(
          { error: "Invalid login credentials." },
          { status: 400 }
        );
      }

      const user = existing[0];

      // 2. Check password
      const isMatch = await bcrypt.compare(password, user.CM_Password);
      if (!isMatch) {
        return NextResponse.json(
          { error: "Invalid login credentials." },
          { status: 400 }
        );
      }

      // 3. Get company details
      const [companyRows] = await db.query(
        `SELECT 
            c.CM_Company_ID,
            c.CM_Company_Code,
            c.CM_Company_Name,
            c.CM_Address,
            c.CM_Email AS company_email,
            c.CM_Company_Phone,
            c.CM_Created_At,
            c.CM_Company_Logo,
            c.CM_Company_Owner,
            c.CM_Company_Type,
            c.CM_Is_Status
         FROM ccms_companies c
         WHERE c.CM_Company_ID = ?`,
        [user.CM_Company_ID]
      );

      if (!Array.isArray(companyRows) || companyRows.length === 0) {
        return NextResponse.json(
          { error: "Company not found." },
          { status: 404 }
        );
      }

      const company = companyRows[0];

      // 4. Merge user + company
      const userWithCompany = {
        ...user,
        company,
      };

      // 5. Create JWT token
      const token = jwt.sign(
        { id: user.CM_User_ID, mobile: user.CM_Phone_Number },
        process.env.JWT_SECRET!,
        { expiresIn: "1d" }
      );

      // ✅ Create response and set cookie
      const res = NextResponse.json(
        { success: true, user: userWithCompany },
        { status: 200 }
      );

      res.cookies.set({
        name: "ccms_token",
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 24, // 1 day
      });

      return res;
    }

    else {
      const res = NextResponse.json({ error: "Invalid action" }, { status: 400 });
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }
  } catch (error: any) {
    console.error("Login route error:", error);
    const res = NextResponse.json(
      { error: "Failed to login route" },
      { status: 500 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}
