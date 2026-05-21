// 'src\app\api\engineer-projects\[projectId]\task\route.ts'
import { NextResponse } from "next/server";
import getDb from "@/app/utils/db";

export async function GET(
  req: Request,
  context: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await context.params;

  const url = new URL(req.url);
  const engineerId = url.searchParams.get("engineerId");

  if (!projectId) {
    return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
  }
  if (!engineerId) {
    return NextResponse.json({ error: "Engineer ID is required" }, { status: 400 });
  }

  try {
    const db = await getDb();
    const [rows] = await db.execute(
      `SELECT 
         t.CM_Task_ID,
         t.CM_Task_Name,
         t.CM_Project_ID,
         t.CM_Engineer_ID,
         t.CM_Assign_Date,
         t.CM_Due_Date,
         t.CM_Is_Active,
         t.CM_Image_URL,
         t.CM_Created_By,
         t.CM_Created_At,
         t.CM_Uploaded_By,
         t.CM_Milestone_ID,
         m.CM_Milestone_Name
       FROM ccms_task_master t
       LEFT JOIN ccms_milestone m ON t.CM_Milestone_ID = m.CM_Milestone_ID
       WHERE t.CM_Project_ID = ? AND t.CM_Engineer_ID = ?
       ORDER BY t.CM_Assign_Date ASC`,
      [projectId, engineerId]
    );

    const tasks = Array.isArray(rows) ? rows : [];
    const res = NextResponse.json(tasks);
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error) {
    console.error("Error fetching tasks:", error);
    const res = NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}