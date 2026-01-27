import { NextResponse, NextRequest } from "next/server";
import getDb from "../../../utils/db";

// GET supplier by ID
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } // 👈 changed
) {
  try {
    const { id } = await context.params; // 👈 must await
    const db = await getDb();
    const [rows] = await db.query(
      "SELECT * FROM ccms_suppliers WHERE CM_Supplier_ID = ?",
      [id]
    );

    if ((rows as any).length === 0) {
      const res = NextResponse.json({ error: "Supplier not found." }, { status: 404 });

      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    const res = NextResponse.json((rows as any)[0]);
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error) {
    console.error(error);
    const res = NextResponse.json({ error: "Failed to fetch supplier." }, { status: 500 });

    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}

// PUT update supplier
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const db = await getDb();

    if (!body.CM_Company_Name) {
      const res = NextResponse.json(
        { error: "Supplier name is required." },

        { status: 400 }
      );
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    const trim = (v: any) => (typeof v === "string" ? v.trim() : v);
    const uppercase = (v: any) =>
      typeof v === "string" ? v.trim().toUpperCase() : v ?? null;
    const toIntOrNull = (v: any) => {
      const n = Number.parseInt(String(v ?? "").trim(), 10);
      return Number.isFinite(n) ? n : null;
    };

    const isActive = ["Active", "Inactive"].includes(body.CM_Is_Active)
      ? body.CM_Is_Active
      : "Active";
    const uploadedBy: string | null = trim(body.CM_Uploaded_By) || null;

    await db.query(
      `UPDATE ccms_suppliers SET 
        CM_Supplier_Code = ?, CM_Company_Name = ?, CM_Contact_Person = ?, 
        CM_Email = ?, CM_Phone_Number = ?, CM_Alternate_Phone = ?, 
        CM_Address = ?, CM_District = ?, CM_State = ?, CM_Country = ?, 
        CM_Postal_Code = ?, CM_GST_Number = ?, CM_PAN_Number = ?, 
        CM_Payment_Terms = ?, CM_Is_Active = ?, CM_Uploaded_By = ?, CM_Uploaded_At = NOW()
      WHERE CM_Supplier_ID = ?`,
      [
        trim(body.CM_Supplier_Code) || null,
        trim(body.CM_Company_Name),
        trim(body.CM_Contact_Person) || null,
        trim(body.CM_Email) || null,
        trim(body.CM_Phone_Number) || null,
        trim(body.CM_Alternate_Phone) || null,
        trim(body.CM_Address) || null,
        trim(body.CM_District) || null,
        trim(body.CM_State) || null,
        trim(body.CM_Country) || null,
        toIntOrNull(body.CM_Postal_Code),
        uppercase(body.CM_GST_Number) || null,
        uppercase(body.CM_PAN_Number) || null,
        trim(body.CM_Payment_Terms) || null,
        isActive,
        uploadedBy,
        id,
      ]
    );

    const [updatedSupplier] = await db.query(
      "SELECT * FROM ccms_suppliers WHERE CM_Supplier_ID = ?",
      [id]
    );

    const res = NextResponse.json((updatedSupplier as any)[0]);
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error) {
    console.error(error);
    const res = NextResponse.json(
      { error: "Failed to update supplier." },

      { status: 500 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}

// DELETE supplier by ID
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } // 👈 changed
) {
  try {
    const { id } = await context.params; // 👈 must await
    const db = await getDb();
    const [result]: any = await db.query(
      "DELETE FROM ccms_suppliers WHERE CM_Supplier_ID = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      const res = NextResponse.json({ error: "Supplier not found." }, { status: 404 });

      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    const res = NextResponse.json({ success: true });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error) {
    console.error(error);
    const res = NextResponse.json({ error: "Failed to delete supplier." }, { status: 500 });

    res.headers.set('Cache-Control', 'no-store');

    return res;
  }
}

// POST handler to bypass 403 on PUT/DELETE
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const method = request.nextUrl.searchParams.get("_method");

  if (method === "DELETE") {
    return DELETE(request, context);
  }

  // Default to PUT (Update)
  return PUT(request, context);
}
