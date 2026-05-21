import { NextResponse, NextRequest } from 'next/server';
import getDb from '@/app/utils/db';

const sanitize = (v: any) => (v === '' || v === undefined || v === null ? null : v);
const parseNum = (v: any) => { if (v === '' || v == null) return null; const n = parseFloat(v); return isNaN(n) ? null : n; };

// Helper to format date for MySQL (YYYY-MM-DD)
const formatDbDate = (d: any) => {
  if (!d || d === '') return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  const dm = d.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (dm) return `${dm[3]}-${dm[2]}-${dm[1]}`;
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return null;
    return dt.toISOString().split('T')[0];
  } catch { return null; }
};

const formatDate = (d: any) => {
  if (!d || d === '') return null;
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  try { const dt = new Date(d); if (isNaN(dt.getTime())) return null; return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`; } catch { return null; }
};

async function logActivity(db: any, leadId: string | null, action: string, desc: string, userId: string | null) {
  try { await db.query(`INSERT INTO ccms_sales_activity_log (CM_Log_ID, CM_Lead_ID, CM_Action, CM_Description, CM_Performed_By) VALUES (NULL, ?, ?, ?, ?)`, [leadId, action, desc, userId]); } catch (e) { console.error('Log error:', e); }
}

// Helper for safe JSON response handling BigInts
function safeJsonResponse(data: any, status = 200) {
  try {
    const json = JSON.stringify(data, (key, value) =>
      typeof value === 'bigint' ? Number(value) : value
    );
    const res = new NextResponse(json, {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    });
    return res;
  } catch (err: any) {
    console.error('JSON Serialization Error:', err);
    return NextResponse.json({ error: 'Serialization Error', details: err.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const url = request.nextUrl;
    const type = url.searchParams.get('type');
    const paymentId = url.searchParams.get('paymentId');
    const leadId = url.searchParams.get('leadId');
    const status = url.searchParams.get('status');
    const fromDate = url.searchParams.get('fromDate');
    const toDate = url.searchParams.get('toDate');
    const search = url.searchParams.get('search');

    const pageVal = parseInt(url.searchParams.get('page') || '1');
    const page = isNaN(pageVal) ? 1 : Math.max(1, pageVal);
    const limitVal = parseInt(url.searchParams.get('limit') || '50');
    const limit = isNaN(limitVal) ? 50 : Math.max(1, limitVal);
    const offset = (page - 1) * limit;

    // Dashboard stats
    if (type === 'dashboard') {
      const [statsRows]: any = await db.query(`
        SELECT 
          COALESCE(SUM(CASE WHEN CM_Payment_Status = 'Paid' THEN CM_Amount ELSE 0 END), 0) AS total_collection,
          COALESCE(SUM(CASE WHEN CM_Payment_Status = 'Pending' THEN CM_Amount ELSE 0 END), 0) AS pending_amount,
          COALESCE(SUM(CASE WHEN CM_Payment_Type = 'Advance' AND CM_Payment_Status = 'Paid' THEN CM_Amount ELSE 0 END), 0) AS advance_payments,
          COALESCE(SUM(CASE WHEN CM_Payment_Type = 'Final Payment' AND CM_Payment_Status = 'Paid' THEN CM_Amount ELSE 0 END), 0) AS final_payments,
          COUNT(CASE WHEN CM_Payment_Status = 'Pending' THEN 1 END) AS pending_count,
          COUNT(CASE WHEN CM_Payment_Status = 'Paid' THEN 1 END) AS paid_count
        FROM ccms_sales_payment WHERE CM_Is_Deleted = 0
      `);
      const stats = statsRows[0] || { total_collection: 0, pending_amount: 0, advance_payments: 0, final_payments: 0, pending_count: 0, paid_count: 0 };

      const [monthly]: any = await db.query(`
        SELECT 
          DATE_FORMAT(CM_Payment_Date, '%Y-%m') AS month,
          COALESCE(SUM(CASE WHEN CM_Payment_Status = 'Paid' THEN CM_Amount ELSE 0 END), 0) AS collection
        FROM ccms_sales_payment
        WHERE CM_Is_Deleted = 0 AND CM_Payment_Date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
        GROUP BY DATE_FORMAT(CM_Payment_Date, '%Y-%m')
        ORDER BY month ASC
      `);

      return safeJsonResponse({ stats, monthly: monthly || [] });
    }

    // Payment summary for a lead
    if (type === 'lead-summary' && leadId) {
      const [summaryRows]: any = await db.query(`
        SELECT 
          COALESCE(SUM(CASE WHEN CM_Payment_Status = 'Paid' THEN CM_Amount ELSE 0 END), 0) AS total_paid,
          COALESCE(SUM(CASE WHEN CM_Payment_Status = 'Pending' THEN CM_Amount ELSE 0 END), 0) AS total_pending,
          COUNT(*) AS payment_count
        FROM ccms_sales_payment WHERE CM_Lead_ID = ? AND CM_Is_Deleted = 0
      `, [leadId]);
      const summary = summaryRows[0] || { total_paid: 0, total_pending: 0, payment_count: 0 };

      const [lead]: any = await db.query(`SELECT CM_Expected_Budget FROM ccms_sales_lead WHERE CM_Lead_ID = ?`, [leadId]);
      const budget = lead[0]?.CM_Expected_Budget || 0;
      const paid = summary.total_paid || 0;

      return safeJsonResponse({
        ...summary,
        expected_budget: budget,
        outstanding: Math.max(0, budget - paid)
      });
    }

    // Single payment
    if (paymentId) {
      const [payments]: any = await db.query(`
        SELECT sp.*, sl.CM_Client_Name, sl.CM_Company_Name
        FROM ccms_sales_payment sp
        LEFT JOIN ccms_sales_lead sl
          ON sp.CM_Lead_ID COLLATE utf8mb4_general_ci = sl.CM_Lead_ID COLLATE utf8mb4_general_ci
        WHERE sp.CM_Payment_ID = ? AND sp.CM_Is_Deleted = 0
      `, [paymentId]);
      if (!payments || !payments.length) return safeJsonResponse({ error: 'Payment not found' }, 404);
      return safeJsonResponse(payments[0]);
    }

    // Build filters
    let where = 'WHERE sp.CM_Is_Deleted = 0';
    const params: any[] = [];
    if (leadId) { where += ' AND sp.CM_Lead_ID = ?'; params.push(leadId); }
    if (status) { where += ' AND sp.CM_Payment_Status = ?'; params.push(status); }
    if (fromDate) { where += ' AND sp.CM_Payment_Date >= ?'; params.push(formatDbDate(fromDate)); }
    if (toDate) { where += ' AND sp.CM_Payment_Date <= ?'; params.push(formatDbDate(toDate)); }
    if (search) {
      where += ' AND (sp.CM_Reference_Number LIKE ? OR sp.CM_Remarks LIKE ? OR sl.CM_Client_Name LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    const [[countRow]]: any = await db.execute(
      `SELECT COUNT(*) AS total
       FROM   ccms_sales_payment sp
       LEFT JOIN ccms_sales_lead sl
         ON sp.CM_Lead_ID COLLATE utf8mb4_general_ci = sl.CM_Lead_ID COLLATE utf8mb4_general_ci
       ${where}`,
      params
    );
    const total = Number(countRow?.total ?? 0);

    const [payments]: any = await db.query(`
      SELECT sp.*, sl.CM_Client_Name, sl.CM_Company_Name, sl.CM_Phone
      FROM   ccms_sales_payment sp
      LEFT JOIN ccms_sales_lead sl
        ON sp.CM_Lead_ID COLLATE utf8mb4_general_ci = sl.CM_Lead_ID COLLATE utf8mb4_general_ci
      ${where}
      ORDER BY sp.CM_Payment_Date DESC, sp.CM_Payment_ID DESC
      LIMIT ${limit} OFFSET ${offset}
    `, params);

    return safeJsonResponse({
      payments: payments || [],
      total,
      page,
      limit,
      totalPages: limit > 0 ? Math.ceil(total / limit) : 1
    });
  } catch (error: any) {
    console.error('Error fetching payments:', error);
    return safeJsonResponse({
      error: 'Failed to fetch payments',
      details: error.message,
      code: error.code,
      sql: error.sql
    }, 500);
  }
}

export async function POST(request: NextRequest) {
  const method = request.nextUrl.searchParams.get('_method');
  if (method === 'PUT') return updatePayment(request);
  if (method === 'DELETE') return deletePayment(request);

  try {
    const db = await getDb();
    const body = await request.json();

    if (!body.CM_Lead_ID || !body.CM_Payment_Date || !body.CM_Amount) {
      return NextResponse.json({ error: 'Lead ID, Payment Date, and Amount are required' }, { status: 400 });
    }

    await db.query(
      `INSERT INTO ccms_sales_payment (
        CM_Payment_ID, CM_Lead_ID, CM_Payment_Date, CM_Payment_Type,
        CM_Amount, CM_Payment_Mode, CM_Reference_Number, CM_Payment_Status,
        CM_Receipt_URL, CM_Remarks, CM_Created_By, CM_Created_At
      ) VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        body.CM_Lead_ID,
        formatDate(body.CM_Payment_Date),
        sanitize(body.CM_Payment_Type) || 'Advance',
        parseNum(body.CM_Amount),
        sanitize(body.CM_Payment_Mode),
        sanitize(body.CM_Reference_Number),
        sanitize(body.CM_Payment_Status) || 'Pending',
        sanitize(body.CM_Receipt_URL),
        sanitize(body.CM_Remarks),
        sanitize(body.CM_Created_By)
      ]
    );

    const [rows]: any = await db.query(`SELECT CM_Payment_ID FROM ccms_sales_payment ORDER BY CM_Created_At DESC LIMIT 1`);
    const newId = rows[0]?.CM_Payment_ID;

    await logActivity(db, body.CM_Lead_ID, 'Payment Added', `Payment ${newId} of ₹${body.CM_Amount} recorded`, body.CM_Created_By);

    return NextResponse.json({ success: true, CM_Payment_ID: newId }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating payment:', error);
    return NextResponse.json({ error: 'Failed to create payment', details: error.sqlMessage || error.message }, { status: 500 });
  }
}

async function updatePayment(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();
    const { CM_Payment_ID } = body;
    if (!CM_Payment_ID) return NextResponse.json({ error: 'Payment ID required' }, { status: 400 });

    await db.query(
      `UPDATE ccms_sales_payment SET
        CM_Payment_Date = ?, CM_Payment_Type = ?, CM_Amount = ?,
        CM_Payment_Mode = ?, CM_Reference_Number = ?, CM_Payment_Status = ?,
        CM_Receipt_URL = COALESCE(?, CM_Receipt_URL), CM_Remarks = ?,
        CM_Updated_By = ?, CM_Updated_At = NOW()
      WHERE CM_Payment_ID = ?`,
      [
        formatDate(body.CM_Payment_Date),
        sanitize(body.CM_Payment_Type) || 'Advance',
        parseNum(body.CM_Amount),
        sanitize(body.CM_Payment_Mode),
        sanitize(body.CM_Reference_Number),
        sanitize(body.CM_Payment_Status) || 'Pending',
        sanitize(body.CM_Receipt_URL),
        sanitize(body.CM_Remarks),
        sanitize(body.CM_Updated_By),
        CM_Payment_ID
      ]
    );

    await logActivity(db, body.CM_Lead_ID, 'Payment Updated', `Payment ${CM_Payment_ID} updated`, body.CM_Updated_By);
    return NextResponse.json({ success: true, message: 'Payment updated' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update payment', details: error.sqlMessage || error.message }, { status: 500 });
  }
}

async function deletePayment(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();
    const { CM_Payment_ID, CM_Updated_By } = body;
    if (!CM_Payment_ID) return NextResponse.json({ error: 'Payment ID required' }, { status: 400 });

    await db.query(`UPDATE ccms_sales_payment SET CM_Is_Deleted = 1, CM_Updated_By = ?, CM_Updated_At = NOW() WHERE CM_Payment_ID = ?`, [CM_Updated_By, CM_Payment_ID]);
    return NextResponse.json({ success: true, message: 'Payment deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed', details: error.message }, { status: 500 });
  }
}
