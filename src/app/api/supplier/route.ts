import { NextResponse, NextRequest } from 'next/server';
import getDb from '../../utils/db';

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const [rows] = await db.query('SELECT * FROM ccms_suppliers');
    const res = NextResponse.json(rows, { headers: { 'Cache-Control': 'no-store' } });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error) {
    console.error(error);
    const res = NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const db = await getDb();

    if (!body.CM_Company_Name) {
      const res = NextResponse.json({ error: "Supplier name is required" }, { status: 400 });
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    // Helpers
    const trim = (v: any) => (typeof v === "string" ? v.trim() : v);
    const uppercase = (v: any) =>
      typeof v === "string" ? v.trim().toUpperCase() : v ?? null;
    const toIntOrNull = (v: any) => {
      const n = Number.parseInt(String(v ?? "").trim(), 10);
      return Number.isFinite(n) ? n : null;
    };

    const companyName: string = trim(body.CM_Company_Name);
    const nowCodeSeed = Math.random().toString(36).slice(2, 6).toUpperCase();

    // Supplier Code (short code from company name)
    const supplierCode: string | null =
      trim(body.CM_Supplier_Code) ||
      (companyName?.slice(0, 3)?.toUpperCase() || "SUP") + "-" + nowCodeSeed;

    const isActive = ["Active", "Inactive"].includes(body.CM_Is_Active)
      ? body.CM_Is_Active
      : "Active";

    const createdBy: string | null = trim(body.CM_Created_By) || null;

    // Insert (no CM_Supplier_ID → auto_increment will handle it)
    const [result]: any = await db.query(
      `INSERT INTO ccms_suppliers 
      (CM_Supplier_Code, CM_Company_Name, CM_Contact_Person, CM_Email, CM_Phone_Number, 
       CM_Alternate_Phone, CM_Address, CM_District, CM_State, CM_Country, CM_Postal_Code, 
       CM_GST_Number, CM_PAN_Number, CM_Payment_Terms, CM_Is_Active, CM_Created_By, CM_Created_At) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        supplierCode || null,
        companyName,
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
        createdBy,
      ]
    );

    // Fetch newly created supplier using insertId
    const [newSupplier]: any = await db.query(
      "SELECT * FROM ccms_suppliers WHERE CM_Supplier_ID = ?",
      [result.insertId]
    );

    const res = NextResponse.json(newSupplier[0], { status: 201 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error) {
    console.error(error);
    const res = NextResponse.json({ error: "Failed to create supplier" }, { status: 500 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}
