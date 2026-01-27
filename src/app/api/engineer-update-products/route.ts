import { NextResponse } from "next/server";
import getDb from "@/app/utils/db";
import { RowDataPacket } from "mysql2";

// 🔹 GET Products (with Category & Subcategory Names)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      const res = NextResponse.json({ error: "Project ID is required" }, { status: 400 });
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    const db = await getDb();

    const [rows] = await db.execute(
      `
      SELECT 
          p.*,
          c.CM_Category_Name AS Category_Name,
          s.CM_Subcategory_Name AS Subcategory_Name,
          ut.CM_Unit_Name AS Unit_Type_Name
      FROM ccms_project_products p
      LEFT JOIN ccms_category c 
          ON p.CM_Category_ID = c.CM_Category_ID
      LEFT JOIN ccms_subcategory s 
          ON p.CM_Subcategory_ID = s.CM_Subcategory_ID
      LEFT JOIN ccms_unit_type ut
          ON p.CM_Unit_Type = ut.CM_Unit_ID
      WHERE p.CM_Project_ID = ?
      ORDER BY p.CM_Created_At DESC
      `,
      [projectId]
    );

    const res = NextResponse.json(rows);
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error) {
    console.error("Error fetching project products:", error);
    const res = NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}
// 🔹 POST - Update Product Batch & Insert History with Milestone
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      projectId,
      productId,
      batchId,
      remainingQty,
      usedQty,
      updatedBy,
      report,
      workingDate,
      milestoneId, // ✅ Added Milestone ID support
    } = body;

    // ✅ Validate required fields
    if (!projectId || !productId || !batchId || remainingQty == null || usedQty == null) {
      const res = NextResponse.json(
        { error: "Missing required fields: projectId, productId, batchId, remainingQty, usedQty" },
        { status: 400 }
      );
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    if (!workingDate) {
      return NextResponse.json({ error: "Working date is required" }, { status: 400 });
    }

    // ✅ Validate working date
    const workingDateObj = new Date(workingDate);
    if (isNaN(workingDateObj.getTime())) {
      return NextResponse.json({ error: "Invalid working date format" }, { status: 400 });
    }

    const formattedWorkingDate = workingDateObj.toISOString().split("T")[0];

    // ✅ Validate numbers
    const numRemaining = Number(remainingQty);
    const numUsed = Number(usedQty);
    if (isNaN(numRemaining) || isNaN(numUsed)) {
      return NextResponse.json({ error: "Quantities must be valid numbers" }, { status: 400 });
    }

    const db = await getDb();

    // ✅ Fetch current batch
    const [rows] = await db.execute<RowDataPacket[]>(
      `
      SELECT CM_Quantity, CM_Remaining_Quantity 
      FROM ccms_project_products 
      WHERE CM_Project_Product_ID = ? AND CM_Project_ID = ? AND CM_Product_ID = ?
      `,
      [batchId, projectId, productId]
    );

    const batch = rows[0];
    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    const originalQty = batch.CM_Quantity;
    const reportText = report || `Updated by ${updatedBy || "Engineer"} on ${new Date().toLocaleString()}`;

    // ✅ Insert into update history (now includes CM_Milestone_ID)
    await db.execute(
      `
      INSERT INTO ccms_project_product_updates
        (CM_Project_ID, CM_Milestone_ID, CM_Working_Date, CM_Product_ID, 
         CM_Original_Quantity, CM_Used_Quantity, CM_Remaining_Quantity, 
         CM_Report, CM_Updated_By, CM_Updated_At)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `,
      [
        projectId,
        milestoneId || null, // ✅ Safe insert if no milestone
        formattedWorkingDate,
        productId,
        originalQty,
        numUsed,
        numRemaining,
        reportText,
        updatedBy || "Engineer",
      ]
    );

    // ✅ Update main batch table
    await db.execute(
      `
      UPDATE ccms_project_products
      SET CM_Remaining_Quantity = ?
      WHERE CM_Project_Product_ID = ? AND CM_Project_ID = ? AND CM_Product_ID = ?
      `,
      [numRemaining, batchId, projectId, productId]
    );

    const res = NextResponse.json({ success: true });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (error) {
    console.error("Unexpected Server Error:", error);
    const res = NextResponse.json(
      {
        error: "Internal Server Error",
        details: process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
    res.headers.set("Cache-Control", "no-store");
    return res;
  }
}
