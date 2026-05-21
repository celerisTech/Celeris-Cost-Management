// src/app/api/estimatedCost/get/route.ts
import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/app/utils/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({
        error: 'Project ID is required'
      }, { status: 400 });
    }

    const db = await getDb();

    const [rows] = await db.query(
      `SELECT * FROM ccms_solar_estimates WHERE CM_Project_ID = ?`,
      [projectId]
    );

    if (Array.isArray(rows) && rows.length > 0) {
      const estimate = rows[0] as any;

      const parsedEstimate = {
        ...estimate,
        CM_Equipment_Items: estimate.CM_Equipment_Items
          ? typeof estimate.CM_Equipment_Items === 'string'
            ? JSON.parse(estimate.CM_Equipment_Items)
            : estimate.CM_Equipment_Items
          : [],
        CM_Labor_Items: estimate.CM_Labor_Items
          ? typeof estimate.CM_Labor_Items === 'string'
            ? JSON.parse(estimate.CM_Labor_Items)
            : estimate.CM_Labor_Items
          : [],
        CM_Other_Items: estimate.CM_Other_Items
          ? typeof estimate.CM_Other_Items === 'string'
            ? JSON.parse(estimate.CM_Other_Items)
            : estimate.CM_Other_Items
          : []
      };

      const res = NextResponse.json({
        estimate: parsedEstimate
      }, { status: 200 });
      res.headers.set('Cache-Control', 'no-store');
      return res;
    } else {
      const res = NextResponse.json({
        estimate: null
      }, { status: 200 });
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }
  } catch (error) {
    console.error('Error fetching cost estimate:', error);
    const res = NextResponse.json({
      error: 'Failed to fetch cost estimate',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}