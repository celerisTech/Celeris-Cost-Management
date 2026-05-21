// src/app/api/get-role/route.ts

import { NextRequest, NextResponse } from "next/server";
import getDb from "../../utils/db";
import { ResultSetHeader } from "mysql2";

// GET endpoint - Fetch all roles
export async function GET(request: NextRequest) {
  try {
    const db = await getDb();

    // Modified query to return all roles, regardless of status
    const [rows] = await db.query(
      `SELECT * 
       FROM ccms_roles_master
       ORDER BY CM_Created_At DESC`
    );

    const res = NextResponse.json({ success: true, roles: rows });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error) {
    console.error("Error fetching roles:", error);
    const res = NextResponse.json(
      { success: false, message: "Failed to fetch roles" },
      { status: 500 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}

// POST endpoint - Create new role
export async function POST(req: NextRequest) {
  const method = req.nextUrl.searchParams.get("_method");
  if (method === "PUT") return PUT(req);

  try {
    const body = await req.json();
    const { CM_Role_Description, CM_Company_ID, CM_Is_Status, CM_Created_By } = body;

    if (!CM_Role_Description || !CM_Company_ID || !CM_Is_Status || !CM_Created_By) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          details: { CM_Role_Description, CM_Company_ID, CM_Is_Status, CM_Created_By },
        },
        { status: 400 }
      );
    }

    const db = await getDb();

    // 🔍 Check if role already exists for this company
    const [existing] = await db.query(
      `SELECT CM_Role_ID 
       FROM ccms_roles_master 
       WHERE CM_Role_Description = ? AND CM_Company_ID = ?
       LIMIT 1`,
      [CM_Role_Description, CM_Company_ID]
    );

    if ((existing as any[]).length > 0) {
      return NextResponse.json(
        { error: "Role already exists for this company" },
        { status: 400 }
      );
    }

    // ✅ Insert new role
    const sql = `
      INSERT INTO ccms_roles_master 
      (CM_Role_Description, CM_Company_ID, CM_Is_Status, CM_Created_By, CM_Created_At)
      VALUES (?, ?, ?, ?, NOW())
    `;

    const [result] = (await db.query(sql, [
      CM_Role_Description,
      CM_Company_ID,
      CM_Is_Status,
      CM_Created_By,
    ])) as [ResultSetHeader, any];

    if (result.affectedRows > 0) {
      const res = NextResponse.json({
        success: true,
        CM_Role_ID: result.insertId,
      });
      res.headers.set('Cache-Control', 'no-store');
      return res;
    } else {
      throw new Error("Failed to create role - no rows affected");
    }
  } catch (error: any) {
    console.error("Error creating role:", error);
    const res = NextResponse.json(
      {
        error: error.message || "Server error",
        sqlError: error.sqlMessage,
      },
      { status: 500 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}


// PUT endpoint - Update existing role
async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { CM_Role_ID, CM_Role_Description, CM_Is_Status, CM_Updated_By } = body;

    if (!CM_Role_ID || !CM_Role_Description || !CM_Is_Status || !CM_Updated_By) {
      return NextResponse.json({
        error: "Missing required fields",
        details: { CM_Role_ID, CM_Role_Description, CM_Is_Status, CM_Updated_By }
      }, { status: 400 });
    }

    const db = await getDb();

    // Fixed column names to match your database schema
    const sql = `
      UPDATE ccms_roles_master 
      SET CM_Role_Description = ?, 
          CM_Is_Status = ?,
          CM_Uploaded_By = ?,
          CM_Uploaded_At = NOW()
      WHERE CM_Role_ID = ?
    `;

    const [result] = await db.query(sql, [
      CM_Role_Description,
      CM_Is_Status,
      CM_Updated_By,
      CM_Role_ID
    ]) as [ResultSetHeader, any];

    if (result.affectedRows > 0) {
      const res = NextResponse.json({
        success: true,
        message: "Role updated successfully"
      });
      res.headers.set('Cache-Control', 'no-store');
      return res;
    } else {
      const res = NextResponse.json({
        error: "No role found with the provided ID"
      }, { status: 404 });
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

  } catch (error: any) {
    console.error("Error updating role:", error);
    const res = NextResponse.json({
      error: error.message || "Server error",
      sqlError: error.sqlMessage
    }, { status: 500 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}
