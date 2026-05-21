import { NextResponse } from 'next/server';
import getDb from '@/app/utils/db';
import { RowDataPacket } from 'mysql2';

interface BillSummary extends RowDataPacket {
  CM_Purchase_Summary_ID: string;
  CM_Supplier_ID: string;
  CM_Company_ID: string;
  CM_Bill_Number: string;
  CM_Tax_Type: 'GST' | 'CGST/SGST';
  CM_Tax_Percentage: number;
  CM_Tax_Amount: number;
  CM_Payment_Terms: string;
  CM_Grand_Total: number;
  CM_Advance_Payment: number;
  CM_Balance_Payment: number;
  CM_Delivery_Location: string;
  CM_Delivery_Date: Date;
  CM_Payment_Status: 'Paid' | 'Partially Paid' | 'Unpaid';
  CM_Round_off: number;
  CM_Created_By: string;
  CM_Created_At: Date;
  CM_Uploaded_By: string;
  CM_Uploaded_At: Date;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const sortBy = searchParams.get('sortBy') || 'CM_Created_At';
    const sortOrder = searchParams.get('sortOrder') || 'DESC';
    
    const offset = (page - 1) * limit;
    
    const db = await getDb();
    
    // Build WHERE clause for filtering
    let whereConditions = [];
    let queryParams: any[] = [];
    
    if (search) {
      whereConditions.push('(CM_Bill_Number LIKE ? OR CM_Supplier_ID LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`);
    }
    
    if (status && ['Paid', 'Partially Paid', 'Unpaid'].includes(status)) {
      whereConditions.push('CM_Payment_Status = ?');
      queryParams.push(status);
    }
    
    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
    
    // Get total count for pagination
    const [countResult] = await db.query<RowDataPacket[]>(`
      SELECT COUNT(*) as total FROM ccms_purchase_summary ${whereClause}
    `, queryParams);
    
    const totalCount = countResult[0].total;
    
    // Get bills data
    const [bills] = await db.query<BillSummary[]>(`
      SELECT 
        CM_Purchase_Summary_ID,
        CM_Supplier_ID,
        CM_Company_ID,
        CM_Bill_Number,
        CM_Tax_Type,
        CM_Tax_Percentage,
        CM_Tax_Amount,
        CM_Payment_Terms,
        CM_Grand_Total,
        CM_Advance_Payment,
        CM_Balance_Payment,
        CM_Delivery_Location,
        CM_Delivery_Date,
        CM_Payment_Status,
        CM_Round_off,
        CM_Created_By,
        CM_Created_At,
        CM_Uploaded_By,
        CM_Uploaded_At
      FROM ccms_purchase_summary 
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `, [...queryParams, limit, offset]);

    // Format the response data
    const formattedBills = bills.map(bill => ({
      ...bill,
      CM_Tax_Percentage: parseFloat(bill.CM_Tax_Percentage?.toString() || '0'),
      CM_Tax_Amount: parseFloat(bill.CM_Tax_Amount?.toString() || '0'),
      CM_Grand_Total: parseFloat(bill.CM_Grand_Total?.toString() || '0'),
      CM_Advance_Payment: parseFloat(bill.CM_Advance_Payment?.toString() || '0'),
      CM_Balance_Payment: parseFloat(bill.CM_Balance_Payment?.toString() || '0'),
      CM_Round_off: parseFloat(bill.CM_Round_off?.toString() || '0')
    }));

    return NextResponse.json({
      success: true,
      data: formattedBills,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        limit,
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching bills:', error);
    return NextResponse.json({
      success: false,
      message: 'Error fetching bills',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
