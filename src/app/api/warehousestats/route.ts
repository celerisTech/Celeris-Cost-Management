import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { RowDataPacket } from 'mysql2';
import getDb from '../../utils/db'; // adjust path if needed

export async function GET(req: NextRequest) {
  try {
    const connection = await getDb();

    // Count total purchases (rows in purchases table)
    const [purchasesResult] = await connection.query<RowDataPacket[]>(
      `SELECT COUNT(*) as totalPurchases FROM ccms_item_master`
    );

    // Count distinct categories from purchases
    const [categoryResult] = await connection.query<RowDataPacket[]>(
      `SELECT COUNT(DISTINCT CM_Category_ID) as totalCategories FROM ccms_item_master`
    );

    // Sum total purchase value
    const [valueResult] = await connection.query<RowDataPacket[]>(
      `SELECT SUM(CM_Total_Price) as totalValue FROM ccms_purchase`
    );

    const res = NextResponse.json({
      totalProducts: purchasesResult[0]?.totalPurchases || 0, // now counting purchases
      totalCategories: categoryResult[0]?.totalCategories || 0,
      totalValue: valueResult[0]?.totalValue || 0
    });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error) {
    console.error('Error fetching warehouse stats:', error);
    const res = NextResponse.json({ error: 'Failed to fetch warehouse statistics' }, { status: 500 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}
