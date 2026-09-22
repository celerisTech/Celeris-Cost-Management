import { NextRequest, NextResponse } from "next/server";
import getDb from "@/app/utils/db";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const userId = searchParams.get("userId");

    const db = await getDb();
    
    let query = `
      SELECT 
        w.WL_ID as id,
        w.WL_Project_ID as projectId,
        w.WL_User_ID as userId,
        DATE_FORMAT(w.WL_Date, '%Y-%m-%d') as date,
        w.WL_Hours as hours,
        w.WL_Description as description,
        w.WL_Created_At as createdAt,
        u.CM_Full_Name as userName,
        u.CM_Photo_URL as userPhoto,
        p.CM_Project_Name as projectName
      FROM ccms_project_work_logs w
      LEFT JOIN ccms_users u ON w.WL_User_ID = u.CM_User_ID
      LEFT JOIN ccms_projects p ON w.WL_Project_ID = p.CM_Project_ID
      WHERE 1=1
    `;
    const params = [];

    if (projectId) {
      query += ` AND w.WL_Project_ID = ?`;
      params.push(projectId);
    }
    
    if (userId) {
      query += ` AND w.WL_User_ID = ?`;
      params.push(userId);
    }
    
    if (searchParams.get("fromDate")) {
      query += ` AND DATE(w.WL_Date) >= ?`;
      params.push(searchParams.get("fromDate"));
    }
    
    if (searchParams.get("toDate")) {
      query += ` AND DATE(w.WL_Date) <= ?`;
      params.push(searchParams.get("toDate"));
    }

    query += ` ORDER BY w.WL_Date DESC, w.WL_Created_At DESC`;

    const [rows] = await db.query(query, params);

    return NextResponse.json({ success: true, logs: rows });
  } catch (error) {
    console.error("Error fetching work logs:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch work logs" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { projectId, userId, date, hours, description } = body;

    if (!projectId || !userId || !date || !description) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const db = await getDb();
    
    const [result] = await db.query(
      `INSERT INTO ccms_project_work_logs (WL_Project_ID, WL_User_ID, WL_Date, WL_Hours, WL_Description)
       VALUES (?, ?, ?, ?, ?)`,
      [projectId, userId, date, hours || 0, description]
    );

    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error("Error creating work log:", error);
    return NextResponse.json({ success: false, error: "Failed to create work log" }, { status: 500 });
  }
}
