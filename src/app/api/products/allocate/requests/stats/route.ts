// src/app/api/products/allocate/requests/stats/route.ts
import { NextResponse } from 'next/server';
import getDb from '@/app/utils/db';
import { RowDataPacket } from 'mysql2';

export async function GET() {
  try {
    const db = await getDb();

    // Check if the requests table exists
    const [tableCheck] = await db.execute(`
      SELECT TABLE_NAME
      FROM information_schema.tables
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'ccms_product_allocation_requests'
    `) as RowDataPacket[];

    // If the table doesn't exist yet, return zeros
    if (!tableCheck || tableCheck.length === 0) {
      console.log("Table ccms_product_allocation_requests doesn't exist yet");
      const res = NextResponse.json({
        success: true,
        data: {
          stats: {
            pending: 0,
            approved: 0,
            rejected: 0,
            total: 0
          }
        }
      });
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    // Get counts for each status
    const [results] = await db.execute(`
      SELECT 
        CM_Status, 
        COUNT(*) as count 
      FROM 
        ccms_product_allocation_requests 
      GROUP BY 
        CM_Status
    `) as RowDataPacket[];

    // Initialize stats object
    const stats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      total: 0
    };

    // Process results
    if (results && Array.isArray(results)) {
      results.forEach(row => {
        const status = row.CM_Status?.toLowerCase() || '';
        if (status === 'pending') {
          stats.pending = parseInt(row.count);
        } else if (status === 'approved') {
          stats.approved = parseInt(row.count);
        } else if (status === 'rejected') {
          stats.rejected = parseInt(row.count);
        }
      });

      stats.total = stats.pending + stats.approved + stats.rejected;
    }

    const res = NextResponse.json({
      success: true,
      data: {
        stats
      }
    });
    res.headers.set('Cache-Control', 'no-store');
    return res;

  } catch (error: any) {
    console.error('Error fetching request stats:', error);
    const res = NextResponse.json(
      {
        error: 'Failed to fetch request statistics',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
  
}
