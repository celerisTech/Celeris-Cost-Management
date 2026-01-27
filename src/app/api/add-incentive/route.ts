import { NextResponse } from "next/server";
import getDb from "@/app/utils/db";

/* -----------------------------------------------
 POST → Add Incentive
------------------------------------------------ */
export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const method = searchParams.get("_method");

  if (method === "PUT") return PUT(req);
  if (method === "DELETE") return DELETE(req);

  try {
    const { laborId, amount, date, type, description } = await req.json();
    const pool = await getDb();

    const companyId = req.headers.get("x-company-id");
    const createdBy = req.headers.get("x-username");

    if (!companyId || !createdBy) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await pool.query(
      `INSERT INTO ccms_incentives 
        (CM_Company_ID, CM_Labor_ID, CM_Incentive_Date,
         CM_Incentive_Type, CM_Incentive_Amount, CM_Description,
         CM_Created_By, CM_Created_At)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [companyId, laborId, date, type, amount, description, createdBy]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST Error:", err);
    return NextResponse.json({ error: "Insert failed" }, { status: 500 });
  }
}

/* -----------------------------------------------
 PUT → Update Incentive
------------------------------------------------ */
async function PUT(req: Request) {
  try {
    const { incentiveId, amount, date, type, description } = await req.json();
    const pool = await getDb();

    const companyId = req.headers.get("x-company-id");
    const username = req.headers.get("x-username");

    if (!companyId || !username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // FIXED: Correct parameter order and count
    await pool.query(
      `UPDATE ccms_incentives
         SET CM_Incentive_Date = ?,
             CM_Incentive_Type = ?,
             CM_Incentive_Amount = ?,
             CM_Description = ?
       WHERE CM_Incentive_ID = ? AND CM_Company_ID = ?`,
      [date, type, amount, description, incentiveId, companyId]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PUT Error:", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

/* -----------------------------------------------
 GET → Fetch Single Incentive (for Editing)
------------------------------------------------ */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const incentiveId = searchParams.get("incentiveId");
    const companyId = req.headers.get("x-company-id");

    if (!incentiveId || !companyId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const pool = await getDb();

    const [rows]: any = await pool.query(
      `SELECT * FROM ccms_incentives 
       WHERE CM_Incentive_ID = ? AND CM_Company_ID = ?`,
      [incentiveId, companyId]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "Incentive not found" }, { status: 404 });
    }

    return NextResponse.json({ incentive: rows[0] });
  } catch (err) {
    console.error("GET Error:", err);
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}

/* -----------------------------------------------
 DELETE → Delete Incentive
------------------------------------------------ */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const incentiveId = searchParams.get("incentiveId");
    const companyId = req.headers.get("x-company-id");

    if (!incentiveId || !companyId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const pool = await getDb();

    console.log("Deleting incentive:", { incentiveId, companyId });

    const [result]: any = await pool.query(
      `DELETE FROM ccms_incentives 
       WHERE CM_Incentive_ID = ? AND CM_Company_ID = ?`,
      [incentiveId, companyId]
    );

    console.log("Delete result:", result);

    if (result.affectedRows === 0) {
      return NextResponse.json({
        error: "Incentive not found or already deleted",
        success: false
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Incentive deleted successfully",
      affectedRows: result.affectedRows
    });
  } catch (err) {
    console.error("DELETE Error:", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}