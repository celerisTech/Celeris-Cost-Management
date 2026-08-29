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

async function markUserAttendance(db: any, userId: any, description: string, attendanceDate?: string | null) {
  if (!userId) return;
  try {
    const formattedDate = attendanceDate ? (formatDbDate(attendanceDate) || new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0];

    // 1. Get user info
    const [userRows]: any = await db.query(
      `SELECT CM_User_ID, CM_Company_ID, CM_Labor_Type_ID FROM ccms_users WHERE CM_User_ID = ?`,
      [userId]
    );

    let companyId = 1;
    let laborId = userId;

    if (userRows && userRows.length > 0) {
      companyId = userRows[0].CM_Company_ID || 1;
      laborId = userRows[0].CM_Labor_Type_ID || userId;
    }

    // 2. Check if attendance already exists today / target date
    const [existingAttendanceRows]: any = await db.query(
      `SELECT CM_Attendance_ID FROM ccms_attendance 
       WHERE CM_Labor_ID = ? AND DATE(CM_Attendance_Date) = ?`,
      [laborId, formattedDate]
    );

    // 3. If no attendance exists, mark as present
    if (!existingAttendanceRows || existingAttendanceRows.length === 0) {
      await db.query(
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
      console.log(`✅ Automated attendance recorded for User/Labor ID ${laborId} on ${formattedDate}`);
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

      (SELECT COUNT(DISTINCT sl.CM_Lead_ID) 
       FROM ccms_sales_lead sl
       LEFT JOIN ccms_sales_visit sv ON sl.CM_Lead_ID COLLATE utf8mb4_general_ci = sv.CM_Lead_ID COLLATE utf8mb4_general_ci AND sv.CM_Is_Deleted = 0
       WHERE sl.CM_Is_Deleted = 0
         AND (sl.CM_Lead_Status = 'Converted' OR sl.CM_Followup_Status = 'Converted' OR sv.CM_Visit_Status = 'Converted')
         ${fDate ? "AND DATE(sl.CM_Created_At) >= ?" : ""}
         ${tDate ? "AND DATE(sl.CM_Created_At) <= ?" : ""}) AS converted_leads,

      (SELECT COUNT(DISTINCT sl.CM_Lead_ID) 
       FROM ccms_sales_lead sl
       LEFT JOIN ccms_sales_visit sv ON sl.CM_Lead_ID COLLATE utf8mb4_general_ci = sv.CM_Lead_ID COLLATE utf8mb4_general_ci AND sv.CM_Is_Deleted = 0
       WHERE sl.CM_Is_Deleted = 0
         AND (sl.CM_Lead_Status IN ('Rejected', 'Not Interested') 
              OR sl.CM_Followup_Status IN ('Rejected', 'Not Interested') 
              OR sv.CM_Visit_Status IN ('Rejected', 'Not Interested'))
         ${fDate ? "AND DATE(sl.CM_Created_At) >= ?" : ""}
         ${tDate ? "AND DATE(sl.CM_Created_At) <= ?" : ""}) AS rejected_leads,

      (SELECT COUNT(*) 
       FROM ccms_sales_lead 
       WHERE CM_Lead_Status = 'On Hold' 
         AND CM_Is_Deleted = 0
         ${fDate ? "AND DATE(CM_Created_At) >= ?" : ""}
         ${tDate ? "AND DATE(CM_Created_At) <= ?" : ""}) AS on_hold_leads,

      (SELECT COUNT(DISTINCT sl.CM_Lead_ID) 
       FROM ccms_sales_lead sl
       LEFT JOIN ccms_sales_visit sv ON sl.CM_Lead_ID COLLATE utf8mb4_general_ci = sv.CM_Lead_ID COLLATE utf8mb4_general_ci AND sv.CM_Is_Deleted = 0
       WHERE sl.CM_Is_Deleted = 0
         AND (sl.CM_Lead_Status = 'Proposal Sent' 
              OR sl.CM_Followup_Status = 'Proposal Sent' 
              OR sv.CM_Visit_Status = 'Proposal Sent')
         ${fDate ? "AND DATE(sl.CM_Created_At) >= ?" : ""}
         ${tDate ? "AND DATE(sl.CM_Created_At) <= ?" : ""}) AS proposal_sent
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
      AND l.CM_Is_Deleted = 0
      AND v.CM_Next_Followup_Date >= CURDATE()
      AND v.CM_Visit_Status IN ('Interested', 'Follow-up Needed')
      AND COALESCE(l.CM_Lead_Status, '') NOT IN ('Converted', 'Not Interested', 'Closed', 'Rejected')
      AND COALESCE(l.CM_Followup_Status, '') NOT IN ('Converted', 'Not Interested', 'Closed', 'Rejected')

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
      AND l.CM_Is_Deleted = 0
      AND v.CM_Next_Followup_Date >= CURDATE()
      AND v.CM_Visit_Status IN ('Interested', 'Follow-up Needed')
      AND COALESCE(l.CM_Lead_Status, '') NOT IN ('Converted', 'Not Interested', 'Closed', 'Rejected')
      AND COALESCE(l.CM_Followup_Status, '') NOT IN ('Converted', 'Not Interested', 'Closed', 'Rejected')
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
          WHEN sl.CM_Lead_Status = 'Converted' OR sl.CM_Followup_Status = 'Converted'
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
          SUM(CASE WHEN sl.CM_Lead_Status = 'Converted' OR sl.CM_Followup_Status = 'Converted' OR COALESCE(cv.converted_count, 0) > 0 THEN 1 ELSE 0 END) as converted_leads,
          SUM(CASE WHEN sl.CM_Lead_Status = 'Proposal Sent' OR sl.CM_Followup_Status = 'Proposal Sent' OR COALESCE(pv.proposal_count, 0) > 0 THEN 1 ELSE 0 END) as proposal_sent
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

      // Fetch expiring AMCs (Pending and expiring in next 10 days)
      let expiringAmcRows: any[] = [];
      try {
        const [amcRows]: any = await db.query(`
          SELECT sa.*, sl.CM_Client_Name, sl.CM_Company_Name
          FROM ccms_sales_amc sa
          LEFT JOIN ccms_sales_lead sl
            ON sa.CM_Lead_ID COLLATE utf8mb4_general_ci = sl.CM_Lead_ID COLLATE utf8mb4_general_ci
          WHERE sa.CM_Is_Deleted = 0 
            AND sa.CM_Status = 'Pending' 
            AND sa.CM_Expiry_Date <= DATE_ADD(CURDATE(), INTERVAL 10 DAY)
          ORDER BY sa.CM_Expiry_Date ASC
        `);
        expiringAmcRows = amcRows || [];
      } catch (err) {
        console.error('Error fetching expiring AMCs for dashboard:', err);
      }

      return safeJsonResponse({
        stats,
        pendingFollowups: followups || [],
        totalCollection: Number(finances.total_collection || 0),
        pendingPayments: Number(finances.pending_payments || 0),
        topExecutives: topExecs || [],
        todayVisits: Number(todayVisitsRow?.[0]?.count || 0),
        trend: trendRows || [],
        productWise: productRows || [],
        clientFinancials,
        expiringAmcCount: expiringAmcRows.length,
        expiringAmcs: expiringAmcRows
      });
    }

    if (type === 'executive-performance') {
      const leadParams: any[] = [];
      const visitParams: any[] = [];
      let leadWhere = `WHERE sl.CM_Is_Deleted = 0`;
      let visitWhere = `WHERE sv.CM_Is_Deleted = 0`;

      if (fromDate && toDate) {
        const from = formatDbDate(fromDate);
        const to = formatDbDate(toDate);
        leadWhere += ` AND (
          (DATE(sl.CM_Created_At) >= ? AND DATE(sl.CM_Created_At) <= ?)
          OR sl.CM_Lead_ID IN (
            SELECT CM_Lead_ID FROM ccms_sales_visit WHERE CM_Is_Deleted = 0 AND DATE(CM_Visit_Date) >= ? AND DATE(CM_Visit_Date) <= ?
          )
        )`;
        visitWhere += ` AND DATE(sv.CM_Visit_Date) >= ? AND DATE(sv.CM_Visit_Date) <= ?`;
        leadParams.push(from, to, from, to);
        visitParams.push(from, to);
      } else if (fromDate) {
        const from = formatDbDate(fromDate);
        leadWhere += ` AND (
          DATE(sl.CM_Created_At) >= ?
          OR sl.CM_Lead_ID IN (
            SELECT CM_Lead_ID FROM ccms_sales_visit WHERE CM_Is_Deleted = 0 AND DATE(CM_Visit_Date) >= ?
          )
        )`;
        visitWhere += ` AND DATE(sv.CM_Visit_Date) >= ?`;
        leadParams.push(from, from);
        visitParams.push(from);
      } else if (toDate) {
        const to = formatDbDate(toDate);
        leadWhere += ` AND (
          DATE(sl.CM_Created_At) <= ?
          OR sl.CM_Lead_ID IN (
            SELECT CM_Lead_ID FROM ccms_sales_visit WHERE CM_Is_Deleted = 0 AND DATE(CM_Visit_Date) <= ?
          )
        )`;
        visitWhere += ` AND DATE(sv.CM_Visit_Date) <= ?`;
        leadParams.push(to, to);
        visitParams.push(to);
      }

      const [leadRows]: any = await db.query(`
        SELECT sl.CM_Lead_ID, sl.CM_Sales_Executive_ID, sl.CM_Lead_Status, sl.CM_Followup_Status, sl.CM_Next_Follow_Up_Date, sl.CM_Created_At
        FROM ccms_sales_lead sl
        ${leadWhere}
      `, leadParams);

      const [visitRows]: any = await db.query(`
        SELECT
          sv.CM_Lead_ID,
          sv.CM_Sales_Executive_ID,
          sv.CM_Visit_ID,
          sv.CM_Visit_Date,
          sv.CM_Visit_Status,
          sv.CM_Next_Followup_Date,
          sv.CM_Proposal_Value,
          sv.CM_Trial_Version_Given,
          sv.CM_Purpose
        FROM ccms_sales_visit sv
        ${visitWhere}
        ORDER BY sv.CM_Lead_ID, sv.CM_Visit_Date DESC, sv.CM_Visit_ID DESC
      `, visitParams);

      const [users]: any = await db.query(`
        SELECT CM_User_ID, CM_Full_Name FROM ccms_users ORDER BY CM_Full_Name ASC
      `);

      const executiveMap = new Map();
      users.forEach((user: any) => {
        const key = String(user.CM_User_ID).trim();
        executiveMap.set(key, {
          executive_id: user.CM_User_ID,
          executive_name: user.CM_Full_Name || 'Unassigned',
          total_leads: 0,
          demo_count: 0,
          proposal_sent_count: 0,
          converted_count: 0,
          not_interested_count: 0,
          visit_count: 0,
          call_count: 0,
          followup_count: 0
        });
      });

      const latestVisitMap = new Map();
      const proposalVisitMap = new Map();
      const demoVisitMap = new Map();
      const convertedVisitMap = new Map();
      const rejectedVisitMap = new Map();

      (visitRows || []).forEach((visit: any) => {
        const leadKey = String(visit.CM_Lead_ID || '').trim();
        if (leadKey) {
          const current = latestVisitMap.get(leadKey);
          if (!current) {
            latestVisitMap.set(leadKey, visit);
          } else {
            const currentDate = current.CM_Visit_Date ? new Date(current.CM_Visit_Date) : new Date(0);
            const visitDate = visit.CM_Visit_Date ? new Date(visit.CM_Visit_Date) : new Date(0);
            if (visitDate > currentDate) {
              latestVisitMap.set(leadKey, visit);
            }
          }

          const vStatus = visit.CM_Visit_Status;
          if (vStatus === 'Proposal Sent' || Number(visit.CM_Proposal_Value || 0) > 0) {
            proposalVisitMap.set(leadKey, true);
          }
          if (vStatus === 'Demo Given' || String(visit.CM_Trial_Version_Given || '').toLowerCase() === 'yes') {
            demoVisitMap.set(leadKey, true);
          }
          if (vStatus === 'Converted') {
            convertedVisitMap.set(leadKey, true);
          }
          if (vStatus === 'Rejected' || vStatus === 'Not Interested') {
            rejectedVisitMap.set(leadKey, true);
          }
        }
      });

      (visitRows || []).forEach((visit: any) => {
        const execKey = visit.CM_Sales_Executive_ID ? String(visit.CM_Sales_Executive_ID).trim() : 'UNASSIGNED';
        if (!executiveMap.has(execKey)) {
          executiveMap.set(execKey, {
            executive_id: visit.CM_Sales_Executive_ID || null,
            executive_name: visit.CM_Sales_Executive_ID ? 'Unknown Executive' : 'Unassigned',
            total_leads: 0,
            demo_count: 0,
            proposal_sent_count: 0,
            converted_count: 0,
            not_interested_count: 0,
            visit_count: 0,
            call_count: 0,
            followup_count: 0
          });
        }
        const entry = executiveMap.get(execKey);

        const isCall = String(visit.CM_Purpose || '').toLowerCase().includes('call');
        if (isCall) {
          entry.call_count = Number(entry.call_count || 0) + 1;
        } else {
          entry.visit_count = Number(entry.visit_count || 0) + 1;
        }
      });

      (leadRows || []).forEach((lead: any) => {
        const execKey = lead.CM_Sales_Executive_ID ? String(lead.CM_Sales_Executive_ID).trim() : 'UNASSIGNED';
        if (!executiveMap.has(execKey)) {
          executiveMap.set(execKey, {
            executive_id: lead.CM_Sales_Executive_ID || null,
            executive_name: lead.CM_Sales_Executive_ID ? 'Unknown Executive' : 'Unassigned',
            total_leads: 0,
            demo_count: 0,
            proposal_sent_count: 0,
            converted_count: 0,
            not_interested_count: 0,
            visit_count: 0,
            call_count: 0,
            followup_count: 0
          });
        }

        const entry = executiveMap.get(execKey);
        entry.total_leads = Number(entry.total_leads || 0) + 1;

        const leadKey = String(lead.CM_Lead_ID || '').trim();
        const latestVisit = latestVisitMap.get(leadKey);

        const lStatus = lead.CM_Lead_Status;
        const fStatus = lead.CM_Followup_Status;
        const vStatus = latestVisit?.CM_Visit_Status;

        const isConverted = lStatus === 'Converted' || fStatus === 'Converted' || vStatus === 'Converted' || convertedVisitMap.has(leadKey);
        if (isConverted) {
          entry.converted_count = Number(entry.converted_count || 0) + 1;
        }

        const isProposal = lStatus === 'Proposal Sent' || fStatus === 'Proposal Sent' || vStatus === 'Proposal Sent' || proposalVisitMap.has(leadKey);
        if (isProposal) {
          entry.proposal_sent_count = Number(entry.proposal_sent_count || 0) + 1;
        }

        const isDemo = lStatus === 'Demo Given' || fStatus === 'Demo Given' || vStatus === 'Demo Given' || demoVisitMap.has(leadKey);
        if (isDemo) {
          entry.demo_count = Number(entry.demo_count || 0) + 1;
        }

        const isRejected = ['Rejected', 'Not Interested'].includes(lStatus) || ['Rejected', 'Not Interested'].includes(fStatus) || ['Rejected', 'Not Interested'].includes(vStatus) || rejectedVisitMap.has(leadKey);
        if (isRejected) {
          entry.not_interested_count = Number(entry.not_interested_count || 0) + 1;
        }

        if (latestVisit?.CM_Next_Followup_Date || lead.CM_Next_Follow_Up_Date) {
          entry.followup_count = Number(entry.followup_count || 0) + 1;
        }
      });

      const executives = Array.from(executiveMap.values())
        .map((entry: any) => ({
          executive_id: entry.executive_id,
          executive_name: entry.executive_name || 'Unassigned',
          total_leads: Number(entry.total_leads || 0),
          demo_count: Number(entry.demo_count || 0),
          proposal_sent_count: Number(entry.proposal_sent_count || 0),
          converted_count: Number(entry.converted_count || 0),
          not_interested_count: Number(entry.not_interested_count || 0),
          visit_count: Number(entry.visit_count || 0),
          call_count: Number(entry.call_count || 0),
          followup_count: Number(entry.followup_count || 0)
        }))
        .sort((a: any, b: any) => {
          if (b.total_leads !== a.total_leads) return b.total_leads - a.total_leads;
          return (a.executive_name || '').localeCompare(b.executive_name || '');
        });

      return safeJsonResponse({
        executives,
        fromDate: formatDbDate(fromDate),
        toDate: formatDbDate(toDate)
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
        whereClause += ` AND (
          sl.CM_Lead_Status IN ('Rejected', 'Not Interested') 
          OR sl.CM_Followup_Status IN ('Rejected', 'Not Interested')
          OR sl.CM_Lead_ID COLLATE utf8mb4_general_ci IN (
            SELECT CM_Lead_ID FROM ccms_sales_visit WHERE CM_Is_Deleted = 0 AND CM_Visit_Status IN ('Rejected', 'Not Interested')
          )
        )`;
      } else {
        whereClause += ` AND (
          sl.CM_Lead_Status = ? 
          OR sl.CM_Followup_Status = ?
          OR sl.CM_Lead_ID COLLATE utf8mb4_general_ci IN (
            SELECT CM_Lead_ID FROM ccms_sales_visit WHERE CM_Is_Deleted = 0 AND CM_Visit_Status = ?
          )
        )`;
        params.push(status, status, status);
      }
    }
    if (executiveId) { whereClause += ' AND sl.CM_Sales_Executive_ID = ?'; params.push(executiveId); }
    if (industrialId) { whereClause += ' AND sl.CM_Industrial_ID = ?'; params.push(industrialId); }
    if (categoryId) { whereClause += ' AND sl.CM_Category_ID = ?'; params.push(categoryId); }
    if (fromDate) { whereClause += ' AND DATE(sl.CM_Created_At) >= ?'; params.push(formatDbDate(fromDate)); }
    if (toDate) { whereClause += ' AND DATE(sl.CM_Created_At) <= ?'; params.push(formatDbDate(toDate)); }
    const cleanSearch = search ? String(search).trim() : '';
    if (cleanSearch) {
      const s = `%${cleanSearch}%`;
      const cleanPhone = cleanSearch.replace(/\s+/g, '');
      const sPhone = `%${cleanPhone}%`;

      whereClause += ` AND (
        sl.CM_Client_Name LIKE ? 
        OR sl.CM_Company_Name LIKE ? 
        OR sl.CM_Phone LIKE ? 
        OR REPLACE(sl.CM_Phone, ' ', '') LIKE ?
        OR sl.CM_Alt_Phone LIKE ? 
        OR REPLACE(sl.CM_Alt_Phone, ' ', '') LIKE ?
        OR sl.CM_Email LIKE ? 
        OR sl.CM_Lead_ID LIKE ? 
        OR sl.CM_City LIKE ? 
        OR sl.CM_Address LIKE ?
        OR sl.CM_Product_Required LIKE ?
        OR sl.CM_Remarks LIKE ?
        OR u.CM_Full_Name LIKE ?
        OR ind.CM_Industrial_Name LIKE ?
        OR cat.CM_Category_Name LIKE ?
        OR sub.CM_Subcategory_Name LIKE ?
      )`;
      params.push(s, s, s, sPhone, s, sPhone, s, s, s, s, s, s, s, s, s, s);
    }

    // Count stats for overall query (without status filter restriction)
    const statsParams: any[] = [];
    let statsWhere = 'WHERE sl.CM_Is_Deleted = 0';
    if (executiveId) { statsWhere += ' AND sl.CM_Sales_Executive_ID = ?'; statsParams.push(executiveId); }
    if (industrialId) { statsWhere += ' AND sl.CM_Industrial_ID = ?'; statsParams.push(industrialId); }
    if (categoryId) { statsWhere += ' AND sl.CM_Category_ID = ?'; statsParams.push(categoryId); }
    if (fromDate) { statsWhere += ' AND DATE(sl.CM_Created_At) >= ?'; statsParams.push(formatDbDate(fromDate)); }
    if (toDate) { statsWhere += ' AND DATE(sl.CM_Created_At) <= ?'; statsParams.push(formatDbDate(toDate)); }
    if (cleanSearch) {
      const s = `%${cleanSearch}%`;
      const cleanPhone = cleanSearch.replace(/\s+/g, '');
      const sPhone = `%${cleanPhone}%`;

      statsWhere += ` AND (
        sl.CM_Client_Name LIKE ? 
        OR sl.CM_Company_Name LIKE ? 
        OR sl.CM_Phone LIKE ? 
        OR REPLACE(sl.CM_Phone, ' ', '') LIKE ?
        OR sl.CM_Alt_Phone LIKE ? 
        OR REPLACE(sl.CM_Alt_Phone, ' ', '') LIKE ?
        OR sl.CM_Email LIKE ? 
        OR sl.CM_Lead_ID LIKE ? 
        OR sl.CM_City LIKE ? 
        OR sl.CM_Address LIKE ?
        OR sl.CM_Product_Required LIKE ?
        OR sl.CM_Remarks LIKE ?
        OR u.CM_Full_Name LIKE ?
        OR ind.CM_Industrial_Name LIKE ?
        OR cat.CM_Category_Name LIKE ?
        OR sub.CM_Subcategory_Name LIKE ?
      )`;
      statsParams.push(s, s, s, sPhone, s, sPhone, s, s, s, s, s, s, s, s, s, s);
    }

    const queries: Promise<any>[] = [
      db.query(`
        SELECT 
          COUNT(DISTINCT sl.CM_Lead_ID) AS total,
          SUM(CASE WHEN sl.CM_Lead_Status = 'New Lead' THEN 1 ELSE 0 END) AS newLead,
          SUM(CASE WHEN sl.CM_Lead_Status = 'Converted' OR sl.CM_Followup_Status = 'Converted' OR lv.Last_Visit_Status = 'Converted' THEN 1 ELSE 0 END) AS converted,
          SUM(CASE WHEN sl.CM_Lead_Status = 'Proposal Sent' OR sl.CM_Followup_Status = 'Proposal Sent' OR prop.has_prop = 1 OR lv.Last_Visit_Status = 'Proposal Sent' THEN 1 ELSE 0 END) AS proposalSent,
          SUM(CASE WHEN sl.CM_Lead_Status IN ('Rejected', 'Not Interested') OR sl.CM_Followup_Status IN ('Rejected', 'Not Interested') OR ni.has_ni = 1 OR lv.Last_Visit_Status IN ('Rejected', 'Not Interested') THEN 1 ELSE 0 END) AS notInterested
        FROM ccms_sales_lead sl
        LEFT JOIN ccms_users u ON sl.CM_Sales_Executive_ID COLLATE utf8mb4_general_ci = u.CM_User_ID COLLATE utf8mb4_general_ci
        LEFT JOIN ccms_industrial ind ON sl.CM_Industrial_ID = ind.CM_Industrial_ID
        LEFT JOIN ccms_sales_category cat ON sl.CM_Category_ID = cat.CM_Category_ID
        LEFT JOIN ccms_sales_subcategory sub ON sl.CM_Subcategory_ID = sub.CM_Subcategory_ID
        LEFT JOIN (
          SELECT v1.CM_Lead_ID COLLATE utf8mb4_general_ci AS CM_Lead_ID, v1.CM_Visit_Status AS Last_Visit_Status
          FROM ccms_sales_visit v1
          INNER JOIN (
            SELECT CM_Lead_ID, MAX(CM_Visit_ID) AS max_id
            FROM ccms_sales_visit
            WHERE CM_Is_Deleted = 0
            GROUP BY CM_Lead_ID
          ) v2 ON v1.CM_Lead_ID = v2.CM_Lead_ID AND v1.CM_Visit_ID = v2.max_id
        ) lv ON sl.CM_Lead_ID COLLATE utf8mb4_general_ci = lv.CM_Lead_ID
        LEFT JOIN (
          SELECT CM_Lead_ID COLLATE utf8mb4_general_ci AS CM_Lead_ID, 1 AS has_prop
          FROM ccms_sales_visit
          WHERE CM_Is_Deleted = 0 AND CM_Visit_Status = 'Proposal Sent'
          GROUP BY CM_Lead_ID
        ) prop ON sl.CM_Lead_ID COLLATE utf8mb4_general_ci = prop.CM_Lead_ID
        LEFT JOIN (
          SELECT CM_Lead_ID COLLATE utf8mb4_general_ci AS CM_Lead_ID, 1 AS has_ni
          FROM ccms_sales_visit
          WHERE CM_Is_Deleted = 0 AND CM_Visit_Status IN ('Rejected', 'Not Interested')
          GROUP BY CM_Lead_ID
        ) ni ON sl.CM_Lead_ID COLLATE utf8mb4_general_ci = ni.CM_Lead_ID
        ${statsWhere}
      `, statsParams),

      db.query(`
        SELECT sl.*, u.CM_Full_Name AS Executive_Name,
          ind.CM_Industrial_Name, cat.CM_Category_Name, sub.CM_Subcategory_Name,
          (SELECT COUNT(*) FROM ccms_sales_visit sv WHERE sv.CM_Lead_ID COLLATE utf8mb4_general_ci = sl.CM_Lead_ID COLLATE utf8mb4_general_ci AND sv.CM_Is_Deleted = 0) AS visit_count,
          (SELECT COALESCE(SUM(CM_Amount), 0) FROM ccms_sales_payment sp WHERE sp.CM_Lead_ID COLLATE utf8mb4_general_ci = sl.CM_Lead_ID COLLATE utf8mb4_general_ci AND sp.CM_Payment_Status = 'Paid' AND sp.CM_Payment_Type != 'Domain Payment' AND sp.CM_Is_Deleted = 0) AS total_paid,
          (SELECT COUNT(*) FROM ccms_sales_lead_projects WHERE CM_Lead_ID COLLATE utf8mb4_general_ci = sl.CM_Lead_ID COLLATE utf8mb4_general_ci AND CM_Is_Deleted = 0 AND CM_Proposal_Doc IS NOT NULL AND CM_Proposal_Doc != '') + (CASE WHEN sl.CM_Proposal_Doc IS NOT NULL AND sl.CM_Proposal_Doc != '' THEN 1 ELSE 0 END) AS proposal_count,
          (SELECT sv.CM_Visit_Status FROM ccms_sales_visit sv WHERE sv.CM_Lead_ID COLLATE utf8mb4_general_ci = sl.CM_Lead_ID COLLATE utf8mb4_general_ci AND sv.CM_Is_Deleted = 0 ORDER BY sv.CM_Visit_Date DESC, sv.CM_Visit_ID DESC LIMIT 1) AS Last_Visit_Status,
          (SELECT 1 FROM ccms_sales_visit sv WHERE sv.CM_Lead_ID COLLATE utf8mb4_general_ci = sl.CM_Lead_ID COLLATE utf8mb4_general_ci AND sv.CM_Is_Deleted = 0 AND sv.CM_Visit_Status = 'Proposal Sent' LIMIT 1) AS Had_Proposal_Sent,
          (SELECT 1 FROM ccms_sales_visit sv WHERE sv.CM_Lead_ID COLLATE utf8mb4_general_ci = sl.CM_Lead_ID COLLATE utf8mb4_general_ci AND sv.CM_Is_Deleted = 0 AND sv.CM_Visit_Status IN ('Rejected', 'Not Interested') LIMIT 1) AS Had_Not_Interested

        FROM ccms_sales_lead sl
        LEFT JOIN ccms_users u ON sl.CM_Sales_Executive_ID COLLATE utf8mb4_general_ci = u.CM_User_ID COLLATE utf8mb4_general_ci
        LEFT JOIN ccms_industrial ind ON sl.CM_Industrial_ID = ind.CM_Industrial_ID
        LEFT JOIN ccms_sales_category cat ON sl.CM_Category_ID = cat.CM_Category_ID
        LEFT JOIN ccms_sales_subcategory sub ON sl.CM_Subcategory_ID = sub.CM_Subcategory_ID
        ${whereClause}
        ORDER BY sl.CM_Created_At DESC, sl.CM_Lead_ID DESC
        LIMIT ${limit} OFFSET ${offset}
      `, params)
    ];

    if (status) {
      queries.push(
        db.query(
          `SELECT COUNT(DISTINCT sl.CM_Lead_ID) AS total 
           FROM ccms_sales_lead sl
           LEFT JOIN ccms_users u ON sl.CM_Sales_Executive_ID COLLATE utf8mb4_general_ci = u.CM_User_ID COLLATE utf8mb4_general_ci
           LEFT JOIN ccms_industrial ind ON sl.CM_Industrial_ID = ind.CM_Industrial_ID
           LEFT JOIN ccms_sales_category cat ON sl.CM_Category_ID = cat.CM_Category_ID
           LEFT JOIN ccms_sales_subcategory sub ON sl.CM_Subcategory_ID = sub.CM_Subcategory_ID
           ${whereClause}`, params
        )
      );
    }

    const results = await Promise.all(queries);
    const statsResult = results[0][0];
    const leadsRows = results[1][0];
    const countResult = status ? results[2][0] : null;

    const total = status ? Number(countResult?.[0]?.total || 0) : Number(statsResult?.[0]?.total || 0);

    const stats = {
      total: Number(statsResult?.[0]?.total || 0),
      newLead: Number(statsResult?.[0]?.newLead || 0),
      converted: Number(statsResult?.[0]?.converted || 0),
      proposalSent: Number(statsResult?.[0]?.proposalSent || 0),
      notInterested: Number(statsResult?.[0]?.notInterested || 0)
    };

    return safeJsonResponse({
      leads: leadsRows || [],
      total,
      stats,
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
        CM_Project_Type, CM_Expected_Budget, CM_Sales_Executive_ID, CM_Lead_Status, CM_Followup_Status,
        CM_Remarks, CM_Next_Follow_Up_Date, CM_Next_Follow_Up_Time, CM_Industrial_ID, CM_Category_ID, CM_Subcategory_ID,
        CM_Created_By, CM_Created_At, CM_Proposal_Doc
      ) VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
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
        sanitize(body.CM_Followup_Status) || 'Follow Up',
        sanitize(body.CM_Remarks),
        body.CM_Next_Follow_Up_Date ? formatDbDate(body.CM_Next_Follow_Up_Date) : null,
        body.CM_Next_Follow_Up_Time || null,
        parseNum(body.CM_Industrial_ID),
        parseNum(body.CM_Category_ID),
        parseNum(body.CM_Subcategory_ID),
        sanitize(body.CM_Created_By),
        sanitize(body.CM_Proposal_Doc)
      ]
    );

    const [rows]: any = await db.query(
      `SELECT CM_Lead_ID FROM ccms_sales_lead ORDER BY CM_Created_At DESC, CM_Lead_ID DESC LIMIT 1`
    );

    const newLeadId = rows[0]?.CM_Lead_ID;
    await logActivity(db, newLeadId, 'Lead Created', `New lead created for ${body.CM_Client_Name}`, body.CM_Created_By);

    // Insert lead projects/products if supplied in body
    if (Array.isArray(body.products) && body.products.length > 0) {
      for (const p of body.products) {
        if (!p.CM_Product_Name) continue;
        await db.query(
          `INSERT INTO ccms_sales_lead_projects (
            CM_Lead_Project_ID, CM_Lead_ID, CM_Product_Name,
            CM_Amount, CM_Proposal_Doc, CM_Status, CM_Created_By, CM_Created_At
          ) VALUES (NULL, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            newLeadId,
            p.CM_Product_Name.trim(),
            parseNum(p.CM_Amount),
            sanitize(p.CM_Proposal_Doc),
            sanitize(p.CM_Status) || 'New Lead',
            sanitize(body.CM_Created_By)
          ]
        );
      }
      await updateMainLeadStatus(db, newLeadId, body.CM_Created_By);
    }

    // Automatically mark attendance for creator and assigned sales executive
    const activeUserId = body.CM_Created_By || body.CM_Sales_Executive_ID;
    if (activeUserId) {
      await markUserAttendance(db, activeUserId, 'CRM Lead Creation');
    }
    if (body.CM_Sales_Executive_ID && body.CM_Sales_Executive_ID !== activeUserId) {
      await markUserAttendance(db, body.CM_Sales_Executive_ID, 'CRM Lead Executive Assignment');
    }

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
        CM_Sales_Executive_ID = ?, CM_Lead_Status = ?, CM_Followup_Status = ?, CM_Remarks = ?,
        CM_Next_Follow_Up_Date = ?, CM_Next_Follow_Up_Time = ?,
        CM_Industrial_ID = ?, CM_Category_ID = ?, CM_Subcategory_ID = ?,
        CM_Updated_By = ?, CM_Updated_At = NOW(), CM_Proposal_Doc = ?
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
        sanitize(body.CM_Followup_Status) || 'Follow Up',
        sanitize(body.CM_Remarks),
        body.CM_Next_Follow_Up_Date ? formatDbDate(body.CM_Next_Follow_Up_Date) : null,
        body.CM_Next_Follow_Up_Time || null,
        parseNum(body.CM_Industrial_ID),
        parseNum(body.CM_Category_ID),
        parseNum(body.CM_Subcategory_ID),
        sanitize(body.CM_Updated_By),
        sanitize(body.CM_Proposal_Doc),
        CM_Lead_ID
      ]
    );

    // Sync lead projects/products if supplied in body
    if (Array.isArray(body.products)) {
      // 1. Identify and soft delete removed projects
      const [existingProjects]: any = await db.query(
        `SELECT CM_Lead_Project_ID FROM ccms_sales_lead_projects WHERE CM_Lead_ID = ? AND CM_Is_Deleted = 0`,
        [CM_Lead_ID]
      );
      const existingIds = existingProjects.map((p: any) => p.CM_Lead_Project_ID);
      const incomingIds = body.products
        .map((p: any) => p.CM_Lead_Project_ID)
        .filter((id: any) => id != null);

      const idsToDelete = existingIds.filter((id: any) => !incomingIds.includes(id));
      if (idsToDelete.length > 0) {
        await db.query(
          `UPDATE ccms_sales_lead_projects SET CM_Is_Deleted = 1, CM_Updated_By = ?, CM_Updated_At = NOW() WHERE CM_Lead_Project_ID IN (?)`,
          [body.CM_Updated_By, idsToDelete]
        );
      }

      // 2. Insert or update incoming projects
      for (const p of body.products) {
        if (!p.CM_Product_Name) continue;
        if (p.CM_Lead_Project_ID) {
          const params = [
            p.CM_Product_Name.trim(),
            parseNum(p.CM_Amount),
            sanitize(p.CM_Status) || 'New Lead',
            sanitize(body.CM_Updated_By)
          ];
          
          let proposalSql = '';
          if ('CM_Proposal_Doc' in p) {
            proposalSql = ', CM_Proposal_Doc = ?';
            params.push(sanitize(p.CM_Proposal_Doc));
          }
          
          params.push(p.CM_Lead_Project_ID);

          await db.query(
            `UPDATE ccms_sales_lead_projects SET
              CM_Product_Name = ?,
              CM_Amount = ?,
              CM_Status = ?,
              CM_Updated_By = ?,
              CM_Updated_At = NOW()
              ${proposalSql}
            WHERE CM_Lead_Project_ID = ?`,
            params
          );
        } else {
          await db.query(
            `INSERT INTO ccms_sales_lead_projects (
              CM_Lead_Project_ID, CM_Lead_ID, CM_Product_Name,
              CM_Amount, CM_Proposal_Doc, CM_Status, CM_Created_By, CM_Created_At
            ) VALUES (NULL, ?, ?, ?, ?, ?, ?, NOW())`,
            [
              CM_Lead_ID,
              p.CM_Product_Name.trim(),
              parseNum(p.CM_Amount),
              sanitize(p.CM_Proposal_Doc),
              sanitize(p.CM_Status) || 'New Lead',
              sanitize(body.CM_Updated_By)
            ]
          );
        }
      }
      await updateMainLeadStatus(db, CM_Lead_ID, body.CM_Updated_By);
    }

    const newStatus = body.CM_Lead_Status;
    if (oldStatus !== newStatus) {
      await logActivity(db, CM_Lead_ID, 'Status Changed', `Status changed from "${oldStatus}" to "${newStatus}"`, body.CM_Updated_By);
    } else {
      await logActivity(db, CM_Lead_ID, 'Lead Updated', `Lead details updated`, body.CM_Updated_By);
    }

    // Automatically mark attendance on lead update
    const updaterUserId = body.CM_Updated_By || body.CM_Sales_Executive_ID;
    if (updaterUserId) {
      await markUserAttendance(db, updaterUserId, 'CRM Lead Update');
    }
    if (body.CM_Sales_Executive_ID && body.CM_Sales_Executive_ID !== updaterUserId) {
      await markUserAttendance(db, body.CM_Sales_Executive_ID, 'CRM Lead Executive Assignment');
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

// Helper function to update the main lead status based on the statuses of its projects
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
    console.error('Error updating main lead status:', err);
  }
}
