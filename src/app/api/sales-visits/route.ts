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

// ─── GET ─────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const q  = request.nextUrl.searchParams;

    const type        = sanitize(q.get('type'));
    const visitId     = sanitize(q.get('visitId'));
    const leadId      = sanitize(q.get('leadId'));
    const executiveId = sanitize(q.get('executiveId'));
    const status      = sanitize(q.get('status'));
    const search      = sanitize(q.get('search'));
    const fromDate    = toMysqlDate(q.get('fromDate'));
    const toDate      = toMysqlDate(q.get('toDate'));
    const page        = parsePositiveInt(q.get('page'), 1);
    const limit       = parsePositiveInt(q.get('limit'), 50);
    const offset      = (page - 1) * limit;

    // ── Pending followups ──────────────────────────────────────────────────
    if (type === 'pending-followups') {
      const [rows]: any = await db.query(`
        SELECT sv.*, sl.CM_Client_Name, sl.CM_Company_Name, sl.CM_Phone,
               u.CM_Full_Name AS Executive_Name
        FROM   ccms_sales_visit sv
        JOIN   ccms_sales_lead  sl
               ON sv.CM_Lead_ID COLLATE utf8mb4_general_ci = sl.CM_Lead_ID COLLATE utf8mb4_general_ci
        LEFT JOIN ccms_users    u
               ON sv.CM_Sales_Executive_ID COLLATE utf8mb4_general_ci
                = u.CM_User_ID             COLLATE utf8mb4_general_ci
        WHERE  sv.CM_Next_Followup_Date <= CURDATE()
          AND  sv.CM_Visit_Status IN ('Follow-up Needed','Interested','Proposal Sent')
          AND  sv.CM_Is_Deleted = 0
        ORDER BY sv.CM_Next_Followup_Date ASC
      `);
      return safeJson(rows ?? []);
    }

    // ── Single visit ───────────────────────────────────────────────────────
    if (visitId) {
      const [[visit]]: any = await db.execute(`
        SELECT sv.*, sl.CM_Client_Name, sl.CM_Company_Name, sl.CM_Phone,
               u.CM_Full_Name AS Executive_Name
        FROM   ccms_sales_visit sv
        JOIN   ccms_sales_lead  sl
               ON sv.CM_Lead_ID COLLATE utf8mb4_general_ci = sl.CM_Lead_ID COLLATE utf8mb4_general_ci
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

    if (leadId)      { conditions.push('sv.CM_Lead_ID = ?');            params.push(leadId); }
    if (executiveId) { conditions.push('sv.CM_Sales_Executive_ID = ?'); params.push(executiveId); }
    if (fromDate)    { conditions.push('sv.CM_Visit_Date >= ?');         params.push(fromDate); }
    if (toDate)      { conditions.push('sv.CM_Visit_Date <= ?');         params.push(toDate); }
    if (status)      { conditions.push('sv.CM_Visit_Status = ?');        params.push(status); }
    if (search) {
      conditions.push(`(
        sv.CM_Purpose           LIKE ? OR
        sv.CM_Product_Discussed LIKE ? OR
        sv.CM_Remarks           LIKE ? OR
        sl.CM_Client_Name       LIKE ?
      )`);
      const like = `%${search}%`;
      params.push(like, like, like, like);
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
      SELECT sv.*, sl.CM_Client_Name, sl.CM_Company_Name, sl.CM_Phone,
             u.CM_Full_Name AS Executive_Name
      FROM   ccms_sales_visit sv
      JOIN   ccms_sales_lead  sl
             ON sv.CM_Lead_ID COLLATE utf8mb4_general_ci = sl.CM_Lead_ID COLLATE utf8mb4_general_ci
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
         (CM_Visit_ID, CM_Lead_ID, CM_Sales_Executive_ID, CM_Visit_Date,
          CM_Purpose, CM_Product_Discussed, CM_Scope_Given, CM_Demo_Given,
          CM_Proposal_Value, CM_GST_Type, CM_Scope_Alteration, CM_Value_Alteration,
          CM_Further_Enhancement, CM_Issues_Raised, CM_Project_Handed_Over,
          CM_Trial_Version_Given, CM_Next_Followup_Date, CM_Visit_Status,
          CM_Remarks, CM_Images, CM_Created_By, CM_Created_At)
       VALUES (NULL,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())`,
      [
        body.CM_Lead_ID,
        sanitize(body.CM_Sales_Executive_ID),
        toMysqlDate(body.CM_Visit_Date),
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
        sanitize(body.CM_Visit_Status) ?? 'Follow-up Needed',
        sanitize(body.CM_Remarks),
        images,
        sanitize(body.CM_Created_By),
      ]
    );

    const [[row]]: any = await db.execute(
      `SELECT CM_Visit_ID FROM ccms_sales_visit ORDER BY CM_Visit_ID DESC LIMIT 1`
    );
    const newId = row?.CM_Visit_ID;

    if (body.CM_Demo_Given === 'Yes') {
      await db.execute(
        `UPDATE ccms_sales_lead SET CM_Lead_Status = 'Demo Given', CM_Updated_At = NOW()
         WHERE CM_Lead_ID = ? AND CM_Lead_Status = 'Visited'`, [body.CM_Lead_ID]
      );
    } else {
      await db.execute(
        `UPDATE ccms_sales_lead SET CM_Lead_Status = 'Visited', CM_Updated_At = NOW()
         WHERE CM_Lead_ID = ? AND CM_Lead_Status = 'New Lead'`, [body.CM_Lead_ID]
      );
    }

    await logActivity(db, body.CM_Lead_ID, 'Visit Logged', `Visit #${newId} recorded`, body.CM_Created_By);
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
         CM_Sales_Executive_ID = ?, CM_Visit_Date = ?, CM_Purpose = ?,
         CM_Product_Discussed = ?, CM_Scope_Given = ?, CM_Demo_Given = ?,
         CM_Proposal_Value = ?, CM_GST_Type = ?, CM_Scope_Alteration = ?,
         CM_Value_Alteration = ?, CM_Further_Enhancement = ?, CM_Issues_Raised = ?,
         CM_Project_Handed_Over = ?, CM_Trial_Version_Given = ?,
         CM_Next_Followup_Date = ?, CM_Visit_Status = ?, CM_Remarks = ?,
         CM_Images = COALESCE(?, CM_Images),
         CM_Updated_By = ?, CM_Updated_At = NOW()
       WHERE CM_Visit_ID = ?`,
      [
        sanitize(body.CM_Sales_Executive_ID),
        toMysqlDate(body.CM_Visit_Date),
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
        sanitize(body.CM_Visit_Status) ?? 'Follow-up Needed',
        sanitize(body.CM_Remarks),
        images,
        sanitize(body.CM_Updated_By),
        CM_Visit_ID,
      ]
    );

    await logActivity(db, body.CM_Lead_ID, 'Visit Updated', `Visit ${CM_Visit_ID} updated`, body.CM_Updated_By);
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

    await db.execute(
      `UPDATE ccms_sales_visit SET CM_Is_Deleted = 1, CM_Updated_By = ?, CM_Updated_At = NOW()
       WHERE CM_Visit_ID = ?`,
      [CM_Updated_By ?? null, CM_Visit_ID]
    );
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('[sales-visits DELETE]', { message: error.message, code: error.code });
    return NextResponse.json({ error: 'Failed to delete visit', details: error.message }, { status: 500 });
  }
}
