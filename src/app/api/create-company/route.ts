// src/app/api/companies/route.ts
import getDb from '../../utils/db';
import { NextResponse, NextRequest } from 'next/server';
import formidable from "formidable";
import fsPromises from "fs/promises";
import path from "path";
import os from "os";
import { Readable } from "stream";
import { v4 as uuidv4 } from 'uuid';
import { uploadToStorage } from '@/app/utils/storage';

export const config = {
  api: {
    bodyParser: false,
  },
};

// ✅ FIXED: Updated function signature to match Web Streams API
function streamToNodeReadable(stream: ReadableStream<Uint8Array> | null) {
  if (!stream) {
    return Readable.from(Buffer.alloc(0));
  }

  const reader = stream.getReader();
  return new Readable({
    async read() {
      try {
        const { done, value } = await reader.read();
        if (done) {
          this.push(null);
        } else {
          this.push(Buffer.from(value));
        }
      } catch (error) {
        this.destroy(error as Error);
      }
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();

    const [rows] = await db.query(`
      SELECT 
        *,
        CM_Company_ID AS CM_company_id,
        CM_Company_Code AS companyCode,
        CM_Company_Name AS companyName,
        CM_Company_Logo AS companyLogo
      FROM ccms_companies
    `);

    const res = NextResponse.json(rows);
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error) {
    console.error(error);
    const res = NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}

export async function POST(request: NextRequest) {
  try {
    // ✅ FIXED: Pass the correct type
    const nodeReadable = streamToNodeReadable(request.body);

    const mockReq = Object.assign(nodeReadable, {
      headers: Object.fromEntries(request.headers.entries()),
      method: request.method,
      url: request.url,
    }) as unknown as import("http").IncomingMessage;

    const uploadDir = os.tmpdir();

    const form = formidable({
      multiples: false,
      uploadDir,
      keepExtensions: true,
      filename: (name, ext, part) => {
        const extension = path.extname(part.originalFilename || '').toLowerCase();
        return `${uuidv4()}${extension}`;
      },
      filter: ({ mimetype, originalFilename }) => {
        // Allow safe types
        const allowedMimes = [
          'image/jpeg', 'image/png', 'image/webp',
          'application/pdf', 'text/plain', 'text/csv',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel'
        ];
        const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.txt', '.csv', '.xlsx', '.xls'];

        const ext = path.extname(originalFilename || '').toLowerCase();
        return allowedMimes.includes(mimetype || '') || allowedExts.includes(ext);
      }
    });

    const { fields, files } = await new Promise<any>((resolve, reject) => {
      form.parse(mockReq, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    // Extract fields
    const getStr = (v: any) => Array.isArray(v) ? (v[0] ?? '') : (v ?? '');
    const companyCode = getStr(fields.companyCode);
    const companyName = getStr(fields.companyName);
    const companyType = getStr(fields.companyType);
    const companyPhone = getStr(fields.companyPhone);
    const address = getStr(fields.address);
    const district = getStr(fields.district);
    const state = getStr(fields.state);
    const country = getStr(fields.country);
    const postalCode = getStr(fields.postalCode);
    const gstNumber = getStr(fields.gstNumber);
    const panNumber = getStr(fields.panNumber);
    const isStatus = getStr(fields.isStatus) || 'Active';
    const companyOwner = getStr(fields.companyOwner);
    const ownerPhone = getStr(fields.ownerPhone);
    const alternatePhone = getStr(fields.alternatePhone);
    const email = getStr(fields.email);
    const createdBy = getStr(fields.createdBy) || "System";
    const uploadedBy = getStr(fields.uploadedBy) || null;

    let logoUrl: string | null = null;
    const logoFile = (files as any)?.logo;
    if (logoFile) {
      const file = Array.isArray(logoFile) ? logoFile[0] : logoFile;
      if (file?.filepath) {
        const fileBuffer = await fsPromises.readFile(file.filepath);
        const key = `uploads/companies/${path.basename(file.filepath)}`;
        logoUrl = await uploadToStorage({
          key,
          body: fileBuffer,
          contentType: file.mimetype || undefined,
        });
        try {
          await fsPromises.unlink(file.filepath);
        } catch {
          // ignore temp cleanup errors
        }
      }
    }

    const db = await getDb();

    const [result]: any = await db.query(
      `INSERT INTO ccms_companies (
        CM_Company_Code,
        CM_Company_Name,
        CM_Company_Type,
        CM_Company_Logo,
        CM_Company_Phone,
        CM_Address,
        CM_District,
        CM_State,
        CM_Country,
        CM_Postal_Code,
        CM_GST_Number,
        CM_PAN_Number,
        CM_Is_Status,
        CM_Company_Owner,
        CM_Owner_Phone,
        CM_Alternate_Phone,
        CM_Email,
        CM_Created_By,
        CM_Created_At,
        CM_Uploaded_By,
        CM_Uploaded_At
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)`,
      [
        companyCode,
        companyName,
        companyType,
        logoUrl,
        companyPhone,
        address,
        district,
        state,
        country,
        postalCode || null,
        gstNumber,
        panNumber,
        isStatus,
        companyOwner,
        ownerPhone,
        alternatePhone,
        email,
        createdBy,
        uploadedBy,
        uploadedBy ? new Date() : null,
      ]
    );

    const res = NextResponse.json({
      success: true,
      companyId: result.insertId,
    });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error) {
    console.error(error);
    const res = NextResponse.json({ error: "Failed to add company" }, { status: 500 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}