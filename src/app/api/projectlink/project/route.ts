import { NextRequest, NextResponse } from "next/server";
import getDb from "../../../utils/db";

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
          p.CM_Project_ID as projectId,
          p.CM_Project_Code,
          p.CM_Company_ID,
          comp.CM_Company_Name,             
          p.CM_Project_Name as name,
          p.CM_Customer_ID,
          p.CM_Project_Type as type,
          p.CM_Description,
          p.CM_Project_Location,
          p.CM_Project_Customer,
          p.CM_Project_Customer_Phone,
          p.CM_Alternative_Phone,
          p.CM_Customer_Address,
          p.CM_Estimated_Cost,
          p.CM_Actual_Cost,
          p.CM_Status as status,
          p.CM_Planned_Start_Date as startDate,
          p.CM_Planned_End_Date as endDate,
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

      // Format the response to match the expected structure in the frontend
      const res = NextResponse.json({
        success: true,
        projects: projects
      });
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }
  } catch (error: any) {
    console.error('Error fetching projects:', error);
    const res = NextResponse.json(
      { success: false, message: `Failed to fetch projects: ${error.message}` },
      { status: 500 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}
