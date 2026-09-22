import { NextResponse } from 'next/server';
import getDb from '@/app/utils/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ success: false, error: 'Setting key is required' }, { status: 400 });
    }

    const db = await getDb();
    const [rows]: any = await db.query(
      'SELECT setting_value FROM ccms_settings WHERE setting_key = ?',
      [key]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: true, value: null });
    }

    return NextResponse.json({ success: true, value: rows[0].setting_value });
  } catch (error) {
    console.error('Error fetching setting:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { key, value } = await request.json();

    if (!key || value === undefined) {
      return NextResponse.json({ success: false, error: 'Setting key and value are required' }, { status: 400 });
    }

    const db = await getDb();
    
    // Insert or update the setting
    await db.query(
      `INSERT INTO ccms_settings (setting_key, setting_value) 
       VALUES (?, ?) 
       ON DUPLICATE KEY UPDATE setting_value = ?`,
      [key, String(value), String(value)]
    );

    return NextResponse.json({ success: true, message: 'Setting updated successfully' });
  } catch (error) {
    console.error('Error updating setting:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
