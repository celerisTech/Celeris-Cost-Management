// src\app\api\budget-expense\route.ts
import { NextResponse } from "next/server";
import getDb from "@/app/utils/db";

export async function GET() {
    try {
        const db = await getDb();

        const [rows] = await db.query(`
        SELECT 
            p.CM_Project_ID,
            p.CM_Project_Code,
            p.CM_Project_Name,
            p.CM_Project_Type,
            p.CM_Estimated_Cost,
            p.CM_Planned_Start_Date,
            p.CM_Planned_End_Date,

            /* Material Cost */
            (SELECT IFNULL(SUM(pp.CM_Total_Price), 0) 
            FROM ccms_project_products pp 
            WHERE pp.CM_Project_ID = p.CM_Project_ID) AS Total_Material_Cost,

            /* Labor Cost */
            (SELECT IFNULL(SUM(
                CASE 
                    WHEN l.CM_Wage_Type = 'PerHour' THEN a.CM_Total_Working_Hours * l.CM_Wage_Amount
                    WHEN l.CM_Wage_Type = 'PerDay' THEN 
                        CASE 
                            WHEN a.CM_Status = 'Present' THEN l.CM_Wage_Amount
                            WHEN a.CM_Status = 'Half-Day' THEN l.CM_Wage_Amount * 0.5
                            ELSE 0
                        END
                    WHEN l.CM_Wage_Type = 'PerMonth' THEN 
                        CASE 
                            WHEN a.CM_Status = 'Present' THEN (l.CM_Wage_Amount / 26)
                            WHEN a.CM_Status = 'Half-Day' THEN (l.CM_Wage_Amount / 26) * 0.5
                            ELSE 0
                        END
                    ELSE 0
                END
            ), 0)
            FROM ccms_attendance a
            JOIN ccms_labor l ON a.CM_Labor_ID = l.CM_Labor_Type_ID
            WHERE a.CM_Project_ID = p.CM_Project_ID) AS Total_Labor_Cost,

            /* Transport Cost */
            (SELECT IFNULL(SUM(t.CM_Total_Amount), 0)
            FROM ccms_project_transport t
            WHERE t.CM_Project_ID = p.CM_Project_ID
            ) AS Total_Transport_Cost,

            /* Actual Cost = Material + Labor + Transport */
            (
                (SELECT IFNULL(SUM(pp.CM_Total_Price), 0) 
                FROM ccms_project_products pp 
                WHERE pp.CM_Project_ID = p.CM_Project_ID)
                +
                (SELECT IFNULL(SUM(
                    CASE 
                        WHEN l.CM_Wage_Type = 'PerHour' THEN a.CM_Total_Working_Hours * l.CM_Wage_Amount
                        WHEN l.CM_Wage_Type = 'PerDay' THEN 
                            CASE 
                                WHEN a.CM_Status = 'Present' THEN l.CM_Wage_Amount
                                WHEN a.CM_Status = 'Half-Day' THEN l.CM_Wage_Amount * 0.5
                                ELSE 0
                            END
                        WHEN l.CM_Wage_Type = 'PerMonth' THEN 
                            CASE 
                                WHEN a.CM_Status = 'Present' THEN (l.CM_Wage_Amount / 26)
                                WHEN a.CM_Status = 'Half-Day' THEN (l.CM_Wage_Amount / 26) * 0.5
                                ELSE 0
                            END
                        ELSE 0
                    END
                ), 0)
                FROM ccms_attendance a
                JOIN ccms_labor l ON a.CM_Labor_ID = l.CM_Labor_Type_ID
                WHERE a.CM_Project_ID = p.CM_Project_ID)
                +
                (SELECT IFNULL(SUM(t.CM_Total_Amount), 0)
                FROM ccms_project_transport t
                WHERE t.CM_Project_ID = p.CM_Project_ID)
            ) AS Actual_Cost,

            /* Cost Variance */
            (
                p.CM_Estimated_Cost -
                (
                    (SELECT IFNULL(SUM(pp.CM_Total_Price), 0) 
                    FROM ccms_project_products pp 
                    WHERE pp.CM_Project_ID = p.CM_Project_ID)
                    +
                    (SELECT IFNULL(SUM(
                        CASE 
                            WHEN l.CM_Wage_Type = 'PerHour' THEN a.CM_Total_Working_Hours * l.CM_Wage_Amount
                            WHEN l.CM_Wage_Type = 'PerDay' THEN 
                                CASE 
                                    WHEN a.CM_Status = 'Present' THEN l.CM_Wage_Amount
                                    WHEN a.CM_Status = 'Half-Day' THEN l.CM_Wage_Amount * 0.5
                                    ELSE 0
                                END
                            WHEN l.CM_Wage_Type = 'PerMonth' THEN 
                                CASE 
                                    WHEN a.CM_Status = 'Present' THEN (l.CM_Wage_Amount / 26)
                                    WHEN a.CM_Status = 'Half-Day' THEN (l.CM_Wage_Amount / 26) * 0.5
                                    ELSE 0
                                END
                            ELSE 0
                        END
                    ), 0)
                    FROM ccms_attendance a
                    JOIN ccms_labor l ON a.CM_Labor_ID = l.CM_Labor_Type_ID
                    WHERE a.CM_Project_ID = p.CM_Project_ID)
                    +
                    (SELECT IFNULL(SUM(t.CM_Total_Amount), 0)
                    FROM ccms_project_transport t
                    WHERE t.CM_Project_ID = p.CM_Project_ID)
                )
            ) AS Cost_Variance

        FROM ccms_projects p
        GROUP BY p.CM_Project_ID, p.CM_Project_Name, p.CM_Estimated_Cost, p.CM_Project_Type
    `);

        const res = NextResponse.json(rows);
        res.headers.set('Cache-Control', 'no-store');
        return res;
    } catch (err) {
        console.error("Error fetching project cost report:", err);
        const res = NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
        res.headers.set('Cache-Control', 'no-store');
        return res;
    }
}