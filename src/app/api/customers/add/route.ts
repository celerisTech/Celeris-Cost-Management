// src/app/api/customers/add/route.ts
import { NextResponse, NextRequest } from "next/server";
import getDb from "@/app/utils/db";

// Fetch all customers or a specific customer by ID
export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const customerId = request.nextUrl.searchParams.get('customerId');

    if (customerId) {
      // Fetch a single customer by ID
      const [rows] = await db.query(`SELECT * FROM ccms_customer WHERE CM_Customer_ID = ?`, [customerId]);

      // Use Array.isArray to verify the type at runtime
      if (rows && Array.isArray(rows) && rows.length > 0) {
        return NextResponse.json(rows[0], { status: 200 });
      } else {
        return NextResponse.json({ message: "Customer not found" }, { status: 404 });
      }
    } else {
      // Fetch all customers
      const [rows] = await db.query(`SELECT * FROM ccms_customer ORDER BY CM_Created_At DESC`);
      const res = NextResponse.json(rows, { status: 200 });
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }
  } catch (error: any) {
    console.error("❌ MySQL Error (GET customers):", error);
    const res = NextResponse.json(
      { message: "Failed to fetch customers", error: error.message },
      { status: 500 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}


// Create a new customer
export async function POST(req: Request) {
  const method = new URL(req.url).searchParams.get("_method");
  if (method === "PUT") return PUT(req);

  try {
    const body = await req.json();
    const {
      CM_Customer_Name,
      CM_Email,
      CM_Phone_Number,
      CM_Alternate_Phone,
      CM_Address,
      CM_District,
      CM_State,
      CM_Country,
      CM_Postal_Code,
      CM_Location,
      CM_GST_Number,
      CM_PAN_Number,
      CM_Payment_Terms,
      CM_Is_Active,
      CM_Create_Limit,
      CM_Created_By,
      CM_Uploaded_By,
    } = body;

    const db = await getDb();

    // Insert new customer
    await db.query(
      `INSERT INTO ccms_customer (
        CM_Customer_Name, CM_Email, CM_Phone_Number, CM_Alternate_Phone, 
        CM_Address, CM_District, CM_State, CM_Country, CM_Postal_Code, CM_Location, 
        CM_GST_Number, CM_PAN_Number, CM_Payment_Terms, CM_Is_Active, 
        CM_Create_Limit, CM_Created_By, CM_Created_At, CM_Uploaded_By, CM_Uploaded_At
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, NOW())`,
      [
        CM_Customer_Name,
        CM_Email,
        CM_Phone_Number,
        CM_Alternate_Phone,
        CM_Address,
        CM_District,
        CM_State,
        CM_Country,
        CM_Postal_Code || null,
        CM_Location,
        CM_GST_Number,
        CM_PAN_Number,
        CM_Payment_Terms,
        CM_Is_Active || "Active",
        CM_Create_Limit,
        CM_Created_By,
        CM_Uploaded_By,
      ]
    );

    // Get inserted ID
    const [rows]: any = await db.query(
      `SELECT CM_Customer_ID
        FROM ccms_customer
        ORDER BY CM_Customer_ID DESC
        LIMIT 1`
    );

    const res = NextResponse.json(
      { message: "Customer added successfully", CM_Customer_ID: rows[0]?.CM_Customer_ID },
      { status: 201 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error: any) {
    console.error("❌ MySQL Error (POST customers):", error);
    const res = NextResponse.json(
      { message: "Failed to add customer", error: error.message },
      { status: 500 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}

// Update an existing customer
async function PUT(req: Request) {
  try {
    const body = await req.json();
    const {
      CM_Customer_ID, // Required for updating
      CM_Customer_Name,
      CM_Email,
      CM_Phone_Number,
      CM_Alternate_Phone,
      CM_Address,
      CM_District,
      CM_State,
      CM_Country,
      CM_Postal_Code,
      CM_Location,
      CM_GST_Number,
      CM_PAN_Number,
      CM_Payment_Terms,
      CM_Is_Active,
      CM_Create_Limit,
      CM_Uploaded_By,
    } = body;

    if (!CM_Customer_ID) {
      return NextResponse.json(
        { message: "Customer ID is required for updates" },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Update existing customer
    await db.query(
      `UPDATE ccms_customer SET
        CM_Customer_Name = ?,
        CM_Email = ?,
        CM_Phone_Number = ?,
        CM_Alternate_Phone = ?,
        CM_Address = ?,
        CM_District = ?,
        CM_State = ?,
        CM_Country = ?,
        CM_Postal_Code = ?,
        CM_Location = ?,
        CM_GST_Number = ?,
        CM_PAN_Number = ?,
        CM_Payment_Terms = ?,
        CM_Is_Active = ?,
        CM_Create_Limit = ?,
        CM_Uploaded_By = ?,
        CM_Uploaded_At = NOW()
      WHERE CM_Customer_ID = ?`,
      [
        CM_Customer_Name,
        CM_Email,
        CM_Phone_Number,
        CM_Alternate_Phone,
        CM_Address,
        CM_District,
        CM_State,
        CM_Country,
        CM_Postal_Code || null,
        CM_Location,
        CM_GST_Number,
        CM_PAN_Number,
        CM_Payment_Terms,
        CM_Is_Active || "Active",
        CM_Create_Limit,
        CM_Uploaded_By,
        CM_Customer_ID
      ]
    );

    const res = NextResponse.json(
      { message: "Customer updated successfully", CM_Customer_ID },
      { status: 200 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error: any) {
    console.error("❌ MySQL Error (PUT customers):", error);
    const res = NextResponse.json(
      { message: "Failed to update customer", error: error.message },
      { status: 500 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}