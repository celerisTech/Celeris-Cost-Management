import getDb from '@/app/utils/db';
import { RowDataPacket } from 'mysql2/promise';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');
  const db = await getDb();
  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT CM_Latitude, CM_Longitude, CM_Radius_Meters FROM ccms_projects WHERE CM_Project_ID = ?",
    [projectId]
  );
  return new Response(JSON.stringify(rows[0] || {}), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
