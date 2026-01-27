import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/app/utils/db';

export async function GET(request: NextRequest) {
  let connection;
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const roleId = searchParams.get('roleId');

    if (!userId || !roleId) {
      const res = NextResponse.json(
        { success: false, message: 'User ID and Role ID are required' },
        { status: 400 }
      );
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    connection = await getDb();

    const [rows] = await connection.execute(
      `SELECT 
        pm.CM_ID,
        pm.CM_Role_ID,
        pm.CM_Nav_Link_ID,
        nl.CM_Name,
        nl.CM_Path,
        nl.CM_Section,
        nl.CM_Icon
      FROM ccms_privilege_master pm
      INNER JOIN ccms_nav_link nl ON pm.CM_Nav_Link_ID = nl.CM_Nav_Link_ID
      WHERE pm.CM_Role_ID = ?
      ORDER BY nl.CM_Section, nl.CM_Name`,
      [roleId]
    );

    const privileges = rows as any[];

    const res = NextResponse.json({
      success: true,
      data: privileges,
      count: privileges.length
    });
    res.headers.set('Cache-Control', 'no-store');
    return res;

  } catch (error) {
    console.error('Error fetching user privileges:', error);
    const res = NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}