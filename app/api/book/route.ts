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

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid 10-digit Indian mobile number." },
        { status: 400 }
      );
    }

    // Validate pickup is at least 2 hours from now in IST
    const now = new Date();
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000;
    const istMs = utcMs + 5.5 * 60 * 60_000;
    const minPickupMs = istMs + 2 * 60 * 60_000;
    const pickupMs = new Date(pickupDatetime).getTime();
    if (isNaN(pickupMs) || pickupMs < minPickupMs) {
      return NextResponse.json(
        { success: false, error: "Pickup must be at least 2 hours from now (IST)." },
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
