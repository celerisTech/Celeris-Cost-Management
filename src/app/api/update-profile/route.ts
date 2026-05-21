import { NextResponse } from "next/server";
import getDb from "@/app/utils/db";
import { RowDataPacket } from "mysql2";

/* =========================
   POST – Update Profile
========================= */
export async function POST(request: Request) {
  try {
    const db = await getDb();
    const body = await request.json();

    if (!body?.CM_User_ID) {
      const res = NextResponse.json(
        { success: false, error: "Missing user ID" },
        { status: 400 }
      );
      res.headers.set("Cache-Control", "no-store");
      return res;
    }

    // Normalize paths before saving
    const normalizePath = (p?: string) => {
      if (!p) return null;
      return p.replace(/^public[\\/]/, "/");
    };

    /* -------- Update User -------- */
    const userUpdateQuery = `
      UPDATE ccms_users
      SET CM_Full_Name = ?,
          CM_Role_ID = ?,
          CM_Email = ?,
          CM_Phone_Number = ?,
          CM_Alternative_Phone = ?,
          CM_Address = ?,
          CM_District = ?,
          CM_State = ?,
          CM_Country = ?,
          CM_Postal_Code = ?,
          CM_Photo_URL = ?,
          CM_Is_Active = ?
      WHERE CM_User_ID = ?
    `;

    const userParams = [
      body.CM_Full_Name || null,
      body.CM_Role_ID || null,
      body.CM_Email || null,
      body.CM_Phone_Number || null,
      body.CM_Alternative_Phone || null,
      body.CM_Address || null,
      body.CM_District || null,
      body.CM_State || null,
      body.CM_Country || null,
      body.CM_Postal_Code || null,
      normalizePath(body.CM_Photo_URL),
      body.CM_Is_Active || "Inactive",
      body.CM_User_ID,
    ];

    await db.query(userUpdateQuery, userParams);

    /* -------- Update Company (if exists) -------- */
    if (body.company && body.CM_Company_ID) {
      const companyUpdateQuery = `
        UPDATE ccms_companies
        SET CM_Company_Code = ?,
            CM_Company_Name = ?,
            CM_Company_Type = ?,
            CM_Company_Logo = ?,
            CM_Company_Phone = ?,
            CM_Address = ?,
            CM_District = ?,
            CM_State = ?,
            CM_Country = ?,
            CM_Postal_Code = ?,
            CM_GST_Number = ?,
            CM_PAN_Number = ?,
            CM_Company_Owner = ?,
            CM_Owner_Phone = ?,
            CM_Alternate_Phone = ?,
            CM_Email = ?
        WHERE CM_Company_ID = ?
      `;

      const companyParams = [
        body.company.CM_Company_Code || null,
        body.company.CM_Company_Name || null,
        body.company.CM_Company_Type || null,
        normalizePath(body.company.CM_Company_Logo),
        body.company.CM_Company_Phone || null,
        body.company.CM_Company_Address || null,
        body.company.CM_Company_District || null,
        body.company.CM_Company_State || null,
        body.company.CM_Company_Country || null,
        body.company.CM_Company_Postal_Code || null,
        body.company.CM_GST_Number || null,
        body.company.CM_PAN_Number || null,
        body.company.CM_Company_Owner || null,
        body.company.CM_Owner_Phone || null,
        body.company.CM_Alternate_Phone || null,
        body.company.CM_Company_Email || null,
        body.CM_Company_ID,
      ];

      await db.query(companyUpdateQuery, companyParams);
    }

    const res = NextResponse.json({
      success: true,
      message: "Profile updated successfully",
    });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (err: any) {
    console.error("Error updating profile:", err);
    const res = NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
    res.headers.set("Cache-Control", "no-store");
    return res;
  }
}

/* =========================
   GET – Fetch Profile
========================= */
export async function GET(request: Request) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      const res = NextResponse.json(
        { success: false, error: "Missing userId" },
        { status: 400 }
      );
      res.headers.set("Cache-Control", "no-store");
      return res;
    }

    /* ✅ FIXED: Typed SELECT query */
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT 
        u.CM_User_ID,
        u.CM_Company_ID,
        u.CM_Full_Name,
        u.CM_Role_ID,
        u.CM_Email,
        u.CM_Phone_Number,
        u.CM_Alternative_Phone,
        u.CM_Address,
        u.CM_District,
        u.CM_State,
        u.CM_Country,
        u.CM_Postal_Code,
        u.CM_Photo_URL,
        u.CM_Is_Active,
        c.CM_Company_ID,
        c.CM_Company_Code,
        c.CM_Company_Name,
        c.CM_Company_Type,
        c.CM_Company_Logo,
        c.CM_Company_Phone,
        c.CM_Company_Owner,
        c.CM_Email AS CM_Company_Email,
        c.CM_GST_Number,
        c.CM_PAN_Number,
        c.CM_Owner_Phone,
        c.CM_Alternate_Phone,
        c.CM_Address AS CM_Company_Address,
        c.CM_District AS CM_Company_District,
        c.CM_State AS CM_Company_State,
        c.CM_Country AS CM_Company_Country,
        c.CM_Postal_Code AS CM_Company_Postal_Code
       FROM ccms_users u
       LEFT JOIN ccms_companies c
         ON u.CM_Company_ID = c.CM_Company_ID
       WHERE u.CM_User_ID = ?`,
      [userId]
    );

    if (rows.length === 0) {
      const res = NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
      res.headers.set("Cache-Control", "no-store");
      return res;
    }

    const userRow = rows[0];

    const company = {
      CM_Company_ID: userRow.CM_Company_ID,
      CM_Company_Code: userRow.CM_Company_Code,
      CM_Company_Name: userRow.CM_Company_Name,
      CM_Company_Type: userRow.CM_Company_Type,
      CM_Company_Logo: userRow.CM_Company_Logo,
      CM_Company_Phone: userRow.CM_Company_Phone,
      CM_Company_Owner: userRow.CM_Company_Owner,
      CM_Company_Email: userRow.CM_Company_Email,
      CM_GST_Number: userRow.CM_GST_Number,
      CM_PAN_Number: userRow.CM_PAN_Number,
      CM_Owner_Phone: userRow.CM_Owner_Phone,
      CM_Alternate_Phone: userRow.CM_Alternate_Phone,
      CM_Company_Address: userRow.CM_Company_Address,
      CM_Company_District: userRow.CM_Company_District,
      CM_Company_State: userRow.CM_Company_State,
      CM_Company_Country: userRow.CM_Company_Country,
      CM_Company_Postal_Code: userRow.CM_Company_Postal_Code,
    };

    const user = {
      CM_User_ID: userRow.CM_User_ID,
      CM_Company_ID: userRow.CM_Company_ID,
      CM_Role_ID: userRow.CM_Role_ID,
      CM_Full_Name: userRow.CM_Full_Name,
      CM_Email: userRow.CM_Email,
      CM_Phone_Number: userRow.CM_Phone_Number,
      CM_Alternative_Phone: userRow.CM_Alternative_Phone,
      CM_Address: userRow.CM_Address,
      CM_District: userRow.CM_District,
      CM_State: userRow.CM_State,
      CM_Country: userRow.CM_Country,
      CM_Postal_Code: userRow.CM_Postal_Code,
      CM_Photo_URL: userRow.CM_Photo_URL,
      CM_Is_Active: userRow.CM_Is_Active,
      company,
    };

    const res = NextResponse.json({
      success: true,
      user,
    });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (err: any) {
    console.error("Error fetching profile:", err);
    const res = NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
    res.headers.set("Cache-Control", "no-store");
    return res;
  }
}
