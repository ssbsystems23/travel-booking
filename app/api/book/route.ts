import { NextResponse } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const db = require("@/lib/db");

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, mobile, pickupDatetime, service, car } = body;

    if (!name || !mobile || !pickupDatetime || !service || !car) {
      return NextResponse.json(
        { success: false, error: "All fields are required." },
        { status: 400 }
      );
    }

    const stmt = db.prepare(`
      INSERT INTO bookings (name, mobile, pickup_datetime, service, car, status, notified)
      VALUES (?, ?, ?, ?, ?, 'PENDING', 0)
    `);

    const result = stmt.run(name, mobile, pickupDatetime, service, car);

    return NextResponse.json({
      success: true,
      bookingId: result.lastInsertRowid,
    });
  } catch (error) {
    console.error("Booking error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save booking." },
      { status: 500 }
    );
  }
}
