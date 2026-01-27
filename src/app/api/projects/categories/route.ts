import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/app/utils/db';
import { RowDataPacket } from 'mysql2';

interface ProjectCategoryRow extends RowDataPacket {
  CM_product_id: number;
  CM_name: string;
  CM_project_id: number;
  category_name: string;
  subcategory_name?: string;
  CM_category_id: number;
  CM_subcategory_id?: number;
  allocated_quantity?: number;
  CM_created_at: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      const res = NextResponse.json(
        { success: false, message: 'Project ID is required' },
        { status: 400 }
      );
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    const db = await getDb();

    // Get categories from allocated products
    const [rows] = await db.execute(`
      SELECT DISTINCT
        pr.CM_Product_ID,
        pr.CM_Product_Name AS product_name,
        pr.CM_Project_ID,
        pr.CM_Created_At AS allocated_date,
        COALESCE(pr.CM_Quantity, 1) AS allocated_quantity,
        c.CM_Category_Name AS category_name,
        c.CM_Category_ID,
        sc.CM_Subcategory_Name AS subcategory_name,
        sc.CM_Subcategory_ID
      FROM ccms_project_products pr
      INNER JOIN ccms_category c ON pr.CM_Category_ID = c.CM_Category_ID
      LEFT JOIN ccms_subcategory sc ON pr.CM_Subcategory_ID = sc.CM_Subcategory_ID
      WHERE pr.CM_Project_ID = ?
      ORDER BY c.CM_Category_Name, sc.CM_Subcategory_Name, pr.CM_Created_At DESC
    `, [projectId]);

    const categories = rows as ProjectCategoryRow[];

    // Get category statistics
    const categoryStats = {
      totalProducts: categories.length,
      uniqueCategories: [...new Set(categories.map(c => c.category_name))].length,
      uniqueSubcategories: [...new Set(categories.map(c => c.subcategory_name).filter(Boolean))].length,
      totalQuantity: categories.reduce((sum, c) => sum + (c.allocated_quantity || 1), 0)
    };

    const res = NextResponse.json({
      success: true,
      data: categories,
      stats: categoryStats,
      projectId: parseInt(projectId)
    });
    res.headers.set('Cache-Control', 'no-store');
    return res;

  } catch (error) {
    console.error('Project categories fetch error:', error);
    const res = NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch project categories',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}
