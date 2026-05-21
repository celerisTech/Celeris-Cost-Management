import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/app/utils/db';

export async function GET(request: NextRequest) {
  let connection;
  try {
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('search');

    connection = await getDb();

    // Base SQL query
    let query = `
      SELECT 
        u.CM_User_ID,
        u.CM_Company_ID,
        u.CM_Role_ID,
        r.CM_Role_Description,
        u.CM_First_Name,
        u.CM_Last_Name,
        u.CM_Full_Name,
        u.CM_Phone_Number,
        u.CM_Email,
        u.CM_Is_Active
      FROM ccms_users AS u
      LEFT JOIN ccms_roles_master AS r 
        ON u.CM_Role_ID = r.CM_Role_ID
        AND u.CM_Company_ID = r.CM_Company_ID
      WHERE u.CM_Is_Active = 'Active'
      AND r.CM_Is_Status = 'Active'
    `;
    
    let params = [];

    // Add search condition if search term is provided
    if (searchTerm && searchTerm.trim() !== '') {
      query += `
        AND (u.CM_Full_Name LIKE ? 
        OR r.CM_Role_Description LIKE ? 
        OR u.CM_Phone_Number LIKE ?
        OR u.CM_Email LIKE ?)
      `;
      params = [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`];
    }

    // Add ordering and limit
    query += `
      ORDER BY u.CM_Full_Name
      LIMIT ${searchTerm ? 20 : 100}
    `;

    const [rows] = await connection.execute(query, params);
    const users = rows as any[];

    const res = NextResponse.json({
      success: true,
      data: users,
      count: users.length
    });
    res.headers.set('Cache-Control', 'no-store');
    return res;

  } catch (error) {
    console.error('Error searching users:', error);
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
