// 'src\app\api\engineer-projects\[projectId]\milestones\route.ts'
import { NextResponse } from "next/server";
import getDb from "@/app/utils/db";

export async function GET(
  req: Request,
  context: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await context.params;

  if (!projectId) {
    return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
  }

  try {
    const db = await getDb();
    const [rows] = await db.execute(
      `SELECT 
         CM_Milestone_ID,
         CM_Milestone_Name,
         CM_Description,
         CM_Planned_Start_Date,
         CM_Planned_End_Date,
         CM_Status,
         CM_Percentage_Weightage
       FROM ccms_milestone
       WHERE CM_Project_ID = ?
       ORDER BY CM_Planned_Start_Date ASC`,
      [projectId]
    );

    const milestones = Array.isArray(rows) ? rows : [];
    const res = NextResponse.json(milestones);
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error) {
    console.error("Error fetching milestones:", error);
    const res = NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}