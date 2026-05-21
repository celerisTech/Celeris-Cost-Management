import { NextResponse } from 'next/server';
import getDb from '@/app/utils/db';
import { RowDataPacket } from 'mysql2';

interface BillData extends RowDataPacket {
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

export async function GET(
  request: Request,
  context: { params: Promise<{ billId: string }> }
) {
  try {
    const params = await context.params;
    const billId = decodeURIComponent(params.billId);

    console.log('=== DEBUGGING BILL SEARCH ===');
    console.log('Original billId:', params.billId);
    console.log('Decoded billId:', billId);
    console.log('Request URL:', request.url);

    const db = await getDb();

    // First, let's check what bills exist in the database
    console.log('Checking existing bills in database...');
    const [allBills] = await db.query<RowDataPacket[]>(`
      SELECT CM_Purchase_Summary_ID, CM_Bill_Number 
      FROM ccms_purchase_summary 
      LIMIT 10
    `);

    console.log('Found bills in database:');
    allBills.forEach(bill => {
      console.log(`- ID: ${bill.CM_Purchase_Summary_ID}, Bill Number: ${bill.CM_Bill_Number}`);
    });

    // Try multiple search approaches
    let bills: BillData[] = [];

    // Approach 1: Search by Bill Number (exact match)
    console.log('Trying exact match by Bill Number...');
    [bills] = await db.query<BillData[]>(`
      SELECT * FROM ccms_purchase_summary 
      WHERE CM_Bill_Number = ? 
      LIMIT 1
    `, [billId]);

    if (bills.length > 0) {
      console.log('Found by exact Bill Number match');
      const res = NextResponse.json({
        success: true,
        data: bills[0]
      });
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    // Approach 2: Search by Bill Number (case insensitive)
    console.log('Trying case-insensitive match by Bill Number...');
    [bills] = await db.query<BillData[]>(`
      SELECT * FROM ccms_purchase_summary 
      WHERE LOWER(CM_Bill_Number) = LOWER(?) 
      LIMIT 1
    `, [billId]);

    if (bills.length > 0) {
      console.log('Found by case-insensitive Bill Number match');
      const res = NextResponse.json({
        success: true,
        data: bills[0]
      });
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    // Approach 3: Search by Purchase Summary ID
    console.log('Trying match by Purchase Summary ID...');
    [bills] = await db.query<BillData[]>(`
      SELECT * FROM ccms_purchase_summary 
      WHERE CM_Purchase_Summary_ID = ? 
      LIMIT 1
    `, [billId]);

    if (bills.length > 0) {
      console.log('Found by Purchase Summary ID match');
      const res = NextResponse.json({
        success: true,
        data: bills[0]
      });
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    // Approach 4: Search by partial match (LIKE)
    console.log('Trying partial match by Bill Number...');
    [bills] = await db.query<BillData[]>(`
      SELECT * FROM ccms_purchase_summary 
      WHERE CM_Bill_Number LIKE ? 
      LIMIT 1
    `, [`%${billId}%`]);

    if (bills.length > 0) {
      console.log('Found by partial Bill Number match');
      const res = NextResponse.json({
        success: true,
        data: bills[0]
      });
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    // If no matches found
    console.log('No matches found with any approach');
    console.log('Search term was:', billId);

    const res = NextResponse.json({
      success: false,
      message: `Bill not found with identifier: ${billId}. Available bills: ${allBills.map(b => b.CM_Bill_Number).join(', ')}`
    }, { status: 404 });
    res.headers.set('Cache-Control', 'no-store');
    return res;

  } catch (error) {
    console.error('=== API ERROR ===');
    console.error('Error details:', error);
    const res = NextResponse.json({
      success: false,
      message: 'Database error occurred',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}
