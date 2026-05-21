import { NextRequest, NextResponse } from "next/server";
import getDb from "@/app/utils/db";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

// ✅ GET all users of a company
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: "Missing companyId" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const [rows] = await db.query(
      `SELECT 
        u.*, 
        r.CM_Role_Description 
       FROM ccms_users u
       LEFT JOIN ccms_roles_master r ON u.CM_Role_ID = r.CM_Role_ID
       WHERE u.CM_Company_ID = ?
       ORDER BY u.CM_Full_Name`,
      [companyId]
    );

    const res = NextResponse.json({ success: true, members: rows });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (err) {
    console.error("GET /api/teams error:", err);
    const res = NextResponse.json(
      { success: false, error: "Failed to fetch team members" },
      { status: 500 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}

// ✅ PUT update user (edit details)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      CM_User_ID,
      CM_First_Name,
      CM_Last_Name,
      CM_Full_Name,
      CM_Father_Name,
      CM_Date_Of_Birth,
      CM_Gender,
      CM_Higher_Education,
      CM_Previous_Experiences,
      CM_Email,
      CM_Phone_Number,
      CM_Alternative_Phone,
      CM_Role_ID,
      CM_Address,
      CM_City,
      CM_District,
      CM_State,
      CM_Country,
      CM_Postal_Code,
      CM_Aadhaar_Number,
      CM_PAN_Number,
      CM_Photo_URL,
      CM_Is_Active,
    } = body;

    if (!CM_User_ID) {
      const res = NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    const db = await getDb();

    // First check if email already exists for another user
    const [existingEmail] = await db.query(
      "SELECT CM_User_ID FROM ccms_users WHERE CM_Email = ? AND CM_User_ID != ?",
      [CM_Email, CM_User_ID]
    );

    if (Array.isArray(existingEmail) && existingEmail.length > 0) {
      const res = NextResponse.json(
        { success: false, error: "Email address already exists for another user" },
        { status: 400 }
      );
      res.headers.set('Cache-Control', 'no-store');
      return res;

    }

    // Check if phone number already exists for another user
    const [existingPhone] = await db.query(
      "SELECT CM_User_ID FROM ccms_users WHERE CM_Phone_Number = ? AND CM_User_ID != ?",
      [CM_Phone_Number, CM_User_ID]
    );

    if (Array.isArray(existingPhone) && existingPhone.length > 0) {
      const res = NextResponse.json(
        { success: false, error: "Phone number already exists for another user" },
        { status: 400 }
      );
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    await db.query(
      `UPDATE ccms_users 
       SET 
         CM_First_Name = ?,
         CM_Last_Name = ?,
         CM_Full_Name = ?,
         CM_Father_Name = ?,
         CM_Date_Of_Birth = ?,
         CM_Gender = ?,
         CM_Higher_Education = ?,
         CM_Previous_Experiences = ?,
         CM_Email = ?,
         CM_Phone_Number = ?,
         CM_Alternative_Phone = ?,
         CM_Role_ID = ?,
         CM_Address = ?,
         CM_City = ?,
         CM_District = ?,
         CM_State = ?,
         CM_Country = ?,
         CM_Postal_Code = ?,
         CM_Aadhaar_Number = ?,
         CM_PAN_Number = ?,
         CM_Photo_URL = ?,
         CM_Is_Active = ?,
         CM_Uploaded_At = NOW(),
         CM_Uploaded_By = ?
       WHERE CM_User_ID = ?`,
      [
        CM_First_Name,
        CM_Last_Name,
        CM_Full_Name,
        CM_Father_Name,
        CM_Date_Of_Birth || null,
        CM_Gender,
        CM_Higher_Education,
        CM_Previous_Experiences,
        CM_Email,
        CM_Phone_Number,
        CM_Alternative_Phone,
        CM_Role_ID,
        CM_Address,
        CM_City,
        CM_District,
        CM_State,
        CM_Country,
        CM_Postal_Code ? parseInt(CM_Postal_Code) : null,
        CM_Aadhaar_Number,
        CM_PAN_Number,
        CM_Photo_URL,
        CM_Is_Active,
        "SYSTEM", // You can pass the current user's name here
        CM_User_ID,
      ]
    );

    const res = NextResponse.json({ success: true, message: "User updated successfully" });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (err) {
    console.error("PUT /api/teams error:", err);
    const res = NextResponse.json(
      { success: false, error: "Failed to update user" },
      { status: 500 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}

// ✅ PATCH toggle active/inactive quickly
export async function PATCH(req: NextRequest) {
  try {
    const { userId, status } = await req.json();

    if (!userId || !status) {
      return NextResponse.json(
        { success: false, error: "Missing parameters" },
        { status: 400 }
      );
    }

    const db = await getDb();
    await db.query(
      `UPDATE ccms_users 
       SET CM_Is_Active = ?, CM_Uploaded_At = NOW(), CM_Uploaded_By = ?
       WHERE CM_User_ID = ?`,
      [status, "SYSTEM", userId]
    );

    const res = NextResponse.json({ success: true, message: "User status updated" });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (err) {
    console.error("PATCH /api/teams error:", err);
    const res = NextResponse.json(
      { success: false, error: "Failed to update status" },
      { status: 500 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}

// ✅ POST upload user profile image (or method override)
export async function POST(req: NextRequest) {
  const method = req.nextUrl.searchParams.get("_method");

  if (method === "PUT") return PUT(req);
  if (method === "PATCH") return PATCH(req);
  if (method === "DELETE") return DELETE(req);

  try {
    // Check if it's an image upload request or team creation request
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      // Handle image upload
      return await handleImageUpload(req);
    } else {
      // Handle team creation (if you have this functionality)
      return NextResponse.json(
        { success: false, error: "Invalid request type" },
        { status: 400 }
      );
    }
  } catch (err) {
    console.error("POST /api/teams error:", err);
    const res = NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}

// Helper function to handle image upload
async function handleImageUpload(req: NextRequest) {
  try {
    const formData = await req.formData();
    const image = formData.get("image") as File;
    const userId = formData.get("userId") as string;

    if (!image || !userId) {
      return NextResponse.json(
        { success: false, error: "Missing image or user ID" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!image.type.startsWith("image/")) {
      return NextResponse.json(
        { success: false, error: "File must be an image" },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    if (image.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "Image size must be less than 5MB" },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = image.name.split('.').pop() || 'jpg';
    const fileName = `user_${userId}_${timestamp}.${fileExtension}`;

    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), "public", "uploads", "profiles");
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Save file
    const buffer = Buffer.from(await image.arrayBuffer());
    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    // Update user's photo URL in database
    const db = await getDb();
    const imageUrl = `/uploads/profiles/${fileName}`;

    await db.query(
      `UPDATE ccms_users 
       SET CM_Photo_URL = ?, CM_Uploaded_At = NOW(), CM_Uploaded_By = ?
       WHERE CM_User_ID = ?`,
      [imageUrl, "SYSTEM", userId]
    );

    return NextResponse.json({
      success: true,
      imageUrl,
      message: "Image uploaded and updated successfully"
    });

  } catch (error) {
    console.error("Image upload error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload image" },
      { status: 500 }
    );
  }
}

// ✅ DELETE user image
export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Get current photo URL
    const [userData] = await db.query(
      "SELECT CM_Photo_URL FROM ccms_users WHERE CM_User_ID = ?",
      [userId]
    );

    // Remove image from storage if it exists in uploads folder
    if (Array.isArray(userData) && userData.length > 0) {
      const user = userData[0] as any;
      if (user.CM_Photo_URL && user.CM_Photo_URL.startsWith('/uploads/')) {
        const filePath = path.join(process.cwd(), "public", user.CM_Photo_URL);
        if (existsSync(filePath)) {
          await writeFile(filePath, ''); // Clear the file
        }
      }
    }

    // Update database to remove photo URL
    await db.query(
      `UPDATE ccms_users 
       SET CM_Photo_URL = NULL, CM_Uploaded_At = NOW(), CM_Uploaded_By = ?
       WHERE CM_User_ID = ?`,
      ["SYSTEM", userId]
    );

    const res = NextResponse.json({
      success: true,
      message: "User image removed successfully"
    });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (err) {
    console.error("DELETE /api/teams error:", err);
    const res = NextResponse.json(
      { success: false, error: "Failed to remove user image" },
      { status: 500 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}