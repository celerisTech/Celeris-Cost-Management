import { NextResponse, NextRequest } from 'next/server';
import getDb from '@/app/utils/db';

const sanitize = (v: any) => (v === '' || v === undefined || v === null ? null : v);
const parseNum = (v: any) => { if (v === '' || v == null) return null; const n = parseFloat(v); return isNaN(n) ? null : n; };

// Helper to format date for MySQL
const formatDbDate = (d: any) => {
  if (!d || d === '') return null;
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return null;
    return dt.toISOString().split('T')[0];
  } catch { return null; }
};

// Helper for safe JSON response handling BigInts
function safeJsonResponse(data: any, status = 200) {
  try {
    const json = JSON.stringify(data, (key, value) =>
      typeof value === 'bigint' ? Number(value) : value
    );
    return new NextResponse(json, {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Serialization Error', details: err.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const url = request.nextUrl;
    const leadId = url.searchParams.get('leadId');

    if (!leadId) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 });
    }

    const [projects] = await db.query(`
      SELECT slp.*
      FROM ccms_sales_lead_projects slp
      WHERE slp.CM_Lead_ID = ? AND slp.CM_Is_Deleted = 0
      ORDER BY slp.CM_Created_At DESC
    `, [leadId]);

    return safeJsonResponse(projects || []);
  } catch (error: any) {
    console.error('Error fetching lead projects:', error);
    return NextResponse.json({ error: 'Failed to fetch lead projects', details: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const method = request.nextUrl.searchParams.get('_method');
  if (method === 'PUT') return updateLeadProject(request);
  if (method === 'DELETE') return deleteLeadProject(request);

  try {
    const db = await getDb();
    const body = await request.json();

    if (!body.CM_Lead_ID || !body.CM_Product_Name) {
      return NextResponse.json({ error: 'Lead ID and Product Name are required' }, { status: 400 });
    }

    await db.query(
      `INSERT INTO ccms_sales_lead_projects (
        CM_Lead_Project_ID, CM_Lead_ID, CM_Product_Name,
        CM_Amount, CM_Proposal_Doc, CM_Status, CM_Created_By, CM_Created_At
      ) VALUES (NULL, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        body.CM_Lead_ID,
        body.CM_Product_Name.trim(),
        parseNum(body.CM_Amount),
        sanitize(body.CM_Proposal_Doc),
        sanitize(body.CM_Status) || 'New Lead',
        sanitize(body.CM_Created_By)
      ]
    );

    // Auto-update the main lead status if the newly added product is "Converted" or "Proposal Sent" etc.
    if (body.CM_Status) {
      await updateMainLeadStatus(db, body.CM_Lead_ID, body.CM_Created_By);
    }

    return NextResponse.json({ success: true, message: 'Lead project created successfully' }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating lead project:', error);
    return NextResponse.json({ error: 'Failed to create lead project', details: error.sqlMessage || error.message }, { status: 500 });
  }
}

async function updateLeadProject(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();
    const { CM_Lead_Project_ID, CM_Lead_ID } = body;

    if (!CM_Lead_Project_ID) {
      return NextResponse.json({ error: 'Lead Project ID is required' }, { status: 400 });
    }

    // Prepare update parameters
    const params = [
      body.CM_Product_Name?.trim(),
      parseNum(body.CM_Amount),
      sanitize(body.CM_Status) || 'New Lead',
      sanitize(body.CM_Updated_By),
    ];

    // If CM_Proposal_Doc is present in body (even if null/empty to clear it), update it
    let proposalUpdateSql = '';
    if ('CM_Proposal_Doc' in body) {
      proposalUpdateSql = ', CM_Proposal_Doc = ?';
      params.push(sanitize(body.CM_Proposal_Doc));
    }

    params.push(CM_Lead_Project_ID);

    await db.query(
      `UPDATE ccms_sales_lead_projects SET
        CM_Product_Name = ?, 
        CM_Amount = ?, 
        CM_Status = ?,
        CM_Updated_By = ?, 
        CM_Updated_At = NOW()
        ${proposalUpdateSql}
      WHERE CM_Lead_Project_ID = ?`,
      params
    );

    // If CM_Lead_ID was supplied, update the main lead status
    if (CM_Lead_ID) {
      await updateMainLeadStatus(db, CM_Lead_ID, body.CM_Updated_By);
    }

    return NextResponse.json({ success: true, message: 'Lead project updated successfully' });
  } catch (error: any) {
    console.error('Error updating lead project:', error);
    return NextResponse.json({ error: 'Failed to update lead project', details: error.sqlMessage || error.message }, { status: 500 });
  }
}

async function deleteLeadProject(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();
    const { CM_Lead_Project_ID, CM_Lead_ID, CM_Updated_By } = body;

    if (!CM_Lead_Project_ID) {
      return NextResponse.json({ error: 'Lead Project ID is required' }, { status: 400 });
    }

    await db.query(
      `UPDATE ccms_sales_lead_projects 
       SET CM_Is_Deleted = 1, CM_Updated_By = ?, CM_Updated_At = NOW() 
       WHERE CM_Lead_Project_ID = ?`,
      [sanitize(CM_Updated_By), CM_Lead_Project_ID]
    );

    // If CM_Lead_ID was supplied, recalculate and update the main lead status
    if (CM_Lead_ID) {
      await updateMainLeadStatus(db, CM_Lead_ID, CM_Updated_By);
    }

    return NextResponse.json({ success: true, message: 'Lead project soft deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting lead project:', error);
    return NextResponse.json({ error: 'Failed to delete lead project', details: error.message }, { status: 500 });
  }
}

// Helper function to update the main lead status based on the statuses of its projects
async function updateMainLeadStatus(db: any, leadId: string, userId: string) {
  try {
    const [projects]: any = await db.query(
      `SELECT CM_Status FROM ccms_sales_lead_projects 
       WHERE CM_Lead_ID = ? AND CM_Is_Deleted = 0`,
      [leadId]
    );

    if (!projects || projects.length === 0) return;

    // Determine the overall status of the lead:
    // 1. If any project is 'Converted', lead status is 'Converted'.
    // 2. If no converted project but any is 'Proposal Sent', status is 'Proposal Sent'.
    // 3. Otherwise use the status of the most recently updated or highest priority project.
    let targetStatus = 'New Lead';
    const statuses = projects.map((p: any) => p.CM_Status);

    if (statuses.includes('Converted')) {
      targetStatus = 'Converted';
    } else if (statuses.includes('Proposal Sent')) {
      targetStatus = 'Proposal Sent';
    } else if (statuses.includes('Negotiation')) {
      targetStatus = 'Negotiation';
    } else if (statuses.includes('Demo Given')) {
      targetStatus = 'Demo Given';
    } else if (statuses.includes('Visited')) {
      targetStatus = 'Visited';
    } else if (statuses.includes('Follow-up Call') || statuses.includes('Follow Up')) {
      targetStatus = 'Follow-up Call';
    } else if (statuses.every((s: string) => s === 'Rejected' || s === 'Not Interested')) {
      targetStatus = 'Rejected';
    } else if (statuses.includes('On Hold')) {
      targetStatus = 'On Hold';
    } else {
      targetStatus = statuses[0] || 'New Lead';
    }

    // Also get the combined product list and budget
    const [stats]: any = await db.query(
      `SELECT GROUP_CONCAT(CM_Product_Name SEPARATOR ', ') as products, SUM(CM_Amount) as total_budget
       FROM ccms_sales_lead_projects
       WHERE CM_Lead_ID = ? AND CM_Is_Deleted = 0`,
      [leadId]
    );

    const productsList = stats[0]?.products || '';
    const totalBudget = stats[0]?.total_budget || 0;

    await db.query(
      `UPDATE ccms_sales_lead SET 
        CM_Lead_Status = ?, 
        CM_Followup_Status = ?, 
        CM_Product_Required = ?, 
        CM_Expected_Budget = ?,
        CM_Updated_By = ?, 
        CM_Updated_At = NOW() 
       WHERE CM_Lead_ID = ?`,
      [targetStatus, targetStatus, productsList, totalBudget, userId, leadId]
    );
  } catch (err) {
    console.error('Error updating main lead status:', err);
  }
}
