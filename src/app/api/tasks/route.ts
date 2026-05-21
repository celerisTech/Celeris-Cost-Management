// src/app/api/tasks/route.ts

import { NextResponse, NextRequest } from "next/server";
import getDb from "@/app/utils/db";

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId');
    const taskId = url.searchParams.get('taskId');
    const milestoneId = url.searchParams.get('milestoneId');

    if (taskId) {
      // Get a single task by ID
      const [task] = await db.query(`
        SELECT 
          t.*,
          u.CM_Full_Name AS Engineer_Name,
          m.CM_Milestone_Name
        FROM 
          ccms_task_master t
        LEFT JOIN 
          ccms_users u ON t.CM_Engineer_ID = u.CM_User_ID
        LEFT JOIN
          ccms_milestone m ON t.CM_Milestone_ID = m.CM_Milestone_ID
        WHERE 
          t.CM_Task_ID = ?
      `, [taskId]);

      if (task && Array.isArray(task) && task.length > 0) {
        const res = NextResponse.json(task[0]);
        res.headers.set('Cache-Control', 'no-store');
        return res;
      } else {
        const res = NextResponse.json({ error: "Task not found" }, { status: 404 });
        res.headers.set('Cache-Control', 'no-store');
        return res;
      }
    } else if (milestoneId) {
      // Get tasks for a specific milestone
      const [tasks] = await db.query(`
        SELECT 
          t.CM_Task_ID,
          t.CM_Task_Name,
          t.CM_Milestone_ID,
          t.CM_Engineer_ID,
          u.CM_Full_Name AS Engineer_Name,
          t.CM_Assign_Date,
          t.CM_Due_Date,
          t.CM_Is_Active,
          t.CM_Image_URL,
          t.CM_Created_At,
          t.CM_Created_By
        FROM 
          ccms_task_master t
        LEFT JOIN 
          ccms_users u ON t.CM_Engineer_ID = u.CM_User_ID
        WHERE 
          t.CM_Milestone_ID = ?
        ORDER BY 
          t.CM_Due_Date ASC, 
          t.CM_Task_Name ASC
      `, [milestoneId]);

      return NextResponse.json(tasks);
    } else if (projectId) {
      // Get all tasks for a project
      const [tasks] = await db.query(`
       -- Update your SQL query in the API to include milestone information
          SELECT 
            t.CM_Task_ID,
            t.CM_Task_Name,
            t.CM_Milestone_ID,
            m.CM_Milestone_Name,
            m.CM_Status AS CM_Milestone_Status,
            m.CM_Planned_Start_Date AS CM_Milestone_Start_Date,
            m.CM_Planned_End_Date AS CM_Milestone_End_Date,
            t.CM_Engineer_ID,
            u.CM_Full_Name AS Engineer_Name,
            t.CM_Assign_Date,
            t.CM_Due_Date,
            t.CM_Is_Active,
            t.CM_Image_URL,
            t.CM_Created_At,
            t.CM_Created_By
          FROM 
            ccms_task_master t
          LEFT JOIN 
            ccms_users u ON t.CM_Engineer_ID = u.CM_User_ID
          LEFT JOIN
            ccms_milestone m ON t.CM_Milestone_ID = m.CM_Milestone_ID
          WHERE 
            t.CM_Project_ID = ?
          ORDER BY 
            m.CM_Planned_Start_Date ASC,
            t.CM_Due_Date ASC, 
            t.CM_Task_Name ASC
                `, [projectId]);

      const res = NextResponse.json(tasks);
      res.headers.set('Cache-Control', 'no-store');
      return res;
    } else {
      const res = NextResponse.json({ error: "Project ID, Milestone ID, or Task ID is required" }, { status: 400 });
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }
  } catch (error: any) {
    console.error('Error fetching tasks:', error);
    const res = NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const method = url.searchParams.get("_method");

    if (method === "DELETE") {
      return DELETE(request);
    }

    if (method === "PUT") {
      return PUT(request);
    }

    const db = await getDb();
    const body = await request.json();

    const requiredFields = [
      "CM_Company_ID",
      "CM_Project_ID",
      "CM_Engineer_ID",
      "CM_Assign_Date",
      "CM_Due_Date",
      "CM_Created_By"
    ];
    const missing = requiredFields.filter(f => !body[f]);
    if (missing.length) {
      return NextResponse.json({ error: "Missing fields", missing }, { status: 400 });
    }

    // Format dates for MySQL
    let assignDate = body.CM_Assign_Date;
    let dueDate = body.CM_Due_Date;

    if (assignDate) {
      const date = new Date(assignDate);
      if (!isNaN(date.getTime())) {
        assignDate = date.toISOString().split('T')[0]; // YYYY-MM-DD
      }
    }

    if (dueDate) {
      const date = new Date(dueDate);
      if (!isNaN(date.getTime())) {
        dueDate = date.toISOString().split('T')[0]; // YYYY-MM-DD
      }
    }

    // Insert with NULL ID → trigger will auto-generate CM_Task_ID (like TSK000001)
    await db.query(
      `INSERT INTO ccms_task_master (
        CM_Task_ID, CM_Task_Name, CM_Milestone_ID, CM_Company_ID, CM_Project_ID, 
        CM_Engineer_ID, CM_Assign_Date, CM_Due_Date, CM_Is_Active, CM_Image_URL, 
        CM_Created_By, CM_Created_At, CM_Uploaded_By, CM_Uploaded_At
      ) VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, 'Active', ?, ?, NOW(), ?, NOW())`,
      [
        body.CM_Task_Name || null,
        body.CM_Milestone_ID || null,  // Added Milestone ID field
        body.CM_Company_ID,
        body.CM_Project_ID,
        body.CM_Engineer_ID,
        assignDate,
        dueDate,
        body.CM_Image_URL || null,
        body.CM_Created_By,
        body.CM_Uploaded_By || body.CM_Created_By
      ]
    );

    // Get the inserted ID
    const [rows]: any = await db.query(
      `SELECT CM_Task_ID FROM ccms_task_master ORDER BY CM_Created_At DESC LIMIT 1`
    );

    const newTaskId = Array.isArray(rows) && rows.length > 0 ? rows[0].CM_Task_ID : null;

    const res = NextResponse.json({
      success: true,
      message: "Task assigned successfully",
      CM_Task_ID: newTaskId
    }, { status: 201 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error: any) {
    console.error("Error inserting task:", error);
    const res = NextResponse.json({ error: "Failed to assign task", details: error.message }, { status: 500 }); res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}

export async function PUT(request: Request) {
  try {
    const db = await getDb();
    const body = await request.json();

    console.log("Received task update request:", body);

    const { CM_Task_ID } = body;

    if (!CM_Task_ID) {
      const res = NextResponse.json(
        { error: 'Task ID is required for updates' },
        { status: 400 }
      );
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    const requiredFields = [
      "CM_Engineer_ID",
      "CM_Assign_Date",
      "CM_Due_Date"
    ];

    const missing = requiredFields.filter(f => !body[f]);
    if (missing.length) {
      return NextResponse.json({ error: "Missing required fields", missing }, { status: 400 });
    }

    // Format dates properly for MySQL
    let assignDate = body.CM_Assign_Date;
    let dueDate = body.CM_Due_Date;

    if (assignDate) {
      const date = new Date(assignDate);
      if (!isNaN(date.getTime())) {
        assignDate = date.toISOString().split('T')[0];
      }
    }

    if (dueDate) {
      const date = new Date(dueDate);
      if (!isNaN(date.getTime())) {
        dueDate = date.toISOString().split('T')[0];
      }
    }

    // Update the task
    const updateResult = await db.query(
      `UPDATE ccms_task_master SET
        CM_Task_Name = ?,
        CM_Milestone_ID = ?,
        CM_Company_ID = ?,
        CM_Project_ID = ?,
        CM_Engineer_ID = ?,
        CM_Assign_Date = ?,
        CM_Due_Date = ?,
        CM_Is_Active = ?,
        CM_Image_URL = ?,
        CM_Uploaded_By = ?,
        CM_Uploaded_At = NOW()
      WHERE CM_Task_ID = ?`,
      [
        body.CM_Task_Name || null,
        body.CM_Milestone_ID || null,  // Added Milestone ID field
        body.CM_Company_ID,
        body.CM_Project_ID,
        body.CM_Engineer_ID,
        assignDate,
        dueDate,
        body.CM_Is_Active || "Active",
        body.CM_Image_URL || null,
        body.CM_Uploaded_By || body.CM_Created_By,
        CM_Task_ID
      ]
    );

    console.log("Task update result:", updateResult);


    const res = NextResponse.json(
      { success: true, message: "Task updated successfully", CM_Task_ID },
      { status: 200 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error: any) {
    console.error("Error updating task:", error);
    const res = NextResponse.json(
      { error: "Failed to update task", details: error.message, stack: error.stack },
      { status: 500 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}

export async function DELETE(request: Request) {
  try {
    const db = await getDb();
    const url = new URL(request.url);
    const taskId = url.searchParams.get('taskId');

    if (!taskId) {
      const res = NextResponse.json(
        { error: 'Task ID is required for deletion' },
        { status: 400 }
      );
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    // Check if task exists
    const [existingTask] = await db.query(
      `SELECT CM_Task_ID FROM ccms_task_master WHERE CM_Task_ID = ?`,
      [taskId]
    );

    if (!Array.isArray(existingTask) || existingTask.length === 0) {
      const res = NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    // Start a transaction
    await db.query('START TRANSACTION');

    try {
      // First, delete related records in the ccms_task_update table
      await db.query(
        `DELETE FROM ccms_task_update WHERE CM_Task_ID = ?`,
        [taskId]
      );

      // Now it's safe to delete the task
      await db.query(
        `DELETE FROM ccms_task_master WHERE CM_Task_ID = ?`,
        [taskId]
      );

      // Commit the transaction
      await db.query('COMMIT');

      const res = NextResponse.json(
        { success: true, message: 'Task deleted successfully' },
        { status: 200 }
      );
      res.headers.set('Cache-Control', 'no-store');
      return res;
    } catch (error) {
      // If anything goes wrong, roll back the transaction
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error: any) {
    console.error('Error deleting task:', error);
    const res = NextResponse.json(
      { error: 'Failed to delete task', details: error.message },
      { status: 500 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}
