import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/app/utils/db';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  const method = request.nextUrl.searchParams.get("_method");
  if (method === "DELETE") return DELETE(request);

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;
    const laborId = formData.get('laborId') as string;

    if (!file || !type || !laborId) {
      const response = NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
      response.headers.set('Cache-Control', 'no-store');
      return response;
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const timestamp = Date.now();
    const fileExtension = path.extname(file.name);
    const filename = `${type}_${laborId}_${timestamp}${fileExtension}`;

    // Define upload directory (public/uploads)
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    const filepath = path.join(uploadDir, filename);

    // Ensure upload directory exists
    const fs = require('fs');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Save file
    await writeFile(filepath, buffer);

    // File URL for database
    const fileUrl = `/uploads/${filename}`;

    // Update database
    const db = await getDb();
    const columnName = `CM_${type.charAt(0).toUpperCase() + type.slice(1)}_Photo`;

    await db.query(
      `UPDATE ccms_labor SET ${columnName} = ? WHERE CM_Labor_Type_ID = ?`,
      [fileUrl, laborId]
    );

    const response = NextResponse.json({
      success: true,
      fileUrl: fileUrl,
      message: 'File uploaded successfully'
    });
    response.headers.set('Cache-Control', 'no-store');
    return response;

  } catch (error) {
    console.error('Upload error:', error);
    const response = NextResponse.json(
      { error: 'Failed to upload file', details: (error as Error).message },
      { status: 500 }
    );
    response.headers.set('Cache-Control', 'no-store');
    return response;
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { laborId, type, currentFileUrl } = await request.json();

    if (!laborId || !type) {
      const response = NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
      response.headers.set('Cache-Control', 'no-store');
      return response;
    }

    // Delete physical file if it exists
    if (currentFileUrl) {
      const filepath = path.join(process.cwd(), 'public', currentFileUrl);
      if (existsSync(filepath)) {
        await unlink(filepath);
      }
    }

    // Update database
    const db = await getDb();
    const columnName = `CM_${type.charAt(0).toUpperCase() + type.slice(1)}_Photo`;

    await db.query(
      `UPDATE ccms_labor SET ${columnName} = NULL WHERE CM_Labor_Type_ID = ?`,
      [laborId]
    );

    const response = NextResponse.json({
      success: true,
      message: 'File removed successfully'
    });
    response.headers.set('Cache-Control', 'no-store');
    return response;

  } catch (error) {
    console.error('Delete error:', error);
    const response = NextResponse.json(
      { error: 'Failed to remove file', details: (error as Error).message },
      { status: 500 }
    );
    response.headers.set('Cache-Control', 'no-store');
    return response;
  }
}
