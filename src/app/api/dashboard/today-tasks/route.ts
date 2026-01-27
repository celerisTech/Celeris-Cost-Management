// src/app/api/dashboard/today-tasks/route.ts
import { NextResponse, NextRequest } from "next/server";
import getDb from "@/app/utils/db";
import { RowDataPacket } from "mysql2";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
        const type = searchParams.get("type") || "tasks"; // 'tasks' or 'history'
        const db = await getDb();

        if (type === "history") {
            // Query to fetch all task updates for the selected date across all projects
            const historyQuery = `
                SELECT 
                  tu.CM_Update_ID,
                  tu.CM_Task_ID,
                  t.CM_Task_Name,
                  tu.CM_Project_ID,
                  p.CM_Project_Name,
                  tu.CM_Engineer_ID,
                  u.CM_Full_Name as Engineer_Name,
                  tu.CM_Update_Date,
                  tu.CM_Status,
                  tu.CM_Remarks,
                  tu.CM_Work_Hours,
                  tu.CM_Image_URL,
                  tu.CM_Uploaded_At
                FROM ccms_task_update tu
                INNER JOIN ccms_projects p ON tu.CM_Project_ID = p.CM_Project_ID
                INNER JOIN ccms_task_master t ON tu.CM_Task_ID = t.CM_Task_ID
                INNER JOIN ccms_users u ON tu.CM_Engineer_ID = u.CM_User_ID
                WHERE DATE(tu.CM_Update_Date) = ?
                ORDER BY tu.CM_Update_Date DESC
            `;
            const [historyRows] = await db.query<RowDataPacket[]>(historyQuery, [date]);

            const res = NextResponse.json({
                success: true,
                data: historyRows,
                date: date,
                type: "history"
            });
            res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            return res;
        }

        // Default: Query to fetch tasks active on the selected date 
        const query = `
        SELECT 
            t.CM_Task_ID,
            t.CM_Task_Name,
            t.CM_Project_ID,
            p.CM_Project_Name,
            t.CM_Milestone_ID,
            m.CM_Milestone_Name,
            t.CM_Assign_Date,
            t.CM_Due_Date,
            tu.CM_Engineer_ID,
            u.CM_Full_Name AS Engineer_Name,
            tu.CM_Status AS Latest_Status,
            tu.CM_Remarks AS Latest_Remarks,
            tu.CM_Update_Date AS Latest_Update_Date
        FROM ccms_task_master t
        INNER JOIN ccms_projects p 
            ON t.CM_Project_ID = p.CM_Project_ID
        LEFT JOIN ccms_milestone m 
            ON t.CM_Milestone_ID = m.CM_Milestone_ID
        LEFT JOIN (
            SELECT *
            FROM ccms_task_update
            WHERE CM_Update_ID IN (
            SELECT MAX(CM_Update_ID)
            FROM ccms_task_update
            WHERE DATE(CM_Update_Date) <= ?
            GROUP BY CM_Task_ID
            )
        ) tu 
            ON t.CM_Task_ID = tu.CM_Task_ID
        LEFT JOIN ccms_users u 
            ON tu.CM_Engineer_ID = u.CM_User_ID
        WHERE t.CM_Assign_Date <= ?
            AND t.CM_Due_Date >= ?
        ORDER BY p.CM_Project_Name ASC, t.CM_Task_Name ASC
        `;


        const [rows] = await db.query<RowDataPacket[]>(query, [date, date, date]);

        const res = NextResponse.json({
            success: true,
            data: rows,
            date: date,
            type: "tasks"
        });

        // Disable caching for real-time dashboard data
        res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.headers.set('Pragma', 'no-cache');
        res.headers.set('Expires', '0');

        return res;
    } catch (error: any) {
        console.error("Error fetching today's tasks:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch tasks", details: error.message },
            { status: 500 }
        );
    }
}
