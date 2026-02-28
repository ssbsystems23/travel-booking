import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const getSupabase = require("@/lib/db");

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");

  if (!session || session.value !== "authenticated") {
    return NextResponse.json(
      { success: false, error: "Unauthorized." },
      { status: 401 }
    );
  }

  const { id: rawId } = await params;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) {
    return NextResponse.json(
      { success: false, error: "Invalid testimonial ID." },
      { status: 400 }
    );
  }

  try {
    const supabase = getSupabase();
    const { error } = await supabase
      .from("testimonials")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Supabase delete error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to delete testimonial." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Testimonials DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete testimonial." },
      { status: 500 }
    );
  }
}
