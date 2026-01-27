import { NextRequest, NextResponse } from "next/server";
import getDb from "@/app/utils/db";

export async function POST(req: NextRequest) {
  const { request_id, action, user_id, user_name } = await req.json();

  const db = await getDb();
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    // 1. Get request
    const [requestRows] = await connection.query(
      "SELECT * FROM ccms_product_allocation_requests WHERE CM_Request_ID = ?",
      [request_id]
    ) as any[];
    if (!requestRows.length) throw new Error("Request not found");

    const request = requestRows[0];

    // 2. Handle based on action
    if (action === "REJECT") {
      await connection.execute(
        `UPDATE ccms_product_allocation_requests
         SET CM_Status = 'REJECTED', CM_Notes = ?
         WHERE CM_Request_ID = ?`,
        [`Rejected by ${user_name}`, request_id]
      );

      await connection.commit();
      const res = NextResponse.json({ success: true, message: "Request rejected" });
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    if (action === "APPROVE") {
      const [items] = await connection.query(
        "SELECT * FROM ccms_product_allocation_request_items WHERE CM_Request_ID = ?",
        [request_id]
      ) as any[];

      for (const item of items) {
        const { allocated, shortage } = await allocateFromBatches(
          connection,
          request.CM_Project_ID,
          item.CM_Item_ID,
          item.CM_Quantity,
          user_id,
          user_name
        );

        // update item with allocation result
        await connection.execute(
          `UPDATE ccms_product_allocation_request_items 
           SET CM_Quantity = ?, CM_Notes = ?
           WHERE CM_Item_ID = ? AND CM_Request_ID = ?`,
          [allocated, shortage > 0 ? `Shortage: ${shortage}` : null, item.CM_Item_ID, request_id]
        );
      }

      // mark request as approved
      await connection.execute(
        "UPDATE ccms_product_allocation_requests SET CM_Status = 'APPROVED' WHERE CM_Request_ID = ?",
        [request_id]
      );

      await connection.commit();
      const res = NextResponse.json({ success: true, message: "Request approved & stock allocated" });
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    throw new Error("Invalid action (must be APPROVE or REJECT)");

  } catch (error: any) {
    await connection.rollback();
    const res = NextResponse.json({ success: false, error: error.message }, { status: 500 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } finally {
    connection.release();
  }
}

// 🔹 FIFO allocation logic
async function allocateFromBatches(
  connection: any,
  projectId: string,
  itemId: string,
  requiredQty: number,
  userId: string,
  userName: string
) {
  const [batches] = await connection.query(
    `SELECT * FROM ccms_godown_stock_batches
     WHERE CM_Item_ID = ? AND CM_Quantity_Remaining > 0
     ORDER BY CM_Purchase_Date ASC`,
    [itemId]
  );

  let remainingQty = requiredQty;
  let allocatedTotal = 0;

  for (const batch of batches) {
    if (remainingQty <= 0) break;

    const allocateQty = Math.min(batch.CM_Quantity_Remaining, remainingQty);
    remainingQty -= allocateQty;
    allocatedTotal += allocateQty;

    // 1. Update batch
    await connection.execute(
      `UPDATE ccms_godown_stock_batches
       SET CM_Quantity_Remaining = CM_Quantity_Remaining - ?
       WHERE CM_Batch_ID = ?`,
      [allocateQty, batch.CM_Batch_ID]
    );

    // 2. Update godown stock
    await connection.execute(
      `UPDATE ccms_godown_stock
       SET CM_Quantity = CM_Quantity - ?
       WHERE CM_Godown_ID = ? AND CM_Product_ID = ? AND CM_Item_ID = ?`,
      [allocateQty, batch.CM_Godown_ID, batch.CM_Product_ID, batch.CM_Item_ID]
    );

    // 3. Insert into project_products
    const totalPrice = allocateQty * batch.CM_Unit_Price;
    await connection.execute(
      `INSERT INTO ccms_project_products (
        CM_Product_ID, CM_Project_ID, CM_Batch_ID, CM_Item_ID,
        CM_Quantity, CM_Unit_Price, CM_Total_Price,
        CM_Company_ID, CM_Alloceted_To, CM_Allocated_At,
        CM_Created_By, CM_Created_At
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Godown', NOW(), ?, NOW())`,
      [
        batch.CM_Product_ID,
        projectId,
        batch.CM_Batch_ID,
        batch.CM_Item_ID,
        allocateQty,
        batch.CM_Unit_Price,
        totalPrice,
        batch.CM_Company_ID,
        userId,
      ]
    );
  }

  return { allocated: allocatedTotal, shortage: remainingQty };
}
