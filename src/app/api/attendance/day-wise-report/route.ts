import { NextRequest, NextResponse } from 'next/server';
import getDb from '../../../utils/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const date = searchParams.get('date');

        if (!date) {
            return NextResponse.json(
                { success: false, error: 'Date is required' },
                { status: 400 }
            );
        }

        const db = await getDb();

        // 1. Fetch all active labors with specific columns
        const [labors] = await db.query<RowDataPacket[]>(
            `SELECT 
        CM_Labor_Type_ID, 
        CM_Labor_Code,
        CM_First_Name, 
        CM_Last_Name,
        CM_Labor_Type,
        CM_Labor_Roll,
        CM_Phone_Number,
        CM_Company_ID
       FROM ccms_labor 
       WHERE CM_Status = 'Active'`
        );

        // 2. Fetch attendance for the specific date
        const [attendance] = await db.query<RowDataPacket[]>(
            `SELECT 
        CM_Labor_ID, 
        CM_Project_ID,
        CM_Status, 
        CM_In_Time, 
        CM_Out_Time, 
        CM_Total_Working_Hours, 
        CM_Remarks 
       FROM ccms_attendance 
       WHERE CM_Attendance_Date = ?`,
            [date]
        );

        // 3. Map attendance to labors (CM_Labor_Type_ID = CM_Labor_ID)
        const attendanceMap = new Map();
        attendance.forEach((record: any) => {
            attendanceMap.set(record.CM_Labor_ID, record);
        });

        const report = labors.map((labor: any) => {
            const attRecord = attendanceMap.get(labor.CM_Labor_Type_ID);

            return {
                laborTypeId: labor.CM_Labor_Type_ID,
                laborCode: labor.CM_Labor_Code,
                firstName: labor.CM_First_Name,
                lastName: labor.CM_Last_Name,
                fullName: `${labor.CM_First_Name} ${labor.CM_Last_Name}`.trim(),
                type: labor.CM_Labor_Type,
                role: labor.CM_Labor_Roll,
                phone: labor.CM_Phone_Number,
                companyId: labor.CM_Company_ID,
                projectId: attRecord ? attRecord.CM_Project_ID : null,
                status: attRecord ? attRecord.CM_Status : 'Absent', // Default to Absent if no record
                inTime: attRecord ? attRecord.CM_In_Time : null,
                outTime: attRecord ? attRecord.CM_Out_Time : null,
                totalHours: attRecord ? attRecord.CM_Total_Working_Hours : null,
                remarks: attRecord ? attRecord.CM_Remarks : null,
            };
        });

        // 4. Calculate Summary
        const summary = {
            total: labors.length,
            present: report.filter(r => r.status === 'Present').length,
            absent: report.filter(r => r.status === 'Absent').length,
            leave: report.filter(r => r.status === 'Leave').length,
            halfDay: report.filter(r => r.status === 'Half-Day').length,
            onDuty: report.filter(r => r.status === 'On-Duty').length,
            holiday: report.filter(r => r.status === 'Holiday').length,
            weekOff: report.filter(r => r.status === 'Week-Off').length,
        };

        return NextResponse.json({
            success: true,
            data: {
                date,
                summary,
                details: report
            }
        });

    } catch (error: any) {
        console.error('Error fetching day-wise report:', error);
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            laborTypeId,
            date,
            status,
            inTime,
            outTime,
            totalHours,
            remarks,
            companyId,
            projectId,
            updatedBy
        } = body;

        if (!laborTypeId || !date || !status) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const db = await getDb();

        // Check if record exists
        const [existing] = await db.query<RowDataPacket[]>(
            'SELECT CM_Attendance_ID FROM ccms_attendance WHERE CM_Labor_ID = ? AND CM_Attendance_Date = ?',
            [laborTypeId, date]
        );

        if (existing.length > 0) {
            // Update
            await db.query<ResultSetHeader>(
                `UPDATE ccms_attendance SET 
                    CM_Status = ?, 
                    CM_In_Time = ?, 
                    CM_Out_Time = ?, 
                    CM_Total_Working_Hours = ?, 
                    CM_Remarks = ?,
                    CM_Uploaded_At = NOW(),
                    CM_Uploaded_By = ?
                WHERE CM_Labor_ID = ? AND CM_Attendance_Date = ?`,
                [status, inTime, outTime, totalHours, remarks, updatedBy, laborTypeId, date]
            );
        } else {
            // Insert
            await db.query<ResultSetHeader>(
                `INSERT INTO ccms_attendance 
                (CM_Labor_ID, CM_Attendance_Date, CM_Company_ID, CM_Project_ID, CM_Status, CM_In_Time, CM_Out_Time, CM_Total_Working_Hours, CM_Remarks, CM_Created_At, CM_Created_By)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
                [laborTypeId, date, companyId, projectId, status, inTime, outTime, totalHours, remarks, updatedBy]
            );
        }

        return NextResponse.json({ success: true, message: 'Attendance updated successfully' });

    } catch (error: any) {
        console.error('Error updating attendance:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
