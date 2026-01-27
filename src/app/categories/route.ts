import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/app/utils/db';
import { RowDataPacket } from 'mysql2';

interface CategoryRow extends RowDataPacket {
  CM_category_id: number;
  CM_name: string;
}

export async function GET() {
  try {
    const db = await getDb();
    
    const [rows] = await db.execute(`
      SELECT CM_category_id, CM_name 
      FROM ccms_category 
      ORDER BY CM_name
    `);
    
    const categories = rows as CategoryRow[];
    
    return NextResponse.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Categories fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
