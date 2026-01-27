// src/app/api/projects/route.ts
import { NextResponse, NextRequest } from 'next/server';
import getDb from '@/app/utils/db';

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const type = request.nextUrl.searchParams.get('type');
    const projectId = request.nextUrl.searchParams.get('projectId');

    if (type === 'engineers') {
      const [engineers] = await db.query(
        `SELECT CM_User_ID, CM_Full_Name, CM_Role_ID 
         FROM ccms_users 
         WHERE CM_Role_ID = 'ROL000003' 
         ORDER BY CM_Full_Name ASC`
      );
      return NextResponse.json(engineers);
    } else if (projectId) {
      // Fetch a single project by ID
      const [projects] = await db.query(`
        SELECT 
          p.*, 
          u.CM_Full_Name AS Project_Leader_Name,
          c.CM_Customer_Name,
          c.CM_Email,
          c.CM_Phone_Number,
          c.CM_Alternate_Phone,
          c.CM_Address,
          c.CM_District,
          c.CM_State,
          c.CM_Country,
          c.CM_Postal_Code,
          c.CM_GST_Number,
          c.CM_PAN_Number
        FROM ccms_projects p
        LEFT JOIN ccms_users u ON p.CM_Project_Leader_ID = u.CM_User_ID
        LEFT JOIN ccms_customer c ON p.CM_Customer_ID = c.CM_Customer_ID
        WHERE p.CM_Project_ID = ?
      `, [projectId]);

      // Fix: Type assertion or check if it's an array
      if (projects && Array.isArray(projects) && projects.length > 0) {
        const res = NextResponse.json(projects[0]);
        res.headers.set('Cache-Control', 'no-store');
        return res;
      } else {
        const res = NextResponse.json({ error: 'Project not found' }, { status: 404 });
        res.headers.set('Cache-Control', 'no-store');
        return res;
      }
    } else {
      // Fetch all projects
      const [projects] = await db.query(`
        SELECT 
          p.CM_Project_ID,
          p.CM_Project_Code,
          p.CM_Company_ID,
          comp.CM_Company_Name,             
          p.CM_Project_Name,
          p.CM_Customer_ID,
          p.CM_Project_Type,
          p.CM_Description,
          p.CM_Project_Location,
          p.CM_Project_Customer,
          p.CM_Project_Customer_Phone,
          p.CM_Alternative_Phone,
          p.CM_Customer_Address,
          p.CM_Estimated_Cost,
          p.CM_Actual_Cost,
          p.CM_Latitude,
          p.CM_Longitude,
          p.CM_Radius_Meters,
          p.CM_Status,
          p.CM_Planned_Start_Date,
          p.CM_Planned_End_Date,
          p.CM_Project_Leader_ID,
          u.CM_Full_Name AS Project_Leader_Name,
          c.CM_Customer_Name,
          c.CM_Email,
          c.CM_Phone_Number,
          c.CM_Alternate_Phone,
          c.CM_Address,
          c.CM_District,
          c.CM_State,
          c.CM_Country,
          c.CM_Postal_Code,
          c.CM_GST_Number,
          c.CM_PAN_Number
      FROM ccms_projects p
      LEFT JOIN ccms_users u 
          ON p.CM_Project_Leader_ID = u.CM_User_ID
      LEFT JOIN ccms_customer c 
          ON p.CM_Customer_ID = c.CM_Customer_ID
      LEFT JOIN ccms_companies comp         
          ON p.CM_Company_ID = comp.CM_Company_ID
      ORDER BY p.CM_Created_At DESC

      `);
      const res = NextResponse.json(projects);
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }
  } catch (error: any) {
    console.error('Error fetching projects:', error);
    const res = NextResponse.json(
      { error: `Failed to fetch projects`, details: error.message },
      { status: 500 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}


export async function POST(request: Request) {
  const method = new URL(request.url).searchParams.get("_method");
  if (method === "PUT") return updateProject(request);

  try {
    const db = await getDb();
    const body = await request.json();

    const requiredFields = ['CM_Project_Name', 'CM_Company_ID', 'CM_Project_Leader_ID'];
    const missingFields = requiredFields.filter(
      (field) => !body[field] || body[field].toString().trim() === ''
    );

    if (missingFields.length > 0) {
      const res = NextResponse.json(
        { error: 'Missing required fields', missingFields },
        { status: 400 }
      );
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    const sanitizeValue = (value: any) =>
      value === '' || value === undefined || value === null ? null : value;

    const parseDecimal = (value: any) => {
      if (value === '' || value === undefined || value === null) return null;
      const parsed = parseFloat(value);
      return isNaN(parsed) ? null : parsed;
    };

    // Improved date formatting in POST and PUT handlers
    const formatDateForDB = (dateString: any) => {
      if (!dateString || dateString === '') return null;
      try {
        // If it's already in YYYY-MM-DD format, return as is
        if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
          return dateString;
        }

        // Parse the date string properly
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return null;

        // Use local date components to maintain the correct date
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
      } catch {
        return null;
      }
    };


    // Process field values 
    const estCost = parseDecimal(body.CM_Estimated_Cost);
    const actCost = parseDecimal(body.CM_Actual_Cost);

    // Insert with NULL Project ID → trigger will auto-generate PRJ000xxx
    await db.query(
      `INSERT INTO ccms_projects (
        CM_Project_ID, CM_Project_Code, CM_Company_ID, CM_Customer_ID,        
        CM_Project_Type ,CM_Project_Name, CM_Description, CM_Project_Location, CM_Latitude, CM_Longitude, CM_Radius_Meters, CM_Project_Customer,
        CM_Project_Customer_Phone, CM_Alternative_Phone, CM_Customer_Address,
        CM_Estimated_Cost, CM_Actual_Cost, CM_Status,
        CM_Planned_Start_Date, CM_Planned_End_Date, CM_Project_Leader_ID, 
        CM_Created_By, CM_Created_At, CM_Uploaded_By, CM_Uploaded_At
      ) VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, NOW())`,
      [
        sanitizeValue(body.CM_Project_Code),
        sanitizeValue(body.CM_Company_ID),
        sanitizeValue(body.CM_Customer_ID),
        sanitizeValue(body.CM_Project_Type) || 'Web Development',
        body.CM_Project_Name.toString().trim(),
        sanitizeValue(body.CM_Description),
        sanitizeValue(body.CM_Project_Location),
        sanitizeValue(body.CM_Latitude),
        sanitizeValue(body.CM_Longitude),
        sanitizeValue(body.CM_Radius_Meters),
        sanitizeValue(body.CM_Project_Customer),
        sanitizeValue(body.CM_Project_Customer_Phone),
        sanitizeValue(body.CM_Alternative_Phone),
        sanitizeValue(body.CM_Customer_Address),
        estCost,
        actCost,
        sanitizeValue(body.CM_Status) || 'Active',
        formatDateForDB(body.CM_Planned_Start_Date),
        formatDateForDB(body.CM_Planned_End_Date),
        sanitizeValue(body.CM_Project_Leader_ID),
        sanitizeValue(body.CM_Created_By),
        sanitizeValue(body.CM_Uploaded_By)
      ]
    );

    // Fetch the latest project (trigger generated ID)
    const [rows]: any = await db.query(
      `SELECT CM_Project_ID 
       FROM ccms_projects 
       ORDER BY CM_Created_At DESC 
       LIMIT 1`
    );

    const newProjectId = rows.length > 0 ? rows[0].CM_Project_ID : null;

    const res = NextResponse.json(
      { success: true, message: 'Project created successfully', CM_Project_ID: newProjectId },
      { status: 201 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error: any) {
    console.error('Database error:', error);
    const res = NextResponse.json(
      { error: 'Database operation failed', details: error.sqlMessage || error.message },
      { status: 500 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}

async function updateProject(request: Request) {
  try {
    const db = await getDb();
    const body = await request.json();

    const { CM_Project_ID } = body;

    if (!CM_Project_ID) {
      const res = NextResponse.json(
        { error: 'Project ID is required for updates' },
        { status: 400 }
      );
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    const requiredFields = ['CM_Project_Name', 'CM_Project_Leader_ID'];
    const missingFields = requiredFields.filter(
      (field) => !body[field] || body[field].toString().trim() === ''
    );

    if (missingFields.length > 0) {
      const res = NextResponse.json(
        { error: 'Missing required fields', missingFields },
        { status: 400 }
      );
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    const sanitizeValue = (value: any) =>
      value === '' || value === undefined || value === null ? null : value;

    const parseDecimal = (value: any) => {
      if (value === '' || value === undefined || value === null) return null;
      const parsed = parseFloat(value);
      return isNaN(parsed) ? null : parsed;
    };

    // Improved date formatting in POST and PUT handlers
    const formatDateForDB = (dateString: any) => {
      if (!dateString || dateString === '') return null;
      try {
        // If it's already in YYYY-MM-DD format, return as is
        if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
          return dateString;
        }

        // Parse the date string properly
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return null;

        // Use local date components to maintain the correct date
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
      } catch {
        return null;
      }
    };


    const estCost = parseDecimal(body.CM_Estimated_Cost);
    const actCost = parseDecimal(body.CM_Actual_Cost);

    // Update existing project with correctly formatted dates
    await db.query(
      `UPDATE ccms_projects SET
        CM_Project_Code = ?, 
        CM_Company_ID = ?, 
        CM_Customer_ID = ?, 
        CM_Project_Type = ?,
        CM_Project_Name = ?, 
        CM_Description = ?, 
        CM_Project_Location = ?, 
        CM_Project_Customer = ?, 
        CM_Project_Customer_Phone = ?, 
        CM_Alternative_Phone = ?, 
        CM_Customer_Address = ?,
        CM_Estimated_Cost = ?, 
        CM_Actual_Cost = ?, 
        CM_Status = ?,
        CM_Planned_Start_Date = ?, 
        CM_Planned_End_Date = ?, 
        CM_Project_Leader_ID = ?, 
        CM_Uploaded_By = ?,
        CM_Uploaded_At = NOW()
      WHERE CM_Project_ID = ?`,
      [
        sanitizeValue(body.CM_Project_Code),
        sanitizeValue(body.CM_Company_ID),
        sanitizeValue(body.CM_Customer_ID),
        sanitizeValue(body.CM_Project_Type) || 'Web Development',
        body.CM_Project_Name.toString().trim(),
        sanitizeValue(body.CM_Description),
        sanitizeValue(body.CM_Project_Location),
        sanitizeValue(body.CM_Project_Customer),
        sanitizeValue(body.CM_Project_Customer_Phone),
        sanitizeValue(body.CM_Alternative_Phone),
        sanitizeValue(body.CM_Customer_Address),
        estCost,
        actCost,
        sanitizeValue(body.CM_Status) || 'Active',
        formatDateForDB(body.CM_Planned_Start_Date),
        formatDateForDB(body.CM_Planned_End_Date),
        sanitizeValue(body.CM_Project_Leader_ID),
        sanitizeValue(body.CM_Uploaded_By),
        CM_Project_ID
      ]
    );

    const res = NextResponse.json(
      { success: true, message: 'Project updated successfully', CM_Project_ID },
      { status: 200 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error: any) {
    console.error('Database error:', error);
    const res = NextResponse.json(
      { error: 'Database operation failed', details: error.sqlMessage || error.message },
      { status: 500 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}


