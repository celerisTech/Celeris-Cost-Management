// src/app/api/products/allocate/requests/route.ts
import { NextResponse, NextRequest } from 'next/server';
import getDb from '@/app/utils/db';
import { RowDataPacket } from 'mysql2';

export async function GET(request: NextRequest) {
  const searchParams = new URL(request.url).searchParams;
  const status = searchParams.get('status') || 'Pending';
  const search = searchParams.get('search') || '';
  const month = searchParams.get('month');
  const year = searchParams.get('year');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');
  let db: any = null;

  try {
    db = await getDb();

    let hasRequiredTables = false;
    try {
      const [tables] = await db.query(`
        SELECT TABLE_NAME 
        FROM information_schema.tables 
        WHERE table_schema = DATABASE()
        AND TABLE_NAME IN ('ccms_projects', 'ccms_users')
      `) as [RowDataPacket[], any];

      const existingTables = (tables || []).map((row: any) => {
        const tableName = row.TABLE_NAME || row.table_name || row.Table_Name || '';
        return typeof tableName === 'string' ? tableName.toLowerCase() : '';
      }).filter(Boolean);

      const hasProjectTable = existingTables.includes('ccms_projects');
      const hasUsersTable = existingTables.includes('ccms_users');

      hasRequiredTables = hasProjectTable && hasUsersTable;
    } catch (tableCheckError) {
      console.error('Error checking for table existence:', tableCheckError);
      hasRequiredTables = false;
    }

    if (!hasRequiredTables) {
      return getEnhancedSimpleRequests(db, status, search, month, year, limit, offset);
    }

    // Full query with all tables
    let query = `
      SELECT 
        req.CM_Request_ID,
        req.CM_Project_ID,
        req.CM_Requested_By,
        requester.CM_Full_Name AS CM_Full_Name,
        req.CM_Request_Date,
        req.CM_Status,
        req.CM_Approved_By,
        req.CM_Approval_Date,
        req.CM_Rejection_Reason,
        req.CM_Notes,
        req.CM_Created_At,
        req.CM_Updated_At,
        
        /* Add detailed item counts and calculations */
        (SELECT COUNT(*) FROM ccms_product_allocation_request_items 
         WHERE CM_Request_ID = req.CM_Request_ID) as item_count,
        
        (SELECT COUNT(*) FROM ccms_product_allocation_request_items 
         WHERE CM_Request_ID = req.CM_Request_ID AND CM_Status = 'Approved') as approved_items,
         
        (SELECT COUNT(*) FROM ccms_product_allocation_request_items 
         WHERE CM_Request_ID = req.CM_Request_ID AND CM_Status = 'Partially Approved') as partially_approved_items,
         
        (SELECT COUNT(*) FROM ccms_product_allocation_request_items 
         WHERE CM_Request_ID = req.CM_Request_ID AND CM_Pending_Quantity > 0) as pending_items,
         
        (SELECT SUM(CM_Requested_Quantity) FROM ccms_product_allocation_request_items 
         WHERE CM_Request_ID = req.CM_Request_ID) as total_requested_quantity,
         
        (SELECT SUM(CM_Approved_Quantity) FROM ccms_product_allocation_request_items 
         WHERE CM_Request_ID = req.CM_Request_ID) as total_approved_quantity,
         
        (SELECT SUM(CM_Pending_Quantity) FROM ccms_product_allocation_request_items 
         WHERE CM_Request_ID = req.CM_Request_ID) as total_pending_quantity,
         
        /* Indicator if this request has any pending items */
        (SELECT COUNT(*) > 0 FROM ccms_product_allocation_request_items 
         WHERE CM_Request_ID = req.CM_Request_ID AND CM_Pending_Quantity > 0) as CM_Has_Pending_Items,
        
        -- Project information
        p.CM_Project_Name,
        p.CM_Project_Code,
        p.CM_Project_Leader_ID as project_leader_id,
        
        -- Requester information (the actual user who made the request)
        requester.CM_User_ID as requester_id,
        requester.CM_Full_Name as requester_name,
        requester.CM_Full_Name as requester_full_name,
        requester.CM_Email as requester_email,
        requester.CM_Phone_Number as requester_phone,
        requester.CM_Role_ID as requester_role,
        
        -- Approver information
        approver.CM_User_ID as approver_id,
        approver.CM_Full_Name as approver_name,
        approver.CM_Full_Name as approver_full_name,
        approver.CM_Email as approver_email,
        approver.CM_Phone_Number as approver_phone,
        
        -- Project Leader information (always prioritized if available)
        project_leader.CM_User_ID as project_leader_user_id,
        project_leader.CM_Full_Name as project_leader_name,
        project_leader.CM_Full_Name as project_leader_full_name,
        project_leader.CM_Email as project_leader_email,
        project_leader.CM_Phone_Number as project_leader_phone,
        project_leader.CM_Role_ID as project_leader_role
      
      FROM ccms_product_allocation_requests req
      LEFT JOIN ccms_projects p ON req.CM_Project_ID = p.CM_Project_ID
      
      -- Get requester info
      LEFT JOIN ccms_users requester ON req.CM_Requested_By = requester.CM_User_ID
      
      -- Get approver info
      LEFT JOIN ccms_users approver ON req.CM_Approved_By = approver.CM_User_ID
      
      -- Get project leader info - this is prioritized
      LEFT JOIN ccms_users project_leader ON p.CM_Project_Leader_ID = project_leader.CM_User_ID 
                                       AND project_leader.CM_Is_Active = 'Active'
      
      WHERE 1=1
    `;

    const queryParams: any[] = [];

    if (status) {
      // Handle 'PartiallyApproved' as a special case
      if (status === 'PartiallyApproved') {
        query += ` AND (req.CM_Status = 'Partially Approved' OR 
                        (req.CM_Status = 'Pending' AND (SELECT COUNT(*) FROM ccms_product_allocation_request_items 
                          WHERE CM_Request_ID = req.CM_Request_ID AND CM_Pending_Quantity > 0) > 0))`;
      } else {
        query += ` AND req.CM_Status = ?`;
        queryParams.push(status);
      }
    }

    // Add search functionality
    if (search) {
      query += ` AND (p.CM_Project_Name LIKE ? OR p.CM_Project_ID LIKE ? OR requester.CM_Full_Name LIKE ? OR requester.CM_Full_Name LIKE ?)`;
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    // Add month and year filtering
    if (month && year) {
      query += ` AND YEAR(req.CM_Request_Date) = ? AND MONTH(req.CM_Request_Date) = ?`;
      queryParams.push(year, month);
    } else if (year) {
      query += ` AND YEAR(req.CM_Request_Date) = ?`;
      queryParams.push(year);
    } else if (month) {
      query += ` AND MONTH(req.CM_Request_Date) = ?`;
      queryParams.push(month);
    }

    // Add LIMIT and OFFSET as part of the query
    query += ` ORDER BY req.CM_Created_At DESC LIMIT ${limit} OFFSET ${offset}`;

    // Using query() instead of execute() and embedding limit/offset directly
    const [requests] = await db.query(query, queryParams) as [RowDataPacket[], any];

    // Process the requests to add additional information
    const processedRequests = Array.isArray(requests) ? requests.map((req: any) => {
      // Check if project has an assigned leader
      const hasProjectLeader = !!req.project_leader_user_id;

      // Determine if the requester is an engineer (role = ROL000003)
      const isRequesterEngineer = req.requester_role === 'ROL000003';

      // Engineer information - prioritize project leader if available
      const engineerInfo = {
        id: hasProjectLeader ? req.project_leader_user_id :
          (isRequesterEngineer ? req.requester_id : null),

        name: hasProjectLeader ? (req.project_leader_full_name || req.project_leader_name) :
          (isRequesterEngineer ? (req.requester_full_name || req.requester_name) : null),

        email: hasProjectLeader ? req.project_leader_email :
          (isRequesterEngineer ? req.requester_email : null),

        phone: hasProjectLeader ? req.project_leader_phone :
          (isRequesterEngineer ? req.requester_phone : null),

        role: hasProjectLeader ? req.project_leader_role :
          (isRequesterEngineer ? req.requester_role : null)
      };

      // Determine the best name to display for requested_by
      const displayRequestedBy = hasProjectLeader ?
        (req.project_leader_full_name || req.project_leader_name) :
        (req.requester_full_name || req.requester_name || req.CM_Requested_By);

      // Ensure we have a proper display status that recognizes partially approved requests
      let displayStatus = req.CM_Status;

      // If this request has pending items but is marked as 'Pending', make it 'Partially Approved'
      if (req.CM_Status === 'Pending' && req.CM_Has_Pending_Items) {
        displayStatus = 'Partially Approved';
      }

      return {
        ...req,
        CM_Status: displayStatus, // Override with display status

        // Identify if the project has an assigned leader
        has_project_leader: hasProjectLeader,

        // Identify if the requester is an engineer
        is_requester_engineer: isRequesterEngineer,

        // Engineer information prioritizing project leader
        engineer: engineerInfo,

        // Display names for UI
        requested_by_name: displayRequestedBy,
        approver_display_name: req.approver_full_name || req.approver_name || req.CM_Approved_By,

        // Formatted dates for display
        formatted_request_date: req.CM_Request_Date
          ? new Date(req.CM_Request_Date).toLocaleString()
          : 'N/A',

        formatted_approval_date: req.CM_Approval_Date
          ? new Date(req.CM_Approval_Date).toLocaleString()
          : 'N/A'
      };
    }) : [];

    // Get count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM ccms_product_allocation_requests req
      LEFT JOIN ccms_projects p ON req.CM_Project_ID = p.CM_Project_ID
      LEFT JOIN ccms_users requester ON req.CM_Requested_By = requester.CM_User_ID
      WHERE 1=1
    `;

    const countParams: any[] = [];

    if (status) {
      // Same special handling for PartiallyApproved
      if (status === 'PartiallyApproved') {
        countQuery += ` AND (req.CM_Status = 'Partially Approved' OR 
                            (req.CM_Status = 'Pending' AND (SELECT COUNT(*) FROM ccms_product_allocation_request_items 
                              WHERE CM_Request_ID = req.CM_Request_ID AND CM_Pending_Quantity > 0) > 0))`;
      } else {
        countQuery += ` AND req.CM_Status = ?`;
        countParams.push(status);
      }
    }

    // Add search to count query
    if (search) {
      countQuery += ` AND (p.CM_Project_Name LIKE ? OR p.CM_Project_ID LIKE ? OR requester.CM_Full_Name LIKE ? OR requester.CM_Full_Name LIKE ?)`;
      const searchPattern = `%${search}%`;
      countParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    // Add month and year filtering to count query
    if (month && year) {
      countQuery += ` AND YEAR(req.CM_Request_Date) = ? AND MONTH(req.CM_Request_Date) = ?`;
      countParams.push(year, month);
    } else if (year) {
      countQuery += ` AND YEAR(req.CM_Request_Date) = ?`;
      countParams.push(year);
    } else if (month) {
      countQuery += ` AND MONTH(req.CM_Request_Date) = ?`;
      countParams.push(month);
    }

    // Using query() for the count as well
    const [countResult] = await db.query(countQuery, countParams) as [RowDataPacket[], any];
    const total = countResult[0]?.total || 0;

    const res = NextResponse.json({
      success: true,
      data: {
        requests: processedRequests,
        pagination: {
          total,
          limit,
          offset,
          has_more: offset + limit < total
        }
      }
    });
    res.headers.set('Cache-Control', 'no-store');
    return res;

  } catch (error: any) {
    console.error('Error fetching allocation requests:', error);

    // If we get any error, try the simplified query
    try {
      if (db) {
        return getEnhancedSimpleRequests(db, status, search, month, year, limit, offset);
      }
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
    }

    // If all else fails, return an error
    const res = NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch allocation requests',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}

// Enhanced simplified query function with quantity information
async function getEnhancedSimpleRequests(
  db: any,
  status: string,
  search: string,
  month: string | null,
  year: string | null,
  limit: number,
  offset: number
) {
  try {
    console.log("⚠️ Using enhanced simplified request query without JOINs");

    // Build a simpler query without JOINs but with quantity information
    let query = `
      SELECT 
        req.CM_Request_ID,
        req.CM_Project_ID,
        req.CM_Requested_By,
        u.CM_Full_Name AS requester_name,
        req.CM_Request_Date,
        req.CM_Status,
        req.CM_Approved_By,
        req.CM_Approval_Date,
        req.CM_Rejection_Reason,
        req.CM_Notes,
        req.CM_Created_At,
        req.CM_Updated_At,
        
        /* Enhanced with detailed item counts and calculations */
        (SELECT COUNT(*) FROM ccms_product_allocation_request_items 
         WHERE CM_Request_ID = req.CM_Request_ID) as item_count,
        
        (SELECT COUNT(*) FROM ccms_product_allocation_request_items 
         WHERE CM_Request_ID = req.CM_Request_ID AND CM_Status = 'Approved') as approved_items,
         
        (SELECT COUNT(*) FROM ccms_product_allocation_request_items 
         WHERE CM_Request_ID = req.CM_Request_ID AND CM_Status = 'Partially Approved') as partially_approved_items,
         
        (SELECT COUNT(*) FROM ccms_product_allocation_request_items 
         WHERE CM_Request_ID = req.CM_Request_ID AND CM_Pending_Quantity > 0) as pending_items,
         
        (SELECT SUM(CM_Requested_Quantity) FROM ccms_product_allocation_request_items 
         WHERE CM_Request_ID = req.CM_Request_ID) as total_requested_quantity,
         
        (SELECT SUM(CM_Approved_Quantity) FROM ccms_product_allocation_request_items 
         WHERE CM_Request_ID = req.CM_Request_ID) as total_approved_quantity,
         
        (SELECT SUM(CM_Pending_Quantity) FROM ccms_product_allocation_request_items 
         WHERE CM_Request_ID = req.CM_Request_ID) as total_pending_quantity,
         
        /* Indicator if this request has any pending items */
        (SELECT COUNT(*) > 0 FROM ccms_product_allocation_request_items 
         WHERE CM_Request_ID = req.CM_Request_ID AND CM_Pending_Quantity > 0) as CM_Has_Pending_Items
      FROM ccms_product_allocation_requests req
      LEFT JOIN ccms_users u 
    ON req.CM_Requested_By = u.CM_User_ID 
      WHERE 1=1
    `;

    const queryParams: any[] = [];

    if (status) {
      // Handle 'PartiallyApproved' as a special case
      if (status === 'PartiallyApproved') {
        query += ` AND (req.CM_Status = 'Partially Approved' OR 
                        (req.CM_Status = 'Pending' AND (SELECT COUNT(*) FROM ccms_product_allocation_request_items 
                          WHERE CM_Request_ID = req.CM_Request_ID AND CM_Pending_Quantity > 0) > 0))`;
      } else {
        query += ` AND req.CM_Status = ?`;
        queryParams.push(status);
      }
    }

    // Add basic search functionality (project ID only in simplified version)
    if (search) {
      query += ` AND req.CM_Project_ID LIKE ?`;
      queryParams.push(`%${search}%`);
    }

    // Add month and year filtering
    if (month && year) {
      query += ` AND YEAR(req.CM_Request_Date) = ? AND MONTH(req.CM_Request_Date) = ?`;
      queryParams.push(year, month);
    } else if (year) {
      query += ` AND YEAR(req.CM_Request_Date) = ?`;
      queryParams.push(year);
    } else if (month) {
      query += ` AND MONTH(req.CM_Request_Date) = ?`;
      queryParams.push(month);
    }

    query += ` ORDER BY req.CM_Created_At DESC LIMIT ${limit} OFFSET ${offset}`;

    // Make sure we're using the right method based on the db object's available methods
    let requests = [];
    if (typeof db.query === 'function') {
      const [result] = await db.query(query, queryParams) as [RowDataPacket[], any];
      requests = result;
    } else if (typeof db.execute === 'function') {
      const [result] = await db.execute(query, queryParams) as [RowDataPacket[], any];
      requests = result;
    } else {
      throw new Error('No valid database query method available');
    }

    // Get count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM ccms_product_allocation_requests req
      WHERE 1=1
    `;

    const countParams: any[] = [];

    if (status) {
      // Same special handling for PartiallyApproved
      if (status === 'PartiallyApproved') {
        countQuery += ` AND (req.CM_Status = 'Partially Approved' OR 
                            (req.CM_Status = 'Pending' AND (SELECT COUNT(*) FROM ccms_product_allocation_request_items 
                              WHERE CM_Request_ID = req.CM_Request_ID AND CM_Pending_Quantity > 0) > 0))`;
      } else {
        countQuery += ` AND req.CM_Status = ?`;
        countParams.push(status);
      }
    }

    // Add search to count query
    if (search) {
      countQuery += ` AND req.CM_Project_ID LIKE ?`;
      countParams.push(`%${search}%`);
    }

    // Add month and year filtering to count query
    if (month && year) {
      countQuery += ` AND YEAR(req.CM_Request_Date) = ? AND MONTH(req.CM_Request_Date) = ?`;
      countParams.push(year, month);
    } else if (year) {
      countQuery += ` AND YEAR(req.CM_Request_Date) = ?`;
      countParams.push(year);
    } else if (month) {
      countQuery += ` AND MONTH(req.CM_Request_Date) = ?`;
      countParams.push(month);
    }

    // Again, handle both query methods
    let total = 0;
    if (typeof db.query === 'function') {
      const [countResult] = await db.query(countQuery, countParams) as [RowDataPacket[], any];
      total = countResult[0]?.total || 0;
    } else if (typeof db.execute === 'function') {
      const [countResult] = await db.execute(countQuery, countParams) as [RowDataPacket[], any];
      total = countResult[0]?.total || 0;
    }

    // Try to enhance the results with project and project leader info if possible
    let enhancedRequests = requests.map((req: any) => {
      // Ensure we have a proper display status that recognizes partially approved requests
      let displayStatus = req.CM_Status;

      // If this request has pending items but is marked as 'Pending', make it 'Partially Approved'
      if (req.CM_Status === 'Pending' && req.CM_Has_Pending_Items) {
        displayStatus = 'Partially Approved';
      }

      return {
        ...req,
        CM_Status: displayStatus // Override with display status
      };
    });

    try {
      if (typeof db.query === 'function') {
        // First get all project IDs from the requests
        const projectIds = requests.map((req: any) => req.CM_Project_ID).filter(Boolean);

        if (projectIds.length > 0) {
          // Get project info with project leaders
          const projectPlaceholders = projectIds.map(() => '?').join(',');
          const [projectData] = await db.query(`
            SELECT 
              p.CM_Project_ID,
              p.CM_Project_Name,
              p.CM_Project_Leader_ID,
              u.CM_User_ID as leader_id,
              u.CM_Full_Name as leader_name,
              u.CM_Full_Name as leader_full_name,
              u.CM_Email as leader_email,
              u.CM_Phone_Number as leader_phone
            FROM ccms_projects p
            LEFT JOIN ccms_users u ON p.CM_Project_Leader_ID = u.CM_User_ID
            WHERE p.CM_Project_ID IN (${projectPlaceholders})
          `, projectIds) as [RowDataPacket[], any];

          // Create a map of project ID to project data
          const projectMap = new Map();
          if (Array.isArray(projectData)) {
            projectData.forEach(proj => {
              projectMap.set(proj.CM_Project_ID, proj);
            });
          }

          // Enhance each request with project and leader data
          enhancedRequests = enhancedRequests.map((req: any) => {
            const projectInfo = projectMap.get(req.CM_Project_ID);
            const leaderInfo = projectInfo && projectInfo.leader_id ? {
              id: projectInfo.leader_id,
              name: projectInfo.leader_full_name || projectInfo.leader_name,
              email: projectInfo.leader_email,
              phone: projectInfo.leader_phone
            } : null;

            return {
              ...req,
              project_name: projectInfo ? projectInfo.CM_Project_Name : 'Unknown Project',
              engineer: leaderInfo, // Using leader as engineer
              has_project_leader: !!leaderInfo,
              requested_by_name: leaderInfo ?
                (leaderInfo.name || req.CM_Requested_By) :
                req.CM_Requested_By,
              formatted_request_date: req.CM_Request_Date
                ? new Date(req.CM_Request_Date).toLocaleString()
                : 'N/A',
              formatted_approval_date: req.CM_Approval_Date
                ? new Date(req.CM_Approval_Date).toLocaleString()
                : 'N/A'
            };
          });
        }
      }
    } catch (enhanceError) {
      console.error('Could not enhance requests with project/leader info:', enhanceError);
      // Continue with basic requests if this fails
    }

    const res = NextResponse.json({
      success: true,
      data: {
        requests: enhancedRequests || [],
        pagination: {
          total,
          limit,
          offset,
          has_more: offset + limit < total
        }
      },
      warning: "Using simplified data with limited join capabilities"
    });
    res.headers.set('Cache-Control', 'no-store');
    return res;

  } catch (error) {
    console.error('Error in simplified request fetch:', error);

    // If even the simple query fails, return a basic error
    const res = NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch allocation requests',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: 500 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}
