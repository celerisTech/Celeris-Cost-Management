import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import getDb from "@/app/utils/db"; // ✅ DB connection util

// Validation schema
const ItemSchema = z.object({
  CM_Item_Code: z.string(),
  CM_Item_Name: z.string(),
  CM_Item_Description: z.string(),
  CM_Category_ID: z.string().optional(),
  CM_Subcategory_ID: z.string().optional(),
  CM_Unit_Type: z.string().optional(),
  CM_Stock_Level: z.number().int().nonnegative(),
  CM_HSN_ASC_Code: z.string().optional(),
  CM_Is_Status: z.enum(["Active", "Inactive"]),
  CM_Company_ID: z.string(),
  CM_Created_By: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const [rows] = await db.query('SELECT * FROM ccms_item_master');
    const res = NextResponse.json(rows, { headers: { 'Cache-Control': 'no-store' } });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error) {
    console.error(error);
    const res =  NextResponse.json({ error: 'Failed to fetch godowns' }, { status: 500 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}
export async function POST(req: Request) {
  try {
    const body = await req.json();
  
    const parsed = ItemSchema.parse({
      ...body,
    });

    const db = await getDb();
    const createdAt = new Date();

    const [result]: any = await db.query(
      `INSERT INTO ccms_item_master 
       (CM_Item_Code, CM_Item_Name,CM_Item_Description, CM_Category_ID, CM_Subcategory_ID, 
        CM_Unit_Type, CM_Stock_Level, CM_HSN_ASC_Code, CM_Is_Status, CM_Company_ID, 
        CM_Created_By, CM_Created_At) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        parsed.CM_Item_Code,
        parsed.CM_Item_Name,
        parsed.CM_Item_Description,
        parsed.CM_Category_ID || null,
        parsed.CM_Subcategory_ID || null,
        parsed.CM_Unit_Type,
        parsed.CM_Stock_Level,
        parsed.CM_HSN_ASC_Code || null,
        parsed.CM_Is_Status,
        parsed.CM_Company_ID,
        parsed.CM_Created_By,
        createdAt,
      ]
    );

    const res = NextResponse.json({
      success: true,
      itemId: result.insertId,
    });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error) {
    console.error("❌ Error adding item:", error);
    const res = NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 400 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}
