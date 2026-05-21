// src/app/api/products/allocated/route.ts
import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/app/utils/db';
import { RowDataPacket, OkPacket } from 'mysql2';

function errMsg(e: any) { return e?.message || e?.sqlMessage || 'Internal error'; }

// Very simple role gate
function ensureOwner(req: NextRequest) {
  const role = req.headers.get('x-user-role') || '';
  if (role.toLowerCase() !== 'owner') {
    const error: any = new Error('Owner permission required');
    error.status = 403;
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const status = (searchParams.get('status') || 'APPROVED').toUpperCase();

    if (!projectId) {
      return NextResponse.json({ success: false, message: 'Project ID is required' }, { status: 400 });
    }

    const db = await getDb();

    if (status === 'PENDING' || status === 'REJECTED') {
      // show requests (wishlist) with computed availability
      const [reqs] = await db.execute(
        `SELECT r.CM_Request_ID, r.CM_Project_ID, r.CM_Raised_By, r.CM_Status, r.CM_Notes, r.CM_Is_Additional, r.CM_Created_At
         FROM ccms_allocation_request r
         WHERE r.CM_Project_ID = ? AND r.CM_Status = ?
         ORDER BY r.CM_Created_At DESC`,
        [projectId, status]
      ) as RowDataPacket[];

      const requests: any[] = [];
      for (const r of (reqs as any[])) {
        const [lines] = await db.execute(
          `SELECT 
              i.*, 
              im.CM_Item_Name, 
              im.CM_Stock_Level, 
              im.CM_Unit_Type AS Item_Unit_ID,
              ut.CM_Unit_Name AS Item_Unit_Name
            FROM ccms_allocation_request_items i
            JOIN ccms_item_master im 
              ON im.CM_Item_ID = i.CM_Item_ID
            LEFT JOIN ccms_unit_type ut
              ON ut.CM_Unit_ID = im.CM_Unit_Type
            WHERE i.CM_Request_ID = ?`,
          [r.CM_Request_ID]
        ) as RowDataPacket[];

        const items = (lines as any[]).map(L => ({
          item_id: L.CM_Item_ID,
          item_name: L.CM_Item_Name,
          requested_qty: Number(L.CM_Requested_Qty),
          available_stock: Number(L.CM_Stock_Level),
          need_to_purchase: Math.max(0, Number(L.CM_Requested_Qty) - Number(L.CM_Stock_Level)),
          unit_type: L.CM_Unit_Type || L.Item_Unit
        }));

        requests.push({
          ...r,
          items,
          totals: {
            total_requested: items.reduce((s, x) => s + x.requested_qty, 0),
            total_shortage: items.reduce((s, x) => s + x.need_to_purchase, 0),
          }
        });
      }

      return NextResponse.json({ success: true, data: { status, requests } });
    }

    // APPROVED view -> from ccms_project_products
    const [allocatedProducts] = await db.execute(`
      SELECT 
          pp.CM_Product_ID,
          pp.CM_Product_Name,
          pp.CM_Quantity,
          pp.CM_Unit_Type,
          ut.CM_Unit_Name AS Unit_Type_Name,
          pp.CM_Unit_Price,
          pp.CM_Total_Price,
          pp.CM_Godown_ID,
          g.CM_Godown_Name AS godown_name,
          pp.CM_Created_At,
          pp.CM_Created_By,
          c.CM_Category_Name AS category_name,
          sc.CM_Subcategory_Name AS subcategory_name,
          pp.CM_Supplier_ID
      FROM ccms_project_products pp
      INNER JOIN ccms_category c 
          ON pp.CM_Category_ID = c.CM_Category_ID
      LEFT JOIN ccms_subcategory sc 
          ON pp.CM_Subcategory_ID = sc.CM_Subcategory_ID
      LEFT JOIN ccms_godown g 
          ON pp.CM_Godown_ID = g.CM_Godown_ID
      LEFT JOIN ccms_unit_type ut
          ON pp.CM_Unit_Type = ut.CM_Unit_ID
      WHERE pp.CM_Project_ID = ?
      ORDER BY pp.CM_Created_At DESC
    `, [projectId]) as RowDataPacket[];

    const [summary] = await db.execute(`
      SELECT 
        COUNT(*) as total_products,
        SUM(CAST(CM_Total_Price AS DECIMAL(15,2))) as total_value,
        SUM(CM_Quantity) as total_quantity,
        CM_Alloceted_To,
        COUNT(*) as count_by_type
      FROM ccms_project_products 
      WHERE CM_Project_ID = ?
      GROUP BY CM_Alloceted_To
    `, [projectId]) as RowDataPacket[];

    return NextResponse.json({ success: true, data: { products: allocatedProducts, summary } });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to fetch allocated/requested products', error: errMsg(error) },
      { status: 500 }
    );
  }
}

/** POST: Add or update batch allocation information */
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const method = searchParams.get("_method");
  if (method === "DELETE") return DELETE(request);

  let connection: any = null;
  try {
    const body = await request.json();

    // Validate request body
    if (!body.projectId || !body.products || !Array.isArray(body.products) || body.products.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid request data' },
        { status: 400 }
      );
    }

    const { projectId, products } = body;
    const db = await getDb();

    // Begin transaction
    connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Process each product and its batch allocations
      for (const product of products) {
        // Validate product data
        if (!product.CM_Product_ID || !product.CM_Quantity) {
          console.warn('Invalid product data:', product);
          continue;
        }

        // Process batch allocations if available
        if (product.batches_for_allocation && Array.isArray(product.batches_for_allocation) && product.batches_for_allocation.length > 0) {
          // First, check if there are any existing batch allocations to remove
          const [existingBatchesResult] = await connection.execute(`
            SELECT b.CM_Batch_ID, b.CM_Project_Usage, b.CM_Quantity_Consumed, b.CM_Quantity_Remaining
            FROM ccms_godown_stock_batches b
            WHERE b.CM_Item_ID = ? AND JSON_CONTAINS_PATH(b.CM_Project_Usage, 'one', ?)
          `, [product.CM_Item_ID || product.CM_Product_ID, `$.${projectId}`]);

          // Use type assertion to avoid iterator issues
          const existingBatches = existingBatchesResult as any[];

          // Remove existing project allocations
          for (const batch of existingBatches) {
            try {
              let projectUsage = {};
              if (batch.CM_Project_Usage) {
                projectUsage = typeof batch.CM_Project_Usage === 'string'
                  ? JSON.parse(batch.CM_Project_Usage)
                  : batch.CM_Project_Usage;
              }

              const quantityToRestore = Number(projectUsage[projectId]) || 0;

              // Remove this project from usage
              delete projectUsage[projectId];

              // Update the batch to restore quantity
              await connection.execute(`
                UPDATE ccms_godown_stock_batches
                SET 
                  CM_Quantity_Consumed = GREATEST(0, CM_Quantity_Consumed - ?),
                  CM_Quantity_Remaining = CM_Quantity_Remaining + ?,
                  CM_Project_Usage = ?
                WHERE CM_Batch_ID = ?
              `, [
                quantityToRestore,
                quantityToRestore,
                JSON.stringify(projectUsage),
                batch.CM_Batch_ID
              ]);
            } catch (e) {
              console.error(`Error resetting batch ${batch.CM_Batch_ID}:`, e);
            }
          }

          // Now add the new batch allocations
          for (const batch of product.batches_for_allocation) {
            if (!batch.batch_id || !batch.quantity) continue;

            // Get existing batch data
            const [batchDataResult] = await connection.execute(`
              SELECT CM_Quantity_Consumed, CM_Project_Usage, CM_Quantity_Remaining
              FROM ccms_godown_stock_batches
              WHERE CM_Batch_ID = ?
            `, [batch.batch_id]);

            // Use type assertion
            const batchData = batchDataResult as any[];

            if (!batchData || !batchData.length) {
              console.warn(`Batch ${batch.batch_id} not found`);
              continue;
            }

            // Parse existing project usage or create new object
            let projectUsage = {};
            if (batchData[0].CM_Project_Usage) {
              try {
                projectUsage = typeof batchData[0].CM_Project_Usage === 'string'
                  ? JSON.parse(batchData[0].CM_Project_Usage)
                  : batchData[0].CM_Project_Usage;
              } catch (e) {
                console.error('Error parsing project usage:', e);
              }
            }

            // Update project usage for this batch
            projectUsage[projectId] = Number(batch.quantity);

            // Update batch with usage data
            await connection.execute(`
              UPDATE ccms_godown_stock_batches
              SET CM_Quantity_Consumed = CM_Quantity_Consumed + ?,
                  CM_Quantity_Remaining = CM_Quantity_Remaining - ?,
                  CM_Project_Usage = ?
              WHERE CM_Batch_ID = ?
            `, [
              batch.quantity,
              batch.quantity,
              JSON.stringify(projectUsage),
              batch.batch_id
            ]);
          }
        }

        // Update product in project if it already exists
        const [existingResult] = await connection.execute(`
          SELECT CM_Product_ID FROM ccms_project_products 
          WHERE CM_Project_ID = ? AND CM_Product_ID = ?
        `, [projectId, product.CM_Product_ID]);

        // Use type assertion
        const existing = existingResult as any[];

        if (existing && existing.length > 0) {
          // Update existing product
          await connection.execute(`
            UPDATE ccms_project_products
            SET CM_Quantity = ?,
                CM_Total_Price = ?,
                CM_Updated_At = NOW()
            WHERE CM_Project_ID = ? AND CM_Product_ID = ?
          `, [
            product.CM_Quantity,
            product.CM_Total_Price || product.total_price || 0,
            projectId,
            product.CM_Product_ID
          ]);
        }
      }

      // Commit transaction
      await connection.commit();

      return NextResponse.json({
        success: true,
        message: 'Batch allocations updated successfully',
        data: {
          projectId,
          productsCount: products.length
        }
      });
    } catch (transactionError) {
      // Rollback on error
      await connection.rollback();
      throw transactionError;
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to update batch allocations', error: errMsg(error) },
      { status: error?.status || 500 }
    );
  } finally {
    if (connection) try { connection.release(); } catch { }
  }
}


/** DELETE: remove an approved allocation (Owner only), restore Item Master (Inward) */
export async function DELETE(request: NextRequest) {
  let connection: any = null;
  try {
    try { ensureOwner(request); } catch (e: any) {
      return NextResponse.json({ success: false, message: e.message }, { status: e.status || 403 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');   // Item ID
    const projectId = searchParams.get('projectId');

    if (!productId || !projectId) {
      return NextResponse.json({ success: false, message: 'Product ID and Project ID are required' }, { status: 400 });
    }

    const db = await getDb();
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [allocatedResult] = await connection.execute(
      `SELECT * FROM ccms_project_products WHERE CM_Product_ID=? AND CM_Project_ID=? FOR UPDATE`,
      [productId, projectId]
    );

    // Use type assertion
    const allocated = allocatedResult as any[];

    if (!allocated?.length) {
      await connection.rollback();
      return NextResponse.json({ success: false, message: 'Product allocation not found' }, { status: 404 });
    }

    const qty = Number(allocated[0].CM_Quantity) || 0;
    const unitType = allocated[0].CM_Unit_Type;
    const itemId = allocated[0].CM_Item_ID || productId;

    // First, handle batch restorations
    let restoredBatches = 0;
    try {
      // Get all batches that have been used for this project/product
      const [batchesResult] = await connection.execute(`
        SELECT CM_Batch_ID, CM_Quantity_Consumed, CM_Project_Usage, CM_Quantity_Remaining
        FROM ccms_godown_stock_batches
        WHERE (CM_Item_ID = ? OR CM_Product_ID = ?) AND JSON_CONTAINS_PATH(CM_Project_Usage, 'one', ?)
      `, [itemId, productId, `$.${projectId}`]);

      // Use type assertion
      const batches = batchesResult as any[];

      // Update each batch to remove this project's allocation
      for (const batch of batches) {
        try {
          let projectUsage = {};
          if (batch.CM_Project_Usage) {
            projectUsage = typeof batch.CM_Project_Usage === 'string'
              ? JSON.parse(batch.CM_Project_Usage)
              : batch.CM_Project_Usage;
          }

          const quantityToRestore = Number(projectUsage[projectId]) || 0;

          if (quantityToRestore > 0) {
            restoredBatches++;

            // Remove this project from usage
            delete projectUsage[projectId];

            // Update the batch
            await connection.execute(`
              UPDATE ccms_godown_stock_batches
              SET 
                CM_Quantity_Consumed = GREATEST(0, CM_Quantity_Consumed - ?),
                CM_Quantity_Remaining = CM_Quantity_Remaining + ?,
                CM_Project_Usage = ?
              WHERE CM_Batch_ID = ?
            `, [
              quantityToRestore,
              quantityToRestore,
              JSON.stringify(projectUsage),
              batch.CM_Batch_ID
            ]);
          }
        } catch (e) {
          console.error(`Error processing batch ${batch.CM_Batch_ID}:`, e);
        }
      }
    } catch (e) {
      console.log('Error restoring batches, continuing with standard restoration:', e);
    }

    // Restore Item Master (Inward) - Your existing code
    const [imResult] = await connection.execute(
      `SELECT CM_Item_Name FROM ccms_item_master WHERE CM_Item_ID=? AND CM_Is_Status='Active'`,
      [productId]
    );

    // Use type assertion
    const im = imResult as any[];
    const itemName = im?.[0]?.CM_Item_Name || productId;

    const [curStockRowsResult] = await connection.execute(
      `SELECT CM_Stock_Level FROM ccms_item_master WHERE CM_Item_ID=?`,
      [productId]
    );

    // Use type assertion
    const curStockRows = curStockRowsResult as any[];
    const cur = Number(curStockRows?.[0]?.CM_Stock_Level || 0);
    const after = cur + qty;

    await connection.execute(
      `UPDATE ccms_item_master SET CM_Stock_Level=? WHERE CM_Item_ID=?`,
      [after, productId]
    );

    // Transaction log (Inward)
    const [companyRowsResult] = await connection.execute(
      `SELECT CM_Company_ID FROM ccms_project_products WHERE CM_Product_ID=? AND CM_Project_ID=?`,
      [productId, projectId]
    );

    // Use type assertion
    const companyRows = companyRowsResult as any[];
    const companyId = companyRows?.[0]?.CM_Company_ID || null;

    const txnId = `TXN${Date.now().toString().slice(-6)}`;
    await connection.execute(
      `INSERT INTO ccms_product_transaction
        (CM_Transaction_ID, CM_Company_ID, CM_Product_ID, CM_Origin_Godown_ID, CM_Recive_Godown_ID,
         CM_Item_ID, CM_Transaction_Type, CM_Quantity, CM_Unit_Type, CM_Reference_No, CM_Remarks,
         CM_Transaction_Date, CM_Is_Active, CM_Approved_By, CM_Created_By, CM_Created_At, CM_Uploaded_By, CM_Uploaded_At)
       VALUES (?, ?, ?, NULL, NULL, ?, 'Inward', ?, ?, ?, ?, NOW(), 'Active', ?, ?, NOW(), ?, NOW())`,
      [
        txnId,
        companyId,
        null,
        productId,
        qty,
        unitType,
        `PROJ_ALLOC_REVERT_${projectId}`,
        `Reverted approved allocation for ${itemName}. Stock ${cur} -> ${after}. Restored ${restoredBatches} batches.`,
        'owner',
        'owner',
        'owner'
      ]
    );

    // Delete allocation
    await connection.execute(
      `DELETE FROM ccms_project_products WHERE CM_Product_ID=? AND CM_Project_ID=?`,
      [productId, projectId]
    );

    await connection.commit();

    return NextResponse.json({
      success: true,
      message: 'Allocation removed and stock restored to Item Master',
      data: {
        product_id: productId,
        restored_qty: qty,
        stock_after: after,
        restored_batches: restoredBatches
      }
    });

  } catch (error: any) {
    if (connection) try { await connection.rollback(); } catch { }
    return NextResponse.json(
      { success: false, message: 'Failed to remove allocated product', error: errMsg(error) },
      { status: error?.status || 500 }
    );
  } finally {
    if (connection) try { connection.release(); } catch { }
  }
}

