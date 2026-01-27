//src\app\api\attendance-bulk-entry
import getDb from '../../utils/db';
import { OkPacket, RowDataPacket } from 'mysql2/promise';

// Helper function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const db = await getDb();

        // Expecting body to be an array of attendance records
        // OR an object with a 'records' array
        const records = Array.isArray(body) ? body : body.records;

        if (!records || !Array.isArray(records) || records.length === 0) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Invalid request: No attendance records provided'
                }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        console.log(`Received ${records.length} attendance records for bulk processing`);

        const results = {
            success: 0,
            failed: 0,
            errors: [] as any[]
        };

        // We'll process sequentially for now to handle individual errors, 
        // but in a real bulk scenario you might want a transaction.
        // Given the UI requirement, we likely want to verify the global project once if needed.

        // 1. Optional: Pre-validate Global Project if provided in a wrapper
        // (Skipping for now as we validate per record or per batch in frontend)

        for (const record of records) {
            try {
                // Validate required fields
                if (!record.laborId || !record.date || !record.companyId) {
                    throw new Error(`Missing required fields for Labor ID: ${record.laborId}`);
                }

                // Handle Project Validation logic (similar to single entry)
                // If Engineer (restricted), validation should have happened on frontend or global check
                // We will trust the payload here for bulk, but could re-validate location if needed.
                // For efficiency, we assume the frontend validated the "Global Project" location for the Engineer.

                // Handle timestamps
                const now = new Date();

                // Check if record exists
                const [existing] = await db.query<RowDataPacket[]>(
                    'SELECT CM_Attendance_ID FROM ccms_attendance WHERE CM_Labor_ID = ? AND CM_Attendance_Date = ?',
                    [record.laborId, record.date]
                );

                const projectId = !record.projectId || record.projectId === '' ? null : record.projectId;

                if (existing.length > 0) {
                    // UPDATE
                    await db.query(
                        `UPDATE ccms_attendance SET 
              CM_Company_ID = ?,
              CM_Project_ID = ?,
              CM_Status = ?,
              CM_Shift = ?,
              CM_In_Time = ?,
              CM_Out_Time = ?,
              CM_Total_Working_Hours = ?,
              CM_Remarks = ?,
              CM_Latitude = ?,
              CM_Longitude = ?,
              CM_Location_Accuracy = ?,
              CM_Created_By = ?
            WHERE CM_Attendance_ID = ?`,
                        [
                            record.companyId,
                            projectId,
                            record.status,
                            record.shift || null,
                            record.inTime,
                            record.outTime,
                            record.totalHours,
                            record.remarks || null,
                            record.latitude || null,
                            record.longitude || null,
                            record.accuracy || null,
                            record.createdBy,
                            existing[0].CM_Attendance_ID
                        ]
                    );
                } else {
                    // INSERT
                    await db.query(
                        `INSERT INTO ccms_attendance 
            (CM_Company_ID, CM_Project_ID, CM_Labor_ID, CM_Attendance_Date, 
             CM_Status, CM_Shift, CM_In_Time, CM_Out_Time, CM_Total_Working_Hours, CM_Remarks,
             CM_Latitude, CM_Longitude, CM_Location_Accuracy,
             CM_Created_At, CM_Created_By)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
                        [
                            record.companyId,
                            projectId,
                            record.laborId,
                            record.date,
                            record.status,
                            record.shift || null,
                            record.inTime,
                            record.outTime,
                            record.totalHours,
                            record.remarks || null,
                            record.latitude || null,
                            record.longitude || null,
                            record.accuracy || null,
                            record.createdBy
                        ]
                    );
                }

                results.success++;

            } catch (err: any) {
                console.error(`Error processing record for Labor ID ${record.laborId}:`, err);
                results.failed++;
                results.errors.push({
                    laborId: record.laborId,
                    error: err.message
                });
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: `Processed ${records.length} records`,
                results
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );

    } catch (error: any) {
        console.error('Bulk attendance error:', error);
        return new Response(
            JSON.stringify({
                success: false,
                error: 'Internal server error during bulk processing'
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
