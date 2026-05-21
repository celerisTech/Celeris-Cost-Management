import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";

// ✅ Create DB connection
async function getDB() {
  return await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });
}

export async function POST(req: Request) {
  try {
    const { oldPassword, newPassword, userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const db = await getDB();

    // ✅ Get existing password hash
    const [rows]: any = await db.execute(
      "SELECT CM_Password FROM ccms_users WHERE CM_User_ID = ?",
      [userId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const storedHash = rows[0].CM_Password;

    // ✅ Compare old password
    const valid = await bcrypt.compare(oldPassword, storedHash);
    if (!valid) {
      return NextResponse.json({ error: "Old password is incorrect" }, { status: 400 });
    }

    // ✅ Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.execute(
      "UPDATE ccms_users SET CM_Password = ?, CM_Uploaded_At = NOW() WHERE CM_User_ID = ?",
      [hashedPassword, userId]
    );

    const res = NextResponse.json({ message: "Password updated successfully" });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (err) {
    console.error(err);
    const res = NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}
