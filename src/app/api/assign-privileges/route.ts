import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/app/utils/db';

// POST endpoint to assign privileges
export async function POST(request: NextRequest) {
  let connection: any;
  try {
    const body = await request.json();
    const { userId, roleId, companyId, navLinkIds, createdBy, assignmentMode = 'role' } = body;

    // Validate required fields
    if (!userId || !roleId || !companyId || !navLinkIds || !Array.isArray(navLinkIds)) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Only reject empty privileges list for role assignment.
    // For user assignment, empty means deleting user-specific overrides (reverting to role defaults).
    if (assignmentMode === 'role' && navLinkIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No privileges selected' },
        { status: 400 }
      );
    }

    const pool = getDb();
    connection = await (await pool).getConnection();

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

      // Check if navigation links exist (if any are being assigned)
      if (navLinkIds.length > 0) {
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
      }

      const currentTime = new Date();

      if (assignmentMode === 'user') {
        // Delete existing user-specific privileges
        await connection.execute(
          'DELETE FROM ccms_privilege_master WHERE CM_User_ID = ?',
          [userId]
        );

        // Insert new user-specific privileges
        for (const navLinkId of navLinkIds) {
          await connection.execute(
            `INSERT INTO ccms_privilege_master 
             (CM_Role_ID, CM_User_ID, CM_Nav_Link_ID, CM_Created_By, CM_Created_At, CM_Uploaded_By, CM_Uploaded_At) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [roleId, userId, navLinkId, createdBy, currentTime, createdBy, currentTime]
          );
        }
      } else {
        // Role mode: Delete existing privileges for this role (without user specificity)
        await connection.execute(
          'DELETE FROM ccms_privilege_master WHERE CM_Role_ID = ? AND CM_User_ID IS NULL',
          [roleId]
        );

        // Also clear user-specific privileges for this user so they revert to using role defaults
        if (userId) {
          await connection.execute(
            'DELETE FROM ccms_privilege_master WHERE CM_User_ID = ?',
            [userId]
          );
        }

        // Insert new role-level privileges
        for (const navLinkId of navLinkIds) {
          await connection.execute(
            `INSERT INTO ccms_privilege_master 
             (CM_Role_ID, CM_User_ID, CM_Nav_Link_ID, CM_Created_By, CM_Created_At, CM_Uploaded_By, CM_Uploaded_At) 
             VALUES (?, NULL, ?, ?, ?, ?, ?)`,
            [roleId, navLinkId, createdBy, currentTime, createdBy, currentTime]
          );
        }
      }

      // Commit transaction
      await connection.commit();

      const res = NextResponse.json({
        success: true,
        message: assignmentMode === 'user'
          ? `Successfully assigned ${navLinkIds.length} user-specific privileges`
          : `Successfully assigned ${navLinkIds.length} privileges to role`,
        data: {
          userId,
          roleId,
          assignmentMode,
          totalPrivileges: navLinkIds.length,
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
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
