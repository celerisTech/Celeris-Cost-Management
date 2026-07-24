import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/app/utils/db';

export async function GET(request: NextRequest) {
  let connection;
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const roleId = searchParams.get('roleId');
    const mode = searchParams.get('mode'); // 'user', 'role', or 'auto'

    if (!userId || !roleId) {
      const res = NextResponse.json(
        { success: false, message: 'User ID and Role ID are required' },
        { status: 400 }
      );
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    connection = await getDb();

    let privileges: any[] = [];
    let fetchedMode = 'role';

    if (mode === 'user') {
      // Fetch user-specific privileges
      const [rows] = await connection.execute(
        `SELECT 
          pm.CM_ID,
          pm.CM_Role_ID,
          pm.CM_User_ID,
          pm.CM_Nav_Link_ID,
          nl.CM_Name,
          nl.CM_Path,
          nl.CM_Section,
          nl.CM_Icon
        FROM ccms_privilege_master pm
        INNER JOIN ccms_nav_link nl ON pm.CM_Nav_Link_ID = nl.CM_Nav_Link_ID
        WHERE pm.CM_User_ID = ?
        ORDER BY nl.CM_Section, nl.CM_Name`,
        [userId]
      );
      privileges = rows as any[];
      fetchedMode = 'user';
    } else if (mode === 'role') {
      // Fetch role-level privileges
      const [rows] = await connection.execute(
        `SELECT 
          pm.CM_ID,
          pm.CM_Role_ID,
          pm.CM_User_ID,
          pm.CM_Nav_Link_ID,
          nl.CM_Name,
          nl.CM_Path,
          nl.CM_Section,
          nl.CM_Icon
        FROM ccms_privilege_master pm
        INNER JOIN ccms_nav_link nl ON pm.CM_Nav_Link_ID = nl.CM_Nav_Link_ID
        WHERE pm.CM_Role_ID = ? AND pm.CM_User_ID IS NULL
        ORDER BY nl.CM_Section, nl.CM_Name`,
        [roleId]
      );
      privileges = rows as any[];
      fetchedMode = 'role';
    } else {
      // Auto / Default: If user has user-specific privileges, use them; otherwise fallback to role privileges
      const [userSpecificRows] = await connection.execute(
        `SELECT 
          pm.CM_ID,
          pm.CM_Role_ID,
          pm.CM_User_ID,
          pm.CM_Nav_Link_ID,
          nl.CM_Name,
          nl.CM_Path,
          nl.CM_Section,
          nl.CM_Icon
        FROM ccms_privilege_master pm
        INNER JOIN ccms_nav_link nl ON pm.CM_Nav_Link_ID = nl.CM_Nav_Link_ID
        WHERE pm.CM_User_ID = ?
        ORDER BY nl.CM_Section, nl.CM_Name`,
        [userId]
      );

      const userPrivs = userSpecificRows as any[];
      if (userPrivs.length > 0) {
        privileges = userPrivs;
        fetchedMode = 'user';
      } else {
        const [roleRows] = await connection.execute(
          `SELECT 
            pm.CM_ID,
            pm.CM_Role_ID,
            pm.CM_User_ID,
            pm.CM_Nav_Link_ID,
            nl.CM_Name,
            nl.CM_Path,
            nl.CM_Section,
            nl.CM_Icon
          FROM ccms_privilege_master pm
          INNER JOIN ccms_nav_link nl ON pm.CM_Nav_Link_ID = nl.CM_Nav_Link_ID
          WHERE pm.CM_Role_ID = ? AND pm.CM_User_ID IS NULL
          ORDER BY nl.CM_Section, nl.CM_Name`,
          [roleId]
        );
        privileges = roleRows as any[];
        fetchedMode = 'role';
      }
    }

    const res = NextResponse.json({
      success: true,
      data: privileges,
      count: privileges.length,
      mode: fetchedMode
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