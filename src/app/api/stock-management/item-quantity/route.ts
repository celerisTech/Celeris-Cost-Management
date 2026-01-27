// src/app/api/stock-management/item-quantity/route.ts
import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/app/utils/db';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const itemId = searchParams.get('itemId');
    const godownId = searchParams.get('godownId');

    if (!itemId || !godownId) {
      const res = NextResponse.json({
        success: false,
        message: 'Item ID and Godown ID are required'
      }, { status: 400 });
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    const db = await getDb();

    // Calculate total available quantity
    const [result] = await db.query(
      `SELECT SUM(CM_Quantity) as total_quantity 
       FROM ccms_purchase 
       WHERE CM_Item_ID = ? 
       AND CM_Godown_ID = ?
       AND CM_Is_Status = 'Active'`,
      [itemId, godownId]
    );

    const quantity = result[0]?.total_quantity || 0;

    const res = NextResponse.json({
      success: true,
      quantity: parseFloat(quantity)
    });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error) {
    console.error('API error:', error);
    const res = NextResponse.json({
      success: false,
      message: 'Failed to fetch item quantity',
      error: (error as Error).message
    }, { status: 500 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}
