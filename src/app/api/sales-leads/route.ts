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

// Helper to log activity
async function logActivity(db: any, leadId: unknown, action: string, desc: string, userId: unknown) {
  try {
    await db.query(
      `INSERT INTO ccms_sales_activity_log (CM_Log_ID, CM_Lead_ID, CM_Action, CM_Description, CM_Performed_By)
       VALUES (NULL,?,?,?,?)`,
      [leadId || null, action, desc, userId || null]
    );
  } catch (e) {
    console.error('logActivity error:', e);
  }
}

async function markUserAttendance(db: any, userId: any, description: string) {
  if (!userId) return;
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // 1. Get user info
    const [userRows]: any = await db.query(
      `SELECT CM_Company_ID, CM_Labor_Type_ID FROM ccms_users WHERE CM_User_ID = ?`,
      [userId]
    );
    if (!userRows || userRows.length === 0) return;
    
    const { CM_Company_ID, CM_Labor_Type_ID } = userRows[0];
    if (!CM_Company_ID || !CM_Labor_Type_ID) return; // User is not linked to labor/company
    
    // 2. Check if attendance already exists today
    const [existingAttendanceRows]: any = await db.query(
      `SELECT CM_Attendance_ID FROM ccms_attendance 
       WHERE CM_Labor_ID = ? AND CM_Attendance_Date = ?`,
      [CM_Labor_Type_ID, today]
    );
    
    // 3. If no attendance exists, mark as present
    if (!existingAttendanceRows || existingAttendanceRows.length === 0) {
      await db.query(
        `INSERT INTO ccms_attendance 
          (CM_Company_ID, CM_Project_ID, CM_Labor_ID, CM_Attendance_Date, CM_Status, CM_Total_Working_Hours, CM_Remarks, CM_Created_At, CM_Created_By)
         VALUES (?, 0, ?, ?, 'Present', 8, ?, NOW(), ?)`,
        [
          CM_Company_ID,
          CM_Labor_Type_ID,
          today,
          `Automatically marked Present via ${description}`,
          userId
        ]
      );
      console.log(`Automated attendance for ${CM_Labor_Type_ID}`);
    }
  } catch (error) {
    console.error('Failed to mark user attendance automatically:', error);
  }
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
    const leadId = url.searchParams.get('leadId');
    const status = url.searchParams.get('status');
    const executiveId = url.searchParams.get('executiveId');
    const industrialId = url.searchParams.get('industrialId');
    const categoryId = url.searchParams.get('categoryId');
    const search = url.searchParams.get('search');
    const fromDate = url.searchParams.get('fromDate');
    const toDate = url.searchParams.get('toDate');

    const pageVal = parseInt(url.searchParams.get('page') || '1');
    const page = isNaN(pageVal) ? 1 : Math.max(1, pageVal);
    const limitVal = parseInt(url.searchParams.get('limit') || '50');
    const limit = isNaN(limitVal) ? 50 : Math.max(1, limitVal);
    const offset = (page - 1) * limit;

    // Dashboard stats
    if (type === 'dashboard') {
      const fDate = fromDate ? formatDbDate(fromDate) : null;
      const tDate = toDate ? formatDbDate(toDate) : null;

      // Build params in the exact order the SQL placeholders appear:
      // Each subquery has >= fDate then <= tDate, so we interleave them
      const statsParams: any[] = [];
      for (let i = 0; i < 6; i++) {
        if (fDate) statsParams.push(fDate);
        if (tDate) statsParams.push(tDate);
      }

      const [statsRows]: any = await db.query(`
    SELECT 
      (SELECT COUNT(*) 
       FROM ccms_sales_lead 
       WHERE CM_Is_Deleted = 0
         ${fDate ? "AND DATE(CM_Created_At) >= ?" : ""}
         ${tDate ? "AND DATE(CM_Created_At) <= ?" : ""}) AS total_leads,

      (SELECT COUNT(*) 
       FROM ccms_sales_lead 
       WHERE CM_Lead_Status = 'New Lead' 
         AND CM_Is_Deleted = 0
         ${fDate ? "AND DATE(CM_Created_At) >= ?" : ""}
         ${tDate ? "AND DATE(CM_Created_At) <= ?" : ""}) AS new_leads,

      (SELECT COUNT(*) 
       FROM ccms_sales_lead 
       WHERE CM_Lead_Status = 'Converted' 
         AND CM_Is_Deleted = 0
         ${fDate ? "AND DATE(CM_Created_At) >= ?" : ""}
         ${tDate ? "AND DATE(CM_Created_At) <= ?" : ""}) AS converted_leads,

      (SELECT COUNT(*) 
       FROM ccms_sales_lead 
       WHERE CM_Lead_Status IN ('Rejected', 'Not Interested') 
         AND CM_Is_Deleted = 0
         ${fDate ? "AND DATE(CM_Created_At) >= ?" : ""}
         ${tDate ? "AND DATE(CM_Created_At) <= ?" : ""}) AS rejected_leads,

      (SELECT COUNT(*) 
       FROM ccms_sales_lead 
       WHERE CM_Lead_Status = 'On Hold' 
         AND CM_Is_Deleted = 0
         ${fDate ? "AND DATE(CM_Created_At) >= ?" : ""}
         ${tDate ? "AND DATE(CM_Created_At) <= ?" : ""}) AS on_hold_leads,

      (SELECT COUNT(*) 
       FROM ccms_sales_lead 
       WHERE CM_Lead_Status = 'Proposal Sent' 
         AND CM_Is_Deleted = 0
         ${fDate ? "AND DATE(CM_Created_At) >= ?" : ""}
         ${tDate ? "AND DATE(CM_Created_At) <= ?" : ""}) AS proposal_sent
      `, statsParams);

      const stats =
        statsRows[0] || {
          total_leads: 0,
          new_leads: 0,
          converted_leads: 0,
          rejected_leads: 0,
          on_hold_leads: 0,
          proposal_sent: 0,
        };

      Object.keys(stats).forEach((key) => {
        stats[key] = Number(stats[key] || 0);
      });

      // Pending / Upcoming Followups (latest visit only)
      const [followups]: any = await db.query(`
    SELECT
      v.*,
      l.CM_Client_Name,
      l.CM_Company_Name,
      l.CM_Lead_Status,
      u.CM_Full_Name AS Executive_Name
    FROM ccms_sales_visit v
    INNER JOIN (
      SELECT
        CM_Lead_ID,
        MAX(CM_Visit_Date) AS LastVisitDate
      FROM ccms_sales_visit
      WHERE CM_Is_Deleted = 0
      GROUP BY CM_Lead_ID
    ) lv
      ON v.CM_Lead_ID = lv.CM_Lead_ID
      AND v.CM_Visit_Date = lv.LastVisitDate

    LEFT JOIN ccms_sales_lead l
      ON v.CM_Lead_ID COLLATE utf8mb4_general_ci =
         l.CM_Lead_ID COLLATE utf8mb4_general_ci

    LEFT JOIN ccms_users u
      ON v.CM_Sales_Executive_ID COLLATE utf8mb4_general_ci =
         u.CM_User_ID COLLATE utf8mb4_general_ci

    WHERE v.CM_Is_Deleted = 0
      AND v.CM_Next_Followup_Date <= DATE_ADD(CURDATE(), INTERVAL 2 DAY)
      AND v.CM_Visit_Status NOT IN ('Converted', 'Not Interested', 'Closed', 'Rejected')
      AND COALESCE(l.CM_Lead_Status, '') NOT IN ('Converted', 'Not Interested', 'Closed', 'Rejected')

    ORDER BY v.CM_Next_Followup_Date ASC
  `);

      // Overdue Followup Count (latest visit only)
      const [overdueRows]: any = await db.query(`
    SELECT COUNT(*) AS pending_followups
    FROM ccms_sales_visit v
    INNER JOIN (
      SELECT
        CM_Lead_ID,
        MAX(CM_Visit_Date) AS LastVisitDate
      FROM ccms_sales_visit
      WHERE CM_Is_Deleted = 0
      GROUP BY CM_Lead_ID
    ) lv
      ON v.CM_Lead_ID = lv.CM_Lead_ID
      AND v.CM_Visit_Date = lv.LastVisitDate

    LEFT JOIN ccms_sales_lead l
      ON v.CM_Lead_ID COLLATE utf8mb4_general_ci =
         l.CM_Lead_ID COLLATE utf8mb4_general_ci

    WHERE v.CM_Is_Deleted = 0
      AND v.CM_Next_Followup_Date < CURDATE()
      AND v.CM_Visit_Status NOT IN ('Converted', 'Not Interested', 'Closed', 'Rejected')
      AND COALESCE(l.CM_Lead_Status, '') NOT IN ('Converted', 'Not Interested', 'Closed', 'Rejected')
  `);

      stats.pending_followups = Number(
        overdueRows?.[0]?.pending_followups || 0
      );

      // Finance Stats
      const financeParams: any[] = [];
      if (fDate) financeParams.push(fDate);
      if (tDate) financeParams.push(tDate);

      const [financesRows]: any = await db.query(`
    SELECT 
      SUM(
        CASE 
          WHEN CM_Payment_Status = 'Paid' 
          THEN CM_Amount 
          ELSE 0 
        END
      ) AS total_collection,

      SUM(
        CASE 
          WHEN CM_Payment_Status = 'Pending' 
          THEN CM_Amount 
          ELSE 0 
        END
      ) AS pending_payments

    FROM ccms_sales_payment
    WHERE CM_Is_Deleted = 0
      ${fDate ? "AND DATE(CM_Payment_Date) >= ?" : ""}
      ${tDate ? "AND DATE(CM_Payment_Date) <= ?" : ""}
  `, financeParams);

      const finances = financesRows[0] || {
        total_collection: 0,
        pending_payments: 0,
      };

      // Top Executives
      const execParams: any[] = [];
      if (fDate) execParams.push(fDate);
      if (tDate) execParams.push(tDate);

      const [topExecs]: any = await db.query(`
    SELECT
      u.CM_User_ID,
      u.CM_Full_Name,
      COUNT(sl.CM_Lead_ID) AS lead_count,
      SUM(
        CASE
          WHEN sl.CM_Lead_Status = 'Converted'
          THEN 1
          ELSE 0
        END
      ) AS converted

    FROM ccms_users u
    INNER JOIN ccms_sales_lead sl
      ON u.CM_User_ID COLLATE utf8mb4_general_ci =
         sl.CM_Sales_Executive_ID COLLATE utf8mb4_general_ci

    WHERE sl.CM_Is_Deleted = 0
      ${fDate ? "AND DATE(sl.CM_Created_At) >= ?" : ""}
      ${tDate ? "AND DATE(sl.CM_Created_At) <= ?" : ""}

    GROUP BY
      u.CM_User_ID,
      u.CM_Full_Name

    ORDER BY converted DESC, lead_count DESC
  `, execParams);

      // Today's Visits
      const [todayVisitsRow]: any = await db.query(`
    SELECT COUNT(*) AS count
    FROM ccms_sales_visit
    WHERE CM_Visit_Date = CURDATE()
      AND CM_Is_Deleted = 0
  `);

      // Trend data query - join with visits to get proposal and converted counts
      const trendParams: any[] = [];
      if (fDate) trendParams.push(fDate);
      if (tDate) trendParams.push(tDate);

      const [trendRows]: any = await db.query(`
        SELECT 
          DATE(sl.CM_Created_At) as date,
          COUNT(*) as total_leads,
          SUM(CASE WHEN cv.converted_count > 0 THEN 1 ELSE 0 END) as converted_leads,
          SUM(COALESCE(pv.proposal_count, 0)) as proposal_sent
        FROM ccms_sales_lead sl
        LEFT JOIN (
          SELECT 
            CM_Lead_ID,
            COUNT(*) as proposal_count
          FROM ccms_sales_visit
          WHERE CM_Visit_Status = 'Proposal Sent'
            AND CM_Is_Deleted = 0
          GROUP BY CM_Lead_ID
        ) pv ON sl.CM_Lead_ID COLLATE utf8mb4_general_ci = pv.CM_Lead_ID COLLATE utf8mb4_general_ci
        LEFT JOIN (
          SELECT 
            CM_Lead_ID,
            COUNT(*) as converted_count
          FROM ccms_sales_visit
          WHERE CM_Visit_Status = 'Converted'
            AND CM_Is_Deleted = 0
          GROUP BY CM_Lead_ID
        ) cv ON sl.CM_Lead_ID COLLATE utf8mb4_general_ci = cv.CM_Lead_ID COLLATE utf8mb4_general_ci
        WHERE sl.CM_Is_Deleted = 0
          ${fDate ? "AND DATE(sl.CM_Created_At) >= ?" : ""}
          ${tDate ? "AND DATE(sl.CM_Created_At) <= ?" : ""}
        GROUP BY DATE(sl.CM_Created_At)
        ORDER BY date ASC
      `, trendParams);

      // Product wise counts query
      const productParams: any[] = [];
      if (fDate) productParams.push(fDate);
      if (tDate) productParams.push(tDate);

      const [productRows]: any = await db.query(`
        SELECT 
          COALESCE(NULLIF(TRIM(CM_Product_Required), ''), 'Not Specified') as product,
          COUNT(*) as count
        FROM ccms_sales_lead
        WHERE CM_Is_Deleted = 0
          ${fDate ? "AND DATE(CM_Created_At) >= ?" : ""}
          ${tDate ? "AND DATE(CM_Created_At) <= ?" : ""}
        GROUP BY COALESCE(NULLIF(TRIM(CM_Product_Required), ''), 'Not Specified')
        ORDER BY count DESC
        LIMIT 10
      `, productParams);

      // Client Financials
      const clientFinParams: any[] = [];
      if (fDate) clientFinParams.push(fDate);
      if (tDate) clientFinParams.push(tDate);

      const [clientFinRows]: any = await db.query(`
        SELECT 
          COALESCE(NULLIF(TRIM(l.CM_Company_Name), ''), l.CM_Client_Name) AS clientName,
          COALESCE(l.CM_Expected_Budget, 0) AS projectCost,
          COALESCE((
            SELECT SUM(p.CM_Amount) 
            FROM ccms_sales_payment p 
            WHERE p.CM_Lead_ID = l.CM_Lead_ID 
              AND p.CM_Is_Deleted = 0 
              AND p.CM_Payment_Status = 'Paid'
          ), 0) AS paidAmount
        FROM ccms_sales_lead l
        WHERE l.CM_Is_Deleted = 0 AND l.CM_Lead_Status = 'Converted'
          ${fDate ? "AND DATE(l.CM_Created_At) >= ?" : ""}
          ${tDate ? "AND DATE(l.CM_Created_At) <= ?" : ""}
        HAVING projectCost > 0 OR paidAmount > 0
        ORDER BY projectCost DESC
        LIMIT 15
      `, clientFinParams);

      const clientFinancials = (clientFinRows || []).map((r: any) => ({
        name: r.clientName || 'Unknown',
        projectCost: Number(r.projectCost),
        paidAmount: Number(r.paidAmount),
        payable: Math.max(0, Number(r.projectCost) - Number(r.paidAmount))
      }));

      return safeJsonResponse({
        stats,
        pendingFollowups: followups || [],
        totalCollection: Number(finances.total_collection || 0),
        pendingPayments: Number(finances.pending_payments || 0),
        topExecutives: topExecs || [],
        todayVisits: Number(todayVisitsRow?.[0]?.count || 0),
        trend: trendRows || [],
        productWise: productRows || [],
        clientFinancials
      });
    }
    // Sales executives list
    if (type === 'executives') {
      const [executives] = await db.query(
        `SELECT CM_User_ID, CM_Full_Name FROM ccms_users ORDER BY CM_Full_Name ASC`
      );
      return safeJsonResponse(executives);
    }

    // Single lead
    if (leadId) {
      const [leads]: any = await db.query(`
        SELECT sl.*, u.CM_Full_Name AS Executive_Name,
          ind.CM_Industrial_Name, cat.CM_Category_Name, sub.CM_Subcategory_Name
        FROM ccms_sales_lead sl
        LEFT JOIN ccms_users u ON sl.CM_Sales_Executive_ID COLLATE utf8mb4_general_ci = u.CM_User_ID COLLATE utf8mb4_general_ci
        LEFT JOIN ccms_industrial ind ON sl.CM_Industrial_ID = ind.CM_Industrial_ID
        LEFT JOIN ccms_sales_category cat ON sl.CM_Category_ID = cat.CM_Category_ID
        LEFT JOIN ccms_sales_subcategory sub ON sl.CM_Subcategory_ID = sub.CM_Subcategory_ID
        WHERE sl.CM_Lead_ID = ? AND sl.CM_Is_Deleted = 0
      `, [leadId]);

      if (!leads || leads.length === 0) {
        return safeJsonResponse({ error: 'Lead not found' }, 404);
      }

      // Fetch visits for this lead
      const [visits] = await db.query(`
        SELECT sv.*, u.CM_Full_Name AS Executive_Name 
        FROM ccms_sales_visit sv
        LEFT JOIN ccms_users u ON sv.CM_Sales_Executive_ID COLLATE utf8mb4_general_ci = u.CM_User_ID COLLATE utf8mb4_general_ci
        WHERE sv.CM_Lead_ID = ? AND sv.CM_Is_Deleted = 0
        ORDER BY sv.CM_Visit_Date DESC
      `, [leadId]);

      // Fetch payments for this lead
      const [payments] = await db.query(`
        SELECT * FROM ccms_sales_payment 
        WHERE CM_Lead_ID = ? AND CM_Is_Deleted = 0
        ORDER BY CM_Payment_Date DESC
      `, [leadId]);

      // Fetch activity log
      const [activities] = await db.query(`
        SELECT sal.*, u.CM_Full_Name AS Performed_By_Name
        FROM ccms_sales_activity_log sal
        LEFT JOIN ccms_users u ON sal.CM_Performed_By COLLATE utf8mb4_general_ci = u.CM_User_ID COLLATE utf8mb4_general_ci
        WHERE sal.CM_Lead_ID = ?
        ORDER BY sal.CM_Created_At DESC
        LIMIT 50
      `, [leadId]);

      return safeJsonResponse({ lead: leads[0], visits: visits || [], payments: payments || [], activities: activities || [] });
    }

    // List leads with filters
    let whereClause = 'WHERE sl.CM_Is_Deleted = 0';
    const params: any[] = [];

    if (status) {
      if (status === 'Rejected' || status === 'Not Interested') {
        whereClause += " AND sl.CM_Lead_Status IN ('Rejected', 'Not Interested')";
      } else {
        whereClause += ' AND sl.CM_Lead_Status = ?';
        params.push(status);
      }
    }
    if (executiveId) { whereClause += ' AND sl.CM_Sales_Executive_ID = ?'; params.push(executiveId); }
    if (industrialId) { whereClause += ' AND sl.CM_Industrial_ID = ?'; params.push(industrialId); }
    if (categoryId) { whereClause += ' AND sl.CM_Category_ID = ?'; params.push(categoryId); }
    if (fromDate) { whereClause += ' AND DATE(sl.CM_Created_At) >= ?'; params.push(formatDbDate(fromDate)); }
    if (toDate) { whereClause += ' AND DATE(sl.CM_Created_At) <= ?'; params.push(formatDbDate(toDate)); }
    if (search) {
      whereClause += ' AND (sl.CM_Client_Name LIKE ? OR sl.CM_Company_Name LIKE ? OR sl.CM_Phone LIKE ? OR sl.CM_Email LIKE ? OR sl.CM_Lead_ID LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s, s);
    }

    // Count total
    const [countResult]: any = await db.query(
      `SELECT COUNT(*) AS total FROM ccms_sales_lead sl ${whereClause}`, params
    );
    const total = Number(countResult?.[0]?.total || 0);

    // Fetch paginated leads with optimized joins
    const [leads]: any = await db.query(`
      SELECT sl.*, u.CM_Full_Name AS Executive_Name,
        ind.CM_Industrial_Name, cat.CM_Category_Name, sub.CM_Subcategory_Name,
        COALESCE(v.v_count, 0) AS visit_count,
        COALESCE(p.p_sum, 0) AS total_paid
      FROM ccms_sales_lead sl
      LEFT JOIN ccms_users u ON sl.CM_Sales_Executive_ID COLLATE utf8mb4_general_ci = u.CM_User_ID COLLATE utf8mb4_general_ci
      LEFT JOIN ccms_industrial ind ON sl.CM_Industrial_ID = ind.CM_Industrial_ID
      LEFT JOIN ccms_sales_category cat ON sl.CM_Category_ID = cat.CM_Category_ID
      LEFT JOIN ccms_sales_subcategory sub ON sl.CM_Subcategory_ID = sub.CM_Subcategory_ID
      LEFT JOIN (
        SELECT CM_Lead_ID COLLATE utf8mb4_general_ci AS CM_Lead_ID, COUNT(*) AS v_count 
        FROM ccms_sales_visit 
        WHERE CM_Is_Deleted = 0 
        GROUP BY CM_Lead_ID
      ) v ON sl.CM_Lead_ID COLLATE utf8mb4_general_ci = v.CM_Lead_ID
      LEFT JOIN (
        SELECT CM_Lead_ID COLLATE utf8mb4_general_ci AS CM_Lead_ID, SUM(CM_Amount) AS p_sum 
        FROM ccms_sales_payment 
        WHERE CM_Payment_Status = 'Paid' AND CM_Payment_Type != 'Domain Payment' AND CM_Is_Deleted = 0 
        GROUP BY CM_Lead_ID
      ) p ON sl.CM_Lead_ID COLLATE utf8mb4_general_ci = p.CM_Lead_ID
      ${whereClause}
      ORDER BY sl.CM_Created_At DESC, sl.CM_Lead_ID DESC
      LIMIT ${limit} OFFSET ${offset}
    `, params);

    return safeJsonResponse({
      leads: leads || [],
      total,
      page,
      limit,
      totalPages: limit > 0 ? Math.ceil(total / limit) : 1
    });
  } catch (error: any) {
    console.error('Error fetching leads:', error);
    return safeJsonResponse({
      error: 'Failed to fetch leads',
      details: error.message,
      code: error.code,
      sql: error.sql,
      stack: error.stack
    }, 500);
  }
}

export async function POST(request: NextRequest) {
  const method = request.nextUrl.searchParams.get('_method');
  if (method === 'PUT') return updateLead(request);
  if (method === 'DELETE') return deleteLead(request);

  try {
    const db = await getDb();
    const body = await request.json();

    if (!body.CM_Client_Name || !body.CM_Phone) {
      return NextResponse.json({ error: 'Client Name and Phone are required' }, { status: 400 });
    }

    await db.query(
      `INSERT INTO ccms_sales_lead (
        CM_Lead_ID, CM_Client_Name, CM_Company_Name, CM_Phone, CM_Alt_Phone,
        CM_Email, CM_Address, CM_City, CM_Lead_Source, CM_Product_Required,
        CM_Project_Type, CM_Expected_Budget, CM_Sales_Executive_ID, CM_Lead_Status,
        CM_Remarks, CM_Next_Follow_Up_Date, CM_Next_Follow_Up_Time, CM_Industrial_ID, CM_Category_ID, CM_Subcategory_ID,
        CM_Created_By, CM_Created_At
      ) VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        body.CM_Client_Name.trim(),
        sanitize(body.CM_Company_Name),
        body.CM_Phone.trim(),
        sanitize(body.CM_Alt_Phone),
        sanitize(body.CM_Email),
        sanitize(body.CM_Address),
        sanitize(body.CM_City),
        sanitize(body.CM_Lead_Source),
        sanitize(body.CM_Product_Required),
        sanitize(body.CM_Project_Type),
        parseNum(body.CM_Expected_Budget),
        sanitize(body.CM_Sales_Executive_ID),
        sanitize(body.CM_Lead_Status) || 'New Lead',
        sanitize(body.CM_Remarks),
        body.CM_Next_Follow_Up_Date ? formatDbDate(body.CM_Next_Follow_Up_Date) : null,
        body.CM_Next_Follow_Up_Time || null,
        parseNum(body.CM_Industrial_ID),
        parseNum(body.CM_Category_ID),
        parseNum(body.CM_Subcategory_ID),
        sanitize(body.CM_Created_By)
      ]
    );

    const [rows]: any = await db.query(
      `SELECT CM_Lead_ID FROM ccms_sales_lead ORDER BY CM_Created_At DESC, CM_Lead_ID DESC LIMIT 1`
    );

    const newLeadId = rows[0]?.CM_Lead_ID;
    await logActivity(db, newLeadId, 'Lead Created', `New lead created for ${body.CM_Client_Name}`, body.CM_Created_By);

    // Automatically mark attendance
    await markUserAttendance(db, body.CM_Created_By, 'CRM Lead Creation');

    return NextResponse.json({ success: true, CM_Lead_ID: newLeadId }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating lead:', error);
    return NextResponse.json({ error: 'Failed to create lead', details: error.sqlMessage || error.message }, { status: 500 });
  }
}

async function updateLead(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();
    const { CM_Lead_ID } = body;

    if (!CM_Lead_ID) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 });
    }

    // Get old status for logging
    const [oldLead]: any = await db.query(`SELECT CM_Lead_Status FROM ccms_sales_lead WHERE CM_Lead_ID = ?`, [CM_Lead_ID]);
    const oldStatus = oldLead[0]?.CM_Lead_Status;

    await db.query(
      `UPDATE ccms_sales_lead SET
        CM_Client_Name = ?, CM_Company_Name = ?, CM_Phone = ?, CM_Alt_Phone = ?,
        CM_Email = ?, CM_Address = ?, CM_City = ?, CM_Lead_Source = ?,
        CM_Product_Required = ?, CM_Project_Type = ?, CM_Expected_Budget = ?,
        CM_Sales_Executive_ID = ?, CM_Lead_Status = ?, CM_Remarks = ?,
        CM_Next_Follow_Up_Date = ?, CM_Next_Follow_Up_Time = ?,
        CM_Industrial_ID = ?, CM_Category_ID = ?, CM_Subcategory_ID = ?,
        CM_Updated_By = ?, CM_Updated_At = NOW()
      WHERE CM_Lead_ID = ?`,
      [
        body.CM_Client_Name?.trim(),
        sanitize(body.CM_Company_Name),
        body.CM_Phone?.trim(),
        sanitize(body.CM_Alt_Phone),
        sanitize(body.CM_Email),
        sanitize(body.CM_Address),
        sanitize(body.CM_City),
        sanitize(body.CM_Lead_Source),
        sanitize(body.CM_Product_Required),
        sanitize(body.CM_Project_Type),
        parseNum(body.CM_Expected_Budget),
        sanitize(body.CM_Sales_Executive_ID),
        sanitize(body.CM_Lead_Status) || 'New Lead',
        sanitize(body.CM_Remarks),
        body.CM_Next_Follow_Up_Date ? formatDbDate(body.CM_Next_Follow_Up_Date) : null,
        body.CM_Next_Follow_Up_Time || null,
        parseNum(body.CM_Industrial_ID),
        parseNum(body.CM_Category_ID),
        parseNum(body.CM_Subcategory_ID),
        sanitize(body.CM_Updated_By),
        CM_Lead_ID
      ]
    );

    const newStatus = body.CM_Lead_Status;
    if (oldStatus !== newStatus) {
      await logActivity(db, CM_Lead_ID, 'Status Changed', `Status changed from "${oldStatus}" to "${newStatus}"`, body.CM_Updated_By);
    } else {
      await logActivity(db, CM_Lead_ID, 'Lead Updated', `Lead details updated`, body.CM_Updated_By);
    }

    return NextResponse.json({ success: true, message: 'Lead updated' });
  } catch (error: any) {
    console.error('Error updating lead:', error);
    return NextResponse.json({ error: 'Failed to update lead', details: error.sqlMessage || error.message }, { status: 500 });
  }
}

async function deleteLead(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();
    const { CM_Lead_ID, CM_Updated_By } = body;

    if (!CM_Lead_ID) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 });
    }

    await db.query(`UPDATE ccms_sales_lead SET CM_Is_Deleted = 1, CM_Updated_By = ?, CM_Updated_At = NOW() WHERE CM_Lead_ID = ?`, [CM_Updated_By, CM_Lead_ID]);
    await logActivity(db, CM_Lead_ID, 'Lead Deleted', 'Lead soft deleted', CM_Updated_By);

    return NextResponse.json({ success: true, message: 'Lead deleted' });
  } catch (error: any) {
    console.error('Error deleting lead:', error);
    return NextResponse.json({ error: 'Failed to delete lead', details: error.message }, { status: 500 });
  }
}
