import { NextRequest, NextResponse } from 'next/server';
import getDb from '../../../utils/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const date = searchParams.get('date');
        let reportType = searchParams.get('reportType') || 'day'; // day, week, month
        if (reportType === 'undefined') reportType = 'day';

        if (!date) {
            return NextResponse.json(
                { success: false, error: 'Date is required' },
                { status: 400 }
            );
        }

        const db = await getDb();

        // Calculate date range based on report type
        let startDate: string;
        let endDate: string;
        let dateLabel: string;

        const formatToYYYYMMDD = (d: Date) => {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        };

        if (reportType === 'week') {
            // Calculate week range (Saturday to Friday)
            const selectedDate = new Date(date);
            const dayOfWeek = selectedDate.getDay(); // 0 (Sun) to 6 (Sat)
            const diffToSaturday = dayOfWeek === 6 ? 0 : -(dayOfWeek + 1);

            const weekStart = new Date(selectedDate);
            weekStart.setDate(selectedDate.getDate() + diffToSaturday);

            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);

            startDate = formatToYYYYMMDD(weekStart);
            endDate = formatToYYYYMMDD(weekEnd);
            dateLabel = `${startDate} to ${endDate}`;
        } else if (reportType === 'month') {
            // Calculate month range
            const selectedDate = new Date(date);
            const year = selectedDate.getFullYear();
            const month = selectedDate.getMonth();

            const monthStart = new Date(year, month, 1);
            const monthEnd = new Date(year, month + 1, 0);

            startDate = formatToYYYYMMDD(monthStart);
            endDate = formatToYYYYMMDD(monthEnd);

            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            dateLabel = `${monthNames[month]} ${year}`;
        } else {
            // Day view
            startDate = date;
            endDate = date;
            dateLabel = date;
        }

        let labors: RowDataPacket[];
        try {
            const [rows] = await db.query<RowDataPacket[]>(
                `SELECT 
                    l.CM_Labor_Type_ID, 
                    l.CM_Labor_Code,
                    l.CM_First_Name, 
                    l.CM_Last_Name,
                    l.CM_Labor_Type,
                    l.CM_Labor_Roll,
                    l.CM_Phone_Number,
                    l.CM_Company_ID
                FROM ccms_labor l
                WHERE l.CM_Status = 'Active'`
            );
            labors = rows;
        } catch (err: any) {
            console.error("Error fetching labors:", err);
            throw new Error(`Failed to fetch labors: ${err.message}`);
        }

        let attendance: RowDataPacket[];
        try {
            const [rows] = await db.query<RowDataPacket[]>(
                `SELECT 
                    a.CM_Labor_ID,
                    a.CM_Attendance_Date,
                    a.CM_Project_ID,
                    p.CM_Project_Name,
                    a.CM_Status, 
                    a.CM_In_Time, 
                    a.CM_Out_Time, 
                    a.CM_Total_Working_Hours, 
                    a.CM_Remarks 
                FROM ccms_attendance a
                LEFT JOIN ccms_projects p ON a.CM_Project_ID = p.CM_Project_ID
                WHERE a.CM_Attendance_Date BETWEEN ? AND ?`,
                [startDate, endDate]
            );
            attendance = rows;
        } catch (err: any) {
            console.error("Error fetching attendance:", err);
            throw new Error(`Failed to fetch attendance: ${err.message}`);
        }

        if (reportType === 'day') {
            // Day view - existing logic
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
                    projectName: attRecord ? attRecord.CM_Project_Name : null,
                    status: attRecord ? attRecord.CM_Status : 'Absent',
                    inTime: attRecord ? attRecord.CM_In_Time : null,
                    outTime: attRecord ? attRecord.CM_Out_Time : null,
                    totalHours: attRecord ? attRecord.CM_Total_Working_Hours : null,
                    remarks: attRecord ? attRecord.CM_Remarks : null,
                };
            });

            const summary = {
                total: labors.length,
                present: report.filter(r => r.status === 'Present').length,
                absent: report.filter(r => r.status === 'Absent').length,
                halfDay: report.filter(r => r.status === 'Half-Day').length,
                onDuty: report.filter(r => r.status === 'On-Duty').length,
                holiday: report.filter(r => r.status === 'Holiday').length,
                weekOff: report.filter(r => r.status === 'Week-Off').length,
            };

            return NextResponse.json({
                success: true,
                data: {
                    reportType: 'day',
                    date: dateLabel,
                    summary,
                    details: report
                }
            });

        } else if (reportType === 'week') {
            // Week view - group by employee with daily breakdown
            const report = labors.map((labor: any) => {
                const employeeAttendance = attendance.filter(
                    (att: any) => att.CM_Labor_ID === labor.CM_Labor_Type_ID
                );

                // Create attendance map by date
                const attByDate = new Map();
                employeeAttendance.forEach((att: any) => {
                    const d = new Date(att.CM_Attendance_Date);
                    attByDate.set(formatToYYYYMMDD(d), att);
                });

                // Generate 7 days array
                const days = [];
                const currentDate = new Date(startDate);
                for (let i = 0; i < 7; i++) {
                    const dateStr = formatToYYYYMMDD(currentDate);
                    const attRecord = attByDate.get(dateStr);

                    days.push({
                        date: dateStr,
                        status: attRecord ? attRecord.CM_Status : 'Absent',
                        projectId: attRecord ? attRecord.CM_Project_ID : null,
                        projectName: attRecord ? attRecord.CM_Project_Name : null,
                        inTime: attRecord ? attRecord.CM_In_Time : null,
                        outTime: attRecord ? attRecord.CM_Out_Time : null,
                        totalHours: attRecord ? attRecord.CM_Total_Working_Hours : null,
                        remarks: attRecord ? attRecord.CM_Remarks : null,
                    });

                    currentDate.setDate(currentDate.getDate() + 1);
                }

                // Helper to parse hours
                const parseHours = (val: any) => {
                    if (!val) return 0;
                    if (typeof val === 'number') return val;
                    const str = String(val);
                    if (str.includes(':')) {
                        const [h, m] = str.split(':').map(Number);
                        return h + (m || 0) / 60;
                    }
                    return parseFloat(str) || 0;
                };

                // Calculate week summary for this employee
                const weekSummary = {
                    present: days.filter(d => d.status === 'Present').length,
                    absent: days.filter(d => d.status === 'Absent').length,
                    holiday: days.filter(d => d.status === 'Holiday').length,
                    halfDay: days.filter(d => d.status === 'Half-Day').length,
                    onDuty: days.filter(d => d.status === 'On-Duty').length,
                    weekOff: days.filter(d => d.status === 'Week-Off').length,
                    totalHours: Math.round(days.reduce((sum, d) => sum + parseHours(d.totalHours), 0) * 100) / 100
                };

                return {
                    laborTypeId: labor.CM_Labor_Type_ID,
                    laborCode: labor.CM_Labor_Code,
                    fullName: `${labor.CM_First_Name} ${labor.CM_Last_Name}`.trim(),
                    type: labor.CM_Labor_Type,
                    companyId: labor.CM_Company_ID,
                    days,
                    weekSummary
                };
            });

            // Calculate overall summary
            const allDays = report.flatMap(r => r.days);

            // Helper for overall summary
            const parseHours = (val: any) => {
                if (!val) return 0;
                if (typeof val === 'number') return val;
                const str = String(val);
                if (str.includes(':')) {
                    const [h, m] = str.split(':').map(Number);
                    return h + (m || 0) / 60;
                }
                return parseFloat(str) || 0;
            };

            const summary = {
                total: labors.length,
                avgPresent: Math.round(allDays.filter(d => d.status === 'Present').length / 7),
                avgAbsent: Math.round(allDays.filter(d => d.status === 'Absent').length / 7),
                totalPresent: allDays.filter(d => d.status === 'Present').length,
                totalAbsent: allDays.filter(d => d.status === 'Absent').length,
                workingDays: 7
            };

            return NextResponse.json({
                success: true,
                data: {
                    reportType: 'week',
                    date: dateLabel,
                    startDate,
                    endDate,
                    summary,
                    details: report
                }
            });

        } else if (reportType === 'month') {
            // Month view - summary per employee
            const report = labors.map((labor: any) => {
                const employeeAttendance = attendance.filter(
                    (att: any) => att.CM_Labor_ID === labor.CM_Labor_Type_ID
                );

                // Calculate days in month
                const start = new Date(startDate);
                const end = new Date(endDate);
                const totalDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

                // Create daily data array
                const dailyData = [];
                const attByDate = new Map();
                employeeAttendance.forEach((att: any) => {
                    const d = new Date(att.CM_Attendance_Date);
                    attByDate.set(formatToYYYYMMDD(d), att);
                });

                const currentDate = new Date(startDate);
                for (let i = 0; i < totalDays; i++) {
                    const dateStr = formatToYYYYMMDD(currentDate);
                    const attRecord = attByDate.get(dateStr);

                    dailyData.push({
                        date: dateStr,
                        status: attRecord ? attRecord.CM_Status : 'Absent',
                        projectId: attRecord ? attRecord.CM_Project_ID : null,
                        projectName: attRecord ? attRecord.CM_Project_Name : null,
                        hours: attRecord ? attRecord.CM_Total_Working_Hours : 0
                    });

                    currentDate.setDate(currentDate.getDate() + 1);
                }

                // Helper to parse hours
                const parseHours = (val: any) => {
                    if (!val) return 0;
                    if (typeof val === 'number') return val;
                    const str = String(val);
                    if (str.includes(':')) {
                        const [h, m] = str.split(':').map(Number);
                        return h + (m || 0) / 60;
                    }
                    return parseFloat(str) || 0;
                };

                const totalHours = Math.round(dailyData.reduce((sum, d) => sum + parseHours(d.hours), 0) * 100) / 100;

                const monthSummary = {
                    totalDays,
                    presentDays: dailyData.filter(d => d.status === 'Present').length,
                    absentDays: dailyData.filter(d => d.status === 'Absent').length,
                    holidayDays: dailyData.filter(d => d.status === 'Holiday').length,
                    onDutyDays: dailyData.filter(d => d.status === 'On-Duty').length,
                    halfDays: dailyData.filter(d => d.status === 'Half-Day').length,
                    weekOffDays: dailyData.filter(d => d.status === 'Week-Off').length,
                    totalHours: totalHours,
                    avgHoursPerDay: dailyData.length > 0
                        ? Math.round((totalHours / (dailyData.filter(d => ["Present", "On-Duty", "Half-Day"].includes(d.status)).length || 1)) * 10) / 10
                        : 0
                };

                return {
                    laborTypeId: labor.CM_Labor_Type_ID,
                    laborCode: labor.CM_Labor_Code,
                    fullName: `${labor.CM_First_Name} ${labor.CM_Last_Name}`.trim(),
                    type: labor.CM_Labor_Type,
                    companyId: labor.CM_Company_ID,
                    monthSummary,
                    dailyData
                };
            });

            // Calculate overall summary
            const summary = {
                total: labors.length,
                totalDays: Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1,
                avgPresent: Math.round(report.reduce((sum, r) => sum + r.monthSummary.presentDays, 0) / labors.length),
                avgAbsent: Math.round(report.reduce((sum, r) => sum + r.monthSummary.absentDays, 0) / labors.length),
                totalHours: report.reduce((sum, r) => sum + r.monthSummary.totalHours, 0)
            };

            return NextResponse.json({
                success: true,
                data: {
                    reportType: 'month',
                    date: dateLabel,
                    startDate,
                    endDate,
                    summary,
                    details: report
                }
            });
        }

        return NextResponse.json(
            { success: false, error: 'Invalid report type' },
            { status: 400 }
        );

    } catch (error: any) {
        console.error('Error fetching report:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: 'Internal Server Error', 
                message: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
            },
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
