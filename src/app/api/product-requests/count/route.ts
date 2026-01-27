import { NextRequest, NextResponse } from "next/server";
import getDb from "@/app/utils/db";

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();

    const [result] = await db.query(
      `SELECT COUNT(*) AS pending_count
       FROM ccms_product_allocation_requests
       WHERE CM_Status = 'Pending'`
    );

    const pendingCount = result[0]?.pending_count || 0;

    const res = NextResponse.json({
      success: true,
      pendingCount
    });

    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (error) {
    console.error("Error fetching pending products:", error);
    const res = NextResponse.json(
      { success: false, error: "Failed to fetch pending product count" },
      { status: 500 }
    );
    res.headers.set("Cache-Control", "no-store");
    return res;
  }
}
