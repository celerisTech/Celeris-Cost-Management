import { NextRequest, NextResponse } from "next/server";
import getDb from "@/app/utils/db";
import jwt from "jsonwebtoken";

export async function GET(request: NextRequest) {
  try {
    // 1. Read cookie
    const token = request.cookies.get("ccms_token")?.value;
    if (!token) {
      const res = NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    // 2. Verify JWT
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch {
      const res = NextResponse.json(
        { success: false, error: "Invalid or expired token" },
        { status: 403 }
      );
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    // 3. Security check: only allow the logged-in user's ID
    const tokenUserId = decoded?.CM_User_ID || decoded?.id || decoded?.userId || decoded?.user_id;
    if (!userId || (tokenUserId && userId !== tokenUserId)) {
      const res = NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    const db = await getDb();

    // Check if user has user-specific privileges assigned
    const [userPrivsCheck] = await db.query(
      `SELECT 1 FROM ccms_privilege_master WHERE CM_User_ID = ? LIMIT 1`,
      [userId]
    );

    const hasUserPrivileges = Array.isArray(userPrivsCheck) && userPrivsCheck.length > 0;

    let query = '';
    let queryParams: any[] = [];

    if (hasUserPrivileges) {
      // User has specific privileges assigned
      query = `
        SELECT DISTINCT
            nl.CM_Name AS label,
            nl.CM_Path AS href,
            nl.CM_Section AS section
        FROM ccms_nav_link nl
        JOIN ccms_privilege_master pm ON nl.CM_Nav_Link_ID = pm.CM_Nav_Link_ID
        WHERE pm.CM_User_ID = ?
        ORDER BY 
          CASE nl.CM_Section 
            WHEN 'Overview' THEN 1
            WHEN 'Operations' THEN 2
            WHEN 'Administration' THEN 3
            ELSE 4
          END,
          nl.CM_Name
      `;
      queryParams = [userId];
    } else {
      // User inherits role-default privileges
      query = `
        SELECT DISTINCT
            nl.CM_Name AS label,
            nl.CM_Path AS href,
            nl.CM_Section AS section
        FROM ccms_nav_link nl
        JOIN ccms_privilege_master pm ON nl.CM_Nav_Link_ID = pm.CM_Nav_Link_ID
        WHERE pm.CM_Role_ID = (SELECT CM_Role_ID FROM ccms_users WHERE CM_User_ID = ?) 
          AND pm.CM_User_ID IS NULL
        ORDER BY 
          CASE nl.CM_Section 
            WHEN 'Overview' THEN 1
            WHEN 'Operations' THEN 2
            WHEN 'Administration' THEN 3
            ELSE 4
          END,
          nl.CM_Name
      `;
      queryParams = [userId];
    }

    const [rows] = await db.query(query, queryParams);

    // 5. Group into sections
    const grouped: Record<string, { href: string; label: string }[]> = {};
    if (Array.isArray(rows) && rows.length > 0) {
      rows.forEach((item: any) => {
        const section = item.section || "Other";
        if (!grouped[section]) grouped[section] = [];
        grouped[section].push({
          href: item.href || "#",
          label: item.label || "Unknown",
        });
      });
    }

    // 6. Return with no-store cache headers
    const res = NextResponse.json(
      {
        success: true,
        data: grouped,
        count: Object.keys(grouped).length,
      }
    );
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.headers.set('Pragma', 'no-cache');
    res.headers.set('Expires', '0');
    return res;
  } catch (err: any) {
    console.error("Error fetching nav links:", err);
    const res = NextResponse.json(
      {
        success: false,
        error: "Server error",
        message: err.message,
      },
      { status: 500 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}
