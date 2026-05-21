import { NextRequest, NextResponse } from "next/server";
import getDb from "../../utils/db";

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const [rows] = await db.query(
      "SELECT CM_Company_ID, CM_Company_Name FROM ccms_companies WHERE CM_Is_Status = 'Active'"
    );
    const res = NextResponse.json({ success: true, companies: rows });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error) {
    console.error(error);
    const res = NextResponse.json(
      { success: false, message: "Failed to fetch companies" },
      { status: 500 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}