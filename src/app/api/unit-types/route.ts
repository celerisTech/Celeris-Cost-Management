// src/app/api/unit-types/route.ts
import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/app/utils/db';

export async function GET() {
  let connection;
  try {
    connection = await getDb();

    const [rows] = await connection.execute(
      `SELECT 
        CM_Unit_ID,
        CM_Unit_Name,
        CM_Description,
        CM_Created_By,
        CM_Created_At,
        CM_Uploaded_By,
        CM_Uploaded_At
       FROM ccms_unit_type 
       ORDER BY CM_Unit_Name`
    );

    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    console.error('Error fetching unit types:', error);
    return NextResponse.json(
      { message: 'Error fetching unit types', error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  let connection;
  try {
    const body = await request.json();
    const { CM_Unit_Name, CM_Description, CM_Created_By, CM_Unit_ID, isUpdate } = body;

    if (!CM_Unit_Name) {
      return NextResponse.json({ message: 'Unit name is required' }, { status: 400 });
    }

    connection = await getDb();
    const now = new Date();

    // ✅ Handle Update
    if (isUpdate && CM_Unit_ID) {
      const [updateResult]: any = await connection.execute(
        `UPDATE ccms_unit_type SET 
          CM_Unit_Name = ?,
          CM_Description = ?,
          CM_Uploaded_By = ?,
          CM_Uploaded_At = ?
        WHERE CM_Unit_ID = ?`,
        [
          CM_Unit_Name,
          CM_Description || null,
          CM_Created_By || 'system',
          now,
          CM_Unit_ID
        ]
      );

      if (updateResult.affectedRows === 0) {
        return NextResponse.json({ message: 'Unit not found' }, { status: 404 });
      }

      return NextResponse.json(
        {
          CM_Unit_ID,
          CM_Unit_Name,
          CM_Description: CM_Description || null,
          CM_Uploaded_By: CM_Created_By || 'system',
          CM_Uploaded_At: now,
        },
        { status: 200 }
      );
    }

    // ✅ Handle Create
    const [existing]: any = await connection.execute(
      'SELECT CM_Unit_ID FROM ccms_unit_type WHERE CM_Unit_Name = ?',
      [CM_Unit_Name]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { message: 'Unit type with this name already exists' },
        { status: 409 }
      );
    }

    // ✅ Generate custom Unit ID (e.g., UNT000001)
    const [rows]: any = await connection.execute(
      'SELECT CM_Unit_ID FROM ccms_unit_type ORDER BY CM_Unit_ID DESC LIMIT 1'
    );


    // ✅ Insert new unit type
    await connection.execute(
      `INSERT INTO ccms_unit_type (
        CM_Unit_Name,
        CM_Description,
        CM_Created_By,
        CM_Created_At,
        CM_Uploaded_By,
        CM_Uploaded_At
      ) VALUES ( ?, ?, ?, ?, ?, ?)`,
      [
        CM_Unit_Name,
        CM_Description || null,
        CM_Created_By || 'system',
        now,
        CM_Created_By || 'system',
        now
      ]
    );

    // ✅ Return success response
    return NextResponse.json(
      {
        CM_Unit_Name,
        CM_Description: CM_Description || null,
        CM_Created_By: CM_Created_By || 'system',
        CM_Created_At: now,
        CM_Uploaded_By: CM_Created_By || 'system',
        CM_Uploaded_At: now,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error managing unit type:', error);
    return NextResponse.json(
      { message: 'Error managing unit type', error: (error as Error).message },
      { status: 500 }
    );
  }
}
