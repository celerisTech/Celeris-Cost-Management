// app/api/items/route.ts
import getDb from '../../utils/db';
import { NextRequest } from 'next/server';
import type { RowDataPacket } from 'mysql2';

export async function GET(req: NextRequest) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');
    const status = searchParams.get('status');

    let query = `
          SELECT 
          i.CM_Item_ID,
          i.CM_Item_Code,
          i.CM_Item_Name,
          i.CM_Item_Description,
          i.CM_Category_ID,
          i.CM_Subcategory_ID,
          i.CM_Unit_Type,
          u.CM_Unit_Name AS unitName,           
          i.CM_Stock_Level,
          i.CM_HSN_ASC_Code,
          i.CM_Is_Status,
          i.CM_Company_ID,
          i.CM_Created_By,
          i.CM_Created_At,
          i.CM_Uploaded_By,
          i.CM_Uploaded_At,
          c.CM_Category_Name AS categoryName,
          sc.CM_Subcategory_Name AS subcategoryName
      FROM 
          ccms_item_master i
      LEFT JOIN 
          ccms_category c 
          ON i.CM_Category_ID = c.CM_Category_ID
      LEFT JOIN 
          ccms_subcategory sc 
          ON i.CM_Subcategory_ID = sc.CM_Subcategory_ID
      LEFT JOIN 
          ccms_unit_type u 
          ON i.CM_Unit_Type = u.CM_Unit_ID  
      WHERE 
          1=1
    `;

    const values: any[] = [];

    if (categoryId) {
      query += ' AND i.CM_Category_ID = ?';
      values.push(categoryId);
    }

    if (status) {
      query += ' AND i.CM_Is_Status = ?';
      values.push(status);
    }

    query += ' ORDER BY i.CM_Item_Name ASC';

    const [rows] = await db.query<RowDataPacket[]>(query, values);

    const processedRows = rows.map(row => ({
      ...row,
      CM_Stock_Level: row.CM_Stock_Level ? Number(row.CM_Stock_Level) : 0,
      CM_Created_At: row.CM_Created_At ? new Date(row.CM_Created_At).toISOString() : null,
      CM_Uploaded_At: row.CM_Uploaded_At ? new Date(row.CM_Uploaded_At).toISOString() : null,
    }));

    const res = new Response(JSON.stringify(processedRows), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error) {
    console.error('GET Items Error:', error);
    const res = new Response(JSON.stringify({ error: 'Failed to fetch items' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}