// src/app/api/estimatedCost/route.ts
import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/app/utils/db';

interface EstimateItem {
  id: number;
  name: string;
  quantity?: number;
  unitCost?: number;
  position?: string;
  hours?: number;
  rate?: number;
  cost?: number;
  notes: string;
}

interface EstimateProjectDetails {
  projectName: string;
  projectCode: string;
  projectId: string;
  companyId: string;
  location: string;
  systemSize: string;
  startDate: string;
  endDate: string;
}

interface EstimateTotals {
  equipmentTotal: number;
  laborTotal: number;
  otherTotal: number;
  subtotal: number;
  total: number;
}

interface EstimateRequestBody {
  projectDetails: EstimateProjectDetails;
  equipmentItems: EstimateItem[];
  laborItems: EstimateItem[];
  otherItems: EstimateItem[];
  totals: EstimateTotals;
  CM_Project_ID: string;
  CM_Company_ID: string;
}

// GET method to fetch estimate by project ID
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

    // Fetch estimate for the project
    const [rows] = await db.query(
      `SELECT * FROM ccms_solar_estimates WHERE CM_Project_ID = ?`,
      [projectId]
    );

    if (Array.isArray(rows) && rows.length > 0) {
      const estimate = rows[0] as any;

      // Parse JSON strings if they exist
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

// POST method to create/update estimate
export async function POST(request: NextRequest) {
  const method = request.nextUrl.searchParams.get("_method");
  if (method === "PUT") return PUT(request);

  try {
    // Parse the request body
    const body: EstimateRequestBody = await request.json();

    const {
      projectDetails,
      equipmentItems,
      laborItems,
      otherItems,
      totals,
      CM_Project_ID,
      CM_Company_ID
    } = body;

    // Validate required fields with detailed error messages
    if (!CM_Project_ID) {
      return NextResponse.json({
        error: 'Project ID is required',
        debug: { providedProjectId: CM_Project_ID }
      }, { status: 400 });
    }

    if (!CM_Company_ID) {
      return NextResponse.json({
        error: 'Company ID is required',
        debug: {
          providedCompanyId: CM_Company_ID,
          projectDetails: JSON.stringify(projectDetails)
        }
      }, { status: 400 });
    }

    const db = await getDb();

    // First check if a record already exists for this project
    const [rows] = await db.query(
      `SELECT * FROM ccms_solar_estimates WHERE CM_Project_ID = ?`,
      [CM_Project_ID]
    );

    if (Array.isArray(rows) && rows.length > 0) {
      // Update existing record
      await db.query(
        `UPDATE ccms_solar_estimates SET
          CM_Company_ID = ?,
          CM_Project_Name = ?,
          CM_Location = ?,
          CM_System_Size = ?,
          CM_Equipment_Items = ?,
          CM_Labor_Items = ?,
          CM_Other_Items = ?,
          CM_Equipment_Total = ?,
          CM_Labor_Total = ?,
          CM_Other_Total = ?,
          CM_Total = ?,
          CM_Updated_At = NOW()
        WHERE CM_Project_ID = ?`,
        [
          CM_Company_ID,
          projectDetails.projectName || '',
          projectDetails.location || '',
          projectDetails.systemSize || '',
          JSON.stringify(equipmentItems),
          JSON.stringify(laborItems),
          JSON.stringify(otherItems),
          totals.equipmentTotal || 0,
          totals.laborTotal || 0,
          totals.otherTotal || 0,
          totals.total || 0,
          CM_Project_ID
        ]
      );
    } else {
      // Insert new record
      await db.query(
        `INSERT INTO ccms_solar_estimates (
          CM_Project_ID,
          CM_Company_ID,
          CM_Project_Name,
          CM_Location,
          CM_System_Size,
          CM_Equipment_Items,
          CM_Labor_Items,
          CM_Other_Items,
          CM_Equipment_Total,
          CM_Labor_Total,
          CM_Other_Total,
          CM_Total,
          CM_Created_At,
          CM_Updated_At
        ) VALUES (
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          NOW(),
          NOW()
        )`,
        [
          CM_Project_ID,
          CM_Company_ID,
          projectDetails.projectName || '',
          projectDetails.location || '',
          projectDetails.systemSize || '',
          JSON.stringify(equipmentItems),
          JSON.stringify(laborItems),
          JSON.stringify(otherItems),
          totals.equipmentTotal || 0,
          totals.laborTotal || 0,
          totals.otherTotal || 0,
          totals.total || 0
        ]
      );
    }

    // Update the project's estimated cost in the projects table
    await db.query(
      `UPDATE ccms_projects 
       SET CM_Estimated_Cost = ?, CM_Uploaded_At = NOW() 
       WHERE CM_Project_ID = ?`,
      [totals.total || 0, CM_Project_ID]
    );

    const res = NextResponse.json({
      message: 'Cost estimate saved successfully',
      estimate: {
        CM_Project_ID,
        CM_Company_ID,
        CM_Project_Name: projectDetails.projectName || '',
        CM_Location: projectDetails.location || '',
        CM_System_Size: projectDetails.systemSize || '',
        CM_Equipment_Items: equipmentItems,
        CM_Labor_Items: laborItems,
        CM_Other_Items: otherItems,
        CM_Equipment_Total: totals.equipmentTotal || 0,
        CM_Labor_Total: totals.laborTotal || 0,
        CM_Other_Total: totals.otherTotal || 0,
        CM_Total: totals.total || 0
      }
    }, { status: 200 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error) {
    console.error('Error saving cost estimate:', error);
    const res = NextResponse.json({
      error: 'Failed to save cost estimate',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
    res.headers.set('Cache-Control', 'no-store');
    return res;

  }
}

// PUT method to update estimate
async function PUT(request: NextRequest) {
  try {
    const body: EstimateRequestBody = await request.json();

    const {
      projectDetails,
      equipmentItems,
      laborItems,
      otherItems,
      totals,
      CM_Project_ID,
      CM_Company_ID
    } = body;

    if (!CM_Project_ID) {
      return NextResponse.json({
        error: 'Project ID is required'
      }, { status: 400 });
    }

    const db = await getDb();

    // Check if estimate exists
    const [rows] = await db.query(
      `SELECT * FROM ccms_solar_estimates WHERE CM_Project_ID = ?`,
      [CM_Project_ID]
    );

    if (Array.isArray(rows) && rows.length === 0) {
      return NextResponse.json({
        error: 'Estimate not found for this project'
      }, { status: 404 });
    }

    // Update the estimate
    await db.query(
      `UPDATE ccms_solar_estimates SET
        CM_Company_ID = ?,
        CM_Project_Name = ?,
        CM_Location = ?,
        CM_System_Size = ?,
        CM_Equipment_Items = ?,
        CM_Labor_Items = ?,
        CM_Other_Items = ?,
        CM_Equipment_Total = ?,
        CM_Labor_Total = ?,
        CM_Other_Total = ?,
        CM_Total = ?,
        CM_Updated_At = NOW()
      WHERE CM_Project_ID = ?`,
      [
        CM_Company_ID,
        projectDetails.projectName || '',
        projectDetails.location || '',
        projectDetails.systemSize || '',
        JSON.stringify(equipmentItems),
        JSON.stringify(laborItems),
        JSON.stringify(otherItems),
        totals.equipmentTotal || 0,
        totals.laborTotal || 0,
        totals.otherTotal || 0,
        totals.total || 0,
        CM_Project_ID
      ]
    );

    // Update the project's estimated cost
    await db.query(
      `UPDATE ccms_projects 
       SET CM_Estimated_Cost = ?, CM_Updated_At = NOW() 
       WHERE CM_Project_ID = ?`,
      [totals.total || 0, CM_Project_ID]
    );

    const res = NextResponse.json({
      message: 'Cost estimate updated successfully',
      estimate: {
        CM_Project_ID,
        CM_Company_ID,
        CM_Project_Name: projectDetails.projectName || '',
        CM_Location: projectDetails.location || '',
        CM_System_Size: projectDetails.systemSize || '',
        CM_Equipment_Items: equipmentItems,
        CM_Labor_Items: laborItems,
        CM_Other_Items: otherItems,
        CM_Equipment_Total: totals.equipmentTotal || 0,
        CM_Labor_Total: totals.laborTotal || 0,
        CM_Other_Total: totals.otherTotal || 0,
        CM_Total: totals.total || 0
      }
    }, { status: 200 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error) {
    console.error('Error updating cost estimate:', error);
    const res = NextResponse.json({
      error: 'Failed to update cost estimate',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}