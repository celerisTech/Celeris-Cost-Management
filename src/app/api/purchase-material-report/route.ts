import { NextResponse } from "next/server";
import getDb from "@/app/utils/db";

export async function GET(request) {
  try {
    // Get the year from query params, default to current year
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') || new Date().getFullYear();
    
    const db = await getDb();

    // Get monthly purchase, allocation, and usage data for the selected year
    const [monthlyData] = await db.query(`
      WITH monthly_purchase AS (
        SELECT 
          YEAR(CM_Purchase_Date) as year,
          MONTH(CM_Purchase_Date) as month,
          SUM(CM_Grand_Total) as purchase_amount
        FROM ccms_purchase 
        WHERE CM_Is_Status = 'Active'
        AND YEAR(CM_Purchase_Date) = ?
        GROUP BY YEAR(CM_Purchase_Date), MONTH(CM_Purchase_Date)
      ),
      monthly_allocation AS (
        SELECT 
          YEAR(pp.CM_Created_At) as year,
          MONTH(pp.CM_Created_At) as month,
          SUM(pp.CM_Total_Price) as allocated_amount
        FROM ccms_project_products pp
        WHERE pp.CM_Alloceted_To IN ('Godown', 'Department', 'Order')
        AND YEAR(pp.CM_Created_At) = ?
        GROUP BY YEAR(pp.CM_Created_At), MONTH(pp.CM_Created_At)
      ),
      monthly_usage AS (
        SELECT 
          YEAR(pu.CM_Working_Date) as year,
          MONTH(pu.CM_Working_Date) as month,
          SUM(pu.CM_Used_Quantity * (
            SELECT CM_Unit_Price 
            FROM ccms_project_products 
            WHERE CM_Product_ID = pu.CM_Product_ID 
            LIMIT 1
          )) as used_amount
        FROM ccms_project_product_updates pu
        WHERE pu.CM_Used_Quantity > 0
        AND YEAR(pu.CM_Working_Date) = ?
        GROUP BY YEAR(pu.CM_Working_Date), MONTH(pu.CM_Working_Date)
      ),
      all_months AS (
        SELECT m AS month, ? AS year
        FROM (
          SELECT 1 AS m UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6
          UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12
        ) months
      )
      
      SELECT 
        am.year,
        am.month,
        DATE_FORMAT(STR_TO_DATE(CONCAT(am.year, '-', am.month, '-01'), '%Y-%m-%d'), '%b') as month_name,
        COALESCE(mp.purchase_amount, 0) as purchase_amount,
        COALESCE(ma.allocated_amount, 0) as allocated_amount,
        COALESCE(mu.used_amount, 0) as used_amount
      FROM all_months am
      LEFT JOIN monthly_purchase mp ON am.year = mp.year AND am.month = mp.month
      LEFT JOIN monthly_allocation ma ON am.year = ma.year AND am.month = ma.month
      LEFT JOIN monthly_usage mu ON am.year = mu.year AND am.month = mu.month
      ORDER BY am.month ASC
    `, [year, year, year, year]);

    // Get yearly totals for the selected year
    const [yearlyTotals] = await db.query(`
      SELECT 
        COALESCE(SUM(p.CM_Grand_Total), 0) as total_purchase,
        COALESCE((SELECT SUM(CM_Total_Price) FROM ccms_project_products 
                  WHERE YEAR(CM_Created_At) = ?), 0) as total_allocated,
        COALESCE((SELECT SUM(pu.CM_Used_Quantity * pp.CM_Unit_Price) 
                  FROM ccms_project_product_updates pu
                  JOIN ccms_project_products pp ON pu.CM_Product_ID = pp.CM_Product_ID
                  WHERE YEAR(pu.CM_Working_Date) = ?), 0) as total_used
      FROM ccms_purchase p
      WHERE p.CM_Is_Status = 'Active'
      AND YEAR(p.CM_Purchase_Date) = ?
    `, [year, year, year]);

    // Get recent purchases for selected year
    const [recentPurchases] = await db.query(`
      SELECT 
        CM_Product_ID,
        CM_Product_Name,
        CM_Bill_Number,
        CM_Supplier_ID,
        CM_Purchase_Date,
        CM_Quantity,
        CM_Unit_Type,
        CM_Unit_Price,
        CM_Total_Price,
        CM_Payment_Status
      FROM ccms_purchase 
      WHERE CM_Is_Status = 'Active'
      AND YEAR(CM_Purchase_Date) = ?
      ORDER BY CM_Purchase_Date DESC 
      LIMIT 10
    `, [year]);

    // Get project-wise material usage for selected year
    const [projectUsage] = await db.query(`
      SELECT 
          p.CM_Project_Name,
          p.CM_Project_ID,
          p.CM_Project_Code,
          p.CM_Project_Type,
          c.CM_Customer_Name,
          SUM(pu.CM_Used_Quantity * pp.CM_Unit_Price) AS total_used_cost,
          COUNT(DISTINCT pu.CM_Product_ID) AS products_used
      FROM ccms_project_product_updates pu
      JOIN ccms_projects p 
          ON pu.CM_Project_ID = p.CM_Project_ID
      JOIN ccms_project_products pp 
          ON pu.CM_Product_ID = pp.CM_Product_ID
      LEFT JOIN ccms_customer c 
          ON p.CM_Customer_ID = c.CM_Customer_ID
      WHERE pu.CM_Used_Quantity > 0
        AND YEAR(pu.CM_Working_Date) = ?
      GROUP BY 
          p.CM_Project_ID,
          p.CM_Project_Code,
          p.CM_Project_Name, 
          p.CM_Project_Type, 
          c.CM_Customer_Name
      ORDER BY 
          total_used_cost DESC
    `, [year]);

    const response = NextResponse.json({
      monthlyData,
      yearlyTotals: yearlyTotals[0] || { total_purchase: 0, total_allocated: 0, total_used: 0 },
      recentPurchases,
      projectUsage,
      selectedYear: year
    });

    response.headers.set('Cache-Control', 'no-store, must-revalidate');
    return response;
  } catch (err) {
    console.error("Error fetching purchase material report:", err);
    const response = NextResponse.json(
      { error: "Failed to fetch purchase material data" },
      { status: 500 }
    );
    response.headers.set('Cache-Control', 'no-store');
    return response;
  }
}
