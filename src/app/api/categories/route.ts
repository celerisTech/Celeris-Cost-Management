// src/app/api/categories/route.ts
import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/app/utils/db';

export async function GET(req: NextRequest) {
  try {
    const categoryId = req.nextUrl.searchParams.get('categoryId');
    const db = await getDb();

    // If categoryId is provided, fetch that specific category
    if (categoryId) {
      const [rows] = await db.execute(
        `SELECT CM_Category_ID, CM_Category_Name, CM_Category_Code 
         FROM ccms_category 
         WHERE CM_Category_ID = ?`,
        [categoryId]
      );

      if ((rows as any[]).length === 0) {
        return NextResponse.json(
          { success: false, message: 'Category not found' },
          { status: 404 }
        );
      }

      return NextResponse.json((rows as any[])[0]);
    }
    // Otherwise fetch all categories
    else {
      const [rows] = await db.execute(`
        SELECT CM_Category_ID, CM_Category_Name, CM_Category_Code
        FROM ccms_category 
        ORDER BY CM_Category_Name
      `);

      return NextResponse.json(rows);
    }
  } catch (error) {
    console.error('Categories fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Category API received body:", body);

    // Extract values from body
    const isUpdate = body.isUpdate === true;
    const CM_Category_Name = body.CM_Category_Name || '';
    const CM_Category_Code = body.CM_Category_Code || '';
    const CM_Category_ID = body.CM_Category_ID;

    // Basic validation
    if (!CM_Category_Name.trim()) {
      return NextResponse.json(
        { success: false, message: 'Category name is required' },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Handle update or insert based on the isUpdate flag
    if (isUpdate) {
      if (!CM_Category_ID) {
        return NextResponse.json(
          { success: false, message: 'Category ID is required for updates' },
          { status: 400 }
        );
      }

      // Fetch existing category including the code
      const [existingCategoryResult] = await db.execute(
        'SELECT CM_Category_Name, CM_Category_Code FROM ccms_category WHERE CM_Category_ID = ?',
        [CM_Category_ID]
      );

      const existingCategory = (existingCategoryResult as any[])[0];
      if (!existingCategory) {
        return NextResponse.json(
          { success: false, message: 'Category not found' },
          { status: 404 }
        );
      }

      // Use existing code if not provided in request
      const updatedCode = CM_Category_Code !== '' ? CM_Category_Code : existingCategory.CM_Category_Code || '';

      await db.execute(
        'UPDATE ccms_category SET CM_Category_Name = ?, CM_Category_Code = ? WHERE CM_Category_ID = ?',
        [CM_Category_Name, updatedCode, CM_Category_ID]
      );

      console.log(`Updated category ${CM_Category_ID}: Name from "${existingCategory.CM_Category_Name}" to "${CM_Category_Name}", Code from "${existingCategory.CM_Category_Code || 'none'}" to "${updatedCode}"`);

      return NextResponse.json({
        CM_Category_ID,
        CM_Category_Name,
        CM_Category_Code: updatedCode
      });
    } else {
      // Insert new category
      const [result] = await db.execute(
        'INSERT INTO ccms_category (CM_Category_Name, CM_Category_Code) VALUES (?, ?)',
        [CM_Category_Name, CM_Category_Code]
      );

      const insertId = (result as any).insertId;
      console.log(`Inserted new category with ID ${insertId}, name "${CM_Category_Name}" and code "${CM_Category_Code}"`);

      return NextResponse.json({
        CM_Category_ID: insertId,
        CM_Category_Name,
        CM_Category_Code
      });
    }
  } catch (error) {
    console.error('Category operation error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process category: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
