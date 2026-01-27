// src\app\api\project-labor-attendance\route.ts
import getDb from "../../utils/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get("companyId");

  if (!companyId) {
    return new Response(JSON.stringify({ error: "Missing companyId" }), { status: 400 });
  }

  try {
    const db = await getDb();
    const [rows] = await db.query(
      `SELECT CM_Project_ID, CM_Project_Code, CM_Project_Name , CM_Project_Type, CM_Latitude , CM_Longitude, CM_Radius_Meters
       FROM ccms_projects
       WHERE CM_Status = 'Active'`, 
      [companyId]
    );

    const res = new Response(JSON.stringify(rows), { status: 200 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (err) {
    console.error("Error fetching projects:", err);
    const res = new Response(JSON.stringify({ error: "Database error" }), { status: 500 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}
