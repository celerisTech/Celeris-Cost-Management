import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/app/utils/db';

// POST endpoint to assign privileges
export async function POST(request: NextRequest) {
  let connection: any;
  try {
    const body = await request.json();
    const { userId, roleId, companyId, navLinkIds, createdBy } = body;

    // Validate required fields
    if (!userId || !roleId || !companyId || !navLinkIds || !Array.isArray(navLinkIds)) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (navLinkIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No privileges selected' },
        { status: 400 }
      );
    }

    const pool = getDb();
    connection = await (await pool).getConnection(); // ✅ FIX HERE

    // Begin transaction
    await connection.beginTransaction();

    try {
      // First, check if user exists and get role information
      const [userRows] = await connection.execute(
        'SELECT CM_User_ID, CM_Role_ID FROM ccms_users WHERE CM_User_ID = ? AND CM_Company_ID = ?',
        [userId, companyId]
      );

      const users = userRows as any[];
      if (users.length === 0) {
        await connection.rollback();
        return NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 }
        );
      }

      const user = users[0];

      // Verify that the provided roleId matches user's role
      if (user.CM_Role_ID !== roleId) {
        await connection.rollback();
        return NextResponse.json(
          { success: false, message: 'Role ID does not match user role' },
          { status: 400 }
        );
      }

      // Check if navigation links exist
      const placeholders = navLinkIds.map(() => '?').join(',');
      const [navLinkRows] = await connection.execute(
        `SELECT CM_Nav_Link_ID FROM ccms_nav_link WHERE CM_Nav_Link_ID IN (${placeholders})`,
        navLinkIds
      );

      const existingNavLinks = navLinkRows as any[];
      if (existingNavLinks.length !== navLinkIds.length) {
        await connection.rollback();
        return NextResponse.json(
          { success: false, message: 'One or more navigation links not found' },
          { status: 404 }
        );
      }

      // Get existing privileges to show what's being added
      const [existingPrivileges] = await connection.execute(
        'SELECT CM_Nav_Link_ID FROM ccms_privilege_master WHERE CM_Role_ID = ?',
        [roleId]
      );

      const existingPrivilegeIds = (existingPrivileges as any[]).map(
        (priv) => priv.CM_Nav_Link_ID
      );

      // Delete existing privileges for this role (replace all privileges)
      await connection.execute(
        'DELETE FROM ccms_privilege_master WHERE CM_Role_ID = ?',
        [roleId]
      );

      // Insert new privileges
      const currentTime = new Date();
      for (const navLinkId of navLinkIds) {
        await connection.execute(
          `INSERT INTO ccms_privilege_master 
           (CM_Role_ID, CM_Nav_Link_ID, CM_Created_By, CM_Created_At, CM_Uploaded_By, CM_Uploaded_At) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [roleId, navLinkId, createdBy, currentTime, createdBy, currentTime]
        );
      }

      // Commit transaction
      await connection.commit();

      const newPrivileges = navLinkIds.filter((id) => !existingPrivilegeIds.includes(id));

      const res = NextResponse.json({
        success: true,
        message: `Successfully assigned ${navLinkIds.length} privileges to user`,
        data: {
          userId,
          roleId,
          totalPrivileges: navLinkIds.length,
          existingPrivileges: existingPrivilegeIds.length,
          newPrivilegesAdded: newPrivileges.length,
        },
      });
      res.headers.set('Cache-Control', 'no-store');
    return res;
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error assigning privileges:', error);
    const res = NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
      },
      { status: 500 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } 
}
