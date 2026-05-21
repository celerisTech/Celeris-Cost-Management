// src/app/api/stock-management/godowns/route.ts
import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/app/utils/db';

export async function GET(req: NextRequest) {
  try {
    const db = await getDb();

    // Fetch active godowns
    const [godowns] = await db.query(
      `SELECT CM_Godown_ID, CM_Godown_Name, CM_Location 
       FROM ccms_godown 
       WHERE CM_Is_Status = 'Active'
       ORDER BY CM_Godown_Name`
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
      message: 'Failed to fetch godowns',
      error: (error as Error).message
    }, { status: 500 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}
