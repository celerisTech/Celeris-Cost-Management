// src/app/api/stock-management/route.ts
import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/app/utils/db';
import { RowDataPacket } from 'mysql2';

type StockLocation = {
  godown_id: string;
  godown_name: string;
  godown_location: string;
  product_id: string;
  item_id: string;
  item_code: string;
  item_description: string;
  item_name: string;
  unit_name: string;
  quantity: number;
  stock_status: 'Empty' | 'Low Stock' | 'Available';
  transaction_count: number;
  created_at: string;
  created_by: string;
};

type GodownSummary = {
  godown_id: string;
  godown_name: string;
  location: string;
  total_items: number;
  total_quantity: number;
  available_items: number;
  low_stock_items: number;
  empty_items: number;
  utilization_rate: number;
  total_transfers: number;
};

interface GodownRow extends RowDataPacket {
  CM_Godown_ID: string;
  CM_Godown_Code: string;
  CM_Company_ID: string;
  CM_Godown_Name: string;
  CM_Location: string;
  CM_Address: string;
  CM_District: string;
  CM_State: string;
  CM_Country: string;
  CM_Postal_Code: number;
  CM_Contact_Person: string;
  CM_Phone_Number: string;
  CM_Alternate_Phone: string;
  CM_Email: string;
  CM_Is_Status: 'Active' | 'Inactive';
  CM_Created_By: string;
  CM_Created_At: Date;
  CM_Uploaded_By: string;
  CM_Uploaded_At: Date;
}

// Helper: Build WHERE clauses dynamically
function buildWhereClauses(filters: Record<string, string | null>): string {
  return Object.entries(filters)
    .filter(([_, value]) => value)
    .map(([key, value]) => `AND ${key} = '${value}'`)
    .join(' ');
}

function formatStockLocation(row: any): StockLocation {
  const quantity = Number(row.quantity) || 0;
  return {
    godown_id: row.godown_id,
    godown_name: row.godown_name,
    godown_location: row.godown_location,
    product_id: row.product_id,
    item_id: row.item_id,
    item_code: row.item_code,
    item_description: row.item_description,
    item_name: row.item_name,
    unit_name: row.unit_name,
    quantity,
    stock_status: quantity <= 0 ? 'Empty' : quantity < 10 ? 'Low Stock' : 'Available',
    transaction_count: 0,
    created_at: row.created_at || '',
    created_by: row.created_by || '',
  };
}

// Helper: Format godown summary response
function formatGodownSummary(row: any): GodownSummary {
  const totalItems = Number(row.total_items) || 0;
  const totalQuantity = Number(row.total_quantity) || 0;
  const lowStockItems = Number(row.low_stock_items) || 0;
  const emptyItems = Number(row.empty_items) || 0;
  const availableItems = totalItems - lowStockItems - emptyItems;

  const utilizationRate = totalQuantity > 0 && totalItems > 0
    ? Number(((totalQuantity / (totalItems * 100)) * 100).toFixed(2)) // example calculation
    : 0;

  return {
    godown_id: row.godown_id,
    godown_name: row.godown_name,
    location: row.location,
    total_items: totalItems,
    total_quantity: totalQuantity,
    available_items: availableItems,
    low_stock_items: lowStockItems,
    empty_items: emptyItems,
    utilization_rate: utilizationRate,
    total_transfers: Number(row.total_transfers) || 0,
  };
}

export async function GET(req: NextRequest) {
  const db = await getDb();
  const { searchParams } = new URL(req.url);

  const action = searchParams.get('action');
  const companyId = searchParams.get('company_id');
  const godownId = searchParams.get('godown_id');
  const productId = searchParams.get('product_id');
  const userId = searchParams.get('user_id') || 'system'; // Get user ID for tracking changes

  try {
    if (action === 'stock_locations') {
      const whereClause = buildWhereClauses({
        'gs.CM_Godown_ID': godownId,
        'gs.CM_Product_ID': productId,
      });

      // Focus on actual stock quantities from godown_stock
      const [rows] = await db.query(`
        SELECT 
        g.CM_Godown_ID AS godown_id,
        g.CM_Godown_Name AS godown_name,
        g.CM_Location AS godown_location,
        gs.CM_Product_ID AS product_id,
        gs.CM_Item_ID AS item_id,
        im.CM_Item_Code AS item_code,
        im.CM_Item_Description AS item_description,
        COALESCE(p.CM_Product_Name, im.CM_Item_Name) AS item_name,
        gs.CM_Quantity AS quantity,
        COALESCE(um.CM_Unit_Name, 'N/A') AS unit_name, -- ✅ show unit name
        gs.CM_Created_At AS created_at,
        gs.CM_Created_By AS created_by,
        (
          SELECT COUNT(DISTINCT t.CM_Transfer_ID)
          FROM ccms_godown_transfer t
          WHERE t.CM_Product_ID = gs.CM_Product_ID 
            AND t.CM_Item_ID = gs.CM_Item_ID
            AND (t.CM_Source_Godown_ID = g.CM_Godown_ID OR t.CM_Destination_Godown_ID = g.CM_Godown_ID)
        ) AS transaction_count
      FROM ccms_godown_stock gs
      JOIN ccms_godown g 
        ON gs.CM_Godown_ID = g.CM_Godown_ID
      JOIN ccms_item_master im 
        ON gs.CM_Item_ID = im.CM_Item_ID
      LEFT JOIN ccms_purchase p
        ON gs.CM_Product_ID = p.CM_Product_ID 
        AND gs.CM_Item_ID = p.CM_Item_ID
        AND gs.CM_Godown_ID = p.CM_Godown_ID
      LEFT JOIN ccms_unit_type um -- ✅ join to get readable unit name
        ON COALESCE(p.CM_Unit_Type, im.CM_Unit_Type) = um.CM_Unit_ID
      WHERE gs.CM_Quantity > 0
      ${whereClause}
      GROUP BY 
        g.CM_Godown_ID, g.CM_Godown_Name, g.CM_Location, 
        gs.CM_Product_ID, gs.CM_Item_ID, im.CM_Item_Code, 
        im.CM_Item_Description, item_name, gs.CM_Quantity, 
        um.CM_Unit_Name, gs.CM_Created_At, gs.CM_Created_By
      `);

      const data = (rows as RowDataPacket[]).map(formatStockLocation);
      const res = NextResponse.json({ success: true, data });
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    if (action === 'godown_summary') {
      const whereClause = buildWhereClauses({
        'g.CM_Company_ID': companyId,
        'g.CM_Godown_ID': godownId,
      });

      // Updated query to use godown_stock and existing transfer table
      const [rows] = await db.query(`
        SELECT 
          g.CM_Godown_ID AS godown_id,
          g.CM_Godown_Name AS godown_name,
          g.CM_Location AS location,
          COUNT(DISTINCT gs.CM_Item_ID) AS total_items,
          SUM(gs.CM_Quantity) AS total_quantity,
          SUM(CASE WHEN gs.CM_Quantity > 0 AND gs.CM_Quantity < 10 THEN 1 ELSE 0 END) AS low_stock_items,
          SUM(CASE WHEN gs.CM_Quantity <= 0 THEN 1 ELSE 0 END) AS empty_items,
          (
            SELECT COUNT(DISTINCT t.CM_Transfer_ID)
            FROM ccms_godown_transfer t
            WHERE t.CM_Source_Godown_ID = g.CM_Godown_ID OR t.CM_Destination_Godown_ID = g.CM_Godown_ID
          ) AS total_transfers
        FROM ccms_godown g
        LEFT JOIN ccms_godown_stock gs 
          ON g.CM_Godown_ID = gs.CM_Godown_ID
        WHERE 1=1
        GROUP BY g.CM_Godown_ID, g.CM_Godown_Name, g.CM_Location
      `);

      const data = (rows as RowDataPacket[]).map(formatGodownSummary);
      const res = NextResponse.json({ success: true, data });
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    // GET godown by ID for editing
    if (action === 'get_godown') {
      const godownId = searchParams.get('godown_id');

      if (!godownId) {
        const res = NextResponse.json(
          { success: false, message: 'Godown ID is required' },
          { status: 400 }
        );
        res.headers.set('Cache-Control', 'no-store');
        return res;
      }

      const [godownRows] = await db.query<GodownRow[]>(
        `SELECT * FROM ccms_godown WHERE CM_Godown_ID = ?`,
        [godownId]
      );

      if (!Array.isArray(godownRows) || godownRows.length === 0) {
        const res = NextResponse.json(
          { success: false, message: 'Godown not found' },
          { status: 404 }
        );
        res.headers.set('Cache-Control', 'no-store');
        return res;
      }

      const godown = godownRows[0];
      const res = NextResponse.json({
        success: true,
        data: godown
      });
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    const res = NextResponse.json({ success: false, message: 'Invalid action' });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (err: any) {
    console.error('Stock API Error:', err);
    const res = NextResponse.json({ success: false, message: err.message }, { status: 500 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}

export async function PUT(req: NextRequest) {
  const db = await getDb();
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  try {
    // UPDATE godown by ID
    if (action === 'update_godown') {
      const body = await req.json();
      const godownId = searchParams.get('godown_id');

      if (!godownId) {
        const res = NextResponse.json(
          { success: false, message: 'Godown ID is required' },
          { status: 400 }
        );
        res.headers.set('Cache-Control', 'no-store');
        return res;
      }

      const {
        CM_Godown_Code,
        CM_Godown_Name,
        CM_Location,
        CM_Address,
        CM_District,
        CM_State,
        CM_Country,
        CM_Postal_Code,
        CM_Contact_Person,
        CM_Phone_Number,
        CM_Alternate_Phone,
        CM_Email,
        CM_Is_Status
      } = body;

      // Update godown with current timestamp
      const [result] = await db.query(
        `UPDATE ccms_godown SET 
          CM_Godown_Code = ?,
          CM_Godown_Name = ?,
          CM_Location = ?,
          CM_Address = ?,
          CM_District = ?,
          CM_State = ?,
          CM_Country = ?,
          CM_Postal_Code = ?,
          CM_Contact_Person = ?,
          CM_Phone_Number = ?,
          CM_Alternate_Phone = ?,
          CM_Email = ?,
          CM_Is_Status = ?,
          CM_Uploaded_At = NOW()
        WHERE CM_Godown_ID = ?`,
        [
          CM_Godown_Code,
          CM_Godown_Name,
          CM_Location,
          CM_Address,
          CM_District,
          CM_State,
          CM_Country,
          CM_Postal_Code,
          CM_Contact_Person,
          CM_Phone_Number,
          CM_Alternate_Phone,
          CM_Email,
          CM_Is_Status,
          godownId
        ]
      );

      // Check if any rows were affected
      const affectedRows = (result as any).affectedRows;
      if (affectedRows === 0) {
        const res = NextResponse.json(
          { success: false, message: 'Godown not found' },
          { status: 404 }
        );
        res.headers.set('Cache-Control', 'no-store');
        return res;
      }

      // Fetch the updated godown
      const [updatedRows] = await db.query<GodownRow[]>(
        `SELECT * FROM ccms_godown WHERE CM_Godown_ID = ?`,
        [godownId]
      );

      const updatedGodown = Array.isArray(updatedRows) ? updatedRows[0] : null;

      const res = NextResponse.json({
        success: true,
        message: 'Godown updated successfully',
        data: updatedGodown
      });
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    const res = NextResponse.json({ success: false, message: 'Invalid action' });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (err: any) {
    console.error('Stock API PUT Error:', err);
    const res = NextResponse.json({ success: false, message: err.message }, { status: 500 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}

// Handle POST requests if needed
export async function POST(req: NextRequest) {
  const db = await getDb();
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');
  const method = searchParams.get('_method');

  if (method === 'PUT') return PUT(req);

  try {
    // You can add other POST actions here if needed
    const res = NextResponse.json({ success: false, message: 'Invalid action' });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (err: any) {
    console.error('Stock API POST Error:', err);
    const res = NextResponse.json({ success: false, message: err.message }, { status: 500 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}