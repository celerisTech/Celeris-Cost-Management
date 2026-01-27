// src/app/api/stock-management/item-godowns/route.ts
import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/app/utils/db';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const itemId = searchParams.get('itemId');

    if (!itemId) {
      const res = NextResponse.json({
        success: false,
        message: 'Item ID is required'
      }, { status: 400 });
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    const db = await getDb();

    // Fetch godowns where this item has stock
    const [godowns] = await db.query(
      `SELECT DISTINCT g.CM_Godown_ID, g.CM_Godown_Name, g.CM_Location 
       FROM ccms_godown g
       INNER JOIN ccms_purchase p ON g.CM_Godown_ID = p.CM_Godown_ID
       WHERE p.CM_Item_ID = ? 
       AND p.CM_Quantity > 0
       AND g.CM_Is_Status = 'Active'
       AND p.CM_Is_Status = 'Active'
       ORDER BY g.CM_Godown_Name`,
      [itemId]
    );

    const res = NextResponse.json({
      success: true,
      godowns: godowns || []
    });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error) {
    console.error('API error:', error);
    const res = NextResponse.json({
      success: false,
      message: 'Failed to fetch godowns for this item',
      error: (error as Error).message
    }, { status: 500 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}
