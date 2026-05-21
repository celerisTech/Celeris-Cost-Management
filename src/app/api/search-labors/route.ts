import { NextRequest, NextResponse } from "next/server";
import getDb from "../../utils/db";
import { RowDataPacket } from "mysql2";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const term = searchParams.get("term");

    if (!term || term.length < 2) {
      return NextResponse.json({ results: [] }, { status: 200 });
    }

    const db = await getDb();

    const [labors] = await db.query<RowDataPacket[]>(
      `SELECT 
        CM_Labor_Type_ID, 
        CM_Labor_Code, 
        CM_First_Name, 
        CM_Last_Name, 
        CM_Fathers_Name, 
        CM_Date_Of_Birth, 
        CM_Sex, 
        CM_Marriage_Status,
        CM_Previous_Experience, 
        CM_Labor_Roll,
        CM_Higher_Education,
        CM_Email, 
        CM_Phone_Number, 
        CM_Alternate_Phone, 
        CM_Address, 
        CM_City, 
        CM_District, 
        CM_State, 
        CM_Country, 
        CM_Postal_Code, 
        CM_Aadhar_Number, 
        CM_PAN_Number, 
        CM_Labor_Type,
        CM_Wage_Type,
        CM_Wage_Amount,
        CM_Company_ID
      FROM ccms_labor
      WHERE 
        CM_Labor_Code LIKE ? OR 
        CM_First_Name LIKE ? OR 
        CM_Last_Name LIKE ? OR 
        CM_Phone_Number LIKE ? 
      LIMIT 10`,
      [`%${term}%`, `%${term}%`, `%${term}%`, `%${term}%`]
    );

    const results = labors.map(labor => {
      let dob = labor.CM_Date_Of_Birth;

      if (dob) {
        const date = new Date(dob);
        date.setDate(date.getDate() + 1); // ✅ add one day
        dob = date.toISOString().split("T")[0]; // format: "YYYY-MM-DD"
      } else {
        dob = null;
      }

      return {
        ...labor,
        CM_Date_Of_Birth: dob,
      };
    });


    const res = NextResponse.json({
      results: results,
      count: labors.length
    });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error) {
    console.error("Error searching labors:", error);
    const res = NextResponse.json(
      { error: "Failed to search labors" },
      { status: 500 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}
