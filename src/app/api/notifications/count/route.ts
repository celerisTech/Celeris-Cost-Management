import { NextRequest, NextResponse } from "next/server";
import getDb from "@/app/utils/db";

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Fetch user notifications with reply count
    const [notifications] = await db.query(
      `
      SELECT 
        n.CM_Notification_ID,
        n.CM_User_ID,
        n.CM_Sender_ID,
        n.CM_Message,
        n.CM_Is_Read,
        n.CM_Image,
        n.CM_Notification_Date,
        COALESCE(r.reply_count, 0) AS reply_count
      FROM ccms_notifications n
      LEFT JOIN (
        SELECT CM_Notification_ID, COUNT(*) AS reply_count
        FROM ccms_notification_replies
        GROUP BY CM_Notification_ID
      ) r ON n.CM_Notification_ID = r.CM_Notification_ID
      WHERE n.CM_User_ID = ?
      ORDER BY n.CM_Notification_Date DESC
      `,
      [userId]
    );

    // 🟢 Only count notifications that are unread
    const unreadCount = (notifications as any[]).filter(
      (n) => n.CM_Is_Read === 0 || n.CM_Is_Read === false
    ).length;

    const res = NextResponse.json({
      success: true,
      total_notifications: (notifications as any[]).length,
      unread_count: unreadCount,
      notifications,
    });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    const res = NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}
