// app/api/notifications/replies/route.ts
import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/app/utils/db';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

// Define TypeScript interfaces
interface Reply {
  CM_Reply_ID: string;
  CM_Notification_ID: string;
  CM_Sender_ID: string;
  CM_Message: string;
  CM_Image: string | null;
  CM_Reply_Date: string;
  sender_name?: string;
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

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const notificationId = formData.get('notificationId') as string;
    const senderId = formData.get('senderId') as string;
    const message = formData.get('message') as string;
    const file = formData.get('file') as File;

    console.log('Received reply data:', { notificationId, senderId, message, file: file ? file.name : 'No file' });

    if (!notificationId || !senderId || !message) {
      const res = NextResponse.json({
        success: false,
        error: 'Notification ID, sender ID, and message are required'
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
        const uploadsDir = join(process.cwd(), 'public', 'uploads', 'replies');
        await mkdir(uploadsDir, { recursive: true });

        // Generate unique filename
        const timestamp = Date.now();
        const fileExtension = file.name.split('.').pop();
        const fileName = `reply_${timestamp}.${fileExtension}`;
        imagePath = `/uploads/replies/${fileName}`;

        // Save file
        const filePath = join(uploadsDir, fileName);
        await writeFile(filePath, buffer);

        console.log('Reply file saved successfully:', imagePath);
      } catch (fileError) {
        console.error('Error saving reply file:', fileError);
        const res = NextResponse.json({
          success: false,
          error: 'Failed to upload file'
        }, { status: 500 });
        res.headers.set('Cache-Control', 'no-store'); 
        return res;
      }
    }

    // Insert reply
    await db.execute(
      `INSERT INTO ccms_notification_replies 
       (CM_Notification_ID, CM_Sender_ID, CM_Message, CM_Image, CM_Is_Read, CM_Reply_Date) 
       VALUES ( ?, ?, ?, ?, ?, NOW())`,
      [notificationId, senderId, message, imagePath, 0]
    );

    console.log('Reply created successfully');

    // Fetch updated notification with replies
    const [notificationResult] = await db.execute(
      `SELECT n.*, 
              u_sender.CM_Full_Name as sender_name,
              u_recipient.CM_Full_Name as recipient_name,
              (SELECT COUNT(*) FROM ccms_notification_replies r WHERE r.CM_Notification_ID = n.CM_Notification_ID) as reply_count
       FROM ccms_notifications n
       LEFT JOIN ccms_users u_sender ON n.CM_Sender_ID = u_sender.CM_User_ID
       LEFT JOIN ccms_users u_recipient ON n.CM_User_ID = u_recipient.CM_User_ID
       WHERE n.CM_Notification_ID = ?`,
      [notificationId]
    );

    const [repliesResult] = await db.execute(
      `SELECT r.*, u.CM_Full_Name as sender_name
       FROM ccms_notification_replies r
       LEFT JOIN ccms_users u ON r.CM_Sender_ID = u.CM_User_ID
       WHERE r.CM_Notification_ID = ?
       ORDER BY r.CM_Reply_Date ASC`,
      [notificationId]
    );

    // Type cast the results
    const notifications = notificationResult as Notification[];
    const replies = repliesResult as Reply[];

    const updatedNotification: Notification = {
      ...notifications[0],
      replies
    };

    const res = NextResponse.json({
      success: true,
      updatedNotification
    });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error) {
    console.error('Error creating reply:', error);
    const res = NextResponse.json({
      success: false,
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}

// GET method for fetching replies (optional)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('notificationId');

    if (!notificationId) {
      const res = NextResponse.json({
        success: false,
        error: 'Notification ID is required'
      }, { status: 400 });
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    const db = await getDb();

    const [repliesResult] = await db.execute(
      `SELECT r.*, u.CM_Full_Name as sender_name
       FROM ccms_notification_replies r
       LEFT JOIN ccms_users u ON r.CM_Sender_ID = u.CM_User_ID
       WHERE r.CM_Notification_ID = ?
       ORDER BY r.CM_Reply_Date ASC`,
      [notificationId]
    );

    const replies = repliesResult as Reply[];

    const res = NextResponse.json({
      success: true,
      replies
    });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error) {
    console.error('Error fetching replies:', error);
    const res = NextResponse.json({
      success: false,
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}