// src/app/api/milestone/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/app/utils/db';

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params; // ✅ await params
    const milestoneId = id;

    const db = await getDb();

    try {
        const [rows] = await db.query(
            `WITH milestone_info AS (
                SELECT 
                    CM_Milestone_ID,
                    CM_Project_ID,
                    CM_Milestone_Name,
                    CM_Description,
                    CM_Planned_Start_Date,
                    CM_Planned_End_Date,
                    CM_Percentage_Weightage
                FROM ccms_milestone
                WHERE CM_Milestone_ID = ?
            ),
            task_summary AS (
                SELECT 
                    t.CM_Milestone_ID,
                    COUNT(*) AS total_tasks,
                    SUM(CASE WHEN tu_latest.CM_Status = 'Completed' THEN 1 ELSE 0 END) AS completed_tasks
                FROM ccms_task_master t
                LEFT JOIN (
                    SELECT 
                        tu.CM_Task_ID,
                        SUBSTRING_INDEX(
                            GROUP_CONCAT(tu.CM_Status ORDER BY tu.CM_Update_Date DESC),
                            ',', 1
                        ) AS CM_Status
                    FROM ccms_task_update tu
                    GROUP BY tu.CM_Task_ID
                ) tu_latest ON t.CM_Task_ID = tu_latest.CM_Task_ID
                WHERE t.CM_Milestone_ID = ?
                GROUP BY t.CM_Milestone_ID
            ),
            attendance_data AS (
                SELECT 
                    a.CM_Labor_ID,
                    a.CM_Project_ID,
                    SUM(
                        CASE 
                            WHEN a.CM_Status = 'Half-Day' THEN 0.5
                            ELSE 1
                        END
                    ) AS working_days,
                    SUM(a.CM_Total_Working_Hours) AS total_hours
                FROM ccms_attendance a
                JOIN milestone_info m
                ON a.CM_Project_ID = m.CM_Project_ID
                AND a.CM_Attendance_Date BETWEEN m.CM_Planned_Start_Date AND m.CM_Planned_End_Date
                WHERE a.CM_Status IN ('Present','Half-Day')
                GROUP BY a.CM_Labor_ID, a.CM_Project_ID
            ),
            labor_cost_data AS (
                SELECT 
                    ad.CM_Project_ID,
                    SUM(
                        CASE 
                            WHEN l.CM_Wage_Type = 'PerMonth' THEN (l.CM_Wage_Amount / 26) * ad.working_days
                            WHEN l.CM_Wage_Type = 'PerDay' THEN l.CM_Wage_Amount * ad.working_days
                            WHEN l.CM_Wage_Type = 'PerHour' THEN l.CM_Wage_Amount * ad.total_hours
                            ELSE 0
                        END
                    ) AS total_labor_cost
                FROM attendance_data ad
                LEFT JOIN ccms_labor l 
                    ON ad.CM_Labor_ID = l.CM_Labor_Type_ID
                GROUP BY ad.CM_Project_ID
            ),
            material_cost_data AS (
                SELECT 
                    ppu.CM_Project_ID,
                    SUM(ppu.CM_Used_Quantity * pp.CM_Unit_Price) AS total_material_cost
                FROM ccms_project_product_updates ppu
                JOIN ccms_project_products pp 
                ON ppu.CM_Product_ID = pp.CM_Product_ID
                AND ppu.CM_Project_ID = pp.CM_Project_ID
                WHERE ppu.CM_Milestone_ID = ?
                GROUP BY ppu.CM_Project_ID
            ),

            -- 🚚 NEW: TRANSPORT COST
            transport_cost_data AS (
                SELECT 
                    t.CM_Project_ID,
                    SUM(t.CM_Total_Amount) AS total_transport_cost
                FROM ccms_project_transport t
                WHERE t.CM_Milestone_ID = ?
                GROUP BY t.CM_Project_ID
            )

            SELECT 
                m.CM_Milestone_ID,
                m.CM_Milestone_Name,
                m.CM_Description,
                m.CM_Planned_Start_Date,
                m.CM_Planned_End_Date,
                ts.total_tasks,
                ts.completed_tasks,
                COALESCE(lc.total_labor_cost,0) AS total_labor_cost,
                COALESCE(mc.total_material_cost,0) AS total_material_cost,
                COALESCE(tc.total_transport_cost,0) AS total_transport_cost,
                
                -- 👇 TOTAL = LABOR + MATERIAL + TRANSPORT
                COALESCE(lc.total_labor_cost,0)
                + COALESCE(mc.total_material_cost,0)
                + COALESCE(tc.total_transport_cost,0) AS total_project_cost

            FROM milestone_info m
            LEFT JOIN task_summary ts 
                ON m.CM_Milestone_ID = ts.CM_Milestone_ID
            LEFT JOIN labor_cost_data lc 
                ON m.CM_Project_ID = lc.CM_Project_ID
            LEFT JOIN material_cost_data mc 
                ON m.CM_Project_ID = mc.CM_Project_ID
            LEFT JOIN transport_cost_data tc
                ON m.CM_Project_ID = tc.CM_Project_ID
      `,
            [milestoneId, milestoneId, milestoneId, milestoneId]
        );

        const res = NextResponse.json({ success: true, data: rows[0] || {} });
        res.headers.set('Cache-Control', 'no-store');
        return res;
    } catch (error: any) {
        console.error('Milestone summary error:', error);
        const res = NextResponse.json({ success: false, message: error.message }, { status: 500 });
        res.headers.set('Cache-Control', 'no-store');
        return res;
    }
}
