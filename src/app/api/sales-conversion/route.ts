import { NextResponse, NextRequest } from 'next/server';
import getDb from '@/app/utils/db';

const sanitize = (v: any) => (v === '' || v === undefined || v === null ? null : v);

async function logActivity(db: any, leadId: string|null, action: string, desc: string, userId: string|null) {
  try { await db.query(`INSERT INTO ccms_sales_activity_log (CM_Log_ID, CM_Lead_ID, CM_Action, CM_Description, CM_Performed_By) VALUES (NULL, ?, ?, ?, ?)`, [leadId, action, desc, userId]); } catch(e) { console.error('Log error:', e); }
}

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const url = request.nextUrl;
    const type = url.searchParams.get('type');

    // Conversion stats
    if (type === 'stats') {
      const [stats]: any = await db.query(`
        SELECT 
          (SELECT COUNT(*) FROM ccms_sales_lead WHERE CM_Is_Deleted = 0) AS total_leads,
          (SELECT COUNT(*) FROM ccms_sales_lead WHERE CM_Lead_Status = 'Converted' AND CM_Is_Deleted = 0) AS converted_leads,
          (SELECT COUNT(*) FROM ccms_sales_project_conversion WHERE CM_Is_Deleted = 0) AS total_conversions
      `);
      const totalLeads = stats[0]?.total_leads || 0;
      const converted = stats[0]?.converted_leads || 0;
      return NextResponse.json({
        ...stats[0],
        conversion_rate: totalLeads > 0 ? ((converted / totalLeads) * 100).toFixed(1) : 0
      });
    }

    // List conversions
    const [conversions] = await db.query(`
      SELECT sc.*, sl.CM_Client_Name, sl.CM_Company_Name, sl.CM_Phone,
        p.CM_Project_Name, p.CM_Project_Code,
        u.CM_Full_Name AS Converted_By_Name
      FROM ccms_sales_project_conversion sc
      LEFT JOIN ccms_sales_lead sl ON sc.CM_Lead_ID = sl.CM_Lead_ID
      LEFT JOIN ccms_projects p ON sc.CM_Project_ID = p.CM_Project_ID
      LEFT JOIN ccms_users u ON sc.CM_Converted_By = u.CM_User_ID
      WHERE sc.CM_Is_Deleted = 0
      ORDER BY sc.CM_Converted_At DESC
    `);

    return NextResponse.json(conversions);
  } catch (error: any) {
    console.error('Error fetching conversions:', error);
    return NextResponse.json({ error: 'Failed', details: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();
    const { CM_Lead_ID, CM_Converted_By, CM_Remarks } = body;

    if (!CM_Lead_ID) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 });
    }

    // Fetch lead details
    const [leads]: any = await db.query(`SELECT * FROM ccms_sales_lead WHERE CM_Lead_ID = ? AND CM_Is_Deleted = 0`, [CM_Lead_ID]);
    if (!leads.length) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }
    const lead = leads[0];

    // Check if already converted
    const [existing]: any = await db.query(`SELECT CM_Conversion_ID FROM ccms_sales_project_conversion WHERE CM_Lead_ID = ? AND CM_Is_Deleted = 0`, [CM_Lead_ID]);
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Lead already converted', CM_Conversion_ID: existing[0].CM_Conversion_ID }, { status: 409 });
    }

    // Get proposal value from latest visit
    const [latestVisit]: any = await db.query(`
      SELECT CM_Proposal_Value FROM ccms_sales_visit 
      WHERE CM_Lead_ID = ? AND CM_Is_Deleted = 0 
      ORDER BY CM_Visit_Date DESC LIMIT 1
    `, [CM_Lead_ID]);
    const estimatedCost = latestVisit[0]?.CM_Proposal_Value || lead.CM_Expected_Budget || 0;

    // Create project entry in ccms_projects
    await db.query(
      `INSERT INTO ccms_projects (
        CM_Project_ID, CM_Project_Name, CM_Project_Type, CM_Description,
        CM_Project_Customer, CM_Project_Customer_Phone, CM_Alternative_Phone,
        CM_Customer_Address, CM_Estimated_Cost, CM_Status,
        CM_Project_Leader_ID, CM_Created_By, CM_Created_At
      ) VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?, ?, NOW())`,
      [
        `${lead.CM_Company_Name || lead.CM_Client_Name} - ${lead.CM_Product_Required || 'Project'}`,
        sanitize(lead.CM_Project_Type) || 'Web Development',
        `Auto-converted from Lead ${CM_Lead_ID}. ${CM_Remarks || ''}`,
        lead.CM_Client_Name,
        lead.CM_Phone,
        sanitize(lead.CM_Alt_Phone),
        sanitize(lead.CM_Address),
        estimatedCost,
        sanitize(lead.CM_Sales_Executive_ID),
        sanitize(CM_Converted_By)
      ]
    );

    // Get the newly created project ID
    const [newProject]: any = await db.query(`SELECT CM_Project_ID, CM_Project_Code FROM ccms_projects ORDER BY CM_Created_At DESC LIMIT 1`);
    const projectId = newProject[0]?.CM_Project_ID;

    // Create conversion record
    await db.query(
      `INSERT INTO ccms_sales_project_conversion (
        CM_Conversion_ID, CM_Lead_ID, CM_Project_ID, CM_Converted_By, CM_Remarks
      ) VALUES (NULL, ?, ?, ?, ?)`,
      [CM_Lead_ID, projectId, sanitize(CM_Converted_By), sanitize(CM_Remarks)]
    );

    // Update lead status to 'Converted'
    await db.query(
      `UPDATE ccms_sales_lead SET CM_Lead_Status = 'Converted', CM_Updated_By = ?, CM_Updated_At = NOW() WHERE CM_Lead_ID = ?`,
      [CM_Converted_By, CM_Lead_ID]
    );

    await logActivity(db, CM_Lead_ID, 'Lead Converted', `Lead converted to Project ${projectId}`, CM_Converted_By);

    return NextResponse.json({
      success: true,
      message: 'Lead converted to project successfully',
      CM_Project_ID: projectId,
      CM_Project_Code: newProject[0]?.CM_Project_Code
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error converting lead:', error);
    return NextResponse.json({ error: 'Failed to convert lead', details: error.sqlMessage || error.message }, { status: 500 });
  }
}
