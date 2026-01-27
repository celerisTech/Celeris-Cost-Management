// src/app/api/task-update/[taskId]/edit/route.ts
import { NextRequest, NextResponse } from "next/server";
import getDb from "@/app/utils/db";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

export async function PUT(
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
    const updateId = formData.get("updateId") as string;
    const projectId = formData.get("projectId") as string;
    const engineerId = formData.get("engineerId") as string;
    const status = formData.get("status") as string;
    const remarks = formData.get("remarks") as string;
    const workHours = parseFloat(formData.get("workHours") as string) || 0;
    const updateDate = formData.get("updateDate") as string;
    const uploadedBy = formData.get("uploadedBy") as string;
    const currentImageUrl = formData.get("currentImageUrl") as string;

    if (!updateId || !projectId || !engineerId || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    let imagePath: string | null = null;
    const file = formData.get("image") as File | null;

    if (file) {
      // Delete old image if it exists
      if (currentImageUrl) {
        try {
          const oldImagePath = path.join(process.cwd(), "public", currentImageUrl.replace(/^\//, ''));
          if (existsSync(oldImagePath)) {
            await unlink(oldImagePath);
          }
        } catch (error) {
          console.error("Error removing old image:", error);
          // Continue with the update even if old image deletion fails
        }
      }

      // Save the new image
      const bytes = Buffer.from(await file.arrayBuffer());
      const filename = `${Date.now()}-${file.name}`;
      const publicDir = path.join(process.cwd(), "public", "uploads");

      await writeFile(path.join(publicDir, filename), bytes);
      imagePath = `/uploads/${filename}`;
    } else {
      // Keep the current image if no new one is provided
      imagePath = currentImageUrl || null;
    }

    const db = await getDb();
    const connection = await db.getConnection();

    try {
      // Begin transaction
      await connection.beginTransaction();

      // First, get the original update date from the update record
      const [originalUpdateRows] = await connection.execute(
        `SELECT CM_Update_Date FROM ccms_task_update WHERE CM_Update_ID = ?`,
        [updateId]
      );

      let originalUpdateDate = null;
      if (originalUpdateRows && Array.isArray(originalUpdateRows) && originalUpdateRows.length > 0) {
        originalUpdateDate = (originalUpdateRows[0] as { CM_Update_Date: string }).CM_Update_Date;
      }

      // 1. Update the task update record
      await connection.execute(
        `UPDATE ccms_task_update 
         SET CM_Update_Date = ?,
             CM_Status = ?,
             CM_Remarks = ?,
             CM_Work_Hours = ?,
             CM_Uploaded_By = ?,
             CM_Image_URL = ?,
             CM_Uploaded_At = NOW()
         WHERE CM_Update_ID = ?`,
        [
          updateDate || new Date().toISOString().split('T')[0],
          status,
          remarks,
          workHours,
          uploadedBy,
          imagePath,
          updateId
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

        // Determine attendance status based on work hours
        let attendanceStatus = 'Present';
        if (workHours <= 0) {
          attendanceStatus = 'Absent';
        } else if (workHours < 4) {
          attendanceStatus = 'Half-Day';
        }

        // If the date has changed, delete the old attendance record
        if (originalUpdateDate && originalUpdateDate !== updateDate) {
          // Delete attendance record for the original date
          await connection.execute(
            `DELETE FROM ccms_attendance 
             WHERE CM_Labor_ID = ? 
             AND CM_Attendance_Date = ? 
             AND CM_Project_ID = ?`,
            [laborTypeId, originalUpdateDate, projectId]
          );

          // Now we'll create a new record for the new date below
        }

        // Check if attendance record exists for the NEW date
        const [newAttendanceRows] = await connection.execute(
          `SELECT CM_Attendance_ID 
           FROM ccms_attendance 
           WHERE CM_Labor_ID = ? 
           AND CM_Attendance_Date = ? 
           AND CM_Project_ID = ?`,
          [laborTypeId, updateDate, projectId]
        );

        // If no attendance record exists for the new date, create one
        if (!newAttendanceRows || (Array.isArray(newAttendanceRows) && newAttendanceRows.length === 0)) {
          await connection.execute(
            `INSERT INTO ccms_attendance 
              (CM_Company_ID, CM_Project_ID, CM_Labor_ID, CM_Attendance_Date, CM_Status, CM_Total_Working_Hours, CM_Remarks, CM_Created_At, CM_Created_By)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
            [
              companyId,
              projectId,
              laborTypeId,
              updateDate,
              attendanceStatus,
              workHours,
              originalUpdateDate !== updateDate
                ? `Date changed from ${originalUpdateDate} to ${updateDate}. Remarks: ${remarks || 'No remarks'}`
                : `Task update remarks: ${remarks || 'No remarks'}`,
              uploadedBy || 'System'
            ]
          );
        }
        // If attendance record exists for the new date, update it
        else {
          const existingRecord = newAttendanceRows[0] as { CM_Attendance_ID: string };

          await connection.execute(
            `UPDATE ccms_attendance 
             SET CM_Status = ?, 
                 CM_Total_Working_Hours = ?,
                 CM_Remarks = ?,
                 CM_Uploaded_At = NOW(),
                 CM_Uploaded_By = ?
             WHERE CM_Attendance_ID = ?`,
            [
              attendanceStatus,
              workHours,
              originalUpdateDate !== updateDate
                ? `Date changed from ${originalUpdateDate}. Remarks: ${remarks || 'No remarks'}`
                : `Updated remarks: ${remarks || 'No remarks'}`,
              uploadedBy || 'System',
              existingRecord.CM_Attendance_ID
            ]
          );
        }
      }

      // Commit transaction
      await connection.commit();

      const res = NextResponse.json({
        message: "Task update edited successfully with attendance records updated"
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
    console.error("❌ Error editing task update:", error);
    const res = NextResponse.json({ error: error.message }, { status: 500 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ taskId: string }> }
) {
  // Since this route only has PUT logic, we can default POST to PUT
  // or checks for _method=PUT explicitly if we want to be strict.
  // Given the goal is to bypass 403 on PUT, mapping POST to PUT is sufficient.
  return PUT(req, context);
}
