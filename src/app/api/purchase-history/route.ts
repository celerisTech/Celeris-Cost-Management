// src/app/api/purchase-history/route.ts
import { NextResponse } from 'next/server';
import getDb from '@/app/utils/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const billNumber = searchParams.get('billNumber');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    const db = await getDb();

    let summaryQuery: string, summaryParams: string[];

    if (billNumber) {
      // If specific bill number is requested
      summaryQuery = `
        SELECT 
          ps.*,
          s.CM_Supplier_Code,
          s.CM_Company_Name,
          s.CM_Email,
          s.CM_Phone_Number,
          s.CM_GST_Number,
          s.CM_PAN_Number
        FROM 
          ccms_purchase_summary ps
        JOIN 
          ccms_suppliers s ON ps.CM_Supplier_ID = s.CM_Supplier_ID
        WHERE 
          ps.CM_Bill_Number = ?
      `;
      summaryParams = [billNumber];
    } else {
      // Default: Current month or date range if provided
      const now = new Date();
      const firstDay = fromDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = toDate || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      summaryQuery = `
        SELECT 
          ps.*,
          s.CM_Supplier_Code,
          s.CM_Company_Name,
          s.CM_Email,
          s.CM_Phone_Number,
          s.CM_GST_Number,
          s.CM_PAN_Number,
          p.CM_Product_ID,
          p.CM_Product_Name,
          p.CM_Category_ID,
          p.CM_Subcategory_ID,
          p.CM_Item_ID,
          p.CM_Unit_Price,
          p.CM_Discount_Percentage,
          p.CM_Discount_Amount,
          p.CM_Net_Price,
          p.CM_Quantity,
          u.CM_Unit_Name AS CM_Unit_Type,  
          p.CM_Total_Price,
          p.CM_Tax_Type,
          p.CM_Tax_Percentage,
          p.CM_Tax_Amount,
          p.CM_Grand_Total,
          p.CM_Purchase_Date,
          p.CM_Payment_Status
      FROM 
          ccms_purchase_summary ps
      JOIN 
          ccms_suppliers s 
          ON ps.CM_Supplier_ID = s.CM_Supplier_ID
      JOIN 
          ccms_purchase p 
          ON ps.CM_Bill_Number = p.CM_Bill_Number
      LEFT JOIN 
          ccms_unit_type u 
          ON p.CM_Unit_Type = u.CM_Unit_ID   -- ✅ Join to get name
      WHERE 
          DATE(p.CM_Purchase_Date) BETWEEN ? AND ?
      ORDER BY 
          p.CM_Purchase_Date DESC
      `;
      summaryParams = [firstDay, lastDay];
    }

    const [summaryRows] = await db.query(summaryQuery, summaryParams);

    if (!summaryRows || (summaryRows as any[]).length === 0) {
      const res = NextResponse.json(
        [],
        { status: 200 }
      );
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    // Get all bill numbers from the result if we're doing a date range search
    const billNumbers = billNumber
      ? [billNumber]
      : (summaryRows as any[]).map(row => row.CM_Bill_Number);

    // Get products from these purchases
    const productsQuery = `
        SELECT 
          p.*, 
          im.CM_Item_Code,
          u.CM_Unit_Name AS CM_Unit_Type 
      FROM 
          ccms_purchase p
      LEFT JOIN 
          ccms_item_master im 
          ON p.CM_Item_ID = im.CM_Item_ID
      LEFT JOIN 
          ccms_unit_type u 
          ON p.CM_Unit_Type = u.CM_Unit_ID 
      WHERE 
          p.CM_Bill_Number IN (?)
      ORDER BY 
          p.CM_Bill_Number, 
          p.CM_Product_ID
    `;

    const [productRows] = await db.query(productsQuery, [billNumbers]);

    // Organize data by bill number
    const purchasesByBill: any = {};

    (summaryRows as any[]).forEach(summary => {
      purchasesByBill[summary.CM_Bill_Number] = {
        summary,
        products: []
      };
    });

    (productRows as any[]).forEach(product => {
      if (purchasesByBill[product.CM_Bill_Number]) {
        purchasesByBill[product.CM_Bill_Number].products.push(product);
      }
    });

    const res = NextResponse.json(Object.values(purchasesByBill), { status: 200 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error) {
    console.error('Error fetching purchase history:', error);
    const res = NextResponse.json(
      { error: 'Failed to fetch purchase history' },
      { status: 500 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}
