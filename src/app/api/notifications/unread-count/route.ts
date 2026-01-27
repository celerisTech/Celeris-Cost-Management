import { NextRequest, NextResponse } from "next/server";
import getDb from "@/app/utils/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      const res = NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    const db = await getDb();

    // Count unread notifications for this user
    const [rows] = await db.query(
      "SELECT COUNT(*) as count FROM ccms_notifications WHERE CM_Users_ID = ? AND CM_Is_Read = 0",
      [userId]
    );

    const res = NextResponse.json({
      success: true,
      count: rows[0]?.count || 0
    });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (err) {
    console.error("GET /api/notifications/unread-count error:", err);
    const res = NextResponse.json(
      { success: false, error: "Failed to fetch unread count" },
      { status: 500 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}
