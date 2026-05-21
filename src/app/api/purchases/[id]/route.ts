import getDb from '../../../utils/db';
import { NextResponse } from 'next/server';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

// GET single item by ID
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> } // 👈 params is now a Promise
) {
  try {
    const { id } = await context.params; // 👈 must await params
    const db = await getDb();

    const [rows] = await db.query<RowDataPacket[]>(
      `
      SELECT 
        i.*, 
        c.CM_Category_Name AS categoryName,
        sc.CM_Subcategory_Name AS subcategoryName
      FROM ccms_item_master i
      LEFT JOIN ccms_category c ON i.CM_Category_ID = c.CM_Category_ID
      LEFT JOIN ccms_subcategory sc ON i.CM_Subcategory_ID = sc.CM_Subcategory_ID
      WHERE i.CM_Item_ID = ?
      `,
      [id]
    );

    if (rows.length === 0) {
      const res = NextResponse.json({ error: 'Item not found' }, { status: 404 });
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    const res = NextResponse.json(rows[0], { status: 200 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error) {
    console.error('GET /purchases/[id] error:', error);
    const res = NextResponse.json({ error: 'Failed to fetch item' }, { status: 500 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}

// PUT update item
async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> } // 👈 same change here
) {
  try {
    const { id } = await context.params; // 👈 must await
    const db = await getDb();
    const body = await req.json();

    const [result] = await db.query<ResultSetHeader>(
      `
      UPDATE ccms_item_master
      SET 
        CM_Item_Code = ?,
        CM_Item_Name = ?,
        CM_Item_Description = ?,
        CM_Category_ID = ?,
        CM_Subcategory_ID = ?,
        CM_Unit_Type = ?,
        CM_Stock_Level = ?,
        CM_HSN_ASC_Code = ?,
        CM_Is_Status = ?
      WHERE CM_Item_ID = ?
      `,
      [
        body.CM_Item_Code,
        body.CM_Item_Name,
        body.CM_Item_Description,
        body.CM_Category_ID,
        body.CM_Subcategory_ID,
        body.CM_Unit_Type,
        body.CM_Stock_Level,
        body.CM_HSN_ASC_Code,
        body.CM_Is_Status,
        id
      ]
    );

    if (result.affectedRows === 0) {
      const res = NextResponse.json({ error: 'No rows updated' }, { status: 404 });
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    const res = NextResponse.json({ message: 'Item updated successfully' }, { status: 200 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error) {
    console.error('PUT /purchases/[id] error:', error);
    const res = NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}

// POST handler to bypass 403 on PUT
export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  return PUT(req, context);
}
