import { NextResponse } from "next/server";
import getDb from "@/app/utils/db"; 

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      CM_Project_ID,
      CM_Company_ID,
      CM_User_ID,
      CM_Labor_Type_ID,
      CM_Working_Date,
      CM_Hours_Worked,
      CM_Work_Description,
      CM_Created_By
    } = body;

    if (
      !CM_Project_ID ||
      !CM_Company_ID ||
      !CM_User_ID ||
      !CM_Labor_Type_ID ||
      !CM_Working_Date ||
      !CM_Hours_Worked
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const db = await getDb();

    const query = `
      INSERT INTO ccms_labor_logs (
        CM_Project_ID,
        CM_Company_ID,
        CM_User_ID,
        CM_Labor_Type_ID,
        CM_Working_Date,
        CM_Hours_Worked,
        CM_Work_Description,
        CM_Work_Status,
        CM_Created_By,
        CM_Created_At
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', ?, NOW())
    `;

    const [result]: any = await db.query(query, [
      CM_Project_ID,
      CM_Company_ID,
      CM_User_ID,
      CM_Labor_Type_ID,
      CM_Working_Date,
      CM_Hours_Worked,
      CM_Work_Description || "",
      CM_Created_By || "",
    ]);

    const res = NextResponse.json({
      success: true,
      message: "Work assigned successfully",
      laborLogId: result.insertId, // auto increment ID
    });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error: any) {
    console.error("Error assigning work:", error);
    const res = NextResponse.json(
      { error: "Failed to assign work" },
      { status: 500 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}
