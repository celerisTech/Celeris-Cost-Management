import { NextResponse, NextRequest } from 'next/server';
import getDb from '@/app/utils/db';

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
    const type = url.searchParams.get('type');
    const fromDate = url.searchParams.get('fromDate');
    const toDate = url.searchParams.get('toDate');
    const executiveId = url.searchParams.get('executiveId');

    let dateFilter = '';
    const dateParams: any[] = [];
    if (fromDate) { dateFilter += ' AND DATE(sl.CM_Created_At) >= ?'; dateParams.push(formatDbDate(fromDate)); }
    if (toDate) { dateFilter += ' AND DATE(sl.CM_Created_At) <= ?'; dateParams.push(formatDbDate(toDate)); }

    // Sales Executive Report
    if (type === 'executive') {
      const [report]: any = await db.query(`
        SELECT 
          u.CM_User_ID,
          u.CM_Full_Name AS executive_name,
          COUNT(DISTINCT sl.CM_Lead_ID) AS total_leads,
          COUNT(DISTINCT sv.CM_Visit_ID) AS total_visits,
          SUM(CASE WHEN sv.CM_Demo_Given = 'Yes' THEN 1 ELSE 0 END) AS demo_count,
          SUM(CASE WHEN sl.CM_Lead_Status = 'Proposal Sent' OR sv.CM_Visit_Status = 'Proposal Sent' THEN 1 ELSE 0 END) AS proposal_count,
          SUM(CASE WHEN sl.CM_Lead_Status = 'Converted' THEN 1 ELSE 0 END) AS converted_count,
          ROUND(
            CASE WHEN COUNT(DISTINCT sl.CM_Lead_ID) > 0 
            THEN (SUM(CASE WHEN sl.CM_Lead_Status = 'Converted' THEN 1 ELSE 0 END) / COUNT(DISTINCT sl.CM_Lead_ID)) * 100
            ELSE 0 END, 1
          ) AS conversion_ratio,
          COALESCE((
            SELECT SUM(sp.CM_Amount) FROM ccms_sales_payment sp
            JOIN ccms_sales_lead sl2 ON sp.CM_Lead_ID = sl2.CM_Lead_ID
            WHERE sl2.CM_Sales_Executive_ID = u.CM_User_ID AND sp.CM_Payment_Status = 'Paid' AND sp.CM_Is_Deleted = 0
          ), 0) AS collection_amount
        FROM ccms_users u
        LEFT JOIN ccms_sales_lead sl ON u.CM_User_ID COLLATE utf8mb4_unicode_ci = sl.CM_Sales_Executive_ID COLLATE utf8mb4_unicode_ci AND sl.CM_Is_Deleted = 0
        LEFT JOIN ccms_sales_visit sv ON sl.CM_Lead_ID = sv.CM_Lead_ID AND sv.CM_Is_Deleted = 0
        WHERE sl.CM_Lead_ID IS NOT NULL ${dateFilter}
        GROUP BY u.CM_User_ID, u.CM_Full_Name
        ORDER BY converted_count DESC
      `, dateParams);
      return safeJsonResponse({ executive: report || [] });
    }

    // Visit Report
    if (type === 'visit') {
      let visitDateFilter = '';
      const visitParams: any[] = [];
      if (fromDate) { visitDateFilter += ' AND sv.CM_Visit_Date >= ?'; visitParams.push(formatDbDate(fromDate)); }
      if (toDate) { visitDateFilter += ' AND sv.CM_Visit_Date <= ?'; visitParams.push(formatDbDate(toDate)); }
      if (executiveId) { visitDateFilter += ' AND sv.CM_Sales_Executive_ID = ?'; visitParams.push(executiveId); }

      const [dateWise]: any = await db.query(`
        SELECT 
          sv.CM_Visit_Date AS visit_date,
          COUNT(*) AS visit_count,
          SUM(CASE WHEN sv.CM_Demo_Given = 'Yes' THEN 1 ELSE 0 END) AS demos,
          SUM(CASE WHEN sv.CM_Visit_Status = 'Converted' THEN 1 ELSE 0 END) AS converted
        FROM ccms_sales_visit sv
        WHERE sv.CM_Is_Deleted = 0 ${visitDateFilter}
        GROUP BY sv.CM_Visit_Date
        ORDER BY sv.CM_Visit_Date DESC
        LIMIT 90
      `, visitParams);

      const [executiveWise]: any = await db.query(`
        SELECT 
          u.CM_Full_Name AS executive_name,
          sv.CM_Sales_Executive_ID,
          COUNT(*) AS visit_count,
          SUM(CASE WHEN sv.CM_Demo_Given = 'Yes' THEN 1 ELSE 0 END) AS demos
        FROM ccms_sales_visit sv
        LEFT JOIN ccms_users u ON sv.CM_Sales_Executive_ID COLLATE utf8mb4_unicode_ci = u.CM_User_ID COLLATE utf8mb4_unicode_ci
        WHERE sv.CM_Is_Deleted = 0 ${visitDateFilter}
        GROUP BY sv.CM_Sales_Executive_ID, u.CM_Full_Name
        ORDER BY visit_count DESC
      `, visitParams);

      const [clientWise]: any = await db.query(`
        SELECT 
          sl.CM_Client_Name, sl.CM_Company_Name,
          sv.CM_Lead_ID,
          COUNT(*) AS visit_count,
          MAX(sv.CM_Visit_Date) AS last_visit,
          MAX(sv.CM_Proposal_Value) AS last_proposal
        FROM ccms_sales_visit sv
        LEFT JOIN ccms_sales_lead sl ON sv.CM_Lead_ID = sl.CM_Lead_ID
        WHERE sv.CM_Is_Deleted = 0 ${visitDateFilter}
        GROUP BY sv.CM_Lead_ID, sl.CM_Client_Name, sl.CM_Company_Name
        ORDER BY visit_count DESC
        LIMIT 50
      `, visitParams);

      return safeJsonResponse({ dateWise: dateWise || [], executiveWise: executiveWise || [], clientWise: clientWise || [] });
    }

    // Payment Report
    if (type === 'payment') {
      let payDateFilter = '';
      const payParams: any[] = [];
      if (fromDate) { payDateFilter += ' AND sp.CM_Payment_Date >= ?'; payParams.push(formatDbDate(fromDate)); }
      if (toDate) { payDateFilter += ' AND sp.CM_Payment_Date <= ?'; payParams.push(formatDbDate(toDate)); }

      const [pending]: any = await db.query(`
        SELECT sp.*, sl.CM_Client_Name, sl.CM_Company_Name
        FROM ccms_sales_payment sp
        LEFT JOIN ccms_sales_lead sl ON sp.CM_Lead_ID = sl.CM_Lead_ID
        WHERE sp.CM_Payment_Status = 'Pending' AND sp.CM_Is_Deleted = 0 ${payDateFilter}
        ORDER BY sp.CM_Payment_Date ASC
      `, payParams);

      const [completed]: any = await db.query(`
        SELECT sp.*, sl.CM_Client_Name, sl.CM_Company_Name
        FROM ccms_sales_payment sp
        LEFT JOIN ccms_sales_lead sl ON sp.CM_Lead_ID = sl.CM_Lead_ID
        WHERE sp.CM_Payment_Status = 'Paid' AND sp.CM_Is_Deleted = 0 ${payDateFilter}
        ORDER BY sp.CM_Payment_Date DESC
        LIMIT 100
      `, payParams);

      const [monthly]: any = await db.query(`
        SELECT 
          DATE_FORMAT(sp.CM_Payment_Date, '%Y-%m') AS month,
          SUM(CASE WHEN sp.CM_Payment_Status = 'Paid' THEN sp.CM_Amount ELSE 0 END) AS collection,
          SUM(CASE WHEN sp.CM_Payment_Status = 'Pending' THEN sp.CM_Amount ELSE 0 END) AS pending,
          COUNT(*) AS count
        FROM ccms_sales_payment sp
        WHERE sp.CM_Is_Deleted = 0 ${payDateFilter}
        GROUP BY DATE_FORMAT(sp.CM_Payment_Date, '%Y-%m')
        ORDER BY month DESC
        LIMIT 12
      `, payParams);

      return safeJsonResponse({ pending: pending || [], completed: completed || [], monthly: monthly || [] });
    }

    // Conversion Report
    if (type === 'conversion') {
      const [report]: any = await db.query(`
        SELECT 
          sc.*, sl.CM_Client_Name, sl.CM_Company_Name, sl.CM_Lead_Source,
          sl.CM_Product_Required, sl.CM_Expected_Budget,
          p.CM_Project_Name, p.CM_Project_Code, p.CM_Status AS project_status,
          u.CM_Full_Name AS converted_by_name
        FROM ccms_sales_project_conversion sc
        LEFT JOIN ccms_sales_lead sl ON sc.CM_Lead_ID = sl.CM_Lead_ID
        LEFT JOIN ccms_projects p ON sc.CM_Project_ID = p.CM_Project_ID
        LEFT JOIN ccms_users u ON sc.CM_Converted_By COLLATE utf8mb4_unicode_ci = u.CM_User_ID COLLATE utf8mb4_unicode_ci
        WHERE sc.CM_Is_Deleted = 0
        ORDER BY sc.CM_Converted_At DESC
      `);

      const [statsRows]: any = await db.query(`
        SELECT 
          (SELECT COUNT(*) FROM ccms_sales_lead WHERE CM_Is_Deleted = 0) AS total_leads,
          (SELECT COUNT(*) FROM ccms_sales_lead WHERE CM_Lead_Status = 'Converted' AND CM_Is_Deleted = 0) AS converted,
          (SELECT COUNT(*) FROM ccms_sales_project_conversion WHERE CM_Is_Deleted = 0) AS projects_generated
      `);
      const stats = statsRows[0] || { total_leads: 0, converted: 0, projects_generated: 0 };

      const totalLeads = Number(stats.total_leads || 0);
      const converted = Number(stats.converted || 0);

      return safeJsonResponse({
        conversions: report || [],
        stats: {
          ...stats,
          conversion_rate: totalLeads > 0 ? ((converted / totalLeads) * 100).toFixed(1) : 0
        }
      });
    }

    // Reports tab (Detailed extraction)
    if (type === 'Reports') {
      let filter = '';
      const params: any[] = [];
      if (fromDate) { filter += ' AND sv.CM_Visit_Date >= ?'; params.push(formatDbDate(fromDate)); }
      if (toDate) { filter += ' AND sv.CM_Visit_Date <= ?'; params.push(formatDbDate(toDate)); }
      
      const industrialName = url.searchParams.get('industrialName');
      const categoryName = url.searchParams.get('categoryName');
      const subcategoryName = url.searchParams.get('subcategoryName');
      const month = url.searchParams.get('month');
      
      if (industrialName) { 
        if (industrialName.toLowerCase() === 'unspecified') {
          filter += ' AND (ind.CM_Industrial_Name IS NULL OR ind.CM_Industrial_Name = "")';
        } else {
          filter += ' AND ind.CM_Industrial_Name = ?'; 
          params.push(industrialName); 
        }
      }
      
      if (categoryName) { 
        if (categoryName.toLowerCase() === 'unspecified') {
          filter += ' AND (cat.CM_Category_Name IS NULL OR cat.CM_Category_Name = "")';
        } else {
          filter += ' AND cat.CM_Category_Name = ?'; 
          params.push(categoryName); 
        }
      }
      
      if (subcategoryName) { 
        if (subcategoryName.toLowerCase() === 'unspecified') {
          filter += ' AND (sub.CM_Subcategory_Name IS NULL OR sub.CM_Subcategory_Name = "")';
        } else {
          filter += ' AND sub.CM_Subcategory_Name = ?'; 
          params.push(subcategoryName); 
        }
      }
      if (month) { filter += ' AND DATE_FORMAT(sv.CM_Visit_Date, "%Y-%m") = ?'; params.push(month); }

      const [report]: any = await db.query(`
        SELECT 
          sv.CM_Visit_Date AS visit_date,
          sl.CM_Client_Name AS client_name,
          sv.CM_Purpose AS purpose,
          sl.CM_Product_Required AS product_name,
          sv.CM_Demo_Given AS demo_given,
          sv.CM_Visit_Status AS status,
          u.CM_Full_Name AS executive_name,
          (SELECT COUNT(*) FROM ccms_sales_visit sv2 WHERE sv2.CM_Lead_ID = sl.CM_Lead_ID AND sv2.CM_Is_Deleted = 0) AS visit_count,
          (
            SELECT GROUP_CONCAT(CONCAT(sp.CM_Payment_Type, ': ₹', sp.CM_Amount) SEPARATOR ' | ') 
            FROM ccms_sales_payment sp 
            WHERE sp.CM_Lead_ID = sl.CM_Lead_ID AND sp.CM_Is_Deleted = 0
          ) AS payment_details
        FROM ccms_sales_visit sv
        LEFT JOIN ccms_sales_lead sl ON sv.CM_Lead_ID = sl.CM_Lead_ID
        LEFT JOIN ccms_industrial ind ON sl.CM_Industrial_ID = ind.CM_Industrial_ID
        LEFT JOIN ccms_sales_category cat ON sl.CM_Category_ID = cat.CM_Category_ID
        LEFT JOIN ccms_sales_subcategory sub ON sl.CM_Subcategory_ID = sub.CM_Subcategory_ID
        LEFT JOIN ccms_users u ON sv.CM_Sales_Executive_ID COLLATE utf8mb4_unicode_ci = u.CM_User_ID COLLATE utf8mb4_unicode_ci
        WHERE sv.CM_Is_Deleted = 0 AND sl.CM_Is_Deleted = 0 ${filter}
        ORDER BY sv.CM_Visit_Date DESC
      `, params);

      const processedReport = (report || []).map((r: any) => ({
        ...r,
        status: r.status || 'Follow-up Needed'
      }));

      return safeJsonResponse({ Reports: processedReport });
    }

    if (type === 'monthWise') {
      let filter = '';
      const params: any[] = [];
      if (fromDate) { filter += ' AND sv.CM_Visit_Date >= ?'; params.push(formatDbDate(fromDate)); }
      if (toDate) { filter += ' AND sv.CM_Visit_Date <= ?'; params.push(formatDbDate(toDate)); }

      const [report]: any = await db.query(`
        SELECT 
          DATE_FORMAT(sv.CM_Visit_Date, '%Y-%m') AS month,
          COUNT(*) AS total_visits,
          SUM(CASE WHEN sv.CM_Demo_Given = 'Yes' THEN 1 ELSE 0 END) AS demos,
          SUM(CASE WHEN sv.CM_Visit_Status = 'Converted' THEN 1 ELSE 0 END) AS converted
        FROM ccms_sales_visit sv
        WHERE sv.CM_Is_Deleted = 0 ${filter}
        GROUP BY DATE_FORMAT(sv.CM_Visit_Date, '%Y-%m')
        ORDER BY month DESC
      `, params);

      return safeJsonResponse({ monthWise: report || [] });
    }

    if (type === 'industrialWise') {
      let filter = '';
      const params: any[] = [];
      if (fromDate) { filter += ' AND sv.CM_Visit_Date >= ?'; params.push(formatDbDate(fromDate)); }
      if (toDate) { filter += ' AND sv.CM_Visit_Date <= ?'; params.push(formatDbDate(toDate)); }

      const [report]: any = await db.query(`
        SELECT 
          COALESCE(ind.CM_Industrial_Name, 'Unspecified') AS industrial_name,
          COUNT(*) AS total_visits,
          SUM(CASE WHEN sv.CM_Demo_Given = 'Yes' THEN 1 ELSE 0 END) AS demos,
          SUM(CASE WHEN sv.CM_Visit_Status = 'Converted' THEN 1 ELSE 0 END) AS converted
        FROM ccms_sales_visit sv
        LEFT JOIN ccms_sales_lead sl ON sv.CM_Lead_ID = sl.CM_Lead_ID
        LEFT JOIN ccms_industrial ind ON sl.CM_Industrial_ID = ind.CM_Industrial_ID
        WHERE sv.CM_Is_Deleted = 0 AND sl.CM_Is_Deleted = 0 ${filter}
        GROUP BY ind.CM_Industrial_Name
        ORDER BY total_visits DESC
      `, params);

      return safeJsonResponse({ industrialWise: report || [] });
    }

    if (type === 'categoryWise') {
      let filter = '';
      const params: any[] = [];
      if (fromDate) { filter += ' AND sv.CM_Visit_Date >= ?'; params.push(formatDbDate(fromDate)); }
      if (toDate) { filter += ' AND sv.CM_Visit_Date <= ?'; params.push(formatDbDate(toDate)); }

      const [report]: any = await db.query(`
        SELECT 
          COALESCE(cat.CM_Category_Name, 'Unspecified') AS category_name,
          COUNT(*) AS total_visits,
          SUM(CASE WHEN sv.CM_Demo_Given = 'Yes' THEN 1 ELSE 0 END) AS demos,
          SUM(CASE WHEN sv.CM_Visit_Status = 'Converted' THEN 1 ELSE 0 END) AS converted
        FROM ccms_sales_visit sv
        LEFT JOIN ccms_sales_lead sl ON sv.CM_Lead_ID = sl.CM_Lead_ID
        LEFT JOIN ccms_sales_category cat ON sl.CM_Category_ID = cat.CM_Category_ID
        WHERE sv.CM_Is_Deleted = 0 AND sl.CM_Is_Deleted = 0 ${filter}
        GROUP BY cat.CM_Category_Name
        ORDER BY total_visits DESC
      `, params);

      return safeJsonResponse({ categoryWise: report || [] });
    }

    if (type === 'subcategoryWise') {
      let filter = '';
      const params: any[] = [];
      if (fromDate) { filter += ' AND sv.CM_Visit_Date >= ?'; params.push(formatDbDate(fromDate)); }
      if (toDate) { filter += ' AND sv.CM_Visit_Date <= ?'; params.push(formatDbDate(toDate)); }

      const [report]: any = await db.query(`
        SELECT 
          COALESCE(sub.CM_Subcategory_Name, 'Unspecified') AS subcategory_name,
          COUNT(*) AS total_visits,
          SUM(CASE WHEN sv.CM_Demo_Given = 'Yes' THEN 1 ELSE 0 END) AS demos,
          SUM(CASE WHEN sv.CM_Visit_Status = 'Converted' THEN 1 ELSE 0 END) AS converted
        FROM ccms_sales_visit sv
        LEFT JOIN ccms_sales_lead sl ON sv.CM_Lead_ID = sl.CM_Lead_ID
        LEFT JOIN ccms_sales_subcategory sub ON sl.CM_Subcategory_ID = sub.CM_Subcategory_ID
        WHERE sv.CM_Is_Deleted = 0 AND sl.CM_Is_Deleted = 0 ${filter}
        GROUP BY sub.CM_Subcategory_Name
        ORDER BY total_visits DESC
      `, params);

      return safeJsonResponse({ subcategoryWise: report || [] });
    }

    return safeJsonResponse({ error: 'Invalid report type' }, 400);
  } catch (error: any) {
    console.error('Error generating report:', error);
    return safeJsonResponse({ error: 'Failed to generate report', details: error.message }, 500);
  }
}
