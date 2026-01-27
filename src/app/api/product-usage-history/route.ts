import { NextResponse } from "next/server";
import getDb from "@/app/utils/db"; // adjust to your db connection

// GET /api/product-usage-history
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const productId = searchParams.get("productId");

    if (!projectId || !productId) {
      return NextResponse.json(
        { error: "Missing projectId or productId" },
        { status: 400 }
      );
    }

    const db = await getDb(); // ✅ initialize DB

    const [rows] = await db.query(
      `SELECT 
        CM_Update_ID,
        CM_Working_Date,
        CM_Original_Quantity,
        CM_Used_Quantity,
        CM_Remaining_Quantity,
        CM_Report,
        CM_Updated_By,
        CM_Updated_At
      FROM ccms_project_product_updates 
      WHERE CM_Project_ID = ? AND CM_Product_ID = ?
      ORDER BY CM_Updated_At DESC`,
      [projectId, productId]
    );

    const res = NextResponse.json(rows);
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (err) {
    console.error("Error fetching usage history:", err);
    const res = NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}
