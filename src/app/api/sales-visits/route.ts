export const runtime = 'nodejs';

import { NextResponse, NextRequest } from 'next/server';
import getDb from '@/app/utils/db';

// ─── Helpers ────────────────────────────────────────────────────────────────

const sanitize = (v: unknown): string | null =>
  v === '' || v === undefined || v === null ? null : String(v).trim();

const parsePositiveInt = (v: unknown, fallback: number): number => {
  const n = parseInt(String(v ?? ''), 10);
  return isNaN(n) || n < 1 ? fallback : n;
};

const parseNum = (v: unknown): number | null => {
  if (v === '' || v == null) return null;
  const n = parseFloat(String(v));
  return isNaN(n) ? null : n;
};

const toMysqlDate = (d: unknown): string | null => {
  if (!d || d === '') return null;
  const s = String(d).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  try {
    const dt = new Date(s);
    if (isNaN(dt.getTime())) return null;
    return dt.toISOString().split('T')[0];
  } catch { return null; }
};

function safeJson(data: unknown, status = 200): NextResponse {
  try {
    const body = JSON.stringify(data, (_k, v) =>
      typeof v === 'bigint' ? Number(v) : v
    );
    return new NextResponse(body, {
      status,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch (e: any) {
    return NextResponse.json({ error: 'Serialisation error', details: e.message }, { status: 500 });
  }
}

async function logActivity(db: any, leadId: unknown, action: string, desc: string, userId: unknown) {
  try {
    await db.execute(
      `INSERT INTO ccms_sales_activity_log (CM_Log_ID, CM_Lead_ID, CM_Action, CM_Description, CM_Performed_By)
       VALUES (NULL,?,?,?,?)`,
      [leadId ?? null, action, desc, userId ?? null]
    );
  } catch (e) { console.error('logActivity error:', e); }
}

async function markUserAttendance(db: any, userId: any, description: string, attendanceDate?: string | null) {
  if (!userId) return;
  try {
    const formattedDate = attendanceDate ? (toMysqlDate(attendanceDate) || new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0];

    // 1. Get user info
    const [userRows]: any = await db.execute(
      `SELECT CM_User_ID, CM_Company_ID, CM_Labor_Type_ID FROM ccms_users WHERE CM_User_ID = ?`,
      [userId]
    );

    let companyId = 1;
    let laborId = userId;

    if (userRows && userRows.length > 0) {
      companyId = userRows[0].CM_Company_ID || 1;
      laborId = userRows[0].CM_Labor_Type_ID || userId;
    }

    // 2. Check if attendance already exists on target date
    const [existingAttendanceRows]: any = await db.execute(
      `SELECT CM_Attendance_ID FROM ccms_attendance 
       WHERE CM_Labor_ID = ? AND DATE(CM_Attendance_Date) = ?`,
      [laborId, formattedDate]
    );

    // 3. If no attendance exists, mark as present
    if (!existingAttendanceRows || existingAttendanceRows.length === 0) {
      await db.execute(
        `INSERT INTO ccms_attendance 
          (CM_Company_ID, CM_Project_ID, CM_Labor_ID, CM_Attendance_Date, CM_Status, CM_Shift, CM_In_Time, CM_Out_Time, CM_Total_Working_Hours, CM_Remarks, CM_Created_At, CM_Created_By)
         VALUES (?, 0, ?, ?, 'Present', 'Day', '09:00:00', '17:00:00', 8, ?, NOW(), ?)`,
        [
          companyId,
          laborId,
          formattedDate,
          `Automatically marked Present via ${description}`,
          userId
        ]
      );
      console.log(`✅ Automated visit attendance recorded for User/Labor ID ${laborId} on ${formattedDate}`);
    }
  } catch (error) {
    console.error('Failed to mark user attendance automatically:', error);
  }
}

async function recalculateLeadStatuses(db: any, leadId: string) {
  const [visits]: any = await db.execute(
    `SELECT CM_Visit_Status, CM_Demo_Given, CM_Visit_Date, CM_Visit_ID 
     FROM ccms_sales_visit 
     WHERE CM_Lead_ID = ? AND CM_Is_Deleted = 0 
     ORDER BY CM_Visit_Date ASC, CM_Visit_ID ASC`,
    [leadId]
  );

  let leadStatus = 'New Lead';
  let followupStatus = 'Follow Up';

  for (const visit of visits) {
    const status = String(visit.CM_Visit_Status || '').trim();
    const isDemo = status === 'Demo Given' || visit.CM_Demo_Given === 'Yes';
    const isProposal = status === 'Proposal Sent';
    const isConverted = status === 'Converted';
    const isNotInterested = status === 'Not Interested' || status === 'Rejected';
    const isFollowUp = !isDemo && !isProposal && !isConverted && !isNotInterested;

    if (isNotInterested) {
      leadStatus = 'Not Interested';
      followupStatus = 'Not Interested';
    } else if (isConverted) {
      leadStatus = 'Converted';
      followupStatus = 'Converted';
    } else if (isProposal) {
      leadStatus = 'Proposal Sent';
      followupStatus = 'Proposal Sent';
    } else if (isDemo) {
      leadStatus = 'Demo Given';
      followupStatus = 'Demo Given';
    } else if (isFollowUp) {
      leadStatus = status || 'Follow Up';
      if (followupStatus !== 'Demo Given' && followupStatus !== 'Proposal Sent') {
        followupStatus = 'Follow Up';
      }
    }
  }

  await db.execute(
    `UPDATE ccms_sales_lead 
     SET CM_Lead_Status = ?, CM_Followup_Status = ?, CM_Updated_At = NOW() 
     WHERE CM_Lead_ID = ?`,
    [leadStatus, followupStatus, leadId]
  );
}

async function ensureProductAssignedToLead(db: any, leadId: string, productName: string | null, userId: string | null, visitStatus: string | null) {
  if (!leadId || !productName) return;
  const prod = String(productName).trim();
  if (prod === '' || prod.toLowerCase() === 'none') return;

  const products = prod.split(',').map(p => p.trim()).filter(Boolean);
  let updated = false;

  for (const product of products) {
    const [existing]: any = await db.query(
      `SELECT CM_Lead_Project_ID FROM ccms_sales_lead_projects 
       WHERE CM_Lead_ID = ? AND CM_Product_Name = ? AND CM_Is_Deleted = 0`,
      [leadId, product]
    );

    if (!existing || existing.length === 0) {
      await db.execute(
        `INSERT INTO ccms_sales_lead_projects (
          CM_Lead_Project_ID, CM_Lead_ID, CM_Product_Name,
          CM_Amount, CM_Proposal_Doc, CM_Status, CM_Created_By, CM_Created_At
        ) VALUES (NULL, ?, ?, 0, NULL, ?, ?, NOW())`,
        [
          leadId,
          product,
          visitStatus || 'Follow Up',
          userId || null
        ]
      );
      updated = true;
    }
  }

  if (updated) {
    await updateMainLeadStatus(db, leadId, userId || 'System');
  }
}

async function updateMainLeadStatus(db: any, leadId: string, userId: string) {
  try {
    const [projects]: any = await db.query(
      `SELECT CM_Status FROM ccms_sales_lead_projects 
       WHERE CM_Lead_ID = ? AND CM_Is_Deleted = 0`,
      [leadId]
    );

    if (!projects || projects.length === 0) return;

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
    console.error('Error updating main lead status in visits route:', err);
  }
}

// ─── GET ─────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const q  = request.nextUrl.searchParams;

    const type         = sanitize(q.get('type'));
    const visitId      = sanitize(q.get('visitId'));
    const leadId       = sanitize(q.get('leadId'));
    const executiveId  = sanitize(q.get('executiveId'));
    const industrialId = sanitize(q.get('industrialId'));
    const categoryId   = sanitize(q.get('categoryId'));
    const status       = sanitize(q.get('status'));
    const product      = sanitize(q.get('product'));
    const search       = sanitize(q.get('search'));
    const fromDate     = toMysqlDate(q.get('fromDate'));
    const toDate       = toMysqlDate(q.get('toDate'));
    const pending      = sanitize(q.get('pending')) === 'true';
    const page         = parsePositiveInt(q.get('page'), 1);
    const limit        = parsePositiveInt(q.get('limit'), 50);
    const offset       = (page - 1) * limit;

    // ── Pending followups ──────────────────────────────────────────────────
    if (type === 'pending-followups') {
      let extraConditionVisit = '';
      let extraConditionLead = '';
      const visitParams: any[] = [];
      const leadParams: any[] = [];
      
      if (fromDate) {
        extraConditionVisit += ' AND sv.CM_Next_Followup_Date >= ?';
        extraConditionLead += ' AND sl.CM_Next_Follow_Up_Date >= ?';
        visitParams.push(fromDate);
        leadParams.push(fromDate);
      }
      if (toDate) {
        extraConditionVisit += ' AND sv.CM_Next_Followup_Date <= ?';
        extraConditionLead += ' AND sl.CM_Next_Follow_Up_Date <= ?';
        visitParams.push(toDate);
        leadParams.push(toDate);
      }

      const combinedParams = [...visitParams, ...leadParams];

      const [rows]: any = await db.query(`
        SELECT 'visit' AS source_type,
               CAST(sv.CM_Visit_ID AS CHAR) AS CM_Visit_ID,
               sv.CM_Lead_ID,
               sv.CM_Visit_Date,
               sv.CM_Visit_Time,
               sv.CM_Created_At,
               sv.CM_Purpose,
               sv.CM_Remarks,
               sv.CM_Next_Followup_Date,
               sv.CM_Next_Followup_Time,
               sv.CM_Visit_Status,
               sl.CM_Client_Name,
               sl.CM_Company_Name,
               sl.CM_Phone,
               sl.CM_City,
               sl.CM_Lead_Status,
               u.CM_Full_Name AS Executive_Name,
               ind.CM_Industrial_Name, cat.CM_Category_Name
        FROM   ccms_sales_visit sv
        JOIN   ccms_sales_lead  sl
               ON sv.CM_Lead_ID COLLATE utf8mb4_general_ci = sl.CM_Lead_ID COLLATE utf8mb4_general_ci
        LEFT JOIN ccms_industrial ind ON sl.CM_Industrial_ID = ind.CM_Industrial_ID
        LEFT JOIN ccms_sales_category cat ON sl.CM_Category_ID = cat.CM_Category_ID
        LEFT JOIN ccms_users    u
               ON sv.CM_Sales_Executive_ID COLLATE utf8mb4_general_ci
                = u.CM_User_ID             COLLATE utf8mb4_general_ci
        WHERE  sv.CM_Visit_ID IN (
                 SELECT MAX(sv2.CM_Visit_ID)
                 FROM   ccms_sales_visit sv2
                 WHERE  sv2.CM_Is_Deleted = 0
                 GROUP BY sv2.CM_Lead_ID
               )
           AND  sv.CM_Is_Deleted = 0
           AND  sl.CM_Is_Deleted = 0
           AND  sv.CM_Next_Followup_Date >= CURDATE()
           AND  sv.CM_Visit_Status IN ('Interested', 'Follow-up Needed')
           AND  COALESCE(sl.CM_Lead_Status, '') NOT IN ('Converted', 'Not Interested', 'Closed', 'Rejected')
           AND  COALESCE(sl.CM_Followup_Status, '') NOT IN ('Converted', 'Not Interested', 'Closed', 'Rejected')
           ${extraConditionVisit}

        UNION ALL

        SELECT 'lead' AS source_type,
               CONCAT('L-', sl.CM_Lead_ID) AS CM_Visit_ID,
               sl.CM_Lead_ID,
               sl.CM_Created_At AS CM_Visit_Date,
               sl.CM_Next_Follow_Up_Time AS CM_Visit_Time,
               sl.CM_Created_At,
               'Initial Intake Follow-up' AS CM_Purpose,
               sl.CM_Remarks,
               sl.CM_Next_Follow_Up_Date AS CM_Next_Followup_Date,
               sl.CM_Next_Follow_Up_Time AS CM_Next_Followup_Time,
               'Follow-up Needed' AS CM_Visit_Status,
               sl.CM_Client_Name,
               sl.CM_Company_Name,
               sl.CM_Phone,
               sl.CM_City,
               sl.CM_Lead_Status,
               u.CM_Full_Name AS Executive_Name,
               ind.CM_Industrial_Name, cat.CM_Category_Name
        FROM   ccms_sales_lead sl
        LEFT JOIN ccms_industrial ind ON sl.CM_Industrial_ID = ind.CM_Industrial_ID
        LEFT JOIN ccms_sales_category cat ON sl.CM_Category_ID = cat.CM_Category_ID
        LEFT JOIN ccms_users    u
               ON sl.CM_Sales_Executive_ID COLLATE utf8mb4_general_ci
                = u.CM_User_ID             COLLATE utf8mb4_general_ci
        WHERE  sl.CM_Is_Deleted = 0
           AND  sl.CM_Next_Follow_Up_Date >= CURDATE()
           AND  COALESCE(sl.CM_Lead_Status, '') NOT IN ('Converted', 'Not Interested', 'Closed', 'Rejected')
           AND  COALESCE(sl.CM_Followup_Status, '') NOT IN ('Converted', 'Not Interested', 'Closed', 'Rejected')
           AND  sl.CM_Lead_ID COLLATE utf8mb4_general_ci NOT IN (
                  SELECT DISTINCT CM_Lead_ID COLLATE utf8mb4_general_ci 
                  FROM   ccms_sales_visit 
                  WHERE  CM_Is_Deleted = 0
                )
           ${extraConditionLead}

        ORDER BY CM_Next_Followup_Date ASC, CM_Next_Followup_Time ASC
      `, combinedParams);
      return safeJson(rows ?? []);
    }

    // ── Single visit ───────────────────────────────────────────────────────
    if (visitId) {
      const [[visit]]: any = await db.execute(`
        SELECT sv.*, sl.CM_Client_Name, sl.CM_Company_Name, sl.CM_Phone, sl.CM_City, sl.CM_Lead_Status,
               u.CM_Full_Name AS Executive_Name,
               ind.CM_Industrial_Name, cat.CM_Category_Name,
               (SELECT CM_Visit_Status FROM ccms_sales_visit WHERE CM_Lead_ID = sv.CM_Lead_ID AND CM_Is_Deleted = 0 ORDER BY CM_Visit_ID DESC LIMIT 1) AS Last_Visit_Status
        FROM   ccms_sales_visit sv
        JOIN   ccms_sales_lead  sl
               ON sv.CM_Lead_ID COLLATE utf8mb4_general_ci = sl.CM_Lead_ID COLLATE utf8mb4_general_ci
        LEFT JOIN ccms_industrial ind ON sl.CM_Industrial_ID = ind.CM_Industrial_ID
        LEFT JOIN ccms_sales_category cat ON sl.CM_Category_ID = cat.CM_Category_ID
        LEFT JOIN ccms_users    u
               ON sv.CM_Sales_Executive_ID COLLATE utf8mb4_general_ci
                = u.CM_User_ID             COLLATE utf8mb4_general_ci
        WHERE  sv.CM_Visit_ID = ? AND sv.CM_Is_Deleted = 0
      `, [visitId]);
      if (!visit) return safeJson({ error: 'Visit not found' }, 404);
      return safeJson(visit);
    }

    // ── Paginated list ─────────────────────────────────────────────────────
    const conditions: string[] = ['sv.CM_Is_Deleted = 0'];
    const params: unknown[]    = [];

    if (pending) {
      conditions.push(`sv.CM_Visit_ID IN (
        SELECT MAX(sv2.CM_Visit_ID)
        FROM   ccms_sales_visit sv2
        WHERE  sv2.CM_Is_Deleted = 0
        GROUP BY sv2.CM_Lead_ID
      )`);
      conditions.push('sv.CM_Next_Followup_Date >= CURDATE()');
      conditions.push("sv.CM_Visit_Status IN ('Interested', 'Follow-up Needed')");
      conditions.push("COALESCE(sl.CM_Lead_Status, '') NOT IN ('Converted', 'Not Interested', 'Closed', 'Rejected')");
    }

    if (leadId)       { conditions.push('sv.CM_Lead_ID = ?');            params.push(leadId); }
    if (executiveId)  { conditions.push('sv.CM_Sales_Executive_ID = ?'); params.push(executiveId); }
    if (industrialId) { conditions.push('sl.CM_Industrial_ID = ?');      params.push(industrialId); }
    if (categoryId)   { conditions.push('sl.CM_Category_ID = ?');        params.push(categoryId); }
    
    if (fromDate) {
      if (pending) {
        conditions.push('sv.CM_Next_Followup_Date >= ?');
      } else {
        conditions.push('sv.CM_Visit_Date >= ?');
      }
      params.push(fromDate);
    }
    if (toDate) {
      if (pending) {
        conditions.push('sv.CM_Next_Followup_Date <= ?');
      } else {
        conditions.push('sv.CM_Visit_Date <= ?');
      }
      params.push(toDate);
    }

    if (status) { 
      const effectiveStatusExpr = "COALESCE((SELECT CM_Visit_Status FROM ccms_sales_visit WHERE CM_Lead_ID = sv.CM_Lead_ID AND CM_Is_Deleted = 0 ORDER BY CM_Visit_ID DESC LIMIT 1), sl.CM_Lead_Status)";
      if (status === 'Rejected' || status === 'Not Interested') {
        conditions.push(`(${effectiveStatusExpr}) IN ('Rejected', 'Not Interested')`);
      } else {
        conditions.push(`(${effectiveStatusExpr}) = ?`);
        params.push(status); 
      }
    }
    if (product)      { conditions.push('sv.CM_Visit_Products = ?');      params.push(product); }
    const cleanSearch = search ? String(search).trim() : '';
    if (cleanSearch) {
      conditions.push(`(
        sv.CM_Purpose           LIKE ? OR
        sv.CM_Product_Discussed LIKE ? OR
        sv.CM_Remarks           LIKE ? OR
        sl.CM_Client_Name       LIKE ? OR
        sl.CM_Company_Name      LIKE ? OR
        sl.CM_Phone             LIKE ? OR
        sv.CM_Lead_ID           LIKE ? OR
        sv.CM_Visit_ID          LIKE ?
      )`);
      const like = `%${cleanSearch}%`;
      params.push(like, like, like, like, like, like, like, like);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const [[countRow]]: any = await db.execute(
      `SELECT COUNT(*) AS total
       FROM   ccms_sales_visit sv
       JOIN   ccms_sales_lead  sl
              ON sv.CM_Lead_ID COLLATE utf8mb4_general_ci = sl.CM_Lead_ID COLLATE utf8mb4_general_ci
       ${where}`,
      params
    );
    const total = Number(countRow?.total ?? 0);

    const [visits]: any = await db.query(`
      SELECT sv.*, sl.CM_Client_Name, sl.CM_Company_Name, sl.CM_Phone, sl.CM_City, sl.CM_Lead_Status,
             u.CM_Full_Name AS Executive_Name,
             ind.CM_Industrial_Name, cat.CM_Category_Name,
             (SELECT CM_Visit_Status FROM ccms_sales_visit WHERE CM_Lead_ID = sv.CM_Lead_ID AND CM_Is_Deleted = 0 ORDER BY CM_Visit_ID DESC LIMIT 1) AS Last_Visit_Status
      FROM   ccms_sales_visit sv
      JOIN   ccms_sales_lead  sl
             ON sv.CM_Lead_ID COLLATE utf8mb4_general_ci = sl.CM_Lead_ID COLLATE utf8mb4_general_ci
      LEFT JOIN ccms_industrial ind ON sl.CM_Industrial_ID = ind.CM_Industrial_ID
      LEFT JOIN ccms_sales_category cat ON sl.CM_Category_ID = cat.CM_Category_ID
      LEFT JOIN ccms_users    u
             ON sv.CM_Sales_Executive_ID COLLATE utf8mb4_general_ci
              = u.CM_User_ID             COLLATE utf8mb4_general_ci
      ${where}
      ORDER BY sv.CM_Visit_Date DESC, sv.CM_Visit_ID DESC
      LIMIT ${limit} OFFSET ${offset}
    `, params);

    return safeJson({ visits: visits ?? [], total, page, limit, totalPages: Math.ceil(total / limit) || 1 });

  } catch (error: any) {
    console.error('[sales-visits GET]', {
      message: error.message, code: error.code,
      sqlMessage: error.sqlMessage, sql: error.sql, stack: error.stack,
    });
    return safeJson({ error: 'Failed to fetch visits', code: error.code, details: error.sqlMessage ?? error.message }, 500);
  }
}

// ─── POST ────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const method = request.nextUrl.searchParams.get('_method');
  if (method === 'PUT')    return updateVisit(request);
  if (method === 'DELETE') return deleteVisit(request);

  try {
    const db   = await getDb();
    const body = await request.json();

    if (!body.CM_Lead_ID || !body.CM_Visit_Date) {
      return NextResponse.json({ error: 'Lead ID and Visit Date are required' }, { status: 400 });
    }

    const images = (Array.isArray(body.CM_Images) && body.CM_Images.length)
      ? JSON.stringify(body.CM_Images) : null;

    await db.execute(
      `INSERT INTO ccms_sales_visit
         (CM_Visit_ID, CM_Lead_ID, CM_Sales_Executive_ID, CM_Visit_Date, CM_Visit_Time,
          CM_Purpose, CM_Product_Discussed, CM_Scope_Given, CM_Demo_Given,
          CM_Proposal_Value, CM_GST_Type, CM_Scope_Alteration, CM_Value_Alteration,
          CM_Further_Enhancement, CM_Issues_Raised, CM_Project_Handed_Over,
          CM_Trial_Version_Given, CM_Next_Followup_Date, CM_Next_Followup_Time, CM_Visit_Status, CM_Visit_Products,
          CM_Remarks, CM_Images, CM_Created_By, CM_Created_At)
       VALUES (NULL,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())`,
      [
        body.CM_Lead_ID,
        sanitize(body.CM_Sales_Executive_ID),
        toMysqlDate(body.CM_Visit_Date),
        sanitize(body.CM_Visit_Time),
        sanitize(body.CM_Purpose),
        sanitize(body.CM_Product_Discussed),
        sanitize(body.CM_Scope_Given),
        sanitize(body.CM_Demo_Given) ?? 'No',
        parseNum(body.CM_Proposal_Value),
        sanitize(body.CM_GST_Type),
        sanitize(body.CM_Scope_Alteration),
        parseNum(body.CM_Value_Alteration),
        sanitize(body.CM_Further_Enhancement),
        sanitize(body.CM_Issues_Raised),
        sanitize(body.CM_Project_Handed_Over) ?? 'No',
        sanitize(body.CM_Trial_Version_Given) ?? 'No',
        toMysqlDate(body.CM_Next_Followup_Date),
        sanitize(body.CM_Next_Followup_Time),
        sanitize(body.CM_Visit_Status) ?? 'Follow-up Needed',
        sanitize(body.CM_Visit_Products),
        sanitize(body.CM_Remarks),
        images,
        sanitize(body.CM_Created_By),
      ]
    );

    const [[row]]: any = await db.execute(
      `SELECT CM_Visit_ID FROM ccms_sales_visit ORDER BY CM_Visit_ID DESC LIMIT 1`
    );
    const newId = row?.CM_Visit_ID;

    // Auto-link newly discussed product to lead
    await ensureProductAssignedToLead(db, body.CM_Lead_ID, body.CM_Visit_Products, body.CM_Created_By, body.CM_Visit_Status);

    await recalculateLeadStatuses(db, body.CM_Lead_ID);

    await logActivity(db, body.CM_Lead_ID, 'Visit Logged', `Visit #${newId} recorded`, body.CM_Created_By);
    
    // Automatically mark attendance for creator and assigned executive
    const activeUserId = body.CM_Created_By || body.CM_Sales_Executive_ID;
    if (activeUserId) {
      await markUserAttendance(db, activeUserId, 'CRM Visit Log', body.CM_Visit_Date);
    }
    if (body.CM_Sales_Executive_ID && body.CM_Sales_Executive_ID !== activeUserId) {
      await markUserAttendance(db, body.CM_Sales_Executive_ID, 'CRM Visit Executive Assignment', body.CM_Visit_Date);
    }

    return NextResponse.json({ success: true, CM_Visit_ID: newId }, { status: 201 });

  } catch (error: any) {
    console.error('[sales-visits POST]', { message: error.message, code: error.code, sqlMessage: error.sqlMessage });
    return NextResponse.json({ error: 'Failed to create visit', details: error.sqlMessage ?? error.message }, { status: 500 });
  }
}

async function updateVisit(request: NextRequest) {
  try {
    const db   = await getDb();
    const body = await request.json();
    const { CM_Visit_ID } = body;
    if (!CM_Visit_ID) return NextResponse.json({ error: 'Visit ID required' }, { status: 400 });

    const images = (Array.isArray(body.CM_Images) && body.CM_Images.length)
      ? JSON.stringify(body.CM_Images) : null;

    await db.execute(
      `UPDATE ccms_sales_visit SET
         CM_Sales_Executive_ID = ?, CM_Visit_Date = ?, CM_Visit_Time = ?, CM_Purpose = ?,
         CM_Product_Discussed = ?, CM_Scope_Given = ?, CM_Demo_Given = ?,
         CM_Proposal_Value = ?, CM_GST_Type = ?, CM_Scope_Alteration = ?,
         CM_Value_Alteration = ?, CM_Further_Enhancement = ?, CM_Issues_Raised = ?,
         CM_Project_Handed_Over = ?, CM_Trial_Version_Given = ?,
         CM_Next_Followup_Date = ?, CM_Next_Followup_Time = ?, CM_Visit_Status = ?, CM_Visit_Products = ?, CM_Remarks = ?,
         CM_Images = COALESCE(?, CM_Images),
         CM_Updated_By = ?, CM_Updated_At = NOW()
       WHERE CM_Visit_ID = ?`,
      [
        sanitize(body.CM_Sales_Executive_ID),
        toMysqlDate(body.CM_Visit_Date),
        sanitize(body.CM_Visit_Time),
        sanitize(body.CM_Purpose),
        sanitize(body.CM_Product_Discussed),
        sanitize(body.CM_Scope_Given),
        sanitize(body.CM_Demo_Given) ?? 'No',
        parseNum(body.CM_Proposal_Value),
        sanitize(body.CM_GST_Type),
        sanitize(body.CM_Scope_Alteration),
        parseNum(body.CM_Value_Alteration),
        sanitize(body.CM_Further_Enhancement),
        sanitize(body.CM_Issues_Raised),
        sanitize(body.CM_Project_Handed_Over) ?? 'No',
        sanitize(body.CM_Trial_Version_Given) ?? 'No',
        toMysqlDate(body.CM_Next_Followup_Date),
        sanitize(body.CM_Next_Followup_Time),
        sanitize(body.CM_Visit_Status) ?? 'Follow-up Needed',
        sanitize(body.CM_Visit_Products),
        sanitize(body.CM_Remarks),
        images,
        sanitize(body.CM_Updated_By),
        CM_Visit_ID,
      ]
    );

    // Auto-link newly discussed product to lead if updated
    await ensureProductAssignedToLead(db, body.CM_Lead_ID, body.CM_Visit_Products, body.CM_Updated_By, body.CM_Visit_Status);

    await recalculateLeadStatuses(db, body.CM_Lead_ID);

    await logActivity(db, body.CM_Lead_ID, 'Visit Updated', `Visit ${CM_Visit_ID} updated`, body.CM_Updated_By);

    // Automatically mark attendance on visit update
    const updaterUserId = body.CM_Updated_By || body.CM_Sales_Executive_ID;
    if (updaterUserId) {
      await markUserAttendance(db, updaterUserId, 'CRM Visit Update', body.CM_Visit_Date);
    }
    if (body.CM_Sales_Executive_ID && body.CM_Sales_Executive_ID !== updaterUserId) {
      await markUserAttendance(db, body.CM_Sales_Executive_ID, 'CRM Visit Executive Assignment', body.CM_Visit_Date);
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('[sales-visits PUT]', { message: error.message, code: error.code, sqlMessage: error.sqlMessage });
    return NextResponse.json({ error: 'Failed to update visit', details: error.sqlMessage ?? error.message }, { status: 500 });
  }
}

async function deleteVisit(request: NextRequest) {
  try {
    const db   = await getDb();
    const body = await request.json();
    const { CM_Visit_ID, CM_Updated_By } = body;
    if (!CM_Visit_ID) return NextResponse.json({ error: 'Visit ID required' }, { status: 400 });

    const [[visit]]: any = await db.execute(`SELECT CM_Lead_ID FROM ccms_sales_visit WHERE CM_Visit_ID = ?`, [CM_Visit_ID]);
    const leadId = visit?.CM_Lead_ID;

    await db.execute(
      `UPDATE ccms_sales_visit SET CM_Is_Deleted = 1, CM_Updated_By = ?, CM_Updated_At = NOW()
       WHERE CM_Visit_ID = ?`,
      [CM_Updated_By ?? null, CM_Visit_ID]
    );

    if (leadId) {
      await recalculateLeadStatuses(db, leadId);
    }
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('[sales-visits DELETE]', { message: error.message, code: error.code });
    return NextResponse.json({ error: 'Failed to delete visit', details: error.message }, { status: 500 });
  }
}
