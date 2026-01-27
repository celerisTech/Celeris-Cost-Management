import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/app/utils/db';

export async function GET(request: NextRequest) {
  try {
    // Extract 'id' from the URL pathname
    const url = new URL(request.url);
    const segments = url.pathname.split('/');
    const id = segments[segments.length - 1]; // last segment is the user id

    const connection = await getDb();
    const [rows]: any = await connection.query(
      `SELECT CM_Full_Name, CM_Email 
       FROM ccms_users 
       WHERE CM_User_ID = ? AND CM_Is_Active = 'Active'`,
      [id]
    );

    const res = NextResponse.json(rows[0] || null);
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (err: any) {
    console.error('Error fetching user:', err);
    const res = NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}
