// src/app/api/milestones/route.ts
import { NextResponse } from "next/server";
import getDb from "@/app/utils/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  if (!projectId)
    return NextResponse.json({ error: "Project ID required" }, { status: 400 });

  try {
    const db = await getDb();
    const [rows] = await db.execute(
      "SELECT CM_Milestone_ID, CM_Milestone_Name FROM ccms_milestone WHERE CM_Project_ID = ? ORDER BY CM_Created_At DESC",
      [projectId]
    );

    return NextResponse.json(rows);
  } catch (err) {
    console.error("Error fetching milestones:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
