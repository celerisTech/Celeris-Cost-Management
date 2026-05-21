import getDb from '../../utils/db';

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const laborType = url.searchParams.get('type') || null;
    
    const db = await getDb();
    
    // In your labor-attendance API route
let query = `
  SELECT 
    *
  FROM ccms_labor
`;

    const params = [];
    
    // Filter by labor type if specified
    if (laborType) {
      query += ` WHERE CM_Labor_Type = ?`;
      params.push(laborType);
    }
    
    query += ` ORDER BY CM_First_Name`;
    
    const [rows] = await db.query(query, params);
    
    const res = new Response(JSON.stringify(rows), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error) {
    console.error('Error fetching labors:', error);
    const res = new Response(
      JSON.stringify({ success: false, error: 'Failed to fetch labors' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}
