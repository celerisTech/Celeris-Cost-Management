import { NextResponse } from 'next/server';
import getDb from "@/app/utils/db";

export async function GET(request, context) {
  const params = await context.params;
  const projectId = params.projectId;

  if (!projectId) {
    const res = NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }

  let db;

  try {
    db = await getDb();

    // Fetch project overview
    const projectQuery = `
      SELECT 
        p.CM_Project_ID,
        p.CM_Project_Code,
        p.CM_Project_Name,
        p.CM_Project_Type,
        p.CM_Description,
        p.CM_Customer_ID,
        c.CM_Customer_Name,
        p.CM_Project_Location,
        p.CM_Project_Customer,
        p.CM_Estimated_Cost,
        p.CM_Status,
        p.CM_Planned_Start_Date,
        p.CM_Planned_End_Date,
        
        -- Material cost
        COALESCE((SELECT SUM(pp.CM_Total_Price) 
         FROM ccms_project_products pp 
         WHERE pp.CM_Project_ID = p.CM_Project_ID), 0) AS Total_Material_Cost,
        
        -- Labor cost
        COALESCE((SELECT SUM(
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
            END)
         FROM ccms_attendance a
         JOIN ccms_labor l ON a.CM_Labor_ID = l.CM_Labor_Type_ID
         WHERE a.CM_Project_ID = p.CM_Project_ID), 0) AS Total_Labor_Cost,
         
        -- Used Material Cost
        COALESCE((
          SELECT SUM(
            COALESCE(
              (SELECT pu.CM_Used_Quantity 
              FROM ccms_project_product_updates pu 
              WHERE pu.CM_Project_ID = pp.CM_Project_ID 
              AND pu.CM_Product_ID = pp.CM_Product_ID
              ORDER BY pu.CM_Updated_At DESC 
              LIMIT 1), 0
            ) * (pp.CM_Total_Price / NULLIF(
              (pp.CM_Quantity + 
                COALESCE(
                  (SELECT pu.CM_Used_Quantity 
                  FROM ccms_project_product_updates pu 
                  WHERE pu.CM_Project_ID = pp.CM_Project_ID 
                  AND pu.CM_Product_ID = pp.CM_Product_ID
                  ORDER BY pu.CM_Updated_At DESC 
                  LIMIT 1), 0
                )
              ), 0)
            )
          ) 
          FROM ccms_project_products pp
          WHERE pp.CM_Project_ID = p.CM_Project_ID
        ), 0) AS Used_Material_Cost,
        
        -- Remaining Material Cost
        COALESCE((
          SELECT SUM(
            pp.CM_Quantity * (pp.CM_Total_Price / NULLIF(
              (pp.CM_Quantity + 
                COALESCE(
                  (SELECT pu.CM_Used_Quantity 
                  FROM ccms_project_product_updates pu 
                  WHERE pu.CM_Project_ID = pp.CM_Project_ID 
                  AND pu.CM_Product_ID = pp.CM_Product_ID
                  ORDER BY pu.CM_Updated_At DESC 
                  LIMIT 1), 0
                )
              ), 0)
            )
          )
          FROM ccms_project_products pp
          WHERE pp.CM_Project_ID = p.CM_Project_ID
        ), 0) AS Remaining_Material_Cost
        
      FROM ccms_projects p
      LEFT JOIN ccms_customer c ON p.CM_Customer_ID = c.CM_Customer_ID
      WHERE p.CM_Project_ID = ?
    `;

    const [projectRows] = await db.query(projectQuery, [projectId]);

    if (!projectRows || projectRows.length === 0) {
      const res = NextResponse.json({ error: "Project not found" }, { status: 404 });
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    const project = projectRows[0];

    // Calculate derived fields
    const actualCost = (Number(project.Total_Material_Cost) || 0) + (Number(project.Total_Labor_Cost) || 0);
    const costVariance = (Number(project.CM_Estimated_Cost) || 0) - actualCost;

    // Fetch task master data
    const taskMasterQuery = `
      SELECT 
        tm.CM_Task_ID,
        tm.CM_Task_Name,
        tm.CM_Assign_Date,
        tm.CM_Due_Date,
        tm.CM_Is_Active,
        tm.CM_Image_URL,
        e.CM_First_Name AS Engineer_First_Name,
        e.CM_Last_Name AS Engineer_Last_Name
      FROM ccms_task_master tm
      LEFT JOIN ccms_users e ON tm.CM_Engineer_ID = e.CM_User_ID
      WHERE tm.CM_Project_ID = ?
      ORDER BY tm.CM_Assign_Date DESC
    `;
    const [taskMasterRows] = await db.query(taskMasterQuery, [projectId]);

    // Fetch task updates with latest status for each task
    const taskProgressQuery = `
      SELECT 
        tu.CM_Task_ID,
        tu.CM_Status,
        tu.CM_Update_Date,
        ROW_NUMBER() OVER (PARTITION BY tu.CM_Task_ID ORDER BY tu.CM_Update_Date DESC, tu.CM_Uploaded_At DESC) as rn
      FROM ccms_task_update tu
      WHERE tu.CM_Project_ID = ?
    `;
    const [taskProgressRows] = await db.query(taskProgressQuery, [projectId]);

    // Calculate project progress based on tasks
    const calculateTaskBasedProgress = (): number => {
      if (!taskMasterRows || taskMasterRows.length === 0) {
        // If no tasks, fall back to date-based progress
        const startDate = project.CM_Planned_Start_Date ? new Date(project.CM_Planned_Start_Date) : null;
        const endDate = project.CM_Planned_End_Date ? new Date(project.CM_Planned_End_Date) : null;
        const today = new Date();

        if (!startDate || !endDate) return 0;
        if (today < startDate) return 0;
        if (today > endDate) return 100;

        const totalDuration = endDate.getTime() - startDate.getTime();
        const elapsed = today.getTime() - startDate.getTime();
        return Math.round((elapsed / totalDuration) * 100);
      }

      // Get latest status for each task
      const latestTaskStatus = taskProgressRows
        .filter((row: any) => row.rn === 1)
        .reduce((acc: any, row: any) => {
          acc[row.CM_Task_ID] = row.CM_Status;
          return acc;
        }, {});

      // Calculate progress based on task completion
      const totalTasks = taskMasterRows.length;
      const completedTasks = taskMasterRows.filter((task: any) =>
        latestTaskStatus[task.CM_Task_ID] === 'Completed'
      ).length;
      const inProgressTasks = taskMasterRows.filter((task: any) =>
        latestTaskStatus[task.CM_Task_ID] === 'In Progress'
      ).length;

      // Weighted progress calculation
      // Completed tasks count as 100%, In Progress as 50%, others as 0%
      const weightedProgress = (completedTasks * 100 + inProgressTasks * 50) / totalTasks;

      return Math.round(weightedProgress);
    };

    // Alternative progress calculation based on task status distribution
    const calculateDetailedTaskProgress = (): any => {
      if (!taskMasterRows || taskMasterRows.length === 0) {
        return {
          progress: 0,
          completed: 0,
          inProgress: 0,
          pending: 0,
          onHold: 0,
          total: 0
        };
      }

      // Get latest status for each task
      const latestTaskStatus = taskProgressRows
        .filter((row: any) => row.rn === 1)
        .reduce((acc: any, row: any) => {
          acc[row.CM_Task_ID] = row.CM_Status;
          return acc;
        }, {});

      const totalTasks = taskMasterRows.length;
      const completedTasks = taskMasterRows.filter((task: any) =>
        latestTaskStatus[task.CM_Task_ID] === 'Completed'
      ).length;
      const inProgressTasks = taskMasterRows.filter((task: any) =>
        latestTaskStatus[task.CM_Task_ID] === 'In Progress'
      ).length;
      const onHoldTasks = taskMasterRows.filter((task: any) =>
        latestTaskStatus[task.CM_Task_ID] === 'On Hold'
      ).length;
      const pendingTasks = totalTasks - completedTasks - inProgressTasks - onHoldTasks;

      // Weighted progress calculation
      const weightedProgress = (completedTasks * 100 + inProgressTasks * 50 + onHoldTasks * 25) / totalTasks;

      return {
        progress: Math.round(weightedProgress),
        completed: completedTasks,
        inProgress: inProgressTasks,
        pending: pendingTasks,
        onHold: onHoldTasks,
        total: totalTasks
      };
    };

    const taskProgress = calculateDetailedTaskProgress();

    // Add calculated fields to project object
    const enhancedProject = {
      ...project,
      Actual_Cost: actualCost,
      Cost_Variance: costVariance,
      Progress_Percentage: taskProgress.progress,
      Task_Progress: taskProgress
    };

    // Fetch materials/products data with detailed price calculations
    const materialsQuery = `
      SELECT 
            pp.CM_Product_ID,
            pp.CM_Product_Name,
            pp.CM_Quantity AS Total_Qty,
            pp.CM_Unit_Type,
            pp.CM_Total_Price,

            -- Calculate total used quantity across all updates
            COALESCE(SUM(pu.CM_Used_Quantity), 0) AS Total_Used_Qty,

            -- Remaining quantity = allocated - total used
            (pp.CM_Quantity - COALESCE(SUM(pu.CM_Used_Quantity), 0)) AS Remaining_Qty,

            -- Unit price (based on total allocation)
            (pp.CM_Total_Price / NULLIF(pp.CM_Quantity, 0)) AS Unit_Price,

            -- Used price = total used qty * unit price
            COALESCE(SUM(pu.CM_Used_Quantity), 0) * (pp.CM_Total_Price / NULLIF(pp.CM_Quantity, 0)) AS Used_Price,

            -- Remaining price = remaining qty * unit price
            (pp.CM_Quantity - COALESCE(SUM(pu.CM_Used_Quantity), 0)) * (pp.CM_Total_Price / NULLIF(pp.CM_Quantity, 0)) AS Remaining_Price

        FROM ccms_project_products pp
        LEFT JOIN ccms_project_product_updates pu 
            ON pu.CM_Project_ID = pp.CM_Project_ID 
            AND pu.CM_Product_ID = pp.CM_Product_ID

        WHERE pp.CM_Project_ID = ?

        GROUP BY 
            pp.CM_Product_ID,
            pp.CM_Product_Name,
            pp.CM_Quantity,
            pp.CM_Unit_Type,
            pp.CM_Total_Price

        ORDER BY pp.CM_Product_Name

    `;
    const [materialsRows] = await db.query(materialsQuery, [projectId]);

    // Fetch labor data
    const laborQuery = `
      SELECT 
        l.CM_Labor_Type_ID AS Labor_ID,
        l.CM_First_Name,
        l.CM_Last_Name,
        l.CM_Labor_Code,
        l.CM_Labor_Roll AS Role,
        l.CM_Labor_Type,
        l.CM_Wage_Type,
        l.CM_Wage_Amount AS Hourly_Rate,
        COUNT(DISTINCT a.CM_Attendance_Date) AS Days_Present,
        SUM(a.CM_Total_Working_Hours) AS Total_Hours,
        SUM(
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
        ) AS Total_Cost
      FROM ccms_attendance a
      JOIN ccms_labor l ON a.CM_Labor_ID = l.CM_Labor_Type_ID
      WHERE a.CM_Project_ID = ?
      GROUP BY l.CM_Labor_Type_ID, l.CM_First_Name,l.CM_Last_Name, l.CM_Labor_Roll, l.CM_Labor_Type, 
               l.CM_Wage_Type, l.CM_Wage_Amount
      ORDER BY l.CM_First_Name
    `;
    const [laborRows] = await db.query(laborQuery, [projectId]);

    // Fetch working dates data
    const workingDatesQuery = `
      SELECT 
        a.CM_Attendance_Date AS Work_Date,
        COUNT(DISTINCT a.CM_Labor_ID) AS Labor_Count,
        SUM(CASE WHEN a.CM_Status IN ('Present', 'Half-Day') THEN 1 ELSE 0 END) AS Present_Count,
        SUM(a.CM_Total_Working_Hours) AS Total_Hours,
        SUM(
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
        ) AS Daily_Labor_Cost
      FROM ccms_attendance a
      JOIN ccms_labor l ON a.CM_Labor_ID = l.CM_Labor_Type_ID
      WHERE a.CM_Project_ID = ?
      GROUP BY a.CM_Attendance_Date
      ORDER BY a.CM_Attendance_Date
    `;
    const [workingDatesRows] = await db.query(workingDatesQuery, [projectId]);

    // Get product updates
    const productUpdatesQuery = `
     SELECT 
          pu.CM_Update_ID,
          pu.CM_Product_ID,
          pp.CM_Product_Name,
          pu.CM_Original_Quantity,
          pu.CM_Used_Quantity,
          pu.CM_Remaining_Quantity,
          pu.CM_Report,
          pu.CM_Updated_By,
          pu.CM_Updated_At,

          -- Calculate per-unit cost (based on total allocated quantity)
          (pp.CM_Total_Price / NULLIF(pp.CM_Quantity, 0)) AS Unit_Cost,

          -- Calculate cost at time of update
          pu.CM_Used_Quantity * (pp.CM_Total_Price / NULLIF(pp.CM_Quantity, 0)) AS Update_Cost

      FROM ccms_project_product_updates pu
      JOIN ccms_project_products pp 
          ON pu.CM_Project_ID = pp.CM_Project_ID 
          AND pu.CM_Product_ID = pp.CM_Product_ID
      WHERE pu.CM_Project_ID = ?
      ORDER BY pu.CM_Updated_At DESC;
    `;
    const [productUpdatesRows] = await db.query(productUpdatesQuery, [projectId]);

    // Fetch task updates for display
    const taskUpdatesQuery = `
      SELECT 
        tu.CM_Update_ID,
        tu.CM_Task_ID,
        tu.CM_Update_Date,
        tu.CM_Status,
        tu.CM_Remarks,
        tu.CM_Work_Hours,
        tu.CM_Image_URL,
        tm.CM_Task_Name,
        e.CM_First_Name AS Engineer_First_Name,
        e.CM_Last_Name AS Engineer_Last_Name
      FROM ccms_task_update tu
      JOIN ccms_task_master tm ON tu.CM_Task_ID = tm.CM_Task_ID
      LEFT JOIN ccms_users e ON tu.CM_Engineer_ID = e.CM_User_ID
      WHERE tu.CM_Project_ID = ?
      ORDER BY tu.CM_Update_Date DESC, tu.CM_Uploaded_At DESC
    `;
    const [taskUpdatesRows] = await db.query(taskUpdatesQuery, [projectId]);

    // Calculate total used material cost from updates
    const totalUsedMaterialCost = materialsRows.reduce((total, material) => {
      return total + Number(material.Used_Price || 0);
    }, 0);

    // Calculate total remaining material cost
    const totalRemainingMaterialCost = materialsRows.reduce((total, material) => {
      return total + Number(material.Remaining_Price || 0);
    }, 0);

    // Calculate material usage percentages
    const totalMaterialCost = Number(project.Total_Material_Cost) || 0;
    const usedMaterialPercentage = totalMaterialCost > 0 ?
      (totalUsedMaterialCost / totalMaterialCost) * 100 : 0;
    const remainingMaterialPercentage = totalMaterialCost > 0 ?
      (totalRemainingMaterialCost / totalMaterialCost) * 100 : 0;

    // Format the response
    const response = {
      project: {
        ...enhancedProject,
        Used_Material_Cost: totalUsedMaterialCost,
        Remaining_Material_Cost: totalRemainingMaterialCost,
        Used_Material_Percentage: Math.round(usedMaterialPercentage * 10) / 10,
        Remaining_Material_Percentage: Math.round(remainingMaterialPercentage * 10) / 10
      },
      materials: materialsRows || [],
      labor: laborRows || [],
      workingDates: workingDatesRows || [],
      productUpdates: productUpdatesRows || [],
      tasks: taskMasterRows || [],
      taskUpdates: taskUpdatesRows || []
    };

    console.log("Sending project data with status 200");
    const res = NextResponse.json(response);
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error) {
    console.error('Error fetching project details:', error);
    const res = NextResponse.json(
      { error: 'Failed to fetch project details: ' + (error as Error).message },
      { status: 500 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}