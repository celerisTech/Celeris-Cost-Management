// src/app/api/godowns/route.ts
import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/app/utils/db'; // ✅ use absolute import if using Next.js alias '@'

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();

    // ✅ Query all godowns
    const [rows] = await db.query('SELECT * FROM ccms_godown');

    // ✅ Send JSON with no-store header
    return NextResponse.json(rows, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    console.error('Error fetching godowns:', error);

    // ✅ Consistent error response with cache disabled
    return NextResponse.json(
      { success: false, message: 'Failed to fetch godowns', error: error.message },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}
