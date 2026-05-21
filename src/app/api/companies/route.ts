import { NextResponse } from "next/server";
import getDb from "../../utils/db";

export async function GET() {
  try {
    const db = await getDb();

    // Fetch company names (and maybe IDs if you need them)
    const [rows] = await db.query(
      "SELECT CM_Company_ID, CM_Company_Name FROM ccms_companies WHERE CM_Is_Status = 'Active'"
    );

    const res = NextResponse.json(rows);
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error) {
    console.error("Error fetching companies:", error);
    const res = NextResponse.json({ error: "Failed to fetch companies" }, { status: 500 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}
