// app/api/labor-details/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import getDb from "@/app/utils/db";
import { saveBase64File } from "@/app/utils/fileUpload";

// GET handler to fetch complete labor details by ID
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const db = await getDb();

    // Fetch complete labor details
    const [laborRows] = await db.query(
      `SELECT * FROM ccms_labor WHERE CM_Labor_Type_ID = ?`,
      [id]
    );

    if (!laborRows || (laborRows as any[]).length === 0) {
      const response = NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
      response.headers.set('Cache-Control', 'no-store');
      return response;
    }

    const labor = (laborRows as any[])[0];

    // FIX: Proper date handling for display
    if (labor.CM_Date_Of_Birth) {
      // If it's a Date object from MySQL, convert to YYYY-MM-DD
      if (labor.CM_Date_Of_Birth instanceof Date) {
        const year = labor.CM_Date_Of_Birth.getFullYear();
        const month = String(labor.CM_Date_Of_Birth.getMonth() + 1).padStart(2, '0');
        const day = String(labor.CM_Date_Of_Birth.getDate()).padStart(2, '0');
        labor.CM_Date_Of_Birth = `${year}-${month}-${day}`;
      }
      // If it's a string in YYYY-MM-DD format, use as is
      else if (typeof labor.CM_Date_Of_Birth === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(labor.CM_Date_Of_Birth)) {
        // Already in correct format, no change needed
      }
      // If it's a string with time, extract date part only
      else if (typeof labor.CM_Date_Of_Birth === 'string' && labor.CM_Date_Of_Birth.includes('T')) {
        labor.CM_Date_Of_Birth = labor.CM_Date_Of_Birth.split('T')[0];
      }
    }

    const response = NextResponse.json(
      { labor },
      { status: 200 }
    );
    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch (error) {
    console.error('Error fetching labor details:', error);
    const response = NextResponse.json(
      { error: 'Failed to fetch employee details', details: (error as Error).message },
      { status: 500 }
    );
    response.headers.set('Cache-Control', 'no-store');
    return response;
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const db = await getDb();
    const data = await request.json();

    // ========== Create Upload Folder ==========
    // logic handled inside saveBase64File

    // ========== Convert Base64 → File ==========
    async function saveImage(base64: any, filename: string) {
      // We pass 'labors' as subDir. 'filename' arg is used as prefix for validation but UUID is used for storage.
      return await saveBase64File(base64, filename, 'labors');
    }

    // -------- Save Images --------
    const laborImagePath = await saveImage(data.CM_Labor_Image, `labor_${id}`);
    const aadharImagePath = await saveImage(data.CM_Aadhar_Image, `aadhar_${id}`);
    const panImagePath = await saveImage(data.CM_PAN_Image, `pan_${id}`);

    // Keep old images if new not provided
    const finalLaborImage = laborImagePath || data.CM_Labor_Image;
    const finalAadharImage = aadharImagePath || data.CM_Aadhar_Image;
    const finalPanImage = panImagePath || data.CM_PAN_Image;

    // -------- Format Dates --------
    function formatDate(d: any) {
      if (!d) return null;
      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return null;

      return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(dt.getDate()).padStart(2, "0")}`;
    }

    const DOB = formatDate(data.CM_Date_Of_Birth);
    const JoinDate = formatDate(data.CM_Labor_Join_Date);

    // ================= UPDATE QUERY =================
    const query = `
      UPDATE ccms_labor SET
        CM_Labor_Code = ?,
        CM_Labor_Type = ?,
        CM_Wage_Type = ?,
        CM_Wage_Amount = ?,
        CM_Company_ID = ?,
        CM_First_Name = ?,
        CM_Last_Name = ?,
        CM_Fathers_Name = ?,
        CM_Date_Of_Birth = ?,
        CM_Labor_Join_Date = ?,
        CM_Sex = ?,
        CM_Marriage_Status = ?,
        CM_Previous_Experience = ?,
        CM_Labor_Roll = ?,
        CM_Higher_Education = ?,
        CM_Email = ?,
        CM_Phone_Number = ?,
        CM_Alternate_Phone = ?,
        CM_Labor_Image = ?,
        CM_Status = ?,
        CM_Address = ?,
        CM_City = ?,
        CM_District = ?,
        CM_State = ?,
        CM_Country = ?,
        CM_Postal_Code = ?,
        CM_Aadhar_Number = ?,
        CM_PAN_Number = ?,
        CM_Aadhar_Image = ?,
        CM_PAN_Image = ?,
        CM_Bank_Name = ?,
        CM_Bank_Branch = ?,
        CM_Bank_IFSC = ?,
        CM_Bank_Account_Number = ?,
        CM_Account_Holder_Name = ?,
        CM_UPI_ID = ?,
        CM_Uploaded_By = ?,
        CM_Uploaded_At = NOW()
      WHERE CM_Labor_Type_ID = ?
    `;

    const values = [
      data.CM_Labor_Code,
      data.CM_Labor_Type,
      data.CM_Wage_Type,
      data.CM_Wage_Amount,
      data.CM_Company_ID,
      data.CM_First_Name,
      data.CM_Last_Name,
      data.CM_Fathers_Name,
      DOB,
      JoinDate,
      data.CM_Sex,
      data.CM_Marriage_Status,
      data.CM_Previous_Experience,
      data.CM_Labor_Roll,
      data.CM_Higher_Education,
      data.CM_Email,
      data.CM_Phone_Number,
      data.CM_Alternate_Phone,
      finalLaborImage,
      data.CM_Status,
      data.CM_Address,
      data.CM_City,
      data.CM_District,
      data.CM_State,
      data.CM_Country,
      data.CM_Postal_Code,
      data.CM_Aadhar_Number,
      data.CM_PAN_Number,
      finalAadharImage,
      finalPanImage,
      data.CM_Bank_Name,
      data.CM_Bank_Branch,
      data.CM_Bank_IFSC,
      data.CM_Bank_Account_Number,
      data.CM_Account_Holder_Name,
      data.CM_UPI_ID,
      data.CM_Uploaded_By || "system",
      id,
    ];

    await db.query(query, values);

    return NextResponse.json(
      { success: true, message: "Labor updated successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Labor Update Error:", error);
    return NextResponse.json(
      { error: "Failed to update labor", details: error.message },
      { status: 500 }
    );
  }
}
