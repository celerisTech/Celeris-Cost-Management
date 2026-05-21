// src\app\api\attendance-entry\route.ts
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

    console.log('Received attendance submission:', JSON.stringify(body, null, 2));

    // Validate required fields
    if (!body.laborId || !body.date || !body.companyId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: laborId, date, companyId'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get user role from the request
    const userRole = body.userRole;
    const locationRestricted = body.locationRestricted === true;

    console.log(`User Role: ${userRole}, Location Restricted: ${locationRestricted}`);

    // Validate project exists for non-Office employees
    if (body.projectId && body.projectId !== null && body.projectId !== '') {
      const [projectExists] = await db.query<RowDataPacket[]>(
        `SELECT CM_Project_ID, CM_Latitude, CM_Longitude, CM_Radius_Meters 
         FROM ccms_projects WHERE CM_Project_ID = ?`,
        [body.projectId]
      );

      if (projectExists.length === 0) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Selected project does not exist'
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const project = projectExists[0];
      console.log('Project data:', project);

      // Validate location for restricted users (Engineers)
      if (locationRestricted) {
        console.log('User is location restricted, checking location...');

        // Check if user provided location
        if (!body.latitude || !body.longitude) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Location data is required for attendance submission'
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        // Check if project has location data
        if (!project.CM_Latitude || !project.CM_Longitude) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Project location data is missing. Please contact administrator.'
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        // Calculate distance
        const distance = calculateDistance(
          body.latitude,
          body.longitude,
          parseFloat(project.CM_Latitude),
          parseFloat(project.CM_Longitude)
        );

        // Use project radius or default to 100 meters
        const projectRadius = project.CM_Radius_Meters || 100;
        console.log(`Distance from project: ${distance.toFixed(2)}m, Allowed radius: ${projectRadius}m`);

        // If Engineer is outside project radius, reject the submission
        if (distance > projectRadius) {
          return new Response(
            JSON.stringify({
              success: false,
              error: `You are ${Math.round(distance)}m away from the project site. Please move within ${projectRadius}m radius to mark attendance.`,
              distance: Math.round(distance),
              allowedRadius: projectRadius,
              userRole: userRole
            }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }

        console.log('Location check passed - user is within project radius');
      } else {
        console.log('User is not location restricted (Owner/Manager), skipping location check');

        // Optional: Log warning for non-restricted users who are outside project radius
        if (body.latitude && body.longitude && project.CM_Latitude && project.CM_Longitude) {
          const distance = calculateDistance(
            body.latitude,
            body.longitude,
            parseFloat(project.CM_Latitude),
            parseFloat(project.CM_Longitude)
          );
          const projectRadius = project.CM_Radius_Meters || 100;

          if (distance > projectRadius) {
            console.log(`Warning: Owner/Manager (${userRole}) marked attendance from ${Math.round(distance)}m away from project (radius: ${projectRadius}m)`);
          }
        }
      }
    } else if (locationRestricted && body.projectId === null) {
      // For Engineers trying to mark Office attendance
      console.log('Engineer trying to mark Office attendance');
      // Allow Engineers to mark Office attendance without location check
      // (assuming Office employees don't need location restriction)
    }

    // Check if attendance record already exists
    const [existingRecords] = await db.query<RowDataPacket[]>(
      `SELECT * FROM ccms_attendance 
       WHERE CM_Labor_ID = ? AND CM_Attendance_Date = ?`,
      [body.laborId, body.date]
    );

    if (existingRecords.length > 0) {
      const res = new Response(
        JSON.stringify({
          success: false,
          error: 'Attendance record already exists for this employee on the selected date'
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    // Handle project ID - convert empty string to null
    const projectId = !body.projectId || body.projectId === '' ? null : body.projectId;

    // Insert query with additional fields for location validation tracking
    const query = `
      INSERT INTO ccms_attendance 
      (CM_Company_ID, CM_Project_ID, CM_Labor_ID, CM_Attendance_Date, 
       CM_Status, CM_Shift, CM_In_Time, CM_Out_Time, CM_Total_Working_Hours, CM_Remarks,
       CM_Latitude, CM_Longitude, CM_Location_Accuracy,
       CM_Created_At, CM_Created_By)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
    `;

    const values = [
      body.companyId,
      projectId, // Use the sanitized projectId
      body.laborId,
      body.date,
      body.status,
      body.shift || null,
      body.inTime,
      body.outTime,
      body.totalHours,
      body.remarks || null,
      body.latitude || null,
      body.longitude || null,
      body.accuracy || null,
      body.createdBy
    ];

    console.log('Inserting attendance with values:', values);

    const [result] = await db.query<OkPacket>(query, values);

    // Fetch the newly created record with details
    const [newRecord] = await db.query<RowDataPacket[]>(
      `SELECT 
        a.*,
        l.CM_First_Name,
        l.CM_Last_Name,
        l.CM_Labor_Code,
        p.CM_Project_Name,
        p.CM_Project_Code
       FROM ccms_attendance a
       LEFT JOIN ccms_labor l ON a.CM_Labor_ID = l.CM_Labor_Type_ID
       LEFT JOIN ccms_projects p ON a.CM_Project_ID = p.CM_Project_ID
       WHERE a.CM_Attendance_ID = ?`,
      [result.insertId]
    );

    const res = new Response(
      JSON.stringify({
        success: true,
        message: 'Attendance saved successfully',
        insertId: result.insertId,
        record: newRecord[0],
        locationValidation: {
          restricted: locationRestricted,
          verified: locationRestricted && body.latitude && body.longitude ? true : false,
          userRole: userRole
        }
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error: any) {
    console.error('Error saving attendance:', error);
    console.error('Error stack:', error.stack);

    // More specific error handling
    let errorMessage = 'Failed to save attendance';
    let statusCode = 500;

    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      errorMessage = 'Invalid project or employee reference. Please check your selections.';
      statusCode = 400;
    } else if (error.code === 'ER_DATA_TOO_LONG') {
      errorMessage = 'Data too long for one of the fields. Please check your input.';
      statusCode = 400;
    } else if (error.code === 'ER_TRUNCATED_WRONG_VALUE') {
      errorMessage = 'Invalid data format. Please check your input values.';
      statusCode = 400;
    }

    const res = new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        code: error.code
      }),
      {
        status: statusCode,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const laborId = searchParams.get('laborId');
    const date = searchParams.get('date');
    const projectId = searchParams.get('projectId');
    const companyId = searchParams.get('companyId');
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const userRole = searchParams.get('userRole'); // Optional: filter by user role

    const db = await getDb();

    let query = `
      SELECT 
        a.CM_Attendance_ID,
        a.CM_Company_ID,
        a.CM_Project_ID,
        a.CM_Labor_ID,
        DATE_FORMAT(a.CM_Attendance_Date, '%Y-%m-%d') as CM_Attendance_Date,
        a.CM_Status,
        a.CM_Shift,
        a.CM_In_Time,
        a.CM_Out_Time,
        a.CM_Total_Working_Hours,
        a.CM_Remarks,
        a.CM_Latitude,
        a.CM_Longitude,
        a.CM_Location_Accuracy,
        a.CM_Created_At,
        a.CM_Created_By,
        l.CM_First_Name, 
        l.CM_Last_Name,
        l.CM_Labor_Code,
        l.CM_Labor_Type,
        l.CM_Labor_Roll,
        CASE 
          WHEN a.CM_Project_ID IS NULL THEN 'Office'
          ELSE p.CM_Project_Name 
        END AS CM_Project_Name,
        CASE 
          WHEN a.CM_Project_ID IS NULL THEN 'Office'
          ELSE p.CM_Project_Code
        END AS CM_Project_Code,
        p.CM_Latitude as Project_Latitude,
        p.CM_Longitude as Project_Longitude,
        p.CM_Radius_Meters as Project_Radius
      FROM ccms_attendance a
      JOIN ccms_labor l ON a.CM_Labor_ID = l.CM_Labor_Type_ID
      LEFT JOIN ccms_projects p ON a.CM_Project_ID = p.CM_Project_ID
      WHERE 1=1
    `;

    const queryParams: any[] = [];

    if (companyId) {
      query += ` AND a.CM_Company_ID = ?`;
      queryParams.push(companyId);
    }

    if (laborId) {
      query += ` AND a.CM_Labor_ID = ?`;
      queryParams.push(laborId);
    }

    if (date) {
      query += ` AND a.CM_Attendance_Date = ?`;
      queryParams.push(date);
    }

    if (month && year) {
      query += ` AND MONTH(a.CM_Attendance_Date) = ? AND YEAR(a.CM_Attendance_Date) = ?`;
      queryParams.push(parseInt(month), parseInt(year));
    }

    if (projectId) {
      if (projectId === 'Office') {
        query += ` AND a.CM_Project_ID IS NULL`;
      } else {
        query += ` AND a.CM_Project_ID = ?`;
        queryParams.push(projectId);
      }
    }


    query += ` ORDER BY a.CM_Attendance_Date DESC, a.CM_Created_At DESC`;

    console.log('Executing attendance query:', query);
    console.log('With params:', queryParams);

    const [rows] = await db.query<RowDataPacket[]>(query, queryParams);

    console.log('Query result rows:', rows.length);

    // Calculate distance for each record if location data exists
    const enhancedRows = rows.map(row => {
      if (row.CM_Latitude && row.CM_Longitude && row.Project_Latitude && row.Project_Longitude) {
        try {
          const distance = calculateDistance(
            parseFloat(row.CM_Latitude),
            parseFloat(row.CM_Longitude),
            parseFloat(row.Project_Latitude),
            parseFloat(row.Project_Longitude)
          );
          return {
            ...row,
            Distance_From_Project: Math.round(distance),
            Within_Radius: row.Project_Radius ? distance <= row.Project_Radius : null
          };
        } catch (error) {
          console.error('Error calculating distance for row:', row.CM_Attendance_ID, error);
          return row;
        }
      }
      return row;
    });

    const res = new Response(JSON.stringify(enhancedRows), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error: any) {
    console.error('Error fetching attendance:', error);
    const res = new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch attendance',
        details: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}