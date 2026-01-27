// src/app/api/create-proprietor/route.ts
import { NextRequest, NextResponse } from "next/server";
import getDb from "../../utils/db";
import { writeFile, mkdir } from "fs/promises";
import { ResultSetHeader } from "mysql2";
import path from "path";
import fs from "fs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Handle file upload
    const file = formData.get("CM_Photo_URL") as File | null;
    let photoUrl = "";

    if (file) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Create upload directory if it doesn't exist
      const uploadDir = path.join(process.cwd(), "public", "uploads");

      if (!fs.existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const filename = `user_${timestamp}_${file.name.replace(/\s+/g, '_')}`;
      const filePath = path.join(uploadDir, filename);

      await writeFile(filePath, buffer);

      photoUrl = `/uploads/${filename}`;
    }

    const db = await getDb();

    // Check if phone number already exists
    const [existingPhone] = await db.query(
      "SELECT CM_User_ID FROM ccms_users WHERE CM_Phone_Number = ?",
      [formData.get("CM_Phone_Number")]
    );

    if (Array.isArray(existingPhone) && existingPhone.length > 0) {
      return NextResponse.json(
        { error: "Phone number already used" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const [existingEmail] = await db.query(
      "SELECT CM_User_ID FROM ccms_users WHERE CM_Email = ?",
      [formData.get("CM_Email")]
    );

    if (Array.isArray(existingEmail) && existingEmail.length > 0) {
      return NextResponse.json(
        { error: "Email address already used" },
        { status: 400 }
      );
    }

    // Start a transaction to ensure both operations succeed or fail together
    await db.query("START TRANSACTION");

    try {
      // Create the user
      const [userResult] = await db.query<ResultSetHeader>(
        `INSERT INTO ccms_users
        (CM_Company_ID, CM_Role_ID, CM_Labor_Type_ID, CM_First_Name, CM_Last_Name, CM_Full_Name,
         CM_Father_Name, 
         CM_Marriage_Status, CM_Phone_Number, CM_Alternative_Phone, 
         CM_Aadhaar_Number, CM_PAN_Number, CM_Password, CM_Email, 
         CM_Address, CM_City, CM_District, CM_State, CM_Country, CM_Postal_Code,
         CM_Date_Of_Birth, CM_Gender, CM_Higher_Education, CM_Previous_Experiences,
         CM_Photo_URL, CM_Is_Active, CM_Created_By, CM_Created_At)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,  ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          formData.get("CM_Company_ID") || "",
          formData.get("CM_Role_ID") || "",
          formData.get("CM_Labor_Type_ID") || null,
          formData.get("CM_First_Name") || "",
          formData.get("CM_Last_Name") || "",
          formData.get("CM_Full_Name") || "",
          formData.get("CM_Father_Name") || "",
          formData.get("CM_Marriage_Status") || "",
          formData.get("CM_Phone_Number") || "",
          formData.get("CM_Alternative_Phone") || "",
          formData.get("CM_Aadhaar_Number") || "",
          formData.get("CM_PAN_Number") || "",
          formData.get("CM_Password") || null,
          formData.get("CM_Email") || "",
          formData.get("CM_Address") || "",
          formData.get("CM_City") || "",
          formData.get("CM_District") || "",
          formData.get("CM_State") || "",
          formData.get("CM_Country") || "",
          formData.get("CM_Postal_Code") || null,
          formData.get("CM_Date_Of_Birth") || null,
          formData.get("CM_Gender") || "",
          formData.get("CM_Higher_Education") || "",
          formData.get("CM_Previous_Experiences") || "",
          photoUrl,
          formData.get("CM_Is_Active") || "Active",
          formData.get("CM_Created_By") || "",
        ]
      );

      const userId = userResult.insertId;

      // If a labor ID was provided, update the labor record with any changed information
      const laborId = formData.get("CM_Labor_ID");
      if (laborId) {
        await db.query(
          `UPDATE ccms_labor 
          SET 
            CM_Labor_Type = ?, 
            CM_Wage_Type = ?, 
            CM_Wage_Amount = ?
          WHERE CM_Labor_Type_ID = ?`,
          [
            formData.get("CM_Employee_Type") || null,
            formData.get("CM_Wage_Type") || null,
            formData.get("CM_Wage_Amount") || null,
            laborId
          ]
        );
      }

      // Commit the transaction
      await db.query("COMMIT");

      const res = NextResponse.json({
        success: true,
        userId: userId,
        message: "User created successfully"
      });
      res.headers.set('Cache-Control', 'no-store');
      return res;
    } catch (error) {
      // Rollback the transaction on any error
      await db.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error creating user:", error);
    const res = NextResponse.json(
      { error: "Failed to add user" },
      { status: 500 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}
