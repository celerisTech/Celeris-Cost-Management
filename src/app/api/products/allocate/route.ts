import { NextResponse, NextRequest } from 'next/server';
import getDb from '@/app/utils/db';
import { RowDataPacket, OkPacket } from 'mysql2';

/** ---------- helpers ---------- */

function getErrorMessage(err: any): string {
  if (typeof err === 'string') return err;
  if (err?.message) return err.message;
  if (err?.sqlMessage) return err.sqlMessage;
  if (err?.code) return `Database error: ${err.code}`;
  try { return JSON.stringify(err); } catch { return 'Unknown error'; }
}

function getErrorStatusCode(error: any): number {
  if (error?.code === 'ER_DUP_ENTRY') return 409;
  if (error?.code === 'ER_NO_REFERENCED_ROW_2') return 400;
  if (error?.code === 'ER_BAD_FIELD_ERROR') return 400;
  if (error?.code === 'ER_PARSE_ERROR') return 400;
  if (error?.code === 'ECONNREFUSED') return 503;
  if (error?.code === 'PROTOCOL_CONNECTION_LOST') return 503;
  return 500;
}

// Generate transaction ID
async function generateNextTransactionId(db: any): Promise<string> {
  try {
    const [rows] = await db.query(
      `SELECT CM_Transaction_ID FROM ccms_product_transaction ORDER BY CM_Created_At DESC LIMIT 1`
    ) as RowDataPacket[];

    if (rows && rows.length) {
      const lastId = rows[0].CM_Transaction_ID;
      const n = parseInt((lastId || '').replace('TXN', '')) || 0;
      return `TXN${String(n + 1).padStart(6, '0')}`;
    }

    return 'TXN000001';
  } catch {
    return `TXN${Date.now().toString().slice(-6)}`;
  }
}

// Generate batch ID
async function generateNextBatchId(connection: any): Promise<string> {
  try {
    const [rows] = await connection.execute(
      `SELECT CM_Batch_ID FROM ccms_godown_stock_batches ORDER BY CM_Created_At DESC LIMIT 1`
    ) as RowDataPacket[];

    if (rows && rows.length) {
      const lastId = rows[0].CM_Batch_ID;
      const n = parseInt((lastId || '').replace('BATCH', '')) || 0;
      return `BATCH${String(n + 1).padStart(6, '0')}`;
    }

    return 'BATCH000001';
  } catch {
    return `BATCH${Date.now().toString().slice(-6)}`;
  }
}

// Generate request ID
async function generateRequestId(connection: any): Promise<string> {
  try {
    const [rows] = await connection.execute(
      `SELECT CM_Request_ID FROM ccms_product_allocation_requests ORDER BY CM_Created_At DESC LIMIT 1`
    ) as RowDataPacket[];

    if (rows && rows.length) {
      const lastId = rows[0].CM_Request_ID;
      const n = parseInt((lastId || '').replace('REQ', '')) || 0;
      return `REQ${String(n + 1).padStart(6, '0')}`;
    }

    return `REQ${Date.now().toString().slice(-8)}`;
  } catch {
    return `REQ${Date.now().toString().slice(-8)}`;
  }
}

// Check if column exists in a table
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

// Update Item Master Stock Level
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
      newStockLevel = current + quantityChange;
    } else {
      newStockLevel = current - quantityChange;
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

    if (updateResult.affectedRows === 0) {
      throw new Error(`Failed to update stock level for item: ${itemId}`);
    }

    console.log(`✅ Updated item master stock: ${itemName} (${itemId}) - ${current} → ${newStockLevel}`);

  } catch (error) {
    console.error('❌ Error updating item master stock:', error);
    throw error;
  }
}

/** ---------- GET: Fetch available products from item master ---------- */
export async function GET(request: NextRequest) {
  let db: any = null;
  try {
    db = await getDb();
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const godownId = searchParams.get('godownId');
    const categoryId = searchParams.get('categoryId');
    const subcategoryId = searchParams.get('subcategoryId');
    const search = searchParams.get('search');
    const requestId = searchParams.get('requestId');

    // Log search parameters for debugging
    console.log('Product allocation search params:', {
      categoryId,
      subcategoryId,
      search,
      companyId,
      godownId,
      requestId
    });

    // Basic query to get items from item master
    let query = `
      SELECT
          im.CM_Item_ID,
          im.CM_Item_Code,
          im.CM_Item_Name,
          im.CM_Category_ID,
          im.CM_Subcategory_ID,
          im.CM_Company_ID,
          im.CM_Unit_Type AS Item_Unit_ID,
          ut.CM_Unit_Name AS Item_Unit_Name,
          im.CM_Stock_Level AS available_stock,
          cat.CM_Category_Name,
          subcat.CM_Subcategory_Name,
          comp.CM_Company_Name,
          CASE
              WHEN im.CM_Stock_Level <= 0 THEN 'Out of Stock'
              WHEN im.CM_Stock_Level <= 10 THEN 'Low Stock'
              ELSE 'In Stock'
          END AS stock_status
      FROM ccms_item_master im
      LEFT JOIN ccms_category cat 
          ON im.CM_Category_ID = cat.CM_Category_ID
      LEFT JOIN ccms_subcategory subcat 
          ON im.CM_Subcategory_ID = subcat.CM_Subcategory_ID
      LEFT JOIN ccms_companies comp 
          ON im.CM_Company_ID = comp.CM_Company_ID
      LEFT JOIN ccms_unit_type ut 
          ON ut.CM_Unit_ID = im.CM_Unit_Type
      WHERE im.CM_Is_Status = 'Active'
    `;

    const params = [];

    if (companyId) {
      query += ` AND im.CM_Company_ID = ?`;
      params.push(companyId);
    }

    if (categoryId) {
      query += ` AND im.CM_Category_ID = ?`;
      params.push(categoryId);
    }

    if (subcategoryId) {
      query += ` AND im.CM_Subcategory_ID = ?`;
      params.push(subcategoryId);
    }

    if (search && search.trim()) {
      const searchPattern = `%${search.trim()}%`;
      query += ` AND (im.CM_Item_Name LIKE ? OR im.CM_Item_Code LIKE ? OR cat.CM_Category_Name LIKE ? OR subcat.CM_Subcategory_Name LIKE ?)`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    query += ` ORDER BY im.CM_Item_Name ASC`;

    console.log('Executing query with parameters:', { query, params });
    const [items] = await db.query(query, params) as [RowDataPacket[], any];
    console.log(`Query returned ${items.length} items`);

    // If a specific request ID is provided, get the requested items too
    let requestItems = [];
    if (requestId) {
      const [reqItems] = await db.query(`
        SELECT 
          ri.CM_Item_Master_ID as CM_Item_ID,
          ri.CM_Requested_Quantity,
          ri.CM_Status,
          ri.CM_Notes
        FROM ccms_product_allocation_request_items ri
        WHERE ri.CM_Request_ID = ?
      `, [requestId]) as [RowDataPacket[], any];

      requestItems = Array.isArray(reqItems) ? reqItems : [];
    }

    // For each item, get the available batches from godown stock
    const itemsWithBatches = [];

    for (const item of items) {
      const [batches] = await db.query(`
        SELECT
          b.CM_Batch_ID,
          b.CM_Godown_ID,
          b.CM_Product_ID,
          b.CM_Quantity_Remaining,
          b.CM_Unit_Price,
          b.CM_Purchase_Date,
          g.CM_Godown_Name,
          g.CM_Location
        FROM ccms_godown_stock_batches b
        LEFT JOIN ccms_godown g ON b.CM_Godown_ID = g.CM_Godown_ID
        WHERE b.CM_Item_ID = ? AND b.CM_Quantity_Remaining > 0
        ${godownId ? 'AND b.CM_Godown_ID = ?' : ''}
        ORDER BY b.CM_Purchase_Date ASC
      `, godownId ? [item.CM_Item_ID, godownId] : [item.CM_Item_ID]) as RowDataPacket[];

      // Find if this item was requested (for request-specific view)
      const requestedItem = requestId ?
        requestItems.find(ri => ri.CM_Item_ID === item.CM_Item_ID) : null;

      itemsWithBatches.push({
        ...item,
        batches: batches || [],
        total_batch_quantity: batches.reduce((sum, b) => sum + Number(b.CM_Quantity_Remaining), 0),
        requested_quantity: requestedItem ? Number(requestedItem.CM_Requested_Quantity) : 0,
        request_status: requestedItem ? requestedItem.CM_Status : null,
        request_notes: requestedItem ? requestedItem.CM_Notes : null
      });
    }

    const res = NextResponse.json({
      success: true,
      data: {
        products: itemsWithBatches,
        filters: { companyId, godownId, categoryId, subcategoryId, search, requestId }
      },
      count: itemsWithBatches.length,
      message: `Found ${itemsWithBatches.length} products with stock information`
    });
    res.headers.set('Cache-Control', 'no-store');
    return res;

  } catch (error: any) {
    console.error('Error in products/allocate GET:', error);
    const res = NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch available products',
        details: getErrorMessage(error)
      },
      { status: getErrorStatusCode(error) }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}

/** ---------- POST: Allocate products with automatic FIFO batch distribution ---------- */
export async function POST(request: Request) {
  const method = new URL(request.url).searchParams.get("_method");
  if (method === "PUT") return PUT(request);
  if (method === "PATCH") return PATCH(request);

  let connection: any = null;

  try {
    console.log('🚀 POST /api/products/allocate - Starting FIFO batch allocation process');

    // Parse request body with better error handling
    let body: { project_id?: any; projectId?: any; items?: any; products?: any; selectedProducts?: any; user_id?: any; userId?: any; engineer_id?: any; engineerId?: any; user_name?: any; userName?: any; engineer_name?: any; engineerName?: any; request_id?: any; requestId?: any; notes?: any; allocation_type?: any; allocationType?: any; is_additional?: any; isAdditional?: any; };
    try {
      const rawBody = await request.text();
      console.log('📄 Raw request body:', rawBody.substring(0, 500));
      body = JSON.parse(rawBody);
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      const res = NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON in request body',
          details: parseError instanceof Error ? parseError.message : 'Unknown parsing error'
        },
        { status: 400 }
      );
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    console.log('📦 Parsed request body:', body);

    // Normalize the request body to handle different input formats
    // For example, accept both "items" and "products" arrays
    const normalizedBody = {
      project_id: body.project_id || body.projectId,
      items: body.items || body.products || body.selectedProducts || [], // Add selectedProducts here
      user_id: body.user_id || body.userId || body.engineer_id || body.engineerId,
      user_name: body.user_name || body.userName || body.engineer_name || body.engineerName,
      request_id: body.request_id || body.requestId,
      notes: body.notes,
      allocation_type: body.allocation_type || body.allocationType || 'Godown',
      is_additional: body.is_additional || body.isAdditional || false
    };

    console.log('🔄 Normalized request body:', normalizedBody);

    // Validate required fields with detailed error messages
    const missingFields = [];
    if (!normalizedBody.project_id) missingFields.push('project_id');
    if (!Array.isArray(normalizedBody.items) || normalizedBody.items.length === 0) missingFields.push('items (non-empty array)');
    if (!normalizedBody.user_id) missingFields.push('user_id');

    if (missingFields.length > 0) {
      const res = NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          missing: missingFields,
          provided: Object.keys(body),
          help: 'Required format: { project_id (or projectId), items/products/selectedProducts: [{ item_id, quantity }], user_id (or userId) }'
        },
        { status: 400 }
      );
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    // Normalize the items array - support various field naming conventions
    const normalizedItems = normalizedBody.items.map(item => ({
      item_id: item.item_id || item.itemId || item.CM_Item_ID,
      quantity: Number(item.quantity || item.qty || item.CM_Quantity),
      notes: item.notes || item.specific_notes || item.CM_Notes || null,
      unit_type: item.unit_type || item.CM_Unit_Type,
      category_id: item.category_id || item.CM_Category_ID,
      subcategory_id: item.subcategory_id || item.CM_Subcategory_ID,
      company_id: item.company_id || item.CM_Company_ID,
      product_name: item.product_name || item.CM_Product_Name || item.CM_Item_Name
    }));

    console.log('🔄 Normalized items:', normalizedItems);

    // Validate each item in the array
    const invalidItems = normalizedItems.filter(item => {
      return !item.item_id || isNaN(item.quantity) || item.quantity <= 0;
    });

    if (invalidItems.length > 0) {
      const res = NextResponse.json(
        {
          success: false,
          error: 'Invalid items in the array',
          invalid_items: invalidItems,
          help: 'Each item must have item_id and a positive quantity'
        },
        { status: 400 }
      );
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    // Get database connection
    const db = await getDb();
    connection = await db.getConnection();
    await connection.beginTransaction();

    // Get project details
    let projectName = '';
    try {
      const [projectData] = await connection.query(`
        SELECT CM_Project_Name
        FROM ccms_projects
        WHERE CM_Project_ID = ?
        LIMIT 1
      `, [normalizedBody.project_id]);

      if (projectData && projectData.length > 0) {
        projectName = projectData[0].CM_Project_Name;
      }
    } catch (e) {
      console.warn('⚠️ Could not fetch project details:', e);
    }

    // Generate transaction ID for the allocation
    const transactionId = await generateNextTransactionId(connection);

    // Process each item with automatic batch distribution
    const allocatedItems = [];
    let totalAllocationValue = 0;

    // Track items for Item Master update - consolidate by Item ID
    const itemMasterUpdates = new Map();

    for (const item of normalizedItems) {
      // Create a savepoint for this item
      const savePointName = `item_${allocatedItems.length}`;
      await connection.query(`SAVEPOINT ${savePointName}`);

      try {
        const {
          item_id,
          quantity: requestedQuantity,
          notes: itemNotes
        } = item;

        // Skip zero quantity allocations
        if (requestedQuantity <= 0) {
          console.log(`⚠️ Skipping zero quantity allocation for item ${item_id}`);
          continue; // Skip to next item
        }

        // Get available batches for this item in FIFO order (oldest first)
        const [rawBatches] = await connection.query(`
          SELECT 
            b.CM_Batch_ID,
            b.CM_Godown_ID,
            b.CM_Product_ID,
            b.CM_Item_ID,
            b.CM_Quantity_Remaining,
            b.CM_Unit_Price,
            b.CM_Purchase_Date,
            g.CM_Godown_Name,
            im.CM_Item_Name,
            im.CM_Category_ID,
            im.CM_Subcategory_ID,
            im.CM_Company_ID,
            im.CM_Unit_Type,
            p.CM_Supplier_ID
          FROM ccms_godown_stock_batches b
          JOIN ccms_item_master im ON b.CM_Item_ID = im.CM_Item_ID
          LEFT JOIN ccms_godown g ON b.CM_Godown_ID = g.CM_Godown_ID
          LEFT JOIN ccms_purchase p ON b.CM_Product_ID = p.CM_Product_ID
          WHERE b.CM_Item_ID = ? AND b.CM_Quantity_Remaining > 0
          ORDER BY b.CM_Purchase_Date ASC, b.CM_Unit_Price ASC
        `, [item_id]);

        // Ensure we have an array to work with
        const availableBatches = Array.isArray(rawBatches) ? rawBatches : [];

        if (!availableBatches.length) {
          await connection.rollback();
          const res = NextResponse.json(
            {
              success: false,
              error: 'No available batches found for this item',
              item_id,
              item_name: item.product_name || 'Unknown'
            },
            { status: 404 }
          );
          res.headers.set('Cache-Control', 'no-store');
          return res;
        }

        // Calculate total available quantity across all batches
        const totalAvailable = availableBatches.reduce(
          (sum, batch) => sum + Number(batch.CM_Quantity_Remaining), 0
        );

        if (totalAvailable < requestedQuantity) {
          await connection.rollback();
          const res = NextResponse.json(
            {
              success: false,
              error: 'Insufficient total quantity available',
              item_id,
              requested: requestedQuantity,
              available: totalAvailable,
              item_name: availableBatches[0].CM_Item_Name || item.product_name
            },
            { status: 400 }
          );
          res.headers.set('Cache-Control', 'no-store');
          return res;
        }

        // Start allocating from batches following FIFO
        let remainingToAllocate = requestedQuantity;
        let batchAllocations = [];
        let totalItemValue = 0;
        let itemName = '';
        let unitType = '';
        let categoryId = '';
        let subcategoryId = '';
        let companyId = '';
        let supplierId = '';

        for (const batch of availableBatches) {
          if (remainingToAllocate <= 0) break;

          // Get details from first batch for item information
          if (batchAllocations.length === 0) {
            itemName = batch.CM_Item_Name;
            unitType = batch.CM_Unit_Type || item.unit_type;
            categoryId = batch.CM_Category_ID || item.category_id;
            subcategoryId = batch.CM_Subcategory_ID || item.subcategory_id;
            companyId = batch.CM_Company_ID || item.company_id;
            supplierId = batch.CM_Supplier_ID;
          }

          const batchId = batch.CM_Batch_ID;
          const availableInBatch = Number(batch.CM_Quantity_Remaining);
          const unitPrice = Number(batch.CM_Unit_Price);
          const godownId = batch.CM_Godown_ID;
          const godownName = batch.CM_Godown_Name;
          const productId = batch.CM_Product_ID;

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
            godown_id: godownId,
            godown_name: godownName,
            product_id: productId
          });

          // Update godown stock
          try {
            const [stockRows] = await connection.query(`
              SELECT CM_Quantity 
              FROM ccms_godown_stock 
              WHERE CM_Godown_ID = ? AND CM_Item_ID = ?
            `, [godownId, item_id]) as RowDataPacket[];

            if (stockRows && stockRows.length > 0) {
              await connection.query(`
                UPDATE ccms_godown_stock 
                SET CM_Quantity = CM_Quantity - ?, 
                    CM_Uploaded_By = ?, 
                    CM_Uploaded_At = NOW() 
                WHERE CM_Godown_ID = ? AND CM_Item_ID = ?
              `, [allocateFromBatch, normalizedBody.user_id, godownId, item_id]);
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
                productId,
                item_id,
                -allocateFromBatch,
                normalizedBody.user_id
              ]);
            }
          } catch (stockError) {
            console.error(`❌ Error updating godown stock for batch ${batchId}:`, stockError);
            // Continue without failing the transaction
          }

          // Create transaction record for this batch allocation
          await connection.query(`
            INSERT INTO ccms_product_transaction (
              CM_Transaction_ID,
              CM_Company_ID,
              CM_Product_ID,
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
              CM_Created_By,
              CM_Created_At,
              CM_Uploaded_By,
              CM_Uploaded_At
            ) VALUES (?, ?, ?, ?, ?, ?, 'Outward', ?, ?, ?, ?, NOW(), 'Active', ?, NOW(), ?, NOW())
          `, [
            `${transactionId}_${allocatedItems.length}_${batchAllocations.length}`,
            companyId,
            productId,
            godownId,
            null, // No receiving godown for project allocation
            item_id,
            allocateFromBatch,
            unitType,
            `PROJ_ALLOC_${normalizedBody.project_id}`,
            `Allocated ${allocateFromBatch} ${unitType} from batch ${batchId} to project ${projectName || normalizedBody.project_id}. ${itemNotes || ''}`,
            normalizedBody.user_id,
            normalizedBody.user_id
          ]);

          totalItemValue += batchValue;
          remainingToAllocate -= allocateFromBatch;
        }

        // Track for Item Master update - aggregate by item_id
        if (!itemMasterUpdates.has(item_id)) {
          itemMasterUpdates.set(item_id, {
            item_id,
            item_name: itemName,
            total_quantity: 0
          });
        }

        const itemUpdate = itemMasterUpdates.get(item_id);
        itemUpdate.total_quantity += requestedQuantity;

        // Check if product already exists in project products
        const [existingProduct] = await connection.query(`
          SELECT CM_Product_ID, CM_Quantity, CM_Total_Price 
          FROM ccms_project_products 
          WHERE CM_Project_ID = ? AND CM_Product_ID = ?
        `, [normalizedBody.project_id, item_id]) as RowDataPacket[];

        // Calculate weighted average price for this allocation
        const weightedAvgPrice = totalItemValue / requestedQuantity;

        if (existingProduct && existingProduct.length > 0) {
          // Update existing product
          const existing = existingProduct[0];
          const newQuantity = Number(existing.CM_Quantity) + requestedQuantity;
          const newTotalPrice = Number(existing.CM_Total_Price) + totalItemValue;

          // Check if CM_Notes column exists in the table
          const hasNotesColumn = await columnExists(connection, 'ccms_project_products', 'CM_Notes');

          if (hasNotesColumn) {
            await connection.query(`
              UPDATE ccms_project_products 
              SET CM_Quantity = ?,
                  CM_Total_Price = ?,
                  CM_Uploaded_By = ?,
                  CM_Uploaded_At = NOW(),
                  CM_Notes = CONCAT(IFNULL(CM_Notes, ''), ' | ', ?)
              WHERE CM_Project_ID = ? AND CM_Product_ID = ?
            `, [
              newQuantity,
              newTotalPrice,
              normalizedBody.user_id,
              `Added ${requestedQuantity} from ${batchAllocations.length} batches. ${itemNotes || ''}`,
              normalizedBody.project_id,
              item_id
            ]);
          } else {
            // Update without CM_Notes column
            await connection.query(`
              UPDATE ccms_project_products 
              SET CM_Quantity = ?,
                  CM_Total_Price = ?,
                  CM_Uploaded_By = ?,
                  CM_Uploaded_At = NOW()
              WHERE CM_Project_ID = ? AND CM_Product_ID = ?
            `, [
              newQuantity,
              newTotalPrice,
              normalizedBody.user_id,
              normalizedBody.project_id,
              item_id
            ]);
          }
        } else {
          // Insert new product
          // Check if CM_Notes column exists in the table
          const hasNotesColumn = await columnExists(connection, 'ccms_project_products', 'CM_Notes');

          if (hasNotesColumn) {
            await connection.query(`
              INSERT INTO ccms_project_products (
                CM_Product_ID,
                CM_Product_Name,
                CM_Project_ID,
                CM_Batch_ID,
                CM_Quantity,
                CM_Unit_Price,
                CM_Unit_Type,
                CM_Total_Price,
                CM_Supplier_ID,
                CM_Category_ID,
                CM_Subcategory_ID,
                CM_Company_ID,
                CM_Alloceted_To,
                CM_Notes,
                CM_Created_By,
                CM_Created_At,
                CM_Uploaded_By,
                CM_Uploaded_At
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, NOW())
            `, [
              item_id,
              itemName || item.product_name,
              normalizedBody.project_id,
              batchAllocations[0].batch_id, // Use first batch ID as reference
              requestedQuantity,
              weightedAvgPrice, // Use weighted average price across all batches
              unitType,
              totalItemValue,
              supplierId,
              categoryId,
              subcategoryId,
              companyId,
              normalizedBody.allocation_type,
              `${normalizedBody.is_additional ? 'Additional allocation. ' : ''}${itemNotes || `Allocated from ${batchAllocations.length} batches using FIFO`}`,
              normalizedBody.user_id,
              normalizedBody.user_id
            ]);
          } else {
            // Insert without CM_Notes column
            await connection.query(`
              INSERT INTO ccms_project_products (
                CM_Product_ID,
                CM_Product_Name,
                CM_Project_ID,
                CM_Batch_ID,
                CM_Quantity,
                CM_Unit_Price,
                CM_Unit_Type,
                CM_Total_Price,
                CM_Supplier_ID,
                CM_Category_ID,
                CM_Subcategory_ID,
                CM_Company_ID,
                CM_Alloceted_To,
                CM_Created_By,
                CM_Created_At,
                CM_Uploaded_By,
                CM_Uploaded_At
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, NOW())
            `, [
              item_id,
              itemName || item.product_name,
              normalizedBody.project_id,
              batchAllocations[0].batch_id, // Use first batch ID as reference
              requestedQuantity,
              weightedAvgPrice, // Use weighted average price across all batches
              unitType,
              totalItemValue,
              supplierId,
              categoryId,
              subcategoryId,
              companyId,
              normalizedBody.allocation_type,
              normalizedBody.user_id,
              normalizedBody.user_id
            ]);
          }
        }

        // Add to allocated items
        allocatedItems.push({
          item_id,
          item_name: itemName || item.product_name,
          quantity: requestedQuantity,
          unit_type: unitType,
          weighted_avg_price: weightedAvgPrice,
          total_value: totalItemValue,
          batch_allocations: batchAllocations,
          batch_count: batchAllocations.length,
          notes: itemNotes
        });

        totalAllocationValue += totalItemValue;
      } catch (itemError) {
        // Roll back just this item but continue with others
        await connection.query(`ROLLBACK TO SAVEPOINT ${savePointName}`);
        console.error(`❌ Error processing item ${item.item_id}:`, itemError);
        // Continue with next item
      }
    }

    // Update Item Master stock for all affected items
    for (const [itemId, itemUpdate] of itemMasterUpdates.entries()) {
      try {
        await updateItemMasterStock(
          connection,
          itemId,
          itemUpdate.total_quantity,
          'Outward'
        );
      } catch (updateError) {
        console.error(`❌ Error updating item master for ${itemId}:`, updateError);

        // Try a direct update as fallback
        try {
          await connection.query(`
            UPDATE ccms_item_master 
            SET CM_Stock_Level = CM_Stock_Level - ? 
            WHERE CM_Item_ID = ?
          `, [itemUpdate.total_quantity, itemId]);
          console.log(`✅ Used fallback update for item master: ${itemId}`);
        } catch (fallbackError) {
          console.error(`❌ Fallback update also failed:`, fallbackError);
          // Still continue without failing transaction
        }
      }
    }

    // If this allocation is for a request, update the request status
    if (normalizedBody.request_id) {
      try {
        // Update all request items as approved
        await connection.query(`
          UPDATE ccms_product_allocation_request_items
          SET CM_Status = 'Approved',
              CM_Approved_Quantity = CM_Requested_Quantity,
              CM_Pending_Quantity = 0,
              CM_Notes = ?
          WHERE CM_Request_ID = ?
        `, [
          `Fully allocated on ${new Date().toISOString().split('T')[0]}`,
          normalizedBody.request_id
        ]);

        // Update the request status
        await connection.query(`
          UPDATE ccms_product_allocation_requests
          SET CM_Status = 'Approved',
              CM_Approved_By = ?,
              CM_Approval_Date = NOW(),
              CM_Notes = ?,
              CM_Has_Pending_Items = 0
          WHERE CM_Request_ID = ?
        `, [
          normalizedBody.user_id,
          normalizedBody.notes || `Approved and allocated by ${normalizedBody.user_name || normalizedBody.user_id}`,
          normalizedBody.request_id
        ]);
      } catch (requestUpdateError) {
        console.error('❌ Error updating request status:', requestUpdateError);
        // Continue without failing the transaction
      }
    }

    // Commit the transaction
    await connection.commit();
    console.log('✅ FIFO batch allocation completed successfully');

    const res = NextResponse.json(
      {
        success: true,
        message: `Successfully allocated ${allocatedItems.length} items to project ${projectName || normalizedBody.project_id}`,
        data: {
          transaction_id: transactionId,
          project_id: normalizedBody.project_id,
          project_name: projectName,
          allocated_items: allocatedItems,
          total_items: allocatedItems.length,
          total_allocation_value: totalAllocationValue,
          allocation_date: new Date().toISOString(),
          allocated_by: normalizedBody.user_id,
          allocated_by_name: normalizedBody.user_name,
          request_id: normalizedBody.request_id || null,
          is_additional: normalizedBody.is_additional
        }
      },
      { status: 201 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;

  } catch (error: any) {
    console.error('💥 Error in FIFO batch allocation:', error);

    if (connection) {
      try {
        await connection.rollback();
        console.log('🔄 Transaction rolled back');
      } catch (rollbackError) {
        console.error('❌ Rollback error:', rollbackError);
      }
    }

    const res = NextResponse.json(
      {
        success: false,
        error: 'Failed to allocate products',
        details: process.env.NODE_ENV === 'development' ? getErrorMessage(error) : 'Internal server error'
      },
      { status: getErrorStatusCode(error) }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } finally {
    if (connection) {
      try {
        connection.release();
        console.log('🔌 Database connection released');
      } catch (releaseError) {
        console.error('❌ Connection release error:', releaseError);
      }
    }
  }
}

/**
 * PATCH: Create a request for product allocation (to be approved later)
 */
export async function PATCH(request: Request) {
  let connection: any = null;

  try {
    console.log('🚀 PATCH /api/products/allocate - Starting product allocation request process');

    // ----------------------------
    // Parse & validate request body
    // ----------------------------
    let body;
    try {
      const rawBody = await request.text();
      body = JSON.parse(rawBody);
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const normalizedBody = {
      project_id: body.project_id || body.projectId,
      items: body.items || body.products || [],
      user_id: body.user_id || body.userId,
      user_name: body.user_name || body.userName,
      notes: body.notes || '',
      requested_date: body.requested_date || new Date().toISOString().split('T')[0],
    };

    if (!normalizedBody.project_id || !normalizedBody.user_id || !Array.isArray(normalizedBody.items) || normalizedBody.items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const normalizedItems = normalizedBody.items.map(item => ({
      item_id: item.item_id || item.itemId,
      product_id: item.product_id || item.productId || item.item_id,
      quantity: Number(item.quantity),
      notes: item.notes || null,
      unit_type: item.unit_type || 'Unit',
      unit_price: item.unit_price || 0,
    }));

    // ----------------------------
    // Begin DB Transaction
    // ----------------------------
    const db = await getDb();
    connection = await db.getConnection();
    await connection.beginTransaction();

    // ----------------------------
    // Insert parent request
    // ----------------------------
    const [insertResult] = await connection.query(`
      INSERT INTO ccms_product_allocation_requests (
        CM_Project_ID,
        CM_Requested_By,
        CM_Request_Date,
        CM_Status,
        CM_Notes,
        CM_Created_At,
        CM_Has_Pending_Items
      ) VALUES (?, ?, NOW(), 'Pending', ?, NOW(), 1)
    `, [
      normalizedBody.project_id,
      normalizedBody.user_id,
      normalizedBody.notes
    ]);

    // 🟢 Fetch the trigger-generated CM_Request_ID (safe method)
    const [requestRow] = await connection.query(`
      SELECT CM_Request_ID 
      FROM ccms_product_allocation_requests
      WHERE CM_Project_ID = ? AND CM_Requested_By = ?
      ORDER BY CM_Created_At DESC
      LIMIT 1
    `, [normalizedBody.project_id, normalizedBody.user_id]);

    if (!requestRow || requestRow.length === 0) {
      throw new Error("Failed to fetch generated request ID");
    }

    const requestId = requestRow[0].CM_Request_ID;
    console.log("📋 Using Request ID:", requestId);

    // ----------------------------
    // Insert child request items
    // ----------------------------
    const requestedItems = [];

    for (const item of normalizedItems) {
      let unitType = item.unit_type;
      let currentStock = 0;
      let itemName = '';

      try {
        const [itemDetails] = await connection.query(`
          SELECT CM_Item_Name, CM_Unit_Type, CM_Stock_Level
          FROM ccms_item_master
          WHERE CM_Item_ID = ?
        `, [item.item_id]);

        if (itemDetails && itemDetails.length > 0) {
          itemName = itemDetails[0].CM_Item_Name;
          unitType = itemDetails[0].CM_Unit_Type || unitType;
          currentStock = Number(itemDetails[0].CM_Stock_Level) || 0;
        }
      } catch (err) {
        console.warn(`⚠️ Could not fetch details for item ${item.item_id}`);
      }

      const availableQty = currentStock;
      const shortageQty = Math.max(0, item.quantity - availableQty);
      const pendingQty = item.quantity;
      const itemStatus = 'Pending';

      await connection.query(`
        INSERT INTO ccms_product_allocation_request_items (
          CM_Request_ID,
          CM_Product_ID,
          CM_Item_Master_ID,
          CM_Requested_Quantity,
          CM_Available_Quantity,
          CM_Shortage_Quantity,
          CM_Unit_Type,
          CM_Unit_Price,
          CM_Status,
          CM_Approved_Quantity,
          CM_Pending_Quantity,
          CM_Notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
      `, [
        requestId,
        item.product_id,
        item.item_id,
        item.quantity,
        availableQty,
        shortageQty,
        unitType,
        item.unit_price,
        itemStatus,
        pendingQty,
        `${item.notes || 'Requested from product selection screen'}${itemName ? ' | Item: ' + itemName : ''}`
      ]);

      requestedItems.push({
        item_id: item.item_id,
        product_id: item.product_id,
        item_name: itemName,
        quantity: item.quantity,
        status: itemStatus,
        unit_type: unitType,
        available_stock: availableQty,
        shortage: shortageQty,
        notes: item.notes
      });
    }

    // ----------------------------
    // Commit transaction
    // ----------------------------
    await connection.commit();

    return NextResponse.json({
      success: true,
      message: `Successfully created request with ${requestedItems.length} items`,
      data: {
        request_id: requestId,
        project_id: normalizedBody.project_id,
        requested_by: normalizedBody.user_id,
        requested_by_name: normalizedBody.user_name,
        status: "Pending",
        requested_date: normalizedBody.requested_date,
        items: requestedItems,
        notes: normalizedBody.notes
      }
    }, { status: 201 });

  } catch (error: any) {
    if (connection) {
      await connection.rollback();
    }
    return NextResponse.json(
      { error: 'Failed to create allocation request', details: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}


/** ---------- PUT: Add new purchase and stock entry ---------- */
export async function PUT(request: Request) {
  let connection: any = null;

  try {
    console.log('🚀 PUT /api/products/allocate - Adding new product purchase');

    let body;
    try {
      const rawBody = await request.text();
      console.log('📄 Raw request body:', rawBody.substring(0, 500));
      body = JSON.parse(rawBody);
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      const res = NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON in request body',
          details: parseError instanceof Error ? parseError.message : 'Unknown parsing error'
        },
        { status: 400 }
      );
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    // Validate required fields for purchase
    const requiredFields = [
      'product_name', 'godown_id', 'company_id', 'category_id',
      'subcategory_id', 'item_id', 'quantity', 'unit_price',
      'unit_type', 'user_id'
    ];

    const missingFields = requiredFields.filter(field => !body[field]);

    if (missingFields.length > 0) {
      const res = NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          missingFields
        },
        { status: 400 }
      );
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    // Get database connection and start transaction
    const db = await getDb();
    connection = await db.getConnection();
    await connection.beginTransaction();

    // Generate purchase ID
    const purchaseId = `PURCH${Date.now().toString().slice(-10)}`;

    // Generate batch ID
    const batchId = await generateNextBatchId(connection);

    // Calculate purchase values
    const quantity = parseInt(body.quantity);
    const unitPrice = parseFloat(body.unit_price);
    const totalPrice = quantity * unitPrice;

    // Insert into ccms_purchase
    await connection.execute(`
      INSERT INTO ccms_purchase (
        CM_Product_ID,
        CM_Company_ID,
        CM_Godown_ID,
        CM_Bill_Number,
        CM_Product_Name,
        CM_Category_ID,
        CM_Subcategory_ID,
        CM_Supplier_ID,
        CM_Item_ID,
        CM_Unit_Price,
        CM_Quantity,
        CM_Unit_Type,
        CM_Total_Price,
        CM_Purchase_Date,
        CM_Status,
        CM_Is_Status,
        CM_Created_By,
        CM_Created_At
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'Delivered', 'Active', ?, NOW())
    `, [
      purchaseId,
      body.company_id,
      body.godown_id,
      body.bill_number || `INV-${Date.now().toString().slice(-8)}`,
      body.product_name,
      body.category_id,
      body.subcategory_id,
      body.supplier_id || null,
      body.item_id,
      unitPrice,
      quantity,
      body.unit_type,
      totalPrice,
      body.user_id
    ]);

    // Insert into ccms_godown_stock_batches (new batch)
    await connection.execute(`
      INSERT INTO ccms_godown_stock_batches (
        CM_Batch_ID,
        CM_Godown_ID,
        CM_Product_ID,
        CM_Item_ID,
        CM_Purchase_ID,
        CM_Quantity_Remaining,
        CM_Unit_Price,
        CM_Purchase_Date,
        CM_Created_By,
        CM_Created_At
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?, NOW())
    `, [
      batchId,
      body.godown_id,
      purchaseId,
      body.item_id,
      purchaseId,
      quantity,
      unitPrice,
      body.user_id
    ]);

    // Update or insert into ccms_godown_stock
    const [existingStock] = await connection.execute(`
      SELECT CM_Quantity 
      FROM ccms_godown_stock 
      WHERE CM_Godown_ID = ? AND CM_Item_ID = ?
    `, [body.godown_id, body.item_id]) as RowDataPacket[];

    if (existingStock && existingStock.length > 0) {
      await connection.execute(`
        UPDATE ccms_godown_stock 
        SET CM_Quantity = CM_Quantity + ?, 
            CM_Uploaded_By = ?, 
            CM_Uploaded_At = NOW() 
        WHERE CM_Godown_ID = ? AND CM_Item_ID = ?
      `, [quantity, body.user_id, body.godown_id, body.item_id]);
    } else {
      await connection.execute(`
        INSERT INTO ccms_godown_stock (
          CM_Godown_ID,
          CM_Product_ID,
          CM_Item_ID,
          CM_Quantity,
          CM_Created_By,
          CM_Created_At
        ) VALUES (?, ?, ?, ?, ?, NOW())
      `, [
        body.godown_id,
        purchaseId,
        body.item_id,
        quantity,
        body.user_id
      ]);
    }

    // Update item master stock
    await updateItemMasterStock(connection, body.item_id, quantity, 'Inward');

    // Create transaction record for inward
    const transactionId = await generateNextTransactionId(connection);

    await connection.execute(`
      INSERT INTO ccms_product_transaction (
        CM_Transaction_ID,
        CM_Company_ID,
        CM_Product_ID,
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
        CM_Created_By,
        CM_Created_At
      ) VALUES (?, ?, ?, NULL, ?, ?, 'Inward', ?, ?, ?, ?, NOW(), 'Active', ?, NOW())
    `, [
      transactionId,
      body.company_id,
      purchaseId,
      body.godown_id,
      body.item_id,
      quantity,
      body.unit_type,
      body.bill_number || `INV-${Date.now().toString().slice(-8)}`,
      `New purchase of ${body.product_name}`,
      body.user_id
    ]);

    // Commit the transaction
    await connection.commit();
    console.log('✅ Product purchase added successfully');

    const res = NextResponse.json(
      {
        success: true,
        message: 'Purchase added successfully',
        data: {
          purchase_id: purchaseId,
          batch_id: batchId,
          quantity,
          unit_price: unitPrice,
          total_price: totalPrice,
          transaction_id: transactionId
        }
      },
      { status: 201 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;

  } catch (error: any) {
    console.error('💥 Error adding product purchase:', error);

    if (connection) {
      try {
        await connection.rollback();
        console.log('🔄 Transaction rolled back');
      } catch (rollbackError) {
        console.error('❌ Rollback error:', rollbackError);
      }
    }

    const res = NextResponse.json(
      {
        success: false,
        error: 'Failed to add purchase',
        details: getErrorMessage(error)
      },
      { status: getErrorStatusCode(error) }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } finally {
    if (connection) {
      try {
        connection.release();
        console.log('🔌 Database connection released');
      } catch (releaseError) {
        console.error('❌ Connection release error:', releaseError);
      }
    }
  }
}
