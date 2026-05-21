import { NextResponse, NextRequest } from 'next/server';
import getDb from '@/app/utils/db';

const sanitize = (v: any) => (v === '' || v === undefined || v === null ? null : v);

function safeJsonResponse(data: any, status = 200) {
  try {
    const json = JSON.stringify(data, (key, value) =>
      typeof value === 'bigint' ? Number(value) : value
    );
    return new NextResponse(json, {
      status,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Serialization Error', details: err.message }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET  /api/sales-industrial?type=industrials
// GET  /api/sales-industrial?type=categories&industrialId=X
// GET  /api/sales-industrial?type=subcategories&categoryId=X
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const url = request.nextUrl;
    const type = url.searchParams.get('type');
    const industrialId = url.searchParams.get('industrialId');
    const categoryId = url.searchParams.get('categoryId');

    if (type === 'industrials') {
      const [rows] = await db.query(
        `SELECT CM_Industrial_ID, CM_Industrial_Name, CM_Description FROM ccms_industrial ORDER BY CM_Industrial_Name ASC`
      );
      return safeJsonResponse(rows);
    }

    if (type === 'categories') {
      let sql = `SELECT CM_Category_ID, CM_Industrial_ID, CM_Category_Name, CM_Description FROM ccms_sales_category`;
      const params: any[] = [];
      if (industrialId) { sql += ` WHERE CM_Industrial_ID = ?`; params.push(industrialId); }
      sql += ` ORDER BY CM_Category_Name ASC`;
      const [rows] = await db.query(sql, params);
      return safeJsonResponse(rows);
    }

    if (type === 'subcategories') {
      let sql = `SELECT CM_Subcategory_ID, CM_Category_ID, CM_Subcategory_Name, CM_Description FROM ccms_sales_subcategory`;
      const params: any[] = [];
      if (categoryId) { sql += ` WHERE CM_Category_ID = ?`; params.push(categoryId); }
      sql += ` ORDER BY CM_Subcategory_Name ASC`;
      const [rows] = await db.query(sql, params);
      return safeJsonResponse(rows);
    }

    return safeJsonResponse({ error: 'Invalid type parameter' }, 400);
  } catch (error: any) {
    console.error('Error in sales-industrial GET:', error);
    return safeJsonResponse({ error: 'Failed to fetch data', details: error.message }, 500);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/sales-industrial                  → create
// POST /api/sales-industrial?_method=PUT      → update
// POST /api/sales-industrial?_method=DELETE   → delete
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const method = request.nextUrl.searchParams.get('_method');
  if (method === 'PUT') return handleUpdate(request);
  if (method === 'DELETE') return handleDelete(request);
  return handleCreate(request);
}

async function handleCreate(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();
    const { entity, CM_Created_By } = body;

    if (entity === 'industrial') {
      if (!body.CM_Industrial_Name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
      await db.query(
        `INSERT INTO ccms_industrial (CM_Industrial_ID, CM_Industrial_Name, CM_Description, CM_Created_By) VALUES (NULL, ?, ?, ?)`,
        [body.CM_Industrial_Name.trim(), sanitize(body.CM_Description), sanitize(CM_Created_By)]
      );
      return NextResponse.json({ success: true }, { status: 201 });
    }

    if (entity === 'category') {
      if (!body.CM_Category_Name || !body.CM_Industrial_ID) return NextResponse.json({ error: 'Name and Industrial are required' }, { status: 400 });
      await db.query(
        `INSERT INTO ccms_sales_category (CM_Category_ID, CM_Industrial_ID, CM_Category_Name, CM_Description, CM_Created_By) VALUES (NULL, ?, ?, ?, ?)`,
        [body.CM_Industrial_ID, body.CM_Category_Name.trim(), sanitize(body.CM_Description), sanitize(CM_Created_By)]
      );
      return NextResponse.json({ success: true }, { status: 201 });
    }

    if (entity === 'subcategory') {
      if (!body.CM_Subcategory_Name || !body.CM_Category_ID) return NextResponse.json({ error: 'Name and Category are required' }, { status: 400 });
      await db.query(
        `INSERT INTO ccms_sales_subcategory (CM_Subcategory_ID, CM_Category_ID, CM_Subcategory_Name, CM_Description, CM_Created_By) VALUES (NULL, ?, ?, ?, ?)`,
        [body.CM_Category_ID, body.CM_Subcategory_Name.trim(), sanitize(body.CM_Description), sanitize(CM_Created_By)]
      );
      return NextResponse.json({ success: true }, { status: 201 });
    }

    return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 });
  } catch (error: any) {
    console.error('Error creating industrial entity:', error);
    return NextResponse.json({ error: 'Failed to create', details: error.sqlMessage || error.message }, { status: 500 });
  }
}

async function handleUpdate(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();
    const { entity, CM_Updated_By } = body;

    if (entity === 'industrial') {
      if (!body.CM_Industrial_ID) return NextResponse.json({ error: 'ID required' }, { status: 400 });
      await db.query(
        `UPDATE ccms_industrial SET CM_Industrial_Name = ?, CM_Description = ?, CM_Updated_By = ?, CM_Updated_At = NOW() WHERE CM_Industrial_ID = ?`,
        [body.CM_Industrial_Name.trim(), sanitize(body.CM_Description), sanitize(CM_Updated_By), body.CM_Industrial_ID]
      );
      return NextResponse.json({ success: true });
    }

    if (entity === 'category') {
      if (!body.CM_Category_ID) return NextResponse.json({ error: 'ID required' }, { status: 400 });
      await db.query(
        `UPDATE ccms_sales_category SET CM_Category_Name = ?, CM_Industrial_ID = ?, CM_Description = ?, CM_Updated_By = ?, CM_Updated_At = NOW() WHERE CM_Category_ID = ?`,
        [body.CM_Category_Name.trim(), body.CM_Industrial_ID, sanitize(body.CM_Description), sanitize(CM_Updated_By), body.CM_Category_ID]
      );
      return NextResponse.json({ success: true });
    }

    if (entity === 'subcategory') {
      if (!body.CM_Subcategory_ID) return NextResponse.json({ error: 'ID required' }, { status: 400 });
      await db.query(
        `UPDATE ccms_sales_subcategory SET CM_Subcategory_Name = ?, CM_Category_ID = ?, CM_Description = ?, CM_Updated_By = ?, CM_Updated_At = NOW() WHERE CM_Subcategory_ID = ?`,
        [body.CM_Subcategory_Name.trim(), body.CM_Category_ID, sanitize(body.CM_Description), sanitize(CM_Updated_By), body.CM_Subcategory_ID]
      );
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating industrial entity:', error);
    return NextResponse.json({ error: 'Failed to update', details: error.sqlMessage || error.message }, { status: 500 });
  }
}

async function handleDelete(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();
    const { entity } = body;

    if (entity === 'industrial') {
      if (!body.CM_Industrial_ID) return NextResponse.json({ error: 'ID required' }, { status: 400 });
      await db.query(`DELETE FROM ccms_industrial WHERE CM_Industrial_ID = ?`, [body.CM_Industrial_ID]);
      return NextResponse.json({ success: true });
    }

    if (entity === 'category') {
      if (!body.CM_Category_ID) return NextResponse.json({ error: 'ID required' }, { status: 400 });
      await db.query(`DELETE FROM ccms_sales_category WHERE CM_Category_ID = ?`, [body.CM_Category_ID]);
      return NextResponse.json({ success: true });
    }

    if (entity === 'subcategory') {
      if (!body.CM_Subcategory_ID) return NextResponse.json({ error: 'ID required' }, { status: 400 });
      await db.query(`DELETE FROM ccms_sales_subcategory WHERE CM_Subcategory_ID = ?`, [body.CM_Subcategory_ID]);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 });
  } catch (error: any) {
    console.error('Error deleting industrial entity:', error);
    return NextResponse.json({ error: 'Failed to delete', details: error.message }, { status: 500 });
  }
}
