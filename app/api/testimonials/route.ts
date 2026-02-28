import { NextResponse } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const getSupabase = require("@/lib/db");

export async function GET() {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("testimonials")
      .select("id, name, rating, comment, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase fetch error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch testimonials." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, testimonials: data ?? [] });
  } catch (error) {
    console.error("Testimonials GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch testimonials." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, rating, comment } = body;

    if (!name || !comment || rating === undefined) {
      return NextResponse.json(
        { success: false, error: "All fields are required." },
        { status: 400 }
      );
    }
    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: "Rating must be between 1 and 5." },
        { status: 400 }
      );
    }
    if (typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: "Name must be at least 2 characters." },
        { status: 400 }
      );
    }
    if (typeof comment !== "string" || comment.trim().length < 10) {
      return NextResponse.json(
        { success: false, error: "Comment must be at least 10 characters." },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("testimonials")
      .insert({
        name: name.trim(),
        rating,
        comment: comment.trim(),
      })
      .select("id")
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to save testimonial." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, testimonialId: data.id });
  } catch (error) {
    console.error("Testimonials POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save testimonial." },
      { status: 500 }
    );
  }
}
