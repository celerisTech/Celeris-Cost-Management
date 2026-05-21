import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Whitelist allowed extensions
const ALLOWED_EXTENSIONS = [
    '.jpg', '.jpeg', '.png', '.webp', // Images
    '.pdf', '.doc', '.docx', // Documents
    '.xls', '.xlsx', '.csv', // Spreadsheets
    '.txt' // Text
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface SaveFileOptions {
    subDir?: string; // e.g., 'labors', 'companies'
}

/**
 * Saves a file buffer securely with validated extension and random filename.
 * @param buffer The file content buffer
 * @param originalFilename The original filename (for extension extraction)
 * @param options options for subdirectories
 * @returns Object containing the public url or throws an error
 */
export async function saveSecureFile(
    buffer: Buffer,
    originalFilename: string,
    options: SaveFileOptions = {}
): Promise<string> {
    // 1. Validate Extension
    const ext = path.extname(originalFilename).toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
        throw new Error(`Invalid file type: ${ext}. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`);
    }

    // 2. Validate Size (approximate check if buffer is full file)
    if (buffer.length > MAX_FILE_SIZE) {
        throw new Error(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`);
    }

    // 3. Generate Random Filename
    const uniqueFilename = `${uuidv4()}${ext}`;

    // 4. Determine Upload Directory
    const baseUploadDir = path.join(process.cwd(), 'public', 'uploads');
    const uploadDir = options.subDir
        ? path.join(baseUploadDir, options.subDir)
        : baseUploadDir;

    // 5. Ensure Directory Exists
    await mkdir(uploadDir, { recursive: true });

    // 6. Write File
    const filePath = path.join(uploadDir, uniqueFilename);
    await writeFile(filePath, buffer);

    // 7. Return Public URL
    const subPath = options.subDir ? `${options.subDir}/` : '';
    return `/uploads/${subPath}${uniqueFilename}`;
}

/**
 * Helper to handle Base64 uploads commonly used in this project
 */
export async function saveBase64File(
    base64String: string,
    filenamePrefix: string,
    subDir: string
): Promise<string | null> {
    if (!base64String) return null;

    const matches = base64String.match(/^data:(.+);base64,(.+)$/);
    if (!matches) {
        // If it's already a URL or invalid, return null or original (context dependent)
        return null;
    }

    const mimeType = matches[1];
    const data = matches[2];

    // Map mime to extension
    const mimeToExt: Record<string, string> = {
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/webp': '.webp',
        'application/pdf': '.pdf'
    };

    const ext = mimeToExt[mimeType];
    if (!ext) {
        throw new Error(`Unsupported Base64 file type: ${mimeType}`);
    }

    const buffer = Buffer.from(data, 'base64');

    // Reuse saveSecureFile logic
    // Pass a fake filename to trigger extension validation logic there too
    return saveSecureFile(buffer, `${filenamePrefix}${ext}`, { subDir });
}
