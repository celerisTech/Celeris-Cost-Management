import { NextResponse } from "next/server";

// In-memory store for demo; replace with DB later
let USAGE: any[] = [];
let USAGE_SEQ = 1;

function validateUsage(body: any) {
  const errors: string[] = [];
  const required = [
    "CM_project_id",
    "CM_product_id",
    "CM_quantity",
    "CM_unit_price",
    "CM_usage_date",
    "CM_created_by",
  ];
  for (const k of required) {
    if (body[k] === undefined || body[k] === null || body[k] === "") errors.push(`${k} is required`);
  }
  if (body.CM_quantity != null && Number(body.CM_quantity) < 0) errors.push("CM_quantity must be >= 0");
  if (body.CM_unit_price != null && Number(body.CM_unit_price) < 0) errors.push("CM_unit_price must be >= 0");
  return errors;
}

export async function GET() {
  return NextResponse.json({ items: USAGE });
}

export async function POST(req: Request) {
  const data = await req.json().catch(() => ({}));
  const errors = validateUsage(data);
  if (errors.length) return NextResponse.json({ errors }, { status: 400 });

  const qty = Number(data.CM_quantity ?? 0);
  const unitPrice = Number(data.CM_unit_price ?? 0);
  const total = Number(data.CM_total_amount ?? qty * unitPrice);
  const now = new Date().toISOString();

  const item = {
    CM_usage_id: USAGE_SEQ++,
    CM_project_id: Number(data.CM_project_id),
    CM_product_id: Number(data.CM_product_id),
    CM_quantity: qty,
    CM_unit_price: unitPrice,
    CM_total_amount: total,
    CM_usage_date: String(data.CM_usage_date),
    CM_created_by: Number(data.CM_created_by),
    CM_created_at: now,
  };
  USAGE.push(item);
  const res = NextResponse.json(item, { status: 201 });
  res.headers.set('Cache-Control', 'no-store');
    return res;
}
