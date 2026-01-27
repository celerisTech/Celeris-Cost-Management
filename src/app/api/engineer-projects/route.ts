import { NextResponse } from "next/server";
import getDb from "@/app/utils/db";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const engineerId = searchParams.get("engineerId");

    if (!engineerId) {
      return NextResponse.json({ error: "Engineer ID is required" }, { status: 400 });
    }

    const db = await getDb();
    const [rows] = await db.execute(
      `SELECT 
        p.CM_Project_ID,
        p.CM_Project_Code,
        p.CM_Project_Name,
        p.CM_Project_Type,
        p.CM_Project_Location,
        p.CM_Project_Leader_ID,
        u.CM_Full_Name AS Project_Leader_Name,
        p.CM_Status,
        p.CM_Planned_Start_Date,
        p.CM_Planned_End_Date,
        c.CM_Customer_Name,
        
        m.CM_Milestone_ID,
        m.CM_Milestone_Name,
        m.CM_Description AS milestone_description,
        m.CM_Status AS milestone_status,
        m.CM_Planned_Start_Date AS milestone_start_date,
        m.CM_Planned_End_Date AS milestone_end_date,
        m.CM_Percentage_Weightage AS milestone_weightage,
        
        t.CM_Task_ID,
        t.CM_Task_Name,
        t.CM_Engineer_ID,
        t.CM_Assign_Date,
        t.CM_Due_Date,
        t.CM_Is_Active AS task_active_status,
        
        /* Get the most recent status update */
        (SELECT tu.CM_Status 
         FROM ccms_task_update tu 
         WHERE tu.CM_Task_ID = t.CM_Task_ID 
         ORDER BY tu.CM_Update_Date DESC, tu.CM_Uploaded_At DESC 
         LIMIT 1) AS task_status
         
      FROM ccms_projects p
      JOIN ccms_customer c 
        ON p.CM_Customer_ID = c.CM_Customer_ID
      LEFT JOIN ccms_milestone m
        ON p.CM_Project_ID = m.CM_Project_ID
      LEFT JOIN ccms_task_master t 
        ON m.CM_Milestone_ID = t.CM_Milestone_ID
      LEFT JOIN ccms_users u
        ON p.CM_Project_Leader_ID = u.CM_User_ID
      WHERE t.CM_Engineer_ID = ? OR (t.CM_Engineer_ID IS NULL AND EXISTS (
        SELECT 1 FROM ccms_task_master t2 
        WHERE t2.CM_Project_ID = p.CM_Project_ID AND t2.CM_Engineer_ID = ?
      ))
      ORDER BY p.CM_Created_At DESC, m.CM_Milestone_ID, t.CM_Task_ID`,
      [engineerId, engineerId]
    );

    const res=  NextResponse.json(rows);
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error) {
    console.error("Error fetching projects:", error);
    const res = NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}
