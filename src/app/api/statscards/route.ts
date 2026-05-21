import { NextResponse } from "next/server";
import getDb from "@/app/utils/db";

type StatsResponse = {
  total_projects: number;
  total_labour: number;
  total_stock_value: number;
  budget_utilized_percent: number;
};

export async function GET() {
  try {
    const db = await getDb();

    // Total Projects
    const [[proj]]: any = await db.query(
      "SELECT COUNT(*) AS total_projects FROM ccms_projects"
    );

    // Total Labour
    const [[lab]]: any = await db.query(
      "SELECT COUNT(*) AS total_labour FROM ccms_labor"
    );

    // Total Stock Value
    const [[stock]]: any = await db.query(
      `SELECT 
            ROUND(SUM(im.CM_Stock_Level * COALESCE(p.latest_unit_price, 0)), 2) AS total_stock_value
        FROM ccms_item_master im
        LEFT JOIN (
            SELECT 
                p1.CM_Item_ID,
                p1.CM_Unit_Price AS latest_unit_price
            FROM ccms_purchase p1
            JOIN (
                SELECT 
                    CM_Item_ID, 
                    MAX(CM_Purchase_Date) AS latest_date
                FROM ccms_purchase
                WHERE CM_Is_Status = 'Active'
                GROUP BY CM_Item_ID
            ) p2 
              ON p1.CM_Item_ID = p2.CM_Item_ID 
            AND p1.CM_Purchase_Date = p2.latest_date
        ) p 
          ON im.CM_Item_ID = p.CM_Item_ID
        WHERE im.CM_Is_Status = 'Active'`
    );

    // CORRECTED: Budget Utilized % using your complex query
    const [budgetData]: any = await db.query(`
      SELECT 
    SUM(p.CM_Estimated_Cost) AS total_budget,
    SUM(
        (
            SELECT IFNULL(SUM(
                CASE 
                    WHEN l.CM_Wage_Type = 'PerHour' 
                        THEN a.CM_Total_Working_Hours * l.CM_Wage_Amount

                    WHEN l.CM_Wage_Type = 'PerDay' 
                        THEN CASE 
                            WHEN a.CM_Status = 'Present' THEN l.CM_Wage_Amount
                            WHEN a.CM_Status = 'Half-Day' THEN l.CM_Wage_Amount * 0.5
                            ELSE 0
                        END

                    WHEN l.CM_Wage_Type = 'PerMonth' 
                        THEN CASE 
                            WHEN a.CM_Status = 'Present' THEN (l.CM_Wage_Amount / 26)
                            WHEN a.CM_Status = 'Half-Day' THEN (l.CM_Wage_Amount / 26) * 0.5
                            ELSE 0
                        END
                    ELSE 0
                END
            ), 0)
            FROM ccms_attendance a
            JOIN ccms_labor l 
                ON a.CM_Labor_ID = l.CM_Labor_Type_ID
            WHERE a.CM_Project_ID = p.CM_Project_ID
        )
    ) AS total_actual_cost
FROM ccms_projects p
WHERE p.CM_Estimated_Cost > 0

    `);

    const totalProjects = Number(proj?.total_projects ?? 0);
    const totalLabour = Number(lab?.total_labour ?? 0);
    const totalStockValue = Number(stock?.total_stock_value ?? 0);

    const totalBudget = Number(budgetData[0]?.total_budget ?? 0);
    const totalActualCost = Number(budgetData[0]?.total_actual_cost ?? 0);

    const budgetUtilizedPercent =
      totalBudget > 0 ? Math.round((totalActualCost / totalBudget) * 100) : 0;

    const payload: StatsResponse = {
      total_projects: totalProjects,
      total_labour: totalLabour,
      total_stock_value: totalStockValue,
      budget_utilized_percent: budgetUtilizedPercent,
    };

    const res = NextResponse.json(payload, { status: 200 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (err: any) {
    console.error("/api/statscards error:", err);
    const res = NextResponse.json(
      { error: "Failed to compute stats" },
      { status: 500 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}