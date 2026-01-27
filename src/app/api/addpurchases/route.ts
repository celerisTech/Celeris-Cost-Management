import { NextResponse } from 'next/server';
import getDb from '../../utils/db';
import type { ResultSetHeader } from 'mysql2';

// Helper function to generate sequential batch IDs
async function getNextBatchId(connection: { query: (arg0: string) => PromiseLike<[any]> | [any]; }) {
  try {
    const [results] = await connection.query(`
      SELECT CM_Batch_ID 
      FROM ccms_godown_stock_batches 
      WHERE CM_Batch_ID LIKE 'BATCH%' 
      ORDER BY CM_Batch_ID DESC 
      LIMIT 1
    `);

    if (!results || results.length === 0) {
      return 'BATCH001';
    }

    const lastId = results[0].CM_Batch_ID;
    const matches = lastId.match(/BATCH(\d+)/);

    if (!matches || matches.length < 2) {
      return 'BATCH001';
    }

    const lastNumber = parseInt(matches[1], 10);
    const nextNumber = lastNumber + 1;

    return `BATCH${nextNumber.toString().padStart(3, '0')}`;
  } catch (error) {
    console.error('Error generating batch ID:', error);
    return `BATCH${Date.now().toString().slice(-6)}`;
  }
}

export async function POST(request: Request) {
  let connection = null;

  try {
    const db = await getDb();
    connection = await db.getConnection();
    await connection.beginTransaction();

    const body = await request.json();

    const {
      CM_Supplier_ID,
      CM_Purchase_Date,
      CM_Tax_Type,
      CM_Tax_Percentage,
      CM_Advance_Payment = 0,
      CM_Bill_Number,
      CM_Round_off = 0,
      CM_Payment_Terms,
      CM_Delivery_Location,
      CM_Delivery_Date,
      CM_Created_By,
      user, // Get user object from request
      products
    } = body;

    // -------- Validation --------
    if (
      !CM_Supplier_ID ||
      !CM_Purchase_Date ||
      !CM_Tax_Type ||
      CM_Tax_Percentage == null ||
      !CM_Bill_Number ||
      !Array.isArray(products) ||
      products.length === 0 ||
      !user ||
      !user.CM_Company_ID
    ) {
      const res = NextResponse.json(
        {
          message: 'Missing required fields: purchase-level fields, products array, or user company ID',
          details: {
            hasSupplier: !!CM_Supplier_ID,
            hasDate: !!CM_Purchase_Date,
            hasTaxType: !!CM_Tax_Type,
            hasTaxPercentage: CM_Tax_Percentage != null,
            hasBillNumber: !!CM_Bill_Number,
            hasProducts: Array.isArray(products) && products.length > 0,
            hasUser: !!user,
            hasCompanyId: user?.CM_Company_ID
          }
        },
        { status: 400 }
      );
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    // Get company ID from user object
    const CM_Company_ID = user.CM_Company_ID;

    for (const [index, product] of products.entries()) {
      const requiredFields = [
        'CM_Product_Name',
        'CM_Unit_Price',
        'CM_Unit_Type',
        'CM_Quantity'
      ];
      const missingFields = requiredFields.filter(field => !product[field]);
      if (missingFields.length > 0) {
        const res = NextResponse.json(
          {
            message: `Missing required fields for product at index ${index}`,
            missingFields
          },
          { status: 400 }
        );
        res.headers.set('Cache-Control', 'no-store');
        return res;
      }
    }

    // -------- Totals Calculation --------
    let subtotal = 0;

    for (const product of products) {
      const unitPrice = parseFloat(product.CM_Unit_Price) || 0;
      const quantity = parseFloat(product.CM_Quantity) || 0;
      const discountAmount = parseFloat(product.CM_Discount_Amount) || 0;

      const productTotal = unitPrice * quantity;
      subtotal += productTotal - discountAmount;
    }

    const taxPercentage = parseFloat(CM_Tax_Percentage);
    const taxAmount = (subtotal * taxPercentage) / 100;
    let grandTotal = subtotal + taxAmount;

    // Apply round-off
    const roundOff = parseFloat(CM_Round_off) || 0;
    grandTotal = Math.round((grandTotal + roundOff) * 100) / 100;
    const actualRoundOff = grandTotal - (subtotal + taxAmount);

    const advancePayment = parseFloat(CM_Advance_Payment) || 0;
    const balancePayment = grandTotal - advancePayment;

    // -------- Insert Purchase Summary --------
    // Insert Purchase Summary - Ensure CM_Delivery_Date is handled as a date
    const [summaryResult] = await connection.query(`
      INSERT INTO ccms_purchase_summary (
        CM_Supplier_ID, CM_Company_ID, CM_Bill_Number,
        CM_Tax_Type, CM_Tax_Percentage, CM_Tax_Amount, CM_Payment_Terms,
        CM_Grand_Total, CM_Advance_Payment, CM_Balance_Payment,
        CM_Delivery_Location, CM_Delivery_Date, CM_Round_off,
        CM_Created_By, CM_Created_At
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      CM_Supplier_ID,
      CM_Company_ID,
      CM_Bill_Number,
      CM_Tax_Type,
      taxPercentage,
      taxAmount,
      CM_Payment_Terms,
      grandTotal,
      advancePayment,
      balancePayment,
      CM_Delivery_Location,
      CM_Delivery_Date, // This should be passed as is without time
      actualRoundOff,
      CM_Created_By
    ]);


    const purchaseSummaryId = summaryResult.insertId;
    const insertedIds = [];
    const batchIds = [];

    // -------- Insert Each Product & Update Stock --------
    for (const product of products) {
      const unitPrice = parseFloat(product.CM_Unit_Price);
      const quantity = parseInt(product.CM_Quantity, 10);
      const discountPercentage = parseFloat(product.CM_Discount_Percentage) || 0;
      const discountAmount = parseFloat(product.CM_Discount_Amount) || 0;

      const netPrice = (unitPrice * quantity) - discountAmount;
      const productTaxAmount = (netPrice * taxPercentage) / 100;
      const productGrandTotal = netPrice + productTaxAmount;

      let CM_Item_ID = product.CM_Item_ID;


      // 1️⃣ If item doesn't exist, insert it
      if (!CM_Item_ID) {
        const [itemResult] = await connection.query(`
          INSERT INTO ccms_item_master
          (CM_Item_Code, CM_Item_Name,
           CM_Unit_Type, CM_Stock_Level, CM_HSN_ASC_Code, CM_Is_Status,
           CM_Company_ID, CM_Created_By, CM_Created_At)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `, [
          `ITEM-${Date.now()}`, // generate a code
          product.CM_Product_Name,
          product.CM_Unit_Type,
          quantity, // initial stock = purchased quantity
          product.CM_HSN_ASC_Code || null,
          'Active',
          CM_Company_ID,
          CM_Created_By
        ]);
        CM_Item_ID = itemResult.insertId;
      }
      else {
        // 2️⃣ Update existing stock
        await connection.query(`
          UPDATE ccms_item_master
          SET CM_Stock_Level = CM_Stock_Level + ?
          WHERE CM_Item_ID = ?
        `, [quantity, CM_Item_ID]);
      }

      const [productResult] = await connection.query(`
        INSERT INTO ccms_purchase (
          CM_Company_ID, CM_Godown_ID, CM_Bill_Number,
          CM_Product_Name, CM_Supplier_ID, CM_Item_ID,
          CM_Unit_Price, CM_Discount_Percentage, CM_Discount_Amount, CM_Net_Price,
          CM_Quantity, CM_Unit_Type, CM_Total_Price, CM_Payment_Terms,
          CM_Purchase_Date, CM_Status, CM_HSN_ASC_Code, CM_Tax_Type,
          CM_Tax_Percentage, CM_Tax_Amount, CM_Grand_Total, CM_Delivery_Location,
          CM_Delivery_Date, CM_Payment_Status, CM_Is_Status, CM_Advance_Payment,
          CM_Balance_Payment, CM_Round_off, CM_Created_By, CM_Created_At, CM_Image_URL
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
      `, [
        CM_Company_ID,
        product.CM_Godown_ID,
        CM_Bill_Number,
        product.CM_Product_Name,
        CM_Supplier_ID,
        CM_Item_ID,
        unitPrice,
        discountPercentage,
        discountAmount,
        netPrice,
        quantity,
        product.CM_Unit_Type,
        netPrice,
        CM_Payment_Terms,
        CM_Purchase_Date,
        'Pending',
        product.CM_HSN_ASC_Code,
        CM_Tax_Type,
        taxPercentage,
        productTaxAmount,
        productGrandTotal,
        CM_Delivery_Location,
        CM_Delivery_Date,
        'Unpaid',
        'Active',
        advancePayment,
        balancePayment,
        actualRoundOff,
        CM_Created_By,
        body.CM_Image_URL || null  // Add the image URL or null if not present
      ]);

      // Get the ID from the insert result
      const purchaseId = productResult.insertId;
      insertedIds.push(purchaseId);

      // 4️⃣ Create batch entry in godown stock batches
      const batchId = await getNextBatchId(connection);

      await connection.query(`
        INSERT INTO ccms_godown_stock_batches (
          CM_Batch_ID, 
          CM_Godown_ID,
          CM_Product_ID,
          CM_Item_ID,
          CM_Quantity_Remaining,
          CM_Unit_Price,
          CM_Purchase_Date,
          CM_Created_By,
          CM_Created_At
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        batchId,
        product.CM_Godown_ID,
        product.CM_Product_ID,
        CM_Item_ID,
        quantity,
        unitPrice,
        CM_Purchase_Date,
        CM_Created_By
      ]);


      batchIds.push(batchId);

      // 5️⃣ Check if we need to update or insert into godown stock
      const [existingStock] = await connection.query(`
        SELECT CM_Quantity 
        FROM ccms_godown_stock 
        WHERE CM_Godown_ID = ? AND CM_Item_ID = ?
      `, [product.CM_Godown_ID, CM_Item_ID]);

      if (existingStock && existingStock.length > 0) {
        // Update existing stock
        await connection.query(`
          UPDATE ccms_godown_stock 
          SET CM_Quantity = CM_Quantity + ?, 
              CM_Uploaded_By = ?, 
              CM_Uploaded_At = NOW() 
          WHERE CM_Godown_ID = ? AND CM_Item_ID = ?
        `, [quantity, CM_Created_By, product.CM_Godown_ID, CM_Item_ID]);
      } else {
        // Insert new stock entry
        await connection.query(`
          INSERT INTO ccms_godown_stock (
            CM_Godown_ID,
            CM_Product_ID,
            CM_Item_ID,
            CM_Quantity,
            CM_Created_By,
            CM_Created_At,
            CM_Uploaded_By,
            CM_Uploaded_At
          ) VALUES (?, ?, ?, ?, ?, NOW(), ?, NOW())
        `, [
          product.CM_Godown_ID,
          purchaseId,
          CM_Item_ID,
          quantity,
          CM_Created_By,
          CM_Created_By
        ]);
      }
    }

    await connection.commit();

    const res = NextResponse.json(
      {
        success: true,
        purchaseSummaryId,
        insertedIds,
        batchIds,
        grandTotal,
        companyId: CM_Company_ID
      },
      { status: 201 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;

  } catch (error) {
    console.error('Database error:', error);

    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Rollback error:', rollbackError);
      }
    }

    const res = NextResponse.json(
      {
        message: 'Database operation failed',
        error: error.message,
        ...(error.sqlMessage && { sqlMessage: error.sqlMessage })
      },
      { status: 500 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}
