import { NextResponse } from 'next/server';
import getDb from '@/app/utils/db';
import { RowDataPacket } from 'mysql2';

interface BillViewData extends RowDataPacket {
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
}

export async function GET(
  request: Request,
  props: { params: Promise<{ billId: string }> }
) {
  try {
    const params = await props.params;
    const billId = params.billId;
    const db = await getDb();
    
    const [bills] = await db.query<BillViewData[]>(`
      SELECT * FROM ccms_purchase_summary 
      WHERE CM_Purchase_Summary_ID = ?
    `, [billId]);

    if (bills.length === 0) {
      return new Response('Bill not found', { status: 404 });
    }

    const bill = bills[0];
    
    // Format values for display
    const grandTotal = parseFloat(bill.CM_Grand_Total?.toString() || '0');
    const advancePayment = parseFloat(bill.CM_Advance_Payment?.toString() || '0');
    const balancePayment = parseFloat(bill.CM_Balance_Payment?.toString() || '0');
    const taxAmount = parseFloat(bill.CM_Tax_Amount?.toString() || '0');
    const taxPercentage = parseFloat(bill.CM_Tax_Percentage?.toString() || '0');
    const roundOff = parseFloat(bill.CM_Round_off?.toString() || '0');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Purchase Bill - ${bill.CM_Bill_Number}</title>
        <style>
          body { 
            font-family: 'Arial', sans-serif; 
            margin: 0; 
            padding: 20px; 
            background-color: #f5f5f5; 
          }
          .container { 
            max-width: 800px; 
            margin: 0 auto; 
            background: white; 
            padding: 30px; 
            border-radius: 8px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 2px solid #007bff; 
            padding-bottom: 20px; 
          }
          .header h1 { 
            color: #007bff; 
            margin: 0; 
            font-size: 2.2em; 
          }
          .header h2 { 
            color: #666; 
            margin: 10px 0 0 0; 
            font-weight: normal; 
          }
          .bill-info { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 20px; 
            margin-bottom: 30px; 
          }
          .info-section { 
            background: #f8f9fa; 
            padding: 15px; 
            border-radius: 5px; 
          }
          .info-section h3 { 
            margin: 0 0 15px 0; 
            color: #007bff; 
            border-bottom: 1px solid #dee2e6; 
            padding-bottom: 5px; 
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 20px 0; 
          }
          th, td { 
            padding: 12px; 
            text-align: left; 
            border-bottom: 1px solid #dee2e6; 
          }
          th { 
            background-color: #007bff; 
            color: white; 
            font-weight: 600; 
          }
          tr:nth-child(even) { 
            background-color: #f8f9fa; 
          }
          .amount { 
            font-weight: bold; 
            color: #28a745; 
          }
          .status { 
            padding: 5px 10px; 
            border-radius: 20px; 
            font-size: 0.9em; 
            font-weight: bold; 
            text-transform: uppercase; 
          }
          .status.paid { 
            background: #d4edda; 
            color: #155724; 
          }
          .status.partially-paid { 
            background: #fff3cd; 
            color: #856404; 
          }
          .status.unpaid { 
            background: #f8d7da; 
            color: #721c24; 
          }
          .footer { 
            margin-top: 40px; 
            text-align: center; 
            color: #666; 
            border-top: 1px solid #dee2e6; 
            padding-top: 20px; 
          }
          @media print {
            body { background: white; }
            .container { box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Purchase Bill</h1>
            <h2>Bill Number: ${bill.CM_Bill_Number}</h2>
          </div>
          
          <div class="bill-info">
            <div class="info-section">
              <h3>Bill Information</h3>
              <p><strong>Bill ID:</strong> ${bill.CM_Purchase_Summary_ID}</p>
              <p><strong>Supplier ID:</strong> ${bill.CM_Supplier_ID || 'N/A'}</p>
              <p><strong>Company ID:</strong> ${bill.CM_Company_ID || 'N/A'}</p>
              <p><strong>Created By:</strong> ${bill.CM_Created_By || 'N/A'}</p>
            </div>
            
            <div class="info-section">
              <h3>Delivery Information</h3>
              <p><strong>Location:</strong> ${bill.CM_Delivery_Location || 'N/A'}</p>
              <p><strong>Date:</strong> ${bill.CM_Delivery_Date ? new Date(bill.CM_Delivery_Date).toLocaleDateString('en-IN') : 'N/A'}</p>
              <p><strong>Payment Terms:</strong> ${bill.CM_Payment_Terms || 'N/A'}</p>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Tax Type</strong></td>
                <td>${bill.CM_Tax_Type}</td>
              </tr>
              <tr>
                <td><strong>Tax Percentage</strong></td>
                <td>${taxPercentage.toFixed(2)}%</td>
              </tr>
              <tr>
                <td><strong>Tax Amount</strong></td>
                <td class="amount">₹${taxAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
              </tr>
              <tr>
                <td><strong>Round Off</strong></td>
                <td class="amount">₹${roundOff.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
              </tr>
              <tr style="background-color: #e7f3ff;">
                <td><strong>Grand Total</strong></td>
                <td class="amount" style="font-size: 1.2em;">₹${grandTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
              </tr>
              <tr>
                <td><strong>Amount Paid</strong></td>
                <td class="amount">₹${advancePayment.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
              </tr>
              <tr>
                <td><strong>Balance Amount</strong></td>
                <td class="amount">₹${balancePayment.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
              </tr>
              <tr>
                <td><strong>Payment Status</strong></td>
                <td>
                  <span class="status ${bill.CM_Payment_Status?.toLowerCase().replace(' ', '-')}">
                    ${bill.CM_Payment_Status}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
          
          <div class="footer">
            <p><strong>Created:</strong> ${new Date(bill.CM_Created_At).toLocaleString('en-IN')}</p>
            <p>Generated on ${new Date().toLocaleString('en-IN')}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const res = new Response(html, {
      headers: { 'Content-Type': 'text/html' },
    });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error) {
    console.error('Error generating bill view:', error);
    const res = new Response('Error generating bill view', { status: 500 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}
