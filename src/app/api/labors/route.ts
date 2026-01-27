// app/api/labors/route.ts
import getDb from '../../utils/db';

export async function GET() {
  try {
    const db = await getDb();
    const [rows] = await db.query(
      'SELECT * FROM ccms_labor'
    );

    const res = new Response(JSON.stringify(rows), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error) {
    console.error('Error fetching labor types:', error);
    const res = new Response(
      JSON.stringify({ error: 'Failed to fetch labor types' }),
      { status: 500 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}
