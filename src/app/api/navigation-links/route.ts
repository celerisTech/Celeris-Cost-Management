import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/app/utils/db';
import { Pool } from 'mysql2/promise';

// GET endpoint to fetch navigation links
export async function GET(request: NextRequest) {
  let connection: Pool;
  try {
    connection = await getDb();

    const [rows] = await connection.execute(`
      SELECT 
        CM_Nav_Link_ID,
        CM_Name,
        CM_Path,
        CM_Section,
        CM_Icon,
        CM_Created_By,
        CM_Created_At
      FROM ccms_nav_link 
      WHERE CM_Nav_Link_ID IS NOT NULL
      ORDER BY CM_Section, CM_Name
    `);

    const navigationLinks = rows as any[];
    
    // Extract unique sections
    const sections = [...new Set(navigationLinks.map(link => link.CM_Section).filter(Boolean))];

    const res = NextResponse.json({
      success: true,
      data: navigationLinks,
      sections: sections
    });
    res.headers.set('Cache-Control', 'no-store');
    return res;

  } catch (error) {
    console.error('Error fetching navigation links:', error);
    const res = NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch navigation links',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } 
}