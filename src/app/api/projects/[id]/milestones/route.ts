import getDb from "@/app/utils/db";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }  // params is now a Promise
) {
  try {
    const { id } = await context.params;  // Await the params

    const pool = await getDb();
    const [rows] = await pool.query(
      `SELECT 
        CM_Milestone_ID,
        CM_Milestone_Name,
        CM_Description,
        CM_Status
       FROM ccms_milestone 
       WHERE CM_Project_ID = ? 
       ORDER BY CM_Created_At DESC`,
      [id]
    );

    return NextResponse.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching milestones:", error);
    return NextResponse.json(
      { success: false, message: "Error fetching milestones" },
      { status: 500 },
    );
  }
}