import { NextRequest, NextResponse } from "next/server";
import getDb from "@/app/utils/db";

export async function GET(request) {
  try {
    const db = await getDb();
    const [rows] = await db.query(
      `SELECT * FROM ccms_standalone_invoices ORDER BY id DESC`
    );
    
    // Parse the JSON full_data for the frontend
    const invoices = rows.map(row => {
      let parsedData = {};
      try {
        parsedData = typeof row.full_data === 'string' ? JSON.parse(row.full_data) : (row.full_data || {});
      } catch (e) {
        console.error("Failed to parse full_data for invoice:", row.id);
      }

      return {
        id: row.id,
        clientName: row.client_name,
        salutation: row.salutation,
        companyName: row.company_name,
        phone: row.phone,
        totalCost: parseFloat(row.total_cost),
        proposalGiven: row.proposal_given,
        status: row.status,
        date: row.date,
        fullData: parsedData
      };
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error("Error fetching standalone invoices:", error);
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { id, clientName, salutation, companyName, phone, totalCost, proposalGiven, status, date, fullData } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const db = await getDb();
    
    // Use INSERT ... ON DUPLICATE KEY UPDATE to handle both create and update
    const query = `
      INSERT INTO ccms_standalone_invoices 
      (id, client_name, salutation, company_name, phone, total_cost, proposal_given, status, date, full_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      client_name = VALUES(client_name),
      salutation = VALUES(salutation),
      company_name = VALUES(company_name),
      phone = VALUES(phone),
      total_cost = VALUES(total_cost),
      proposal_given = VALUES(proposal_given),
      status = VALUES(status),
      date = VALUES(date),
      full_data = VALUES(full_data)
    `;

    const fullDataJson = typeof fullData === 'object' ? JSON.stringify(fullData) : (fullData || "{}");

    await db.query(query, [
      id,
      clientName || "",
      salutation || "Mr.",
      companyName || "",
      phone || "",
      totalCost || 0,
      proposalGiven || "No",
      status || "",
      date || "",
      fullDataJson
    ]);

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Error saving standalone invoice:", error);
    return NextResponse.json({ error: "Failed to save invoice" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const db = await getDb();
    await db.query(`DELETE FROM ccms_standalone_invoices WHERE id = ?`, [id]);

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Error deleting standalone invoice:", error);
    return NextResponse.json({ error: "Failed to delete invoice" }, { status: 500 });
  }
}
