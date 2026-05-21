import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

// Simple S3-based storage helper for Vercel/serverless
// Env vars (configure in .env / Vercel):
// - STORAGE_BUCKET           (required)
// - STORAGE_REGION           (required)
// - STORAGE_PUBLIC_BASE_URL  (optional, override default S3 URL)
// - STORAGE_ENDPOINT         (optional, for S3-compatible providers)

const bucket = process.env.STORAGE_BUCKET!;
const region = process.env.STORAGE_REGION!;

if (!bucket || !region) {
  // In build/runtime logs only; calling code should still handle failures.
  console.warn(
    '[storage] STORAGE_BUCKET / STORAGE_REGION not set. File upload APIs will fail until configured.',
  );
}

const s3Client = new S3Client({
  region: region || 'ap-south-1',
  endpoint: process.env.STORAGE_ENDPOINT || undefined,
  forcePathStyle: !!process.env.STORAGE_ENDPOINT, // for MinIO / other S3-compatible
  credentials: process.env.AWS_ACCESS_KEY_ID
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      }
    : undefined,
});

function resolvePublicUrl(key: string): string {
  if (process.env.STORAGE_PUBLIC_BASE_URL) {
    const base = process.env.STORAGE_PUBLIC_BASE_URL.replace(/\/+$/, '');
    return `${base}/${key}`;
  }

  // Default S3-style public URL (bucket must allow public read or CloudFront in front)
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

export async function uploadToStorage(options: {
  key: string;
  body: Buffer | Uint8Array;
  contentType?: string;
}): Promise<string> {
  const { key, body, contentType } = options;

  if (!bucket || !region) {
    throw new Error('Storage not configured: set STORAGE_BUCKET and STORAGE_REGION');
  }

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      ACL: 'public-read',
    }),
  );

  return resolvePublicUrl(key);
}

export async function deleteFromStorage(keyOrUrl: string): Promise<void> {
  if (!bucket || !region) {
    // Nothing to do if storage not configured
    return;
  }

  // Accept either raw key (`uploads/xyz.png`) or full URL
  let key = keyOrUrl;
  try {
    const url = new URL(keyOrUrl);
    key = url.pathname.replace(/^\/+/, '');
  } catch {
    // not a URL, already a key
  }

  if (!key) return;

  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );
  } catch (err) {
    console.warn('[storage] deleteFromStorage failed:', err);
  }
}


