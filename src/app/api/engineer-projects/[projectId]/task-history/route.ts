// src\app\api\engineer-projects\[projectId]\task-history\route.ts
import { NextResponse } from "next/server";
import getDb from "@/app/utils/db";

export async function GET(
  req: Request,
  context: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await context.params;

  // Get engineerId from query parameters
  const url = new URL(req.url);
  const engineerId = url.searchParams.get('engineerId');

  console.log("📌 Task history API called for:", projectId, "engineer:", engineerId);

  if (!projectId) {
    return NextResponse.json(
      { error: "Project ID is required" },
      { status: 400 }
    );
  }

  if (!engineerId) {
    return NextResponse.json(
      { error: "Engineer ID is required" },
      { status: 400 }
    );
  }

  try {
    const db = await getDb();

    // Fetch task updates only for tasks assigned to this engineer
    const [rows] = await db.query(
      `SELECT tu.*, t.CM_Task_Name
       FROM ccms_task_update tu
       JOIN ccms_task_master t ON t.CM_Task_ID = tu.CM_Task_ID
       WHERE tu.CM_Project_ID = ? AND t.CM_Engineer_ID = ?
       ORDER BY tu.CM_Update_Date DESC`,
      [projectId, engineerId]
    );

    const res = NextResponse.json(Array.isArray(rows) ? rows : []);
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (err) {
    console.error("❌ Error fetching task history:", err);
    const res = NextResponse.json(
      { error: "Failed to fetch task history" }, 
      { status: 500 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}