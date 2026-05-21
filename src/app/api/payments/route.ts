// src/app/api/payments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/app/utils/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');

    let query = `
      SELECT p.*, proj.CM_Project_Name, 
             COALESCE(se.CM_Total, proj.CM_Estimated_Cost) as Total_Estimated_Cost
      FROM ccms_customer_payment p
      LEFT JOIN ccms_projects proj ON p.CM_Project_ID = proj.CM_Project_ID
      LEFT JOIN ccms_solar_estimates se ON p.CM_Project_ID = se.CM_Project_ID
    `;

    const queryParams: any[] = [];

    // If projectId is provided, filter by it
    if (projectId) {
      query += ` WHERE p.CM_Project_ID = ?`;
      queryParams.push(projectId);
    }

    query += ` ORDER BY p.CM_Payment_Date DESC, p.CM_Upload_At DESC`;

    const [rows] = await db.query<RowDataPacket[]>(query, queryParams);

    const res = NextResponse.json(rows);
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error: any) {
    console.error('Error fetching payments:', error);
    const res = NextResponse.json(
      { message: error.message || 'Failed to fetch payments' },
      { status: 500 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();

    // Validate required fields
    const requiredFields = ['CM_Project_ID', 'CM_Payment_Date', 'CM_Paid_Amount'];
    for (const field of requiredFields) {
      if (!body[field]) {
        const res = NextResponse.json(
          { message: `Missing required field: ${field}` },
          { status: 400 }
        );
        res.headers.set('Cache-Control', 'no-store');
        return res;
      }
    }

    // Get project details and solar estimate to ensure valid project ID
    const [projectRows] = await db.query<RowDataPacket[]>(
      `SELECT p.*, 
              COALESCE(se.CM_Total, p.CM_Estimated_Cost) as Total_Estimated_Cost
       FROM ccms_projects p
       LEFT JOIN ccms_solar_estimates se ON p.CM_Project_ID = se.CM_Project_ID
       WHERE p.CM_Project_ID = ?`,
      [body.CM_Project_ID]
    );

    if (!projectRows || projectRows.length === 0) {
      const res = NextResponse.json(
        { message: 'Invalid project ID' },
        { status: 400 }
      );
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    // Use project's company ID if not provided
    if (!body.CM_Company_ID) {
      body.CM_Company_ID = projectRows[0].CM_Company_ID;
    }

    const now = new Date();

    const insertData = {
      CM_Project_ID: body.CM_Project_ID,
      CM_Company_ID: body.CM_Company_ID,
      CM_Payment_Date: body.CM_Payment_Date,
      CM_Paid_Amount: body.CM_Paid_Amount,
      CM_Payment_Method: body.CM_Payment_Method || 'Bank Transfer',
      CM_Notes: body.CM_Notes || '',
      CM_Created_At: now,
      CM_Created_By: body.CM_Created_By,
      CM_Upload_At: now,
      CM_Upload_By: body.CM_Upload_By || body.CM_Created_By,
    };

    const [result] = await db.query<ResultSetHeader>(
      'INSERT INTO ccms_customer_payment SET ?',
      insertData
    );

    if (result.affectedRows === 0) {
      throw new Error('Failed to insert payment record');
    }

    const res = NextResponse.json(
      { message: 'Payment added successfully' },
      { status: 201 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error: any) {
    console.error('Error adding payment:', error);

    // Handle duplicate key error
    if (error.code === 'ER_DUP_ENTRY') {
      const res = NextResponse.json(
        { message: 'A payment with this ID already exists' },
        { status: 409 }
      );
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    const res = NextResponse.json(
      { message: error.message || 'Failed to add payment' },
      { status: 500 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}
