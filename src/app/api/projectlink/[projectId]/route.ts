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

    // Fetch project overview with solar estimates
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
        
        -- Solar estimates data
        se.CM_System_Size,
        se.CM_Equipment_Total,
        se.CM_Labor_Total,
        se.CM_Other_Total,
        se.CM_Total AS Solar_Estimate_Total,
        se.CM_Equipment_Items,
        se.CM_Labor_Items,
        se.CM_Other_Items,
        
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
        ), 0) AS Remaining_Material_Cost,
        -- Transport cost
      COALESCE((
        SELECT SUM(t.CM_Total_Amount)
        FROM ccms_project_transport t
        WHERE t.CM_Project_ID = p.CM_Project_ID
      ), 0) AS Total_Transport_Cost

      FROM ccms_projects p
      LEFT JOIN ccms_customer c ON p.CM_Customer_ID = c.CM_Customer_ID
      LEFT JOIN ccms_solar_estimates se ON p.CM_Project_ID = se.CM_Project_ID
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
    const actualCost = (Number(project.Total_Material_Cost) || 0) + (Number(project.Total_Labor_Cost) || 0) + (Number(project.Total_Transport_Cost) || 0);
    const costVariance = (Number(project.CM_Estimated_Cost) || 0) - actualCost;

    // Fetch milestones with their tasks and updates
    const milestonesQuery = `
      SELECT 
        m.CM_Milestone_ID,
        m.CM_Milestone_Name,
        m.CM_Description,
        m.CM_Planned_Start_Date,
        m.CM_Planned_End_Date,
        m.CM_Status,
        m.CM_Percentage_Weightage,
        
        -- Task data
        t.CM_Task_ID,
        t.CM_Task_Name,
        t.CM_Assign_Date,
        t.CM_Due_Date,
        t.CM_Is_Active,
        t.CM_Image_URL,
        e.CM_First_Name AS Engineer_First_Name,
        e.CM_Last_Name AS Engineer_Last_Name,
        
        -- Latest task update
        tu.CM_Update_ID,
        tu.CM_Update_Date,
        tu.CM_Status AS Task_Status,
        tu.CM_Remarks,
        tu.CM_Work_Hours,
        tu.CM_Image_URL AS Update_Image_URL,
        tu.CM_Uploaded_At
        
      FROM ccms_milestone m
      LEFT JOIN ccms_task_master t ON m.CM_Milestone_ID = t.CM_Milestone_ID
      LEFT JOIN ccms_users e ON t.CM_Engineer_ID = e.CM_User_ID
      LEFT JOIN (
        SELECT 
          tu1.*,
          ROW_NUMBER() OVER (PARTITION BY tu1.CM_Task_ID ORDER BY tu1.CM_Update_Date DESC, tu1.CM_Uploaded_At DESC) as rn
        FROM ccms_task_update tu1
        WHERE tu1.CM_Project_ID = ?
      ) tu ON t.CM_Task_ID = tu.CM_Task_ID AND tu.rn = 1
      WHERE m.CM_Project_ID = ?
      ORDER BY 
        m.CM_Planned_Start_Date,
        t.CM_Assign_Date
    `;

    const [milestoneRows] = await db.query(milestonesQuery, [projectId, projectId]);

    // Organize milestones with their tasks
    const milestonesMap = new Map();

    milestoneRows.forEach((row: any) => {
      const milestoneId = row.CM_Milestone_ID;

      if (!milestonesMap.has(milestoneId)) {
        milestonesMap.set(milestoneId, {
          CM_Milestone_ID: milestoneId,
          CM_Milestone_Name: row.CM_Milestone_Name,
          CM_Description: row.CM_Description,
          CM_Planned_Start_Date: row.CM_Planned_Start_Date,
          CM_Planned_End_Date: row.CM_Planned_End_Date,
          CM_Status: row.CM_Status,
          CM_Percentage_Weightage: row.CM_Percentage_Weightage,
          tasks: []
        });
      }

      const milestone = milestonesMap.get(milestoneId);

      // Add task if exists
      if (row.CM_Task_ID) {
        const task = {
          CM_Task_ID: row.CM_Task_ID,
          CM_Task_Name: row.CM_Task_Name,
          CM_Assign_Date: row.CM_Assign_Date,
          CM_Due_Date: row.CM_Due_Date,
          CM_Is_Active: row.CM_Is_Active,
          CM_Image_URL: row.CM_Image_URL,
          Engineer_First_Name: row.Engineer_First_Name,
          Engineer_Last_Name: row.Engineer_Last_Name,
          latestUpdate: row.CM_Update_ID ? {
            CM_Update_ID: row.CM_Update_ID,
            CM_Update_Date: row.CM_Update_Date,
            CM_Status: row.Task_Status,
            CM_Remarks: row.CM_Remarks,
            CM_Work_Hours: row.CM_Work_Hours,
            CM_Image_URL: row.Update_Image_URL,
            CM_Uploaded_At: row.CM_Uploaded_At
          } : null
        };

        milestone.tasks.push(task);
      }
    });

    const milestones = Array.from(milestonesMap.values());

    // Calculate project progress based on milestones and tasks
    const calculateMilestoneBasedProgress = (): any => {
      if (!milestones || milestones.length === 0) {
        // If no milestones, fall back to date-based progress
        const startDate = project.CM_Planned_Start_Date ? new Date(project.CM_Planned_Start_Date) : null;
        const endDate = project.CM_Planned_End_Date ? new Date(project.CM_Planned_End_Date) : null;
        const today = new Date();

        if (!startDate || !endDate) return { progress: 0, completed: 0, inProgress: 0, pending: 0, onHold: 0, total: 0 };
        if (today < startDate) return { progress: 0, completed: 0, inProgress: 0, pending: 0, onHold: 0, total: 0 };
        if (today > endDate) return { progress: 100, completed: 0, inProgress: 0, pending: 0, onHold: 0, total: 0 };

        const totalDuration = endDate.getTime() - startDate.getTime();
        const elapsed = today.getTime() - startDate.getTime();
        const progress = Math.round((elapsed / totalDuration) * 100);
        return { progress, completed: 0, inProgress: 0, pending: 0, onHold: 0, total: 0 };
      }

      let totalWeightedProgress = 0;
      let totalWeightage = 0;

      let completedTasks = 0;
      let inProgressTasks = 0;
      let pendingTasks = 0;
      let onHoldTasks = 0;
      let totalTasks = 0;

      milestones.forEach(milestone => {
        const weightage = Number(milestone.CM_Percentage_Weightage) || 0;
        totalWeightage += weightage;

        if (milestone.tasks && milestone.tasks.length > 0) {
          // Calculate milestone progress based on its tasks
          const taskCount = milestone.tasks.length;
          let completedTaskCount = 0;
          let inProgressTaskCount = 0;
          let onHoldTaskCount = 0;

          milestone.tasks.forEach(task => {
            totalTasks++;
            const status = task.latestUpdate?.CM_Status || task.CM_Is_Active;

            if (status === 'Completed') {
              completedTaskCount++;
              completedTasks++;
            } else if (status === 'In Progress') {
              inProgressTaskCount++;
              inProgressTasks++;
            } else if (status === 'On Hold') {
              onHoldTaskCount++;
              onHoldTasks++;
            } else {
              pendingTasks++;
            }
          });

          // Calculate milestone completion percentage
          const milestoneCompletion = taskCount > 0 ?
            (completedTaskCount * 100 + inProgressTaskCount * 50 + onHoldTaskCount * 25) / taskCount : 0;

          totalWeightedProgress += (milestoneCompletion * weightage) / 100;
        } else {
          // If milestone has no tasks, use milestone status directly
          let milestoneProgress = 0;
          switch (milestone.CM_Status) {
            case 'Completed':
              milestoneProgress = 100;
              completedTasks++;
              break;
            case 'In Progress':
              milestoneProgress = 50;
              inProgressTasks++;
              break;
            case 'On Hold':
              milestoneProgress = 25;
              onHoldTasks++;
              break;
            default:
              pendingTasks++;
          }
          totalTasks++;
          totalWeightedProgress += (milestoneProgress * weightage) / 100;
        }
      });

      // Normalize progress if total weightage doesn't equal 100
      const progress = totalWeightage > 0 ? Math.round(totalWeightedProgress * 100 / totalWeightage) : 0;

      return {
        progress,
        completed: completedTasks,
        inProgress: inProgressTasks,
        pending: pendingTasks,
        onHold: onHoldTasks,
        total: totalTasks
      };
    };

    const taskProgress = calculateMilestoneBasedProgress();

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

            -- Join unit type name
            ut.CM_Unit_Name AS Unit_Name,

            pp.CM_Total_Price,

            -- Calculate total used quantity
            COALESCE(SUM(pu.CM_Used_Quantity), 0) AS Total_Used_Qty,

            -- Remaining quantity
            (pp.CM_Quantity - COALESCE(SUM(pu.CM_Used_Quantity), 0)) AS Remaining_Qty,

            -- Unit price
            (pp.CM_Total_Price / NULLIF(pp.CM_Quantity, 0)) AS Unit_Price,

            -- Used price
            COALESCE(SUM(pu.CM_Used_Quantity), 0) * (pp.CM_Total_Price / NULLIF(pp.CM_Quantity, 0)) AS Used_Price,

            -- Remaining price
            (pp.CM_Quantity - COALESCE(SUM(pu.CM_Used_Quantity), 0)) * (pp.CM_Total_Price / NULLIF(pp.CM_Quantity, 0)) AS Remaining_Price

        FROM ccms_project_products pp

        -- PRODUCT UPDATES JOIN
        LEFT JOIN ccms_project_product_updates pu 
            ON pu.CM_Project_ID = pp.CM_Project_ID 
            AND pu.CM_Product_ID = pp.CM_Product_ID

        -- UNIT TYPE JOIN
        LEFT JOIN ccms_unit_type ut
            ON ut.CM_Unit_ID = pp.CM_Unit_Type

        WHERE pp.CM_Project_ID = ?

        GROUP BY 
            pp.CM_Product_ID,
            pp.CM_Product_Name,
            pp.CM_Quantity,
            ut.CM_Unit_Name,
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
         a.CM_Labor_ID,
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
      GROUP BY a.CM_Attendance_Date, a.CM_Labor_ID
      ORDER BY a.CM_Attendance_Date
    `;
    const [workingDatesRows] = await db.query(workingDatesQuery, [projectId]);
    // Fetch service history
    const servicesQuery = `
  SELECT 
    s.CM_Service_ID,
    s.CM_Project_ID,
    s.CM_Service_Type,
    s.CM_Description,
    s.CM_Service_Date,
    s.CM_Service_Amount,
    s.CM_Tax_Amount,
    s.CM_Total_Amount,
    s.CM_Attachment,
    s.CM_Status,
    s.CM_Created_By,
    s.CM_Created_At
  FROM ccms_project_services s
  WHERE s.CM_Project_ID = ?
  ORDER BY s.CM_Service_Date DESC, s.CM_Created_At DESC
`;

    const [serviceRows] = await db.query(servicesQuery, [projectId]);
    // Fetch transport history
    const transportQuery = `
  SELECT 
    t.CM_Transport_ID,
    t.CM_Project_ID,
    t.CM_Transport_Type,
    t.CM_Description,
    t.CM_Transport_Date,
    t.CM_Amount,
    t.CM_Tax_Amount,
    t.CM_Total_Amount,
    t.CM_Attachment,
    t.CM_Status,
    t.CM_Created_By,
    t.CM_Created_At
  FROM ccms_project_transport t
  WHERE t.CM_Project_ID = ?
  ORDER BY t.CM_Transport_Date DESC, t.CM_Created_At DESC
`;

    const [transportRows] = await db.query(transportQuery, [projectId]);

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

    // Fetch all task updates for display
    const taskUpdatesQuery = `
      SELECT 
        tu.CM_Update_ID,
        tu.CM_Task_ID,
        tu.CM_Update_Date,
        tu.CM_Status,
        tu.CM_Remarks,
        tu.CM_Work_Hours,
        tu.CM_Image_URL,
        tu.CM_Uploaded_At,
        tm.CM_Task_Name,
        m.CM_Milestone_Name,
        e.CM_First_Name AS Engineer_First_Name,
        e.CM_Last_Name AS Engineer_Last_Name
      FROM ccms_task_update tu
      JOIN ccms_task_master tm ON tu.CM_Task_ID = tm.CM_Task_ID
      LEFT JOIN ccms_milestone m ON tm.CM_Milestone_ID = m.CM_Milestone_ID
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

    // In the API route, replace the solar estimate parsing section with this:

    // Parse solar estimate items if they exist
    let equipmentItems = [];
    let laborItems = [];
    let otherItems = [];

    try {
      if (project.CM_Equipment_Items) {
        // Check if it's already an object or a string
        if (typeof project.CM_Equipment_Items === 'string') {
          equipmentItems = JSON.parse(project.CM_Equipment_Items);
        } else {
          equipmentItems = project.CM_Equipment_Items;
        }
      }
      if (project.CM_Labor_Items) {
        if (typeof project.CM_Labor_Items === 'string') {
          laborItems = JSON.parse(project.CM_Labor_Items);
        } else {
          laborItems = project.CM_Labor_Items;
        }
      }
      if (project.CM_Other_Items) {
        if (typeof project.CM_Other_Items === 'string') {
          otherItems = JSON.parse(project.CM_Other_Items);
        } else {
          otherItems = project.CM_Other_Items;
        }
      }
    } catch (error) {
      console.error('Error parsing solar estimate items:', error);
      // If parsing fails, set empty arrays
      equipmentItems = [];
      laborItems = [];
      otherItems = [];
    }
    // Format the response
    const response = {
      project: {
        ...enhancedProject,
        Used_Material_Cost: totalUsedMaterialCost,
        Remaining_Material_Cost: totalRemainingMaterialCost,
        Used_Material_Percentage: Math.round(usedMaterialPercentage * 10) / 10,
        Remaining_Material_Percentage: Math.round(remainingMaterialPercentage * 10) / 10,
        Solar_Estimate: {
          System_Size: project.CM_System_Size,
          Equipment_Total: project.CM_Equipment_Total,
          Labor_Total: project.CM_Labor_Total,
          Other_Total: project.CM_Other_Total,
          Total: project.Solar_Estimate_Total,
          Equipment_Items: equipmentItems,
          Labor_Items: laborItems,
          Other_Items: otherItems
        }
      },
      milestones: milestones || [],
      materials: materialsRows || [],
      labor: laborRows || [],
      workingDates: workingDatesRows || [],
      productUpdates: productUpdatesRows || [],
      taskUpdates: taskUpdatesRows || [],
      services: serviceRows || [],
      transport: transportRows || [],

    };

    console.log("Sending project data with milestones and solar estimates");
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