import { NextRequest, NextResponse } from "next/server";
import getDb from "@/app/utils/db";

async function ensureTableExists(db: any) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS ccms_project_names (
      CM_Project_Name_ID INT AUTO_INCREMENT PRIMARY KEY,
      CM_Project_Name VARCHAR(255) NOT NULL UNIQUE,
      CM_Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  const [rows]: any = await db.query(`SELECT COUNT(*) as cnt FROM ccms_project_names`);
  if (Array.isArray(rows) && rows.length > 0 && rows[0].cnt === 0) {
    const initialPresets = [
      "Electronics Service Application",
      "Hospital Management System",
      "Lab Management Application",
      "Billing & Inventory Software",
      "Clinic Management System",
      "Custom Web Application",
      "Mobile Application (Android & iOS)",
      "E-Commerce Platform",
      "ERP & CRM Portal"
    ];
    for (const preset of initialPresets) {
      await db.query(
        `INSERT IGNORE INTO ccms_project_names (CM_Project_Name) VALUES (?)`,
        [preset]
      );
    }
  }
}

export async function GET() {
  try {
    const db = await getDb();
    await ensureTableExists(db);

    const [rows]: any = await db.query(
      `SELECT CM_Project_Name FROM ccms_project_names ORDER BY CM_Project_Name ASC`
    );

    const names = Array.isArray(rows) ? rows.map((r: any) => r.CM_Project_Name) : [];
    const res = NextResponse.json(names);
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (error: any) {
    console.error("Error in GET /api/project-names:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    await ensureTableExists(db);

    const body = await request.json();
    const name = body.name || body.CM_Project_Name || body.projectName;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }

    const cleanName = name.trim();

    await db.query(
      `INSERT IGNORE INTO ccms_project_names (CM_Project_Name) VALUES (?)`,
      [cleanName]
    );

    const res = NextResponse.json({
      success: true,
      message: "Project name saved successfully",
      name: cleanName,
    });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (error: any) {
    console.error("Error in POST /api/project-names:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
