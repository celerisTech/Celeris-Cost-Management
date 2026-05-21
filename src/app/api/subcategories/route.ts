import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import getDb from '../../utils/db';

export async function GET(req: NextRequest) {
  try {
    const db = await getDb();
    const categoryId = req.nextUrl.searchParams.get('categoryId');

    let query = 'SELECT CM_Subcategory_ID, CM_Category_ID, CM_Subcategory_Name FROM ccms_subcategory';
    const params = [];

    if (categoryId) {
      query += ' WHERE CM_Category_ID = ?';
      params.push(categoryId);
    }

    const [rows] = await db.execute<RowDataPacket[]>(query, params);

    const res = NextResponse.json(rows);
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    const res = NextResponse.json({ error: 'Failed to fetch subcategories' }, { status: 500 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Subcategory API received body:", body);
    
    const db = await getDb();
    
    // For update
    if (body.isUpdate && body.CM_Subcategory_ID) {
      await db.execute(
        'UPDATE ccms_subcategory SET CM_Subcategory_Name = ?, CM_Category_ID = ? WHERE CM_Subcategory_ID = ?',
        [body.CM_Subcategory_Name, body.CM_Category_ID, body.CM_Subcategory_ID]
      );
      
      return NextResponse.json({
        CM_Subcategory_ID: body.CM_Subcategory_ID,
        CM_Category_ID: body.CM_Category_ID,
        CM_Subcategory_Name: body.CM_Subcategory_Name
      });
    } 
    // For insert
    else {
      const [result] = await db.execute<ResultSetHeader>(
        'INSERT INTO ccms_subcategory (CM_Category_ID, CM_Subcategory_Name) VALUES (?, ?)',
        [body.CM_Category_ID, body.CM_Subcategory_Name]
      );

      return NextResponse.json({
        CM_Subcategory_ID: result.insertId,
        CM_Category_ID: body.CM_Category_ID,
        CM_Subcategory_Name: body.CM_Subcategory_Name
      });
    }
  } catch (error) {
    console.error('Error processing subcategory:', error);
    return NextResponse.json(
      { error: 'Failed to process subcategory: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
