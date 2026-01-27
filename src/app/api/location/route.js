//src\app\api\location\route.js
import { NextResponse } from "next/server";

// Mock database function (replace with your DB logic)
async function saveLocationToDB({ laborId, latitude, longitude, accuracy, timestamp }) {
  // Example: save to ccms_attendance table or a live_location table
  console.log("Saving location to DB:", { laborId, latitude, longitude, accuracy, timestamp });
  // Implement your DB insert here
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { laborId, latitude, longitude, accuracy } = body;

    if (!laborId || !latitude || !longitude) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const timestamp = new Date();

    // Save to database
    await saveLocationToDB({ laborId, latitude, longitude, accuracy, timestamp });

    return NextResponse.json({ message: "Location received", data: { laborId, latitude, longitude, accuracy, timestamp } });
  } catch (error) {
    console.error("Error in API:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}