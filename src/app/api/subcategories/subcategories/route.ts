import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/app/utils/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');

    if (!categoryId) {
      return NextResponse.json(
        { success: false, message: 'Category ID is required' },
        { status: 400 }
      );
    }

    const db = await getDb();

    const [subcategories] = await db.execute(`
      SELECT CM_Subcategory_ID, CM_Subcategory_Name 
      FROM ccms_subcategory 
      WHERE CM_Category_ID = ?
      ORDER BY CM_Subcategory_Name
    `, [categoryId]);

    const res = NextResponse.json({
      success: true,
      data: subcategories
    });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error) {
    console.error('Subcategories fetch error:', error);
    const res = NextResponse.json(
      { success: false, message: 'Failed to fetch subcategories' },
      { status: 500 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}
