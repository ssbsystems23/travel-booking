import { NextResponse } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const getSupabase = require("@/lib/db");

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, mobile, emailId, pickupDatetime, service, car } = body;

    if (!name || !mobile || !emailId || !pickupDatetime || !service || !car) {
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

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("bookings")
      .insert({
        name,
        mobile,
        email_id: emailId,
        pickup_datetime: pickupDatetime,
        service,
        car,
        status: "PENDING",
        notified: false,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to save booking." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      bookingId: data.id,
    });
  } catch (error) {
    console.error("Booking error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save booking." },
      { status: 500 }
    );
  }
}
