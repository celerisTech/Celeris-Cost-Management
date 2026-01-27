// src/app/api/products/allocate/approve/route.ts
import { NextResponse, NextRequest } from 'next/server';
import getDb from '@/app/utils/db';
import { RowDataPacket, OkPacket } from 'mysql2';

// Helper: Update Item Master Stock Level
async function updateItemMasterStock(connection: any, itemId: string, quantityChange: number, transactionType: 'Inward' | 'Outward'): Promise<void> {
  try {
    console.log(`📊 Updating item master stock for ${itemId}: ${transactionType} ${quantityChange}`);

    // Get current stock level
    const [currentStock] = await connection.query(`
      SELECT CM_Stock_Level, CM_Item_Name 
      FROM ccms_item_master 
      WHERE CM_Item_ID = ? AND CM_Is_Status = 'Active'
    `, [itemId]) as RowDataPacket[];

    if (!currentStock || currentStock.length === 0) {
      throw new Error(`Item master not found for item ID: ${itemId}`);
    }

    const current = parseInt(currentStock[0].CM_Stock_Level) || 0;
    const itemName = currentStock[0].CM_Item_Name;

    // Calculate new stock level
    let newStockLevel: number;
    if (transactionType === 'Inward') {
      newStockLevel = current + quantityChange; // Increase stock (Purchase)
    } else {
      newStockLevel = current - quantityChange; // Decrease stock (Allocation/Issue)
    }

    // Validate stock doesn't go negative
    if (newStockLevel < 0) {
      throw new Error(`Insufficient stock for item ${itemName}. Current: ${current}, Requested: ${quantityChange}, Would result in: ${newStockLevel}`);
    }

    // Update the stock level
    const [updateResult] = await connection.query(`
      UPDATE ccms_item_master 
      SET CM_Stock_Level = ?
      WHERE CM_Item_ID = ?
    `, [newStockLevel, itemId]) as OkPacket[];

    console.log(`🔄 Stock update result for ${itemId}:`, updateResult);

    if (updateResult.affectedRows === 0) {
      throw new Error(`Failed to update stock level for item: ${itemId}`);
    }

    console.log(`✅ Updated item master stock: ${itemName} (${itemId}) - ${current} → ${newStockLevel}`);

  } catch (error) {
    console.error('❌ Error updating item master stock:', error);
    throw error;
  }
}

// Helper: Find a valid product ID from purchase records for an item
async function findValidProductId(connection: any, itemDetails: any): Promise<string | null> {
  try {
    // First try with the item's category, subcategory, and company
    if (itemDetails.CM_Category_ID && itemDetails.CM_Subcategory_ID && itemDetails.CM_Company_ID) {
      const [purchaseRecords] = await connection.query(`
        SELECT CM_Product_ID 
        FROM ccms_purchase 
        WHERE CM_Category_ID = ? 
        AND CM_Subcategory_ID = ? 
        AND CM_Company_ID = ? 
        AND CM_Is_Status = 'Active'
        ORDER BY CM_Purchase_Date DESC 
        LIMIT 1
      `, [
        itemDetails.CM_Category_ID,
        itemDetails.CM_Subcategory_ID,
        itemDetails.CM_Company_ID
      ]) as RowDataPacket[];

      if (purchaseRecords && purchaseRecords.length > 0) {
        return purchaseRecords[0].CM_Product_ID;
      }
    }

    // If no result or missing details, try with just the item name pattern
    if (itemDetails.CM_Item_Name) {
      const searchPattern = `%${itemDetails.CM_Item_Name.split(' ')[0]}%`; // Use first word of item name
      const [nameSearchRecords] = await connection.query(`
        SELECT CM_Product_ID 
        FROM ccms_purchase 
        WHERE CM_Product_Name LIKE ? 
        AND CM_Is_Status = 'Active'
        ORDER BY CM_Purchase_Date DESC 
        LIMIT 1
      `, [searchPattern]) as RowDataPacket[];

      if (nameSearchRecords && nameSearchRecords.length > 0) {
        return nameSearchRecords[0].CM_Product_ID;
      }
    }

    // As a last resort, get any recent purchase record
    const [anyRecords] = await connection.query(`
      SELECT CM_Product_ID 
      FROM ccms_purchase 
      WHERE CM_Is_Status = 'Active'
      ORDER BY CM_Purchase_Date DESC 
      LIMIT 1
    `) as RowDataPacket[];

    if (anyRecords && anyRecords.length > 0) {
      return anyRecords[0].CM_Product_ID;
    }

    return null;
  } catch (error) {
    console.error('Error finding valid product ID:', error);
    return null;
  }
}

// Helper: Check if column exists in table
async function columnExists(connection: any, tableName: string, columnName: string): Promise<boolean> {
  try {
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = ? AND COLUMN_NAME = ?
    `, [tableName, columnName]);

    return columns && Array.isArray(columns) && columns.length > 0;
  } catch (error) {
    console.error(`Error checking if column ${columnName} exists in ${tableName}:`, error);
    return false;
  }
}

// Helper: Add column to table if it doesn't exist
async function ensureColumnExists(connection: any, tableName: string, columnDefinition: string): Promise<void> {
  const columnName = columnDefinition.split(' ')[0];

  const exists = await columnExists(connection, tableName, columnName);
  if (!exists) {
    console.log(`Adding missing column ${columnName} to ${tableName}`);
    await connection.query(`
      ALTER TABLE ${tableName} 
      ADD COLUMN ${columnDefinition}
    `);
  }
}

// GET handler - Get allocation request details
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const requestId = searchParams.get('requestId');

    if (!requestId) {
      const res = NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      );
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    const db = await getDb();

    // Get the request details - avoid JOIN with tables that don't exist
    const [requestDetails] = await db.query(`
      SELECT 
    req.*,
    
    -- Project details
    proj.CM_Project_Name,
    proj.CM_Project_Code,
    proj.CM_Customer_ID,
    proj.CM_Project_Location,
    proj.CM_Status AS Project_Status,

    -- Requester details
    usr.CM_Full_Name AS requester_name,
    usr.CM_Email AS requester_email,
    usr.CM_Phone_Number AS requester_phone

FROM ccms_product_allocation_requests req
JOIN ccms_projects proj 
    ON req.CM_Project_ID = proj.CM_Project_ID
LEFT JOIN ccms_users usr
    ON req.CM_Requested_By = usr.CM_User_ID
WHERE req.CM_Request_ID = ?
    `, [requestId]) as [RowDataPacket[], any];

    if (!requestDetails || requestDetails.length === 0) {
      const res = NextResponse.json(
        { error: 'Allocation request not found' },
        { status: 404 }
      );
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    // Get the request items
    const [requestItems] = await db.query(`
      SELECT 
    items.*,
    im.CM_Item_Name,
    im.CM_Item_Code,
    im.CM_Stock_Level AS current_stock,
    im.CM_Unit_Type,
    ut.CM_Unit_Name AS Unit_Type_Name
FROM ccms_product_allocation_request_items items
LEFT JOIN ccms_item_master im 
    ON items.CM_Item_Master_ID = im.CM_Item_ID
LEFT JOIN ccms_unit_type ut 
    ON im.CM_Unit_Type = ut.CM_Unit_ID
WHERE items.CM_Request_ID = ?

    `, [requestId]);

    // The database now directly stores 'Partially Approved', so no mapping needed
    const requestData = requestDetails[0];

    const res = NextResponse.json({
      success: true,
      data: {
        request: requestData,
        items: requestItems
      }
    });
    res.headers.set('Cache-Control', 'no-store');
    return res;

  } catch (error) {
    console.error('Error fetching allocation request:', error);
    const res = NextResponse.json(
      {
        error: 'Failed to fetch allocation request details',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}

// POST handler - Approve/Reject allocation request
export async function POST(request: Request) {
  let connection: any = null;

  try {
    const body = await request.json();

    const {
      requestId,
      action,
      approverId,
      notes,
      requestStatus,
      hasPendingItems,
      itemApprovals
    } = body;

    if (!requestId || !action || !approverId) {
      const res = NextResponse.json(
        { error: 'Request ID, action, and approver ID are required' },
        { status: 400 }
      );
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    if (action !== 'approve' && action !== 'reject') {
      const res = NextResponse.json(
        { error: 'Action must be either "approve" or "reject"' },
        { status: 400 }
      );
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    const db = await getDb();
    connection = await db.getConnection();
    await connection.beginTransaction();

    // Ensure required columns exist - we still keep this for the pending quantity
    try {
      // Add pending quantity column to request items table
      await ensureColumnExists(
        connection,
        'ccms_product_allocation_request_items',
        'CM_Pending_Quantity INT DEFAULT 0'
      );

    } catch (error) {
      console.warn('Could not add pending columns, will proceed without them:', error);
      // We'll continue without the columns and just use the existing functionality
    }

    // Check if required columns exist
    const pendingQuantityColumnExists = await columnExists(
      connection,
      'ccms_product_allocation_request_items',
      'CM_Pending_Quantity'
    );

    // Check if request exists and is pending or partially approved
    const [requestCheck] = await connection.query(`
      SELECT * FROM ccms_product_allocation_requests
      WHERE CM_Request_ID = ? AND (CM_Status = 'Pending' OR CM_Status = 'Partially Approved')
    `, [requestId]);

    if (!requestCheck || requestCheck.length === 0) {
      await connection.rollback();
      const res = NextResponse.json(
        { error: 'Allocation request not found or already fully processed' },
        { status: 404 }
      );
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    // Store the current request status for use in approval logic
    const currentRequestStatus = requestCheck[0].CM_Status;
    const projectId = requestCheck[0].CM_Project_ID;
    const requestedBy = requestCheck[0].CM_Requested_By;

    if (action === 'reject') {
      // Update request status to rejected
      await connection.query(`
        UPDATE ccms_product_allocation_requests
        SET CM_Status = 'Rejected',
            CM_Approved_By = ?,
            CM_Approval_Date = NOW(),
            CM_Rejection_Reason = ?,
            CM_Has_Pending_Items = 0
        WHERE CM_Request_ID = ?
      `, [approverId, notes || `Rejected by ${approverId}`, requestId]);

      // Update all items to rejected
      if (pendingQuantityColumnExists) {
        await connection.query(`
          UPDATE ccms_product_allocation_request_items
          SET CM_Status = 'Rejected',
              CM_Pending_Quantity = 0
          WHERE CM_Request_ID = ?
        `, [requestId]);
      } else {
        await connection.query(`
          UPDATE ccms_product_allocation_request_items
          SET CM_Status = 'Rejected'
          WHERE CM_Request_ID = ?
        `, [requestId]);
      }

      await connection.commit();

      const res = NextResponse.json({
        success: true,
        message: 'Allocation request rejected successfully',
        data: {
          request_id: requestId,
          status: 'Rejected',
          approver_id: approverId,
          rejection_reason: notes || 'Rejected by approver'
        }
      });
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    // Process approval
    if (!itemApprovals || !Array.isArray(itemApprovals) || itemApprovals.length === 0) {
      await connection.rollback();
      const res = NextResponse.json(
        { error: 'Item approvals array is required for approval' },
        { status: 400 }
      );
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    // Get all request items
    const [requestItems] = await connection.query(`
      SELECT 
            items.*,
            im.CM_Item_Name,
            im.CM_Stock_Level AS current_stock,
            im.CM_Category_ID,
            im.CM_Subcategory_ID,
            im.CM_Company_ID,
            im.CM_Unit_Type AS Item_Unit_ID,
            ut.CM_Unit_Name AS Item_Unit_Name,
            cp.CM_Product_Name,
            cp.CM_Godown_ID,
            cp.CM_Supplier_ID,
            cp.CM_Unit_Price
        FROM ccms_product_allocation_request_items items
        LEFT JOIN ccms_item_master im 
            ON items.CM_Item_Master_ID = im.CM_Item_ID
        LEFT JOIN ccms_unit_type ut 
            ON ut.CM_Unit_ID = im.CM_Unit_Type
        LEFT JOIN ccms_purchase cp 
            ON items.CM_Product_ID = cp.CM_Product_ID
        WHERE items.CM_Request_ID = ?
    `, [requestId]);

    if (requestItems.length === 0) {
      await connection.rollback();
      const res = NextResponse.json(
        { error: 'No items found in the allocation request' },
        { status: 404 }
      );
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    // Process each approved item
    const processedItems = [];
    const transactionRecords = [];
    let totalAllocationValue = 0;
    let hasPartiallyApprovedItems = false;
    let totalPendingItems = 0;

    for (const approval of itemApprovals) {
      const { itemId, approvedQuantity, requestedQuantity, pendingQuantity, status, notes: itemNotes } = approval;

      // Find the item in the request
      const requestItem = requestItems.find(item => item.CM_Item_ID === parseInt(itemId));

      if (!requestItem) {
        console.warn(`Item ID ${itemId} not found in request ${requestId}`);
        continue;
      }

      const approvedQty = parseInt(approvedQuantity);
      const requestedQty = parseInt(requestedQuantity || requestItem.CM_Requested_Quantity);
      const pendingQty = parseInt(pendingQuantity || (requestedQty - approvedQty));
      const currentStock = parseInt(requestItem.current_stock);

      // Validate approved quantity
      if (isNaN(approvedQty) || approvedQty < 0) {
        await connection.rollback();
        const res = NextResponse.json(
          { error: `Invalid approved quantity for item ID ${itemId}` },
          { status: 400 }
        );
        res.headers.set('Cache-Control', 'no-store');
        return res;
      }

      // Check if we have enough stock
      if (approvedQty > currentStock) {
        await connection.rollback();
        const res = NextResponse.json(
          {
            error: `Insufficient stock for item ${requestItem.CM_Item_Name}`,
            details: {
              item_id: requestItem.CM_Item_Master_ID,
              approved_quantity: approvedQty,
              available_stock: currentStock
            }
          },
          { status: 400 }
        );
        res.headers.set('Cache-Control', 'no-store');
        return res;
      }

      // Update the status of the item - use exact enum values
      let itemStatus = 'Rejected';
      if (approvedQty > 0) {
        itemStatus = (approvedQty >= requestedQty) ? 'Approved' : 'Partially Approved';
      }

      // Track pending items
      if (itemStatus === 'Partially Approved') {
        hasPartiallyApprovedItems = true;
        totalPendingItems++;
      }

      // Skip if approved quantity is 0
      if (approvedQty === 0) {
        // Handle with or without pending column
        if (pendingQuantityColumnExists) {
          await connection.query(`
            UPDATE ccms_product_allocation_request_items
            SET CM_Status = 'Rejected',
                CM_Approved_Quantity = 0,
                CM_Pending_Quantity = 0,
                CM_Notes = ?
            WHERE CM_Item_ID = ?
          `, [itemNotes || 'Rejected - Quantity 0', requestItem.CM_Item_ID]);
        } else {
          await connection.query(`
            UPDATE ccms_product_allocation_request_items
            SET CM_Status = 'Rejected',
                CM_Approved_Quantity = 0,
                CM_Notes = ?
            WHERE CM_Item_ID = ?
          `, [itemNotes || 'Rejected - Quantity 0', requestItem.CM_Item_ID]);
        }

        continue;
      }

      // Calculate total approved quantity - for partially approved requests, 
      // we need to add the new approval to any existing approved quantity
      let totalApprovedQty = approvedQty;

      if (currentRequestStatus === 'Partially Approved') {
        // Add new approval to existing approved quantity
        const existingApprovedQty = parseInt(requestItem.CM_Approved_Quantity) || 0;
        totalApprovedQty = existingApprovedQty + approvedQty;

        console.log(`Adding to existing approval: ${existingApprovedQty} + ${approvedQty} = ${totalApprovedQty}`);
      }

      // Update the item status in the request - handle with or without pending column
      if (pendingQuantityColumnExists) {
        await connection.query(`
          UPDATE ccms_product_allocation_request_items
          SET CM_Status = ?,
              CM_Approved_Quantity = ?,
              CM_Pending_Quantity = ?,
              CM_Notes = ?
          WHERE CM_Item_ID = ?
        `, [
          pendingQty > 0 ? 'Partially Approved' : 'Approved',
          totalApprovedQty,
          pendingQty,
          itemNotes || `${totalApprovedQty} approved${pendingQty > 0 ? `, ${pendingQty} pending` : ''}`,
          requestItem.CM_Item_ID
        ]);
      } else {
        await connection.query(`
          UPDATE ccms_product_allocation_request_items
          SET CM_Status = ?,
              CM_Approved_Quantity = ?,
              CM_Notes = ?
          WHERE CM_Item_ID = ?
        `, [
          pendingQty > 0 ? 'Partially Approved' : 'Approved',
          totalApprovedQty,
          itemNotes || `${totalApprovedQty} approved${pendingQty > 0 ? `, ${pendingQty} pending` : ''}`,
          requestItem.CM_Item_ID
        ]);
      }

      // *** FIFO Batch Allocation ***
      const itemMasterId = requestItem.CM_Item_Master_ID;

      // Get available batches for this item in FIFO order (oldest first)
      const [availableBatches] = await connection.query(`
        SELECT 
          CM_Batch_ID, 
          CM_Godown_ID, 
          CM_Quantity_Remaining, 
          CM_Unit_Price
        FROM ccms_godown_stock_batches
        WHERE CM_Item_ID = ? AND CM_Quantity_Remaining > 0
        ORDER BY CM_Purchase_Date ASC
      `, [itemMasterId]);

      // Allocate from batches following FIFO
      let remainingToAllocate = approvedQty;
      let batchAllocations = [];
      let totalItemValue = 0;

      for (const batch of availableBatches) {
        if (remainingToAllocate <= 0) break;

        const batchId = batch.CM_Batch_ID;
        const availableInBatch = Number(batch.CM_Quantity_Remaining);
        const unitPrice = Number(batch.CM_Unit_Price);
        const godownId = batch.CM_Godown_ID;

        // Determine how much to allocate from this batch
        const allocateFromBatch = Math.min(availableInBatch, remainingToAllocate);
        const batchValue = allocateFromBatch * unitPrice;

        // Update batch quantity
        await connection.query(`
          UPDATE ccms_godown_stock_batches 
          SET CM_Quantity_Remaining = CM_Quantity_Remaining - ? 
          WHERE CM_Batch_ID = ?
        `, [allocateFromBatch, batchId]);

        // Track allocation for this batch
        batchAllocations.push({
          batch_id: batchId,
          quantity: allocateFromBatch,
          unit_price: unitPrice,
          batch_value: batchValue,
          godown_id: godownId
        });

        // Update godown stock
        try {
          const [stockRows] = await connection.query(`
            SELECT CM_Quantity 
            FROM ccms_godown_stock 
            WHERE CM_Godown_ID = ? AND CM_Item_ID = ?
          `, [godownId, itemMasterId]);

          if (stockRows && stockRows.length > 0) {
            await connection.query(`
              UPDATE ccms_godown_stock 
              SET CM_Quantity = CM_Quantity - ?, 
                  CM_Uploaded_By = ?, 
                  CM_Uploaded_At = NOW() 
              WHERE CM_Godown_ID = ? AND CM_Item_ID = ?
            `, [allocateFromBatch, approverId, godownId, itemMasterId]);
          } else {
            // Insert a new record with negative quantity to track allocation
            await connection.query(`
              INSERT INTO ccms_godown_stock (
                CM_Godown_ID, 
                CM_Product_ID, 
                CM_Item_ID, 
                CM_Quantity, 
                CM_Created_By, 
                CM_Created_At
              ) VALUES (?, ?, ?, ?, ?, NOW())
            `, [
              godownId,
              requestItem.CM_Product_ID || null,
              itemMasterId,
              -allocateFromBatch,
              approverId
            ]);
          }
        } catch (stockError) {
          console.error(`❌ Error updating godown stock for batch ${batchId}:`, stockError);
          // Continue without failing the transaction
        }

        totalItemValue += batchValue;
        remainingToAllocate -= allocateFromBatch;
      }

      // Only update the item master stock once
      await updateItemMasterStock(
        connection,
        itemMasterId,
        approvedQty,  // Only use the new approved quantity
        'Outward'
      );

      // Use the actual batch-based calculation for allocation value
      const allocationValue = totalItemValue;
      totalAllocationValue += allocationValue;

      let allocation_id = itemMasterId;

      // *** MODIFIED: Delete existing allocations and create separate records for each batch ***
      // *** FIXED: Update existing batches and add new batches without deleting ***

      let operation_type = 'BATCH_UPDATE_INSERT';

      // Process each batch allocation
      for (const batchAllocation of batchAllocations) {
        const { batch_id, quantity, unit_price, batch_value, godown_id } = batchAllocation;

        try {
          // Check if this batch already exists for this product in this project
          const [existingBatch] = await connection.query(`
      SELECT CM_Project_Product_ID, CM_Quantity, CM_Remaining_Quantity 
      FROM ccms_project_products 
      WHERE CM_Product_ID = ? AND CM_Project_ID = ? AND CM_Batch_ID = ?
    `, [allocation_id, projectId, batch_id]);

          if (existingBatch && existingBatch.length > 0) {
            // Batch exists - UPDATE the quantities
            const existingRecord = existingBatch[0];
            const newQuantity = existingRecord.CM_Quantity + quantity;
            const newRemainingQuantity = existingRecord.CM_Remaining_Quantity + quantity;
            const newTotalPrice = newQuantity * unit_price;

            await connection.query(`
        UPDATE ccms_project_products 
        SET CM_Quantity = ?,
            CM_Remaining_Quantity = ?,
            CM_Unit_Price = ?,
            CM_Total_Price = ?,
            CM_Uploaded_By = ?,
            CM_Uploaded_At = NOW()
        WHERE CM_Project_Product_ID = ?
      `, [
              newQuantity,
              newRemainingQuantity,
              unit_price, // Update unit price (in case it changed)
              newTotalPrice,
              approverId,
              existingRecord.CM_Project_Product_ID
            ]);

            console.log(`✅ Updated existing project product record for batch ${batch_id}: ${existingRecord.CM_Quantity} + ${quantity} = ${newQuantity} units`);
          } else {
            // Batch doesn't exist - INSERT new record
            await connection.query(`
            INSERT INTO ccms_project_products (
              CM_Product_ID,
              CM_Product_Name,
              CM_Project_ID,
              CM_Batch_ID,
              CM_Quantity,
              CM_Remaining_Quantity,
              CM_Unit_Type,
              CM_Unit_Price,
              CM_Total_Price,
              CM_Supplier_ID,
              CM_Category_ID,
              CM_Subcategory_ID,
              CM_Company_ID,
              CM_Godown_ID,
              CM_Alloceted_To,
              CM_Created_By,
              CM_Created_At,
              CM_Uploaded_By,
              CM_Uploaded_At
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, NOW())
          `, [
              allocation_id,           // CM_Product_ID
              requestItem.CM_Item_Name, // CM_Product_Name
              projectId,               // CM_Project_ID
              batch_id,                // CM_Batch_ID - specific batch ID
              quantity,                // CM_Quantity - quantity from this specific batch
              quantity,                // CM_Remaining_Quantity - initially same as quantity
              requestItem.CM_Unit_Type,// CM_Unit_Type
              unit_price,              // CM_Unit_Price - specific unit price for this batch
              batch_value,             // CM_Total_Price - calculated for this batch
              requestItem.CM_Supplier_ID, // CM_Supplier_ID
              requestItem.CM_Category_ID, // CM_Category_ID
              requestItem.CM_Subcategory_ID, // CM_Subcategory_ID
              requestItem.CM_Company_ID,     // CM_Company_ID
              godown_id,               // CM_Godown_ID - specific godown for this batch
              'Godown',                // CM_Alloceted_To
              requestedBy,             // CM_Created_By
              approverId               // CM_Uploaded_By
            ]);

            console.log(`✅ Created new project product record for batch ${batch_id}: ${quantity} units @ ${unit_price} each`);
          }
        } catch (batchError) {
          console.error(`❌ Error processing batch ${batch_id}:`, batchError);
          throw new Error(`Failed to process batch allocation for batch ${batch_id}: ${batchError.message}`);
        }
      }
      operation_type = 'MULTI_BATCH_INSERT';

      // Find a valid product ID for transaction
      const validProductId = await findValidProductId(connection, requestItem);

      console.log(`Found valid product ID for transaction: ${validProductId || 'None'}`);

      // Create transaction with dynamic SQL based on whether we have a valid product ID
      let transactionQuery = `
        INSERT INTO ccms_product_transaction (
          CM_Company_ID,
          ${validProductId ? 'CM_Product_ID,' : ''}
          CM_Origin_Godown_ID,
          CM_Recive_Godown_ID,
          CM_Item_ID,
          CM_Transaction_Type,
          CM_Quantity,
          CM_Unit_Type,
          CM_Reference_No,
          CM_Remarks,
          CM_Transaction_Date,
          CM_Is_Active,
          CM_Approved_By,
          CM_Created_By,
          CM_Created_At,
          CM_Uploaded_By,
          CM_Uploaded_At
        ) VALUES (
          ?,
          ${validProductId ? '?,' : ''}
          ?,
          ?,
          ?,
          'Outward',
          ?,
          ?,
          ?,
          ?,
          NOW(),
          'Active',
          ?,
          ?,
          NOW(),
          ?,
          NOW()
        )
      `;

      // Prepare parameters array based on whether we have a valid product ID
      let transactionParams = [
        requestItem.CM_Company_ID,
      ];

      // Add the valid product ID to params if we have one
      if (validProductId) {
        transactionParams.push(validProductId);
      }

      // Add the rest of the parameters
      transactionParams.push(
        requestItem.CM_Godown_ID,
        null, // Destination (project allocation)
        itemMasterId,
        approvedQty,
        requestItem.CM_Unit_Type,
        `PROJ_ALLOC_${projectId}_REQ_${requestId}`,
        `${itemStatus}: ${requestItem.CM_Item_Name} (${approvedQty} ${requestItem.CM_Unit_Type}) to project ${projectId}. ${pendingQty > 0 ? `${pendingQty} units pending.` : ''} ${itemNotes || ''}`,
        approverId,
        requestedBy,
        approverId
      );

      // Execute the transaction insert with dynamic SQL and parameters
      await connection.query(transactionQuery, transactionParams);

      processedItems.push({
        item_id: requestItem.CM_Item_ID,
        item_master_id: itemMasterId,
        item_name: requestItem.CM_Item_Name,
        requested_quantity: requestedQty,
        approved_quantity: approvedQty,
        total_approved_quantity: totalApprovedQty,
        pending_quantity: pendingQty,
        unit_type: requestItem.CM_Unit_Type,
        status: itemStatus,
        allocation_id,
        operation_type,
        used_product_id: validProductId || null,
        batch_allocations: batchAllocations
      });

      transactionRecords.push({
        item_id: itemMasterId,
        item_name: requestItem.CM_Item_Name,
        quantity: approvedQty,
        pending: pendingQty,
        stock_before: currentStock,
        stock_after: currentStock - approvedQty,
        used_product_id: validProductId || null,
        batch_allocations: batchAllocations
      });
    }

    // Check if any items in the request still have pending quantities
    const [pendingItemsCheck] = await connection.query(`
      SELECT COUNT(*) as pending_count
      FROM ccms_product_allocation_request_items
      WHERE CM_Request_ID = ? AND CM_Pending_Quantity > 0
    `, [requestId]);

    const pendingItemsCount = pendingItemsCheck[0]?.pending_count || 0;

    // Determine the overall request status
    // If any items still have pending quantities, it's partially approved
    // Otherwise, it's fully approved
    const finalStatus = pendingItemsCount > 0 ? 'Partially Approved' : 'Approved';

    // Update the overall request status
    await connection.query(`
      UPDATE ccms_product_allocation_requests
      SET CM_Status = ?,
          CM_Approved_By = ?,
          CM_Approval_Date = NOW(),
          CM_Notes = ?,
          CM_Has_Pending_Items = ?
      WHERE CM_Request_ID = ?
    `, [finalStatus, approverId, notes || `${finalStatus} by ${approverId}`, pendingItemsCount > 0 ? 1 : 0, requestId]);

    // Commit transaction
    await connection.commit();

    const res = NextResponse.json({
      success: true,
      message: `Allocation request ${finalStatus.toLowerCase()} successfully`,
      data: {
        request_id: requestId,
        project_id: projectId,
        status: finalStatus,
        has_pending_items: pendingItemsCount > 0,
        pending_items_count: pendingItemsCount,
        approver_id: approverId,
        processed_items: processedItems,
        transactions: transactionRecords,
        total_approved_items: processedItems.length,
        total_allocation_value: totalAllocationValue
      }
    });
    res.headers.set('Cache-Control', 'no-store');
    return res;

  } catch (error) {
    console.error('Error processing allocation request:', error);

    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Rollback error:', rollbackError);
      }
    }

    const res = NextResponse.json(
      {
        error: 'Failed to process allocation request',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}