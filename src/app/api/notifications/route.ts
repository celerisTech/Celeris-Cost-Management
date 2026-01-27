// app/api/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/app/utils/db';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

// Define TypeScript interfaces for our data
interface User {
  CM_User_ID: string;
  CM_Full_Name: string;
}

interface Notification {
  CM_Notification_ID: string;
  CM_User_ID: string;
  CM_Sender_ID: string;
  CM_Message: string;
  CM_Image: string | null;
  CM_Is_Read: number;
  CM_Notification_Date: string;
  sender_name?: string;
  recipient_name?: string;
  reply_count?: number;
  replies?: Reply[];
}

interface Reply {
  CM_Reply_ID: string;
  CM_Notification_ID: string;
  CM_Sender_ID: string;
  CM_Message: string;
  CM_Image: string | null;
  CM_Reply_Date: string;
  sender_name?: string;
}

export async function POST(request: NextRequest) {
  const method = request.nextUrl.searchParams.get("_method");
  if (method === "PUT") return PUT(request);

  try {
    const formData = await request.formData();
    const users = formData.get('users') as string;
    const message = formData.get('message') as string;
    const senderId = formData.get('senderId') as string;
    const file = formData.get('file') as File;

    console.log('Received notification data:', { users, message, senderId, file: file ? file.name : 'No file' });

    // Validate required fields
    if (!users || !message || !senderId) {
      console.error('Missing required fields:', { users, message, senderId });
      const res = NextResponse.json({
        success: false,
        error: 'Users, message, and sender ID are required.'

      }, { status: 400 });
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    // Validate users format
    const userArray = users.split(',');
    if (userArray.length === 0) {
      const res = NextResponse.json({
        success: false,
        error: 'At least one user must be selected.'

      }, { status: 400 });
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    const db = await getDb();

    let imagePath = null;

    // Handle file upload if exists
    if (file && file.size > 0) {
      try {
        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create uploads directory if it doesn't exist
        const uploadsDir = join(process.cwd(), 'public', 'uploads', 'notifications');
        await mkdir(uploadsDir, { recursive: true });

        // Generate unique filename
        const timestamp = Date.now();
        const fileExtension = file.name.split('.').pop();
        const fileName = `notification_${timestamp}.${fileExtension}`;
        imagePath = `/uploads/notifications/${fileName}`;

        // Save file
        const filePath = join(uploadsDir, fileName);
        await writeFile(filePath, buffer);

        console.log('File saved successfully:', imagePath);
      } catch (fileError) {
        console.error('Error saving file:', fileError);
        const res = NextResponse.json({
          success: false,
          error: 'Failed to upload file.'

        }, { status: 500 });
        res.headers.set('Cache-Control', 'no-store');
        return res;
      }
    }

    // First, verify that all users exist in the database
    const placeholders = userArray.map(() => '?').join(',');
    const [existingUsersResult] = await db.execute(
      `SELECT CM_User_ID, CM_Full_Name FROM ccms_users WHERE CM_User_ID IN (${placeholders})`,
      userArray
    );

    // Type cast the result to User array
    const existingUsers = existingUsersResult as User[];
    const existingUserIds = existingUsers.map((user: User) => user.CM_User_ID);
    const missingUsers = userArray.filter(userId => !existingUserIds.includes(userId));

    if (missingUsers.length > 0) {
      const res = NextResponse.json({
        success: false,
        error: `The following users do not exist: ${missingUsers.join(', ')}`
      }, { status: 400 });
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    // Insert individual notification for each user
    const notificationIds: string[] = [];

    for (const userId of userArray) {
      const notificationId = `NOTIF_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await db.execute(
        `INSERT INTO ccms_notifications 
         ( CM_User_ID, CM_Sender_ID, CM_Message, CM_Image, CM_Is_Read, CM_Notification_Date) 
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [userId, senderId, message, imagePath, 0]
      );

      notificationIds.push(notificationId);
    }

    console.log('Notifications created successfully:', notificationIds);

    const res = NextResponse.json({
      success: true,
      notificationIds,
      message: `Notification sent to ${userArray.length} user(s) successfully.`

    });
    res.headers.set('Cache-Control', 'no-store');
    return res;

  } catch (error) {
    console.error('Error creating notification:', error);
    const res = NextResponse.json({
      success: false,
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}

// GET method for fetching notifications
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type'); // 'received' or 'sent'

    console.log('Fetching notifications for:', { userId, type });

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required.' }, { status: 400 });

    }

    const db = await getDb();

    let query = '';
    let params: any[] = [userId];

    if (type === 'sent') {
      // Notifications sent by the user
      query = `
        SELECT 
          n.*,
          u.CM_Full_Name as recipient_name,
          u.CM_Email as recipient_email,
          COUNT(r.CM_Reply_ID) as reply_count
        FROM ccms_notifications n
        LEFT JOIN ccms_users u ON n.CM_User_ID = u.CM_User_ID
        LEFT JOIN ccms_notification_replies r ON n.CM_Notification_ID = r.CM_Notification_ID
        WHERE n.CM_Sender_ID = ?
        GROUP BY n.CM_Notification_ID
        ORDER BY n.CM_Notification_Date DESC
      `;
    } else {
      // Notifications received by the user
      query = `
        SELECT 
          n.*,
          u.CM_Full_Name as sender_name,
          u.CM_Email as sender_email,
          COUNT(r.CM_Reply_ID) as reply_count
        FROM ccms_notifications n
        LEFT JOIN ccms_users u ON n.CM_Sender_ID = u.CM_User_ID
        LEFT JOIN ccms_notification_replies r ON n.CM_Notification_ID = r.CM_Notification_ID
        WHERE n.CM_User_ID = ?
        GROUP BY n.CM_Notification_ID
        ORDER BY n.CM_Notification_Date DESC
      `;
    }

    const [notificationsResult] = await db.execute(query, params);

    // Type cast the result to Notification array
    const notifications = notificationsResult as Notification[];

    console.log(`Found ${notifications.length} notifications`);

    // For all notifications, fetch replies
    for (let notification of notifications) {
      const [repliesResult] = await db.execute(
        `SELECT r.*, u.CM_Full_Name as sender_name
         FROM ccms_notification_replies r
         LEFT JOIN ccms_users u ON r.CM_Sender_ID = u.CM_User_ID
         WHERE r.CM_Notification_ID = ?
         ORDER BY r.CM_Reply_Date ASC`,
        [notification.CM_Notification_ID]
      );

      // Type cast the replies result
      notification.replies = repliesResult as Reply[];
    }

    const res = NextResponse.json({
      success: true,
      notifications
    });
    res.headers.set('Cache-Control', 'no-store');
    return res;

  } catch (error) {
    console.error('Error fetching notifications:', error);
    const res = NextResponse.json({
      success: false,
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}

// PUT method for marking as read
async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { notificationId, isRead } = body;

    console.log('Marking notification as read:', { notificationId, isRead });

    if (!notificationId) {
      const res = NextResponse.json({
        success: false,
        error: 'Notification ID is required.'

      }, { status: 400 });
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    const db = await getDb();

    await db.execute(
      'UPDATE ccms_notifications SET CM_Is_Read = ? WHERE CM_Notification_ID = ?',
      [isRead ? 1 : 0, notificationId]
    );

    console.log('Notification marked as read:', notificationId);

    const res = NextResponse.json({
      success: true,
      message: 'Notification updated successfully.'

    });
    res.headers.set('Cache-Control', 'no-store');
    return res;

  } catch (error) {
    console.error('Error updating notification:', error);
    const res = NextResponse.json({
      success: false,
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}