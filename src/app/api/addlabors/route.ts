//src\app\api\addlabors\route.ts
import { NextResponse } from "next/server";
import getDb from "@/app/utils/db";
import { saveSecureFile } from "@/app/utils/fileUpload";

export async function POST(request: Request) {
  try {
    // Parse form data for file uploads
    const formData = await request.formData();

    // Extract image files
    const aadharImageFile = formData.get("CM_Aadhar_Image") as File | null;
    const panImageFile = formData.get("CM_PAN_Image") as File | null;
    const laborImageFile = formData.get("CM_Labor_Image") as File | null;
    let aadharImageUrl = "";
    let panImageUrl = "";
    let laborImageUrl = "";

    // Process Labor image if provided
    if (laborImageFile) {
      const bytes = await laborImageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      laborImageUrl = await saveSecureFile(buffer, laborImageFile.name, { subDir: 'labors' });
    }

    // Process Aadhar image if provided
    if (aadharImageFile) {
      const bytes = await aadharImageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      aadharImageUrl = await saveSecureFile(buffer, aadharImageFile.name, { subDir: 'labors' });
    }

    // Process PAN image if provided
    if (panImageFile) {
      const bytes = await panImageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      panImageUrl = await saveSecureFile(buffer, panImageFile.name, { subDir: 'labors' });
    }

    // Extract other form fields
    const CM_Labor_Code = formData.get("CM_Labor_Code") as string || null;
    const CM_Company_ID = formData.get("CM_Company_ID") as string;
    const CM_First_Name = formData.get("CM_First_Name") as string;
    const CM_Last_Name = formData.get("CM_Last_Name") as string || null;
    const CM_Fathers_Name = formData.get("CM_Fathers_Name") as string || null;
    const CM_Date_Of_Birth = formData.get("CM_Date_Of_Birth") as string || null;
    const CM_Labor_Join_Date = formData.get("CM_Labor_Join_Date") as string || null;
    const CM_Sex = formData.get("CM_Sex") as string || null;
    const CM_Marriage_Status = formData.get("CM_Marriage_Status") as string || null;
    const CM_Previous_Experience = formData.get("CM_Previous_Experience") as string || null;
    const CM_Labor_Type = formData.get("CM_Labor_Type") as string || null;
    const CM_Wage_Type = formData.get("CM_Wage_Type") as string || null;
    const CM_Wage_Amount = formData.get("CM_Wage_Amount") as string || null;
    const CM_Labor_Roll = formData.get("CM_Labor_Roll") as string || null;
    const CM_Higher_Education = formData.get("CM_Higher_Education") as string || null;
    const CM_Email = formData.get("CM_Email") as string || null;
    const CM_Phone_Number = formData.get("CM_Phone_Number") as string;
    const CM_Alternate_Phone = formData.get("CM_Alternate_Phone") as string || null;
    const CM_Status = formData.get("CM_Status") as string || "Active";
    const CM_Address = formData.get("CM_Address") as string || null;
    const CM_City = formData.get("CM_City") as string || null;
    const CM_District = formData.get("CM_District") as string || null;
    const CM_State = formData.get("CM_State") as string || null;
    const CM_Country = formData.get("CM_Country") as string || null;
    const CM_Postal_Code = formData.get("CM_Postal_Code") as string || null;
    const CM_Aadhar_Number = formData.get("CM_Aadhar_Number") as string || null;
    const CM_PAN_Number = formData.get("CM_PAN_Number") as string || null;
    const CM_Bank_Name = formData.get("CM_Bank_Name") as string || null;
    const CM_Bank_Branch = formData.get("CM_Bank_Branch") as string || null;
    const CM_Bank_IFSC = formData.get("CM_Bank_IFSC") as string || null;
    const CM_Bank_Account_Number = formData.get("CM_Bank_Account_Number") as string || null;
    const CM_Account_Holder_Name = formData.get("CM_Account_Holder_Name") as string || null;
    const CM_UPI_ID = formData.get("CM_UPI_ID") as string || null;
    const CM_Created_By = formData.get("CM_Created_By") as string || "system";
    const CM_Uploaded_By = formData.get("CM_Uploaded_By") as string || "system";
    console.log(CM_Created_By, CM_Uploaded_By);


    // ✅ Required fields validation
    if (!CM_Company_ID || !CM_First_Name || !CM_Phone_Number) {
      const res = NextResponse.json(
        { error: "Company ID, First Name, and Phone Number are required" },
        { status: 400 }
      );
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    const db = await getDb();

    // 🔹 Unique validation for Phone, Email, Aadhar, PAN
    const [existing]: any = await db.query(
      `SELECT CM_Phone_Number, CM_Email, CM_Aadhar_Number, CM_PAN_Number 
       FROM ccms_labor 
       WHERE CM_Phone_Number = ? 
          OR (CM_Email IS NOT NULL AND CM_Email = ?)
          OR (CM_Aadhar_Number IS NOT NULL AND CM_Aadhar_Number = ?)
          OR (CM_PAN_Number IS NOT NULL AND CM_PAN_Number = ?)`,
      [
        CM_Phone_Number,
        CM_Email || "",
        CM_Aadhar_Number ? BigInt(CM_Aadhar_Number) : 0,
        CM_PAN_Number || "",
      ]
    );

    if (existing.length > 0) {
      const duplicateFields: string[] = [];
      const row = existing[0];

      if (row.CM_Phone_Number === CM_Phone_Number) duplicateFields.push("Phone Number");
      if (row.CM_Email === CM_Email) duplicateFields.push("Email");
      if (row.CM_Aadhar_Number == CM_Aadhar_Number) duplicateFields.push("Aadhar Number");
      if (row.CM_PAN_Number === CM_PAN_Number) duplicateFields.push("PAN Number");

      const res = NextResponse.json(
        { error: `Duplicate entry for: ${duplicateFields.join(", ")}` },
        { status: 400 }
      );
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    const query = `
      INSERT INTO ccms_labor (
        CM_Labor_Code,
        CM_Labor_Type,
        CM_Wage_Type,
        CM_Wage_Amount,
        CM_Company_ID,
        CM_First_Name,
        CM_Last_Name,
        CM_Fathers_Name,
        CM_Date_Of_Birth,
        CM_Labor_Join_Date,
        CM_Sex,
        CM_Marriage_Status,
        CM_Previous_Experience,
        CM_Labor_Roll,
        CM_Higher_Education,
        CM_Email,
        CM_Phone_Number,
        CM_Alternate_Phone,
        CM_Labor_Image,
        CM_Status,
        CM_Address,
        CM_City,
        CM_District,
        CM_State,
        CM_Country,
        CM_Postal_Code,
        CM_Aadhar_Number,
        CM_PAN_Number,
        CM_Bank_Name,
        CM_Bank_Branch,
        CM_Bank_IFSC,
        CM_Bank_Account_Number,
        CM_Account_Holder_Name,
        CM_UPI_ID,
        CM_Created_By,
        CM_Created_At,
        CM_Uploaded_By,
        CM_Uploaded_At,
        CM_Aadhar_Image,
        CM_PAN_Image
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, NOW(), ?, ?)
    `;

    await db.query(query, [
      CM_Labor_Code || null,
      CM_Labor_Type || null,
      CM_Wage_Type || null,
      CM_Wage_Amount ? parseFloat(CM_Wage_Amount) : null,
      CM_Company_ID,
      CM_First_Name,
      CM_Last_Name || null,
      CM_Fathers_Name || null,
      CM_Date_Of_Birth || null,
      CM_Labor_Join_Date || null,
      CM_Sex || null,
      CM_Marriage_Status || null,
      CM_Previous_Experience || null,
      CM_Labor_Roll || null,
      CM_Higher_Education || null,
      CM_Email || null,
      CM_Phone_Number,
      CM_Alternate_Phone || null,
      laborImageUrl || null,
      CM_Status || "Active",
      CM_Address || null,
      CM_City || null,
      CM_District || null,
      CM_State || null,
      CM_Country || null,
      CM_Postal_Code ? parseInt(CM_Postal_Code) : null,
      CM_Aadhar_Number ? BigInt(CM_Aadhar_Number) : null,
      CM_PAN_Number || null,
      CM_Bank_Name || null,
      CM_Bank_Branch || null,
      CM_Bank_IFSC || null,
      CM_Bank_Account_Number || null,
      CM_Account_Holder_Name || null,
      CM_UPI_ID || null,
      CM_Created_By || "system",
      CM_Uploaded_By || "system",
      aadharImageUrl || null,
      panImageUrl || null
    ]);

    const res = NextResponse.json(
      {
        success: true,
        message: "Labor added successfully",
      },
      { status: 201 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error: any) {
    console.error("Error adding labor:", error.sqlMessage || error.message || error);
    const res = NextResponse.json(
      { error: "Internal Server Error. Check server logs for details." },
      { status: 500 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}

// Set larger file size limit for uploads
export const config = {
  api: {
    bodyParser: false,
    responseLimit: '10mb',
  },
};
