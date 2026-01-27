// src/app/api/stock-management/items/route.ts
import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/app/utils/db';

export async function GET(req: NextRequest) {
  try {
    const db = await getDb();
    
    // Fetch active items from item master
    const [items] = await db.query(
      `SELECT CM_Item_ID, CM_Item_Code, CM_Item_Name 
       FROM ccms_item_master 
       WHERE CM_Is_Status = 'Active'
       ORDER BY CM_Item_Name`
    );
    
    const res = NextResponse.json({
      success: true,
      items: items || []
    });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error) {
    console.error('API error:', error);
    const res = NextResponse.json({
      success: false,
      message: 'Failed to fetch items',
      error: (error as Error).message
    }, { status: 500 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}
