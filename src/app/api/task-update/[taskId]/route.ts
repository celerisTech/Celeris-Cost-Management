// src/app/api/task-update/[taskId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import getDb from "@/app/utils/db";
import { writeFile } from "fs/promises";
import path from "path";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await context.params;

  if (!taskId) {
    const res = NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }

  try {
    const formData = await req.formData();
    const projectId = formData.get("projectId") as string;
    const engineerId = formData.get("engineerId") as string;
    const status = formData.get("status") as string;
    const remarks = formData.get("remarks") as string;
    const workHours = parseFloat(formData.get("workHours") as string) || 0;
    const updateDate = formData.get("updateDate") as string;
    const uploadedBy = formData.get("uploadedBy") as string;

    if (!projectId || !engineerId || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    let imagePath: string | null = null;
    const imageInput = formData.get("image");

    if (imageInput) {
      if (typeof imageInput === 'string' && imageInput.startsWith('data:image')) {
        imagePath = imageInput;
      } else if (imageInput instanceof File) {
        const bytes = Buffer.from(await imageInput.arrayBuffer());
        const filename = `${Date.now()}-${imageInput.name}`;
        const publicDir = path.join(process.cwd(), "public", "uploads");

        await writeFile(path.join(publicDir, filename), bytes);
        imagePath = `/uploads/${filename}`;
      } else if (typeof imageInput === 'string') {
        imagePath = imageInput; // In case it's already a URL
      }
    }

    const db = await getDb();
    const connection = await db.getConnection();

    try {
      // Begin transaction
      await connection.beginTransaction();

      // 1. Insert task update
      await connection.execute(
        `INSERT INTO ccms_task_update 
          (CM_Task_ID, CM_Project_ID, CM_Engineer_ID, CM_Update_Date, CM_Status, CM_Remarks, CM_Work_Hours, CM_Uploaded_By, CM_Image_URL, CM_Uploaded_At)
         VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [// Generate a unique ID for the update
          taskId,
          projectId,
          engineerId,
          updateDate || new Date().toISOString().split('T')[0],
          status,
          remarks, 
          workHours,
          uploadedBy,
          imagePath,
        ]
      );

      // 2. Get company ID and labor information for the engineer
      const [userRows] = await connection.execute(
        `SELECT u.CM_Company_ID, u.CM_Labor_Type_ID 
         FROM ccms_users u 
         WHERE u.CM_User_ID = ?`,
        [engineerId]
      );

      if (userRows && Array.isArray(userRows) && userRows.length > 0) {
        const userData = userRows[0] as { CM_Company_ID: string; CM_Labor_Type_ID: string };
        const companyId = userData.CM_Company_ID;
        const laborTypeId = userData.CM_Labor_Type_ID;

        // 3. Check if attendance record already exists for this date and engineer
        const [existingAttendanceRows] = await connection.execute(
          `SELECT CM_Attendance_ID 
           FROM ccms_attendance 
           WHERE CM_Labor_ID = ? 
           AND CM_Attendance_Date = ?`,
          [laborTypeId, updateDate]
        );

        // 4. If no attendance record exists, create one
        if (!existingAttendanceRows || (Array.isArray(existingAttendanceRows) && existingAttendanceRows.length === 0)) {
          // Determine attendance status based on work hours
          let attendanceStatus = 'Present';
          if (workHours <= 0) {
            attendanceStatus = 'Absent';
          } else if (workHours < 4) {
            attendanceStatus = 'Half-Day';
          }

          await connection.execute(
            `INSERT INTO ccms_attendance 
              ( CM_Company_ID, CM_Project_ID, CM_Labor_ID, CM_Attendance_Date, CM_Status, CM_Total_Working_Hours, CM_Remarks, CM_Created_At, CM_Created_By)
             VALUES ( ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
            [ 
              companyId,
              projectId,
              laborTypeId,
              updateDate,
              'Present',
              8, // Standard 8 hours for automated attendance
              `Automatically marked present via task update: ${remarks || 'No remarks'}`,
              uploadedBy || 'System'
            ]
          );
        }
        // If attendance already exists for this day, we do nothing. 
        // This prevents multiple attendance records (and thus multiple salary payments) 
        // if an engineer updates multiple tasks on the same day.
      }

      // Commit transaction
      await connection.commit();

      const res = NextResponse.json({
        message: "Task update saved successfully with attendance record"
      });
      res.headers.set('Cache-Control', 'no-store');
      return res;
    } catch (error) {
      // Rollback transaction in case of error
      await connection.rollback();
      throw error;
    } finally {
      // Release the connection back to the pool
      connection.release();
    }
  } catch (error: any) {
    console.error("❌ Error saving task update:", error);
    const res = NextResponse.json({ error: error.message }, { status: 500 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}
