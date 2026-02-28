import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const getSupabase = require("@/lib/db");

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");

  if (!session || session.value !== "authenticated") {
    return NextResponse.json(
      { success: false, error: "Unauthorized." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const {
      bookingId, msName, billDate, driverName, carNo,
      pickupArea, pickupTime, pickupDate,
      dropArea, dropTime, dropDate,
      garageKmStart, garageKmEnd,
      startHours, endHours, totalHours,
      extraKm, extraHours, totalKm, rate,
      drivalAllowance, airportParking, toll, totalAmount,
    } = body;

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("invoices")
      .insert({
        booking_id: bookingId ?? null,
        ms_name: msName ?? "",
        bill_date: billDate ?? "",
        driver_name: driverName ?? "",
        car_no: carNo ?? "",
        pickup_area: pickupArea ?? "",
        pickup_time: pickupTime ?? "",
        pickup_date: pickupDate ?? "",
        drop_area: dropArea ?? "",
        drop_time: dropTime ?? "",
        drop_date: dropDate ?? "",
        garage_km_start: garageKmStart ?? "",
        garage_km_end: garageKmEnd ?? "",
        start_hours: startHours ?? "",
        end_hours: endHours ?? "",
        total_hours: totalHours ?? "",
        extra_km: extraKm ?? "",
        extra_hours: extraHours ?? "",
        total_km: totalKm ?? "",
        rate: rate ?? "",
        drival_allowance: drivalAllowance ?? "",
        airport_parking: airportParking ?? "",
        toll: toll ?? "",
        total_amount: totalAmount ?? "",
      })
      .select("id")
      .single();

    if (error) {
      console.error("Supabase invoice insert error:", error);
      return NextResponse.json(
        { success: false, error: `Supabase: ${error.message} (code: ${error.code}, details: ${error.details}, hint: ${error.hint})` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, invoiceId: data.id });
  } catch (error: unknown) {
    console.error("Invoice POST error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: `Server error: ${msg}` },
      { status: 500 }
    );
  }
}
