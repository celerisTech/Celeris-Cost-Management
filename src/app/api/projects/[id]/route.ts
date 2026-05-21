import { NextResponse } from "next/server";
import getDb from "@/app/utils/db";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params; // ✅ await params

  try {
    const pool = await getDb(); // ✅ also await here since getDb returns a Promise
    const [rows]: any = await pool.query(
      "SELECT CM_Project_ID, CM_Project_Name, CM_Project_Code FROM ccms_projects WHERE CM_Project_ID = ?",
      [id]
    );

    if (!rows || rows.length === 0) {
      const res = NextResponse.json(
        { success: false, message: "Project not found" },
        { status: 404 }
      );
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    const res = NextResponse.json({ success: true, data: rows[0] });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (err) {
    console.error("Error fetching project details:", err);
    const res = NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}
