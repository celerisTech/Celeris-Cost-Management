import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

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
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const db = await getDB();

    await db.execute(
      "UPDATE ccms_users SET CM_is_active = 0, CM_updated_at = NOW() WHERE CM_user_id = ?",
      [userId]
    );

    const res = NextResponse.json({ message: "Account deactivated successfully" });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (err) {
    console.error(err);
    const res = NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}








