// src/app/api/task-updates/route.ts
import { NextResponse, NextRequest } from "next/server";
import getDb from "@/app/utils/db";

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const url = new URL(request.url);
    const taskId = url.searchParams.get('taskId');
    const projectId = url.searchParams.get('projectId');

    if (!taskId && !projectId) {
      const res = NextResponse.json({ error: 'Either taskId or projectId is required' }, { status: 400 });
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    let query = `
      SELECT 
        tu.CM_Update_ID,
        tu.CM_Task_ID,
        t.CM_Task_Name,
        t.CM_Is_Active,
        tu.CM_Project_ID,
        tu.CM_Engineer_ID,
        u.CM_Full_Name AS Engineer_Name,
        tu.CM_Update_Date,
        tu.CM_Status,
        tu.CM_Remarks,
        tu.CM_Work_Hours,
        tu.CM_Image_URL,
        tu.CM_Uploaded_At,
        tu.CM_Uploaded_By,
        up.CM_Full_Name AS Uploaded_By_Name
      FROM 
        ccms_task_update tu
      LEFT JOIN 
        ccms_users u ON tu.CM_Engineer_ID = u.CM_User_ID
      LEFT JOIN 
        ccms_users up ON tu.CM_Uploaded_By = up.CM_User_ID
      LEFT JOIN
        ccms_task_master t ON tu.CM_Task_ID = t.CM_Task_ID
      WHERE 
    `;

    let params = [];

    if (taskId) {
      query += `tu.CM_Task_ID = ?`;
      params.push(taskId);
    } else {
      query += `tu.CM_Project_ID = ?`;
      params.push(projectId);
    }

    query += ` ORDER BY tu.CM_Update_Date DESC`;

    const [updates] = await db.query(query, params);
    const res = NextResponse.json(updates);
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error: any) {
    console.error('Error fetching task updates:', error);
    const res = NextResponse.json(
      { error: 'Failed to fetch task updates', details: error.message },
      { status: 500 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}

export async function POST(request: Request) {
  try {
    const db = await getDb();
    const body = await request.json();

    const requiredFields = [
      "CM_Task_ID",
      "CM_Project_ID",
      "CM_Engineer_ID",
      "CM_Status",
      "CM_Uploaded_By"
    ];

    const missing = requiredFields.filter(f => !body[f]);
    if (missing.length) {
      const res = NextResponse.json({ error: "Missing required fields", missing }, { status: 400 });
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    // Insert with NULL ID → trigger will auto-generate CM_Update_ID
    await db.query(
      `INSERT INTO ccms_task_update (
        CM_Update_ID, CM_Task_ID, CM_Project_ID, CM_Engineer_ID,
        CM_Update_Date, CM_Status, CM_Remarks, CM_Work_Hours, 
        CM_Image_URL, CM_Uploaded_By, CM_Uploaded_At
      ) VALUES (NULL, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, NOW())`,
      [
        body.CM_Task_ID,
        body.CM_Project_ID,
        body.CM_Engineer_ID,
        body.CM_Status,
        body.CM_Remarks || null,
        body.CM_Work_Hours || null,
        body.CM_Image_URL || null,
        body.CM_Uploaded_By
      ]
    );

    const res = NextResponse.json({ success: true, message: "Task update added successfully" }, { status: 201 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error: any) {
    console.error("Error adding task update:", error);
    const res = NextResponse.json({ error: "Failed to add task update", details: error.message }, { status: 500 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}
