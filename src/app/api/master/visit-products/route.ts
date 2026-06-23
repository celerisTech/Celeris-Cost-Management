import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/app/utils/db';

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const url = new URL(request.url);
    const activeOnly = url.searchParams.get('active') === 'true';

    let query = `SELECT * FROM ccms_visit_products`;
    if (activeOnly) {
      query += ` WHERE Is_Active = 1`;
    }
    query += ` ORDER BY Product_ID ASC`;

    const [rows] = await db.execute(query);
    return NextResponse.json({ success: true, data: rows }, { status: 200 });
  } catch (error: any) {
    console.error('[visit-products GET]', error);
    return NextResponse.json({ error: 'Failed to fetch visit products' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();
    const { Product_Name, Color_Code, Is_Active } = body;

    if (!Product_Name) {
      return NextResponse.json({ error: 'Product Name is required' }, { status: 400 });
    }

    const [result]: any = await db.execute(
      `INSERT INTO ccms_visit_products (Product_Name, Color_Code, Is_Active) VALUES (?, ?, ?)`,
      [Product_Name, Color_Code || 'blue', Is_Active !== undefined ? Is_Active : 1]
    );

    return NextResponse.json({ success: true, Product_ID: result.insertId }, { status: 201 });
  } catch (error: any) {
    console.error('[visit-products POST]', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Product Name already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create visit product' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();
    const { Product_ID, Product_Name, Color_Code, Is_Active, cascadeUpdate } = body;

    if (!Product_ID || !Product_Name) {
      return NextResponse.json({ error: 'Product ID and Name are required' }, { status: 400 });
    }

    // Get the old name if cascadeUpdate is requested
    let oldName = '';
    if (cascadeUpdate) {
        const [oldRows]: any = await db.execute(`SELECT Product_Name FROM ccms_visit_products WHERE Product_ID = ?`, [Product_ID]);
        if (oldRows.length > 0) oldName = oldRows[0].Product_Name;
    }

    await db.execute(
      `UPDATE ccms_visit_products SET Product_Name = ?, Color_Code = ?, Is_Active = ? WHERE Product_ID = ?`,
      [Product_Name, Color_Code || 'blue', Is_Active !== undefined ? Is_Active : 1, Product_ID]
    );

    // Update existing visits if requested
    if (cascadeUpdate && oldName && oldName !== Product_Name) {
        await db.execute(`UPDATE ccms_sales_visit SET CM_Visit_Products = ? WHERE CM_Visit_Products = ?`, [Product_Name, oldName]);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('[visit-products PUT]', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Product Name already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update visit product' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const db = await getDb();
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    await db.execute(`DELETE FROM ccms_visit_products WHERE Product_ID = ?`, [id]);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('[visit-products DELETE]', error);
    return NextResponse.json({ error: 'Failed to delete visit product' }, { status: 500 });
  }
}
