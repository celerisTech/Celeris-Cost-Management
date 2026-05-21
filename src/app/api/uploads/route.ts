import { NextResponse } from 'next/server';
import { saveSecureFile } from '@/app/utils/fileUpload';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      const res = NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    try {
      const url = await saveSecureFile(buffer, file.name);

      const res = NextResponse.json({
        message: 'File uploaded successfully',
        url: url,
        filename: file.name
      });
      res.headers.set('Cache-Control', 'no-store');
      return res;

    } catch (validationError) {
      return NextResponse.json(
        { error: validationError.message },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Upload error:', error);
    const res = NextResponse.json(
      { error: `Upload failed: ${error.message}` },
      { status: 500 }
    );
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}

// This config is handled differently in Next.js App Router
export const config = {
  api: {
    bodyParser: false,
    responseLimit: '10mb',
  },
};
