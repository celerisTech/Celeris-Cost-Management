import { NextRequest, NextResponse } from "next/server";
import getDb from "@/app/utils/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  let connection;
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const targetId = searchParams.get("targetId");

    if (!userId || !targetId) {
      return NextResponse.json(
        { success: false, error: "userId and targetId required" },
        { status: 400 }
      );
    }

    connection = await getDb();

    // Mark unread messages from targetId to userId as read
    await connection.execute(
      `UPDATE ccms_employee_chats 
       SET CM_Is_Read = 1 
       WHERE CM_Sender_ID = ? AND CM_Receiver_ID = ? AND CM_Is_Read = 0`,
      [targetId, userId]
    );

    // Fetch conversation thread
    let messagesQuery = "";
    let queryParams = [];

    if (targetId === "GROUP_ALL") {
      messagesQuery = `
        SELECT 
          c.CM_Chat_ID,
          c.CM_Sender_ID,
          c.CM_Receiver_ID,
          c.CM_Message,
          c.CM_Project_ID,
          c.CM_Image_URL,
          c.CM_Is_Read,
          c.CM_Created_At,
          p.CM_Project_Name,
          u.CM_Full_Name AS Sender_Name
        FROM ccms_employee_chats c
        LEFT JOIN ccms_projects p ON c.CM_Project_ID COLLATE utf8mb4_general_ci = p.CM_Project_ID COLLATE utf8mb4_general_ci
        LEFT JOIN ccms_users u ON c.CM_Sender_ID COLLATE utf8mb4_general_ci = u.CM_User_ID COLLATE utf8mb4_general_ci
        WHERE c.CM_Receiver_ID = ?
        ORDER BY c.CM_Created_At ASC
      `;
      queryParams = [targetId];
    } else {
      messagesQuery = `
        SELECT 
          c.CM_Chat_ID,
          c.CM_Sender_ID,
          c.CM_Receiver_ID,
          c.CM_Message,
          c.CM_Project_ID,
          c.CM_Image_URL,
          c.CM_Is_Read,
          c.CM_Created_At,
          p.CM_Project_Name,
          u.CM_Full_Name AS Sender_Name
        FROM ccms_employee_chats c
        LEFT JOIN ccms_projects p ON c.CM_Project_ID COLLATE utf8mb4_general_ci = p.CM_Project_ID COLLATE utf8mb4_general_ci
        LEFT JOIN ccms_users u ON c.CM_Sender_ID COLLATE utf8mb4_general_ci = u.CM_User_ID COLLATE utf8mb4_general_ci
        WHERE (c.CM_Sender_ID = ? AND c.CM_Receiver_ID = ?)
           OR (c.CM_Sender_ID = ? AND c.CM_Receiver_ID = ?)
        ORDER BY c.CM_Created_At ASC
      `;
      queryParams = [userId, targetId, targetId, userId];
    }

    const [messages] = await connection.execute(messagesQuery, queryParams);

    const res = NextResponse.json({
      success: true,
      messages: messages as any[],
    });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (error: any) {
    console.error("Error fetching chat thread:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
