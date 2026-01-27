import { NextRequest, NextResponse } from "next/server";
import getDb from "@/app/utils/db";

export async function GET(req: NextRequest) {
  try {
    const db = await getDb();
    const [rows] = await db.query("SELECT CM_Role_ID, CM_Role_Description FROM ccms_roles_master");
    const res = NextResponse.json({ success: true, roles: rows });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (err) {
    const res = NextResponse.json({ success: false, error: "Failed to fetch roles" }, { status: 500 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}
