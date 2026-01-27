// src/app/api/products/batches/route.ts
import { NextResponse, NextRequest } from 'next/server';
import getDb from '@/app/utils/db';
import { RowDataPacket, OkPacket, ResultSetHeader } from 'mysql2';

// Define interfaces for your database tables
interface BatchRow extends RowDataPacket {
  CM_Batch_ID: string;
  CM_Godown_ID: string;
  CM_Product_ID: string;
  CM_Item_ID: string;
  CM_Quantity_Remaining: number;
  CM_Quantity_Consumed: number;
  CM_Unit_Price: number;
  CM_Purchase_Date: Date;
  CM_Project_Usage: string; // JSON string with project usage
  CM_Godown_Name?: string; // Optional because it comes from a JOIN
}

interface ProjectAllocationRow extends RowDataPacket {
  CM_Quantity: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');
    const projectId = searchParams.get('projectId');
    
    if (!itemId) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 }
      );
    }
    
    const db = await getDb();
    
    // First, get the total allocated quantity for this item in this project
    let allocatedQuantity = 0;
    if (projectId) {
      const [projectAllocation] = await db.query<ProjectAllocationRow[]>(`
        SELECT CM_Quantity
        FROM ccms_project_products
        WHERE CM_Project_ID = ? AND CM_Product_ID = ?
      `, [projectId, itemId]);
      
      if (projectAllocation && projectAllocation.length > 0) {
        allocatedQuantity = Number(projectAllocation[0].CM_Quantity) || 0;
      }
    }
    
    // Query all batches for this item
    const [batches] = await db.query<BatchRow[]>(`
      SELECT 
        b.CM_Batch_ID,
        b.CM_Godown_ID,
        g.CM_Godown_Name,
        b.CM_Quantity_Remaining,
        b.CM_Quantity_Consumed,
        b.CM_Unit_Price,
        b.CM_Purchase_Date,
        b.CM_Product_ID,
        b.CM_Project_Usage
      FROM ccms_godown_stock_batches b
      LEFT JOIN ccms_godown g ON b.CM_Godown_ID = g.CM_Godown_ID
      WHERE b.CM_Item_ID = ?
      ORDER BY b.CM_Purchase_Date ASC
    `, [itemId]);
    
    // Process batches to extract project-specific usage
    let batchesWithUsage = [];
    let batchesHaveProjectData = false;
    
    if (batches && Array.isArray(batches)) {
      for (const batch of batches) {
        // Get total consumed quantity
        const totalConsumed = Number(batch.CM_Quantity_Consumed) || 0;
        
        // Get project-specific consumption from JSON
        let projectQuantity = 0;
        try {
          if (projectId && batch.CM_Project_Usage) {
            // Parse the JSON string
            const projectUsage = typeof batch.CM_Project_Usage === 'string' 
              ? JSON.parse(batch.CM_Project_Usage) 
              : batch.CM_Project_Usage;
              
            projectQuantity = Number(projectUsage[projectId]) || 0;
            
            if (projectQuantity > 0) {
              batchesHaveProjectData = true;
            }
          }
        } catch (e) {
          // Handle JSON parsing errors
          console.log('Error parsing project usage JSON:', e);
        }
        
        batchesWithUsage.push({
          ...batch,
          used_quantity: totalConsumed,
          project_quantity: projectQuantity,
          total_value: projectQuantity * Number(batch.CM_Unit_Price || 0)
        });
      }
    }
    
    // If we don't have specific project data in the batches, estimate using FIFO
    if (projectId && !batchesHaveProjectData && allocatedQuantity > 0) {
      let remainingToAllocate = allocatedQuantity;
      
      // Sort batches by purchase date (oldest first) for FIFO allocation
      batchesWithUsage.sort((a, b) => {
        const dateA = new Date(a.CM_Purchase_Date);
        const dateB = new Date(b.CM_Purchase_Date);
        return dateA.getTime() - dateB.getTime();
      });
      
      // Apply FIFO logic to allocate quantities
      for (const batch of batchesWithUsage) {
        if (remainingToAllocate <= 0) break;
        
        // Calculate how much we can allocate from this batch
        const available = Number(batch.CM_Quantity_Remaining) || 0;
        const qtyForThisProject = Math.min(available, remainingToAllocate);
        
        batch.project_quantity = qtyForThisProject;
        batch.total_value = qtyForThisProject * Number(batch.CM_Unit_Price || 0);
        
        remainingToAllocate -= qtyForThisProject;
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        batches: batchesWithUsage,
        total_allocated: allocatedQuantity,
        has_specific_data: batchesHaveProjectData
      }
    });
    
  } catch (error: any) {
    console.error('Error fetching batch details:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch batch details',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
