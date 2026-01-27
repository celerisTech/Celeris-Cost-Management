import getDb from "@/app/utils/db";
import { NextResponse } from "next/server";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    const pool = await getDb();
    const [rows] = await pool.query(
      `SELECT 
        CM_Service_ID,
        CM_Project_ID,
        CM_Service_Type,
        CM_Description,
        CM_Service_Date,
        CM_Service_Amount,
        CM_Tax_Amount,
        CM_Total_Amount,
        CM_Attachment,
        CM_Status,
        CM_Created_By,
        CM_Created_At
       FROM ccms_project_services 
       WHERE CM_Project_ID = ? 
       ORDER BY CM_Service_Date DESC`,
      [id]
    );

    return NextResponse.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      { success: false, message: "Error fetching services" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const method = new URL(request.url).searchParams.get("_method");
  if (method === "PUT") return updateService(request, context);

  try {
    const { id } = await context.params;
    const body = await request.json();
    const pool = await getDb();

    const totalAmount =
      (parseFloat(body.amount) || 0) + (parseFloat(body.taxAmount) || 0);

    await pool.query(
      `INSERT INTO ccms_project_services 
      (CM_Project_ID, CM_Service_Type, CM_Description, 
       CM_Service_Date, CM_Service_Amount, CM_Tax_Amount, 
       CM_Total_Amount, CM_Status, CM_Created_By) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        body.type,
        body.description,
        body.date,
        parseFloat(body.amount) || 0,
        parseFloat(body.taxAmount) || 0,
        totalAmount,
        body.status || "Completed",
        body.createdBy || "system"
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Service added successfully",
    });
  } catch (error) {
    console.error("Error adding service:", error);
    return NextResponse.json(
      { success: false, message: "Error adding service" },
      { status: 500 }
    );
  }
}

async function updateService(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const pool = await getDb();

    const totalAmount =
      (parseFloat(body.amount) || 0) + (parseFloat(body.taxAmount) || 0);

    await pool.query(
      `UPDATE ccms_project_services 
       SET CM_Service_Type = ?, 
           CM_Description = ?,
           CM_Service_Date = ?,
           CM_Service_Amount = ?,
           CM_Tax_Amount = ?,
           CM_Total_Amount = ?,
           CM_Status = ?,
       WHERE CM_Service_ID = ? AND CM_Project_ID = ?`,
      [
        body.type,
        body.description,
        body.date,
        parseFloat(body.amount) || 0,
        parseFloat(body.taxAmount) || 0,
        totalAmount,
        body.status,
        body.serviceId,
        id
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Service updated successfully",
    });
  } catch (error) {
    console.error("Error updating service:", error);
    return NextResponse.json(
      { success: false, message: "Error updating service" },
      { status: 500 }
    );
  }
}
