import { NextRequest, NextResponse } from 'next/server';
import getDb from '../../../utils/db';
import { RowDataPacket } from 'mysql2';

interface GodownRow extends RowDataPacket {
  CM_Godown_ID: string;
  CM_Godown_Code: string;
  CM_Company_ID: string;
  CM_Godown_Name: string;
  CM_Location: string;
  CM_Address: string;
  CM_District: string;
  CM_State: string;
  CM_Country: string;
  CM_Postal_Code: number;
  CM_Contact_Person: string;
  CM_Phone_Number: string;
  CM_Alternate_Phone: string;
  CM_Email: string;
  CM_Is_Status: 'Active' | 'Inactive';
  CM_Created_By: string;
  CM_Created_At: Date;
  CM_Uploaded_By: string;
  CM_Uploaded_At: Date;
}

// ✅ FIXED VERSION - Using Promise for params
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params; // Await the params
  const db = await getDb();

  try {
    const [godownRows] = await db.query<GodownRow[]>(
      `SELECT * FROM ccms_godown WHERE CM_Godown_ID = ?`,
      [id]
    );

    if (!Array.isArray(godownRows) || godownRows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Godown not found' },
        { status: 404 }
      );
    }

    const godown = godownRows[0];
    const res = NextResponse.json({ success: true, data: godown });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error: any) {
    console.error('Get godown error:', error);
    const res = NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}

// ✅ FIXED VERSION - Using Promise for params
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params; // Await the params
  const db = await getDb();

  try {
    const body = await request.json();
    const {
      CM_Godown_Code,
      CM_Godown_Name,
      CM_Location,
      CM_Address,
      CM_District,
      CM_State,
      CM_Country,
      CM_Postal_Code,
      CM_Contact_Person,
      CM_Phone_Number,
      CM_Alternate_Phone,
      CM_Email,
      CM_Is_Status
    } = body;

    const [result] = await db.query(
      `UPDATE ccms_godown SET 
        CM_Godown_Code = ?,
        CM_Godown_Name = ?,
        CM_Location = ?,
        CM_Address = ?,
        CM_District = ?,
        CM_State = ?,
        CM_Country = ?,
        CM_Postal_Code = ?,
        CM_Contact_Person = ?,
        CM_Phone_Number = ?,
        CM_Alternate_Phone = ?,
        CM_Email = ?,
        CM_Is_Status = ?,
        CM_Uploaded_At = NOW()
      WHERE CM_Godown_ID = ?`,
      [
        CM_Godown_Code,
        CM_Godown_Name,
        CM_Location,
        CM_Address,
        CM_District,
        CM_State,
        CM_Country,
        CM_Postal_Code,
        CM_Contact_Person,
        CM_Phone_Number,
        CM_Alternate_Phone,
        CM_Email,
        CM_Is_Status,
        id
      ]
    );

    if ((result as any).affectedRows === 0) {
      return NextResponse.json(
        { success: false, message: 'Godown not found' },
        { status: 404 }
      );
    }

    const [updatedRows] = await db.query<GodownRow[]>(
      `SELECT * FROM ccms_godown WHERE CM_Godown_ID = ?`,
      [id]
    );

    const updatedGodown = Array.isArray(updatedRows) ? updatedRows[0] : null;

    const res = NextResponse.json({
      success: true,
      message: 'Godown updated successfully',
      data: updatedGodown
    });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error: any) {
    console.error('Update godown error:', error);
    const res = NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}