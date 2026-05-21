// src/app/api/stock-management/transfer-stock/route.ts
import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/app/utils/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  let connection;

  try {
    const db = await getDb();
    connection = db;

    const body = await req.json();

    const {
      itemId,
      sourceGodownId,
      destinationGodownId,
      quantity,
      notes,
      createdBy,
      transferDate
    } = body;

    // Validate required fields
    if (!itemId || !sourceGodownId || !destinationGodownId || !quantity) {
      const res = NextResponse.json({
        success: false,
        message: 'Missing required fields'
      }, { status: 400 });
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    // Parse quantity to ensure it's a proper decimal
    // Use parseFloat and fix to 2 decimal places for consistency
    const transferQuantity = parseFloat(parseFloat(quantity).toFixed(2));
    if (isNaN(transferQuantity) || transferQuantity <= 0) {
      const res = NextResponse.json({
        success: false,
        message: 'Invalid quantity'
      }, { status: 400 });
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    // Check if source and destination are different
    if (sourceGodownId === destinationGodownId) {
      const res = NextResponse.json({
        success: false,
        message: 'Source and destination godowns cannot be the same'
      }, { status: 400 });
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    // Begin transaction
    await connection.query('START TRANSACTION');

    try {
      // Check if item exists in source godown with sufficient quantity
      const [sourceStockItems] = await connection.query(
        `SELECT * FROM ccms_godown_stock 
         WHERE CM_Item_ID = ? AND CM_Godown_ID = ?`,
        [itemId, sourceGodownId]
      );

      if (!sourceStockItems || sourceStockItems.length === 0) {
        await connection.query('ROLLBACK');
        const res = NextResponse.json({
          success: false,
          message: 'Item not found in source godown'
        }, { status: 404 });
        res.headers.set('Cache-Control', 'no-store');
        return res;
      }

      // Verify sufficient quantity in the source godown
      const sourceStockItem = sourceStockItems[0];
      // Make sure to properly convert to a decimal with 2 decimal places
      const availableQuantity = parseFloat(parseFloat(sourceStockItem.CM_Quantity).toFixed(2));

      if (availableQuantity < transferQuantity) {
        await connection.query('ROLLBACK');
        const res = NextResponse.json({
          success: false,
          message: `Insufficient quantity. Available: ${availableQuantity.toFixed(2)}`
        }, { status: 400 });
        res.headers.set('Cache-Control', 'no-store');
        return res;
      }

      const productId = sourceStockItem.CM_Product_ID;



      // Use the provided transfer date, or current time if not provided
      const currentDateTime = transferDate || new Date().toISOString().slice(0, 19).replace('T', ' ');

      // 1. Create transfer record - use explicit decimal value
      await connection.query(
        `INSERT INTO ccms_godown_transfer (
          CM_Product_ID,
          CM_Item_ID,
          CM_Source_Godown_ID,
          CM_Destination_Godown_ID,
          CM_Quantity,
          CM_Transfer_Date,
          CM_Notes,
          CM_Created_By,
          CM_Created_At
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          productId,
          itemId,
          sourceGodownId,
          destinationGodownId,
          transferQuantity.toFixed(2), // Ensure 2 decimal places
          currentDateTime,
          notes || '',
          createdBy,
          currentDateTime
        ]
      );

      // 2. Reduce quantity from the source godown - use SQL DECIMAL for precision
      await connection.query(
        `UPDATE ccms_godown_stock 
         SET CM_Quantity = CM_Quantity - CAST(? AS DECIMAL(15,2)), 
             CM_Uploaded_By = ?, 
             CM_Uploaded_At = NOW()
         WHERE CM_Item_ID = ? AND CM_Godown_ID = ?`,
        [
          transferQuantity.toFixed(2), // Ensure 2 decimal places
          createdBy,
          itemId,
          sourceGodownId
        ]
      );

      // 3. Check if the item exists in the destination godown
      const [destinationStockItems] = await connection.query(
        `SELECT * FROM ccms_godown_stock 
         WHERE CM_Item_ID = ? AND CM_Godown_ID = ?`,
        [itemId, destinationGodownId]
      );

      if (destinationStockItems && destinationStockItems.length > 0) {
        // Item exists in destination godown, update the quantity - use SQL DECIMAL for precision
        await connection.query(
          `UPDATE ccms_godown_stock 
           SET CM_Quantity = CM_Quantity + CAST(? AS DECIMAL(15,2)), 
               CM_Uploaded_By = ?, 
               CM_Uploaded_At = NOW()
           WHERE CM_Item_ID = ? AND CM_Godown_ID = ?`,
          [
            transferQuantity.toFixed(2), // Ensure 2 decimal places
            createdBy,
            itemId,
            destinationGodownId
          ]
        );
      } else {
        // Item doesn't exist in destination godown, create a new record
        await connection.query(
          `INSERT INTO ccms_godown_stock (
            CM_Godown_ID,
            CM_Product_ID,
            CM_Item_ID,
            CM_Quantity,
            CM_Created_By,
            CM_Created_At,
            CM_Uploaded_By,
            CM_Uploaded_At
          ) VALUES (?, ?, ?, CAST(? AS DECIMAL(15,2)), ?, NOW(), ?, NOW())`,
          [
            destinationGodownId,
            productId,
            itemId,
            transferQuantity.toFixed(2), // Ensure 2 decimal places
            createdBy,
            createdBy
          ]
        );
      }

      // 4. Update the item_master table if needed
      try {
        // Try to update the item's overall stock level if CM_Stock_Level exists
        await connection.query(
          `UPDATE ccms_item_master 
           SET CM_Stock_Level = (
             SELECT SUM(CM_Quantity) 
             FROM ccms_godown_stock 
             WHERE CM_Item_ID = ?
           )
           WHERE CM_Item_ID = ?`,
          [itemId, itemId]
        );
      } catch (error) {
        console.warn('Could not update item_master, but transfer completed:', error.message);
        // Continue without failing the whole transaction
      }

      // Commit transaction
      await connection.query('COMMIT');

      const res = NextResponse.json({
        success: true,
        message: 'Stock transfer completed successfully',
        transferDate: currentDateTime,
        transferredQuantity: transferQuantity.toFixed(2) // Return formatted quantity
      });
      res.headers.set('Cache-Control', 'no-store');
      return res;
    } catch (error) {
      // Rollback in case of error
      await connection.query('ROLLBACK');
      console.error('Transaction error:', error);
      throw error;
    }
  } catch (error) {
    console.error('API error:', error);
    const res = NextResponse.json({
      success: false,
      message: 'Failed to transfer stock',
      error: (error as Error).message
    }, { status: 500 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}