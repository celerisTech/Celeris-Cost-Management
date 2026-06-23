import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/app/utils/db';

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const url = new URL(request.url);
    const activeOnly = url.searchParams.get('active') === 'true';

    let query = `SELECT * FROM ccms_visit_status_type`;
    if (activeOnly) {
      query += ` WHERE Is_Active = 1`;
    }
    query += ` ORDER BY Status_ID ASC`;

    const [rows] = await db.execute(query);
    return NextResponse.json({ success: true, data: rows }, { status: 200 });
  } catch (error: any) {
    console.error('[visit-status GET]', error);
    return NextResponse.json({ error: 'Failed to fetch visit statuses' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();
    const { Status_Name, Color_Code, Is_Active } = body;

    if (!Status_Name) {
      return NextResponse.json({ error: 'Status Name is required' }, { status: 400 });
    }

    const [result]: any = await db.execute(
      `INSERT INTO ccms_visit_status_type (Status_Name, Color_Code, Is_Active) VALUES (?, ?, ?)`,
      [Status_Name, Color_Code || 'blue', Is_Active !== undefined ? Is_Active : 1]
    );

    return NextResponse.json({ success: true, Status_ID: result.insertId }, { status: 201 });
  } catch (error: any) {
    console.error('[visit-status POST]', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Status Name already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create visit status' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();
    const { Status_ID, Status_Name, Color_Code, Is_Active, cascadeUpdate } = body;

    if (!Status_ID || !Status_Name) {
      return NextResponse.json({ error: 'Status ID and Name are required' }, { status: 400 });
    }

    // Get the old name if cascadeUpdate is requested
    let oldName = '';
    if (cascadeUpdate) {
        const [oldRows]: any = await db.execute(`SELECT Status_Name FROM ccms_visit_status_type WHERE Status_ID = ?`, [Status_ID]);
        if (oldRows.length > 0) oldName = oldRows[0].Status_Name;
    }

    await db.execute(
      `UPDATE ccms_visit_status_type SET Status_Name = ?, Color_Code = ?, Is_Active = ? WHERE Status_ID = ?`,
      [Status_Name, Color_Code || 'blue', Is_Active !== undefined ? Is_Active : 1, Status_ID]
    );

    // Update existing visits if requested
    if (cascadeUpdate && oldName && oldName !== Status_Name) {
        await db.execute(`UPDATE ccms_sales_visit SET CM_Visit_Status = ? WHERE CM_Visit_Status = ?`, [Status_Name, oldName]);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('[visit-status PUT]', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Status Name already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update visit status' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const db = await getDb();
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Status ID is required' }, { status: 400 });
    }

    await db.execute(`DELETE FROM ccms_visit_status_type WHERE Status_ID = ?`, [id]);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('[visit-status DELETE]', error);
    return NextResponse.json({ error: 'Failed to delete visit status' }, { status: 500 });
  }
}
