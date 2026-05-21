// app/api/progress/route.js
import { NextResponse } from "next/server";
import getDb from "@/app/utils/db";

export async function GET() {
  try {
    const db = await getDb();

    // Get project list with task stats
    const [rows] = await db.query(`
      SELECT 
        p.CM_Project_ID AS projectId,
        p.CM_Project_Name AS name,
        p.CM_Planned_Start_Date AS startDate,
        p.CM_Planned_End_Date AS endDate,
        COUNT(DISTINCT t.CM_Task_ID) AS totalTasks,
        COUNT(DISTINCT CASE WHEN u.CM_Status = 'Completed' THEN t.CM_Task_ID END) AS completedTasks
      FROM ccms_projects p
      LEFT JOIN ccms_task_master t 
        ON p.CM_Project_ID = t.CM_Project_ID
      LEFT JOIN (
        SELECT tu.CM_Task_ID, tu.CM_Status
        FROM ccms_task_update tu
        INNER JOIN (
          SELECT CM_Task_ID, MAX(CM_Update_Date) AS latest_update
          FROM ccms_task_update
          GROUP BY CM_Task_ID
        ) latest
        ON tu.CM_Task_ID = latest.CM_Task_ID 
        AND tu.CM_Update_Date = latest.latest_update
      ) u ON t.CM_Task_ID = u.CM_Task_ID
      GROUP BY p.CM_Project_ID, p.CM_Project_Name, p.CM_Planned_Start_Date, p.CM_Planned_End_Date
      ORDER BY p.CM_Planned_End_Date ASC
    `);

    const res = NextResponse.json(rows);
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error) {
    console.error("Error fetching project progress:", error);
    const res = NextResponse.json(
      { error: "Failed to fetch project progress" },
      { status: 500 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}