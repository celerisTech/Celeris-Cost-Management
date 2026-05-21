// src/app/api/stock-management/history/route.ts
import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/app/utils/db';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    
    // Pagination parameters
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const offset = (page - 1) * limit;
    
    // Filter parameters
    const itemId = searchParams.get('itemId');
    const sourceGodownId = searchParams.get('sourceGodownId');
    const destinationGodownId = searchParams.get('destinationGodownId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // Build the base query
    let baseQuery = `
      FROM ccms_godown_transfer t
      LEFT JOIN ccms_item_master im ON t.CM_Item_ID = im.CM_Item_ID
      LEFT JOIN ccms_godown sg ON t.CM_Source_Godown_ID = sg.CM_Godown_ID
      LEFT JOIN ccms_godown dg ON t.CM_Destination_Godown_ID = dg.CM_Godown_ID
      WHERE 1=1
    `;
    
    // Build the conditions
    const conditions = [];
    const queryParams = [];
    
    if (itemId) {
      conditions.push("t.CM_Item_ID = ?");
      queryParams.push(itemId);
    }
    
    if (sourceGodownId) {
      conditions.push("t.CM_Source_Godown_ID = ?");
      queryParams.push(sourceGodownId);
    }
    
    if (destinationGodownId) {
      conditions.push("t.CM_Destination_Godown_ID = ?");
      queryParams.push(destinationGodownId);
    }
    
    if (startDate) {
      conditions.push("t.CM_Transfer_Date >= ?");
      queryParams.push(startDate);
    }
    
    if (endDate) {
      conditions.push("t.CM_Transfer_Date <= ?");
      queryParams.push(endDate);
    }
    
    // Add conditions to the base query
    if (conditions.length > 0) {
      baseQuery += " AND " + conditions.join(" AND ");
    }
    
    const db = await getDb();
    
    // Get total count for pagination
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total ${baseQuery}`,
      queryParams
    );
    const totalCount = countResult[0].total;
    
    // Get the transfers with pagination
    const fullQuery = `
      SELECT t.CM_Transfer_ID, 
        t.CM_Item_ID,
        t.CM_Source_Godown_ID,
        t.CM_Destination_Godown_ID,
        t.CM_Quantity,
        t.CM_Transfer_Date,
        t.CM_Notes,
        t.CM_Created_By,
        t.CM_Created_At,
        im.CM_Item_Name, 
        im.CM_Item_Code,
        sg.CM_Godown_Name as source_godown_name, 
        dg.CM_Godown_Name as destination_godown_name
      ${baseQuery}
      ORDER BY t.CM_Transfer_Date DESC
      LIMIT ? OFFSET ?
    `;
    
    // Add pagination parameters
    const finalParams = [...queryParams, limit, offset];
    
    const [transfers] = await db.query(fullQuery, finalParams);
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    
    const res = NextResponse.json({
      success: true,
      transfers,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error) {
    console.error('API error:', error);
    const res = NextResponse.json({ 
      success: false, 
      message: 'Failed to fetch transfer history',
      error: (error as Error).message
    }, { status: 500 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}
