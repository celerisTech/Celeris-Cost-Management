// src/app/api/milestones/route.ts

import { NextResponse, NextRequest } from "next/server";
import getDb from "@/app/utils/db";

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId');
    const milestoneId = url.searchParams.get('milestoneId');

    if (milestoneId) {
      // Get single milestone
      const [milestone] = await db.query(
        `SELECT * FROM ccms_milestone WHERE CM_Milestone_ID = ?`,
        [milestoneId]
      );

      if (Array.isArray(milestone) && milestone.length > 0) {
        const res = NextResponse.json(milestone[0]);
        res.headers.set('Cache-Control', 'no-store');
        return res;
      } else {
        const res = NextResponse.json({ error: "Milestone not found." }, { status: 404 });

        res.headers.set('Cache-Control', 'no-store');
        return res;
      }
    } else if (projectId) {
      // Get all milestones for a project
      const [milestones] = await db.query(
        `SELECT * FROM ccms_milestone WHERE CM_Project_ID = ? ORDER BY CM_Planned_Start_Date ASC`,
        [projectId]
      );

      const res = NextResponse.json(milestones);
      res.headers.set('Cache-Control', 'no-store');
      return res;
    } else {
      const res = NextResponse.json({ error: "Project ID or Milestone ID is required." }, { status: 400 });

      res.headers.set('Cache-Control', 'no-store');
      return res;
    }
  } catch (error: any) {
    console.error('Error fetching milestones:', error);
    const res = NextResponse.json(
      { error: 'Failed to fetch milestones.' },

      { status: 500 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}

export async function POST(request: Request) {
  const method = new URL(request.url).searchParams.get("_method");
  if (method === "PUT") return PUT(request);

  try {
    const db = await getDb();
    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      "CM_Project_ID",
      "CM_Milestone_Name",
      "CM_Planned_Start_Date",
      "CM_Planned_End_Date",
      "CM_Created_By"
    ];

    const missing = requiredFields.filter(f => !body[f]);
    if (missing.length) {
      const res = NextResponse.json({ error: "Missing fields.", missing }, { status: 400 });

      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    // Format dates for MySQL
    let startDate = body.CM_Planned_Start_Date;
    let endDate = body.CM_Planned_End_Date;

    if (startDate) {
      const date = new Date(startDate);
      if (!isNaN(date.getTime())) {
        startDate = date.toISOString().split('T')[0]; // YYYY-MM-DD
      }
    }

    if (endDate) {
      const date = new Date(endDate);
      if (!isNaN(date.getTime())) {
        endDate = date.toISOString().split('T')[0]; // YYYY-MM-DD
      }
    }

    // Insert the milestone
    await db.query(
      `INSERT INTO ccms_milestone (
         CM_Project_ID, CM_Milestone_Name, CM_Description,
        CM_Planned_Start_Date, CM_Planned_End_Date, CM_Status, CM_Percentage_Weightage,
        CM_Created_By, CM_Created_At, CM_Uploaded_By, CM_Uploaded_At
      ) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, NOW())`,
      [
        body.CM_Project_ID,
        body.CM_Milestone_Name,
        body.CM_Description || null,
        startDate,
        endDate,
        body.CM_Status || 'Not Started',
        body.CM_Percentage_Weightage || 0,
        body.CM_Created_By,
        body.CM_Uploaded_By || body.CM_Created_By
      ]
    );

    // Get the inserted ID
    const [rows]: any = await db.query(
      `SELECT CM_Milestone_ID FROM ccms_milestone ORDER BY CM_Created_At DESC LIMIT 1`
    );

    const newMilestoneId = Array.isArray(rows) && rows.length > 0 ? rows[0].CM_Milestone_ID : null;

    const res = NextResponse.json({
      success: true,
      message: "Milestone created successfully.",

      CM_Milestone_ID: newMilestoneId
    }, { status: 201 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error: any) {
    console.error("Error creating milestone:", error);
    const res = NextResponse.json(
      { error: "Failed to create milestone.", details: error.message },

      { status: 500 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}

async function PUT(request: Request) {
  try {
    const db = await getDb();
    const body = await request.json();

    const { CM_Milestone_ID } = body;

    if (!CM_Milestone_ID) {
      const res = NextResponse.json(
        { error: 'Milestone ID is required for updates.' },

        { status: 400 }
      );
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    // Format dates
    let startDate = body.CM_Planned_Start_Date;
    let endDate = body.CM_Planned_End_Date;

    if (startDate) {
      const date = new Date(startDate);
      if (!isNaN(date.getTime())) {
        startDate = date.toISOString().split('T')[0];
      }
    }

    if (endDate) {
      const date = new Date(endDate);
      if (!isNaN(date.getTime())) {
        endDate = date.toISOString().split('T')[0];
      }
    }

    // Update milestone
    await db.query(
      `UPDATE ccms_milestone SET
        CM_Project_ID = ?,
        CM_Milestone_Name = ?,
        CM_Description = ?,
        CM_Planned_Start_Date = ?,
        CM_Planned_End_Date = ?,
        CM_Status = ?,
        CM_Percentage_Weightage = ?,
        CM_Uploaded_By = ?,
        CM_Uploaded_At = NOW()
      WHERE CM_Milestone_ID = ?`,
      [
        body.CM_Project_ID,
        body.CM_Milestone_Name,
        body.CM_Description || null,
        startDate,
        endDate,
        body.CM_Status || 'Not Started',
        body.CM_Percentage_Weightage || 0,
        body.CM_Uploaded_By,
        CM_Milestone_ID
      ]
    );

    const res = NextResponse.json(
      { success: true, message: "Milestone updated successfully.", CM_Milestone_ID },

      { status: 200 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error: any) {
    console.error("Error updating milestone:", error);
    const res = NextResponse.json(
      { error: "Failed to update milestone.", details: error.message },

      { status: 500 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}

