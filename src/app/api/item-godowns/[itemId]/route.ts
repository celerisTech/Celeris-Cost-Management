import { NextResponse } from "next/server";
import getDb from "@/app/utils/db";
import { RowDataPacket } from "mysql2";

export async function GET(
  req: Request,
  context: { params: Promise<{ itemId: string }> } // params is a Promise
) {
  try {
    const db = await getDb();

    // 👇 await the params first
    const { itemId } = await context.params;

    const [rows] = await db.query<RowDataPacket[]>(
      `
      SELECT 
          g.CM_Godown_ID,
          g.CM_Godown_Name,
          p.CM_Item_ID,
          im.CM_Item_Name,
          SUM(p.CM_Quantity) AS Stock_In_Godown
      FROM ccms_purchase p
      JOIN ccms_item_master im ON p.CM_Item_ID = im.CM_Item_ID
      JOIN ccms_godown g ON p.CM_Godown_ID = g.CM_Godown_ID
      WHERE p.CM_Item_ID = ?
      GROUP BY g.CM_Godown_ID, g.CM_Godown_Name, p.CM_Item_ID, im.CM_Item_Name
      `,
      [itemId]
    );

    const res = NextResponse.json(rows);
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error: any) {
    console.error("Error fetching godown stock:", error);
    const res = NextResponse.json(
      { error: "Failed to fetch godown stock" },
      { status: 500 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}
