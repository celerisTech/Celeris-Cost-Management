import { NextResponse } from 'next/server';
import getDb from '@/app/utils/db';

export async function GET() {
  try {
    const db = await getDb();
    
    // When using DISTINCT with ORDER BY, the ordered column must also be in the SELECT list
    const query = `
      SELECT DISTINCT CM_Bill_Number, CM_Delivery_Date
      FROM ccms_purchase_summary 
      ORDER BY CM_Delivery_Date DESC
    `;
    
    const [rows] = await db.query(query);
    
    // We only need to return the bill numbers to the frontend, not the created dates
    const billNumbers = (rows as any[]).map(row => ({ 
      CM_Bill_Number: row.CM_Bill_Number 
    }));
    
    const res = NextResponse.json(billNumbers, { status: 200 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error) {
    console.error('Error fetching bill numbers:', error);
    const res = NextResponse.json(
      { error: 'Failed to fetch bill numbers' },
      { status: 500 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}
