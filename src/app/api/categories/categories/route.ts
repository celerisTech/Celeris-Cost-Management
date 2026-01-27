import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/app/utils/db';

export async function GET() {
  try {
    const db = await getDb();

    const [categories] = await db.execute(`
  SELECT CM_Category_ID, CM_Category_Name 
  FROM ccms_category 
  WHERE CM_Category_ID IS NOT NULL
  ORDER BY CM_Category_Name
`);


    const res = NextResponse.json({
      success: true,
      data: categories
    });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error) {
    console.error('Categories fetch error:', error);
    const res = NextResponse.json(
      { success: false, message: 'Failed to fetch categories' },
      { status: 500 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}
