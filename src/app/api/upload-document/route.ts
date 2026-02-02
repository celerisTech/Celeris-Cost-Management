import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/app/utils/db';
import path from 'path';
import { uploadToStorage, deleteFromStorage } from '@/app/utils/storage';

export async function POST(request: NextRequest) {
  const method = request.nextUrl.searchParams.get('_method');
  if (method === 'DELETE') return DELETE(request);

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string | null;
    const laborId = formData.get('laborId') as string | null;

    if (!file || !type || !laborId) {
      const response = NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
      response.headers.set('Cache-Control', 'no-store');
      return response;
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const timestamp = Date.now();
    const fileExtension = path.extname(file.name);
    const key = `uploads/labor/${type}_${laborId}_${timestamp}${fileExtension}`;

    const fileUrl = await uploadToStorage({
      key,
      body: buffer,
      contentType: (file as any).type || undefined,
    });

    const db = await getDb();
    const columnName = `CM_${type.charAt(0).toUpperCase() + type.slice(1)}_Photo`;

    await db.query(
      `UPDATE ccms_labor SET ${columnName} = ? WHERE CM_Labor_Type_ID = ?`,
      [fileUrl, laborId],
    );

    const response = NextResponse.json({
      success: true,
      fileUrl,
      message: 'File uploaded successfully',
    });
    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch (error) {
    console.error('Upload error:', error);
    const response = NextResponse.json(
      { error: 'Failed to upload file', details: (error as Error).message },
      { status: 500 },
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
        { status: 400 },
      );
      response.headers.set('Cache-Control', 'no-store');
      return response;
    }

    if (currentFileUrl) {
      await deleteFromStorage(currentFileUrl);
    }

    const db = await getDb();
    const columnName = `CM_${type.charAt(0).toUpperCase() + type.slice(1)}_Photo`;

    await db.query(
      `UPDATE ccms_labor SET ${columnName} = NULL WHERE CM_Labor_Type_ID = ?`,
      [laborId],
    );

    const response = NextResponse.json({
      success: true,
      message: 'File removed successfully',
    });
    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch (error) {
    console.error('Delete error:', error);
    const response = NextResponse.json(
      { error: 'Failed to remove file', details: (error as Error).message },
      { status: 500 },
    );
    response.headers.set('Cache-Control', 'no-store');
    return response;
  }
}
