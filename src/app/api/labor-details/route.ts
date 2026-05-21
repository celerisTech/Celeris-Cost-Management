// app/api/labor-details/route.ts
import { NextResponse } from 'next/server';
import getDb from '../../utils/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const laborId = searchParams.get('laborId');
  const month = searchParams.get('month');
  const year = searchParams.get('year');

  if (!laborId) {
    return NextResponse.json({ error: 'laborId is required' }, { status: 400 });
  }

  try {
    const db = await getDb();

    // --- 1. Get Labor Details ---
    const [laborDetails] = await db.query(
      `SELECT 
          *
       FROM ccms_labor 
       WHERE CM_Labor_Type_ID = ?`,
      [laborId]
    );

    if (!laborDetails || (laborDetails as any[]).length === 0) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // --- 2. Get Attendance Records ---
    const [attendanceLogs] = await db.query(
      `SELECT 
          att.CM_Attendance_ID,
          att.CM_Labor_ID,
          att.CM_Project_ID,
          p.CM_Project_Name AS project_name,
          DATE_FORMAT(att.CM_Attendance_Date, '%Y-%m-%d') AS CM_Working_Date,
          att.CM_Status,
          att.CM_Shift,
          att.CM_In_Time,
          att.CM_Out_Time,
          att.CM_Total_Working_Hours AS CM_Hours_Worked,
          att.CM_Remarks,
          att.CM_Created_By,
          u.CM_Full_Name AS created_by
        FROM ccms_attendance att
        JOIN ccms_projects p ON att.CM_Project_ID = p.CM_Project_ID
        LEFT JOIN ccms_users u ON att.CM_Created_By = u.CM_User_ID
        WHERE att.CM_Labor_ID = ?
          AND MONTH(att.CM_Attendance_Date) = ?
          AND YEAR(att.CM_Attendance_Date) = ?
        ORDER BY att.CM_Attendance_Date`,
      [laborId, month, year]
    );

    // --- 3. Return API Response ---
    const res = NextResponse.json({
      labor: (laborDetails as any[])[0] || null,
      logs: attendanceLogs || [],
    }, { status: 200 });
    res.headers.set('Cache-Control', 'no-store');
    return res;

  } catch (error) {
    console.error('Error fetching labor details:', error);
    const res = NextResponse.json({
      error: 'Failed to fetch labor details',
      details: (error as Error).message
    }, { status: 500 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}

// Add the PUT handler for updating labor details
export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const laborId = searchParams.get('laborId');

  if (!laborId) {
    return NextResponse.json({ error: 'laborId is required' }, { status: 400 });
  }

  try {
    const db = await getDb();
    const data = await req.json();

    // Validate required fields
    const requiredFields = ['CM_First_Name', 'CM_Last_Name', 'CM_Labor_Type', 'CM_Labor_Roll', 'CM_Wage_Type', 'CM_Wage_Amount'];
    const missingFields = requiredFields.filter(field => !data[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: 'Missing required fields', fields: missingFields },
        { status: 400 }
      );
    }

    // Format date if provided
    if (data.CM_Date_Of_Birth) {
      const date = new Date(data.CM_Date_Of_Birth);
      if (isNaN(date.getTime())) {
        return NextResponse.json(
          { error: "Invalid date format for Date of Birth" },
          { status: 400 }
        );
      }
      data.CM_Date_Of_Birth = date.toISOString().split('T')[0];
    }

    // Handle numeric fields
    if (data.CM_Wage_Amount) {
      data.CM_Wage_Amount = parseFloat(data.CM_Wage_Amount);
    }

    if (data.CM_Postal_Code) {
      data.CM_Postal_Code = parseInt(data.CM_Postal_Code, 10);
    }

    // Set updated timestamp and info
    data.CM_Uploaded_At = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // Build the update query dynamically with ALLOWED FIELDS ONLY
    const allowedFields = [
      'CM_First_Name', 'CM_Last_Name', 'CM_Labor_Type', 'CM_Labor_Roll',
      'CM_Wage_Type', 'CM_Wage_Amount', 'CM_Date_Of_Birth', 'CM_Postal_Code',
      'CM_Address', 'CM_District', 'CM_State', 'CM_Country',
      'CM_Phone_Number', 'CM_Email', 'CM_Alternate_Phone', 'CM_Is_Status'
    ];

    const fields = Object.keys(data).filter(key => allowedFields.includes(key));

    if (fields.length === 0) {
      return NextResponse.json({ error: "No valid fields provided for update" }, { status: 400 });
    }

    const placeholders = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => data[field]);

    // Add the ID for the WHERE clause
    values.push(laborId);

    const query = `
      UPDATE ccms_labor 
      SET ${placeholders} 
      WHERE CM_Labor_Type_ID = ?
    `;

    const [result] = await db.query(query, values);
    const updateResult = result as { affectedRows?: number };

    if (!updateResult.affectedRows) {
      return NextResponse.json(
        { error: 'Employee not found or no changes made' },
        { status: 404 }
      );
    }

    const res = NextResponse.json({
      success: true,
      message: 'Employee updated successfully'
    }, { status: 200 });
    res.headers.set('Cache-Control', 'no-store');
    return res;

  } catch (error) {
    console.error('Error updating labor details:', error);
    const res = NextResponse.json({
      error: 'Failed to update labor details',
      details: (error as Error).message
    }, { status: 500 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}
