import getDb from "@/app/utils/db";
import { NextResponse } from "next/server";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    const pool = await getDb();
    const [rows] = await pool.query(
      `SELECT 
        CM_Transport_ID,
        CM_Project_ID,
        CM_Milestone_ID,
        CM_Transport_Type,
        CM_Description,
        CM_Transport_Date,
        CM_Amount,
        CM_Tax_Amount,
        CM_Total_Amount,
        CM_Attachment,
        CM_Status,
        CM_Created_By,
        CM_Created_At
       FROM ccms_project_transport 
       WHERE CM_Project_ID = ? 
       ORDER BY CM_Transport_Date DESC`,
      [id]
    );

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error fetching transport:", error);
    return NextResponse.json(
      { success: false, message: "Error fetching transport" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const method = new URL(request.url).searchParams.get("_method");
  if (method === "PUT") return updateTransport(request, context);

  try {
    const { id } = await context.params;
    const body = await request.json();
    const pool = await getDb();

    const totalAmount =
      (parseFloat(body.amount) || 0) + (parseFloat(body.taxAmount) || 0);

    await pool.query(
      `INSERT INTO ccms_project_transport 
      (CM_Project_ID, CM_Milestone_ID, CM_Transport_Type, CM_Description, 
       CM_Transport_Date, CM_Amount, CM_Tax_Amount, 
       CM_Total_Amount, CM_Status, CM_Created_By) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        body.milestoneId,
        body.type,
        body.description,
        body.date,
        parseFloat(body.amount) || 0,
        parseFloat(body.taxAmount) || 0,
        totalAmount,
        body.status || "Pending",
        body.createdBy || "system",
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Transport added successfully",
    });
  } catch (error) {
    console.error("Error adding transport:", error);
    return NextResponse.json(
      { success: false, message: "Error adding transport" },
      { status: 500 }
    );
  }
}

async function updateTransport(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const pool = await getDb();

    const totalAmount =
      (parseFloat(body.amount) || 0) + (parseFloat(body.taxAmount) || 0);

    await pool.query(
      `UPDATE ccms_project_transport 
       SET CM_Transport_Type = ?,
           CM_Milestone_ID = ? ,
           CM_Description = ?,
           CM_Transport_Date = ?,
           CM_Amount = ?,
           CM_Tax_Amount = ?,
           CM_Total_Amount = ?,
           CM_Status = ?
       WHERE CM_Transport_ID = ? AND CM_Project_ID = ?`,
      [
        body.type,
        body.milestoneId,
        body.description,
        body.date,
        parseFloat(body.amount) || 0,
        parseFloat(body.taxAmount) || 0,
        totalAmount,
        body.status,
        body.transportId,
        id,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Transport updated successfully",
    });
  } catch (error) {
    console.error("Error updating transport:", error);
    return NextResponse.json(
      { success: false, message: "Error updating transport" },
      { status: 500 }
    );
  }
}
