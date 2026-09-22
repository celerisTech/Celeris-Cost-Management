import { NextRequest, NextResponse } from "next/server";
import getDb from "@/app/utils/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ success: false, error: "userId required" }, { status: 400 });
    }

    const db = await getDb();
    const [rows]: any = await db.query(
      `SELECT CM_Current_Project_ID FROM ccms_users WHERE CM_User_ID = ?`,
      [userId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      projectId: rows[0].CM_Current_Project_ID || null,
    });
  } catch (error) {
    console.error("Error fetching current project:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, projectId } = body;
    if (!userId) {
      return NextResponse.json({ success: false, error: "userId required" }, { status: 400 });
    }

    const db = await getDb();
    await db.query(
      `UPDATE ccms_users SET CM_Current_Project_ID = ? WHERE CM_User_ID = ?`,
      [projectId || null, userId]
    );

    return NextResponse.json({ success: true, projectId });
  } catch (error) {
    console.error("Error updating current project:", error);
    return NextResponse.json({ success: false, error: "Failed to update" }, { status: 500 });
  }
}
