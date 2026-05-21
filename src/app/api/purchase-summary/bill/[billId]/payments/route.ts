import { NextResponse } from 'next/server';
import getDb from '@/app/utils/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface PaymentData extends RowDataPacket {
  CM_Purchase_Summary_ID: string;
  CM_Bill_Number: string;
  CM_Grand_Total: number;
  CM_Advance_Payment: number;
  CM_Balance_Payment: number;
  CM_Payment_Status: 'Paid' | 'Partially Paid' | 'Unpaid';
  CM_Payment_Terms: string;
  CM_Created_At: Date;
  CM_Uploaded_At: Date;
}

export async function GET(
  request: Request,
  props: { params: Promise<{ billId: string }> }
) {
  try {
    const params = await props.params;
    const billId = params.billId;
    const db = await getDb();

    const [bills] = await db.query<PaymentData[]>(`
      SELECT 
        CM_Purchase_Summary_ID,
        CM_Bill_Number,
        CM_Grand_Total,
        CM_Advance_Payment,
        CM_Balance_Payment,
        CM_Payment_Status,
        CM_Payment_Terms,
        CM_Created_At,
        CM_Uploaded_At
      FROM ccms_purchase_summary 
      WHERE CM_Purchase_Summary_ID = ?
    `, [billId]);

    if (bills.length === 0) {
      const res = NextResponse.json({
        success: false,
        message: 'Bill not found'
      }, { status: 404 });
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    const bill = bills[0];

    // Create payment history structure
    const paymentHistory = {
      billId: bill.CM_Purchase_Summary_ID,
      billNumber: bill.CM_Bill_Number,
      totalAmount: parseFloat(bill.CM_Grand_Total?.toString() || '0'),
      paidAmount: parseFloat(bill.CM_Advance_Payment?.toString() || '0'),
      balanceAmount: parseFloat(bill.CM_Balance_Payment?.toString() || '0'),
      paymentStatus: bill.CM_Payment_Status,
      paymentTerms: bill.CM_Payment_Terms,
      payments: [
        {
          id: 1,
          amount: parseFloat(bill.CM_Advance_Payment?.toString() || '0'),
          paymentDate: bill.CM_Created_At,
          paymentMethod: 'Advance Payment',
          status: 'Completed',
          updatedAt: bill.CM_Uploaded_At
        }
      ].filter(payment => payment.amount > 0)
    };

    const res = NextResponse.json({
      success: true,
      data: paymentHistory
    });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error) {
    console.error('Error fetching payment history:', error);
    const res = NextResponse.json({
      success: false,
      message: 'Error fetching payment history',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}

export async function POST(
  request: Request,
  props: { params: Promise<{ billId: string }> }
) {
  try {
    const params = await props.params;
    const billId = params.billId;
    const data = await request.json();

    if (!data.amount || data.amount <= 0) {
      return NextResponse.json({
        success: false,
        message: 'Payment amount must be greater than 0'
      }, { status: 400 });
    }

    const db = await getDb();

    // Get current bill details
    const [bills] = await db.query<PaymentData[]>(`
      SELECT CM_Grand_Total, CM_Advance_Payment, CM_Balance_Payment 
      FROM ccms_purchase_summary 
      WHERE CM_Purchase_Summary_ID = ?
    `, [billId]);

    if (bills.length === 0) {
      const res = NextResponse.json({
        success: false,
        message: 'Bill not found'
      }, { status: 404 });
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    const bill = bills[0];
    const currentPaid = parseFloat(bill.CM_Advance_Payment?.toString() || '0');
    const grandTotal = parseFloat(bill.CM_Grand_Total?.toString() || '0');
    const paymentAmount = parseFloat(data.amount);

    const newPaidAmount = currentPaid + paymentAmount;
    const newBalanceAmount = Math.max(0, grandTotal - newPaidAmount);

    // Determine new payment status
    let newPaymentStatus = 'Unpaid';
    if (newPaidAmount >= grandTotal) {
      newPaymentStatus = 'Paid';
    } else if (newPaidAmount > 0) {
      newPaymentStatus = 'Partially Paid';
    }

    // Update the bill with new payment
    const [result] = await db.query<ResultSetHeader>(`
      UPDATE ccms_purchase_summary 
      SET 
        CM_Advance_Payment = ?,
        CM_Balance_Payment = ?,
        CM_Payment_Status = ?,
        CM_Uploaded_At = NOW()
      WHERE CM_Purchase_Summary_ID = ?
    `, [newPaidAmount, newBalanceAmount, newPaymentStatus, billId]);

    if (result.affectedRows === 0) {
      const res = NextResponse.json({
        success: false,
        message: 'Failed to update payment'
      }, { status: 500 });
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    const res = NextResponse.json({
      success: true,
      message: 'Payment recorded successfully',
      data: {
        paidAmount: newPaidAmount,
        balanceAmount: newBalanceAmount,
        paymentStatus: newPaymentStatus
      }
    });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error) {
    console.error('Error recording payment:', error);
    const res = NextResponse.json({
      success: false,
      message: 'Error recording payment',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}
