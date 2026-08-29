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
    const amcId = url.searchParams.get('amcId');
    const leadId = url.searchParams.get('leadId');
    const status = url.searchParams.get('status');
    const type = url.searchParams.get('type');
    const search = url.searchParams.get('search');
    const expiring = url.searchParams.get('expiring');
    const fromDate = url.searchParams.get('fromDate');
    const toDate = url.searchParams.get('toDate');

    const pageVal = parseInt(url.searchParams.get('page') || '1');
    const page = isNaN(pageVal) ? 1 : Math.max(1, pageVal);
    const limitVal = parseInt(url.searchParams.get('limit') || '50');
    const limit = isNaN(limitVal) ? 50 : Math.max(1, limitVal);
    const offset = (page - 1) * limit;

    // Single AMC Record
    if (amcId) {
      const [rows]: any = await db.query(`
        SELECT sa.*, sl.CM_Client_Name, sl.CM_Company_Name
        FROM ccms_sales_amc sa
        LEFT JOIN ccms_sales_lead sl
          ON sa.CM_Lead_ID COLLATE utf8mb4_general_ci = sl.CM_Lead_ID COLLATE utf8mb4_general_ci
        WHERE sa.CM_AMC_ID = ? AND sa.CM_Is_Deleted = 0
      `, [amcId]);
      if (!rows || !rows.length) return safeJsonResponse({ error: 'AMC record not found' }, 404);
      return safeJsonResponse(rows[0]);
    }

    // Build query filters
    let where = 'WHERE sa.CM_Is_Deleted = 0';
    const params: any[] = [];

    if (leadId) {
      where += ' AND sa.CM_Lead_ID = ?';
      params.push(leadId);
    }
    if (status) {
      where += ' AND sa.CM_Status = ?';
      params.push(status);
    }
    if (type) {
      where += ' AND sa.CM_AMC_Type = ?';
      params.push(type);
    }
    if (expiring === 'true') {
      where += ' AND sa.CM_Status = ? AND sa.CM_Expiry_Date <= DATE_ADD(CURDATE(), INTERVAL 10 DAY)';
      params.push('Pending');
    }
    if (fromDate) {
      where += ' AND sa.CM_Expiry_Date >= ?';
      params.push(formatDbDate(fromDate));
    }
    if (toDate) {
      where += ' AND sa.CM_Expiry_Date <= ?';
      params.push(formatDbDate(toDate));
    }
    if (search) {
      where += ' AND (sa.CM_Domain_Link LIKE ? OR sl.CM_Client_Name LIKE ? OR sl.CM_Company_Name LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    // Get Total Count
    const [[countRow]]: any = await db.execute(`
      SELECT COUNT(*) AS total
      FROM ccms_sales_amc sa
      LEFT JOIN ccms_sales_lead sl
        ON sa.CM_Lead_ID COLLATE utf8mb4_general_ci = sl.CM_Lead_ID COLLATE utf8mb4_general_ci
      ${where}
    `, params);
    const total = Number(countRow?.total ?? 0);

    // Get List Rows
    const [rows]: any = await db.query(`
      SELECT sa.*, sl.CM_Client_Name, sl.CM_Company_Name, sl.CM_Phone
      FROM ccms_sales_amc sa
      LEFT JOIN ccms_sales_lead sl
        ON sa.CM_Lead_ID COLLATE utf8mb4_general_ci = sl.CM_Lead_ID COLLATE utf8mb4_general_ci
      ${where}
      ORDER BY sa.CM_Expiry_Date ASC, sa.CM_AMC_ID DESC
      LIMIT ${limit} OFFSET ${offset}
    `, params);

    // Fetch dashboard-like statistics (summary) for AMC
    let statsWhere = 'WHERE CM_Is_Deleted = 0';
    const statsParams: any[] = [];
    if (type) {
      statsWhere += ' AND CM_AMC_Type = ?';
      statsParams.push(type);
    }
    if (fromDate) {
      statsWhere += ' AND CM_Expiry_Date >= ?';
      statsParams.push(formatDbDate(fromDate));
    }
    if (toDate) {
      statsWhere += ' AND CM_Expiry_Date <= ?';
      statsParams.push(formatDbDate(toDate));
    }

    const [statsRows]: any = await db.query(`
      SELECT 
        COUNT(*) AS total_count,
        COALESCE(SUM(CM_Amount), 0) AS total_amount,
        COALESCE(SUM(CASE WHEN CM_Status = 'Paid' THEN CM_Amount ELSE 0 END), 0) AS paid_amount,
        COALESCE(SUM(CASE WHEN CM_Status = 'Pending' THEN CM_Amount ELSE 0 END), 0) AS pending_amount,
        COUNT(CASE WHEN CM_Status = 'Pending' AND CM_Expiry_Date <= DATE_ADD(CURDATE(), INTERVAL 10 DAY) THEN 1 END) AS expiring_count
      FROM ccms_sales_amc
      ${statsWhere}
    `, statsParams);
    const stats = statsRows[0] || { total_count: 0, total_amount: 0, paid_amount: 0, pending_amount: 0, expiring_count: 0 };

    return safeJsonResponse({
      amcs: rows || [],
      total,
      stats,
      page,
      limit,
      totalPages: limit > 0 ? Math.ceil(total / limit) : 1
    });
  } catch (error: any) {
    console.error('Error fetching AMCs:', error);
    return safeJsonResponse({
      error: 'Failed to fetch AMC records',
      details: error.message
    }, 500);
  }
}

export async function POST(request: NextRequest) {
  const method = request.nextUrl.searchParams.get('_method');
  if (method === 'PUT') return updateAmc(request);
  if (method === 'DELETE') return deleteAmc(request);

  try {
    const db = await getDb();
    const body = await request.json();

    if (!body.CM_Lead_ID || !body.CM_Start_Date || !body.CM_Expiry_Date || !body.CM_Amount) {
      return NextResponse.json({ error: 'Lead ID, Start Date, Expiry Date, and Amount are required' }, { status: 400 });
    }

    const [result]: any = await db.query(
      `INSERT INTO ccms_sales_amc (
        CM_AMC_ID, CM_Lead_ID, CM_Domain_Link, CM_Start_Date,
        CM_Expiry_Date, CM_Amount, CM_Status, CM_AMC_Type, CM_Created_By, CM_Created_At
      ) VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        body.CM_Lead_ID,
        sanitize(body.CM_Domain_Link),
        formatDbDate(body.CM_Start_Date),
        formatDbDate(body.CM_Expiry_Date),
        parseNum(body.CM_Amount),
        sanitize(body.CM_Status) || 'Pending',
        sanitize(body.CM_AMC_Type) || 'Website',
        sanitize(body.CM_Created_By)
      ]
    );

    const newId = result.insertId;
    return NextResponse.json({ success: true, CM_AMC_ID: newId }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating AMC:', error);
    return NextResponse.json({ error: 'Failed to create AMC record', details: error.sqlMessage || error.message }, { status: 500 });
  }
}

async function updateAmc(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();
    const { CM_AMC_ID } = body;
    if (!CM_AMC_ID) return NextResponse.json({ error: 'AMC ID is required' }, { status: 400 });

    await db.query(
      `UPDATE ccms_sales_amc SET
        CM_Lead_ID = ?, CM_Domain_Link = ?, CM_Start_Date = ?, CM_Expiry_Date = ?,
        CM_Amount = ?, CM_Status = ?, CM_AMC_Type = ?, CM_Updated_By = ?, CM_Updated_At = NOW()
      WHERE CM_AMC_ID = ?`,
      [
        body.CM_Lead_ID,
        sanitize(body.CM_Domain_Link),
        formatDbDate(body.CM_Start_Date),
        formatDbDate(body.CM_Expiry_Date),
        parseNum(body.CM_Amount),
        sanitize(body.CM_Status) || 'Pending',
        sanitize(body.CM_AMC_Type) || 'Website',
        sanitize(body.CM_Updated_By),
        CM_AMC_ID
      ]
    );

    return NextResponse.json({ success: true, message: 'AMC record updated' });
  } catch (error: any) {
    console.error('Error updating AMC:', error);
    return NextResponse.json({ error: 'Failed to update AMC record', details: error.sqlMessage || error.message }, { status: 500 });
  }
}

async function deleteAmc(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();
    const { CM_AMC_ID, CM_Updated_By } = body;
    if (!CM_AMC_ID) return NextResponse.json({ error: 'AMC ID is required' }, { status: 400 });

    await db.query(`
      UPDATE ccms_sales_amc 
      SET CM_Is_Deleted = 1, CM_Updated_By = ?, CM_Updated_At = NOW() 
      WHERE CM_AMC_ID = ?
    `, [CM_Updated_By, CM_AMC_ID]);
    return NextResponse.json({ success: true, message: 'AMC record deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete AMC record', details: error.message }, { status: 500 });
  }
}
