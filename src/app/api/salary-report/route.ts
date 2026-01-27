import { NextResponse } from "next/server";
import getDb from "@/app/utils/db";

export async function GET(req: Request) {
  try {
    const pool = await getDb();
    const { searchParams } = new URL(req.url);

    const month = searchParams.get("month"); // 1-12
    const year = searchParams.get("year");   // 2025, etc.

    // Dynamic date filter
    let dateFilter = "1"; // default = no filter
    let incentiveDateFilter = "1"; // for incentives table
    
    if (month && year) {
      dateFilter = `MONTH(a.CM_Attendance_Date) = ${month} AND YEAR(a.CM_Attendance_Date) = ${year}`;
      incentiveDateFilter = `MONTH(CM_Incentive_Date) = ${month} AND YEAR(CM_Incentive_Date) = ${year}`;
    } else if (month) {
      dateFilter = `MONTH(a.CM_Attendance_Date) = ${month}`;
      incentiveDateFilter = `MONTH(CM_Incentive_Date) = ${month}`;
    } else if (year) {
      dateFilter = `YEAR(a.CM_Attendance_Date) = ${year}`;
      incentiveDateFilter = `YEAR(CM_Incentive_Date) = ${year}`;
    }

    // Get employees with their base salary and incentives
    const [employees]: any = await pool.query(`
      SELECT 
          l.CM_Labor_Type_ID AS laborId,
          COALESCE(
              CONCAT(l.CM_First_Name, ' ', l.CM_Last_Name),
              l.CM_First_Name,
              l.CM_Last_Name,
              'Unknown Employee'
          ) AS laborName,
          l.CM_Labor_Code,
          l.CM_Labor_Type,
          l.CM_Status,
          l.CM_Phone_Number,
          l.CM_Wage_Type,
          l.CM_Wage_Amount,

          COALESCE(attendance_data.totalPresentDays, 0) AS totalPresentDays,
          COALESCE(attendance_data.baseSalary, 0) AS baseSalary,

          -- Updated incentive fields
          COALESCE(incentive_data.totalIncentives, 0) AS incentiveAmount,
          incentive_data.incentiveId AS incentiveId,

          ROUND(
              COALESCE(attendance_data.baseSalary, 0) 
              + COALESCE(incentive_data.totalIncentives, 0), 
          0) AS totalSalary

      FROM ccms_labor l

      LEFT JOIN (
          SELECT 
              a.CM_Labor_ID,
              COUNT(a.CM_Attendance_ID) AS totalPresentDays,
              SUM(
                  CASE 
                      WHEN l2.CM_Wage_Type = 'PerDay' 
                          THEN l2.CM_Wage_Amount

                      WHEN l2.CM_Wage_Type = 'PerHour' 
                          THEN IFNULL(a.CM_Total_Working_Hours, 0) * l2.CM_Wage_Amount

                      WHEN l2.CM_Wage_Type = 'PerMonth' 
                          THEN (l2.CM_Wage_Amount / 26)

                      ELSE 0
                  END
              ) AS baseSalary
          FROM ccms_attendance a
          JOIN ccms_labor l2 
              ON a.CM_Labor_ID = l2.CM_Labor_Type_ID
          WHERE a.CM_Status = 'Present' 
            AND ${dateFilter}
          GROUP BY a.CM_Labor_ID
      ) AS attendance_data 
          ON l.CM_Labor_Type_ID = attendance_data.CM_Labor_ID

      LEFT JOIN (
          SELECT 
              CM_Labor_ID,
              SUM(CM_Incentive_Amount) AS totalIncentives,
              MAX(CM_Incentive_ID) AS incentiveId       -- 🟢 Latest incentiveId added
          FROM ccms_incentives
          WHERE ${incentiveDateFilter}
          GROUP BY CM_Labor_ID
      ) AS incentive_data 
          ON l.CM_Labor_Type_ID = incentive_data.CM_Labor_ID

      WHERE 
          attendance_data.totalPresentDays > 0 
          OR incentive_data.totalIncentives > 0

      ORDER BY laborName
    `);

    // Overall totals including incentives
    const [totals]: any = await pool.query(`
      SELECT 
          SUM(totalPresentDays) AS allEmployeesPresentDays,
          ROUND(SUM(baseSalary), 0) AS allEmployeesBaseSalary,
          ROUND(SUM(totalIncentives), 0) AS allEmployeesIncentives,
          ROUND(SUM(baseSalary) + SUM(totalIncentives), 0) AS allEmployeesTotalSalary
      FROM (
          SELECT 
              l.CM_Labor_Type_ID,
              COALESCE(attendance_data.totalPresentDays, 0) AS totalPresentDays,
              COALESCE(attendance_data.baseSalary, 0) AS baseSalary,
              COALESCE(incentive_data.totalIncentives, 0) AS totalIncentives
          FROM ccms_labor l
          LEFT JOIN (
              SELECT 
                  a.CM_Labor_ID,
                  COUNT(a.CM_Attendance_ID) AS totalPresentDays,
                  SUM(
                      CASE 
                          WHEN l2.CM_Wage_Type = 'PerDay' THEN l2.CM_Wage_Amount
                          WHEN l2.CM_Wage_Type = 'PerHour' THEN IFNULL(a.CM_Total_Working_Hours, 0) * l2.CM_Wage_Amount
                          WHEN l2.CM_Wage_Type = 'PerMonth' THEN (l2.CM_Wage_Amount / 26)
                          ELSE 0
                      END
                  ) AS baseSalary
              FROM ccms_attendance a
              JOIN ccms_labor l2 ON a.CM_Labor_ID = l2.CM_Labor_Type_ID
              WHERE a.CM_Status = 'Present' AND ${dateFilter}
              GROUP BY a.CM_Labor_ID
          ) AS attendance_data ON l.CM_Labor_Type_ID = attendance_data.CM_Labor_ID
          LEFT JOIN (
              SELECT 
                  CM_Labor_ID,
                  SUM(CM_Incentive_Amount) AS totalIncentives
              FROM ccms_incentives
              WHERE ${incentiveDateFilter}
              GROUP BY CM_Labor_ID
          ) AS incentive_data ON l.CM_Labor_Type_ID = incentive_data.CM_Labor_ID
          WHERE attendance_data.totalPresentDays > 0 OR incentive_data.totalIncentives > 0
      ) AS summary;
    `);

    const res = NextResponse.json({
      employees,
      totals: totals[0],
    });
    res.headers.set('Cache-Control', 'no-store');
    return res;

  } catch (error) {
    console.error(error);
    const res = NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}
